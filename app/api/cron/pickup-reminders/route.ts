import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-auth';
import { sendEmail, pickupReadyReminderEmail } from '@/lib/email';
import { reportError } from '@/lib/observability';
import { serviceClient } from '@/lib/gifts/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = serviceClient();
  // 48 hours ago — orders ready since before this need a nudge.
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: due, error } = await sb
    .from('orders')
    .select('id, order_number, customer_name, email')
    .eq('status', 'ready')
    .eq('delivery_method', 'pickup')
    .is('ready_reminded_at', null)
    .lte('updated_at', cutoff)
    .limit(500);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const o of (due ?? []) as any[]) {
    try {
      const { subject, html } = pickupReadyReminderEmail({
        order_number: o.order_number,
        customer_name: o.customer_name ?? 'there',
      });
      const r = await sendEmail({ to: o.email, subject, html });
      if (r.ok) sent++; else failed++;
      await sb
        .from('orders')
        .update({ ready_reminded_at: new Date().toISOString() })
        .eq('id', o.id);
    } catch (e: any) {
      failed++;
      reportError(e, { route: 'cron.pickup-reminders', order_id: o.id });
    }
  }

  return NextResponse.json({ ok: true, sent, failed, considered: due?.length ?? 0 });
}
