-- 0039_gift_template_reference_dims.sql
-- Let each template declare the canvas aspect it was designed for.
-- The template editor currently forces aspect-square — which squashes
-- portrait layouts. With these two columns the editor can render the
-- preview at the correct aspect, and the render pipeline can scale
-- zones to any target product dimensions proportionally.
--
-- Both are nullable — a template with no reference dims falls back to
-- the square preview behaviour (existing templates keep working).

alter table public.gift_templates
  add column if not exists reference_width_mm  numeric,
  add column if not exists reference_height_mm numeric;

comment on column public.gift_templates.reference_width_mm  is
  'Intended canvas width (mm) the zones were authored against. Used for preview aspect + scaling zones to different product dims.';
comment on column public.gift_templates.reference_height_mm is
  'Intended canvas height (mm) the zones were authored against. Used for preview aspect + scaling zones to different product dims.';
