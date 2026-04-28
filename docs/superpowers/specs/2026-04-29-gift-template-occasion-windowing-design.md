# Gift template occasion windowing — design

**Date:** 2026-04-29
**Status:** Approved (brainstorm complete; ready for implementation plan)

## Summary

Let admin show certain gift templates only during a date window around a holiday (e.g. Mother's Day). Admin creates an occasion record (name, target date, days before, days after) and tags templates to it. The PDP "Pick a layout" picker hides out-of-window templates from customers, sorts in-window templates first, and stamps a badge on each in-window tile. Admin always sees all templates.

## Decisions

| | Decision |
|---|---|
| Modelling | Shared `gift_occasions` table (one row per occasion, reusable across templates and products). |
| Recurrence | Full `target_date`, admin updates yearly. No auto-recurrence logic. |
| Cardinality | One occasion per template (single nullable FK on `gift_templates`). Templates with no occasion are "always-on". |
| Out-of-window behaviour (PDP) | Hide entirely. Admin still sees them. |
| Empty-picker fallback | If every template on a product is occasion-gated and out of window, show only the always-on subset (those with no occasion). |
| Bookmark / shared URL | If `selectedTemplateId` resolves to a hidden template, reset to the new first visible template and surface a one-line inline notice in the picker. |
| Scope | Only the "Pick a layout" / "Pick a template" picker on the gift PDP. Not category listings, not hero strips, not SEO landing pages (for now). |
| Occasion-level pause | `is_active` flag on `gift_occasions`. Admin can pause an occasion without untagging templates. |
| Tile badge | In-window template tiles render a small magenta ribbon in the top-left, white text, showing the occasion's `badge_label`. |
| Sort | In-window templates first, preserving each group's existing `display_order`. |

## Schema

New migration `supabase/migrations/0084_gift_occasions.sql`:

```sql
create table public.gift_occasions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  badge_label text,
  target_date date not null,
  days_before integer not null default 14 check (days_before >= 0),
  days_after  integer not null default 2  check (days_after  >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_gift_occasions_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_occasions_updated_at on public.gift_occasions;
create trigger trg_gift_occasions_updated_at before update on public.gift_occasions
  for each row execute procedure public.touch_gift_occasions_updated_at();

alter table public.gift_templates
  add column if not exists occasion_id uuid
  references public.gift_occasions(id) on delete set null;

create index if not exists gift_templates_occasion_id_idx
  on public.gift_templates(occasion_id);

alter table public.gift_occasions enable row level security;

drop policy if exists "gift_occasions public read active" on public.gift_occasions;
create policy "gift_occasions public read active" on public.gift_occasions
  for select using (is_active = true);

drop policy if exists "gift_occasions admin all" on public.gift_occasions;
create policy "gift_occasions admin all" on public.gift_occasions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
```

(Final RLS predicate must match the project's existing admin-check pattern — verify against another `*_admin all*` policy in `0007_gifts.sql` when implementing.)

## Read-side filter

New file `lib/gifts/occasion.ts`:

```ts
export type GiftOccasion = {
  id: string;
  name: string;
  badge_label: string | null;
  target_date: string;     // YYYY-MM-DD
  days_before: number;
  days_after: number;
  is_active: boolean;
};

export function isOccasionInWindow(o: GiftOccasion, now: Date = new Date()): boolean {
  if (!o.is_active) return false;
  const target = new Date(o.target_date + 'T00:00:00');
  const from = new Date(target);
  from.setDate(from.getDate() - o.days_before);
  const until = new Date(target);
  until.setDate(until.getDate() + o.days_after);
  until.setHours(23, 59, 59, 999); // inclusive end-of-day
  return now >= from && now <= until;
}

export function filterTemplatesByOccasion(
  templates: GiftTemplate[],
  occasions: GiftOccasion[],
  now: Date = new Date(),
): {
  visible: GiftTemplate[];
  inWindowIds: Set<string>;
  badgeByTemplateId: Map<string, string>;
};
```

Filter rules:
1. Template with no `occasion_id` → visible (always-on).
2. Template with `occasion_id` whose occasion is in-window → visible, marked in-window, badge attached.
3. Template with `occasion_id` whose occasion is out-of-window → hidden.
4. Empty-picker fallback: if rules 1–3 produce zero visible templates, fall back to the always-on subset only (rule 1's templates from the unfiltered list).
5. Sort: in-window templates first (preserving `display_order` within group), then always-on by `display_order`.

Admin reads bypass this filter entirely.

## PDP changes

In `components/gift/gift-product-page.tsx` (and its data loader):

1. **Loader.** Wherever templates are fetched for the PDP, also fetch the relevant occasions and call `filterTemplatesByOccasion`. Pass `templates`, `inWindowIds`, `badgeByTemplateId` to the page component.
2. **Tile badge.** In both the renderer-driven picker (line ~2328 "Pick a layout") and the legacy picker (line ~2611 "Pick a template"), render a magenta ribbon in the top-left of in-window template tiles. ~10px font, 4px padding, label = `badgeByTemplateId.get(t.id)`.
3. **Sort.** Replace `templates.map((t) => …)` with the sorted `visible` array.
4. **Auto-pick.** Existing auto-init defaults to the first template — naturally picks the first in-window one because of the new sort.
5. **Bookmark fallback.** When the page resolves `selectedTemplateId` to a template that is not in the visible list (i.e. it was filtered out), reset to the new first visible template and render a one-line inline notice inside the picker section: _"That layout is out of season — showing today's lineup instead."_

## Admin changes

1. **New page `/admin/gift/occasions`** — list + create/edit. Fields: `name`, `badge_label`, `target_date`, `days_before`, `days_after`, `is_active`. Render a read-only "Currently shows from {from} to {until}" line and a "✓ in window now" / "○ out of window" indicator. Match existing admin page patterns (find the closest analogue, e.g. `/admin/gift/templates`, when implementing).
2. **Template edit form** — add an "Occasion" select (None / list of occasions ordered by `target_date` ascending). Persists to `gift_templates.occasion_id`.

## File touch list

**New:**
- `supabase/migrations/0084_gift_occasions.sql`
- `lib/gifts/occasion.ts`
- `app/admin/gift/occasions/page.tsx`
- `app/admin/gift/occasions/[id]/page.tsx` (or single-page CRUD — match existing admin patterns)

**Edited:**
- `components/gift/gift-product-page.tsx` — badge, sort, bookmark fallback notice
- The PDP data loader (likely `app/(site)/gift/[slug]/page.tsx` or `lib/gifts/products.ts` — confirm during implementation) — call the filter
- Admin template edit form — add occasion dropdown

## Out of scope

- Recurring / floating-date logic (Easter, "3rd Sunday in June"). Admin keys in the date manually each year.
- Many-to-many template ↔ occasion mapping. Single FK only.
- Occasion windowing on category listing rails, hero strips, SEO landing pages.
- Localised dates (e.g. UK Mother's Day vs US Mother's Day). One target_date per occasion row; admin can create separate occasions per region if needed later.
- A11y / keyboard navigation for the new admin pages beyond what other admin pages already do.

## Risks

- **Timezone drift.** `target_date` is a calendar date with no TZ. The window is computed in the server's local time. For UK-only commerce this is fine; if expanding regions later, revisit.
- **Always-on stays correct.** The fallback rule (#4) protects against accidentally emptying the picker, but it relies on at least one always-on template per product. If admin tags every template with an occasion, the picker can still go empty when all are out-of-window. We accept this — it's a config error admin will see in their own admin view.
