'use server';

import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { detectImage } from '@/lib/upload/detect-image';

const BUCKET = 'product-images';

// Admin uploads don't accept HEIC/HEIF — those are customer-gift-only
// formats and need a conversion pipeline (pipeline.ts) before a web
// browser can render them.
const ADMIN_ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
]);

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

  const detected = detectImage(bytes);
  if (!detected || !ADMIN_ALLOWED_MIMES.has(detected.mime)) {
    return { ok: false, error: 'File content is not a supported image format (JPEG, PNG, WebP, GIF, or SVG)' };
  }
  const actualMime = detected.mime;
  const actualExt = detected.ext;

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

/**
 * Browse already-uploaded images. Powers the "Pick from library" UI on
 * ImageUpload so admin doesn't have to re-upload the same artwork into
 * every product / variant / template slot. Returns most-recent first.
 */
export async function listProductImages(
  opts?: { search?: string; limit?: number }
): Promise<{
  ok: boolean;
  items?: Array<{ name: string; url: string; createdAt: string }>;
  error?: string;
}> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = createServiceClient();
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 500);
  const { data, error } = await sb.storage.from(BUCKET).list('', {
    limit,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) return { ok: false, error: 'List failed' };
  const search = opts?.search?.trim().toLowerCase() ?? '';
  const items = (data ?? [])
    .filter((f) => f.name && !f.name.endsWith('/') && !f.name.startsWith('.'))
    .filter((f) => !search || f.name.toLowerCase().includes(search))
    .map((f) => {
      const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(f.name);
      return { name: f.name, url: urlData.publicUrl, createdAt: f.created_at ?? '' };
    });
  return { ok: true, items };
}
