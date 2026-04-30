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

export type PricingTable = {
  axes: Record<string, Array<{ slug: string; label: string }>>;
  /** Default axis lookup order. Used when `axis_order_by_method` isn't
   *  set or the current `method` value isn't in that map. */
  axis_order: string[];
  /** Per-method axis_order — lets one product expose different axes
   *  for different print methods (e.g. flyers: Digital uses
   *  ['method','size','paper','sides'], Offset uses
   *  ['method','size_offset','paper_offset','sides_offset']).
   *  The dispatch key is always `cfgState.method`. */
  axis_order_by_method?: Record<string, string[]>;
  qty_tiers: number[];
  prices: Record<string, number>; // key: "<axis1>:<axis2>:<qty>" → cents
  /** Optional pricing behaviour.
   *  - default (omitted): tier total. Typed qty snaps to the floor tier,
   *    tablePrice is used as-is. Customer receives the tier qty.
   *  - `per_unit_at_tier_rate`: tier gives a per-unit rate. Engine
   *    computes `(tablePrice / tier) × useQty` so typing any integer
   *    between tier floors scales linearly (stickers). */
  qty_mode?: 'per_unit_at_tier_rate';
  /** Admin-editable signed $ offset per qty tier. Key: String(qty),
   *  value: cents (positive = markup, negative = discount). Applied
   *  additively to tablePrice BEFORE per_unit_at_tier_rate scaling and
   *  the monotonicity floor, so it works the same whether the product
   *  is tier-locked or per-unit. Missing tier keys default to 0. */
  qty_adjust?: Record<string, number>;
};

/** Formula-driven pricing for products where tier snap-to-nearest
 *  isn't good enough — customer types any integer qty and the BM
 *  tier-floor calc produces an exact price. Currently only `bm`
 *  (basic-materials, for flyers digital) is supported. */
export type PricingCompute = {
  bm?: {
    /** cfgState predicate — run this calc only when all keys match. */
    match: Record<string, string>;
    /** cfgState keys to read for size / paper / sides. */
    size_key: string;
    paper_key: string;
    sides_key: string;
    /** Finished pieces per A3 sheet, keyed by size slug. */
    ups: Record<string, number>;
    /** "paper:sides" slug pair → BM tier-table key. */
    tier_map: Record<string, string>;
    /** BM tier tables: `[minA3Qty, unitPrice]` asc. */
    tiers: Record<string, Array<[number, number]>>;
    /** Cut fee picker: size slug → 5-column array, indexed by
     *  first col_breaks bucket a3Qty ≤. */
    cut: {
      col_breaks: number[];
      table: Record<string, number[]>;
    };
    /** Hard cap on finished qty; above this, no price. */
    max_finished_qty: number;
  };
};

export type ProductSpec = { label: string; value: string };

/** Single show_if clause. `value` can be a literal string (exact match)
 *  or a string[] (OR-match — matches if cfgState[step] is in the list).
 *  An array of clauses at the step or option level means ALL clauses
 *  must match (AND). */
export type ShowIfCond = { step: string; value: string | string[] };

