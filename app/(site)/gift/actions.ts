'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { serviceClient, GIFT_BUCKETS, makeKey, putObject } from '@/lib/gifts/storage';
import { runPreviewPipeline } from '@/lib/gifts/pipeline';
import type { GiftProduct } from '@/lib/gifts/types';
import { detectImage } from '@/lib/upload/detect-image';

/**
 * Upload ONE photo for ONE surface during Add-to-Cart (surfaces-driven
 * variants). Returns the gift_assets.id so the cart can stash it on the
 * line item. Checkout later turns that into a gift_order_item_surfaces
 * row with source_asset_id.
 *
 * Scoped narrow on purpose — no preview generation, no pipeline run,
 * no per-variant resolution. The production pipeline fans out per
 * surface at fulfilment time.
 */
export async function uploadGiftSurfacePhoto(formData: FormData): Promise<
  { ok: true; sourceAssetId: string } | { ok: false; error: string }
> {
  try {
    const file = formData.get('file');
    const productSlug = (formData.get('product_slug') || '').toString();
    const surfaceId   = (formData.get('surface_id')   || '').toString();
    if (!(file instanceof File)) return { ok: false, error: 'No file' };
    if (file.size === 0)        return { ok: false, error: 'Empty file' };
    if (file.size > 20 * 1024 * 1024) return { ok: false, error: 'File too large (max 20 MB)' };
    if (!productSlug || !surfaceId)   return { ok: false, error: 'Missing product or surface id' };

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectImage(bytes);
    const allowed = new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif']);
    if (!detected || !allowed.has(detected.mime)) {
      return { ok: false, error: 'File is not a supported image format' };
    }
    const extMap: Record<string, string> = {
      'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/heic':'heic','image/heif':'heif',
    };
    const ext = extMap[detected.mime] ?? 'bin';

    const service = serviceClient();
    const key = makeKey(`surface-${productSlug}-${surfaceId}`, ext);
    const { error: upErr } = await service.storage
      .from(GIFT_BUCKETS.sources)
      .upload(key, bytes, { contentType: detected.mime, upsert: false, cacheControl: '3600' });
    if (upErr) return { ok: false, error: 'upload failed' };

    const { data: asset, error: aErr } = await service
      .from('gift_assets')
      .insert({
        role: 'source',
        bucket: GIFT_BUCKETS.sources,
        path: key,
        mime_type: detected.mime,
        size_bytes: file.size,
      })
      .select('id').single();
    if (aErr || !asset) return { ok: false, error: 'asset row failed' };

    return { ok: true, sourceAssetId: asset.id as string };
  } catch (e: any) {
    console.error('[surface upload] uncaught error');
    return { ok: false, error: 'Server error during upload' };
  }
}

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
/**
 * Regenerate a preview for an already-uploaded source photo with a new
 * prompt / style. Used when the customer flips Line Art ↔ Realistic
 * after a first Generate — we don't want to make them re-pick the file
 * from disk just to try the other style.
 *
 * Works by reading the original source bytes out of the private
 * `gift-sources` bucket and re-running the preview pipeline. A fresh
 * gift_assets row is inserted for the new preview so each restyle lands
 * in history as its own entry.
 */
export async function restylePreviewFromSource(input: {
  product_slug: string;
  source_asset_id: string;
  prompt_id: string | null;
  variant_id?: string | null;
  shape_kind?: 'cutout' | 'rectangle' | 'template' | null;
  shape_template_id?: string | null;
}): Promise<
  { ok: true; sourceAssetId: string; previewAssetId: string; previewUrl: string }
  | { ok: false; error: string }
