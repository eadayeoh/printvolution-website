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
  // Sentinel %25 first so a literal "%3A" in source (encoded as "%253A")
  // doesn't collapse to ":" before its leading "%" is restored.
  return s
    .replace(/%25/g, '\x00')
    .replace(/%3A/g, ':')
    .replace(/%3B/g, ';')
    .replace(/\x00/g, '%');
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

/** Parse a #RRGGBB string to an {r, g, b} 0..255 triplet. Returns null
 *  for anything that fails validation, so callers can branch once
 *  instead of validating + parseInt-slicing inline. */
export function parseHexColor(s: string | null | undefined): { r: number; g: number; b: number } | null {
  const valid = validateHexColor(s);
  if (!valid) return null;
  return {
    r: parseInt(valid.slice(1, 3), 16),
    g: parseInt(valid.slice(3, 5), 16),
    b: parseInt(valid.slice(5, 7), 16),
  };
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
