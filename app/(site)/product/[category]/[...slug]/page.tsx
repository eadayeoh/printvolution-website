import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug } from '@/lib/data/products';
import { getProductRoutes } from '@/lib/data/navigation';
import { ProductPage } from '@/components/product/product-page';

type PageProps = {
  params: { category: string; slug: string[] };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const productSlug = params.slug[params.slug.length - 1];
  const product = await getProductBySlug(productSlug);
  if (!product) return { title: 'Not found' };

  return {
    title: product.extras?.seo_title ?? `${product.name} Printing Singapore`,
    description: product.extras?.seo_desc ?? product.tagline ?? undefined,
    openGraph: {
      title: product.extras?.seo_title ?? product.name,
      description: product.extras?.seo_desc ?? product.tagline ?? undefined,
      type: 'website',
    },
  };
}

export default async function Page({ params }: PageProps) {
  const productSlug = params.slug[params.slug.length - 1];
  const [product, routes] = await Promise.all([
    getProductBySlug(productSlug),
    getProductRoutes(),
  ]);
  if (!product) notFound();

  return <ProductPage product={product} productRoutes={routes} />;
}
