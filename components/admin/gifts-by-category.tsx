'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';
import { formatSGD } from '@/lib/utils';

const MODE_COLORS: Record<string, string> = {
  laser: 'bg-amber-100 text-amber-800',
  uv: 'bg-blue-100 text-blue-800',
  embroidery: 'bg-purple-100 text-purple-800',
  'photo-resize': 'bg-green-100 text-green-800',
};

export type GiftRow = {
  id: string;
  slug: string;
  name: string;
  mode: string;
  is_active: boolean;
  base_price_cents: number;
  thumbnail_url: string | null;
  first_ordered_at: string | null;
  cat_slug: string;
  cat_name: string;
  cat_order: number;
};

type Cat = { slug: string; name: string; order: number; count: number };

export function GiftsByCategory({ products, categories }: { products: GiftRow[]; categories: Cat[] }) {
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

  const grouped = useMemo(() => {
    if (active !== 'all') return null;
    const groups = new Map<string, GiftRow[]>();
    for (const p of filtered) {
      if (!groups.has(p.cat_slug)) groups.set(p.cat_slug, []);
      groups.get(p.cat_slug)!.push(p);
    }
    return Array.from(groups.entries())
      .map(([slug, items]) => {
        const c = categories.find((c) => c.slug === slug);
        return { slug, name: c?.name ?? slug, order: c?.order ?? 9999, items };
      })
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }, [filtered, active, categories]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or slug..."
          className="w-64 rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none"
        />
      </div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200 pb-px" style={{ scrollbarWidth: 'thin' }}>
        <TabButton active={active === 'all'} onClick={() => setActive('all')} label="All" count={products.length} />
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
          {search ? `No gifts match "${search}".` : 'No gifts in this category.'}
        </div>
      ) : grouped ? (
        <div className="space-y-5">
          {grouped.map((g) => (
            <CategoryBlock key={g.slug} title={g.name} count={g.items.length} items={g.items} showHeader />
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
        active ? 'bg-ink text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-ink'
      }`}
    >
      {label}
      <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
        {count}
      </span>
    </button>
  );
}

function CategoryBlock({ title, count, items, showHeader }: { title: string; count: number; items: GiftRow[]; showHeader: boolean }) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {showHeader && (
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-ink">{title}</h2>
          <span className="text-[11px] font-semibold text-neutral-500">
            {count} gift{count !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      <div className="grid grid-cols-[80px_1fr_140px_100px_120px_100px] gap-3 border-b border-neutral-100 bg-neutral-50/60 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        <div>Image</div>
        <div>Name / Slug</div>
        <div>Mode</div>
        <div>Status</div>
        <div>Price from</div>
        <div>Actions</div>
      </div>
      {items.map((p) => (
        <div key={p.id} className="grid grid-cols-[80px_1fr_140px_100px_120px_100px] items-center gap-3 border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0">
          <div className="h-14 w-14 overflow-hidden rounded bg-neutral-100">
            {p.thumbnail_url ? (
              <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">🎁</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold text-ink">{p.name}</div>
            <div className="truncate text-[11px] text-neutral-500 font-mono">/gift/{p.slug}</div>
          </div>
          <div>
            <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${MODE_COLORS[p.mode] ?? 'bg-neutral-100 text-neutral-700'}`}>
              {GIFT_MODE_LABEL[p.mode as keyof typeof GIFT_MODE_LABEL]}
            </span>
            {p.first_ordered_at && (
              <span className="ml-1 text-[9px] text-neutral-400" title="Mode locked — product has been ordered">🔒</span>
            )}
          </div>
          <div>
            {p.is_active ? (
              <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Active</span>
            ) : (
              <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">Inactive</span>
            )}
          </div>
          <div className="text-[11px] font-semibold text-ink">{formatSGD(p.base_price_cents)}</div>
          <div className="flex gap-2">
            <Link href={`/admin/gifts/${p.id}`} className="text-[11px] font-bold text-pink hover:underline">
              Edit
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}
