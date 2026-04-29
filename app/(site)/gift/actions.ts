'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { serviceClient, GIFT_BUCKETS, makeKey, putObject } from '@/lib/gifts/storage';
import { runPreviewPipeline } from '@/lib/gifts/pipeline';
import type { GiftProduct } from '@/lib/gifts/types';
import { GIFT_FONT_FAMILIES } from '@/lib/gifts/types';
import { detectImage } from '@/lib/upload/detect-image';
import { fetchCityMapVectors, type CityMapVectors } from '@/lib/gifts/city-map-svg';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { checkGiftGenerationQuota, recordGiftGeneration, type QuotaState } from '@/lib/gifts/quota';
import { getOrSetAnonSessionId } from '@/lib/gifts/anon-session';
import { createClient as createUserClient } from '@/lib/supabase/server';

/** Modes whose pipeline calls OpenAI — only these count against the
 *  weekly generation quota. photo-resize / eco-solvent / digital /
 *  uv-dtf do CPU-only resize and don't burn tokens. */
const AI_MODES = new Set(['laser', 'uv', 'embroidery']);

async function getCurrentUserId(): Promise<string | null> {
  try {
    const sb = createUserClient();
    const { data } = await sb.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Admin / staff users bypass all gift quota + rate limits — they need
 *  unlimited generations to test products + handle support cases.
 *  Returns true when profiles.role is 'admin' or 'staff'. */
async function isPrivilegedUser(): Promise<boolean> {
  try {
    const sb = createUserClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return false;
    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
    return profile?.role === 'admin' || profile?.role === 'staff';
  } catch {
    return false;
  }
}

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

/**
 * Song-lyrics-photo-frame photo upload.
 *
 * The customer's browser only renders the SVG composition — the photo
 * is composited entirely client-side via an <image href> in the SVG. So
 * we need a renderable URL the browser can load (signed, 1 h) AND a
 * stable id that survives into the cart line so production can fetch
 * the original from gift-sources at fulfilment time.
 *
 * Replaces the previous data-URL approach, which silently truncated when
 * a multi-megabyte photo was packed into the order's personalisation_notes.
 */
export async function uploadSongLyricsPhoto(formData: FormData): Promise<
  { ok: true; sourceAssetId: string; displayUrl: string } | { ok: false; error: string }
> {
  try {
    const file = formData.get('file');
    const productSlug = (formData.get('product_slug') || '').toString();
    if (!(file instanceof File)) return { ok: false, error: 'No file' };
    if (file.size === 0)        return { ok: false, error: 'Empty file' };
    if (file.size > 20 * 1024 * 1024) return { ok: false, error: 'File too large (max 20 MB)' };

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectImage(bytes);
    const allowed = new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif']);
    if (!detected || !allowed.has(detected.mime)) {
      return { ok: false, error: 'File is not a supported image format' };
    }

    const service = serviceClient();
    const key = makeKey(`song-photo-${productSlug || 'gift'}`, detected.ext);
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

    const { data: signed, error: sErr } = await service.storage
      .from(GIFT_BUCKETS.sources)
      .createSignedUrl(key, 60 * 60);
    if (sErr || !signed) return { ok: false, error: 'sign url failed' };

    return { ok: true, sourceAssetId: asset.id as string, displayUrl: signed.signedUrl };
  } catch (e: any) {
    console.error('[song-lyrics upload] uncaught error');
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

    // Admin / staff bypass all rate + quota limits — they need to be
    // able to generate freely for QA + support work.
    const isAdmin = await isPrivilegedUser();

    // Rate limit (anti-burst). Each call burns an OpenAI image-edit
    // credit, and source_asset_id is a guest-bearer UUID. Two layers:
    // per-IP and per-source UUID. The weekly quota check below is the
    // real spend gate; these stop a hot loop before it gets there.
    const ip = getClientIp();
    if (!isAdmin) {
      const ipRl = await checkRateLimit(`gift-restyle:ip:${ip}`, { max: 30, windowSeconds: 3600 });
      if (!ipRl.allowed) return { ok: false, error: `Too many regenerations — wait ${ipRl.retryAfterSeconds}s and try again.` };
      const srcRl = await checkRateLimit(`gift-restyle:src:${input.source_asset_id}`, { max: 20, windowSeconds: 86400 });
      if (!srcRl.allowed) return { ok: false, error: 'This photo has hit its regeneration limit for today. Re-upload to start fresh.' };
    }

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

    // Weekly generation quota — only AI modes burn OpenAI tokens.
    // Anon: 3/wk per cookie + IP hard ceiling. Signed-in: 8/wk per
    // user_id (with anon usage backfilled on login so they don't get
    // the full 8 if they already burned anon credits). Admin/staff
    // skip this entirely.
    const isAiMode = AI_MODES.has(product.mode);
    const userId = await getCurrentUserId();
    const anonSessionId = getOrSetAnonSessionId();
    if (isAiMode && !isAdmin) {
      const q = await checkGiftGenerationQuota({ userId, anonSessionId, ip });
      if (!q.allowed) {
        return { ok: false, error: q.reason ?? 'Generation quota exceeded.' };
      }
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
    if (prevErr || !previewAsset) {
      await service.storage.from(GIFT_BUCKETS.previews).remove([preview.previewPath]).catch(() => {});
      return { ok: false, error: `preview asset failed: ${prevErr?.message}` };
    }

    // Record successful AI generation against the weekly quota.
    // Admin/staff don't count — they don't have a quota.
    if (isAiMode && !isAdmin) {
      await recordGiftGeneration({
        userId, anonSessionId, ip,
        sourceAssetId: sourceAsset.id,
        previewAssetId: previewAsset.id,
      });
    }

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
 * Read-only snapshot of how many generations the current viewer has
 * left this week. Used by the PDP to show "X of 8 left" + decide
 * whether the Generate button is enabled. Doesn't mutate state.
 *
 * Admin / staff get an "unlimited" sentinel state — the PDP renders
 * it as a small badge instead of a remaining-count.
 */
export async function getGiftGenerationQuota(): Promise<QuotaState> {
  if (await isPrivilegedUser()) {
    return {
      allowed: true,
      remaining: Number.POSITIVE_INFINITY,
      used: 0,
      limit: Number.POSITIVE_INFINITY,
      isSignedIn: true,
    };
  }
  const ip = getClientIp();
  const userId = await getCurrentUserId();
  const anonSessionId = getOrSetAnonSessionId();
  return checkGiftGenerationQuota({ userId, anonSessionId, ip });
}

/**
 * Upload a single source photo without running the AI preview pipeline.
 * Used by the explicit-Generate flow on AI products: customer picks a
 * file, we store it cheaply, then they click Generate (which fires
 * restylePreviewFromSource) once they're happy with their picks.
 *
 * Returns sourceAssetId; the customer-visible preview comes later.
 */
export async function uploadGiftSourceOnly(formData: FormData): Promise<
  { ok: true; sourceAssetId: string } | { ok: false; error: string }
> {
  try {
    const ip = getClientIp();
    if (!(await isPrivilegedUser())) {
      const rl = await checkRateLimit(`gift-upload:ip:${ip}`, { max: 20, windowSeconds: 3600 });
      if (!rl.allowed) return { ok: false, error: `Too many uploads — wait ${rl.retryAfterSeconds}s and try again.` };
    }

    const file = formData.get('file');
    const productSlug = (formData.get('product_slug') || '').toString();
    if (!(file instanceof File)) return { ok: false, error: 'No file' };
    if (file.size === 0) return { ok: false, error: 'Empty file' };
    if (file.size > 20 * 1024 * 1024) return { ok: false, error: 'File too large (max 20 MB)' };
    if (!productSlug) return { ok: false, error: 'Product slug missing' };

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectImage(bytes);
    const actualMime = detected?.mime;
    if (!actualMime || !ALLOWED_MIME.has(actualMime)) {
      return { ok: false, error: 'File is not a supported image format' };
    }

    const sb = createClient();
    const { data: product } = await sb
      .from('gift_products').select('id, slug')
      .eq('slug', productSlug).eq('is_active', true).maybeSingle();
    if (!product) return { ok: false, error: 'Product not found' };

    const ext = EXT_FOR_MIME[actualMime] ?? 'bin';
    const sourceKey = makeKey(`src-${productSlug}`, ext);
    const service = serviceClient();
    const { error: upErr } = await service.storage
      .from(GIFT_BUCKETS.sources)
      .upload(sourceKey, bytes, { contentType: actualMime, upsert: false, cacheControl: '3600' });
    if (upErr) return { ok: false, error: 'upload failed' };

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
    if (srcErr || !sourceAsset) {
      await service.storage.from(GIFT_BUCKETS.sources).remove([sourceKey]).catch(() => {});
      return { ok: false, error: 'source asset failed' };
    }

    return { ok: true, sourceAssetId: sourceAsset.id };
  } catch {
    console.error('[gift upload-source-only] uncaught error');
    return { ok: false, error: 'Server error during upload' };
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
  // Per-IP rate limit. Each upload writes to the storage bucket and
  // typically triggers an OpenAI image-edit. 20/hour is generous for
  // an honest customer (re-upload + a few style flips) but caps a
  // bad actor at ~$0.60/hr in OpenAI spend per IP.
  const ip = getClientIp();
  const rl = await checkRateLimit(`gift-upload:ip:${ip}`, { max: 20, windowSeconds: 3600 });
  if (!rl.allowed) return { ok: false, error: `Too many uploads — wait ${rl.retryAfterSeconds}s and try again.` };

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
  const zoneTextFonts: Record<string, string> = {};
  const allowedFontKeys = new Set(GIFT_FONT_FAMILIES.map((f) => f.value));
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
    } else if (k.startsWith('text_font_') && typeof v === 'string') {
      // Whitelist against the ship-shipped GIFT_FONT_FAMILIES keys —
      // anything else could be a CSS-injection vector or a font we
      // don't have available on the server.
      const f = v.trim();
      if (allowedFontKeys.has(f)) {
        zoneTextFonts[k.slice('text_font_'.length)] = f;
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

  // 2. Register source asset row. If the insert fails, the bucket
  // upload above is orphaned — Supabase storage has no GC, so without
  // an explicit delete the bucket grows forever with untracked files.
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
  if (srcErr || !sourceAsset) {
    await service.storage.from(GIFT_BUCKETS.sources).remove([sourceKey]).catch(() => {});
    return { ok: false, error: 'source asset failed' };
  }

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
      sourceMime: actualMime,
      cropRect: cropRect ?? null,
      // Shape='template' carries its own template id — it wins over the
      // legacy top-level template_id path so admin-enabled shape-picker
      // products pick the right template at fan-out time.
      templateId: shapeKind === 'template' ? shapeTemplateId : templateId,
      shapeKind,
      imagesByZoneId: Object.keys(zoneFilesBytes).length > 0 ? zoneFilesBytes : undefined,
      textByZoneId:   Object.keys(zoneTexts).length > 0 ? zoneTexts : undefined,
      textColorsByZoneId: Object.keys(zoneTextColors).length > 0 ? zoneTextColors : undefined,
      textFontsByZoneId:  Object.keys(zoneTextFonts).length > 0 ? zoneTextFonts : undefined,
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
  if (prevErr || !previewAsset) {
    await service.storage.from(GIFT_BUCKETS.previews).remove([preview.previewPath]).catch(() => {});
    return { ok: false, error: `preview asset failed: ${prevErr?.message}` };
  }

  return {
    ok: true,
    sourceAssetId: sourceAsset.id,
    previewAssetId: previewAsset.id,
    previewUrl: preview.previewPublicUrl,
  };
}

// ── City Map Photo Frame ────────────────────────────────────────────────────

/**
 * Geocode a free-text address via OSM Nominatim. Returns the top match's
 * lat/lng + a clean human-readable label (the geocoder's display_name
 * truncated to the first 2 components — usually city + country).
 *
 * Nominatim's usage policy requires a real User-Agent and at most 1 req/s.
 * Customer-driven so the rate is fine; cache is keyed on the query string.
 */
/**
 * Multi-result address search for the autocomplete dropdown. Returns up to
 * 5 OSM Nominatim hits — customer picks one to drive the map render.
 *
 * Distinct from `geocodeAddress` (single best match) because the autocomplete
 * UI needs to show options as the customer types, not commit to one.
 */
export async function searchAddresses(query: string): Promise<
  | { ok: true; results: Array<{ lat: number; lng: number; label: string; displayName: string }> }
  | { ok: false; error: string }
> {
  const q = query.trim();
  if (q.length < 2) return { ok: true, results: [] };
  if (q.length > 200) return { ok: false, error: 'Query too long' };

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=0&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PrintVolution-CityMapGift/1.0 (multipleaddictions@gmail.com)',
        'Accept-Language': 'en',
      },
      // Cache per-query for an hour — gives the impression of an instant
      // autocomplete on repeat searches without spamming the geocoder.
      next: { revalidate: 60 * 60 },
    });
    if (!res.ok) return { ok: false, error: `geocoder ${res.status}` };
    const arr = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const results = arr.map((r) => {
      const display = r.display_name;
      // Short label = first two components of display_name. Used as the
      // city-label default when the customer picks this row.
      const label = display.split(',').slice(0, 2).join(',').trim();
      return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label, displayName: display };
    });
    return { ok: true, results };
  } catch (e: any) {
    console.error('[searchAddresses] error', e?.message);
    return { ok: false, error: 'Geocoder unavailable' };
  }
}

export async function geocodeAddress(query: string): Promise<
  { ok: true; lat: number; lng: number; label: string } | { ok: false; error: string }
> {
  const q = query.trim();
  if (!q) return { ok: false, error: 'Empty query' };
  if (q.length > 200) return { ok: false, error: 'Query too long' };

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PrintVolution-CityMapGift/1.0 (multipleaddictions@gmail.com)',
        'Accept-Language': 'en',
      },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return { ok: false, error: `geocoder ${res.status}` };
    const arr = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!arr.length) return { ok: false, error: 'No matches for that address' };
    const top = arr[0];
    // First two display_name components is usually "<place>, <country>"; we
    // surface that as the default city label (customer can override).
    const label = top.display_name.split(',').slice(0, 2).join(',').trim();
    return { ok: true, lat: parseFloat(top.lat), lng: parseFloat(top.lon), label };
  } catch (e: any) {
    console.error('[geocodeAddress] error', e?.message);
    return { ok: false, error: 'Geocoder unavailable, try again' };
  }
}

