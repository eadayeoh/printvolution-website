/**
 * Gift pipeline orchestration.
 *
 * Two entry points:
 *   - runPreviewPipeline : fast, produces a low-res watermarked JPG for the customer
 *   - runProductionPipeline : full-res, 300 DPI, private, admin-only
 *
 * Current state (v1):
 *   - Photo Resize mode is fully implemented server-side using `sharp` (the
 *     customer-supplied crop rect is applied + bleed is auto-added).
 *   - Laser / UV / Embroidery run through OpenAI gpt-image-2 via
 *     `lib/gifts/ai.ts` — admin configures the model + params on the
 *     gift_pipelines row.
 */

import { GIFT_BUCKETS, putObject, makeKey } from './storage';
import { getPipelineByIdAdmin, getDefaultPipelineForMode } from './pipelines';
import type { GiftCropRect, GiftProduct, GiftPipeline, GiftTemplate, GiftMode } from './types';
import { renderTemplateComposite } from './pipeline/composite';
import { renderPhotoResize, runAiTransform, transformBytesForMode } from './pipeline/transforms';
import { createClient } from '@/lib/supabase/server';
import { parsePersonalisationNotes, validateHexColor, validateFontKey } from './personalisation-notes';

/** Per-mode production output format spec. Maps a snapshot mode
 *  string to (a) the primary file format the production pipeline
 *  emits, and (b) whether to ALSO wrap the result in a print-ready
 *  PDF with trim + bleed boxes. Unknown modes get the v1 default
 *  (PNG + PDF) so this list is purely a per-mode override.
 *
 *    laser       → PNG only
 *    uv          → PNG only
 *    digital     → PNG only
 *    embroidery  → JPG only
 *    foil        → SVG only (bitmap embedded as <image>)
 *
 *  See https://github.com/eadayeoh/printvolution-website for the
 *  conversation thread that fixed the per-mode spec on 2026-04-29. */
function productionFormatsForMode(mode: string | null | undefined): {
  primary: 'png' | 'jpg' | 'svg';
  includePdf: boolean;
} {
  switch ((mode ?? '').toLowerCase()) {
    case 'embroidery':                       return { primary: 'jpg', includePdf: false };
    case 'foil':
    case 'foiling':                          return { primary: 'svg', includePdf: false };
    case 'laser':
    case 'uv':
    case 'digital':                          return { primary: 'png', includePdf: false };
    default:                                 return { primary: 'png', includePdf: true };
  }
}

/** Resolve the list of production files to emit, with template > product >
 *  mode-default precedence. Each entry is one of {'png','jpg','svg','pdf'}.
 *  The first non-pdf entry is the "primary" output (PNG or JPG or SVG);
 *  'pdf' is additive (wraps the primary in a print PDF).
 *  NULL or empty array on a layer = inherit from the next layer down. */
function resolveProductionFormat(
  template: GiftTemplate | null | undefined,
  product: GiftProduct,
): { primary: 'png' | 'jpg' | 'svg'; includePdf: boolean } {
  const fromArray = (arr: ReadonlyArray<string> | null | undefined): { primary: 'png' | 'jpg' | 'svg'; includePdf: boolean } | null => {
    if (!arr || arr.length === 0) return null;
    const includePdf = arr.includes('pdf');
    const primary = arr.find((x) => x === 'png' || x === 'jpg' || x === 'svg') as 'png' | 'jpg' | 'svg' | undefined;
    if (!primary) return null;
    return { primary, includePdf };
  };
  return fromArray(template?.production_files)
    ?? fromArray(product.production_files)
    ?? productionFormatsForMode(product.mode);
}

async function loadTemplate(templateId: string | null): Promise<GiftTemplate | null> {
  if (!templateId) return null;
  const sb = createClient();
  const { data } = await sb.from('gift_templates').select('*').eq('id', templateId).maybeSingle();
  return (data as GiftTemplate | null) ?? null;
}

/**
 * Resolve the pipeline for a product: honour product.pipeline_id if set,
 * else fall back to the default pipeline for the product's mode. This
 * decouples the *style* choice (prompt) from the *infrastructure* choice
 * (AI endpoint + params).
 */
async function resolvePipeline(product: GiftProduct): Promise<GiftPipeline | null> {
  if (product.pipeline_id) {
    const p = await getPipelineByIdAdmin(product.pipeline_id);
    if (p) return p;
  }
  return getDefaultPipelineForMode(product.mode);
}

/** Look up the customer-picked art-style prompt by id from the cart-line
 *  notes. Falls through to product.ai_prompt when no prompt was picked.
 *  Returns the prompt text to feed into the AI image edit, or null when
 *  the product runs no AI (photo-resize / digital / etc.). */
async function resolveCustomerPrompt(
  notes: string | null | undefined,
  product: GiftProduct,
): Promise<string | null> {
  const n = parsePersonalisationNotes(notes);
  const id = (n['prompt_id'] || '').trim();
  if (id) {
    const sb = createClient();
    const { data } = await sb.from('gift_prompts').select('transformation_prompt').eq('id', id).maybeSingle();
    const text = (data as { transformation_prompt?: string | null } | null)?.transformation_prompt;
    if (text && text.trim()) return text;
  }
  return (product as any).ai_prompt ?? null;
}

/** Walk the cart-line `personalisation_notes` and pull every customer
 *  pick that the template composite needs at production time:
 *  per-zone text / colour / font / calendar overrides, plus the
 *  template-wide foreground + background fills. Per-zone uploaded
 *  asset IDs come back as `imageAssetIdsByZoneId` so the caller can
 *  fetch the bytes from gift-sources.
 *
 *  Validation happens at THIS boundary (strict #RRGGBB on colours,
 *  whitelist check on fonts) so the SVG builders downstream can trust
 *  their inputs. */
