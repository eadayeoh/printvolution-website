import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GiftProductPage } from '@/components/gift/gift-product-page';
import { getGiftProductBySlug, listTemplatesForProduct } from '@/lib/gifts/data';
import { listPromptsForMode } from '@/lib/gifts/prompts';

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
  const [templates, prompts] = await Promise.all([
    product.template_mode === 'none' ? Promise.resolve([]) : listTemplatesForProduct(product.id),
    product.mode === 'photo-resize' ? Promise.resolve([]) : listPromptsForMode(product.mode),
  ]);
  return <GiftProductPage product={product} templates={templates} prompts={prompts} />;
}
