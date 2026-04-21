# Mixed Bundles (Services + Gifts) — Design Spec

**Date:** 2026-04-22
**Status:** approved-to-plan
**Scope:** extend the existing `bundles` system to allow a single bundle to contain items from the `products` (services) table **and** the `gift_products` table together. Shared listing page. Admin pre-fixes gift config (variant, style, pipeline, template, quantity); customer only uploads one photo per gift SKU in the bundle.

**Depends on:** [2026-04-22-gifts-section-design.md](2026-04-22-gifts-section-design.md) — variants, pipelines, and retention policy land as part of that spec. This bundles spec assumes those tables exist.

## 1. Problem

Today's `bundles` / `bundle_products` tables reference `public.products` only — gift SKUs can't be bundled. Wedding welcome packs, corporate launch kits, and event sets all want to combine printed collateral (services) with personalised items (gifts) at a discounted combined price. The listing at `/bundles` and the bundle detail page at `/bundle/[slug]` already exist for services-only bundles; we extend rather than replace.

## 2. Constraints and decisions locked

| Decision | Choice |
|---|---|
| Mixing within one bundle | A — services and gifts can live in the same bundle |
| Gift config inside a bundle | A — admin pre-fixes variant + style + pipeline + template + qty; customer only uploads the photo |
| Multiple gift SKUs per bundle | B — allowed; one photo per gift SKU, stacked upload blocks on the bundle page |
| Pricing model | Bundle's own `price_cents` + `discount_type` + `discount_value` is authoritative. Component prices don't sum to drive the bundle total — the admin sets it directly, same as today. |
| Retention policy | Inherits gifts 30-day purge (from the gifts spec). Every gift_order_item, regardless of origin, is subject to the same cron. |
| Shared listing | `/bundles` page stays one list. Each card gets a type badge: Services · Gifts · Mixed. No filters in v1; add if there are enough bundles to warrant them. |

Non-goals:
- Customer-adjustable variant, quantity, or style on the gift portion of a bundle
- Bundle templates that reuse the same photo across multiple gift SKUs (Q3 option C, deferred)
- Bundle-level discount codes stacking with per-component pricing (same as today — pricing is set once at the bundle level)

## 3. Data model

### 3.1 New: `bundle_gift_items`

Sits alongside existing `bundle_products`. Each row attaches a gift SKU to a bundle with all the gift config pre-fixed by admin.

```sql
create table bundle_gift_items (
  bundle_id uuid not null references bundles(id) on delete cascade,
  gift_product_id uuid not null references gift_products(id) on delete restrict,
  variant_id uuid references gift_product_variants(id) on delete restrict,
  prompt_id uuid references gift_prompts(id) on delete restrict,
  template_id uuid references gift_templates(id) on delete restrict,
  pipeline_id uuid references gift_pipelines(id) on delete restrict,
  override_qty integer not null default 1,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (bundle_id, gift_product_id)
);
create index bundle_gift_items_bundle_idx on bundle_gift_items(bundle_id);
```

`on delete restrict` on the four gift-side FKs prevents admin from deleting a gift variant / prompt / template / pipeline that's still referenced in a live bundle. Admin must first swap or deactivate the bundle.

RLS: public read for items whose bundle is `status = 'active'`. Admin/staff full access.

### 3.2 Altered: `bundles` — no schema change

Type badge (services / gifts / mixed) on the listing page is computed on read inside `lib/data/bundles.ts` from the existing joins on `bundle_products` and `bundle_gift_items`. No denormalised column, no triggers. The listing query already pulls both child arrays to count components — deriving the type from those counts is free.

### 3.3 Existing `bundle_products`: unchanged

All service-side mechanics stay exactly as today. No schema change.

### 3.4 Altered: `orders` item flow

At checkout, when an order contains a bundle line, create:
- Existing service line items (as today — one per `bundle_products` row)
- **New:** one `gift_order_items` row per `bundle_gift_items` row, linked to the order. Each row carries:
  - The customer's uploaded source asset for THAT gift SKU
  - `variant_id`, `prompt_id`, `template_id`, `pipeline_id` snapshots from the bundle
  - `variant_name_snapshot`, `variant_price_snapshot_cents` (zero because bundle absorbs pricing)
  - A `bundle_id` reference (new column on `gift_order_items`) so the staff queue can group them under the parent bundle

Add `bundle_id uuid references bundles(id) on delete set null` to `gift_order_items` for this link. When the staff queue renders, gift items that came from a bundle show the bundle name in the "Product" column ("Wedding Welcome Pack · Oak Round LED Base").

## 4. Admin flow

### 4.1 `/admin/bundles/[slug]` — extended

Existing page keeps the services "Add product" picker. Below it, a NEW panel:

```
┌─ Gift items in this bundle ──────────────────┐
│  [ + Add gift SKU ]                          │
│                                              │
│  1. Oak Round LED Base            [remove]   │
│     ┌─ Pre-fix the config ────────────────┐  │
│     │ Variant:   [Oak Round       ▼]      │  │
│     │ Style:     [Line Art        ▼]      │  │
│     │ Pipeline:  [laser-v1        ▼]      │  │
│     │ Template:  [— none —        ▼]      │  │
│     │ Quantity:  [ 50    ]                │  │
│     └────────────────────────────────────┘   │
│                                              │
│  2. Engraved Bottle Opener        [remove]   │
│     …                                        │
└──────────────────────────────────────────────┘
```

