-- Create a public bucket for product/bundle images uploaded from admin.
-- Public = files are served over CDN without auth; upload requires service role.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read policy so <img src="..."> works without auth
do $$ begin
  drop policy if exists "public read product images" on storage.objects;
  create policy "public read product images"
    on storage.objects for select
    using (bucket_id = 'product-images');
exception when others then
  raise notice 'Storage policy: %', sqlerrm;
end $$;
