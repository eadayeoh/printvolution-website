'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatSGD } from '@/lib/utils';

type Item = {
  slug: string;
  name: string;
  icon: string | null;
  tagline: string | null;
  is_gift: boolean;
  category_name: string;
  category_slug: string;
  min_price: number | null; // cents
  href: string;
};

type Props = {
  items: Item[];
  categories: Array<{ slug: string; name: string }>;
  initialCategory: string | null;
  initialGift: boolean;
  initialSearch: string;
};

export function ShopClient({ items, categories, initialCategory, initialGift, initialSearch }: Props) {
  const [search, setSearch] = useState(initialSearch);
  const [activeCat, setActiveCat] = useState<string | null>(initialCategory);
  const [giftOnly, setGiftOnly] = useState(initialGift);

  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (activeCat && i.category_slug !== activeCat) return false;
      if (giftOnly && !i.is_gift) return false;
      if (q && !i.name.toLowerCase().includes(q) && !i.category_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, activeCat, giftOnly]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; items: Item[] }>();
    for (const item of filtered) {
      const key = item.category_slug;
      if (!map.has(key)) map.set(key, { slug: item.category_slug, name: item.category_name, items: [] });
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  return (
    <>
      {/* HERO */}
      <section className="pvshop-hero">
        <div className="pvshop-wrap">
          <div className="pvshop-hero-inner" style={{ gridTemplateColumns: '1fr', maxWidth: '760px' }}>
            <div className="pvshop-hero-left">
              <span className="pvshop-eyebrow">Browse all products</span>
              <h1>Print & gifts <em>for every need.</em></h1>
              <p>From your first name card to corporate hampers. {items.length} products across {categories.length} categories. Live pricing, 24h express available.</p>
              <div className="pvshop-search">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, categories..."
                />
                <button className="pvshop-search-btn" type="button" aria-label="Search">⌕</button>
              </div>
              <div className="pvshop-hero-stats">
                <div className="stat">
                  <div className="n">{items.length}</div>
                  <div className="l">Products</div>
                </div>
                <div className="stat">
                  <div className="n">{categories.length}</div>
                  <div className="l">Categories</div>
                </div>
                <div className="stat">
                  <div className="n">24h</div>
                  <div className="l">Express</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky category chips */}
      <div className="pvshop-catbar-wrap">
        <div className="pvshop-wrap">
          <div className="pvshop-catbar">
            <button
              className={`pvshop-chip ${!activeCat && !giftOnly ? 'active' : ''}`}
              onClick={() => { setActiveCat(null); setGiftOnly(false); }}
            >
              All ({items.length})
            </button>
            <button
              className={`pvshop-chip ${giftOnly ? 'active' : ''}`}
              onClick={() => { setGiftOnly(!giftOnly); setActiveCat(null); }}
            >
              🎁 Gifts
            </button>
            {categories.map((c) => {
              const count = items.filter((i) => i.category_slug === c.slug).length;
              return (
                <button
                  key={c.slug}
                  className={`pvshop-chip ${activeCat === c.slug ? 'active' : ''}`}
                  onClick={() => { setActiveCat(activeCat === c.slug ? null : c.slug); setGiftOnly(false); }}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="pvshop-grid-section">
        <div className="pvshop-wrap">
          {filtered.length === 0 && (
            <div className="pvshop-empty" style={{ display: 'block' }}>
              <div className="t">No products found</div>
              <div>Try a different search term or category</div>
            </div>
          )}
          {grouped.map((group) => (
            <div key={group.slug} className="pvshop-cat-group">
              <div className="pvshop-cat-head">
                <h3>{group.name}</h3>
                <span className="c">{group.items.length} products</span>
              </div>
              <div className="pvshop-grid">
                {group.items.map((p) => (
                  <Link key={p.slug} href={p.href} className="pvshop-card">
                    <div className="pvshop-card-img">
                      <div className="ph" style={{ fontSize: 52 }}>{p.icon ?? '📦'}</div>
                    </div>
                    <div className="pvshop-card-body">
                      <span className="pv-cat">{p.category_name}</span>
                      <div className="pv-name">{p.name}</div>
                      {p.tagline && <p className="pv-tag">{p.tagline}</p>}
                      <div className="pv-foot">
                        <div className="pv-price">
                          {p.min_price !== null ? (
                            <>
                              <span className="lbl">From</span>
                              {formatSGD(p.min_price)}
                            </>
                          ) : (
                            <>
                              <span className="lbl">Price</span>
                              Quote
                            </>
                          )}
                        </div>
                        <div className="pv-arrow">→</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dark CTA */}
      <section className="pvshop-cta">
        <div className="pvshop-wrap">
          <h2>Not sure what you need?<br /><em>WhatsApp us.</em></h2>
          <p>Tell us what you&apos;re looking for and we&apos;ll recommend the right product, configure it for you, and send a quote — usually within an hour.</p>
          <div className="pvshop-cta-row">
            <a href="https://wa.me/6585533497" target="_blank" rel="noopener noreferrer" className="pri">💬 WhatsApp Us</a>
            <Link href="/contact" className="sec">Visit Store</Link>
          </div>
        </div>
      </section>
    </>
  );
}
