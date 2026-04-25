// Per-product, localStorage-backed customer design draft.
//
// Captures the customer's in-progress choices (template, style,
// variant, size, shape, text fills, colours, calendar fills) so they
// can close the tab and pick back up where they left off. Photos and
// AI-generated previews live in the existing preview-history; this
// file is *just* the design state.
//
// One draft per product slug. Saving overwrites. clearDraft() ditches
// it entirely (used after a successful add-to-cart).

import type { CalendarFill } from './pipeline/calendar-svg';
import type { ShapeKind } from './shape-options';

const VERSION = 1;
const KEY_PREFIX = 'gift-design-draft:';

export type GiftDesignDraft = {
  v: 1;
  ts: number;
  templateId: string | null;
  promptId: string | null;
  variantId: string | null;
  sizeSlug: string | null;
  shapeKind: ShapeKind | null;
  shapeTemplateId: string | null;
  figurineSlug: string | null;
  customerArea: { x: number; y: number; width: number; height: number } | null;
  panOffset: { x: number; y: number } | null;
  // Maps are zone-id keyed.
  texts: Record<string, string>;
  textColors: Record<string, string>;
  textFonts: Record<string, string>;
  calendars: Record<string, CalendarFill>;
  calendarColors: Record<string, string>;
  foregroundColor: string | null;
  backgroundColor: string | null;
};

export type GiftDesignDraftPatch = Partial<Omit<GiftDesignDraft, 'v' | 'ts'>>;

function key(productSlug: string): string {
  return `${KEY_PREFIX}${productSlug}`;
}

// Defence-in-depth: anyone with a localStorage write primitive (a
// browser extension, a separate XSS) could otherwise inject crafted
// values that flow into SVG attributes / style props. Cap text
// lengths and reject anything that doesn't look like a hex colour
// or a plain string keyed by a non-suspicious id.
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const ZONE_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function strOrNull(v: unknown, max = 200): string | null {
  return typeof v === 'string' && v.length <= max ? v : null;
}
function hexOrNull(v: unknown): string | null {
  return typeof v === 'string' && HEX_RE.test(v) ? v : null;
}
function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function rectOrNull(v: unknown): { x: number; y: number; width: number; height: number } | null {
  if (!v || typeof v !== 'object') return null;
  const r = v as Record<string, unknown>;
  const x = numOrNull(r.x), y = numOrNull(r.y), w = numOrNull(r.width), h = numOrNull(r.height);
  return x !== null && y !== null && w !== null && h !== null ? { x, y, width: w, height: h } : null;
}
function pointOrNull(v: unknown): { x: number; y: number } | null {
  if (!v || typeof v !== 'object') return null;
  const r = v as Record<string, unknown>;
  const x = numOrNull(r.x), y = numOrNull(r.y);
  return x !== null && y !== null ? { x, y } : null;
}
// Cap entries per record so a malicious localStorage payload with
// 100k zone keys can't blow up React state on next mount. Real
// templates top out at ~10 zones; 64 is generous.
const MAX_ZONE_ENTRIES = 64;
function recordOf<T>(v: unknown, validator: (val: unknown) => T | null): Record<string, T> {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, T> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_ZONE_ENTRIES) break;
    if (!ZONE_ID_RE.test(k)) continue;
    const validated = validator(val);
    if (validated !== null) out[k] = validated;
  }
  return out;
}
function calendarFillOrNull(v: unknown): CalendarFill | null {
  if (!v || typeof v !== 'object') return null;
  const r = v as Record<string, unknown>;
  const month = numOrNull(r.month), year = numOrNull(r.year);
  if (month === null || year === null) return null;
  const day = r.highlightedDay === null ? null : numOrNull(r.highlightedDay);
  return { month, year, highlightedDay: day };
}

export function loadDesignDraft(productSlug: string): GiftDesignDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key(productSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.v !== VERSION || typeof parsed.ts !== 'number') return null;
    const p = parsed as Record<string, unknown>;
    const shape = p.shapeKind;
    return {
      v: VERSION,
      ts: parsed.ts,
      templateId: strOrNull(p.templateId, 64),
      promptId: strOrNull(p.promptId, 64),
      variantId: strOrNull(p.variantId, 64),
      sizeSlug: strOrNull(p.sizeSlug, 40),
      shapeKind: (shape === 'cutout' || shape === 'rectangle' || shape === 'template') ? shape : null,
      shapeTemplateId: strOrNull(p.shapeTemplateId, 64),
      figurineSlug: strOrNull(p.figurineSlug, 40),
      customerArea: rectOrNull(p.customerArea),
      panOffset: pointOrNull(p.panOffset),
      texts: recordOf(p.texts, (v) => strOrNull(v, 500)),
      textColors: recordOf(p.textColors, hexOrNull),
      textFonts: recordOf(p.textFonts, (v) => strOrNull(v, 40)),
      calendars: recordOf(p.calendars, calendarFillOrNull),
      calendarColors: recordOf(p.calendarColors, hexOrNull),
      foregroundColor: hexOrNull(p.foregroundColor),
      backgroundColor: hexOrNull(p.backgroundColor),
    };
  } catch {
    return null;
  }
}

export function saveDesignDraft(productSlug: string, draft: Omit<GiftDesignDraft, 'v' | 'ts'>): void {
  if (typeof window === 'undefined') return;
  try {
    const full: GiftDesignDraft = { ...draft, v: VERSION, ts: Date.now() };
    window.localStorage.setItem(key(productSlug), JSON.stringify(full));
  } catch {
    // Storage full / privacy mode — silently drop.
  }
}

export function clearDesignDraft(productSlug: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key(productSlug));
  } catch {
    // ignore
  }
}

/** Cheap debounce specialised for autosave — returns a wrapper that
 *  schedules the latest call after `wait` ms of quiet. */
export function debounceWrite<T extends (...args: any[]) => void>(fn: T, wait: number): T {
  let h: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    if (h) clearTimeout(h);
    h = setTimeout(() => {
      h = null;
      fn(...args);
    }, wait);
  }) as T;
}
