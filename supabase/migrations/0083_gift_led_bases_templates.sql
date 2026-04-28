-- supabase/migrations/0083_gift_led_bases_templates.sql
--
-- Seed four templates on the LED Bases product (/gift/led-bases):
--
--   1. Spotify Music Plaque  — links the existing renderer template
--                               (created in migration 0082) so customers
--                               can pick the Spotify layout when ordering
--                               an LED base.
--   2. Heart Photo Collage   — 6 photos arranged in a heart silhouette
--                               + couple names + date. Zones-based.
--   3. 2×2 Photo Grid        — 4 photos + 1 tagline text zone, tagline
--                               sits across the bottom (e.g. "I Love You").
--   4. 3×3 Photo Grid        — 9 photos + names + date underneath.
--
-- Zone positions are first-pass defaults aimed at A5 portrait
-- (148×210mm with an 8mm safe margin → 132×194 usable). Admin can
-- drag-position them in the gift template editor after deploy.
--
-- Wooden-base engraving is intentionally NOT modelled — only the
-- acrylic face is customisable; the LED base is a fixed product part.
--
-- Idempotent: safe to re-run.

do $$
declare
  v_product_id    uuid;
  v_spotify_id    uuid;
  v_heart_id      uuid;
  v_grid2x2_id    uuid;
  v_grid3x3_id    uuid;
