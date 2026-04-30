import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/auth/require-admin';
import { roleForEmail } from '@/lib/auth/admin-allowlist';

export const dynamic = 'force-dynamic';

/**
 * Supabase OAuth (Google) callback.
 *
 * Flow:
 *   /login → signInWithOAuth({ provider: 'google', redirectTo: <site>/auth/callback })
 *   Google → /auth/callback?code=<code>
 *   here   → exchange code for session, gate by ADMIN_EMAIL_ROLES,
 *            upsert profile.role, redirect to /admin or /staff
 *
 * Anyone signing in with a Google account that isn't on the allow-
 * list is signed out and bounced back to /login with an error flag.
 * The customer-facing /account/login flow is untouched — those users
 * still use email/password against Supabase Auth directly.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const errParam = url.searchParams.get('error_description') || url.searchParams.get('error');

  if (errParam) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errParam)}`, url));
  }
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url));
  }

  const sb = createClient();
  const { data, error } = await sb.auth.exchangeCodeForSession(code);
  if (error || !data?.session) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error?.message ?? 'auth_failed')}`, url));
  }

  const email = data.session.user.email ?? null;
  const role = roleForEmail(email);
  if (!role) {
    // Sign out the just-issued session so the unauthorised gmail
    // doesn't keep a cookie. Then bounce back to /login with a
    // friendly explanation — no enumeration leak (the message is
    // the same for any non-allow-listed email).
    await sb.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=not_authorized', url));
  }

  // Sync role to the profiles row so requireAdmin() / layout gates
  // pick it up immediately. Use the service client so we're not
  // bound by RLS that ordinarily forbids self-promoting to admin.
  const svc = createServiceClient();
  const userId = data.session.user.id;
  await svc.from('profiles').upsert(
    {
      id: userId,
      role,
      name: data.session.user.user_metadata?.name ?? data.session.user.user_metadata?.full_name ?? null,
    },
    { onConflict: 'id' },
  );

  const dest = role === 'admin' ? '/admin' : '/staff';
  return NextResponse.redirect(new URL(dest, url));
}
