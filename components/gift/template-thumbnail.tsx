/**
 * Picker thumbnail. Renders a mini SVG that previews a gift template's
 * layout from its `zones_json` — disks for render anchors, outlined
 * shapes for image zones (heart / circle / star / rect), and tiny bars
 * for text zones. Used as the fallback when a template doesn't have an
 * uploaded `thumbnail_url`, so admins can drop in a new template and
 * the customer immediately sees what the layout looks like instead of
 * a generic emoji.
 *
 * Pure presentational — no data fetching, no state.
 */

import type { GiftTemplateZone, GiftTemplateRenderAnchorZone, GiftTemplateImageZone, GiftTemplateTextZone } from '@/lib/gifts/types';

type Props = {
  zones: GiftTemplateZone[] | null | undefined;
  /** Renderer kind drives accent colour — gold-ish for foil/star_map,
   *  ink for city_map and others. */
  renderer?: string | null;
};

const HEART_PATH = 'M50,90 C30,72 6,55 6,32 C6,18 17,8 30,8 C39,8 46,13 50,20 C54,13 61,8 70,8 C83,8 94,18 94,32 C94,55 70,72 50,90 Z';
const STAR_PATH = 'M50,4 L61,38 L96,38 L67,59 L78,93 L50,72 L22,93 L33,59 L4,38 L39,38 Z';

export function TemplateThumbnail({ zones, renderer }: Props) {
  if (!zones || zones.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
        🎨
      </div>
    );
  }

  const isFoilish = renderer === 'star_map';
  const ink = isFoilish ? '#d4af37' : '#1a1a1a';
  const bg = isFoilish ? '#1a2740' : '#fafaf7';

  // Canvas units: zones use 0..200 mm. Render the thumb in viewBox 0..200
  // so we can draw zone shapes with their literal x/y/width/height.
  let body = '';

  for (const z of zones) {
    if (z.type === 'render_anchor') {
      const a = z as GiftTemplateRenderAnchorZone;
      const cx = a.x_mm + a.width_mm / 2;
      const cy = a.y_mm + a.height_mm / 2;
      const r = Math.min(a.width_mm, a.height_mm) / 2;
      body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ink}" stroke-width="1.2" stroke-opacity="0.85"/>`;
      // Hint of content — diagonal hatching at low opacity so the disk
      // reads as "active" instead of empty.
      body += `<circle cx="${cx}" cy="${cy}" r="${Math.max(1, r - 4)}" fill="${ink}" fill-opacity="0.06"/>`;
    } else if (z.type === 'image') {
      const iz = z as GiftTemplateImageZone;
      const x = iz.x_mm;
      const y = iz.y_mm;
      const w = iz.width_mm;
      const h = iz.height_mm;
      const mask = iz.mask_preset;
      if (mask === 'heart' || mask === 'star') {
        const d = mask === 'heart' ? HEART_PATH : STAR_PATH;
        body += `<path d="${d}" transform="translate(${x},${y}) scale(${(w / 100).toFixed(4)},${(h / 100).toFixed(4)})" fill="${ink}" fill-opacity="0.10" stroke="${ink}" stroke-width="0.8"/>`;
      } else if (mask === 'circle') {
        body += `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${ink}" fill-opacity="0.10" stroke="${ink}" stroke-width="0.8"/>`;
      } else {
        body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ink}" fill-opacity="0.10" stroke="${ink}" stroke-width="0.8"/>`;
      }
    } else if (z.type === 'text') {
      const t = z as GiftTemplateTextZone;
      const x = t.x_mm;
      const y = t.y_mm;
      const w = t.width_mm;
      const h = t.height_mm;
      const lineH = Math.max(2, Math.min(6, h * 0.5));
      const lineY = y + (h - lineH) / 2;
      body += `<rect x="${x}" y="${lineY}" width="${w}" height="${lineH}" fill="${ink}" fill-opacity="0.55" rx="0.5"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="200" height="200" fill="${bg}"/>${body}</svg>`;

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'block' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
