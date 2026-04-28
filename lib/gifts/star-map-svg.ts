/**
 * Star Map Photo Frame — vector pipeline.
 *
 * Pure compute. Given (lat, lng, date_UTC) we project the bundled
 * STARS catalogue from equatorial → horizontal → stereographic disk
 * and emit a foil-printable SVG.
 *
 * Used by:
 *   • The client component <StarMapTemplate> (live PDP preview).
 *   • The admin server route /api/admin/orders/[id]/items/[itemId]/star-map-svg
 *     which re-renders the SVG from the saved cart-line notes.
 *
 * No network, no DOM. Same builder runs in the browser and on Vercel.
 */

import { STARS, CONSTELLATIONS, type CatStar } from './star-catalogue';
import type { GiftTemplateZone, GiftTemplateTextZone, GiftTemplateRenderAnchorZone } from './types';

// ── Geometry (mm — viewBox is 0 0 W H) ──────────────────────────────────────
//
// 100×130 to match the City Map frame so admins can use the same template
// dimensions. Star disk is centred horizontally with footer block underneath.
export const SM_GEOM = Object.freeze({
  W: 100,
  H: 130,
  CX: 50,
  CY: 50,           // centre of the star disk
  R:  44,           // disk radius (88 mm diameter)
  FOOTER_TOP: 100,
});

// Visual magnitude → stroke radius (mm). Tuned so the brightest stars
// (mag <= 0) print as clearly visible 0.6 mm dots and the dimmest naked-eye
// stars (mag ~5) print as ~0.06 mm specks. Below ~0.05 mm the foil press
// can't hold detail, so STAR_MIN_R is the floor.
const STAR_MIN_R = 0.06;
const STAR_MAX_R = 0.65;

function magToRadius(mag: number): number {
  // Linear interpolation between mag -1.5 (Sirius range) → MAX and mag 6 → MIN.
  const t = Math.max(0, Math.min(1, (6 - mag) / 7.5));
  // Squared so the bright stars stay visually dominant on the print.
  return STAR_MIN_R + (STAR_MAX_R - STAR_MIN_R) * (t * t);
}

// ── Time / sidereal time ────────────────────────────────────────────────────

/**
 * Julian Date for a given UTC moment. `date` is interpreted as UTC.
 *
 * Standard Meeus formula (Astronomical Algorithms, ch. 7).
 */
export function julianDay(date: Date): number {
  const Y = date.getUTCFullYear();
  const M = date.getUTCMonth() + 1;
  const D = date.getUTCDate()
    + date.getUTCHours() / 24
    + date.getUTCMinutes() / 1440
    + date.getUTCSeconds() / 86400;

  let y = Y;
  let m = M;
  if (m <= 2) { y -= 1; m += 12; }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return Math.floor(365.25 * (y + 4716))
    + Math.floor(30.6001 * (m + 1))
    + D + B - 1524.5;
}

/**
 * Greenwich Mean Sidereal Time (hours, modulo 24).
 *
 * Meeus 1998 (Astronomical Algorithms, eq. 12.4) — accurate to better than
 * 1 arcsec across any date in the next 5,000 years, orders of magnitude
 * tighter than the 88 mm print can resolve. Takes a full JD (fractional UT
 * included) and returns GMST in hours.
 */
export function gmstHours(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  let deg = 280.46061837
    + 360.98564736629 * (jd - 2451545.0)
    + T * T * (0.000387933 - T / 38710000);
  deg = ((deg % 360) + 360) % 360;
  return deg / 15;
}

// ── Equatorial → Horizontal → Stereographic ─────────────────────────────────

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/**
 * Project a star onto the disk for an observer at (lat, lng) at time `jd`.
 * Returns null if the star is below the horizon (alt <= 0).
 *
 * Coordinate convention: north up, east left — matches a real "lying on
 * the ground looking up" view. (East-left is standard for star charts.)
 */
