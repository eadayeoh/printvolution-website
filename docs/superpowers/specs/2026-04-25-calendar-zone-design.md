# Calendar zone — design

A new `calendar` zone type that any gift template can include, alongside
the existing `image` and `text` zones. The customer picks a month + year
+ a single "highlighted" day (e.g. an anniversary); the live preview
draws the calendar grid; the production composite draws the same grid
into the printed PNG.

Reusable across products — lives in the template engine, not in any
fridge-magnet-specific code. First user is the Bluetooth Music Magnet
"calendar" template, but the LED frame, photo plaque, etc. can all
embed a calendar zone if a template author wants one.

## Out of scope

- Multiple highlighted days. v1 = exactly one. (Easy to relax later.)
- Date ranges, multi-month spreads, year-view. v1 = single month.
- Per-day icons (hearts, stars on different days). v1 = one shape on
  the highlighted day; everything else plain.
- Customer-defined holidays / annotations. v1 = pure month grid.

## Zone schema

```ts
export type GiftTemplateCalendarZone = GiftTemplateZoneBase & {
  type: 'calendar';

  // Header — shows "October 2024" above / left of / hidden from the
  // grid. Auto-generated from the customer's month+year input; admin
  // doesn't need a separate text zone for it.
  header_layout?: 'above' | 'left' | 'hidden';
  header_font_family?: string;       // GIFT_FONT_FAMILIES key
  header_font_size_mm?: number;
  header_font_weight?: GiftTextWeight;
  header_color?: string;

  // Day grid — weekday row + 6×7 day cells.
  grid_font_family?: string;
  grid_font_size_mm?: number;        // sized to fit a typical 7×6 grid
  grid_color?: string;               // weekday row + plain day cells
  week_start?: 'sunday' | 'monday';

  // Highlighted day treatment.
  highlight_shape?: 'circle' | 'square' | 'heart';
  highlight_fill?: string;           // background of the shape
  highlight_text_color?: string;     // day number on top of the shape

  // Defaults the customer sees before they touch the picker. If null,
  // fall back to "current month / no highlight".
  default_month?: number | null;     // 1–12
  default_year?: number | null;      // YYYY
  default_highlighted_day?: number | null; // 1–31
};

export type GiftTemplateZone =
  | GiftTemplateImageZone
  | GiftTemplateTextZone
  | GiftTemplateCalendarZone;
```

Zod schema in `app/admin/gifts/actions.ts` mirrors this with sensible
ranges (month 1–12, year 1970–2100, day 1–31).

## Customer input

A new piece of state in the product page, parallel to `templateTexts`
and `templateThumbs`:

```ts
type CalendarFill = { month: number; year: number; highlightedDay: number | null };
const [templateCalendars, setTemplateCalendars] =
  useState<Record<string, CalendarFill>>({});
```

Customer-side picker is a tiny inline component:

- Month dropdown (1–12, named).
- Year dropdown (current year ± 5 by default; admin can extend).
- Day grid — clickable mini-calendar that disables out-of-range days
  for the chosen month/year. Tapping a day sets `highlightedDay`;
  tapping again clears.

Rendered inline under the existing per-zone input list (where text
zones already have their textareas and image zones have their upload
buttons).

## Live preview rendering (client-side SVG)

Inside `gift-template-layout-preview.tsx`, switch on zone type:

```ts
if (z.type === 'calendar') return <CalendarZone zone={z} fill={calendars[z.id]} ... />;
```

`CalendarZone` is a plain SVG-in-React component. Logic:

1. Resolve month/year from fill ?? defaults ?? "current".
2. Build day-grid: 7 columns × 6 rows; first cell = first day-of-week
   for that month (per `week_start`); skip leading blanks; fill 1..N;
   trail blanks.
3. Render header (unless `header_layout === 'hidden'`):
   - `above` — header takes top ~20% of zone height.
   - `left` — header takes left ~30% of zone width, grid right.
4. Render grid: weekday letters on top row, day cells below.
5. For the highlighted day, draw the shape (circle / square / heart
   path) behind the day number using `highlight_fill`.

All sizes are in zone-relative percentages so the same component scales
to any zone box without re-doing math.

## Production composite (server-side SVG)

`lib/gifts/pipeline/composite.ts` already paints text zones via sharp
SVG composite (`renderSvgWithFonts`). Add the same code path for
calendar zones — same SVG generator the live preview uses (extracted
into `lib/gifts/pipeline/calendar-svg.ts` so client + server share
one truth), rasterised through sharp at the target DPI, then
composited at the zone's pixel offset.

Single source of truth means: what the customer sees in preview is
what gets printed.

## Cart payload + order persistence

Calendar fills travel in the cart line's existing template payload. The
`gift_order_items` table stores the rendered production PDF/PNG and
the customer-input snapshot — extend that snapshot with a
`calendars` field next to the existing `texts` and `images`. No new
DB columns; the snapshot is already JSON.

## Admin editor

`gift-template-editor.tsx` (or wherever zones are authored) gets a new
"Calendar" zone option in the "Add zone" picker. Editor controls:

- Position + size (existing draggable rect).
- Header layout dropdown (above / left / hidden).
- Font family, weight, size, color — three groups (header / grid /
  highlight) collapsible to keep the form compact.
- Highlight shape (3 buttons: circle / square / heart).
- Highlight fill + text color (color pickers).
- Defaults (month / year / day) — three small inputs.

Calendar zones cannot be `mode: 'photo'` etc — production-method
override doesn't apply (calendars are vector text, mode-agnostic).
Validate at zone-add time.

## Implementation order

1. **Schema + types** — extend `GiftTemplateZone` union, Zod, and the
   one place the union is `as const`.
2. **Calendar SVG generator** — pure function, lives in
   `lib/gifts/pipeline/calendar-svg.ts`. Returns an SVG string given
   `(zoneConfig, fill, zoneWidthPct, zoneHeightPct)`. Unit test
   first — it's pure.
3. **Live preview integration** — wire the generator into
   `gift-template-layout-preview.tsx` via a small `<CalendarZone>`
   wrapper.
4. **Customer picker UI** — `<CalendarZoneInput>`, slotted into the
   per-zone input list.
5. **Server composite** — invoke the same generator, sharp-rasterize,
   composite into the production PNG.
6. **Admin editor controls** — last, because authoring before the
   render path is wired produces unrenderable templates.
7. **Seed script for the music-magnet calendar template** — same
   pattern as `build-spotify-magnet-template.mjs`, creates a template
   that reuses the calendar zone alongside the heart-photo + names.

Each step lands as its own commit. Step 7 is the only one tied to a
specific product; everything before it is engine-level.

## Risks / open questions

- **Heart-shape photo mask on the music-magnet template.** That pixel-
  art heart cluster of 8 photo tiles (in your reference image) is a
  separate problem from the calendar zone. Easiest path: a single
  image zone with a heart `mask_url` PNG (the existing image-zone
  schema already supports `mask_url`). Out of this spec.

- **Font fidelity.** Composite already warns that fonts aren't
  bundled. The calendar SVG inherits whatever librsvg picks. Same
  caveat as text zones — not worse, not better.

- **Multi-line "October 2024"** when the month name is long
  (September). Header sizing should clamp to the zone box; truncation
  > overflow.
