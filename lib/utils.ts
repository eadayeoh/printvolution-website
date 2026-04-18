import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format cents as S$X.XX (SGD). Pass price in cents (e.g. 8800 → S$88.00). */
export function formatSGD(cents: number): string {
  return `S$${(cents / 100).toFixed(2)}`;
}

/** Slugify: lowercase, replace non-alphanum with hyphens, strip leading/trailing hyphens. */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

/**
 * True if `s` is a URL we should render as an <img> (vs. treating it as
 * an emoji / short label). Historical: the `products.icon` column has
 * held either "🎪" or a full https URL; this helper replaces the
 * `s.startsWith('http') || s.startsWith('/')` check scattered across
 * a few callers.
 */
export function isImageUrl(s: string | null | undefined): s is string {
  return !!s && (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/'));
}
