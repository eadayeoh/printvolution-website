import type { GiftOccasion, GiftTemplate } from './types';

// Parse YYYY-MM-DD as UTC midnight so the window boundaries don't shift
// with the server's local timezone (Vercel runs in UTC; admin previews
// elsewhere). Returns null on malformed input.
function parseTargetDateUtc(yyyyMmDd: string): Date | null {
  const d = new Date(yyyyMmDd + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDaysUtc(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function isOccasionInWindow(o: GiftOccasion, now: Date = new Date()): boolean {
  if (!o.is_active) return false;
  const target = parseTargetDateUtc(o.target_date);
  if (!target) return false;
  const from = addDaysUtc(target, -(o.days_before ?? 0));
  const until = addDaysUtc(target, +(o.days_after ?? 0));
  until.setUTCHours(23, 59, 59, 999);
  return now >= from && now <= until;
}

export function describeOccasionWindow(o: GiftOccasion): { fromIso: string; untilIso: string } {
  const target = parseTargetDateUtc(o.target_date) ?? new Date(NaN);
  const from = addDaysUtc(target, -(o.days_before ?? 0));
  const until = addDaysUtc(target, +(o.days_after ?? 0));
  return {
    fromIso: from.toISOString().slice(0, 10),
    untilIso: until.toISOString().slice(0, 10),
  };
}

export type OccasionFilterResult = {
  visible: GiftTemplate[];
  inWindowIds: Set<string>;
  badgeByTemplateId: Map<string, string>;
};

export function filterTemplatesByOccasion(
  templates: GiftTemplate[],
  occasions: GiftOccasion[],
  now: Date = new Date(),
): OccasionFilterResult {
  const occById = new Map(occasions.map((o) => [o.id, o]));
  const inWindowIds = new Set<string>();
  const badgeByTemplateId = new Map<string, string>();
  const visible: GiftTemplate[] = [];
  const fallbackAlwaysOn: GiftTemplate[] = [];

  for (const t of templates) {
    const occId = t.occasion_id ?? null;
    if (!occId) {
      visible.push(t);
      fallbackAlwaysOn.push(t);
      continue;
    }
    const occ = occById.get(occId);
    if (occ && isOccasionInWindow(occ, now)) {
      visible.push(t);
      inWindowIds.add(t.id);
      const label = (occ.badge_label && occ.badge_label.trim()) || occ.name;
      badgeByTemplateId.set(t.id, label);
    }
    // Out-of-window: drop entirely.
  }

  // Empty-picker fallback: if every template was occasion-gated and out
  // of window, keep the always-on subset visible. Customers should not
  // see an empty picker on a product that has any always-on layout.
  const finalVisible = visible.length > 0 ? visible : fallbackAlwaysOn;

  // Sort: in-window first (preserving display_order within), then always-on
  // by display_order. The input is already display_order-sorted by the
  // data layer, so a stable sort on (in-window first) is enough.
  finalVisible.sort((a, b) => {
    const ai = inWindowIds.has(a.id) ? 0 : 1;
    const bi = inWindowIds.has(b.id) ? 0 : 1;
    if (ai !== bi) return ai - bi;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });

  return { visible: finalVisible, inWindowIds, badgeByTemplateId };
}
