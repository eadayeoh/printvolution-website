import 'server-only';
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
 * In-process fallback map used when the DB is unreachable, so we still
 * impose a soft cap and don't hand attackers a "break the rate-limit
 * table and we're unlimited" backdoor. Resets per server boot; survives
 * only warm-function invocations, which is enough to slow bursts.
 */
type MemoryBucket = { attempts: number[] };
const memoryBuckets = new Map<string, MemoryBucket>();

function memoryCheck(key: string, opts: { max: number; windowSeconds: number }): RateLimitResult {
  const now = Date.now();
  const cutoff = now - opts.windowSeconds * 1000;
  const bucket = memoryBuckets.get(key) ?? { attempts: [] };
  bucket.attempts = bucket.attempts.filter((t) => t >= cutoff);
  if (bucket.attempts.length >= opts.max) {
    const oldest = bucket.attempts[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + opts.windowSeconds * 1000 - now) / 1000));
    memoryBuckets.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  bucket.attempts.push(now);
  memoryBuckets.set(key, bucket);
  return { allowed: true, remaining: opts.max - bucket.attempts.length };
}

/**
 * Check if `key` has exceeded `max` attempts in the last `windowSeconds`.
 * If allowed, records a new attempt and returns remaining quota.
 * If blocked, returns retryAfterSeconds without recording.
 *
 * Fails SOFT-CLOSED on DB errors: instead of waving attackers through
 * during a Supabase outage, we fall back to an in-process bucket so
 * the limit is still enforced (at least per-serverless-instance) while
 * logging the underlying error for ops.
 */
export async function checkRateLimit(
  key: string,
  opts: { max: number; windowSeconds: number }
): Promise<RateLimitResult> {
  // Hardening: an "unknown" IP bucket pools every header-less request
  // into one shared counter, leaking rate-limit state between unrelated
  // users (one device hits limit → all unknown-IP devices blocked).
  // Treat any key ending in :unknown as a tighter, separate-per-call
  // window so a request without a real IP doesn't exhaust quota for
  // legitimate users on the same fallback.
  if (key.endsWith(':unknown')) {
    // Tight cap keeps abusers without a routable IP at bay without
    // poisoning the proper per-IP buckets.
    opts = { max: Math.min(opts.max, 3), windowSeconds: opts.windowSeconds };
  }
  try {
    const sb = adminClient();
    // Atomic check+record via Postgres function. Without this the
    // SELECT count → INSERT pair was a TOCTOU window: two concurrent
    // requests could both see `count < max` and both insert, sneaking
    // past the cap. The RPC takes a per-key advisory lock so the two
    // calls serialise.
    const { data, error } = await sb.rpc('try_consume_rate_limit', {
      p_key: key,
      p_max: opts.max,
      p_window_seconds: opts.windowSeconds,
    });

    if (error) {
      console.warn('[rate-limit] DB error, falling back to memory bucket');
      return memoryCheck(key, opts);
    }

    if (data === false) {
      // Need a retryAfter — fetch the oldest entry in window. Best-effort:
      // if the secondary read fails we return a default 60s.
      const sinceIso = new Date(Date.now() - opts.windowSeconds * 1000).toISOString();
      const { data: oldest } = await sb
        .from('rate_limit_attempts')
        .select('created_at')
        .eq('key', key)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: true })
        .limit(1);
      const oldestAt = oldest?.[0]?.created_at;
      const expiresAt = oldestAt
        ? new Date(oldestAt).getTime() + opts.windowSeconds * 1000
        : Date.now() + opts.windowSeconds * 1000;
      const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    return { allowed: true, remaining: Math.max(0, opts.max - 1) };
  } catch (e) {
    console.warn('[rate-limit] unexpected error, falling back to memory bucket');
    return memoryCheck(key, opts);
  }
}

/**
 * Extract the client IP from request headers, trusting only proxy-
 * provided headers (Cloudflare, Vercel), and using the RIGHTMOST
 * x-forwarded-for entry (= the one our edge added). The leftmost entry
 * is client-controlled and trivially spoofable — see SECURITY.md.
 */
export function getClientIp(): string {
  const h = headers();
  // Cloudflare's cf-connecting-ip is the most reliable — it's set by
  // CF edge and can't be spoofed past the CF proxy.
  const cf = h.get('cf-connecting-ip');
  if (cf) return cf.trim();
  // Vercel / most reverse proxies set x-real-ip to the direct remote.
  const xri = h.get('x-real-ip');
  if (xri) return xri.trim();
  // x-forwarded-for: take rightmost entry (proxy-added), not leftmost (spoofable).
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return 'unknown';
}
