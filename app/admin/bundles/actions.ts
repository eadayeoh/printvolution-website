'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { slugify } from '@/lib/utils';
import { requireAdmin, createServiceClient as adminClient } from '@/lib/auth/require-admin';
import { logAdminAction } from '@/lib/auth/admin-audit';

const BundleSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable(),
  tagline: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'draft']),
  discount_type: z.enum(['pct', 'flat']).nullable(),
  discount_value: z.number().int().nonnegative(),  // percent 0-100 or cents
  products: z.array(z.object({
    product_id: z.string().uuid(),
    override_qty: z.number().int().positive(),
  })).min(1),
  whys: z.array(z.string()),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export type BundleUpdateInput = z.infer<typeof BundleSchema>;

async function saveBundle(id: string, d: BundleUpdateInput) {
  const sb = adminClient();
  const { error: uErr } = await sb.from('bundles').update({
    name: d.name,
    description: d.description,
    tagline: d.tagline,
    status: d.status,
    discount_type: d.discount_type,
    discount_value: d.discount_value,
  }).eq('id', id);
  if (uErr) return { ok: false, error: 'Update failed: ' + uErr.message };

  // Products — wipe + reinsert
  await sb.from('bundle_products').delete().eq('bundle_id', id);
  if (d.products.length) {
    const rows = d.products.map((p, i) => ({
      bundle_id: id,
      product_id: p.product_id,
      override_qty: p.override_qty,
      display_order: i,
    }));
    const { error: pErr } = await sb.from('bundle_products').insert(rows);
    if (pErr) return { ok: false, error: 'Products failed: ' + pErr.message };
  }

  // Whys
  await sb.from('bundle_whys').delete().eq('bundle_id', id);
  if (d.whys.length) {
    await sb.from('bundle_whys').insert(d.whys.map((w, i) => ({ bundle_id: id, text: w, display_order: i })));
  }

  // FAQs
  await sb.from('bundle_faqs').delete().eq('bundle_id', id);
  if (d.faqs.length) {
    await sb.from('bundle_faqs').insert(d.faqs.map((f, i) => ({
      bundle_id: id, question: f.question, answer: f.answer, display_order: i,
    })));
  }

  revalidatePath('/bundles');
  revalidatePath(`/bundle/[slug]`, 'layout');
  revalidatePath('/admin/bundles');
  revalidatePath('/');

  return { ok: true };
}

export async function updateBundleBySlug(slug: string, input: BundleUpdateInput) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const parsed = BundleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const sb = adminClient();
  const { data } = await sb.from('bundles').select('id').eq('slug', slug).single();
  if (!data) return { ok: false, error: 'Bundle not found' };

  return saveBundle(data.id as string, parsed.data);
}

export async function createBundle(input: BundleUpdateInput) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const parsed = BundleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const sb = adminClient();

  // Unique slug
  let base = slugify(d.name);
  let slug = base;
  let n = 1;
  while (true) {
    const { data } = await sb.from('bundles').select('slug').eq('slug', slug).maybeSingle();
    if (!data) break;
    n++;
    slug = `${base}-${n}`;
  }

  const { data: b, error } = await sb.from('bundles').insert({
    slug,
    name: d.name,
    description: d.description,
    tagline: d.tagline,
    status: d.status,
    discount_type: d.discount_type,
    discount_value: d.discount_value,
    price_cents: 0,  // computed, legacy column kept for backward compat
    original_price_cents: 0,
    sort_order: 999,
  }).select('id, slug').single();
  if (error || !b) return { ok: false, error: error?.message ?? 'Create failed' };

  const saveResult = await saveBundle(b.id as string, d);
  if (!saveResult.ok) return saveResult;
  return { ok: true, slug: b.slug as string };
}

export async function deleteBundle(slug: string) {
  let actor;
  try { actor = (await requireAdmin()).actor; } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();
  const { error } = await sb.from('bundles').delete().eq('slug', slug);
  if (error) return { ok: false, error: error.message };
  await logAdminAction(actor, { action: 'bundle.delete', targetType: 'bundle', targetId: slug });
  revalidatePath('/admin/bundles');
  revalidatePath('/bundles');
  revalidatePath('/');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// BUNDLE GIFT ITEMS — (migration 0037) gift SKUs inside a bundle
// ---------------------------------------------------------------------------

const BundleGiftItemSchema = z.object({
  bundle_id: z.string().uuid(),
  gift_product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  prompt_id: z.string().uuid().nullable().optional(),
  template_id: z.string().uuid().nullable().optional(),
  pipeline_id: z.string().uuid().nullable().optional(),
  override_qty: z.number().int().positive().default(1),
  display_order: z.number().int().default(0),
});

export async function addBundleGiftItem(input: z.input<typeof BundleGiftItemSchema>) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false as const, error: e?.message ?? 'Forbidden' }; }
  const parsed = BundleGiftItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const sb = adminClient();
  const { error } = await sb.from('bundle_gift_items').insert(parsed.data as any);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/bundles');
  revalidatePath('/bundles');
  revalidatePath(`/bundle/[slug]`, 'layout');
  return { ok: true as const };
}

export async function updateBundleGiftItem(
  bundleId: string,
  giftProductId: string,
  input: Partial<z.input<typeof BundleGiftItemSchema>>,
) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false as const, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();
  const { error } = await sb.from('bundle_gift_items').update(input as any)
    .eq('bundle_id', bundleId).eq('gift_product_id', giftProductId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/bundles');
  revalidatePath('/bundles');
  revalidatePath(`/bundle/[slug]`, 'layout');
  return { ok: true as const };
}

export async function removeBundleGiftItem(bundleId: string, giftProductId: string) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false as const, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();
  const { error } = await sb.from('bundle_gift_items').delete()
    .eq('bundle_id', bundleId).eq('gift_product_id', giftProductId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/bundles');
  revalidatePath('/bundles');
  revalidatePath(`/bundle/[slug]`, 'layout');
  return { ok: true as const };
}
