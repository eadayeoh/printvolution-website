import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Strict admin guard. Rejects everyone except `profiles.role === 'admin'`.
 *
 * Use this on every /admin server action. Staff are deliberately blocked
 * — they only have business in /staff (order queue, production status).
 * Admin layout auth is a convenience for the UI; this action-level check
 * is the authoritative gate, because actions can be invoked directly
 * (e.g. by replaying a form POST with the right cookies) without going
 * through the layout.
 */
export async function requireAdmin() {
  const sb = createServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin only');
  }
  return {
    sb,
    user,
    role: 'admin' as const,
    // Ready-to-use actor object for admin_audit.
    actor: { id: user.id, email: user.email ?? null, role: 'admin' as const },
  };
}

/**
 * Looser guard for /staff actions. Admin OR staff is allowed.
 * /staff covers operational fulfillment work (queue, production status,
 * order downloads) — both roles share these tasks. Anything that
 * touches money, settings, or the catalog should use the strict
 * `requireAdmin()` instead.
 */
export async function requireAdminOrStaff() {
  const sb = createServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    throw new Error('Admin or staff only');
  }
  const role = profile.role as 'admin' | 'staff';
  return {
    sb,
    user,
    role,
    actor: { id: user.id, email: user.email ?? null, role },
  };
}

/**
 * Service-role Supabase client — bypasses RLS. Call ONLY from inside a
 * server action that has already authenticated via requireAdmin(), or
 * from a server-only flow where user input cannot reach it (e.g.
 * webhooks with their own signature verification).
 *
 * Never import this from a file with "use client" or from any code that
 * can run in the browser — the service-role key must stay on the server.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