> {
  try {
    const productSlug = input.product_slug;
    if (!productSlug) return { ok: false, error: 'Product slug missing' };
    if (!input.source_asset_id) return { ok: false, error: 'Source asset missing' };

    const sb = createClient();
    const { data: product } = await sb
      .from('gift_products')
      .select('*')
      .eq('slug', productSlug)
      .eq('is_active', true)
      .maybeSingle();
    if (!product) return { ok: false, error: 'Product not found' };

    // photo-resize has no style picker, so regenerate is a no-op there —
    // the original preview is already the final output.
    if (product.mode === 'photo-resize') {
      return { ok: false, error: 'This product has no AI styles to regenerate' };
    }

    // Validate shape_kind against the product's shape_options config.
    const configuredShapes = Array.isArray((product as any).shape_options)
      ? ((product as any).shape_options as Array<{ kind: string; template_ids?: string[] }>)
      : [];
    const shapeKind = input.shape_kind ?? null;
    const shapeTemplateId = input.shape_template_id ?? null;
    if (configuredShapes.length > 0 && shapeKind) {
      const row = configuredShapes.find((r) => r.kind === shapeKind);
      if (!row) return { ok: false, error: `Shape "${shapeKind}" is not enabled on this product.` };
      if (shapeKind === 'template') {
        if (!shapeTemplateId || !Array.isArray(row.template_ids) || !row.template_ids.includes(shapeTemplateId)) {
          return { ok: false, error: 'Picked template is not allowed for this product.' };
        }
      }
    }

    const service = serviceClient();
    const { data: sourceAsset } = await service
      .from('gift_assets')
      .select('id, bucket, path, mime_type')
      .eq('id', input.source_asset_id)
      .eq('role', 'source')
      .maybeSingle();
    if (!sourceAsset) return { ok: false, error: 'Source asset not found' };

    // Download the original bytes so the pipeline can re-run against
    // the same photo the customer already uploaded.
    const { data: blob, error: dlErr } = await service
      .storage.from(sourceAsset.bucket)
      .download(sourceAsset.path);
    if (dlErr || !blob) return { ok: false, error: 'Source bytes not readable' };
    const bytes = new Uint8Array(await blob.arrayBuffer());

    // Prompt + variant-dims queries are independent — fetch in parallel.
    type PromptRow = {
      id: string;
      transformation_prompt: string;
      negative_prompt: string | null;
      params: Record<string, unknown>;
      pipeline_id: string | null;
    };
    const promptQuery: Promise<PromptRow | null> = (async () => {
      if (input.prompt_id) {
        const { data } = await sb.from('gift_prompts')
          .select('id, transformation_prompt, negative_prompt, params, mode, is_active, pipeline_id')
          .eq('id', input.prompt_id).maybeSingle();
        const allowedModes = [product.mode, product.secondary_mode].filter(Boolean);
        if (data && data.is_active && allowedModes.includes(data.mode)) return data as any;
        return null;
      }
      const { data } = await sb.from('gift_prompts')
        .select('id, transformation_prompt, negative_prompt, params, pipeline_id')
        .eq('mode', product.mode).eq('is_active', true).order('display_order').limit(1);
      return data?.[0] as any ?? null;
    })();
    const variantDimsQuery: Promise<{ width_mm: number; height_mm: number } | null> = input.variant_id
      ? (async () => {
          const { data: v } = await sb
            .from('gift_product_variants')
            .select('width_mm, height_mm, variant_kind, is_active, gift_product_id')
            .eq('id', input.variant_id)
            .maybeSingle();
          if (
            v && v.is_active
            && v.gift_product_id === product.id
            && v.variant_kind === 'size'
            && v.width_mm && v.height_mm
          ) {
            return { width_mm: Number(v.width_mm), height_mm: Number(v.height_mm) };
          }
          return null;
        })()
      : Promise.resolve(null);
    const [prompt, variantDims] = await Promise.all([promptQuery, variantDimsQuery]);

    let preview;
    try {
      preview = await runPreviewPipeline({
        product: {
          ...(product as unknown as GiftProduct),
          ai_prompt: prompt?.transformation_prompt ?? (product as any).ai_prompt ?? null,
          ai_negative_prompt: prompt?.negative_prompt ?? null,
          ai_params: (prompt?.params ?? {}) as Record<string, unknown>,
          pipeline_id: prompt?.pipeline_id ?? (product as any).pipeline_id ?? null,
          ...(variantDims ? { width_mm: variantDims.width_mm, height_mm: variantDims.height_mm } : {}),
        },
        sourceBytes: bytes,
        sourceMime: sourceAsset.mime_type ?? 'image/jpeg',
        cropRect: null,
        templateId: shapeKind === 'template' ? shapeTemplateId : null,
        shapeKind,
      });
    } catch (e: any) {
      return { ok: false, error: `preview failed: ${e.message}` };
    }

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
  } catch (e: any) {
    console.error('[gift restyle] uncaught error');
    return { ok: false, error: 'Server error during restyle' };
  }
}

