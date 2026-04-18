'use server';

import { fileTypeFromBuffer } from 'file-type';
import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';

const BUCKET = 'product-images';

// Magic-byte allow list. We accept SVG only via the explicit header
// sniff below because file-type doesn't detect XML-based formats.
const ALLOWED_IMAGE_MIMES = new Set<string>([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
]);

function looksLikeSvg(bytes: Uint8Array): boolean {
  // Accept first 1 KB as ASCII and check for the SVG root tag. SVGs
  // often have an XML prolog / DOCTYPE / BOM, so we search anywhere in
  // the prefix rather than requiring it at byte 0.
  const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, 1024)).toLowerCase();
  return /<svg[\s>]/.test(head);
}

/**
 * Upload an image to Supabase Storage and return its public URL.
 *
 * Security posture:
 *   1. requireAdmin() before touching the service client.
 *   2. Reject by size (20 MB) and by *magic bytes* — the browser's
 *      file.type header is advisory. Detecting the real MIME from the
 *      bytes blocks HTML / JS disguised as `image/jpeg` that a CDN
 *      could later serve with the wrong Content-Type.
 *   3. Generate the object key server-side from a timestamp + random
 *      suffix. We never concatenate the client's filename into the
 *      bucket path, so no path-traversal.
 */
export async function uploadProductImage(
  formData: FormData
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'No file' };
  if (file.size === 0) return { ok: false, error: 'Empty file' };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: 'File too large (max 20MB)' };

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Magic-byte sniff. Falls back to SVG XML detection.
  const detected = await fileTypeFromBuffer(bytes);
  const actualMime = detected?.mime ?? (looksLikeSvg(bytes) ? 'image/svg+xml' : null);
  const actualExt = detected?.ext ?? (actualMime === 'image/svg+xml' ? 'svg' : null);

  if (!actualMime || (!ALLOWED_IMAGE_MIMES.has(actualMime) && actualMime !== 'image/svg+xml')) {
    return { ok: false, error: `File content is not an image we accept` };
  }

  const prefix = (formData.get('prefix') || 'img').toString().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${actualExt}`;

  const sb = createServiceClient();
  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(filename, bytes, {
      contentType: actualMime,
      cacheControl: '3600',
      upsert: false,
    });

  if (upErr) return { ok: false, error: 'Upload failed' };

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(filename);
  return { ok: true, url: urlData.publicUrl };
}
