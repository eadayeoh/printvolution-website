-- supabase/migrations/0076_gift_star_map_poster.sql
-- Seeds the new star-map-poster gift product (paper-stock A3 print, black
-- ink on white, double-line border) and links it to its own gift_template
-- with renderer='star_map'. The PDP detects the slug and switches the
-- StarMapTemplate to layout='poster'.
--
-- Mirrors the structure of 0075 (star-map-photo-frame) but for a different
-- physical product:
--   - dimensions: A3 portrait (297 × 420 mm)
--   - mode: photo-resize (paper print, not UV/foil)
--   - bleed: 3 mm (poster-print convention)
--
-- Idempotent: safe to re-run.

do $$
declare
  v_existing_slug uuid;
  v_seed_category uuid;
  v_seed_price    integer;
  v_product_id    uuid;
  v_template_id   uuid;
begin
  -- Inherit category + a starter price from the existing star-map-photo-frame
  -- row so the poster lands in the same gift category in the menu builder
  -- without manual admin work. If the photo-frame row is missing for some
  -- reason (fresh DB), fall back to nulls and admins can fill it in.
  select category_id, base_price_cents
    into v_seed_category, v_seed_price
    from public.gift_products
   where slug = 'star-map-photo-frame'
   limit 1;

  -- Insert (or skip if already seeded) the poster product.
  select id into v_existing_slug from public.gift_products where slug = 'star-map-poster' limit 1;
  if v_existing_slug is null then
    insert into public.gift_products (
      slug, name, description, tagline,
      category_id,
      width_mm, height_mm, bleed_mm, safe_zone_mm, min_source_px,
      mode, template_mode,
      base_price_cents, is_active
    ) values (
      'star-map-poster',
      'Star Map Poster',
      'Custom A3 paper-stock star map poster — the exact night sky over your chosen date, time, and location, printed in black ink on premium white paper. Anniversary, wedding, engagement, or birth-date keepsake.',
      'The night you remember, exactly as the sky was.',
      v_seed_category,
      297, 420, 3, 5, 1200,
      'photo-resize', 'none',
      coalesce(v_seed_price, 0),
      true
    )
    returning id into v_product_id;
  else
    v_product_id := v_existing_slug;
  end if;

  -- Seed (or reuse) the poster template. Distinct from the foil-frame's
  -- template so admins can describe each product separately, even though
  -- both share renderer='star_map' and the same code path.
  select id into v_template_id
    from public.gift_templates
   where renderer = 'star_map' and name = 'Star Map — Poster'
   limit 1;

  if v_template_id is null then
    insert into public.gift_templates (name, description, renderer, zones_json, is_active, display_order)
    values (
      'Star Map — Poster',
      'Bundled star catalogue projected from (lat, lng, date_UTC) onto a stereographic disk, rendered black-on-white with a double-line border, em-dash flanked subtitle, and tiny mono caption. Paper print ready.',
      'star_map',
      '[]'::jsonb,
      true,
      1
    )
    returning id into v_template_id;
  end if;

  insert into public.gift_product_templates (gift_product_id, template_id, display_order)
  values (v_product_id, v_template_id, 0)
  on conflict do nothing;
end $$;