function projectStar(
  ra: number, dec: number,
  observerLat: number, observerLng: number,
  jd: number,
): [number, number] | null {
  const lst = (gmstHours(jd) + observerLng / 15) % 24;     // hours
  const ha = (lst - ra) * 15;                              // degrees

  const haR = ha * D2R;
  const decR = dec * D2R;
  const latR = observerLat * D2R;

  const sinAlt = Math.sin(decR) * Math.sin(latR)
    + Math.cos(decR) * Math.cos(latR) * Math.cos(haR);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));   // radians

  if (alt <= 0) return null;

  const cosAz = (Math.sin(decR) - sinAlt * Math.sin(latR))
    / (Math.cos(alt) * Math.cos(latR));
  const sinAz = -Math.sin(haR) * Math.cos(decR) / Math.cos(alt);
  const az = Math.atan2(sinAz, cosAz);                     // radians

  // Stereographic from the zenith. r = R * tan((90° - alt) / 2).
  const zenithDist = (Math.PI / 2) - alt;                  // radians
  const r = SM_GEOM.R * Math.tan(zenithDist / 2);

  // East-left convention: x grows west, but azimuth is measured east of
  // north. So we flip the sin component.
  const x = SM_GEOM.CX - r * Math.sin(az);
  const y = SM_GEOM.CY - r * Math.cos(az);

  return [x, y];
}

// ── Compute the projected scene ─────────────────────────────────────────────

export type StarMapScene = {
  /** Stars that are above the horizon, with projected x/y in mm. */
  stars: Array<{ x: number; y: number; mag: number; name?: string; idx: number }>;
  /** Constellation line segments for stars that are both above the horizon. */
  constellations: Array<{ name: string; segments: Array<[number, number, number, number]> }>;
  /** The (lat, lng, jd) the scene was built for — handy for re-renders. */
  meta: { lat: number; lng: number; jd: number };
};

export function buildStarMapScene(
  lat: number, lng: number, dateUtc: Date,
): StarMapScene {
  const jd = julianDay(dateUtc);
  const projected: Array<[number, number] | null> = STARS.map((s) =>
    projectStar(s.ra, s.dec, lat, lng, jd),
  );

  const stars: StarMapScene['stars'] = [];
  STARS.forEach((s: CatStar, i) => {
    const p = projected[i];
    if (!p) return;
    // Inside the disk? Stereographic projection from the zenith puts the
    // horizon exactly at r = R * tan(45°) = R, so any visible star is
    // automatically inside.
    stars.push({ x: p[0], y: p[1], mag: s.mag, name: s.name, idx: i });
  });

  const constellations: StarMapScene['constellations'] = [];
  for (const c of CONSTELLATIONS) {
    const segments: Array<[number, number, number, number]> = [];
    for (const [a, b] of c.lines) {
      const pa = projected[a];
      const pb = projected[b];
      if (!pa || !pb) continue;
      segments.push([pa[0], pa[1], pb[0], pb[1]]);
    }
    if (segments.length) constellations.push({ name: c.name, segments });
  }

  return { stars, constellations, meta: { lat, lng, jd } };
}

