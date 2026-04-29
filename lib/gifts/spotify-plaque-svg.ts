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
  /** Admin-editable zones from the template's zones_json. When the
   *  array is non-null, it's the source of truth: missing IDs = element
   *  not rendered (admin deleted it); `hidden: true` = also not
   *  rendered (toggled off via the editor's eye icon). When the array
   *  is null/undefined entirely (legacy templates with no zones),
   *  every element falls back to its hardcoded default position. */
  zones?: Array<{ id?: string; type?: string; x_mm?: number; y_mm?: number; width_mm?: number; height_mm?: number; font_family?: string; font_size_mm?: number; font_weight?: string; align?: string; color?: string; hidden?: boolean }> | null;
};

/** Resolve zone position / size into SVG viewBox units. Zones store
 *  positions in the admin editor's 0..200 normalised canvas (the
 *  field names are "x_mm" but the editor's drag math uses TEMPLATE_W=200,
 *  not real millimetres). We map those to the SVG's W/H. */
function zoneToViewbox(
  zone: { x_mm?: number; y_mm?: number; width_mm?: number; height_mm?: number } | undefined,
  _refDims: { width_mm: number; height_mm: number } | null | undefined,
  W: number,
  H: number,
): { x: number; y: number; w: number; h: number } | null {
  if (!zone) return null;
  if (zone.x_mm == null || zone.y_mm == null || zone.width_mm == null || zone.height_mm == null) return null;
  const CANVAS = 200;
  return {
    x: (zone.x_mm / CANVAS) * W,
    y: (zone.y_mm / CANVAS) * H,
    w: (zone.width_mm / CANVAS) * W,
    h: (zone.height_mm / CANVAS) * H,
  };
}

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
  zones,
}: BuildSpotifyPlaqueSvgInput): string {
  const W = 100;
  const H = templateRefDims && templateRefDims.width_mm > 0 && templateRefDims.height_mm > 0
    ? (templateRefDims.height_mm / templateRefDims.width_mm) * W
    : 141.4; // A4 default

  const inkColor = textColor && textColor.trim() ? textColor : '#0a0a0a';
  const subtleGrey = '#7a7a7a';
  const trackGrey = '#d4d4d4';

  // When zones is non-null, treat it as authoritative: only render an
  // element if its zone is present AND not hidden. When null, fall
  // back to legacy hardcoded layout (every element renders).
  const zonesProvided = Array.isArray(zones);
  const findZone = (id: string) => {
    const z = zones?.find((zz) => zz?.id === id);
    if (!z) return undefined;
    if (z.hidden) return undefined;
    return z;
  };
  const shouldRender = (id: string): boolean => {
    if (!zonesProvided) return true;            // legacy → render all
    return findZone(id) !== undefined;          // zoned → only if present + visible
  };
  const zPhoto    = findZone('photo');
  const zTitle    = findZone('song_title');
  const zArtist   = findZone('artist_name');
  const zHeart    = findZone('heart');
  const zProgress = findZone('progress');
  const zControls = findZone('controls');

  // Layout in viewBox units (W=100). Tuned for A4 portrait (H≈141.4) so
  // photo + title/artist/progress/controls + scannable strip stack
  // cleanly without overlap. Anchored bottom-up: scannable strip first,
  // then controls/text rolled up from there.
  const margin = 8;

  // Scannable strip pinned at the bottom (LOCKED — admin can't move).
  const scanW = W - margin * 2;             // 84
  const scanH = scanW / 4;                   // 21 (matches PNG 4:1 aspect)
  const scanX = margin;
  const scanY = H - margin - scanH;

  // Transport controls — admin-editable via zone, else sit above the
  // scannable strip.
  const controlsVb = zoneToViewbox(zControls, templateRefDims, W, H);
  const ctrlSpacing = controlsVb ? Math.min(controlsVb.w / 6, 12) : 9;
  const ctrlY = controlsVb ? controlsVb.y + controlsVb.h / 2 : scanY - 6;
  const ctrlCenterX = controlsVb ? controlsVb.x + controlsVb.w / 2 : W / 2;

  // Progress bar + time markers — admin-editable via zone, else stacked
  // above the controls.
  const progressVb = zoneToViewbox(zProgress, templateRefDims, W, H);
  const progY = progressVb ? progressVb.y + progressVb.h * 0.35 : ctrlY - 8;
  const progLeftX = progressVb ? progressVb.x : margin;
  const progRightX = progressVb ? progressVb.x + progressVb.w : W - margin;
  const progLen = progRightX - progLeftX;
  const progHeadPct = 0.27;               // ~0:36 of 2:15
  // Time markers below the progress bar.
  const timeY = progressVb ? progressVb.y + progressVb.h * 0.85 : progY + 3;
  const timeSize = 2.6;

  // Artist + title — admin-editable via zones if present, else default
  // bottom-up stacking above the progress bar. font_size_mm wins over
  // zone-height-derived sizing so resizing the box doesn't accidentally
  // scale the text.
  const artistVb = zoneToViewbox(zArtist, templateRefDims, W, H);
  const titleVb  = zoneToViewbox(zTitle,  templateRefDims, W, H);
  // Convert font_size_mm (saved in editor's 0..200 canvas units) to
  // viewBox units the same way zoneToViewbox does.
  const fontMmToVb = (mm: number | undefined): number | null =>
    typeof mm === 'number' && Number.isFinite(mm) ? (mm / 200) * W : null;
  const titleSize  = fontMmToVb(zTitle?.font_size_mm)  ?? (titleVb?.h  ? titleVb.h  * 0.85 : 5);
  const artistSize = fontMmToVb(zArtist?.font_size_mm) ?? (artistVb?.h ? artistVb.h * 0.9  : 3.6);
  const artistY = artistVb ? artistVb.y + artistVb.h * 0.65 : progY - 6;
  const artistX = artistVb ? artistVb.x : (titleVb ? titleVb.x : margin);
  const titleY = titleVb ? titleVb.y + titleVb.h * 0.65 : artistY - 5;
  const titleX = titleVb ? titleVb.x : margin;

  // Photo — admin-editable position/size via zone, else fill top.
  // When admin sets a photo zone, clamp the height so it can't extend
  // past the title's top — otherwise a customer's photo bleeds over
  // the title text.
  const photoVb = zoneToViewbox(zPhoto, templateRefDims, W, H);
  const photoX = photoVb ? photoVb.x : margin;
  const photoY = photoVb ? photoVb.y : margin;
  const photoW = photoVb ? photoVb.w : W - margin * 2;
  const photoH = photoVb
    ? Math.min(photoVb.h, Math.max(0, titleY - photoY - 4))
    : Math.min(W - margin * 2, titleY - margin - 4);

  let body = '';

  // ── Photo (square, customer upload) ─────────────────────────────────────
  if (shouldRender('photo')) {
    if (photoUrl) {
      body += `<image href="${esc(photoUrl)}" xlink:href="${esc(photoUrl)}" x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" preserveAspectRatio="xMidYMid slice"/>`;
    } else {
      body += `<rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" fill="${trackGrey}"/>`;
      body += `<text x="${W / 2}" y="${photoY + photoH / 2}" text-anchor="middle" font-size="3.5" font-family="Archivo, sans-serif" fill="${subtleGrey}" font-style="italic">Upload your photo</text>`;
    }
  }

  // ── Title ───────────────────────────────────────────────────────────────
  // Font / weight / colour / alignment come from the zone if admin set
  // them. SVG text-anchor maps left→start, center→middle, right→end.
  const alignToAnchor = (a: string | undefined): string =>
    a === 'right' ? 'end' : a === 'center' ? 'middle' : 'start';
  const xForAnchor = (zone: { x: number; w: number } | null, fallback: number, align: string | undefined): number => {
    if (!zone) return fallback;
    if (align === 'right') return zone.x + zone.w;
    if (align === 'center') return zone.x + zone.w / 2;
    return zone.x;
  };
  const titleFont   = zTitle?.font_family  ?? 'Archivo, sans-serif';
  const titleWeight = zTitle?.font_weight  ?? '700';
  const titleColor  = zTitle?.color        ?? inkColor;
  const titleAnchor = alignToAnchor(zTitle?.align);
  const titleAnchorX = xForAnchor(titleVb, titleX, zTitle?.align);
  if (shouldRender('song_title')) {
    body += `<text x="${titleAnchorX}" y="${titleY + titleSize * 0.35}" font-size="${titleSize}" font-family="${esc(titleFont)}" font-weight="${esc(titleWeight)}" fill="${titleColor}" text-anchor="${titleAnchor}">${esc(songTitle.trim() || 'Your Favourite Song')}</text>`;
  }

  // ── Artist ──────────────────────────────────────────────────────────────
  // Artist line uses the customer-picked text colour but at 65% opacity
  // so the title still reads louder than the artist (Spotify's UI does
  // the same — artist name is muted vs. the title).
  const artistFont   = zArtist?.font_family ?? 'Archivo, sans-serif';
  const artistColor  = zArtist?.color       ?? inkColor;
  const artistAnchor = alignToAnchor(zArtist?.align);
  const artistAnchorX = xForAnchor(artistVb, artistX, zArtist?.align);
  if (shouldRender('artist_name')) {
    body += `<text x="${artistAnchorX}" y="${artistY + artistSize * 0.35}" font-size="${artistSize}" font-family="${esc(artistFont)}" fill="${artistColor}" fill-opacity="0.65" text-anchor="${artistAnchor}">${esc(artistName.trim() || "Artist's Name")}</text>`;
  }

  // ── Heart icon (red, position admin-editable via 'heart' zone) ─────────
  // The heart is a path scaled uniformly — non-square zones would
  // otherwise let admin stretch it. Use the smaller of the two zone
  // dims so the heart fits inside the box without distortion.
  const heartRed = '#FF3B5C';
  const heartVb = zoneToViewbox(zHeart, templateRefDims, W, H);
  const heartSize = heartVb ? Math.min(heartVb.w, heartVb.h) : 4.2;
  const heartScale = heartSize / 24;
  const heartX = heartVb ? heartVb.x + (heartVb.w - heartSize) / 2 : W - margin - heartSize;
  const heartY = heartVb ? heartVb.y + (heartVb.h - heartSize) / 2 : (titleY + artistY) / 2 - heartSize / 2 + 0.5;
  if (shouldRender('heart')) {
    body += `<path transform="translate(${heartX} ${heartY}) scale(${heartScale.toFixed(4)})" d="M 12 21.35 l -1.45 -1.32 C 5.4 16.36 2 13.28 2 9.5 C 2 6.42 4.42 4 7.5 4 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 4.81 14.76 4 16.5 4 C 19.58 4 22 6.42 22 9.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 z" fill="${heartRed}"/>`;
  }

  // ── Progress bar + time markers ────────────────────────────────────────
  if (shouldRender('progress')) {
    body += `<line x1="${progLeftX}" y1="${progY}" x2="${progRightX}" y2="${progY}" stroke="${trackGrey}" stroke-width="0.4" stroke-linecap="round"/>`;
    body += `<line x1="${progLeftX}" y1="${progY}" x2="${progLeftX + progLen * progHeadPct}" y2="${progY}" stroke="${inkColor}" stroke-width="0.4" stroke-linecap="round"/>`;
    body += `<circle cx="${progLeftX + progLen * progHeadPct}" cy="${progY}" r="0.9" fill="${inkColor}"/>`;
    body += `<text x="${progLeftX}" y="${timeY}" font-size="${timeSize}" font-family="Archivo, sans-serif" fill="${inkColor}" fill-opacity="0.65">0:36</text>`;
    body += `<text x="${progRightX}" y="${timeY}" text-anchor="end" font-size="${timeSize}" font-family="Archivo, sans-serif" fill="${inkColor}" fill-opacity="0.65">2:15</text>`;
  }

  // ── Transport controls (shuffle, prev, play, next, repeat) ──────────────
  if (shouldRender('controls')) {
  const cy = ctrlY;
  const cxCenter = ctrlCenterX;
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
  } // end shouldRender('controls')

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
