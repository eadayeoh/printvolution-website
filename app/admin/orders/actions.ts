'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { logAdminAction } from '@/lib/auth/admin-audit';
import { reportError } from '@/lib/observability';

const ALLOWED_STATUSES = ['pending', 'processing', 'ready', 'shipped', 'completed', 'cancelled'] as const;

export async function updateOrderStatus(
  orderId: string,
  status: string,
  extras: {
    tracking_number?: string;
    tracking_url?: string;
    refund_cents?: number;
    refund_note?: string;
  } = {},
) {
  let actor;
  try { actor = (await requireAdmin()).actor; } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  if (!ALLOWED_STATUSES.includes(status as any)) return { ok: false, error: 'Invalid status' };

  const supabase = createServiceClient();
  const { data: before } = await supabase
    .from('orders')
    .select('order_number, customer_name, email, status, total_cents, payment_method')
    .eq('id', orderId)
    .maybeSingle();

  // Build the update patch, including conditional fields per target status.
  const patch: Record<string, any> = { status };
  if (status === 'shipped') {
    if (!extras.tracking_number) return { ok: false, error: 'Tracking number required to mark shipped' };
    const url = (extras.tracking_url ?? '').trim().slice(0, 500);
    if (url && !/^https?:\/\//i.test(url)) {
      return { ok: false, error: 'Tracking URL must start with http:// or https://' };
    }
    patch.tracking_number = extras.tracking_number.trim().slice(0, 200);
    patch.tracking_url    = url || null;
    patch.shipped_at      = new Date().toISOString();
  }
  let refundIntent: 'tbd' | 'none' | 'partial' | 'full' = 'tbd';
  if (status === 'cancelled') {
    const supplied = Number.isFinite(extras.refund_cents);
    const cents = supplied ? Math.max(0, Math.floor(extras.refund_cents!)) : 0;
    const orderTotal = Number((before as any)?.total_cents ?? 0);
    if (cents > orderTotal) {
      return { ok: false, error: `Refund cannot exceed order total ($${(orderTotal / 100).toFixed(2)}).` };
    }
    refundIntent = !supplied ? 'tbd' : cents === 0 ? 'none' : cents >= orderTotal ? 'full' : 'partial';
    patch.refund_cents = cents;
    patch.refunded_at  = cents > 0 ? new Date().toISOString() : null;
    patch.refund_note  = (extras.refund_note ?? '').trim().slice(0, 500) || null;
    // Sync the payment_status enum so accounting / receipts reflect the
    // refund alongside the cancellation. Partial < total → partially_refunded
    // would be ideal, but the current orders.payment_status enum (migration
    // 0016) only allows 'unpaid'|'pending'|'paid'|'failed'|'refunded'.
    // Map both partial + full to 'refunded' until the enum gains a partial
    // state — better to over-flag than to leave the order looking 'paid'
    // after we've returned money.
    if (cents > 0) patch.payment_status = 'refunded';
  }

  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) {
    reportError(error, { route: 'admin.orders.update_status', order_id: orderId, extras: { to: status } });
    return { ok: false, error: error.message };
  }

  await logAdminAction(actor, {
    action: 'order.status_update',
    targetType: 'order',
    targetId: orderId,
    metadata: {
      from: before?.status,
      to: status,
      ...(status === 'cancelled' ? {
        refund_intent: refundIntent,
        refund_cents: patch.refund_cents,
        refund_note:
          refundIntent === 'tbd'  ? 'cancelled, refund TBD' :
          refundIntent === 'none' ? 'cancelled with no refund issued' :
          refundIntent === 'full' ? 'cancelled with full refund' :
                                    'cancelled with partial refund',
      } : {}),
    },
  });

  if (before && before.status !== status) {
    // Background email — registered with Vercel waitUntil so the function
    // is not torn down before the email actually sends.
    const { waitUntil } = await import('@vercel/functions');
    waitUntil((async () => {
      try {
        const email = await import('@/lib/email');
        let m: { subject: string; html: string } | null = null;
        if (status === 'shipped') {
          m = email.orderShippedEmail({
            order_number: before.order_number as string,
            customer_name: before.customer_name as string,
            tracking_number: patch.tracking_number ?? null,
            tracking_url:    patch.tracking_url ?? null,
          });
        } else if (status === 'cancelled') {
          m = email.orderRefundedEmail({
            order_number: before.order_number as string,
            customer_name: before.customer_name as string,
            refund_cents:  patch.refund_cents,
            payment_method: (before.payment_method as string | null) ?? null,
            refund_note:   patch.refund_note ?? null,
          });
        } else if (['processing', 'ready', 'completed'].includes(status)) {
          m = email.orderStatusEmail(before.order_number as string, before.customer_name as string, status);
        }
        if (m) {
          await email.sendEmail({ to: before.email as string, subject: m.subject, html: m.html });
        }
      } catch (e) {
        console.error('[status email] failed');
        reportError(e, { route: 'admin.orders.update_status', action: 'status_email', order_id: orderId });
      }
    })());
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteOrder(orderId: string) {
  let actor;
  try { actor = (await requireAdmin()).actor; } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const supabase = createServiceClient();
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  await logAdminAction(actor, { action: 'order.delete', targetType: 'order', targetId: orderId });
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { ok: true };
}
