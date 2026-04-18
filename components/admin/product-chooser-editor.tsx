'use client';

// Structured form editor for the per-product "Find your perfect X" chooser.
// No JSON — every field is a real input. Admin-friendly.

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

export type ChooserChoice = { val?: string; primary?: string; sub?: string };
export type ChooserQuestion = { num?: string; title?: string; choices?: ChooserChoice[] };
export type ChooserSpec = { k?: string; v?: string };
export type ChooserCombo = {
  tag?: string;
  match?: string;
  title?: string;
  /** Preferred: map of configurator step_id -> option_slug (or raw value for
   *  qty/number/text step types). The chooser component resolves these to
   *  labels at render time by looking up the product's configurator. */
  picks?: Record<string, string>;
  /** Legacy free-text specs. Still supported as a fallback if picks is empty. */
  specs?: ChooserSpec[];
  why?: string;
  price?: string;
  cta_label?: string;
  recommended?: boolean;
};
export type ChooserValue = {
  kicker?: string;
  title?: string;
  title_em?: string;
  intro?: string;
  questions?: ChooserQuestion[];
  combos?: ChooserCombo[];
};

/** Minimal shape of a configurator step we need to build dropdowns + labels. */
export type ConfiguratorStepMin = {
  step_id: string;
  label: string;
  type: string;
  options?: Array<{ slug: string; label: string }>;
};

const input =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-ink';
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500';

