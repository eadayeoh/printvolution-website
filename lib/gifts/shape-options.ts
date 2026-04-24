// Shared definition of the per-product shape picker config. Lives
// outside `types.ts` so admin + server + pipeline can import
// validators without pulling the whole types barrel.

export type ShapeKind = 'cutout' | 'rectangle' | 'template';

export type ShapeOptionBase = {
  kind: ShapeKind;
  label: string;
  price_delta_cents?: number;
};

export type ShapeOptionCutout    = ShapeOptionBase & { kind: 'cutout' };
export type ShapeOptionRectangle = ShapeOptionBase & { kind: 'rectangle' };
export type ShapeOptionTemplate  = ShapeOptionBase & {
  kind: 'template';
  template_ids: string[];
};

export type ShapeOption =
  | ShapeOptionCutout
  | ShapeOptionRectangle
  | ShapeOptionTemplate;

/** Validate a raw jsonb value into ShapeOption[]. Returns null when
 *  the value is null / empty — callers treat that as "picker disabled".
 *  Throws on malformed data so admin saves surface the error. */
export function parseShapeOptions(raw: unknown): ShapeOption[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const seen = new Set<ShapeKind>();
  const out: ShapeOption[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') throw new Error('Shape row must be an object');
    const r = row as Record<string, unknown>;
    const kind = r.kind;
    if (kind !== 'cutout' && kind !== 'rectangle' && kind !== 'template') {
      throw new Error(`Unknown shape kind "${String(kind)}"`);
    }
    if (seen.has(kind)) throw new Error(`Duplicate shape kind "${kind}" — at most one row per kind`);
    seen.add(kind);
    const label = typeof r.label === 'string' && r.label.trim() ? r.label.trim() : null;
    if (!label) throw new Error(`Shape "${kind}" is missing a label`);
    const pd = typeof r.price_delta_cents === 'number' ? r.price_delta_cents : 0;
    if (kind === 'template') {
      const ids = Array.isArray(r.template_ids)
        ? (r.template_ids.filter((x) => typeof x === 'string') as string[])
        : [];
      if (ids.length === 0) throw new Error('Template shape needs at least one template_id');
      out.push({ kind, label, price_delta_cents: pd, template_ids: ids });
    } else {
      out.push({ kind, label, price_delta_cents: pd });
    }
  }
  return out;
}

export function shapeOptionsPriceDelta(
  options: ShapeOption[] | null | undefined,
  selectedKind: ShapeKind | null,
): number {
  if (!options || !selectedKind) return 0;
  const found = options.find((o) => o.kind === selectedKind);
  return found?.price_delta_cents ?? 0;
}
