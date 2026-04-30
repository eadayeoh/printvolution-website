'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';

// Allow-list of values these actions can write. Without this, an attacker
// who got past requireAdmin (e.g. via a compromised staff session) could
// stuff arbitrary strings into a column that downstream code may treat
// as a sentinel ('cancelled', 'refunded', etc.).
const ORDER_STATUSES = new Set([
  'pending', 'paid', 'in_production', 'ready', 'shipped', 'completed', 'cancelled',
]);
const ITEM_PRODUCTION_STATUSES = new Set([
  'queued', 'in_progress', 'qc', 'ready', 'shipped', 'on_hold', 'cancelled',
]);

export async function setOrderStatus(orderId: string, status: string) {
  // CRITICAL: gate at the action level. Staff layout auth is UI-only —
  // server actions can be replayed directly with valid cookies (or even
  // without, if the action identifier leaks) so every mutation needs
  // its own check before touching the service-role client.
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  if (!ORDER_STATUSES.has(status)) return { ok: false, error: 'Invalid status' };
  const sb = createServiceClient();
  const { error } = await sb.from('orders').update({ status }).eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/staff');
  revalidatePath('/admin');
  return { ok: true };
}

export async function setItemProductionStatus(itemId: string, status: string) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  if (!ITEM_PRODUCTION_STATUSES.has(status)) return { ok: false, error: 'Invalid production status' };
  const sb = createServiceClient();
  const { error } = await sb.from('order_items').update({ production_status: status }).eq('id', itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/staff');
  return { ok: true };
}
