-- Migration 0014 dropped the 'anon update own member' policy, but an
-- equivalent 'anon upsert update' policy with identical
-- using(true)/check(true) semantics still lives in 0001b_continue.sql.
-- Drop it too — all legitimate member updates flow through server
-- actions using the service role, which bypass RLS regardless.
drop policy if exists "anon upsert update" on public.members;
drop policy if exists "anon upsert insert" on public.members;
-- Keep a single, explicit insert policy so guest checkout still works.
drop policy if exists "anon insert members" on public.members;
create policy "anon insert members" on public.members
  for insert with check (true);
