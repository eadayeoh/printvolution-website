'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, Plus, Upload } from 'lucide-react';
import { ImageUpload } from '@/components/admin/image-upload';
import { DraggableArea } from '@/components/admin/gift-variants-panel';
import { uploadProductImage } from '@/app/admin/upload/actions';
import { slugify } from '@/lib/utils';

const BULK_UPLOAD_CONCURRENCY = 4;

export type FigurineOption = {
  slug: string;
  name: string;
  image_url: string;
  price_delta_cents?: number;
};

export type FigurineArea = { x: number; y: number; width: number; height: number };

type Props = {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  value: FigurineOption[];
  onChange: (next: FigurineOption[]) => void;
  area: FigurineArea;
  onAreaChange: (next: FigurineArea) => void;
  productSlug: string;
  /** Product's mockup image — shown as the backdrop for the drag-area
   *  editor so admin can place the figurine visually. */
  mockupUrl?: string | null;
  productWidthMm: number;
  productHeightMm: number;
};

export function GiftFigurineOptionsEditor({
  enabled,
  onEnabledChange,
  value,
  onChange,
  area,
  onAreaChange,
  productSlug,
  mockupUrl,
  productWidthMm,
  productHeightMm,
}: Props) {
  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  function updateRow(i: number, patch: Partial<FigurineOption>) {
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeRow(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function addRow() {
    onChange([...value, { slug: '', name: '', image_url: '', price_delta_cents: 0 }]);
  }

  async function handleBulkFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const filesArr = Array.from(files);
    setBulkProgress({ done: 0, total: filesArr.length });

    // Assign slugs synchronously up front so a parallel race can't pick
    // the same baseSlug-2 twice for two files with the same stem.
    const taken = new Set(value.map((v) => v.slug).filter(Boolean));
    const tasks = filesArr.map((file) => {
      const stem = file.name.replace(/\.[^.]+$/, '');
      const name = stem.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 60);
      // Cap base at 36 so any -N suffix (up to 999) still fits in 40.
      const baseSlug = slugify(stem).slice(0, 36);
      let slug = baseSlug;
      for (let n = 2; taken.has(slug); n++) slug = `${baseSlug}-${n}`;
      taken.add(slug);
      return { file, name, slug };
    });

    const results: (FigurineOption | null)[] = new Array(tasks.length).fill(null);
    for (let i = 0; i < tasks.length; i += BULK_UPLOAD_CONCURRENCY) {
      const slice = tasks.slice(i, i + BULK_UPLOAD_CONCURRENCY);
      await Promise.all(slice.map(async ({ file, name, slug }, j) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('prefix', `figurine-${productSlug}`);
        try {
          const r = await uploadProductImage(fd);
          if (r?.ok && r.url) {
            results[i + j] = { slug, name, image_url: r.url, price_delta_cents: 0 };
          }
        } catch (e) {
          console.warn('[figurine bulk upload] failed', file.name, e);
        }
        if (mountedRef.current) {
          setBulkProgress((p) => p ? { ...p, done: p.done + 1 } : p);
        }
      }));
    }

    if (!mountedRef.current) return;
    const newRows = results.filter((r): r is FigurineOption => r !== null);
    if (newRows.length > 0) onChange([...value, ...newRows]);
    setBulkProgress(null);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
    const failed = filesArr.length - newRows.length;
    if (failed > 0) alert(`${failed} file${failed === 1 ? '' : 's'} failed to upload — check size + format and retry.`);
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-ink">Figurines — customer-pickable overlay</div>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Small decorative figures the customer picks one of. The selected figurine's PNG
            composites on top of the mockup at the area below. Use transparent PNGs.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          Enable figurines
        </label>
      </div>
      {enabled && (
        <>
          <div className="mb-4 rounded border border-dashed border-neutral-300 bg-neutral-50 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Figurine area on mockup — drag to position, drag the pink corner to resize
            </div>
            {mockupUrl ? (
              <DraggableArea
                mockupUrl={mockupUrl}
                area={area}
                productWidthMm={productWidthMm}
                productHeightMm={productHeightMm}
                onChange={onAreaChange}
              />
            ) : (
              <p className="text-[11px] text-neutral-500">
                Upload the product&apos;s fallback mockup (Design tab → Fallback mockup)
                first. That image becomes the backdrop you drag the figurine area on.
              </p>
            )}
          </div>

          {value.length === 0 ? (
            <p className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-xs text-neutral-500">
              No figurines yet. Click &quot;Add figurine&quot; below.
            </p>
          ) : (
            <div className="space-y-3">
              {value.map((row, i) => (
                <div key={i} className="rounded border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      Figurine {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_1fr_120px]">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Display name
                      </span>
                      <input
                        value={row.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const patch: Partial<FigurineOption> = { name };
                          if (!row.slug) {
                            patch.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
                          }
                          updateRow(i, patch);
                        }}
                        className={inputCls}
                        placeholder="Grazing Deer"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Slug
                      </span>
                      <input
                        value={row.slug}
                        onChange={(e) => updateRow(i, {
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40),
                        })}
                        className={`${inputCls} font-mono text-xs`}
                        placeholder="grazing-deer"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Price delta (S$)
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={((row.price_delta_cents ?? 0) / 100).toFixed(2)}
                        onChange={(e) => {
                          const dollars = parseFloat(e.target.value || '0');
                          const cents = Math.max(0, Math.round((Number.isFinite(dollars) ? dollars : 0) * 100));
                          updateRow(i, { price_delta_cents: cents });
                        }}
                        className={inputCls}
                        placeholder="0.00"
                      />
                    </label>
                  </div>
                  <div className="mt-3">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                      Figurine image (transparent PNG)
                    </span>
                    <ImageUpload
                      value={row.image_url}
                      onChange={(url) => updateRow(i, { image_url: url })}
                      prefix={`figurine-${productSlug}-${row.slug || i}`}
                      aspect={1}
                      size="sm"
                      label="Figurine"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded border-2 border-ink bg-white px-3 py-1.5 text-[11px] font-bold text-ink transition-all hover:bg-yellow"
            >
              <Plus size={12} /> Add figurine
            </button>
            <button
              type="button"
              onClick={() => bulkInputRef.current?.click()}
              disabled={bulkProgress !== null}
              className="inline-flex items-center gap-1 rounded border-2 border-pink bg-white px-3 py-1.5 text-[11px] font-bold text-pink transition-all hover:bg-pink hover:text-white disabled:opacity-50"
            >
              <Upload size={12} /> Bulk upload PNGs
            </button>
            <input
              ref={bulkInputRef}
              type="file"
              accept="image/png,image/webp,image/jpeg"
              multiple
              hidden
              onChange={(e) => handleBulkFiles(e.target.files)}
            />
            {bulkProgress && (
              <span className="text-[11px] text-neutral-600">
                Uploading {bulkProgress.done} / {bulkProgress.total}…
              </span>
            )}
            <span className="ml-auto text-[10px] text-neutral-400">
              File names become display names + slugs.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
