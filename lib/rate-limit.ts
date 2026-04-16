/**
 * Server-side rate limiter using Supabase `rate_limit_attempts` table.
 *
 * Usage from a Server Action or route handler:
 *   const check = await checkRateLimit('login:' + ip, { max: 5, windowSeconds: 300 });
 *   if (!check.allowed) return { error: `Try again in ${check.retryAfterSeconds}s` };
 *
 * Only call this from server code — it uses the service role key.
 */

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
};

/**
 * Check if `key` has exceeded `max` attempts in the last `windowSeconds`.
 * If allowed, records a new attempt and returns remaining quota.
 * If blocked, returns retryAfterSeconds without recording.
 *
 * Fails open on DB errors (returns allowed=true) so Supabase outages don't
 * block legitimate traffic.
 */
export async function checkRateLimit(
  key: string,
  opts: { max: number; windowSeconds: number }
): Promise<RateLimitResult> {
  try {
    const sb = adminClient();
    const sinceIso = new Date(Date.now() - opts.windowSeconds * 1000).toISOString();

    const { data, error } = await sb
      .from('rate_limit_attempts')
      .select('created_at')
      .eq('key', key)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Rate limit check failed (fail open):', error.message);
      return { allowed: true, remaining: opts.max };
    }

    const attempts = (data ?? []) as Array<{ created_at: string }>;

    if (attempts.length >= opts.max) {
      const oldest = attempts[0].created_at;
      const expiresAt = new Date(oldest).getTime() + opts.windowSeconds * 1000;
      const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    // Record the attempt
    await sb.from('rate_limit_attempts').insert({ key });
    return { allowed: true, remaining: opts.max - attempts.length - 1 };
  } catch (e) {
    console.warn('Rate limit unexpected error (fail open):', e);
    return { allowed: true, remaining: opts.max };
  }
}

/**
 * Extract the client IP from request headers. Works with Vercel's
 * x-forwarded-for or Cloudflare's cf-connecting-ip.
 */
export function getClientIp(): string {
  const h = headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') ?? h.get('cf-connecting-ip') ?? 'unknown';
}
