# Gift template editor redesign — Studio layout

**Status:** design — awaiting user review
**Date:** 2026-04-30
**File touched:** `components/admin/gift-template-editor.tsx` (only)

## Why

The admin gift template editor at `/admin/gifts/templates/[id]` packs canvas
authoring, asset management, customer-facing controls, catalog metadata, and
production overrides into a 3-column page with no clear hierarchy. The user
reports their eye is "all over the place" — they spend ~80% of their time
editing zones (image / text / shape / calendar regions on the canvas) but
have to scan past every other field to do it.

The data model is fine. The problem is the surfacing: every section is
visible at once, no field is more prominent than any other, and the
secondary stuff drowns the primary work.

## Goal

Make zone-editing the obvious primary workflow, push everything else one
click away, and fix three small bugs uncovered while reading the file.

## Non-goals

- No schema, server-action, or pricing-flow changes.
- No changes to the variants panel (sides), gift PDP, or any other admin
  page. Side-level price add-ons stay configured in the variants panel
  exactly as they are today.
- No new dependency. Plain React + the file's existing Tailwind classes.

## Layout

Three regions, fixed roles. The 3-column grid stays at `xl:grid-cols-[280px_1fr_280px]` for desktop; collapses below `xl`.

### Top bar (always visible, sticky)

| Element                | Behaviour                                                |
| ---------------------- | -------------------------------------------------------- |
| `← Back to templates`  | Existing link, unchanged.                                |
| **Template name**      | Inline-editable input, replaces the buried Name field.   |
| **Active** toggle      | Tiny pill — green dot when `is_active`, grey otherwise.  |
| **Group** selector     | Existing dropdown, lifted out of the left rail. Group rename / delete actions stay in the Catalog & display section (rare ops, not worth crowding the top bar). |
| Error / saved flash    | Existing `err` / `flash` state, position unchanged.      |
| **Save** button        | Existing pink button, unchanged behaviour, Cmd+S works.  |

### Left rail — single-open accordion

One section open at a time. Clicking a closed section closes whichever was
open. Section state is persisted to `localStorage` per template ID
(`pv-template-editor-section:<id>`) so reopening the same template returns
the user to where they were.

| # | Section            | Default      | Holds                                                                                                     |
| - | ------------------ | ------------ | --------------------------------------------------------------------------------------------------------- |
| 1 | Assets             | collapsed    | Background image · Foreground image · Description                                                         |
| 2 | Canvas & Layout ★  | **open**     | Reference width / height (mm) · Allowed shape kinds · "+ Add image / text / shape / calendar" CTAs        |
| 3 | Customer controls  | collapsed    | Recolor permissions (bg / text / calendar) · Font change toggle · Customer picker role + Swatches array   |
| 4 | Catalog & display  | collapsed    | Group rename / delete actions · Display order · Occasion window · Price delta                             |
| 5 | Production         | collapsed    | Mode override · Production file types (PNG / JPG / SVG / PDF checkboxes)                                  |

### Centre — canvas + active-zone properties (always visible, primary)

The live preview, mockup background, foreground overlay, and the per-zone
draggable / resizable rectangles, with the "Editing: …" properties panel
above the canvas (where it lives today). The properties panel keeps the
full per-zone form (image / text / shape / calendar fields, alignment grid,
W/H/rotation controls) — it's wide and information-dense, so cramming it
into the right rail would make every field cramped. The visual fix is to
*quiet* the panel rather than relocate it (see Right rail below).

### Right rail — layers (always visible)

The existing zone list, drag-reorderable, click-to-select. Z-order, type
pill (IMG / TXT / SHP / CAL / ANCHOR), label, visibility toggle. Trash
icon on row hover (already exists).

The right rail stays at 280px. The per-zone properties form is wide and
information-dense (image fields, text fields, alignment grid, W/H/rotation
controls) so it stays in the centre column above the canvas — but visually
de-emphasized so it stops competing with the canvas for attention:

- Border drops from `border-2 border-pink` to `border border-neutral-200`.
- The "Editing: …" header keeps its pink-on-ink label so the user can
  still see at a glance which zone they're on.
- When no zone is selected, the panel collapses to a 40px-tall hint strip
  ("*Click a layer or drag a slot on the canvas to edit.*") instead of
  vanishing completely. Keeps the canvas position stable.
- Move / duplicate / delete row stays in the panel header.

## Behaviour

### Accordion

