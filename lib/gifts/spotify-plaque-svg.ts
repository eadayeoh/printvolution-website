/**
 * Spotify Music Plaque renderer.
 *
 * Builds a printable SVG of a UV-printed acrylic plaque mimicking the
 * Spotify "now playing" UI: customer photo on top, song title + artist,
 * progress bar mock, transport controls, Spotify logo + scannable code
 * at the bottom. Customer pastes any Spotify track URL — the track ID
 * is parsed and the official Spotify scannable code is hot-linked from
 * scannables.scdn.co (no API key needed).
 *
 * ViewBox is 100 × (height-from-template-ref) so the SVG aspect
 * matches the linked template's reference dimensions; A4 portrait
 * (210×297mm) gives 100×141.4 by default.
 */

const SPOTIFY_TRACK_URL_RE = /(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/|spotify:track:)([a-zA-Z0-9]+)/;

export function parseSpotifyTrackId(input: string): string | null {
  if (!input) return null;
  const m = input.match(SPOTIFY_TRACK_URL_RE);
  return m ? m[1] : null;
}

export function spotifyScannableUrl(trackId: string): string {
  // Public no-auth endpoint. White bg, black bars, 640px PNG.
  return `https://scannables.scdn.co/uri/plain/png/FFFFFF/black/640/spotify:track:${trackId}`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export type BuildSpotifyPlaqueSvgInput = {
  /** Customer photo URL (or null for placeholder). */
  photoUrl: string | null;
  songTitle: string;
  artistName: string;
  /** Spotify track ID parsed from the URL the customer pasted. Null
   *  during early input — we render an empty rectangle instead of a
   *  bogus scannable. */
  spotifyTrackId: string | null;
  /** Optional template ref dims so the canvas aspect locks to the
   *  product's print dimensions. A4 portrait → 100×141.4 viewBox. */
  templateRefDims?: { width_mm: number; height_mm: number } | null;
};

export function buildSpotifyPlaqueSvg({
  photoUrl,
  songTitle,
  artistName,
  spotifyTrackId,
  templateRefDims,
}: BuildSpotifyPlaqueSvgInput): string {
  const W = 100;
  const H = templateRefDims && templateRefDims.width_mm > 0 && templateRefDims.height_mm > 0
    ? (templateRefDims.height_mm / templateRefDims.width_mm) * W
    : 141.4; // A4 default

  const inkColor = '#0a0a0a';
  const subtleGrey = '#7a7a7a';
  const trackGrey = '#d4d4d4';

  // Layout in viewBox units (W=100). Tuned for A4 portrait (H≈141.4) so
  // photo + title/artist/progress/controls + scannable strip stack
  // cleanly without overlap. Anchored bottom-up: scannable strip first,
  // then controls/text rolled up from there.
  const margin = 8;
  const photoX = margin;
  const photoW = W - margin * 2;          // 84

  // Scannable strip pinned at the bottom.
  const scanH = 12;
  const scanY = H - margin - scanH;
  const scanLogoR = 3.5;
  const scanLogoX = photoX + scanLogoR;
  const scanCodeX = scanLogoX + scanLogoR + 3;
  const scanCodeW = (W - margin) - scanCodeX;

  // Transport controls sit above the scannable strip.
  const ctrlSpacing = 9;
  const ctrlY = scanY - 6;

  // Time markers above the controls.
  const timeY = ctrlY - 5;
  const timeSize = 2.6;

  // Progress bar above the time markers.
  const progY = timeY - 3;
  const progLeftX = photoX;
  const progRightX = W - margin;
  const progLen = progRightX - progLeftX;
  const progHeadPct = 0.27;               // ~0:36 of 2:15

  // Artist line above the progress bar.
  const artistSize = 3.6;
  const artistY = progY - 6;

  // Title above the artist line.
  const titleSize = 5;
  const titleY = artistY - 5;
  const titleX = photoX;

  // Photo fills the remaining top space, capped to a sensible square-ish
  // crop so it doesn't dwarf the footer block.
  const photoY = margin;
  const photoH = Math.min(photoW, titleY - photoY - 4);

  let body = '';

  // White acrylic background
  body += `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;

  // ── Photo (square, customer upload) ─────────────────────────────────────
  if (photoUrl) {
    body += `<image href="${esc(photoUrl)}" x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" preserveAspectRatio="xMidYMid slice"/>`;
  } else {
    body += `<rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" fill="${trackGrey}"/>`;
    body += `<text x="${W / 2}" y="${photoY + photoH / 2}" text-anchor="middle" font-size="3.5" font-family="Archivo, sans-serif" fill="${subtleGrey}" font-style="italic">Upload your photo</text>`;
  }

  // ── Title ───────────────────────────────────────────────────────────────
  body += `<text x="${titleX}" y="${titleY + titleSize * 0.35}" font-size="${titleSize}" font-family="Archivo, sans-serif" font-weight="700" fill="${inkColor}">${esc(songTitle.trim() || 'Your Favourite Song')}</text>`;

  // ── Artist ──────────────────────────────────────────────────────────────
  body += `<text x="${titleX}" y="${artistY + artistSize * 0.35}" font-size="${artistSize}" font-family="Archivo, sans-serif" fill="${subtleGrey}">${esc(artistName.trim() || "Artist's Name")}</text>`;

  // ── Heart icon (red, right-aligned with title/artist block) ────────────
  // Material-icons "favorite" path scaled into viewBox units. Sits
  // between the title and artist baselines, right edge flush with the
  // progress bar's right edge so it lines up with the time stamp below.
  const heartRed = '#FF3B5C';
  const heartSize = 4.2;
  const heartScale = heartSize / 24;
  const heartX = W - margin - heartSize;
  const heartY = (titleY + artistY) / 2 - heartSize / 2 + 0.5;
  body += `<path transform="translate(${heartX} ${heartY}) scale(${heartScale.toFixed(4)})" d="M 12 21.35 l -1.45 -1.32 C 5.4 16.36 2 13.28 2 9.5 C 2 6.42 4.42 4 7.5 4 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 4.81 14.76 4 16.5 4 C 19.58 4 22 6.42 22 9.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 z" fill="${heartRed}"/>`;

  // ── Progress bar ────────────────────────────────────────────────────────
  body += `<line x1="${progLeftX}" y1="${progY}" x2="${progRightX}" y2="${progY}" stroke="${trackGrey}" stroke-width="0.4" stroke-linecap="round"/>`;
  body += `<line x1="${progLeftX}" y1="${progY}" x2="${progLeftX + progLen * progHeadPct}" y2="${progY}" stroke="${inkColor}" stroke-width="0.4" stroke-linecap="round"/>`;
  body += `<circle cx="${progLeftX + progLen * progHeadPct}" cy="${progY}" r="0.9" fill="${inkColor}"/>`;

  // ── Time markers ────────────────────────────────────────────────────────
  body += `<text x="${progLeftX}" y="${timeY}" font-size="${timeSize}" font-family="Archivo, sans-serif" fill="${subtleGrey}">0:36</text>`;
  body += `<text x="${progRightX}" y="${timeY}" text-anchor="end" font-size="${timeSize}" font-family="Archivo, sans-serif" fill="${subtleGrey}">2:15</text>`;

  // ── Transport controls (shuffle, prev, play, next, repeat) ──────────────
  const cy = ctrlY;
  const cxCenter = W / 2;
  const cxPrev = cxCenter - ctrlSpacing;
  const cxNext = cxCenter + ctrlSpacing;
  const cxShuffle = cxPrev - ctrlSpacing;
  const cxRepeat = cxNext + ctrlSpacing;
  const ctrlStroke = inkColor;
  // Shuffle (X-cross arrows)
  body += `<g stroke="${ctrlStroke}" stroke-width="0.45" fill="none" stroke-linecap="round">`;
  body += `<path d="M ${cxShuffle - 2.5} ${cy - 1} h 1 q 1 0 1.5 1 l 1.5 2 q 0.5 1 1.5 1 h 1"/>`;
  body += `<path d="M ${cxShuffle - 2.5} ${cy + 1} h 1 q 1 0 1.5 -1 l 1.5 -2 q 0.5 -1 1.5 -1 h 1"/>`;
  body += `</g>`;
  // Prev (▮◀)
  body += `<g fill="${ctrlStroke}">`;
  body += `<rect x="${cxPrev - 2}" y="${cy - 1.7}" width="0.5" height="3.4"/>`;
  body += `<polygon points="${cxPrev + 1.5},${cy - 1.7} ${cxPrev + 1.5},${cy + 1.7} ${cxPrev - 1.2},${cy}"/>`;
  body += `</g>`;
  // Play (filled circle with triangle)
  body += `<circle cx="${cxCenter}" cy="${cy}" r="3.2" fill="${ctrlStroke}"/>`;
  body += `<polygon points="${cxCenter - 1.1},${cy - 1.6} ${cxCenter - 1.1},${cy + 1.6} ${cxCenter + 1.6},${cy}" fill="#ffffff"/>`;
  // Next (▶▮)
  body += `<g fill="${ctrlStroke}">`;
  body += `<polygon points="${cxNext - 1.5},${cy - 1.7} ${cxNext - 1.5},${cy + 1.7} ${cxNext + 1.2},${cy}"/>`;
  body += `<rect x="${cxNext + 1.5}" y="${cy - 1.7}" width="0.5" height="3.4"/>`;
  body += `</g>`;
  // Repeat (rectangular loop)
  body += `<g stroke="${ctrlStroke}" stroke-width="0.45" fill="none" stroke-linecap="round">`;
  body += `<path d="M ${cxRepeat - 2.5} ${cy - 0.8} v -0.7 q 0 -0.6 0.6 -0.6 h 4 q 0.6 0 0.6 0.6 v 1.5"/>`;
  body += `<path d="M ${cxRepeat + 2.5} ${cy + 0.8} v 0.7 q 0 0.6 -0.6 0.6 h -4 q -0.6 0 -0.6 -0.6 v -1.5"/>`;
  body += `<polyline points="${cxRepeat + 1.5},${cy - 2.2} ${cxRepeat + 2.7},${cy - 1.6} ${cxRepeat + 1.5},${cy - 1}"/>`;
  body += `</g>`;

  // ── Spotify logo + scannable code strip ─────────────────────────────────
  // Spotify circle logo (simplified — green circle with three sound waves).
  body += `<circle cx="${scanLogoX}" cy="${scanY + scanH / 2}" r="${scanLogoR}" fill="#1DB954"/>`;
  body += `<g stroke="#ffffff" stroke-width="0.55" fill="none" stroke-linecap="round">`;
  body += `<path d="M ${scanLogoX - scanLogoR * 0.6} ${scanY + scanH / 2 - 1.2} q ${scanLogoR * 0.6} -0.6 ${scanLogoR * 1.2} 0"/>`;
  body += `<path d="M ${scanLogoX - scanLogoR * 0.5} ${scanY + scanH / 2} q ${scanLogoR * 0.5} -0.5 ${scanLogoR} 0"/>`;
  body += `<path d="M ${scanLogoX - scanLogoR * 0.4} ${scanY + scanH / 2 + 1.2} q ${scanLogoR * 0.4} -0.4 ${scanLogoR * 0.8} 0"/>`;
  body += `</g>`;

  // Scannable barcode — lifted from Spotify's public scannables endpoint.
  // Cropped to remove their built-in white margins so it sits flush
  // alongside the logo. preserveAspectRatio=none stretches to the bar
  // shape we want; the bars themselves are vertical strokes so they
  // stay legible under non-uniform scale.
  if (spotifyTrackId) {
    const scanUrl = spotifyScannableUrl(spotifyTrackId);
    body += `<image href="${esc(scanUrl)}" x="${scanCodeX}" y="${scanY}" width="${scanCodeW}" height="${scanH}" preserveAspectRatio="xMidYMid slice"/>`;
  } else {
    body += `<rect x="${scanCodeX}" y="${scanY + scanH / 2 - 2}" width="${scanCodeW}" height="4" fill="${trackGrey}"/>`;
    body += `<text x="${scanCodeX + scanCodeW / 2}" y="${scanY + scanH / 2 + 0.8}" text-anchor="middle" font-size="2.2" font-family="Archivo, sans-serif" fill="${subtleGrey}" font-style="italic">Paste a Spotify URL</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}