/**
 * Upload a client-captured composite screenshot (the fully-arranged
 * live preview: mockup + positioned photo + text overlay) so it can
 * appear as the cart-line thumbnail. The upload is trusted by shape
 * only — MIME must be a PNG, size must be under a sensible cap.
 * Returns the public URL of the saved image.
 */
export async function uploadGiftCartSnapshot(formData: FormData): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  try {
    const file = formData.get('file');
    const productSlug = (formData.get('product_slug') || '').toString();
    if (!(file instanceof File)) return { ok: false, error: 'No file' };
    if (file.size === 0) return { ok: false, error: 'Empty file' };
    if (file.size > 8 * 1024 * 1024) return { ok: false, error: 'Snapshot too large (max 8 MB)' };
    if (!productSlug) return { ok: false, error: 'Product slug missing' };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectImage(bytes);
    if (!detected || detected.mime !== 'image/png') {
      return { ok: false, error: 'Expected a PNG snapshot' };
    }
    const key = makeKey(`cart-${productSlug}`, 'png');
    const { publicUrl } = await putObject(GIFT_BUCKETS.previews, key, bytes, 'image/png');
    if (!publicUrl) return { ok: false, error: 'No public URL available' };
    return { ok: true, url: publicUrl };
  } catch (e: any) {
    console.error('[gift cart-snapshot] uncaught error');
    return { ok: false, error: 'Server error during snapshot upload' };
  }
}

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
  const variantId = (formData.get('variant_id') || '').toString() || null;
  const cropRaw = (formData.get('crop_rect') || '').toString();
  const shapeKindRaw = (formData.get('shape_kind') || '').toString() || null;
  const shapeTemplateId = (formData.get('shape_template_id') || '').toString() || null;
  const shapeKind: 'cutout' | 'rectangle' | 'template' | null =
    shapeKindRaw === 'cutout' || shapeKindRaw === 'rectangle' || shapeKindRaw === 'template'
      ? shapeKindRaw
      : null;
  // Customer-picked foreground tint colour. Strict #RRGGBB; anything
  // else falls through to "no tint" so a hand-crafted POST can't
  // inject CSS-like values into the rendered output.
  const foregroundColorRaw = (formData.get('foreground_color') || '').toString().trim();
  const foregroundColor = /^#[0-9A-Fa-f]{6}$/.test(foregroundColorRaw) ? foregroundColorRaw : null;
  const backgroundColorRaw = (formData.get('background_color') || '').toString().trim();
  const backgroundColor = /^#[0-9A-Fa-f]{6}$/.test(backgroundColorRaw) ? backgroundColorRaw : null;
  if (!(file instanceof File)) return { ok: false, error: 'No file' };
  if (file.size === 0) return { ok: false, error: 'Empty file' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'File too large (max 20 MB)' };
  if (!productSlug) return { ok: false, error: 'Product slug missing' };

  // Multi-slot: pull any per-zone files + texts out of the form. Keys
  // are 'file_<zone_id>' and 'text_<zone_id>'. Empty/invalid files are
  // skipped. Texts pass through as-is (sanitised downstream via SVG
  // escape in the composite renderer).
  const zoneFilesBytes: Record<string, Uint8Array> = {};
  const zoneFileMetas: Record<string, { mime: string; size: number; key?: string }> = {};
  const zoneTexts: Record<string, string> = {};
  const zoneTextColors: Record<string, string> = {};
  const zoneCalendars: Record<string, { month: number; year: number; highlightedDay: number | null }> = {};
  const zoneCalendarColors: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith('file_') && v instanceof File && v.size > 0 && v.size <= MAX_BYTES) {
      const zoneId = k.slice('file_'.length);
      const b = new Uint8Array(await v.arrayBuffer());
      const det = detectImage(b);
      if (det?.mime && ALLOWED_MIME.has(det.mime)) {
        zoneFilesBytes[zoneId] = b;
        zoneFileMetas[zoneId] = { mime: det.mime, size: v.size };
      }
    } else if (k.startsWith('text_color_') && typeof v === 'string') {
      // Strict #RRGGBB only — anything else falls through to z.color.
      const c = v.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(c)) {
        zoneTextColors[k.slice('text_color_'.length)] = c;
      }
    } else if (k.startsWith('text_') && typeof v === 'string') {
      zoneTexts[k.slice('text_'.length)] = v.slice(0, 500); // hard cap
    } else if (k.startsWith('calendar_color_') && typeof v === 'string') {
      const c = v.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(c)) {
        zoneCalendarColors[k.slice('calendar_color_'.length)] = c;
      }
    } else if (k.startsWith('calendar_') && typeof v === 'string') {
      // Customer-supplied JSON. Parse defensively + range-clamp every
      // field so a hand-crafted POST can't render bogus calendars
      // (year=99999, month=0, etc.) into the production composite.
      try {
        const parsed = JSON.parse(v);
        const month = Number(parsed?.month);
        const year = Number(parsed?.year);
        const day = parsed?.highlightedDay;
        if (Number.isFinite(month) && Number.isFinite(year)) {
          zoneCalendars[k.slice('calendar_'.length)] = {
            month: Math.min(12, Math.max(1, Math.round(month))),
            year: Math.min(2100, Math.max(1900, Math.round(year))),
            highlightedDay:
              day === null || day === undefined
                ? null
                : Math.min(31, Math.max(1, Math.round(Number(day)))),
          };
        }
      } catch { /* ignore malformed */ }
    }
  }

  // Magic-byte sniff. file.type is browser-supplied and spoofable; if
  // the real bytes don't match a supported image format, reject.
  const bytesForSniff = new Uint8Array(await file.arrayBuffer());
  const detected = detectImage(bytesForSniff);
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

  // Resolve the variant (if any) so size variants can override the
  // product's print dimensions. Only trusted when active + belonging
  // to this product.
  let variantDims: { width_mm: number; height_mm: number } | null = null;
  if (variantId) {
    const { data: v } = await sb
      .from('gift_product_variants')
      .select('width_mm, height_mm, variant_kind, is_active, gift_product_id')
      .eq('id', variantId)
      .maybeSingle();
    if (
      v && v.is_active
      && v.gift_product_id === product.id
      && v.variant_kind === 'size'
      && v.width_mm && v.height_mm
    ) {
      variantDims = { width_mm: Number(v.width_mm), height_mm: Number(v.height_mm) };
    }
  }

  // Resolve the prompt (if AI mode and a prompt_id was supplied or there is
  // exactly one active prompt for this mode). The prompt can carry its
  // own `pipeline_id` — that takes priority over the product's default,
  // because styles (e.g. "3D Cartoon" vs "Pass-through") use different
  // providers + models and the choice happens at customer-pick time.
  let prompt: { id: string; transformation_prompt: string; negative_prompt: string | null; params: Record<string, unknown>; pipeline_id: string | null } | null = null;
  if (product.mode !== 'photo-resize') {
    if (promptId) {
      const { data } = await sb.from('gift_prompts')
        .select('id, transformation_prompt, negative_prompt, params, mode, is_active, pipeline_id')
        .eq('id', promptId).maybeSingle();
      // Allow the prompt's mode to match either the product's primary
      // OR secondary mode — so a dual-mode product (e.g. uv + laser)
      // can offer BOTH methods' prompts in the art-style picker.
      const allowedPromptModes = [product.mode, product.secondary_mode].filter(Boolean);
      if (data && data.is_active && allowedPromptModes.includes(data.mode)) prompt = data as any;
    } else {
      const { data } = await sb.from('gift_prompts')
        .select('id, transformation_prompt, negative_prompt, params, pipeline_id')
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

  // Multi-slot: persist every per-zone source under its own storage key
  // so admin can purge them independently. Gracefully skip on failure —
  // the primary file above still drives a valid preview.
  for (const [zoneId, meta] of Object.entries(zoneFileMetas)) {
    const zoneExt = EXT_FOR_MIME[meta.mime] ?? 'bin';
    const zoneKey = makeKey(`src-${productSlug}-${zoneId}`, zoneExt);
    const zbytes = zoneFilesBytes[zoneId];
    const { error: zUpErr } = await service.storage
      .from(GIFT_BUCKETS.sources)
      .upload(zoneKey, zbytes, { contentType: meta.mime, upsert: false, cacheControl: '3600' });
    if (!zUpErr) {
      meta.key = zoneKey;
      await service.from('gift_assets').insert({
        role: 'source',
        bucket: GIFT_BUCKETS.sources,
        path: zoneKey,
        mime_type: meta.mime,
        size_bytes: meta.size,
      });
    }
  }

  // Validate shape_kind against the product's shape_options config.
  // Keeps a customer-crafted request from asking for a Cutout on a
  // rectangle-only product, or picking a template that's not enabled.
  const configuredShapes = Array.isArray((product as any).shape_options)
    ? ((product as any).shape_options as Array<{ kind: string; template_ids?: string[] }>)
    : [];
  if (configuredShapes.length > 0 && shapeKind) {
    const row = configuredShapes.find((r) => r.kind === shapeKind);
    if (!row) return { ok: false, error: `Shape "${shapeKind}" is not enabled on this product.` };
    if (shapeKind === 'template') {
      if (!shapeTemplateId || !Array.isArray(row.template_ids) || !row.template_ids.includes(shapeTemplateId)) {
        return { ok: false, error: 'Picked template is not allowed for this product.' };
      }
    }
  }

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
        // The prompt's pipeline_id (if set) wins over the product's
        // default — styles like "3D Cartoon" vs "Pass-through" map to
        // different providers + models.
        pipeline_id: prompt?.pipeline_id ?? (product as any).pipeline_id ?? null,
        // Size-variant override: if the customer picked an A-series
        // size variant, the print target is the variant's dimensions,
        // not the product's defaults. The pipeline reads width_mm /
        // height_mm off this product shape.
        ...(variantDims ? { width_mm: variantDims.width_mm, height_mm: variantDims.height_mm } : {}),
      },
      sourceBytes: bytes,
      sourceMime: file.type,
      cropRect: cropRect ?? null,
      // Shape='template' carries its own template id — it wins over the
      // legacy top-level template_id path so admin-enabled shape-picker
      // products pick the right template at fan-out time.
      templateId: shapeKind === 'template' ? shapeTemplateId : templateId,
      shapeKind,
      imagesByZoneId: Object.keys(zoneFilesBytes).length > 0 ? zoneFilesBytes : undefined,
      textByZoneId:   Object.keys(zoneTexts).length > 0 ? zoneTexts : undefined,
      textColorsByZoneId: Object.keys(zoneTextColors).length > 0 ? zoneTextColors : undefined,
      calendarsByZoneId: Object.keys(zoneCalendars).length > 0 ? zoneCalendars : undefined,
      calendarColorsByZoneId: Object.keys(zoneCalendarColors).length > 0 ? zoneCalendarColors : undefined,
      foregroundColor: foregroundColor ?? undefined,
      backgroundColor: backgroundColor ?? undefined,
      // Only run the AI transform path when the customer actually
      // picked a style. Template-driven products without a chosen
      // prompt should composite the photo as-is — no Replicate, no
      // hang risk.
      applyStyle: prompt !== null,
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