```ts
const [openSection, setOpenSection] = useState<SectionId>(() => {
  if (typeof window === 'undefined') return 'canvas-layout';
  return (window.localStorage.getItem(`pv-template-editor-section:${templateId}`) as SectionId) ?? 'canvas-layout';
});

useEffect(() => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`pv-template-editor-section:${templateId}`, openSection);
}, [openSection, templateId]);
```

`<AccordionSection>` is a small new sub-component in the same file:

```tsx
function AccordionSection({
  id, title, openId, onOpen, children,
}: {
  id: SectionId;
  title: string;
  openId: SectionId;
  onOpen: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  const open = openId === id;
  return (
    <div className={cn('rounded-lg border', open ? 'border-pink' : 'border-neutral-200', 'bg-white')}>
      <button
        type="button"
        onClick={() => onOpen(open ? 'none' : id)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-bold text-ink">{title}</span>
        <span className="text-neutral-400">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-0 space-y-3">{children}</div>}
    </div>
  );
}
```

A "none" sentinel is allowed so the user can collapse all sections.

### Responsive collapse

- **`xl`+ (≥1280px):** 3-column grid as described.
- **`md`–`xl` (768–1279px):** top bar stays. Left rail becomes a single
  dropdown above the canvas (`<select>` of the five sections, opens the
  current section underneath). Right rail moves below the canvas.
- **Below `md`:** everything stacked. Same dropdown for left rail; layers
  and active-zone properties stack below the canvas.

### Bug fixes bundled in

| # | Bug                                                                 | Fix                                                                                                                                                                                                                                          |
| - | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Holding an arrow key spams `commitZones` and pushes one history snapshot per keystroke. Undoing a 10-frame nudge takes 10 undo presses. | Track an `arrowStreakRef`. On the first keystroke of a streak, push a snapshot via `commitZones`. Subsequent keystrokes within 500ms call `setZones` directly (no history push). Streak resets when the zone changes or 500ms idle.            |
| 2 | `window.prompt` / `window.confirm` used for group rename, group delete, zone delete. Blocking + bad on mobile.                          | Replace with inline UI: rename → an inline `<input>` that appears next to the group selector with Save / Cancel; delete → a two-step inline row (`Delete group` button → red "Confirm delete" button + Cancel) above the group dropdown.        |
| 3 | `setTimeout(() => setFlash(false), 1600)` after save has no cleanup. If the component unmounts inside the 1.6s window, React 18 swallows the setState but the timer still runs.                                                          | Stash the timer in `useRef<NodeJS.Timeout \| null>(null)` and clear on next setFlash + on unmount via `useEffect` cleanup. Defensive, ~5 lines.                                                                                                  |

## Data flow

Unchanged. Same `payload` object posted to the same `updateTemplate` /
`createTemplate` server actions. Same fields, same shape. The only state
that's new is the accordion's `openSection` (UI-only, never sent to the
server).

## Error handling

The existing `err` / `flash` state stays as-is. The accordion makes no
remote calls. `localStorage` access is wrapped in a typeof-window check so
SSR is safe. If `localStorage` is full or blocked (private mode), the
fallback is the default open section — no error surfaced.

## Testing

Manual, no automated tests in this part of the codebase today.

1. Open an existing template → "Canvas & Layout" is open by default,
   canvas + layers visible, all other sections collapsed.
2. Click another section → previous section collapses, new one expands.
3. Reload the page → same section is still open.
4. Save the template → flash appears, no console error.
5. Add a zone via the "+ Add image" CTA in the open Canvas & Layout
   section → zone appears in layers (right rail) and on canvas; the
   properties panel above the canvas shows the new zone's fields with
   "Editing: <label>" header.
6. Hold ↓ for 10 frames → undo 1× returns to original (vs 10× today).
7. Try to rename group on mobile → inline input appears, no native prompt
   blocks the page.
8. Resize browser to 1024px → left rail becomes a dropdown above the
   canvas; everything still functional.
9. Resize to 375px → stacked layout; can still complete a save.

## Out-of-scope follow-ups (notes for later)

- The component has 38 `useState` calls. A future refactor could
  consolidate related state into a `useReducer` or a small zustand slice;
  out of scope here.
- Several `as any` casts on render-anchor zones (lines 132–166 region).
  Tightening those types is its own task.
- `customer_can_recolor` is a legacy field that lives alongside three
  newer per-element flags (`customer_can_recolor_background`,
  `_text`, `_calendar`). Worth a future cleanup but not now.
