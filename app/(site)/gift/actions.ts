'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { serviceClient, GIFT_BUCKETS, makeKey, extFromMime } from '@/lib/gifts/storage';
import { runPreviewPipeline } from '@/lib/gifts/pipeline';
import type { GiftProduct } from '@/lib/gifts/types';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_BYTES = 20 * 1024 * 1024;

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
  const file = formData.get('file');
  const productSlug = (formData.get('product_slug') || '').toString();
  const templateId = (formData.get('template_id') || '').toString() || null;
  const cropRaw = (formData.get('crop_rect') || '').toString();
  if (!(file instanceof File)) return { ok: false, error: 'No file' };
  if (!ALLOWED_MIME.has(file.type)) return { ok: false, error: `Unsupported format: ${file.type}` };
  if (file.size === 0) return { ok: false, error: 'Empty file' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'File too large (max 20 MB)' };
  if (!productSlug) return { ok: false, error: 'Product slug missing' };

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

  // 1. Write source to private bucket
  const ext = extFromMime(file.type);
  const sourceKey = makeKey(`src-${productSlug}`, ext);
  const service = serviceClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await service.storage
    .from(GIFT_BUCKETS.sources)
    .upload(sourceKey, bytes, { contentType: file.type, upsert: false, cacheControl: '3600' });
  if (upErr) return { ok: false, error: `upload failed: ${upErr.message}` };

  // 2. Register source asset row
  const { data: sourceAsset, error: srcErr } = await service
    .from('gift_assets')
    .insert({
      role: 'source',
      bucket: GIFT_BUCKETS.sources,
      path: sourceKey,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select('id')
    .single();
  if (srcErr || !sourceAsset) return { ok: false, error: `source asset failed: ${srcErr?.message}` };

  // 3. Run preview pipeline
  let preview;
  try {
    preview = await runPreviewPipeline({
      product: product as unknown as GiftProduct,
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
