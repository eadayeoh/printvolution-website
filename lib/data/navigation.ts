import { createClient } from '@/lib/supabase/server';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import type { NavItem, MegaMenuSection, ProductLookup } from './navigation-types';

export type { NavItem, MegaMenuSection, ProductLookup } from './navigation-types';
export { productHref } from './navigation-types';

/** Cache tag for the entire nav surface (header nav + mega menus). Admin save
 * actions call revalidateTag(NAVIGATION_TAG) to bust the cached fetch the
 * moment a change is saved, instead of waiting on the layout's revalidate. */
export const NAVIGATION_TAG = 'navigation';

// IMPORTANT: the cached fetch must NOT call createClient() from
// '@/lib/supabase/server' because that reads cookies(), and Next.js throws
// "cookies inside unstable_cache" at runtime — crashes the layout, surfaces
// as a global-error "Application error: client-side exception" to visitors.
//
// Nav + mega-menu data is public (header is shown to anonymous visitors),
// so a fresh anon-key client without cookies is the right tool here.
function publicAnonClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// unstable_cache: cross-request data cache, busted by tag on admin save.
// react cache(): per-request memoisation so multiple Header sub-components
// in the same render don't re-execute the wrapper.
const fetchNavigationCached = unstable_cache(
  async (): Promise<NavItem[]> => {
    const supabase = publicAnonClient();
    const { data, error } = await supabase
      .from('navigation')
      .select('label, type, action, mega_key, display_order')
      .eq('is_hidden', false)
      .order('display_order');
    if (error) throw error;
    return (data ?? []) as NavItem[];
  },
  ['navigation-list'],
  { tags: [NAVIGATION_TAG] },
);

export const getNavigation = cache(async (): Promise<NavItem[]> => fetchNavigationCached());

const fetchMegaMenusCached = unstable_cache(
  async (): Promise<Record<string, MegaMenuSection[]>> => {
    const supabase = publicAnonClient();
    const { data, error } = await supabase
      .from('mega_menus')
      .select(`
        id, menu_key, section_heading, display_order,
        items:mega_menu_items(product_slug, label, display_order)
      `)
      .order('display_order');
    if (error) throw error;

    const grouped: Record<string, MegaMenuSection[]> = {};
    for (const row of (data ?? []) as any[]) {
      const menu = row.menu_key as string;
      if (!grouped[menu]) grouped[menu] = [];
      grouped[menu].push({
        id: row.id as string,
        menu_key: menu,
        section_heading: row.section_heading as string,
        display_order: row.display_order as number,
        items: ((row.items ?? []) as any[])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((i: any) => ({ product_slug: i.product_slug, label: i.label })),
      });
    }
    return grouped;
  },
  ['mega-menus'],
  { tags: [NAVIGATION_TAG] },
);

export const getMegaMenus = cache(async (): Promise<Record<string, MegaMenuSection[]>> => fetchMegaMenusCached());

export const getProductRoutes = cache(async (): Promise<ProductLookup> => {
  const supabase = createClient();
  const [printRes, giftRes] = await Promise.all([
    supabase
      .from('products')
      .select(`
        slug,
        category:categories!products_category_id_fkey(slug),
        subcategory:categories!products_subcategory_id_fkey(slug)
      `)
      .eq('is_active', true),
    supabase.from('gift_products').select('slug').eq('is_active', true),
  ]);

  const map: ProductLookup = {};
  for (const p of (printRes.data ?? []) as any[]) {
    const cat = Array.isArray(p.category) ? p.category[0] : p.category;
    const sub = Array.isArray(p.subcategory) ? p.subcategory[0] : p.subcategory;
    map[p.slug] = {
      kind: 'print',
      slug: p.slug,
      category_slug: cat?.slug ?? 'misc',
      subcategory_slug: sub?.slug ?? null,
    };
  }
  // Gift products override (in case a slug exists in both — gift wins now)
  for (const g of (giftRes.data ?? []) as any[]) {
    map[g.slug] = { kind: 'gift', slug: g.slug };
  }
  return map;
});
