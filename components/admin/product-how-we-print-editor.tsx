'use client';

// Structured form editor for the per-product "How we print" cards.
// 4 slots (configurable), each with either an emoji/glyph OR an uploaded
// image, plus title and short description. Toggle OFF to fall back to
// the site-wide Site Settings product features.

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { ImageUpload } from './image-upload';

export type HowWePrintCard = {
  emoji?: string;
  icon_url?: string;
  title: string;
  desc: string;
};

export type HowWePrintValue = HowWePrintCard[];

const input =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-ink';
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500';

export function HowWePrintEditor({
  value,
  onChange,
  productSlug,
}: {
  value: HowWePrintValue | null;
  onChange: (next: HowWePrintValue | null) => void;
  productSlug: string;
}) {
  const [enabled, setEnabled] = useState(value != null && value.length > 0);
  const [cards, setCards] = useState<HowWePrintCard[]>(
    value && value.length > 0
      ? value
      : [
          { emoji: '✓', title: '', desc: '' },
          { emoji: '🖼', title: '', desc: '' },
          { emoji: '🚚', title: '', desc: '' },
          { emoji: '⚡', title: '', desc: '' },
        ],
  );

  function commit(next: HowWePrintCard[]) {
    setCards(next);
    if (enabled) onChange(next);
  }
  function toggle(on: boolean) {
    setEnabled(on);
    onChange(on ? cards : null);
  }

  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-ink">&quot;How we print&quot; — 4 cards</div>
          <p className="text-[11px] text-neutral-500">
            Card band shown between the configurator and the Paper Chooser on this product&apos;s page.
            Either upload an image or use an emoji / glyph as the icon. Toggle OFF to fall back to the
            default from <a className="font-bold text-pink underline" href="/admin/settings">Site Settings</a>.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold text-ink">
          <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} />
          Custom for this product
        </label>
      </div>

      {enabled && (
        <div className="space-y-3">
          {cards.map((c, i) => (
            <div key={i} className="rounded border border-neutral-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                  Card {i + 1}
                </div>
                <button type="button" className="text-[11px] font-bold text-red-600 hover:underline" onClick={() => {
                  commit(cards.filter((_, j) => j !== i));
                }}>Remove card</button>
              </div>

              <div className="grid gap-3 md:grid-cols-[140px_1fr]">
                <div>
                  <span className={label}>Image (optional)</span>
                  <ImageUpload
                    value={c.icon_url ?? ''}
                    onChange={(url) => {
                      const next = [...cards];
                      next[i] = { ...next[i], icon_url: url };
                      commit(next);
                    }}
                    prefix={`hwp-${productSlug}-${i}`}
                    aspect={1}
                    size="sm"
                    label="Icon"
                  />
                  <p className="mt-1 text-[10px] text-neutral-500">Square. Leave empty to use the emoji below.</p>
                </div>
                <div className="grid gap-2">
                  <div>
                    <span className={label}>Emoji / glyph (used when no image)</span>
                    <input className={input} style={{ maxWidth: 120 }} value={c.emoji ?? ''} onChange={(e) => {
                      const next = [...cards];
                      next[i] = { ...next[i], emoji: e.target.value };
                      commit(next);
                    }} placeholder="✓" />
                  </div>
                  <div>
                    <span className={label}>Title</span>
                    <input className={input} value={c.title ?? ''} onChange={(e) => {
                      const next = [...cards];
                      next[i] = { ...next[i], title: e.target.value };
                      commit(next);
                    }} placeholder="Pre-press file check" />
                  </div>
                  <div>
                    <span className={label}>Description</span>
                    <textarea rows={2} className={input} value={c.desc ?? ''} onChange={(e) => {
                      const next = [...cards];
                      next[i] = { ...next[i], desc: e.target.value };
                      commit(next);
                    }} placeholder="We inspect every file before it hits the printer." />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="flex w-fit items-center gap-1 rounded border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-ink hover:border-ink" onClick={() => {
            commit([...cards, { emoji: '✓', title: '', desc: '' }]);
          }}><Plus size={14} /> Add card</button>
        </div>
      )}
    </div>
  );
}
