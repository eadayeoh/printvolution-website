import { createClient } from '@/lib/supabase/server';
import { CategoriesEditor } from '@/components/admin/categories-editor';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const sb = createClient();

  const [{ data: cats }, { data: prints }, { data: gifts }] = await Promise.all([
    sb.from('categories').select('id, slug, name, parent_id, display_order').order('display_order').order('name'),
    sb.from('products').select('category_id, subcategory_id').eq('is_active', true),
    sb.from('gift_products').select('category_id'),
  ]);

  // Tally print + gift product counts per category id (direct + via subcategory)
  const printByCat = new Map<string, number>();
  const giftByCat = new Map<string, number>();
  for (const p of prints ?? []) {
    if (p.category_id) printByCat.set(p.category_id, (printByCat.get(p.category_id) ?? 0) + 1);
    if (p.subcategory_id) printByCat.set(p.subcategory_id, (printByCat.get(p.subcategory_id) ?? 0) + 1);
  }
  for (const g of gifts ?? []) {
    if (g.category_id) giftByCat.set(g.category_id, (giftByCat.get(g.category_id) ?? 0) + 1);
  }

  // Roll child counts up to the top-level parent so the top-level's kind
  // reflects everything under it.
  const rows = cats ?? [];
  const rollup = new Map<string, { print: number; gift: number }>();
  for (const c of rows) {
    const topId = c.parent_id ?? c.id;
    const acc = rollup.get(topId) ?? { print: 0, gift: 0 };
    acc.print += printByCat.get(c.id) ?? 0;
    acc.gift += giftByCat.get(c.id) ?? 0;
    rollup.set(topId, acc);
  }

  // Classify each top-level as 'service' | 'gift' | 'unassigned'
  const kindByTop = new Map<string, 'service' | 'gift' | 'unassigned'>();
  for (const c of rows) {
    if (c.parent_id) continue;
    const { print, gift } = rollup.get(c.id) ?? { print: 0, gift: 0 };
    kindByTop.set(c.id, print === 0 && gift === 0 ? 'unassigned' : print >= gift ? 'service' : 'gift');
  }

  // Attach kind to every row (subcategories inherit from their top-level parent)
  const initial = rows.map((c) => ({
    ...c,
    kind: kindByTop.get(c.parent_id ?? c.id) ?? 'unassigned',
  }));

  return <CategoriesEditor initial={initial as any} />;
}
