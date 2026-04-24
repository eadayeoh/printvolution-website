'use client';

import { Trash2, Plus } from 'lucide-react';
import type { ShapeOption, ShapeKind } from '@/lib/gifts/shape-options';
import type { GiftTemplate } from '@/lib/gifts/types';

const KIND_META: Record<ShapeKind, { icon: string; defaultLabel: string }> = {
  cutout:    { icon: '◐', defaultLabel: 'Follow my photo' },
  rectangle: { icon: '▭', defaultLabel: 'Full photo' },
  template:  { icon: '▦', defaultLabel: 'Pick a design' },
};

type Props = {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  value: ShapeOption[];
  onChange: (next: ShapeOption[]) => void;
  allTemplates: GiftTemplate[];
};

export function GiftShapeOptionsEditor({
  enabled, onEnabledChange, value, onChange, allTemplates,
}: Props) {
  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
  const usedKinds = new Set(value.map((v) => v.kind));
  const addableKinds = (['cutout', 'rectangle', 'template'] as ShapeKind[])
    .filter((k) => !usedKinds.has(k));

  function updateRow(i: number, patch: Partial<ShapeOption>) {
    onChange(value.map((row, idx) => (idx === i ? ({ ...row, ...patch } as ShapeOption) : row)));
  }
  function removeRow(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function addRow(kind: ShapeKind) {
    const base = { kind, label: KIND_META[kind].defaultLabel, price_delta_cents: 0 };
    const row: ShapeOption = kind === 'template'
      ? { ...base, kind, template_ids: [] }
      : { ...base, kind };
    onChange([...value, row]);
  }
  function moveRow(i: number, dir: -1 | 1) {
    const next = [...value];
    const tgt = i + dir;
    if (tgt < 0 || tgt >= next.length) return;
    [next[i], next[tgt]] = [next[tgt], next[i]];
    onChange(next);
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-ink">Shape options — customer-pickable</div>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Let the customer pick cutout / rectangle / template after uploading. Off = no picker.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          Enable picker
        </label>
      </div>
      {enabled && (
        <>
          {value.length === 0 ? (
            <p className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-xs text-neutral-500">
              No shapes yet. Click &quot;Add shape&quot; below.
            </p>
          ) : (
            <div className="space-y-3">
              {value.map((row, i) => (
                <div
                  key={`${row.kind}-${i}`}
                  className="rounded border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      {KIND_META[row.kind].icon} {row.kind}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveRow(i, -1)}
                        disabled={i === 0}
                        className="rounded border px-2 py-1 text-[10px] font-bold disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRow(i, 1)}
                        disabled={i === value.length - 1}
                        className="rounded border px-2 py-1 text-[10px] font-bold disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_140px]">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Customer label
                      </span>
                      <input
                        value={row.label}
                        onChange={(e) => updateRow(i, { label: e.target.value })}
                        className={inputCls}
                        placeholder={KIND_META[row.kind].defaultLabel}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Price delta (cents)
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={row.price_delta_cents ?? 0}
                        onChange={(e) => updateRow(i, { price_delta_cents: parseInt(e.target.value || '0', 10) })}
                        className={inputCls}
                      />
                    </label>
                  </div>
                  {row.kind === 'template' && (
                    <div className="mt-3">
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Templates (tick to include)
                      </div>
                      {allTemplates.length === 0 ? (
                        <p className="text-[11px] text-neutral-500">
                          No templates exist yet. Create them under Gifts → Templates.
                        </p>
                      ) : (
                        <div className="grid gap-1 md:grid-cols-2">
                          {allTemplates.map((t) => {
                            const ticked = row.template_ids.includes(t.id);
                            return (
                              <label
                                key={t.id}
                                className="flex items-center gap-2 rounded border border-neutral-200 bg-white px-2 py-1 text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={ticked}
                                  onChange={(e) => {
                                    const cur = new Set(row.template_ids);
                                    if (e.target.checked) cur.add(t.id);
                                    else cur.delete(t.id);
                                    updateRow(i, { template_ids: Array.from(cur) } as Partial<ShapeOption>);
                                  }}
                                />
                                {t.name}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {addableKinds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {addableKinds.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => addRow(k)}
                  className="inline-flex items-center gap-1 rounded border-2 border-ink bg-white px-3 py-1.5 text-[11px] font-bold text-ink transition-all hover:bg-yellow"
                >
                  <Plus size={12} /> Add {KIND_META[k].icon} {k}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
