-- 0086_gift_prompts_applies_to_templates.sql
-- Per-prompt template scoping for the customer-facing "Pick art style"
-- picker. NULL or empty array = the prompt shows for every template
-- (the historical behaviour). When admin picks one or more templates,
-- the prompt only appears on the picker when the customer has the
-- corresponding template selected.

alter table public.gift_prompts
  add column if not exists applies_to_template_ids uuid[];

comment on column public.gift_prompts.applies_to_template_ids is
  'When set, this art-style prompt only appears on the PDP when the customer has selected one of these templates. NULL/empty = applies to all templates on the product.';
