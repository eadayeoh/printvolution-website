import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GiftProductPage } from '@/components/gift/gift-product-page';
import { getGiftProductBySlug, listActiveGiftProducts, listTemplatesForProduct } from '@/lib/gifts/data';
import { listPromptsForModes } from '@/lib/gifts/prompts';
import { listActiveVariants } from '@/lib/gifts/variants';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getGiftProductBySlug(params.slug);
  if (!p) return { title: 'Gift not found' };
  // Bypass the "%s | Printvolution" template when the DB value already
  // includes the brand suffix (all rewritten SEO titles do).
  const rawTitle = p.seo_title || p.name;
  return {
    title: p.seo_title ? { absolute: rawTitle } : rawTitle,
    description: p.seo_desc || p.tagline || p.description || undefined,
  };
}

export default async function GiftPage({ params }: { params: { slug: string } }) {
  const product = await getGiftProductBySlug(params.slug);
  if (!product) notFound();
  const [templates, prompts, variants, allGifts] = await Promise.all([
    product.template_mode === 'none' ? Promise.resolve([]) : listTemplatesForProduct(product.id),
    product.mode === 'photo-resize' ? Promise.resolve([]) : listPromptsForModes([
      product.mode,
      ...(product.secondary_mode ? [product.secondary_mode] : []),
    ]),
    listActiveVariants(product.id),
    listActiveGiftProducts(),
  ]);
  // Related: prefer same mode, exclude current, cap at 4.
  const sameMode = allGifts.filter((g) => g.slug !== product.slug && g.mode === product.mode);
  const otherMode = allGifts.filter((g) => g.slug !== product.slug && g.mode !== product.mode);
  const relatedGifts = [...sameMode, ...otherMode].slice(0, 4);
  return (
    <GiftProductPage
      product={product}
      templates={templates}
      prompts={prompts}
      variants={variants}
      relatedGifts={relatedGifts}
    />
  );
}
