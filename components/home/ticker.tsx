export type TickerItem = { text?: string };

export function Ticker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div
      style={{
        background: 'var(--pv-magenta)',
        color: '#fff',
        borderTop: '3px solid var(--pv-ink)',
        borderBottom: '3px solid var(--pv-ink)',
        overflow: 'hidden',
        padding: '14px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 48,
          fontFamily: 'var(--pv-f-display)',
          fontSize: 20,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          animation: 'pv-ticker-scroll 35s linear infinite',
          letterSpacing: '-0.01em',
        }}
      >
        {doubled.map((it, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
            {it.text}
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                background: 'var(--pv-yellow)',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              }}
            />
          </span>
        ))}
      </div>
      <style>{`
        @keyframes pv-ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
