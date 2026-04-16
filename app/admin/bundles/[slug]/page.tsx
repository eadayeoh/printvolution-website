import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BundleEditor } from '@/components/admin/bundle-editor';

export const metadata = { title: 'Edit Bundle' };

function minPriceCents(rows: any[] | null | undefined): number | null {
  if (!rows) return null;
  let min: number | null = null;
  for (const r of rows) for (const p of (r?.prices ?? [])) if (typeof p === 'number' && (min === null || p < min)) min = p;
  return min;
}

export default async function EditBundlePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  // Load bundle
  const { data } = await supabase
    .from('bundles')
    .select(`
      id, slug, name, description, tagline, status,
      discount_type, discount_value,
      bundle_products(product_id, override_qty, display_order),
      bundle_whys(text, display_order),
      bundle_faqs(question, answer, display_order)
    `)
    .eq('slug', params.slug)
    .maybeSingle();
  if (!data) notFound();
  const d: any = data;

  // Load all products for the picker (with min price)
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, icon, product_pricing(rows)')
    .eq('is_active', true)
    .order('name');

  const productOptions = ((products ?? []) as any[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    icon: p.icon,
    min_price: minPriceCents(p.product_pricing?.[0]?.rows),
  }));

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

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/bundles" className="mb-4 inline-flex items-center text-xs font-bold text-pink hover:underline">
        ← All bundles
      </Link>
      <h1 className="mb-6 text-2xl font-black text-ink">{d.name}</h1>
      <BundleEditor mode="edit" slug={params.slug} initial={initial} productOptions={productOptions} />
    </div>
  );
}
