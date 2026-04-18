import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

/**
 * Normalise a PostgREST embed. 1:1 foreign-key embeds (where the FK column
 * is a primary key on the embedded table) come back as a single object;
 * 1:many embeds come back as an array. Returns the first row either way,
 * or null when there's nothing. Supabase has flipped between these shapes
 * across versions, so don't assume.
 */
export function embedOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? ((v[0] as T) ?? null) : v;
}

export type PricingRow = { qty: string; prices: number[] }; // prices in cents
export type PricingData = {
  label: string;
  configs: string[];
  rows: PricingRow[];
};

export type ProductSpec = { label: string; value: string };

export type ConfiguratorStep = {
  step_id: string;
  step_order: number;
  label: string;
  type: 'select' | 'swatch' | 'text' | 'qty' | 'number';
  required: boolean;
  options: Array<{ slug: string; label: string; note?: string; price_formula?: string; swatch?: string }>;
  show_if?: { step: string; value: string } | null;
  step_config?: {
    presets?: number[] | null;
    min?: number | null;
    step?: number | null;
    labelMultiplier?: number | null;
    discount_note?: string | null;
    note?: string | null;
  } | null;
};

export type ProductExtras = {
  seo_title: string | null;
  seo_desc: string | null;
  seo_body: string | null;
  hero_big: string | null;
  chooser: unknown | null;
  seo_magazine: unknown | null;
  how_we_print: unknown | null;
  h1: string | null;
  h1em: string | null;
  intro: string | null;
  image_url: string | null;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  tagline: string | null;
  description: string | null;
  is_gift: boolean;
  category: { slug: string; name: string } | null;
  subcategory: { slug: string; name: string } | null;
  pricing: PricingData | null;
  extras: ProductExtras | null;
  configurator: ConfiguratorStep[];
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ slug: string; name: string; icon: string | null; image_url: string | null; category_slug: string; subcategory_slug: string | null; min_price: number | null }>;
};

export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  image_url: string | null;
  tagline: string | null;
  is_gift: boolean;
  category: { slug: string; name: string } | null;
  subcategory: { slug: string; name: string } | null;
  min_price: number | null; // cents
};

/** List all active products with their min price, category info. */
export const listProducts = cache(async (): Promise<ProductListItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, slug, name, icon, tagline, is_gift,
      category:categories!products_category_id_fkey(slug, name),
      subcategory:categories!products_subcategory_id_fkey(slug, name),
      product_pricing(rows),
      product_extras(image_url)
    `)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return ((data ?? []) as any[]).map((p: any) => {
    const rows = embedOne(p.product_pricing)?.rows ?? [];
    let min: number | null = null;
    for (const r of rows) {
      for (const price of r.prices ?? []) {
        if (typeof price === 'number' && (min === null || price < min)) min = price;
      }
    }
    const extras = embedOne<any>(p.product_extras);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      icon: p.icon,
      image_url: extras?.image_url ?? null,
      tagline: p.tagline,
      is_gift: p.is_gift,
      category: Array.isArray(p.category) ? p.category[0] ?? null : p.category,
      subcategory: Array.isArray(p.subcategory) ? p.subcategory[0] ?? null : p.subcategory,
      min_price: min,
    };
  });
});

/** Full product detail by slug. */
export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, slug, name, icon, tagline, description, is_gift,
      category:categories!products_category_id_fkey(slug, name),
      subcategory:categories!products_subcategory_id_fkey(slug, name),
      product_extras(*),
      product_pricing(label, configs, rows),
      product_configurator(step_id, step_order, label, type, required, options, show_if, step_config),
      product_faqs(question, answer, display_order),
      related:product_related!product_related_product_id_fkey(
        related_product_id,
        display_order,
        related:products!product_related_related_product_id_fkey(
          slug, name, icon,
          category:categories!products_category_id_fkey(slug),
          subcategory:categories!products_subcategory_id_fkey(slug),
          product_pricing(rows),
          product_extras(image_url)
        )
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  const d: any = data;

  const pricing = embedOne<any>(d.product_pricing);
  const extras = embedOne<any>(d.product_extras);
  const faqs = ((d.product_faqs ?? []) as any[])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((f: any) => ({ question: f.question, answer: f.answer }));

  const related = ((d.related ?? []) as any[])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((r: any) => {
      const rp = r.related;
      if (!rp) return null;
      const rows = embedOne(rp.product_pricing)?.rows ?? [];
      let min: number | null = null;
      for (const row of rows) for (const p of row.prices ?? []) if (typeof p === 'number' && (min === null || p < min)) min = p;
      return {
        slug: rp.slug,
        name: rp.name,
        icon: rp.icon,
        image_url: embedOne<any>(rp.product_extras)?.image_url ?? null,
        category_slug: rp.category?.slug ?? rp.category?.[0]?.slug ?? 'misc',
        subcategory_slug: rp.subcategory?.slug ?? rp.subcategory?.[0]?.slug ?? null,
        min_price: min,
      };
    })
    .filter(Boolean) as ProductDetail['related'];

  const configurator = ((d.product_configurator ?? []) as any[])
    .sort((a: any, b: any) => a.step_order - b.step_order) as ConfiguratorStep[];

  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    icon: d.icon,
    tagline: d.tagline,
    description: d.description,
    is_gift: d.is_gift,
    category: Array.isArray(d.category) ? d.category[0] ?? null : d.category,
    subcategory: Array.isArray(d.subcategory) ? d.subcategory[0] ?? null : d.subcategory,
    pricing: pricing
      ? { label: pricing.label ?? 'Size', configs: pricing.configs ?? [], rows: pricing.rows as PricingRow[] }
      : null,
    extras: extras
      ? {
          seo_title: extras.seo_title, seo_desc: extras.seo_desc, seo_body: extras.seo_body,
          hero_big: extras.hero_big,
          h1: extras.h1, h1em: extras.h1em,
          intro: extras.intro,
          chooser: extras.chooser ?? null,
          seo_magazine: extras.seo_magazine ?? null,
          how_we_print: extras.how_we_print ?? null,
          image_url: extras.image_url,
        }
      : null,
    configurator,
    faqs,
    related,
  };
});

/** All product slugs for generateStaticParams. */
export async function getAllProductSlugs() {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select('slug, category:categories!products_category_id_fkey(slug), subcategory:categories!products_subcategory_id_fkey(slug)')
    .eq('is_active', true);
  return (data ?? []).map((p: any) => ({
    slug: p.slug,
    category: (Array.isArray(p.category) ? p.category[0] : p.category)?.slug ?? 'misc',
    subcategory: (Array.isArray(p.subcategory) ? p.subcategory[0] : p.subcategory)?.slug ?? null,
  }));
}
