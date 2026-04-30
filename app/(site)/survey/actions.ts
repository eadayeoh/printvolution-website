'use server';

import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function submitNps(
  token: string,
  score: number,
  comment: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Per-IP rate limit so an attacker can't iterate tokens cheaply.
  const ip = getClientIp();
  const rl = await checkRateLimit(`survey:${ip}`, { max: 10, windowSeconds: 60 });
  if (!rl.allowed) return { ok: false, error: 'Too many submissions. Try again in a minute.' };

  if (typeof score !== 'number' || score < 0 || score > 10 || !Number.isInteger(score)) {
    return { ok: false, error: 'Score must be an integer 0–10.' };
  }
  const cleanComment = comment ? comment.slice(0, 1000) : null;

  const sb = service();
  // First check the row exists + is unanswered, then update with a
  // guard on responded_at so a duplicate submit can't overwrite.
  const { data: existing } = await sb
    .from('nps_responses')
    .select('id, responded_at')
    .eq('token', token)
    .maybeSingle();
  if (!existing) return { ok: false, error: 'Survey not found.' };
  if ((existing as any).responded_at) return { ok: false, error: 'Already submitted.' };

  const { error } = await sb
    .from('nps_responses')
    .update({
      score,
      comment: cleanComment,
      responded_at: new Date().toISOString(),
    })
    .eq('token', token)
    .is('responded_at', null);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
