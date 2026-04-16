import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductsByCategory } from '@/components/admin/products-by-category';

export const metadata = { title: 'Products' };

export default async function AdminProducts() {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select(`
      id, slug, name, is_active, is_gift, sort_order,
      category:categories!products_category_id_fkey(slug, name, display_order)
    `)
    .order('name');

  const rows = ((data ?? []) as any[]).map((p) => {
    const cat = Array.isArray(p.category) ? p.category[0] : p.category;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      is_active: p.is_active,
      is_gift: p.is_gift,
      cat_slug: cat?.slug ?? 'uncategorized',
      cat_name: cat?.name ?? 'Uncategorized',
      cat_order: cat?.display_order ?? 9999,
    };
  });

  // Build category list (ordered) with counts
  const catsMap = new Map<string, { slug: string; name: string; order: number; count: number }>();
  for (const r of rows) {
    if (!catsMap.has(r.cat_slug)) {
      catsMap.set(r.cat_slug, { slug: r.cat_slug, name: r.cat_name, order: r.cat_order, count: 0 });
    }
    catsMap.get(r.cat_slug)!.count++;
  }
  const categories = Array.from(catsMap.values()).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Products</h1>
          <p className="text-sm text-neutral-500">
            {rows.length} products across {categories.length} categories
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark"
        >
          + New Product
        </Link>
      </div>

      <ProductsByCategory products={rows} categories={categories} />
    </div>
  );
}
