# Authoring a new gift template (no code)

This is the playbook for adding a new template to the gift engine
without writing or running any scripts. Use it whenever you have a
new design like the music magnet, the calendar magnet, or the
collage magnet.

The engine accepts any layered design as long as you decide which
parts of it are **static** (baked into a PNG admin uploads) and which
parts are **editable** (zones the customer fills in).

---

## 1. Decide what's static vs editable

Before you touch anything, look at the design and split it into two
piles:

| Pile | What goes here | Example (collage magnet) |
|---|---|---|
| **Static** — baked into the foreground PNG | Decorative graphics, frame outlines, icons, baseline text the customer never edits, fixed time stamps, logos | White photo-frame outline, red heart icon, time stamps, player UI icons, progress bar |
| **Editable** — zones the customer fills | Photos, names, dates, song titles, custom messages, calendars | The 4 photo tiles, the names header, the date, the song title, the artist |

Anything in the static pile gets drawn once in your design tool.
Anything in the editable pile becomes a *zone* on the template canvas.

---

## 2. Design the assets in Figma / Canva

You'll usually need 1–3 PNG files:

### Foreground PNG (always)
- Authored at **1000 × 1000 px** for a square magnet (or whatever
  matches the product's print aspect — A3 portrait → 1000 × 1414, etc.)
- **Transparent background** everywhere except the static graphics.
- Leave **transparent rectangles where the editable zones will go**
  so the customer's content shows through underneath.
- Export as PNG-24 with alpha.

### Background PNG (optional)
- Solid colour or any decorative back layer that sits BENEATH the
  customer's photos.
- Same dimensions as the foreground.
- Skip this if you want the customer's *Background color* picker to
  drive the colour entirely.

### Mask PNG (optional, for non-rectangular photo shapes)
- White shape on transparent (heart, circle, star, etc.).
- Used for image zones that should clip to a non-rectangular shape.
- Same dimensions as the photo zone it'll attach to.

---

## 3. Upload the assets

1. Open any admin page with an `ImageUpload` field — easiest is
   `/admin/gifts/templates/new`.
2. Click **Library** on the field, upload each PNG. They're now in
   the `product-images` bucket and reusable from any picker.

---

## 4. Create the template

`/admin/gifts/templates/new`

1. **Name** — short, customer-readable ("Spotify Music Magnet",
   "Calendar Anniversary Magnet").
2. **Reference dimensions** — print width × height in mm. This sets
   the canvas aspect ratio everywhere (admin preview + customer live
   preview + production composite).
3. **Background** — pick from Library if you uploaded one. Leave
   blank if you want the customer's Background color picker to drive it.
4. **Foreground** — pick from Library. This is your decorative PNG.
5. **Allow customer to recolor / change font** — tick if you want
   the customer to override per-zone colour or font. Leave off for
   templates with locked typography (e.g. a wedding invite).
6. **Save** before adding zones (some browsers throw away unsaved
   zones if you reload).

---

## 5. Add zones

The right side of the editor is the layout canvas. Click **Add image
zone** / **Add text zone** / **Add calendar zone** to drop a new
rectangle, then drag and resize it over the transparent window in
your foreground PNG.

### Image zone
- Drag the rect over the window where the customer's photo will go.
- **Fit** = `cover` for full-bleed photos, `contain` for shaped masks.
- **Border radius (mm)** for rounded photo corners.
- **Mask URL** for non-rectangular shapes (heart, circle, etc.) —
  pick the white-on-transparent PNG you uploaded.
- **Default image** is the placeholder shown in the editor.
- Tick **Locked** for hero/full-bleed photos so admin drags don't
  accidentally bump them.

### Text zone
- Drag the rect over the window where the customer's text goes.
- **Default text** = what the customer sees before they edit
  ("Beautiful", "Romeo & Juliet").
- **Font family** — pick from Inter / Fraunces / Caveat / etc.
- **Font size (mm)** — printed size in real-world mm.
- **Color** — admin's default; the customer can override if
  *Allow customer to recolor* is on.
- **Editable** — uncheck for fixed text (e.g. baked-in "0:01" time
  stamps if you couldn't bake them into the foreground PNG for
  some reason).

### Calendar zone
- Drag the rect over where the calendar grid should render.
- **Header layout** — `above` / `left` / `hidden`.
- **Highlight shape** — `circle` / `square` / `heart`.
- **Highlight fill / text color** — accent for the customer-picked
  day.
- **Default month / year / highlighted day** — pre-fills before the
  customer edits.

### Z-order
Zones render in array order (first = back, last = front). Use the up
/ down arrows on each zone card to reorder.

---

## 6. Assign to a product

`/admin/gifts/<product-id>` → Templates section. Pick the new template
from the list. Set `template_mode`:

- `none` — template never offered (customer goes through the regular
  upload flow).
- `optional` — template picker shows; customer can skip and use the
  regular flow.
- `required` — customer MUST pick a template; no regular flow.

For magnet-style products that ALWAYS use a template, pick
`required`. For broader products that have one template option, pick
`optional`.

---

## 7. Test as a customer

Open `/gift/<product-slug>` in an incognito window:
- Pick the new template.
- Upload photo(s).
- Type text into each editable zone.
- Toggle the calendar / colour / font pickers if enabled.
- Confirm the live preview matches your design intent.
- Add to cart. The print-ready file is generated server-side at this
  step.

---

## When this playbook isn't enough

You'll need a one-shot script (and a developer) for:

- Templates where the foreground graphics are **algorithmically
  generated** (e.g. a calendar that needs to also have the player UI
  baked in at exact pixel-perfect positions). The existing
  `scripts/build-*-magnet-template.mjs` scripts are examples.
- Templates that need a **new zone type** that doesn't exist yet
  (image / text / calendar are the current set).
- Bulk-seeding a family of templates with a shared layout but
  different copy / colours.

Everything else — uploading a Canva-designed foreground, dragging
zones over it, ticking the customer-can-recolour flag — is fully
admin-driven, no code involved.
