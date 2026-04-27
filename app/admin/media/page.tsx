import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MediaLibraryManager } from '@/components/admin/media-library-manager';
import { listMediaWithUsage } from './actions';

export const metadata = { title: 'Media library' };
export const dynamic = 'force-dynamic';

export default async function MediaLibraryPage() {
  // Auth gate — match the pattern from other admin pages (layout catches most
  // cases but server actions are the real security boundary).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/admin/media');

  const result = await listMediaWithUsage();

  if (!result.ok) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-ink">Media library</h1>
          <p className="text-sm text-neutral-500">Images in the product-images bucket.</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load media library: {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">Media library</h1>
        <p className="text-sm text-neutral-500">
          All images in the <code className="rounded bg-neutral-100 px-1 text-xs">product-images</code> bucket.
          Orphans are not referenced by any product, variant, or setting.
        </p>
      </div>
      {result.warnings && result.warnings.length > 0 && (
        <div className="mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
          <div className="text-sm font-extrabold text-amber-900">
            ⚠ Scan incomplete — {result.warnings.length} table(s) failed.
            <span className="font-medium"> Do not bulk-delete until this is resolved — orphan list may be wrong.</span>
          </div>
          <ul className="mt-2 list-disc pl-5 text-xs text-amber-800">
            {result.warnings.map((w, i) => (
              <li key={i}>
                <code className="rounded bg-amber-100 px-1">{w.table}.{w.column}</code>: {w.error}
              </li>
            ))}
          </ul>
        </div>
      )}
      <MediaLibraryManager initialItems={result.items} />
    </div>
  );
}
