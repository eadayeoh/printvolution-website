// Shared rendering for GiftTemplateShapeZone. The editor canvas, the
// customer-facing live preview, and the server-side composite all call
// shapeZoneSvg() so what admin places is byte-identical to what prints.
//
// Coordinates: shapes render inside a viewBox of (zone.width_mm, zone.height_mm)
// — i.e. the zone-local canvas units the rest of the template engine uses. The
// caller scales the resulting <svg> to fit its zone box.

import type { GiftTemplateShapeZone, GiftShapeKind } from './types';
import { validateHexColor } from './personalisation-notes';

/** Produce the SVG path / element string for a shape inside a (w, h)
 *  rectangle. Returns just the inner element(s) — the caller wraps in
 *  <svg ... viewBox="0 0 w h">. */
function shapeBody(kind: GiftShapeKind, w: number, h: number, fill: string, stroke: string, strokeWidth: number): string {
  const sw = strokeWidth;
  // Inset closed shapes by half the stroke so the outline doesn't get
  // clipped at the zone edges.
  const inset = sw / 2;
  const x = inset, y = inset;
  const W = Math.max(0, w - sw), H = Math.max(0, h - sw);

  switch (kind) {
    case 'line': {
      // Diagonal top-left → bottom-right by default. Admin can rotate
      // the zone to get any other angle.
      return `<line x1="${x}" y1="${y}" x2="${x + W}" y2="${y + H}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
    }
    case 'rect': {
      return `<rect x="${x}" y="${y}" width="${W}" height="${H}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    }
    case 'circle': {
      const cx = w / 2, cy = h / 2;
      const rx = Math.max(0, W / 2), ry = Math.max(0, H / 2);
      // Use ellipse so non-square zones still draw the obvious shape.
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    }
    case 'triangle': {
      const p1 = `${w / 2},${y}`;
      const p2 = `${x + W},${y + H}`;
      const p3 = `${x},${y + H}`;
      return `<polygon points="${p1} ${p2} ${p3}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    }
    case 'heart': {
      // Classic two-arc heart authored on a 100x100 reference, scaled
      // into the zone. Using a path keeps the silhouette tight at any
      // size — no aliasing from compounding ellipses.
      const path = 'M50,90 C20,70 0,45 0,25 C0,10 12,0 25,0 C35,0 45,8 50,18 C55,8 65,0 75,0 C88,0 100,10 100,25 C100,45 80,70 50,90 Z';
      // viewBox 0 0 100 100 → scale to (w, h) via SVG nested viewBox.
      // The outer <svg> caller already sets the (w, h) frame; place the
      // inner heart in its own nested <svg>.
      return `<svg x="${x}" y="${y}" width="${W}" height="${H}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/></svg>`;
    }
    case 'star': {
      // 5-point star on a 100x100 reference.
      const path = 'M50,5 L61,38 L96,38 L67,58 L78,92 L50,72 L22,92 L33,58 L4,38 L39,38 Z';
      return `<svg x="${x}" y="${y}" width="${W}" height="${H}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/></svg>`;
    }
  }
}

/** Build the <svg> for a shape zone — used by the editor canvas, the
 *  customer preview, and the server composite. Uses safe defaults so
 *  invalid/missing colours don't blow the SVG (lines need a stroke, so
 *  they fall back to black; closed shapes fall back to no fill +
 *  visible black outline so a misconfigured zone still shows up). */
export function shapeZoneSvg(zone: GiftTemplateShapeZone, w: number, h: number): string {
  const fillHex = validateHexColor(zone.fill);
  const strokeHex = validateHexColor(zone.stroke);
  const strokeWidth = Math.max(0, Math.min(w, h, zone.stroke_width ?? 0));

  let fill = fillHex ?? 'none';
  let stroke = strokeHex ?? 'none';
  let sw = strokeWidth;

  // Lines: must have a visible stroke or they're invisible. Default to
  // black + 1mm if admin forgot to set one.
  if (zone.shape === 'line') {
    if (stroke === 'none') stroke = '#0a0a0a';
    if (sw <= 0) sw = 1;
  } else {
    // Closed shape with no fill AND no stroke → hint with a thin black
    // outline so admin sees the placeholder on the canvas.
    if (fill === 'none' && stroke === 'none') {
      stroke = '#0a0a0a';
      sw = 0.5;
    }
  }

  const body = shapeBody(zone.shape, w, h, fill, stroke, sw);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${body}</svg>`;
}

export const GIFT_SHAPE_KINDS: ReadonlyArray<GiftShapeKind> = ['line', 'rect', 'circle', 'heart', 'star', 'triangle'];

export const GIFT_SHAPE_LABEL: Record<GiftShapeKind, string> = {
  line: 'Line',
  rect: 'Rectangle',
  circle: 'Circle',
  heart: 'Heart',
  star: 'Star',
  triangle: 'Triangle',
};
