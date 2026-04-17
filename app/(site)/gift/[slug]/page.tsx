import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GiftProductPage } from '@/components/gift/gift-product-page';
import { getGiftProductBySlug, listTemplatesForProduct } from '@/lib/gifts/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getGiftProductBySlug(params.slug);
  if (!p) return { title: 'Gift not found' };
  return {
    title: p.seo_title || p.name,
    description: p.seo_desc || p.tagline || p.description || undefined,
  };
}

export default async function GiftPage({ params }: { params: { slug: string } }) {
  const product = await getGiftProductBySlug(params.slug);
  if (!product) notFound();
  const templates = product.template_mode === 'none' ? [] : await listTemplatesForProduct(product.id);
  return <GiftProductPage product={product} templates={templates} />;
}
