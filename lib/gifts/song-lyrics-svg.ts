/**
 * Pure SVG string builder for the Song Lyrics Photo Frame template.
 *
 * Used by:
 *   • The client component <SongLyricsTemplate> (live PDP preview).
 *   • The admin server route /api/admin/orders/[id]/items/[itemId]/foil-svg
 *     which re-renders the SVG from the saved cart-line notes for foil
 *     printing — no React, no DOM, no client-only APIs.
 *
 * Geometry constants live here so a single change updates both render paths.
 */

import type { SongLyricsLayout } from '@/components/gift/song-lyrics-template';

// ── Geometry (mm — viewBox is 0 0 100 130) ──────────────────────────────────
export const SL_GEOM = Object.freeze({
  W: 100,
  H: 130,
  FOOTER_TOP: 100,
  cx: 50,
  cy: 50,
  outerR: 38,
  photoR: 13,
  innerR: 14.5,
  turns: 7,
});

const { W, H, FOOTER_TOP, cx, cy, outerR, photoR, innerR, turns } = SL_GEOM;

/** Archimedean spiral path: outer → inner over `turns` revolutions. */
export function buildSpiralPath(): string {
  const totalAngle = turns * Math.PI * 2;
  const drPerRad = (innerR - outerR) / totalAngle;
  const steps = Math.max(240, Math.floor(turns * 80));
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = t * totalAngle;
    const r = outerR + drPerRad * theta;
    const a = theta - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`;
}

export const SPIRAL_D = buildSpiralPath();

// ── Lyrics auto-sizing ──────────────────────────────────────────────────────
export const SL_BASE_FONT = 1.55;
export const SL_BASE_CAP  = 1150;
export const SL_MIN_FONT  = 0.5;

export function autoLyricsFontSize(charCount: number): number {
  if (charCount <= SL_BASE_CAP) return SL_BASE_FONT;
  return Math.max(SL_MIN_FONT, SL_BASE_FONT * (SL_BASE_CAP / charCount));
}

// ── XML-escape (only for text content, not for attribute values built from
//   our own constants — those are always known-safe). ─────────────────────────
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export type BuildSongLyricsSvgInput = {
  photoUrl?: string | null;
  lyrics: string;
  title: string;
  names: string;
  year: string;
  subtitle?: string;
  tagline?: string;
  titleFont?: string;
  namesFont?: string;
  yearFont?: string;
  taglineFont?: string;
  layout?: SongLyricsLayout;
  accentColor?: string;
  foilColor?: string;
  /** When null the background <rect> is omitted — the SVG ships only the
   *  printable foil paths (production handoff). */
  materialColor?: string | null;
};

/** Build the full SVG markup string. Identical output to the client
 *  component's render — both consume the same builder for foreground bits. */
export function buildSongLyricsSvg({
  photoUrl,
  lyrics,
  title,
  names,
  year,
  subtitle = '',
  tagline = '',
  titleFont = 'Playfair Display',
  namesFont,
  yearFont = 'Archivo',
  taglineFont,
  layout = 'song',
  accentColor = '#f7c7d8',
  foilColor = '#d4af37',
  materialColor = '#1a2740',
}: BuildSongLyricsSvgInput): string {
  const isFoil = layout === 'foil';
  const tf = titleFont;
  const nf = namesFont ?? (layout === 'wedding' ? titleFont : 'Dancing Script');
  const yf = yearFont;
  const tagF = taglineFont ?? titleFont;

  const lyricsForRender = lyrics.trim()
    || 'Type your song lyrics in the box on the right and they will spiral around your photo here. Long verses look great. Keep it under 600 characters for clean wrapping.';

  const lyricsFill = isFoil ? foilColor : '#f4f4f4';
  const footerInk  = isFoil ? foilColor : '#0d0d0d';
  const subInk     = isFoil ? foilColor : '#3a3a3a';
  const discInk    = materialColor ?? '#1a2740';

  const fontSize = autoLyricsFontSize(lyricsForRender.length).toFixed(3);

  let body = '';
  body += `<defs>`;
  body += `<radialGradient id="songWash" cx="50%" cy="50%" r="50%">`;
  body += `<stop offset="0%" stop-color="#ffd5e0"/>`;
  body += `<stop offset="60%" stop-color="#fbe7eb"/>`;
  body += `<stop offset="100%" stop-color="#ffffff"/>`;
  body += `</radialGradient>`;
  body += `<clipPath id="songPhotoClip"><circle cx="${cx}" cy="${cy}" r="${photoR}"/></clipPath>`;
  body += `<path id="songLyricsSpiral" d="${SPIRAL_D}"/>`;
  body += `</defs>`;

  if (materialColor !== null) {
    body += `<rect x="0" y="0" width="${W}" height="${H}" fill="${isFoil ? materialColor : '#ffffff'}"/>`;
  }

  if (!isFoil) {
    body += `<rect x="0" y="0" width="${W}" height="${FOOTER_TOP}" fill="${accentColor}" opacity="0.18"/>`;
    body += `<circle cx="${cx}" cy="${cy}" r="46" fill="url(#songWash)"/>`;
    body += `<circle cx="${cx}" cy="${cy}" r="40" fill="#0d0d0d"/>`;
    for (const r of [39, 36, 30, 24, 18]) {
      body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1f1f1f" stroke-width="0.15"/>`;
    }
    if (photoUrl) {
      body += `<image href="${esc(photoUrl)}" x="${cx - photoR}" y="${cy - photoR}" width="${photoR * 2}" height="${photoR * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#songPhotoClip)"/>`;
    } else {
      body += `<circle cx="${cx}" cy="${cy}" r="${photoR}" fill="#2a2a2a"/>`;
      body += `<text x="${cx}" y="${cy + 1}" text-anchor="middle" font-size="2.4" fill="#777" font-family="Archivo, sans-serif" letter-spacing="0.2">PHOTO</text>`;
    }
    body += `<circle cx="${cx}" cy="${cy}" r="0.7" fill="${accentColor}"/>`;
  } else {
    // Foil centre disc
    body += `<circle cx="${cx}" cy="${cy}" r="${photoR + 1}" fill="${foilColor}"/>`;
    body += `<text x="${cx}" y="${cy - 1.2}" text-anchor="middle" font-size="3.2" font-family="${tf}, Georgia, serif" font-weight="700" fill="${discInk}" letter-spacing="0.4">${esc(title.trim() || "CALLIN'")}</text>`;
    body += `<line x1="${cx - 4}" x2="${cx + 4}" y1="${cy + 0.4}" y2="${cy + 0.4}" stroke="${discInk}" stroke-width="0.25"/>`;
    body += `<text x="${cx}" y="${cy + 3.5}" text-anchor="middle" font-size="2.6" font-family="${tf}, Georgia, serif" font-weight="700" fill="${discInk}" letter-spacing="0.5">${esc(subtitle.trim() || 'BATON ROUGE')}</text>`;
  }

  // Spiraling lyrics
  body += `<text font-size="${fontSize}" font-family="Archivo, system-ui, sans-serif" fill="${lyricsFill}" letter-spacing="0.02">`;
  body += `<textPath href="#songLyricsSpiral" startOffset="0%" lengthAdjust="spacingAndGlyphs">${esc(lyricsForRender)}</textPath>`;
  body += `</text>`;

  // Footer
  if (isFoil) {
    body += `<text x="${cx}" y="113" text-anchor="middle" font-size="6.5" font-family="'${nf}', cursive" font-style="italic" fill="${foilColor}">${esc(names.trim() || 'Hello Samantha Dear,')}</text>`;
    body += `<text x="${cx}" y="122" text-anchor="middle" font-size="4" font-family="${tagF}, Georgia, serif" font-style="italic" fill="${foilColor}" letter-spacing="0.2">${esc(tagline.trim() || "I hope you're feelin' fine.")}</text>`;
  } else if (layout === 'wedding') {
    body += `<text x="${cx}" y="108" text-anchor="middle" font-size="7.5" font-family="${nf}, Georgia, serif" font-style="italic" font-weight="600" fill="${footerInk}" letter-spacing="0.4">${esc(names.trim() || 'Mercy & Adam')}</text>`;
    body += `<text x="${cx}" y="117" text-anchor="middle" font-size="4.2" font-family="${yf}, sans-serif" fill="${footerInk}" letter-spacing="0.3">${esc(year.trim() || '27.08.2023')}</text>`;
    body += `<text x="${cx}" y="125" text-anchor="middle" font-size="4.5" font-family="${tf}, Georgia, serif" font-style="italic" fill="${footerInk}" letter-spacing="0.5">${esc(title.trim() || 'OUR FIRST DANCE')}</text>`;
  } else {
    const yearStr = year.trim() || String(new Date().getFullYear());
    body += `<text x="${cx}" y="108" text-anchor="middle" font-size="7" font-family="${tf}, Georgia, serif" font-weight="700" fill="${footerInk}" letter-spacing="0.4">${esc(title.trim() || 'OUR SONG')}</text>`;
    body += `<text x="${cx}" y="117" text-anchor="middle" font-size="5.5" font-family="'${nf}', cursive" fill="${footerInk}">${esc(names.trim() || 'Your & Their Name')}</text>`;
    body += `<line x1="${cx - 4}" x2="${cx + 4}" y1="121" y2="121" stroke="${footerInk}" stroke-width="0.3"/>`;
    body += `<text x="${cx}" y="126" text-anchor="middle" font-size="3" font-family="${yf}, sans-serif" letter-spacing="0.6" fill="${subInk}">EST. ${esc(yearStr)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}
