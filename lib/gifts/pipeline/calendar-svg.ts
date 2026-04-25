// Calendar zone renderer. Produces an SVG string the live preview and
// the server composite both consume — single source of truth so what
// the customer sees in preview is exactly what gets printed.
//
// Math is in zone-local coordinates (0..zoneWidth × 0..zoneHeight),
// not in canvas units. The caller (preview component / composite
// engine) is responsible for placing the rasterised SVG at the zone's
// x/y/width/height on the bigger canvas.

import { giftFontStack } from '@/lib/gifts/types';
import type { GiftTemplateCalendarZone } from '@/lib/gifts/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LETTERS_SUNDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_LETTERS_MONDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type CalendarFill = {
  month: number;          // 1–12
  year: number;           // YYYY
  highlightedDay: number | null;
};

/** What the customer sees before they touch the picker. Falls back to
 *  the current month with no highlight when neither admin defaults nor
 *  customer fills are present. */
export function resolveCalendarFill(
  zone: Pick<GiftTemplateCalendarZone, 'default_month' | 'default_year' | 'default_highlighted_day'>,
  fill: Partial<CalendarFill> | undefined,
  now: Date = new Date(),
): CalendarFill {
  const month = fill?.month ?? zone.default_month ?? (now.getMonth() + 1);
  const year = fill?.year ?? zone.default_year ?? now.getFullYear();
  const highlightedDay = fill?.highlightedDay ?? zone.default_highlighted_day ?? null;
  return { month, year, highlightedDay };
}

/** Days in a month, taking leap years into account. */
export function daysInMonth(month: number, year: number): number {
  // new Date(year, month, 0) → last day of (month-1) in 1-indexed terms;
  // we pass month directly since JS month is 0-indexed and we want the
  // day-zero of the *next* month, which JS gives us as the last day of
  // *this* month. Same trick people use for "end of month".
  return new Date(year, month, 0).getDate();
}

/** Index of the first day of (month, year) in the chosen week. 0 = first
 *  column. So if Sunday-start and the 1st is a Wednesday, returns 3. */
function firstColumn(month: number, year: number, weekStart: 'sunday' | 'monday'): number {
  const dow = new Date(year, month - 1, 1).getDay(); // 0..6, 0=Sun
  if (weekStart === 'sunday') return dow;
  return (dow + 6) % 7; // shift Mon..Sun → 0..6
}

/** Escape text for safe inlining in SVG. The customer never types into
 *  these zones (month name + day numbers are all derived) but the
 *  weekday letters come from constants — defensive anyway. */
function svgEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Heart path centred at (cx, cy) with radius `r` (half its bounding
 *  box). Drawn with two cubic curves and a pointed bottom — same shape
 *  as the one in the music-magnet foreground. */
function heartPath(cx: number, cy: number, r: number): string {
  // Heart fits in a 2r × 2r box. Top dip at (cx, cy - r * 0.7), bottom
  // point at (cx, cy + r * 0.95). Left + right lobes mirror.
  const top = cy - r * 0.7;
  const bottom = cy + r * 0.95;
  const left = cx - r;
  const right = cx + r;
  return [
    `M ${cx} ${top}`,
    `C ${cx} ${cy - r * 1.05}, ${left} ${cy - r * 1.05}, ${left} ${cy - r * 0.25}`,
    `C ${left} ${cy + r * 0.4}, ${cx} ${cy + r * 0.7}, ${cx} ${bottom}`,
    `C ${cx} ${cy + r * 0.7}, ${right} ${cy + r * 0.4}, ${right} ${cy - r * 0.25}`,
    `C ${right} ${cy - r * 1.05}, ${cx} ${cy - r * 1.05}, ${cx} ${top}`,
    `Z`,
  ].join(' ');
}

export type RenderCalendarSvgInput = {
  zone: GiftTemplateCalendarZone;
  fill: Partial<CalendarFill> | undefined;
  /** Zone-local width × height in any unit (mm, px, canvas units —
   *  caller's choice). The SVG is authored at this exact viewBox. */
  width: number;
  height: number;
  /** "now" for resolving defaults. Inject for deterministic tests. */
  now?: Date;
  /** Customer-picked colour override. Overrides grid_color +
   *  header_color when set; the highlight shape colour stays
   *  admin-controlled so it reads as an accent. */
  colorOverride?: string;
};

/** Returns an `<svg>` string sized to (width × height) with the
 *  calendar drawn inside. Pure — no DOM, no fetch, no side effects. */
// Defence-in-depth: every colour value lands in an SVG `fill="..."`
// attribute. If a non-hex string slipped past upstream validation it
// could break out of the attribute. Anything not matching `#RRGGBB`
// falls back to a neutral default.
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
function safeColor(value: string | null | undefined, fallback: string): string {
  return value && COLOR_RE.test(value) ? value : fallback;
}

