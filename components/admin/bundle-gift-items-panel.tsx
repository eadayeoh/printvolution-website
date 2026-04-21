'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addBundleGiftItem, removeBundleGiftItem, updateBundleGiftItem } from '@/app/admin/bundles/actions';

type GiftProduct = { id: string; slug: string; name: string; mode: string };
type Variant = { id: string; gift_product_id: string; name: string };
type Prompt = { id: string; mode: string; style: string; pipeline_id: string | null; name: string };
type Template = { id: string; name: string };
type Pipeline = { id: string; slug: string; name: string; kind: string };

type ExistingItem = {
  gift_product_id: string;
  gift_product_name: string;
  gift_product_mode: string;
  variant_id: string | null;
  variant_name: string | null;
  prompt_id: string | null;
  prompt_name: string | null;
  template_id: string | null;
  template_name: string | null;
  pipeline_id: string | null;
  pipeline_name: string | null;
  override_qty: number;
  display_order: number;
};

export function BundleGiftItemsPanel({
  bundleId,
  items,
  giftProducts,
  variantsByProduct,
  promptsByMode,
  templates,
  pipelines,
}: {
  bundleId: string;
  items: ExistingItem[];
  giftProducts: GiftProduct[];
  variantsByProduct: Record<string, Variant[]>;
  promptsByMode: Record<string, Prompt[]>;
  templates: Template[];
  pipelines: Pipeline[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // "Add new" draft
  const [newGift, setNewGift] = useState<string>('');
  const [newVariant, setNewVariant] = useState<string>('');
  const [newPrompt, setNewPrompt] = useState<string>('');
  const [newPipeline, setNewPipeline] = useState<string>('');
  const [newTemplate, setNewTemplate] = useState<string>('');
  const [newQty, setNewQty] = useState<string>('1');

  const newGiftMode = giftProducts.find((g) => g.id === newGift)?.mode ?? null;

  function resetDraft() {
    setNewGift(''); setNewVariant(''); setNewPrompt('');
    setNewPipeline(''); setNewTemplate(''); setNewQty('1');
  }

  function add() {
    setErr(null);
    if (!newGift) { setErr('Pick a gift SKU'); return; }
    if (!newPrompt) { setErr('Pick a style (prompt) — pre-fix for customers'); return; }
    if (!newPipeline) { setErr('Pick a pipeline'); return; }
    startTransition(async () => {
      const r = await addBundleGiftItem({
        bundle_id: bundleId,
        gift_product_id: newGift,
        variant_id: newVariant || null,
        prompt_id: newPrompt,
        pipeline_id: newPipeline,
        template_id: newTemplate || null,
        override_qty: parseInt(newQty, 10) || 1,
        display_order: items.length,
      });
      if (!r.ok) { setErr(r.error); return; }
      resetDraft();
      router.refresh();
    });
  }

  function updateQty(gp: string, q: string) {
    const n = parseInt(q, 10) || 1;
    startTransition(async () => {
      const r = await updateBundleGiftItem(bundleId, gp, { override_qty: n });
      if (!r.ok) setErr(r.error);
      else router.refresh();
    });
  }

  function remove(gp: string) {
    if (!confirm('Remove this gift SKU from the bundle?')) return;
    startTransition(async () => {
      const r = await removeBundleGiftItem(bundleId, gp);
      if (!r.ok) { setErr(r.error); return; }
      router.refresh();
    });
  }

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

  return (
    <section className="mt-8 rounded-lg border-2 border-ink bg-white p-6">
      <div className="mb-4">
        <h2 className="text-xl font-black">Gift items in this bundle</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Admin pre-fixes the gift config (style, variant, qty). Customer only uploads a photo on the bundle page.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mb-4 rounded border border-dashed border-neutral-300 p-6 text-center text-xs text-neutral-500">
          No gift items yet — this bundle is services-only.
        </div>
      ) : (
        <div className="mb-6 space-y-2">
          {items.map((it, i) => (
            <div key={it.gift_product_id} className="flex items-center gap-3 rounded border-2 border-neutral-200 p-3">
              <div className="text-xs font-mono text-neutral-500 w-6">{i + 1}.</div>
              <div className="flex-1">
                <div className="text-sm font-bold">{it.gift_product_name}</div>
                <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-neutral-600">
                  {it.variant_name && <span className="rounded bg-neutral-100 px-1.5 py-0.5">variant: {it.variant_name}</span>}
                  {it.prompt_name && <span className="rounded bg-neutral-100 px-1.5 py-0.5">style: {it.prompt_name}</span>}
                  {it.pipeline_name && <span className="rounded bg-neutral-100 px-1.5 py-0.5">pipeline: {it.pipeline_name}</span>}
                  {it.template_name && <span className="rounded bg-neutral-100 px-1.5 py-0.5">template: {it.template_name}</span>}
                </div>
              </div>
              <label className="flex items-center gap-1 text-xs">
                Qty
                <input
                  type="number"
                  min={1}
                  defaultValue={it.override_qty}
                  onBlur={(e) => {
                    const n = parseInt(e.target.value, 10) || 1;
                    if (n !== it.override_qty) updateQty(it.gift_product_id, String(n));
                  }}
                  className="w-16 border border-neutral-300 p-1 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => remove(it.gift_product_id)}
                className="rounded border border-red-200 p-2 text-red-600 hover:bg-red-50"
                aria-label="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded border-2 border-dashed border-neutral-300 p-4">
        <div className="mb-3 text-xs font-bold uppercase text-neutral-500">Add gift SKU</div>
        <div className="grid gap-2 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-600">Gift SKU</span>
            <select value={newGift} onChange={(e) => {
              setNewGift(e.target.value);
              setNewVariant('');
              setNewPrompt('');
              setNewPipeline('');
            }} className={inputCls}>
              <option value="">— Choose —</option>
              {giftProducts.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.mode})</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-600">Variant</span>
            <select value={newVariant} onChange={(e) => setNewVariant(e.target.value)} disabled={!newGift} className={inputCls}>
              <option value="">— No variant (parent product) —</option>
              {newGift && (variantsByProduct[newGift] ?? []).map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-600">Style / prompt</span>
            <select value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} disabled={!newGiftMode} className={inputCls}>
              <option value="">— Choose —</option>
              {newGiftMode && (promptsByMode[newGiftMode] ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.style})</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-600">Pipeline</span>
            <select value={newPipeline} onChange={(e) => setNewPipeline(e.target.value)} disabled={!newGiftMode} className={inputCls}>
              <option value="">— Choose —</option>
              {newGiftMode && pipelines.filter((p) => p.kind === newGiftMode).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-600">Template (optional)</span>
            <select value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-600">Qty in bundle</span>
            <input type="number" min={1} value={newQty}
              onChange={(e) => setNewQty(e.target.value)} className={inputCls} />
          </label>
        </div>

        {err && <div className="mt-2 text-xs font-bold text-red-600">{err}</div>}

        <button
          type="button"
          onClick={add}
          disabled={isPending}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50"
        >
          <Plus size={14} /> Add to bundle
        </button>
      </div>
    </section>
  );
}
