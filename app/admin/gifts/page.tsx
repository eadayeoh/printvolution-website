import Link from 'next/link';
import { Plus, Gift as GiftIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { listAllGiftProductsAdmin } from '@/lib/gifts/data';
import { GiftsByCategory, type GiftRow } from '@/components/admin/gifts-by-category';

export const dynamic = 'force-dynamic';

export default async function AdminGiftsPage() {
  const [products, sb] = [await listAllGiftProductsAdmin(), createClient()];
  const { data: cats } = await sb
    .from('categories')
    .select('id, slug, name, parent_id, display_order');

  // Resolve each product's category to its top-level (so subcategory gifts
  // roll up under the parent section heading, matching the Categories admin).
  const catById = new Map<string, { id: string; slug: string; name: string; parent_id: string | null; display_order: number }>();
  for (const c of cats ?? []) catById.set(c.id, c as any);
  const topLevelFor = (id: string | null | undefined) => {
    let cur = id ? catById.get(id) : null;
    while (cur?.parent_id) cur = catById.get(cur.parent_id) ?? null;
    return cur ?? null;
  };

  const rows: GiftRow[] = products.map((p) => {
    const top = topLevelFor(p.category_id);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      mode: p.mode,
      is_active: p.is_active,
      base_price_cents: p.base_price_cents,
      thumbnail_url: p.thumbnail_url ?? null,
      first_ordered_at: (p as any).first_ordered_at ?? null,
      cat_slug: top?.slug ?? 'uncategorized',
      cat_name: top?.name ?? 'Uncategorised',
      cat_order: top?.display_order ?? 9999,
    };
  });

  // Build ordered category list with counts (only categories that have gifts)
  const catsMap = new Map<string, { slug: string; name: string; order: number; count: number }>();
  for (const r of rows) {
    if (!catsMap.has(r.cat_slug)) {
      catsMap.set(r.cat_slug, { slug: r.cat_slug, name: r.cat_name, order: r.cat_order, count: 0 });
    }
    catsMap.get(r.cat_slug)!.count++;
  }
  const categories = Array.from(catsMap.values()).sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name)
  );

  const active = products.filter((p) => p.is_active).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink">Gifts</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {products.length} product{products.length === 1 ? '' : 's'} · {active} active
          </p>
          <p className="mt-2 text-xs text-neutral-500 max-w-xl">
            Gifts are a separate flow from Print products. Customers upload a photo; the system processes it per mode (Laser, UV, Embroidery, or Photo Resize) and generates a low-res preview. Admins get the 300 DPI production file.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/gifts/pipelines"
            className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-ink hover:border-ink"
          >
            Pipelines →
          </Link>
          <Link
            href="/admin/gifts/prompts"
            className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-ink hover:border-ink"
          >
            Prompts →
          </Link>
          <Link
            href="/admin/gifts/templates"
            className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-ink hover:border-ink"
          >
            Templates →
          </Link>
          <Link
            href="/admin/gifts/occasions"
            className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-ink hover:border-ink"
          >
            Occasions →
          </Link>
          <Link
            href="/admin/gifts/new"
            className="inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark"
          >
            <Plus size={14} /> New gift product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="flex flex-col items-center px-4 py-20 text-center">
            <GiftIcon size={48} className="mb-3 text-neutral-300" />
            <div className="text-sm font-bold text-ink">No gift products yet</div>
            <div className="mt-1 max-w-sm text-xs text-neutral-500">
              Create your first gift product — pick a mode, set dimensions, and add pricing.
            </div>
            <Link
              href="/admin/gifts/new"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink px-5 py-2 text-xs font-bold text-white hover:bg-pink-dark"
            >
              <Plus size={14} /> Create gift product
            </Link>
          </div>
        </div>
      ) : (
        <GiftsByCategory products={rows} categories={categories} />
      )}
    </div>
  );
}
