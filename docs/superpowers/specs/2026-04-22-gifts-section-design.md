# Gifts Section — Design Spec

**Date:** 2026-04-22
**Status:** approved-to-plan
**Scope:** productise the Gifts subsystem for customer-facing launch — add variant bases, per-product pipelines, style picker polish, staff production queue, and a 30-day image-retention policy.

## 1. Problem

The Gifts subsystem is architecturally complete (schema, preview + production pipelines, template zones, mockup compositor, admin CRUD pages) but not yet productised. Before we can sell SKUs like "LED Photo Base" we need to close five gaps:

1. Customer must pick between **Line Art** and **Realistic** imagery per product, with admin-tunable prompts.
2. Products can have **1..N physical base variants** (e.g. Oak / Acrylic / Metal) — each with its own mockup, features, and price. The customer's design stays the same across variants.
3. Each product must be pinned to a **named production pipeline** (model + endpoint + default params) that the admin controls.
4. Staff need a **production queue UI** where they download the 300 DPI PNG + wrapped PDF, see customer details, and mark jobs as shipped.
5. Customer uploads and production files are heavy — we need a **30-day auto-purge** with an on-site notice so customers know.

## 2. Constraints and decisions

Decisions locked during brainstorming (2026-04-22):

| Decision | Choice |
|---|---|
| Prompt hierarchy | Per mode, with per-product override |
| Variant data model | Own mockup + features + price per variant; design is shared (compositor swaps mockup) |
| Variant pricing | Each variant has own `base_price_cents` and `price_tiers` |
| Production output | PNG + wrapped PDF (keep current pipeline) |
| Staff handoff | Admin queue page at `/admin/gifts/orders` |
| Retention scope | Purge SOURCE and PRODUCTION at day 30; keep 72 DPI watermarked PREVIEW indefinitely for customer order history |
| Variants admin UX | Inline on product edit page (no separate tab) |

Non-goals (deferred):
- Gift bundles (multiple gifts discounted together)
- Customer-side recovery of expired assets
- AI prompt A/B testing or version history
- Reprints past the 30-day window — not supported by design

## 3. Data model

### 3.1 New: `gift_pipelines`

Admin-curated processing recipes. A pipeline tells the engine which transform to run and with what params. This decouples the *style* choice (prompt) from the *infrastructure* choice (which AI endpoint, which params).

