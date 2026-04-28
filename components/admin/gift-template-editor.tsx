'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, ArrowUp, ArrowDown, Copy, Image as ImageIcon, Type, Lock, Unlock, RotateCw, Upload, Calendar as CalendarIcon } from 'lucide-react';
import { createTemplate, updateTemplate, deleteTemplate } from '@/app/admin/gifts/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import { MaskShapeDefs } from '@/components/gift/mask-shape-defs';
import { maskClipPathCss, maskPresetPath, MASK_PRESET_LABELS } from '@/lib/gifts/mask-shapes';
import type { GiftImageZoneMaskPreset } from '@/lib/gifts/types';
import {
  GIFT_FONT_FAMILIES,
  GIFT_MODE_LABEL,
  giftFontStack,
  type GiftTemplate,
  type GiftTemplateZone,
  type GiftTemplateImageZone,
  type GiftTemplateTextZone,
  type GiftTemplateCalendarZone,
  type GiftTemplateRenderAnchorZone,
  type GiftMode,
} from '@/lib/gifts/types';
import type { GiftModeMeta } from '@/lib/gifts/modes';
import { renderCalendarSvg } from '@/lib/gifts/pipeline/calendar-svg';
import { buildCityMapSvg } from '@/lib/gifts/city-map-svg';
import { buildStarMapSvg, buildStarMapScene } from '@/lib/gifts/star-map-svg';
import { SongLyricsTemplate } from '@/components/gift/song-lyrics-template';

const GIFT_MODES: GiftMode[] = ['laser', 'uv', 'embroidery', 'photo-resize', 'eco-solvent', 'digital', 'uv-dtf'];

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

function isCalendarZone(z: GiftTemplateZone): z is GiftTemplateCalendarZone {
  return (z as GiftTemplateCalendarZone).type === 'calendar';
}

function isRenderAnchorZone(z: GiftTemplateZone): z is GiftTemplateRenderAnchorZone {
  return (z as GiftTemplateRenderAnchorZone).type === 'render_anchor';
}

/** Seed defaults for renderer-driven templates so admins start with
 *  a sensible layout they can drag instead of an empty canvas.
 *  Returns the zones expressed in 0..200 canvas units (TEMPLATE_W/H). */
