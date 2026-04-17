import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listAllTemplatesAdmin } from '@/lib/gifts/data';

export const dynamic = 'force-dynamic';

export default async function TemplatesListPage() {
  const templates = await listAllTemplatesAdmin();
  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/gifts" className="text-xs font-bold text-neutral-500 hover:text-ink">← Back to Gifts</Link>
          <h1 className="mt-2 text-2xl font-black text-ink">Gift Templates</h1>
          <p className="mt-1 text-sm text-neutral-500">Pre-designed layouts that customers can drop their photo into.</p>
        </div>
        <Link href="/admin/gifts/templates/new" className="inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark">
          <Plus size={14} /> New template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="text-2xl mb-2">🎨</div>
          <div className="text-sm font-bold text-ink">No templates yet</div>
          <div className="mt-1 text-xs text-neutral-500">Create one to use with gift products.</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {templates.map((t) => (
            <Link key={t.id} href={`/admin/gifts/templates/${t.id}`} className="block overflow-hidden rounded-lg border border-neutral-200 bg-white hover:border-pink">
              <div className="aspect-square overflow-hidden bg-neutral-100">
                {t.thumbnail_url ? (
                  <img src={t.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl text-neutral-300">🎨</div>
                )}
              </div>
              <div className="p-3">
                <div className="truncate text-sm font-bold text-ink">{t.name}</div>
                <div className="mt-1 flex items-center gap-2">
                  {t.is_active ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">Active</span>
                  ) : (
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-600">Inactive</span>
                  )}
                  <span className="text-[10px] text-neutral-500">{t.zones_json?.length || 0} zone{t.zones_json?.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
