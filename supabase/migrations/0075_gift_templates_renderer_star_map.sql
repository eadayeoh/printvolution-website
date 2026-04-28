-- supabase/migrations/0075_gift_templates_renderer_star_map.sql
-- Adds 'star_map' to the gift_templates.renderer enum so the
-- star-map-photo-frame product can route to a code-defined renderer that
-- projects the bundled star catalogue around the customer's
-- (lat, lng, date_UTC) and emits a foil-printable SVG (gold-on-navy by
-- default).
--
-- Mirrors the city_map renderer set up in 0071.

alter table public.gift_templates
  drop constraint if exists gift_templates_renderer_check;

alter table public.gift_templates
  add constraint gift_templates_renderer_check
  check (renderer in ('zones', 'song_lyrics', 'city_map', 'star_map'));

comment on column public.gift_templates.renderer is
  'Routes the template to a renderer. zones = standard multi-slot form. song_lyrics = SongLyricsTemplate (spiral lyrics + photo). city_map = CityMapTemplate (OSM-derived foil city map). star_map = StarMapTemplate (foil sky chart for date+location).';

-- Seed the Star Map template + product link, idempotent.
do $$
declare
  v_template_id uuid;
  v_product_id uuid;
begin
  select id into v_product_id from public.gift_products where slug = 'star-map-photo-frame' limit 1;
  if v_product_id is null then
    raise notice 'star-map-photo-frame product not found, skipping template seed';
    return;
  end if;

  select id into v_template_id from public.gift_templates where renderer = 'star_map' limit 1;
  if v_template_id is null then
    insert into public.gift_templates (name, description, renderer, zones_json, is_active, display_order)
    values (
      'Star Map — Foil',
      'Bundled star catalogue projected from (lat, lng, date_UTC) onto a stereographic disk. Footer with names / event / location / tagline. Foil-print ready (gold on navy by default).',
      'star_map',
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