function parseTemplateCustomerInputs(notes: string | null | undefined): {
  textByZoneId: Record<string, string>;
  textColorsByZoneId: Record<string, string>;
  textFontsByZoneId: Record<string, string>;
  calendarsByZoneId: Record<string, { month: number; year: number; highlightedDay: number | null }>;
  calendarColorsByZoneId: Record<string, string>;
  imageAssetIdsByZoneId: Record<string, string>;
  foregroundColor: string | undefined;
  backgroundColor: string | undefined;
} {
  const n = parsePersonalisationNotes(notes);

  const textByZoneId: Record<string, string> = {};
  const textColorsByZoneId: Record<string, string> = {};
  const textFontsByZoneId: Record<string, string> = {};
  const calendarsByZoneId: Record<string, { month: number; year: number; highlightedDay: number | null }> = {};
  const calendarColorsByZoneId: Record<string, string> = {};
  const imageAssetIdsByZoneId: Record<string, string> = {};

  for (const [k, v] of Object.entries(n)) {
    if (k.startsWith('text_color_')) {
      const c = validateHexColor(v);
      if (c) textColorsByZoneId[k.slice('text_color_'.length)] = c;
    } else if (k.startsWith('text_font_')) {
      const f = validateFontKey(v);
      if (f) textFontsByZoneId[k.slice('text_font_'.length)] = f;
    } else if (k.startsWith('text_')) {
      // text_<zone_id>:<value> — surface text + extra-text-zone +
      // template text-zone overrides all share this prefix.
      textByZoneId[k.slice('text_'.length)] = (v ?? '').slice(0, 500);
    } else if (k.startsWith('cal_color_')) {
      const c = validateHexColor(v);
      if (c) calendarColorsByZoneId[k.slice('cal_color_'.length)] = c;
    } else if (k.startsWith('cal_')) {
      try {
        const parsed = JSON.parse(v);
        const month = Number(parsed?.month);
        const year = Number(parsed?.year);
        const day = parsed?.highlightedDay;
        if (Number.isFinite(month) && Number.isFinite(year)) {
          calendarsByZoneId[k.slice('cal_'.length)] = {
            month: Math.min(12, Math.max(1, Math.round(month))),
            year: Math.min(2100, Math.max(1900, Math.round(year))),
            highlightedDay:
              day === null || day === undefined
                ? null
                : Math.min(31, Math.max(1, Math.round(Number(day)))),
          };
        }
      } catch { /* ignore malformed */ }
    } else if (k.startsWith('image_')) {
      const aid = (v ?? '').trim();
      if (aid) imageAssetIdsByZoneId[k.slice('image_'.length)] = aid;
    }
  }

  return {
    textByZoneId,
    textColorsByZoneId,
    textFontsByZoneId,
    calendarsByZoneId,
    calendarColorsByZoneId,
    imageAssetIdsByZoneId,
    foregroundColor: validateHexColor(n['fg_color']) ?? undefined,
    backgroundColor: validateHexColor(n['bg_color']) ?? undefined,
  };
}

/** Mode-aware resolver for surface fan-out. Dual-mode products can
 *  set an override per mode: pipeline_id for the primary,
 *  secondary_pipeline_id for the secondary. The override is only
 *  honoured when the pipeline's kind matches the surface's mode —
 *  so even if admin mis-configures one override, we won't run the
 *  wrong transform on a surface. Falls back to that mode's default
 *  pipeline otherwise. */
async function resolvePipelineForMode(
  product: GiftProduct,
  mode: string,
): Promise<GiftPipeline | null> {
  const overrideId =
    mode === product.mode
      ? product.pipeline_id
      : mode === product.secondary_mode
        ? product.secondary_pipeline_id
        : null;
  if (overrideId) {
    const p = await getPipelineByIdAdmin(overrideId);
    if (p && p.kind === mode) return p;
  }
  return getDefaultPipelineForMode(mode as any);
}

// sharp is loaded lazily because it's a native dependency and we only want it
// on the server in production (not in edge runtimes or bundled builds).
async function loadSharp() {
  const mod = await import('sharp' as any).catch(() => null);
  return mod?.default ?? null;
}

// ---------------------------------------------------------------------------
// PREVIEW PIPELINE
// ---------------------------------------------------------------------------

export type PreviewInput = {
  product: GiftProduct;
  sourceBytes: Uint8Array;
  sourceMime: string;
  cropRect?: GiftCropRect | null;   // required for photo-resize
  templateId?: string | null;
  /** Per-zone image bytes (multi-slot uploads) keyed by zone_id.
   *  Any image zone without an entry here falls back to sourceBytes
   *  inside the composite renderer. */
  imagesByZoneId?: Record<string, Uint8Array>;
  /** Per-zone text overrides keyed by zone_id. Defaults to the
   *  template zone's default_text when a key is absent. */
  textByZoneId?: Record<string, string>;
  /** Per-zone text colour overrides keyed by zone_id. Customer-picked
   *  via the colour picker; falls through to z.color when missing. */
  textColorsByZoneId?: Record<string, string>;
  /** Per-zone font-family key overrides. Validated upstream against
   *  GIFT_FONT_FAMILIES.value — falls through to z.font_family. */
  textFontsByZoneId?: Record<string, string>;
  /** Per-zone calendar fills keyed by zone_id. Calendar zones with no
   *  entry render the zone's admin defaults / current month. */
  calendarsByZoneId?: Record<string, { month: number; year: number; highlightedDay: number | null }>;
  /** Per-zone calendar colour overrides keyed by zone_id. */
  calendarColorsByZoneId?: Record<string, string>;
  /** Customer-picked tint applied to the template's foreground PNG via
   *  alpha-mask recolour. #RRGGBB; null/undefined leaves the original
   *  PNG untouched. */
  foregroundColor?: string;
  /** Customer-picked solid background fill. When set, replaces the
   *  template's background_url with this colour underneath every
   *  zone. */
  backgroundColor?: string;
  /** Customer-picked shape from the product's shape_options config.
   *  null / undefined = legacy behaviour (rectangle-equivalent).
   *  Drives a dispatcher below — 'cutout' runs the new bg-remove stage,
   *  'template' falls through to the composite path (templateId must be
   *  set), 'rectangle' passes through the mode-default pipeline. */
  shapeKind?: 'cutout' | 'rectangle' | 'template' | null;
  /** True when the customer picked a style prompt (or one is implied
   *  by the product's mode). When false, the template composite path
   *  treats every image zone as a pass-through (resize only) — no AI
   *  call, no AI hang risk. Default true so existing AI
   *  flows aren't affected. */
  applyStyle?: boolean;
};

export type PreviewOutput = {
  previewPath: string;
  previewPublicUrl: string;
  previewMime: 'image/jpeg' | 'image/png';
  widthPx: number;
  heightPx: number;
};

