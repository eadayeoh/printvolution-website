/** Types shared between client and server nav components. */
export type NavItem = {
  label: string | null;
  type: 'link' | 'dropdown' | 'sep';
  action: string | null;
  mega_key: string | null;
  display_order: number;
};

export type MegaMenuSection = {
  id: string;
  menu_key: string;
  section_heading: string;
  display_order: number;
  items: Array<{ product_slug: string; label: string }>;
};

export type ProductLookup = Record<string, { slug: string; category_slug: string; subcategory_slug: string | null }>;

/** Build the URL for a product given its slug. Falls back to /shop if not found. */
export function productHref(slug: string, lookup: ProductLookup): string {
  const p = lookup[slug];
  if (!p) return '/shop';
  if (p.subcategory_slug) {
    const bare = p.subcategory_slug.replace(new RegExp(`^${p.category_slug}-`), '');
    return `/product/${p.category_slug}/${bare}/${p.slug}`;
  }
  return `/product/${p.category_slug}/${p.slug}`;
}
