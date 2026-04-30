export type Tier = {
  key: 'new' | 'bronze' | 'silver' | 'gold';
  label: string;
  /** Lifetime points required to enter this tier. */
  threshold: number;
  /** Hex used for the badge + progress bar fill. */
  color: string;
  /** One-line perk shown on /account. */
  perk: string;
};

// Lifetime points = total_earned. Each S$1 spent ≈ 1 point (see
// add_member_points usage in checkout/actions.ts), so thresholds map
// roughly to lifetime spend in SGD.
export const TIERS: Tier[] = [
  { key: 'new',    label: 'New',    threshold: 0,    color: '#94a3b8', perk: 'Earn 1 point per S$1 spent' },
  { key: 'bronze', label: 'Bronze', threshold: 100,  color: '#b45309', perk: 'Early access to new bundles' },
  { key: 'silver', label: 'Silver', threshold: 500,  color: '#64748b', perk: 'Priority production queue' },
  { key: 'gold',   label: 'Gold',   threshold: 2000, color: '#E91E8C', perk: 'Free local delivery + birthday credit' },
];

export type TierProgress = {
  current: Tier;
  next: Tier | null;
  pointsIntoTier: number;
  pointsToNext: number;
  /** 0–1 progress through the current tier band. 1 if there's no next tier. */
  fraction: number;
};

export function getTierProgress(totalEarned: number): TierProgress {
  const lifetime = Math.max(0, totalEarned | 0);
  let current = TIERS[0];
  for (const t of TIERS) {
    if (lifetime >= t.threshold) current = t;
  }
  const next = TIERS.find((t) => t.threshold > current.threshold) ?? null;
  if (!next) {
    return { current, next: null, pointsIntoTier: lifetime - current.threshold, pointsToNext: 0, fraction: 1 };
  }
  const band = next.threshold - current.threshold;
  const into = lifetime - current.threshold;
  return {
    current,
    next,
    pointsIntoTier: into,
    pointsToNext: Math.max(0, next.threshold - lifetime),
    fraction: band > 0 ? Math.min(1, Math.max(0, into / band)) : 0,
  };
}