export async function runPreviewPipeline(input: PreviewInput): Promise<PreviewOutput> {
  const { product } = input;
  const sharp = await loadSharp();
  if (!sharp) throw new Error('Image pipeline unavailable (sharp not installed)');

  // Template composite path: if a template is selected on this order,
  // the composite engine does the rendering (zones + text + bg/fg).
  // Honours variant dim overrides threaded in via product.width_mm /
  // product.height_mm (the upload action patches those in place for
  // size variants).
  const template = await loadTemplate(input.templateId ?? null);
  if (template) {
    const out = await renderTemplateComposite(sharp, {
      template,
      sourceBytes: input.sourceBytes,
      imagesByZoneId: input.imagesByZoneId,
      textByZoneId:   input.textByZoneId,
      textColorsByZoneId: input.textColorsByZoneId,
      textFontsByZoneId:  input.textFontsByZoneId,
      calendarsByZoneId: input.calendarsByZoneId,
      calendarColorsByZoneId: input.calendarColorsByZoneId,
      foregroundColor: input.foregroundColor,
      backgroundColor: input.backgroundColor,
      targetWidthMm:  product.width_mm,
      targetHeightMm: product.height_mm,
      kind: 'preview',
      productMode: product.mode,
      // Preview: run each zone's transform so the customer sees the
      // real output on every zone (line-art in laser zones, saturated
      // colour in UV zones, etc.) — not just the raw uploaded photo.
      // When applyStyle is false (no prompt was picked), pass-through
      // every zone — the template's job is composition, not styling.
      transformZone: input.applyStyle === false
        ? undefined
        : async (bytes, mode) => {
            const p = await resolvePipelineForMode(product, mode);
            return transformBytesForMode(bytes, mode, product, p, /*preview=*/true);
          },
    });
    let buf = out.buffer;
    buf = await applyWatermark(buf);
    const key = makeKey(`pv-${product.slug}`, 'jpg');
    const { path, publicUrl } = await putObject(GIFT_BUCKETS.previews, key, buf, 'image/jpeg');
    return {
      previewPath: path,
      previewPublicUrl: publicUrl!,
      previewMime: 'image/jpeg',
      widthPx: out.widthPx,
      heightPx: out.heightPx,
    };
  }

  const pipeline = await resolvePipeline(product);
  const kind = pipeline?.kind ?? product.mode;
  let buf: Buffer = Buffer.from(input.sourceBytes);

  // Normalise: auto-orient via EXIF, drop alpha where not needed.
  // Flatten over white so transparent PNGs don't drop to black.
  buf = await sharp(buf).rotate().flatten({ background: '#ffffff' }).jpeg({ quality: 80 }).toBuffer();

  switch (kind) {
    case 'photo-resize':
    case 'eco-solvent':
    case 'digital':
    case 'uv-dtf':
      buf = await renderPhotoResize(buf, product, input.cropRect ?? null, /*preview=*/true);
      break;
    case 'laser':
    case 'uv':
    case 'embroidery':
      buf = await runAiTransform(buf, product, pipeline, /*preview=*/true, {
        prompt: (product as any).ai_prompt ?? null,
        negativePrompt: (product as any).ai_negative_prompt ?? null,
      });
      break;
  }

  // Resize to preview size (max 1200 px long edge). For pipelines that
  // emit a transparent PNG (laser / UV cut paths), keep the alpha so
  // the customer sees through to the mockup material; otherwise flatten
  // over white and emit JPEG.
  const preMeta = await sharp(buf).metadata();
  const keepAlpha = preMeta.hasAlpha === true;
  if (keepAlpha) {
    buf = await sharp(buf).resize({ width: 1200, height: 1200, fit: 'inside' }).png().toBuffer();
  } else {
    buf = await sharp(buf).resize({ width: 1200, height: 1200, fit: 'inside' }).flatten({ background: '#ffffff' }).jpeg({ quality: 82 }).toBuffer();
  }

  // Cutout shape: bg-remove + SVG silhouette trace. Runs AFTER the mode
  // transform so it cuts the stylised subject, not the raw photo. Stores
  // the SVG path as a gift_assets row with role='cut_file' so fulfilment
  // can pull both preview and cut file at production time.
  if (input.shapeKind === 'cutout') {
    try {
      const styledMeta = await sharp(buf).metadata();
      const { renderCutoutPreview } = await import('./pipeline/cutout');
      const cutout = await renderCutoutPreview({
        styledBytes: buf,
        styledMime: styledMeta.format === 'png' ? 'image/png' : 'image/jpeg',
        canvasWidthPx:  styledMeta.width ?? 1200,
        canvasHeightPx: styledMeta.height ?? 1200,
      });
      buf = cutout.previewBuffer;

      // Persist the SVG cut path + register the gift_assets row. A
      // storage failure on the cut file shouldn't break the preview —
      // the customer still gets to see their design. Fulfilment will
      // re-run on the stored source at order time if needed.
      try {
        const cutKey = makeKey(`cut-${product.slug}`, 'svg');
        await putObject(
          GIFT_BUCKETS.previews,
          cutKey,
          Buffer.from(cutout.cutSvg, 'utf8'),
          'image/svg+xml',
        );
        const sb = createClient();
        await sb.from('gift_assets').insert({
          role: 'cut_file',
          bucket: GIFT_BUCKETS.previews,
          path: cutKey,
          mime_type: 'image/svg+xml',
          width_px: cutout.widthPx,
          height_px: cutout.heightPx,
        });
      } catch (e) {
        console.error('[gift cutout] cut_file persist failed — continuing with preview only', e);
      }
    } catch (e: any) {
      // Bg-remove upstream failed. Don't silently fall back to a
      // rectangle — the customer asked for a cutout, and shipping a
      // watermarked rectangle preview makes them think the cutout
      // worked. Surface the failure so the action can return ok:false
      // and the UI can prompt a retry.
      console.error('[gift cutout] bg-remove failed', e?.message || e);
      throw new Error(`Cutout generation failed: ${e?.message || 'bg-remove upstream error'}. Try again or pick a different shape.`);
    }
  }

  // Watermark
  buf = await applyWatermark(buf);

  // Upload to public preview bucket. Match the file extension + mime
  // to whether the buffer is still alpha (transparent laser / UV) or a
  // flattened JPEG.
  const outMeta = await sharp(buf).metadata();
  const isPng = outMeta.format === 'png' || outMeta.hasAlpha === true;
  const previewMime: 'image/jpeg' | 'image/png' = isPng ? 'image/png' : 'image/jpeg';
  const ext = isPng ? 'png' : 'jpg';
  const keyPrefix = input.shapeKind === 'cutout' ? `pv-cutout-${product.slug}` : `pv-${product.slug}`;
  const key = makeKey(keyPrefix, ext);
  const { path, publicUrl } = await putObject(GIFT_BUCKETS.previews, key, buf, previewMime);

  return {
    previewPath: path,
    previewPublicUrl: publicUrl!,
    previewMime,
    widthPx: outMeta.width ?? 1200,
    heightPx: outMeta.height ?? 1200,
  };
}

// ---------------------------------------------------------------------------
// PRODUCTION PIPELINE — runs at order placement, never before
// ---------------------------------------------------------------------------

export type ProductionInput = {
  product: GiftProduct;
  sourcePath: string;               // path in gift-sources bucket
  sourceMime: string;
  cropRect?: GiftCropRect | null;
  templateId?: string | null;
  /** Customer's shape choice at order time. 'cutout' triggers the
   *  bg-remove + SVG silhouette path at production resolution; null
   *  or 'rectangle' is the standard rectangular print. 'template'
   *  routes through the template composite path above. */
  shapeKind?: 'cutout' | 'rectangle' | 'template' | null;
  /** Cart-line `personalisation_notes` "k:v;k:v" string. Required for
   *  renderer-driven templates (spotify_plaque / song_lyrics / city_map
   *  / star_map) — the renderer dispatch parses customer inputs out of
   *  this. NULL on legacy lines and standard composite templates. */
  personalisationNotes?: string | null;
};

export type ProductionOutput = {
  productionPath: string;           // PNG/TIFF
  productionMime: string;
  productionPdfPath: string;
  productionPdfMime: 'application/pdf';
  widthPx: number;
  heightPx: number;
  dpi: number;
  /** For dual-mode templates: one file per distinct mode used across
   *  the template's zones. Empty on single-mode templates + legacy
   *  flows — the single productionPath / productionPdfPath above is
   *  authoritative in those cases. */
  files?: Array<{
    mode: GiftMode;
    pngPath: string;
    pngMime: 'image/png' | 'image/jpeg';
    pdfPath: string;
    pdfMime: 'application/pdf';
    widthPx: number;
    heightPx: number;
    dpi: number;
  }>;
};

