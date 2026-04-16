import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BundleEditor } from '@/components/admin/bundle-editor';

export const metadata = { title: 'New Bundle' };

function minPriceCents(rows: any[] | null | undefined): number | null {
  if (!rows) return null;
  let min: number | null = null;
  for (const r of rows) for (const p of (r?.prices ?? [])) if (typeof p === 'number' && (min === null || p < min)) min = p;
  return min;
}

export default async function NewBundlePage() {
  const supabase = createClient();
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
    name: '',
    description: '',
    tagline: '',
    status: 'draft' as const,
    discount_type: null,
    discount_value: 0,
    products: [],
    whys: [],
    faqs: [],
  };

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/bundles" className="mb-4 inline-flex items-center text-xs font-bold text-pink hover:underline">
        ← All bundles
      </Link>
      <h1 className="mb-6 text-2xl font-black text-ink">New bundle</h1>
      <BundleEditor mode="new" initial={initial} productOptions={productOptions} />
    </div>
  );
}
