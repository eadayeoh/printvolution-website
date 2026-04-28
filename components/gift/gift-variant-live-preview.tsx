'use client';

// Variant overview grid. Replaces the small GiftVariantPicker when a
// gift parent has 2+ variants — each tile shows that variant's mockup
// with the customer's current design composited into the mockup_area,
// so the customer can compare "my design on a T-shirt vs long sleeve
// vs hoodie" at a glance instead of clicking into every variant.
//
// The tiles use CSS positioning + mix-blend-mode: multiply rather than
// a per-tile <canvas>. Canvas compositing for 10 tiles would stall the
// main thread on every preview swap; CSS is near-instant and the
// fidelity is good enough for an overview — the big LIVE PREVIEW at
// the top of the page still uses GiftMockupPreview for the selected
// variant at full canvas fidelity.
//
// When a variant has colour_swatches, each tile shows a little swatch
// row below — picking a swatch swaps the displayed mockup on that tile
// and (if the tile is selected) reports the colour choice back to the
// parent so it flows into the cart line.

import { useState } from 'react';
import type { GiftProductVariant, GiftVariantColourSwatch } from '@/lib/gifts/types';
import { formatSGD } from '@/lib/utils';

type Props = {
  variants: GiftProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Server-rendered design (e.g. AI-stylised or template-composited
   *  photo). When present, it's overlayed into each variant's
   *  mockup_area so the customer sees their design on every option. */
  previewUrl?: string | null;
  /** Label shown under the picker (e.g. "Pick your base"). */
  title?: string;
  /** When a swatch on the currently-selected variant is picked, the
   *  parent gets notified so it can record the choice on the cart line
   *  (or re-composite a bigger preview off this colour's mockup). */
  onColourChange?: (colour: GiftVariantColourSwatch | null) => void;
  /** Per-template swatch override. When set (active template owns the
   *  customer colour picker), every variant tile renders with this list
   *  instead of its own variant.colour_swatches. Empty array hides the
   *  swatch row entirely. Null/undefined falls back to per-variant
   *  swatches (legacy / non-renderer products). */
  swatchOverride?: GiftVariantColourSwatch[] | null;
};

