-- supabase/migrations/0070_gift_templates_renderer.sql
-- Add a `renderer` column to gift_templates so a template row can opt out of
-- the zones-based multi-slot form and route to a code-defined renderer
-- instead. Existing templates default to 'zones' (the only renderer there
-- was). New value 'song_lyrics' marks templates rendered by the
-- SongLyricsTemplate React component (spiral lyrics + centre disc + footer).
--
-- Also seeds a Song Lyrics template row + links it to the
-- song-lyrics-photo-frame product so the PDP can find it the same way as any
-- other template (no more product-slug special-casing in app code).

alter table public.gift_templates
  add column if not exists renderer text not null default 'zones'
  check (renderer in ('zones', 'song_lyrics'));

comment on column public.gift_templates.renderer is
  'Routes the template to a renderer. zones = standard multi-slot form. song_lyrics = SongLyricsTemplate component (spiral lyrics + photo + footer).';

-- Seed the Song Lyrics template + product link, idempotent.
do $$
declare
  v_template_id uuid;
  v_product_id uuid;
begin
  select id into v_product_id from public.gift_products where slug = 'song-lyrics-photo-frame' limit 1;
  if v_product_id is null then
    raise notice 'song-lyrics-photo-frame product not found, skipping template seed';
    return;
  end if;

  -- Reuse an existing song_lyrics template if one was hand-inserted, else create.
  select id into v_template_id from public.gift_templates where renderer = 'song_lyrics' limit 1;
  if v_template_id is null then
    insert into public.gift_templates (name, description, renderer, zones_json, is_active, display_order)
    values (
      'Song Lyrics — Spiral',
      'Lyrics flow on an Archimedean spiral around the centre photo. Title / names / year footer below.',
      'song_lyrics',
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
