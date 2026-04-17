/**
 * Default SEO body paragraph rendered at the bottom of a product page.
 * Used both at render time (as a fallback when product_extras.seo_body
 * is blank) and inside the admin editor (pre-filled into the textarea
 * so the admin can tweak the live text rather than staring at an empty
 * field).
 */
export function defaultProductSeoBody(name: string, fromPriceCents: number | null): string {
  const lc = name.toLowerCase();
  const pricePart = fromPriceCents !== null && fromPriceCents > 0
    ? ` Prices start from $${(fromPriceCents / 100).toFixed(2)} with volume discounts available.`
    : '';
  return (
    `Looking for ${lc} in Singapore? Printvolution offers fast, high-quality ${lc} printing ` +
    `with island-wide delivery or free pickup at Paya Lebar Square.${pricePart} ` +
    `All orders go through pre-press file checks and digital mockup review before we print, ` +
    `so what you approve is what you get. Need it fast? Express turnaround is available — ` +
    `message us on WhatsApp for rush jobs and custom specs.`
  );
}

/** Min price across all pricing rows, or null if nothing priced. */
export function minPriceFromRows(rows: Array<{ prices: number[] }> | null | undefined): number | null {
  if (!rows) return null;
  let min: number | null = null;
  for (const r of rows) {
    for (const p of r.prices ?? []) {
      if (typeof p === 'number' && p > 0 && (min === null || p < min)) min = p;
    }
  }
  return min;
}
