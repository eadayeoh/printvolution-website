// Built-in alpha-mask silhouettes for image zones.
//
// Each preset returns an SVG path on a 100×100 viewBox so callers
// can scale to whatever zone size they need. Used by:
//   - server composite: rendered to a sized PNG, applied to the
//     photo with sharp's dest-in blend
//   - admin/customer preview: dropped into <clipPath> defs and
//     referenced via CSS clip-path

import type { GiftImageZoneMaskPreset } from './types';

/** CSS clip-path expression for a preset, suitable for inline style.
 *  Returns `undefined` when no preset is set. */
export function maskClipPathCss(preset: GiftImageZoneMaskPreset | null | undefined): string | undefined {
  if (!preset) return undefined;
  if (preset === 'circle') return 'circle(50% at 50% 50%)';
  return `url(#pv-mask-${preset})`;
}

export const MASK_PRESET_LABELS: Record<GiftImageZoneMaskPreset, string> = {
  circle: 'Circle',
  heart: 'Heart',
  star: 'Star',
};

// Each path lives on a 100×100 viewBox, fully filling its bounds.
const PATHS: Record<GiftImageZoneMaskPreset, string> = {
  circle: 'M50,0 A50,50 0 1 1 50,100 A50,50 0 1 1 50,0 Z',
  // Symmetric heart, fills the 100×100 box.
  heart:
    'M50,90 C30,72 6,55 6,32 C6,18 17,8 30,8 C39,8 46,13 50,20 C54,13 61,8 70,8 C83,8 94,18 94,32 C94,55 70,72 50,90 Z',
  // 5-point star, fills the 100×100 box.
  star: 'M50,4 L61,38 L96,38 L67,59 L78,93 L50,72 L22,93 L33,59 L4,38 L39,38 Z',
};

export function maskPresetPath(preset: GiftImageZoneMaskPreset): string {
  return PATHS[preset];
}

/** White-on-transparent SVG sized to the given pixel box. The white
 *  silhouette is the visible area; everything outside is alpha 0.
 *  Server composite feeds this into sharp + dest-in. */
export function maskPresetSvg(preset: GiftImageZoneMaskPreset, widthPx: number, heightPx: number): string {
  const d = PATHS[preset];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" width="${widthPx}" height="${heightPx}">
    <path d="${d}" fill="#fff"/>
  </svg>`;
}
