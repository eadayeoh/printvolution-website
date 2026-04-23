# Surfaces pipeline fan-out — TODO spec

Written 2026-04-24. Cart + admin + customer UX for multi-surface variants
shipped in commit 6415bb0 + the follow-up per-surface-mode commit.

**What works today:**

- Admin can define N surfaces per variant, each with its own
  `accepts` (text / photo / both), `mockup_url`, `mockup_area`,
  `max_chars`, and optional `mode` override (`laser` / `uv` / etc).
- Customer sees one input per surface, a tabbed live mockup preview,
  and Add to Cart enables once every surface is filled.
- Cart line config lists each surface: `Front (Laser Engraving): ELAINE`,
  `Back (UV Printing): 2024-01-15`. Admin order view reads this
  verbatim.
- `personalisation_notes` on the cart line carries `text_<surface_id>`
  and `mode_<surface_id>` key-value pairs the pipeline can parse.

**What's not yet wired:**

The production pipeline (`lib/gifts/pipeline.ts::runProductionPipeline`)
still assumes ONE source + ONE mode per order. For surfaces-driven
orders with multiple modes on the same line item, it currently runs
only the parent product's mode against the first source asset.

## Fan-out path

When the order fulfilment job reads a line item with surface data:

1. Parse `personalisation_notes` → map of `{ [surface_id]: { text?, mode? } }`.
2. For photos uploaded per surface, the current cart flow doesn't push
   them to storage (surfaces-driven add-to-cart skips server preview
   generation). Two options:
   - **Simpler:** on Add to Cart, for any photo-accepting surface that
     has a `photoFile`, call a new lightweight upload action that just
     stores the source asset and records `source_<surface_id>:<asset_id>`
     in notes. No AI transform on Add to Cart.
   - **Lazier:** admin uploads the surface photos to the order
     manually during fulfilment. Cheaper to ship; more manual work later.
3. For each surface, call `runProductionPipeline` with:
   - `mode` = surface.mode ?? product.mode
   - `sourceBytes` = the surface's photo bytes (or a rendered text
     image if the surface is text-only)
   - `targetWidthMm` / `heightMm` = derived from surface.mockup_area
     × variant's physical dimensions
4. Each surface produces its own production file. Name them
   `<order>-<line>-<surface_id>.pdf` so production can map 1:1.

## Text-surface rendering

For text surfaces (no photo), render the text to an image first using
resvg (already a dep for template composites), then feed into the
mode-specific pipeline. e.g.:

- `laser` text: render as black-on-white at 600 DPI, use as the
  vector source. Laser cutter reads the outline.
- `uv` text: render with the surface's chosen font + colour at 300
  DPI, hand to the UV printer.
- `embroidery` text: render as solid-fill outline, posterise to
  embroidery palette.

## Estimate

~4 hours: 1h photo-per-surface upload wiring, 1h pipeline fan-out
orchestrator, 1h text-to-image rendering, 1h admin order-view
surface attachments display.

Not critical until real orders start coming through.