export function ChooserEditor({
  value,
  onChange,
  configurator,
}: {
  value: ChooserValue | null;
  onChange: (next: ChooserValue | null) => void;
  /** Product's configurator steps — drives the per-combo dropdowns so
   *  admin picks from real options instead of typing spec labels. */
  configurator?: ConfiguratorStepMin[];
}) {
  const [enabled, setEnabled] = useState(value != null);
  const [data, setData] = useState<ChooserValue>(
    value ?? {
      kicker: 'Not sure which option?',
      title: '',
      title_em: 'in 30 seconds.',
      intro: "Answer three quick questions — we'll recommend three combos that fit.",
      questions: [
        { num: 'Q 01', title: '', choices: [{ primary: '' }, { primary: '' }, { primary: '' }] },
        { num: 'Q 02', title: '', choices: [{ primary: '' }, { primary: '' }, { primary: '' }] },
        { num: 'Q 03', title: '', choices: [{ primary: '' }, { primary: '' }, { primary: '' }] },
      ],
      combos: [
        { tag: 'Safe Bet', match: '88% match', title: 'The Classic.', picks: {}, why: '', price: 'Live pricing', cta_label: 'Use this combo' },
        { tag: '★ Recommended', match: '96% match', title: 'The Sweet Spot.', picks: {}, why: '', price: 'Live pricing', cta_label: 'Use this combo', recommended: true },
        { tag: 'Step Up', match: '82% match', title: 'The Statement.', picks: {}, why: '', price: 'Live pricing', cta_label: 'Use this combo' },
      ],
    },
  );

  function commit(next: ChooserValue) {
    setData(next);
    if (enabled) onChange(next);
  }

  function toggle(on: boolean) {
    setEnabled(on);
    onChange(on ? data : null);
  }

  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-ink">Paper Chooser — &quot;Find your perfect …&quot; widget</div>
          <p className="text-[11px] text-neutral-500">
            3 questions with 3 answer options each, and 3 combo recommendations. Toggle OFF to use the
            auto-generated default (product name + configurator).
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold text-ink">
          <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} />
          Use custom content
        </label>
      </div>

      {enabled && (
        <div className="space-y-4">
          {/* Header ------------------------------------------------------- */}
          <div className="rounded border border-neutral-200 bg-white p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Header</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <span className={label}>Kicker (small label)</span>
                <input className={input} value={data.kicker ?? ''} onChange={(e) => commit({ ...data, kicker: e.target.value })} />
              </div>
              <div>
                <span className={label}>Title</span>
                <input className={input} value={data.title ?? ''} onChange={(e) => commit({ ...data, title: e.target.value })} placeholder="Find your perfect card" />
              </div>
              <div>
                <span className={label}>Title — yellow highlighted bit</span>
                <input className={input} value={data.title_em ?? ''} onChange={(e) => commit({ ...data, title_em: e.target.value })} placeholder="in 30 seconds." />
              </div>
              <div>
                <span className={label}>Intro line</span>
                <input className={input} value={data.intro ?? ''} onChange={(e) => commit({ ...data, intro: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Questions ---------------------------------------------------- */}
          {(data.questions ?? []).map((q, qi) => (
            <div key={qi} className="rounded border border-neutral-200 bg-white p-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                Question {qi + 1}
              </div>
              <div className="grid gap-3 md:grid-cols-[100px_1fr]">
                <div>
                  <span className={label}>Number label</span>
                  <input className={input} value={q.num ?? ''} onChange={(e) => {
                    const qs = [...(data.questions ?? [])];
                    qs[qi] = { ...qs[qi], num: e.target.value };
                    commit({ ...data, questions: qs });
                  }} />
                </div>
                <div>
                  <span className={label}>Question text</span>
                  <input className={input} value={q.title ?? ''} onChange={(e) => {
                    const qs = [...(data.questions ?? [])];
                    qs[qi] = { ...qs[qi], title: e.target.value };
                    commit({ ...data, questions: qs });
                  }} placeholder="How many cards do you need?" />
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <span className={label}>Answer choices (3 recommended)</span>
                {(q.choices ?? []).map((c, ci) => (
                  <div key={ci} className="grid grid-cols-[1fr_1fr_28px] gap-2">
                    <input className={input} placeholder="Primary (e.g. 500 – 1,000)" value={c.primary ?? ''} onChange={(e) => {
                      const qs = [...(data.questions ?? [])];
                      const ch = [...(qs[qi].choices ?? [])];
                      ch[ci] = { ...ch[ci], primary: e.target.value };
                      qs[qi] = { ...qs[qi], choices: ch };
                      commit({ ...data, questions: qs });
                    }} />
                    <input className={input} placeholder="Sub (e.g. Most popular)" value={c.sub ?? ''} onChange={(e) => {
                      const qs = [...(data.questions ?? [])];
                      const ch = [...(qs[qi].choices ?? [])];
                      ch[ci] = { ...ch[ci], sub: e.target.value };
                      qs[qi] = { ...qs[qi], choices: ch };
                      commit({ ...data, questions: qs });
                    }} />
                    <button type="button" className="text-red-600 hover:text-red-700" onClick={() => {
                      const qs = [...(data.questions ?? [])];
                      qs[qi] = { ...qs[qi], choices: (qs[qi].choices ?? []).filter((_, j) => j !== ci) };
                      commit({ ...data, questions: qs });
                    }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" className="flex w-fit items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[11px] font-bold text-ink hover:border-ink" onClick={() => {
                  const qs = [...(data.questions ?? [])];
                  qs[qi] = { ...qs[qi], choices: [...(qs[qi].choices ?? []), {}] };
                  commit({ ...data, questions: qs });
                }}><Plus size={12} /> Add choice</button>
              </div>
            </div>
          ))}

          {/* Combos ------------------------------------------------------- */}
          {(data.combos ?? []).map((c, ci) => (
            <div key={ci} className="rounded border border-neutral-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                  Combo {ci + 1}
                </div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-ink">
                  <input type="checkbox" checked={!!c.recommended} onChange={(e) => {
                    const cs = [...(data.combos ?? [])];
                    cs[ci] = { ...cs[ci], recommended: e.target.checked };
                    commit({ ...data, combos: cs });
                  }} />
                  Recommended (highlighted)
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <span className={label}>Tag (top left)</span>
                  <input className={input} value={c.tag ?? ''} onChange={(e) => {
                    const cs = [...(data.combos ?? [])];
                    cs[ci] = { ...cs[ci], tag: e.target.value };
                    commit({ ...data, combos: cs });
                  }} placeholder="Safe Bet / ★ Recommended / Step Up" />
                </div>
                <div>
                  <span className={label}>Match % label (top right)</span>
                  <input className={input} value={c.match ?? ''} onChange={(e) => {
                    const cs = [...(data.combos ?? [])];
                    cs[ci] = { ...cs[ci], match: e.target.value };
                    commit({ ...data, combos: cs });
                  }} placeholder="96% match" />
                </div>
                <div>
                  <span className={label}>Combo title</span>
                  <input className={input} value={c.title ?? ''} onChange={(e) => {
                    const cs = [...(data.combos ?? [])];
                    cs[ci] = { ...cs[ci], title: e.target.value };
                    commit({ ...data, combos: cs });
                  }} placeholder="The Sweet Spot." />
                </div>
              </div>
              <div className="mt-3">
                <span className={label}>Config snapshot for this combo</span>
                <p className="-mt-0.5 mb-2 text-[10px] text-neutral-500">
                  Pick one value per configurator step. The chooser will list these as the spec rows — no manual typing needed.
                </p>
                {configurator && configurator.length > 0 ? (
                  <div className="grid gap-2">
                    {configurator
                      .filter((s) => s.type === 'swatch' || s.type === 'select' || s.type === 'qty' || s.type === 'number' || s.type === 'text')
                      .map((step) => {
                        const picked = c.picks?.[step.step_id] ?? '';
                        return (
                          <div key={step.step_id} className="grid grid-cols-[200px_1fr] items-center gap-2">
                            <div className="text-xs font-bold text-neutral-600">{step.label}</div>
                            {step.type === 'swatch' || step.type === 'select' ? (
                              <select
                                className={input}
                                value={picked}
                                onChange={(e) => {
                                  const cs = [...(data.combos ?? [])];
                                  const picks = { ...(cs[ci].picks ?? {}) };
                                  if (e.target.value) picks[step.step_id] = e.target.value;
                                  else delete picks[step.step_id];
                                  cs[ci] = { ...cs[ci], picks };
                                  commit({ ...data, combos: cs });
                                }}
                              >
                                <option value="">— skip (hide row) —</option>
                                {(step.options ?? []).map((o) => (
                                  <option key={o.slug} value={o.slug}>{o.label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className={input}
                                placeholder={step.type === 'qty' ? 'e.g. 500' : ''}
                                value={picked}
                                onChange={(e) => {
                                  const cs = [...(data.combos ?? [])];
                                  const picks = { ...(cs[ci].picks ?? {}) };
                                  if (e.target.value) picks[step.step_id] = e.target.value;
                                  else delete picks[step.step_id];
                                  cs[ci] = { ...cs[ci], picks };
                                  commit({ ...data, combos: cs });
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-neutral-300 bg-white p-3 text-[11px] text-neutral-500">
                    This product has no configurator steps yet. Add steps on the{' '}
                    <strong>Pricing &amp; Options</strong> tab and they&apos;ll appear here.
                  </div>
                )}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <span className={label}>Why this combo (supports **bold** for yellow highlight)</span>
                  <textarea rows={2} className={input} value={c.why ?? ''} onChange={(e) => {
                    const cs = [...(data.combos ?? [])];
                    cs[ci] = { ...cs[ci], why: e.target.value };
                    commit({ ...data, combos: cs });
                  }} placeholder="What **most of our corporate clients order**. …" />
                </div>
                <div>
                  <span className={label}>Price label</span>
                  <input className={input} value={c.price ?? ''} onChange={(e) => {
                    const cs = [...(data.combos ?? [])];
                    cs[ci] = { ...cs[ci], price: e.target.value };
                    commit({ ...data, combos: cs });
                  }} placeholder="S$68.40 or Live pricing" />
                </div>
                <div>
                  <span className={label}>CTA button text</span>
                  <input className={input} value={c.cta_label ?? ''} onChange={(e) => {
                    const cs = [...(data.combos ?? [])];
                    cs[ci] = { ...cs[ci], cta_label: e.target.value };
                    commit({ ...data, combos: cs });
                  }} placeholder="Use this combo" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
