'use server';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { claimAnonUsageForUser } from '@/lib/gifts/quota';
import { getAnonSessionId } from '@/lib/gifts/anon-session';

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
  // Record once per email so a single attacker can't spread across
  // emails to bypass. Per-IP is already counted by checkLoginRateLimit.
  await checkRateLimit(`login:email:${email.toLowerCase()}`, { max: 5, windowSeconds: 300 });
  return { ok: true };
}

/**
 * Called after a successful login/signup. Backfills the new user's
 * anon-session gift generations onto their user_id so the weekly cap
 * survives the conversion (anon used 3 → user has 5 left, not 8).
 *
 * Safe to call without an anon session cookie or for users who never
 * generated as anon — in both cases it's a no-op.
 */
export async function claimAnonGiftCreditsAfterLogin(userId: string) {
  const anonId = getAnonSessionId();
  if (!anonId || !userId) return { ok: true };
  try {
    await claimAnonUsageForUser(userId, anonId);
  } catch (e) {
    console.error('[login] anon gift-credit claim failed', e);
  }
  return { ok: true };
}
