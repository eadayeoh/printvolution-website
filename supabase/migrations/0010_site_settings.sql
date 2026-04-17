-- Site-wide settings (singleton row) — header logo, favicon, contact, etc.
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  logo_url text,
  logo_width_px integer,
  favicon_url text,
  brand_text text,                 -- fallback text shown if no logo
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, brand_text)
  values (1, 'Printvolution')
  on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site_settings public read" on public.site_settings;
create policy "site_settings public read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings admin write" on public.site_settings;
create policy "site_settings admin write" on public.site_settings
  for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
