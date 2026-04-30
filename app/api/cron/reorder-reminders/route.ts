import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-auth';
import { sendEmail, reorderReminderEmail } from '@/lib/email';
import { reportError } from '@/lib/observability';
import { siteOrigin } from '@/lib/site';
import { serviceClient } from '@/lib/gifts/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = serviceClient();
  const nowIso = new Date().toISOString();

  // Find orders whose reminder window has come due. We cap the batch
  // at 500 so a backlog from a paused cron doesn't time out.
  const { data: due, error } = await sb
    .from('orders')
    .select('id, order_number, customer_name, email, created_at, reorder_remind_days')
    .lte('next_reorder_remind_at', nowIso)
    .not('reorder_remind_days', 'is', null)
    .limit(500);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const o of (due ?? []) as any[]) {
    const daysAgo = Math.max(
      1,
      Math.round((Date.now() - new Date(o.created_at).getTime()) / (24 * 60 * 60 * 1000)),
    );
    try {
      const { subject, html } = reorderReminderEmail({
        order_number: o.order_number,
        customer_name: o.customer_name ?? 'there',
        daysAgo,
        reorderUrl: `${siteOrigin()}/account?reorder=${encodeURIComponent(o.id)}`,
      });
      const r = await sendEmail({ to: o.email, subject, html });
      if (r.ok) sent++; else failed++;
      // Clear the reminder so we don't loop the same row daily.
      // Customer can re-enable at their next checkout.
      await sb
        .from('orders')
        .update({
          next_reorder_remind_at: null,
          reorder_reminded_count: ((o as any).reorder_reminded_count ?? 0) + 1,
        })
        .eq('id', o.id);
    } catch (e: any) {
      failed++;
      reportError(e, { route: 'cron.reorder-reminders', order_id: o.id });
    }
  }

  return NextResponse.json({ ok: true, sent, failed, considered: due?.length ?? 0 });
}
