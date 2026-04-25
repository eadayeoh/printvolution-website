-- Allow admin to gate the customer-facing font picker per template.
-- Sibling to customer_can_recolor — admin can opt in to colour
-- pickers, font pickers, both, or neither.

alter table public.gift_templates
  add column if not exists customer_can_change_font boolean not null default false;

comment on column public.gift_templates.customer_can_change_font is
  'When true, customer-facing template form exposes a font-family dropdown next to each text zone. When false (default), text zones use the admin-set font_family.';
