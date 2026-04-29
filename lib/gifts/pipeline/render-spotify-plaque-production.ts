// Production renderer for renderer='spotify_plaque' templates.
//
// At preview time the customer-facing UI mounts SpotifyPlaqueTemplate
// (a React component) which builds an SVG via buildSpotifyPlaqueSvg
// AND overlays the scancode as a CSS-masked HTML <img>. That overlay
// trick exists because SVG <image href> with cross-origin URLs doesn't
// load reliably when the SVG is injected via dangerouslySetInnerHTML.
//
// Production has no React + no DOM — sharp's resvg-backed SVG renderer
// happily loads cross-origin <image href> URLs at parse time. Even so,
// we pre-fetch the scancode PNG and embed it as a base64 data URI so a
// transient `scannables.scdn.co` outage during fulfilment can't quietly
// ship a plaque without the QR code.

import {
  buildSpotifyPlaqueSvg,
  spotifyScannableUrl,
} from '@/lib/gifts/spotify-plaque-svg';
import { GIFT_BUCKETS, makeKey, putObject, getObject } from '@/lib/gifts/storage';
import { wrapPdf } from '@/lib/gifts/pipeline/pdf';
import { computeDpiForDimensions } from '@/lib/gifts/pipeline/dpi';
import type { GiftProduct, GiftTemplate } from '@/lib/gifts/types';

export type SpotifyPlaqueProductionInput = {
  product: GiftProduct;
  template: GiftTemplate;
  /** Path of the customer photo in the gift-sources bucket. */
  sourcePath: string | null;
  /** Customer-supplied text + URL parsed out of personalisation_notes. */
  songTitle: string;
  artistName: string;
  spotifyTrackId: string | null;
  textColor: string | null;
};

export type SpotifyPlaqueProductionOutput = {
  productionPath: string;
  productionMime: 'image/png';
  productionPdfPath: string;
  productionPdfMime: 'application/pdf';
  widthPx: number;
  heightPx: number;
  dpi: number;
};

const PRODUCTION_DPI = 300;
const SCANCODE_FETCH_TIMEOUT_MS = 8_000;

/** Hot-link the scancode and inline it as a base64 data URI. Throws on
 *  fetch / network failure so we never ship a Spotify plaque with a
 *  silently-blank QR area. */
async function fetchScanCodeDataUrl(trackId: string): Promise<string> {
  const url = spotifyScannableUrl(trackId, 'black');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SCANCODE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`scannables.scdn.co returned ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buf.toString('base64')}`;
  } finally {
    clearTimeout(timer);
  }
}

/** Convert customer photo bytes (any sharp-readable input) to a
 *  base64 PNG data URI we can embed as a self-contained <image href>
 *  in the plaque SVG. */
async function photoBytesToDataUrl(bytes: Buffer | Uint8Array, sharp: any): Promise<string> {
  const png = await sharp(bytes).png().toBuffer();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

export async function renderSpotifyPlaqueProduction(
  input: SpotifyPlaqueProductionInput,
): Promise<SpotifyPlaqueProductionOutput> {
  const { product, template, sourcePath, songTitle, artistName, spotifyTrackId, textColor } = input;
  const sharpMod = (await import('sharp' as any)).default;

  // 1. Source photo → base64 data URI for the SVG <image>. If no photo
  //    was uploaded the SVG renders the placeholder rectangle.
  let photoDataUrl: string | null = null;
  if (sourcePath) {
    const bytes = await getObject(GIFT_BUCKETS.sources, sourcePath);
    photoDataUrl = await photoBytesToDataUrl(Buffer.from(bytes), sharpMod);
  }

  // 2. Scancode PNG → base64 (or fail loudly).
  if (!spotifyTrackId) {
    throw new Error('Spotify Plaque order has no track id — fix the order before retrying.');
  }
  const scanDataUrl = await fetchScanCodeDataUrl(spotifyTrackId);

  // 3. Build the SVG. omitScanCode is true; we splice the data-URL
  //    <image> in below so this function controls the scancode bytes
  //    rather than relying on the builder's hot-link behaviour.
  const refDims = template.reference_width_mm && template.reference_height_mm
    ? { width_mm: template.reference_width_mm, height_mm: template.reference_height_mm }
    : { width_mm: 210, height_mm: 297 };
  const svgInner = buildSpotifyPlaqueSvg({
    photoUrl: photoDataUrl,
    songTitle,
    artistName,
    spotifyTrackId,                 // text fallback ignored when omitScanCode is true
    templateRefDims: refDims,
    omitScanCode: true,
    textColor: textColor ?? undefined,
    zones: (template.zones_json as any) ?? null,
  });

  // 4. Splice the scancode <image> at the canonical bottom-strip
  //    position. Use the same layout constants the builder uses so the
  //    rect matches what the live preview overlays.
  const W = 100;
  const H = (refDims.height_mm / refDims.width_mm) * W;
  const margin = 8;
  const scanW = W - margin * 2;
  const scanH = scanW / 4;
  const scanX = margin;
  const scanY = H - margin - scanH;
  const scanImage = `<image href="${scanDataUrl}" xlink:href="${scanDataUrl}" x="${scanX}" y="${scanY}" width="${scanW}" height="${scanH}" preserveAspectRatio="xMidYMid meet"/>`;
  // Insert before closing </svg>.
  const finalSvg = svgInner.replace('</svg>', `${scanImage}</svg>`);

  // 5. Rasterise to PNG at production DPI. The viewBox is 100×H units;
  //    target pixel width = ceil(width_mm/25.4 * dpi).
  const targetWidthPx = Math.ceil((product.width_mm / 25.4) * PRODUCTION_DPI);
  const pngBuf = await sharpMod(Buffer.from(finalSvg, 'utf8'))
    .resize({ width: targetWidthPx })
    .png({ compressionLevel: 6 })
    .toBuffer();
  const pngMeta = await sharpMod(pngBuf).metadata();

  // 6. Upload PNG + wrap in PDF with trim/bleed boxes.
  const pngKey = makeKey(`prod-spotify-${product.slug}`, 'png');
  await putObject(GIFT_BUCKETS.production, pngKey, pngBuf, 'image/png');

  const pdfKey = makeKey(`prod-spotify-${product.slug}`, 'pdf');
  const pdfBuf = await wrapPdf(pngBuf, {
    trimWidthMm: product.width_mm,
    trimHeightMm: product.height_mm,
    bleedMm: product.bleed_mm,
  });
  await putObject(GIFT_BUCKETS.production, pdfKey, pdfBuf, 'application/pdf');

  return {
    productionPath: pngKey,
    productionMime: 'image/png',
    productionPdfPath: pdfKey,
    productionPdfMime: 'application/pdf',
    widthPx: pngMeta.width ?? 0,
    heightPx: pngMeta.height ?? 0,
    dpi: computeDpiForDimensions(pngMeta.width ?? 0, product.width_mm),
  };
}
