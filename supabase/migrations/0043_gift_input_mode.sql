-- 0043_gift_input_mode.sql
-- What kind of customer input this gift product accepts:
--   'photo' → upload a photo (existing behaviour — DEFAULT)
--   'text'  → engrave text, no photo upload
--   'both'  → customer can provide either (reserved for future)
--
-- Drives the customer gift page:
--   'photo' → Upload section (letter A) + optional engraved text
--   'text'  → Engraving text section (letter A), upload section hidden;
--             Add to Cart enables on non-empty text, skips the server
--             preview generation, and records the text + variant +
--             colour on the cart line.
--
-- Example: engraved-necklace-bracelet is text-only (name, date, word)
-- — customers type "ELAINE" and pick a design, no photo ever touches
-- the flow.

alter table public.gift_products
  add column if not exists input_mode text not null default 'photo'
    check (input_mode in ('photo','text','both'));

comment on column public.gift_products.input_mode is
  'What kind of customer input this gift accepts: photo (upload required), text (engrave text, no upload), both (either). Drives the gift page UI.';