Dropdowns are scoped: only variants / prompts / templates that belong to the chosen gift_product_id are listed. Pipeline dropdown lists active pipelines whose `kind` matches the gift product's mode.

Server action validates: every gift SKU in the bundle must have variant + prompt + pipeline selected (nulls not allowed at save). Template can be null (gift product may not use templates).

### 4.2 `/admin/bundles` listing — unchanged

Same list with the two new type flags surfaced as small badges.

## 5. Customer flow

### 5.1 `/bundles` listing

Same card grid. New type badge on each card, derived from the component counts returned by `listBundles()`:

- Services only → no badge (existing default look)
- Gifts only → `● Gifts` badge
- Mixed → `● Mixed` badge

Otherwise identical.

### 5.2 `/bundle/[slug]` — extended

Existing bundle page layout keeps its hero + savings panel. Below the component list, for each gift SKU in the bundle, render a stacked upload block:

```
┌─ Your photo for: Oak Round LED Base ────────┐
│  [ drag-drop upload area ]                   │
│  Accepts JPG/PNG. Min 1,200 px. Max 20 MB.   │
│                                              │
│  ┌─ Live preview ────────────────────────┐   │
│  │ [photo composited onto Oak Round      │   │
│  │  mockup, watermarked 72 DPI]          │   │
│  └──────────────────────────────────────┘    │
│                                              │
│  Style: Line Art (set by bundle)   ← readonly│
│  Variant: Oak Round (set by bundle)          │
│  Qty: 50 (set by bundle)                     │
└──────────────────────────────────────────────┘
```

If the bundle has 3 gift SKUs, 3 of these blocks stack. **Add to cart is disabled until every gift block has a source upload that produced a preview.** One 30-day retention notice renders once above the cart button (not per block) referring to all uploads in the bundle.

Service items appear in their own list above the gift blocks — read-only, exactly as today.

### 5.3 Cart + checkout

Bundle line serialises:
- `bundle_id`, `bundle_name_snapshot`, `bundle_price_cents`
- `service_components`: array of `{ product_id, qty, config }` (unchanged)
- `gift_components`: array of `{ gift_product_id, variant_id, prompt_id, template_id, pipeline_id, qty, source_asset_id, preview_asset_id }`

At checkout, the existing order-creation code handles service components as today. The new code fans out `gift_components` into `gift_order_items` rows with `bundle_id` linkage.

## 6. Staff queue integration

`/admin/gifts/orders` (from the gifts spec) already lists `gift_order_items`. Two additions:

- Row expands to show "From bundle: Wedding Welcome Pack (#ORDER-1234)" when `bundle_id is not null`
- Filter: "From a bundle" checkbox (reads rows where `bundle_id is not null`). Useful for batching bundle fulfilment together with the service components.

Service-side components in a bundle order go to their normal production flow (existing process, not touched).

## 7. Pricing

No change to how `bundles.price_cents` and `discount_value` work. The `bundle_gift_items.override_qty` is informational only — it tells the queue how many to print, but does NOT add to the cart total. The admin sets the bundle's total; the components define what the customer receives.

Consequence: `gift_order_items.variant_price_snapshot_cents` for bundle-derived items is written as `0` (the customer didn't pay per-variant; they paid the bundle price). A new `bundle_id is not null` check on the staff queue surfaces this visually.

## 8. Retention

Unchanged from the gifts spec. Any `gift_order_items` row, bundle-derived or standalone, is purged at day 30 (source + production; preview kept). The bundle order itself is never purged — it's a customer order record.

## 9. Migration order

1. DB migrations for `bundle_gift_items` + `gift_order_items.bundle_id` + `bundles.has_services` / `has_gifts` (with triggers).
2. Ship admin CRUD for the new gift-items panel on `/admin/bundles/[slug]`.
3. Ship listing badge in `/bundles`.
4. Ship per-gift upload blocks + stacked preview on `/bundle/[slug]`.
5. Wire cart + checkout fan-out into `gift_order_items`.
6. Extend staff queue filter + "from bundle" display.

No changes to the purge cron, the mockup compositor, the pipeline runner, or the existing services bundle flow.

## 10. Success criteria

- Admin can create a bundle named "Wedding Welcome Pack" with 100 printed cards (service) + 50 Oak Round LED Bases (gift) + 20 Photo Frames (gift), setting each gift's variant + style + pipeline + qty.
- Customer visits `/bundle/wedding-welcome-pack`, sees the component list, uploads two separate photos (one for LED Bases, one for Photo Frames), sees both live previews, and adds to cart.
- Cart shows one bundle line at the bundle's price. Checkout completes.
- Staff queue at `/admin/gifts/orders` shows two rows tagged with the bundle name, each with its own download buttons for the 300 DPI PNG + PDF.
- On day 30, both gift items' source + production assets purge; the customer's order history still shows the two watermarked previews.

## 11. Open items for the plan

- Exact UI for the admin gift-item picker: searchable dropdown vs. modal picker — call at plan time based on how many gift SKUs exist.
- Whether to add filter chips on `/bundles` in v1 (Services / Gifts / Mixed). Default: no chips; add if the catalogue needs them.
- Email confirmation copy change: the current bundle-order email templates need a new section listing the gift components. Add to the plan.
