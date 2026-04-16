'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { importFromWordPress } from '@/app/admin/blog/actions';

export function BlogImportPanel() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [mirrorImages, setMirrorImages] = useState(true);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<null | {
    ok: boolean; imported: number; skipped: number; totalFound: number; errors: string[];
  }>(null);

  function runImport() {
    if (!url.trim()) return;
    setResult(null);
    startTransition(async () => {
      const r = await importFromWordPress(url.trim(), { mirrorImages, status });
      setResult(r);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-ink">Import from WordPress / WooCommerce</div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Paste your current site URL. We&apos;ll fetch all blog posts via the WordPress REST API (works for any WordPress or WooCommerce site where the REST API is public — the default).
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-old-site.com"
          className="rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none"
          disabled={isPending}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="rounded border-2 border-neutral-200 bg-white px-3 py-2 text-xs font-semibold"
          disabled={isPending}
        >
          <option value="published">Import as Published</option>
          <option value="draft">Import as Draft</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-neutral-700">
          <input
            type="checkbox"
            checked={mirrorImages}
            onChange={(e) => setMirrorImages(e.target.checked)}
            disabled={isPending}
          />
          Mirror images (recommended)
        </label>
        <button
          onClick={runImport}
          disabled={isPending || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-bold text-white hover:bg-ink-dark disabled:opacity-50"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {isPending ? 'Importing…' : 'Import'}
        </button>
      </div>

      <div className="mt-3 text-[11px] text-neutral-500">
        <strong>Mirror images</strong> downloads every featured image and inline image into our own storage, so if you later take down the old site, the images here keep working. Disable only if you want to finish faster and keep the old site online as the image host.
      </div>

      {isPending && (
        <div className="mt-4 flex items-center gap-2 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <Loader2 size={14} className="animate-spin" />
          Fetching and importing… this can take several minutes for large sites. Don&apos;t close this page.
        </div>
      )}

      {result && (
        <div className={`mt-4 rounded border p-3 text-xs ${result.ok && result.errors.length === 0 ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          <div className="mb-1 flex items-center gap-2 font-bold">
            {result.ok && result.errors.length === 0 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {result.ok ? 'Import finished' : 'Import failed'}
          </div>
          <div>
            Imported <strong>{result.imported}</strong> new post{result.imported === 1 ? '' : 's'}
            {result.skipped > 0 && <> · Skipped <strong>{result.skipped}</strong> (already imported)</>}
            {result.totalFound > 0 && <> · WP reports <strong>{result.totalFound}</strong> total</>}
          </div>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-bold">{result.errors.length} warning{result.errors.length === 1 ? '' : 's'}</summary>
              <ul className="mt-1 list-disc pl-5">
                {result.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
                {result.errors.length > 20 && <li>…and {result.errors.length - 20} more</li>}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