/** Stamp width/height attributes on the root `<svg>` so downstream printer
 *  software (foil RIPs, Illustrator) opens the file at the correct physical
 *  size without being told out of band. Only stamps when the dims are
 *  positive numbers; otherwise leaves the SVG untouched. */
function stampSvgSize(svg: string, widthMm: number, heightMm: number): string {
  if (!Number.isFinite(widthMm) || widthMm <= 0 || !Number.isFinite(heightMm) || heightMm <= 0) {
    return svg;
  }
  return svg.replace('<svg ', `<svg width="${widthMm}mm" height="${heightMm}mm" `);
}

async function renderRendererTemplate(args: {
  product: GiftProduct;
  template: GiftTemplate;
  sourceBytes: Uint8Array;
  sourceMime: string;
  personalisationNotes: string | null;
}): Promise<ProductionOutput> {
  const { product, template, sourceBytes, sourceMime, personalisationNotes } = args;
  const n = parsePersonalisationNotes(personalisationNotes);
  // Renderer templates accept full font names (Playfair Display, Archivo,
  // …) sourced from product.allowed_fonts — that's the whitelist for
  // these products. Any value outside it is dropped so a hand-crafted
  // notes blob can't inject CSS / SVG attribute payloads via font names.
  const allowedFontList = (product as any).allowed_fonts ?? [];
  const safeFont = (raw: string | undefined | null) => validateFontKey(raw, allowedFontList) ?? undefined;

  // Customer-picked size overrides for renderer products that expose a
  // size picker on the PDP (city / star map). Falls back to the
  // product's own width/height when the cart didn't carry the override.
  const sizeWmm = parseFloat(n['size_w_mm'] ?? '');
  const sizeHmm = parseFloat(n['size_h_mm'] ?? '');
  const physicalWmm = Number.isFinite(sizeWmm) && sizeWmm > 0 ? sizeWmm : product.width_mm;
  const physicalHmm = Number.isFinite(sizeHmm) && sizeHmm > 0 ? sizeHmm : product.height_mm;

  const fmt = resolveProductionFormat(template, product);
  const refDims = template.reference_width_mm && template.reference_height_mm
    ? { width_mm: template.reference_width_mm, height_mm: template.reference_height_mm }
    : null;

  switch (template.renderer) {
    case 'spotify_plaque': {
      // librsvg / sharp's SVG rasterizer can't decode HEIC inside an
      // <image> tag — the photo silently renders blank. Pre-decode any
      // non-{png,jpeg,webp} mime (typically iOS HEIC/HEIF) to JPEG.
      const rawMime = (sourceMime || 'image/jpeg').toLowerCase();
      const isWebSafe = rawMime === 'image/png' || rawMime === 'image/jpeg' || rawMime === 'image/jpg' || rawMime === 'image/webp';
      let photoBytes: Uint8Array = sourceBytes;
      let photoMime = rawMime || 'image/jpeg';
      if (!isWebSafe) {
        const sharp = await loadSharp();
        if (sharp) {
          photoBytes = await sharp(Buffer.from(sourceBytes)).jpeg({ quality: 90 }).toBuffer();
          photoMime = 'image/jpeg';
        }
      }
      const photoDataUri = `data:${photoMime};base64,${Buffer.from(photoBytes).toString('base64')}`;
      const { buildSpotifyPlaqueSvg } = await import('./spotify-plaque-svg');
      const svg = buildSpotifyPlaqueSvg({
        photoUrl: photoDataUri,
        songTitle:  n['spotify_title']  ?? '',
        artistName: n['spotify_artist'] ?? '',
        spotifyTrackId: n['spotify_track_id'] || null,
        templateRefDims: refDims,
        textColor: validateHexColor(n['spotify_text_color']) ?? undefined,
        zones: (template.zones_json as any) ?? null,
      });
      const stamped = stampSvgSize(svg, physicalWmm, physicalHmm);

      return rasterizeAndStore(stamped, product, physicalWmm, physicalHmm, fmt);
    }

    case 'song_lyrics': {
      const { buildSongLyricsSvg } = await import('./song-lyrics-svg');
      const layout = (n['song_layout'] as 'song' | 'wedding' | 'foil') || 'song';
      const isFoilMode = product.mode === 'foil' || product.mode === 'foiling';
      const svg = buildSongLyricsSvg({
        photoUrl: null,
        lyrics: n['song_lyrics'] ?? '',
        title:   n['song_title']   ?? '',
        names:   n['song_names']   ?? '',
        year:    n['song_year']    ?? '',
        subtitle: n['song_subtitle'] ?? '',
        tagline:  n['song_tagline']  ?? '',
        titleFont: safeFont(n['song_title_font']),
        namesFont: safeFont(n['song_names_font']),
        yearFont:  safeFont(n['song_year_font']),
        lyricsScale: n['song_lyrics_scale'] ? parseFloat(n['song_lyrics_scale']) : 1,
        layout,
        materialColor: isFoilMode ? null : undefined,
      });
      const stamped = stampSvgSize(svg, physicalWmm, physicalHmm);
      return isFoilMode || fmt.primary === 'svg'
        ? storeSvgOnly(stamped, product, physicalWmm, physicalHmm)
        : rasterizeAndStore(stamped, product, physicalWmm, physicalHmm, fmt);
    }

    case 'city_map': {
      const { buildCityMapSvg, fetchCityMapVectors } = await import('./city-map-svg');
      const lat = parseFloat(n['city_lat'] ?? '');
      const lng = parseFloat(n['city_lng'] ?? '');
      const radius = parseFloat(n['city_radius'] ?? '5');
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('City Map order has no coordinates');
      }
      const vectors = await fetchCityMapVectors(lat, lng, Math.max(1, Math.min(15, radius || 5)));
      const showCoords = n['city_show_coords'] === '1';
      const isFoilMode = product.mode === 'foil' || product.mode === 'foiling';
      const svg = buildCityMapSvg({
        vectors,
        names:     n['city_names']   ?? '',
        event:     n['city_event']   ?? '',
        cityLabel: n['city_label']   ?? '',
        tagline:   n['city_tagline'] ?? '',
        coordinates: showCoords ? `${lat.toFixed(4)}° N · ${lng.toFixed(4)}° E` : undefined,
        cityFont:    safeFont(n['city_font_title']),
        namesFont:   safeFont(n['city_font_names']),
        eventFont:   safeFont(n['city_font_event']),
        taglineFont: safeFont(n['city_font_tagline']),
        materialColor: isFoilMode ? null : undefined,
      });
      const stamped = stampSvgSize(svg, physicalWmm, physicalHmm);
      return isFoilMode || fmt.primary === 'svg'
        ? storeSvgOnly(stamped, product, physicalWmm, physicalHmm)
        : rasterizeAndStore(stamped, product, physicalWmm, physicalHmm, fmt);
    }

    case 'star_map': {
      const { buildStarMapSvg, buildStarMapScene } = await import('./star-map-svg');
      const lat = parseFloat(n['star_lat'] ?? '');
      const lng = parseFloat(n['star_lng'] ?? '');
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('Star Map order has no coordinates');
      }
      let dateUtc: Date | null = null;
      if (n['star_date_utc']) {
        const d = new Date(n['star_date_utc']);
        if (!Number.isNaN(d.getTime())) dateUtc = d;
      }
      if (!dateUtc && n['star_local_date'] && n['star_local_time']) {
        const [yy, mm, dd] = n['star_local_date'].split('-').map((s) => parseInt(s, 10));
        const [hh, mi]     = n['star_local_time'].split(':').map((s) => parseInt(s, 10));
        const tzOff = parseInt(n['star_tz_offset'] ?? '0', 10) || 0;
        if ([yy, mm, dd, hh, mi].every(Number.isFinite)) {
          dateUtc = new Date(Date.UTC(yy, mm - 1, dd, hh, mi) - tzOff * 60 * 1000);
        }
      }
      if (!dateUtc) throw new Error('Star Map order has no date/time for the sky');

      const scene = buildStarMapScene(lat, lng, dateUtc);
      const showCoords = n['star_show_coords'] === '1';
      const showLines  = n['star_show_lines']  === '1';
      const showLabels = n['star_show_labels'] === '1';
      const layout: 'foil' | 'poster' =
        n['star_layout'] === 'poster' ? 'poster' : 'foil';

      const coordinates = showCoords
        ? (layout === 'poster'
            ? `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} / ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`
            : `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`)
        : undefined;

      const isFoilMode = product.mode === 'foil' || product.mode === 'foiling';
      const svg = buildStarMapSvg({
        scene,
        dateUtc,
        names:         n['star_names']   ?? '',
        event:         n['star_event']   ?? '',
        locationLabel: n['star_label']   ?? '',
        tagline:       n['star_tagline'] ?? '',
        coordinates,
        showLines,
        showLabels,
        layout,
        locationFont: safeFont(n['star_font_loc']),
        namesFont:    safeFont(n['star_font_names']),
        eventFont:    safeFont(n['star_font_event']),
        taglineFont:  safeFont(n['star_font_tagline']),
        materialColor: layout === 'foil' ? null : undefined,
      });
      const stamped = stampSvgSize(svg, physicalWmm, physicalHmm);
      return isFoilMode || layout === 'foil' || fmt.primary === 'svg'
        ? storeSvgOnly(stamped, product, physicalWmm, physicalHmm)
        : rasterizeAndStore(stamped, product, physicalWmm, physicalHmm, fmt);
    }

    default:
      throw new Error(`Unknown renderer: ${template.renderer}`);
  }
}

