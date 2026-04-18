'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { slugify } from '@/lib/utils';
import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { logAdminAction } from '@/lib/auth/admin-audit';

// Backwards-compat alias so existing call sites inside this file keep
// working without a mass rename. Every exported action below calls
// requireAdmin() first; only after that passes do we hand out the
// service-role client.
const adminClient = createServiceClient;

const SpecSchema = z.array(z.object({ label: z.string(), value: z.string() }));
const PricingRowSchema = z.object({
  qty: z.string(),
  prices: z.array(z.number()),
});
const PricingSchema = z.object({
  label: z.string(),
  configs: z.array(z.string()),
  rows: z.array(PricingRowSchema),
});
const ConfiguratorStepSchema = z.object({
  step_id: z.string(),
  label: z.string(),
  type: z.enum(['select', 'swatch', 'text', 'qty', 'number']),
  required: z.boolean(),
  options: z.array(z.object({
    slug: z.string(),
    label: z.string(),
    note: z.string().optional(),
    price_formula: z.string().optional(),
  })).optional(),
  show_if: z.object({ step: z.string(), value: z.string() }).nullable().optional(),
  step_config: z.record(z.string(), z.any()).nullable().optional(),
});
const FaqSchema = z.array(z.object({ question: z.string(), answer: z.string() }));

const ProductUpdateSchema = z.object({
  name: z.string().min(2),
  icon: z.string().nullable(),
  tagline: z.string().nullable(),
  description: z.string().nullable(),
  category_id: z.string().uuid().nullable(),
  subcategory_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
  is_gift: z.boolean().default(false),
  highlights: z.array(z.string()),
  specs: SpecSchema,
  // extras
  seo_title: z.string().nullable(),
  seo_desc: z.string().nullable(),
  seo_body: z.string().nullable(),
  hero_color: z.string().nullable(),
  hero_big: z.string().nullable(),
  h1: z.string().nullable(),
  h1em: z.string().nullable(),
  intro: z.string().nullable(),
  why_headline: z.string().nullable(),
  why_us: z.array(z.string()),
  image_url: z.string().nullable(),
  // nested
  pricing: PricingSchema.nullable(),
  configurator: z.array(ConfiguratorStepSchema),
  faqs: FaqSchema,
});

export type ProductUpdateInput = z.input<typeof ProductUpdateSchema>;

export async function updateProduct(slug: string, input: ProductUpdateInput) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const parsed = ProductUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const sb = adminClient();

  // 1. Core product
  const { data: product, error: pErr } = await sb
    .from('products')
    .update({
      name: d.name,
      icon: d.icon,
      tagline: d.tagline,
      description: d.description,
      category_id: d.category_id,
      subcategory_id: d.subcategory_id,
      is_active: d.is_active,
      is_gift: d.is_gift,
      highlights: d.highlights,
      specs: d.specs,
    })
    .eq('slug', slug)
    .select('id')
    .single();
  if (pErr || !product) return { ok: false, error: 'Update failed: ' + pErr?.message };

  const id = product.id as string;

  // 2. Extras
  await sb.from('product_extras').upsert({
    product_id: id,
    seo_title: d.seo_title, seo_desc: d.seo_desc, seo_body: d.seo_body,
    hero_color: d.hero_color, hero_big: d.hero_big,
    h1: d.h1, h1em: d.h1em,
    intro: d.intro, why_headline: d.why_headline,
    why_us: d.why_us, image_url: d.image_url,
  }, { onConflict: 'product_id' });

  // 3. Pricing
  if (d.pricing) {
    await sb.from('product_pricing').upsert({
      product_id: id,
      label: d.pricing.label,
      configs: d.pricing.configs,
      rows: d.pricing.rows,
    }, { onConflict: 'product_id' });
  }

  // 4. Configurator — wipe + reinsert
  await sb.from('product_configurator').delete().eq('product_id', id);
  if (d.configurator.length) {
    const cfgRows = d.configurator.map((s, i) => ({
      product_id: id,
      step_id: s.step_id,
      step_order: i,
      label: s.label,
      type: s.type,
      required: s.required,
      options: s.options ?? [],
      show_if: s.show_if ?? null,
      step_config: s.step_config ?? null,
    }));
    const { error: cErr } = await sb.from('product_configurator').insert(cfgRows);
    if (cErr) return { ok: false, error: 'Configurator failed: ' + cErr.message };
  }

  // 5. FAQs — wipe + reinsert
  await sb.from('product_faqs').delete().eq('product_id', id);
  if (d.faqs.length) {
    const faqRows = d.faqs.map((f, i) => ({
      product_id: id,
      question: f.question,
      answer: f.answer,
      display_order: i,
    }));
    await sb.from('product_faqs').insert(faqRows);
  }

  revalidatePath(`/product/[category]/[...slug]`, 'layout');
  revalidatePath('/shop');
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${slug}`);

  return { ok: true };
}

const ProductCreateSchema = z.object({
  name: z.string().min(2),
  icon: z.string().optional(),
  category_id: z.string().uuid(),
  subcategory_id: z.string().uuid().optional().nullable(),
  is_gift: z.boolean().default(false),
});

export async function createProduct(input: z.infer<typeof ProductCreateSchema>) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const parsed = ProductCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const sb = adminClient();

  // Unique slug
  let base = slugify(d.name);
  let slug = base;
  let n = 1;
  while (true) {
    const { data } = await sb.from('products').select('slug').eq('slug', slug).maybeSingle();
    if (!data) break;
    n++;
    slug = `${base}-${n}`;
  }

  const { data: product, error } = await sb.from('products').insert({
    slug,
    name: d.name,
    icon: d.icon || '📦',
    category_id: d.category_id,
    subcategory_id: d.subcategory_id || null,
    is_gift: d.is_gift,
    is_active: true,
    sort_order: 999,
    highlights: [],
    specs: [],
  }).select('id, slug').single();

  if (error || !product) return { ok: false, error: error?.message ?? 'Create failed' };

  // Default pricing row
  await sb.from('product_pricing').insert({
    product_id: product.id,
    label: 'Size',
    configs: ['Standard'],
    rows: [{ qty: '1 pc', prices: [0] }],
  });

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { ok: true, slug: product.slug as string };
}

export async function deleteProduct(slug: string) {
  let actor;
  try { actor = (await requireAdmin()).actor; } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();
  const { error } = await sb.from('products').delete().eq('slug', slug);
  if (error) return { ok: false, error: error.message };
  await logAdminAction(actor, { action: 'product.delete', targetType: 'product', targetId: slug });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { ok: true };
}

export async function toggleProductActive(slug: string, is_active: boolean) {
  let actor;
  try { actor = (await requireAdmin()).actor; } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();
  const { error } = await sb.from('products').update({ is_active }).eq('slug', slug);
  if (error) return { ok: false, error: error.message };
  await logAdminAction(actor, { action: 'product.toggle_active', targetType: 'product', targetId: slug, metadata: { is_active } });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { ok: true };
}
