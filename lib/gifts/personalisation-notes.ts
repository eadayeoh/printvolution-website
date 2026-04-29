/**
 * Shared parser for the cart-line `personalisation_notes` "k:v;k:v" string.
 *
 * Used by the admin SVG download routes and by the production pipeline so
 * a single change to the format updates every consumer.
 *
 * Free-text values are percent-encoded for `;` and `:` so customer copy like
 * "I love you; always" survives the round-trip without truncation.
 */

import { GIFT_FONT_FAMILIES } from './types';

export function encodeNoteValue(s: string): string {
  return s.replace(/%/g, '%25').replace(/;/g, '%3B').replace(/:/g, '%3A');
}

function decodeNoteValue(s: string): string {
  return s.replace(/%3A/g, ':').replace(/%3B/g, ';').replace(/%25/g, '%');
}

export function parsePersonalisationNotes(
  notes: string | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!notes) return out;
  for (const part of notes.split(';')) {
    const idx = part.indexOf(':');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1);
    if (k) out[k] = decodeNoteValue(v);
  }
  return out;
}

/** Validate a customer-supplied colour. Strict #RRGGBB only — anything
 *  else (named colours, rgb(...), an attribute-injection payload like
 *  `red" onload="..."`) returns null so the caller can fall back to the
 *  template / renderer default. */
export function validateHexColor(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(t) ? t : null;
}

/** Validate a customer-supplied font reference against a whitelist.
 *  Two whitelists in play:
 *    - GIFT_FONT_FAMILIES.value (template-zone fonts, short keys like 'inter')
 *    - admin-configured product.allowed_fonts (renderer products, full names)
 *  Pass the relevant whitelist as the second arg. Anything outside it
 *  returns null so the SVG builder uses its built-in default. */
export function validateFontKey(
  s: string | null | undefined,
  whitelist?: ReadonlyArray<string>,
): string | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;
  const allow = whitelist ?? GIFT_FONT_FAMILIES.map((f) => f.value);
  return allow.includes(t) ? t : null;
}
