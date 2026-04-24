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
 *   - Laser / UV / Embroidery currently fall back to a pass-through + watermark
 *     stub. The admin-configured prompt is stored on the order so the
 *     production team can render the AI-stylised output manually (or we wire
 *     up Replicate later via `lib/gifts/ai.ts`).
 *
 * When you plug in Replicate, replace the body of `runAiTransform` below.
 */

import { GIFT_BUCKETS, putObject, makeKey } from './storage';
import { getPipelineByIdAdmin, getDefaultPipelineForMode } from './pipelines';
import type { GiftCropRect, GiftProduct, GiftPipeline, GiftTemplate, GiftMode } from './types';
import { renderTemplateComposite } from './pipeline/composite';
import { renderPhotoResize, runAiTransform, transformBytesForMode } from './pipeline/transforms';
import { createClient } from '@/lib/supabase/server';

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
};

export type PreviewOutput = {
  previewPath: string;
  previewPublicUrl: string;
  previewMime: 'image/jpeg';
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
      targetWidthMm:  product.width_mm,
      targetHeightMm: product.height_mm,
      kind: 'preview',
      productMode: product.mode,
      // Preview: run each zone's transform so the customer sees the
      // real output on every zone (line-art in laser zones, saturated
      // colour in UV zones, etc.) — not just the raw uploaded photo.
      transformZone: async (bytes, mode) => {
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

  // Normalise: auto-orient via EXIF, drop alpha where not needed
  buf = await sharp(buf).rotate().jpeg({ quality: 80 }).toBuffer();

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

  // Resize to preview size (max 1200 px long edge)
  buf = await sharp(buf).resize({ width: 1200, height: 1200, fit: 'inside' }).jpeg({ quality: 82 }).toBuffer();

  // Watermark
  buf = await applyWatermark(buf);

  // Upload to public preview bucket
  const key = makeKey(`pv-${product.slug}`, 'jpg');
  const { path, publicUrl } = await putObject(GIFT_BUCKETS.previews, key, buf, 'image/jpeg');

  const meta = await sharp(buf).metadata();
  return {
    previewPath: path,
    previewPublicUrl: publicUrl!,
    previewMime: 'image/jpeg',
    widthPx: meta.width ?? 1200,
    heightPx: meta.height ?? 1200,
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
    pngMime: 'image/png';
    pdfPath: string;
    pdfMime: 'application/pdf';
    widthPx: number;
    heightPx: number;
    dpi: number;
  }>;
};

export async function runProductionPipeline(input: ProductionInput): Promise<ProductionOutput> {
  const { product } = input;
  const sharp = await loadSharp();
  if (!sharp) throw new Error('Image pipeline unavailable (sharp not installed)');
  const { getObject } = await import('./storage');
  const src = await getObject(GIFT_BUCKETS.sources, input.sourcePath);

  // Template composite path — same dispatch rule as preview.
  const template = await loadTemplate(input.templateId ?? null);
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

    // Shared callback — runs the right transform on each zone's bytes.
    const transformZone = async (bytes: Uint8Array, mode: GiftMode) => {
      const p = await resolvePipelineForMode(product, mode);
      return transformBytesForMode(bytes, mode, product, p, /*preview=*/false);
    };

    // Helper: produce one PNG + PDF pair and upload them, returning
    // keys + image metadata.
    const renderOnePass = async (onlyMode: GiftMode | null, slugSuffix: string) => {
      const out = await renderTemplateComposite(sharp, {
        template,
        sourceBytes: src,
        targetWidthMm:  product.width_mm,
        targetHeightMm: product.height_mm,
        kind: 'production',
        productMode: product.mode,
        onlyMode,
        transformZone,
      });
      const pngKey = makeKey(`prod-${product.slug}-${slugSuffix}`, 'png');
      const pngBuf = await sharp(out.buffer).png({ compressionLevel: 6 }).toBuffer();
      const pngMeta = await sharp(pngBuf).metadata();
      await putObject(GIFT_BUCKETS.production, pngKey, pngBuf, 'image/png');
      const pdfKey = makeKey(`prod-${product.slug}-${slugSuffix}`, 'pdf');
      const pdfBuf = await wrapPdf(pngBuf, {
        trimWidthMm:  product.width_mm,
        trimHeightMm: product.height_mm,
        bleedMm:      product.bleed_mm,
      });
      await putObject(GIFT_BUCKETS.production, pdfKey, pdfBuf, 'application/pdf');
      return {
        pngKey, pdfKey,
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
          pngPath: r.pngKey, pngMime: 'image/png',
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
        productionMime: 'image/png',
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
      productionPath: r.pngKey,
      productionMime: 'image/png',
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

  // Output PNG (reliable across all modes for v1)
  const pngKey = makeKey(`prod-${product.slug}`, 'png');
  const pngBuf = await sharp(buf).png({ compressionLevel: 6 }).toBuffer();
  const pngMeta = await sharp(pngBuf).metadata();
  await putObject(GIFT_BUCKETS.production, pngKey, pngBuf, 'image/png');

  // Wrap PNG into a PDF with trim + bleed boxes
  const pdfKey = makeKey(`prod-${product.slug}`, 'pdf');
  const pdfBuf = await wrapPdf(pngBuf, {
    trimWidthMm: product.width_mm,
    trimHeightMm: product.height_mm,
    bleedMm: product.bleed_mm,
  });
  await putObject(GIFT_BUCKETS.production, pdfKey, pdfBuf, 'application/pdf');

  const dpi = computeDpiForDimensions(pngMeta.width ?? 0, product.width_mm + product.bleed_mm * 2);

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
  return sharp(input).composite([{ input: overlay, blend: 'over' }]).jpeg({ quality: 82 }).toBuffer();
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
