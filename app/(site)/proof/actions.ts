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

export async function respondToProof(
  token: string,
  decision: 'approved' | 'rejected',
  note: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (decision !== 'approved' && decision !== 'rejected') {
    return { ok: false, error: 'Invalid decision.' };
  }
  // Per-IP rate limit on token submits — same shape as the survey
  // submit, so an attacker can't spray decisions across stolen tokens.
  const ip = getClientIp();
  const rl = await checkRateLimit(`proof:${ip}`, { max: 10, windowSeconds: 60 });
  if (!rl.allowed) return { ok: false, error: 'Too many submissions. Try again in a minute.' };

  const cleanNote = note ? note.slice(0, 1000) : null;

  const sb = service();
  const { data: existing } = await sb
    .from('gift_order_items')
    .select('id, proof_status')
    .eq('proof_token', token)
    .maybeSingle();
  if (!existing) return { ok: false, error: 'Proof not found.' };
  if ((existing as any).proof_status === 'approved' || (existing as any).proof_status === 'rejected') {
    return { ok: false, error: 'Already responded.' };
  }

  // Guard with proof_status='pending' so a duplicate submit can't
  // overwrite a previously-recorded decision. Match on the token too
  // so we don't accidentally update an unrelated row if status drifted.
  const { error } = await sb
    .from('gift_order_items')
    .update({
      proof_status: decision,
      proof_response_note: cleanNote,
      proof_responded_at: new Date().toISOString(),
    })
    .eq('proof_token', token)
    .eq('proof_status', 'pending');

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