```sql
create table gift_pipelines (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  kind gift_mode not null,                     -- laser / uv / embroidery / photo-resize
  ai_endpoint_url text,                         -- Replicate URL (null for photo-resize)
  ai_model_slug text,                           -- e.g. 'stability-ai/stable-diffusion-xl'
  default_params jsonb not null default '{}',   -- knobs the pipeline exposes
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Seed: `laser-v1`, `uv-flat-v1`, `embroidery-4c-v1`, `photo-resize-v1`.

RLS: public read of active rows (customer UI doesn't need this directly but admin dropdowns do via admin client); admin/staff write.

### 3.2 New: `gift_product_variants`

Per-product physical bases. One row per variant. Product may have 0 rows (no picker shown) or many.

```sql
create table gift_product_variants (
  id uuid primary key default gen_random_uuid(),
  gift_product_id uuid not null references gift_products(id) on delete cascade,
  slug text not null,                           -- unique per product
  name text not null,
  features jsonb not null default '[]',         -- array of strings, plain text
  mockup_url text not null,
  mockup_area jsonb not null,                   -- {x,y,width,height} as pct
  variant_thumbnail_url text,
  base_price_cents integer not null default 0,
  price_tiers jsonb not null default '[]',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gift_product_id, slug)
);
```

RLS: public read of active rows for active products; admin/staff write.

### 3.3 Altered: `gift_products`

Add two columns:
- `pipeline_id uuid references gift_pipelines(id)` — null = use mode default
- `source_retention_days integer not null default 30` — per-product override

Existing `mode` column stays (used as fallback when `pipeline_id` is null, and to migrate current rows). Existing `mockup_url` / `mockup_area` stay and act as the fallback when a product has zero variants.

### 3.4 Altered: `gift_prompts`

Add `pipeline_id uuid references gift_pipelines(id)` (nullable). Prompt resolution order when the customer picks "Line Art" or "Realistic":

1. Product has `pipeline_id` set AND a prompt exists with `pipeline_id = product.pipeline_id` AND matching style: use it.
2. Fall back: prompt with matching style at the product's `mode`.
3. If neither exists: surface an admin error; do not render the picker.

To keep "Line Art" / "Realistic" consistent across the catalogue, add `style text not null default 'line-art' check (style in ('line-art','realistic'))` on `gift_prompts`. Migration defaults existing rows to `'line-art'`; admin re-tags any that should be `'realistic'` via the prompts admin page.

### 3.5 Altered: `gift_order_items`

Add:
- `variant_id uuid references gift_product_variants(id) on delete set null`
- `pipeline_id uuid references gift_pipelines(id) on delete set null`  — snapshot of which pipeline ran
- `variant_name_snapshot text`  — variant name at order time (survives variant deletion)
- `variant_price_snapshot_cents integer`
- `source_purged_at timestamptz`
- `production_purged_at timestamptz`

### 3.6 New: `gift_retention_runs`

Audit log for the purge cron:
```sql
create table gift_retention_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  sources_deleted integer not null default 0,
  production_deleted integer not null default 0,
  errors jsonb not null default '[]'
);
```

## 4. Customer flow — `/gift/[slug]`

Single-page product config; steps conditionally rendered.

```
┌─────────────────────────────────────────────────┐
│ 1. Style              [Line Art] [Realistic]   │  ← skipped if photo-resize
│                                                 │     or template-only
├─────────────────────────────────────────────────┤
│ 2. Your design                                  │
│    - Upload photo (AI modes)                    │
│    - Crop your photo (photo-resize)             │
│    - Pick template → fill image/text zones      │
├─────────────────────────────────────────────────┤
│ 3. Pick your base                               │  ← shown only when product
│    [thumb][thumb][thumb]                        │     has 2+ active variants.
│    Name · price · features list                 │     0 variants → use parent
│                                                 │     product's mockup + price.
│                                                 │     1 variant → auto-selected
│                                                 │     silently; features still
│                                                 │     rendered below preview.   │
├─────────────────────────────────────────────────┤
│ 4. Preview                                      │
│    Compositor renders transformed design onto   │
│    the SELECTED variant's mockup. Switching     │
│    variant re-composites ONLY — never re-runs   │
│    the AI (design is shared).                   │
├─────────────────────────────────────────────────┤
│ 5. Retention notice                             │
│    "We keep the watermarked preview so you can  │
│    see it in your order history. Your original  │
│    photo and the 300 DPI print file are deleted │
│    30 days after order."                        │
├─────────────────────────────────────────────────┤
│ 6. [ Add to cart ]                              │
└─────────────────────────────────────────────────┘
```

Cart line snapshot (written at add-to-cart, survives to order):
- `gift_product_id`, `variant_id`, `prompt_id`, `pipeline_id`, `template_id`
- `crop_rect` (photo-resize), `template_values` (template zones), `source_asset_id`
- `preview_asset_id` (the 72 DPI watermarked URL the customer sees)
- Price is the variant's price (or parent fallback if no variant)

## 5. Admin flow

### 5.1 New: `/admin/gifts/pipelines`

Full CRUD on `gift_pipelines`. List + edit forms. Fields: slug, name, description, kind, endpoint URL, model slug, default params JSON textarea, thumbnail upload, active toggle.

### 5.2 Extended: `/admin/gifts/prompts`

Existing page gains:
- Style column ("Line Art" | "Realistic")
- Pipeline filter dropdown
- When editing a prompt, admin selects: style + mode + optional pipeline_id (override)

### 5.3 Extended: `/admin/gifts/[id]` (product edit)

New sections appended to the existing form:
- **Pipeline** — dropdown of active pipelines (or "Use default for mode")
- **Retention** — numeric input "Delete sources + production after __ days" (default 30)
- **Variants (inline)** — table below the main form:
  - Add/Remove row, drag to reorder (reuse dnd-kit already in project)
  - Per row: name, slug (auto from name), features (bulleted text editor), mockup upload + inline area picker (reuse existing mockup-area editor), variant thumbnail upload, base price, price tiers
  - Empty state: "No variants — the parent product's mockup and price apply."

### 5.4 New: `/admin/gifts/orders`

Staff production queue. Table rows = `gift_order_items` with relations:

| Column | Source |
|---|---|
| Order # | `orders.order_number` |
| Customer | `orders.shipping_name`, email, phone |
| Shipping | `orders.shipping_address*` (one-line summary, click to expand) |
| Product | `gift_products.name` |
| Variant | `gift_order_items.variant_name_snapshot` |
| Style | prompt.name snapshot |
| Template | template.name if any |
| Downloads | [PNG 300] [PDF] [Source] — each hidden once the corresponding `*_purged_at` is set |
| Status | pending / processing / ready (dropdown) |
| Expires | "Files delete on 2026-05-22" (order.created_at + retention_days) |
| Notes | `admin_notes` textarea |

Filters: status, date range, text search. Sort by created_at desc default.

## 6. Production handoff

Unchanged from existing pipeline: when order is placed, a background task (existing action in `app/admin/gifts/actions.ts` plus `lib/gifts/pipeline.ts` `runProductionPipeline`) runs and writes PNG + PDF to the private `gift-production` bucket. Queue page reads download URLs via the admin client.

Staff-side responsibility: complete printing and shipping BEFORE day 30. After that, production asset is purged and reprints are not possible.

## 7. Retention — 30-day purge

### 7.1 What gets purged

For each `gift_order_items` row where `orders.created_at + (gift_products.source_retention_days days) < now()`:
- Delete object from `gift-sources` bucket at `source_asset.path`
- Delete object from `gift-production` bucket at `production_asset.path` and `production_pdf.path`
- Set `gift_order_items.source_purged_at = now()` and `production_purged_at = now()`
- Leave `preview_asset_id` and the `gift-previews` bucket untouched (72 DPI watermarked, cheap to keep, customer order history relies on it)
- Leave `gift_assets` rows intact for audit trail. Staff queue and customer pages check `gift_order_items.source_purged_at` / `production_purged_at` to decide whether to show download buttons; the stored storage paths become dead references after purge but the rows stay linked for traceability.
- Append a row to `gift_retention_runs` with counts

### 7.2 Mechanism

- Vercel cron: `vercel.json` adds `{ "path": "/api/cron/gift-purge", "schedule": "0 19 * * *" }` (19:00 UTC = 03:00 SGT)
- Handler at `app/api/cron/gift-purge/route.ts`, protected by `CRON_SECRET` header check
- Paged deletion (100 items / run) to avoid long-running tasks — safe because deleted rows are no longer in the candidate set
- Uses service-role Supabase client + storage `remove()` API

### 7.3 Customer-facing notice

Text, used consistently across three touchpoints:

> **We delete your files 30 days after ordering.** Your uploaded photo and the 300 DPI print file are removed 30 days after checkout. We keep only a watermarked preview so you can still see your order in your account history. If you need a reprint, please place a new order before then.

Touchpoints:
1. `/gift/[slug]` — inline note above the **Add to cart** button
2. Cart drawer / `/cart/checkout` — short one-liner "Files delete in 30 days — [learn more]" expanding to full text
3. Order confirmation email + `/account/orders/[id]` — shows the purge date ("Files delete on 2026-05-22") and the full paragraph
4. `/legal/privacy` — formal paragraph referencing the 30-day policy and that customer order records remain

## 8. Pipeline runner change

Existing `runPreviewPipeline` and `runProductionPipeline` in `lib/gifts/pipeline.ts` resolve the transform by `product.mode`. Add a resolution step at the top:

```ts
const pipeline = product.pipeline_id
  ? await getPipeline(product.pipeline_id)
  : await getDefaultPipelineForMode(product.mode);
