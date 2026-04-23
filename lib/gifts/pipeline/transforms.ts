// Mode-specific image transforms, pulled out of pipeline.ts so both
// pipeline.ts (single-mode flow) and composite.ts (per-zone flow in
// dual-mode templates) can use them without creating an import cycle.
//
// Each transform returns a Buffer containing a processed image.
// renderPhotoResize handles the non-AI modes (photo-resize / eco-
// solvent / digital / uv-dtf); runAiTransform approximates the AI
// stylisation for the three AI modes. Replace the body of
// runAiTransform when wiring Replicate — the signature is stable.

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

/** Stub AI stylisation. Produces a visually-distinct output per mode
 *  (line-art for laser, saturated for UV, posterised for embroidery)
 *  so the customer preview reads correctly. Replace this body when
 *  wiring the real AI endpoint — the signature stays. */
export async function runAiTransform(
  input: Buffer,
  product: GiftProduct,
  pipeline: GiftPipeline | null,
  preview: boolean,
): Promise<Buffer> {
  const sharp = await loadSharp();
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