async function storeSvgOnly(
  svg: string,
  product: GiftProduct,
  widthMm: number,
  heightMm: number,
): Promise<ProductionOutput> {
  const key = makeKey(`prod-${product.slug}`, 'svg');
  await putObject(GIFT_BUCKETS.production, key, Buffer.from(svg, 'utf8'), 'image/svg+xml');
  // Vector SVGs are resolution-independent; record nominal pixel dims at
  // 300 DPI so downstream UI has a sensible width/height to display.
  const widthPx = Math.round((widthMm / 25.4) * 300);
  const heightPx = Math.round((heightMm / 25.4) * 300);
  return {
    productionPath: key,
    productionMime: 'image/svg+xml',
    productionPdfPath: '',
    productionPdfMime: 'application/pdf',
    widthPx,
    heightPx,
    dpi: 300,
  };
}

async function rasterizeAndStore(
  svg: string,
  product: GiftProduct,
  widthMm: number,
  heightMm: number,
  fmt: { primary: 'png' | 'jpg' | 'svg'; includePdf: boolean },
): Promise<ProductionOutput> {
  const sharp = await loadSharp();
  if (!sharp) throw new Error('Image pipeline unavailable (sharp not installed)');
  // Rasterize at 300 DPI so foil-tone or UV-print outputs hold sharp
  // text + scancode bars when sent to the press.
  const widthPx = Math.round((widthMm / 25.4) * 300);
  const heightPx = Math.round((heightMm / 25.4) * 300);
  const pngBuf = await sharp(Buffer.from(svg, 'utf8'))
    .resize({ width: widthPx, height: heightPx, fit: 'fill' })
    .png({ compressionLevel: 6 })
    .toBuffer();
  const meta = await sharp(pngBuf).metadata();

  let primaryKey: string;
  let primaryMime: 'image/png' | 'image/jpeg';
  if (fmt.primary === 'jpg') {
    primaryKey = makeKey(`prod-${product.slug}`, 'jpg');
    primaryMime = 'image/jpeg';
    // Flatten before JPEG so transparent areas of the rasterised SVG
    // don't render as black.
    const jpgBuf = await sharp(pngBuf).flatten({ background: '#ffffff' }).jpeg({ quality: 92 }).toBuffer();
    await putObject(GIFT_BUCKETS.production, primaryKey, jpgBuf, primaryMime);
  } else {
    primaryKey = makeKey(`prod-${product.slug}`, 'png');
    primaryMime = 'image/png';
    await putObject(GIFT_BUCKETS.production, primaryKey, pngBuf, primaryMime);
  }

  let pdfKey = '';
  if (fmt.includePdf) {
    pdfKey = makeKey(`prod-${product.slug}`, 'pdf');
    const pdfBuf = await wrapPdf(pngBuf, {
      trimWidthMm: widthMm,
      trimHeightMm: heightMm,
      bleedMm: product.bleed_mm,
    });
    await putObject(GIFT_BUCKETS.production, pdfKey, pdfBuf, 'application/pdf');
  }

  return {
    productionPath: primaryKey,
    productionMime: primaryMime,
    productionPdfPath: pdfKey,
    productionPdfMime: 'application/pdf',
    widthPx: meta.width ?? widthPx,
    heightPx: meta.height ?? heightPx,
    dpi: 300,
  };
}

