'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) throw new Error('Admin only');
  return sb;
}

const Schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens'),
  name: z.string().min(1),
  parent_id: z.string().uuid().nullable().optional(),
  display_order: z.number().int().default(0),
});

export async function createCategory(input: z.input<typeof Schema>) {
  const sb = await requireAdmin();
  const parsed = Schema.parse(input);
  const { data, error } = await sb.from('categories').insert(parsed as any).select('id').single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/categories');
  return { ok: true as const, id: data.id };
}

export async function updateCategory(id: string, input: Partial<z.input<typeof Schema>>) {
  const sb = await requireAdmin();
  const { error } = await sb.from('categories').update(input as any).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/categories');
  return { ok: true as const };
}

export async function deleteCategory(id: string) {
  const sb = await requireAdmin();
  // Check if any products reference this category first
  const { count: pCount } = await sb.from('products').select('id', { count: 'exact', head: true }).or(`category_id.eq.${id},subcategory_id.eq.${id}`);
  const { count: gCount } = await sb.from('gift_products').select('id', { count: 'exact', head: true }).eq('category_id', id);
  const used = (pCount ?? 0) + (gCount ?? 0);
  if (used > 0) return { ok: false as const, error: `Cannot delete — ${used} product(s) use this category. Move them first.` };

  const { error } = await sb.from('categories').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/categories');
  return { ok: true as const };
}
