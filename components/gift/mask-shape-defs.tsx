import { maskPresetPath } from '@/lib/gifts/mask-shapes';

// SVG defs for non-circle mask presets. Included once per page;
// any element on the page can then use clip-path: url(#pv-mask-heart).
// clipPathUnits="objectBoundingBox" lets each consumer share the same
// path regardless of zone size.
export function MaskShapeDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <clipPath id="pv-mask-heart" clipPathUnits="objectBoundingBox">
          <path d={maskPresetPath('heart')} transform="scale(0.01)" />
        </clipPath>
        <clipPath id="pv-mask-star" clipPathUnits="objectBoundingBox">
          <path d={maskPresetPath('star')} transform="scale(0.01)" />
        </clipPath>
      </defs>
    </svg>
  );
}
