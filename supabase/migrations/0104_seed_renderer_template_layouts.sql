-- Seed reference templates for city_map + star_map renderers.
-- Each template ships with zones_json pre-positioned to match the
-- design references provided by the owner; admin can tweak via the
-- gift template editor.
--
-- All inserts guard with NOT EXISTS so re-running on a DB where these
-- already exist is a no-op. is_active=false means customers don't see
-- them in the picker until admin reviews + flips the toggle.
--
-- Templates created (linked to gift_products.slug in parens):
--   City Map — Three Hearts        (city-map-photo-frame)
--   City Map — Three Circles       (city-map-photo-frame)
--   City Map — Map + Photo Strip   (city-map-photo-frame)
--   Star Map — Three Circles       (star-map-photo-frame)
--   Star Map — Sky + Photo Pair    (star-map-photo-frame)
--
-- Already applied to prod via Supabase MCP at the time of authoring;
-- this file is the canonical record so a fresh dev/preview env can
-- reproduce the same starter set.

do $$
declare
  v_city_id uuid;
  v_star_id uuid;
  v_tpl_id uuid;
begin
  select id into v_city_id from public.gift_products where slug = 'city-map-photo-frame';
  select id into v_star_id from public.gift_products where slug = 'star-map-photo-frame';

  -- City Map — Three Hearts
  if not exists (select 1 from public.gift_templates where name = 'City Map — Three Hearts') then
    insert into public.gift_templates (name, group_name, renderer, zones_json, is_active, reference_width_mm, reference_height_mm)
    values (
      'City Map — Three Hearts', 'City Map layouts', 'city_map',
      jsonb_build_array(
        jsonb_build_object('id','city_disk-1','type','render_anchor','anchor_kind','city_disk','label','Map','x_mm',12,'y_mm',18,'width_mm',80,'height_mm',80,'rotation_deg',0),
        jsonb_build_object('id','photo-1','type','image','label','Photo','x_mm',108,'y_mm',38,'width_mm',80,'height_mm',80,'rotation_deg',0,'mask_preset','heart','visible',true),
        jsonb_build_object('id','title','type','text','label','Title','x_mm',20,'y_mm',8,'width_mm',160,'height_mm',8,'rotation_deg',0,'default_text','WHERE IT ALL BEGAN','font_size_mm',6,'font_family','inter','align','center','color','#0a0a0a','font_weight','700','letter_spacing_em',1),
        jsonb_build_object('id','names','type','text','label','Names','x_mm',20,'y_mm',130,'width_mm',160,'height_mm',10,'rotation_deg',0,'default_text','william & wendy','font_size_mm',7,'font_family','caveat','align','center','color','#0a0a0a','font_weight','600'),
        jsonb_build_object('id','city_coords','type','text','label','Coordinates','x_mm',20,'y_mm',150,'width_mm',160,'height_mm',6,'rotation_deg',0,'default_text','','font_size_mm',3.4,'font_family','inter','align','center','color','#666','font_weight','400','letter_spacing_em',0.5),
        jsonb_build_object('id','date','type','text','label','Date','x_mm',20,'y_mm',162,'width_mm',160,'height_mm',6,'rotation_deg',0,'default_text','','font_size_mm',3.4,'font_family','inter','align','center','color','#666','font_weight','400')
      ),
      false, 200, 250
    ) returning id into v_tpl_id;
    if v_city_id is not null then
      insert into public.gift_product_templates (gift_product_id, template_id, display_order) values (v_city_id, v_tpl_id, 0);
    end if;
  end if;

  -- City Map — Three Circles
  if not exists (select 1 from public.gift_templates where name = 'City Map — Three Circles') then
    insert into public.gift_templates (name, group_name, renderer, zones_json, is_active, reference_width_mm, reference_height_mm)
    values (
      'City Map — Three Circles', 'City Map layouts', 'city_map',
      jsonb_build_array(
        jsonb_build_object('id','city_disk-1','type','render_anchor','anchor_kind','city_disk','label','Map 1','x_mm',10,'y_mm',25,'width_mm',60,'height_mm',60,'rotation_deg',0),
        jsonb_build_object('id','city_disk-2','type','render_anchor','anchor_kind','city_disk','label','Map 2','x_mm',70,'y_mm',25,'width_mm',60,'height_mm',60,'rotation_deg',0),
        jsonb_build_object('id','city_disk-3','type','render_anchor','anchor_kind','city_disk','label','Map 3','x_mm',130,'y_mm',25,'width_mm',60,'height_mm',60,'rotation_deg',0),
        jsonb_build_object('id','caption-1','type','text','label','Caption 1','x_mm',10,'y_mm',95,'width_mm',60,'height_mm',8,'rotation_deg',0,'default_text','Met','font_size_mm',5,'font_family','cormorant','align','center','color','#d4af37','font_style','italic','font_weight','600'),
        jsonb_build_object('id','caption-2','type','text','label','Caption 2','x_mm',70,'y_mm',95,'width_mm',60,'height_mm',8,'rotation_deg',0,'default_text','Engaged','font_size_mm',5,'font_family','cormorant','align','center','color','#d4af37','font_style','italic','font_weight','600'),
        jsonb_build_object('id','caption-3','type','text','label','Caption 3','x_mm',130,'y_mm',95,'width_mm',60,'height_mm',8,'rotation_deg',0,'default_text','Married','font_size_mm',5,'font_family','cormorant','align','center','color','#d4af37','font_style','italic','font_weight','600'),
        jsonb_build_object('id','names','type','text','label','Couple names','x_mm',30,'y_mm',8,'width_mm',140,'height_mm',12,'rotation_deg',0,'default_text','Couple names','font_size_mm',8,'font_family','cormorant','align','center','color','#d4af37','font_style','italic','font_weight','600')
      ),
      false, 300, 200
    ) returning id into v_tpl_id;
    if v_city_id is not null then
      insert into public.gift_product_templates (gift_product_id, template_id, display_order) values (v_city_id, v_tpl_id, 1);
    end if;
  end if;

  -- City Map — Map + Photo Strip
  if not exists (select 1 from public.gift_templates where name = 'City Map — Map + Photo Strip') then
    insert into public.gift_templates (name, group_name, renderer, zones_json, is_active, reference_width_mm, reference_height_mm)
    values (
      'City Map — Map + Photo Strip', 'City Map layouts', 'city_map',
      jsonb_build_array(
        jsonb_build_object('id','city_disk-1','type','render_anchor','anchor_kind','city_disk','label','Map','x_mm',50,'y_mm',18,'width_mm',100,'height_mm',100,'rotation_deg',0),
        jsonb_build_object('id','photo-1','type','image','label','Photo 1','x_mm',20,'y_mm',130,'width_mm',40,'height_mm',40,'rotation_deg',-4,'visible',true),
        jsonb_build_object('id','photo-2','type','image','label','Photo 2','x_mm',80,'y_mm',130,'width_mm',40,'height_mm',40,'rotation_deg',0,'visible',true),
        jsonb_build_object('id','photo-3','type','image','label','Photo 3','x_mm',140,'y_mm',130,'width_mm',40,'height_mm',40,'rotation_deg',4,'visible',true),
        jsonb_build_object('id','title','type','text','label','Title','x_mm',20,'y_mm',6,'width_mm',160,'height_mm',10,'rotation_deg',0,'default_text','Where it all Started','font_size_mm',8,'font_family','caveat','align','center','color','#0a0a0a','font_style','italic','font_weight','600'),
        jsonb_build_object('id','names','type','text','label','Names','x_mm',20,'y_mm',178,'width_mm',160,'height_mm',8,'rotation_deg',0,'default_text','Names','font_size_mm',6,'font_family','caveat','align','center','color','#0a0a0a','font_style','italic','font_weight','600'),
        jsonb_build_object('id','meta','type','text','label','Location + date','x_mm',20,'y_mm',188,'width_mm',160,'height_mm',6,'rotation_deg',0,'default_text','','font_size_mm',3,'font_family','inter','align','center','color','#666')
      ),
      false, 200, 250
    ) returning id into v_tpl_id;
    if v_city_id is not null then
      insert into public.gift_product_templates (gift_product_id, template_id, display_order) values (v_city_id, v_tpl_id, 2);
    end if;
  end if;

  -- Star Map — Three Circles
  if not exists (select 1 from public.gift_templates where name = 'Star Map — Three Circles') then
    insert into public.gift_templates (name, group_name, renderer, zones_json, is_active, reference_width_mm, reference_height_mm)
    values (
      'Star Map — Three Circles', 'Star Map layouts', 'star_map',
      jsonb_build_array(
        jsonb_build_object('id','star_disk-1','type','render_anchor','anchor_kind','star_disk','label','Sky 1','x_mm',10,'y_mm',25,'width_mm',60,'height_mm',60,'rotation_deg',0),
        jsonb_build_object('id','star_disk-2','type','render_anchor','anchor_kind','star_disk','label','Sky 2','x_mm',70,'y_mm',25,'width_mm',60,'height_mm',60,'rotation_deg',0),
        jsonb_build_object('id','star_disk-3','type','render_anchor','anchor_kind','star_disk','label','Sky 3','x_mm',130,'y_mm',25,'width_mm',60,'height_mm',60,'rotation_deg',0),
        jsonb_build_object('id','caption-1','type','text','label','Caption 1','x_mm',10,'y_mm',95,'width_mm',60,'height_mm',8,'rotation_deg',0,'default_text','Met','font_size_mm',5,'font_family','cormorant','align','center','color','#d4af37','font_style','italic','font_weight','600'),
        jsonb_build_object('id','caption-2','type','text','label','Caption 2','x_mm',70,'y_mm',95,'width_mm',60,'height_mm',8,'rotation_deg',0,'default_text','Engaged','font_size_mm',5,'font_family','cormorant','align','center','color','#d4af37','font_style','italic','font_weight','600'),
        jsonb_build_object('id','caption-3','type','text','label','Caption 3','x_mm',130,'y_mm',95,'width_mm',60,'height_mm',8,'rotation_deg',0,'default_text','Married','font_size_mm',5,'font_family','cormorant','align','center','color','#d4af37','font_style','italic','font_weight','600'),
        jsonb_build_object('id','star_names','type','text','label','Couple names','x_mm',30,'y_mm',8,'width_mm',140,'height_mm',12,'rotation_deg',0,'default_text','Couple names','font_size_mm',8,'font_family','cormorant','align','center','color','#d4af37','font_style','italic','font_weight','600')
      ),
      false, 300, 200
    ) returning id into v_tpl_id;
    if v_star_id is not null then
      insert into public.gift_product_templates (gift_product_id, template_id, display_order) values (v_star_id, v_tpl_id, 0);
    end if;
  end if;

  -- Star Map — Sky + Photo Pair
  if not exists (select 1 from public.gift_templates where name = 'Star Map — Sky + Photo Pair') then
    insert into public.gift_templates (name, group_name, renderer, zones_json, is_active, reference_width_mm, reference_height_mm)
    values (
      'Star Map — Sky + Photo Pair', 'Star Map layouts', 'star_map',
      jsonb_build_array(
        jsonb_build_object('id','star_disk-1','type','render_anchor','anchor_kind','star_disk','label','Sky','x_mm',12,'y_mm',18,'width_mm',80,'height_mm',80,'rotation_deg',0),
        jsonb_build_object('id','photo-1','type','image','label','Photo','x_mm',108,'y_mm',18,'width_mm',80,'height_mm',80,'rotation_deg',0,'mask_preset','circle','visible',true),
        jsonb_build_object('id','star_tagline','type','text','label','Tagline','x_mm',20,'y_mm',130,'width_mm',160,'height_mm',8,'rotation_deg',0,'default_text','Love as deep as the stars','font_size_mm',5,'font_family','inter','align','center','color','#fff','font_weight','600','letter_spacing_em',0.4),
        jsonb_build_object('id','star_caption','type','text','label','Date · coordinates','x_mm',20,'y_mm',145,'width_mm',160,'height_mm',6,'rotation_deg',0,'default_text','','font_size_mm',3.2,'font_family','inter','align','center','color','#fff')
      ),
      false, 300, 200
    ) returning id into v_tpl_id;
    if v_star_id is not null then
      insert into public.gift_product_templates (gift_product_id, template_id, display_order) values (v_star_id, v_tpl_id, 1);
    end if;
  end if;
end$$;
