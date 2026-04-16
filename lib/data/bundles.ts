import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export type BundleListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tagline: string | null;
  price_cents: number;
  original_price_cents: number;
};

export type BundleDetail = BundleListItem & {
  products: Array<{
    slug: string;
    name: string;
    icon: string | null;
    qty: string | null;
    spec: string | null;
    value: string | null;
    category_slug: string;
    subcategory_slug: string | null;
  }>;
  whys: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export const listBundles = cache(async (): Promise<BundleListItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bundles')
    .select('id, slug, name, description, tagline, price_cents, original_price_cents')
    .eq('status', 'active')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as BundleListItem[];
});

export const getBundleBySlug = cache(async (slug: string): Promise<BundleDetail | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bundles')
    .select(`
      id, slug, name, description, tagline, price_cents, original_price_cents,
      bundle_products(qty, spec, value, display_order,
        product:products(
          slug, name, icon,
          category:categories!products_category_id_fkey(slug),
          subcategory:categories!products_subcategory_id_fkey(slug)
        )
      ),
      bundle_whys(text, display_order),
      bundle_faqs(question, answer, display_order)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  const d: any = data;

  const products = ((d.bundle_products as any[]) ?? [])
    .sort((a, b) => a.display_order - b.display_order)
    .map((bp) => {
      const p = bp.product;
      if (!p) return null;
      const cat = Array.isArray(p.category) ? p.category[0] : p.category;
      const sub = Array.isArray(p.subcategory) ? p.subcategory[0] : p.subcategory;
      return {
        slug: p.slug,
        name: p.name,
        icon: p.icon,
        qty: bp.qty,
        spec: bp.spec,
        value: bp.value,
        category_slug: cat?.slug ?? 'misc',
        subcategory_slug: sub?.slug ?? null,
      };
    })
    .filter(Boolean) as BundleDetail['products'];

  const whys = ((d.bundle_whys as any[]) ?? [])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((w: any) => w.text as string);

  const faqs = ((d.bundle_faqs as any[]) ?? [])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((f: any) => ({ question: f.question as string, answer: f.answer as string }));

  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    description: d.description,
    tagline: d.tagline,
    price_cents: d.price_cents,
    original_price_cents: d.original_price_cents,
    products,
    whys,
    faqs,
  };
});
