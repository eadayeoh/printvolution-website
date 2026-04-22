'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Eye, ArrowUp, ArrowDown, Copy, Image as ImageIcon, Type, Lock, RotateCw } from 'lucide-react';
import { createTemplate, updateTemplate, deleteTemplate } from '@/app/admin/gifts/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import {
  GIFT_FONT_FAMILIES,
  giftFontStack,
  type GiftTemplate,
  type GiftTemplateZone,
  type GiftTemplateImageZone,
  type GiftTemplateTextZone,
} from '@/lib/gifts/types';

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

const TEMPLATE_W = 200, TEMPLATE_H = 200;

function isTextZone(z: GiftTemplateZone): z is GiftTemplateTextZone {
  return z.type === 'text';
}

function makeImageZone(n: number): GiftTemplateImageZone {
  return {
    type: 'image',
    id: `img${n}`,
    label: `Photo ${n}`,
    x_mm: 20, y_mm: 20, width_mm: 60, height_mm: 60,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 0,
    allow_rotate: false,
    allow_zoom: true,
  };
}

function makeTextZone(n: number): GiftTemplateTextZone {
  return {
    type: 'text',
    id: `txt${n}`,
    label: `Text ${n}`,
    x_mm: 20, y_mm: 100, width_mm: 160, height_mm: 24,
    rotation_deg: 0,
    default_text: 'Your text here',
    placeholder: 'Enter your message',
    font_family: 'fraunces',
    font_size_mm: 14,
    font_weight: '700',
    font_style: 'normal',
    color: '#0a0a0a',
    align: 'center',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1.2,
    letter_spacing_em: 0,
    max_chars: 60,
  };
}

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
  const [refWidthMm, setRefWidthMm] = useState(
    template?.reference_width_mm ? String(template.reference_width_mm) : '',
  );
  const [refHeightMm, setRefHeightMm] = useState(
    template?.reference_height_mm ? String(template.reference_height_mm) : '',
  );
  // Preview aspect: if both reference dims are set, honour them;
  // otherwise fall back to the editor's legacy square canvas.
  const previewAspect = (() => {
    const w = parseFloat(refWidthMm);
    const h = parseFloat(refHeightMm);
    if (!w || !h || w <= 0 || h <= 0) return '1 / 1';
    return `${w} / ${h}`;
  })();
  const [zones, setZones] = useState<GiftTemplateZone[]>(
    ((template?.zones_json as GiftTemplateZone[]) ?? []).map((z) => ({
      ...z,
      type: z.type ?? 'image',
    })) as GiftTemplateZone[]
  );

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

  function updateZone<T extends GiftTemplateZone>(i: number, patch: Partial<T>) {
    setZones(zones.map((z, j) => (j === i ? ({ ...z, ...patch } as GiftTemplateZone) : z)));
  }

  function addImageZone() {
    const n = zones.filter((z) => !isTextZone(z)).length + 1;
    setZones([...zones, makeImageZone(n)]);
    setActiveZoneIdx(zones.length);
  }

  function addTextZone() {
    const n = zones.filter(isTextZone).length + 1;
    setZones([...zones, makeTextZone(n)]);
    setActiveZoneIdx(zones.length);
  }

  function duplicateZone(i: number) {
    const z = zones[i];
    const copy: GiftTemplateZone = {
      ...z,
      id: `${z.id}-copy`,
      label: `${z.label} (copy)`,
      x_mm: Math.min(TEMPLATE_W - z.width_mm, z.x_mm + 10),
      y_mm: Math.min(TEMPLATE_H - z.height_mm, z.y_mm + 10),
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

  const [drag, setDrag] = useState<null | { type: 'move' | 'resize'; idx: number; startX: number; startY: number; startZone: GiftTemplateZone }>(null);

  function onCanvasPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const dx = ((e.clientX - drag.startX) / canvasSize.w) * TEMPLATE_W;
    const dy = ((e.clientY - drag.startY) / canvasSize.h) * TEMPLATE_H;
    const z = drag.startZone;
    if (drag.type === 'move') {
      const nx = clamp(z.x_mm + dx, 0, TEMPLATE_W - z.width_mm);
      const ny = clamp(z.y_mm + dy, 0, TEMPLATE_H - z.height_mm);
      updateZone(drag.idx, { x_mm: nx, y_mm: ny });
    } else {
      const nw = clamp(z.width_mm + dx, 10, TEMPLATE_W - z.x_mm);
      const nh = clamp(z.height_mm + dy, 6, TEMPLATE_H - z.y_mm);
      updateZone(drag.idx, { width_mm: nw, height_mm: nh });
    }
  }
  function endDrag() { setDrag(null); }

  function save() {
    setErr(null);
    if (!name.trim()) { setErr('Name required'); return; }
    const refWParsed = parseFloat(refWidthMm);
    const refHParsed = parseFloat(refHeightMm);
    const payload: any = {
      name: name.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnail || null,
      background_url: background || null,
      foreground_url: foreground || null,
      zones_json: zones,
      display_order: parseInt(displayOrder, 10) || 0,
      is_active: isActive,
      reference_width_mm:  Number.isFinite(refWParsed) && refWParsed > 0 ? refWParsed : null,
      reference_height_mm: Number.isFinite(refHParsed) && refHParsed > 0 ? refHParsed : null,
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

  const imageCount = zones.filter((z) => !isTextZone(z)).length;
  const textCount = zones.filter(isTextZone).length;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/gifts/templates" className="text-sm font-bold text-neutral-500 hover:text-ink">← Back to templates</Link>
        <div className="text-sm font-bold text-ink">{template ? 'Edit template' : 'New template'}</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
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

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
            <div>
              <div className="text-xs font-bold text-ink">Canvas aspect (reference dimensions)</div>
              <div className="text-[11px] text-neutral-500">
                The real-world dimensions the layout was authored for. Sets the preview aspect ratio here and lets the
                render pipeline scale zones to different product sizes. Leave blank for a square preview.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-ink">Reference width (mm)</span>
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={refWidthMm}
                  onChange={(e) => setRefWidthMm(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 297 (A3 width)"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-ink">Reference height (mm)</span>
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={refHeightMm}
                  onChange={(e) => setRefHeightMm(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 420 (A3 height)"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'A3 portrait',  w: 297,  h: 420 },
                { label: 'A4 portrait',  w: 210,  h: 297 },
                { label: 'A5 portrait',  w: 148,  h: 210 },
                { label: 'A3 landscape', w: 420,  h: 297 },
                { label: 'A4 landscape', w: 297,  h: 210 },
                { label: 'Square',       w: 200,  h: 200 },
                { label: '4:5 portrait', w: 200,  h: 250 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setRefWidthMm(String(p.w)); setRefHeightMm(String(p.h)); }}
                  className="rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-neutral-700 hover:border-pink hover:text-pink"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
            <div className="text-xs font-bold text-ink">Template assets</div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">1. Thumbnail <span className="text-neutral-400">(template picker card)</span></div>
              <ImageUpload value={thumbnail} onChange={setThumbnail} prefix="tpl-thumb" aspect={1} size="md" label="Thumbnail" />
            </div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">2. Background <span className="text-neutral-400">(behind customer photo + text)</span></div>
              <ImageUpload value={background} onChange={setBackground} prefix="tpl-bg" aspect={1} size="md" label="Background" />
            </div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">3. Foreground <span className="text-neutral-400">(overlays — needs transparency)</span></div>
              <ImageUpload value={foreground} onChange={setForeground} prefix="tpl-fg" aspect={1} size="md" label="Foreground" />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-ink">Template slots</div>
                <div className="text-[11px] text-neutral-500">
                  {imageCount} image · {textCount} text
                </div>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={addImageZone} className="inline-flex items-center gap-1 rounded-full bg-pink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-pink-dark">
                  <ImageIcon size={11} /> Image
                </button>
                <button type="button" onClick={addTextZone} className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-neutral-700">
                  <Type size={11} /> Text
                </button>
              </div>
            </div>
            {zones.length === 0 ? (
              <div className="rounded border border-dashed border-neutral-300 p-4 text-center text-[11px] text-neutral-500">
                No slots yet. Add image zones for customer photos, text zones for customizable messages.
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map((z, i) => {
                  const active = activeZoneIdx === i;
                  const isText = isTextZone(z);
                  return (
                    <div key={i} className={`rounded-lg border-2 ${active ? 'border-pink bg-pink/5' : 'border-neutral-200'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveZoneIdx(active ? null : i)}
                        className="flex w-full items-center justify-between gap-2 p-3 text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${isText ? 'bg-ink text-white' : 'bg-pink text-white'}`}>
                            {isText ? <Type size={12} /> : <ImageIcon size={12} />}
                          </span>
                          <span className="text-sm font-bold text-ink truncate">{z.label || 'Untitled'}</span>
                          {isText && (z as GiftTemplateTextZone).editable === false && (
                            <Lock size={11} className="shrink-0 text-neutral-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 shrink-0">
                          {Math.round(z.width_mm)}×{Math.round(z.height_mm)}
                        </span>
                      </button>
                      {active && (
                        <div className="space-y-3 border-t border-neutral-200 p-3">
                          {isText
                            ? <TextZoneFields zone={z as GiftTemplateTextZone} onChange={(p) => updateZone<GiftTemplateTextZone>(i, p)} />
                            : <ImageZoneFields zone={z as GiftTemplateImageZone} onChange={(p) => updateZone<GiftTemplateImageZone>(i, p)} />}

                          <div className="grid grid-cols-4 gap-1.5 border-t border-neutral-200 pt-3">
                            <NumField label="X" value={z.x_mm} onChange={(v) => updateZone(i, { x_mm: v })} />
                            <NumField label="Y" value={z.y_mm} onChange={(v) => updateZone(i, { y_mm: v })} />
                            <NumField label="W" value={z.width_mm} onChange={(v) => updateZone(i, { width_mm: v })} />
                            <NumField label="H" value={z.height_mm} onChange={(v) => updateZone(i, { height_mm: v })} />
                          </div>
                          <div>
                            <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Rotation</div>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={-180} max={180} step={1}
                                value={z.rotation_deg ?? 0}
                                onChange={(e) => updateZone(i, { rotation_deg: parseInt(e.target.value, 10) })}
                                className="flex-1"
                              />
                              <input
                                type="number"
                                value={Math.round(z.rotation_deg ?? 0)}
                                onChange={(e) => updateZone(i, { rotation_deg: parseFloat(e.target.value) || 0 })}
                                className="w-14 rounded border-2 border-neutral-200 px-1 py-0.5 text-xs font-mono"
                              />
                              <RotateCw size={11} className="text-neutral-400" />
                            </div>
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
                <div className="text-[10px] text-neutral-500">Drag any slot to move. Drag corner to resize.</div>
              </div>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-neutral-600">
                <input type="checkbox" checked={showSample} onChange={(e) => setShowSample(e.target.checked)} />
                <Eye size={12} /> Show sample content
              </label>
            </div>
            <div
              ref={canvasRef}
              className="relative mx-auto my-6 w-full max-w-xl select-none overflow-hidden rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-100"
              onPointerMove={onCanvasPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              style={{ touchAction: 'none', aspectRatio: previewAspect }}
            >
              {background && (
                <img src={background} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              )}

              {/* Render image zones with their content */}
              {showSample && zones.map((z, i) => {
                if (isTextZone(z)) return null;
                const img = z as GiftTemplateImageZone;
                const content = img.default_image_url || (activeZoneIdx === i ? SAMPLE_TEST : null);
                if (!content) return null;
                const fit = img.fit_mode ?? 'cover';
                return (
                  <div
                    key={`pv-${i}`}
                    className="pointer-events-none absolute overflow-hidden"
                    style={{
                      left: `${(z.x_mm / TEMPLATE_W) * 100}%`,
                      top: `${(z.y_mm / TEMPLATE_H) * 100}%`,
                      width: `${(z.width_mm / TEMPLATE_W) * 100}%`,
                      height: `${(z.height_mm / TEMPLATE_H) * 100}%`,
                      transform: `rotate(${z.rotation_deg ?? 0}deg)`,
                      transformOrigin: 'center',
                      background: img.bg_color ?? 'transparent',
                      borderRadius: `${((img.border_radius_mm ?? 0) / TEMPLATE_W) * 100}%`,
                    }}
                  >
                    <img
                      src={content}
                      alt=""
                      className="h-full w-full"
                      style={{ objectFit: fit }}
                    />
                    {img.mask_url && (
                      <img src={img.mask_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                  </div>
                );
              })}

              {foreground && (
                <img src={foreground} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              )}

              {/* Render text zones with their styling */}
              {showSample && zones.map((z, i) => {
                if (!isTextZone(z)) return null;
                const pxPerMm = canvasSize.w / TEMPLATE_W;
                const fontPx = Math.max(6, (z.font_size_mm ?? 14) * pxPerMm);
                const vAlign = z.vertical_align ?? 'middle';
                return (
                  <div
                    key={`tv-${i}`}
                    className="pointer-events-none absolute flex overflow-hidden"
                    style={{
                      left: `${(z.x_mm / TEMPLATE_W) * 100}%`,
                      top: `${(z.y_mm / TEMPLATE_H) * 100}%`,
                      width: `${(z.width_mm / TEMPLATE_W) * 100}%`,
                      height: `${(z.height_mm / TEMPLATE_H) * 100}%`,
                      transform: `rotate(${z.rotation_deg ?? 0}deg)`,
                      transformOrigin: 'center',
                      justifyContent: z.align === 'left' ? 'flex-start' : z.align === 'right' ? 'flex-end' : 'center',
                      alignItems: vAlign === 'top' ? 'flex-start' : vAlign === 'bottom' ? 'flex-end' : 'center',
                      padding: '2px',
                    }}
                  >
                    <span style={{
                      fontFamily: giftFontStack(z.font_family),
                      fontSize: fontPx,
                      fontWeight: z.font_weight ?? '700',
                      fontStyle: z.font_style ?? 'normal',
                      color: z.color ?? '#0a0a0a',
                      textAlign: z.align ?? 'center',
                      lineHeight: z.line_height ?? 1.2,
                      letterSpacing: `${z.letter_spacing_em ?? 0}em`,
                      textTransform: z.text_transform ?? 'none',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                    }}>
                      {z.default_text || z.placeholder || z.label}
                    </span>
                  </div>
                );
              })}

              {/* Zone handles + outlines — above everything */}
              {zones.map((z, i) => {
                const active = activeZoneIdx === i;
                const left = (z.x_mm / TEMPLATE_W) * 100;
                const top = (z.y_mm / TEMPLATE_H) * 100;
                const width = (z.width_mm / TEMPLATE_W) * 100;
                const height = (z.height_mm / TEMPLATE_H) * 100;
                const isText = isTextZone(z);
                const accent = isText ? '#0a0a0a' : '#E91E8C';
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${left}%`, top: `${top}%`,
                      width: `${width}%`, height: `${height}%`,
                      transform: `rotate(${z.rotation_deg ?? 0}deg)`,
                      transformOrigin: 'center',
                      cursor: 'move',
                      border: active ? `2px solid ${accent}` : '2px dashed rgba(0,0,0,0.25)',
                      background: active ? `${accent}1a` : 'transparent',
                      boxShadow: active ? `0 0 0 3px ${accent}33` : 'none',
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setActiveZoneIdx(i);
                      setDrag({ type: 'move', idx: i, startX: e.clientX, startY: e.clientY, startZone: z });
                    }}
                  >
                    <div
                      className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-white"
                      style={{ background: accent }}
                    >
                      {isText ? 'T' : 'I'} · {z.label}
                    </div>
                    <div
                      onPointerDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setActiveZoneIdx(i);
                        setDrag({ type: 'resize', idx: i, startX: e.clientX, startY: e.clientY, startZone: z });
                      }}
                      className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full border-2 bg-white"
                      style={{ borderColor: accent }}
                    />
                  </div>
                );
              })}

              {!background && zones.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-neutral-400">
                  <div className="mb-2 text-3xl">🖼️</div>
                  <div className="text-xs">Upload a background on the left<br />then add image or text slots.</div>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 px-4 py-2 text-[10px] text-neutral-500">
              Canvas units are 0–{TEMPLATE_W}. Real-world dimensions come from the product that uses this template.
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

function ImageZoneFields({ zone, onChange }: { zone: GiftTemplateImageZone; onChange: (p: Partial<GiftTemplateImageZone>) => void }) {
  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Label</span>
        <input value={zone.label} onChange={(e) => onChange({ label: e.target.value })} className={inputCls} />
      </label>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Fit</div>
        <div className="grid grid-cols-3 gap-1">
          {(['cover', 'contain', 'fill'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChange({ fit_mode: f })}
              className={`rounded border-2 px-2 py-1 text-[10px] font-bold uppercase ${
                (zone.fit_mode ?? 'cover') === f ? 'border-pink bg-pink text-white' : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Default image (optional)</div>
        <ImageUpload value={zone.default_image_url ?? ''} onChange={(v) => onChange({ default_image_url: v || null })} prefix="zone-default" aspect={1} size="sm" label="Default" />
        <div className="mt-1 text-[10px] text-neutral-500">Shown if the customer doesn&apos;t upload a photo for this slot.</div>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Mask (transparent overlay)</div>
        <ImageUpload value={zone.mask_url ?? ''} onChange={(v) => onChange({ mask_url: v || null })} prefix="zone-mask" aspect={1} size="sm" label="Mask" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumField
          label="Corner radius (mm)"
          value={zone.border_radius_mm ?? 0}
          onChange={(v) => onChange({ border_radius_mm: v })}
        />
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Bg color</span>
          <div className="flex gap-1">
            <input
              type="color"
              value={zone.bg_color ?? '#ffffff'}
              onChange={(e) => onChange({ bg_color: e.target.value })}
              className="h-7 w-9 shrink-0 cursor-pointer rounded border-2 border-neutral-200"
            />
            <button
              type="button"
              onClick={() => onChange({ bg_color: null })}
              className="rounded border-2 border-neutral-200 px-2 text-[9px] font-bold uppercase text-neutral-500 hover:bg-neutral-100"
              title="Clear"
            >
              clear
            </button>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <label className="flex items-center gap-2 text-[11px] text-neutral-700">
          <input type="checkbox" checked={zone.allow_zoom ?? true} onChange={(e) => onChange({ allow_zoom: e.target.checked })} />
          Customer can zoom
        </label>
        <label className="flex items-center gap-2 text-[11px] text-neutral-700">
          <input type="checkbox" checked={zone.allow_rotate ?? false} onChange={(e) => onChange({ allow_rotate: e.target.checked })} />
          Customer can rotate
        </label>
      </div>
    </div>
  );
}

function TextZoneFields({ zone, onChange }: { zone: GiftTemplateTextZone; onChange: (p: Partial<GiftTemplateTextZone>) => void }) {
  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Label (admin only)</span>
        <input value={zone.label} onChange={(e) => onChange({ label: e.target.value })} className={inputCls} placeholder="Headline" />
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Default text</span>
        <textarea
          value={zone.default_text ?? ''}
          onChange={(e) => onChange({ default_text: e.target.value })}
          rows={2}
          className={inputCls}
          placeholder="Happy Birthday"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Placeholder (empty hint)</span>
        <input
          value={zone.placeholder ?? ''}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          className={inputCls}
          placeholder="Your name"
        />
      </label>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Font</div>
        <select
          value={zone.font_family ?? 'fraunces'}
          onChange={(e) => onChange({ font_family: e.target.value })}
          className={inputCls}
        >
          {GIFT_FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.stack }}>{f.label}</option>
          ))}
        </select>
        <div
          className="mt-1 rounded border border-dashed border-neutral-300 bg-neutral-50 px-2 py-1 text-center"
          style={{
            fontFamily: giftFontStack(zone.font_family),
            fontSize: 18,
            fontWeight: zone.font_weight ?? '700',
            fontStyle: zone.font_style ?? 'normal',
            color: zone.color ?? '#0a0a0a',
            textTransform: zone.text_transform ?? 'none',
            letterSpacing: `${zone.letter_spacing_em ?? 0}em`,
          }}
        >
          {zone.default_text || 'Ag'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Size (mm)</span>
          <input
            type="number" step="0.5" min="1"
            value={zone.font_size_mm ?? 14}
            onChange={(e) => onChange({ font_size_mm: parseFloat(e.target.value) || 1 })}
            className="w-full rounded border-2 border-neutral-200 px-2 py-1 text-xs font-mono"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Weight</span>
          <select
            value={zone.font_weight ?? '700'}
            onChange={(e) => onChange({ font_weight: e.target.value as GiftTemplateTextZone['font_weight'] })}
            className="w-full rounded border-2 border-neutral-200 bg-white px-1 py-1 text-xs"
          >
            <option value="300">300 Light</option>
            <option value="400">400 Regular</option>
            <option value="600">600 Semibold</option>
            <option value="700">700 Bold</option>
            <option value="800">800 Extra</option>
            <option value="900">900 Black</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Style</span>
          <select
            value={zone.font_style ?? 'normal'}
            onChange={(e) => onChange({ font_style: e.target.value as 'normal' | 'italic' })}
            className="w-full rounded border-2 border-neutral-200 bg-white px-1 py-1 text-xs"
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-[1fr_80px] gap-2">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Color</div>
          <input
            type="color"
            value={zone.color ?? '#0a0a0a'}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-9 w-full cursor-pointer rounded border-2 border-neutral-200"
          />
        </div>
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Transform</div>
          <select
            value={zone.text_transform ?? 'none'}
            onChange={(e) => onChange({ text_transform: e.target.value as GiftTemplateTextZone['text_transform'] })}
            className="w-full rounded border-2 border-neutral-200 bg-white px-1 py-2 text-xs"
          >
            <option value="none">Aa</option>
            <option value="uppercase">AA</option>
            <option value="lowercase">aa</option>
            <option value="capitalize">Aa</option>
          </select>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Horizontal align</div>
        <div className="grid grid-cols-3 gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onChange({ align: a })}
              className={`rounded border-2 px-2 py-1 text-[10px] font-bold uppercase ${
                (zone.align ?? 'center') === a ? 'border-ink bg-ink text-white' : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Vertical align</div>
        <div className="grid grid-cols-3 gap-1">
          {(['top', 'middle', 'bottom'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onChange({ vertical_align: a })}
              className={`rounded border-2 px-2 py-1 text-[10px] font-bold uppercase ${
                (zone.vertical_align ?? 'middle') === a ? 'border-ink bg-ink text-white' : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Line height</span>
          <input
            type="number" step="0.05" min="0.8" max="3"
            value={zone.line_height ?? 1.2}
            onChange={(e) => onChange({ line_height: parseFloat(e.target.value) || 1.2 })}
            className="w-full rounded border-2 border-neutral-200 px-2 py-1 text-xs font-mono"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Letter spacing (em)</span>
          <input
            type="number" step="0.01"
            value={zone.letter_spacing_em ?? 0}
            onChange={(e) => onChange({ letter_spacing_em: parseFloat(e.target.value) || 0 })}
            className="w-full rounded border-2 border-neutral-200 px-2 py-1 text-xs font-mono"
          />
        </label>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Max characters</span>
          <input
            type="number" min="1"
            value={zone.max_chars ?? ''}
            onChange={(e) => {
              const v = e.target.value ? parseInt(e.target.value, 10) : null;
              onChange({ max_chars: v });
            }}
            className="w-full rounded border-2 border-neutral-200 px-2 py-1 text-xs font-mono"
            placeholder="No limit"
          />
        </label>
        <label className="flex items-center gap-2 pb-1 text-[11px] text-neutral-700">
          <input
            type="checkbox"
            checked={zone.editable ?? true}
            onChange={(e) => onChange({ editable: e.target.checked })}
          />
          Customer can edit
        </label>
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
