-- Renderer-driven templates (city_map, star_map, song_lyrics,
-- spotify_plaque) used to be 100% code-driven — admin saw a flat
-- preview but couldn't change anything. The new renderer_config
-- column is a per-template JSONB blob holding admin's chosen layout
-- + content defaults (title, subtitle, names separator, etc).
-- Schema is per-renderer; readers must tolerate missing fields.
-- Customer-supplied personalisation_notes still override at order
-- time.

alter table public.gift_templates
  add column if not exists renderer_config jsonb not null default '{}'::jsonb;

comment on column public.gift_templates.renderer_config is
'Renderer-specific admin defaults (layout, title text, name separator, etc). Schema is per-renderer; readers must tolerate missing fields. Customer overrides at order time.';
