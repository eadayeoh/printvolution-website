-- 0085_gift_template_allowed_shape_kinds.sql
-- Per-template filter for the customer-facing "Pick your shape" picker.
-- When NULL (default) the picker shows every shape_option configured on
-- the gift_products row (current behaviour). When set, the picker only
-- shows options whose kind is in this list. Lets one product carry
-- templates that work with cutout/rectangle/template-shape and others
-- that only make sense as one of those shapes.
--
-- Stored as text[] (not enum) so adding new kinds later doesn't require
-- ALTER TYPE.

alter table public.gift_templates
  add column if not exists allowed_shape_kinds text[];

comment on column public.gift_templates.allowed_shape_kinds is
  'When set, the Pick-your-shape picker on the PDP shows only the listed kinds (cutout/rectangle/template). NULL = inherit all shape_options from gift_products.';