export function renderCalendarSvg(input: RenderCalendarSvgInput): string {
  const { zone, fill, width: W, height: H, now, colorOverride } = input;
  const resolved = resolveCalendarFill(zone, fill, now);
  const headerLayout = zone.header_layout ?? 'above';
  const weekStart = zone.week_start ?? 'sunday';
  const weekdayLetters = weekStart === 'monday' ? WEEKDAY_LETTERS_MONDAY : WEEKDAY_LETTERS_SUNDAY;
  const gridFontFamily = giftFontStack(zone.grid_font_family);
  const headerFontFamily = giftFontStack(zone.header_font_family);
  const gridColor = safeColor(colorOverride ?? zone.grid_color, '#0a0a0a');
  const headerColor = safeColor(colorOverride ?? zone.header_color, gridColor);
  const highlightShape = zone.highlight_shape ?? 'circle';
  const highlightFill = safeColor(zone.highlight_fill, '#E91E8C');
  const highlightTextColor = safeColor(zone.highlight_text_color, '#ffffff');

  // Lay out header + grid box. Coordinates here are in the zone-local
  // space; SVG viewBox is `0 0 W H`.
  const headerH = headerLayout === 'above' ? Math.min(H * 0.18, 14) : 0;
  const headerW = headerLayout === 'left'  ? Math.min(W * 0.34, 50) : 0;
  const gridX = headerW;
  const gridY = headerH;
  const gridW = W - headerW;
  const gridH = H - headerH;

  const cols = 7;
  const rows = 7; // 1 weekday row + 6 day rows
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  // Day cell fonts. font_size_mm is interpreted as units in this
  // viewBox — the caller picks whatever unit it wants (live preview =
  // canvas units, server composite = mm). Default to a fraction of
  // cell height so the calendar always fits.
  const gridFontSize = zone.grid_font_size_mm ?? Math.min(cellH * 0.5, cellW * 0.5);
  const headerFontSize = zone.header_font_size_mm ?? Math.min(headerH * 0.7, 8);

  // Build cells.
  const month = Math.min(12, Math.max(1, resolved.month));
  const year = Math.min(2100, Math.max(1900, resolved.year));
  const dayCount = daysInMonth(month, year);
  const startCol = firstColumn(month, year, weekStart);

  type Cell = { col: number; row: number; day: number | null };
  const cells: Cell[] = [];
  // Weekday row at row=0.
  for (let c = 0; c < cols; c++) cells.push({ col: c, row: 0, day: -(c + 1) }); // sentinel
  // Day rows. Days flow column-by-column starting at (startCol, 1).
  let dayIndex = 1;
  let r = 1;
  let c0 = startCol;
  while (dayIndex <= dayCount) {
    cells.push({ col: c0, row: r, day: dayIndex });
    dayIndex++;
    c0++;
    if (c0 >= cols) { c0 = 0; r++; }
  }

  const svgChildren: string[] = [];

  // Header.
  if (headerLayout !== 'hidden') {
    const headerText = svgEscape(`${MONTH_NAMES[month - 1]} ${year}`);
    if (headerLayout === 'above') {
      svgChildren.push(`
        <text x="${gridX}" y="${headerH * 0.75}" fill="${headerColor}"
          font-family="${headerFontFamily}" font-size="${headerFontSize}"
          font-weight="${zone.header_font_weight ?? '700'}"
          dominant-baseline="alphabetic" text-anchor="start">${headerText}</text>`);
    } else {
      // 'left'
      svgChildren.push(`
        <text x="${headerW / 2}" y="${H / 2}" fill="${headerColor}"
          font-family="${headerFontFamily}" font-size="${headerFontSize}"
          font-weight="${zone.header_font_weight ?? '700'}"
          dominant-baseline="middle" text-anchor="middle">${headerText}</text>`);
    }
  }

  // Cells. Highlight goes BEHIND the day number so the number stays
  // legible.
  for (const cell of cells) {
    const cx = gridX + cell.col * cellW + cellW / 2;
    const cy = gridY + cell.row * cellH + cellH / 2;

    if (cell.day !== null && cell.day < 0) {
      // Weekday header row.
      const idx = -cell.day - 1;
      svgChildren.push(`
        <text x="${cx}" y="${cy}" fill="${gridColor}" fill-opacity="0.55"
          font-family="${gridFontFamily}" font-size="${gridFontSize * 0.75}"
          font-weight="700" dominant-baseline="middle" text-anchor="middle"
          letter-spacing="0.04em">${weekdayLetters[idx]}</text>`);
      continue;
    }

    if (cell.day === null) continue;

    const isHighlighted = resolved.highlightedDay === cell.day;
    if (isHighlighted) {
      const r = Math.min(cellW, cellH) * 0.42;
      if (highlightShape === 'circle') {
        svgChildren.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${highlightFill}" />`);
      } else if (highlightShape === 'square') {
        const side = r * 1.8;
        svgChildren.push(`<rect x="${cx - side / 2}" y="${cy - side / 2}" width="${side}" height="${side}" fill="${highlightFill}" rx="${r * 0.18}" />`);
      } else {
        svgChildren.push(`<path d="${heartPath(cx, cy, r * 1.1)}" fill="${highlightFill}" />`);
      }
    }

    svgChildren.push(`
      <text x="${cx}" y="${cy}" fill="${isHighlighted ? highlightTextColor : gridColor}"
        font-family="${gridFontFamily}" font-size="${gridFontSize}"
        font-weight="${isHighlighted ? '700' : '500'}"
        dominant-baseline="middle" text-anchor="middle">${cell.day}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${svgChildren.join('\n')}
  </svg>`;
}
