import { TIERS, getTierProgress } from '@/lib/tiers';

type Props = {
  totalEarned: number;
};

export function TierProgress({ totalEarned }: Props) {
  const { current, next, pointsToNext, fraction, pointsIntoTier } = getTierProgress(totalEarned);

  return (
    <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 14, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Tier</div>
        <span
          style={{
            fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
            color: '#fff', background: current.color, textTransform: 'uppercase', letterSpacing: 0.8,
          }}
        >
          {current.label}
        </span>
      </div>

      <div style={{ fontSize: 13, color: '#555', marginTop: 4, marginBottom: 14 }}>{current.perk}</div>

      {next ? (
        <>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>{pointsToNext} pts to <strong style={{ color: next.color }}>{next.label}</strong></span>
            <span style={{ color: '#aaa' }}>{pointsIntoTier} / {next.threshold - current.threshold}</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(fraction * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to ${next.label} tier`}
            style={{ height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round(fraction * 100)}%`,
                background: next.color,
                transition: 'width 240ms ease-out',
              }}
            />
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
          You&rsquo;re at the top tier. Thank you 🙌
        </div>
      )}

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>All tiers</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {TIERS.map((t) => (
            <div
              key={t.key}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 11, color: t.key === current.key ? '#0a0a0a' : '#888',
                fontWeight: t.key === current.key ? 800 : 500,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: t.color, display: 'inline-block' }} />
                {t.label}
              </span>
              <span>{t.threshold > 0 ? `${t.threshold}+ pts` : 'Sign-up'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