/**
 * Pull OSM road + water vectors for a bounding box around (lat, lng) at the
 * given radius and return the prepared SVG path data. Heavy operation —
 * cached aggressively at the fetch layer (1 week revalidate). Same call
 * used by the live PDP preview and the admin foil-SVG re-render.
 */
export async function fetchCityMapPaths(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<
  | { ok: true; vectors: CityMapVectors; effectiveRadiusKm: number }
  | { ok: false; error: string }
> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: 'Invalid coordinates' };
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, error: 'Coordinates out of range' };
  }
  // Try the requested radius first, then progressively smaller fallbacks
  // for dense cities where Overpass times out / OOMs at the wide bbox.
  // The customer sees the resulting smaller radius reflected back in the
  // slider so they understand what's on the page.
  // Customer-facing slider caps at 6 km so production-print quality stays
  // good (a 6 km bbox at 88 mm wide already produces road strokes near
  // the press limit). Server-side we accept up to 8 km in case admin
  // traffic uses something out-of-band, but never larger.
  const requested = Math.max(1, Math.min(8, radiusKm || 3));
  const tries = [requested, requested * 0.6, requested * 0.35, 1.5].filter(
    (r, i, arr) => r >= 1 && r <= 8 && (i === 0 || r < arr[i - 1] - 0.4),
  );
  let lastErr = '';
  for (const r of tries) {
    try {
      const vectors = await fetchCityMapVectors(lat, lng, r);
      return { ok: true, vectors, effectiveRadiusKm: Number(r.toFixed(1)) };
    } catch (e: any) {
      lastErr = e?.message || 'unknown';
      console.error('[fetchCityMapPaths] retry', r.toFixed(1), 'km:', lastErr);
    }
  }
  return { ok: false, error: `Map data unavailable for this location (${lastErr})` };
}

