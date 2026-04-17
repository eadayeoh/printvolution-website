'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { createTemplate, updateTemplate, deleteTemplate } from '@/app/admin/gifts/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import type { GiftTemplate } from '@/lib/gifts/types';

export function GiftTemplateEditor({ template }: { template: GiftTemplate | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [thumbnail, setThumbnail] = useState(template?.thumbnail_url ?? '');
  const [background, setBackground] = useState(template?.background_url ?? '');
  const [foreground, setForeground] = useState(template?.foreground_url ?? '');
  const [displayOrder, setDisplayOrder] = useState(template?.display_order?.toString() ?? '0');
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [zones, setZones] = useState<any[]>(template?.zones_json ?? []);

  function save() {
    setErr(null);
    if (!name.trim()) { setErr('Name required'); return; }
    const payload: any = {
      name: name.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnail || null,
      background_url: background || null,
      foreground_url: foreground || null,
      zones_json: zones,
      display_order: parseInt(displayOrder, 10) || 0,
      is_active: isActive,
    };
    startTransition(async () => {
      if (template) {
        const r = await updateTemplate(template.id, payload);
        if (!r.ok) setErr(r.error);
        else { setFlash(true); setTimeout(() => setFlash(false), 1600); }
      } else {
        const r = await createTemplate(payload);
        if (!r.ok) setErr(r.error);
        else router.push(`/admin/gifts/templates/${r.id}`);
      }
    });
  }

  function remove() {
    if (!template) return;
    if (!confirm('Delete this template?')) return;
    startTransition(async () => {
      const r = await deleteTemplate(template.id);
      if (!r.ok) setErr(r.error);
      else router.push('/admin/gifts/templates');
    });
  }

  function addZone() {
    setZones([...zones, { id: `zone${zones.length + 1}`, label: 'Photo', x_mm: 10, y_mm: 10, width_mm: 60, height_mm: 60 }]);
  }

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/gifts/templates" className="text-sm font-bold text-neutral-500 hover:text-ink">← Back</Link>
        <div className="text-sm font-bold text-ink">{template ? 'Edit template' : 'New template'}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Hearts Frame" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
            </label>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
            <div className="text-xs font-bold text-ink">Assets</div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">Thumbnail (shown in picker)</div>
              <ImageUpload value={thumbnail} onChange={setThumbnail} prefix="tpl-thumb" aspect={1} size="md" label="Thumbnail" />
            </div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">Background layer (sits behind customer photo)</div>
              <ImageUpload value={background} onChange={setBackground} prefix="tpl-bg" aspect={1} size="md" label="Background" />
            </div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">Foreground layer (sits on top — masks, frames, text)</div>
              <ImageUpload value={foreground} onChange={setForeground} prefix="tpl-fg" aspect={1} size="md" label="Foreground" />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink">Photo zones</div>
                <div className="text-[11px] text-neutral-500">Where the customer&apos;s photo drops in (coordinates in mm).</div>
              </div>
              <button type="button" onClick={addZone} className="rounded-full bg-pink px-3 py-1.5 text-[11px] font-bold text-white hover:bg-pink-dark">
                + Zone
              </button>
            </div>
            {zones.length === 0 ? (
              <div className="rounded border border-dashed p-4 text-center text-xs text-neutral-500">
                No zones. Simple templates with one photo area don&apos;t need zones — add one if you have multiple photo placeholders.
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map((z, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr_60px_60px_60px_60px_36px] gap-2 items-center rounded border p-2 text-xs">
                    <input value={z.id} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, id: e.target.value } : x))} className={`${inputCls} font-mono text-[11px]`} placeholder="id" />
                    <input value={z.label} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className={inputCls} placeholder="Label" />
                    <input type="number" value={z.x_mm} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, x_mm: parseFloat(e.target.value) } : x))} className={inputCls} placeholder="X" />
                    <input type="number" value={z.y_mm} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, y_mm: parseFloat(e.target.value) } : x))} className={inputCls} placeholder="Y" />
                    <input type="number" value={z.width_mm} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, width_mm: parseFloat(e.target.value) } : x))} className={inputCls} placeholder="W" />
                    <input type="number" value={z.height_mm} onChange={(e) => setZones(zones.map((x, j) => j === i ? { ...x, height_mm: parseFloat(e.target.value) } : x))} className={inputCls} placeholder="H" />
                    <button type="button" onClick={() => setZones(zones.filter((_, j) => j !== i))} className="justify-self-center text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <label className="mb-3 block">
              <span className="mb-1 block text-[11px] text-neutral-600">Display order</span>
              <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} className={inputCls} />
            </label>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
            <button onClick={save} disabled={isPending} className="w-full rounded-full bg-pink py-2 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50">
              {isPending ? 'Saving…' : template ? 'Save' : 'Create'}
            </button>
            {err && <div className="mt-2 text-xs font-bold text-red-600">{err}</div>}
            {flash && <div className="mt-2 text-xs font-bold text-green-600">✓ Saved</div>}
          </div>
          {template && (
            <button onClick={remove} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white py-2 text-xs font-bold text-red-600 hover:bg-red-50">
              <Trash2 size={14} /> Delete template
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
