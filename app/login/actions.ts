'use server';

import { claimAnonUsageForUser } from '@/lib/gifts/quota';
import { getAnonSessionId } from '@/lib/gifts/anon-session';

/**
 * Called after a successful customer login/signup. Backfills the new
 * user's anon-session gift generations onto their user_id so the
 * weekly cap survives the conversion (anon used 3 → user has 5 left,
 * not 8).
 *
 * Safe to call without an anon session cookie or for users who never
 * generated as anon — in both cases it's a no-op.
 *
 * Admin/staff sign in via Google OAuth (see app/auth/callback) and
 * never have anon gift quota, so this isn't called from that flow.
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
