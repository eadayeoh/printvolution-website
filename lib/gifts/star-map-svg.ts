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

export type StarMapLayout = 'foil';

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
};

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
  namesFont = 'Archivo',
  eventFont = 'Archivo',
  locationFont = 'Playfair Display',
  taglineFont = 'Playfair Display',
  foilColor = '#d4af37',
  materialColor = '#1a2740',
}: BuildStarMapSvgInput): string {
  const { W, H, CX, CY, R } = SM_GEOM;
  let body = '';

  if (materialColor !== null) {
    body += `<rect x="0" y="0" width="${W}" height="${H}" fill="${materialColor}"/>`;
  }

  // Disk clip. Stars and constellation lines are clipped here so a star
  // whose projected r is just inside R doesn't accidentally render outside.
  body += `<defs><clipPath id="starMapClip"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath></defs>`;
  body += `<g clip-path="url(#starMapClip)">`;

  if (scene) {
    // Constellation lines first so stars sit on top.
    if (showLines && scene.constellations.length) {
      body += `<g fill="none" stroke="${foilColor}" stroke-width="0.10" stroke-linecap="round" stroke-opacity="0.55">`;
      for (const c of scene.constellations) {
        for (const [x1, y1, x2, y2] of c.segments) {
          body += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
        }
      }
      body += `</g>`;
    }

    // Stars — bigger ones drawn last so they sit on top of overlaps.
    const sorted = [...scene.stars].sort((a, b) => b.mag - a.mag);
    body += `<g fill="${foilColor}" stroke="none">`;
    for (const s of sorted) {
      const r = magToRadius(s.mag);
      body += `<circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${r.toFixed(3)}"/>`;
    }
    body += `</g>`;

    // Optional labels for named bright stars.
    if (showLabels) {
      body += `<g fill="${foilColor}" font-family="Archivo, sans-serif" font-size="1.4" letter-spacing="0.1" opacity="0.7">`;
      for (const s of scene.stars) {
        if (!s.name || s.mag > 1.7) continue;
        body += `<text x="${(s.x + 1.1).toFixed(2)}" y="${(s.y - 0.6).toFixed(2)}">${esc(s.name)}</text>`;
      }
      body += `</g>`;
    }
  } else {
    body += `<text x="${CX}" y="${CY}" text-anchor="middle" font-size="3.5" font-family="${locationFont}, Georgia, serif" fill="${foilColor}" opacity="0.55" font-style="italic">Pick a date to render the sky</text>`;
  }

  body += `</g>`;

  // Disk frame + cardinal ticks. Foil-printable, no fill.
  body += `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${foilColor}" stroke-width="0.30" stroke-opacity="0.95"/>`;
  body += `<circle cx="${CX}" cy="${CY}" r="${R - 1}" fill="none" stroke="${foilColor}" stroke-width="0.10" stroke-opacity="0.55"/>`;

  // Cardinal direction marks (N at top, E at left to match the east-left
  // sky convention used in the projection above).
  const cardR = R + 1.6;
  const cardSize = 2.2;
  const cardOpts = [
    { dx:  0, dy: -cardR, anchor: 'middle', baseline: 'middle', label: 'N' },
    { dx:  0, dy:  cardR, anchor: 'middle', baseline: 'middle', label: 'S' },
    { dx: -cardR, dy:  0, anchor: 'middle', baseline: 'middle', label: 'E' },
    { dx:  cardR, dy:  0, anchor: 'middle', baseline: 'middle', label: 'W' },
  ];
  body += `<g fill="${foilColor}" font-family="Archivo, sans-serif" font-size="${cardSize}" font-weight="600" letter-spacing="0.2">`;
  for (const o of cardOpts) {
    body += `<text x="${(CX + o.dx).toFixed(2)}" y="${(CY + o.dy + 0.8).toFixed(2)}" text-anchor="${o.anchor}">${o.label}</text>`;
  }
  body += `</g>`;

  // Footer block — names / event / location / tagline + optional coord/date line.
  const cx = W / 2;
  const namesY = 105;
  const eventY = 110;
  const locY  = 119;
  const taglineY = 125;

  body += `<text x="${cx}" y="${namesY}" text-anchor="middle" font-size="3.6" font-family="${namesFont}, sans-serif" letter-spacing="0.4" fill="${foilColor}" font-weight="600">${esc(names.trim() || 'EVA & JOHN')}</text>`;
  body += `<text x="${cx}" y="${eventY}" text-anchor="middle" font-size="3.2" font-family="${eventFont}, sans-serif" letter-spacing="0.4" fill="${foilColor}">${esc(event.trim() || 'THE NIGHT WE MET')}</text>`;
  body += `<text x="${cx}" y="${locY}" text-anchor="middle" font-size="6.5" font-family="${locationFont}, Georgia, serif" font-weight="700" letter-spacing="0.6" fill="${foilColor}">${esc((locationLabel.trim() || 'LONDON').toUpperCase())}</text>`;
  body += `<text x="${cx}" y="${taglineY}" text-anchor="middle" font-size="3.4" font-style="italic" font-family="${taglineFont}, Georgia, serif" fill="${foilColor}">${esc(tagline.trim() || 'Under our stars')}</text>`;

  // Sub-disk caption: coordinates + date stamp. Separate from the labels
  // above because customers usually want the moment recorded literally.
  const captionParts: string[] = [];
  if (coordinates && coordinates.trim()) captionParts.push(coordinates.trim());
  if (dateUtc) captionParts.push(`${fmtDate(dateUtc)} · ${fmtTime(dateUtc)}`);
  if (captionParts.length) {
    body += `<text x="${cx}" y="${CY + R + 4.2}" text-anchor="middle" font-size="1.7" font-family="Archivo, sans-serif" letter-spacing="0.3" fill="${foilColor}" opacity="0.75">${esc(captionParts.join(' · '))}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}
