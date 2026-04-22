-- 0038_gift_modes_meta.sql
-- Admin-managed metadata for processing modes.
--
-- Why a metadata table + keep the existing gift_mode enum:
--   Adding or removing a mode involves a render-pipeline code change
--   (each mode dispatches to a distinct transform path). What the admin
--   realistically needs is to: rename labels, edit descriptions, swap
--   icons, reorder the tiles, and toggle modes on/off without a deploy.
--   All of that is metadata — the enum stays authoritative for the
--   dispatcher.
--
-- To add a new mode outright, a dev adds the enum value + a seed row
-- here + a render strategy case in lib/gifts/pipeline.ts, then admin
-- takes over from there.

create table if not exists public.gift_modes (
  slug          gift_mode primary key,
  label         text not null,
  description   text,
  icon          text,
  display_order int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.touch_gift_modes_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_modes_updated_at on public.gift_modes;
create trigger trg_gift_modes_updated_at before update on public.gift_modes
  for each row execute procedure public.touch_gift_modes_updated_at();

alter table public.gift_modes enable row level security;

drop policy if exists "gift_modes public read active" on public.gift_modes;
create policy "gift_modes public read active" on public.gift_modes
  for select using (is_active);

drop policy if exists "gift_modes admin all" on public.gift_modes;
create policy "gift_modes admin all" on public.gift_modes
  for all using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- Seed the four existing modes with their current tile copy.
insert into public.gift_modes (slug, label, description, icon, display_order)
values
  ('laser',        'Laser',        'AI-stylises the photo for laser engraving (high contrast, line-art output).',      '🔥', 1),
  ('uv',           'UV Print',     'AI-stylises the photo for UV flatbed printing (flat, saturated colours).',          '🎨', 2),
  ('embroidery',   'Embroidery',   'AI-stylises + posterises the photo for embroidery (limited colour palette).',       '🧵', 3),
  ('photo-resize', 'Photo Resize', 'No AI. Customer crops to exact dimensions; system adds bleed automatically.',        '✂️', 4)
on conflict (slug) do nothing;
