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
