-- 0040_gift_modes_extend.sql
-- Extend the processing-mode catalogue with three new production
-- methods, rename the existing ones to the canonical labels the
-- printing team uses, and remove the emoji icons from every row.
--
-- New slugs: eco-solvent, digital, uv-dtf. Each maps to an existing
-- render strategy at pipeline time (no new render code ships with
-- this migration — admin picks an existing pipeline or sets
-- pipeline_id = null and we fall back to photo-resize).

-- 1) Extend the Postgres enum. ADD VALUE must be run outside a
--    transaction, so each statement is idempotent via IF NOT EXISTS.
do $$ begin
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid
                 where t.typname = 'gift_mode' and e.enumlabel = 'eco-solvent') then
    execute 'alter type gift_mode add value ''eco-solvent''';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid
                 where t.typname = 'gift_mode' and e.enumlabel = 'digital') then
    execute 'alter type gift_mode add value ''digital''';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid
                 where t.typname = 'gift_mode' and e.enumlabel = 'uv-dtf') then
    execute 'alter type gift_mode add value ''uv-dtf''';
  end if;
end $$;

-- 2) Relabel existing rows + strip icons (admin didn't want emojis).
update public.gift_modes
   set label = 'Laser Engraving',
       icon  = null
 where slug = 'laser';

update public.gift_modes
   set label = 'UV Printing',
       icon  = null
 where slug = 'uv';

update public.gift_modes
   set icon = null
 where slug in ('embroidery', 'photo-resize');

-- 3) Seed the three new modes.
insert into public.gift_modes (slug, label, description, icon, display_order)
values
  ('eco-solvent', 'Eco Solvent',      'Large-format eco-solvent printing on banner vinyl, poster paper, and adhesive rolls.', null, 5),
  ('digital',     'Digital Printing', 'High-resolution digital press — paper, card, sticker rolls. No AI transform.',        null, 6),
  ('uv-dtf',      'UV DTF',           'UV DTF transfer film for curved and irregular surfaces. Customer uploads artwork.',   null, 7)
on conflict (slug) do update
  set label         = excluded.label,
      description   = excluded.description,
      icon          = excluded.icon,
      display_order = excluded.display_order;
