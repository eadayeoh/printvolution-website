'use client';

// Structured form editor for the per-product SEO Magazine block
// ("Everything worth knowing, before you order."). 4 articles with body
// paragraphs and optional side widgets. No JSON.

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

export type MagSide =
  | { kind: 'pills'; label: string; items: Array<{ text: string; pop?: boolean }> }
  | { kind: 'stat'; label: string; num: string; suffix?: string; caption?: string }
  | { kind: 'list'; label: string; rows: Array<{ text: string; time?: string }> }
  | { kind: 'quote'; text: string; attr?: string };

export type MagArticle = {
  num?: string;
  title?: string;
  body?: string[];
  side?: MagSide;
};

export type MagValue = {
  issue_label?: string;
  title?: string;
  title_em?: string;
  lede?: string;
  articles?: MagArticle[];
};

const input =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-ink';
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500';

export function MagazineEditor({
  value,
  onChange,
}: {
  value: MagValue | null;
  onChange: (next: MagValue | null) => void;
}) {
  const [enabled, setEnabled] = useState(value != null);
  const [data, setData] = useState<MagValue>(
    value ?? {
      issue_label: '',
      title: 'Everything worth knowing,',
      title_em: 'before you order.',
      lede: '',
      articles: [
        { num: '01', title: '', body: [''], side: undefined },
        { num: '02', title: '', body: [''], side: undefined },
        { num: '03', title: '', body: [''], side: undefined },
        { num: '04', title: '', body: [''], side: undefined },
      ],
    },
  );

  function commit(next: MagValue) {
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
          <div className="text-xs font-bold text-ink">SEO Magazine — &quot;Everything worth knowing&quot;</div>
          <p className="text-[11px] text-neutral-500">
            Long-form magazine-style section. 4 numbered articles, each with paragraphs and an optional
            side widget (pills list, stat, turnaround times, or pull quote). Toggle OFF to use the auto-generated default.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold text-ink">
          <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} />
          Use custom content
        </label>
      </div>

      {enabled && (
        <div className="space-y-4">
          {/* Header */}
          <div className="rounded border border-neutral-200 bg-white p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Header</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <span className={label}>Kicker chip (leave blank to auto-derive from SEO Title)</span>
                <input className={input} value={data.issue_label ?? ''} onChange={(e) => commit({ ...data, issue_label: e.target.value })} placeholder="e.g. NAME CARD PRINTING · SINGAPORE" />
              </div>
              <div>
                <span className={label}>Title (first line)</span>
                <input className={input} value={data.title ?? ''} onChange={(e) => commit({ ...data, title: e.target.value })} />
              </div>
              <div>
                <span className={label}>Title (pink second line)</span>
                <input className={input} value={data.title_em ?? ''} onChange={(e) => commit({ ...data, title_em: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <span className={label}>Lede paragraph (supports **bold**)</span>
                <textarea rows={3} className={input} value={data.lede ?? ''} onChange={(e) => commit({ ...data, lede: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Articles */}
          {(data.articles ?? []).map((a, ai) => (
            <div key={ai} className="rounded border border-neutral-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                  Article {ai + 1}
                </div>
                <button type="button" className="text-[11px] font-bold text-red-600 hover:underline" onClick={() => {
                  const arts = (data.articles ?? []).filter((_, j) => j !== ai);
                  commit({ ...data, articles: arts });
                }}>Remove article</button>
              </div>
              <div className="grid gap-3 md:grid-cols-[100px_1fr]">
                <div>
                  <span className={label}>Number</span>
                  <input className={input} value={a.num ?? ''} onChange={(e) => {
                    const arts = [...(data.articles ?? [])];
                    arts[ai] = { ...arts[ai], num: e.target.value };
                    commit({ ...data, articles: arts });
                  }} />
                </div>
                <div>
                  <span className={label}>Article title</span>
                  <input className={input} value={a.title ?? ''} onChange={(e) => {
                    const arts = [...(data.articles ?? [])];
                    arts[ai] = { ...arts[ai], title: e.target.value };
                    commit({ ...data, articles: arts });
                  }} />
                </div>
              </div>

              <div className="mt-3">
                <span className={label}>Body paragraphs (supports **bold**)</span>
                {(a.body ?? []).map((p, pi) => (
                  <div key={pi} className="mb-2 grid grid-cols-[1fr_28px] gap-2">
                    <textarea rows={2} className={input} value={p} onChange={(e) => {
                      const arts = [...(data.articles ?? [])];
                      const bd = [...(arts[ai].body ?? [])];
                      bd[pi] = e.target.value;
                      arts[ai] = { ...arts[ai], body: bd };
                      commit({ ...data, articles: arts });
                    }} />
                    <button type="button" className="text-red-600 hover:text-red-700" onClick={() => {
                      const arts = [...(data.articles ?? [])];
                      arts[ai] = { ...arts[ai], body: (arts[ai].body ?? []).filter((_, j) => j !== pi) };
                      commit({ ...data, articles: arts });
                    }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" className="flex w-fit items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[11px] font-bold text-ink hover:border-ink" onClick={() => {
                  const arts = [...(data.articles ?? [])];
                  arts[ai] = { ...arts[ai], body: [...(arts[ai].body ?? []), ''] };
                  commit({ ...data, articles: arts });
                }}><Plus size={12} /> Add paragraph</button>
              </div>

              {/* Side widget */}
              <div className="mt-3 rounded border border-dashed border-neutral-300 bg-neutral-50 p-3">
                <div className="mb-2 flex items-center gap-3">
                  <span className={label + ' mb-0'}>Side widget (right column)</span>
                  <select
                    className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs"
                    value={a.side?.kind ?? ''}
                    onChange={(e) => {
                      const kind = e.target.value;
                      const arts = [...(data.articles ?? [])];
                      if (!kind) {
                        arts[ai] = { ...arts[ai], side: undefined };
                      } else if (kind === 'pills') {
                        arts[ai] = { ...arts[ai], side: { kind: 'pills', label: '', items: [{ text: '', pop: true }, { text: '' }] } };
                      } else if (kind === 'stat') {
                        arts[ai] = { ...arts[ai], side: { kind: 'stat', label: '', num: '', suffix: '', caption: '' } };
                      } else if (kind === 'list') {
                        arts[ai] = { ...arts[ai], side: { kind: 'list', label: '', rows: [{ text: '', time: '' }] } };
                      } else if (kind === 'quote') {
                        arts[ai] = { ...arts[ai], side: { kind: 'quote', text: '', attr: '' } };
                      }
                      commit({ ...data, articles: arts });
                    }}
                  >
                    <option value="">— None —</option>
                    <option value="pills">Pills (list of tags)</option>
                    <option value="stat">Stat (big number + caption)</option>
                    <option value="list">List (rows with times)</option>
                    <option value="quote">Pull quote</option>
                  </select>
                </div>

                {a.side?.kind === 'pills' && (
                  <div className="space-y-2">
                    <input className={input} placeholder="Widget label (e.g. Our top 6 papers)" value={a.side.label} onChange={(e) => {
                      const arts = [...(data.articles ?? [])];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), label: e.target.value } };
                      commit({ ...data, articles: arts });
                    }} />
                    {a.side.items.map((it, ii) => (
                      <div key={ii} className="grid grid-cols-[1fr_80px_28px] gap-2">
                        <input className={input} placeholder="Pill text" value={it.text} onChange={(e) => {
                          const arts = [...(data.articles ?? [])];
                          const items = [...((arts[ai].side as any).items ?? [])];
                          items[ii] = { ...items[ii], text: e.target.value };
                          arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), items } };
                          commit({ ...data, articles: arts });
                        }} />
                        <label className="flex items-center gap-1 text-[11px] font-bold text-ink">
                          <input type="checkbox" checked={!!it.pop} onChange={(e) => {
                            const arts = [...(data.articles ?? [])];
                            const items = [...((arts[ai].side as any).items ?? [])];
                            items[ii] = { ...items[ii], pop: e.target.checked };
                            arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), items } };
                            commit({ ...data, articles: arts });
                          }} /> Pop
                        </label>
                        <button type="button" className="text-red-600 hover:text-red-700" onClick={() => {
                          const arts = [...(data.articles ?? [])];
                          const items = ((arts[ai].side as any).items ?? []).filter((_: any, j: number) => j !== ii);
                          arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), items } };
                          commit({ ...data, articles: arts });
                        }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <button type="button" className="flex w-fit items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[11px] font-bold text-ink hover:border-ink" onClick={() => {
                      const arts = [...(data.articles ?? [])];
                      const items = [...((arts[ai].side as any).items ?? []), { text: '' }];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), items } };
                      commit({ ...data, articles: arts });
                    }}><Plus size={12} /> Add pill</button>
                  </div>
                )}

                {a.side?.kind === 'stat' && (
                  <div className="grid gap-2 md:grid-cols-2">
                    <input className={input} placeholder="Label (e.g. Order Rate)" value={a.side.label} onChange={(e) => {
                      const arts = [...(data.articles ?? [])];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), label: e.target.value } };
                      commit({ ...data, articles: arts });
                    }} />
                    <input className={input} placeholder="Big number (e.g. 62)" value={a.side.num} onChange={(e) => {
                      const arts = [...(data.articles ?? [])];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), num: e.target.value } };
                      commit({ ...data, articles: arts });
                    }} />
                    <input className={input} placeholder="Suffix (e.g. %)" value={a.side.suffix ?? ''} onChange={(e) => {
                      const arts = [...(data.articles ?? [])];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), suffix: e.target.value } };
                      commit({ ...data, articles: arts });
                    }} />
                    <input className={input} placeholder="Caption" value={a.side.caption ?? ''} onChange={(e) => {
                      const arts = [...(data.articles ?? [])];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), caption: e.target.value } };
                      commit({ ...data, articles: arts });
                    }} />
                  </div>
                )}

                {a.side?.kind === 'list' && (
                  <div className="space-y-2">
                    <input className={input} placeholder="List label" value={a.side.label} onChange={(e) => {
                      const arts = [...(data.articles ?? [])];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), label: e.target.value } };
                      commit({ ...data, articles: arts });
                    }} />
                    {a.side.rows.map((r, ri) => (
                      <div key={ri} className="grid grid-cols-[1fr_120px_28px] gap-2">
                        <input className={input} placeholder="Row text" value={r.text} onChange={(e) => {
                          const arts = [...(data.articles ?? [])];
                          const rows = [...((arts[ai].side as any).rows ?? [])];
                          rows[ri] = { ...rows[ri], text: e.target.value };
                          arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), rows } };
                          commit({ ...data, articles: arts });
                        }} />
                        <input className={input} placeholder="Time (e.g. 3 days)" value={r.time ?? ''} onChange={(e) => {
                          const arts = [...(data.articles ?? [])];
                          const rows = [...((arts[ai].side as any).rows ?? [])];
                          rows[ri] = { ...rows[ri], time: e.target.value };
                          arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), rows } };
                          commit({ ...data, articles: arts });
                        }} />
                        <button type="button" className="text-red-600 hover:text-red-700" onClick={() => {
                          const arts = [...(data.articles ?? [])];
                          const rows = ((arts[ai].side as any).rows ?? []).filter((_: any, j: number) => j !== ri);
                          arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), rows } };
                          commit({ ...data, articles: arts });
                        }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <button type="button" className="flex w-fit items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-[11px] font-bold text-ink hover:border-ink" onClick={() => {
                      const arts = [...(data.articles ?? [])];
                      const rows = [...((arts[ai].side as any).rows ?? []), { text: '', time: '' }];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), rows } };
                      commit({ ...data, articles: arts });
                    }}><Plus size={12} /> Add row</button>
                  </div>
                )}

                {a.side?.kind === 'quote' && (
                  <div className="space-y-2">
                    <textarea rows={2} className={input} placeholder="Quote text" value={a.side.text} onChange={(e) => {
                      const arts = [...(data.articles ?? [])];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), text: e.target.value } };
                      commit({ ...data, articles: arts });
                    }} />
                    <input className={input} placeholder="Attribution" value={a.side.attr ?? ''} onChange={(e) => {
                      const arts = [...(data.articles ?? [])];
                      arts[ai] = { ...arts[ai], side: { ...(arts[ai].side as any), attr: e.target.value } };
                      commit({ ...data, articles: arts });
                    }} />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button type="button" className="flex w-fit items-center gap-1 rounded border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-ink hover:border-ink" onClick={() => {
            const arts = [...(data.articles ?? []), { num: String((data.articles?.length ?? 0) + 1).padStart(2, '0'), title: '', body: [''] }];
            commit({ ...data, articles: arts });
          }}><Plus size={14} /> Add article</button>
        </div>
      )}
    </div>
  );
}
