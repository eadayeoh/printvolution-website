/**
 * City Map Photo Frame — vector pipeline.
 *
 * Pulls OpenStreetMap roads + waterways for a bounding box around the
 * customer's coordinates via the Overpass API, projects them into the
 * print canvas, and emits a foil-printable SVG.
 *
 * Used by:
 *   • The client component <CityMapTemplate> (live PDP preview).
 *   • The admin server route /api/admin/orders/[id]/items/[itemId]/city-map-svg
 *     which re-renders the SVG from the saved cart-line notes.
 *
 * No dependencies on React or DOM. Pure server module + pure data.
 */

// ── Geometry (mm — viewBox is 0 0 W H) ──────────────────────────────────────
export const CM_GEOM = Object.freeze({
  W: 100,
  H: 130,
  // Map area sits inside a thin inset; footer below.
  MAP_X: 6,
  MAP_Y: 8,
  MAP_W: 88,
  MAP_H: 88,        // square map area (88×88)
  FOOTER_TOP: 100,
});

// ── OSM road class → stroke width (mm) ──────────────────────────────────────
//
// Tuned for an 88×88mm map of a ~5 km radius. Keep motorways visible but
// not dominant; keep residential roads thin enough that a dense city
// reads as texture rather than noise.
//
// service / pedestrian / living_street are intentionally OMITTED — they're
// invisible at print scale, dwarf the response size for big cities (e.g.
// Singapore went from 17 MB → 9.6 MB by dropping them), and add no signal
// to a foil-print map.
const ROAD_WIDTH: Record<string, number> = {
  motorway:        0.55,
  trunk:           0.50,
  primary:         0.42,
  secondary:       0.32,
  tertiary:        0.24,
  residential:     0.14,
  unclassified:    0.12,
};

// Waterways (rivers / streams) get their own weight scaled by the radius.
const WATER_WIDTH = 0.55;

const ROAD_TYPES = Object.keys(ROAD_WIDTH);

// ── Overpass query ──────────────────────────────────────────────────────────
//
// Single query returns everything we render. `out geom` inlines the node
// coords on each way so we don't need a follow-up node lookup.

function overpassQuery(s: number, w: number, n: number, e: number): string {
  const bbox = `${s},${w},${n},${e}`;
  const roadFilter = ROAD_TYPES.join('|');
  return `
[out:json][timeout:25];
(
  way[highway~"^(${roadFilter})$"](${bbox});
  way[waterway~"^(river|stream|canal)$"](${bbox});
  way[natural=coastline](${bbox});
  way[natural=water](${bbox});
  relation[natural=water](${bbox});
);
out geom;
`.trim();
}

// ── Types ───────────────────────────────────────────────────────────────────

type LatLng = { lat: number; lon: number };

type OverpassWay = {
  type: 'way';
  id: number;
  tags?: Record<string, string>;
  geometry?: LatLng[];
};

type OverpassRelation = {
  type: 'relation';
  id: number;
  tags?: Record<string, string>;
  members?: Array<{ type: string; role?: string; geometry?: LatLng[] }>;
};

type OverpassResponse = {
  elements?: Array<OverpassWay | OverpassRelation>;
};

export type CityMapBBox = {
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
};

export type CityMapVectors = {
  /** Roads bucketed by class — order matters (drawn back-to-front). */
  roads: Record<string, string[]>;
  /** Linear waterways (rivers etc.) as polyline path data. */
  waterLines: string[];
  /** Closed water polygons (lakes, bays) as fillable path data. */
  waterPolys: string[];
  /** The bbox we queried — handy for debugging / re-renders. */
  bbox: CityMapBBox;
};

// ── Projection: lat/lng → SVG mm ────────────────────────────────────────────
//
// At small radii (<10 km) Web Mercator and equirectangular agree to within a
// pixel, so we use the simpler equirectangular form scaled to make the
// printed area square in real-world distance: longitude is compressed by
// cos(centerLat) so 1 mm east == 1 mm north on the page.

export function bboxFor(lat: number, lng: number, radiusKm: number): CityMapBBox {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - dLat, maxLat: lat + dLat,
    minLng: lng - dLng, maxLng: lng + dLng,
  };
}

function projector(bbox: CityMapBBox) {
  const { MAP_X, MAP_Y, MAP_W, MAP_H } = CM_GEOM;
  const lngSpan = bbox.maxLng - bbox.minLng;
  const latSpan = bbox.maxLat - bbox.minLat;
  return (lat: number, lon: number): [number, number] => {
    const x = MAP_X + ((lon - bbox.minLng) / lngSpan) * MAP_W;
    const y = MAP_Y + ((bbox.maxLat - lat) / latSpan) * MAP_H;
    return [x, y];
  };
}

