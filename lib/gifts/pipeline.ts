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
import type { GiftCropRect, GiftProduct, GiftPipeline, GiftTemplate } from './types';
import { renderTemplateComposite } from './pipeline/composite';
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

/** Mode-aware resolver for surface fan-out. When the product has a
 *  specific pipeline override AND its `kind` matches the surface's
 *  mode, use it. Otherwise fall back to the default pipeline for that
 *  mode. Keeps the override UI useful for single-mode products while
 *  staying correct for dual-mode products where the primary-mode
 *  override would otherwise be used incorrectly for secondary-mode
 *  surfaces. */
async function resolvePipelineForMode(
  product: GiftProduct,
  mode: string,
): Promise<GiftPipeline | null> {
  if (product.pipeline_id) {
    const p = await getPipelineByIdAdmin(product.pipeline_id);
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
      buf = await runAiTransform(buf, product, pipeline, /*preview=*/true);
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
    const out = await renderTemplateComposite(sharp, {
      template,
      sourceBytes: src,
      targetWidthMm:  product.width_mm,
      targetHeightMm: product.height_mm,
      kind: 'production',
    });
    const pngKey = makeKey(`prod-${product.slug}`, 'png');
    const pngBuf = await sharp(out.buffer).png({ compressionLevel: 6 }).toBuffer();
    const pngMeta = await sharp(pngBuf).metadata();
    await putObject(GIFT_BUCKETS.production, pngKey, pngBuf, 'image/png');
    const pdfKey = makeKey(`prod-${product.slug}`, 'pdf');
    const pdfBuf = await wrapPdf(pngBuf, {
      trimWidthMm:  product.width_mm,
      trimHeightMm: product.height_mm,
      bleedMm:      product.bleed_mm,
    });
    await putObject(GIFT_BUCKETS.production, pdfKey, pdfBuf, 'application/pdf');
    const dpi = computeDpiForDimensions(pngMeta.width ?? 0, product.width_mm);
    return {
      productionPath: pngKey,
      productionMime: 'image/png',
      productionPdfPath: pdfKey,
      productionPdfMime: 'application/pdf',
      widthPx: pngMeta.width ?? out.widthPx,
      heightPx: pngMeta.height ?? out.heightPx,
      dpi,
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
      buf = await runAiTransform(buf, product, pipeline, /*preview=*/false);
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

/**
 * Photo Resize — apply cropRect and pad with bleed.
 * cropRect is in SOURCE image pixel coordinates (x, y, width, height).
 */
async function renderPhotoResize(
  input: Buffer,
  product: GiftProduct,
  cropRect: GiftCropRect | null,
  preview: boolean
): Promise<Buffer> {
  const sharp = await loadSharp();
  let img = sharp(input);
  const meta = await img.metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;

  const trimW = product.width_mm;
  const trimH = product.height_mm;
  const bleed = product.bleed_mm;
  const totalW = trimW + bleed * 2;
  const totalH = trimH + bleed * 2;

  // Apply crop if provided
  if (cropRect && cropRect.width > 0 && cropRect.height > 0) {
    const x = Math.max(0, Math.round(cropRect.x));
    const y = Math.max(0, Math.round(cropRect.y));
    const w = Math.min(srcW - x, Math.round(cropRect.width));
    const h = Math.min(srcH - y, Math.round(cropRect.height));
    img = img.extract({ left: x, top: y, width: w, height: h });
  }

  // Target pixel dimensions: 300 DPI production, 150 DPI preview
  const dpi = preview ? 150 : 300;
  const targetW = Math.round((totalW / 25.4) * dpi);
  const targetH = Math.round((totalH / 25.4) * dpi);

  return img
    .resize({ width: targetW, height: targetH, fit: 'cover' })
    .jpeg({ quality: preview ? 80 : 92 })
    .toBuffer();
}

/**
 * AI transform stub.
 *
 * This currently produces a "pending AI processing" preview overlay on top
 * of the source so the customer sees something reasonable. Admins receive
 * the raw source + the stored prompt snapshot and can process it via the
 * external tool of choice.
 *
 * REPLACE THIS FUNCTION when we wire up Replicate — the input/output shape
 * stays the same.
 */
async function runAiTransform(
  input: Buffer,
  product: GiftProduct,
  pipeline: GiftPipeline | null,
  preview: boolean,
): Promise<Buffer> {
  const sharp = await loadSharp();
  let img = sharp(input).rotate();

  // Approximate each pipeline kind's visual effect in the preview so the
  // customer sees something appropriate until the real AI call (Replicate
  // via pipeline.ai_endpoint_url) is wired in.
  const kind = pipeline?.kind ?? product.mode;
  switch (kind) {
    case 'laser':
      img = img.greyscale().normalise().linear(1.8, -40).threshold(128);
      break;
    case 'uv':
      img = img.modulate({ saturation: 1.4 }).sharpen();
      break;
    case 'embroidery':
      img = img.modulate({ saturation: 1.1 }).median(3).posterise(4);
      break;
  }

  // For production, scale up to 300 DPI at product dimensions
  if (!preview) {
    const totalW = product.width_mm + product.bleed_mm * 2;
    const totalH = product.height_mm + product.bleed_mm * 2;
    const targetW = Math.round((totalW / 25.4) * 300);
    const targetH = Math.round((totalH / 25.4) * 300);
    img = img.resize({ width: targetW, height: targetH, fit: 'cover' });
  }

  return img.png().toBuffer();
}

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
