// Generate every SEO asset derivative from a single logo source.
//
// Usage:
//   1. Save the brand logo to public/logo-source.png (PNG, ideally
//      transparent background, square or close-to-square aspect).
//   2. Run: node scripts/generate-seo-assets.mjs
//
// Outputs (all in /public):
//   - favicon.ico             — multi-size 16/32/48 (browser tab)
//   - icon.png                — 512×512  (PWA / Next.js icon route)
//   - apple-touch-icon.png    — 180×180  (iOS home screen)
//   - og-default.png          — 1200×630 (Twitter/Slack/Facebook share card)
//
// The script is idempotent — re-run any time the logo changes.

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const sharp = require('/Users/eadayeoh/Desktop/PrintVolution-Tools/node_modules/sharp');

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(root, 'public/logo-source.png');
const PUB = path.join(root, 'public');

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

if (!(await exists(SRC))) {
  console.error(`Source missing: ${SRC}`);
  console.error(`Save the brand logo there as PNG and re-run.`);
  process.exit(1);
}

const srcMeta = await sharp(SRC).metadata();
console.log(`Source: ${srcMeta.width}×${srcMeta.height} ${srcMeta.format}`);

// 1. icon.png — 512×512, transparent bg, mascot centred.
//    Padding so the mascot doesn't kiss the edges on round-iOS masks.
const PAD = 0.12;
const inner = Math.round(512 * (1 - PAD * 2));
const baseLogo = await sharp(SRC).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const icon512 = await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
}).composite([{ input: baseLogo, gravity: 'center' }]).png().toBuffer();
await fs.writeFile(path.join(PUB, 'icon.png'), icon512);
console.log('✓ icon.png (512×512)');

// 2. apple-touch-icon.png — 180×180. iOS adds rounded corners; we
//    bake a solid background tile so it doesn't look ghostly on dark
//    home screens.
const apple = await sharp({
  create: { width: 180, height: 180, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
}).composite([
  { input: await sharp(SRC).resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), gravity: 'center' },
]).png().toBuffer();
await fs.writeFile(path.join(PUB, 'apple-touch-icon.png'), apple);
console.log('✓ apple-touch-icon.png (180×180)');

// 3. favicon.ico — multi-size 16/32/48 packaged into one .ico.
//    sharp doesn't write .ico natively; we use png-to-ico via the
//    raw PNG buffers. If png-to-ico isn't installed, fall back to
//    a single 32×32 PNG renamed favicon.ico — most modern browsers
//    accept PNG-in-.ico.
const fav32 = await sharp(SRC).resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer();
let faviconBytes = fav32;
try {
  const pngToIco = (await import('png-to-ico')).default;
  const sizes = await Promise.all([16, 32, 48].map((s) =>
    sharp(SRC).resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer(),
  ));
  faviconBytes = await pngToIco(sizes);
  console.log('✓ favicon.ico (16+32+48 multi-size)');
} catch {
  console.log('• png-to-ico not installed — writing PNG-as-favicon.ico (browsers accept it)');
}
await fs.writeFile(path.join(PUB, 'favicon.ico'), faviconBytes);

// 4. og-default.png — 1200×630, 5:2.6 aspect. Brand cream background,
//    mascot left-of-centre, bold "Printvolution" wordmark right-of-
//    centre. Used as the fallback OG image for any page that doesn't
//    set its own.
const OG_BG = { r: 254, g: 250, b: 240, alpha: 1 }; // cream
const OG_W = 1200;
const OG_H = 630;
const mascotSize = 480;
const mascot = await sharp(SRC)
  .resize(mascotSize, mascotSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png().toBuffer();

// SVG text overlay — gives us proper typography without bundling fonts.
// Uses sans-serif fallback (system fonts) so it renders on librsvg.
const ogTextSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
  <style>
    .brand { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 900; }
    .tag   { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 600; }
  </style>
  <text x="560" y="290" class="brand" font-size="92" fill="#0a0a0a">Print<tspan fill="#E91E8C">volution</tspan></text>
  <text x="560" y="350" class="tag"   font-size="32" fill="#525252">Printing &amp; Personalised Gifts · Singapore</text>
  <text x="560" y="430" class="tag"   font-size="24" fill="#888888">Same-day express · WhatsApp quote · Paya Lebar Square</text>
</svg>`;
const og = await sharp({
  create: { width: OG_W, height: OG_H, channels: 4, background: OG_BG },
}).composite([
  { input: mascot, top: 75, left: 60 },
  { input: Buffer.from(ogTextSvg), top: 0, left: 0 },
]).png().toBuffer();
await fs.writeFile(path.join(PUB, 'og-default.png'), og);
console.log('✓ og-default.png (1200×630)');

console.log('\nDone. Commit /public/{favicon.ico,icon.png,apple-touch-icon.png,og-default.png}.');