function pathFromGeom(geom: LatLng[], project: (lat: number, lon: number) => [number, number]): string | null {
  if (!geom || geom.length < 2) return null;
  const parts: string[] = [];
  for (let i = 0; i < geom.length; i++) {
    const [x, y] = project(geom[i].lat, geom[i].lon);
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return parts.join(' ');
}

// ── Overpass fetch (with Next.js revalidate-based caching) ──────────────────

// Public Overpass mirrors. We try them in order so a single mirror's outage
// doesn't take the product down. Each round-trip is cached by Next.js.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

export async function fetchCityMapVectors(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<CityMapVectors> {
  const bbox = bboxFor(lat, lng, radiusKm);
  const query = overpassQuery(bbox.minLat, bbox.minLng, bbox.maxLat, bbox.maxLng);

  let lastErr: unknown = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        // Do NOT use Next.js fetch cache here — Overpass responses can be
        // 10+ MB for dense cities and Vercel's cache silently fails for
        // bodies over ~2 MB. Use 'no-store' so the runtime doesn't try.
        cache: 'no-store',
      });
      if (!res.ok) {
        lastErr = new Error(`overpass ${res.status}`);
        continue;
      }
      const json = (await res.json()) as OverpassResponse;
      return parseOverpass(json, bbox);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`city-map: all Overpass endpoints failed (${lastErr instanceof Error ? lastErr.message : 'unknown'})`);
}

function parseOverpass(json: OverpassResponse, bbox: CityMapBBox): CityMapVectors {
  const project = projector(bbox);
  const roads: Record<string, string[]> = Object.fromEntries(ROAD_TYPES.map((t) => [t, [] as string[]]));
  const waterLines: string[] = [];
  const waterPolys: string[] = [];

  for (const el of json.elements ?? []) {
    if (el.type === 'way') {
      const tags = el.tags ?? {};
      const geom = el.geometry;
      if (!geom || geom.length < 2) continue;

      // Roads
      const hwy = tags.highway;
      if (hwy && hwy in ROAD_WIDTH) {
        const d = pathFromGeom(geom, project);
        if (d) roads[hwy].push(d);
        continue;
      }

      // Waterways (linear)
      if (tags.waterway && /^(river|stream|canal)$/.test(tags.waterway)) {
        const d = pathFromGeom(geom, project);
        if (d) waterLines.push(d);
        continue;
      }

      // Coastline (linear, drawn as a heavy line — close enough for print)
      if (tags.natural === 'coastline') {
        const d = pathFromGeom(geom, project);
        if (d) waterLines.push(d);
        continue;
      }

      // Water polygons (closed ways)
      if (tags.natural === 'water') {
        const first = geom[0];
        const last = geom[geom.length - 1];
        const closed = first.lat === last.lat && first.lon === last.lon;
        const d = pathFromGeom(geom, project);
        if (!d) continue;
        if (closed) waterPolys.push(`${d} Z`);
        else waterLines.push(d);
        continue;
      }
    } else if (el.type === 'relation') {
      // Multipolygon water relations: render each outer ring as a poly.
      const tags = el.tags ?? {};
      if (tags.natural !== 'water' && tags.water === undefined) continue;
      for (const m of el.members ?? []) {
        if (m.type !== 'way' || m.role !== 'outer') continue;
        if (!m.geometry || m.geometry.length < 2) continue;
        const d = pathFromGeom(m.geometry, project);
        if (d) waterPolys.push(`${d} Z`);
      }
    }
  }

  return { roads, waterLines, waterPolys, bbox };
}

// ── XML escape ──────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── SVG composition ─────────────────────────────────────────────────────────

export type CityMapLayout = 'foil';

export type BuildCityMapSvgInput = {
  vectors: CityMapVectors | null;
  /** Top names line, e.g. "EVA & JOHN". */
  names: string;
  /** Subtitle under names, e.g. "OUR FIRST DATE". */
  event: string;
  /** Big city label (defaults to geocoded label). */
  cityLabel: string;
  /** Tagline italic, e.g. "Love now and always". */
  tagline: string;
  /** Optional coordinates string under the city label. */
  coordinates?: string;
  namesFont?: string;
  eventFont?: string;
  cityFont?: string;
  taglineFont?: string;
  layout?: CityMapLayout;
  foilColor?: string;
  /** Material colour behind the foil. null drops the background <rect> for
   *  the foil printer (only the gold paths ship). */
  materialColor?: string | null;
};

