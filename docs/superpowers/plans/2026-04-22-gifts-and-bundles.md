# Gifts Section + Mixed Bundles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Productise the gifts subsystem (variants, admin-selectable production pipelines, style picker, staff production queue, 30-day retention) and then extend the bundles system to mix services and gift SKUs in a single bundle.

**Architecture:** Additive — leave existing gift and bundle tables intact and extend with new tables (`gift_pipelines`, `gift_product_variants`, `gift_retention_runs`, `bundle_gift_items`) plus a handful of columns. Pipeline resolution is centralised in `lib/gifts/pipeline.ts`; customer flow changes are isolated to `components/gift/gift-product-page.tsx` and `app/(site)/bundle/[slug]/page.tsx`; staff workflow lives in a new `/admin/gifts/orders` page.

**Tech Stack:** Next.js 14 App Router, Supabase (postgres + storage + RLS), TypeScript, `sharp` for image processing, `pdf-lib` for PDF wrapping, Vercel cron, `postgres` client for migrations, PostgREST for admin CRUD.

**Project reality (adjust TDD to the codebase):** No test runner is installed (`package.json` has no `vitest`/`jest`/`playwright`). "TDD" in this plan means **apply → query DB / lint / build / smoke test → commit**. Migrations are verified by querying the resulting schema via PostgREST; UI is verified by `npm run build` + `npm run dev` + manual interaction on `localhost:3000`; DB data by a one-shot `node -e` query. Every task ends with a commit to the `claude/jovial-booth-a66fda` branch; deploy to `main` after each commit per user's standing preference.

**Dependency order:**
- Phase 1–7 = Gifts spec (ships first; self-contained)
- Phase 8–11 = Bundles spec (depends on variants + pipelines from Phase 1)

**Specs:**
- [docs/superpowers/specs/2026-04-22-gifts-section-design.md](../specs/2026-04-22-gifts-section-design.md)
- [docs/superpowers/specs/2026-04-22-mixed-bundles-design.md](../specs/2026-04-22-mixed-bundles-design.md)

---

## Phase 1 — Gifts data model (migrations 0033–0036)

### Task 1: Migration 0033 — `gift_pipelines` table

**Files:**
- Create: `supabase/migrations/0033_gift_pipelines.sql`
- Create: `scripts/apply-migration-0033.mjs`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 0033_gift_pipelines.sql
-- Named production pipelines (processing recipes). Admin picks one per
-- gift product; the engine resolves it at preview + production time.

create table if not exists public.gift_pipelines (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  kind gift_mode not null,
  ai_endpoint_url text,
  ai_model_slug text,
  default_params jsonb not null default '{}'::jsonb,
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gift_pipelines_active_kind_idx
  on public.gift_pipelines(kind, is_active);

create or replace function public.touch_gift_pipelines_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_pipelines_updated_at on public.gift_pipelines;
create trigger trg_gift_pipelines_updated_at before update on public.gift_pipelines
  for each row execute procedure public.touch_gift_pipelines_updated_at();

alter table public.gift_pipelines enable row level security;

drop policy if exists "gift_pipelines public read active" on public.gift_pipelines;
create policy "gift_pipelines public read active" on public.gift_pipelines
  for select using (is_active);

drop policy if exists "gift_pipelines admin all" on public.gift_pipelines;
create policy "gift_pipelines admin all" on public.gift_pipelines
  for all using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());
