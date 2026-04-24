-- 0049_gift_templates_group.sql
-- Optional grouping label for templates. Freeform string; admin types
-- whatever bucket name makes sense ("Wall art", "Necklaces",
-- "Embroidery on tees", etc.). The admin template list groups by this
-- value alphabetically and shows an "Ungrouped" bucket for nulls.
--
-- Not enforced — typos create new groups. For 10-50 templates that's
-- fine; at 500+ templates we'd switch to a proper groups table.

alter table public.gift_templates
  add column if not exists group_name text;

create index if not exists gift_templates_group_idx
  on public.gift_templates(group_name);

comment on column public.gift_templates.group_name is
  'Admin-assigned grouping label shown in the templates list. Null = "Ungrouped".';
