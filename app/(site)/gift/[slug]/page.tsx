import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GiftProductPage } from '@/components/gift/gift-product-page';
import { getGiftProductBySlug, listActiveGiftProducts, listTemplatesForProduct } from '@/lib/gifts/data';
import { listPromptsForProduct } from '@/lib/gifts/prompts';
import { listActiveVariants } from '@/lib/gifts/variants';
import { ProductSchema, BreadcrumbSchema } from '@/components/seo/json-ld';
import { giftFromPrice } from '@/lib/gifts/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getGiftProductBySlug(params.slug);
  if (!p) return { title: 'Gift not found' };
  // Bypass the "%s | Printvolution" template when the DB value already
  // includes the brand suffix (all rewritten SEO titles do).
  const rawTitle = p.seo_title || p.name;
  const description = p.seo_desc || p.tagline || p.description || undefined;
  const heroImage = p.thumbnail_url || undefined;
  return {
    title: p.seo_title ? { absolute: rawTitle } : rawTitle,
    description,
    alternates: { canonical: `https://printvolution.sg/gift/${p.slug}` },
    openGraph: {
      title: rawTitle,
      description,
      type: 'website',
      images: heroImage ? [{ url: heroImage, alt: p.name }] : undefined,
    },
  };
}

export default async function GiftPage({ params }: { params: { slug: string } }) {
  const product = await getGiftProductBySlug(params.slug);
  if (!product) notFound();
  const [templates, prompts, variants, allGifts] = await Promise.all([
    product.template_mode === 'none' ? Promise.resolve([]) : listTemplatesForProduct(product.id),
    product.mode === 'photo-resize' ? Promise.resolve([]) : listPromptsForProduct({
      mode: product.mode,
      secondary_mode: product.secondary_mode,
      pipeline_id: product.pipeline_id,
      secondary_pipeline_id: product.secondary_pipeline_id,
      prompt_ids: (product as any).prompt_ids ?? null,
    }),
    listActiveVariants(product.id),
    listActiveGiftProducts(),
  ]);
  // Related: prefer same mode, exclude current, cap at 4.
  const sameMode = allGifts.filter((g) => g.slug !== product.slug && g.mode === product.mode);
  const otherMode = allGifts.filter((g) => g.slug !== product.slug && g.mode !== product.mode);
  const relatedGifts = [...sameMode, ...otherMode].slice(0, 4);
  const fromCents = giftFromPrice(product);
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://printvolution.sg/' },
          { name: 'Gifts', item: 'https://printvolution.sg/gifts' },
          { name: product.name, item: `https://printvolution.sg/gift/${product.slug}` },
        ]}
      />
      <ProductSchema
        name={product.name}
        urlPath={`/gift/${product.slug}`}
        description={product.tagline ?? product.description ?? null}
        category="Personalised Gift"
        imageUrl={product.thumbnail_url ?? null}
        priceFromCents={fromCents > 0 ? fromCents : null}
      />
      <GiftProductPage
        product={product}
        templates={templates}
        prompts={prompts}
        variants={variants}
        relatedGifts={relatedGifts}
      />
    </>
  );
}
