-- 0057_gift_order_items_shape.sql
-- Persist the customer's shape choice + selected template (if any) to
-- each order line. NULL on existing rows — production fan-out treats
-- NULL as rectangle-equivalent so no back-fill is needed.

alter table gift_order_items
  add column if not exists shape_kind text
    check (shape_kind in ('cutout','rectangle','template')),
  add column if not exists shape_template_id uuid
    references gift_templates(id);

comment on column gift_order_items.shape_kind is
  'Customer-picked shape. NULL = legacy line, treated as rectangle.';
comment on column gift_order_items.shape_template_id is
  'Only set when shape_kind = ''template''. References gift_templates.id.';
