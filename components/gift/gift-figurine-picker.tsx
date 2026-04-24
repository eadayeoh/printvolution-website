'use client';

export type FigurineOption = {
  slug: string;
  name: string;
  image_url: string;
  price_delta_cents?: number;
};

type Props = {
  options: FigurineOption[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

export function GiftFigurinePicker({ options, selectedSlug, onSelect }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 10,
      }}
    >
      {options.map((o) => {
        const active = selectedSlug === o.slug;
        return (
          <button
            key={o.slug}
            type="button"
            onClick={() => onSelect(o.slug)}
            style={{
              padding: 10,
              border: active ? '3px solid var(--pv-magenta)' : '2px solid var(--pv-rule)',
              background: '#fff',
              cursor: 'pointer',
              boxShadow: active ? '3px 3px 0 var(--pv-magenta)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
            title={o.name}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                background: '#fafaf7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {o.image_url ? (
                <img
                  src={o.image_url}
                  alt={o.name}
                  style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ fontSize: 24, color: '#ccc' }}>?</div>
              )}
            </div>
            <div
              style={{
                fontFamily: 'var(--pv-f-body)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--pv-ink)',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {o.name}
            </div>
            {typeof o.price_delta_cents === 'number' && o.price_delta_cents > 0 && (
              <div
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 10,
                  color: 'var(--pv-magenta)',
                  fontWeight: 800,
                }}
              >
                +S${(o.price_delta_cents / 100).toFixed(2)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