// ── XML escape ──────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Date formatter (display only — not used in compute) ─────────────────────
function fmtDate(d: Date): string {
  // "12 March 2018" — full month name, no comma. Matches the magazine voice.
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

function fmtTime(d: Date): string {
  // "21:00 UTC"
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} UTC`;
}

// ── SVG composition ─────────────────────────────────────────────────────────

/**
 * Visual styles. The astronomical engine is identical for both — what
 * differs is colour palette, footer composition, and decorative chrome.
 *
 *   • 'foil'   — gold-on-navy, cardinal N/S/E/W marks, narrow geometric
 *                footer block. Designed for foil-printed acrylic frames.
 *   • 'poster' — black ink on white, thin double border around the canvas,
 *                em-dash flanked subtitle, taller aspect ratio (A3-ish).
 *                Designed for paper-stock prints.
 */
export type StarMapLayout = 'foil' | 'poster';

export type BuildStarMapSvgInput = {
  scene: StarMapScene | null;
  /** UTC date/time the sky is computed for — included for footer display. */
  dateUtc: Date | null;
  /** Top names line, e.g. "EVA & JOHN". */
  names: string;
  /** Subtitle under names — typically the event ("OUR FIRST KISS"). */
  event: string;
  /** Big location label. */
  locationLabel: string;
  /** Tagline italic. */
  tagline: string;
  /** Optional coords + date string under the disk. */
  coordinates?: string;
  /** Show constellation connecting lines? Default true. */
  showLines?: boolean;
  /** Show constellation name labels next to bright stars? Default false. */
  showLabels?: boolean;
  namesFont?: string;
  eventFont?: string;
  locationFont?: string;
  taglineFont?: string;
  layout?: StarMapLayout;
  foilColor?: string;
  /** Material colour behind the foil. null drops the background <rect> for
   *  the foil printer (only the gold paths ship). */
  materialColor?: string | null;
  /** Optional admin-authored layout zones from the template editor.
   *  Recognised:
   *    - render_anchor with anchor_kind='star_disk'  → sky disk position + size
   *    - text zone id='star_names'    → top names line
   *    - text zone id='star_event'    → event subtitle
   *    - text zone id='star_location' → big location label
   *    - text zone id='star_tagline'  → italic tagline
   *    - text zone id='star_caption'  → coords/date caption (under disk)
   *  Each text zone honours its own font_family / font_size_mm /
   *  color / align / text_transform / letter_spacing_em. Anything not
   *  found in zones falls back to the renderer's hardcoded defaults so
   *  existing call sites and templates without zones keep working. */
  zones?: GiftTemplateZone[] | null;
};

// ── Zone helpers ────────────────────────────────────────────────────────────
//
// Template zones use the editor's 0..200 canvas units for both axes. The
// star map renderer's viewBox is 100×130 (foil) or 100×140 (poster). We
// scale zone x → svg by W/200 and y → svg by H/200.

function findTextZone(zones: GiftTemplateZone[] | null | undefined, id: string): GiftTemplateTextZone | null {
  if (!zones) return null;
  for (const z of zones) {
    if (z.type === 'text' && z.id === id) return z;
  }
  return null;
}

function findRenderAnchor(zones: GiftTemplateZone[] | null | undefined, kind: string): GiftTemplateRenderAnchorZone | null {
  if (!zones) return null;
  for (const z of zones) {
    if (z.type === 'render_anchor' && (z as GiftTemplateRenderAnchorZone).anchor_kind === kind) {
      return z as GiftTemplateRenderAnchorZone;
    }
  }
  return null;
}

function emitZoneText(
  zone: GiftTemplateTextZone | null,
  W: number, H: number, scale: number,
  text: string,
  defaults: {
    cx: number; y: number;
    size: number;
    fontFamily: string;
    fill: string;
    /** When set, overrides BOTH zone.color and defaults.fill — used when
     *  the customer picks a foil colour via customer_picker_role='foil_overlay'.
     *  The pick is meant to retint every foil element on the layout, so the
     *  template's per-zone hardcoded colour must yield to it. */
    customerForcedFill?: string;
    weight?: string;
    italic?: boolean;
    letterSpacing?: number;
    transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    /** When set, the rendered text is constrained to this width (in
     *  viewBox units). SVG's textLength + lengthAdjust shrinks long
     *  strings to fit instead of overflowing the foil disk's footer. */
    maxWidth?: number;
  },
): string {
  // Resolve actual draw params: zone overrides → defaults.
  const anchor = (zone?.align ?? 'center') === 'left'
    ? 'start' : (zone?.align ?? 'center') === 'right' ? 'end' : 'middle';
  const x = zone
    ? (zone.x_mm + (anchor === 'middle' ? zone.width_mm / 2 : anchor === 'end' ? zone.width_mm : 0)) * (W / 200)
    : defaults.cx;
  const y = zone
    ? (zone.y_mm + zone.height_mm / 2) * (H / 200)
    : defaults.y;
  const size = (zone?.font_size_mm ?? defaults.size / scale) * scale;
  const fontFamily = zone?.font_family ?? defaults.fontFamily;
  const fill = defaults.customerForcedFill ?? zone?.color ?? defaults.fill;
  const weight = zone?.font_weight ?? defaults.weight ?? '400';
  const italic = (zone?.font_style === 'italic') || defaults.italic;
  const letter = zone?.letter_spacing_em ?? defaults.letterSpacing ?? 0;
  const transform = zone?.text_transform ?? defaults.transform ?? 'none';

  // Apply text_transform — SVG doesn't support CSS text-transform, so
  // we munge the string before output.
  const munged =
    transform === 'uppercase' ? text.toUpperCase()
    : transform === 'lowercase' ? text.toLowerCase()
    : transform === 'capitalize' ? text.replace(/\b\w/g, (c) => c.toUpperCase())
    : text;

  // Auto-shrink to fit the foil disk footer width. Estimate the natural
  // text width (uppercase Playfair ≈ 0.7 × font-size per char) and only
  // emit textLength when the string would actually overflow — short
  // strings keep their natural rendering instead of getting stretched.
  const naturalWidth = munged.length * size * 0.7 + Math.max(0, munged.length - 1) * letter;
  const fitAttrs = defaults.maxWidth && naturalWidth > defaults.maxWidth
    ? ` textLength="${defaults.maxWidth.toFixed(2)}" lengthAdjust="spacingAndGlyphs"`
    : '';

  const dyForCenter = size * 0.35;   // approximate baseline shim
  const out = `<text x="${x.toFixed(2)}" y="${(y + dyForCenter).toFixed(2)}" text-anchor="${anchor}" font-size="${size.toFixed(2)}" font-family="${fontFamily}, sans-serif" letter-spacing="${letter}"${italic ? ' font-style="italic"' : ''}${weight !== '400' ? ` font-weight="${weight}"` : ''} fill="${fill}"${fitAttrs}>${esc(munged)}</text>`;
  return out;
}

export function buildStarMapSvg({
  scene,
  dateUtc,
  names,
  event,
  locationLabel,
  tagline,
  coordinates,
  showLines = true,
  showLabels = false,
  namesFont,
  eventFont,
  locationFont,
  taglineFont,
  layout = 'foil',
  foilColor,
  materialColor,
  zones,
}: BuildStarMapSvgInput): string {
  const isPoster = layout === 'poster';

  // Layout-driven palette + canvas. The astronomy compute is identical;
  // only chrome and colours change.
  const W = isPoster ? 100 : SM_GEOM.W;
  const H = isPoster ? 140 : SM_GEOM.H;
  // Default disk position. If the template carries a render_anchor with
  // anchor_kind='star_disk', we let the admin override the disk's
  // centre + radius — the editor in 0..200 canvas units, scaled into
  // the renderer viewBox (100 × 130/140) here.
  const diskAnchor = findRenderAnchor(zones, 'star_disk');
  const CX = diskAnchor
    ? (diskAnchor.x_mm + diskAnchor.width_mm / 2) * (W / 200)
    : W / 2;
  const CY = diskAnchor
    ? (diskAnchor.y_mm + diskAnchor.height_mm / 2) * (H / 200)
    : (isPoster ? 53 : SM_GEOM.CY);
  const R = diskAnchor
    // Use the smaller of the two half-extents so the disk always fits
    // inside the rectangle the admin drew.
    ? Math.min(diskAnchor.width_mm * (W / 200), diskAnchor.height_mm * (H / 200)) / 2
    : (isPoster ? 38 : SM_GEOM.R);

  const inkColor    = foilColor    ?? (isPoster ? '#1a1a1a' : '#d4af37');
  const bgColor     = materialColor !== undefined ? materialColor : (isPoster ? '#ffffff' : '#1a2740');
  const lineOpacity = isPoster ? 0.85 : 0.55;
  const fontHead    = namesFont    ?? (isPoster ? 'Archivo'          : 'Archivo');
  const fontEvent   = eventFont    ?? (isPoster ? 'Archivo'          : 'Archivo');
  const fontLoc     = locationFont ?? (isPoster ? 'Archivo'          : 'Playfair Display');
  const fontTagline = taglineFont  ?? (isPoster ? 'Playfair Display' : 'Playfair Display');

  let body = '';

  if (bgColor !== null) {
    body += `<rect x="0" y="0" width="${W}" height="${H}" fill="${bgColor}"/>`;
  }

  // Poster: thin double-line border framing the whole canvas. Print-ready
  // posters always need a visible frame; the foil layout doesn't because
  // the physical frame supplies it.
  if (isPoster) {
    const m1 = 6;   // outer border inset
    const m2 = 8;   // inner border inset
    body += `<rect x="${m1}" y="${m1}" width="${W - 2 * m1}" height="${H - 2 * m1}" fill="none" stroke="${inkColor}" stroke-width="0.30"/>`;
    body += `<rect x="${m2}" y="${m2}" width="${W - 2 * m2}" height="${H - 2 * m2}" fill="none" stroke="${inkColor}" stroke-width="0.15"/>`;
  }

  // Disk clip. Stars and constellation lines are clipped here so a star
  // whose projected r is just inside R doesn't accidentally render outside.
  body += `<defs><clipPath id="starMapClip"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath></defs>`;
  body += `<g clip-path="url(#starMapClip)">`;

  if (scene) {
    // Re-project the bundled scene at the layout-specific (CX, CY, R).
    // The stored coords are in the SM_GEOM canvas; we map them to the
    // current canvas with a similarity transform around the disk centre.
    const sx = R / SM_GEOM.R;
    const projX = (x: number) => CX + (x - SM_GEOM.CX) * sx;
    const projY = (y: number) => CY + (y - SM_GEOM.CY) * sx;

    // Constellation lines first so stars sit on top.
    if (showLines && scene.constellations.length) {
      body += `<g fill="none" stroke="${inkColor}" stroke-width="${(isPoster ? 0.16 : 0.10).toFixed(2)}" stroke-linecap="round" stroke-opacity="${lineOpacity}">`;
      for (const c of scene.constellations) {
        for (const [x1, y1, x2, y2] of c.segments) {
          body += `<line x1="${projX(x1).toFixed(2)}" y1="${projY(y1).toFixed(2)}" x2="${projX(x2).toFixed(2)}" y2="${projY(y2).toFixed(2)}"/>`;
        }
      }
      body += `</g>`;
    }

    // Stars — bigger ones drawn last so they sit on top of overlaps.
    const sorted = [...scene.stars].sort((a, b) => b.mag - a.mag);
    body += `<g fill="${inkColor}" stroke="none">`;
    for (const s of sorted) {
      const r = magToRadius(s.mag) * sx;
      body += `<circle cx="${projX(s.x).toFixed(2)}" cy="${projY(s.y).toFixed(2)}" r="${r.toFixed(3)}"/>`;
    }
    body += `</g>`;

    // Optional labels for named bright stars.
    if (showLabels) {
      body += `<g fill="${inkColor}" font-family="Archivo, sans-serif" font-size="1.4" letter-spacing="0.1" opacity="0.7">`;
      for (const s of scene.stars) {
        if (!s.name || s.mag > 1.7) continue;
        body += `<text x="${(projX(s.x) + 1.1).toFixed(2)}" y="${(projY(s.y) - 0.6).toFixed(2)}">${esc(s.name)}</text>`;
      }
      body += `</g>`;
    }
  } else {
    body += `<text x="${CX}" y="${CY}" text-anchor="middle" font-size="3.5" font-family="${fontLoc}, Georgia, serif" fill="${inkColor}" opacity="0.55" font-style="italic">Pick a date to render the sky</text>`;
  }

  body += `</g>`;

  // Disk frame.
  body += `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${inkColor}" stroke-width="${isPoster ? 0.20 : 0.30}" stroke-opacity="${isPoster ? 1 : 0.95}"/>`;
  if (!isPoster) {
    // Foil layout has an inner circle echo + cardinal marks. The poster
    // layout drops both for a cleaner print aesthetic (matches modern
    // sky-poster reference designs).
    body += `<circle cx="${CX}" cy="${CY}" r="${R - 1}" fill="none" stroke="${inkColor}" stroke-width="0.10" stroke-opacity="0.55"/>`;
    const cardR = R + 1.6;
    const cardSize = 2.2;
    const cardOpts = [
      { dx:  0, dy: -cardR, label: 'N' },
      { dx:  0, dy:  cardR, label: 'S' },
      { dx: -cardR, dy:  0, label: 'E' },
      { dx:  cardR, dy:  0, label: 'W' },
    ];
    body += `<g fill="${inkColor}" font-family="Archivo, sans-serif" font-size="${cardSize}" font-weight="600" letter-spacing="0.2">`;
    for (const o of cardOpts) {
      body += `<text x="${(CX + o.dx).toFixed(2)}" y="${(CY + o.dy + 0.8).toFixed(2)}" text-anchor="middle">${o.label}</text>`;
    }
    body += `</g>`;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  //
  // Each footer text uses a named text zone if one exists in the
  // template (id='star_names', 'star_event', 'star_location',
  // 'star_tagline', 'star_caption'). The zone overrides position +
  // font + size + colour + alignment + transform. Anything not zoned
  // falls back to the renderer's hardcoded layout so existing
  // templates without zones keep rendering exactly as before.
  const cx = W / 2;
  const zoneNames    = findTextZone(zones, 'star_names');
  const zoneEvent    = findTextZone(zones, 'star_event');
  const zoneLocation = findTextZone(zones, 'star_location');
  const zoneTagline  = findTextZone(zones, 'star_tagline');
  const zoneCaption  = findTextZone(zones, 'star_caption');

  // When the customer picks a foil colour via customer_picker_role='foil_overlay',
  // their pick must override the zone-baked colours seeded on the template
  // (e.g. star_names.color='#d4af37'). buildStarMapSvg gets the pick via
  // foilColor; we forward it as customerForcedFill so emitZoneText skips
  // the per-zone colour override.
  const customerForcedFill = foilColor;

  if (isPoster) {
    // Poster layout — bold all-caps title block, em-dash flanked subtitle,
    // tiny mono coords below. Closely mirrors the reference design.
    const titleY     = CY + R + 14;
    const subtitleY  = titleY + 7;
    const captionY   = subtitleY + 6.5;
    const taglineY   = captionY + 6.5;

    const titleText = (locationLabel.trim() || event.trim() || 'THE HAPPIEST DAY');
    body += emitZoneText(zoneLocation, W, H, 1, titleText, {
      cx, y: titleY, size: 7.2, fontFamily: fontLoc, fill: inkColor, customerForcedFill,
      weight: '800', letterSpacing: 0.6, transform: 'uppercase',
    });

    // Subtitle with em-dash flanking — only emit if there's content.
    // Default convention: "STARS ABOVE <CITY>" so even an empty event
    // still gives the customer something printable.
    const subRaw = event.trim() || (locationLabel.trim()
      ? `Stars above ${locationLabel.trim()}`
      : 'Stars above the world');
    const subText = subRaw.toUpperCase();

    // Em-dash rules only when the admin hasn't moved the subtitle.
    if (!zoneEvent) {
      const approxWidth = Math.min(60, 1.7 * subText.length);
      const ruleLen = 8;
      const gap = 2.5;
      const halfText = approxWidth / 2;
      const ruleY = subtitleY - 1.2;
      body += `<line x1="${(cx - halfText - gap - ruleLen).toFixed(2)}" y1="${ruleY.toFixed(2)}" x2="${(cx - halfText - gap).toFixed(2)}" y2="${ruleY.toFixed(2)}" stroke="${inkColor}" stroke-width="0.18"/>`;
      body += `<line x1="${(cx + halfText + gap).toFixed(2)}" y1="${ruleY.toFixed(2)}" x2="${(cx + halfText + gap + ruleLen).toFixed(2)}" y2="${ruleY.toFixed(2)}" stroke="${inkColor}" stroke-width="0.18"/>`;
    }
    body += emitZoneText(zoneEvent, W, H, 1, subText, {
      cx, y: subtitleY, size: 3.2, fontFamily: fontEvent, fill: inkColor, customerForcedFill,
      letterSpacing: 0.5,
    });

    // Tiny mono caption — coords + date + names if provided.
    const captionParts: string[] = [];
    if (coordinates && coordinates.trim()) captionParts.push(coordinates.trim());
    if (dateUtc) captionParts.push(fmtDate(dateUtc));
    if (names.trim()) captionParts.push(names.trim());
    if (captionParts.length) {
      body += emitZoneText(zoneCaption, W, H, 1, captionParts.join(' / '), {
        cx, y: captionY, size: 2.2, fontFamily: 'Archivo', fill: inkColor, customerForcedFill,
        letterSpacing: 0.4,
      });
    }

    if (tagline.trim()) {
      body += emitZoneText(zoneTagline, W, H, 1, tagline.trim(), {
        cx, y: taglineY, size: 2.6, fontFamily: fontTagline, fill: inkColor, customerForcedFill,
        italic: true,
      });
    }
    if (zoneNames && names.trim()) {
      // Customer-supplied names are surfaced as a separate top line
      // when the admin gave them a dedicated zone.
      body += emitZoneText(zoneNames, W, H, 1, names.trim(), {
        cx, y: CY - R - 6, size: 3.6, fontFamily: fontHead, fill: inkColor, customerForcedFill,
        weight: '600', letterSpacing: 0.4, transform: 'uppercase',
      });
    }
  } else {
    // Foil layout — four-line stack. Each line caps its width at 90 viewBox
    // units (≈ 90% of the 100-unit canvas) so long inputs like
    // "MARINA BAY SANDS" auto-shrink instead of overflowing the disk footer.
    const footerMaxWidth = 90;
    body += emitZoneText(zoneNames, W, H, 1, names.trim() || 'EVA & JOHN', {
      cx, y: 105, size: 3.6, fontFamily: fontHead, fill: inkColor, customerForcedFill,
      weight: '600', letterSpacing: 0.4, maxWidth: footerMaxWidth,
    });
    body += emitZoneText(zoneEvent, W, H, 1, event.trim() || 'THE NIGHT WE MET', {
      cx, y: 110, size: 3.2, fontFamily: fontEvent, fill: inkColor, customerForcedFill,
      letterSpacing: 0.4, maxWidth: footerMaxWidth,
    });
    body += emitZoneText(zoneLocation, W, H, 1, locationLabel.trim() || 'LONDON', {
      cx, y: 119, size: 6.5, fontFamily: fontLoc, fill: inkColor, customerForcedFill,
      weight: '700', letterSpacing: 0.6, transform: 'uppercase', maxWidth: footerMaxWidth,
    });
    body += emitZoneText(zoneTagline, W, H, 1, tagline.trim() || 'Under our stars', {
      cx, y: 125, size: 3.4, fontFamily: fontTagline, fill: inkColor, customerForcedFill,
      italic: true, maxWidth: footerMaxWidth,
    });

    const captionParts: string[] = [];
    if (coordinates && coordinates.trim()) captionParts.push(coordinates.trim());
    if (dateUtc) captionParts.push(`${fmtDate(dateUtc)} · ${fmtTime(dateUtc)}`);
    if (captionParts.length) {
      body += emitZoneText(zoneCaption, W, H, 1, captionParts.join(' · '), {
        cx, y: CY + R + 4.2, size: 1.7, fontFamily: 'Archivo', fill: inkColor, customerForcedFill,
        letterSpacing: 0.3, maxWidth: footerMaxWidth,
      });
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}