```

- [ ] **Step 2: Write the apply script**

Copy `scripts/apply-migration-0032.mjs` and change the migration filename + log message to `0033_gift_pipelines.sql`.

- [ ] **Step 3: Apply and verify**

Run: `node scripts/apply-migration-0033.mjs`
Expected output: `✓ migration 0033 applied (gift_pipelines)`

Run (verifies the table exists):
```bash
node -e "
import('postgres').then(async ({ default: postgres }) => {
  const fs = await import('node:fs');
  const env = fs.readFileSync('.env.local','utf8');
  const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^[\"']|[\"']\$/g,'')];}));
  const sql = postgres(kv.SUPABASE_DB_URL, { max: 1, prepare: false });
  const r = await sql\`select column_name from information_schema.columns where table_name='gift_pipelines' order by ordinal_position\`;
  console.log(r.map(c => c.column_name).join(', '));
  await sql.end();
});
"
```
Expected: `id, slug, name, description, kind, ai_endpoint_url, ai_model_slug, default_params, thumbnail_url, is_active, created_at, updated_at`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0033_gift_pipelines.sql scripts/apply-migration-0033.mjs
git commit -m "Migration 0033: gift_pipelines table"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 2: Migration 0034 — `gift_product_variants` table

**Files:**
- Create: `supabase/migrations/0034_gift_product_variants.sql`
- Create: `scripts/apply-migration-0034.mjs`

- [ ] **Step 1: Write migration**

```sql
-- 0034_gift_product_variants.sql
-- Per-product physical bases (e.g. LED base types). One gift product
-- may have 0..N variants. Each variant has its own mockup, features,
-- and price.

create table if not exists public.gift_product_variants (
  id uuid primary key default gen_random_uuid(),
  gift_product_id uuid not null references public.gift_products(id) on delete cascade,
  slug text not null,
  name text not null,
  features jsonb not null default '[]'::jsonb,
  mockup_url text not null,
  mockup_area jsonb not null default '{"x":20,"y":20,"width":60,"height":60}'::jsonb,
  variant_thumbnail_url text,
  base_price_cents integer not null default 0,
  price_tiers jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gift_product_id, slug)
);

create index if not exists gift_product_variants_product_active_idx
  on public.gift_product_variants(gift_product_id, is_active, display_order);

create or replace function public.touch_gift_product_variants_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_product_variants_updated_at on public.gift_product_variants;
create trigger trg_gift_product_variants_updated_at before update on public.gift_product_variants
  for each row execute procedure public.touch_gift_product_variants_updated_at();

alter table public.gift_product_variants enable row level security;

drop policy if exists "gift_product_variants public read active" on public.gift_product_variants;
create policy "gift_product_variants public read active" on public.gift_product_variants
  for select using (
    is_active and exists (
      select 1 from public.gift_products gp
      where gp.id = gift_product_id and gp.is_active
    )
  );

drop policy if exists "gift_product_variants admin all" on public.gift_product_variants;
create policy "gift_product_variants admin all" on public.gift_product_variants
  for all using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());
```

- [ ] **Step 2: Apply script + apply + verify**

Copy `scripts/apply-migration-0033.mjs` to `0034.mjs`, update filename. Run it. Verify via the same `information_schema.columns` query substituting `'gift_product_variants'`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0034_gift_product_variants.sql scripts/apply-migration-0034.mjs
git commit -m "Migration 0034: gift_product_variants table"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 3: Migration 0035 — extend gift_products, gift_prompts, gift_order_items

**Files:**
- Create: `supabase/migrations/0035_gift_extends.sql`
- Create: `scripts/apply-migration-0035.mjs`

- [ ] **Step 1: Write migration**

```sql
-- 0035_gift_extends.sql
-- Extend existing gift tables for pipelines, style picker, variants,
-- retention, and bundle linkage.

-- gift_products: pipeline_id + retention override
alter table public.gift_products
  add column if not exists pipeline_id uuid references public.gift_pipelines(id) on delete set null,
  add column if not exists source_retention_days integer not null default 30;

-- gift_prompts: style picker + optional pipeline override
alter table public.gift_prompts
  add column if not exists style text not null default 'line-art'
    check (style in ('line-art','realistic')),
  add column if not exists pipeline_id uuid references public.gift_pipelines(id) on delete set null;

create index if not exists gift_prompts_style_mode_idx
  on public.gift_prompts(style, mode, is_active, display_order);

-- gift_order_items: variant + pipeline snapshot, retention timestamps,
-- bundle linkage (bundle_id column added here in Phase 1 so gifts
-- spec is self-contained; bundle_gift_items FK comes later in phase 8)
alter table public.gift_order_items
  add column if not exists variant_id uuid references public.gift_product_variants(id) on delete set null,
  add column if not exists pipeline_id uuid references public.gift_pipelines(id) on delete set null,
  add column if not exists variant_name_snapshot text,
  add column if not exists variant_price_snapshot_cents integer,
  add column if not exists source_purged_at timestamptz,
  add column if not exists production_purged_at timestamptz,
  add column if not exists bundle_id uuid references public.bundles(id) on delete set null;

create index if not exists gift_order_items_unpurged_idx
  on public.gift_order_items(production_status)
  where production_status <> 'ready' or source_purged_at is null;

create index if not exists gift_order_items_bundle_idx
  on public.gift_order_items(bundle_id)
  where bundle_id is not null;
```

- [ ] **Step 2: Apply + verify**

Write `scripts/apply-migration-0035.mjs` following the pattern. Run it.

Verify via:
```bash
node -e "
import('postgres').then(async ({ default: postgres }) => {
  const fs = await import('node:fs');
  const env = fs.readFileSync('.env.local','utf8');
  const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^[\"']|[\"']\$/g,'')];}));
  const sql = postgres(kv.SUPABASE_DB_URL, { max: 1, prepare: false });
  for (const t of ['gift_products','gift_prompts','gift_order_items']) {
    const r = await sql\`select column_name from information_schema.columns where table_name=\${t} order by ordinal_position\`;
    console.log(t, '→', r.map(c=>c.column_name).join(', '));
  }
  await sql.end();
});
"
```
Expected: `gift_products` includes `pipeline_id, source_retention_days`; `gift_prompts` includes `style, pipeline_id`; `gift_order_items` includes `variant_id, pipeline_id, variant_name_snapshot, variant_price_snapshot_cents, source_purged_at, production_purged_at, bundle_id`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0035_gift_extends.sql scripts/apply-migration-0035.mjs
git commit -m "Migration 0035: extend gift tables for pipelines, variants, retention, bundle link"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 4: Migration 0036 — `gift_retention_runs` audit table

**Files:**
- Create: `supabase/migrations/0036_gift_retention_runs.sql`
- Create: `scripts/apply-migration-0036.mjs`

- [ ] **Step 1: Write migration**

```sql
-- 0036_gift_retention_runs.sql
-- Audit log for the daily purge cron.

create table if not exists public.gift_retention_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  sources_deleted integer not null default 0,
  production_deleted integer not null default 0,
  errors jsonb not null default '[]'::jsonb
);

create index if not exists gift_retention_runs_ran_at_idx
  on public.gift_retention_runs(ran_at desc);

alter table public.gift_retention_runs enable row level security;

drop policy if exists "gift_retention_runs admin read" on public.gift_retention_runs;
create policy "gift_retention_runs admin read" on public.gift_retention_runs
  for select using (public.is_admin_or_staff());
-- No insert policy needed; the cron uses the service-role key which bypasses RLS.
```

- [ ] **Step 2: Apply + commit**

Run apply script. Verify table exists.

```bash
git add supabase/migrations/0036_gift_retention_runs.sql scripts/apply-migration-0036.mjs
git commit -m "Migration 0036: gift_retention_runs audit table"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 5: Seed default pipelines + backfill

**Files:**
- Create: `scripts/seed-gift-pipelines.mjs`

- [ ] **Step 1: Write seed script**

```js
// Seed the four default pipelines (one per mode) and backfill
// gift_products.pipeline_id so existing rows resolve without code fallback.
import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' };

const PIPELINES = [
  { slug: 'laser-v1',        kind: 'laser',        name: 'Laser (default)',        description: 'High-contrast binarised output for laser engraving.' },
  { slug: 'uv-flat-v1',      kind: 'uv',           name: 'UV Flat (default)',      description: 'Flat saturated output for UV flatbed print.' },
  { slug: 'embroidery-4c-v1',kind: 'embroidery',   name: 'Embroidery 4-colour',    description: 'Posterised 4-colour output for machine embroidery.' },
  { slug: 'photo-resize-v1', kind: 'photo-resize', name: 'Photo Resize (default)', description: 'No AI. Crop + bleed only.' },
];

for (const p of PIPELINES) {
  const r = await fetch(`${BASE}/rest/v1/gift_pipelines?on_conflict=slug`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ ...p, default_params: {}, is_active: true }),
  });
  if (!r.ok) throw new Error(`seed ${p.slug}: ${r.status} ${await r.text()}`);
  console.log(`✓ pipeline ${p.slug}`);
}

// Backfill gift_products.pipeline_id from current mode
for (const p of PIPELINES) {
  const byKind = await (await fetch(`${BASE}/rest/v1/gift_pipelines?slug=eq.${p.slug}&select=id`, { headers: H })).json();
  const pid = byKind[0]?.id;
  if (!pid) continue;
  const upd = await fetch(`${BASE}/rest/v1/gift_products?mode=eq.${p.kind}&pipeline_id=is.null`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ pipeline_id: pid }),
  });
  if (!upd.ok) console.warn(`backfill ${p.kind}: ${upd.status}`);
}
console.log('\n✓ Pipelines seeded + existing gift_products backfilled.');
```

- [ ] **Step 2: Run + verify**

Run: `node scripts/seed-gift-pipelines.mjs`
Expected: 4 `✓ pipeline ...` lines + final confirmation.

Verify backfill:
```bash
node -e "
(async () => {
  const fs = require('node:fs');
  const env = fs.readFileSync('.env.local','utf8');
  const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^[\"']|[\"']\$/g,'')];}));
  const r = await fetch(kv.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/gift_products?select=slug,mode,pipeline_id', { headers: { apikey: kv.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer '+kv.SUPABASE_SERVICE_ROLE_KEY } });
  console.log(await r.text());
})();
"
```
Expected: every row has a non-null `pipeline_id`.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-gift-pipelines.mjs
git commit -m "Seed default gift pipelines + backfill gift_products.pipeline_id"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 2 — Gifts lib layer

### Task 6: Types

**Files:**
- Modify: `lib/gifts/types.ts`

- [ ] **Step 1: Append new types**

Add to the existing file (do NOT replace existing types):

```ts
export type GiftPipelineKind = GiftMode;

export type GiftPipeline = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: GiftPipelineKind;
  ai_endpoint_url: string | null;
  ai_model_slug: string | null;
  default_params: Record<string, unknown>;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type GiftStyle = 'line-art' | 'realistic';

export type GiftProductVariant = {
  id: string;
  gift_product_id: string;
  slug: string;
  name: string;
  features: string[];
  mockup_url: string;
  mockup_area: { x: number; y: number; width: number; height: number };
  variant_thumbnail_url: string | null;
  base_price_cents: number;
  price_tiers: GiftPriceTier[];
  display_order: number;
  is_active: boolean;
};

// Extend GiftProduct with new fields (union type to avoid breaking existing usage)
export type GiftProductExtended = GiftProduct & {
  pipeline_id: string | null;
  source_retention_days: number;
};

// Extend GiftPrompt
declare module './prompts' {
  interface GiftPrompt {
    style: GiftStyle;
    pipeline_id: string | null;
  }
}
```

(The `declare module` block doesn't work for plain type files — instead, directly edit `lib/gifts/prompts.ts` next.)

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors on `lib/gifts/types.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/gifts/types.ts
git commit -m "Add GiftPipeline, GiftProductVariant, GiftStyle types"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 7: Extend GiftPrompt + add prompt resolution helpers

**Files:**
- Modify: `lib/gifts/prompts.ts`

