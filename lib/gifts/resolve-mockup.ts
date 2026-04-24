import type { GiftProduct, GiftProductVariant, MockupArea, MockupOverride } from './types';
import type { ShapeKind } from './shape-options';

export type ResolvedMockup = {
  url: string;
  area: MockupArea | null;
};

/**
 * Picks the mockup image + customer-draggable area for the live
 * preview. Precedence, highest to lowest:
 *   1. Active surface (multi-face variants — 3-D keychain / rotating
 *      frame). Returns the surface's own `mockup_url` / `mockup_area`.
 *   2. Per-prompt override — the customer's chosen art style has its
 *      own product shot (e.g. Figurine Photo Frame swaps wood vs UV).
 *   3. Per-shape override — the customer's chosen shape has its own
 *      mockup (LED Bases Cutout vs Rectangle).
 *   4. Variant's `mockup_url` / `mockup_area`.
 *   5. Product's `mockup_url` / `mockup_area` as final fallback.
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
}): ResolvedMockup {
  const {
    product,
    variant,
    activeSurfaceId,
    selectedPromptId,
    shapePickerActive,
    selectedShapeKind,
  } = input;

  const surfaces = Array.isArray(variant?.surfaces) ? variant!.surfaces : [];
  if (surfaces.length > 0) {
    const surface = surfaces.find((s) => s.id === activeSurfaceId) ?? surfaces[0];
    if (surface?.mockup_url) {
      return { url: surface.mockup_url, area: surface.mockup_area };
    }
  }

  if (selectedPromptId && variant?.mockup_by_prompt_id) {
    const override: MockupOverride | undefined = variant.mockup_by_prompt_id[selectedPromptId];
    if (override?.url) return { url: override.url, area: override.area };
  }

  if (shapePickerActive && selectedShapeKind && variant?.mockup_by_shape) {
    const override: MockupOverride | undefined = variant.mockup_by_shape[selectedShapeKind];
    if (override?.url) return { url: override.url, area: override.area };
  }

  return {
    url: variant?.mockup_url || product.mockup_url || '',
    area: variant?.mockup_area ?? product.mockup_area ?? null,
  };
}
