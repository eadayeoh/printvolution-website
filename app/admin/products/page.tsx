import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/admin/status-badge';

export const metadata = { title: 'Products' };

export default async function AdminProducts() {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select(`
      id, slug, name, icon, is_active, is_gift, sort_order,
      category:categories!products_category_id_fkey(name)
    `)
    .order('sort_order');

  const rows = ((data ?? []) as any[]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Products</h1>
          <p className="text-sm text-neutral-500">{rows.length} products</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-center">Gift</th>
              <th className="px-4 py-3 text-center">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((p) => {
              const cat = Array.isArray(p.category) ? p.category[0] : p.category;
              return (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.icon ?? '📦'}</span>
                      <div>
                        <div className="font-bold text-ink">{p.name}</div>
                        <div className="text-[11px] text-neutral-500">{p.slug}</div>
                      </div>
                    </div>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        Product editing (name, description, pricing, configurator, FAQs) is built in Phase 6.
      </p>
    </div>
  );
}
