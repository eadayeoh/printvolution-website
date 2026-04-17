import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listAllPromptsAdmin } from '@/lib/gifts/prompts';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';

export const dynamic = 'force-dynamic';

const MODE_COLORS: Record<string, string> = {
  'laser': 'bg-amber-100 text-amber-800 border-amber-300',
  'uv': 'bg-blue-100 text-blue-800 border-blue-300',
  'embroidery': 'bg-purple-100 text-purple-800 border-purple-300',
};

export default async function PromptsListPage() {
  const all = await listAllPromptsAdmin();
  const byMode: Record<string, typeof all> = {
    laser: all.filter((p) => p.mode === 'laser'),
    uv: all.filter((p) => p.mode === 'uv'),
    embroidery: all.filter((p) => p.mode === 'embroidery'),
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/gifts" className="text-xs font-bold text-neutral-500 hover:text-ink">← Back to Gifts</Link>
          <h1 className="mt-2 text-2xl font-black text-ink">Transformation Prompts</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Prompts live per production method. If a mode has <strong>2 or more active prompts</strong>, customers pick one (with thumbnails).
            If only 1, it&apos;s used automatically. Admin controls everything customers see — they never read the raw prompt.
          </p>
        </div>
        <Link
          href="/admin/gifts/prompts/new"
          className="inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark"
        >
          <Plus size={14} /> New prompt
        </Link>
      </div>

      <div className="space-y-8">
        {(['laser', 'uv', 'embroidery'] as const).map((mode) => {
          const list = byMode[mode];
          return (
            <section key={mode}>
              <div className="mb-3 flex items-center gap-3">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${MODE_COLORS[mode]}`}>
                  {GIFT_MODE_LABEL[mode]}
                </span>
                <span className="text-[11px] text-neutral-500">
                  {list.length} prompt{list.length === 1 ? '' : 's'}
                  {list.filter((p) => p.is_active).length >= 2 && ' · customer picker visible'}
                  {list.filter((p) => p.is_active).length === 1 && ' · auto-applied'}
                  {list.filter((p) => p.is_active).length === 0 && ' · no customer-visible prompts'}
                </span>
              </div>
              {list.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-xs text-neutral-500">
                  No prompts for {GIFT_MODE_LABEL[mode]} yet. <Link href={`/admin/gifts/prompts/new?mode=${mode}`} className="font-bold text-pink">Create one</Link>.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {list.map((p) => (
                    <Link key={p.id} href={`/admin/gifts/prompts/${p.id}`} className="overflow-hidden rounded-lg border border-neutral-200 bg-white hover:border-pink">
                      <div className="aspect-square overflow-hidden bg-neutral-100">
                        {p.thumbnail_url ? (
                          <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl text-neutral-300">✨</div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="truncate text-sm font-bold text-ink">{p.name}</div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Order {p.display_order}</span>
                          {p.is_active ? (
                            <span className="inline-flex rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">Active</span>
                          ) : (
                            <span className="inline-flex rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold text-neutral-600">Hidden</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
