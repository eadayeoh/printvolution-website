'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'admin') throw new Error('Admin only');
  return sb;
}

const Schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens'),
  name: z.string().min(1),
  parent_id: z.string().uuid().nullable().optional(),
  display_order: z.number().int().default(0),
});

// Walk the parent chain and reject if it returns to `selfId`. Used
// on both create and update — without it, admin can set A.parent=B
// and B.parent=A and the recursive shop breadcrumb spins forever.
// `selfId` is null on create (no row to point back to yet); we still
// run the walk to surface a pre-existing cycle in the proposed
// ancestor chain rather than silently inheriting it.
async function checkParentChain(
  sb: Awaited<ReturnType<typeof requireAdmin>>,
  parentId: string,
  selfId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (selfId && parentId === selfId) {
    return { ok: false, error: 'A category cannot be its own parent.' };
  }
  let cursor: string | null = parentId;
  const visited = new Set<string>();
  for (let i = 0; i < 100 && cursor; i++) {
    if (selfId && cursor === selfId) {
      return { ok: false, error: 'That parent would create a category cycle.' };
    }
    if (visited.has(cursor)) break;
    visited.add(cursor);
    const res = await sb.from('categories').select('parent_id').eq('id', cursor).maybeSingle();
    const row = res.data as { parent_id: string | null } | null;
    cursor = row?.parent_id ?? null;
  }
  return { ok: true };
}

export async function createCategory(input: z.input<typeof Schema>) {
  const sb = await requireAdmin();
  const parsed = Schema.parse(input);
  if (parsed.parent_id) {
    const chain = await checkParentChain(sb, parsed.parent_id, null);
    if (!chain.ok) return { ok: false as const, error: chain.error };
  }
  const { data, error } = await sb.from('categories').insert(parsed as any).select('id').single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/categories');
  return { ok: true as const, id: data.id };
}

export async function updateCategory(id: string, input: Partial<z.input<typeof Schema>>) {
  const sb = await requireAdmin();
  if (input.parent_id) {
    const chain = await checkParentChain(sb, input.parent_id, id);
    if (!chain.ok) return { ok: false as const, error: chain.error };
  }
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
