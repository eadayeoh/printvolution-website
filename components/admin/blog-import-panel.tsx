'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2, FileCode } from 'lucide-react';
import { importFromWordPress, importFromWxr } from '@/app/admin/blog/actions';

type ImportResult = {
  ok: boolean; imported: number; skipped: number; totalFound: number; errors: string[];
};

export function BlogImportPanel() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'url' | 'xml'>('xml');
  const [url, setUrl] = useState('');
  const [mirrorImages, setMirrorImages] = useState(true);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  function runUrl() {
    if (!url.trim()) return;
    setResult(null);
    startTransition(async () => {
      const r = await importFromWordPress(url.trim(), { mirrorImages, status });
      setResult(r);
      router.refresh();
    });
  }

  function onFilePicked(file: File) {
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    startTransition(async () => {
      const r = await importFromWxr(fd, { status });
      setResult(r);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-3">
        <div className="text-sm font-bold text-ink">Import from WordPress</div>
        <div className="mt-1 text-[11px] text-neutral-500">
          Two ways to bring over your old posts. <strong>XML file</strong> is the official WordPress way — works even if the old site is offline or the REST API is locked down.
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mb-4 flex rounded-full border border-neutral-200 bg-neutral-50 p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMode('xml')}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 transition-colors ${mode === 'xml' ? 'bg-ink text-white' : 'text-neutral-500 hover:text-ink'}`}
        >
          <FileCode size={13} /> XML file (recommended)
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 transition-colors ${mode === 'url' ? 'bg-ink text-white' : 'text-neutral-500 hover:text-ink'}`}
        >
          <Download size={13} /> Live URL (scrape via API)
        </button>
      </div>

      {/* XML mode */}
      {mode === 'xml' && (
        <div>
          <ol className="mb-3 space-y-1 rounded bg-neutral-50 p-3 text-[11px] text-neutral-700">
            <li><strong>1.</strong> Log into your old WordPress admin.</li>
            <li><strong>2.</strong> Go to <strong>Tools → Export</strong>.</li>
            <li><strong>3.</strong> Pick &quot;Posts&quot; (or &quot;All content&quot;), click <strong>Download Export File</strong>.</li>
            <li><strong>4.</strong> Upload the .xml file below.</li>
          </ol>

          <input
            ref={fileRef}
            type="file"
            accept=".xml,application/xml,text/xml"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFilePicked(f);
              e.target.value = '';
            }}
          />

          <div className="grid gap-3 md:grid-cols-[200px_auto]">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="rounded border-2 border-neutral-200 bg-white px-3 py-2 text-xs font-semibold"
              disabled={isPending}
            >
              <option value="published">Import as Published</option>
              <option value="draft">Import as Draft</option>
            </select>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pink px-5 py-2 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {isPending ? 'Importing…' : 'Upload WordPress XML'}
            </button>
          </div>
        </div>
      )}

      {/* URL mode (legacy) */}
      {mode === 'url' && (
        <div>
          <div className="mb-2 text-[11px] text-neutral-500">
            We&apos;ll hit <code className="rounded bg-neutral-100 px-1 py-0.5">https://yoursite.com/wp-json/wp/v2/posts</code> and import everything we can see.
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
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
            <button
              onClick={runUrl}
              disabled={isPending || !url.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-bold text-white hover:bg-ink-dark disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {isPending ? 'Importing…' : 'Import'}
            </button>
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-neutral-700">
            <input type="checkbox" checked={mirrorImages} onChange={(e) => setMirrorImages(e.target.checked)} disabled={isPending} />
            Mirror images into our storage (recommended — old site could go offline)
          </label>
        </div>
      )}

      {isPending && (
        <div className="mt-4 flex items-center gap-2 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <Loader2 size={14} className="animate-spin" />
          Importing… this can take a few minutes for large sites. Don&apos;t close this page.
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
            {result.totalFound > 0 && <> · Source reports <strong>{result.totalFound}</strong> total</>}
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
