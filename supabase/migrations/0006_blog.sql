-- Blog posts + WooCommerce/WordPress import support.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content_html text not null default '',
  featured_image_url text,
  author text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_desc text,
  tags text[] not null default '{}',
  -- WordPress/WooCommerce source metadata (for dedup + re-import tracking)
  wp_source_url text,          -- the origin site root, e.g. https://oldsite.com
  wp_post_id bigint,           -- numeric ID from WP (to detect duplicates)
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_idx on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_wp_post_id_idx on public.blog_posts (wp_source_url, wp_post_id);

-- updated_at trigger
create or replace function public.touch_blog_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute procedure public.touch_blog_posts_updated_at();

-- RLS: public can read only published; admin/staff can do anything
alter table public.blog_posts enable row level security;

drop policy if exists "blog public read published" on public.blog_posts;
create policy "blog public read published" on public.blog_posts
  for select using (status = 'published');

drop policy if exists "blog admin all" on public.blog_posts;
create policy "blog admin all" on public.blog_posts
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );

-- Storage bucket for blog images
insert into storage.buckets (id, name, public)
  values ('blog-images', 'blog-images', true)
  on conflict (id) do nothing;

drop policy if exists "blog images public read" on storage.objects;
create policy "blog images public read" on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists "blog images admin write" on storage.objects;
create policy "blog images admin write" on storage.objects
  for all using (
    bucket_id = 'blog-images' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  ) with check (
    bucket_id = 'blog-images' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'staff'))
  );
