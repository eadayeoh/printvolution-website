'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { ProductRowActions } from './product-row-actions';

type Product = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  is_gift: boolean;
  cat_slug: string;
  cat_name: string;
  cat_order: number;
};

type Cat = { slug: string; name: string; order: number; count: number };

export function ProductsByCategory({
  products,
  categories,
}: {
  products: Product[];
  categories: Cat[];
}) {
  const [active, setActive] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (active !== 'all' && p.cat_slug !== active) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, active, search]);

  // If "all" is selected, group rows by category. Otherwise flat list.
  const grouped = useMemo(() => {
    if (active !== 'all') return null;
    const groups = new Map<string, Product[]>();
    for (const p of filtered) {
      if (!groups.has(p.cat_slug)) groups.set(p.cat_slug, []);
      groups.get(p.cat_slug)!.push(p);
    }
    return Array.from(groups.entries())
      .map(([slug, items]) => {
        const c = categories.find((c) => c.slug === slug);
        return {
          slug,
          name: c?.name ?? slug,
          order: c?.order ?? 9999,
          items,
        };
      })
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }, [filtered, active, categories]);

  return (
    <>
      {/* Search + category tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or slug..."
          className="w-64 rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none"
        />
      </div>
      <div
        className="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200 pb-px"
        style={{ scrollbarWidth: 'thin' }}
      >
        <TabButton
          active={active === 'all'}
          onClick={() => setActive('all')}
          label="All"
          count={products.length}
        />
        {categories.map((c) => (
          <TabButton
            key={c.slug}
            active={active === c.slug}
            onClick={() => setActive(c.slug)}
            label={c.name}
            count={c.count}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-500">
          {search ? `No products match "${search}".` : 'No products in this category.'}
        </div>
      ) : grouped ? (
        <div className="space-y-5">
          {grouped.map((g) => (
            <CategoryBlock
              key={g.slug}
              title={g.name}
              count={g.items.length}
              items={g.items}
              showHeader
            />
          ))}
        </div>
      ) : (
        <CategoryBlock
          title={categories.find((c) => c.slug === active)?.name ?? active}
          count={filtered.length}
          items={filtered}
          showHeader={false}
        />
      )}
    </>
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-t px-4 py-2 text-xs font-bold transition-colors ${
        active
          ? 'bg-ink text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-ink'
      }`}
    >
      {label}
      <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
        {count}
      </span>
    </button>
  );
}

function CategoryBlock({ title, count, items, showHeader }: { title: string; count: number; items: Product[]; showHeader: boolean }) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {showHeader && (
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">{title}</h2>
          <span className="text-[11px] font-semibold text-neutral-500">
            {count} product{count !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      <table className="w-full text-sm">
        <tbody className="divide-y divide-neutral-100">
          {items.map((p) => (
            <tr key={p.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3">
                <Link href={`/admin/products/${p.slug}`} className="group block">
                  <div className="font-bold text-ink group-hover:text-pink">{p.name}</div>
                  <div className="text-[11px] text-neutral-500">{p.slug}</div>
                </Link>
              </td>
              <td className="px-4 py-3 text-center w-20">
                {p.is_gift && (
                  <span className="inline-block rounded bg-yellow-brand/20 px-2 py-0.5 text-[10px] font-bold uppercase text-ink">
                    Gift
                  </span>
                )}
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
  );
}