export type ConfiguratorStep = {
  step_id: string;
  step_order: number;
  label: string;
  type: 'select' | 'swatch' | 'text' | 'qty' | 'number';
  required: boolean;
  options: Array<{
    slug: string;
    label: string;
    note?: string;
    price_formula?: string;
    swatch?: string;
    image_url?: string;
    /** Per-option production overrides. Lets a Print Method step carry
     *  its own lead time + print mode (e.g. Digital: 1 day, Offset: 7
     *  days on flyers). Falls back to product-level fields when absent. */
    lead_time_days?: number | null;
    print_mode?: string | null;
    /** Optional per-option visibility predicate. If set, the option is
     *  hidden from the swatch grid unless all conditions match. Same
     *  schema as step-level show_if — value can be a single string or
     *  an array (OR-match). Used e.g. to hide 260/310gsm Art Card paper
     *  on flyers offset unless size_offset = 'a5'. */
    show_if?: ShowIfCond | ShowIfCond[] | null;
  }>;
  show_if?: ShowIfCond | ShowIfCond[] | null;
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
  matcher: unknown | null;
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
  lead_time_days: number | null;
  print_mode: string | null;
  category: { slug: string; name: string } | null;
  subcategory: { slug: string; name: string } | null;
  pricing: PricingData | null;
  pricing_table: PricingTable | null;
  pricing_compute: PricingCompute | null;
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
      id, slug, name, icon, tagline, is_gift, pricing_table,
      category:categories!products_category_id_fkey(slug, name),
      subcategory:categories!products_subcategory_id_fkey(slug, name),
      product_pricing(rows),
      product_extras(image_url)
    `)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return ((data ?? []) as any[]).map((p: any) => {
    // Two pricing sources, in priority order:
    //   1. pricing_table (modern, synced from pvpricelist) — if present
    //      AND non-empty, it is the single source of truth.
    //   2. product_pricing.rows (legacy hand-built grid) — fallback
    //      only when no pricing_table exists.
    //
    // Folding both into one minimum (the previous behaviour) was a
    // bug: legacy rows contain a placeholder 0 for products like
    // Stickers / Flyers / Paper Bag, and 0 < every real price in the
    // pricing_table, so the zero won. The shop card then displayed
    // "Price Quote" even though pvpricelist had real numbers.
    const pt = p.pricing_table as PricingTable | null;
    let min: number | null = null;
    if (pt && pt.prices && Object.keys(pt.prices).length > 0) {
      for (const v of Object.values(pt.prices)) {
        if (typeof v === 'number' && v > 0 && (min === null || v < min)) min = v;
      }
    } else {
      const rows = embedOne(p.product_pricing)?.rows ?? [];
      for (const r of rows) {
        for (const price of r.prices ?? []) {
          if (typeof price === 'number' && price > 0 && (min === null || price < min)) min = price;
        }
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
      id, slug, name, icon, tagline, description, is_gift, pricing_table, pricing_compute, lead_time_days, print_mode,
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
          slug, name, icon, pricing_table,
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
      // Same pricing_table-first / legacy-fallback rule as listProducts.
      // Without this, related-product cards on a PDP would show 0 for
      // any product whose modern prices live only in pricing_table.
      const pt = rp.pricing_table as PricingTable | null;
      let min: number | null = null;
      if (pt && pt.prices && Object.keys(pt.prices).length > 0) {
        for (const v of Object.values(pt.prices)) {
          if (typeof v === 'number' && v > 0 && (min === null || v < min)) min = v;
        }
      } else {
        const rows = embedOne(rp.product_pricing)?.rows ?? [];
        for (const row of rows) for (const p of row.prices ?? []) {
          if (typeof p === 'number' && p > 0 && (min === null || p < min)) min = p;
        }
      }
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
    lead_time_days: (typeof d.lead_time_days === 'number') ? d.lead_time_days : null,
    print_mode: (typeof d.print_mode === 'string' && d.print_mode.trim()) ? d.print_mode : null,
    category: Array.isArray(d.category) ? d.category[0] ?? null : d.category,
    subcategory: Array.isArray(d.subcategory) ? d.subcategory[0] ?? null : d.subcategory,
    pricing: pricing
      ? { label: pricing.label ?? 'Size', configs: pricing.configs ?? [], rows: pricing.rows as PricingRow[] }
      : null,
    pricing_table: (d.pricing_table as PricingTable | null) ?? null,
    pricing_compute: (d.pricing_compute as PricingCompute | null) ?? null,
    extras: extras
      ? {
          seo_title: extras.seo_title, seo_desc: extras.seo_desc, seo_body: extras.seo_body,
          hero_big: extras.hero_big,
          h1: extras.h1, h1em: extras.h1em,
          intro: extras.intro,
          matcher: extras.matcher ?? null,
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
