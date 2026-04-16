'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { formatSGD } from '@/lib/utils';
import { updateBundleBySlug, createBundle, deleteBundle, type BundleUpdateInput } from '@/app/admin/bundles/actions';

type ProductOption = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  min_price: number | null; // cents
};

type BundleDraft = {
  name: string;
  description: string;
  tagline: string;
  status: 'active' | 'inactive' | 'draft';
  discount_type: 'pct' | 'flat' | null;
  discount_value: number;  // percent 0-100 or dollar
  products: Array<{ product_id: string; override_qty: number }>;
  whys: string[];
  faqs: Array<{ question: string; answer: string }>;
};

type Props = {
  mode: 'edit' | 'new';
  slug?: string;
  initial: BundleDraft;
  productOptions: ProductOption[];
};

export function BundleEditor({ mode, slug, initial, productOptions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [d, setD] = useState<BundleDraft>(initial);

  const productById = useMemo(() => {
    const m = new Map<string, ProductOption>();
    for (const p of productOptions) m.set(p.id, p);
    return m;
  }, [productOptions]);

  // Computed totals
  const subtotal = d.products.reduce((sum, bp) => {
    const p = productById.get(bp.product_id);
    return sum + ((p?.min_price ?? 0) * bp.override_qty);
  }, 0);
  const discountCents = d.discount_type === 'pct'
    ? Math.round((subtotal * Math.min(100, d.discount_value || 0)) / 100)
    : d.discount_type === 'flat'
      ? Math.min(subtotal, (d.discount_value || 0) * 100)
      : 0;
  const bundlePrice = subtotal - discountCents;

  async function handleSave() {
    setErr(null);
    startTransition(async () => {
      const input: BundleUpdateInput = {
        name: d.name,
        description: d.description || null,
        tagline: d.tagline || null,
        status: d.status,
        discount_type: d.discount_type,
        discount_value: d.discount_type === 'flat' ? Math.round(d.discount_value * 100) : (d.discount_value || 0),
        products: d.products,
        whys: d.whys.filter(Boolean),
        faqs: d.faqs.filter((f) => f.question.trim() || f.answer.trim()),
      };
      const result: any = mode === 'edit'
        ? await updateBundleBySlug(slug!, input)
        : await createBundle(input);
      if (result.ok) {
        setSaved(true);
        if (mode === 'new' && result.slug) {
          router.push(`/admin/bundles/${result.slug}`);
        } else {
          setTimeout(() => setSaved(false), 2000);
          router.refresh();
        }
      } else {
        setErr(result.error ?? 'Save failed');
      }
    });
  }

  async function handleDelete() {
    if (!slug) return;
    if (!confirm(`Delete bundle "${d.name}"? Cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteBundle(slug);
      if (result.ok) router.push('/admin/bundles');
      else setErr(result.error ?? 'Delete failed');
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Main form */}
      <div className="space-y-6">
        {/* Basics */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-black text-ink">Bundle details</h2>
          <div className="space-y-4">
            <Field label="Name">
              <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Tagline (optional short hook)">
              <input value={d.tagline} onChange={(e) => setD({ ...d, tagline: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} rows={3} className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as any })} className={`${inputCls} w-40`}>
                <option value="active">Active (published)</option>
                <option value="inactive">Inactive (hidden)</option>
                <option value="draft">Draft</option>
              </select>
            </Field>
          </div>
        </section>

        {/* Discount */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-black text-ink">Discount</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className="mb-1 text-xs font-bold text-ink">Discount type</div>
              <div className="flex gap-2">
                {[
                  { v: null, label: 'None' },
                  { v: 'pct' as const, label: '% off' },
                  { v: 'flat' as const, label: '$ off' },
                ].map((opt) => (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => setD({ ...d, discount_type: opt.v, discount_value: 0 })}
                    className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-colors ${
                      d.discount_type === opt.v
                        ? 'border-pink bg-pink text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-pink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {d.discount_type && (
              <Field label={d.discount_type === 'pct' ? 'Percent off (0-100)' : 'Dollars off (e.g. 48)'}>
                <input
                  type="number"
                  min={0}
                  max={d.discount_type === 'pct' ? 100 : undefined}
                  step={d.discount_type === 'pct' ? 1 : 0.01}
                  value={d.discount_value || 0}
                  onChange={(e) => setD({ ...d, discount_value: parseFloat(e.target.value) || 0 })}
                  className={`${inputCls} w-32`}
                />
              </Field>
            )}
          </div>
        </section>

        {/* Products */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-ink">Products in bundle</h2>
            <ProductPicker
              existing={d.products.map((p) => p.product_id)}
              options={productOptions}
              onAdd={(id) => setD({ ...d, products: [...d.products, { product_id: id, override_qty: 1 }] })}
            />
          </div>
          <div className="space-y-2">
            {d.products.length === 0 ? (
              <div className="rounded border-2 border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
                Pick products to add to this bundle.
              </div>
            ) : (
              d.products.map((bp, i) => {
                const p = productById.get(bp.product_id);
                return (
                  <div key={i} className="flex items-center gap-3 rounded border border-neutral-200 p-3">
                    <GripVertical size={16} className="text-neutral-300" />
                    <span className="text-2xl">{p?.icon ?? '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-ink">{p?.name ?? 'Unknown'}</div>
                      <div className="text-[11px] text-neutral-500">
                        {p?.min_price !== null && p?.min_price !== undefined
                          ? `${formatSGD(p.min_price)} each`
                          : 'No base price'}
                      </div>
                    </div>
                    <label className="flex items-center gap-1 text-xs">
                      Qty
                      <input
                        type="number"
                        min={1}
                        value={bp.override_qty}
                        onChange={(e) => setD({
                          ...d,
                          products: d.products.map((x, j) => j === i ? { ...x, override_qty: parseInt(e.target.value) || 1 } : x),
                        })}
                        className={`${inputCls} w-20`}
                      />
                    </label>
                    <div className="w-24 text-right text-sm font-bold text-pink">
                      {p?.min_price !== null && p?.min_price !== undefined
                        ? formatSGD(p.min_price * bp.override_qty)
                        : '—'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setD({ ...d, products: d.products.filter((_, j) => j !== i) })}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Whys */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-black text-ink">Why this bundle? <span className="text-xs font-normal text-neutral-500">(bullet points, shown on bundle page)</span></h2>
          <div className="space-y-2">
            {d.whys.map((w, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={w}
                  onChange={(e) => setD({ ...d, whys: d.whys.map((x, j) => j === i ? e.target.value : x) })}
                  placeholder="e.g. Save 20% vs buying separately"
                  className={inputCls}
                />
                <button type="button" onClick={() => setD({ ...d, whys: d.whys.filter((_, j) => j !== i) })}
                  className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setD({ ...d, whys: [...d.whys, ''] })}
              className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
              <Plus size={12} /> Add why
            </button>
          </div>
        </section>

        {/* FAQs */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-black text-ink">FAQs</h2>
          <div className="space-y-3">
            {d.faqs.map((f, i) => (
              <div key={i} className="rounded border border-neutral-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500">FAQ {i + 1}</span>
                  <button type="button" onClick={() => setD({ ...d, faqs: d.faqs.filter((_, j) => j !== i) })}
                    className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
                </div>
                <input
                  value={f.question}
                  onChange={(e) => setD({ ...d, faqs: d.faqs.map((x, j) => j === i ? { ...x, question: e.target.value } : x) })}
                  placeholder="Question"
                  className={`${inputCls} mb-2 font-semibold`}
                />
                <textarea
                  value={f.answer}
                  onChange={(e) => setD({ ...d, faqs: d.faqs.map((x, j) => j === i ? { ...x, answer: e.target.value } : x) })}
                  placeholder="Answer"
                  rows={3}
                  className={inputCls}
                />
              </div>
            ))}
            <button type="button" onClick={() => setD({ ...d, faqs: [...d.faqs, { question: '', answer: '' }] })}
              className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
              <Plus size={12} /> Add FAQ
            </button>
          </div>
        </section>
      </div>

      {/* Sidebar — live preview + save */}
      <aside>
        <div className="sticky top-4 space-y-4">
          <div className="rounded-lg border-2 border-ink bg-white p-5 shadow-brand">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-pink">Live preview</div>
            <h3 className="mb-2 text-lg font-black text-ink">{d.name || '(unnamed)'}</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold text-ink">{formatSGD(subtotal)}</span>
              </div>
              {d.discount_type && (
                <div className="flex justify-between text-green-700">
                  <span>Discount ({d.discount_type === 'pct' ? `${d.discount_value}%` : `S$${d.discount_value}`})</span>
                  <span>-{formatSGD(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm font-black">
                <span className="text-ink">Bundle price</span>
                <span className="text-pink">{formatSGD(bundlePrice)}</span>
              </div>
              {discountCents > 0 && (
                <div className="rounded bg-green-50 px-2 py-1 text-center text-[10px] font-bold text-green-800">
                  Customer saves {formatSGD(discountCents)}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isPending || d.products.length === 0 || !d.name}
            className="w-full rounded-full bg-pink py-3 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50"
          >
            {isPending ? 'Saving…' : mode === 'new' ? 'Create bundle' : 'Save changes'}
          </button>
          {mode === 'edit' && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="w-full rounded-full border-2 border-red-200 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Delete bundle
            </button>
          )}
          {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">{err}</div>}
          {saved && <div className="rounded border border-green-200 bg-green-50 p-2 text-[11px] text-green-700">✓ Saved</div>}
        </div>
      </aside>
    </div>
  );
}

function ProductPicker({ existing, options, onAdd }: { existing: string[]; options: ProductOption[]; onAdd: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const available = options.filter((p) =>
    !existing.includes(p.id) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-full bg-pink px-3 py-1.5 text-xs font-bold text-white hover:bg-pink-dark">
        <Plus size={12} /> Add product
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 max-h-96 w-72 overflow-hidden rounded-lg border-2 border-ink bg-white shadow-brand">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border-b border-neutral-200 px-3 py-2 text-sm focus:outline-none"
          />
          <div className="max-h-72 overflow-y-auto">
            {available.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500">No products match.</div>
            ) : (
              available.slice(0, 50).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onAdd(p.id); setOpen(false); setSearch(''); }}
                  className="flex w-full items-center gap-3 border-b border-neutral-100 px-3 py-2 text-left hover:bg-neutral-50"
                >
                  <span className="text-lg">{p.icon ?? '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{p.name}</div>
                    {p.min_price !== null && (
                      <div className="text-[10px] text-neutral-500">From {formatSGD(p.min_price)}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-neutral-200 p-2 text-right">
            <button type="button" onClick={() => setOpen(false)} className="text-[11px] font-semibold text-neutral-500 hover:text-ink">
              Close
            </button>
          </div>
        </div>
      )}
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
