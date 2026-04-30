import type { GiftTemplateZone, GiftTemplateImageZone } from './types';

const HEART_PATH =
  'M50,90 C30,72 6,55 6,32 C6,18 17,8 30,8 C39,8 46,13 50,20 C54,13 61,8 70,8 C83,8 94,18 94,32 C94,55 70,72 50,90 Z';
const STAR_PATH =
  'M50,4 L61,38 L96,38 L67,59 L78,93 L50,72 L22,93 L33,59 L4,38 L39,38 Z';

/** Emit `<image>` tags for each image zone in the template, shared
 *  between the city_map + star_map renderers. Customer passes blob:
 *  URLs for the live preview; foil-svg admin route passes base64
 *  data: URIs so the SVG is self-contained. Mask preset (heart /
 *  circle / star) is applied via per-zone clipPath; an empty fill
 *  renders an outlined placeholder so admin sees the slot. */
export function emitImageZones(
  zones: GiftTemplateZone[] | null | undefined,
  imageFills: Record<string, string> | undefined,
  W: number, H: number,
  outlineColor: string,
): string {
  if (!zones) return '';
  const sx = W / 200;
  const sy = H / 200;
  let body = '';
  for (const z of zones) {
    if (z.type !== 'image') continue;
    const iz = z as GiftTemplateImageZone;
    const x = iz.x_mm * sx;
    const y = iz.y_mm * sy;
    const w = iz.width_mm * sx;
    const h = iz.height_mm * sy;
    const url = imageFills?.[iz.id];
    const mask = iz.mask_preset;
    const rotate = iz.rotation_deg
      ? ` transform="rotate(${iz.rotation_deg} ${(x + w / 2).toFixed(2)} ${(y + h / 2).toFixed(2)})"`
      : '';
    if (mask && mask !== 'circle') {
      const clipId = `imgClip-${iz.id}`;
      const presetD = mask === 'heart' ? HEART_PATH : mask === 'star' ? STAR_PATH : null;
      if (presetD) {
        body += `<defs><clipPath id="${clipId}" clipPathUnits="objectBoundingBox" transform="scale(0.01)"><path d="${presetD}"/></clipPath></defs>`;
      }
      if (url) {
        body += `<g${rotate}><image href="${url}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/></g>`;
      } else if (presetD) {
        body += `<g${rotate}><path d="${presetD}" transform="translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${(w / 100).toFixed(4)},${(h / 100).toFixed(4)})" fill="none" stroke="${outlineColor}" stroke-width="0.4" stroke-dasharray="2 1.5" opacity="0.55"/></g>`;
      }
    } else if (mask === 'circle') {
      const clipId = `imgClip-${iz.id}`;
      body += `<defs><clipPath id="${clipId}"><ellipse cx="${(x + w / 2).toFixed(2)}" cy="${(y + h / 2).toFixed(2)}" rx="${(w / 2).toFixed(2)}" ry="${(h / 2).toFixed(2)}"/></clipPath></defs>`;
      if (url) {
        body += `<g${rotate}><image href="${url}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/></g>`;
      } else {
        body += `<g${rotate}><ellipse cx="${(x + w / 2).toFixed(2)}" cy="${(y + h / 2).toFixed(2)}" rx="${(w / 2).toFixed(2)}" ry="${(h / 2).toFixed(2)}" fill="none" stroke="${outlineColor}" stroke-width="0.4" stroke-dasharray="2 1.5" opacity="0.55"/></g>`;
      }
    } else {
      if (url) {
        body += `<g${rotate}><image href="${url}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" preserveAspectRatio="xMidYMid slice"/></g>`;
      } else {
        body += `<g${rotate}><rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="none" stroke="${outlineColor}" stroke-width="0.4" stroke-dasharray="2 1.5" opacity="0.55"/></g>`;
      }
    }
  }
  return body;
}
