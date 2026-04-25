// Mode-specific image transforms, pulled out of pipeline.ts so both
// pipeline.ts (single-mode flow) and composite.ts (per-zone flow in
// dual-mode templates) can use them without creating an import cycle.
//
// Each transform returns a Buffer containing a processed image.
// renderPhotoResize handles the non-AI modes (photo-resize / eco-
// solvent / digital / uv-dtf); runAiTransform handles the three AI
// modes via OpenAI gpt-image-2.

import type { GiftProduct, GiftPipeline, GiftCropRect, GiftMode } from '@/lib/gifts/types';

type SharpModule = any;

async function loadSharp(): Promise<SharpModule | null> {
  const mod = await import('sharp' as any).catch(() => null);
  return mod?.default ?? null;
}

/** Photo Resize — crop + bleed padding. Used by every non-AI mode. */
export async function renderPhotoResize(
  input: Buffer,
  product: GiftProduct,
  cropRect: GiftCropRect | null,
  preview: boolean,
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

  if (cropRect && cropRect.width > 0 && cropRect.height > 0) {
    const x = Math.max(0, Math.round(cropRect.x));
    const y = Math.max(0, Math.round(cropRect.y));
    const w = Math.min(srcW - x, Math.round(cropRect.width));
    const h = Math.min(srcH - y, Math.round(cropRect.height));
    img = img.extract({ left: x, top: y, width: w, height: h });
  }

  const dpi = preview ? 150 : 300;
  const targetW = Math.round((totalW / 25.4) * dpi);
  const targetH = Math.round((totalH / 25.4) * dpi);

  return img
    .resize({ width: targetW, height: targetH, fit: 'cover' })
    .jpeg({ quality: preview ? 80 : 92 })
    .toBuffer();
}

/** AI stylisation dispatcher. Branches on `pipeline.provider`:
 *  - `passthrough` → crop + 300 DPI resize (no model call), same as
 *    `renderPhotoResize`.
 *  - `openai`      → POST to api.openai.com/v1/images/edits with
 *    gpt-image-2, then resize to product dimensions.
 *  - `replicate`   → legacy, throws. Admin must migrate the row.
 *
 *  If `pipeline` is null or has no provider (legacy rows), falls back
 *  to the original local-sharp stub so existing products keep working.
 */
export async function runAiTransform(
  input: Buffer,
  product: GiftProduct,
  pipeline: GiftPipeline | null,
  preview: boolean,
  opts?: { prompt?: string | null; negativePrompt?: string | null },
): Promise<Buffer> {
  const sharp = await loadSharp();
  const provider = (pipeline as any)?.provider as 'passthrough' | 'openai' | 'local_edge' | 'local_bw' | 'replicate' | undefined;

  if (provider === 'passthrough') {
    return renderPhotoResize(input, product, null, preview);
  }

  if (provider === 'openai') {
    const model = (pipeline as any)?.ai_model_slug as string | undefined;
    if (!model) throw new Error(`Pipeline ${pipeline?.slug ?? '?'} is provider=openai but has no ai_model_slug (e.g. gpt-image-1)`);
    const { runOpenAiImageEdit } = await import('../ai');
    const defaults = ((pipeline as any)?.default_params as Record<string, unknown> | null) ?? {};
    const bytes = await runOpenAiImageEdit({
      model,
      imageBytes: input,
      imageMime: 'image/png',
      prompt: opts?.prompt ?? '',
      defaults,
    });
    const totalW = product.width_mm + product.bleed_mm * 2;
    const totalH = product.height_mm + product.bleed_mm * 2;
    const dpi = preview ? 150 : 300;
    const targetW = Math.round((totalW / 25.4) * dpi);
    const targetH = Math.round((totalH / 25.4) * dpi);
    return sharp(bytes).rotate()
      .resize({ width: targetW, height: targetH, fit: 'cover' })
      .png()
      .toBuffer();
  }

  if (provider === 'local_edge' || provider === 'local_bw') {
    // Deterministic local transforms. No AI call — preserves the actual
    // subject in the photo (unlike generative models that hallucinate
    // new faces from a canny hint). Exactly what laser engraving wants.
    const totalW = product.width_mm + product.bleed_mm * 2;
    const totalH = product.height_mm + product.bleed_mm * 2;
    const dpi = preview ? 150 : 300;
    const targetW = Math.round((totalW / 25.4) * dpi);
    const targetH = Math.round((totalH / 25.4) * dpi);

    let img = sharp(input).rotate();
    if (provider === 'local_edge') {
      // Line-art via Laplacian edge detection. Blur to kill noise, run
      // a 3×3 Laplacian, stretch contrast, invert so lines are black on
      // white. Produces a printable sketch that still looks like the
      // actual person.
      img = img
        .greyscale()
        .blur(0.6)
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
          scale: 1,
          offset: 128,
        })
        .linear(2.2, -180)
        .negate({ alpha: false });
    } else {
      // High-contrast black-and-white photo for greyscale laser
      // engraving. Keeps tonal range (not pure threshold) so faces stay
      // recognisable at depth.
      img = img
        .greyscale()
        .normalise()
        .linear(1.3, -15)
        .modulate({ brightness: 1.05 });
    }
    return img
      .resize({ width: targetW, height: targetH, fit: 'cover' })
      .png()
      .toBuffer();
  }

  if (provider === 'replicate') {
    // Replicate support was removed — every active pipeline now uses
    // OpenAI direct. Old rows still tagged 'replicate' need an admin
    // to flip them via /admin/gifts/pipelines/[id].
    throw new Error(`Pipeline ${pipeline?.slug ?? '?'} is still on the legacy Replicate provider — switch it to "OpenAI direct" in the admin pipelines editor.`);
  }

  // Legacy fallback — the mode-based stub. Keeps pre-provider pipelines
  // working until admin has migrated them to a proper provider.
  let img = sharp(input).rotate();
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
  if (!preview) {
    const totalW = product.width_mm + product.bleed_mm * 2;
    const totalH = product.height_mm + product.bleed_mm * 2;
    const targetW = Math.round((totalW / 25.4) * 300);
    const targetH = Math.round((totalH / 25.4) * 300);
    img = img.resize({ width: targetW, height: targetH, fit: 'cover' });
  }
  return img.png().toBuffer();
}

/** Apply the mode's transform to raw bytes. Use this from any caller
 *  that just needs "run the mode pipeline on these bytes" without the
 *  full product / crop context — e.g. composite.ts per-zone transforms
 *  in dual-mode templates. */
export async function transformBytesForMode(
  bytes: Uint8Array,
  mode: GiftMode,
  product: GiftProduct,
  pipeline: GiftPipeline | null,
  preview: boolean,
): Promise<Uint8Array> {
  const buf = Buffer.from(bytes);
  switch (mode) {
    case 'photo-resize':
    case 'eco-solvent':
    case 'digital':
    case 'uv-dtf':
      return await renderPhotoResize(buf, product, null, preview);
    case 'laser':
    case 'uv':
    case 'embroidery':
      return await runAiTransform(buf, { ...product, mode }, pipeline, preview);
    default:
      return bytes;
  }
}
