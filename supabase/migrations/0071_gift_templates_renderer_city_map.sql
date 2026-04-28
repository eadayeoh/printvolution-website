-- supabase/migrations/0071_gift_templates_renderer_city_map.sql
-- Adds 'city_map' to the gift_templates.renderer enum so the
-- city-map-photo-frame product can route to a code-defined renderer that
-- pulls OSM vector geometry around the customer's coordinates and renders
-- a foil-printable SVG (gold-on-navy by default).
--
-- Mirrors the song_lyrics renderer set up in 0070.

alter table public.gift_templates
  drop constraint if exists gift_templates_renderer_check;

alter table public.gift_templates
  add constraint gift_templates_renderer_check
  check (renderer in ('zones', 'song_lyrics', 'city_map'));

comment on column public.gift_templates.renderer is
  'Routes the template to a renderer. zones = standard multi-slot form. song_lyrics = SongLyricsTemplate (spiral lyrics + photo). city_map = CityMapTemplate (OSM-derived foil city map).';

-- Seed the City Map template + product link, idempotent.
do $$
declare
  v_template_id uuid;
  v_product_id uuid;
begin
  select id into v_product_id from public.gift_products where slug = 'city-map-photo-frame' limit 1;
  if v_product_id is null then
    raise notice 'city-map-photo-frame product not found, skipping template seed';
    return;
  end if;

  select id into v_template_id from public.gift_templates where renderer = 'city_map' limit 1;
  if v_template_id is null then
    insert into public.gift_templates (name, description, renderer, zones_json, is_active, display_order)
    values (
      'City Map — Foil',
      'OSM-derived vector city map around the customer''s coordinates. Footer with names / event / city / tagline. Foil-print ready (gold on navy by default).',
      'city_map',
      '[]'::jsonb,
      true,
      0
    )
    returning id into v_template_id;
  end if;

  insert into public.gift_product_templates (gift_product_id, template_id, display_order)
  values (v_product_id, v_template_id, 0)
  on conflict do nothing;
end $$;
