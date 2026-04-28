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

export type SpotifyScanCodeColor = 'black' | 'white';

export function spotifyScannableUrl(
  trackId: string,
  codeColor: SpotifyScanCodeColor = 'black',
): string {
  // Public no-auth endpoint. The opposite-tone background gives the bars
  // contrast inside the PNG; the React preview knocks the background out
  // with mix-blend-mode (darken for black bars, lighten for white bars)
  // so the plaque looks transparent regardless of the chosen colour.
  const bg = codeColor === 'white' ? '000000' : 'FFFFFF';
  return `https://scannables.scdn.co/uri/plain/png/${bg}/${codeColor}/640/spotify:track:${trackId}`;
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
  /** When true, skip rendering the scan-code area (image or placeholder)
   *  so the caller can overlay one with a regular HTML <img>. SVG <image>
   *  with cross-origin URLs does not load reliably when the SVG is
   *  injected via React's dangerouslySetInnerHTML — using a plain HTML
   *  <img> dodges that. The print pipeline uses the default false. */
  omitScanCode?: boolean;
  /** Customer-picked text + icon colour (title, artist, controls,
   *  progress bar, time markers). Defaults to near-black ink. */
  textColor?: string;
  /** Black (default) or white scan-code bars. White is for darker
   *  backgrounds — the React preview blends the inverted background out. */
  scanCodeColor?: SpotifyScanCodeColor;
};

/** Layout constants exported so React previews can position an HTML
 *  <img> overlay that lines up with what the SVG renderer would produce
 *  if it were embedding the image itself. */
export function spotifyPlaqueScanRect(
  templateRefDims?: { width_mm: number; height_mm: number } | null,
): { xPct: number; yPct: number; widthPct: number; heightPct: number } {
  const W = 100;
  const H = templateRefDims && templateRefDims.width_mm > 0 && templateRefDims.height_mm > 0
    ? (templateRefDims.height_mm / templateRefDims.width_mm) * W
    : 141.4;
  const margin = 8;
  const scanW = W - margin * 2;
  const scanH = scanW / 4;
  const scanX = margin;
  const scanY = H - margin - scanH;
  return {
    xPct: (scanX / W) * 100,
    yPct: (scanY / H) * 100,
    widthPct: (scanW / W) * 100,
    heightPct: (scanH / H) * 100,
  };
}

export function buildSpotifyPlaqueSvg({
  photoUrl,
  songTitle,
  artistName,
  spotifyTrackId,
  templateRefDims,
  omitScanCode = false,
  textColor,
  scanCodeColor = 'black',
}: BuildSpotifyPlaqueSvgInput): string {
  const W = 100;
  const H = templateRefDims && templateRefDims.width_mm > 0 && templateRefDims.height_mm > 0
    ? (templateRefDims.height_mm / templateRefDims.width_mm) * W
    : 141.4; // A4 default

  const inkColor = textColor && textColor.trim() ? textColor : '#0a0a0a';
  const subtleGrey = '#7a7a7a';
  const trackGrey = '#d4d4d4';

  // Layout in viewBox units (W=100). Tuned for A4 portrait (H≈141.4) so
  // photo + title/artist/progress/controls + scannable strip stack
  // cleanly without overlap. Anchored bottom-up: scannable strip first,
  // then controls/text rolled up from there.
  const margin = 8;
  const photoX = margin;
  const photoW = W - margin * 2;          // 84

  // Scannable strip pinned at the bottom. The Spotify scannables PNG
  // already bundles the logo + bars in a single 4:1 image (640×160), so
  // we use the full content width and let the strip's height follow that
  // aspect — no hand-drawn logo, no cropping.
  const scanW = W - margin * 2;             // 84
  const scanH = scanW / 4;                   // 21 (matches PNG 4:1 aspect)
  const scanX = margin;
  const scanY = H - margin - scanH;

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

  // ── Photo (square, customer upload) ─────────────────────────────────────
  if (photoUrl) {
    body += `<image href="${esc(photoUrl)}" xlink:href="${esc(photoUrl)}" x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" preserveAspectRatio="xMidYMid slice"/>`;
  } else {
    body += `<rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" fill="${trackGrey}"/>`;
    body += `<text x="${W / 2}" y="${photoY + photoH / 2}" text-anchor="middle" font-size="3.5" font-family="Archivo, sans-serif" fill="${subtleGrey}" font-style="italic">Upload your photo</text>`;
  }

  // ── Title ───────────────────────────────────────────────────────────────
  body += `<text x="${titleX}" y="${titleY + titleSize * 0.35}" font-size="${titleSize}" font-family="Archivo, sans-serif" font-weight="700" fill="${inkColor}">${esc(songTitle.trim() || 'Your Favourite Song')}</text>`;

  // ── Artist ──────────────────────────────────────────────────────────────
  // Artist line uses the customer-picked text colour but at 65% opacity
  // so the title still reads louder than the artist (Spotify's UI does
  // the same — artist name is muted vs. the title).
  body += `<text x="${titleX}" y="${artistY + artistSize * 0.35}" font-size="${artistSize}" font-family="Archivo, sans-serif" fill="${inkColor}" fill-opacity="0.65">${esc(artistName.trim() || "Artist's Name")}</text>`;

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

  // ── Time markers (muted via 65% opacity, same hue as the title) ────────
  body += `<text x="${progLeftX}" y="${timeY}" font-size="${timeSize}" font-family="Archivo, sans-serif" fill="${inkColor}" fill-opacity="0.65">0:36</text>`;
  body += `<text x="${progRightX}" y="${timeY}" text-anchor="end" font-size="${timeSize}" font-family="Archivo, sans-serif" fill="${inkColor}" fill-opacity="0.65">2:15</text>`;

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

  // ── Spotify scannable strip ─────────────────────────────────────────────
  // The PNG from scannables.scdn.co already includes the Spotify logo on
  // the left and the bars on the right in a single 4:1 image — no need
  // to draw our own logo. omitScanCode lets the React preview skip this
  // section and overlay a plain HTML <img> instead, because SVG <image>
  // with a cross-origin URL does not render reliably when injected via
  // dangerouslySetInnerHTML.
  if (!omitScanCode) {
    if (spotifyTrackId) {
      const scanUrl = spotifyScannableUrl(spotifyTrackId);
      body += `<image href="${esc(scanUrl)}" xlink:href="${esc(scanUrl)}" x="${scanX}" y="${scanY}" width="${scanW}" height="${scanH}" preserveAspectRatio="xMidYMid meet"/>`;
    } else {
      body += `<rect x="${scanX}" y="${scanY}" width="${scanW}" height="${scanH}" fill="${trackGrey}"/>`;
      body += `<text x="${scanX + scanW / 2}" y="${scanY + scanH / 2 + 1}" text-anchor="middle" font-size="3.2" font-family="Archivo, sans-serif" fill="${subtleGrey}" font-style="italic">Paste a Spotify URL</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}
