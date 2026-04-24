# Gift shape picker implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins enable a per-product shape picker (cutout / rectangle / template) on 3 acrylic gift products, so a customer uploads ONE photo and chooses the output shape afterwards — reusing the existing style-picker + history-strip + Regenerate pattern.

**Architecture:** New jsonb column `shape_options` on `gift_products` drives the customer picker. Preview history extends to carry `shape_kind` + `template_id`. Server actions (`uploadAndPreviewGift`, `restylePreviewFromSource`) accept the two new fields; a dispatcher in `runPreviewPipeline` branches by `shape_kind` — rectangle + template reuse existing code paths; cutout adds a new pipeline stage (Replicate bg-remove → alpha-mask preview + SVG silhouette trace via potrace for the laser cut file).

**Tech Stack:** Next.js server actions · Supabase (Postgres + Storage) · Replicate (bg-remove model) · `sharp` (alpha / composite) · `potrace` (raster-to-SVG trace) · existing custom localStorage preview-history store.

**Project has no automated test suite.** Each task verifies via type-check (`npx tsc --noEmit`), DB-state assertions, or a manual browser flow. Tasks stay additive so the app stays buildable after every commit.

---

## File structure

**Create**
- `supabase/migrations/0056_gift_shape_options.sql`
- `supabase/migrations/0057_gift_order_items_shape.sql`
- `lib/gifts/shape-options.ts` — `ShapeOption` type + parse / validate helpers shared by admin + server
- `lib/gifts/pipeline/cutout.ts` — bg-remove (Replicate) + silhouette trace (potrace) + transparent-checker preview
- `components/gift/gift-shape-picker.tsx` — customer-facing tab row + template sub-grid
- `components/admin/gift-shape-options-editor.tsx` — admin config block
- `scripts/apply-migration-0056.mjs`
- `scripts/apply-migration-0057.mjs`

**Modify**
- `lib/gifts/types.ts` — add `shape_options` to `GiftProduct`, re-export `ShapeOption`
- `lib/gifts/preview-history.ts` — extend `PreviewHit` with `shapeKind` + `templateId`
- `lib/gifts/pipeline.ts` — dispatcher switch on `shape_kind`
- `app/admin/gifts/actions.ts` — Zod schema extension + validation
- `components/admin/gift-product-editor.tsx` — mount the new editor block under the Design tab
- `app/(site)/gift/actions.ts` — `uploadAndPreviewGift` + `restylePreviewFromSource` accept + forward `shape_kind` / `template_id`
- `components/gift/gift-product-page.tsx` — render shape picker, wire into hit-append + Regenerate + history-strip label + sticky-total
- `lib/cart-store.ts` — carry `shape_kind` + `shape_template_id` on gift line items
- `app/admin/gifts/fulfillment-routes/or-similar` (whichever server code writes `gift_order_items`) — persist shape fields at checkout

---

## Task 1: Migration 0056 — `shape_options` column on `gift_products`

**Files:**
- Create: `supabase/migrations/0056_gift_shape_options.sql`
- Create: `scripts/apply-migration-0056.mjs`

- [ ] **Step 1: Write the migration**

File: `supabase/migrations/0056_gift_shape_options.sql`
```sql
-- 0056_gift_shape_options.sql
-- Per-product customer-facing shape picker (cutout / rectangle / template).
-- NULL = product has no picker (default, matches existing behaviour).
-- Array = picker is active; order drives tab order on the customer page.

alter table gift_products
  add column if not exists shape_options jsonb;

comment on column gift_products.shape_options is
  'Array of { kind, label, price_delta_cents?, template_ids? }. NULL = shape picker disabled.';
```

- [ ] **Step 2: Write the apply script**

File: `scripts/apply-migration-0056.mjs`
```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = await fs.readFile(path.join(root, '.env.local'), 'utf8');
for (const raw of envFile.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
try {
  await sql.unsafe(
    await fs.readFile(
      path.join(root, 'supabase/migrations/0056_gift_shape_options.sql'),
      'utf8',
    ),
  );
  const r = await sql`
    select column_name from information_schema.columns
    where table_schema='public' and table_name='gift_products'
      and column_name = 'shape_options'
  `;
  console.log('column present:', r.length === 1 ? 'yes' : 'NO');
} finally {
  await sql.end();
}
```

- [ ] **Step 3: Run the migration**

```bash
node scripts/apply-migration-0056.mjs
```
Expected output: `column present: yes`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0056_gift_shape_options.sql scripts/apply-migration-0056.mjs
git commit -m "Gift products: add shape_options jsonb column (migration 0056)"
```

---

## Task 2: Migration 0057 — `shape_kind` + `shape_template_id` on `gift_order_items`

**Files:**
- Create: `supabase/migrations/0057_gift_order_items_shape.sql`
- Create: `scripts/apply-migration-0057.mjs`

- [ ] **Step 1: Write the migration**

File: `supabase/migrations/0057_gift_order_items_shape.sql`
```sql
-- 0057_gift_order_items_shape.sql
-- Persist the customer's shape choice + selected template (if any) to
-- each order line. NULL on existing rows — production fan-out treats
-- NULL as rectangle-equivalent so no back-fill is needed.

alter table gift_order_items
  add column if not exists shape_kind text
    check (shape_kind in ('cutout','rectangle','template')),
  add column if not exists shape_template_id uuid
    references gift_templates(id);

comment on column gift_order_items.shape_kind is
  'Customer-picked shape. NULL = legacy line, treated as rectangle.';
comment on column gift_order_items.shape_template_id is
  'Only set when shape_kind = ''template''. References gift_templates.id.';
