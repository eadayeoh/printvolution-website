'use client';

import { useState, useTransition } from 'react';
import { Download, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { signGiftAssetUrl, rerunGiftProduction } from '@/app/admin/gifts/actions';
import { formatSGD } from '@/lib/utils';
import { GIFT_MODE_LABEL, giftItemDisplayName } from '@/lib/gifts/types';

type Asset = { id: string; bucket: string; path: string; mime_type: string | null; width_px?: number | null; height_px?: number | null; dpi?: number | null } | null;

type Props = {
  line: {
    id: string;
    qty: number;
    unit_price_cents: number;
    line_total_cents: number;
    mode: string;
    product_name_snapshot: string | null;
    production_status: 'pending' | 'processing' | 'ready' | 'failed';
    production_error: string | null;
    admin_notes: string | null;
    gift_product: { id: string; slug: string; name: string; thumbnail_url: string | null } | null;
    source: Asset;
    preview: Asset;
    production: Asset;
    production_pdf: Asset;
  };
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-neutral-100 text-neutral-700',
  processing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

function publicPreviewUrl(bucket: string, path: string): string {
  // `NEXT_PUBLIC_SUPABASE_URL` is available client-side. The public bucket
  // URL format is: <url>/storage/v1/object/public/<bucket>/<path>.
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/storage/v1/object/public/${bucket}/${encodeURIComponent(path)}`;
}

export function GiftOrderLine({ line }: Props) {
  const [isPending, startTransition] = useTransition();
  const [rerunFlash, setRerunFlash] = useState<string | null>(null);

  async function openSigned(assetId: string | undefined) {
    if (!assetId) return;
    const r = await signGiftAssetUrl(assetId, 300);
    if (r.ok && r.url) window.open(r.url, '_blank');
    else alert(r.error || 'Could not open asset');
  }

  function rerun() {
    setRerunFlash(null);
    startTransition(async () => {
      const r = await rerunGiftProduction(line.id);
      if (r.ok) setRerunFlash('Started. Refresh in ~10s to see result.');
      else setRerunFlash(`Failed: ${r.error}`);
    });
  }

  return (
    <div className="rounded-lg border-2 border-pink/20 bg-pink/5 p-4">
      <div className="flex gap-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
          {line.gift_product?.thumbnail_url ? (
            <img src={line.gift_product.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">🎁</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-ink">
                {giftItemDisplayName(line)}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-pink/10 px-2 py-0.5 text-[10px] font-bold text-pink">
                  GIFT · {GIFT_MODE_LABEL[line.mode as keyof typeof GIFT_MODE_LABEL]}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[line.production_status]}`}>
                  {line.production_status === 'pending' && 'Queued'}
                  {line.production_status === 'processing' && <><Loader2 size={10} className="mr-1 inline animate-spin" />Processing</>}
                  {line.production_status === 'ready' && <><CheckCircle2 size={10} className="mr-1 inline" />Ready</>}
                  {line.production_status === 'failed' && <><AlertCircle size={10} className="mr-1 inline" />Failed</>}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-pink">{formatSGD(line.line_total_cents)}</div>
              <div className="text-[10px] text-neutral-400">qty {line.qty} × {formatSGD(line.unit_price_cents)}</div>
            </div>
          </div>

          {/* Preview + assets */}
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {/* Preview (what the customer saw) — bucket is public so the
                URL can be computed directly from the storage base. */}
            <div className="rounded border border-neutral-200 bg-white p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-500">Customer preview</div>
              {line.preview ? (
                <a
                  href={publicPreviewUrl(line.preview.bucket, line.preview.path)}
                  target="_blank"
                  rel="noopener"
                  className="block overflow-hidden rounded bg-neutral-100 transition-opacity hover:opacity-85"
                >
                  <img
                    src={publicPreviewUrl(line.preview.bucket, line.preview.path)}
                    alt="Customer preview"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }}
                  />
                </a>
              ) : (
                <div className="text-[11px] italic text-neutral-400">No preview generated yet</div>
              )}
            </div>

            {/* Production (admin-only) */}
            <div className="rounded border border-neutral-200 bg-white p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-500">Production files</div>
              {line.production_status === 'ready' ? (
                <div className="space-y-1">
                  {line.production && (
                    <button
                      type="button"
                      onClick={() => openSigned(line.production?.id)}
                      className="inline-flex w-full items-center justify-between gap-1 rounded border border-neutral-200 px-2 py-1.5 text-[11px] font-bold text-ink hover:border-pink"
                    >
                      <span className="flex items-center gap-1"><Download size={11} /> 300 DPI raster</span>
                      {line.production.width_px && line.production.height_px && (
                        <span className="text-neutral-400">{line.production.width_px}×{line.production.height_px}</span>
                      )}
                    </button>
                  )}
                  {line.production_pdf && (
                    <button
                      type="button"
                      onClick={() => openSigned(line.production_pdf?.id)}
                      className="inline-flex w-full items-center gap-1 rounded border border-neutral-200 px-2 py-1.5 text-[11px] font-bold text-ink hover:border-pink"
                    >
                      <Download size={11} /> Production PDF
                    </button>
                  )}
                </div>
              ) : line.production_status === 'failed' ? (
                <div className="space-y-2">
                  <div className="rounded bg-red-50 p-2 text-[11px] text-red-800">
                    {line.production_error ?? 'Production failed with no message'}
                  </div>
                  <button type="button" onClick={rerun} disabled={isPending} className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[10px] font-bold text-white hover:bg-pink">
                    {isPending ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                    Retry
                  </button>
                </div>
              ) : line.production_status === 'processing' ? (
                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <Loader2 size={12} className="animate-spin" /> Generating 300 DPI output…
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
                  <span>Not started</span>
                  <button type="button" onClick={rerun} disabled={isPending} className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[10px] font-bold text-white hover:bg-pink">
                    {isPending ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                    Start now
                  </button>
                </div>
              )}
              {rerunFlash && <div className="mt-2 text-[10px] text-neutral-500">{rerunFlash}</div>}
            </div>
          </div>

          {/* Source + admin notes */}
          <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-500">
            {line.source && (
              <button type="button" onClick={() => openSigned(line.source?.id)} className="font-bold text-pink hover:underline">
                Download original source
              </button>
            )}
            {line.admin_notes && <span>· Notes: {line.admin_notes}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
