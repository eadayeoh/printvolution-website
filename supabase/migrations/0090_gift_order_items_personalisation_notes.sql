-- 0090_gift_order_items_personalisation_notes.sql
-- Persist the customer's personalisation_notes onto gift_order_items so the
-- production pipeline can dispatch renderer-driven templates (Spotify Plaque,
-- City Map, Star Map, Song Lyrics) using the same parsed inputs the admin
-- SVG download endpoints already consume.

alter table gift_order_items
  add column if not exists personalisation_notes text;

comment on column gift_order_items.personalisation_notes is
  'Cart-line "k:v;k:v" string captured at checkout. Source of truth for renderer-driven templates at production time. NULL on legacy rows.';
