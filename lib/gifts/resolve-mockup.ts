import type { GiftProduct, GiftProductVariant, MockupArea, MockupOverride } from './types';
import type { ShapeKind } from './shape-options';

export type ResolvedMockup = {
  url: string;
  area: MockupArea | null;
};

/**
 * Picks the mockup image + customer-draggable area for the live preview.
 *
 * URL precedence (visual material — what the customer SEES), highest to lowest:
 *   1. Selected colour swatch — when the customer picks a swatch on the
 *      variant tile, the swatch's own product shot replaces the visible
 *      mockup so colour changes are reflected immediately. This wins over
 *      surface mockups too (a multi-face variant in rose gold should look
 *      rose gold across all sides — admin only uploads one shot per
 *      colour). Trade-off: per-side angles are lost when a swatch is picked.
 *   2. Active surface mockup (multi-face variants — 3-D keychain).
 *   3. Per-prompt override — the customer's art style has its own shot.
 *   4. Per-shape override — the customer's shape has its own mockup.
 *   5. Variant's `mockup_url`, then product's, as final fallback.
 *
 * AREA precedence (where the customer's photo / engraving sits), highest
 * to lowest — independent of URL since the engraving zone doesn't move
 * when the material changes:
 *   1. Active surface area
 *   2. Per-prompt override area
 *   3. Per-shape override area
 *   4. Variant's area, then product's
 */
export function resolveMockup(input: {
  product: Pick<GiftProduct, 'mockup_url' | 'mockup_area'>;
  variant: Pick<
    GiftProductVariant,
    'mockup_url' | 'mockup_area' | 'surfaces' | 'mockup_by_shape' | 'mockup_by_prompt_id'
  > | null | undefined;
  activeSurfaceId?: string | null;
  selectedPromptId?: string | null;
  shapePickerActive?: boolean;
  selectedShapeKind?: ShapeKind | null;
  /** mockup_url of the currently-picked colour swatch on the variant tile. */
  selectedColourMockupUrl?: string | null;
}): ResolvedMockup {
  const {
    product,
    variant,
    activeSurfaceId,
    selectedPromptId,
    shapePickerActive,
    selectedShapeKind,
    selectedColourMockupUrl,
  } = input;

  const surfaces = Array.isArray(variant?.surfaces) ? variant!.surfaces : [];
  const activeSurface = surfaces.length > 0
    ? (surfaces.find((s) => s.id === activeSurfaceId) ?? surfaces[0])
    : null;

  const promptOverride: MockupOverride | undefined =
    selectedPromptId && variant?.mockup_by_prompt_id
      ? variant.mockup_by_prompt_id[selectedPromptId]
      : undefined;

  const shapeOverride: MockupOverride | undefined =
    shapePickerActive && selectedShapeKind && variant?.mockup_by_shape
      ? variant.mockup_by_shape[selectedShapeKind]
      : undefined;

  // ── URL: colour swatch wins, then the standard precedence ──
  let url = '';
  if (selectedColourMockupUrl) {
    url = selectedColourMockupUrl;
  } else if (activeSurface?.mockup_url) {
    url = activeSurface.mockup_url;
  } else if (promptOverride?.url) {
    url = promptOverride.url;
  } else if (shapeOverride?.url) {
    url = shapeOverride.url;
  } else {
    url = variant?.mockup_url || product.mockup_url || '';
  }

  // ── Area: independent of URL — surface > prompt > shape > variant > product ──
  let area = null;
  if (activeSurface?.mockup_area) area = activeSurface.mockup_area;
  else if (promptOverride?.area) area = promptOverride.area;
  else if (shapeOverride?.area) area = shapeOverride.area;
  else area = variant?.mockup_area ?? product.mockup_area ?? null;

  return { url, area };
}
