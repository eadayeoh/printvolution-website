'use server';

import { z } from 'zod';
import { fileTypeFromBuffer } from 'file-type';
import { createClient } from '@/lib/supabase/server';
import { serviceClient, GIFT_BUCKETS, makeKey } from '@/lib/gifts/storage';
import { runPreviewPipeline } from '@/lib/gifts/pipeline';
import type { GiftProduct } from '@/lib/gifts/types';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_BYTES = 20 * 1024 * 1024;
// ext inferred from magic bytes; keep a short, safe mapping.
const EXT_FOR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const CropSchema = z.object({
  x: z.number(), y: z.number(), width: z.number(), height: z.number(),
}).nullable().optional();

/**
 * Customer uploads their photo + (optionally) a crop rect for photo-resize.
 * Returns a preview URL that the UI can render.
 *
 * This action:
 *   1. Writes the source to the private `gift-sources` bucket.
 *   2. Creates a gift_assets row for the source.
 *   3. Runs the preview pipeline (mode-aware) → watermarked JPG.
 *   4. Writes preview to public `gift-previews`, creates asset row.
 *   5. Returns { sourceAssetId, previewAssetId, previewUrl }.
 *
 * No cart/order side effects yet. The customer still has to confirm before
 * we add it to the cart.
 */
export async function uploadAndPreviewGift(formData: FormData): Promise<
  { ok: true; sourceAssetId: string; previewAssetId: string; previewUrl: string }
  | { ok: false; error: string }
> {
  try {
    return await uploadAndPreviewGiftInner(formData);
  } catch (e: any) {
    // Log tag only — e may embed the product slug or storage path.
    console.error('[gift upload] uncaught error');
    return { ok: false, error: 'Server error during upload' };
  }
}

async function uploadAndPreviewGiftInner(formData: FormData): Promise<
  { ok: true; sourceAssetId: string; previewAssetId: string; previewUrl: string }
  | { ok: false; error: string }
> {
  const file = formData.get('file');
  const productSlug = (formData.get('product_slug') || '').toString();
  const templateId = (formData.get('template_id') || '').toString() || null;
  const promptId = (formData.get('prompt_id') || '').toString() || null;
  const cropRaw = (formData.get('crop_rect') || '').toString();
  if (!(file instanceof File)) return { ok: false, error: 'No file' };
  if (file.size === 0) return { ok: false, error: 'Empty file' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'File too large (max 20 MB)' };
  if (!productSlug) return { ok: false, error: 'Product slug missing' };

  // Magic-byte sniff. file.type is browser-supplied and spoofable; if
  // the real bytes don't match a supported image format, reject.
  const bytesForSniff = new Uint8Array(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(bytesForSniff);
  const actualMime = detected?.mime;
  if (!actualMime || !ALLOWED_MIME.has(actualMime)) {
    return { ok: false, error: 'File is not a supported image format' };
  }

  // Load product
  const sb = createClient();
  const { data: product } = await sb
    .from('gift_products')
    .select('*')
    .eq('slug', productSlug)
    .eq('is_active', true)
    .maybeSingle();
  if (!product) return { ok: false, error: 'Product not found' };

  const cropRect = cropRaw ? CropSchema.parse(JSON.parse(cropRaw)) : null;

  // Resolve the prompt (if AI mode and a prompt_id was supplied or there is
  // exactly one active prompt for this mode).
  let prompt: { id: string; transformation_prompt: string; negative_prompt: string | null; params: Record<string, unknown> } | null = null;
  if (product.mode !== 'photo-resize') {
    if (promptId) {
      const { data } = await sb.from('gift_prompts')
        .select('id, transformation_prompt, negative_prompt, params, mode, is_active')
        .eq('id', promptId).maybeSingle();
      if (data && data.is_active && data.mode === product.mode) prompt = data as any;
    } else {
      const { data } = await sb.from('gift_prompts')
        .select('id, transformation_prompt, negative_prompt, params')
        .eq('mode', product.mode).eq('is_active', true).order('display_order').limit(1);
      if (data && data.length > 0) prompt = data[0] as any;
    }
  }

  // 1. Write source to private bucket. Use the detected MIME / ext,
  // not the client-supplied one.
  const ext = EXT_FOR_MIME[actualMime] ?? 'bin';
  const sourceKey = makeKey(`src-${productSlug}`, ext);
  const service = serviceClient();
  const bytes = bytesForSniff;
  const { error: upErr } = await service.storage
    .from(GIFT_BUCKETS.sources)
    .upload(sourceKey, bytes, { contentType: actualMime, upsert: false, cacheControl: '3600' });
  if (upErr) return { ok: false, error: 'upload failed' };

  // 2. Register source asset row
  const { data: sourceAsset, error: srcErr } = await service
    .from('gift_assets')
    .insert({
      role: 'source',
      bucket: GIFT_BUCKETS.sources,
      path: sourceKey,
      mime_type: actualMime,
      size_bytes: file.size,
    })
    .select('id')
    .single();
  if (srcErr || !sourceAsset) return { ok: false, error: 'source asset failed' };

  // 3. Run preview pipeline
  let preview;
  try {
    preview = await runPreviewPipeline({
      product: {
        ...(product as unknown as GiftProduct),
        // Override product-level fields with the resolved prompt so the
        // pipeline uses mode-level settings, not stale per-product fields.
        ai_prompt: prompt?.transformation_prompt ?? (product as any).ai_prompt ?? null,
        ai_negative_prompt: prompt?.negative_prompt ?? null,
        ai_params: (prompt?.params ?? {}) as Record<string, unknown>,
      },
      sourceBytes: bytes,
      sourceMime: file.type,
      cropRect: cropRect ?? null,
      templateId,
    });
  } catch (e: any) {
    return { ok: false, error: `preview failed: ${e.message}` };
  }

  // 4. Register preview asset
  const { data: previewAsset, error: prevErr } = await service
    .from('gift_assets')
    .insert({
      role: 'preview',
      bucket: GIFT_BUCKETS.previews,
      path: preview.previewPath,
      mime_type: 'image/jpeg',
      width_px: preview.widthPx,
      height_px: preview.heightPx,
    })
    .select('id')
    .single();
  if (prevErr || !previewAsset) return { ok: false, error: `preview asset failed: ${prevErr?.message}` };

  return {
    ok: true,
    sourceAssetId: sourceAsset.id,
    previewAssetId: previewAsset.id,
    previewUrl: preview.previewPublicUrl,
  };
}
