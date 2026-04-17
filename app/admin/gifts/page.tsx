import Link from 'next/link';
import { Plus, Gift as GiftIcon } from 'lucide-react';
import { listAllGiftProductsAdmin } from '@/lib/gifts/data';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';
import { formatSGD } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const MODE_COLORS: Record<string, string> = {
  'laser': 'bg-amber-100 text-amber-800',
  'uv': 'bg-blue-100 text-blue-800',
  'embroidery': 'bg-purple-100 text-purple-800',
  'photo-resize': 'bg-green-100 text-green-800',
};

export default async function AdminGiftsPage() {
  const products = await listAllGiftProductsAdmin();
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
            href="/admin/gifts/new"
            className="inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark"
          >
            <Plus size={14} /> New gift product
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="grid grid-cols-[80px_1fr_140px_100px_120px_100px] gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          <div>Image</div>
          <div>Name / Slug</div>
          <div>Mode</div>
          <div>Status</div>
          <div>Price from</div>
          <div>Actions</div>
        </div>
        {products.length === 0 ? (
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
        ) : (
          products.map((p) => (
            <div key={p.id} className="grid grid-cols-[80px_1fr_140px_100px_120px_100px] items-center gap-3 border-b border-neutral-100 px-4 py-3 text-sm">
              <div className="h-14 w-14 overflow-hidden rounded bg-neutral-100">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">🎁</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold text-ink">{p.name}</div>
                <div className="truncate text-[11px] text-neutral-500 font-mono">/gift/{p.slug}</div>
              </div>
              <div>
                <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${MODE_COLORS[p.mode] ?? 'bg-neutral-100 text-neutral-700'}`}>
                  {GIFT_MODE_LABEL[p.mode]}
                </span>
                {p.first_ordered_at && (
                  <span className="ml-1 text-[9px] text-neutral-400" title="Mode locked — product has been ordered">🔒</span>
                )}
              </div>
              <div>
                {p.is_active ? (
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Active</span>
                ) : (
                  <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">Inactive</span>
                )}
              </div>
              <div className="text-[11px] font-semibold text-ink">{formatSGD(p.base_price_cents)}</div>
              <div className="flex gap-2">
                <Link href={`/admin/gifts/${p.id}`} className="text-[11px] font-bold text-pink hover:underline">Edit</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