```

Then the switch on `product.mode` becomes a switch on `pipeline.kind` (identical cases). The AI transform function reads `pipeline.ai_endpoint_url`, `pipeline.ai_model_slug`, and merges `pipeline.default_params` with `product.ai_params`.

Existing behaviour is preserved when `pipeline_id` is null — backward compatible with current gift products.

## 9. Open items for the plan

- Exact schema of `default_params` jsonb — should be free-form for now; formalise when we wire Replicate.
- Admin UI for the mockup-area picker already exists on the product form — variant picker reuses that component unchanged.
- Feature bullet editor: plain multiline textarea splitting on newlines is sufficient; no rich-text.
- Whether to also surface the Line Art / Realistic choice on the admin preview so admin can verify both prompts render. Default: yes, a "Preview both styles" admin utility on the product edit page.

## 10. Migration order

1. DB migrations — `gift_pipelines`, `gift_product_variants`, `gift_retention_runs`, alter columns on `gift_products` / `gift_prompts` / `gift_order_items`.
2. Seed default pipelines (`laser-v1` et al) so existing products get a pipeline_id assigned.
3. Backfill `gift_prompts.style` from existing prompt names where unambiguous; flag the rest for admin cleanup.
4. Ship admin CRUD for pipelines + variants + retention field; no customer-facing change yet.
5. Extend customer `/gift/[slug]` with variant picker + retention notice.
6. Ship staff production queue page.
7. Ship purge cron (last — nothing to purge until there's real customer data).

## 11. Success criteria

- Admin can create a gift product with 3 variants, each with own mockup + features + price.
- Customer can upload a photo, pick Line Art, pick Variant 2, see a live preview composited on Variant 2's mockup, and add to cart at Variant 2's price.
- The order confirmation email includes the 30-day retention notice and the per-order expiry date.
- Staff can land on `/admin/gifts/orders`, find a new order, download the 300 DPI PNG, and mark it ready.
- 30 days later, the cron deletes the source + production PNG + PDF; the customer's account page still shows the watermarked preview; downloads in the staff queue grey out.
