/**
 * Stamp explicit physical-size attributes onto an SVG's root element so
 * downstream software (foil RIPs, Illustrator, the customer's home
 * printer) opens the file at the correct mm size without being told out
 * of band. Only stamps when both dims are positive finite numbers;
 * otherwise leaves the SVG untouched.
 *
 * Used by the production pipeline (renderer-driven outputs) AND by the
 * admin SVG download routes so the foil-shop file matches what the
 * pipeline produced byte-for-byte.
 */
export function stampSvgSize(svg: string, widthMm: number, heightMm: number): string {
  if (!Number.isFinite(widthMm) || widthMm <= 0 || !Number.isFinite(heightMm) || heightMm <= 0) {
    return svg;
  }
  return svg.replace('<svg ', `<svg width="${widthMm}mm" height="${heightMm}mm" `);
}