export async function runProductionPipeline(input: ProductionInput): Promise<ProductionOutput> {
  const { product } = input;
  const sharp = await loadSharp();
  if (!sharp) throw new Error('Image pipeline unavailable (sharp not installed)');
  const { getObject } = await import('./storage');
  const src = await getObject(GIFT_BUCKETS.sources, input.sourcePath);

  // Template composite path — same dispatch rule as preview.
  const template = await loadTemplate(input.templateId ?? null);
  if (template && template.renderer && template.renderer !== 'zones') {
    return renderRendererTemplate({
      product,
      template,
      sourceBytes: src,
      sourceMime: input.sourceMime,
      personalisationNotes: input.personalisationNotes ?? null,
    });
  }
  if (template) {
    // Work out the distinct set of modes the template's zones use.
    // Each zone's effective mode = zone.mode ?? product.mode. If the
    // set has more than one mode the template is "dual-mode" and we
    // fan out — produce one production file per mode.
    const zoneModes = new Set<GiftMode>();
    for (const z of (template.zones_json ?? [])) {
      zoneModes.add((z.mode ?? product.mode) as GiftMode);
    }
    const distinctModes = Array.from(zoneModes);

    // Resolve the customer-picked art-style prompt from the cart-line
    // notes. Templated AI products would otherwise run with an empty
    // prompt — every order gets the model's default style instead of
    // the picker the customer actually used on the PDP.
    const resolvedPrompt = await resolveCustomerPrompt(input.personalisationNotes, product);

    // Customer-picked text / colour / font / calendar / fg+bg picks
    // serialised into personalisation_notes at add-to-cart time.
    // Without this thread-through, production renders the template's
    // admin defaults instead of the order's actual personalisation.
    const customer = parseTemplateCustomerInputs(input.personalisationNotes);

    // Per-zone uploaded photos: fetch each asset's bytes from
    // gift-sources so multi-photo templates (e.g. LED-bases 4-photo
    // grid) composite the right photo into each image zone. Lookup
    // failures (deleted asset / wrong bucket) skip the zone — the
    // composite renderer falls back to the primary `src` bytes.
    const imagesByZoneId: Record<string, Uint8Array> = {};
    if (Object.keys(customer.imageAssetIdsByZoneId).length > 0) {
      const sb = createClient();
      const ids = Object.values(customer.imageAssetIdsByZoneId);
      const { data: assetRows } = await sb
        .from('gift_assets')
        .select('id, bucket, path')
        .in('id', ids);
      const byId = new Map<string, { bucket: string; path: string }>();
      for (const r of assetRows ?? []) {
        byId.set((r as any).id as string, { bucket: (r as any).bucket, path: (r as any).path });
      }
      for (const [zoneId, assetId] of Object.entries(customer.imageAssetIdsByZoneId)) {
        const row = byId.get(assetId);
        if (!row) continue;
        try {
          const bytes = await getObject(row.bucket, row.path);
          imagesByZoneId[zoneId] = bytes;
        } catch (e) {
          console.warn('[pipeline] zone image fetch failed', zoneId, (e as any)?.message);
        }
      }
    }

    // Shared callback — runs the right transform on each zone's bytes.
    const transformZone = async (bytes: Uint8Array, mode: GiftMode) => {
      const p = await resolvePipelineForMode(product, mode);
      return transformBytesForMode(bytes, mode, product, p, /*preview=*/false, resolvedPrompt);
    };

    // Composite always rasterizes — if the resolved primary is 'svg'
    // we silently fall through to PNG (zones output is bitmap by nature).
    const fmt = resolveProductionFormat(template, product);
    const primaryFormat: 'png' | 'jpg' = fmt.primary === 'jpg' ? 'jpg' : 'png';
    const primaryMime: 'image/png' | 'image/jpeg' =
      primaryFormat === 'jpg' ? 'image/jpeg' : 'image/png';

    // Helper: produce one primary file (+ optional PDF) pair and upload
    // them, returning keys + image metadata.
    const renderOnePass = async (onlyMode: GiftMode | null, slugSuffix: string) => {
      const out = await renderTemplateComposite(sharp, {
        template,
        sourceBytes: src,
        imagesByZoneId: Object.keys(imagesByZoneId).length > 0 ? imagesByZoneId : undefined,
        textByZoneId: Object.keys(customer.textByZoneId).length > 0 ? customer.textByZoneId : undefined,
        textColorsByZoneId: Object.keys(customer.textColorsByZoneId).length > 0 ? customer.textColorsByZoneId : undefined,
        textFontsByZoneId: Object.keys(customer.textFontsByZoneId).length > 0 ? customer.textFontsByZoneId : undefined,
        calendarsByZoneId: Object.keys(customer.calendarsByZoneId).length > 0 ? customer.calendarsByZoneId : undefined,
        calendarColorsByZoneId: Object.keys(customer.calendarColorsByZoneId).length > 0 ? customer.calendarColorsByZoneId : undefined,
        foregroundColor: customer.foregroundColor,
        backgroundColor: customer.backgroundColor,
        targetWidthMm:  product.width_mm,
        targetHeightMm: product.height_mm,
        kind: 'production',
        productMode: product.mode,
        onlyMode,
        transformZone,
      });
      const pngBuf = await sharp(out.buffer).png({ compressionLevel: 6 }).toBuffer();
      const pngMeta = await sharp(pngBuf).metadata();

      let primaryKey: string;
      if (primaryFormat === 'jpg') {
        primaryKey = makeKey(`prod-${product.slug}-${slugSuffix}`, 'jpg');
        // Flatten before JPEG so transparent composite areas don't go black.
        const jpgBuf = await sharp(pngBuf).flatten({ background: '#ffffff' }).jpeg({ quality: 92 }).toBuffer();
        await putObject(GIFT_BUCKETS.production, primaryKey, jpgBuf, primaryMime);
      } else {
        primaryKey = makeKey(`prod-${product.slug}-${slugSuffix}`, 'png');
        await putObject(GIFT_BUCKETS.production, primaryKey, pngBuf, primaryMime);
      }

      let pdfKey = '';
      if (fmt.includePdf) {
        pdfKey = makeKey(`prod-${product.slug}-${slugSuffix}`, 'pdf');
        const pdfBuf = await wrapPdf(pngBuf, {
          trimWidthMm:  product.width_mm,
          trimHeightMm: product.height_mm,
          bleedMm:      product.bleed_mm,
        });
        await putObject(GIFT_BUCKETS.production, pdfKey, pdfBuf, 'application/pdf');
      }

      return {
        primaryKey, pdfKey,
        widthPx:  pngMeta.width ?? 0,
        heightPx: pngMeta.height ?? 0,
        dpi: computeDpiForDimensions(pngMeta.width ?? 0, product.width_mm),
      };
    };

    if (distinctModes.length > 1) {
      // Dual-mode template: fan out — one file per mode.
      const files: NonNullable<ProductionOutput['files']> = [];
      for (const m of distinctModes) {
        const r = await renderOnePass(m, m);
        files.push({
          mode: m,
          pngPath: r.primaryKey, pngMime: primaryMime,
          pdfPath: r.pdfKey, pdfMime: 'application/pdf',
          widthPx: r.widthPx, heightPx: r.heightPx, dpi: r.dpi,
        });
      }
      // The single-file columns still get populated with the primary
      // mode's output so the legacy admin queue row shows something,
      // but the `files` array is the authoritative source.
      const primary = files.find((f) => f.mode === product.mode) ?? files[0];
      return {
        productionPath: primary.pngPath,
        productionMime: primaryMime,
        productionPdfPath: primary.pdfPath,
        productionPdfMime: 'application/pdf',
        widthPx: primary.widthPx,
        heightPx: primary.heightPx,
        dpi: primary.dpi,
        files,
      };
    }

    // Single-mode template: one file, same as before but now with
    // the transform callback so zones with AI modes render properly.
    const r = await renderOnePass(null, 'main');
    return {
      productionPath: r.primaryKey,
      productionMime: primaryMime,
      productionPdfPath: r.pdfKey,
      productionPdfMime: 'application/pdf',
      widthPx: r.widthPx,
      heightPx: r.heightPx,
      dpi: r.dpi,
    };
  }

  const pipeline = await resolvePipeline(product);
  const kind = pipeline?.kind ?? product.mode;
  let buf: Buffer = Buffer.from(src);
  buf = await sharp(buf).rotate().toBuffer();

  switch (kind) {
    case 'photo-resize':
    case 'eco-solvent':
    case 'digital':
    case 'uv-dtf':
      buf = await renderPhotoResize(buf, product, input.cropRect ?? null, /*preview=*/false);
      break;
    case 'laser':
    case 'uv':
    case 'embroidery':
      buf = await runAiTransform(buf, product, pipeline, /*preview=*/false, {
        prompt: (product as any).ai_prompt ?? null,
        negativePrompt: (product as any).ai_negative_prompt ?? null,
      });
      break;
  }

  // Cutout shape: regenerate the silhouette + cut SVG at production
  // resolution. Without this, the laser cutter would receive the
  // preview-time 1200px cut SVG (low-res silhouette) for a 300 DPI
  // print, producing jaggy edges. Mirror the preview cutout step,
  // but at the production buffer's full dimensions.
  if (input.shapeKind === 'cutout') {
    try {
      const styledMeta = await sharp(buf).metadata();
      const { renderCutoutPreview } = await import('./pipeline/cutout');
      const cutout = await renderCutoutPreview({
        styledBytes: buf,
        styledMime: 'image/png',
        canvasWidthPx:  styledMeta.width  ?? 0,
        canvasHeightPx: styledMeta.height ?? 0,
      });
      buf = cutout.previewBuffer;

      // Persist a fresh cut SVG asset at production resolution. The
      // earlier preview's cut_file row stays in storage but is no
      // longer the authoritative cut path for fulfilment.
      try {
        const cutKey = makeKey(`prod-cut-${product.slug}`, 'svg');
        await putObject(
          GIFT_BUCKETS.production,
          cutKey,
          Buffer.from(cutout.cutSvg, 'utf8'),
          'image/svg+xml',
        );
      } catch (e) {
        console.error('[gift cutout production] cut_file persist failed', e);
      }
    } catch (e: any) {
      // Don't ship a watermark-free rectangle pretending to be a
      // cutout. If the bg-remove step fails at production time, fail
      // the line so admin sees it and can retry.
      throw new Error(`Cutout production failed: ${e?.message || 'bg-remove upstream error'}`);
    }
  }

  // Per-mode output format with template / product overrides.
  const fmt = resolveProductionFormat(template, product);
  // Always render a high-quality bitmap first; we either ship the PNG
  // / JPG directly or wrap it inside an SVG.
  const bitmapBuf = await sharp(buf).png({ compressionLevel: 6 }).toBuffer();
  const bitmapMeta = await sharp(bitmapBuf).metadata();

  let primaryKey: string;
  let primaryMime: 'image/png' | 'image/jpeg' | 'image/svg+xml';
  if (fmt.primary === 'jpg') {
    primaryKey = makeKey(`prod-${product.slug}`, 'jpg');
    primaryMime = 'image/jpeg';
    // Flatten before JPEG so transparent areas of the buffer don't go black.
    const jpgBuf = await sharp(buf).flatten({ background: '#ffffff' }).jpeg({ quality: 92 }).toBuffer();
    await putObject(GIFT_BUCKETS.production, primaryKey, jpgBuf, primaryMime);
  } else if (fmt.primary === 'svg') {
    // Wrap the bitmap as a base64 <image> in an SVG. Foil cutters
    // typically want vector paths — the bitmap is the v1 fallback;
    // true vectorisation is future work.
    primaryKey = makeKey(`prod-${product.slug}`, 'svg');
    primaryMime = 'image/svg+xml';
    const totalW = product.width_mm + product.bleed_mm * 2;
    const totalH = product.height_mm + product.bleed_mm * 2;
    const dataUri = `data:image/png;base64,${bitmapBuf.toString('base64')}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}mm" height="${totalH}mm"><image href="${dataUri}" xlink:href="${dataUri}" x="0" y="0" width="${totalW}" height="${totalH}"/></svg>`;
    await putObject(GIFT_BUCKETS.production, primaryKey, Buffer.from(svg, 'utf8'), primaryMime);
  } else {
    primaryKey = makeKey(`prod-${product.slug}`, 'png');
    primaryMime = 'image/png';
    await putObject(GIFT_BUCKETS.production, primaryKey, bitmapBuf, primaryMime);
  }

  // Wrap into a PDF with trim + bleed boxes only when the mode wants it.
  let pdfKey: string | null = null;
  if (fmt.includePdf) {
    pdfKey = makeKey(`prod-${product.slug}`, 'pdf');
    const pdfBuf = await wrapPdf(bitmapBuf, {
      trimWidthMm: product.width_mm,
      trimHeightMm: product.height_mm,
      bleedMm: product.bleed_mm,
    });
    await putObject(GIFT_BUCKETS.production, pdfKey, pdfBuf, 'application/pdf');
  }

  const dpi = computeDpiForDimensions(bitmapMeta.width ?? 0, product.width_mm + product.bleed_mm * 2);

  return {
    productionPath: primaryKey,
    productionMime: primaryMime as any,
    productionPdfPath: pdfKey ?? '',
    productionPdfMime: 'application/pdf',
    widthPx: bitmapMeta.width ?? 0,
    heightPx: bitmapMeta.height ?? 0,
    dpi,
  };
}

