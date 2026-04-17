'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus, Eye, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { createTemplate, updateTemplate, deleteTemplate } from '@/app/admin/gifts/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import type { GiftTemplate, GiftTemplateZone } from '@/lib/gifts/types';

/**
 * Comprehensive template editor.
 *
 * The right side shows a WYSIWYG canvas:
 *   - Background image (full-bleed)
 *   - Each photo zone rendered as a semi-transparent pink rectangle with
 *     handles. Click + drag to reposition, drag corner to resize.
 *   - Foreground image (masks, frames) overlays on top.
 *   - Optional "test photo" can be dropped into the active zone to
 *     preview what the customer will see.
 *
 * The left side is all settings: name, description, assets, zone list,
 * publish toggle, display order.
 */

const SAMPLE_TEST = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="%23ffb3d1"/>
      <stop offset="100%" stop-color="%23c4b5fd"/>
    </linearGradient></defs>
    <rect width="200" height="200" fill="url(%23g)"/>
    <text x="100" y="110" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="%23fff">
      SAMPLE PHOTO
    </text>
  </svg>`
);

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
  const [zones, setZones] = useState<GiftTemplateZone[]>(
    (template?.zones_json as GiftTemplateZone[]) ?? []
  );

  // Canvas: we store everything in "template mm units" — 0..100 = percent of
  // the template's natural size. Then render proportionally to whatever
  // image aspect ratio the background has. This keeps zone coordinates
  // stable regardless of how the admin displays them.
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 560, h: 560 });
  useEffect(() => {
    function measure() {
      const el = canvasRef.current;
      if (el) setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const [activeZoneIdx, setActiveZoneIdx] = useState<number | null>(null);
  const [showSample, setShowSample] = useState(true);

  // Template size (in abstract mm). We use 200×200 as default; bg image
  // aspect ratio is used by the canvas scaling.
  const templateW = 200, templateH = 200;

  function updateZone(i: number, patch: Partial<GiftTemplateZone>) {
    setZones(zones.map((z, j) => (j === i ? { ...z, ...patch } : z)));
  }

  function addZone() {
    setZones([
      ...zones,
      {
        id: `zone${zones.length + 1}`,
        label: `Photo ${zones.length + 1}`,
        x_mm: 20, y_mm: 20, width_mm: 60, height_mm: 60,
        rotation_deg: 0,
      },
    ]);
    setActiveZoneIdx(zones.length);
  }

  function duplicateZone(i: number) {
    const z = zones[i];
    const copy: GiftTemplateZone = {
      ...z,
      id: `${z.id}-copy`,
      label: `${z.label} (copy)`,
      x_mm: Math.min(templateW - z.width_mm, z.x_mm + 10),
      y_mm: Math.min(templateH - z.height_mm, z.y_mm + 10),
    };
    setZones([...zones, copy]);
  }

  function removeZone(i: number) {
    setZones(zones.filter((_, j) => j !== i));
    if (activeZoneIdx === i) setActiveZoneIdx(null);
  }

  function moveZone(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= zones.length) return;
    const next = [...zones];
    [next[i], next[j]] = [next[j], next[i]];
    setZones(next);
  }

  // Drag handling for zones on the canvas
  const [drag, setDrag] = useState<null | { type: 'move' | 'resize'; idx: number; startX: number; startY: number; startZone: GiftTemplateZone }>(null);

  function onCanvasPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const dx = ((e.clientX - drag.startX) / canvasSize.w) * templateW;
    const dy = ((e.clientY - drag.startY) / canvasSize.h) * templateH;
    const z = drag.startZone;
    if (drag.type === 'move') {
      const nx = clamp(z.x_mm + dx, 0, templateW - z.width_mm);
      const ny = clamp(z.y_mm + dy, 0, templateH - z.height_mm);
      updateZone(drag.idx, { x_mm: nx, y_mm: ny });
    } else {
      const nw = clamp(z.width_mm + dx, 10, templateW - z.x_mm);
      const nh = clamp(z.height_mm + dy, 10, templateH - z.y_mm);
      updateZone(drag.idx, { width_mm: nw, height_mm: nh });
    }
  }
  function endDrag() { setDrag(null); }

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
    if (!confirm('Delete this template? Existing orders stay intact.')) return;
    startTransition(async () => {
      const r = await deleteTemplate(template.id);
      if (!r.ok) setErr(r.error);
      else router.push('/admin/gifts/templates');
    });
  }

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/gifts/templates" className="text-sm font-bold text-neutral-500 hover:text-ink">← Back to templates</Link>
        <div className="text-sm font-bold text-ink">{template ? 'Edit template' : 'New template'}</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        {/* LEFT: settings */}
        <div className="space-y-5">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Hearts Frame" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} placeholder="Shown to customers under the thumbnail" />
            </label>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
            <div className="text-xs font-bold text-ink">Template assets</div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">1. Thumbnail <span className="text-neutral-400">(template picker card)</span></div>
              <ImageUpload value={thumbnail} onChange={setThumbnail} prefix="tpl-thumb" aspect={1} size="md" label="Thumbnail" />
            </div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">2. Background <span className="text-neutral-400">(behind customer photo)</span></div>
              <ImageUpload value={background} onChange={setBackground} prefix="tpl-bg" aspect={1} size="md" label="Background" />
            </div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">3. Foreground <span className="text-neutral-400">(overlays, frame, text — needs transparency)</span></div>
              <ImageUpload value={foreground} onChange={setForeground} prefix="tpl-fg" aspect={1} size="md" label="Foreground" />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink">Photo zones</div>
                <div className="text-[11px] text-neutral-500">Where the customer&apos;s photo drops in</div>
              </div>
              <button type="button" onClick={addZone} className="inline-flex items-center gap-1 rounded-full bg-pink px-3 py-1.5 text-[11px] font-bold text-white hover:bg-pink-dark">
                <Plus size={12} /> Zone
              </button>
            </div>
            {zones.length === 0 ? (
              <div className="rounded border border-dashed border-neutral-300 p-4 text-center text-[11px] text-neutral-500">
                No zones. Add at least one to let customer photos land somewhere.
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map((z, i) => {
                  const active = activeZoneIdx === i;
                  return (
                    <div key={i} className={`rounded-lg border-2 p-3 ${active ? 'border-pink bg-pink/5' : 'border-neutral-200'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveZoneIdx(active ? null : i)}
                        className="mb-2 flex w-full items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-pink text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-bold text-ink">{z.label || 'Untitled'}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500">
                          {Math.round(z.width_mm)}×{Math.round(z.height_mm)} @ {Math.round(z.x_mm)},{Math.round(z.y_mm)}
                        </span>
                      </button>
                      {active && (
                        <div className="mt-2 space-y-2 border-t border-neutral-200 pt-2">
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-600">Label</span>
                            <input value={z.label} onChange={(e) => updateZone(i, { label: e.target.value })} className={inputCls} />
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            <NumField label="X" value={z.x_mm} onChange={(v) => updateZone(i, { x_mm: v })} />
                            <NumField label="Y" value={z.y_mm} onChange={(v) => updateZone(i, { y_mm: v })} />
                            <NumField label="W" value={z.width_mm} onChange={(v) => updateZone(i, { width_mm: v })} />
                            <NumField label="H" value={z.height_mm} onChange={(v) => updateZone(i, { height_mm: v })} />
                          </div>
                          <div className="flex items-center gap-1 pt-1">
                            <button type="button" onClick={() => moveZone(i, -1)} className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100" title="Move up"><ArrowUp size={12} /></button>
                            <button type="button" onClick={() => moveZone(i, 1)} className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100" title="Move down"><ArrowDown size={12} /></button>
                            <button type="button" onClick={() => duplicateZone(i)} className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100" title="Duplicate"><Copy size={12} /></button>
                            <div className="flex-1" />
                            <button type="button" onClick={() => removeZone(i)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Remove"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
            <label className="block">
              <span className="mb-1 block text-[11px] text-neutral-600">Display order</span>
              <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} className={inputCls} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="font-semibold text-ink">Active (customers can pick this template)</span>
            </label>
          </div>
        </div>

        {/* RIGHT: visual canvas */}
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2">
              <div>
                <div className="text-xs font-bold text-ink">Live preview</div>
                <div className="text-[10px] text-neutral-500">Drag the pink rectangles to position photo zones. Drag corner to resize.</div>
              </div>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-neutral-600">
                <input type="checkbox" checked={showSample} onChange={(e) => setShowSample(e.target.checked)} />
                <Eye size={12} /> Show sample photo
              </label>
            </div>
            <div
              ref={canvasRef}
              className="relative mx-auto my-6 aspect-square w-full max-w-xl select-none overflow-hidden rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-100"
              onPointerMove={onCanvasPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              style={{ touchAction: 'none' }}
            >
              {/* Background */}
              {background && (
                <img src={background} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              )}

              {/* Sample photo inside active zone */}
              {showSample && activeZoneIdx !== null && zones[activeZoneIdx] && (
                <div
                  className="pointer-events-none absolute overflow-hidden"
                  style={{
                    left: `${(zones[activeZoneIdx].x_mm / templateW) * 100}%`,
                    top: `${(zones[activeZoneIdx].y_mm / templateH) * 100}%`,
                    width: `${(zones[activeZoneIdx].width_mm / templateW) * 100}%`,
                    height: `${(zones[activeZoneIdx].height_mm / templateH) * 100}%`,
                  }}
                >
                  <img src={SAMPLE_TEST} alt="" className="h-full w-full object-cover" />
                </div>
              )}

              {/* Foreground — above sample, below zone UI */}
              {foreground && (
                <img src={foreground} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              )}

              {/* Zone rectangles */}
              {zones.map((z, i) => {
                const active = activeZoneIdx === i;
                const left = (z.x_mm / templateW) * 100;
                const top = (z.y_mm / templateH) * 100;
                const width = (z.width_mm / templateW) * 100;
                const height = (z.height_mm / templateH) * 100;
                return (
                  <div
                    key={i}
                    className={`absolute border-2 transition-colors ${active ? 'border-pink' : 'border-white/70'}`}
                    style={{
                      left: `${left}%`, top: `${top}%`,
                      width: `${width}%`, height: `${height}%`,
                      background: active ? 'rgba(233,30,140,0.14)' : 'rgba(255,255,255,0.08)',
                      boxShadow: active ? '0 0 0 3px rgba(233,30,140,0.28)' : 'none',
                      cursor: 'move',
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setActiveZoneIdx(i);
                      setDrag({ type: 'move', idx: i, startX: e.clientX, startY: e.clientY, startZone: z });
                    }}
                  >
                    <div className="absolute left-1 top-1 rounded bg-pink px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      {i + 1} · {z.label}
                    </div>
                    {/* Resize handle (bottom-right) */}
                    <div
                      onPointerDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setActiveZoneIdx(i);
                        setDrag({ type: 'resize', idx: i, startX: e.clientX, startY: e.clientY, startZone: z });
                      }}
                      className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full border-2 border-pink bg-white"
                    />
                  </div>
                );
              })}

              {/* Empty state */}
              {!background && zones.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-neutral-400">
                  <div className="mb-2 text-3xl">🖼️</div>
                  <div className="text-xs">Upload a background image on the left<br />to start designing.</div>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 px-4 py-2 text-[10px] text-neutral-500">
              Canvas uses abstract template units (0-{templateW}). Real-world dimensions are set on each product that uses this template.
            </div>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-between gap-4 rounded-lg border-2 border-ink bg-white p-4 shadow-brand">
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          {err && <span className="font-bold text-red-600">{err}</span>}
          {flash && <span className="font-bold text-green-600">✓ Saved</span>}
          {!err && !flash && <span>Canvas edits save when you click Save.</span>}
          {template && (
            <button onClick={remove} disabled={isPending} className="ml-3 text-[11px] font-bold text-red-600 hover:underline">
              Delete
            </button>
          )}
        </div>
        <button onClick={save} disabled={isPending} className="rounded-full bg-pink px-6 py-2 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50">
          {isPending ? 'Saving…' : template ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">{label}</span>
      <input
        type="number"
        step="1"
        value={Math.round(value)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded border-2 border-neutral-200 bg-white px-2 py-1 text-xs font-mono focus:border-pink focus:outline-none"
      />
    </label>
  );
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
