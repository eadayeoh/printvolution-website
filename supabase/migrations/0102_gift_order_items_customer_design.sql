-- Customer-side design edits on /order/[token]:
--
-- design_dirty marks a gift line that the customer touched (text /
-- notes / qty / photo replacement) so admin sees a "re-check before
-- printing" badge. Set true on save, cleared by the admin via
-- rerunGiftProduction or a manual "ack" toggle.
--
-- design_last_edited_at — bookkeeping for "customer touched this gift
-- line on Y" so /admin/gifts/orders can sort recent edits to the top.
--
-- original_source_asset_id snapshots the staff-configured source the
-- first time the customer uploads their own image. Revert restores
-- source_asset_id from this column without re-running the pipeline,
-- so non-AI products (passthrough, local_edge, local_bw) get a free
-- back-and-forth between the original and a customer upload.

alter table public.gift_order_items
  add column if not exists design_dirty boolean not null default false,
  add column if not exists design_last_edited_at timestamptz,
  add column if not exists original_source_asset_id uuid
    references public.gift_assets(id) on delete set null;

create index if not exists gift_order_items_design_dirty_idx
  on public.gift_order_items(design_dirty)
  where design_dirty = true;