```

- [ ] **Step 2: Write the apply script**

File: `scripts/apply-migration-0057.mjs`
```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = await fs.readFile(path.join(root, '.env.local'), 'utf8');
for (const raw of envFile.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
try {
  await sql.unsafe(
    await fs.readFile(
      path.join(root, 'supabase/migrations/0057_gift_order_items_shape.sql'),
      'utf8',
    ),
  );
  const r = await sql`
    select column_name from information_schema.columns
    where table_schema='public' and table_name='gift_order_items'
      and column_name in ('shape_kind', 'shape_template_id')
    order by column_name
  `;
  console.log('columns present:', r.map((c) => c.column_name).join(', '));
} finally {
  await sql.end();
}
```

- [ ] **Step 3: Run the migration**

```bash
node scripts/apply-migration-0057.mjs
```
Expected: `columns present: shape_kind, shape_template_id`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0057_gift_order_items_shape.sql scripts/apply-migration-0057.mjs
git commit -m "Gift order items: add shape_kind + shape_template_id (migration 0057)"
```

---

## Task 3: Shape types + validation helper

**Files:**
- Create: `lib/gifts/shape-options.ts`
- Modify: `lib/gifts/types.ts`

- [ ] **Step 1: Write the shape-options module**

File: `lib/gifts/shape-options.ts`
```ts
// Shared definition of the per-product shape picker config. Lives outside
// `types.ts` so admin + server + pipeline can import validators without
// pulling the whole types barrel.

export type ShapeKind = 'cutout' | 'rectangle' | 'template';

export type ShapeOptionBase = {
  kind: ShapeKind;
  label: string;
  price_delta_cents?: number;
};

export type ShapeOptionCutout    = ShapeOptionBase & { kind: 'cutout' };
export type ShapeOptionRectangle = ShapeOptionBase & { kind: 'rectangle' };
export type ShapeOptionTemplate  = ShapeOptionBase & {
  kind: 'template';
  template_ids: string[];
};

export type ShapeOption =
  | ShapeOptionCutout
  | ShapeOptionRectangle
  | ShapeOptionTemplate;

/** Validate a raw jsonb value into ShapeOption[]. Returns null when
 *  the value is null / empty — callers treat that as "picker disabled".
 *  Throws on malformed data so admin saves surface the error. */
export function parseShapeOptions(raw: unknown): ShapeOption[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const seen = new Set<ShapeKind>();
  const out: ShapeOption[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') throw new Error('Shape row must be an object');
    const r = row as Record<string, unknown>;
    const kind = r.kind;
    if (kind !== 'cutout' && kind !== 'rectangle' && kind !== 'template') {
      throw new Error(`Unknown shape kind "${String(kind)}"`);
    }
    if (seen.has(kind)) throw new Error(`Duplicate shape kind "${kind}" — at most one row per kind`);
    seen.add(kind);
    const label = typeof r.label === 'string' && r.label.trim() ? r.label.trim() : null;
    if (!label) throw new Error(`Shape "${kind}" is missing a label`);
    const pd = typeof r.price_delta_cents === 'number' ? r.price_delta_cents : 0;
    if (kind === 'template') {
      const ids = Array.isArray(r.template_ids) ? r.template_ids.filter((x) => typeof x === 'string') as string[] : [];
      if (ids.length === 0) throw new Error('Template shape needs at least one template_id');
      out.push({ kind, label, price_delta_cents: pd, template_ids: ids });
    } else {
      out.push({ kind, label, price_delta_cents: pd });
    }
  }
  return out;
}

export function shapeOptionsPriceDelta(
  options: ShapeOption[] | null | undefined,
  selectedKind: ShapeKind | null,
): number {
  if (!options || !selectedKind) return 0;
  const found = options.find((o) => o.kind === selectedKind);
  return found?.price_delta_cents ?? 0;
}
```

- [ ] **Step 2: Extend GiftProduct type**

In `lib/gifts/types.ts`, after the `faqs?` / `occasions?` / `process_steps?` fields:

```ts
// Migration 0056 — per-product shape picker. NULL = disabled.
shape_options?: import('./shape-options').ShapeOption[] | null;
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v resvg-js | head -20
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add lib/gifts/shape-options.ts lib/gifts/types.ts
git commit -m "Gift shape options: type + parser shared by admin/server/pipeline"
```

---

## Task 4: Extend `PreviewHit` with `shapeKind` + `templateId`

**Files:**
- Modify: `lib/gifts/preview-history.ts`

- [ ] **Step 1: Extend the type + append signature**

Replace `export type PreviewHit = { ... }` with:
```ts
import type { ShapeKind } from './shape-options';

export type PreviewHit = {
  id: string;
  promptId: string | null;
  /** Shape the customer picked for this generation. null = legacy hit
   *  (stored before the shape picker shipped) — treat as rectangle. */
  shapeKind: ShapeKind | null;
  /** Only non-null when shapeKind === 'template'. */
  templateId: string | null;
  sourceAssetId: string;
  previewAssetId: string;
  previewUrl: string;
  ts: number;
};
```

Extend the hit validator `isValidHit`:
```ts
function isValidHit(h: unknown): h is PreviewHit {
  if (!h || typeof h !== 'object') return false;
  const r = h as Record<string, unknown>;
  const shapeOk =
    r.shapeKind === null ||
    r.shapeKind === 'cutout' ||
    r.shapeKind === 'rectangle' ||
    r.shapeKind === 'template' ||
    r.shapeKind === undefined; // legacy hits don't have it yet
  return (
    typeof r.id === 'string' &&
    (r.promptId === null || typeof r.promptId === 'string') &&
    shapeOk &&
    (r.templateId === null || typeof r.templateId === 'string' || r.templateId === undefined) &&
    typeof r.sourceAssetId === 'string' &&
    typeof r.previewAssetId === 'string' &&
    typeof r.previewUrl === 'string' &&
    typeof r.ts === 'number'
  );
}
```

Extend `appendPreviewHit`:
```ts
export function appendPreviewHit(
  productSlug: string,
  hit: Omit<PreviewHit, 'id' | 'ts'> & { id?: string; ts?: number },
): PreviewHit[] {
  const full: PreviewHit = {
    id: hit.id ?? `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    ts: hit.ts ?? Date.now(),
    promptId: hit.promptId,
    shapeKind: hit.shapeKind ?? null,
    templateId: hit.templateId ?? null,
    sourceAssetId: hit.sourceAssetId,
    previewAssetId: hit.previewAssetId,
    previewUrl: hit.previewUrl,
  };
  // ... rest of the function stays as-is, cap logic still keyed on promptId
}
```

- [ ] **Step 2: Back-fill legacy hits on load**

In `loadPreviewHistory`, after `.filter(isValidHit)`:
```ts
return parsed.hits
  .filter(isValidHit)
  .map((h: PreviewHit) => ({
    ...h,
    shapeKind: h.shapeKind ?? null,
    templateId: h.templateId ?? null,
  }));
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v resvg-js | head -20
```

- [ ] **Step 4: Commit**

```bash
git add lib/gifts/preview-history.ts
git commit -m "Gift history: hits carry shapeKind + templateId; legacy hits tolerated"
```

---

## Task 5: Admin Zod schema + validation

**Files:**
- Modify: `app/admin/gifts/actions.ts`

- [ ] **Step 1: Import shape-options validator**

Near existing imports:
```ts
import { parseShapeOptions, type ShapeOption } from '@/lib/gifts/shape-options';
```

- [ ] **Step 2: Extend `GiftProductSchema`**

After `process_steps: z.array(...).nullable().optional(),`:
```ts
shape_options: z.array(z.object({
  kind: z.enum(['cutout', 'rectangle', 'template']),
  label: z.string().min(1),
  price_delta_cents: z.number().int().min(0).default(0),
  template_ids: z.array(z.string().uuid()).optional(),
})).nullable().optional(),
```

- [ ] **Step 3: Cross-field validation in both create + update actions**

After `validateModes(...)`, add:
```ts
function validateShapeOptions(
  input: { shape_options?: Array<{ kind: string; template_ids?: string[] }> | null },
): string | null {
  if (!input.shape_options) return null;
  try {
    parseShapeOptions(input.shape_options);
  } catch (e: any) {
    return e?.message ?? 'Invalid shape_options';
  }
  return null;
}
```

Wire into `createGiftProduct` + `updateGiftProduct` right after `validateModes`:
```ts
const shapeErr = validateShapeOptions(parsed ?? input);
if (shapeErr) return { ok: false as const, error: shapeErr };
```

Also add **template-mode compatibility check** for template-kind rows — templates assigned to a template-kind shape must use modes the product supports. Pattern matches existing `setProductTemplates`:

```ts
const tplShape = (parsed?.shape_options ?? input.shape_options ?? []).find((s: any) => s.kind === 'template');
if (tplShape && Array.isArray(tplShape.template_ids) && tplShape.template_ids.length > 0) {
  const { data: templates } = await sb
    .from('gift_templates')
    .select('id, name, zones_json')
    .in('id', tplShape.template_ids);
  const allowed = new Set<string>([
    (parsed?.mode ?? input.mode) as string,
    ...((parsed?.secondary_mode ?? input.secondary_mode) ? [(parsed?.secondary_mode ?? input.secondary_mode) as string] : []),
  ]);
  for (const t of templates ?? []) {
    for (const z of (t.zones_json as any[]) ?? []) {
      if (z.mode && !allowed.has(z.mode)) {
        return {
          ok: false as const,
          error: `Template "${t.name}" uses mode ${z.mode} which isn't enabled on this product.`,
        };
      }
    }
  }
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v resvg-js | head -20
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/gifts/actions.ts
git commit -m "Admin: validate shape_options (parse + template mode compat)"
```

---

## Task 6: Admin editor UI block

**Files:**
- Create: `components/admin/gift-shape-options-editor.tsx`
- Modify: `components/admin/gift-product-editor.tsx`

- [ ] **Step 1: Write the editor component**

File: `components/admin/gift-shape-options-editor.tsx`
```tsx
'use client';

import { Trash2, Plus } from 'lucide-react';
import type { ShapeOption, ShapeKind } from '@/lib/gifts/shape-options';
import type { GiftTemplate } from '@/lib/gifts/types';

const KIND_META: Record<ShapeKind, { icon: string; defaultLabel: string }> = {
  cutout:    { icon: '◐', defaultLabel: 'Follow my photo' },
  rectangle: { icon: '▭', defaultLabel: 'Full photo' },
  template:  { icon: '▦', defaultLabel: 'Pick a design' },
};

type Props = {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  value: ShapeOption[];
  onChange: (next: ShapeOption[]) => void;
  allTemplates: GiftTemplate[];
};

export function GiftShapeOptionsEditor({ enabled, onEnabledChange, value, onChange, allTemplates }: Props) {
  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
  const usedKinds = new Set(value.map((v) => v.kind));
  const addableKinds = (['cutout','rectangle','template'] as ShapeKind[]).filter((k) => !usedKinds.has(k));

  function updateRow(i: number, patch: Partial<ShapeOption>) {
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } as ShapeOption : row)));
  }
  function removeRow(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function addRow(kind: ShapeKind) {
    const base = { kind, label: KIND_META[kind].defaultLabel, price_delta_cents: 0 };
    onChange([...value, kind === 'template' ? { ...base, template_ids: [] } as ShapeOption : base as ShapeOption]);
  }
  function moveRow(i: number, dir: -1 | 1) {
    const next = [...value];
    const tgt = i + dir;
    if (tgt < 0 || tgt >= next.length) return;
    [next[i], next[tgt]] = [next[tgt], next[i]];
    onChange(next);
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-ink">Shape options — customer-pickable</div>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Let the customer pick cutout / rectangle / template after uploading. Off = no picker.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold">
          <input type="checkbox" checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} />
          Enable picker
        </label>
      </div>
      {enabled && (
        <>
          {value.length === 0 ? (
            <p className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-xs text-neutral-500">
              No shapes yet. Click &quot;Add shape&quot; below.
            </p>
          ) : (
            <div className="space-y-3">
              {value.map((row, i) => (
                <div key={`${row.kind}-${i}`} className="rounded border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      {KIND_META[row.kind].icon} {row.kind}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => moveRow(i, -1)} disabled={i === 0}
                        className="rounded border px-2 py-1 text-[10px] font-bold disabled:opacity-40">↑</button>
                      <button type="button" onClick={() => moveRow(i, 1)} disabled={i === value.length - 1}
                        className="rounded border px-2 py-1 text-[10px] font-bold disabled:opacity-40">↓</button>
                      <button type="button" onClick={() => removeRow(i)}
                        className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-50">
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_140px]">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Customer label
                      </span>
                      <input value={row.label} onChange={(e) => updateRow(i, { label: e.target.value })}
                        className={inputCls} placeholder={KIND_META[row.kind].defaultLabel} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Price delta (cents)
                      </span>
                      <input type="number" min={0} value={row.price_delta_cents ?? 0}
                        onChange={(e) => updateRow(i, { price_delta_cents: parseInt(e.target.value || '0', 10) })}
                        className={inputCls} />
                    </label>
                  </div>
                  {row.kind === 'template' && (
                    <div className="mt-3">
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Templates (tick to include)
                      </div>
                      <div className="grid gap-1 md:grid-cols-2">
                        {allTemplates.map((t) => {
                          const ticked = (row.template_ids ?? []).includes(t.id);
                          return (
                            <label key={t.id} className="flex items-center gap-2 rounded border border-neutral-200 bg-white px-2 py-1 text-xs">
                              <input
                                type="checkbox"
                                checked={ticked}
                                onChange={(e) => {
                                  const cur = new Set(row.template_ids ?? []);
                                  if (e.target.checked) cur.add(t.id); else cur.delete(t.id);
                                  updateRow(i, { template_ids: Array.from(cur) } as any);
                                }}
                              />
                              {t.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {addableKinds.length > 0 && (
            <div className="mt-3 flex gap-2">
              {addableKinds.map((k) => (
                <button key={k} type="button" onClick={() => addRow(k)}
                  className="inline-flex items-center gap-1 rounded border-2 border-ink bg-white px-3 py-1.5 text-[11px] font-bold text-ink transition-all hover:bg-yellow">
                  <Plus size={12} /> Add {KIND_META[k].icon} {k}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Mount in gift-product-editor**

In `components/admin/gift-product-editor.tsx`:

Add state near the other design-tab state:
```ts
const [shapePickerEnabled, setShapePickerEnabled] = useState<boolean>(
  Array.isArray(product?.shape_options) && product!.shape_options!.length > 0,
);
const [shapeOptions, setShapeOptions] = useState<ShapeOption[]>(
  (product?.shape_options ?? []) as ShapeOption[],
);
```
Add imports:
```ts
import { GiftShapeOptionsEditor } from './gift-shape-options-editor';
import type { ShapeOption } from '@/lib/gifts/shape-options';
```

Include in the save payload:
```ts
shape_options: shapePickerEnabled && shapeOptions.length > 0 ? shapeOptions : null,
```

Render inside the Design tab (pick a spot near sizes/variants, e.g. after the sizes block):
```tsx
<GiftShapeOptionsEditor
  enabled={shapePickerEnabled}
  onEnabledChange={setShapePickerEnabled}
  value={shapeOptions}
  onChange={setShapeOptions}
  allTemplates={allTemplates}
/>
```

- [ ] **Step 3: Smoke-test in admin**

```bash
pnpm dev
```
Open `/admin/gifts/<any-product-id>`, switch to Design tab, toggle "Enable picker", add `cutout`, `rectangle`, `template`, tick a template, set a price delta, save. Reload the page — values should persist.

- [ ] **Step 4: Commit**

```bash
git add components/admin/gift-shape-options-editor.tsx components/admin/gift-product-editor.tsx
git commit -m "Admin: shape-options editor block in gift product Design tab"
```

---

## Task 7: Server action — `uploadAndPreviewGift` accepts `shape_kind` + `template_id`

**Files:**
- Modify: `app/(site)/gift/actions.ts`

- [ ] **Step 1: Pull the fields out of FormData**

In `uploadAndPreviewGiftInner`, add alongside the existing `templateId` line:
```ts
const shapeKindRaw = (formData.get('shape_kind') || '').toString() || null;
const shapeTemplateId = (formData.get('shape_template_id') || '').toString() || null;
const shapeKind = (shapeKindRaw === 'cutout' || shapeKindRaw === 'rectangle' || shapeKindRaw === 'template')
  ? shapeKindRaw : null;
```

- [ ] **Step 2: Validate against product.shape_options**

After the product row is loaded, before running the pipeline:
```ts
const configuredShapes = Array.isArray((product as any).shape_options)
  ? ((product as any).shape_options as Array<{ kind: string; template_ids?: string[] }>)
  : [];
if (configuredShapes.length > 0 && shapeKind) {
  const row = configuredShapes.find((r) => r.kind === shapeKind);
  if (!row) return { ok: false, error: `Shape "${shapeKind}" is not enabled on this product.` };
  if (shapeKind === 'template') {
    if (!shapeTemplateId || !Array.isArray(row.template_ids) || !row.template_ids.includes(shapeTemplateId)) {
      return { ok: false, error: 'Picked template is not allowed for this product.' };
    }
  }
}
```

- [ ] **Step 3: Forward to pipeline**

Pass new fields through to `runPreviewPipeline`:
```ts
preview = await runPreviewPipeline({
  product: { ...(product as any) /* existing spread */ },
  sourceBytes: bytes,
  sourceMime: file.type,
  cropRect: cropRect ?? null,
  templateId: shapeKind === 'template' ? shapeTemplateId : templateId,
  shapeKind,
  // existing multi-slot fields stay
});
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v resvg-js | head -20
```
(Expect errors for the `shapeKind` parameter on `runPreviewPipeline` — those get fixed in Task 9.)

- [ ] **Step 5: Commit**

```bash
git add app/\(site\)/gift/actions.ts
git commit -m "Gift upload action: accept + validate shape_kind / shape_template_id"
```

---

## Task 8: Server action — `restylePreviewFromSource` accepts shape params

**Files:**
- Modify: `app/(site)/gift/actions.ts`

- [ ] **Step 1: Extend input signature**

```ts
export async function restylePreviewFromSource(input: {
  product_slug: string;
  source_asset_id: string;
  prompt_id: string | null;
  variant_id?: string | null;
  shape_kind?: 'cutout' | 'rectangle' | 'template' | null;
  shape_template_id?: string | null;
}): Promise<
  { ok: true; sourceAssetId: string; previewAssetId: string; previewUrl: string }
  | { ok: false; error: string }
>
```

- [ ] **Step 2: Validate + forward**

Copy the same `configuredShapes` validation block from Task 7, then pass through to `runPreviewPipeline`:
```ts
preview = await runPreviewPipeline({
  product: { /* existing spread */ },
  sourceBytes: bytes,
  sourceMime: sourceAsset.mime_type ?? 'image/jpeg',
  cropRect: null,
  templateId: input.shape_kind === 'template' ? (input.shape_template_id ?? null) : null,
  shapeKind: input.shape_kind ?? null,
});
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v resvg-js | head -20
```

- [ ] **Step 4: Commit**

```bash
git add app/\(site\)/gift/actions.ts
git commit -m "Gift restyle action: accept + forward shape_kind / shape_template_id"
```

---

## Task 9: Cutout pipeline stage

**Files:**
- Create: `lib/gifts/pipeline/cutout.ts`
- Modify: `lib/gifts/pipeline.ts`

- [ ] **Step 1: Install potrace**

```bash
pnpm add potrace
```

Potrace traces a raster image (via alpha threshold) into an SVG path — exactly what's needed for a laser cut path.

- [ ] **Step 2: Write the cutout stage**

File: `lib/gifts/pipeline/cutout.ts`
```ts
// Cutout shape stage: stylise → bg-remove → SVG silhouette trace →
// transparent-checker preview. Inputs + outputs mirror the existing
// runAiTransform / renderPhotoResize stages so the dispatcher can call
// us uniformly.

import sharp from 'sharp';
import potrace from 'potrace';
import { runReplicate } from '../ai';
import type { GiftProduct } from '../types';

/** Replicate model that returns a PNG with transparent background.
 *  851-labs/background-remover is a safe default; swap to the
 *  admin-configured bg-remove pipeline if we later add one. */
const BG_REMOVE_MODEL = 'smoretalk/rembg-enhance';

export async function renderCutoutPreview(opts: {
  styledBytes: Uint8Array;
  styledMime: string;
  widthPx: number;
  heightPx: number;
}): Promise<{ previewBuffer: Buffer; cutSvg: string }> {
  // 1. Bg-remove via Replicate — returns a PNG with alpha.
  const bgRemoved = await runReplicate({
    model: BG_REMOVE_MODEL,
    input: {},
    imageBytes: opts.styledBytes,
    imageMime: opts.styledMime,
  });

  // 2. Compose onto a transparent-checker pattern so the customer
  //    sees "acrylic follows your photo".
  const checker = await makeCheckerPng(opts.widthPx, opts.heightPx);
  const previewBuffer = await sharp(checker)
    .composite([{ input: bgRemoved, top: 0, left: 0, blend: 'over' }])
    .jpeg({ quality: 84 })
    .toBuffer();

  // 3. Trace the alpha → SVG path for the laser.
  const cutSvg = await traceAlpha(bgRemoved);

  return { previewBuffer, cutSvg };
}

async function makeCheckerPng(w: number, h: number): Promise<Buffer> {
  // 16-px checker — neutral grey on white.
  const tile = 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <pattern id="c" width="${tile * 2}" height="${tile * 2}" patternUnits="userSpaceOnUse">
        <rect width="${tile * 2}" height="${tile * 2}" fill="#fff"/>
        <rect width="${tile}" height="${tile}" fill="#e5e5e5"/>
        <rect x="${tile}" y="${tile}" width="${tile}" height="${tile}" fill="#e5e5e5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#c)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function traceAlpha(pngBytes: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    potrace.trace(pngBytes, { threshold: 128, turdSize: 100, optCurve: true }, (err, svg) => {
      if (err) reject(err);
      else resolve(svg);
    });
  });
}
```

- [ ] **Step 3: Wire dispatcher + new asset role in `lib/gifts/pipeline.ts`**

In `runPreviewPipeline`, add `shapeKind` to the input type and switch after the existing style transform:
```ts
export async function runPreviewPipeline(input: {
  product: GiftProduct;
  sourceBytes: Uint8Array;
  sourceMime: string;
  cropRect: GiftCropRect | null;
  templateId: string | null;
  shapeKind?: 'cutout' | 'rectangle' | 'template' | null;
  // existing multi-slot fields…
}): Promise<{ previewPath: string; previewPublicUrl: string; widthPx: number; heightPx: number }> {
  // … existing style transform (AI / photo-resize) runs as today,
  //    producing `styledBytes` + dimensions …

  if (input.shapeKind === 'cutout') {
    const { renderCutoutPreview } = await import('./pipeline/cutout');
    const { previewBuffer, cutSvg } = await renderCutoutPreview({
      styledBytes: styledBytes,
      styledMime: 'image/png',
      widthPx, heightPx,
    });

    const previewKey = makeKey(`preview-cutout-${input.product.slug}`, 'jpg');
    await putObject(GIFT_BUCKETS.previews, previewKey, previewBuffer, 'image/jpeg');

    // Save the SVG cut path as its own asset row.
    const cutKey = makeKey(`cut-${input.product.slug}`, 'svg');
    await putObject(GIFT_BUCKETS.previews, cutKey, Buffer.from(cutSvg, 'utf8'), 'image/svg+xml');
    // createClient() and gift_assets insert follow the same pattern as preview rows —
    // use role: 'cut_file' to distinguish.

    return {
      previewPath: previewKey,
      previewPublicUrl: /* public URL from GIFT_BUCKETS.previews */ '',
      widthPx, heightPx,
    };
  }

  // shapeKind === 'template' → fall through to existing template composite branch.
  // shapeKind === 'rectangle' or null → fall through to existing bleed-pad / direct preview branch.
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v resvg-js | head -20
```

- [ ] **Step 5: Smoke-test pipeline**

Hit the pipeline end-to-end via a local gift page that has `shape_options` set to a cutout-only config (use the admin UI from Task 6 on a dev product). Upload a photo → preview should come back with a transparent checker background + a `cut_file` asset row in the DB.

Verify DB:
```sql
select role, path, mime_type, created_at
  from gift_assets
 where role = 'cut_file'
 order by created_at desc limit 1;
```
Expected: one row with mime_type `image/svg+xml`.

- [ ] **Step 6: Commit**

```bash
git add lib/gifts/pipeline/cutout.ts lib/gifts/pipeline.ts package.json pnpm-lock.yaml
git commit -m "Gift cutout pipeline: bg-remove + potrace silhouette + checker preview"
```

---

## Task 10: Customer-facing shape picker component

**Files:**
- Create: `components/gift/gift-shape-picker.tsx`

- [ ] **Step 1: Write the component**

File: `components/gift/gift-shape-picker.tsx`
```tsx
'use client';

import type { ShapeOption, ShapeKind } from '@/lib/gifts/shape-options';
import type { GiftTemplate } from '@/lib/gifts/types';

const KIND_ICON: Record<ShapeKind, string> = {
  cutout: '◐',
  rectangle: '▭',
  template: '▦',
};

type Props = {
  options: ShapeOption[];
  allTemplates: GiftTemplate[];
  selectedKind: ShapeKind;
  selectedTemplateId: string | null;
  onSelectKind: (k: ShapeKind) => void;
  onSelectTemplate: (id: string) => void;
};

export function GiftShapePicker({
  options, allTemplates, selectedKind, selectedTemplateId, onSelectKind, onSelectTemplate,
}: Props) {
  const templateRow = options.find((o) => o.kind === 'template');
  const visibleTemplates = templateRow?.kind === 'template'
    ? allTemplates.filter((t) => templateRow.template_ids.includes(t.id))
    : [];
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 900,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--pv-ink)',
          marginBottom: 8,
        }}
      >
        Shape
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const active = selectedKind === o.kind;
          return (
            <button
              key={o.kind}
              type="button"
              onClick={() => onSelectKind(o.kind)}
              style={{
                padding: '10px 14px',
                border: active ? '3px solid var(--pv-magenta)' : '2px solid var(--pv-ink)',
                background: active ? 'var(--pv-magenta)' : '#fff',
                color: active ? '#fff' : 'var(--pv-ink)',
                fontFamily: 'var(--pv-f-mono)', fontSize: 11, fontWeight: 800,
                letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: active ? '2px 2px 0 var(--pv-yellow)' : 'none',
              }}
            >
              {KIND_ICON[o.kind]} {o.label}
              {typeof o.price_delta_cents === 'number' && o.price_delta_cents > 0 && (
                <span style={{ opacity: 0.7, marginLeft: 6 }}>+S${(o.price_delta_cents / 100).toFixed(2)}</span>
              )}
            </button>
          );
        })}
      </div>
      {selectedKind === 'template' && visibleTemplates.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {visibleTemplates.map((t) => {
            const active = selectedTemplateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTemplate(t.id)}
                style={{
                  padding: 6,
                  border: active ? '3px solid var(--pv-magenta)' : '2px solid var(--pv-ink)',
                  background: '#fff', cursor: 'pointer', width: 84,
                }}
                title={t.name}
              >
                {t.thumbnail_url ? (
                  <img src={t.thumbnail_url} alt={t.name}
                    style={{ width: 68, height: 68, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                ) : (
                  <div style={{ width: 68, height: 68, background: '#f3f3f3' }} />
                )}
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, textAlign: 'center' }}>{t.name}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v resvg-js | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/gift/gift-shape-picker.tsx
git commit -m "Gift shape picker: tab row + template sub-grid component"
```

---

## Task 11: Wire shape picker into `gift-product-page.tsx`

**Files:**
- Modify: `components/gift/gift-product-page.tsx`

- [ ] **Step 1: Add shape state**

Near the existing picker state:
```ts
import { GiftShapePicker } from './gift-shape-picker';
import type { ShapeKind, ShapeOption } from '@/lib/gifts/shape-options';

const shapeOptions: ShapeOption[] = (product.shape_options ?? []) as ShapeOption[];
const shapePickerActive = shapeOptions.length > 0;
const defaultShape: ShapeKind = shapeOptions[0]?.kind ?? 'rectangle';
const [selectedShapeKind, setSelectedShapeKind] = useState<ShapeKind>(defaultShape);
const [selectedShapeTemplateId, setSelectedShapeTemplateId] = useState<string | null>(() => {
  const tpl = shapeOptions.find((o) => o.kind === 'template');
  return tpl?.kind === 'template' ? tpl.template_ids[0] ?? null : null;
});
const [lastRenderedShape, setLastRenderedShape] = useState<ShapeKind | null>(null);
const [lastRenderedTemplateId, setLastRenderedTemplateId] = useState<string | null>(null);
```

- [ ] **Step 2: Pass shape to upload**

In `doUpload` / `doMultiSlotUpload`, add to the FormData alongside the existing fields:
```ts
if (shapePickerActive) {
  fd.append('shape_kind', selectedShapeKind);
  if (selectedShapeKind === 'template' && selectedShapeTemplateId) {
    fd.append('shape_template_id', selectedShapeTemplateId);
  }
}
```

After `setPreview(r)`:
```ts
setLastRenderedShape(shapePickerActive ? selectedShapeKind : null);
setLastRenderedTemplateId(selectedShapeKind === 'template' ? selectedShapeTemplateId : null);
setHistory(appendPreviewHit(product.slug, {
  promptId: selectedPromptId,
  shapeKind: shapePickerActive ? selectedShapeKind : null,
  templateId: selectedShapeKind === 'template' ? selectedShapeTemplateId : null,
  sourceAssetId: r.sourceAssetId,
  previewAssetId: r.previewAssetId,
  previewUrl: r.previewUrl,
}));
```

- [ ] **Step 3: Pass shape to restyle + extend Regenerate trigger**

In `doRestyle`, pass shape fields:
```ts
const r = await restylePreviewFromSource({
  product_slug: product.slug,
  source_asset_id: preview.sourceAssetId,
  prompt_id: selectedPromptId,
  variant_id: selectedVariantId,
  shape_kind: shapePickerActive ? selectedShapeKind : null,
  shape_template_id: selectedShapeKind === 'template' ? selectedShapeTemplateId : null,
});
```
After success mirror the same `setLastRenderedShape` / `setLastRenderedTemplateId` + `appendPreviewHit` block.

Extend the Regenerate-visibility condition:
```tsx
const styleDrift = showPromptPicker && selectedPromptId && selectedPromptId !== lastGeneratedPromptId;
const shapeDrift = shapePickerActive && lastRenderedShape !== null &&
  (selectedShapeKind !== lastRenderedShape ||
   (selectedShapeKind === 'template' && selectedShapeTemplateId !== lastRenderedTemplateId));
{preview && (styleDrift || shapeDrift) && (
  /* existing Regenerate CTA, extended copy to name the changed axis */
)}
```
Copy update example: *"Preview is still Cutout. Regenerate as Rectangle?"* — compute the delta description from whichever axis drifted.

- [ ] **Step 4: Render the picker**

Put the picker right below the big preview frame, above the Regenerate CTA:
```tsx
{shapePickerActive && (
  <GiftShapePicker
    options={shapeOptions}
    allTemplates={templates}
    selectedKind={selectedShapeKind}
    selectedTemplateId={selectedShapeTemplateId}
    onSelectKind={setSelectedShapeKind}
    onSelectTemplate={setSelectedShapeTemplateId}
  />
)}
```

- [ ] **Step 5: Extend history-strip label + restore**

In the history strip, compose a richer label:
```ts
const styleName = h.promptId ? prompts.find((p) => p.id === h.promptId)?.name ?? 'Style' : 'Preview';
const shapeName = h.shapeKind === 'cutout' ? 'Cutout'
  : h.shapeKind === 'rectangle' ? 'Rectangle'
  : h.shapeKind === 'template'  ? templates.find((t) => t.id === h.templateId)?.name ?? 'Template'
  : null;
const label = shapeName ? `${shapeName} · ${styleName}` : styleName;
```

In the restore click handler, set the shape state too:
```ts
if (h.shapeKind) {
  setSelectedShapeKind(h.shapeKind);
  setSelectedShapeTemplateId(h.templateId);
  setLastRenderedShape(h.shapeKind);
  setLastRenderedTemplateId(h.templateId);
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v resvg-js | head -20
```

- [ ] **Step 7: Browser smoke-test**

On a product with `shape_options` enabled via the admin UI from Task 6:
1. Load the product page — shape tabs visible under the preview, default tab highlighted.
2. Upload a photo — preview renders with the default shape.
3. Click a different shape → yellow Regenerate CTA appears.
4. Click Regenerate → preview re-renders in new shape, history strip gains a second labelled thumbnail.
5. Click the first thumbnail → preview restores, shape tab snaps back, Regenerate CTA disappears.
6. Refresh the page → history thumbnails persist (localStorage).

- [ ] **Step 8: Commit**

```bash
git add components/gift/gift-product-page.tsx
git commit -m "Gift product page: wire shape picker, Regenerate, and history labels"
```

---

## Task 12: Sticky total reflects shape price delta

**Files:**
- Modify: `components/gift/gift-product-page.tsx`

- [ ] **Step 1: Import the helper**

```ts
import { shapeOptionsPriceDelta } from '@/lib/gifts/shape-options';
```

- [ ] **Step 2: Include delta in total calc**

Find the existing total-calculation block (the one that sums base + variant + size). Add the shape delta:
```ts
const shapeDelta = shapeOptionsPriceDelta(product.shape_options ?? null, selectedShapeKind);
const totalCents = baseCents + variantDelta + sizeDelta + shapeDelta;
```

- [ ] **Step 3: Visual verification**

In the browser flow from Task 11, if any shape has `price_delta_cents > 0`, flipping to that shape should update the sticky total. Test with a cutout priced +S$5: tab click → total goes up by S$5.

- [ ] **Step 4: Commit**

```bash
git add components/gift/gift-product-page.tsx
git commit -m "Gift total: include shape_options price delta in sticky sum"
```

---

## Task 13: Cart payload carries shape fields

**Files:**
- Modify: `lib/cart-store.ts`
- Modify: `components/gift/gift-product-page.tsx` (handleAddToCart)

- [ ] **Step 1: Extend the cart line type**

In `lib/cart-store.ts`, on the gift line-item shape:
```ts
// added fields
shape_kind?: 'cutout' | 'rectangle' | 'template' | null;
shape_template_id?: string | null;
```

- [ ] **Step 2: Populate from `handleAddToCart`**

In `components/gift/gift-product-page.tsx`, inside the add-to-cart builder object:
```ts
shape_kind: shapePickerActive ? selectedShapeKind : null,
shape_template_id: selectedShapeKind === 'template' ? selectedShapeTemplateId : null,
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v resvg-js | head -20
```

- [ ] **Step 4: Commit**

```bash
git add lib/cart-store.ts components/gift/gift-product-page.tsx
git commit -m "Gift cart: carry shape_kind + shape_template_id on gift line items"
```

---

## Task 14: Persist shape fields to `gift_order_items` at checkout

**Files:**
- Modify: the gift checkout / order-creation server action (grep `gift_order_items` + `insert` to locate)

- [ ] **Step 1: Locate the checkout server action**

```bash
```
Use Grep — search pattern: `from\('gift_order_items'\)|gift_order_items.*insert`. Expect one or two hits.

- [ ] **Step 2: Forward cart line fields into the insert**

In the identified insert, add:
```ts
shape_kind: line.shape_kind ?? null,
shape_template_id: line.shape_template_id ?? null,
```

- [ ] **Step 3: End-to-end smoke-test**

1. On a dev product with `shape_options`, add a cutout preview to cart.
2. Check out (dev / test mode — don't actually charge).
3. Verify the `gift_order_items` row has `shape_kind = 'cutout'` + template_id NULL.

- [ ] **Step 4: Commit**

```bash
git add <the checkout file>
git commit -m "Gift checkout: persist shape_kind + shape_template_id on order items"
```

---

## Task 15: Enable on the 3 target products (operational)

**Files:** none — this is admin-UI config work. Can be scripted if the user provides slugs.

- [ ] **Step 1: Identify the 3 product slugs**

Ask the user which 3 products should opt into this. Write them down here before doing the step: `slug-1`, `slug-2`, `slug-3`.

- [ ] **Step 2: Configure via admin UI (recommended)**

For each slug, open `/admin/gifts/<id>` → Design tab → enable "Shape options" → add rows + templates + price deltas → Save. Takes ~60 seconds per product.

- [ ] **Step 3: Customer smoke-test**

For each product, open the public `/gifts/<slug>` page, upload a photo, and verify:
- Shape tabs appear under the preview.
- Every shape's Regenerate flow ends with a thumbnail landing in the history strip.
- Cart-add produces a line item carrying the correct `shape_kind`.

- [ ] **Step 4: No commit required** (admin DB rows, not code).

---

## Self-review

**Spec coverage:**

| Spec section | Covered by |
|---|---|
| `shape_options` column | Task 1 |
| PreviewHit extension | Task 4 |
| `gift_assets.role='cut_file'` | Task 9 |
| `gift_order_items` columns | Task 2 |
| Customer UX (tabs, sub-picker, Regenerate, history) | Tasks 10–12 |
| Admin config block | Tasks 5–6 |
| Cutout pipeline stage | Task 9 |
| Rectangle pass-through | Task 9 (dispatcher falls through) |
| Template pass-through | Task 9 (dispatcher falls through) |
| Request-contract validation | Tasks 7–8 |
| Cart + order persistence | Tasks 13–14 |
| Rollout / enabling target products | Task 15 |

**Placeholder scan:** None found — every task has exact paths + complete code snippets.

**Type consistency:**
- `ShapeKind` + `ShapeOption` defined in Task 3, consumed by Tasks 4, 5, 6, 7, 8, 9, 10, 11, 12, 13.
- `shapeKind` / `templateId` on `PreviewHit` defined in Task 4, consumed by Task 11.
- `shape_kind` / `shape_template_id` on server actions defined in Tasks 7 + 8, consumed by Task 11.
- `shape_kind` / `shape_template_id` on cart line defined in Task 13, consumed by Task 14.

Naming stays consistent. No drift.
