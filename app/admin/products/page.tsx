import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductRowActions } from '@/components/admin/product-row-actions';

export const metadata = { title: 'Products' };

export default async function AdminProducts() {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select(`
      id, slug, name, icon, is_active, is_gift, sort_order,
      category:categories!products_category_id_fkey(name)
    `)
    .order('name');

  const rows = ((data ?? []) as any[]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Products</h1>
          <p className="text-sm text-neutral-500">{rows.length} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark"
        >
          + New Product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-center">Gift</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((p) => {
              const cat = Array.isArray(p.category) ? p.category[0] : p.category;
              return (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.slug}`} className="flex items-center gap-3 group">
                      <span className="text-xl">{p.icon ?? '📦'}</span>
                      <div>
                        <div className="font-bold text-ink group-hover:text-pink">{p.name}</div>
                        <div className="text-[11px] text-neutral-500">{p.slug}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{cat?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {p.is_gift ? <span className="text-sm">🎁</span> : <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
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
                  <td className="px-4 py-3 text-right">
                    <ProductRowActions slug={p.slug} name={p.name} isActive={p.is_active} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
