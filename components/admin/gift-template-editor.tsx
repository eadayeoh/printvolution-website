'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, ArrowUp, ArrowDown, Copy, Image as ImageIcon, Type, Lock, Unlock, RotateCw, Upload, Calendar as CalendarIcon, Eye, EyeOff, Heart, Star, Square, Circle, Minus, Triangle, Shapes } from 'lucide-react';
import { createTemplate, updateTemplate, deleteTemplate, renameTemplateGroup, clearTemplateGroup } from '@/app/admin/gifts/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import { MaskShapeDefs } from '@/components/gift/mask-shape-defs';
import { maskClipPathCss, maskPresetPath, MASK_PRESET_LABELS } from '@/lib/gifts/mask-shapes';
import type { GiftImageZoneMaskPreset } from '@/lib/gifts/types';
import {
  GIFT_FONT_FAMILIES,
  GIFT_MODE_LABEL,
  giftFontStack,
  type GiftOccasion,
  type GiftTemplate,
  type GiftTemplateZone,
  type GiftTemplateImageZone,
  type GiftTemplateTextZone,
  type GiftTemplateCalendarZone,
  type GiftTemplateRenderAnchorZone,
  type GiftTemplateShapeZone,
  type GiftShapeKind,
  type GiftMode,
} from '@/lib/gifts/types';
import { shapeZoneSvg, GIFT_SHAPE_KINDS, GIFT_SHAPE_LABEL } from '@/lib/gifts/shape-zones';
import { validateHexColor } from '@/lib/gifts/personalisation-notes';
import type { ShapeKind } from '@/lib/gifts/shape-options';
import type { GiftModeMeta } from '@/lib/gifts/modes';
import { renderCalendarSvg } from '@/lib/gifts/pipeline/calendar-svg';
import { buildCityMapSvg } from '@/lib/gifts/city-map-svg';
import { buildStarMapSvg, buildStarMapScene } from '@/lib/gifts/star-map-svg';
import { SongLyricsTemplate } from '@/components/gift/song-lyrics-template';
import { SpotifyPlaqueTemplate } from '@/components/gift/spotify-plaque-template';
import { RENDERER_LAYOUT_OPTIONS } from '@/lib/gifts/renderer-config';

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

