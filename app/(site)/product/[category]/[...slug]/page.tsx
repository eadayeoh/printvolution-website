import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug } from '@/lib/data/products';
import { getProductRoutes, productHref } from '@/lib/data/navigation';
import { getSiteSettings } from '@/lib/data/site-settings';
import { ProductPage } from '@/components/product/product-page';
import { BreadcrumbSchema, ProductSchema } from '@/components/seo/json-ld';

// Product pages must read fresh on every request — admin edits
// (description, tagline, configurator, pricing) need to land on the
// customer page immediately without waiting for revalidatePath to
// propagate or an ISR window to expire. Supabase query cost per render
// is ~100ms, well worth it for edit-to-render consistency.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: { category: string; slug: string[] };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const productSlug = params.slug[params.slug.length - 1];
  const product = await getProductBySlug(productSlug);
  if (!product) return { title: 'Not found' };

  const routes = await getProductRoutes();
  const href = productHref(productSlug, routes);
  const url = `https://printvolution.sg${href}`;
  const title = product.extras?.seo_title ?? `${product.name} Printing Singapore`;
  const description = product.extras?.seo_desc ?? product.tagline ?? undefined;

  // Orphan / inactive products (not in routes table) collapse to /shop.
  // Pointing every orphan canonical at /shop creates duplicate-content
  // signals — emit noindex instead so search engines drop the URL.
  const orphan = !href.includes(productSlug);
  if (orphan) {
    return {
      title: { absolute: title },
      description,
      robots: { index: false, follow: false },
    };
  }

  // DB seo_title already ends with "| Printvolution", so bypass the
  // "%s | Printvolution" template from the root layout with an absolute
  // title — otherwise we'd render "... | Printvolution | Printvolution".
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: product.extras?.image_url ? [product.extras.image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const productSlug = params.slug[params.slug.length - 1];
  const [product, routes, settings] = await Promise.all([
    getProductBySlug(productSlug),
    getProductRoutes(),
    getSiteSettings(),
  ]);
  if (!product) notFound();

  // Min price for schema
  let minPrice: number | null = null;
  for (const r of product.pricing?.rows ?? []) {
    for (const p of r.prices ?? []) {
      if (typeof p === 'number' && (minPrice === null || p < minPrice)) minPrice = p;
    }
  }

  const slugPath = productHref(productSlug, routes);
  const orphan = !slugPath.includes(productSlug);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://printvolution.sg/' },
          { name: 'Shop', item: 'https://printvolution.sg/shop' },
          ...(product.category
            ? [{ name: product.category.name, item: `https://printvolution.sg/shop?category=${product.category.slug}` }]
            : []),
          { name: product.name },
        ]}
      />
      {!orphan && (
        <ProductSchema
          name={product.name}
          slug={slugPath.replace(/^\/product\//, '').replace(/\/$/, '')}
          description={product.description}
          category={product.category?.name}
          imageUrl={product.extras?.image_url}
          priceFromCents={minPrice}
        />
      )}
      <ProductPage product={product} productRoutes={routes} features={settings.product_features} />
    </>
  );
}
