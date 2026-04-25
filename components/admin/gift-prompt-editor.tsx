'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { createGiftPrompt, updateGiftPrompt, deleteGiftPrompt, testGiftPrompt } from '@/app/admin/gifts/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';
import type { GiftPrompt, PromptVisibility } from '@/lib/gifts/prompts';
import type { GiftMode, GiftPipeline } from '@/lib/gifts/types';

export function GiftPromptEditor({
  prompt,
  defaultMode,
  pipelines = [],
  visibility = [],
}: {
  prompt: GiftPrompt | null;
  defaultMode?: GiftMode;
  pipelines?: GiftPipeline[];
  /** For an existing prompt: which active gift products would actually
   *  show this prompt to customers, and why. Computed server-side. */
  visibility?: PromptVisibility[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [mode, setMode] = useState<'laser' | 'uv' | 'embroidery'>(
    (prompt?.mode as any) ?? (defaultMode === 'photo-resize' ? 'uv' : defaultMode) ?? 'uv'
  );
  const [pipelineId, setPipelineId] = useState<string>(prompt?.pipeline_id ?? '');
  const [name, setName] = useState(prompt?.name ?? '');
  const [description, setDescription] = useState(prompt?.description ?? '');
  const [thumbnail, setThumbnail] = useState(prompt?.thumbnail_url ?? '');
  const [transformation, setTransformation] = useState(prompt?.transformation_prompt ?? '');
  const [negative, setNegative] = useState(prompt?.negative_prompt ?? '');
  const [displayOrder, setDisplayOrder] = useState((prompt?.display_order ?? 0).toString());
  const [isActive, setIsActive] = useState(prompt?.is_active ?? true);

  // Test panel state
  const testFileRef = useRef<HTMLInputElement | null>(null);
  const [testing, setTesting] = useState(false);
  const [testPreviewUrl, setTestPreviewUrl] = useState<string | null>(null);
  const [testErr, setTestErr] = useState<string | null>(null);

  async function runTest(f: File) {
    setTestErr(null);
    setTesting(true);
    setTestPreviewUrl(null);
    const fd = new FormData();
    fd.append('file', f);
    fd.append('mode', mode);
    fd.append('transformation_prompt', transformation);
    if (negative) fd.append('negative_prompt', negative);
    try {
      const r = await testGiftPrompt(fd);
      if (r.ok && r.previewUrl) setTestPreviewUrl(r.previewUrl);
      else setTestErr(r.error ?? 'Test failed');
    } catch (e: any) {
      setTestErr(e?.message ?? 'Test failed');
    } finally {
      setTesting(false);
    }
  }

  function save() {
    setErr(null);
    if (!name.trim()) { setErr('Name required'); return; }
    const payload: any = {
      mode,
      pipeline_id: pipelineId || null,
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
              <span className="mb-1 block text-xs font-bold text-ink">Pipeline override</span>
              <select
                value={pipelineId}
                onChange={(e) => setPipelineId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Mode default ({mode}) —</option>
                {pipelines.filter((p) => p.kind === mode).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

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

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-ink">Test this prompt</div>
                <div className="mt-1 text-[11px] text-neutral-500">
                  Upload a sample photo to see what the pipeline produces with the current settings. This runs the preview pipeline live — you don&apos;t need to save first.
                </div>
              </div>
              <input
                ref={testFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) runTest(f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={testing || !transformation.trim()}
                onClick={() => testFileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-pink disabled:opacity-50"
              >
                {testing ? 'Running…' : 'Run test'}
              </button>
            </div>
            {testErr && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">✗ {testErr}</div>
            )}
            {testPreviewUrl && (
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-500">Preview output</div>
                <a href={testPreviewUrl} target="_blank" rel="noopener" className="block overflow-hidden rounded border border-neutral-200 bg-neutral-50 hover:border-pink">
                  <img src={testPreviewUrl} alt="Test preview" className="w-full" style={{ maxHeight: 400, objectFit: 'contain' }} />
                </a>
                <p className="mt-2 text-[11px] text-neutral-500">
                  This is watermarked and downsized — the same preview the customer would see. Run again if you tweak the prompt.
                </p>
              </div>
            )}
            {!testErr && !testPreviewUrl && !testing && (
              <div className="rounded border border-dashed border-neutral-300 p-6 text-center text-[11px] text-neutral-500">
                Click <strong>Run test</strong> and pick any photo to try the prompt.
              </div>
            )}
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

          {prompt && visibility.length > 0 && <VisibilityPanel visibility={visibility} />}

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

function VisibilityPanel({ visibility }: { visibility: PromptVisibility[] }) {
  const visible = visibility.filter((v) => v.visible);
  const hidden = visibility.filter((v) => !v.visible);
  const reasonHint: Record<PromptVisibility['reason'], string> = {
    'mode-default': 'mode default — every product without a custom curation',
    'curated-allowlist': "in this product's curated style list",
    'curated-not-listed': "this product has a curated list and this prompt isn't in it",
    'pipeline-pinned': "product is pinned to this prompt's pipeline",
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-1 text-xs font-bold text-ink">Where it shows</div>
      <p className="mb-3 text-[11px] text-neutral-500">
        Computed live — what the customer would actually see right now.
      </p>
      {visible.length === 0 ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
          ⚠ Not appearing on any product yet. Either tick this prompt in a product&apos;s
          curated style list, pin a product&apos;s pipeline to this prompt&apos;s pipeline,
          or leave a product fully un-curated.
        </div>
      ) : (
        <ul className="space-y-1 text-[11px]">
          {visible.map((v) => (
            <li key={v.product_id} className="flex items-start gap-2">
              <span className="mt-0.5 text-green-600">✓</span>
              <span>
                <span className="font-bold text-ink">{v.name}</span>
                <span className="ml-1 text-neutral-400">— {reasonHint[v.reason]}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {hidden.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] font-bold text-neutral-500 hover:text-ink">
            Why not visible on {hidden.length} product{hidden.length === 1 ? '' : 's'}
          </summary>
          <ul className="mt-2 space-y-1 text-[11px]">
            {hidden.map((v) => (
              <li key={v.product_id} className="flex items-start gap-2">
                <span className="mt-0.5 text-neutral-300">·</span>
                <span>
                  <span className="text-ink">{v.name}</span>
                  <span className="ml-1 text-neutral-400">— {reasonHint[v.reason]}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
