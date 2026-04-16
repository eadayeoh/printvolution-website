'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  if (error) return { ok: false, error: error.message };
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
