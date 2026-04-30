'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin only');
  }
  return sb;
}

export async function advanceStatus(form: FormData) {
  const sb = await requireAdmin();
  const id = String(form.get('id'));
  const status = String(form.get('status'));
  if (!['pending', 'processing', 'ready', 'failed'].includes(status)) {
    throw new Error('invalid status');
  }
  const { error } = await sb.from('gift_order_items').update({ production_status: status }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/gifts/orders');
}

export async function saveNotes(form: FormData) {
  const sb = await requireAdmin();
  const id = String(form.get('id'));
  const notes = String(form.get('notes') ?? '');
  const { error } = await sb.from('gift_order_items').update({ admin_notes: notes }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/gifts/orders');
}
