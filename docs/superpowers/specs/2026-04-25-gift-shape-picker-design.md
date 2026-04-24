# Gift shape picker — design

## Summary

Three gift products sold as acrylic cutouts need a customer-facing
**shape picker**: one upload, then the customer chooses how the
finished piece is cut — follow-my-photo silhouette (`cutout`),
standard rectangle (`rectangle`), or pick from a pre-designed layout
(`template`). Today this choice is baked into the product's
`template_mode` column (`none` / `optional` / `required`) and forces a
separate upload per shape.

This design makes shape an **opt-in per-product capability**: three
specific gift products turn it on, every other gift product keeps its
current behaviour. The customer picks a shape by tapping a tab under
the big preview; the already-uploaded source photo is re-used for any
shape they flip to, re-running the pipeline only when they explicitly
hit Regenerate.

Built on top of the style-picker + history-strip + Regenerate pattern
shipped on 2026-04-25 for Line Art ↔ Realistic. That pattern is the
mental model customers will already recognise by the time this ships.

## Goals

- One upload → customer explores all allowed shapes without
  re-uploading.
- Admin decides per-product whether the picker is active and which
  shapes / templates are in the menu.
- History strip remembers every shape × style × template × photo
  combination the customer has generated, so flipping back is free.
- Production files for cutout orders carry both the printed image and
  the SVG laser-cut path.
- Zero disruption to existing gift products — `shape_options` NULL =
  behaves exactly as today.

## Non-goals

- Changing the existing `template_mode` column or any product
  currently using it. `shape_options` lives alongside it; migration
  from template-required products to the new picker is deliberately
  out of scope for this iteration.
- Per-variant shape options (each variant gets the same shape menu
  as its parent product).
- Customer-drawn cutouts / custom shapes beyond the `cutout`
  auto-silhouette or pre-made `template` list.
- Bulk-editing shape configuration across multiple products in one
  go.

## Data model

### `gift_products.shape_options` (new jsonb column)

```sql
alter table gift_products add column shape_options jsonb;
```

- **NULL** — product has no shape picker (default, existing
  behaviour).
- **Array** — shape picker is active; order drives tab order.

Shape row shape (validated in admin Zod + server action):

```ts
type ShapeOption =
  | { kind: 'cutout';    label: string; price_delta_cents?: number }
  | { kind: 'rectangle'; label: string; price_delta_cents?: number }
  | { kind: 'template';  label: string; price_delta_cents?: number;
                         template_ids: string[] };
```

At most one row per `kind`. `price_delta_cents` defaults to 0;
non-zero nudges the sticky total when that shape is selected.

### `PreviewHit` type (extend existing `lib/gifts/preview-history.ts`)

```ts
type PreviewHit = {
  id: string;
  promptId: string | null;
  // NEW:
  shapeKind: 'cutout' | 'rectangle' | 'template' | null;  // null = legacy hit (pre-shape-picker)
  templateId: string | null;  // non-null only when shapeKind === 'template'
  // existing:
  sourceAssetId: string;
  previewAssetId: string;
  previewUrl: string;
  ts: number;
};
```

History strip keys dedup on `previewAssetId` (unchanged). Labels
compose from `(shapeKind, promptName, templateName?)`.

### `gift_assets` (existing) — new role

Add `role = 'cut_file'` as a valid gift_assets role. Cut-file rows
carry the SVG path (not a raster) and link to the source via an
implicit naming convention (parent asset found via shared path
prefix) — no new foreign key needed.

### `gift_order_items` (cart / order schema)

```sql
alter table gift_order_items
  add column shape_kind text check (shape_kind in ('cutout','rectangle','template')),
  add column shape_template_id uuid references gift_templates(id);
```

NULL on existing rows; production fan-out treats NULL as
"rectangle-equivalent" to avoid back-filling.

## Customer-facing UX

### Preview column, reading top-to-bottom

```
┌────────────── Big preview ──────────────┐
└──────────────────────────────────────────┘
 SHAPE   [ ◐ Cutout ] [ ▭ Rectangle ] [ ▦ Template ]
         (second-level template grid appears under tabs when Template is picked)
 [ Yellow Regenerate CTA — shown only when selected tab differs from last-generated shape ]
 [ Cross-style+shape history strip — every hit the customer has produced ]
```

### Key interactions

| Event | Behaviour |
|-------|-----------|
| Product page load | Default-selected tab = first entry in `shape_options`. Second-level template grid opens if default is `template`. |
| First upload | Runs the default shape's pipeline. Preview fills; first history hit lands labelled `(shape · style)`. |
| Switch shape tab | No pipeline runs. `lastRenderedShape !== selectedShape` → yellow Regenerate CTA surfaces: *"Preview is still Cutout. Regenerate as Rectangle?"* Customer clicks Regenerate (or taps a matching history thumb, if any). |
| Switch template (inside Template tab) | Same as switching shape — treated as a parameter change; Regenerate CTA shows the template name. |
| Click history thumb | Restores `{ shape, style, template, photo }`; all pickers snap to that hit's config. No pipeline run. |
| Upload a new photo | Keeps history (so the customer can back-button a photo decision). New photo starts at the current shape's pipeline. |
| Add to cart | Line item carries `{ shape_kind, template_id? }` alongside existing source / preview asset IDs and prompt. |

### History strip label composition