// ---------------------------------------------------------------------------
// SURFACE PRODUCTION PIPELINE
// ---------------------------------------------------------------------------
//
// Per-face production runner. Invoked once per gift_order_item_surfaces
// row at fulfilment. Mirrors runProductionPipeline for the single-mode
// case, but:
//   - text-only surfaces get their string rasterised first (via SVG +
//     sharp) — the downstream photo-resize / AI transforms all accept
//     a bitmap, so rendering text to bitmap here is enough to unify the
//     two input paths.
//   - mode comes from the surface row (already snapshotted at checkout),
//     not the product.

export type SurfaceProductionInput = {
  product: GiftProduct;
  mode: string;                 // snapshot from gift_order_item_surfaces.mode
  text?: string | null;         // for text surfaces
  sourcePath?: string | null;   // for photo surfaces (bucket = GIFT_BUCKETS.sources)
  sourceMime?: string | null;
  surfaceLabel: string;         // for storage key naming only
  // Engraving zone on the variant's mockup (mm-normalised via
  // product.width_mm / height_mm). If present, the produced file fits
  // into this zone instead of the whole product canvas — matters for
  // multi-surface pieces where each face covers only part of the item.
  areaMm?: { widthMm: number; heightMm: number } | null;
};

export async function runSurfaceProductionPipeline(input: SurfaceProductionInput): Promise<ProductionOutput> {
  const sharp = await loadSharp();
  if (!sharp) throw new Error('Image pipeline unavailable (sharp not installed)');

  // 1. Resolve source bytes. Text surfaces: rasterise the string.
  //    Photo surfaces: pull from Supabase storage.
  let srcBytes: Buffer;
  if (input.sourcePath) {
    const { getObject } = await import('./storage');
    srcBytes = Buffer.from(await getObject(GIFT_BUCKETS.sources, input.sourcePath));
  } else if (input.text?.trim()) {
    srcBytes = await renderTextAsImage(input.text.trim(), input.areaMm ?? null);
  } else {
    throw new Error(`Surface "${input.surfaceLabel}" has neither text nor source asset`);
  }

  // 2. Route by snapshot mode. Each branch produces the final
  //    production bitmap. Re-use the single-mode renderers so future
  //    improvements land in both code paths.
  const fakeProduct = {
    ...input.product,
    // The fake product's physical dimensions collapse to the surface's
    // area (when known). This keeps the produced file correctly sized
    // for a single face rather than the whole piece.
    width_mm:  input.areaMm?.widthMm  ?? input.product.width_mm,
    height_mm: input.areaMm?.heightMm ?? input.product.height_mm,
  };
  let productionBuf: Buffer;
  switch (input.mode) {
    case 'photo-resize':
    case 'eco-solvent':
    case 'digital':
    case 'uv-dtf':
      productionBuf = await renderPhotoResize(srcBytes, fakeProduct, null, /*preview=*/false);
      break;
    case 'laser':
    case 'uv':
    case 'embroidery': {
      const pipeline = await resolvePipelineForMode(fakeProduct, input.mode);
      productionBuf = await runAiTransform(srcBytes, fakeProduct, pipeline, /*preview=*/false);
      break;
    }
    default:
      throw new Error(`Unknown production mode: ${input.mode}`);
  }

  // 3. Store the production PNG + wrap to PDF (trim/bleed markers from
  //    the variant's area dimensions, not the whole product).
  const slugSafe = `${input.product.slug}-${input.surfaceLabel.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const pngKey = makeKey(`prod-${slugSafe}`, 'png');
  const pngBuf = await sharp(productionBuf).png({ compressionLevel: 6 }).toBuffer();
  const pngMeta = await sharp(pngBuf).metadata();
  await putObject(GIFT_BUCKETS.production, pngKey, pngBuf, 'image/png');

  const pdfKey = makeKey(`prod-${slugSafe}`, 'pdf');
  const pdfBuf = await wrapPdf(pngBuf, {
    trimWidthMm:  fakeProduct.width_mm,
    trimHeightMm: fakeProduct.height_mm,
    bleedMm:      input.product.bleed_mm,
  });
  await putObject(GIFT_BUCKETS.production, pdfKey, pdfBuf, 'application/pdf');

  const dpi = computeDpiForDimensions(pngMeta.width ?? 0, fakeProduct.width_mm);
  return {
    productionPath: pngKey,
    productionMime: 'image/png',
    productionPdfPath: pdfKey,
    productionPdfMime: 'application/pdf',
    widthPx: pngMeta.width ?? 0,
    heightPx: pngMeta.height ?? 0,
    dpi,
  };
}

/** Render a short engraving string to a bitmap at ~300 DPI so the
 *  downstream pipeline can treat it the same way as an uploaded photo.
 *  Uses an SVG so the text stays crisp at any resolution; sharp
 *  rasterises it at the target pixel size. */
async function renderTextAsImage(
  text: string,
  areaMm: { widthMm: number; heightMm: number } | null,
): Promise<Buffer> {
  const sharp = await loadSharp();
  const widthMm  = areaMm?.widthMm  ?? 80;
  const heightMm = areaMm?.heightMm ?? 30;
  const dpi = 300;
  const widthPx  = Math.round((widthMm  / 25.4) * dpi);
  const heightPx = Math.round((heightMm / 25.4) * dpi);
  const safe = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Start at 80% of the shorter edge and rely on textLength to force-fit.
  const fontPx = Math.round(Math.min(widthPx, heightPx) * 0.7);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
      <rect width="100%" height="100%" fill="#ffffff" />
      <text
        x="${widthPx / 2}" y="${heightPx / 2}"
        dominant-baseline="central" text-anchor="middle"
        font-family="Playfair Display, Fraunces, Georgia, serif"
        font-weight="600"
        font-size="${fontPx}"
        fill="#0a0a0a"
        textLength="${widthPx * 0.9}"
        lengthAdjust="spacingAndGlyphs"
      >${safe}</text>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ---------------------------------------------------------------------------
// Mode implementations
// ---------------------------------------------------------------------------

// Mode-specific transforms now live in ./pipeline/transforms.ts so
// composite.ts can reach them without a dependency cycle.

// ---------------------------------------------------------------------------
// Watermark
// ---------------------------------------------------------------------------

async function applyWatermark(input: Buffer): Promise<Buffer> {
  const sharp = await loadSharp();
  const meta = await sharp(input).metadata();
  const W = meta.width ?? 1200;
  const H = meta.height ?? 1200;

  // Diagonal tiled "PREVIEW — PRINTVOLUTION" in semi-transparent white
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <pattern id="wm" patternUnits="userSpaceOnUse" width="420" height="220" patternTransform="rotate(-28)">
          <text x="0" y="120" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800"
                fill="rgba(255,255,255,0.28)" letter-spacing="3">PREVIEW · PRINTVOLUTION</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)"/>
    </svg>`;
  const overlay = Buffer.from(svg);
  // Preserve alpha through the watermark step — the laser/UV preview
  // pipelines rely on the transparent buffer surviving so the customer
  // sees through to the mockup material. Flatten + JPEG only when the
  // input was already opaque.
  const composed = sharp(input).composite([{ input: overlay, blend: 'over' }]);
  if (meta.hasAlpha === true) {
    return composed.png().toBuffer();
  }
  return composed.flatten({ background: '#ffffff' }).jpeg({ quality: 82 }).toBuffer();
}

