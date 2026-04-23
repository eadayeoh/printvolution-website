-- 0048_gift_order_items_production_files.sql
-- Multi-file production output for dual-mode templates.
--
-- A template whose zones span two modes (e.g. UV photo panel + laser
-- engraved border text) fans out at fulfilment — one production file
-- per mode, because each file goes to a different machine. The
-- existing production_asset_id / production_pdf_id columns only hold
-- ONE PNG/PDF pair; use this jsonb array for the dual-mode case.
--
-- Shape (one element per distinct mode used by the template):
--   [
--     { "mode": "uv",    "png_path": "prod-/...",  "pdf_path": "prod-/...",  "status": "ready" },
--     { "mode": "laser", "png_path": "prod-/...", "pdf_path": "prod-/...", "status": "ready" }
--   ]
--
-- Empty array → single-file production (the existing flow).

alter table public.gift_order_items
  add column if not exists production_files jsonb not null default '[]'::jsonb;

comment on column public.gift_order_items.production_files is
  'Fan-out production outputs for dual-mode templates. One element per distinct mode. Empty array means the single-file path (production_asset_id / production_pdf_id) is authoritative.';