function isShapeZone(z: GiftTemplateZone): z is GiftTemplateShapeZone {
  return (z as GiftTemplateShapeZone).type === 'shape';
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
  if (renderer === 'spotify_plaque') {
    // Editor canvas is 0..200 in BOTH axes (TEMPLATE_W=TEMPLATE_H=200),
    // even though the canvas DOM displays at the template's reference
    // aspect (e.g. A4 portrait). Zones store percentage-of-canvas, so
    // keep every zone's bottom edge ≤ 200. font_size_mm uses the same
    // 0..200 unit space as x/y/w/h.
    return [
      {
        type: 'render_anchor', anchor_kind: 'spotify_photo' as any,
        id: 'photo', label: 'Photo · drag to reposition / resize',
        x_mm: 16, y_mm: 11, width_mm: 168, height_mm: 110,
      } as any,
      {
        type: 'text', id: 'song_title', label: 'Song title',
        x_mm: 16, y_mm: 126, width_mm: 138, height_mm: 9,
        font_family: 'inter', font_size_mm: 7, font_weight: '700',
        align: 'left', color: '#0a0a0a',
        default_text: 'Your Favourite Song', placeholder: 'Your Favourite Song',
        editable: true,
      } as any,
      {
        type: 'text', id: 'artist_name', label: 'Artist name',
        x_mm: 16, y_mm: 137, width_mm: 138, height_mm: 7,
        font_family: 'inter', font_size_mm: 5, font_weight: '400',
        align: 'left', color: '#0a0a0a',
        default_text: "Artist's Name", placeholder: "Artist's Name",
        editable: true,
      } as any,
      {
        type: 'render_anchor', anchor_kind: 'spotify_heart' as any,
        id: 'heart', label: 'Heart icon · drag to reposition',
        x_mm: 175, y_mm: 130, width_mm: 9, height_mm: 9,
      } as any,
      {
        type: 'render_anchor', anchor_kind: 'spotify_progress' as any,
        id: 'progress', label: 'Progress bar + time markers',
        x_mm: 16, y_mm: 149, width_mm: 168, height_mm: 10,
      } as any,
      {
        type: 'render_anchor', anchor_kind: 'spotify_controls' as any,
        id: 'controls', label: 'Transport controls (play / skip)',
        x_mm: 60, y_mm: 162, width_mm: 80, height_mm: 10,
      } as any,
      {
        type: 'render_anchor', anchor_kind: 'spotify_scancode' as any,
        id: 'scancode', label: 'Spotify scancode · drag / resize · content stays dynamic',
        x_mm: 16, y_mm: 173, width_mm: 168, height_mm: 21,
      } as any,
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

function makeShapeZone(kind: GiftShapeKind, n: number): GiftTemplateShapeZone {
  // Centred 60×60 default — admin drags from there. Lines default
  // taller-than-tall + a visible stroke so the line actually shows up
  // (a 0-stroke line is invisible and would leave admin confused).
  const isLine = kind === 'line';
  return {
    type: 'shape',
    id: `shape${n}`,
    label: `${kind[0].toUpperCase()}${kind.slice(1)} ${n}`,
    shape: kind,
    x_mm: isLine ? 20 : 70,
    y_mm: isLine ? 90 : 70,
    width_mm: isLine ? 160 : 60,
    height_mm: isLine ? 4 : 60,
    rotation_deg: 0,
    fill: isLine ? null : '#ec4899',
    stroke: isLine ? '#0a0a0a' : null,
    stroke_width: isLine ? 1 : 0,
  };
}

/** Single-open accordion section IDs. 'none' lets the user collapse all
 *  of them. The `default` is canvas-layout because zone editing is the
 *  ~80% workflow on this page. */
type SectionId = 'assets' | 'canvas-layout' | 'customer-controls' | 'catalog-display' | 'production' | 'none';

const DEFAULT_SECTION: SectionId = 'canvas-layout';

function AccordionSection({
  id,
  title,
  hint,
  openId,
  onOpen,
  children,
}: {
  id: Exclude<SectionId, 'none'>;
  title: string;
  hint?: string;
  openId: SectionId;
  onOpen: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  const open = openId === id;
  return (
    <div className={`rounded-lg border bg-white ${open ? 'border-pink shadow-sm' : 'border-neutral-200'}`}>
      <button
        type="button"
        onClick={() => onOpen(open ? 'none' : id)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-ink">{title}</span>
          {hint && <span className="text-[10px] text-neutral-500">{hint}</span>}
        </span>
        <span aria-hidden className="text-neutral-400 text-base font-light">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </div>
  );
}

export function GiftTemplateEditor({
  template,
  existingGroups,
  availableModes,
  availableOccasions = [],
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
  /** All gift_occasions rows (active + paused). Drives the optional
   *  occasion dropdown — picking one date-windows the template on the
   *  customer-facing PDP. */
  availableOccasions?: GiftOccasion[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  // Cleared on unmount and on every re-trigger of setFlash so the timer
  // doesn't fire against an unmounted component (or stomp the next save's
  // flash window).
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Single-open accordion state. Lazy-init from localStorage so reopening
  // the same template restores the section the admin was last working in.
  const templateStorageKey = template?.id ?? 'new';
  const [openSection, setOpenSection] = useState<SectionId>(() => {
    if (typeof window === 'undefined') return DEFAULT_SECTION;
    const stored = window.localStorage.getItem(`pv-template-editor-section:${templateStorageKey}`);
    if (stored === 'assets' || stored === 'canvas-layout' || stored === 'customer-controls' || stored === 'catalog-display' || stored === 'production' || stored === 'none') return stored;
    return DEFAULT_SECTION;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`pv-template-editor-section:${templateStorageKey}`, openSection);
  }, [openSection, templateStorageKey]);

  useEffect(() => () => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  }, []);

  // Inline confirm states — replace native window.confirm/prompt so the
  // editor doesn't fire blocking browser dialogs (broken on mobile).
  const [groupRenaming, setGroupRenaming] = useState<string | null>(null);
  const [confirmGroupDelete, setConfirmGroupDelete] = useState(false);
  const [confirmTemplateDelete, setConfirmTemplateDelete] = useState(false);
  const [newGroupDraft, setNewGroupDraft] = useState<string | null>(null);

  // Arrow-key streak tracker — coalesces consecutive nudge keystrokes
  // on the same zone into a single undo-history entry. First key in the
  // streak pushes a snapshot; the rest setZones directly.
  const arrowStreakRef = useRef<{ zoneIdx: number; lastTime: number } | null>(null);

  const [name, setName] = useState(template?.name ?? '');
  const [groupName, setGroupName] = useState(template?.group_name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [thumbnail, setThumbnail] = useState(template?.thumbnail_url ?? '');
  const [background, setBackground] = useState(template?.background_url ?? '');
  const [foreground, setForeground] = useState(template?.foreground_url ?? '');
  const [displayOrder, setDisplayOrder] = useState(template?.display_order?.toString() ?? '0');
  // Per-template upcharge — stored in cents on the row, edited as
  // dollars in the input so admin doesn't have to think in cents.
  const [priceDeltaDollars, setPriceDeltaDollars] = useState(
    (((template?.price_delta_cents ?? 0) as number) / 100).toFixed(2),
  );
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [customerCanRecolorBackground, setCustomerCanRecolorBackground] = useState(
    (template?.customer_can_recolor_background ?? template?.customer_can_recolor) ?? false,
  );
  const [customerCanRecolorText, setCustomerCanRecolorText] = useState(
    (template?.customer_can_recolor_text ?? template?.customer_can_recolor) ?? false,
  );
  const [customerCanRecolorCalendar, setCustomerCanRecolorCalendar] = useState(
    (template?.customer_can_recolor_calendar ?? template?.customer_can_recolor) ?? false,
  );
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
  const [productionFiles, setProductionFiles] = useState<Array<'png' | 'jpg' | 'svg' | 'pdf'>>(
    template?.production_files ?? [],
  );
  const [occasionId, setOccasionId] = useState<string>(template?.occasion_id ?? '');
  // Per-renderer admin config (layout key + default content). Free-form
  // because each renderer has its own shape; we just shuttle the
  // object through to renderer_config in the save payload.
  const [rendererConfig, setRendererConfig] = useState<Record<string, unknown>>(
    () => ((template?.renderer_config ?? {}) as Record<string, unknown>),
  );
  function setRendererConfigField(key: string, value: unknown) {
    setRendererConfig((prev) => {
      // Treat empty string + undefined the same — drop the key so the
      // saved JSON stays clean. Booleans + numbers always persist.
      if (value === undefined || value === '' || value === null) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }
  // Empty Set = inherit all product shape_options. Any non-empty
  // selection narrows the PDP's "Pick your shape" picker.
  const [allowedShapeKinds, setAllowedShapeKinds] = useState<Set<ShapeKind>>(
    () => new Set(template?.allowed_shape_kinds ?? []),
  );
  function toggleAllowedShapeKind(k: ShapeKind) {
    setAllowedShapeKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }
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
    // Clamp any zone whose bounds extend past the 0..200 canvas back
    // inside it. Past out-of-bounds saves (or older seed defaults)
    // would leave handles off-screen and unreachable; this lets admin
    // grab + reposition them.
    const clampZone = (z: any) => {
      const w = Math.min(Math.max(z.width_mm ?? 60, 4), TEMPLATE_W);
      const h = Math.min(Math.max(z.height_mm ?? 30, 4), TEMPLATE_H);
      const x = Math.min(Math.max(z.x_mm ?? 0, 0), TEMPLATE_W - w);
      const y = Math.min(Math.max(z.y_mm ?? 0, 0), TEMPLATE_H - h);
      return { ...z, x_mm: x, y_mm: y, width_mm: w, height_mm: h };
    };
    const r = template?.renderer;
    if (raw.length > 0) {
      // Don't auto-merge missing-by-id default zones back in — that
      // regressed deletion (admin removes 'controls', merge re-adds
      // it on next open). Saved zones are now the source of truth.
      // Admin who needs an old default back can use the "Add zone"
      // button in the editor (or copy-paste the JSON from another
      // template with the renderer they want).
      return raw.map((z) => clampZone({
        ...z,
        type: z.type ?? 'image',
      })) as GiftTemplateZone[];
    }
    // Empty zones + renderer-driven template → seed defaults so the
    // admin can drag positions/fonts/sizes instead of starting blank.
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
      // from the admin editor. Pass zones so the preview reflects
      // whatever city_disk anchors admin has dragged onto the canvas.
      return buildCityMapSvg({
        vectors: null,
        names: 'EVA & JOHN',
        event: 'OUR FIRST DATE',
        cityLabel: 'LONDON',
        tagline: 'Love now and always',
        zones,
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
    // spotify_plaque and song_lyrics — return null and let the React
    // component branch below mount the live preview. Spotify's scan
    // code can't ride inside dangerouslySetInnerHTML SVG markup
    // because cross-origin SVG <image> elements don't load that way.
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

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panDragRef = useRef<{ startX: number; startY: number; startPan: { x: number; y: number } } | null>(null);

  const [zonesHistory, setZonesHistory] = useState<GiftTemplateZone[][]>([]);
  const [zonesFuture, setZonesFuture] = useState<GiftTemplateZone[][]>([]);
  const HISTORY_CAP = 50;

  const [activeZoneIdx, setActiveZoneIdx] = useState<number | null>(null);
  // Grid overlay + snap-to-grid for the live-preview canvas. Step is in
  // canvas units (the same 0..200 grid x_mm/y_mm/width_mm/height_mm
  // live on); 5 ≈ a comfortable nudge increment, admin can change it.
  const [gridOn, setGridOn] = useState(false);
  const [snapOn, setSnapOn] = useState(false);
  const [gridStep, setGridStep] = useState(5);
  const snapV = (v: number) => (snapOn && gridStep > 0 ? Math.round(v / gridStep) * gridStep : v);

  const [collapsedLayerGroups, setCollapsedLayerGroups] = useState<Set<string>>(new Set());
  function toggleLayerGroup(key: string) {
    setCollapsedLayerGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function pushHistorySnapshot(snapshot: GiftTemplateZone[]) {
    setZonesHistory((h) => {
      const next = [...h, snapshot];
      return next.length > HISTORY_CAP ? next.slice(next.length - HISTORY_CAP) : next;
    });
    setZonesFuture([]);
  }

  function commitZones(next: GiftTemplateZone[]) {
    pushHistorySnapshot(zones);
    setZones(next);
  }

  function updateZone<T extends GiftTemplateZone>(i: number, patch: Partial<T>) {
    setZones(zones.map((z, j) => (j === i ? ({ ...z, ...patch } as GiftTemplateZone) : z)));
  }

  function addImageZone() {
    const n = zones.filter((z) => !isTextZone(z)).length + 1;
    commitZones([...zones, makeImageZone(n)]);
    setActiveZoneIdx(zones.length);
  }

  function addTextZone() {
    const n = zones.filter(isTextZone).length + 1;
    commitZones([...zones, makeTextZone(n)]);
    setActiveZoneIdx(zones.length);
  }

  function addCalendarZone() {
    const n = zones.filter(isCalendarZone).length + 1;
    commitZones([...zones, makeCalendarZone(n)]);
    setActiveZoneIdx(zones.length);
  }

  function addShapeZone(kind: GiftShapeKind) {
    const n = zones.filter(isShapeZone).length + 1;
    commitZones([...zones, makeShapeZone(kind, n)]);
    setActiveZoneIdx(zones.length);
  }

  /** Drop a render_anchor zone matching the current renderer.
   *  Renderer-driven templates (city_map / star_map) loop over these
   *  to draw N maps / sky charts. anchor_kind is the renderer-specific
   *  contract; current renderers recognise 'city_disk' and 'star_disk'. */
  function addRenderAnchorZone(anchorKind: string, label: string) {
    const existing = zones.filter(
      (z) => z.type === 'render_anchor' && (z as GiftTemplateRenderAnchorZone).anchor_kind === anchorKind,
    ).length;
    const n = existing + 1;
    // 70mm × 70mm circle-ish square dropped near the centre of the
    // canvas; admin drags+resizes from there. Stagger second/third
    // copies so they don't pile on top of the first — but clamp to
    // the canvas (0..200mm) so admins clicking + many times don't
    // produce zones at x=300mm that nobody can see + drag back.
    const W = 70, H = 70;
    const baseX = 65, baseY = 30;
    const offset = existing * 8;
    const x_mm = Math.max(0, Math.min(200 - W, baseX + offset));
    const y_mm = Math.max(0, Math.min(200 - H, baseY + offset));
    const zone: GiftTemplateRenderAnchorZone = {
      id: `${anchorKind}-${n}`,
      type: 'render_anchor',
      anchor_kind: anchorKind,
      label: existing === 0 ? label : `${label} ${n}`,
      x_mm,
      y_mm,
      width_mm: W,
      height_mm: H,
      rotation_deg: 0,
    };
    commitZones([...zones, zone]);
    setActiveZoneIdx(zones.length);
  }

  /** Stamp a layout preset onto the canvas — replaces existing zones
   *  (admin can undo via the toolbar's undo). Each preset is a
   *  starting point; admin tweaks position / size from there.
   *  Coordinates are in canvas mm, 0..200. */
  function applyLayoutPreset(presetKey: string) {
    const anchorKind = renderer === 'city_map' ? 'city_disk'
      : renderer === 'star_map' ? 'star_disk'
      : null;
    if (!anchorKind) return;
    const label = anchorKind === 'city_disk' ? 'Map' : 'Sky';
    const captions = ['Met', 'Engaged', 'Married'];
    let next: GiftTemplateZone[] = [];

    if (presetKey === 'single-circle') {
      next.push({
        id: `${anchorKind}-1`, type: 'render_anchor', anchor_kind: anchorKind,
        label, x_mm: 30, y_mm: 30, width_mm: 140, height_mm: 140, rotation_deg: 0,
      } as GiftTemplateRenderAnchorZone);
    } else if (presetKey === 'three-circles') {
      // Three discs in a row across the top 60% of the canvas, with
      // caption text zones sitting in the lower band.
      [10, 70, 130].forEach((x, i) => {
        next.push({
          id: `${anchorKind}-${i + 1}`, type: 'render_anchor', anchor_kind: anchorKind,
          label: `${label} ${i + 1}`, x_mm: x, y_mm: 25, width_mm: 60, height_mm: 60, rotation_deg: 0,
        } as GiftTemplateRenderAnchorZone);
      });
      // Caption text zones under each disk.
      [10, 70, 130].forEach((x, i) => {
        next.push({
          id: `caption-${i + 1}`, type: 'text', label: `Caption ${i + 1}`,
          x_mm: x, y_mm: 95, width_mm: 60, height_mm: 8, rotation_deg: 0,
          default_text: captions[i] ?? '', font_size_mm: 5, font_family: 'cormorant', align: 'center',
          color: '#d4af37', font_style: 'italic', font_weight: '600',
        } as GiftTemplateTextZone);
      });
      // Names header above the three discs.
      next.push({
        id: 'names', type: 'text', label: 'Couple names',
        x_mm: 30, y_mm: 8, width_mm: 140, height_mm: 12, rotation_deg: 0,
        default_text: 'Couple names', font_size_mm: 8, font_family: 'cormorant', align: 'center',
        color: '#d4af37', font_style: 'normal', font_weight: '600',
      } as GiftTemplateTextZone);
      // Per-disc location + date text zones.
      [10, 70, 130].forEach((x, i) => {
        next.push({
          id: `loc-${i + 1}`, type: 'text', label: `Location ${i + 1}`,
          x_mm: x, y_mm: 110, width_mm: 60, height_mm: 6, rotation_deg: 0,
          default_text: '', font_size_mm: 3.6, font_family: 'inter', align: 'center',
          color: '#d4af37', font_weight: '600',
        } as GiftTemplateTextZone);
        next.push({
          id: `date-${i + 1}`, type: 'text', label: `Date ${i + 1}`,
          x_mm: x, y_mm: 118, width_mm: 60, height_mm: 6, rotation_deg: 0,
          default_text: '', font_size_mm: 3.2, font_family: 'inter', align: 'center',
          color: '#d4af37', font_weight: '400',
        } as GiftTemplateTextZone);
      });
    } else if (presetKey === 'heart-pair' && anchorKind === 'city_disk') {
      // Two heart-shaped panels: one map (left), one photo (right).
      // The map disc is square; admin can re-clip with a heart shape
      // zone overlay if they want a true heart-cut. For now we use
      // square disks + a heart-shape decoration on top.
      next.push({
        id: `${anchorKind}-1`, type: 'render_anchor', anchor_kind: anchorKind,
        label: 'Map', x_mm: 12, y_mm: 18, width_mm: 80, height_mm: 80, rotation_deg: 0,
      } as GiftTemplateRenderAnchorZone);
      next.push({
        id: 'photo-1', type: 'image', label: 'Photo',
        x_mm: 108, y_mm: 38, width_mm: 80, height_mm: 80, rotation_deg: 0,
        mask_preset: 'heart', visible: true,
      } as any);
      next.push({
        id: 'title', type: 'text', label: 'Title',
        x_mm: 20, y_mm: 8, width_mm: 160, height_mm: 8, rotation_deg: 0,
        default_text: 'WHERE IT ALL BEGAN', font_size_mm: 6, font_family: 'inter', align: 'center',
        color: '#0a0a0a', font_weight: '700', letter_spacing_em: 1,
      } as GiftTemplateTextZone);
      next.push({
        id: 'names', type: 'text', label: 'Names',
        x_mm: 20, y_mm: 130, width_mm: 160, height_mm: 10, rotation_deg: 0,
        default_text: 'william & wendy', font_size_mm: 7, font_family: 'caveat', align: 'center',
        color: '#0a0a0a', font_weight: '600',
      } as GiftTemplateTextZone);
      next.push({
        id: 'coords', type: 'text', label: 'Coordinates',
        x_mm: 20, y_mm: 150, width_mm: 160, height_mm: 6, rotation_deg: 0,
        default_text: '', font_size_mm: 3.4, font_family: 'inter', align: 'center',
        color: '#666', font_weight: '400', letter_spacing_em: 0.5,
      } as GiftTemplateTextZone);
      next.push({
        id: 'date', type: 'text', label: 'Date',
        x_mm: 20, y_mm: 162, width_mm: 160, height_mm: 6, rotation_deg: 0,
        default_text: '', font_size_mm: 3.4, font_family: 'inter', align: 'center',
        color: '#666', font_weight: '400',
      } as GiftTemplateTextZone);
    } else if (presetKey === 'circle-with-photos' && anchorKind === 'city_disk') {
      // One large circle map up top, three polaroid-style image zones
      // along the bottom edge. Customer fills 3 photos.
      next.push({
        id: `${anchorKind}-1`, type: 'render_anchor', anchor_kind: anchorKind,
        label: 'Map', x_mm: 50, y_mm: 18, width_mm: 100, height_mm: 100, rotation_deg: 0,
      } as GiftTemplateRenderAnchorZone);
      [20, 80, 140].forEach((x, i) => {
        next.push({
          id: `photo-${i + 1}`, type: 'image', label: `Photo ${i + 1}`,
          x_mm: x, y_mm: 130, width_mm: 40, height_mm: 40, rotation_deg: i === 0 ? -4 : i === 2 ? 4 : 0,
          visible: true,
        } as any);
      });
      next.push({
        id: 'title', type: 'text', label: 'Title',
        x_mm: 20, y_mm: 6, width_mm: 160, height_mm: 10, rotation_deg: 0,
        default_text: 'Where it all Started', font_size_mm: 8, font_family: 'caveat', align: 'center',
        color: '#0a0a0a', font_style: 'italic', font_weight: '600',
      } as GiftTemplateTextZone);
      next.push({
        id: 'names', type: 'text', label: 'Names',
        x_mm: 20, y_mm: 178, width_mm: 160, height_mm: 8, rotation_deg: 0,
        default_text: 'Names', font_size_mm: 6, font_family: 'caveat', align: 'center',
        color: '#0a0a0a', font_style: 'italic', font_weight: '600',
      } as GiftTemplateTextZone);
      next.push({
        id: 'meta', type: 'text', label: 'Location + date',
        x_mm: 20, y_mm: 188, width_mm: 160, height_mm: 6, rotation_deg: 0,
        default_text: '', font_size_mm: 3, font_family: 'inter', align: 'center',
        color: '#666',
      } as GiftTemplateTextZone);
    } else if (presetKey === 'pair' && anchorKind === 'star_disk') {
      // Star + photo pair (side-by-side circles).
      next.push({
        id: `${anchorKind}-1`, type: 'render_anchor', anchor_kind: anchorKind,
        label: 'Sky', x_mm: 12, y_mm: 18, width_mm: 80, height_mm: 80, rotation_deg: 0,
      } as GiftTemplateRenderAnchorZone);
      next.push({
        id: 'photo-1', type: 'image', label: 'Photo',
        x_mm: 108, y_mm: 18, width_mm: 80, height_mm: 80, rotation_deg: 0,
        mask_preset: 'circle', visible: true,
      } as any);
      next.push({
        id: 'tagline', type: 'text', label: 'Tagline',
        x_mm: 20, y_mm: 130, width_mm: 160, height_mm: 8, rotation_deg: 0,
        default_text: 'Love as deep as the stars',
        font_size_mm: 5, font_family: 'inter', align: 'center', color: '#fff', font_weight: '600', letter_spacing_em: 0.4,
      } as GiftTemplateTextZone);
      next.push({
        id: 'meta', type: 'text', label: 'Date · coordinates',
        x_mm: 20, y_mm: 145, width_mm: 160, height_mm: 6, rotation_deg: 0,
        default_text: '', font_size_mm: 3.2, font_family: 'inter', align: 'center', color: '#fff',
      } as GiftTemplateTextZone);
    } else {
      return;
    }

    // Confirm replacement when current zones aren't empty.
    if (zones.length > 0) {
      const ok = window.confirm('Apply preset and replace current zones? (Drag/resize after to fine-tune.)');
      if (!ok) return;
    }
    commitZones(next);
    setActiveZoneIdx(0);
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
    commitZones([...zones, copy]);
  }

  // HTML5 drag-and-drop reordering for the zone list. Tracks the
  // index being dragged + the index it's hovering, so we can show a
  // drop indicator BETWEEN rows. Reorder runs on drop.
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  function reorderZone(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= zones.length || to > zones.length) return;
    const next = [...zones];
    const [moved] = next.splice(from, 1);
    next.splice(to > from ? to - 1 : to, 0, moved);
    commitZones(next);
    // Active selection should follow the moved row.
    if (activeZoneIdx === from) setActiveZoneIdx(to > from ? to - 1 : to);
  }

  function removeZone(i: number) {
    commitZones(zones.filter((_, j) => j !== i));
    if (activeZoneIdx === i) setActiveZoneIdx(null);
  }

  function moveZone(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= zones.length) return;
    const next = [...zones];
    [next[i], next[j]] = [next[j], next[i]];
    commitZones(next);
  }

  const [drag, setDrag] = useState<null | { type: 'move' | 'resize'; idx: number; startX: number; startY: number; startZone: GiftTemplateZone }>(null);

  function beginZoneDrag(payload: { type: 'move' | 'resize'; idx: number; startX: number; startY: number; startZone: GiftTemplateZone }) {
    pushHistorySnapshot(zones);
    setDrag(payload);
  }

  function onCanvasPointerMove(e: React.PointerEvent) {
    if (panDragRef.current) {
      const p = panDragRef.current;
      setPan({ x: p.startPan.x + (e.clientX - p.startX), y: p.startPan.y + (e.clientY - p.startY) });
      return;
    }
    if (!drag) return;
    const dx = ((e.clientX - drag.startX) / canvasSize.w) * TEMPLATE_W / zoom;
    const dy = ((e.clientY - drag.startY) / canvasSize.h) * TEMPLATE_H / zoom;
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
  function endDrag() {
    setDrag(null);
    panDragRef.current = null;
  }

  function undoZones() {
    // Cancel any in-flight drag first — otherwise the next pointermove
    // re-applies drag.startZone as the baseline and silently re-undoes
    // the rewind we just performed.
    if (drag) setDrag(null);
    setZonesHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setZonesFuture((f) => [...f, zones]);
      setZones(prev);
      return h.slice(0, -1);
    });
  }

  function redoZones() {
    if (drag) setDrag(null);
    setZonesFuture((f) => {
      if (f.length === 0) return f;
      const next = f[f.length - 1];
      setZonesHistory((h) => {
        const updated = [...h, zones];
        return updated.length > HISTORY_CAP ? updated.slice(updated.length - HISTORY_CAP) : updated;
      });
      setZones(next);
      return f.slice(0, -1);
    });
  }

  // saveRef is invoked by Cmd+S — avoids re-attaching the keydown
  // listener every time `save`'s closed-over state changes (which is on
  // every keystroke in any field). The listener stays mounted; the ref
  // is updated on every render and points at the latest save closure.
  const saveRef = useRef<() => void>(() => {});

  useEffect(() => {
    function isEditableTarget(t: EventTarget | null): boolean {
      if (!t || !(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (t.isContentEditable) return true;
      return false;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === ' ' && !isEditableTarget(e.target)) {
        if (!spaceHeld) setSpaceHeld(true);
      }
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+S — save from any focus context (including text inputs,
      // because the natural reflex when typing in the Name field is to
      // hit save without moving the mouse).
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveRef.current();
        return;
      }

      if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        undoZones();
        return;
      }
      if (mod && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        redoZones();
        return;
      }

      if (isEditableTarget(e.target)) return;
      if (activeZoneIdx === null || activeZoneIdx < 0 || activeZoneIdx >= zones.length) return;

      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        const z = zones[activeZoneIdx];
        const newId = `${z.id}-copy-${Math.random().toString(36).slice(2, 7)}`;
        const copy: GiftTemplateZone = {
          ...z,
          id: newId,
          label: `${z.label} (copy)`,
          x_mm: clamp(z.x_mm + 8, 0, TEMPLATE_W - z.width_mm),
          y_mm: clamp(z.y_mm + 8, 0, TEMPLATE_H - z.height_mm),
        };
        commitZones([...zones, copy]);
        setActiveZoneIdx(zones.length);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        commitZones(zones.filter((_, j) => j !== activeZoneIdx));
        setActiveZoneIdx(null);
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (mod) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const z = zones[activeZoneIdx];
        let nx = z.x_mm;
        let ny = z.y_mm;
        if (e.key === 'ArrowLeft') nx = clamp(z.x_mm - step, 0, TEMPLATE_W - z.width_mm);
        if (e.key === 'ArrowRight') nx = clamp(z.x_mm + step, 0, TEMPLATE_W - z.width_mm);
        if (e.key === 'ArrowUp') ny = clamp(z.y_mm - step, 0, TEMPLATE_H - z.height_mm);
        if (e.key === 'ArrowDown') ny = clamp(z.y_mm + step, 0, TEMPLATE_H - z.height_mm);
        // Coalesce consecutive nudges on the same zone into one undo
        // entry. First key in a streak commits + pushes history; the
        // rest write zones directly. Streak resets when the active
        // zone changes or 500ms pass without a keypress.
        const STREAK_MS = 500;
        const now = Date.now();
        const streak = arrowStreakRef.current;
        const sameStreak = !!streak && streak.zoneIdx === activeZoneIdx && (now - streak.lastTime) < STREAK_MS;
        arrowStreakRef.current = { zoneIdx: activeZoneIdx, lastTime: now };
        const next = zones.map((zz, j) => (j === activeZoneIdx ? { ...zz, x_mm: nx, y_mm: ny } : zz));
        if (sameStreak) {
          setZones(next);
        } else {
          commitZones(next);
        }
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === ' ') setSpaceHeld(false);
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [zones, activeZoneIdx, spaceHeld]);

  function fitZoom() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function setZoomAroundPoint(nextZoom: number, cx: number, cy: number) {
    const clamped = Math.max(0.25, Math.min(4, nextZoom));
    if (clamped === zoom) return;
    const k = clamped / zoom;
    if (clamped === 1) {
      setPan({ x: 0, y: 0 });
    } else {
      setPan({ x: cx - k * (cx - pan.x), y: cy - k * (cy - pan.y) });
    }
    setZoom(clamped);
  }

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const node = canvasRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setZoomAroundPoint(zoom * factor, cx, cy);
    }
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [zoom, pan]);

  function onCanvasPanPointerDown(e: React.PointerEvent) {
    const middleMouse = e.button === 1;
    if (!middleMouse && !spaceHeld) return;
    if (zoom <= 1 && !middleMouse) return;
    e.preventDefault();
    panDragRef.current = { startX: e.clientX, startY: e.clientY, startPan: { ...pan } };
  }

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
      price_delta_cents: Math.max(0, Math.round((parseFloat(priceDeltaDollars) || 0) * 100)),
      is_active: isActive,
      reference_width_mm:  Number.isFinite(refWParsed) && refWParsed > 0 ? refWParsed : null,
      reference_height_mm: Number.isFinite(refHParsed) && refHParsed > 0 ? refHParsed : null,
      customer_can_recolor: customerCanRecolorBackground || customerCanRecolorText || customerCanRecolorCalendar,
      customer_can_recolor_background: customerCanRecolorBackground,
      customer_can_recolor_text: customerCanRecolorText,
      customer_can_recolor_calendar: customerCanRecolorCalendar,
      customer_can_change_font: customerCanChangeFont,
      customer_picker_role: customerPickerRole === 'none' ? null : customerPickerRole,
      // Strip empty rows so admins clicking the quick-add chips +
      // not naming them don't pollute the saved data.
      customer_swatches: customerSwatches
        .map((s) => ({ name: s.name.trim(), hex: s.hex, mockup_url: (s.mockup_url ?? '').trim() }))
        .filter((s) => s.name && validateHexColor(s.hex) !== null),
      occasion_id: occasionId.trim() || null,
      allowed_shape_kinds: allowedShapeKinds.size > 0 ? Array.from(allowedShapeKinds) : null,
      production_files: productionFiles.length > 0 ? productionFiles : null,
      renderer_config: rendererConfig,
    };
    startTransition(async () => {
      if (template) {
        const r = await updateTemplate(template.id, payload);
        if (!r.ok) { setErr(r.error); return; }
        setFlash(true);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => {
          setFlash(false);
          flashTimerRef.current = null;
        }, 1600);
        // Re-fetch the page server-side so the loader picks up the
        // freshly written group_name (and any newly-coined group label
        // makes the existingGroups list for the dropdown).
        router.refresh();
      } else {
        const r = await createTemplate(payload);
        if (!r.ok) setErr(r.error);
        else router.push(`/admin/gifts/templates/${r.id}`);
      }
    });
  }

  function remove() {
    // Two-step inline confirm — first click sets the flag, second click
    // (the now-red "Confirm delete" button in the top bar) actually fires.
    if (!template) return;
    if (!confirmTemplateDelete) {
      setConfirmTemplateDelete(true);
      return;
    }
    setConfirmTemplateDelete(false);
    startTransition(async () => {
      const r = await deleteTemplate(template.id);
      if (!r.ok) setErr(r.error);
      else router.push('/admin/gifts/templates');
    });
  }

  // Keep saveRef pointed at the freshest save closure so Cmd+S sees the
  // latest state without forcing the keydown listener to re-attach on
  // every keystroke.
  saveRef.current = save;

  function startGroupRename() {
    const current = groupName.trim();
    if (!current) return;
    setGroupRenaming(current);
  }
  function commitGroupRename() {
    if (groupRenaming === null) return;
    const current = groupName.trim();
    const next = groupRenaming.trim();
    setGroupRenaming(null);
    if (!current || !next || next === current) return;
    startTransition(async () => {
      const r = await renameTemplateGroup(current, next);
      if (!r.ok) { setErr(r.error); return; }
      setGroupName(next);
      router.refresh();
    });
  }
  function deleteCurrentGroup() {
    // Two-step: first click flips confirmGroupDelete, the visible red
    // "Confirm" button fires the actual server call.
    const current = groupName.trim();
    if (!current) return;
    if (!confirmGroupDelete) {
      setConfirmGroupDelete(true);
      return;
    }
    setConfirmGroupDelete(false);
    startTransition(async () => {
      const r = await clearTemplateGroup(current);
      if (!r.ok) { setErr(r.error); return; }
      setGroupName('');
      router.refresh();
    });
  }
  function commitNewGroup() {
    if (newGroupDraft === null) return;
    const fresh = newGroupDraft.trim();
    setNewGroupDraft(null);
    if (fresh) setGroupName(fresh);
  }

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

  const imageCount = zones.filter((z) => !isTextZone(z) && !isCalendarZone(z) && !isShapeZone(z) && !isRenderAnchorZone(z)).length;
  const textCount = zones.filter(isTextZone).length;
  const calendarCount = zones.filter(isCalendarZone).length;
  const shapeCount = zones.filter(isShapeZone).length;

  return (
    <div className="p-6">
      {/* Sticky top bar — the always-visible essentials. Name +
          active toggle + group selector live here so the eye doesn't
          have to hunt for them on every save. Save stays pinned;
          Cmd/Ctrl+S works from any focus context. */}
      <div className="sticky top-0 z-30 -mx-6 -mt-6 mb-4 border-b-2 border-ink bg-white/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 px-6 py-3">
          <Link href="/admin/gifts/templates" className="text-sm font-bold text-neutral-500 hover:text-ink shrink-0">← Back</Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            aria-label="Template name"
            className="min-w-[180px] flex-1 rounded border border-neutral-200 bg-white px-3 py-1.5 text-sm font-bold text-ink focus:border-pink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            title={isActive ? 'Active — customers can pick this template. Click to set inactive.' : 'Inactive. Click to publish.'}
            aria-pressed={isActive}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
              isActive
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-neutral-300 bg-neutral-50 text-neutral-500'
            }`}
          >
            <span aria-hidden className={`block h-2 w-2 rounded-full ${isActive ? 'bg-green-600' : 'bg-neutral-400'}`} />
            {isActive ? 'Active' : 'Inactive'}
          </button>
          <select
            value={groupName || ''}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__custom__') {
                setNewGroupDraft('');
                return;
              }
              setGroupName(v);
            }}
            className="shrink-0 max-w-[180px] rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs font-semibold text-ink focus:border-pink focus:outline-none"
            title="Template group"
          >
            <option value="">Ungrouped</option>
            {(existingGroups ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
            {groupName && !(existingGroups ?? []).includes(groupName) && (
              <option value={groupName}>{groupName} (current)</option>
            )}
            <option value="__custom__">+ New group…</option>
          </select>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {err && <span className="text-xs font-bold text-red-600">{err}</span>}
            {flash && <span className="text-xs font-bold text-green-600">✓ Saved</span>}
            {template && (
              confirmTemplateDelete ? (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <span className="text-neutral-500">Delete?</span>
                  <button onClick={remove} disabled={isPending} className="rounded bg-red-600 px-2 py-1 font-bold uppercase text-white hover:bg-red-700 disabled:opacity-50">Confirm</button>
                  <button onClick={() => setConfirmTemplateDelete(false)} disabled={isPending} className="rounded border border-neutral-300 bg-white px-2 py-1 font-semibold text-neutral-600 hover:border-ink disabled:opacity-50">Cancel</button>
                </span>
              ) : (
                <button onClick={remove} disabled={isPending} className="text-[11px] font-bold text-red-600 hover:underline" title="Delete template (existing orders stay intact)">Delete</button>
              )
            )}
            <button
              onClick={save}
              disabled={isPending}
              title="Cmd/Ctrl + S"
              className="rounded-full bg-pink px-5 py-2 text-xs font-bold text-white shadow-brand hover:bg-pink-dark disabled:opacity-50"
            >
              {isPending ? 'Saving…' : template ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
        {newGroupDraft !== null && (
          <div className="border-t border-neutral-200 bg-pink/5 px-6 py-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-ink">New group:</span>
            <input
              autoFocus
              value={newGroupDraft}
              onChange={(e) => setNewGroupDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitNewGroup(); }
                if (e.key === 'Escape') { e.preventDefault(); setNewGroupDraft(null); }
              }}
              placeholder="e.g. Romantic"
              className="rounded border border-neutral-200 bg-white px-2 py-1 focus:border-pink focus:outline-none"
            />
            <button type="button" onClick={commitNewGroup} className="rounded bg-pink px-3 py-1 font-bold text-white hover:bg-pink-dark">Add</button>
            <button type="button" onClick={() => setNewGroupDraft(null)} className="rounded border border-neutral-300 bg-white px-3 py-1 font-semibold text-neutral-600 hover:border-ink">Cancel</button>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr_280px]">
        {/* LEFT: settings — single-open accordion. One section open at
            a time so the eye stays calm. Defaults to "Canvas & Layout"
            because zone editing is the ~80% workflow. State persists
            per template via localStorage. */}
        <div className="space-y-3">

          <AccordionSection
            id="assets"
            title="Assets"
            hint="Background · Foreground · Description"
            openId={openSection}
            onOpen={setOpenSection}
          >
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
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} placeholder="Shown to customers under the thumbnail" />
            </label>
          </AccordionSection>

          <AccordionSection
            id="canvas-layout"
            title="Canvas & Layout"
            hint="Reference dimensions · Allowed shape kinds"
            openId={openSection}
            onOpen={setOpenSection}
          >
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
            {/* ── Pick-your-shape filter (per-template) ─────────────── */}
            <div className="rounded-lg border border-neutral-200 p-3">
              <div className="mb-2 text-xs font-bold text-ink">Allowed shape options</div>
              <div className="mb-3 text-[11px] text-neutral-500">
                Which entries from the product&rsquo;s &ldquo;Pick your shape&rdquo; picker can the
                customer use when they&rsquo;ve picked this template? Tick none to
                inherit all shape options from the product (the default).
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { kind: 'cutout',    label: 'Cutout' },
                  { kind: 'rectangle', label: 'Rectangle' },
                  { kind: 'template',  label: 'Template-shape' },
                ] satisfies Array<{ kind: ShapeKind; label: string }>).map((row) => (
                  <label key={row.kind} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-xs hover:border-pink">
                    <input
                      type="checkbox"
                      checked={allowedShapeKinds.has(row.kind)}
                      onChange={() => toggleAllowedShapeKind(row.kind)}
                    />
                    <span className="font-bold text-ink">{row.label}</span>
                  </label>
                ))}
              </div>
              {allowedShapeKinds.size === 0 ? (
                <div className="mt-2 text-[11px] text-neutral-500">All shape options visible (inheriting from product).</div>
              ) : null}
            </div>
            <p className="text-[11px] text-neutral-500">
              Add or rearrange zones with the layer list on the right and the
              shape palette above the canvas. Arrow keys nudge the selected zone
              (Shift = 10mm); Cmd+Z / Cmd+Shift+Z undo / redo.
            </p>
          </AccordionSection>

          <AccordionSection
            id="customer-controls"
            title="Customer controls"
            hint="Recolour · Font · Picker swatches"
            openId={openSection}
            onOpen={setOpenSection}
          >
            <div className="rounded-lg border border-neutral-200 p-3">
              <div className="mb-2 text-xs font-bold text-ink">Customer recolour permissions</div>
              <div className="mb-3 text-[11px] text-neutral-500">
                Pick which colour pickers the customer sees on the PDP. Each region is independent — you can let them change text colours without exposing the background picker, etc.
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={customerCanRecolorBackground}
                    onChange={(e) => setCustomerCanRecolorBackground(e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-ink">Background colour</span>
                    <span className="block text-[11px] text-neutral-500">
                      Theme / background fill picker. Also drives the foreground tint on templates that have a foreground PNG.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={customerCanRecolorText}
                    onChange={(e) => setCustomerCanRecolorText(e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-ink">Text colours</span>
                    <span className="block text-[11px] text-neutral-500">
                      A colour picker next to each text zone so the customer can change individual text colours.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={customerCanRecolorCalendar}
                    onChange={(e) => setCustomerCanRecolorCalendar(e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-ink">Calendar colours</span>
                    <span className="block text-[11px] text-neutral-500">
                      A colour picker next to each calendar zone (only relevant if the template has calendar zones).
                    </span>
                  </span>
                </label>
              </div>
            </div>
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
                            value={validateHexColor(s.hex) ?? '#000000'}
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
          </AccordionSection>

          <AccordionSection
            id="catalog-display"
            title="Catalog & display"
            hint="Group · Display order · Occasion · Price add-on"
            openId={openSection}
            onOpen={setOpenSection}
          >
            {/* Group rename / delete — only show actions when the
                template is actually in a saved group, since "Ungrouped"
                has nothing to rename. Rename uses an inline input
                instead of window.prompt; delete is a two-step
                confirm. */}
            {groupName && (existingGroups ?? []).includes(groupName) && (
              <div className="rounded-lg border border-neutral-200 p-3">
                <div className="mb-2 text-xs font-bold text-ink">Group: {groupName}</div>
                {groupRenaming !== null ? (
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <input
                      autoFocus
                      value={groupRenaming}
                      onChange={(e) => setGroupRenaming(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); commitGroupRename(); }
                        if (e.key === 'Escape') { e.preventDefault(); setGroupRenaming(null); }
                      }}
                      className="flex-1 rounded border border-neutral-200 bg-white px-2 py-1 focus:border-pink focus:outline-none"
                    />
                    <button type="button" onClick={commitGroupRename} disabled={isPending} className="rounded bg-pink px-3 py-1 font-bold text-white hover:bg-pink-dark disabled:opacity-50">Rename</button>
                    <button type="button" onClick={() => setGroupRenaming(null)} className="rounded border border-neutral-300 bg-white px-3 py-1 font-semibold text-neutral-600 hover:border-ink">Cancel</button>
                  </div>
                ) : confirmGroupDelete ? (
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-neutral-600">Remove the &ldquo;{groupName}&rdquo; group from every template that uses it? Templates stay; they just become Ungrouped.</span>
                    <button type="button" onClick={deleteCurrentGroup} disabled={isPending} className="rounded bg-red-600 px-3 py-1 font-bold uppercase text-white hover:bg-red-700 disabled:opacity-50">Confirm delete</button>
                    <button type="button" onClick={() => setConfirmGroupDelete(false)} className="rounded border border-neutral-300 bg-white px-3 py-1 font-semibold text-neutral-600 hover:border-ink">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-[11px]">
                    <button type="button" onClick={startGroupRename} disabled={isPending} className="font-semibold text-pink hover:underline disabled:opacity-50">
                      Rename group…
                    </button>
                    <span className="text-neutral-300">·</span>
                    <button type="button" onClick={deleteCurrentGroup} disabled={isPending} className="font-semibold text-red-600 hover:underline disabled:opacity-50">
                      Delete group…
                    </button>
                  </div>
                )}
              </div>
            )}
            <label className="block">
              <span className="mb-1 block text-[11px] text-neutral-600">Display order</span>
              <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} className={inputCls} />
              <span className="mt-1 block text-[10px] text-neutral-500">
                Lower numbers appear first in the customer template picker.
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-neutral-600">Price add-on (S$)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceDeltaDollars}
                onChange={(e) => setPriceDeltaDollars(e.target.value)}
                className={inputCls}
                placeholder="0.00"
              />
              <span className="mt-1 block text-[10px] text-neutral-500">
                Charged on top of the variant base when the customer picks this template. Leave at 0 for no upcharge.
              </span>
            </label>
            {/* ── Occasion windowing (per-template) ─────────────────── */}
            <div className="rounded-lg border border-neutral-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-bold text-ink">Occasion window</div>
                <Link
                  href="/admin/gifts/occasions"
                  className="text-[10px] font-bold text-neutral-500 underline hover:text-ink"
                >
                  Manage occasions →
                </Link>
              </div>
              <div className="mb-3 text-[11px] text-neutral-500">
                Optional. When set, the template only appears in the customer
                picker during the occasion&apos;s date window
                (target ± days_before / days_after). Leave as
                {' '}<strong>Always show</strong> for year-round layouts.
              </div>
              <select
                value={occasionId}
                onChange={(e) => setOccasionId(e.target.value)}
                className="w-full rounded border-2 border-neutral-200 bg-white px-2 py-1.5 text-xs"
              >
                <option value="">Always show (no occasion)</option>
                {availableOccasions.map((o) => {
                  const flag = o.is_active ? '' : ' · paused';
                  return (
                    <option key={o.id} value={o.id}>
                      {o.name} — {o.target_date} (−{o.days_before}/+{o.days_after}d){flag}
                    </option>
                  );
                })}
              </select>
            </div>
          </AccordionSection>

          <AccordionSection
            id="production"
            title="Production"
            hint="Output file types"
            openId={openSection}
            onOpen={setOpenSection}
          >
            <p className="text-[11px] text-neutral-500">
              Override the product&apos;s setting. Empty = inherit from the product (which may itself fall back to the mode default).
            </p>
            <div className="space-y-2">
              {([
                { key: 'png', label: 'PNG', note: 'bitmap, default for laser/UV/digital' },
                { key: 'jpg', label: 'JPG', note: 'bitmap, smaller; default for embroidery' },
                { key: 'svg', label: 'SVG', note: 'vector, default for foil' },
                { key: 'pdf', label: 'PDF', note: 'wrap the primary file in a print-ready PDF (with bleed)' },
              ] as const).map((f) => {
                const checked = productionFiles.includes(f.key);
                return (
                  <label key={f.key} className="flex items-start gap-2 rounded border border-neutral-200 p-2 hover:border-neutral-400">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setProductionFiles((prev) =>
                          e.target.checked ? [...prev, f.key] : prev.filter((k) => k !== f.key),
                        );
                      }}
                      className="mt-0.5 h-3.5 w-3.5"
                    />
                    <span className="block">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">{f.label}</span>
                      <span className="mt-0.5 block text-[10px] text-neutral-500">{f.note}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </AccordionSection>
        </div>

        {/* CENTRE: visual canvas + drawing tools + properties panel */}
        <div className="order-last space-y-4 xl:order-none">
          {/* Drawing tools palette — drop a shape primitive onto the
              canvas without an upload. Mirrors the Image/Text/Calendar
              add buttons in the right-hand layer panel. */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/60 p-2">
            <span className="inline-flex items-center gap-1 px-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
              <Shapes size={11} /> Shapes
            </span>
            <button type="button" onClick={() => addShapeZone('heart')} className="inline-flex items-center gap-1 rounded-full border-2 border-pink/40 bg-white px-2 py-1 text-[10px] font-bold text-pink hover:border-pink hover:bg-pink/10">
              <Heart size={11} /> Heart
            </button>
            <button type="button" onClick={() => addShapeZone('star')} className="inline-flex items-center gap-1 rounded-full border-2 border-amber-400 bg-white px-2 py-1 text-[10px] font-bold text-amber-600 hover:border-amber-500 hover:bg-amber-50">
              <Star size={11} /> Star
            </button>
            <button type="button" onClick={() => addShapeZone('circle')} className="inline-flex items-center gap-1 rounded-full border-2 border-neutral-300 bg-white px-2 py-1 text-[10px] font-bold text-neutral-700 hover:border-pink hover:text-pink">
              <Circle size={11} /> Circle
            </button>
            <button type="button" onClick={() => addShapeZone('rect')} className="inline-flex items-center gap-1 rounded-full border-2 border-neutral-300 bg-white px-2 py-1 text-[10px] font-bold text-neutral-700 hover:border-pink hover:text-pink">
              <Square size={11} /> Rectangle
            </button>
            <button type="button" onClick={() => addShapeZone('triangle')} className="inline-flex items-center gap-1 rounded-full border-2 border-neutral-300 bg-white px-2 py-1 text-[10px] font-bold text-neutral-700 hover:border-pink hover:text-pink">
              <Triangle size={11} /> Triangle
            </button>
            <button type="button" onClick={() => addShapeZone('line')} className="inline-flex items-center gap-1 rounded-full border-2 border-neutral-300 bg-white px-2 py-1 text-[10px] font-bold text-neutral-700 hover:border-pink hover:text-pink">
              <Minus size={11} /> Line
            </button>
          </div>
          {/* Properties panel — always visible at the top of the
              right column. Pulls layer-properties out of the cramped
              layer-list expansion so admin can see X / Y / W / H /
              align / font / rotation while the canvas stays in
              view. Empty state when nothing is selected. */}
          {(() => {
            const i = activeZoneIdx;
            if (i === null || i < 0 || i >= zones.length) {
              return (
                <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-[11px] text-neutral-500">
                  Click a layer in the list on the right to edit its position, font, alignment, and other properties here.
                </div>
              );
            }
            const z = zones[i];
            const isText = isTextZone(z);
            const isCal = isCalendarZone(z);
            const isAnchor = isRenderAnchorZone(z);
            const isShape = isShapeZone(z);
            return (
              <div className="rounded-lg border border-neutral-200 bg-white">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-pink">
                    Editing: <span className="text-ink">{z.label || 'Untitled'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveZone(i, -1)} className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100" title="Move back"><ArrowDown size={12} /></button>
                    <button type="button" onClick={() => moveZone(i, 1)} className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100" title="Move forward"><ArrowUp size={12} /></button>
                    <button type="button" onClick={() => duplicateZone(i)} className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100" title="Duplicate"><Copy size={12} /></button>
                    <button type="button" onClick={() => removeZone(i)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Remove (Cmd+Z to undo)"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="space-y-3 p-3">
                  {isAnchor ? (
                    <div className="rounded border-2 border-magenta/30 bg-magenta/5 p-3 text-[12px] leading-snug text-ink">
                      <div className="mb-1 font-bold uppercase tracking-wider text-magenta">
                        Code-driven region · {(z as GiftTemplateRenderAnchorZone).anchor_kind}
                      </div>
                      The renderer owns what gets drawn inside this rectangle. You can drag and resize the box (X / Y / W / H below) to move the region on the canvas, but the contents themselves come from code.
                    </div>
                  ) : isCal
                    ? <CalendarZoneFields zone={z as GiftTemplateCalendarZone} onChange={(p) => updateZone<GiftTemplateCalendarZone>(i, p)} />
                    : isText
                      ? <TextZoneFields zone={z as GiftTemplateTextZone} onChange={(p) => updateZone<GiftTemplateTextZone>(i, p)} />
                      : isShape
                        ? <ShapeZoneFields zone={z as GiftTemplateShapeZone} onChange={(p) => updateZone<GiftTemplateShapeZone>(i, p)} />
                        : <ImageZoneFields zone={z as GiftTemplateImageZone} onChange={(p) => updateZone<GiftTemplateImageZone>(i, p)} />}

                  <div className="border-t border-neutral-200 pt-3">
                    <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Align on canvas</div>
                    <div className="grid grid-cols-7 gap-1">
                      {([
                        { lbl: '⇤',  title: 'Align left edge',          patch: { x_mm: 0 } },
                        { lbl: '↔',  title: 'Centre horizontally',     patch: { x_mm: (TEMPLATE_W - z.width_mm) / 2 } },
                        { lbl: '⇥',  title: 'Align right edge',         patch: { x_mm: TEMPLATE_W - z.width_mm } },
                        { lbl: '⇡',  title: 'Align top edge',           patch: { y_mm: 0 } },
                        { lbl: '↕',  title: 'Centre vertically',       patch: { y_mm: (TEMPLATE_H - z.height_mm) / 2 } },
                        { lbl: '⇣',  title: 'Align bottom edge',        patch: { y_mm: TEMPLATE_H - z.height_mm } },
                        { lbl: '⊕',  title: 'Centre both',              patch: { x_mm: (TEMPLATE_W - z.width_mm) / 2, y_mm: (TEMPLATE_H - z.height_mm) / 2 } },
                      ] as const).map((btn) => (
                        <button
                          key={btn.title}
                          type="button"
                          onClick={() => updateZone(i, btn.patch as any)}
                          title={btn.title}
                          className="rounded border-2 border-neutral-200 bg-white px-1 py-1 text-sm text-neutral-700 hover:border-pink hover:text-pink"
                        >
                          {btn.lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 border-t border-neutral-200 pt-3">
                    <NumField label="X" value={z.x_mm} onChange={(v) => updateZone(i, { x_mm: v })} />
                    <NumField label="Y" value={z.y_mm} onChange={(v) => updateZone(i, { y_mm: v })} />
                    <NumField label="W" value={z.width_mm} onChange={(v) => updateZone(i, { width_mm: v })} />
                    <NumField label="H" value={z.height_mm} onChange={(v) => updateZone(i, { height_mm: v })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-neutral-200 pt-3">
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
                  </div>
                </div>
              </div>
            );
          })()}

          {isRendererTemplate && renderer && (
            <RendererConfigPanel
              renderer={renderer}
              config={rendererConfig}
              onChange={setRendererConfigField}
            />
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
                <div className="flex items-center gap-1 rounded border border-neutral-200 bg-white px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => setZoomAroundPoint(zoom / 1.25, canvasSize.w / 2, canvasSize.h / 2)}
                    className="px-1.5 text-[12px] font-bold text-neutral-700 hover:text-pink"
                    title="Zoom out"
                  >
                    −
                  </button>
                  <span className="min-w-[34px] text-center font-mono text-[10px] text-neutral-500">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomAroundPoint(zoom * 1.25, canvasSize.w / 2, canvasSize.h / 2)}
                    className="px-1.5 text-[12px] font-bold text-neutral-700 hover:text-pink"
                    title="Zoom in"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={fitZoom}
                    className="ml-1 rounded px-1.5 text-[10px] font-bold text-neutral-700 hover:text-pink"
                    title="Reset zoom + pan"
                  >
                    Fit
                  </button>
                </div>
              </div>
            </div>
            <div
              ref={canvasRef}
              className="relative mx-auto my-6 w-full max-w-xl select-none overflow-hidden rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-100"
              onPointerMove={onCanvasPointerMove}
              onPointerDown={onCanvasPanPointerDown}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              style={{
                touchAction: 'none',
                aspectRatio: previewAspect,
                cursor: panDragRef.current ? 'grabbing' : spaceHeld && zoom > 1 ? 'grab' : undefined,
              }}
            >
              <div
                className="pv-canvas-content absolute inset-0"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                }}
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
              {/* Spotify plaque mounts the same React preview the
                  customer sees so the demo scan code (Mr. Brightside)
                  actually renders — SVG <image> via innerHTML doesn't
                  load cross-origin images, so the preview overlays a
                  plain HTML <img> on top of the layout SVG. */}
              {isRendererTemplate && renderer === 'spotify_plaque' && (() => {
                const refW = parseFloat(refWidthMm);
                const refH = parseFloat(refHeightMm);
                const dims = Number.isFinite(refW) && Number.isFinite(refH) && refW > 0 && refH > 0
                  ? { width_mm: refW, height_mm: refH }
                  : null;
                return (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div style={{ width: '100%', height: '100%', maxWidth: '100%' }}>
                      <SpotifyPlaqueTemplate
                        photoUrl={null}
                        songTitle="Your Favourite Song"
                        artistName="Artist's Name"
                        spotifyTrackId="6rqhFgbbKwnb9MLmUQDhG6"
                        templateRefDims={dims}
                        zones={zones as any}
                        backgroundUrl={background || null}
                        foregroundUrl={foreground || null}
                      />
                    </div>
                  </div>
                );
              })()}
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
                if (isTextZone(z) || isCalendarZone(z) || isRenderAnchorZone(z) || isShapeZone(z)) return null;
                const img = z as GiftTemplateImageZone;
                const fit = img.fit_mode ?? 'cover';
                const hasContent = Boolean(img.default_image_url);
                const clipPath = maskClipPathCss(img.mask_preset);
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

              {/* Decorative shape zones — pure SVG drawn from the same
                  helper the customer preview + production composite use,
                  so the canvas is byte-identical to what gets printed. */}
              {zones.map((z, i) => {
                if (!isShapeZone(z)) return null;
                if ((z as any).hidden) return null;
                const svg = shapeZoneSvg(z, z.width_mm, z.height_mm);
                const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                return (
                  <img
                    key={`sv-${i}`}
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
                if ((z as any).hidden) return null;
                // Renderer-driven templates that draw their own text in
                // the SVG (spotify_plaque, song_lyrics) shouldn't get a
                // second HTML overlay on top — that double-renders the
                // string. star_map / city_map / zones don't render text
                // via SVG, so the overlay is the only thing showing it.
                if (renderer === 'spotify_plaque' || renderer === 'song_lyrics') return null;
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

              {/* Zone handles + outlines — above everything. Hidden
                  zones drop their handle here too so the visual eye-
                  toggle is unambiguous. Admin un-hides via the eye
                  icon in the right-side layer list. */}
              {zones.map((z, i) => {
                if ((z as any).hidden) return null;
                const active = activeZoneIdx === i;
                const left = (z.x_mm / TEMPLATE_W) * 100;
                const top = (z.y_mm / TEMPLATE_H) * 100;
                const width = (z.width_mm / TEMPLATE_W) * 100;
                const height = (z.height_mm / TEMPLATE_H) * 100;
                const isText = isTextZone(z);
                const isAnchor = isRenderAnchorZone(z);
                const isShape = isShapeZone(z);
                const accent = isAnchor ? '#E91E8C' : isText ? '#0a0a0a' : isShape ? '#a855f7' : '#E91E8C';
                const handleLabel = isAnchor ? 'A' : isText ? 'T' : isShape ? 'S' : 'I';
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
                      beginZoneDrag({ type: 'move', idx: i, startX: e.clientX, startY: e.clientY, startZone: z });
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
                          beginZoneDrag({ type: 'resize', idx: i, startX: e.clientX, startY: e.clientY, startZone: z });
                        }}
                        className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full border-2 bg-white"
                        style={{ borderColor: accent }}
                      />
                    )}
                  </div>
                );
              })}

              </div>
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

        {/* RIGHT: layer list grouped by role */}
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-ink">Layers</div>
                <div className="text-[11px] text-neutral-500">
                  {imageCount} image · {textCount} text{calendarCount > 0 && ` · ${calendarCount} calendar`}{shapeCount > 0 && ` · ${shapeCount} shape`}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                <button type="button" onClick={addImageZone} title="Add image slot" className="inline-flex items-center gap-1 rounded-full bg-pink px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-pink-dark">
                  <ImageIcon size={11} />
                </button>
                <button type="button" onClick={addTextZone} title="Add text slot" className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-neutral-700">
                  <Type size={11} />
                </button>
                <button type="button" onClick={addCalendarZone} title="Add calendar slot" className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-amber-600">
                  <CalendarIcon size={11} />
                </button>
                {renderer === 'city_map' && (
                  <>
                    <button
                      type="button"
                      onClick={() => addRenderAnchorZone('city_disk', 'Map')}
                      title="Add a city-map disk. Drag to reposition, resize from corners."
                      className="inline-flex items-center gap-1 rounded-full border-2 border-pink bg-white px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-pink hover:bg-pink hover:text-white"
                    >
                      + Map
                    </button>
                    <select
                      onChange={(e) => {
                        if (!e.target.value) return;
                        applyLayoutPreset(e.target.value);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      title="Apply a starting layout — drag/resize to taste afterwards"
                      className="rounded-full border-2 border-neutral-300 bg-white px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-700 hover:border-pink"
                    >
                      <option value="">Apply layout…</option>
                      <option value="single-circle">Single circle</option>
                      <option value="three-circles">Three circles (Met/Engaged/Married)</option>
                      <option value="heart-pair">Heart pair (map + photo)</option>
                      <option value="circle-with-photos">Circle + photo strip</option>
                    </select>
                  </>
                )}
                {renderer === 'star_map' && (
                  <>
                    <button
                      type="button"
                      onClick={() => addRenderAnchorZone('star_disk', 'Sky')}
                      title="Add a star-map sky disk. Drag to reposition, resize from corners."
                      className="inline-flex items-center gap-1 rounded-full border-2 border-pink bg-white px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-pink hover:bg-pink hover:text-white"
                    >
                      + Sky
                    </button>
                    <select
                      onChange={(e) => {
                        if (!e.target.value) return;
                        applyLayoutPreset(e.target.value);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      title="Apply a starting layout — drag/resize to taste afterwards"
                      className="rounded-full border-2 border-neutral-300 bg-white px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-700 hover:border-pink"
                    >
                      <option value="">Apply layout…</option>
                      <option value="single-circle">Single circle</option>
                      <option value="three-circles">Three circles (Met/Engaged/Married)</option>
                      <option value="pair">Sky + photo pair</option>
                    </select>
                  </>
                )}
              </div>
            </div>
            {zones.length === 0 ? (
              <div className="rounded border border-dashed border-neutral-300 p-4 text-center text-[11px] text-neutral-500">
                No slots yet. Add image zones for customer photos, text zones for customizable messages.
              </div>
            ) : (() => {
              const groupDefs: Array<{ key: string; label: string; match: (z: GiftTemplateZone) => boolean }> = [
                { key: 'photos',      label: 'Photos',      match: (z) => z.type === 'image' },
                { key: 'text',        label: 'Text',        match: (z) => z.type === 'text' },
                { key: 'calendars',   label: 'Calendars',   match: (z) => z.type === 'calendar' },
                { key: 'shapes',      label: 'Shapes',      match: (z) => z.type === 'shape' },
                { key: 'decorations', label: 'Decorations', match: (z) => z.type === 'render_anchor' },
              ];
              const buckets = new Map<string, Array<{ z: GiftTemplateZone; i: number }>>();
              for (const g of groupDefs) buckets.set(g.key, []);
              buckets.set('other', []);
              zones.forEach((z, i) => {
                const hit = groupDefs.find((g) => g.match(z));
                buckets.get(hit ? hit.key : 'other')!.push({ z, i });
              });
              const renderRow = (z: GiftTemplateZone, i: number) => {
                const active = activeZoneIdx === i;
                const isText = isTextZone(z);
                const isCal = isCalendarZone(z);
                const isAnchor = isRenderAnchorZone(z);
                const isShape = isShapeZone(z);
                const badgeBg = isAnchor ? 'bg-pink' : isCal ? 'bg-amber-500' : isText ? 'bg-ink' : isShape ? 'bg-purple-500' : 'bg-pink';
                return (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => {
                      setDragSrcIdx(i);
                      e.dataTransfer.effectAllowed = 'move';
                      try { e.dataTransfer.setData('text/plain', String(i)); } catch {}
                    }}
                    onDragOver={(e) => {
                      if (dragSrcIdx === null) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const above = e.clientY < r.top + r.height / 2;
                      setDragOverIdx(above ? i + 1 : i);
                    }}
                    onDragLeave={() => setDragOverIdx(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragSrcIdx !== null && dragOverIdx !== null) {
                        reorderZone(dragSrcIdx, dragOverIdx);
                      }
                      setDragSrcIdx(null);
                      setDragOverIdx(null);
                    }}
                    onDragEnd={() => { setDragSrcIdx(null); setDragOverIdx(null); }}
                    className={`rounded-lg border-2 ${active ? 'border-pink bg-pink/5' : 'border-neutral-200'} ${z.locked ? 'opacity-80' : ''} ${(z as any).hidden ? 'opacity-50' : ''} ${dragSrcIdx === i ? 'opacity-30' : ''}`}
                    style={{
                      cursor: dragSrcIdx !== null ? 'grabbing' : 'grab',
                      borderBottom: dragOverIdx === i + 1 && dragSrcIdx !== null && dragSrcIdx !== i ? '3px solid var(--pv-magenta, #E91E8C)' : undefined,
                      borderTop: dragOverIdx === i && dragSrcIdx !== null && dragSrcIdx !== i ? '3px solid var(--pv-magenta, #E91E8C)' : undefined,
                    }}
                  >
                    <div className="flex w-full items-center justify-between gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => setActiveZoneIdx(active ? null : i)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-white ${badgeBg}`}>
                          {isCal ? <CalendarIcon size={12} /> : isText ? <Type size={12} /> : isShape ? <Shapes size={12} /> : <ImageIcon size={12} />}
                        </span>
                        <span className={`text-sm font-bold text-ink truncate ${(z as any).hidden ? 'line-through' : ''}`}>{z.label || 'Untitled'}</span>
                        {isText && (z as GiftTemplateTextZone).editable === false && (
                          <Lock size={11} className="shrink-0 text-neutral-400" />
                        )}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); updateZone(i, ({ hidden: !((z as any).hidden) } as any)); }}
                          title={(z as any).hidden ? 'Show — render this layer' : 'Hide — skip this layer (still saved)'}
                          className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-colors ${
                            (z as any).hidden
                              ? 'border-neutral-400 bg-neutral-200 text-neutral-600'
                              : 'border-neutral-300 bg-white text-neutral-500 hover:border-pink hover:text-pink'
                          }`}
                        >
                          {(z as any).hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
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
                  </div>
                );
              };
              const groupOrder: Array<{ key: string; label: string }> = [
                ...groupDefs.map((g) => ({ key: g.key, label: g.label })),
                { key: 'other', label: 'Other' },
              ];
              return (
                <div className="space-y-3">
                  {groupOrder.map((g) => {
                    const rows = buckets.get(g.key) ?? [];
                    if (rows.length === 0) return null;
                    const collapsed = collapsedLayerGroups.has(g.key);
                    return (
                      <div key={g.key}>
                        <button
                          type="button"
                          onClick={() => toggleLayerGroup(g.key)}
                          className="mb-1.5 flex w-full items-center justify-between gap-2 px-1 text-left"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            {g.label.toUpperCase()} <span className="text-neutral-400">· {rows.length}</span>
                          </span>
                          <span className="text-[10px] font-bold text-neutral-400">{collapsed ? '+' : '−'}</span>
                        </button>
                        {!collapsed && (
                          <div className="flex flex-col-reverse gap-1.5">
                            {rows.map(({ z, i }) => renderRow(z, i))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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

      {/* Floating success toast — visible regardless of scroll position. */}
      {flash && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg border-2 border-green-600 bg-green-50 px-5 py-3 text-base font-bold text-green-700 shadow-brand"
        >
          <span aria-hidden className="text-xl">✓</span>
          Template saved
        </div>
      )}
      {err && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg border-2 border-red-600 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 shadow-brand"
        >
          <span aria-hidden className="text-xl">✗</span>
          {err}
        </div>
      )}
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

function ShapeZoneFields({ zone, onChange }: { zone: GiftTemplateShapeZone; onChange: (p: Partial<GiftTemplateShapeZone>) => void }) {
  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
  const isLine = zone.shape === 'line';
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Label</span>
        <input value={zone.label} onChange={(e) => onChange({ label: e.target.value })} className={inputCls} />
      </label>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Shape</div>
        <div className="grid grid-cols-3 gap-1">
          {GIFT_SHAPE_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => onChange({ shape: kind })}
              className={`rounded border-2 px-2 py-1 text-[10px] font-bold uppercase ${
                zone.shape === kind ? 'border-pink bg-pink text-white' : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              {GIFT_SHAPE_LABEL[kind]}
            </button>
          ))}
        </div>
      </div>

      {!isLine && (
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Fill colour</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={validateHexColor(zone.fill) ?? '#ec4899'}
              onChange={(e) => onChange({ fill: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border-2 border-neutral-200"
            />
            <input
              type="text"
              value={zone.fill ?? ''}
              onChange={(e) => onChange({ fill: e.target.value || null })}
              placeholder="#ec4899 (or empty for none)"
              className={inputCls}
            />
          </div>
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
          {isLine ? 'Line colour' : 'Stroke colour (outline)'}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={validateHexColor(zone.stroke) ?? '#0a0a0a'}
            onChange={(e) => onChange({ stroke: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded border-2 border-neutral-200"
          />
          <input
            type="text"
            value={zone.stroke ?? ''}
            onChange={(e) => onChange({ stroke: e.target.value || null })}
            placeholder="#0a0a0a (or empty for none)"
            className={inputCls}
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
          {isLine ? 'Line thickness (mm)' : 'Stroke width (mm)'}
        </span>
        <input
          type="number"
          min={0}
          step={0.1}
          value={zone.stroke_width ?? 0}
          onChange={(e) => onChange({ stroke_width: Math.max(0, parseFloat(e.target.value) || 0) })}
          className={inputCls}
        />
      </label>
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

// ---------------------------------------------------------------------------
// Renderer-config panel
// ---------------------------------------------------------------------------
//
// Replaces the old static "code-driven template" notice with an
// editable panel for renderer-driven templates (city_map / star_map /
// song_lyrics / spotify_plaque). Admin sets layout + content
// defaults; customer overrides at order time still win.

function RendererConfigPanel({
  renderer,
  config,
  onChange,
}: {
  renderer: string;
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const layouts = RENDERER_LAYOUT_OPTIONS[renderer] ?? [];
  const layoutKey = (config.layout as string | undefined) ?? '';
  const get = (k: string) => (config[k] as string | undefined) ?? '';
  const getBool = (k: string, fallback = false) => (typeof config[k] === 'boolean' ? (config[k] as boolean) : fallback);

  return (
    <div className="rounded-lg border-2 border-pink/30 bg-pink/5 p-4">
      <div className="mb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-pink">
          Renderer config — <span className="font-mono">{renderer}</span>
        </div>
        <p className="mt-1 text-[11px] text-neutral-600 leading-snug">
          Set layout + default content for this template. Customer-supplied
          values at order time still override these — admin defaults appear
          in the preview and as fallbacks if the customer leaves a field blank.
        </p>
      </div>

      {layouts.length > 0 && (
        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] font-bold text-ink">Layout</span>
          <select
            value={layoutKey || (layouts.find((l) => l.available)?.key ?? '')}
            onChange={(e) => onChange('layout', e.target.value)}
            className="w-full max-w-md rounded border-2 border-neutral-200 bg-white px-2 py-1.5 text-xs focus:border-pink focus:outline-none"
          >
            {layouts.map((l) => (
              <option key={l.key} value={l.key} disabled={!l.available}>
                {l.label}{!l.available ? ' (coming soon)' : ''}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10px] text-neutral-500">
            {layouts.find((l) => l.key === layoutKey)?.description ?? layouts.find((l) => l.available)?.description}
          </span>
        </label>
      )}

      {(renderer === 'city_map' || renderer === 'star_map' || renderer === 'song_lyrics') && (
        <RendererTextField
          label="Default title"
          hint="Shown above the map / sky chart. Customer typed value wins; this is the fallback."
          value={get('default_title')}
          onChange={(v) => onChange('default_title', v)}
        />
      )}

      {(renderer === 'star_map' || renderer === 'song_lyrics') && (
        <RendererTextField
          label="Default subtitle / event"
          hint='e.g. "The first dance", "When we met". Optional.'
          value={get('default_subtitle')}
          onChange={(v) => onChange('default_subtitle', v)}
        />
      )}

      {(renderer === 'city_map' || renderer === 'star_map') && (
        <RendererTextField
          label="Names separator"
          hint='Slotted between the two names. e.g. " ❤ ", " & ", " · "'
          value={get('default_names_separator')}
          onChange={(v) => onChange('default_names_separator', v)}
        />
      )}

      {(renderer === 'song_lyrics' || renderer === 'spotify_plaque') && (
        <RendererTextField
          label="Default tagline"
          hint='Single-line caption shown under the artwork. Optional.'
          value={get('default_tagline')}
          onChange={(v) => onChange('default_tagline', v)}
        />
      )}

      {(renderer === 'city_map' || renderer === 'star_map') && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <RendererBoolField
            label="Show coordinates"
            hint="Latitude / longitude under the map."
            value={getBool('show_coordinates', true)}
            onChange={(v) => onChange('show_coordinates', v)}
          />
          <RendererBoolField
            label="Show date"
            hint='e.g. "21 Apr 2024"'
            value={getBool('show_date', true)}
            onChange={(v) => onChange('show_date', v)}
          />
        </div>
      )}

      <p className="mt-4 text-[10px] text-neutral-500 leading-relaxed">
        <strong>Where the design sits inside the physical frame</strong> is
        controlled per variant on the gift product page (mockup image + design
        area rectangle). Layouts marked &ldquo;coming soon&rdquo; are listed
        here so this template is ready when the renderer ships them.
      </p>
    </div>
  );
}

function RendererTextField({
  label, hint, value, onChange,
}: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[11px] font-bold text-ink">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-md rounded border-2 border-neutral-200 bg-white px-2 py-1.5 text-xs focus:border-pink focus:outline-none"
        maxLength={200}
      />
      {hint && <span className="mt-1 block text-[10px] text-neutral-500">{hint}</span>}
    </label>
  );
}

function RendererBoolField({
  label, hint, value, onChange,
}: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-pink"
      />
      <span>
        <span className="block text-[11px] font-bold text-ink">{label}</span>
        {hint && <span className="block text-[10px] text-neutral-500 leading-snug">{hint}</span>}
      </span>
    </label>
  );
}