- [ ] **Step 1: Update the type and add style-aware lookups**

Replace the contents of `lib/gifts/prompts.ts` with:

```ts
import { createClient } from '@/lib/supabase/server';
import type { GiftMode, GiftStyle } from './types';

export type GiftPrompt = {
  id: string;
  mode: GiftMode;
  style: GiftStyle;
  pipeline_id: string | null;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  transformation_prompt: string;
  negative_prompt: string | null;
  params: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
};

export async function listPromptsForMode(mode: GiftMode): Promise<GiftPrompt[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_prompts').select('*')
    .eq('mode', mode).eq('is_active', true)
    .order('display_order');
  return (data ?? []) as GiftPrompt[];
}

/** Resolve the prompt for a product + style choice, honouring pipeline_id override. */
export async function resolvePromptForProduct(
  productPipelineId: string | null,
  productMode: GiftMode,
  style: GiftStyle,
): Promise<GiftPrompt | null> {
  const sb = createClient();
  // 1. Try a prompt pinned to this product's pipeline + style
  if (productPipelineId) {
    const { data } = await sb
      .from('gift_prompts').select('*')
      .eq('pipeline_id', productPipelineId)
      .eq('style', style).eq('is_active', true)
      .order('display_order').limit(1);
    if (data && data[0]) return data[0] as GiftPrompt;
  }
  // 2. Fall back to a mode-level prompt for this style
  const { data } = await sb
    .from('gift_prompts').select('*')
    .is('pipeline_id', null).eq('mode', productMode)
    .eq('style', style).eq('is_active', true)
    .order('display_order').limit(1);
  return (data?.[0] ?? null) as GiftPrompt | null;
}

export async function listAllPromptsAdmin(): Promise<GiftPrompt[]> {
  const sb = createClient();
  const { data } = await sb.from('gift_prompts').select('*').order('mode').order('style').order('display_order');
  return (data ?? []) as GiftPrompt[];
}

export async function getPromptByIdAdmin(id: string): Promise<GiftPrompt | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_prompts').select('*').eq('id', id).maybeSingle();
  return data as GiftPrompt | null;
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no TypeScript errors. If `GiftPrompt` is imported somewhere that expects the old shape, fix that import in the same commit (grep: `grep -rn "GiftPrompt" app/ components/ lib/`).

- [ ] **Step 3: Commit**

```bash
git add lib/gifts/prompts.ts
git commit -m "Extend GiftPrompt with style + pipeline_id; add resolvePromptForProduct"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 8: Pipelines data module

**Files:**
- Create: `lib/gifts/pipelines.ts`

- [ ] **Step 1: Write the module**

```ts
import { createClient } from '@/lib/supabase/server';
import type { GiftMode, GiftPipeline } from './types';

export async function listActivePipelines(): Promise<GiftPipeline[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_pipelines').select('*')
    .eq('is_active', true).order('kind').order('name');
  return (data ?? []) as GiftPipeline[];
}

export async function listAllPipelinesAdmin(): Promise<GiftPipeline[]> {
  const sb = createClient();
  const { data } = await sb.from('gift_pipelines').select('*').order('kind').order('name');
  return (data ?? []) as GiftPipeline[];
}

export async function getPipelineByIdAdmin(id: string): Promise<GiftPipeline | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_pipelines').select('*').eq('id', id).maybeSingle();
  return data as GiftPipeline | null;
}

/** Default pipeline for a mode, used when product.pipeline_id is null. */
export async function getDefaultPipelineForMode(mode: GiftMode): Promise<GiftPipeline | null> {
  const sb = createClient();
  const DEFAULT_SLUGS: Record<GiftMode, string> = {
    laser: 'laser-v1',
    uv: 'uv-flat-v1',
    embroidery: 'embroidery-4c-v1',
    'photo-resize': 'photo-resize-v1',
  };
  const { data } = await sb.from('gift_pipelines').select('*').eq('slug', DEFAULT_SLUGS[mode]).maybeSingle();
  return data as GiftPipeline | null;
}
```

- [ ] **Step 2: Build check + commit**

```bash
npm run build
git add lib/gifts/pipelines.ts
git commit -m "Add lib/gifts/pipelines.ts (list / get / getDefaultPipelineForMode)"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 9: Variants data module

**Files:**
- Create: `lib/gifts/variants.ts`

- [ ] **Step 1: Write the module**

```ts
import { createClient } from '@/lib/supabase/server';
import type { GiftProductVariant } from './types';

export async function listActiveVariants(giftProductId: string): Promise<GiftProductVariant[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_product_variants').select('*')
    .eq('gift_product_id', giftProductId).eq('is_active', true)
    .order('display_order');
  return (data ?? []) as GiftProductVariant[];
}

export async function listAllVariantsAdmin(giftProductId: string): Promise<GiftProductVariant[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_product_variants').select('*')
    .eq('gift_product_id', giftProductId)
    .order('display_order');
  return (data ?? []) as GiftProductVariant[];
}

export async function getVariantById(id: string): Promise<GiftProductVariant | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_product_variants').select('*').eq('id', id).maybeSingle();
  return data as GiftProductVariant | null;
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add lib/gifts/variants.ts
git commit -m "Add lib/gifts/variants.ts"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 10: Pipeline-aware preview/production pipeline

**Files:**
- Modify: `lib/gifts/pipeline.ts`

- [ ] **Step 1: Add pipeline resolution at the top of both entry points**

At the top of `runPreviewPipeline` and `runProductionPipeline`, resolve the pipeline once:

```ts
import { getPipelineByIdAdmin, getDefaultPipelineForMode } from './pipelines';
// ... existing imports

async function resolvePipeline(product: GiftProduct & { pipeline_id?: string | null }) {
  if ((product as any).pipeline_id) {
    const p = await getPipelineByIdAdmin((product as any).pipeline_id);
    if (p) return p;
  }
  return getDefaultPipelineForMode(product.mode);
}
```

Replace both `switch (product.mode) { ... }` blocks with `switch (pipeline.kind) { ... }` after calling `const pipeline = await resolvePipeline(product);`.

Update `runAiTransform` to take the resolved pipeline:
```ts
async function runAiTransform(
  input: Buffer,
  product: GiftProduct,
  pipeline: { kind: string; ai_endpoint_url: string | null; default_params: Record<string, unknown> },
  preview: boolean,
): Promise<Buffer> { /* existing body, switched on pipeline.kind */ }
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: clean.

Run the ad-hoc smoke script if one exists in `scripts/` (none today — skip this step for this task).

- [ ] **Step 3: Commit**

```bash
git add lib/gifts/pipeline.ts
git commit -m "Pipeline runner resolves product.pipeline_id before transform"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 11: Retention helper module

**Files:**
- Create: `lib/gifts/retention.ts`

- [ ] **Step 1: Write the module**

