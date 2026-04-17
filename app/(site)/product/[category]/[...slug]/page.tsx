import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug } from '@/lib/data/products';
import { getProductRoutes, productHref } from '@/lib/data/navigation';
import { getSiteSettings } from '@/lib/data/site-settings';
import { ProductPage } from '@/components/product/product-page';
import { BreadcrumbSchema, ProductSchema } from '@/components/seo/json-ld';

type PageProps = {
  params: { category: string; slug: string[] };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const productSlug = params.slug[params.slug.length - 1];
  const product = await getProductBySlug(productSlug);
  if (!product) return { title: 'Not found' };

  const routes = await getProductRoutes();
  const url = `https://printvolution.sg${productHref(productSlug, routes)}`;
  const title = product.extras?.seo_title ?? `${product.name} Printing Singapore`;
  const description = product.extras?.seo_desc ?? product.tagline ?? undefined;

  return {
    title,
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
      <ProductSchema
        name={product.name}
        slug={slugPath.replace(/^\/product\//, '').replace(/\/$/, '')}
        description={product.description}
        category={product.category?.name}
        imageUrl={product.extras?.image_url}
        priceFromCents={minPrice}
      />
      <ProductPage product={product} productRoutes={routes} features={settings.product_features} />
    </>
  );
}
