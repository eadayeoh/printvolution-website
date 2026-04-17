import Link from 'next/link';
import { listProducts } from '@/lib/data/products';
import { listTopCategories } from '@/lib/data/categories';
import { getProductRoutes, productHref } from '@/lib/data/navigation';
import { formatSGD } from '@/lib/utils';
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
  const [products, cats, routes] = await Promise.all([
    listProducts(),
    listTopCategories(),
    getProductRoutes(),
  ]);

  // Transform for client component
  const items = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    icon: p.icon,
    image_url: p.image_url,
    tagline: p.tagline,
    is_gift: p.is_gift,
    category_name: p.category?.name ?? 'Other',
    category_slug: p.category?.slug ?? 'misc',
    min_price: p.min_price,
    href: productHref(p.slug, routes),
  }));

  return (
    <div className="screen active" id="screen-shop">
      <ShopClient
        items={items}
        categories={cats.map((c) => ({ slug: c.slug, name: c.name }))}
        initialCategory={searchParams.category ?? null}
        initialGift={searchParams.gift === '1'}
        initialSearch={searchParams.q ?? ''}
      />
    </div>
  );
}