- `cutout` + prompt `Line Art` → *"Cutout · Line Art"*
- `rectangle` + prompt `Realistic` → *"Rectangle · Realistic"*
- `template` + prompt `Line Art` + template `Heart` → *"Heart · Line Art"*

## Admin config

### Location

Gift product editor → **Design tab** (sibling of Variants + Sizes).
New collapsible block: **"Shape options (customer-pickable)"**.

### Layout

```
┌─ Shape options ────────────────────────────────────┐
│  ☐ Enable shape picker on the customer page         │
│                                                     │
│  ── Available shapes ─────────────── drag to reorder│
│  ▣ ◐ Cutout     Label [Follow my photo        ]  × │
│                 Price delta [+S$0.00]               │
│  ▣ ▭ Rectangle  Label [Full photo              ]  × │
│                 Price delta [+S$0.00]               │
│  ▣ ▦ Template   Label [Pick a design           ]  × │
│                 Price delta [+S$0.00]               │
│                 Templates: [Heart ×] [Star ×] [+]   │
│                                                     │
│  [+ Add shape]                                      │
└─────────────────────────────────────────────────────┘
```

### Behaviour

- **Enable toggle** — master switch. Off → saves `shape_options` as
  `NULL`, collapses the block.
- **Defaults on first enable** — pre-fills all 3 rows with default
  labels + empty template list.
- **Drag to reorder** — order drives customer tab order.
- **At most one row per kind** — "Add shape" dropdown hides kinds
  already in the list.
- **Template kind** — multi-select of templates, filtered to those
  whose `zones_json` is compatible with this product's mode (same
  check as `setProductTemplates` already does).

### Validation (server action)

Reject saves where:
- Picker enabled + `shape_options` is empty or malformed.
- A `template`-kind row has zero `template_ids`.
- Any `template_id` doesn't exist / isn't compatible with the
  product's mode → error with the template name.
- Duplicate `kind` values in the array.

## Server pipeline

### Request contract (extend existing server actions)

Both `uploadAndPreviewGift` and `restylePreviewFromSource` accept two
new fields:

```ts
shape_kind?: 'cutout' | 'rectangle' | 'template';
template_id?: string;
```

Server validates:
- `shape_kind` is present in the product's `shape_options` array.
- When `shape_kind === 'template'`, `template_id` is in that row's
  `template_ids` list.
- Legacy requests without `shape_kind` remain valid when
  `shape_options` is NULL on the product.

### Dispatcher switch on `shape_kind`

```
rectangle  → existing pipeline (mode-specific style + bleed-pad render).
             shape_kind is stored on the hit + cart line; no pipeline-code change.

template   → existing template-composite pipeline with zones_json.
             template_id already required by current flow when the product uses a template.

cutout     → NEW stage sequence:
             a) Style the source with the product's prompt (Line Art / Realistic — existing).
             b) Background-remove the styled image (Replicate: u2net / rembg model).
             c) Trace the alpha → SVG path. Save as a new `gift_assets` row with role='cut_file'.
             d) Render the preview: styled subject composited onto a transparent checker-
                pattern background so the customer sees the acrylic will follow the photo.
             e) Return { sourceAssetId, previewAssetId, previewUrl } as today.
             Fail-open: if bg-remove fails, fall back to rectangle rendering and return
             a toast-friendly error code so the UI can show "couldn't cut this one".
```

### New asset role

`gift_assets.role` accepts `'cut_file'` in addition to `source` / `preview`. Cut files are SVG, live in the existing `gift-previews` bucket, and are readable by the fulfilment worker same way previews are. No schema change needed — `role` is a free text column today.

### Pricing

Customer-page sticky total reads `shape_options[selected].price_delta_cents` and adds it to the base + variant + size deltas. No schema change on cart — existing `unit_price_cents` math folds the shape delta in at add-to-cart time.

## Rollout / migration

- Ship behind the `shape_options` NULL-is-off default — zero impact on existing products.
- Enable on the 3 target acrylic-cutout products one at a time via admin UI.
- Watch the history-strip events (client telemetry) for any product where customers get stuck on "Regenerate" — that signals a shape the AI can't process reliably, and we pull it from that product's `shape_options`.
- No data backfill needed. Existing cart lines stay NULL on `shape_kind`; production treats NULL as rectangle-equivalent.

## Open questions

None that block implementation. The style-picker layering question (does each of the 3 products have a Line-Art / Realistic picker on top?) is handled by the existing prompt flow — history hits already carry `promptId`, shape adds `shapeKind` + `templateId`, and the three keys compose cleanly.

## Files likely to change

| Area | File(s) |
|------|---------|
| DB migration | `supabase/migrations/0056_gift_shape_options.sql` |
| DB migration | `supabase/migrations/0057_gift_order_items_shape.sql` |
| Types | `lib/gifts/types.ts` |
| History lib | `lib/gifts/preview-history.ts` |
| Server actions | `app/(site)/gift/actions.ts` |
| Preview pipeline | `lib/gifts/pipeline/*` (new `cutout` stage + dispatcher) |
| Product page | `components/gift/gift-product-page.tsx` |
| Admin editor | `components/admin/gift-product-editor.tsx` |
| Admin action | `app/admin/gifts/actions.ts` (Zod extension + validators) |
| Cart | `lib/cart-store.ts` (line item payload) |
| Checkout / fulfilment | `lib/gifts/fulfilment/*` |
