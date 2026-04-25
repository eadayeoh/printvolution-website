-- Allow admin to gate customer-facing colour pickers per template.
--
-- When false (default), the customer cannot recolour anything — text
-- zones use their admin-set z.color, calendar zones use admin-set
-- grid/header colours, the foreground PNG renders untinted. Set to
-- true to expose the Theme color + per-zone colour pickers in the
-- "Fill the template" form.
--
-- Default false so existing templates don't suddenly grow customer
-- pickers. Admin opts in per template.

alter table public.gift_templates
  add column if not exists customer_can_recolor boolean not null default false;

comment on column public.gift_templates.customer_can_recolor is
  'When true, customer-facing template form exposes colour pickers (foreground theme, per-text-zone, per-calendar-zone). When false (default), the template renders entirely in admin-set colours.';
