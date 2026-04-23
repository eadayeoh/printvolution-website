-- 0045_gift_order_item_surfaces.sql
-- Per-surface rows on a gift order line. Only used when the customer
-- ordered a surfaces-driven variant (3D bar keychain, mixed-method
-- acrylic wall-art, etc.). One row per surface; pipeline fan-out
-- produces one production file per row.
--
-- `text` and `source_asset_id` are mutually exclusive in practice —
-- text surfaces store the text and no asset; photo surfaces have an
-- asset row and no text. `mode` is the production method resolved at
-- order time (snapshot), independent of the product's current mode so
-- later edits to the product don't retroactively change fulfilment.

create table if not exists public.gift_order_item_surfaces (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.gift_order_items(id) on delete cascade,
  surface_id text not null,                    -- 'front' / 'back' / …
  surface_label text not null,                 -- 'Front' — kept in-row for admin display
  text text,                                   -- for text surfaces
  source_asset_id uuid references public.gift_assets(id) on delete set null,
  production_asset_id uuid references public.gift_assets(id) on delete set null,
  production_pdf_id uuid references public.gift_assets(id) on delete set null,
  mode text not null check (mode in ('laser','uv','embroidery','photo-resize','eco-solvent','digital','uv-dtf')),
  production_status text not null default 'pending'
    check (production_status in ('pending','processing','ready','failed')),
  production_error text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gift_order_item_surfaces_item_idx
  on public.gift_order_item_surfaces(order_item_id);
create index if not exists gift_order_item_surfaces_pending_idx
  on public.gift_order_item_surfaces(production_status)
  where production_status in ('pending','processing');

alter table public.gift_order_item_surfaces enable row level security;
drop policy if exists "gift_order_item_surfaces admin all" on public.gift_order_item_surfaces;
create policy "gift_order_item_surfaces admin all"
  on public.gift_order_item_surfaces
  for all to authenticated
  using (true) with check (true);

comment on table public.gift_order_item_surfaces is
  'One row per surface on a surfaces-driven gift order line. Each row gets its own production pipeline run using its `mode`.';
