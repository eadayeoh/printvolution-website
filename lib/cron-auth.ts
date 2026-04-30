import { createHash, timingSafeEqual } from 'crypto';

/**
 * Constant-time check for the Vercel cron Bearer token. Any equality
 * test that short-circuits on the first mismatching byte (`===`) leaks
 * the matching prefix length over many requests, which is enough to
 * recover a low-entropy secret. Both inputs are sha256-hashed so the
 * timingSafeEqual call also doesn't leak the secret length via an
 * early-return on length mismatch.
 */
export function verifyCronAuth(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return false;
  const a = createHash('sha256').update(token).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