function defaultZonesForRenderer(renderer: string): GiftTemplateZone[] {
  if (renderer === 'star_map') {
    // Mirror the renderer's hardcoded foil layout: disk roughly centred
    // top half, four-line footer below. Admin can drag any of these.
    return [
      {
        type: 'render_anchor',
        anchor_kind: 'star_disk',
        id: 'star_disk',
        label: 'Sky disk · code-driven · drag to position',
        x_mm: 12, y_mm: 7,           // ≈ (6, 6) in viewBox / R≈44
        width_mm: 176, height_mm: 130,
      },
      {
        type: 'text', id: 'star_names', label: 'Names',
        x_mm: 20, y_mm: 154, width_mm: 160, height_mm: 14,
        font_family: 'Archivo', font_size_mm: 7.2, font_weight: '600',
        align: 'center', color: '#d4af37', letter_spacing_em: 0.05,
        text_transform: 'none', editable: false,
      },
      {
        type: 'text', id: 'star_event', label: 'Event subtitle',
        x_mm: 20, y_mm: 162, width_mm: 160, height_mm: 12,
        font_family: 'Archivo', font_size_mm: 6.4,
        align: 'center', color: '#d4af37', letter_spacing_em: 0.05,
        text_transform: 'uppercase', editable: false,
      },
      {
        type: 'text', id: 'star_location', label: 'Location label',
        x_mm: 20, y_mm: 175, width_mm: 160, height_mm: 18,
        font_family: 'Playfair Display', font_size_mm: 13,
        font_weight: '700', align: 'center', color: '#d4af37',
        letter_spacing_em: 0.07, text_transform: 'uppercase',
        editable: false,
      },
      {
        type: 'text', id: 'star_tagline', label: 'Tagline (italic)',
        x_mm: 20, y_mm: 188, width_mm: 160, height_mm: 10,
        font_family: 'Playfair Display', font_size_mm: 6.8,
        font_style: 'italic', align: 'center', color: '#d4af37',
        editable: false,
      },
      {
        type: 'text', id: 'star_caption', label: 'Coords / date caption',
        x_mm: 20, y_mm: 145, width_mm: 160, height_mm: 7,
        font_family: 'Archivo', font_size_mm: 3.4,
        align: 'center', color: '#d4af37', letter_spacing_em: 0.04,
        editable: false,
      },
    ];
  }
  return [];
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

function makeCalendarZone(n: number): GiftTemplateCalendarZone {
  const today = new Date();
  return {
    type: 'calendar',
    id: `cal${n}`,
    label: `Calendar ${n}`,
    x_mm: 30, y_mm: 60, width_mm: 140, height_mm: 110,
    rotation_deg: 0,
    header_layout: 'above',
    header_font_family: 'fraunces',
    header_font_size_mm: 12,
    header_font_weight: '700',
    header_color: '#0a0a0a',
    grid_font_family: 'inter',
    grid_font_size_mm: 6,
    grid_color: '#0a0a0a',
    week_start: 'sunday',
    highlight_shape: 'circle',
    highlight_fill: '#ec4899',
    highlight_text_color: '#ffffff',
    default_month: today.getMonth() + 1,
    default_year: today.getFullYear(),
    default_highlighted_day: today.getDate(),
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

export function GiftTemplateEditor({
  template,
  existingGroups,
  availableModes,
}: {
  template: GiftTemplate | null;
  /** Group names already in use across the template library. Powers
   *  the Group field's autocomplete so admins stay on existing
   *  buckets instead of accidentally coining a typo'd new one. */
  existingGroups?: string[];
  /** Active gift_modes rows, used to populate the mode-override
   *  dropdown. Pulled fresh per page render so newly-added admin
   *  modes show up without a code change. */
  availableModes: Array<Pick<GiftModeMeta, 'slug' | 'label'>>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [name, setName] = useState(template?.name ?? '');
  const [groupName, setGroupName] = useState(template?.group_name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [thumbnail, setThumbnail] = useState(template?.thumbnail_url ?? '');
  const [background, setBackground] = useState(template?.background_url ?? '');
  const [foreground, setForeground] = useState(template?.foreground_url ?? '');
  const [displayOrder, setDisplayOrder] = useState(template?.display_order?.toString() ?? '0');
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [customerCanRecolor, setCustomerCanRecolor] = useState(template?.customer_can_recolor ?? false);
  const [customerCanChangeFont, setCustomerCanChangeFont] = useState(template?.customer_can_change_font ?? false);
  // Customer colour picker (migration 0079). Per-template — different
  // templates on the same product can carry different swatch sets.
  const [customerPickerRole, setCustomerPickerRole] = useState<'none' | 'mockup_swap' | 'foil_overlay'>(
    (template?.customer_picker_role ?? 'none') as any,
  );
  const [customerSwatches, setCustomerSwatches] = useState<
    Array<{ name: string; hex: string; mockup_url?: string }>
  >(() =>
    (template?.customer_swatches ?? []).map((s) => ({
      name: s.name ?? '',
      hex: s.hex ?? '#000000',
      mockup_url: s.mockup_url ?? '',
    })),
  );
  // Per-template production mode override (migration 0080). Empty string
  // = inherit from gift_products.mode; any other value forces the cart
  // line's mode at checkout. Lets one product host multiple physical
  // SKUs (e.g. foil vs poster) selectable via the customer template
  // picker.
  const [modeOverride, setModeOverride] = useState<string>(template?.mode_override ?? '');
  const FOIL_QUICK_ADDS: Array<{ name: string; hex: string }> = [
    { name: 'Gold',      hex: '#FFD700' },
    { name: 'Rose Gold', hex: '#B76E79' },
    { name: 'Silver',    hex: '#C0C0C0' },
    { name: 'Copper',    hex: '#B87333' },
    { name: 'Black',     hex: '#0A0A0A' },
    { name: 'White',     hex: '#FFFFFF' },
  ];
  function addCustomerSwatch(s?: { name: string; hex: string }) {
    if (s && customerSwatches.some((x) => x.name.trim().toLowerCase() === s.name.toLowerCase())) return;
    setCustomerSwatches((list) => [...list, { name: s?.name ?? '', hex: s?.hex ?? '#000000', mockup_url: '' }]);
  }
  function updateCustomerSwatch(i: number, patch: Partial<{ name: string; hex: string; mockup_url: string }>) {
    setCustomerSwatches((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  function removeCustomerSwatch(i: number) {
    setCustomerSwatches((list) => list.filter((_, j) => j !== i));
  }
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
  const [zones, setZones] = useState<GiftTemplateZone[]>(() => {
    const raw = (template?.zones_json as GiftTemplateZone[]) ?? [];
    if (raw.length > 0) {
      return raw.map((z) => ({
        ...z,
        type: z.type ?? 'image',
      })) as GiftTemplateZone[];
    }
    // Empty zones + renderer-driven template → seed defaults so the
    // admin can drag positions/fonts/sizes instead of starting blank.
    // First save persists them. zones_json is the only schema slot
    // we use for renderer layout — same column the editor already saves.
    const r = template?.renderer;
    if (r && r !== 'zones') {
      return defaultZonesForRenderer(r);
    }
    return [];
  });

  // Renderer routing — read-only in the editor for now. Renderer-driven
  // templates (city_map / star_map / song_lyrics) ignore zones_json
  // entirely; their layout is defined in code. The canvas shows what the
  // renderer produces with sample data so admins can see the output even
  // though there are no zones to drag.
  const renderer = template?.renderer ?? 'zones';
  const isRendererTemplate = renderer && renderer !== 'zones';
  const rendererPreviewSvg: string | null = (() => {
    if (!isRendererTemplate) return null;
    if (renderer === 'city_map') {
      // Empty-state preview — vectors=null gives the "Enter a city to
      // render the map" placeholder. We don't fire an Overpass fetch
      // from the admin editor.
      return buildCityMapSvg({
        vectors: null,
        names: 'EVA & JOHN',
        event: 'OUR FIRST DATE',
        cityLabel: 'LONDON',
        tagline: 'Love now and always',
      });
    }
    if (renderer === 'star_map') {
      // Static example — current date, Singapore-ish coords. Zero-cost,
      // pure compute, runs in the admin editor without a network round
      // trip. Pass the current zones so the preview reflects whatever
      // the admin has dragged for disk position + footer text layout.
      const scene = buildStarMapScene(1.29, 103.85, new Date());
      const refW = parseFloat(refWidthMm);
      const refH = parseFloat(refHeightMm);
      return buildStarMapSvg({
        scene,
        dateUtc: new Date(),
        names: 'EVA & JOHN',
        event: 'THE NIGHT WE MET',
        locationLabel: 'SINGAPORE',
        tagline: 'Under our stars',
        coordinates: '1.29° N · 103.85° E',
        showLines: true,
        zones,
        templateRefDims:
          Number.isFinite(refW) && Number.isFinite(refH) && refW > 0 && refH > 0
            ? { width_mm: refW, height_mm: refH }
            : null,
      });
    }
    // song_lyrics — return null and fall back to the explanatory banner
    // (no quick way to render the React component to a string here).
    return null;
  })();

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
  // Grid overlay + snap-to-grid for the live-preview canvas. Step is in
  // canvas units (the same 0..200 grid x_mm/y_mm/width_mm/height_mm
  // live on); 5 ≈ a comfortable nudge increment, admin can change it.
  const [gridOn, setGridOn] = useState(false);
  const [snapOn, setSnapOn] = useState(false);
  const [gridStep, setGridStep] = useState(5);
  const snapV = (v: number) => (snapOn && gridStep > 0 ? Math.round(v / gridStep) * gridStep : v);

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

  function addCalendarZone() {
    const n = zones.filter(isCalendarZone).length + 1;
    setZones([...zones, makeCalendarZone(n)]);
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
      const nx = clamp(snapV(z.x_mm + dx), 0, TEMPLATE_W - z.width_mm);
      const ny = clamp(snapV(z.y_mm + dy), 0, TEMPLATE_H - z.height_mm);
      updateZone(drag.idx, { x_mm: nx, y_mm: ny });
    } else {
      const nw = clamp(snapV(z.width_mm + dx), 10, TEMPLATE_W - z.x_mm);
      const nh = clamp(snapV(z.height_mm + dy), 6, TEMPLATE_H - z.y_mm);
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
      group_name: groupName.trim() || null,
      description: description.trim() || null,
      // Thumbnail auto-derives from the background image. Admin never
      // uploads a separate one; the template picker card reuses the
      // background shot. Column stays populated for legacy consumers.
      thumbnail_url: thumbnail || background || null,
      background_url: background || null,
      foreground_url: foreground || null,
      zones_json: zones,
      display_order: parseInt(displayOrder, 10) || 0,
      is_active: isActive,
      reference_width_mm:  Number.isFinite(refWParsed) && refWParsed > 0 ? refWParsed : null,
      reference_height_mm: Number.isFinite(refHParsed) && refHParsed > 0 ? refHParsed : null,
      customer_can_recolor: customerCanRecolor,
      customer_can_change_font: customerCanChangeFont,
      customer_picker_role: customerPickerRole === 'none' ? null : customerPickerRole,
      // Strip empty rows so admins clicking the quick-add chips +
      // not naming them don't pollute the saved data.
      customer_swatches: customerSwatches
        .map((s) => ({ name: s.name.trim(), hex: s.hex, mockup_url: (s.mockup_url ?? '').trim() }))
        .filter((s) => s.name && /^#[0-9A-Fa-f]{6}$/.test(s.hex)),
      mode_override: modeOverride.trim() || null,
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

  const imageCount = zones.filter((z) => !isTextZone(z) && !isCalendarZone(z)).length;
  const textCount = zones.filter(isTextZone).length;
  const calendarCount = zones.filter(isCalendarZone).length;

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
              <span className="mb-1 block text-xs font-bold text-ink">Group</span>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className={inputCls}
                list="gift-template-groups"
                placeholder="Wall art · Necklaces · Embroidery on tees"
              />
              <span className="mt-1 block text-[11px] text-neutral-500">
                Optional. Templates in the admin list are bucketed by this label. Typing a new value creates a new bucket; leave empty to drop into &ldquo;Ungrouped&rdquo;.
              </span>
              <datalist id="gift-template-groups">
                {(existingGroups ?? []).map((g) => <option key={g} value={g} />)}
              </datalist>
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
            {/* Thumbnail is auto-derived from the Background image on
                save. Admins upload Background once; the template picker
                card reuses that same shot. */}
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">1. Background <span className="text-neutral-400">(behind customer photo + text · doubles as the picker thumbnail)</span></div>
              <ImageUpload value={background} onChange={setBackground} prefix="tpl-bg" aspect={1} size="md" label="Background" />
            </div>
            <div>
              <div className="mb-1 text-[11px] text-neutral-600">2. Foreground <span className="text-neutral-400">(overlays — needs transparency)</span></div>
              <ImageUpload value={foreground} onChange={setForeground} prefix="tpl-fg" aspect={1} size="md" label="Foreground" />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-ink">Template slots</div>
                <div className="text-[11px] text-neutral-500">
                  {imageCount} image · {textCount} text{calendarCount > 0 && ` · ${calendarCount} calendar`}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={addImageZone} className="inline-flex items-center gap-1 rounded-full bg-pink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-pink-dark">
                  <ImageIcon size={11} /> Image
                </button>
                <button type="button" onClick={addTextZone} className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-neutral-700">
                  <Type size={11} /> Text
                </button>
                <button type="button" onClick={addCalendarZone} className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-amber-600">
                  <CalendarIcon size={11} /> Calendar
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
                  const isCal = isCalendarZone(z);
                  const isAnchor = isRenderAnchorZone(z);
                  const badgeBg = isAnchor ? 'bg-pink' : isCal ? 'bg-amber-500' : isText ? 'bg-ink' : 'bg-pink';
                  return (
                    <div key={i} className={`rounded-lg border-2 ${active ? 'border-pink bg-pink/5' : 'border-neutral-200'} ${z.locked ? 'opacity-80' : ''}`}>
                      <div className="flex w-full items-center justify-between gap-2 p-3">
                        <button
                          type="button"
                          onClick={() => setActiveZoneIdx(active ? null : i)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-white ${badgeBg}`}>
                            {isCal ? <CalendarIcon size={12} /> : isText ? <Type size={12} /> : <ImageIcon size={12} />}
                          </span>
                          <span className="text-sm font-bold text-ink truncate">{z.label || 'Untitled'}</span>
                          {isText && (z as GiftTemplateTextZone).editable === false && (
                            <Lock size={11} className="shrink-0 text-neutral-400" />
                          )}
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-neutral-500">
                            {Math.round(z.width_mm)}×{Math.round(z.height_mm)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateZone(i, { locked: !z.locked }); }}
                            title={z.locked ? 'Unlock — allow drag/resize' : 'Lock — prevent drag/resize'}
                            className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-colors ${
                              z.locked
                                ? 'border-pink bg-pink text-white'
                                : 'border-neutral-300 bg-white text-neutral-500 hover:border-pink hover:text-pink'
                            }`}
                          >
                            {z.locked ? <Lock size={11} /> : <Unlock size={11} />}
                          </button>
                        </div>
                      </div>
                      {active && (
                        <div className="space-y-3 border-t border-neutral-200 p-3">
                          {isAnchor ? (
                            <div className="rounded border-2 border-magenta/30 bg-magenta/5 p-3 text-[12px] leading-snug text-ink">
                              <div className="mb-1 font-bold uppercase tracking-wider text-magenta">
                                Code-driven region · {(z as GiftTemplateRenderAnchorZone).anchor_kind}
                              </div>
                              The renderer owns what gets drawn inside
                              this rectangle. You can drag and resize
                              the box (X / Y / W / H below) to move the
                              region on the canvas, but the contents
                              themselves come from code.
                            </div>
                          ) : isCal
                            ? <CalendarZoneFields zone={z as GiftTemplateCalendarZone} onChange={(p) => updateZone<GiftTemplateCalendarZone>(i, p)} />
                            : isText
                              ? <TextZoneFields zone={z as GiftTemplateTextZone} onChange={(p) => updateZone<GiftTemplateTextZone>(i, p)} />
                              : <ImageZoneFields zone={z as GiftTemplateImageZone} onChange={(p) => updateZone<GiftTemplateImageZone>(i, p)} />}

                          <div className="grid grid-cols-4 gap-1.5 border-t border-neutral-200 pt-3">
                            <NumField label="X" value={z.x_mm} onChange={(v) => updateZone(i, { x_mm: v })} />
                            <NumField label="Y" value={z.y_mm} onChange={(v) => updateZone(i, { y_mm: v })} />
                            <NumField label="W" value={z.width_mm} onChange={(v) => updateZone(i, { width_mm: v })} />
                            <NumField label="H" value={z.height_mm} onChange={(v) => updateZone(i, { height_mm: v })} />
                          </div>
                          <div>
                            <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Production mode</div>
                            <select
                              value={z.mode ?? ''}
                              onChange={(e) => updateZone(i, { mode: (e.target.value || null) as GiftMode | null })}
                              className="w-full rounded border-2 border-neutral-200 bg-white px-2 py-1 text-xs"
                            >
                              <option value="">Inherit from product</option>
                              {GIFT_MODES.map((m) => (
                                <option key={m} value={m}>{GIFT_MODE_LABEL[m]}</option>
                              ))}
                            </select>
                            <div className="mt-1 text-[9px] text-neutral-400">
                              Override the product&apos;s mode for this zone. Use for dual-mode templates (e.g. UV photo + laser-engraved border text). Leave blank on single-mode templates.
                            </div>
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
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={customerCanRecolor}
                onChange={(e) => setCustomerCanRecolor(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-ink">Allow customer to recolor</span>
                <span className="block text-[11px] text-neutral-500">
                  Adds a Theme color picker + per-text-zone + per-calendar-zone color
                  pickers in the customer&apos;s &ldquo;Fill the template&rdquo; form. When off, the
                  template renders entirely in the colors set here.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={customerCanChangeFont}
                onChange={(e) => setCustomerCanChangeFont(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-ink">Allow customer to change font</span>
                <span className="block text-[11px] text-neutral-500">
                  Adds a font dropdown next to each text zone so customers can swap
                  the typeface (e.g. Caveat handwritten → Inter sans). When off, the
                  template uses the fonts set here.
                </span>
              </span>
            </label>

            {/* ── Customer colour picker (per-template) ─────────────── */}
            <div className="rounded-lg border-2 border-neutral-200 p-4">
              <div className="mb-2 text-sm font-bold text-ink">Customer colour picker</div>
              <div className="mb-3 text-[11px] text-neutral-500">
                Optional swatch row shown to customers when this template is active.
                Lets one product carry templates with <em>different</em> colour sets —
                e.g. Template A: Red/Blue/Green for mockup-swap; Template B:
                Gold/Rose Gold/Silver for foil overlay.
              </div>
              <label className="mb-3 block">
                <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Picker role</span>
                <select
                  value={customerPickerRole}
                  onChange={(e) => setCustomerPickerRole(e.target.value as any)}
                  className="w-full rounded border-2 border-neutral-200 bg-white px-2 py-1.5 text-xs"
                >
                  <option value="none">None — no picker on this template</option>
                  <option value="mockup_swap">Mockup swap — pick swaps the displayed photo</option>
                  <option value="foil_overlay">Foil overlay — pick retints the renderer foil/text</option>
                </select>
              </label>

              {customerPickerRole !== 'none' && (
                <>
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Quick add:</span>
                    {FOIL_QUICK_ADDS.map((c) => {
                      const exists = customerSwatches.some(
                        (s) => s.name.trim().toLowerCase() === c.name.toLowerCase(),
                      );
                      return (
                        <button
                          key={c.name}
                          type="button"
                          disabled={exists}
                          onClick={() => addCustomerSwatch(c)}
                          title={exists ? `${c.name} already added` : `Add ${c.name} (${c.hex})`}
                          className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide hover:border-pink hover:text-pink disabled:opacity-40 disabled:hover:border-neutral-300 disabled:hover:text-current"
                        >
                          <span aria-hidden style={{ width: 11, height: 11, borderRadius: '50%', background: c.hex, border: '1px solid #0a0a0a' }} />
                          {c.name}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => addCustomerSwatch()}
                      className="rounded-full border border-pink bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pink hover:bg-pink hover:text-white"
                    >
                      + custom
                    </button>
                  </div>

                  {customerSwatches.length === 0 ? (
                    <div className="rounded border border-dashed border-neutral-300 p-3 text-center text-[11px] text-neutral-500">
                      No swatches yet. Quick-add a foil colour above, or click <strong>+ custom</strong> to pick any colour.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerSwatches.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 rounded border border-neutral-200 bg-white p-2">
                          {/* Native colour picker — admins can pick any
                              hex, not just the quick-add chips. */}
                          <input
                            type="color"
                            value={/^#[0-9A-Fa-f]{6}$/.test(s.hex) ? s.hex : '#000000'}
                            onChange={(e) => updateCustomerSwatch(i, { hex: e.target.value })}
                            className="h-9 w-9 cursor-pointer rounded border-2 border-ink"
                            title="Pick any colour"
                          />
                          <input
                            value={s.name}
                            onChange={(e) => updateCustomerSwatch(i, { name: e.target.value })}
                            placeholder="Name (e.g. Gold)"
                            className="flex-1 rounded border-2 border-neutral-200 bg-white px-2 py-1.5 text-xs"
                          />
                          <input
                            value={s.hex}
                            onChange={(e) => updateCustomerSwatch(i, { hex: e.target.value })}
                            className="w-[100px] rounded border-2 border-neutral-200 bg-white px-2 py-1.5 font-mono text-xs"
                            placeholder="#FFD700"
                          />
                          {customerPickerRole === 'mockup_swap' && (
                            <input
                              value={s.mockup_url ?? ''}
                              onChange={(e) => updateCustomerSwatch(i, { mockup_url: e.target.value })}
                              placeholder="Mockup URL (required for swap)"
                              className="w-[200px] rounded border-2 border-neutral-200 bg-white px-2 py-1.5 text-[11px]"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeCustomerSwatch(i)}
                            className="rounded-full border border-red-200 p-1 text-red-600 hover:bg-red-50"
                            title="Remove swatch"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {customerPickerRole === 'mockup_swap' && (
                    <div className="mt-2 text-[10px] text-neutral-500">
                      Mockup-swap mode: each swatch needs a mockup URL — the
                      photo on the variant tile swaps when picked. Without a
                      URL the swatch is skipped on the customer side.
                    </div>
                  )}
                  {customerPickerRole === 'foil_overlay' && (
                    <div className="mt-2 text-[10px] text-neutral-500">
                      Foil-overlay mode: each swatch&apos;s hex retints the
                      renderer&apos;s foil / text colour. No mockup needed.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Production mode override (per-template) ───────────── */}
            <div className="rounded-lg border-2 border-neutral-200 p-4">
              <div className="mb-2 text-sm font-bold text-ink">Production mode override</div>
              <div className="mb-3 text-[11px] text-neutral-500">
                Optional. When set, picking this template at checkout forces
                the order line&apos;s mode (overriding the product&apos;s mode).
                Use when one product offers multiple physical SKUs through
                different templates — e.g. a Star Map sold as both
                <em> foiling on acrylic</em> and <em> digital print on paper</em>
                from the same PDP. Leave on <strong>Inherit</strong> for
                templates that don&apos;t change the production process.
              </div>
              <select
                value={modeOverride}
                onChange={(e) => setModeOverride(e.target.value)}
                className="w-full rounded border-2 border-neutral-200 bg-white px-2 py-1.5 text-xs"
              >
                <option value="">Inherit from product</option>
                {availableModes.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.label} ({m.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT: visual canvas */}
        <div className="space-y-4">
          {isRendererTemplate && (
            <div className="rounded-lg border-2 border-magenta/30 bg-magenta/5 px-4 py-3 text-[12px] leading-snug text-ink">
              <div className="mb-1 font-bold uppercase tracking-wider text-magenta">
                Code-driven template — renderer: <span className="font-mono">{renderer}</span>
              </div>
              <div>
                Layout, geometry, and footer text styling come from code, not
                zones. The preview below shows what the renderer outputs
                with placeholder text. <strong>Customer-facing text fields</strong>
                {' '}(names / event / location / tagline) are entered on the
                product page itself — not here.
                {' '}
                <strong>Where the design sits inside the physical frame</strong>
                {' '}is controlled per variant on the gift product page
                (mockup image + design area rectangle).
              </div>
            </div>
          )}
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-2">
              <div>
                <div className="text-xs font-bold text-ink">Live preview</div>
                <div className="text-[10px] text-neutral-500">Drag any slot to move. Drag corner to resize.</div>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-neutral-600">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={gridOn} onChange={(e) => setGridOn(e.target.checked)} />
                  Grid
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={snapOn} onChange={(e) => setSnapOn(e.target.checked)} />
                  Snap
                </label>
                <label className="flex items-center gap-1.5">
                  Step
                  <input
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                    value={gridStep}
                    onChange={(e) => setGridStep(Math.max(1, Math.min(50, Number(e.target.value) || 5)))}
                    className="w-12 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[11px]"
                    title="Grid step in canvas units (0..200). 5 ≈ 2.5% of canvas."
                  />
                </label>
              </div>
            </div>
            <div
              ref={canvasRef}
              className="relative mx-auto my-6 w-full max-w-xl select-none overflow-hidden rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-100"
              onPointerMove={onCanvasPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              style={{ touchAction: 'none', aspectRatio: previewAspect }}
            >
              <MaskShapeDefs />
              {background && (
                <img src={background} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              )}

              {/* Renderer-driven templates (city_map / star_map /
                  song_lyrics) skip zones entirely — the layout is code,
                  so we render the live SVG output instead of the empty
                  zones canvas. Customers fill in the footer text on the
                  product page (CityMapInputs / StarMapInputs / SongLyricsInputs);
                  position inside the variant frame is admin-controlled
                  on the product's variant editor (mockup_area). */}
              {isRendererTemplate && rendererPreviewSvg && (
                <div
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  // Pure SVG built from buildCityMapSvg / buildStarMapSvg —
                  // safe to inject (all customer text would be XML-escaped
                  // by the builder, and these are static placeholders).
                  dangerouslySetInnerHTML={{ __html: rendererPreviewSvg }}
                />
              )}
              {/* Song lyrics renders as a React SVG component (not a
                  pure string builder), so we mount it directly here. */}
              {isRendererTemplate && renderer === 'song_lyrics' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div style={{ width: '100%', height: '100%', maxWidth: '100%' }}>
                    <SongLyricsTemplate
                      photoUrl={null}
                      lyrics=""
                      title="OUR SONG"
                      names="EVA & JOHN"
                      year="2018"
                      subtitle="THE FIRST DANCE"
                      tagline="Love now and always"
                      layout="song"
                    />
                  </div>
                </div>
              )}
              {/* Tiny debug pill so admins can verify the renderer
                  field is actually set on this template row. If the
                  pill says "renderer: zones" but you expected city_map
                  / star_map / song_lyrics, the DB column is unset on
                  this row (older template — re-create or update via
                  SQL: update gift_templates set renderer='city_map'
                  where id='...'). */}
              {(
                <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  renderer: {renderer || 'zones'}
                </div>
              )}

              {/* Grid overlay — drawn under the zones so handles stay
                  on top. Lines on the canvas-unit grid (0..200), step
                  controlled by the header. Pure visual; snap is
                  separate. */}
              {gridOn && gridStep > 0 && (
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  viewBox={`0 0 ${TEMPLATE_W} ${TEMPLATE_H}`}
                  preserveAspectRatio="none"
                >
                  {Array.from({ length: Math.floor(TEMPLATE_W / gridStep) + 1 }, (_, k) => k * gridStep).map((x) => (
                    <line key={`vx-${x}`} x1={x} y1={0} x2={x} y2={TEMPLATE_H}
                      stroke="#0a0a0a" strokeOpacity={x % (gridStep * 4) === 0 ? 0.18 : 0.08} strokeWidth={0.3} />
                  ))}
                  {Array.from({ length: Math.floor(TEMPLATE_H / gridStep) + 1 }, (_, k) => k * gridStep).map((y) => (
                    <line key={`hy-${y}`} x1={0} y1={y} x2={TEMPLATE_W} y2={y}
                      stroke="#0a0a0a" strokeOpacity={y % (gridStep * 4) === 0 ? 0.18 : 0.08} strokeWidth={0.3} />
                  ))}
                </svg>
              )}

              {/* Render image zones. Admin-set default_image_url shows
                  through; otherwise the zone is a blank placeholder
                  with the zone label so admin can read what each slot
                  is at a glance. No auto-fetched stock photos. */}
              {zones.map((z, i) => {
                if (isTextZone(z) || isCalendarZone(z) || isRenderAnchorZone(z)) return null;
                const img = z as GiftTemplateImageZone;
                const fit = img.fit_mode ?? 'cover';
                const hasContent = Boolean(img.default_image_url);
                const clipPath = hasContent ? maskClipPathCss(img.mask_preset) : undefined;
                return (
                  <div
                    key={`pv-${i}`}
                    className="pointer-events-none absolute overflow-hidden flex items-center justify-center"
                    style={{
                      left: `${(z.x_mm / TEMPLATE_W) * 100}%`,
                      top: `${(z.y_mm / TEMPLATE_H) * 100}%`,
                      width: `${(z.width_mm / TEMPLATE_W) * 100}%`,
                      height: `${(z.height_mm / TEMPLATE_H) * 100}%`,
                      transform: `rotate(${z.rotation_deg ?? 0}deg)`,
                      transformOrigin: 'center',
                      background: img.bg_color ?? (hasContent ? 'transparent' : 'rgba(255,255,255,0.6)'),
                      border: hasContent ? 'none' : '2px dashed #cfcfcf',
                      borderRadius: img.mask_preset ? 0 : `${((img.border_radius_mm ?? 0) / TEMPLATE_W) * 100}%`,
                      clipPath,
                      WebkitClipPath: clipPath,
                    }}
                  >
                    {hasContent ? (
                      <>
                        <img src={img.default_image_url ?? ''} alt="" className="h-full w-full" style={{ objectFit: fit }} />
                        {img.mask_url && (
                          <img src={img.mask_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
                        <Upload size={14} style={{ color: '#999' }} />
                        <span style={{
                          fontFamily: 'var(--pv-f-mono)',
                          fontSize: 10,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: '#666',
                          fontWeight: 700,
                        }}>
                          {img.label || 'Upload image here'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Calendar zones — rendered via the same SVG generator
                  the customer + server pipelines use, so the editor
                  preview matches what ships. */}
              {zones.map((z, i) => {
                if (!isCalendarZone(z)) return null;
                const svg = renderCalendarSvg({
                  zone: z,
                  fill: undefined,
                  width: z.width_mm,
                  height: z.height_mm,
                });
                const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                return (
                  <img
                    key={`cv-${i}`}
                    src={dataUrl}
                    alt=""
                    className="pointer-events-none absolute"
                    style={{
                      left: `${(z.x_mm / TEMPLATE_W) * 100}%`,
                      top: `${(z.y_mm / TEMPLATE_H) * 100}%`,
                      width: `${(z.width_mm / TEMPLATE_W) * 100}%`,
                      height: `${(z.height_mm / TEMPLATE_H) * 100}%`,
                      transform: `rotate(${z.rotation_deg ?? 0}deg)`,
                      transformOrigin: 'center',
                    }}
                  />
                );
              })}

              {foreground && (
                <img src={foreground} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              )}

              {/* Render text zones with their styling — always on so
                  admin can see typography while authoring. */}
              {zones.map((z, i) => {
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
                const isAnchor = isRenderAnchorZone(z);
                const accent = isAnchor ? '#E91E8C' : isText ? '#0a0a0a' : '#E91E8C';
                const handleLabel = isAnchor ? 'A' : isText ? 'T' : 'I';
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${left}%`, top: `${top}%`,
                      width: `${width}%`, height: `${height}%`,
                      transform: `rotate(${z.rotation_deg ?? 0}deg)`,
                      transformOrigin: 'center',
                      cursor: z.locked ? 'default' : 'move',
                      border: active ? `2px solid ${accent}` : `2px dashed ${isAnchor ? 'rgba(233,30,140,0.55)' : 'rgba(0,0,0,0.25)'}`,
                      background: active ? `${accent}1a` : 'transparent',
                      boxShadow: active ? `0 0 0 3px ${accent}33` : 'none',
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setActiveZoneIdx(i);
                      if (z.locked) return; // locked zones can be selected but not dragged
                      setDrag({ type: 'move', idx: i, startX: e.clientX, startY: e.clientY, startZone: z });
                    }}
                  >
                    <div
                      className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-white"
                      style={{ background: accent }}
                    >
                      {handleLabel} · {z.label}
                    </div>
                    {isAnchor && (
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-1 mx-auto rounded px-1.5 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wider"
                        style={{ background: 'rgba(233,30,140,0.92)', color: '#fff', maxWidth: '90%' }}
                      >
                        🔒 Code-driven · drag to position only
                      </div>
                    )}
                    {!z.locked && (
                      <div
                        onPointerDown={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          setActiveZoneIdx(i);
                          setDrag({ type: 'resize', idx: i, startX: e.clientX, startY: e.clientY, startZone: z });
                        }}
                        className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full border-2 bg-white"
                        style={{ borderColor: accent }}
                      />
                    )}
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

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Photo shape</div>
        <div className="flex flex-wrap gap-1">
          {(['none', 'circle', 'heart', 'star'] as const).map((kind) => {
            const v = kind === 'none' ? null : (kind as GiftImageZoneMaskPreset);
            const label = v ? MASK_PRESET_LABELS[v] : 'None';
            const active = (zone.mask_preset ?? null) === v;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onChange({ mask_preset: v })}
                className={`flex items-center gap-1.5 rounded border-2 px-2 py-1 text-[10px] font-bold uppercase ${active ? 'border-pink bg-pink text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:border-pink'}`}
              >
                {v ? (
                  <svg width="14" height="14" viewBox="0 0 100 100"><path d={maskPresetPath(v)} fill={active ? '#fff' : '#525252'} /></svg>
                ) : (
                  <span className="inline-block h-3 w-3 rounded-sm border border-current" />
                )}
                {label}
              </button>
            );
          })}
        </div>
        {zone.mask_preset && (
          <div className="mt-1 text-[10px] text-neutral-500">Photo will be clipped to this silhouette in the customer preview and the production file. Border radius is ignored when a shape is set.</div>
        )}
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

function CalendarZoneFields({ zone, onChange }: { zone: GiftTemplateCalendarZone; onChange: (p: Partial<GiftTemplateCalendarZone>) => void }) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Label (admin only)</span>
        <input
          type="text"
          value={zone.label ?? ''}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full rounded border-2 border-neutral-200 bg-white px-2 py-1 text-xs focus:border-pink focus:outline-none"
        />
      </label>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Header layout</div>
        <div className="flex gap-1">
          {(['above', 'left', 'hidden'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ header_layout: v })}
              className={`rounded border-2 px-2 py-1 text-[10px] font-bold uppercase ${
                (zone.header_layout ?? 'above') === v ? 'border-pink bg-pink text-white' : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Header font</span>
          <select
            value={zone.header_font_family ?? 'fraunces'}
            onChange={(e) => onChange({ header_font_family: e.target.value })}
            className="w-full rounded border-2 border-neutral-200 bg-white px-2 py-1 text-xs"
          >
            {GIFT_FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
        <NumField label="Header size (mm)" value={zone.header_font_size_mm ?? 12} onChange={(v) => onChange({ header_font_size_mm: v })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">Grid font</span>
          <select
            value={zone.grid_font_family ?? 'inter'}
            onChange={(e) => onChange({ grid_font_family: e.target.value })}
            className="w-full rounded border-2 border-neutral-200 bg-white px-2 py-1 text-xs"
          >
            {GIFT_FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
        <NumField label="Grid size (mm)" value={zone.grid_font_size_mm ?? 6} onChange={(v) => onChange({ grid_font_size_mm: v })} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ColourPicker label="Header colour" value={zone.header_color ?? '#0a0a0a'} onChange={(v) => onChange({ header_color: v })} />
        <ColourPicker label="Grid colour"   value={zone.grid_color ?? '#0a0a0a'}   onChange={(v) => onChange({ grid_color: v })} />
        <ColourPicker label="Highlight"     value={zone.highlight_fill ?? '#ec4899'} onChange={(v) => onChange({ highlight_fill: v })} />
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Highlight shape</div>
        <div className="flex gap-1">
          {(['circle', 'square', 'heart'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ highlight_shape: v })}
              className={`rounded border-2 px-2 py-1 text-[10px] font-bold uppercase ${
                (zone.highlight_shape ?? 'circle') === v ? 'border-pink bg-pink text-white' : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Week starts on</div>
        <div className="flex gap-1">
          {(['sunday', 'monday'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ week_start: v })}
              className={`rounded border-2 px-2 py-1 text-[10px] font-bold uppercase ${
                (zone.week_start ?? 'sunday') === v ? 'border-pink bg-pink text-white' : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-neutral-200 pt-3">
        <NumField label="Default month (1–12)" value={zone.default_month ?? 0} onChange={(v) => onChange({ default_month: v ? clamp(v, 1, 12) : null })} />
        <NumField label="Default year"          value={zone.default_year ?? 0}  onChange={(v) => onChange({ default_year: v || null })} />
        <NumField label="Default day (1–31)"   value={zone.default_highlighted_day ?? 0} onChange={(v) => onChange({ default_highlighted_day: v ? clamp(v, 1, 31) : null })} />
      </div>
      <div className="text-[10px] text-neutral-500">Defaults appear before the customer touches the picker. Leave the day blank for no highlight at first.</div>
    </div>
  );
}

function ColourPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-full cursor-pointer rounded border-2 border-neutral-200"
      />
    </label>
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
