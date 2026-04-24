'use client';

import { Trash2, Plus } from 'lucide-react';
import { ImageUpload } from '@/components/admin/image-upload';

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
};

export function GiftFigurineOptionsEditor({
  enabled,
  onEnabledChange,
  value,
  onChange,
  area,
  onAreaChange,
  productSlug,
}: Props) {
  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

  function updateRow(i: number, patch: Partial<FigurineOption>) {
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeRow(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function addRow() {
    onChange([...value, { slug: '', name: '', image_url: '', price_delta_cents: 0 }]);
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
              Figurine area on mockup (% of image)
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['x', 'y', 'width', 'height'] as const).map((field) => (
                <label key={field} className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
                    {field} %
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={area[field]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value || '0');
                      onAreaChange({ ...area, [field]: Number.isFinite(v) ? v : 0 });
                    }}
                    className={inputCls}
                  />
                </label>
              ))}
            </div>
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
          <div className="mt-3">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded border-2 border-ink bg-white px-3 py-1.5 text-[11px] font-bold text-ink transition-all hover:bg-yellow"
            >
              <Plus size={12} /> Add figurine
            </button>
          </div>
        </>
      )}
    </div>
  );
}
