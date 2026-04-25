// Template composite renderer.
//
// Renders a GiftTemplate (zones_json + optional background / foreground
// images) at a target physical size, compositing every image zone with
// a source photo and painting every text zone via an SVG overlay.
//
// Scope for v1 (this file ships a working path end-to-end; deeper
// multi-slot authoring is a follow-up):
//
//   • Every image zone uses the SAME customer-uploaded photo. When the
//     multi-slot upload UI lands later, we'll thread per-zone source
//     files through this function via the `imagesByZoneId` map.
//
//   • Every text zone renders with its default_text from the template.
//     Customer text capture is a later UI addition; `textByZoneId`
//     already accepts overrides for when that happens.
//
//   • Font rendering uses librsvg (via sharp SVG composite). Fonts
//     from our design system (inter / playfair / etc.) aren't bundled,
//     so librsvg falls back to a generic family. Good enough for
//     preview; final fidelity needs a TTF bundle which is a separate
//     piece of infra work.

import type { GiftTemplate, GiftTemplateZone, GiftTemplateImageZone, GiftTemplateTextZone, GiftTemplateCalendarZone, GiftMode } from '@/lib/gifts/types';
import { renderSvgWithFonts } from './fonts';
import { renderCalendarSvg, type CalendarFill } from './calendar-svg';

const CANVAS_UNITS = 200; // zones_json x/y/w/h are on a 0..200 canvas
const DEFAULT_DPI_PREVIEW = 150;
const DEFAULT_DPI_PRODUCTION = 300;

type SharpModule = any;

export type CompositeInput = {
  template: GiftTemplate;
  sourceBytes: Uint8Array;
  /** Mapping of zone_id → customer-uploaded image bytes. When absent
   *  for an image zone, the fallback is the single sourceBytes above. */
  imagesByZoneId?: Record<string, Uint8Array | undefined>;
  /** Mapping of zone_id → customer text. When absent, the zone's
   *  default_text is used. */
  textByZoneId?: Record<string, string | undefined>;
  /** Physical size to render at (in mm). When null, use the template's
   *  reference_width_mm / reference_height_mm. */
  targetWidthMm: number;
  targetHeightMm: number;
  /** 'preview' = 150 DPI, max 1200px long edge; 'production' = 300 DPI */
  kind: 'preview' | 'production';
  /** Product's primary mode. Zones with `mode: null` inherit this.
   *  Required for dual-mode templates; when omitted, zone modes are
   *  treated as inherited but no filtering happens. */
  productMode?: GiftMode;
  /** When set, ONLY zones whose effective mode matches this are
   *  rendered — other zones + the decorative background / foreground
   *  are skipped. Used by the production fan-out to build one file
   *  per mode for dual-mode templates. Omit for the preview composite
   *  (everything renders). */
  onlyMode?: GiftMode | null;
  /** Per-zone transform hook. Invoked on every image zone's bytes
   *  before compositing, with the zone's effective mode (zone.mode
   *  ?? productMode). Lets the caller inject AI stylisation, photo
   *  resize, etc. without creating a cycle between pipeline.ts and
   *  this file. Return the transformed bytes (same dimensions are
   *  fine — the composite resizes to fit the zone anyway). */
  transformZone?: (bytes: Uint8Array, mode: GiftMode) => Promise<Uint8Array>;
  /** Per-zone calendar fills. Keyed by zone id. Calendar zones with
   *  no entry fall back to the zone's admin-set defaults / current
   *  month at render time. */
  calendarsByZoneId?: Record<string, Partial<CalendarFill>>;
  /** Per-zone customer-picked text colour overrides keyed by zone id.
   *  Falls through to z.color when a key is missing. */
  textColorsByZoneId?: Record<string, string>;
};

export type CompositeOutput = {
  buffer: Buffer;
  widthPx: number;
  heightPx: number;
};

