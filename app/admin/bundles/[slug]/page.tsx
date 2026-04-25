import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { embedOne } from '@/lib/data/products';
import { BundleEditor } from '@/components/admin/bundle-editor';
import { BundleGiftItemsPanel } from '@/components/admin/bundle-gift-items-panel';

export const metadata = { title: 'Edit Bundle' };

function minPriceCents(rows: any[] | null | undefined): number | null {
  if (!rows) return null;
  let min: number | null = null;
  for (const r of rows) for (const p of (r?.prices ?? [])) if (typeof p === 'number' && (min === null || p < min)) min = p;
  return min;
}

export default async function EditBundlePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data } = await supabase
    .from('bundles')
    .select(`
      id, slug, name, description, tagline, status,
      discount_type, discount_value,
      bundle_products(product_id, override_qty, display_order),
      bundle_whys(text, display_order),
      bundle_faqs(question, answer, display_order),
      bundle_gift_items(
        gift_product_id, variant_id, prompt_id, template_id, pipeline_id,
        override_qty, display_order,
        gift_product:gift_products(name, mode),
        variant:gift_product_variants(name),
        prompt:gift_prompts(name),
        template:gift_templates(name),
        pipeline:gift_pipelines(name)
      )
    `)
    .eq('slug', params.slug)
    .maybeSingle();
  if (!data) notFound();
  const d: any = data;

  // Load all services products for the picker
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, icon, product_pricing(rows)')
    .eq('is_active', true).order('name');

  const productOptions = ((products ?? []) as any[]).map((p) => ({
    id: p.id, slug: p.slug, name: p.name, icon: p.icon,
    min_price: minPriceCents(embedOne<any>(p.product_pricing)?.rows),
  }));

  // Load gift options for the gift-items panel
  const [giftsRes, variantsRes, promptsRes, tmplsRes, pipesRes] = await Promise.all([
    supabase.from('gift_products').select('id, slug, name, mode').eq('is_active', true).order('name'),
    supabase.from('gift_product_variants').select('id, gift_product_id, name, is_active').order('display_order'),
    supabase.from('gift_prompts').select('id, mode, pipeline_id, name').eq('is_active', true).order('display_order'),
    supabase.from('gift_templates').select('id, name, is_active').eq('is_active', true).order('name'),
    supabase.from('gift_pipelines').select('id, slug, name, kind').eq('is_active', true).order('name'),
  ]);

  const giftProducts = (giftsRes.data ?? []) as Array<{ id: string; slug: string; name: string; mode: string }>;
  const variantsByProduct: Record<string, Array<{ id: string; gift_product_id: string; name: string }>> = {};
  for (const v of (variantsRes.data ?? []) as any[]) {
    if (!v.is_active) continue;
    (variantsByProduct[v.gift_product_id] ??= []).push({ id: v.id, gift_product_id: v.gift_product_id, name: v.name });
  }
  const promptsByMode: Record<string, Array<{ id: string; mode: string; pipeline_id: string | null; name: string }>> = {};
  for (const p of (promptsRes.data ?? []) as any[]) {
    (promptsByMode[p.mode] ??= []).push(p);
  }
  const templates = (tmplsRes.data ?? []) as Array<{ id: string; name: string }>;
  const pipelines = (pipesRes.data ?? []) as Array<{ id: string; slug: string; name: string; kind: string }>;

  const initial = {
    name: d.name,
    description: d.description ?? '',
    tagline: d.tagline ?? '',
    status: d.status,
    discount_type: d.discount_type,
    discount_value: d.discount_type === 'flat' ? (d.discount_value ?? 0) / 100 : (d.discount_value ?? 0),
    products: (d.bundle_products ?? [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((bp: any) => ({ product_id: bp.product_id, override_qty: bp.override_qty ?? 1 })),
    whys: (d.bundle_whys ?? [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((w: any) => w.text as string),
    faqs: (d.bundle_faqs ?? [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((f: any) => ({ question: f.question, answer: f.answer })),
  };

  const giftItems = ((d.bundle_gift_items ?? []) as any[])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((bi: any) => {
      const gp = Array.isArray(bi.gift_product) ? bi.gift_product[0] : bi.gift_product;
      const v = Array.isArray(bi.variant) ? bi.variant[0] : bi.variant;
      const pr = Array.isArray(bi.prompt) ? bi.prompt[0] : bi.prompt;
      const tp = Array.isArray(bi.template) ? bi.template[0] : bi.template;
      const pl = Array.isArray(bi.pipeline) ? bi.pipeline[0] : bi.pipeline;
      return {
        gift_product_id: bi.gift_product_id,
        gift_product_name: gp?.name ?? '(deleted)',
        gift_product_mode: gp?.mode ?? 'unknown',
        variant_id: bi.variant_id,
        variant_name: v?.name ?? null,
        prompt_id: bi.prompt_id,
        prompt_name: pr?.name ?? null,
        template_id: bi.template_id,
        template_name: tp?.name ?? null,
        pipeline_id: bi.pipeline_id,
        pipeline_name: pl?.name ?? null,
        override_qty: bi.override_qty,
        display_order: bi.display_order,
      };
    });

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/bundles" className="mb-4 inline-flex items-center text-xs font-bold text-pink hover:underline">
        ← All bundles
      </Link>
      <h1 className="mb-6 text-2xl font-black text-ink">{d.name}</h1>
      <BundleEditor mode="edit" slug={params.slug} initial={initial} productOptions={productOptions} />

      <BundleGiftItemsPanel
        bundleId={d.id}
        items={giftItems}
        giftProducts={giftProducts}
        variantsByProduct={variantsByProduct}
        promptsByMode={promptsByMode}
        templates={templates}
        pipelines={pipelines}
      />
    </div>
  );
}
