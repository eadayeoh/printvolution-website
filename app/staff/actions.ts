'use server';

import { revalidatePath } from 'next/cache';
import { createClient as admClient } from '@supabase/supabase-js';

function adminClient() {
  return admClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function setOrderStatus(orderId: string, status: string) {
  const sb = adminClient();
  const { error } = await sb.from('orders').update({ status }).eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/staff');
  revalidatePath('/admin');
  return { ok: true };
}

export async function setItemProductionStatus(itemId: string, status: string) {
  const sb = adminClient();
  const { error } = await sb.from('order_items').update({ production_status: status }).eq('id', itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/staff');
  return { ok: true };
}
