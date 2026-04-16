import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import type { NavItem, MegaMenuSection, ProductLookup } from './navigation-types';

export type { NavItem, MegaMenuSection, ProductLookup } from './navigation-types';
export { productHref } from './navigation-types';

export const getNavigation = cache(async (): Promise<NavItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('navigation')
    .select('label, type, action, mega_key, display_order')
    .eq('is_hidden', false)
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as NavItem[];
});

export const getMegaMenus = cache(async (): Promise<Record<string, MegaMenuSection[]>> => {
  const supabase = createClient();
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
});

export const getProductRoutes = cache(async (): Promise<ProductLookup> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select(`
      slug,
      category:categories!products_category_id_fkey(slug),
      subcategory:categories!products_subcategory_id_fkey(slug)
    `)
    .eq('is_active', true);
  const map: ProductLookup = {};
  for (const p of (data ?? []) as any[]) {
    const cat = Array.isArray(p.category) ? p.category[0] : p.category;
    const sub = Array.isArray(p.subcategory) ? p.subcategory[0] : p.subcategory;
    map[p.slug] = {
      slug: p.slug,
      category_slug: cat?.slug ?? 'misc',
      subcategory_slug: sub?.slug ?? null,
    };
  }
  return map;
});