```ts
// Server-only. Finds gift_order_items whose source should be purged,
// deletes the storage objects, and flips the *_purged_at timestamps.
import { createServiceClient } from '@/lib/supabase/service';
import { GIFT_BUCKETS } from './storage';

export type PurgeResult = { sourcesDeleted: number; productionDeleted: number; errors: string[] };

export async function purgeEligible(nowIso: string = new Date().toISOString()): Promise<PurgeResult> {
  const sb = createServiceClient();
  const { data: items, error } = await sb
    .from('gift_order_items')
    .select(`
      id, source_asset_id, production_asset_id, production_pdf_id,
      source_purged_at, production_purged_at,
      order:orders!inner(created_at),
      product:gift_products!inner(source_retention_days),
      source:gift_assets!source_asset_id(path),
      production:gift_assets!production_asset_id(path),
      production_pdf:gift_assets!production_pdf_id(path)
    `)
    .or('source_purged_at.is.null,production_purged_at.is.null')
    .limit(100);
  if (error) throw error;

  const result: PurgeResult = { sourcesDeleted: 0, productionDeleted: 0, errors: [] };
  for (const item of items ?? []) {
    const orderCreated = new Date((item as any).order.created_at).getTime();
    const retentionDays = (item as any).product.source_retention_days ?? 30;
    const cutoff = orderCreated + retentionDays * 24 * 60 * 60 * 1000;
    if (Date.now() < cutoff) continue;

    // Delete source
    if (!item.source_purged_at && (item as any).source?.path) {
      const { error: e } = await sb.storage.from(GIFT_BUCKETS.sources).remove([(item as any).source.path]);
      if (e) result.errors.push(`source ${item.id}: ${e.message}`);
      else result.sourcesDeleted++;
    }
    // Delete production PNG + PDF
    const prodPaths: string[] = [];
    if ((item as any).production?.path) prodPaths.push((item as any).production.path);
    if ((item as any).production_pdf?.path) prodPaths.push((item as any).production_pdf.path);
    if (!item.production_purged_at && prodPaths.length) {
      const { error: e } = await sb.storage.from(GIFT_BUCKETS.production).remove(prodPaths);
      if (e) result.errors.push(`production ${item.id}: ${e.message}`);
      else result.productionDeleted++;
    }
    // Flip timestamps
    await sb.from('gift_order_items')
      .update({ source_purged_at: nowIso, production_purged_at: nowIso })
      .eq('id', item.id);
  }

  await sb.from('gift_retention_runs').insert({
    sources_deleted: result.sourcesDeleted,
    production_deleted: result.productionDeleted,
    errors: result.errors,
  });
  return result;
}
```

- [ ] **Step 2: Create the service-role client helper if it doesn't exist**

Check: `ls lib/supabase/`. If no `service.ts`:

```ts
// lib/supabase/service.ts
import { createClient as createSBClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSBClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
```

- [ ] **Step 3: Build + commit**

```bash
npm run build
git add lib/gifts/retention.ts lib/supabase/service.ts
git commit -m "Add lib/gifts/retention.ts (purgeEligible)"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 3 — Admin: pipelines CRUD

### Task 12: Admin pipelines list page

**Files:**
- Create: `app/admin/gifts/pipelines/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import Link from 'next/link';
import { listAllPipelinesAdmin } from '@/lib/gifts/pipelines';

export const dynamic = 'force-dynamic';

