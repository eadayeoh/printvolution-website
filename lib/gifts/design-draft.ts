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

export function loadDesignDraft(productSlug: string): GiftDesignDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key(productSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== VERSION || typeof parsed.ts !== 'number') return null;
    return parsed as GiftDesignDraft;
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