export async function renderTemplateComposite(
  sharp: SharpModule,
  input: CompositeInput,
): Promise<CompositeOutput> {
  const { template, sourceBytes, imagesByZoneId, textByZoneId, calendarsByZoneId, textColorsByZoneId, targetWidthMm, targetHeightMm, kind, productMode, onlyMode, transformZone } = input;
  // Effective zone mode: zone.mode wins, fall back to productMode, else null.
  const effectiveMode = (z: GiftTemplateZone): GiftMode | null =>
    (z.mode ?? productMode ?? null) as GiftMode | null;

  // Compute output pixel size from mm + DPI. Preview caps at 1200px
  // long edge to keep the file small and the upload fast.
  const dpi = kind === 'preview' ? DEFAULT_DPI_PREVIEW : DEFAULT_DPI_PRODUCTION;
  const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);
  let outW = mmToPx(targetWidthMm);
  let outH = mmToPx(targetHeightMm);
  if (kind === 'preview') {
    const longEdge = Math.max(outW, outH);
    if (longEdge > 1200) {
      const scale = 1200 / longEdge;
      outW = Math.round(outW * scale);
      outH = Math.round(outH * scale);
    }
  }

  // Zones are on a 0..200 canvas — translate to output pixels.
  const zoneToPx = (v: number, axis: 'x' | 'y') =>
    Math.round((v / CANVAS_UNITS) * (axis === 'x' ? outW : outH));

  // Base canvas — white by default. The template's background_url, if
  // set, is laid down first.
  let base: Buffer = await sharp({
    create: { width: outW, height: outH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).png().toBuffer();

  // Decorative background/foreground only apply to the preview
  // composite. Fan-out passes (onlyMode set) skip them — production
  // passes should carry only the content that THIS mode's machine
  // will reproduce.
  if (!onlyMode && template.background_url) {
    const bgBytes = await fetchAsBuffer(template.background_url);
    if (bgBytes) {
      const bgResized = await sharp(bgBytes)
        .resize(outW, outH, { fit: 'cover' })
        .toBuffer();
      base = await sharp(base).composite([{ input: bgResized, top: 0, left: 0 }]).toBuffer();
    }
  }

  // Walk zones in array order — array order = z-order.
  const overlays: Array<{ input: Buffer; top: number; left: number }> = [];

  for (const zone of (template.zones_json ?? [])) {
    const zoneMode = effectiveMode(zone);
    // Fan-out: skip zones whose mode doesn't match this pass.
    if (onlyMode && zoneMode !== onlyMode) continue;

    const zx = zoneToPx(zone.x_mm, 'x');
    const zy = zoneToPx(zone.y_mm, 'y');
    const zw = zoneToPx(zone.width_mm, 'x');
    const zh = zoneToPx(zone.height_mm, 'y');
    if (zw <= 0 || zh <= 0) continue;

    if (isCalendar(zone)) {
      // Calendar zones use the same SVG generator the live preview
      // calls — single source of truth so what the customer sees in
      // preview is what gets printed. Render at the zone's pixel
      // dimensions so font sizes scale with DPI.
      const svg = renderCalendarSvg({
        zone,
        fill: calendarsByZoneId?.[zone.id],
        width: zw,
        height: zh,
      });
      const resvgBuf = await renderSvgWithFonts(svg);
      const svgBuf: Buffer = resvgBuf ?? await sharp(Buffer.from(svg)).png().toBuffer();
      overlays.push({ input: svgBuf, top: zy, left: zx });
    } else if (isText(zone)) {
      // Customer-picked colour wins over admin default. Validated #RRGGBB
      // upstream in the upload action.
      const customerColor = textColorsByZoneId?.[zone.id];
      const zoneForRender = customerColor ? { ...zone, color: customerColor } : zone;
      const svg = textZoneSvg(zoneForRender, zw, zh, textByZoneId?.[zone.id]);
      // Prefer resvg-with-fonts so Playfair / Inter etc. resolve
      // against the .ttf files in public/fonts/. Falls back to sharp's
      // librsvg path (generic families) when fonts aren't installed.
      const resvgBuf = await renderSvgWithFonts(svg);
      const svgBuf: Buffer = resvgBuf ?? await sharp(Buffer.from(svg)).png().toBuffer();
      overlays.push({ input: svgBuf, top: zy, left: zx });
    } else {
      // Prefer customer upload for this zone. Fall back to the zone's
      // admin-set default_image_url (so templates can ship with
      // thematic placeholders and render even when the customer only
      // uploaded one photo). Final fallback is the primary source.
      const imgZone = zone as GiftTemplateImageZone;
      let zoneBytes: Uint8Array | undefined = imagesByZoneId?.[zone.id];
      if (!zoneBytes && imgZone.default_image_url) {
        const fetched = await fetchAsBuffer(imgZone.default_image_url);
        if (fetched) zoneBytes = fetched;
      }
      let finalBytes = zoneBytes ?? sourceBytes;
      // Per-zone transform: when a mode is resolved AND a transform
      // hook is provided, run it before compositing. Lets the caller
      // inject AI stylisation (laser → line art, uv → saturation,
      // embroidery → posterise) per zone based on that zone's mode.
      if (zoneMode && transformZone) {
        try {
          finalBytes = await transformZone(finalBytes, zoneMode);
        } catch {
          // Transform failure shouldn't abort the whole composite —
          // the zone renders with the raw source as a best-effort
          // fallback so the preview still works.
        }
      }
      const img = await prepImageZone(sharp, imgZone, zw, zh, finalBytes);
      if (img) overlays.push({ input: img, top: zy, left: zx });
    }
  }

  if (overlays.length > 0) {
    base = await sharp(base).composite(overlays).png().toBuffer();
  }

  // Foreground overlay (Netflix N logo + nav + gradient) painted last.
  // Fan-out: skip — production files don't carry decorative overlays.
  if (!onlyMode && template.foreground_url) {
    const fgBytes = await fetchAsBuffer(template.foreground_url);
    if (fgBytes) {
      const fgResized = await sharp(fgBytes)
        .resize(outW, outH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
      base = await sharp(base).composite([{ input: fgResized, top: 0, left: 0 }]).png().toBuffer();
    }
  }

  const finalBuf = await sharp(base).jpeg({ quality: kind === 'preview' ? 82 : 92 }).toBuffer();
  const meta = await sharp(finalBuf).metadata();
  return { buffer: finalBuf, widthPx: meta.width ?? outW, heightPx: meta.height ?? outH };
}

function isText(z: GiftTemplateZone): z is GiftTemplateTextZone {
  return (z as GiftTemplateTextZone).type === 'text';
}
function isCalendar(z: GiftTemplateZone): z is GiftTemplateCalendarZone {
  return (z as GiftTemplateCalendarZone).type === 'calendar';
}

async function prepImageZone(
  sharp: SharpModule,
  zone: GiftTemplateImageZone,
  zw: number,
  zh: number,
  bytes: Uint8Array,
): Promise<Buffer | null> {
  try {
    let img = sharp(Buffer.from(bytes))
      .rotate() // auto-orient via EXIF
      .resize(zw, zh, { fit: zone.fit_mode === 'contain' ? 'contain' : 'cover' });

    // Border radius via SVG mask.
    const radiusPxX = Math.round(((zone.border_radius_mm ?? 0) / CANVAS_UNITS) * zw);
    const radiusPx = Math.max(0, Math.min(radiusPxX, Math.floor(Math.min(zw, zh) / 2)));
    if (radiusPx > 0) {
      const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${zw}" height="${zh}">
        <rect x="0" y="0" width="${zw}" height="${zh}" rx="${radiusPx}" ry="${radiusPx}" fill="#fff"/>
      </svg>`;
      const maskBuf = await sharp(Buffer.from(maskSvg)).png().toBuffer();
      img = img.composite([{ input: maskBuf, blend: 'dest-in' }]).png();
    }

    return await img.toBuffer();
  } catch {
    return null;
  }
}

const FONT_STACK: Record<string, string> = {
  inter:     'Inter, ui-sans-serif, system-ui, sans-serif',
  fraunces:  'Fraunces, Georgia, serif',
  cormorant: '"Cormorant Garamond", Georgia, serif',
  playfair:  '"Playfair Display", Georgia, serif',
  caveat:    'Caveat, cursive',
  bebas:     '"Bebas Neue", Impact, sans-serif',
  mono:      '"JetBrains Mono", ui-monospace, monospace',
};

function textZoneSvg(zone: GiftTemplateTextZone, zw: number, zh: number, override?: string): string {
  const text = (override ?? zone.default_text ?? '').trim() || (zone.placeholder ?? '');
  const fontFamily = FONT_STACK[zone.font_family ?? 'inter'] ?? FONT_STACK.inter;
  const fontSizePx = Math.max(8, Math.round(((zone.font_size_mm ?? 6) / CANVAS_UNITS) * Math.max(zw, zh)));
  const color = zone.color ?? '#000';
  const align = zone.align ?? 'center';
  const vAlign = zone.vertical_align ?? 'middle';
  const weight = zone.font_weight ?? '400';
  const style = zone.font_style ?? 'normal';
  const transform = zone.text_transform === 'uppercase' ? 'text-transform:uppercase;' :
                    zone.text_transform === 'lowercase' ? 'text-transform:lowercase;' :
                    zone.text_transform === 'capitalize' ? 'text-transform:capitalize;' : '';
  const letterSpacing = zone.letter_spacing_em ? `letter-spacing:${zone.letter_spacing_em}em;` : '';

  const anchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
  const xAttr = align === 'left' ? 0 : align === 'right' ? zw : zw / 2;
  const yAttr = vAlign === 'top' ? fontSizePx : vAlign === 'bottom' ? zh : zh / 2;
  const dominantBaseline =
    vAlign === 'top' ? 'hanging' :
    vAlign === 'bottom' ? 'text-top' :
    'middle';

  const safe = (text ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${zw}" height="${zh}">
    <style>
      text { font-family: ${fontFamily}; font-weight: ${weight}; font-style: ${style}; ${transform}${letterSpacing} }
    </style>
    <text x="${xAttr}" y="${yAttr}" fill="${color}" font-size="${fontSizePx}" text-anchor="${anchor}" dominant-baseline="${dominantBaseline}">${safe}</text>
  </svg>`;
}

async function fetchAsBuffer(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    return null;
  }
}
