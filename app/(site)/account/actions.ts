'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/auth/require-admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Rate-limited login + signup.
 *
 * Two keys per action — an IP key (stops one attacker spraying many
 * emails) and an email key (stops credential-stuffing a single account
 * from a botnet of IPs). Both must pass; either tripping blocks.
 */

const LOGIN_IP_WINDOW = 600;  // 10 min
const LOGIN_IP_MAX = 12;
const LOGIN_EMAIL_WINDOW = 900;  // 15 min
const LOGIN_EMAIL_MAX = 6;

const SIGNUP_IP_WINDOW = 3600;  // 1 h
const SIGNUP_IP_MAX = 6;

export async function loginWithPassword(input: { email: string; password: string }) {
  const email = (input.email ?? '').trim().toLowerCase();
  const password = input.password ?? '';
  if (!email || !password) return { ok: false as const, error: 'Email and password required' };
  if (email.length > 200 || password.length > 200) {
    return { ok: false as const, error: 'Invalid input' };
  }

  const ip = getClientIp();
  const ipRl = await checkRateLimit(`login-ip:${ip}`, { max: LOGIN_IP_MAX, windowSeconds: LOGIN_IP_WINDOW });
  if (!ipRl.allowed) {
    return { ok: false as const, error: `Too many attempts. Try again in ${ipRl.retryAfterSeconds}s.` };
  }
  const emailRl = await checkRateLimit(`login-email:${email}`, { max: LOGIN_EMAIL_MAX, windowSeconds: LOGIN_EMAIL_WINDOW });
  if (!emailRl.allowed) {
    // Intentionally vague — don't confirm the email exists.
    return { ok: false as const, error: 'Too many attempts for this account. Try again later.' };
  }

  const sb = createClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    // Generic message — don't leak whether the account exists.
    return { ok: false as const, error: 'Invalid email or password' };
  }
  return { ok: true as const };
}

export async function signUpWithPassword(input: { email: string; password: string; name?: string | null }) {
  const email = (input.email ?? '').trim().toLowerCase();
  const password = input.password ?? '';
  const name = (input.name ?? '').trim().slice(0, 100) || null;

  if (!email || !password) return { ok: false as const, error: 'Email and password required' };
  if (password.length < 8) return { ok: false as const, error: 'Password must be at least 8 characters' };
  if (password.length > 200) return { ok: false as const, error: 'Password too long' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false as const, error: 'Invalid email' };

  const ip = getClientIp();
  const rl = await checkRateLimit(`signup-ip:${ip}`, { max: SIGNUP_IP_MAX, windowSeconds: SIGNUP_IP_WINDOW });
  if (!rl.allowed) {
    return { ok: false as const, error: `Too many signups. Try again in ${rl.retryAfterSeconds}s.` };
  }

  const sb = createClient();
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { data: name ? { full_name: name } : undefined },
  });
  if (error) {
    // Generic message — don't confirm whether the email is registered.
    return { ok: false as const, error: 'Could not create account' };
  }
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Signed-in profile management
// ---------------------------------------------------------------------------

/**
 * Update the logged-in user's display profile. Writes to public.profiles
 * (auth-linked) and mirrors name/phone onto public.members (email-keyed
 * loyalty record) so the two stay in sync.
 *
 * RLS on public.profiles allows `auth.uid() = id` updates for non-
 * sensitive fields (name, phone). Role is never updated through this
 * action — it's locked down server-side.
 */
export async function updateMyProfile(input: { name: string; phone: string }) {
  const name = (input.name ?? '').trim().slice(0, 100);
  const phone = (input.phone ?? '').trim().slice(0, 30);
  if (!name) return { ok: false as const, error: 'Name is required' };

  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };

  // Update profile under user's own session (RLS-enforced).
  const { error: profErr } = await sb
    .from('profiles')
    .update({ name: name || null, phone: phone || null })
    .eq('id', user.id);
  if (profErr) return { ok: false as const, error: 'Could not save profile' };

  // Mirror name/phone onto members (email match). Service role because
  // members has no user_id column tying it to auth. Points/tier are
  // guarded by the DB trigger.
  if (user.email) {
    const svc = createServiceClient();
    await svc
      .from('members')
      .update({ name: name || null, phone: phone || null })
      .eq('email', user.email);
  }

  revalidatePath('/account');
  revalidatePath('/account/profile');
  return { ok: true as const };
}

/**
 * Change the logged-in user's password. Supabase requires the user to
 * be authenticated for this action, and re-verifies the current
 * password by re-signing them in before calling updateUser(). If
 * re-auth fails we return a generic error and do NOT attempt the
 * password change.
 *
 * Rate-limited per user to slow password-reset abuse from a session
 * whose cookie has been lifted.
 */
export async function changeMyPassword(input: { currentPassword: string; newPassword: string }) {
  const current = input.currentPassword ?? '';
  const next = input.newPassword ?? '';
  if (!current || !next) return { ok: false as const, error: 'Both passwords required' };
  if (next.length < 8) return { ok: false as const, error: 'New password must be at least 8 characters' };
  if (next.length > 200) return { ok: false as const, error: 'Password too long' };
  if (next === current) return { ok: false as const, error: 'New password must differ from current' };

  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !user.email) return { ok: false as const, error: 'Not signed in' };

  const rl = await checkRateLimit(`password-change:${user.id}`, { max: 5, windowSeconds: 900 });
  if (!rl.allowed) {
    return { ok: false as const, error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` };
  }

  // Re-verify identity with the current password. Supabase's
  // signInWithPassword on an already-signed-in client refreshes the
  // session if the password matches and throws otherwise.
  const { error: reAuthErr } = await sb.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (reAuthErr) {
    return { ok: false as const, error: 'Current password is incorrect' };
  }

  const { error: updErr } = await sb.auth.updateUser({ password: next });
  if (updErr) {
    return { ok: false as const, error: 'Could not update password' };
  }
  return { ok: true as const };
}
