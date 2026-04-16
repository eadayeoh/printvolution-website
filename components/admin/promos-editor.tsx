'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Pencil, X } from 'lucide-react';
import { formatSGD } from '@/lib/utils';
import { saveCoupon, deleteCoupon, saveRule, deleteRule } from '@/app/admin/promos/actions';

export function PromosEditor({ coupons, rules }: { coupons: any[]; rules: any[] }) {
  const [tab, setTab] = useState<'coupons' | 'rules'>('coupons');

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-neutral-200">
        {(['coupons', 'rules'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t px-4 py-2 text-xs font-bold transition-colors ${
              tab === t ? 'bg-ink text-white' : 'text-neutral-600 hover:text-ink'
            }`}
          >
            {t === 'coupons' ? `Coupons (${coupons.length})` : `Auto discount rules (${rules.length})`}
          </button>
        ))}
      </div>

      {tab === 'coupons' && <CouponsTab initial={coupons} />}
      {tab === 'rules' && <RulesTab initial={rules} />}
    </div>
  );
}

function CouponsTab({ initial }: { initial: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setEditing({ code: '', type: 'pct', percent: 10, value_cents: null, min_spend_cents: 0, max_uses: null, expires_at: null, is_active: true })}
          className="flex items-center gap-1 rounded-full bg-pink px-4 py-1.5 text-xs font-bold text-white hover:bg-pink-dark"
        >
          <Plus size={12} /> New coupon
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Discount</th>
              <th className="px-4 py-3 text-left">Min Spend</th>
              <th className="px-4 py-3 text-left">Uses</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {initial.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">No coupons yet.</td></tr>
            ) : initial.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono font-bold text-ink">{c.code}</td>
                <td className="px-4 py-3">
                  {c.type === 'pct' ? `${c.percent}%` : formatSGD(c.value_cents ?? 0)}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-600">{formatSGD(c.min_spend_cents ?? 0)}</td>
                <td className="px-4 py-3 text-xs text-neutral-600">
                  {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ' / ∞'}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-600">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-SG') : '—'}
                </td>
                <td className="px-4 py-3 text-center">{c.is_active ? '✓' : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing({ ...c })} className="rounded border border-neutral-200 px-2 py-1 text-[11px] font-bold hover:border-pink hover:text-pink">
                    <Pencil size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <CouponModal coupon={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function CouponModal({ coupon, onClose }: { coupon: any; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [d, setD] = useState(coupon);
  const [err, setErr] = useState<string | null>(null);

  function save() {
    setErr(null);
    startTransition(async () => {
      const result = await saveCoupon({
        id: d.id,
        code: d.code,
        type: d.type,
        percent: d.type === 'pct' ? parseInt(d.percent) || 0 : null,
        value_cents: d.type === 'flat' ? Math.round(parseFloat(d.value_cents_dollars || d.value_cents / 100 || 0) * 100) : null,
        min_spend_cents: Math.round(parseFloat(d.min_spend_dollars || d.min_spend_cents / 100 || 0) * 100),
        max_uses: d.max_uses ? parseInt(d.max_uses) : null,
        expires_at: d.expires_at || null,
        is_active: !!d.is_active,
      });
      if (result.ok) {
        router.refresh();
        onClose();
      } else setErr(result.error ?? 'Failed');
    });
  }

  function remove() {
    if (!d.id) return;
    if (!confirm(`Delete coupon "${d.code}"?`)) return;
    startTransition(async () => {
      const result = await deleteCoupon(d.id);
      if (result.ok) {
        router.refresh();
        onClose();
      } else setErr(result.error ?? 'Delete failed');
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-ink">{d.id ? 'Edit coupon' : 'New coupon'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <Field label="Code (customers type this)">
            <input value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase() })} className={`${inputCls} font-mono uppercase`} placeholder="WELCOME10" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })} className={inputCls}>
                <option value="pct">% off</option>
                <option value="flat">$ off</option>
              </select>
            </Field>
            {d.type === 'pct' ? (
              <Field label="Percent (0-100)">
                <input type="number" value={d.percent ?? 0} onChange={(e) => setD({ ...d, percent: e.target.value })} min={0} max={100} className={inputCls} />
              </Field>
            ) : (
              <Field label="Dollar amount">
                <input type="number" step={0.01} value={d.value_cents_dollars ?? (d.value_cents ?? 0) / 100} onChange={(e) => setD({ ...d, value_cents_dollars: e.target.value })} className={inputCls} />
              </Field>
            )}
          </div>
          <Field label="Min spend (S$)">
            <input type="number" step={0.01} value={d.min_spend_dollars ?? (d.min_spend_cents ?? 0) / 100} onChange={(e) => setD({ ...d, min_spend_dollars: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Max uses (blank = unlimited)">
            <input type="number" value={d.max_uses ?? ''} onChange={(e) => setD({ ...d, max_uses: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Expires (blank = never)">
            <input type="date" value={d.expires_at ? d.expires_at.slice(0, 10) : ''} onChange={(e) => setD({ ...d, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} />
            Active
          </label>
          {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{err}</div>}
          <div className="flex justify-between gap-2 pt-2">
            {d.id && (
              <button onClick={remove} className="rounded border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">
                Delete
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={onClose} className="rounded border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-700 hover:border-ink">Cancel</button>
              <button onClick={save} disabled={isPending} className="rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50">
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RulesTab({ initial }: { initial: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setEditing({ type: 'min_spend', trigger_value: 15000, reward_type: 'pct', reward_value: 10, label: '', is_active: true })}
          className="flex items-center gap-1 rounded-full bg-pink px-4 py-1.5 text-xs font-bold text-white hover:bg-pink-dark"
        >
          <Plus size={12} /> New rule
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">When</th>
              <th className="px-4 py-3 text-left">Reward</th>
              <th className="px-4 py-3 text-left">Label</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {initial.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">No rules yet.</td></tr>
            ) : initial.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-xs">
                  {r.type === 'min_spend' ? `Cart ≥ ${formatSGD(r.trigger_value)}` : `${r.trigger_value}+ items`}
                </td>
                <td className="px-4 py-3 text-xs font-bold">
                  {r.reward_type === 'pct' ? `${r.reward_value}% off` : `${formatSGD(r.reward_value)} off`}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-600">{r.label ?? '—'}</td>
                <td className="px-4 py-3 text-center">{r.is_active ? '✓' : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing({ ...r })} className="rounded border border-neutral-200 px-2 py-1 text-[11px] font-bold hover:border-pink hover:text-pink">
                    <Pencil size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <RuleModal rule={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function RuleModal({ rule, onClose }: { rule: any; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [d, setD] = useState(rule);
  const [err, setErr] = useState<string | null>(null);

  function save() {
    setErr(null);
    startTransition(async () => {
      const triggerVal = d.type === 'min_spend'
        ? Math.round((parseFloat(d.trigger_dollars ?? String((d.trigger_value ?? 0) / 100)) || 0) * 100)
        : (parseInt(String(d.trigger_value ?? 0)) || 0);
      const rewardVal = d.reward_type === 'pct'
        ? (parseInt(String(d.reward_value ?? 0)) || 0)
        : Math.round((parseFloat(d.reward_dollars ?? String((d.reward_value ?? 0) / 100)) || 0) * 100);

      const result = await saveRule({
        id: d.id,
        type: d.type,
        trigger_value: triggerVal,
        reward_type: d.reward_type,
        reward_value: rewardVal,
        label: d.label || null,
        is_active: !!d.is_active,
      });
      if (result.ok) {
        router.refresh();
        onClose();
      } else setErr(result.error ?? 'Failed');
    });
  }

  function remove() {
    if (!d.id) return;
    if (!confirm('Delete rule?')) return;
    startTransition(async () => {
      const result = await deleteRule(d.id);
      if (result.ok) { router.refresh(); onClose(); }
      else setErr(result.error ?? 'Delete failed');
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-ink">{d.id ? 'Edit rule' : 'New rule'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Trigger">
              <select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })} className={inputCls}>
                <option value="min_spend">Cart ≥ $</option>
                <option value="min_qty">Min # items</option>
              </select>
            </Field>
            {d.type === 'min_spend' ? (
              <Field label="Min cart ($)">
                <input type="number" step={0.01} value={d.trigger_dollars ?? (d.trigger_value ?? 0) / 100} onChange={(e) => setD({ ...d, trigger_dollars: e.target.value })} className={inputCls} />
              </Field>
            ) : (
              <Field label="Min items">
                <input type="number" value={d.trigger_value ?? 0} onChange={(e) => setD({ ...d, trigger_value: e.target.value })} className={inputCls} />
              </Field>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reward type">
              <select value={d.reward_type} onChange={(e) => setD({ ...d, reward_type: e.target.value })} className={inputCls}>
                <option value="pct">% off</option>
                <option value="flat">$ off</option>
              </select>
            </Field>
            {d.reward_type === 'pct' ? (
              <Field label="Percent">
                <input type="number" min={0} max={100} value={d.reward_value ?? 0} onChange={(e) => setD({ ...d, reward_value: e.target.value })} className={inputCls} />
              </Field>
            ) : (
              <Field label="Dollar off">
                <input type="number" step={0.01} value={d.reward_dollars ?? (d.reward_value ?? 0) / 100} onChange={(e) => setD({ ...d, reward_dollars: e.target.value })} className={inputCls} />
              </Field>
            )}
          </div>
          <Field label="Label (shown at checkout)">
            <input value={d.label ?? ''} onChange={(e) => setD({ ...d, label: e.target.value })} placeholder="10% off orders over $150" className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} />
            Active
          </label>
          {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{err}</div>}
          <div className="flex justify-between gap-2 pt-2">
            {d.id && (
              <button onClick={remove} className="rounded border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Delete</button>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={onClose} className="rounded border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-700 hover:border-ink">Cancel</button>
              <button onClick={save} disabled={isPending} className="rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50">
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}
const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