export default async function AdminGiftPipelinesPage() {
  const pipelines = await listAllPipelinesAdmin();
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">Gift Pipelines</h1>
        <Link href="/admin/gifts/pipelines/new" className="rounded border-2 border-ink bg-yellow-brand px-4 py-2 font-bold">+ New pipeline</Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-neutral-100"><tr>
          <th className="border-b p-2 text-left">Slug</th>
          <th className="border-b p-2 text-left">Name</th>
          <th className="border-b p-2 text-left">Kind</th>
          <th className="border-b p-2 text-left">Model</th>
          <th className="border-b p-2 text-left">Active</th>
        </tr></thead>
        <tbody>{pipelines.map(p => (
          <tr key={p.id} className="hover:bg-yellow-50">
            <td className="border-b p-2 font-mono text-xs"><Link href={`/admin/gifts/pipelines/${p.id}`} className="underline">{p.slug}</Link></td>
            <td className="border-b p-2">{p.name}</td>
            <td className="border-b p-2">{p.kind}</td>
            <td className="border-b p-2 font-mono text-xs">{p.ai_model_slug ?? '—'}</td>
            <td className="border-b p-2">{p.is_active ? '✓' : '—'}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Run: `npm run dev`, navigate to `http://localhost:3000/admin/gifts/pipelines` (logged in as admin).
Expected: 4 seeded pipelines visible.

- [ ] **Step 3: Commit**

```bash
git add app/admin/gifts/pipelines/page.tsx
git commit -m "Admin: gift pipelines list page"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 13: Admin pipelines new + edit pages with server actions

**Files:**
- Create: `app/admin/gifts/pipelines/new/page.tsx`
- Create: `app/admin/gifts/pipelines/[id]/page.tsx`
- Create: `app/admin/gifts/pipelines/actions.ts`

- [ ] **Step 1: Server actions**

```ts
// app/admin/gifts/pipelines/actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPipeline(form: FormData) {
  const sb = createClient();
  const { data, error } = await sb.from('gift_pipelines').insert({
    slug: String(form.get('slug')),
    name: String(form.get('name')),
    description: String(form.get('description') ?? '') || null,
    kind: String(form.get('kind')),
    ai_endpoint_url: String(form.get('ai_endpoint_url') ?? '') || null,
    ai_model_slug: String(form.get('ai_model_slug') ?? '') || null,
    default_params: JSON.parse(String(form.get('default_params') ?? '{}')),
    thumbnail_url: String(form.get('thumbnail_url') ?? '') || null,
    is_active: form.get('is_active') === 'on',
  }).select('id').single();
  if (error) throw error;
  revalidatePath('/admin/gifts/pipelines');
  redirect(`/admin/gifts/pipelines/${data.id}`);
}

export async function updatePipeline(id: string, form: FormData) {
  const sb = createClient();
  const { error } = await sb.from('gift_pipelines').update({
    name: String(form.get('name')),
    description: String(form.get('description') ?? '') || null,
    kind: String(form.get('kind')),
    ai_endpoint_url: String(form.get('ai_endpoint_url') ?? '') || null,
    ai_model_slug: String(form.get('ai_model_slug') ?? '') || null,
    default_params: JSON.parse(String(form.get('default_params') ?? '{}')),
    thumbnail_url: String(form.get('thumbnail_url') ?? '') || null,
    is_active: form.get('is_active') === 'on',
  }).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/gifts/pipelines');
  revalidatePath(`/admin/gifts/pipelines/${id}`);
}
```

- [ ] **Step 2: New + edit pages**

Both pages render the same form (shared component makes sense but inline for brevity). Each has kind dropdown (laser/uv/embroidery/photo-resize), text inputs for slug/name/description/endpoint/model/thumbnail, textarea for default_params JSON, active checkbox. Form action → `createPipeline` / `updatePipeline`.

- [ ] **Step 3: Smoke test**

Dev server: create a new pipeline "laser-hand-drawn", verify it appears in list. Edit it, verify fields persist.

- [ ] **Step 4: Commit**

```bash
git add app/admin/gifts/pipelines/
git commit -m "Admin: gift pipelines CRUD (new / edit pages + actions)"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 4 — Admin: prompts + product edit extensions

### Task 14: Prompts admin — add style + pipeline columns

**Files:**
- Modify: `app/admin/gifts/prompts/page.tsx`
- Modify: `app/admin/gifts/prompts/[id]/page.tsx`
- Modify: `app/admin/gifts/prompts/actions.ts` (or whichever file holds create/update actions)

- [ ] **Step 1: Update list page**

Add a "Style" column and a "Pipeline" column (looked up via pipeline_id). Add a `<select>` filter at the top for pipeline.

- [ ] **Step 2: Update edit form**

Add a `<select name="style">` with "line-art" / "realistic" options, and a `<select name="pipeline_id">` populated from `listActivePipelines()` (empty value = "Mode default").

- [ ] **Step 3: Update actions**

Extend `createPrompt` / `updatePrompt` to read `style` and `pipeline_id` from the form and insert into the columns.

- [ ] **Step 4: Smoke test**

Edit an existing prompt, set its style to "realistic", save, verify it persists on reload.

- [ ] **Step 5: Commit**

```bash
git add app/admin/gifts/prompts/
git commit -m "Admin: prompts gain style + pipeline_id fields"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 15: Product edit — pipeline picker + retention input

**Files:**
- Modify: `app/admin/gifts/[id]/page.tsx`
- Modify: `app/admin/gifts/actions.ts`

- [ ] **Step 1: Load active pipelines in the edit page**

At the top of the server component:
```ts
import { listActivePipelines } from '@/lib/gifts/pipelines';
const pipelines = await listActivePipelines();
```

- [ ] **Step 2: Render pipeline picker + retention input**

In the form, add:
```tsx
<label className="block">
  <span className="text-xs font-bold uppercase">Production pipeline</span>
  <select name="pipeline_id" defaultValue={product.pipeline_id ?? ''} className="w-full border-2 border-ink p-2">
    <option value="">Use mode default ({product.mode})</option>
    {pipelines.filter(p => p.kind === product.mode).map(p => (
      <option key={p.id} value={p.id}>{p.name}</option>
    ))}
  </select>
</label>

<label className="block">
  <span className="text-xs font-bold uppercase">Delete uploads + production after (days)</span>
  <input type="number" name="source_retention_days" defaultValue={product.source_retention_days ?? 30} min="1" className="w-full border-2 border-ink p-2" />
</label>
```

- [ ] **Step 3: Extend `updateGiftProduct` action**

Read `pipeline_id` (convert empty → null) and `source_retention_days` (parseInt) from the FormData and include in the update payload.

- [ ] **Step 4: Smoke test**

Change one gift's pipeline, verify it sticks. Change retention to 7, verify.

- [ ] **Step 5: Commit**

```bash
git add app/admin/gifts/
git commit -m "Admin: gift product edit gains pipeline picker + retention input"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 16: Product edit — inline variants panel

**Files:**
- Create: `components/gift/admin-variants-panel.tsx`
- Modify: `app/admin/gifts/[id]/page.tsx`
- Modify: `app/admin/gifts/actions.ts`

- [ ] **Step 1: Server actions for variants**

Add to `app/admin/gifts/actions.ts`:

```ts
export async function upsertVariant(giftProductId: string, formJson: string) {
  'use server';
  const sb = createClient();
  const v = JSON.parse(formJson);
  if (v.id) {
    await sb.from('gift_product_variants').update({
      slug: v.slug, name: v.name, features: v.features, mockup_url: v.mockup_url,
      mockup_area: v.mockup_area, variant_thumbnail_url: v.variant_thumbnail_url,
      base_price_cents: v.base_price_cents, price_tiers: v.price_tiers,
      display_order: v.display_order, is_active: v.is_active,
    }).eq('id', v.id);
  } else {
    await sb.from('gift_product_variants').insert({
      gift_product_id: giftProductId, ...v,
    });
  }
  revalidatePath(`/admin/gifts/${giftProductId}`);
}

export async function deleteVariant(id: string, giftProductId: string) {
  'use server';
  const sb = createClient();
  await sb.from('gift_product_variants').delete().eq('id', id);
  revalidatePath(`/admin/gifts/${giftProductId}`);
}
```

- [ ] **Step 2: Variants panel component**

Create a client component with a table of existing variants + an "Add variant" button that opens an inline row with fields: name, slug (auto), features (textarea split on newlines), mockup upload (reuse existing upload button from elsewhere in admin — grep `Upload` in `components/admin/`), mockup-area picker (reuse `mockup_area` editor from the main product form), variant thumbnail, price, tiers JSON textarea, active checkbox, display_order.

- [ ] **Step 3: Render on product edit page**

```tsx
import { listAllVariantsAdmin } from '@/lib/gifts/variants';
import { AdminVariantsPanel } from '@/components/gift/admin-variants-panel';

const variants = await listAllVariantsAdmin(product.id);
// ... in JSX, below the main form:
<AdminVariantsPanel giftProductId={product.id} variants={variants} />
```

- [ ] **Step 4: Smoke test**

Create 3 variants on a test gift product. Edit one. Delete one. Refresh — all persist.

- [ ] **Step 5: Commit**

```bash
git add components/gift/admin-variants-panel.tsx app/admin/gifts/
git commit -m "Admin: inline variants panel on gift product edit page"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 5 — Customer gift page

### Task 17: Variant picker component

**Files:**
- Create: `components/gift/gift-variant-picker.tsx`

- [ ] **Step 1: Write component**

```tsx
'use client';
import type { GiftProductVariant } from '@/lib/gifts/types';
import { formatSGD } from '@/lib/utils';

export function GiftVariantPicker({
  variants,
  selectedId,
  onSelect,
}: {
  variants: GiftProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (variants.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {variants.map(v => {
        const active = v.id === selectedId;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={`border-2 p-3 text-left transition ${active ? 'border-pink bg-pink/5' : 'border-ink bg-white hover:bg-yellow-50'}`}
          >
            {v.variant_thumbnail_url && <img src={v.variant_thumbnail_url} alt={v.name} className="mb-2 aspect-square w-full object-cover" />}
            <div className="text-sm font-bold">{v.name}</div>
            <div className="text-xs text-pink">{formatSGD(v.base_price_cents)}</div>
            <ul className="mt-2 space-y-0.5 text-xs text-neutral-600">
              {v.features.slice(0, 4).map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/gift/gift-variant-picker.tsx
git commit -m "Add GiftVariantPicker component"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 18: Wire variant picker + pass variant mockup to compositor

**Files:**
- Modify: `components/gift/gift-product-page.tsx`
- Modify: `app/(site)/gift/[slug]/page.tsx` (pass variants to client component)

- [ ] **Step 1: Fetch variants server-side**

In `app/(site)/gift/[slug]/page.tsx`:
```ts
import { listActiveVariants } from '@/lib/gifts/variants';
const variants = await listActiveVariants(product.id);
// pass to GiftProductPage as a new prop
```

- [ ] **Step 2: State + picker in gift-product-page.tsx**

Add to the component:
```tsx
const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
  variants.length === 1 ? variants[0].id : variants.length > 0 ? variants[0].id : null,
);
const selectedVariant = variants.find(v => v.id === selectedVariantId) ?? null;

// Show picker when 2+ variants
{variants.length >= 2 && (
  <section className="mb-6">
    <h2 className="mb-3 text-sm font-bold uppercase">Pick your base</h2>
    <GiftVariantPicker variants={variants} selectedId={selectedVariantId} onSelect={setSelectedVariantId} />
  </section>
)}

// Use variant's mockup if selected, else product fallback
const mockupUrl = selectedVariant?.mockup_url ?? product.mockup_url;
const mockupArea = selectedVariant?.mockup_area ?? product.mockup_area;
```

- [ ] **Step 3: Pass variant_id into the add-to-cart payload**

Locate the FormData construction (around line 60-70 of the existing file) and append `fd.append('variant_id', selectedVariantId ?? '');`.

- [ ] **Step 4: Smoke test**

Visit a gift with ≥2 variants — picker renders. Click through variants, preview mockup swaps without re-uploading. Add to cart, verify variant_id is in the cart store.

- [ ] **Step 5: Commit**

```bash
git add app/\(site\)/gift/\[slug\]/page.tsx components/gift/gift-product-page.tsx
git commit -m "Customer gift page: variant picker + variant-aware preview"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 19: Retention notice component + placement

**Files:**
- Create: `components/gift/gift-retention-notice.tsx`
- Modify: `components/gift/gift-product-page.tsx`
- Modify: `components/cart/cart-drawer.tsx` (or equivalent — grep for cart UI)
- Modify: `app/(site)/checkout/page.tsx` (or equivalent)

- [ ] **Step 1: Component**

```tsx
export function GiftRetentionNotice({ days = 30 }: { days?: number }) {
  return (
    <div className="rounded border-2 border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
      <strong>We delete your files {days} days after ordering.</strong> Your uploaded photo and the 300 DPI print file are removed {days} days after checkout. We keep only a watermarked preview so you can still see your order in your account history. If you need a reprint, please place a new order before then.
    </div>
  );
}
```

- [ ] **Step 2: Render inline above "Add to cart" on gift page**

In `gift-product-page.tsx`, just above the submit button:
```tsx
<GiftRetentionNotice days={product.source_retention_days ?? 30} />
```

- [ ] **Step 3: One-liner in cart drawer + checkout review**

Short version: "Uploaded images delete 30 days after order — [learn more](/legal/privacy#gift-retention)".

- [ ] **Step 4: Smoke test + commit**

```bash
npm run build
git add components/gift/gift-retention-notice.tsx components/gift/gift-product-page.tsx components/cart/ app/\(site\)/checkout/
git commit -m "Gift retention notice: product page + cart + checkout"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 6 — Staff production queue

### Task 20: `/admin/gifts/orders` queue page

**Files:**
- Create: `app/admin/gifts/orders/page.tsx`
- Create: `app/admin/gifts/orders/actions.ts`

- [ ] **Step 1: Data fetch + render**

```tsx
import { createClient } from '@/lib/supabase/server';
import { advanceStatus, saveAdminNotes } from './actions';
import { formatSGD } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminGiftOrdersPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const sb = createClient();
  let q = sb.from('gift_order_items').select(`
    id, production_status, admin_notes, created_at, variant_name_snapshot,
    source_purged_at, production_purged_at,
    order:orders!inner(order_number, customer_email, customer_name, created_at, shipping_name, shipping_address_1, shipping_city, shipping_postal_code),
    product:gift_products(name, slug, source_retention_days),
    source:gift_assets!source_asset_id(bucket, path),
    production:gift_assets!production_asset_id(bucket, path),
    production_pdf:gift_assets!production_pdf_id(bucket, path)
  `).order('created_at', { ascending: false }).limit(200);
  if (searchParams.status) q = q.eq('production_status', searchParams.status);
  const { data: items } = await q;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-black">Gift production queue</h1>
      {/* Filter chips */}
      <div className="mb-4 flex gap-2 text-xs">
        {['all','pending','processing','ready'].map(s => (
          <a key={s} href={s==='all' ? '/admin/gifts/orders' : `/admin/gifts/orders?status=${s}`}
             className="rounded border-2 border-ink px-3 py-1">{s}</a>
        ))}
      </div>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-neutral-100"><tr>
          <th className="border-b p-2 text-left">Order</th>
          <th className="border-b p-2 text-left">Customer</th>
          <th className="border-b p-2 text-left">Product</th>
          <th className="border-b p-2 text-left">Downloads</th>
          <th className="border-b p-2 text-left">Status</th>
          <th className="border-b p-2 text-left">Expires</th>
        </tr></thead>
        <tbody>{(items ?? []).map((it: any) => {
          const expiresAt = new Date(new Date(it.order.created_at).getTime() + (it.product.source_retention_days ?? 30) * 86400000);
          return (
            <tr key={it.id}>
              <td className="border-b p-2 font-mono text-xs">#{it.order.order_number}</td>
              <td className="border-b p-2 text-xs">{it.order.shipping_name}<br/>{it.order.customer_email}</td>
              <td className="border-b p-2 text-xs">{it.product.name}{it.variant_name_snapshot ? ` · ${it.variant_name_snapshot}` : ''}</td>
              <td className="border-b p-2 text-xs">
                {!it.source_purged_at && it.source?.path && <a href={`/api/admin/gift-download?bucket=${it.source.bucket}&path=${encodeURIComponent(it.source.path)}`} className="mr-2 underline">src</a>}
                {!it.production_purged_at && it.production?.path && <a href={`/api/admin/gift-download?bucket=${it.production.bucket}&path=${encodeURIComponent(it.production.path)}`} className="mr-2 underline">PNG</a>}
                {!it.production_purged_at && it.production_pdf?.path && <a href={`/api/admin/gift-download?bucket=${it.production_pdf.bucket}&path=${encodeURIComponent(it.production_pdf.path)}`} className="underline">PDF</a>}
              </td>
              <td className="border-b p-2 text-xs">
                <form action={advanceStatus}>
                  <input type="hidden" name="id" value={it.id} />
                  <select name="status" defaultValue={it.production_status} className="border p-1">
                    <option>pending</option><option>processing</option><option>ready</option>
                  </select>
                  <button className="ml-1 rounded border border-ink px-1">save</button>
                </form>
              </td>
              <td className="border-b p-2 text-xs">{expiresAt.toISOString().slice(0,10)}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Actions**

```ts
// app/admin/gifts/orders/actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
export async function advanceStatus(form: FormData) {
  const sb = createClient();
  await sb.from('gift_order_items').update({ production_status: String(form.get('status')) }).eq('id', String(form.get('id')));
  revalidatePath('/admin/gifts/orders');
}
```

- [ ] **Step 3: Signed download route**

Create `app/api/admin/gift-download/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!prof || !['admin','staff'].includes(prof.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const u = new URL(req.url);
  const bucket = u.searchParams.get('bucket')!;
  const path = u.searchParams.get('path')!;
  const { data } = await sb.storage.from(bucket).createSignedUrl(path, 60);
  if (!data?.signedUrl) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
```

- [ ] **Step 4: Smoke test**

With a known gift order, verify the page renders, status flip works, and download redirects to a live signed URL.

- [ ] **Step 5: Commit**

```bash
git add app/admin/gifts/orders/ app/api/admin/gift-download/
git commit -m "Staff gift production queue at /admin/gifts/orders"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 7 — Retention cron

### Task 21: Cron route

**Files:**
- Create: `app/api/cron/gift-purge/route.ts`

- [ ] **Step 1: Route handler**

```ts
import { NextResponse } from 'next/server';
import { purgeEligible } from '@/lib/gifts/retention';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await purgeEligible();
  return NextResponse.json(result);
}
```

- [ ] **Step 2: vercel.json crons**

Add to `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/gift-purge", "schedule": "0 19 * * *" }
  ]
}
```
(19:00 UTC = 03:00 SGT)

- [ ] **Step 3: Add `CRON_SECRET` to env**

Add to `.env.local` (generate a random string). In Vercel dashboard, add the same value for production.

- [ ] **Step 4: Local test**

Run: `npm run dev`. In another terminal:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/gift-purge
```
Expected: JSON `{ sourcesDeleted: 0, productionDeleted: 0, errors: [] }` on a fresh install.

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/gift-purge/ vercel.json
git commit -m "Daily gift purge cron at 03:00 SGT"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 22: Privacy page section

**Files:**
- Modify: `app/(site)/legal/privacy/page.tsx` (or create if not present — grep `privacy`)

- [ ] **Step 1: Add a `#gift-retention` section**

Copy the full retention paragraph from the spec (Section 7.3). Use the existing page's heading style.

- [ ] **Step 2: Commit**

```bash
git add app/\(site\)/legal/
git commit -m "Legal: gift retention section on privacy page"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 8 — Bundles data model

### Task 23: Migration 0037 — `bundle_gift_items` table

**Files:**
- Create: `supabase/migrations/0037_bundle_gift_items.sql`
- Create: `scripts/apply-migration-0037.mjs`

- [ ] **Step 1: Migration SQL**

```sql
-- 0037_bundle_gift_items.sql
-- Bundle can include gift SKUs alongside existing bundle_products (services).
-- Admin pre-fixes variant / prompt / pipeline / template / qty at bundle
-- creation; customer only uploads a photo per row.

create table if not exists public.bundle_gift_items (
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  gift_product_id uuid not null references public.gift_products(id) on delete restrict,
  variant_id uuid references public.gift_product_variants(id) on delete restrict,
  prompt_id uuid references public.gift_prompts(id) on delete restrict,
  template_id uuid references public.gift_templates(id) on delete restrict,
  pipeline_id uuid references public.gift_pipelines(id) on delete restrict,
  override_qty integer not null default 1,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (bundle_id, gift_product_id)
);

create index if not exists bundle_gift_items_bundle_idx on public.bundle_gift_items(bundle_id);

alter table public.bundle_gift_items enable row level security;

drop policy if exists "bundle_gift_items public read active" on public.bundle_gift_items;
create policy "bundle_gift_items public read active" on public.bundle_gift_items
  for select using (
    exists (select 1 from public.bundles b where b.id = bundle_id and b.status = 'active')
  );

drop policy if exists "bundle_gift_items admin all" on public.bundle_gift_items;
create policy "bundle_gift_items admin all" on public.bundle_gift_items
  for all using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());
```

(The `gift_order_items.bundle_id` column was already added in migration 0035.)

- [ ] **Step 2: Apply + verify + commit**

Run apply script. Verify via information_schema.

```bash
git add supabase/migrations/0037_bundle_gift_items.sql scripts/apply-migration-0037.mjs
git commit -m "Migration 0037: bundle_gift_items table"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 9 — Bundles lib + admin

### Task 24: Extend `lib/data/bundles.ts`

**Files:**
- Modify: `lib/data/bundles.ts`

- [ ] **Step 1: Extend list query to include bundle_gift_items**

In `listBundles` add to the select string:
```ts
bundle_gift_items(
  override_qty,
  gift_product:gift_products(slug, name)
)
```

Compute a `type_badge` ('services' | 'gifts' | 'mixed' | null) on the mapped result based on component presence.

- [ ] **Step 2: Extend detail query**

Same fan-out in `getBundleBySlug`, plus the full variant / prompt / pipeline / template FKs:
```ts
bundle_gift_items(
  override_qty, display_order,
  gift_product:gift_products(id, slug, name, mode, source_retention_days, mockup_url, mockup_area, width_mm, height_mm, bleed_mm, min_source_px),
  variant:gift_product_variants(id, slug, name, features, mockup_url, mockup_area),
  prompt:gift_prompts(id, name, style),
  template:gift_templates(id, name, thumbnail_url, zones_json),
  pipeline:gift_pipelines(id, slug, name, kind)
)
```

Return the array on `BundleDetail` as `giftComponents`.

- [ ] **Step 3: Add `type_badge` to `BundleListItem`**

```ts
type_badge: 'services' | 'gifts' | 'mixed' | null;
```

Derived: if `bundle_products.length > 0 && bundle_gift_items.length === 0` → 'services'; reverse → 'gifts'; both → 'mixed'; neither → null.

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add lib/data/bundles.ts
git commit -m "Bundles data: include bundle_gift_items + compute type_badge"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 25: Admin bundle edit — gift-items panel

**Files:**
- Modify: `app/admin/bundles/[slug]/page.tsx`
- Modify: `app/admin/bundles/actions.ts`
- Create: `components/admin/bundle-gift-items-panel.tsx`

- [ ] **Step 1: Server actions**

```ts
// in app/admin/bundles/actions.ts
export async function addBundleGiftItem(bundleId: string, form: FormData) {
  'use server';
  const sb = createClient();
  const giftProductId = String(form.get('gift_product_id'));
  const { error } = await sb.from('bundle_gift_items').insert({
    bundle_id: bundleId, gift_product_id: giftProductId,
    variant_id: String(form.get('variant_id') ?? '') || null,
    prompt_id: String(form.get('prompt_id') ?? '') || null,
    pipeline_id: String(form.get('pipeline_id') ?? '') || null,
    template_id: String(form.get('template_id') ?? '') || null,
    override_qty: parseInt(String(form.get('override_qty') ?? '1')),
    display_order: parseInt(String(form.get('display_order') ?? '0')),
  });
  if (error) throw error;
  revalidatePath('/admin/bundles');
}

export async function removeBundleGiftItem(bundleId: string, giftProductId: string) {
  'use server';
  const sb = createClient();
  await sb.from('bundle_gift_items').delete().eq('bundle_id', bundleId).eq('gift_product_id', giftProductId);
  revalidatePath('/admin/bundles');
}
```

- [ ] **Step 2: Panel component**

Client component. Dropdown to add a gift SKU (populated from `listGiftProducts()`). When selected, cascade-loads that product's variants / prompts / templates / pipelines and shows pickers. Submit calls `addBundleGiftItem`. Existing rows list with name + variant + qty + Remove button.

- [ ] **Step 3: Render on admin bundle edit page**

Below the existing "Products" panel, add:
```tsx
<BundleGiftItemsPanel bundleId={bundle.id} items={bundleGiftItems} />
```

- [ ] **Step 4: Smoke test**

Edit a bundle → add an LED Base gift SKU with Oak Round variant + Line Art prompt + qty 50. Save. Reload. Verify persisted.

- [ ] **Step 5: Commit**

```bash
git add app/admin/bundles/ components/admin/bundle-gift-items-panel.tsx
git commit -m "Admin bundle edit: gift items panel with pre-fixed variant/style/pipeline"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 10 — Bundles customer pages

### Task 26: Listing — type badges

**Files:**
- Modify: `app/(site)/bundles/page.tsx`

- [ ] **Step 1: Render badge**

```tsx
{b.type_badge === 'gifts' && <span className="rounded bg-pink/10 px-2 py-0.5 text-[10px] font-bold uppercase text-pink">● Gifts</span>}
{b.type_badge === 'mixed' && <span className="rounded bg-yellow-brand px-2 py-0.5 text-[10px] font-bold uppercase text-ink">● Mixed</span>}
```

Position top-right of the card, next to the tagline.

- [ ] **Step 2: Smoke + commit**

```bash
git add app/\(site\)/bundles/page.tsx
git commit -m "Bundles listing: type badges (gifts / mixed)"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 27: Bundle detail — per-gift upload blocks

**Files:**
- Modify: `app/(site)/bundle/[slug]/page.tsx`
- Create: `components/bundle/bundle-gift-upload-block.tsx`
- Create: `components/bundle/bundle-config.tsx` (client wrapper holding uploads state)

- [ ] **Step 1: Per-gift upload block**

Client component that accepts `{ giftComponent }` and renders:
- Drag-drop upload → POSTs to `/api/gifts/upload` (existing or create mirror of the standalone upload action)
- On success, fetches a preview via `/api/gifts/preview` (uses `runPreviewPipeline` under the hood — existing)
- Live preview using `GiftMockupPreview` with the variant's mockup_url + mockup_area
- Shows pre-fixed Style / Variant / Qty as read-only text
- Stores the `source_asset_id` + `preview_asset_id` in parent state via callback

- [ ] **Step 2: Bundle config wrapper**

Parent client component that holds an array of upload states (one per gift component) and disables `Add to cart` until every entry has both `source_asset_id` and `preview_asset_id`.

- [ ] **Step 3: Render on bundle page**

Below the existing services-products list:
```tsx
{bundle.giftComponents && bundle.giftComponents.length > 0 && (
  <section className="mb-6">
    <h2 className="mb-3 text-sm font-bold uppercase">Your photos for this bundle</h2>
    <BundleConfig bundle={bundle} onReady={setAllReady} />
  </section>
)}
<GiftRetentionNotice />
```

Gate Add-to-cart on `allReady`.

- [ ] **Step 4: Cart payload**

On add-to-cart, include a `gift_components` array in the bundle cart line:
```ts
gift_components: bundle.giftComponents.map((g, i) => ({
  gift_product_id: g.gift_product.id,
  variant_id: g.variant?.id ?? null,
  prompt_id: g.prompt?.id ?? null,
  template_id: g.template?.id ?? null,
  pipeline_id: g.pipeline?.id ?? null,
  qty: g.override_qty,
  source_asset_id: uploadStates[i].sourceAssetId,
  preview_asset_id: uploadStates[i].previewAssetId,
}))
```

- [ ] **Step 5: Smoke test**

Bundle with 2 gift SKUs → upload 2 photos → previews render → Add to cart enabled → cart line carries both.

- [ ] **Step 6: Commit**

```bash
git add app/\(site\)/bundle/\[slug\]/ components/bundle/
git commit -m "Bundle detail: per-gift upload blocks with stacked live previews"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 11 — Bundles checkout + staff queue

### Task 28: Checkout fan-out — create gift_order_items

**Files:**
- Modify: `lib/cart-store.ts` or the existing order-creation server action (grep `bundles` in `app/api/` and `lib/`)

- [ ] **Step 1: Locate order-creation code**

Run: `grep -rn "bundle_id" app/ lib/ | grep -v node_modules`

Identify the function that fans `bundle_products` into line items. Add a parallel fan-out for `gift_components`:

```ts
for (const gc of bundleLine.gift_components ?? []) {
  await sb.from('gift_order_items').insert({
    order_id: orderId,
    gift_product_id: gc.gift_product_id,
    variant_id: gc.variant_id,
    prompt_id: gc.prompt_id,
    template_id: gc.template_id,
    pipeline_id: gc.pipeline_id,
    bundle_id: bundleLine.bundle_id,
    qty: gc.qty,
    unit_price_cents: 0,
    line_total_cents: 0,
    source_asset_id: gc.source_asset_id,
    preview_asset_id: gc.preview_asset_id,
    mode: gc.mode_snapshot, // read from the gift product at order time
    variant_name_snapshot: gc.variant_name_snapshot,
    variant_price_snapshot_cents: 0,
    production_status: 'pending',
  });
}
```

- [ ] **Step 2: Trigger production pipeline**

After inserting each row, kick off the production pipeline async (pattern already exists for standalone gifts — grep `runProductionPipeline` in the order-completion handler and mirror it).

- [ ] **Step 3: Smoke test**

End-to-end: bundle with 1 gift SKU → checkout → verify the order has a `gift_order_items` row with the correct `bundle_id`.

- [ ] **Step 4: Commit**

```bash
git add lib/ app/api/
git commit -m "Checkout: fan bundle gift_components into gift_order_items with bundle_id link"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 29: Staff queue — bundle display + filter

**Files:**
- Modify: `app/admin/gifts/orders/page.tsx`

- [ ] **Step 1: Add bundle join**

In the supabase select, include:
```ts
bundle:bundles(id, slug, name)
```

- [ ] **Step 2: Render bundle pill + filter**

On rows with `bundle_id`, prepend "From bundle: **{bundle.name}**" to the Product column.

Add a `?from_bundle=1` filter link at the top that filters to rows where `bundle_id is not null`.

- [ ] **Step 3: Smoke + commit**

```bash
git add app/admin/gifts/orders/page.tsx
git commit -m "Staff queue: show bundle origin + filter for bundle-derived rows"
git push origin claude/jovial-booth-a66fda:main
```

---

## Phase 12 — Email + smoke script

### Task 30: Email template — bundle order confirmation

**Files:**
- Modify: `lib/email.ts` (or wherever bundle order emails are rendered)

- [ ] **Step 1: Add gift-components section**

In the existing bundle order email, after the services-products list, add:

```
Gift components (uploaded photos):
  - Oak Round LED Base × 50 — your uploaded photo
  - Engraved Bottle Opener × 20 — your uploaded photo

We delete your files 30 days after ordering (on {expiry_date}). Download
any previews you want to keep before then. Your order record stays in
your account.
```

Hydrate from the `gift_components` on the order.

- [ ] **Step 2: Send a test email**

Trigger via the existing admin "resend confirmation" action on a real bundle order.

- [ ] **Step 3: Commit**

```bash
git add lib/email.ts
git commit -m "Email: bundle confirmation lists gift components + retention notice"
git push origin claude/jovial-booth-a66fda:main
```

---

### Task 31: End-to-end smoke script

**Files:**
- Create: `scripts/smoke-gifts-and-bundles.mjs`

- [ ] **Step 1: Script**

Exercises:
1. Create a gift pipeline
2. Create a gift product referencing it
3. Create 2 variants on the product
4. Create 2 prompts (line-art + realistic) scoped to that pipeline
5. Read back via public API + verify shape
6. Create a bundle with 1 service + 1 gift (pre-fixed variant)
7. Read the bundle detail + verify `giftComponents` and `type_badge = 'mixed'`
8. Clean up (delete everything it created)

Short script (~150 lines). Run it once to validate the whole stack.

- [ ] **Step 2: Run + commit**

```bash
node scripts/smoke-gifts-and-bundles.mjs
git add scripts/smoke-gifts-and-bundles.mjs
git commit -m "Smoke script: gifts + mixed bundles end-to-end check"
git push origin claude/jovial-booth-a66fda:main
```

---

## Verification gate

Before closing the plan, manually verify the success criteria from BOTH specs:

**Gifts spec:**
- [ ] Admin creates a gift product with 3 variants, each with own mockup + features + price
- [ ] Customer uploads photo, picks Line Art, picks Variant 2, sees live preview on Variant 2's mockup, adds to cart at Variant 2's price
- [ ] Order confirmation email includes the 30-day retention notice + per-order expiry date
- [ ] Staff hits `/admin/gifts/orders`, finds a new order, downloads 300 DPI PNG, marks ready
- [ ] 30 days later (or force-manually), cron deletes source + production; customer's account page still shows watermarked preview

**Bundles spec:**
- [ ] Admin creates "Wedding Welcome Pack" with 100 cards (service) + 50 LED bases (gift, pre-fixed) + 20 photo frames (gift, pre-fixed)
- [ ] Customer visits `/bundle/wedding-welcome-pack`, uploads 2 photos (LED bases + frames), sees both previews, adds to cart at bundle price
- [ ] Staff queue shows 2 gift rows tagged with the bundle name, each with download buttons
- [ ] On day 30, both gift sources + production purge; order history retains watermarked previews

---

## Self-review notes

- **Placeholder scan:** no "TBD", "fill in details", or dangling references.
- **Type consistency:** `GiftPipeline.kind` matches `GiftMode`; `GiftProductVariant.mockup_area` uses the same `{x,y,width,height}` shape as `gift_products.mockup_area`; `purgeEligible` uses `gift_order_items` FK names that match migration 0035.
- **Spec coverage:** every section of both specs maps to at least one task:
  - Gifts §3.1 → Task 1
  - Gifts §3.2 → Task 2
  - Gifts §3.3, 3.4, 3.5 → Task 3
  - Gifts §3.6 → Task 4
  - Gifts seed → Task 5
  - Gifts §4 customer flow → Tasks 17, 18, 19
  - Gifts §5 admin → Tasks 12–16
  - Gifts §6 production → Task 10 (runner resolves pipeline) — unchanged otherwise
  - Gifts §7 retention → Tasks 11, 21, 22
  - Gifts §8 pipeline runner → Task 10
  - Bundles §3.1 → Task 23
  - Bundles §3.2 listing type → Task 24
  - Bundles §3.4 order fan-out → Tasks 23 + 28
  - Bundles §4 admin → Task 25
  - Bundles §5 customer → Tasks 26, 27
  - Bundles §6 staff queue integration → Task 29
  - Bundles §7 pricing → already covered (no schema change; Task 28 writes snapshot = 0)
  - Bundles §8 retention → already covered by gifts cron
- **Scope:** sequential phases; no circular dependencies; bundles tasks (23+) only reference gifts tables created in tasks 1–5.
