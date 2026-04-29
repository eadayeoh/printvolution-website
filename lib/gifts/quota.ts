import 'server-only';
import { serviceClient } from '@/lib/gifts/storage';
export type { QuotaState } from './quota-shared';
import type { QuotaState } from './quota-shared';

export const ANON_LIMIT = 3;
export const USER_LIMIT = 8;
const IP_HARD_CEILING = 15;
const WINDOW_DAYS = 7;

function windowStartIso(): string {
  return new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Check if the customer can run another AI gift generation. Reads
 * gift_generation_usage rows in the last 7 days.
 *
 * Signed-in: cap = 8/week, keyed by user_id.
 * Anon: cap = 3/week, keyed by anon_session_id (cookie). An IP-level
 * hard ceiling (15/week) catches incognito/cookie-cycling attackers.
 */
export async function checkGiftGenerationQuota(opts: {
  userId: string | null;
  anonSessionId: string;
  ip: string;
}): Promise<QuotaState> {
  const sb = serviceClient();
  const since = windowStartIso();

  if (opts.userId) {
    const { count } = await sb
      .from('gift_generation_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', opts.userId)
      .gte('consumed_at', since);
    const used = count ?? 0;
    let reason: string | undefined;
    if (used >= USER_LIMIT) {
      const { data: oldestRow } = await sb
        .from('gift_generation_usage')
        .select('consumed_at')
        .eq('user_id', opts.userId)
        .gte('consumed_at', since)
        .order('consumed_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      const oldestMs = oldestRow?.consumed_at ? new Date(oldestRow.consumed_at).getTime() : null;
      reason = `You've used your ${USER_LIMIT} free generations this week. Resets in ${daysUntilReset(oldestMs)} days.`;
    }
    return {
      allowed: used < USER_LIMIT,
      remaining: Math.max(0, USER_LIMIT - used),
      used,
      limit: USER_LIMIT,
      isSignedIn: true,
      reason,
    };
  }

  // Anon — cookie + IP layered.
  const [anonRes, ipRes] = await Promise.all([
    sb.from('gift_generation_usage')
      .select('id', { count: 'exact', head: true })
      .eq('anon_session_id', opts.anonSessionId)
      .is('user_id', null)
      .gte('consumed_at', since),
    sb.from('gift_generation_usage')
      .select('id', { count: 'exact', head: true })
      .eq('ip', opts.ip)
      .is('user_id', null)
      .gte('consumed_at', since),
  ]);
  const anonUsed = anonRes.count ?? 0;
  const ipUsed = ipRes.count ?? 0;

  if (ipUsed >= IP_HARD_CEILING) {
    return {
      allowed: false,
      remaining: 0,
      used: anonUsed,
      limit: ANON_LIMIT,
      isSignedIn: false,
      reason: 'Daily limit reached for this network. Sign up for an account to unlock more generations.',
    };
  }
  return {
    allowed: anonUsed < ANON_LIMIT,
    remaining: Math.max(0, ANON_LIMIT - anonUsed),
    used: anonUsed,
    limit: ANON_LIMIT,
    isSignedIn: false,
    reason: anonUsed >= ANON_LIMIT
      ? `You've used your ${ANON_LIMIT} free previews. Sign up for ${USER_LIMIT} per week.`
      : undefined,
  };
}

/** Record a successful generation. Call after the AI run + asset
 *  registration so we don't count failures against the quota. */
export async function recordGiftGeneration(opts: {
  userId: string | null;
  anonSessionId: string;
  ip: string;
  sourceAssetId: string;
  previewAssetId: string;
}): Promise<void> {
  const sb = serviceClient();
  await sb.from('gift_generation_usage').insert({
    user_id: opts.userId,
    anon_session_id: opts.userId ? null : opts.anonSessionId,
    ip: opts.ip,
    source_asset_id: opts.sourceAssetId,
    preview_asset_id: opts.previewAssetId,
  });
}

/** Atomic check+record. Two concurrent generations both running this
 *  RPC see consistent counts via a single SQL transaction — neither
 *  can sneak past the cap. Returns true on success. Use this instead
 *  of separate checkGiftGenerationQuota + recordGiftGeneration when
 *  you want race-safe quota enforcement. */
export async function consumeGiftGeneration(opts: {
  userId: string | null;
  anonSessionId: string;
  ip: string;
  sourceAssetId: string;
  previewAssetId: string;
}): Promise<{ ok: boolean }> {
  const sb = serviceClient();
  const { data, error } = await sb.rpc('consume_gift_generation', {
    p_user_id: opts.userId,
    p_anon_session_id: opts.anonSessionId,
    p_ip: opts.ip,
    p_source_asset_id: opts.sourceAssetId,
    p_preview_asset_id: opts.previewAssetId,
    p_user_limit: USER_LIMIT,
    p_anon_limit: ANON_LIMIT,
    p_ip_ceiling: IP_HARD_CEILING,
  });
  if (error) {
    console.error('[quota] consume rpc failed', error.message);
    return { ok: false };
  }
  return { ok: data === true };
}

/** Backfill anon → user. Called from the post-login flow so a user
 *  who burned their 3 anon generations and signs up keeps that history
 *  (8 - 3 = 5 left this week). The RPC enforces auth.uid() = the
 *  target user, so anon callers can never transfer rows onto someone
 *  else's account. */
export async function claimAnonUsageForUser(_userId: string, anonSessionId: string): Promise<void> {
  // Use the user-scoped client (NOT serviceClient) so auth.uid() resolves
  // to the just-signed-in user inside the security-definer RPC.
  const { createClient } = await import('@/lib/supabase/server');
  const sb = createClient();
  await sb.rpc('claim_anon_gift_usage', { p_anon_session_id: anonSessionId });
}

function daysUntilReset(oldestConsumedAtMs: number | null): number {
  // The 7d window slides as old rows fall out. Show days until the
  // OLDEST counted row ages out. NULL = nothing consumed yet → full 7.
  if (oldestConsumedAtMs == null) return WINDOW_DAYS;
  const expiresMs = oldestConsumedAtMs + WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((expiresMs - Date.now()) / (24 * 60 * 60 * 1000)));
}
