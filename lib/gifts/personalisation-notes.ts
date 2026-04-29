/**
 * Shared parser for the cart-line `personalisation_notes` "k:v;k:v" string.
 *
 * Used by the admin SVG download routes and by the production pipeline so
 * a single change to the format updates every consumer.
 *
 * Free-text values are percent-encoded for `;` and `:` so customer copy like
 * "I love you; always" survives the round-trip without truncation.
 */

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
