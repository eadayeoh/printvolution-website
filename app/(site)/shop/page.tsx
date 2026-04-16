import Link from 'next/link';
import { listProducts } from '@/lib/data/products';
import { listTopCategories } from '@/lib/data/categories';
import { getProductRoutes, productHref } from '@/lib/data/navigation';
import { formatSGD } from '@/lib/utils';

export const metadata = {
  title: 'Shop Printing & Personalised Gifts',
  description: 'Browse all printing and gift products at Printvolution Singapore.',
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; gift?: string };
}) {
  const [products, cats, routes] = await Promise.all([
    listProducts(),
    listTopCategories(),
    getProductRoutes(),
  ]);

  const filterCat = searchParams.category;
  const filterGift = searchParams.gift === '1';

  const filtered = products.filter((p) => {
    if (filterCat && p.category?.slug !== filterCat) return false;
    if (filterGift && !p.is_gift) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-black text-ink lg:text-5xl">Shop</h1>
        <p className="text-neutral-600">
          {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
          {filterCat ? ` in ${cats.find((c) => c.slug === filterCat)?.name}` : ''}
          {filterGift ? ' · gifts only' : ''}
        </p>
      </div>

      {/* Category pills */}
      <div className="mb-10 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-colors ${
            !filterCat && !filterGift
              ? 'border-ink bg-ink text-white'
              : 'border-neutral-200 bg-white text-neutral-700 hover:border-ink'
          }`}
        >
          All
        </Link>
        <Link
          href="/shop?gift=1"
          className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-colors ${
            filterGift
              ? 'border-yellow-brand bg-yellow-brand text-ink'
              : 'border-neutral-200 bg-white text-neutral-700 hover:border-yellow-brand'
          }`}
        >
          🎁 Gifts
        </Link>
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={`/shop?category=${c.slug}`}
            className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-colors ${
              filterCat === c.slug
                ? 'border-pink bg-pink text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-pink'
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-neutral-200 p-16 text-center">
          <p className="mb-4 text-lg font-semibold text-neutral-400">No products match that filter.</p>
          <Link href="/shop" className="text-sm font-bold text-pink hover:underline">
            ← See all products
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={productHref(p.slug, routes)}
              className="group flex flex-col rounded-lg border-2 border-neutral-200 bg-white p-5 transition-all hover:border-ink hover:shadow-brand"
            >
              <div className="mb-3 flex h-32 items-center justify-center rounded bg-neutral-50 text-5xl">
                {p.icon ?? '📦'}
              </div>
              {p.category && (
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-pink">
                  {p.category.name}
                </div>
              )}
              <h3 className="mb-1 text-sm font-bold text-ink group-hover:text-pink">{p.name}</h3>
              {p.tagline && (
                <p className="mb-3 line-clamp-2 text-xs text-neutral-500">{p.tagline}</p>
              )}
              <div className="mt-auto flex items-center justify-between">
                {p.min_price !== null ? (
                  <span className="text-sm font-black text-pink">From {formatSGD(p.min_price)}</span>
                ) : (
                  <span className="text-sm font-bold text-neutral-400">Quote</span>
                )}
                {p.is_gift && (
                  <span className="rounded bg-yellow-brand px-2 py-0.5 text-[9px] font-bold uppercase text-ink">
                    Gift
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