export function buildCityMapSvg({
  vectors,
  names,
  event,
  cityLabel,
  tagline,
  coordinates,
  namesFont = 'Archivo',
  eventFont = 'Archivo',
  cityFont = 'Playfair Display',
  taglineFont = 'Playfair Display',
  foilColor = '#d4af37',
  materialColor = '#1a2740',
}: BuildCityMapSvgInput): string {
  const { W, H, MAP_X, MAP_Y, MAP_W, MAP_H } = CM_GEOM;
  let body = '';

  if (materialColor !== null) {
    body += `<rect x="0" y="0" width="${W}" height="${H}" fill="${materialColor}"/>`;
  }

  // Map clip — round corners help frame the artwork.
  body += `<defs><clipPath id="cityMapClip"><rect x="${MAP_X}" y="${MAP_Y}" width="${MAP_W}" height="${MAP_H}" rx="0.5" ry="0.5"/></clipPath></defs>`;

  // Map content
  body += `<g clip-path="url(#cityMapClip)">`;

  if (vectors) {
    // Water polygons — fill in foil. Drawn before roads so roads cross over.
    if (vectors.waterPolys.length) {
      body += `<g fill="${foilColor}" fill-opacity="0.35" stroke="none">`;
      for (const d of vectors.waterPolys) {
        body += `<path d="${d}"/>`;
      }
      body += `</g>`;
    }

    // Waterway lines (rivers) — heavier stroke than residential roads.
    if (vectors.waterLines.length) {
      body += `<g fill="none" stroke="${foilColor}" stroke-width="${WATER_WIDTH}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.85">`;
      for (const d of vectors.waterLines) {
        body += `<path d="${d}"/>`;
      }
      body += `</g>`;
    }

    // Roads — back-to-front so motorways sit on top of residentials.
    // Iterate from thin to thick.
    const drawOrder = [
      'unclassified', 'residential',
      'tertiary', 'secondary', 'primary', 'trunk', 'motorway',
    ];
    for (const cls of drawOrder) {
      const ways = vectors.roads[cls];
      if (!ways?.length) continue;
      const w = ROAD_WIDTH[cls];
      body += `<g fill="none" stroke="${foilColor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">`;
      for (const d of ways) {
        body += `<path d="${d}"/>`;
      }
      body += `</g>`;
    }
  } else {
    // Empty-state placeholder — visible before geocoding completes.
    body += `<text x="${MAP_X + MAP_W / 2}" y="${MAP_Y + MAP_H / 2}" text-anchor="middle" font-size="3.5" font-family="${cityFont}, Georgia, serif" fill="${foilColor}" opacity="0.55" font-style="italic">Enter a city to render the map</text>`;
  }

  body += `</g>`;

  // Frame around the map
  body += `<rect x="${MAP_X}" y="${MAP_Y}" width="${MAP_W}" height="${MAP_H}" fill="none" stroke="${foilColor}" stroke-width="0.25" stroke-opacity="0.9"/>`;

  // Footer block — names / event / city / tagline
  const cx = W / 2;
  const namesY = 105;
  const eventY = 110;
  const cityY  = 119;
  const taglineY = 125;

  body += `<text x="${cx}" y="${namesY}" text-anchor="middle" font-size="3.6" font-family="${namesFont}, sans-serif" letter-spacing="0.4" fill="${foilColor}" font-weight="600">${esc(names.trim() || 'EVA & JOHN')}</text>`;
  body += `<text x="${cx}" y="${eventY}" text-anchor="middle" font-size="3.2" font-family="${eventFont}, sans-serif" letter-spacing="0.4" fill="${foilColor}">${esc(event.trim() || 'OUR FIRST DATE')}</text>`;
  body += `<text x="${cx}" y="${cityY}" text-anchor="middle" font-size="6.5" font-family="${cityFont}, Georgia, serif" font-weight="700" letter-spacing="0.6" fill="${foilColor}">${esc((cityLabel.trim() || 'LONDON').toUpperCase())}</text>`;
  body += `<text x="${cx}" y="${taglineY}" text-anchor="middle" font-size="3.4" font-style="italic" font-family="${taglineFont}, Georgia, serif" fill="${foilColor}">${esc(tagline.trim() || 'Love now and always')}</text>`;

  if (coordinates && coordinates.trim()) {
    body += `<text x="${cx}" y="${MAP_Y + MAP_H + 1.8}" text-anchor="middle" font-size="1.6" font-family="Archivo, sans-serif" letter-spacing="0.3" fill="${foilColor}" opacity="0.7">${esc(coordinates.trim())}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}
