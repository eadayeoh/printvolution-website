'use client';

// Structured form editor for the per-product "Tell us the job" IF/THEN
// matcher. Lets admins author the kicker, title, right-note, and any
// number of "need → pick" rows (5 is the sweet spot but not enforced).
// Toggle OFF to use the curated default baked into the component.

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type MatcherRow = {
  need?: string;
  pick_title?: string;
  pick_detail?: string;
  preset?: string;
  cta_label?: string;
};

export type MatcherValue = {
  kicker?: string;
  title?: string;
  title_em?: string;
  right_note_title?: string;
  right_note_body?: string;
  rows?: MatcherRow[];
};

const input =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-ink';
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500';

const BLANK: MatcherValue = {
  kicker: 'Quick guide',
  title: "Tell us the job,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'No wrong answer.',
  right_note_body: 'All jobs get printed on our presses, checked by our team.',
  rows: [
    { need: '', pick_title: '', pick_detail: '', cta_label: 'Use this' },
    { need: '', pick_title: '', pick_detail: '', cta_label: 'Use this' },
    { need: '', pick_title: '', pick_detail: '', cta_label: 'Use this' },
  ],
};

export function MatcherEditor({
  value,
  onChange,
}: {
  value: MatcherValue | null;
  onChange: (next: MatcherValue | null) => void;
}) {
  const [enabled, setEnabled] = useState(value != null);
  const [data, setData] = useState<MatcherValue>(value ?? BLANK);

  function commit(next: MatcherValue) {
    setData(next);
    if (enabled) onChange(next);
  }
  function toggle(on: boolean) {
    setEnabled(on);
    onChange(on ? data : null);
  }

  const rows = data.rows ?? [];

  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-ink">&quot;Tell us the job&quot; matcher</div>
          <p className="text-[11px] text-neutral-500">
            IF/THEN rows — admin-authored customer scenarios mapped to a recommended combo.
            Toggle OFF to fall back to the curated default.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold text-ink">
          <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} />
          Use custom content
        </label>
      </div>

      {enabled && (
        <div className="space-y-4">
          {/* Header block */}
          <div className="rounded border border-neutral-200 bg-white p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Header</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <span className={label}>Kicker</span>
                <input className={input} value={data.kicker ?? ''} onChange={(e) => commit({ ...data, kicker: e.target.value })} placeholder="Quick guide" />
              </div>
              <div>
                <span className={label}>Title (use \n for line break)</span>
                <input className={input} value={data.title ?? ''} onChange={(e) => commit({ ...data, title: e.target.value })} placeholder={"Tell us the job,\\nwe'll tell you"} />
              </div>
              <div>
                <span className={label}>Title — yellow highlighted tail</span>
                <input className={input} value={data.title_em ?? ''} onChange={(e) => commit({ ...data, title_em: e.target.value })} placeholder="the pick." />
              </div>
              <div>
                <span className={label}>Right-note title</span>
                <input className={input} value={data.right_note_title ?? ''} onChange={(e) => commit({ ...data, right_note_title: e.target.value })} placeholder="No wrong answer." />
              </div>
              <div className="md:col-span-2">
                <span className={label}>Right-note body</span>
                <input className={input} value={data.right_note_body ?? ''} onChange={(e) => commit({ ...data, right_note_body: e.target.value })} placeholder="All jobs get printed on our presses, checked by our team." />
              </div>
            </div>
          </div>

          {/* Rows */}
          {rows.map((r, ri) => (
            <div key={ri} className="rounded border border-neutral-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Row {ri + 1}</div>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...rows];
                    next.splice(ri, 1);
                    commit({ ...data, rows: next });
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <span className={label}>Need — use *word* for yellow highlight</span>
                  <input
                    className={input}
                    value={r.need ?? ''}
                    onChange={(e) => {
                      const next = [...rows];
                      next[ri] = { ...next[ri], need: e.target.value };
                      commit({ ...data, rows: next });
                    }}
                    placeholder="You need cards by *tomorrow*"
                  />
                </div>
                <div>
                  <span className={label}>Pick title</span>
                  <input
                    className={input}
                    value={r.pick_title ?? ''}
                    onChange={(e) => {
                      const next = [...rows];
                      next[ri] = { ...next[ri], pick_title: e.target.value };
                      commit({ ...data, rows: next });
                    }}
                    placeholder="Digital, Matt Art 300gsm"
                  />
                </div>
                <div>
                  <span className={label}>Pick detail</span>
                  <input
                    className={input}
                    value={r.pick_detail ?? ''}
                    onChange={(e) => {
                      const next = [...rows];
                      next[ri] = { ...next[ri], pick_detail: e.target.value };
                      commit({ ...data, rows: next });
                    }}
                    placeholder="From S$22 · same-day collection if before 4pm"
                  />
                </div>
                <div>
                  <span className={label}>CTA label</span>
                  <input
                    className={input}
                    value={r.cta_label ?? ''}
                    onChange={(e) => {
                      const next = [...rows];
                      next[ri] = { ...next[ri], cta_label: e.target.value };
                      commit({ ...data, rows: next });
                    }}
                    placeholder="Use this"
                  />
                </div>
                <div>
                  <span className={label}>Preset key (for future configurator pre-fill)</span>
                  <input
                    className={input}
                    value={r.preset ?? ''}
                    onChange={(e) => {
                      const next = [...rows];
                      next[ri] = { ...next[ri], preset: e.target.value };
                      commit({ ...data, rows: next });
                    }}
                    placeholder="digital-fast"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => commit({ ...data, rows: [...rows, { need: '', pick_title: '', pick_detail: '', cta_label: 'Use this' }] })}
            className="flex w-fit items-center gap-1 rounded border border-neutral-300 px-3 py-1.5 text-[11px] font-bold text-ink hover:border-ink"
          >
            <Plus size={12} /> Add row
          </button>
        </div>
      )}
    </div>
  );
}
