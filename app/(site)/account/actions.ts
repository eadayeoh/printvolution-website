'use server';

import { createClient } from '@/lib/supabase/server';
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
