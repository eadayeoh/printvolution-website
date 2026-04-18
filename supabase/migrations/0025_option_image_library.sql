-- 0025_option_image_library.sql
-- Shared pool of option thumbnails (material swatches, finish samples,
-- etc.) so admins don't have to re-upload the same "260gsm Art Card"
-- image for every product that offers it. Configurator options store
-- a plain image_url in their existing JSONB; this table is the
-- library admins pick from / drop new uploads into.

create table if not exists public.option_image_library (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  label text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists option_image_library_label_idx
  on public.option_image_library (lower(label));

alter table public.option_image_library enable row level security;

drop policy if exists "staff read option images" on public.option_image_library;
create policy "staff read option images" on public.option_image_library
  for select using (public.is_staff_or_admin());

drop policy if exists "staff insert option images" on public.option_image_library;
create policy "staff insert option images" on public.option_image_library
  for insert with check (public.is_staff_or_admin());

drop policy if exists "staff update option images" on public.option_image_library;
create policy "staff update option images" on public.option_image_library
  for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

drop policy if exists "staff delete option images" on public.option_image_library;
create policy "staff delete option images" on public.option_image_library
  for delete using (public.is_staff_or_admin());
