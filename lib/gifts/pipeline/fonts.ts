// Font loader for the template composite renderer.
//
// librsvg (the SVG renderer bundled with sharp) can't find the design-
// system fonts (Inter / Playfair Display / Fraunces / Caveat / Bebas
// Neue / JetBrains Mono) on Vercel's Lambda, so text in composites
// falls back to a generic family and looks off.
//
// This module solves it by:
//
//   1. Loading any .ttf / .otf file from public/fonts/ at server
//      startup, cached per process.
//   2. Handing the file buffers to @resvg/resvg-js's `font.fontFiles`
//      option. resvg uses fontkit under the hood and respects the
//      @font-face family names embedded in the files.
//
// Usage:
//
//   // public/fonts/
//   // ├─ Inter-Regular.ttf
//   // ├─ Inter-Bold.ttf
//   // └─ PlayfairDisplay-BoldItalic.ttf
//
//   import { renderSvgWithFonts } from './fonts';
//   const pngBuf = await renderSvgWithFonts(svgString);
//
// If the directory is empty or missing the module returns null and the
// composite renderer falls back to its existing sharp/librsvg path.

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');

let cachedFontFiles: string[] | null = null;
let cachedResvg: any = null;

async function discoverFonts(): Promise<string[]> {
  if (cachedFontFiles !== null) return cachedFontFiles;
  try {
    if (!fsSync.existsSync(FONTS_DIR)) {
      cachedFontFiles = [];
      return cachedFontFiles;
    }
    const entries = await fs.readdir(FONTS_DIR);
    cachedFontFiles = entries
      .filter((f) => /\.(ttf|otf)$/i.test(f))
      .map((f) => path.join(FONTS_DIR, f));
    return cachedFontFiles;
  } catch {
    cachedFontFiles = [];
    return cachedFontFiles;
  }
}

async function loadResvg() {
  if (cachedResvg !== null) return cachedResvg;
  try {
    cachedResvg = await import('@resvg/resvg-js');
    return cachedResvg;
  } catch {
    cachedResvg = false;
    return false;
  }
}

/** Render an SVG string to a PNG buffer, loading any TTF/OTF files from
 *  public/fonts/ so design-system fonts resolve correctly. Returns null
 *  when the resvg module or the fonts directory is unavailable — the
 *  caller should then fall back to sharp's native SVG path. */
export async function renderSvgWithFonts(svg: string): Promise<Buffer | null> {
  const fontFiles = await discoverFonts();
  const resvg = await loadResvg();
  if (!resvg || resvg === false) return null;

  try {
    const r = new resvg.Resvg(svg, {
      font: {
        fontFiles,
        loadSystemFonts: true,
        defaultFontFamily: 'sans-serif',
      },
      background: 'rgba(0,0,0,0)',
    });
    const out = r.render();
    return out.asPng();
  } catch {
    return null;
  }
}

/** Exposed so the composite layer can short-circuit when no fonts are
 *  present (slightly faster, same visual output as the sharp path). */
export async function hasCustomFonts(): Promise<boolean> {
  const f = await discoverFonts();
  return f.length > 0;
}