export function GiftVariantLivePreview({
  variants,
  selectedId,
  onSelect,
  previewUrl,
  title,
  onColourChange,
  swatchOverride,
}: Props) {
  // Per-variant selected swatch index. Keyed by variant id so switching
  // the selected tile doesn't reset sibling tiles' swatch choices.
  const [swatchIdxByVariant, setSwatchIdxByVariant] = useState<Record<string, number>>({});

  /** Resolved swatches for a variant — template override (when set)
   *  always wins over the variant's own list. */
  const swatchesFor = (v: GiftProductVariant): GiftVariantColourSwatch[] => {
    if (swatchOverride !== undefined && swatchOverride !== null) {
      // Empty array intentionally returns empty (hides the row).
      return swatchOverride.map((s) => ({
        name: s.name,
        hex: s.hex,
        mockup_url: s.mockup_url ?? '',
      }));
    }
    return v.colour_swatches;
  };

  function chooseSwatch(variantId: string, swatchIdx: number, swatch: GiftVariantColourSwatch) {
    setSwatchIdxByVariant((prev) => ({ ...prev, [variantId]: swatchIdx }));
    if (variantId === selectedId) onColourChange?.(swatch);
  }

  function chooseVariant(v: GiftProductVariant) {
    onSelect(v.id);
    const idx = swatchIdxByVariant[v.id];
    const list = swatchesFor(v);
    const s = list[idx];
    onColourChange?.(s ?? null);
  }

  if (variants.length === 0) return null;
  return (
    <div>
      {title && (
        <div
          style={{
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--pv-ink)',
            marginBottom: 10,
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        }}
      >
        {variants.map((v) => {
          const active = v.id === selectedId;
          const swatchIdx = swatchIdxByVariant[v.id];
          const variantSwatches = swatchesFor(v);
          const chosenSwatch = variantSwatches[swatchIdx];
          const displayedMockup = chosenSwatch?.mockup_url || v.mockup_url;
          return (
            <div
              key={v.id}
              style={{
                background: '#fff',
                border: active ? '3px solid var(--pv-magenta)' : '2px solid var(--pv-rule)',
                overflow: 'hidden',
                boxShadow: active ? '4px 4px 0 var(--pv-magenta)' : 'none',
                transition: 'transform 0.12s, box-shadow 0.12s',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <button
                type="button"
                onClick={() => chooseVariant(v)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <VariantTile
                  variantName={v.name}
                  mockupUrl={displayedMockup}
                  mockupArea={v.mockup_area}
                  previewUrl={previewUrl ?? null}
                />
                <div style={{ padding: '8px 10px', borderTop: '1px solid var(--pv-rule)' }}>
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-body)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--pv-ink)',
                      lineHeight: 1.2,
                    }}
                  >
                    {v.name}
                  </div>
                  {v.base_price_cents > 0 && (
                    <div
                      style={{
                        fontFamily: 'var(--pv-f-display)',
                        fontSize: 16,
                        color: 'var(--pv-magenta)',
                        letterSpacing: '-0.01em',
                        marginTop: 2,
                      }}
                    >
                      {formatSGD(v.base_price_cents)}
                    </div>
                  )}
                  {chosenSwatch && (
                    <div
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 10,
                        color: 'var(--pv-muted)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        marginTop: 2,
                      }}
                    >
                      {chosenSwatch.name}
                    </div>
                  )}
                  {/* Features render below the main preview now, not here — kept
                      variant tiles compact so the grid scans as "pick a base". */}
                </div>
              </button>
              {variantSwatches.length > 0 && (
                <div
                  style={{
                    padding: '10px 10px 12px',
                    borderTop: '1px solid var(--pv-rule)',
                    background: 'var(--pv-cream-warm, #FFF4E5)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: chosenSwatch ? 'var(--pv-ink)' : 'var(--pv-magenta)',
                      marginBottom: 6,
                    }}
                  >
                    {chosenSwatch
                      ? `Colour: ${chosenSwatch.name}`
                      : '↓ Pick a colour'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    {variantSwatches.map((s, sIdx) => {
                      const activeSwatch = sIdx === swatchIdx;
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            chooseSwatch(v.id, sIdx, s);
                          }}
                          title={s.name}
                          aria-label={s.name}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: /^#[0-9A-Fa-f]{6}$/.test(s.hex) ? s.hex : '#ccc',
                            border: activeSwatch
                              ? '3px solid var(--pv-ink)'
                              : '2px solid var(--pv-ink)',
                            boxShadow: activeSwatch
                              ? '0 0 0 3px var(--pv-magenta)'
                              : '2px 2px 0 var(--pv-ink)',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'transform 0.12s',
                            transform: activeSwatch ? 'scale(1.08)' : 'scale(1)',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VariantTile({
  variantName,
  mockupUrl,
  mockupArea,
  previewUrl,
}: {
  variantName: string;
  mockupUrl: string;
  mockupArea: GiftProductVariant['mockup_area'];
  previewUrl: string | null;
}) {
  const hasComposite = previewUrl && mockupUrl && mockupArea;
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        background: 'var(--pv-cream)',
        overflow: 'hidden',
      }}
    >
      {mockupUrl ? (
        <img
          src={mockupUrl}
          alt={variantName}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--pv-muted)',
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: 8,
            textAlign: 'center',
          }}
        >
          {variantName}
        </div>
      )}
      {hasComposite && (
        <img
          src={previewUrl!}
          alt=""
          style={{
            position: 'absolute',
            left: `${mockupArea.x}%`,
            top: `${mockupArea.y}%`,
            width: `${mockupArea.width}%`,
            height: `${mockupArea.height}%`,
            objectFit: 'cover',
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
