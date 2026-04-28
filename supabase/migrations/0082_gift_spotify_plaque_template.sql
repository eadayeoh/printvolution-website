-- supabase/migrations/0082_gift_spotify_plaque_template.sql
-- Seed the Spotify Music Plaque renderer template.
--
-- A4 portrait acrylic plaque mimicking the Spotify "now playing" UI:
-- customer photo on top, song title + artist, mock progress bar +
-- transport controls, Spotify logo + scannable code at the bottom.
--
-- Customer pastes any Spotify track URL on the PDP — the track ID is
-- parsed client-side and the official Spotify scannable code is
-- hot-linked from scannables.scdn.co (no API key required).
--
-- A5 sizes scale down from the A4 reference at production time.
--
-- Idempotent.

-- Renderer enum check constraint needs the new slug.
alter table public.gift_templates
  drop constraint if exists gift_templates_renderer_check;

alter table public.gift_templates
  add constraint gift_templates_renderer_check
  check (
    renderer is null
    or renderer in ('zones', 'song_lyrics', 'city_map', 'star_map', 'spotify_plaque')
  );

insert into public.gift_templates (
  name,
  description,
  renderer,
  reference_width_mm,
  reference_height_mm,
  zones_json,
  customer_picker_role,
  customer_swatches,
  mode_override,
  is_active,
  display_order,
  group_name
)
select
  'Spotify Music Plaque',
  'UV-printed acrylic plaque featuring a customer photo, song title + artist, and the official Spotify scannable code lifted from the customer''s pasted Spotify URL. Defaults to A4 portrait; admin can offer A5 / A6 size variants.',
  'spotify_plaque',
  210,        -- A4 width
  297,        -- A4 height
  '[]'::jsonb,
  null,       -- no customer colour picker on this template
  '[]'::jsonb,
  'uv',       -- always UV-print regardless of host product mode
  true,
  0,
  'Music gifts'
where not exists (
  select 1 from public.gift_templates where name = 'Spotify Music Plaque'
);
