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

const FeatureSchema = z.object({
  icon_url: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
  title: z.string().min(1).max(60),
  desc: z.string().max(200).default(''),
});

const Schema = z.object({
  logo_url: z.string().nullable().optional(),
  logo_width_px: z.number().int().nullable().optional(),
  favicon_url: z.string().nullable().optional(),
  brand_text: z.string().min(1).default('Printvolution'),
  product_features: z.array(FeatureSchema).min(1).max(6).optional(),
  /** Optional optimistic-lock token. Editor passes the row's
   *  updated_at it loaded with; server refuses if it's stale. */
  expected_updated_at: z.string().nullable().optional(),
});

export async function updateSiteSettings(input: z.input<typeof Schema>) {
  const sb = await requireAdmin();
  const parsed = Schema.parse(input);
  const { expected_updated_at, ...payload } = parsed;
  const nextUpdatedAt = new Date().toISOString();
  let q = sb
    .from('site_settings')
    .update({ ...payload, updated_at: nextUpdatedAt }, { count: 'exact' })
    .eq('id', 1);
  // Compare-and-swap: if the editor's known updated_at no longer
  // matches what's in the row, another admin saved in the meantime
  // and we'd silently overwrite their changes. Refuse and let the
  // editor reload + show a "someone else just saved" toast.
  if (expected_updated_at) q = q.eq('updated_at', expected_updated_at);
  const { error, count } = await q;
  if (error) return { ok: false as const, error: error.message };
  if (expected_updated_at && count === 0) {
    return { ok: false as const, error: 'Settings changed in another tab — reload and try again.' };
  }
  revalidatePath('/', 'layout');
  return { ok: true as const, updated_at: nextUpdatedAt };
}