// ---------------------------------------------------------------------------
// PDF wrapping (lightweight — uses pdf-lib)
// ---------------------------------------------------------------------------

async function wrapPdf(pngBuf: Buffer, opts: { trimWidthMm: number; trimHeightMm: number; bleedMm: number }): Promise<Buffer> {
  const { PDFDocument } = await import('pdf-lib');
  const mmToPt = (mm: number) => (mm * 72) / 25.4;
  const totalW = opts.trimWidthMm + opts.bleedMm * 2;
  const totalH = opts.trimHeightMm + opts.bleedMm * 2;

  const doc = await PDFDocument.create();
  const page = doc.addPage([mmToPt(totalW), mmToPt(totalH)]);
  const img = await doc.embedPng(pngBuf);
  page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });

  // Trim box (artwork area, inside bleed)
  page.setTrimBox(mmToPt(opts.bleedMm), mmToPt(opts.bleedMm), mmToPt(opts.trimWidthMm), mmToPt(opts.trimHeightMm));
  page.setBleedBox(0, 0, page.getWidth(), page.getHeight());

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

function computeDpiForDimensions(pixelWidth: number, physicalWidthMm: number): number {
  if (physicalWidthMm <= 0) return 0;
  return Math.round((pixelWidth / physicalWidthMm) * 25.4);
}
