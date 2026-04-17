import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { embedOne } from '@/lib/data/products';

export type BundleListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tagline: string | null;
  /** Computed: sum(product.min_price * qty) */
  subtotal_cents: number;
  /** Computed: subtotal - discount */
  price_cents: number;
  discount_type: 'pct' | 'flat' | null;
  discount_value: number; // percent (0-100) or cents
  discount_cents: number; // actual dollar saving
};

export type BundleProduct = {
  slug: string;
  name: string;
  icon: string | null;
  tagline: string | null;
  description: string | null;
  category_slug: string;
  subcategory_slug: string | null;
  override_qty: number;
  /** Price the product contributes to the bundle subtotal (min unit price × qty) */
  unit_price_cents: number | null;
  line_price_cents: number | null;
};

export type BundleDetail = BundleListItem & {
  products: BundleProduct[];
  whys: string[];
  faqs: Array<{ question: string; answer: string }>;
};

/** Min price of a product from its pricing.rows (cents). */
function minPriceCents(rows: any[] | null | undefined): number | null {
  if (!rows) return null;
  let min: number | null = null;
  for (const r of rows) {
    for (const p of (r?.prices ?? [])) {
      if (typeof p === 'number' && (min === null || p < min)) min = p;
    }
  }
  return min;
}

/** Apply discount to subtotal → returns {price, discount_cents} */
function applyDiscount(subtotal: number, type: string | null, value: number): { price: number; discount: number } {
  if (!type || value <= 0) return { price: subtotal, discount: 0 };
  if (type === 'pct') {
    const d = Math.round((subtotal * Math.min(100, value)) / 100);
    return { price: Math.max(0, subtotal - d), discount: d };
  }
  // flat (cents)
  return { price: Math.max(0, subtotal - value), discount: Math.min(subtotal, value) };
}

export const listBundles = cache(async (): Promise<BundleListItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bundles')
    .select(`
      id, slug, name, description, tagline, status, sort_order,
      discount_type, discount_value,
      bundle_products(
        override_qty,
        product:products(
          product_pricing(rows)
        )
      )
    `)
    .eq('status', 'active')
    .order('sort_order');
  if (error) throw error;

  return ((data ?? []) as any[]).map((b) => {
    let subtotal = 0;
    for (const bp of (b.bundle_products ?? [])) {
      const prod = Array.isArray(bp.product) ? bp.product[0] : bp.product;
      const rows = embedOne<any>(prod?.product_pricing)?.rows;
      const unit = minPriceCents(rows) ?? 0;
      subtotal += unit * (bp.override_qty ?? 1);
    }
    const { price, discount } = applyDiscount(subtotal, b.discount_type, b.discount_value ?? 0);
    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      tagline: b.tagline,
      subtotal_cents: subtotal,
      price_cents: price,
      discount_type: b.discount_type,
      discount_value: b.discount_value ?? 0,
      discount_cents: discount,
    };
  });
});

export const getBundleBySlug = cache(async (slug: string): Promise<BundleDetail | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bundles')
    .select(`
      id, slug, name, description, tagline, status,
      discount_type, discount_value,
      bundle_products(
        override_qty, display_order,
        product:products(
          slug, name, icon, tagline, description,
          category:categories!products_category_id_fkey(slug),
          subcategory:categories!products_subcategory_id_fkey(slug),
          product_pricing(rows)
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

  const products: BundleProduct[] = ((d.bundle_products ?? []) as any[])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((bp: any) => {
      const p = Array.isArray(bp.product) ? bp.product[0] : bp.product;
      if (!p) return null;
      const cat = Array.isArray(p.category) ? p.category[0] : p.category;
      const sub = Array.isArray(p.subcategory) ? p.subcategory[0] : p.subcategory;
      const rows = embedOne<any>(p.product_pricing)?.rows;
      const unit = minPriceCents(rows);
      const qty = bp.override_qty ?? 1;
      return {
        slug: p.slug,
        name: p.name,
        icon: p.icon,
        tagline: p.tagline,
        description: p.description,
        category_slug: cat?.slug ?? 'misc',
        subcategory_slug: sub?.slug ?? null,
        override_qty: qty,
        unit_price_cents: unit,
        line_price_cents: unit !== null ? unit * qty : null,
      };
    })
    .filter(Boolean) as BundleProduct[];

  const subtotal = products.reduce((s, p) => s + (p.line_price_cents ?? 0), 0);
  const { price, discount } = applyDiscount(subtotal, d.discount_type, d.discount_value ?? 0);

  const whys = ((d.bundle_whys ?? []) as any[])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((w: any) => w.text as string);

  const faqs = ((d.bundle_faqs ?? []) as any[])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((f: any) => ({ question: f.question as string, answer: f.answer as string }));

  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    description: d.description,
    tagline: d.tagline,
    subtotal_cents: subtotal,
    price_cents: price,
    discount_type: d.discount_type,
    discount_value: d.discount_value ?? 0,
    discount_cents: discount,
    products,
    whys,
    faqs,
  };
});