begin
  -- Resolve the LED Bases product. Bail early if it's missing — the
  -- patch-led-bases-content.mjs script seeds it elsewhere and we don't
  -- want this migration creating a half-formed duplicate.
  select id into v_product_id
    from public.gift_products
   where slug = 'led-bases'
   limit 1;

  if v_product_id is null then
    raise notice 'gift_products row "led-bases" not found — skipping LED base template seeding.';
    return;
  end if;

  -- ── 1. Spotify Music Plaque ─────────────────────────────────────────
  -- Pre-existing renderer template (migration 0082). Just link it to
  -- the LED Bases product if it isn't already.
  select id into v_spotify_id
    from public.gift_templates
   where name = 'Spotify Music Plaque'
   limit 1;

  if v_spotify_id is not null then
    insert into public.gift_product_templates (gift_product_id, template_id, display_order)
    values (v_product_id, v_spotify_id, 0)
    on conflict (gift_product_id, template_id) do nothing;
  end if;

  -- ── 2. Heart Photo Collage ──────────────────────────────────────────
  -- Six image zones laid out in a 3-2-1 stagger that approximates a
  -- heart silhouette, plus a names line and a date line below.
  -- All photos get a small border-radius for the soft look.
  select id into v_heart_id
    from public.gift_templates
   where name = 'LED Base — Heart Photo Collage'
   limit 1;

  if v_heart_id is null then
    insert into public.gift_templates (
      name, description, renderer, reference_width_mm, reference_height_mm,
      zones_json, mode_override, is_active, display_order, group_name
    )
    values (
      'LED Base — Heart Photo Collage',
      'Six customer photos arranged in a heart shape, with couple names + a date underneath. UV-printed on the clear acrylic face that slots into the LED base.',
      'zones',
      148, 210,
      jsonb_build_array(
        -- Row 1 (heart bumps + center): 3 photos across the top
        jsonb_build_object('id','photo1','label','Photo 1','type','image','x_mm',12, 'y_mm',20, 'width_mm',38,'height_mm',38,'border_radius_mm',3,'fit_mode','cover'),
        jsonb_build_object('id','photo2','label','Photo 2','type','image','x_mm',55, 'y_mm',20, 'width_mm',38,'height_mm',38,'border_radius_mm',3,'fit_mode','cover'),
        jsonb_build_object('id','photo3','label','Photo 3','type','image','x_mm',98, 'y_mm',20, 'width_mm',38,'height_mm',38,'border_radius_mm',3,'fit_mode','cover'),
        -- Row 2 (heart middle): 2 photos
        jsonb_build_object('id','photo4','label','Photo 4','type','image','x_mm',33, 'y_mm',62, 'width_mm',38,'height_mm',38,'border_radius_mm',3,'fit_mode','cover'),
        jsonb_build_object('id','photo5','label','Photo 5','type','image','x_mm',77, 'y_mm',62, 'width_mm',38,'height_mm',38,'border_radius_mm',3,'fit_mode','cover'),
        -- Row 3 (heart point): 1 photo centered
        jsonb_build_object('id','photo6','label','Photo 6','type','image','x_mm',55, 'y_mm',104,'width_mm',38,'height_mm',38,'border_radius_mm',3,'fit_mode','cover'),
        -- Names line
        jsonb_build_object('id','names','type','text','label','Names','x_mm',10, 'y_mm',152,'width_mm',128,'height_mm',16,'font_family','Great Vibes','font_size_mm',12,'font_weight','400','color','#0a0a0a','default_text','Name & Name','placeholder','Name & Name'),
        -- Date line
        jsonb_build_object('id','date','type','text','label','Date','x_mm',10, 'y_mm',172,'width_mm',128,'height_mm',12,'font_family','Archivo','font_size_mm',7,'font_weight','400','color','#0a0a0a','default_text','01.01.2024','placeholder','DD.MM.YYYY')
      ),
      'uv',
      true, 1, 'LED bases'
    )
    returning id into v_heart_id;
  end if;

  insert into public.gift_product_templates (gift_product_id, template_id, display_order)
  values (v_product_id, v_heart_id, 1)
  on conflict (gift_product_id, template_id) do nothing;

  -- ── 3. 2×2 Photo Grid + tagline ─────────────────────────────────────
  -- Four large square photos in a 2×2 grid + one tagline line at the
  -- bottom (e.g. "I Love You"). 132mm usable width / 2 photos with a
  -- 4mm gutter ⇒ 64mm photos.
  select id into v_grid2x2_id
    from public.gift_templates
   where name = 'LED Base — 2×2 Photo Grid'
   limit 1;

  if v_grid2x2_id is null then
    insert into public.gift_templates (
      name, description, renderer, reference_width_mm, reference_height_mm,
      zones_json, mode_override, is_active, display_order, group_name
    )
    values (
      'LED Base — 2×2 Photo Grid',
      'Four customer photos in a 2×2 grid with a tagline line beneath (default "I Love You" — fully editable). UV-printed on the clear acrylic face.',
      'zones',
      148, 210,
      jsonb_build_array(
        jsonb_build_object('id','photo1','label','Photo 1 (top-left)',    'type','image','x_mm',8,  'y_mm',15, 'width_mm',64,'height_mm',64,'fit_mode','cover'),
        jsonb_build_object('id','photo2','label','Photo 2 (top-right)',   'type','image','x_mm',76, 'y_mm',15, 'width_mm',64,'height_mm',64,'fit_mode','cover'),
        jsonb_build_object('id','photo3','label','Photo 3 (bottom-left)', 'type','image','x_mm',8,  'y_mm',83, 'width_mm',64,'height_mm',64,'fit_mode','cover'),
        jsonb_build_object('id','photo4','label','Photo 4 (bottom-right)','type','image','x_mm',76, 'y_mm',83, 'width_mm',64,'height_mm',64,'fit_mode','cover'),
        jsonb_build_object('id','tagline','type','text','label','Tagline','x_mm',8, 'y_mm',158,'width_mm',132,'height_mm',26,'font_family','Great Vibes','font_size_mm',16,'font_weight','400','color','#0a0a0a','default_text','I Love You','placeholder','I Love You')
      ),
      'uv',
      true, 2, 'LED bases'
    )
    returning id into v_grid2x2_id;
  end if;

  insert into public.gift_product_templates (gift_product_id, template_id, display_order)
  values (v_product_id, v_grid2x2_id, 2)
  on conflict (gift_product_id, template_id) do nothing;

  -- ── 4. 3×3 Photo Grid + names + date ────────────────────────────────
  -- Nine photos. 132mm usable / 3 columns with 3mm gutters ⇒ 42mm photos.
  -- Followed by a names line and a date line.
  select id into v_grid3x3_id
    from public.gift_templates
   where name = 'LED Base — 3×3 Photo Grid'
   limit 1;

  if v_grid3x3_id is null then
    insert into public.gift_templates (
      name, description, renderer, reference_width_mm, reference_height_mm,
      zones_json, mode_override, is_active, display_order, group_name
    )
    values (
      'LED Base — 3×3 Photo Grid',
      'Nine customer photos in a 3×3 grid with a couple names line + a date line beneath. UV-printed on the clear acrylic face.',
      'zones',
      148, 210,
      jsonb_build_array(
        -- Row 1
        jsonb_build_object('id','photo1','label','Photo 1','type','image','x_mm',8,  'y_mm',15, 'width_mm',42,'height_mm',42,'fit_mode','cover'),
        jsonb_build_object('id','photo2','label','Photo 2','type','image','x_mm',53, 'y_mm',15, 'width_mm',42,'height_mm',42,'fit_mode','cover'),
        jsonb_build_object('id','photo3','label','Photo 3','type','image','x_mm',98, 'y_mm',15, 'width_mm',42,'height_mm',42,'fit_mode','cover'),
        -- Row 2
        jsonb_build_object('id','photo4','label','Photo 4','type','image','x_mm',8,  'y_mm',60, 'width_mm',42,'height_mm',42,'fit_mode','cover'),
        jsonb_build_object('id','photo5','label','Photo 5','type','image','x_mm',53, 'y_mm',60, 'width_mm',42,'height_mm',42,'fit_mode','cover'),
        jsonb_build_object('id','photo6','label','Photo 6','type','image','x_mm',98, 'y_mm',60, 'width_mm',42,'height_mm',42,'fit_mode','cover'),
        -- Row 3
        jsonb_build_object('id','photo7','label','Photo 7','type','image','x_mm',8,  'y_mm',105,'width_mm',42,'height_mm',42,'fit_mode','cover'),
        jsonb_build_object('id','photo8','label','Photo 8','type','image','x_mm',53, 'y_mm',105,'width_mm',42,'height_mm',42,'fit_mode','cover'),
        jsonb_build_object('id','photo9','label','Photo 9','type','image','x_mm',98, 'y_mm',105,'width_mm',42,'height_mm',42,'fit_mode','cover'),
        -- Names + date below the grid
        jsonb_build_object('id','names','type','text','label','Names','x_mm',8,  'y_mm',155,'width_mm',132,'height_mm',16,'font_family','Great Vibes','font_size_mm',12,'font_weight','400','color','#0a0a0a','default_text','Name & Name','placeholder','Name & Name'),
        jsonb_build_object('id','date', 'type','text','label','Date', 'x_mm',8,  'y_mm',175,'width_mm',132,'height_mm',12,'font_family','Archivo',    'font_size_mm',7, 'font_weight','400','color','#0a0a0a','default_text','01.01.2024','placeholder','DD.MM.YYYY')
      ),
      'uv',
      true, 3, 'LED bases'
    )
    returning id into v_grid3x3_id;
  end if;

  insert into public.gift_product_templates (gift_product_id, template_id, display_order)
  values (v_product_id, v_grid3x3_id, 3)
  on conflict (gift_product_id, template_id) do nothing;
end $$;
