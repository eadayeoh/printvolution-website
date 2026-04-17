'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { createGiftPrompt, updateGiftPrompt, deleteGiftPrompt } from '@/app/admin/gifts/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';
import type { GiftPrompt } from '@/lib/gifts/prompts';
import type { GiftMode } from '@/lib/gifts/types';

export function GiftPromptEditor({ prompt, defaultMode }: { prompt: GiftPrompt | null; defaultMode?: GiftMode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [mode, setMode] = useState<'laser' | 'uv' | 'embroidery'>(
    (prompt?.mode as any) ?? (defaultMode === 'photo-resize' ? 'uv' : defaultMode) ?? 'uv'
  );
  const [name, setName] = useState(prompt?.name ?? '');
  const [description, setDescription] = useState(prompt?.description ?? '');
  const [thumbnail, setThumbnail] = useState(prompt?.thumbnail_url ?? '');
  const [transformation, setTransformation] = useState(prompt?.transformation_prompt ?? '');
  const [negative, setNegative] = useState(prompt?.negative_prompt ?? '');
  const [displayOrder, setDisplayOrder] = useState((prompt?.display_order ?? 0).toString());
  const [isActive, setIsActive] = useState(prompt?.is_active ?? true);

  function save() {
    setErr(null);
    if (!name.trim()) { setErr('Name required'); return; }
    const payload: any = {
      mode,
      name: name.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnail || null,
      transformation_prompt: transformation,
      negative_prompt: negative.trim() || null,
      display_order: parseInt(displayOrder, 10) || 0,
      is_active: isActive,
    };
    startTransition(async () => {
      if (prompt) {
        const r = await updateGiftPrompt(prompt.id, payload);
        if (!r.ok) setErr(r.error);
        else { setFlash(true); setTimeout(() => setFlash(false), 1600); }
      } else {
        const r = await createGiftPrompt(payload);
        if (!r.ok) setErr(r.error);
        else router.push(`/admin/gifts/prompts/${r.id}`);
      }
    });
  }

  function remove() {
    if (!prompt) return;
    if (!confirm('Delete this prompt? Orders placed with it stay intact (snapshot).')) return;
    startTransition(async () => {
      const r = await deleteGiftPrompt(prompt.id);
      if (!r.ok) setErr(r.error);
      else router.push('/admin/gifts/prompts');
    });
  }

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
  const modes: GiftMode[] = ['laser', 'uv', 'embroidery'];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/gifts/prompts" className="text-sm font-bold text-neutral-500 hover:text-ink">← Back</Link>
        <div className="text-sm font-bold text-ink">{prompt ? 'Edit prompt' : 'New prompt'}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
            <div>
              <span className="mb-2 block text-xs font-bold text-ink">Production method</span>
              <div className="grid grid-cols-3 gap-2">
                {modes.map((m) => {
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m as any)}
                      disabled={!!prompt}
                      className={`rounded-lg border-2 px-3 py-3 text-sm font-bold transition-colors ${
                        active ? 'border-ink bg-ink text-white' : 'border-neutral-200 bg-white text-ink hover:border-neutral-400'
                      } ${prompt ? 'disabled:cursor-not-allowed disabled:opacity-70' : ''}`}
                    >
                      {GIFT_MODE_LABEL[m]}
                    </button>
                  );
                })}
              </div>
              {prompt && <div className="mt-1 text-[10px] text-neutral-500">Mode is fixed after creation.</div>}
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Prompt name (shown to customers)</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Pencil Sketch / Pop Art / Cel Shaded" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Short description (shown under thumbnail)</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Clean lines, high contrast" />
            </label>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
            <div className="rounded border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900">
              <strong>Internal only.</strong> This is the AI instruction that drives the transformation. Customers never see these fields.
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Transformation prompt</span>
              <textarea
                value={transformation}
                onChange={(e) => setTransformation(e.target.value)}
                rows={6}
                className={`${inputCls} font-mono text-xs leading-relaxed`}
                placeholder={mode === 'laser'
                  ? 'Convert photo into high-contrast black-and-white line art suitable for laser engraving…'
                  : mode === 'uv'
                  ? 'Stylise as flat cel-shaded illustration with bold saturated colours…'
                  : 'Simplify into embroidery-ready art with no more than 8 solid colours…'}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Negative prompt (optional)</span>
              <textarea value={negative} onChange={(e) => setNegative(e.target.value)} rows={2} className={`${inputCls} font-mono text-xs`} placeholder="blurry, photorealistic, low contrast" />
            </label>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-2 text-xs font-bold text-ink">Thumbnail</div>
            <p className="mb-2 text-[11px] text-neutral-500">Customers see this when picking a style. Upload a sample output.</p>
            <ImageUpload value={thumbnail} onChange={setThumbnail} prefix="prompt-thumb" aspect={1} size="lg" label="Thumbnail" />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
            <label className="block">
              <span className="mb-1 block text-[11px] text-neutral-600">Display order</span>
              <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} className={inputCls} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active (customer sees this option)
            </label>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <button onClick={save} disabled={isPending} className="w-full rounded-full bg-pink py-2 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50">
              {isPending ? 'Saving…' : prompt ? 'Save' : 'Create'}
            </button>
            {err && <div className="mt-2 text-xs font-bold text-red-600">{err}</div>}
            {flash && <div className="mt-2 text-xs font-bold text-green-600">✓ Saved</div>}
          </div>

          {prompt && (
            <button onClick={remove} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white py-2 text-xs font-bold text-red-600 hover:bg-red-50">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
