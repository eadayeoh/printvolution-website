// Per-product, localStorage-backed history of AI preview generations.
//
// Why this exists: customers flip between Line Art / Realistic and often
// want to come back to an earlier generation (either a previous style,
// or an earlier photo they changed their mind about) without burning
// another generate call. History survives page reload and accumulates
// across multiple photo uploads — clicking a hit restores that source +
// preview so the cart-add carries the right asset IDs.

export type PreviewHit = {
  id: string;
  /** null = single-style product (no prompt picker shown). */
  promptId: string | null;
  sourceAssetId: string;
  previewAssetId: string;
  previewUrl: string;
  ts: number;
};

const VERSION = 1;
const KEY_PREFIX = 'gift-preview-history:';
const MAX_PER_STYLE = 6;

function storageKey(productSlug: string): string {
  return `${KEY_PREFIX}${productSlug}`;
}

export function loadPreviewHistory(productSlug: string): PreviewHit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(productSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== VERSION || !Array.isArray(parsed.hits)) return [];
    return parsed.hits.filter(isValidHit);
  } catch {
    return [];
  }
}

function isValidHit(h: unknown): h is PreviewHit {
  if (!h || typeof h !== 'object') return false;
  const r = h as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    (r.promptId === null || typeof r.promptId === 'string') &&
    typeof r.sourceAssetId === 'string' &&
    typeof r.previewAssetId === 'string' &&
    typeof r.previewUrl === 'string' &&
    typeof r.ts === 'number'
  );
}

function writePreviewHistory(productSlug: string, hits: PreviewHit[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      storageKey(productSlug),
      JSON.stringify({ v: VERSION, hits }),
    );
  } catch {
    // Full / privacy-mode localStorage — silently drop.
  }
}

/** Append a hit to history, dedupe exact previewAssetId, and cap at
 *  MAX_PER_STYLE entries per promptId (FIFO — oldest style-match drops
 *  off). Returns the new full array. */
export function appendPreviewHit(
  productSlug: string,
  hit: Omit<PreviewHit, 'id' | 'ts'> & { id?: string; ts?: number },
): PreviewHit[] {
  const full: PreviewHit = {
    id: hit.id ?? `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    ts: hit.ts ?? Date.now(),
    promptId: hit.promptId,
    sourceAssetId: hit.sourceAssetId,
    previewAssetId: hit.previewAssetId,
    previewUrl: hit.previewUrl,
  };
  const existing = loadPreviewHistory(productSlug);
  // Drop any earlier hit with the same previewAssetId — a repeat generate
  // would otherwise clutter the strip with identical thumbnails.
  const deduped = existing.filter((h) => h.previewAssetId !== full.previewAssetId);
  // Cap per-promptId: group same-style hits, keep the newest MAX_PER_STYLE.
  const byStyle = new Map<string | null, PreviewHit[]>();
  for (const h of [...deduped, full]) {
    const arr = byStyle.get(h.promptId) ?? [];
    arr.push(h);
    byStyle.set(h.promptId, arr);
  }
  const trimmed: PreviewHit[] = [];
  for (const [, arr] of byStyle) {
    arr.sort((a, b) => a.ts - b.ts);
    trimmed.push(...arr.slice(-MAX_PER_STYLE));
  }
  trimmed.sort((a, b) => a.ts - b.ts);
  writePreviewHistory(productSlug, trimmed);
  return trimmed;
}

export function removePreviewHit(productSlug: string, hitId: string): PreviewHit[] {
  const next = loadPreviewHistory(productSlug).filter((h) => h.id !== hitId);
  writePreviewHistory(productSlug, next);
  return next;
}

export function clearPreviewHistoryForStyle(
  productSlug: string,
  promptId: string | null,
): PreviewHit[] {
  const next = loadPreviewHistory(productSlug).filter((h) => h.promptId !== promptId);
  writePreviewHistory(productSlug, next);
  return next;
}
