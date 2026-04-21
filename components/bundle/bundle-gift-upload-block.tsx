'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadAndPreviewGift } from '@/app/(site)/gift/actions';
import { GiftMockupPreview } from '@/components/gift/gift-mockup-preview';
import type { BundleGiftComponent } from '@/lib/data/bundles';

export type UploadState = {
  sourceAssetId: string | null;
  previewAssetId: string | null;
  previewUrl: string | null;
};

export function BundleGiftUploadBlock({
  component,
  index,
  onChange,
}: {
  component: BundleGiftComponent;
  index: number;
  onChange: (state: UploadState) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>({
    sourceAssetId: null,
    previewAssetId: null,
    previewUrl: null,
  });

  async function handleFile(file: File) {
    if (file.size === 0) { setErr('Empty file'); return; }
    if (file.size > 20 * 1024 * 1024) { setErr('File too large (max 20 MB)'); return; }
    setErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('product_slug', component.gift_product_slug);
    if (component.prompt_id) fd.append('prompt_id', component.prompt_id);
    if (component.template_id) fd.append('template_id', component.template_id);

    try {
      const r = await uploadAndPreviewGift(fd);
      if (!r || typeof r !== 'object') {
        setErr('Server returned no response. Please try again.');
      } else if (r.ok) {
        const next = {
          sourceAssetId: r.sourceAssetId,
          previewAssetId: r.previewAssetId,
          previewUrl: r.previewUrl,
        };
        setState(next);
        onChange(next);
      } else {
        setErr(('error' in r && r.error) ? String(r.error) : 'Upload failed');
      }
    } catch (e: any) {
      setErr(e?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const hasMockup = !!(component.variant_mockup_url && component.variant_mockup_area);

  return (
    <div className="rounded-lg border-2 border-ink bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-pink">Item {index + 1}</div>
          <div className="text-lg font-black text-ink">{component.gift_product_name}</div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {component.variant_name && <>Base: <strong>{component.variant_name}</strong> · </>}
            {component.prompt_name && <>Style: <strong>{component.prompt_name}</strong> · </>}
            Qty: <strong>{component.override_qty}</strong>
          </div>
        </div>
        {state.previewUrl && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700">
            <CheckCircle2 size={12} /> Ready
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_200px]">
        <div>
          <label className="block cursor-pointer rounded border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center transition hover:border-pink hover:bg-pink/5">
            <Upload size={20} className="mx-auto text-neutral-400" />
            <div className="mt-2 text-sm font-bold text-ink">
              {state.previewUrl ? 'Replace photo' : 'Upload your photo for this item'}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">
              JPG or PNG · min {component.min_source_px} px · max 20 MB
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
          </label>
          {err && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle size={12} /> {err}
            </div>
          )}
          {uploading && (
            <div className="mt-2 flex items-center gap-1 text-xs text-neutral-600">
              <Loader2 size={12} className="animate-spin" /> Uploading + stylising…
            </div>
          )}
        </div>

        <div>
          {state.previewUrl ? (
            hasMockup ? (
              <GiftMockupPreview
                mockupUrl={component.variant_mockup_url!}
                previewUrl={state.previewUrl}
                area={component.variant_mockup_area!}
              />
            ) : (
              <img src={state.previewUrl} alt="Preview" className="w-full border-2 border-ink object-contain" />
            )
          ) : (
            <div className="flex aspect-square items-center justify-center border-2 border-dashed border-neutral-200 text-xs text-neutral-400">
              Preview appears here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
