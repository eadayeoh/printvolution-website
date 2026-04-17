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
});

export async function updateSiteSettings(input: z.input<typeof Schema>) {
  const sb = await requireAdmin();
  const parsed = Schema.parse(input);
  const { error } = await sb.from('site_settings').update({
    ...parsed,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true as const };
}
