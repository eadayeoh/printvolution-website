'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = createClient();
  const { data: before } = await supabase
    .from('orders')
    .select('order_number, customer_name, email, status')
    .eq('id', orderId)
    .maybeSingle();

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  if (error) return { ok: false, error: error.message };

  // Fire status email if status actually changed
  if (before && before.status !== status && ['processing', 'ready', 'completed', 'cancelled'].includes(status)) {
    void (async () => {
      try {
        const { sendEmail, orderStatusEmail } = await import('@/lib/email');
        const m = orderStatusEmail(before.order_number as string, before.customer_name as string, status);
        await sendEmail({ to: before.email as string, subject: m.subject, html: m.html });
      } catch (e) {
        console.error('[status email] failed', e);
      }
    })();
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteOrder(orderId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { ok: true };
}
