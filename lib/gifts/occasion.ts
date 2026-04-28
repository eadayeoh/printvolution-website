import type { GiftOccasion, GiftTemplate } from './types';

export function isOccasionInWindow(o: GiftOccasion, now: Date = new Date()): boolean {
  if (!o.is_active) return false;
  const target = new Date(o.target_date + 'T00:00:00');
  if (Number.isNaN(target.getTime())) return false;
  const from = new Date(target);
  from.setDate(from.getDate() - (o.days_before ?? 0));
  from.setHours(0, 0, 0, 0);
  const until = new Date(target);
  until.setDate(until.getDate() + (o.days_after ?? 0));
  until.setHours(23, 59, 59, 999);
  return now >= from && now <= until;
}

export function describeOccasionWindow(o: GiftOccasion): { fromIso: string; untilIso: string } {
  const target = new Date(o.target_date + 'T00:00:00');
  const from = new Date(target);
  from.setDate(from.getDate() - (o.days_before ?? 0));
  const until = new Date(target);
  until.setDate(until.getDate() + (o.days_after ?? 0));
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
