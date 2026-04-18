'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { logAdminAction } from '@/lib/auth/admin-audit';

/**
 * Delete one member (loyalty record). Does NOT delete the Supabase
 * auth user — the person can still sign in with that email, they
 * just lose their points history. If the customer asks for a full
 * account deletion we do that from Supabase Auth dashboard for now.
 *
 * Admin-only (not staff) because this is destructive and infrequent.
 */
export async function deleteMember(memberId: string) {
  let actor;
  try {
    const a = await requireAdmin();
    if (a.role !== 'admin') return { ok: false as const, error: 'Admin role required' };
    actor = a.actor;
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Forbidden' };
  }

  const sb = createServiceClient();
  const { data: target } = await sb.from('members').select('email, name').eq('id', memberId).maybeSingle();
  const { error } = await sb.from('members').delete().eq('id', memberId);
  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(actor, {
    action: 'member.delete',
    targetType: 'member',
    targetId: memberId,
    metadata: { email: target?.email, name: target?.name },
  });

  revalidatePath('/admin/members');
  return { ok: true as const };
}

/**
 * Bulk delete. Same rules as single delete, enforced in one round trip
 * and audited as a single 'member.bulk_delete' entry with the id list
 * in metadata.
 */
export async function deleteMembers(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false as const, error: 'No members selected' };
  }
  if (ids.length > 500) {
    return { ok: false as const, error: 'Batch too large — select fewer than 500' };
  }

  let actor;
  try {
    const a = await requireAdmin();
    if (a.role !== 'admin') return { ok: false as const, error: 'Admin role required' };
    actor = a.actor;
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Forbidden' };
  }

  const sb = createServiceClient();
  const { error } = await sb.from('members').delete().in('id', ids);
  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(actor, {
    action: 'member.bulk_delete',
    targetType: 'member',
    targetId: `bulk:${ids.length}`,
    metadata: { count: ids.length, ids: ids.slice(0, 50) },  // cap in audit to keep row small
  });

  revalidatePath('/admin/members');
  return { ok: true as const, deleted: ids.length };
}
