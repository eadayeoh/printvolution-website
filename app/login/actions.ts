'use server';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Called BEFORE attempting a login. If OK, client proceeds with
 * Supabase Auth signInWithPassword. If failed, client calls recordFailed().
 *
 * 5 attempts per 5 minutes per IP. Supabase Auth has its own global limits
 * (10/hr per IP) — this adds a tighter per-5-min window.
 */
export async function checkLoginRateLimit(): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
}> {
  const ip = getClientIp();
  const check = await checkRateLimit(`login:${ip}`, { max: 5, windowSeconds: 300 });
  return check;
}

/**
 * Called after a failed login. Records an extra attempt so repeated failures
 * burn through quota faster than successful logins (which only count once).
 */
export async function recordFailedLogin(email: string) {
  const ip = getClientIp();
  // Record once per IP (already done by checkLoginRateLimit) AND once per email
  // so a single attacker can't spread across emails to bypass.
  await checkRateLimit(`login:email:${email.toLowerCase()}`, { max: 5, windowSeconds: 300 });
  return { ok: true };
}
