-- Allow 'number' as a configurator step type (used by pvc-canvas width/height)
alter table public.product_configurator drop constraint if exists product_configurator_type_check;
alter table public.product_configurator add constraint product_configurator_type_check
  check (type in ('select','swatch','text','qty','number'));
