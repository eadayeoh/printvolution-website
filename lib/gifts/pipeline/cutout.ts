// Cutout-shape stage for the preview pipeline.
// Feed it the already-stylised bytes from the mode-specific stage
// (laser / uv / embroidery / photo-resize), and it:
//   1. Runs OpenAI gpt-image-2 to extract the subject onto a fully
//      transparent background.
//   2. Composites the bg-removed subject onto a neutral checker-pattern
//      background so the customer sees the acrylic will follow the photo.
//   3. Traces the alpha channel into an SVG path (potrace) which becomes
//      the laser cut file — saved as its own gift_assets row with
//      role='cut_file' so fulfilment picks up both the printed preview
//      and the cut path.

import { runOpenAiImageEdit } from '../ai';

// potrace is a CJS Node module — loaded lazily inside `traceAlpha` so
// the webpack Server-Actions bundle trace doesn't try to pull it into
// the client manifest. Typed as the minimal surface we use.
type PotraceModule = {
  trace: (
    input: Buffer | string,
    opts: Record<string, unknown>,
    cb: (err: Error | null, svg: string) => void,
  ) => void;
};

const DEFAULT_BG_REMOVE_MODEL = 'gpt-image-2';
// Tight, positive instruction so gpt-image-2 doesn't reinterpret the
// subject — laser cuts the alpha silhouette, so subject fidelity is
// load-bearing.
const BG_REMOVE_PROMPT =
  'Keep the subject exactly as-is — same pose, same edges, same colours. Replace the background and any non-subject pixels with full transparency. Do not redraw, restyle, or recompose the subject.';

export type CutoutOutput = {
  /** JPEG preview bytes — subject on checker pattern. */
  previewBuffer: Buffer;
  /** Full SVG document suitable for a laser-cut path. */
  cutSvg: string;
  /** Full-size PNG with alpha, kept around in case the production
   *  pipeline later wants to print on transparent acrylic. */
  bgRemovedPng: Buffer;
  widthPx: number;
  heightPx: number;
};

export async function renderCutoutPreview(opts: {
  /** Pre-stylised bytes from the mode stage (before watermarking). */
  styledBytes: Uint8Array | Buffer;
  styledMime: string;
  /** Canvas size for the checker-pattern composite. Usually matches the
   *  stylised image's own dimensions so the subject doesn't get scaled. */
  canvasWidthPx: number;
  canvasHeightPx: number;
}): Promise<CutoutOutput> {
  const sharp = (await import('sharp')).default;

  // 1. Background-remove via OpenAI gpt-image-2. Returns a PNG with alpha.
  const styledU8 = opts.styledBytes instanceof Uint8Array
    ? opts.styledBytes
    : new Uint8Array(opts.styledBytes);
  const bgRemovedPng = await runOpenAiImageEdit({
    model: DEFAULT_BG_REMOVE_MODEL,
    imageBytes: styledU8,
    imageMime: opts.styledMime,
    prompt: BG_REMOVE_PROMPT,
    defaults: {
      quality: 'medium',
      background: 'transparent',
      output_format: 'png',
      size: 'auto',
    },
  });

  // 2. Compose onto a checker-pattern background — customer-facing signal
  //    for "the acrylic will follow this outline".
  const checker = await makeCheckerPng(opts.canvasWidthPx, opts.canvasHeightPx);
  const previewBuffer = await sharp(checker)
    .composite([{ input: bgRemovedPng, top: 0, left: 0, blend: 'over' }])
    .jpeg({ quality: 84 })
    .toBuffer();

  // 3. Trace the alpha → SVG. potrace operates on raster luminance, so
  //    flatten the alpha onto a white background first to get crisp
  //    black silhouette pixels.
  const flat = await sharp(bgRemovedPng)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toColourspace('b-w')
    .png()
    .toBuffer();
  const cutSvg = await traceAlpha(flat);

  return {
    previewBuffer,
    cutSvg,
    bgRemovedPng,
    widthPx: opts.canvasWidthPx,
    heightPx: opts.canvasHeightPx,
  };
}

async function makeCheckerPng(w: number, h: number): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  const tile = 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <pattern id="c" width="${tile * 2}" height="${tile * 2}" patternUnits="userSpaceOnUse">
        <rect width="${tile * 2}" height="${tile * 2}" fill="#ffffff"/>
        <rect width="${tile}" height="${tile}" fill="#e5e5e5"/>
        <rect x="${tile}" y="${tile}" width="${tile}" height="${tile}" fill="#e5e5e5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#c)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function traceAlpha(pngBytes: Buffer): Promise<string> {
  // Hide the require from webpack's static analyser so the Server
  // Actions bundler doesn't try to pull potrace into the client trace.
  // `eval('require')` reaches Node's runtime require at run time.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
  const nodeRequire = eval('require') as NodeRequire;
  const potrace = nodeRequire('potrace') as PotraceModule;
  return new Promise((resolve, reject) => {
    potrace.trace(
      pngBytes,
      { threshold: 128, turdSize: 100, optCurve: true },
      (err, svg) => {
        if (err) reject(err);
        else resolve(svg);
      },
    );
  });
}
