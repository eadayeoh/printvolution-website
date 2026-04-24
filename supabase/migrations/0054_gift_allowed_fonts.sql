-- 0054_gift_allowed_fonts.sql
-- Admin-authored list of fonts a customer can pick from when adding
-- text to a gift product. Empty = hide the font picker (customer gets
-- the default system font). Web-safe Google-Fonts family names.

alter table public.gift_products
  add column if not exists allowed_fonts text[] not null default array[]::text[];

-- Seed a sensible default across every product that doesn't have
-- one set yet, so the customer-facing picker isn't empty on day one.
update public.gift_products
   set allowed_fonts = array['Archivo', 'Fraunces', 'Playfair Display', 'Dancing Script', 'Bebas Neue']
 where array_length(allowed_fonts, 1) is null or array_length(allowed_fonts, 1) = 0;

comment on column public.gift_products.allowed_fonts is
  'Fonts the customer can choose from when adding text. Google Fonts family names. Empty = customer cannot pick a font.';
