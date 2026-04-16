import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductRowActions } from '@/components/admin/product-row-actions';

export const metadata = { title: 'Products' };

export default async function AdminProducts() {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select(`
      id, slug, name, is_active, is_gift, sort_order,
      category:categories!products_category_id_fkey(name, display_order)
    `)
    .order('name');

  const rows = ((data ?? []) as any[]);

  // Group by category name, sort groups by the category's display_order (then name)
  const groups = new Map<string, { name: string; order: number; items: any[] }>();
  for (const p of rows) {
    const cat = Array.isArray(p.category) ? p.category[0] : p.category;
    const name = cat?.name ?? 'Uncategorized';
    const order = cat?.display_order ?? 9999;
    if (!groups.has(name)) groups.set(name, { name, order, items: [] });
    groups.get(name)!.items.push(p);
  }
  const grouped = Array.from(groups.values()).sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name)
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Products</h1>
          <p className="text-sm text-neutral-500">
            {rows.length} products across {grouped.length} categories
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark"
        >
          + New Product
        </Link>
      </div>

      <div className="space-y-6">
        {grouped.map((group) => (
          <section key={group.name} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-ink">
                {group.name}
              </h2>
              <span className="text-[11px] font-semibold text-neutral-500">
                {group.items.length} product{group.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            <table className="w-full text-sm">
              <tbody className="divide-y divide-neutral-100">
                {group.items.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.slug}`} className="group block">
                        <div className="font-bold text-ink group-hover:text-pink">{p.name}</div>
                        <div className="text-[11px] text-neutral-500">{p.slug}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center w-20">
                      {p.is_gift && <span className="inline-block rounded bg-yellow-brand/20 px-2 py-0.5 text-[10px] font-bold uppercase text-ink">Gift</span>}
                    </td>
                    <td className="px-4 py-3 text-center w-24">
                      {p.is_active ? (
                        <span className="inline-block rounded border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block rounded border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-500">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right w-48">
                      <ProductRowActions slug={p.slug} name={p.name} isActive={p.is_active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
