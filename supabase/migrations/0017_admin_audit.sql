-- Admin audit log — append-only record of privileged actions.
--
-- Every delete / destructive update / role change / payout / price
-- override made by a staff or admin account writes one row. If we ever
-- need to investigate "who deleted that order" or "who changed the
-- price of flyers", this is the paper trail.
--
-- Rules:
--   - No UPDATE or DELETE policy. Only append.
--   - Staff can read their own actions; admin can read everything.
--   - Rows are inserted server-side via the service-role client from
--     inside the admin action, so RLS on insert is closed.
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,                              -- 'admin' | 'staff' at time of action
  action text not null,                         -- 'product.delete', 'order.delete', etc.
  target_type text,                             -- 'product' | 'order' | 'bundle' | 'blog_post'
  target_id text,                               -- stable id (uuid or slug)
  metadata jsonb default '{}'::jsonb,           -- anything else worth preserving (old/new values, reason)
  ip text,                                      -- client IP at the time
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_created on public.admin_audit(created_at desc);
create index if not exists idx_admin_audit_actor on public.admin_audit(actor_id);
create index if not exists idx_admin_audit_action on public.admin_audit(action);

alter table public.admin_audit enable row level security;

drop policy if exists "admin read all audit" on public.admin_audit;
create policy "admin read all audit" on public.admin_audit
  for select using (public.is_admin());

drop policy if exists "staff read own audit" on public.admin_audit;
create policy "staff read own audit" on public.admin_audit
  for select using (public.is_staff_or_admin() and actor_id = auth.uid());

-- Intentionally NO insert/update/delete policy. Writes happen via
-- service role (bypasses RLS). No one can mutate the log from the
-- client, including admins — this is the whole point.
