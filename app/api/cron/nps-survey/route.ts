import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-auth';
import { sendEmail, npsSurveyEmail } from '@/lib/email';
import { reportError } from '@/lib/observability';
import { siteOrigin } from '@/lib/site';
import { serviceClient } from '@/lib/gifts/storage';
import { mintToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = serviceClient();

  // Orders completed at least 7 days ago, never surveyed yet. We can't
  // do a NOT EXISTS via PostgREST; pull the candidate list and the
  // already-surveyed ids in two queries and diff in JS.
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: orders }, { data: surveyed }] = await Promise.all([
    sb.from('orders')
      .select('id, order_number, customer_name, email')
      .eq('status', 'completed')
      .lte('updated_at', cutoff)
      .limit(500),
    sb.from('nps_responses').select('order_id'),
  ]);

  const seen = new Set(((surveyed ?? []) as any[]).map((r) => r.order_id));
  const candidates = ((orders ?? []) as any[]).filter((o) => !seen.has(o.id));

  let sent = 0;
  let failed = 0;

  for (const o of candidates) {
    const token = mintToken();
    try {
      const { error: insErr } = await sb
        .from('nps_responses')
        .insert({ order_id: o.id, token });
      if (insErr) {
        // Race or schema issue — skip but record.
        failed++;
        continue;
      }
      const { subject, html } = npsSurveyEmail({
        order_number: o.order_number,
        customer_name: o.customer_name ?? 'there',
        surveyUrl: `${siteOrigin()}/survey/${token}`,
      });
      const r = await sendEmail({ to: o.email, subject, html });
      if (r.ok) sent++; else failed++;
    } catch (e: any) {
      failed++;
      reportError(e, { route: 'cron.nps-survey', order_id: o.id });
    }
  }

  return NextResponse.json({ ok: true, sent, failed, considered: candidates.length });
}
