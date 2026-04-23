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

import type { GiftProductVariant } from '@/lib/gifts/types';
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
};

export function GiftVariantLivePreview({
  variants,
  selectedId,
  onSelect,
  previewUrl,
  title,
}: Props) {
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
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              style={{
                background: '#fff',
                border: active ? '3px solid var(--pv-magenta)' : '2px solid var(--pv-rule)',
                padding: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: active ? '4px 4px 0 var(--pv-magenta)' : 'none',
                transition: 'transform 0.12s, box-shadow 0.12s',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <VariantTile variant={v} previewUrl={previewUrl ?? null} />
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
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VariantTile({
  variant,
  previewUrl,
}: {
  variant: GiftProductVariant;
  previewUrl: string | null;
}) {
  const area = variant.mockup_area;
  const hasComposite = previewUrl && variant.mockup_url && area;
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
      {variant.mockup_url ? (
        <img
          src={variant.mockup_url}
          alt={variant.name}
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
          {variant.name}
        </div>
      )}
      {hasComposite && (
        <img
          src={previewUrl!}
          alt=""
          style={{
            position: 'absolute',
            left: `${area!.x}%`,
            top: `${area!.y}%`,
            width: `${area!.width}%`,
            height: `${area!.height}%`,
            objectFit: 'cover',
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
