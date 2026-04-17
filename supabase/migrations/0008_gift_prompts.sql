-- ============================================================================
-- Mode-level transformation prompts
-- Each Laser/UV/Embroidery production method can have 1..N prompts
-- (style presets). If 2+ are active for a mode, the customer picks one.
-- Admin attaches a thumbnail to each so customers see what they'll get.
-- ============================================================================

create table if not exists public.gift_prompts (
  id uuid primary key default gen_random_uuid(),
  mode gift_mode not null
    check (mode in ('laser','uv','embroidery')),
  name text not null,
  description text,
  thumbnail_url text,
  transformation_prompt text not null default '',
  negative_prompt text,
  params jsonb not null default '{}'::jsonb,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gift_prompts_mode_active_idx
  on public.gift_prompts(mode, is_active, display_order);

create or replace function public.touch_gift_prompts_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_prompts_updated_at on public.gift_prompts;
create trigger trg_gift_prompts_updated_at before update on public.gift_prompts
  for each row execute procedure public.touch_gift_prompts_updated_at();

-- RLS: public can read active prompts (customer picker). Admin can write.
alter table public.gift_prompts enable row level security;

drop policy if exists "gift_prompts public read active" on public.gift_prompts;
create policy "gift_prompts public read active" on public.gift_prompts
  for select using (is_active);

drop policy if exists "gift_prompts admin all" on public.gift_prompts;
create policy "gift_prompts admin all" on public.gift_prompts
  for all using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- Order lines link to the prompt that was chosen (nullable for
-- photo-resize orders which don't use prompts).
alter table public.gift_order_items
  add column if not exists prompt_id uuid references public.gift_prompts(id) on delete set null;
