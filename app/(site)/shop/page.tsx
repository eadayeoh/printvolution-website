import { listProducts } from '@/lib/data/products';
import { listCategories, listTopCategories } from '@/lib/data/categories';
import { getProductRoutes, productHref } from '@/lib/data/navigation';
import { listActiveGiftProducts } from '@/lib/gifts/data';
import { giftFromPrice } from '@/lib/gifts/types';
import { ShopClient } from '@/components/shop/shop-client';

export const metadata = {
  title: 'Shop All Printing & Personalised Gifts',
  description: '91+ print and gift products — name cards, flyers, banners, embroidery, LED frames, engraved tumblers. Walk in or order online.',
  alternates: { canonical: 'https://printvolution.sg/shop' },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; gift?: string; q?: string };
}) {
  const [products, giftProducts, topCats, allCats, routes] = await Promise.all([
    listProducts(),
    listActiveGiftProducts(),
    listTopCategories(),
    listCategories(),
    getProductRoutes(),
  ]);

  // Resolve each gift's top-level category by walking parent_id
  const catById = new Map(allCats.map((c) => [c.id, c]));
  const topLevelFor = (id: string | null | undefined) => {
    let cur = id ? catById.get(id) : null;
    while (cur?.parent_id) cur = catById.get(cur.parent_id) ?? null;
    return cur ?? null;
  };

  // Print products → shop items
  const printItems = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    icon: p.icon,
    image_url: p.image_url,
    tagline: p.tagline,
    is_gift: false,
    category_name: p.category?.name ?? 'Other',
    category_slug: p.category?.slug ?? 'misc',
    min_price: p.min_price,
    href: productHref(p.slug, routes),
  }));

  // Gift products → shop items (href = /gift/slug)
  const giftItems = giftProducts.map((g) => {
    const top = topLevelFor(g.category_id);
    return {
      slug: g.slug,
      name: g.name,
      icon: '🎁',
      image_url: g.thumbnail_url,
      tagline: g.tagline,
      is_gift: true,
      category_name: top?.name ?? 'Gifts',
      category_slug: top?.slug ?? 'gifts',
      min_price: giftFromPrice(g),
      href: `/gift/${g.slug}`,
    };
  });

  const items = [...printItems, ...giftItems];

  // Split top categories into Services vs Gifts based on which catalog
  // has items in each. A category with both kinds lands in whichever side
  // has more items (rare — they're usually exclusive).
  const catKind = new Map<string, 'service' | 'gift'>();
  for (const c of topCats) {
    const p = printItems.filter((i) => i.category_slug === c.slug).length;
    const g = giftItems.filter((i) => i.category_slug === c.slug).length;
    if (p === 0 && g === 0) continue;
    catKind.set(c.slug, g > p ? 'gift' : 'service');
  }
  const serviceCats = topCats.filter((c) => catKind.get(c.slug) === 'service').map((c) => ({ slug: c.slug, name: c.name }));
  const giftCats = topCats.filter((c) => catKind.get(c.slug) === 'gift').map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="screen active" id="screen-shop">
      <ShopClient
        items={items}
        serviceCategories={serviceCats}
        giftCategories={giftCats}
        initialCategory={searchParams.category ?? null}
        initialGift={searchParams.gift === '1'}
        initialSearch={searchParams.q ?? ''}
      />
    </div>
  );
}
