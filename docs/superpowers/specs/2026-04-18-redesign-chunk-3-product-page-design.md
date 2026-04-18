# Redesign · Chunk 3 — Product page shell

**Date:** 2026-04-18
**Depends on:** Chunks 1 + 2 shipped (tokens, chrome, home patterns).
**Scope:** Restyle `/product/[category]/[...slug]` to v6 brutalist look. Preserve all existing configurator + pricing + cart logic. Skip Paper Chooser, Reviews, Gallery, SEO magazine articles — those are per-product content features, deferred.

## Why

`components/product/product-page.tsx` is 1045 lines of working client-side logic (configurator state, pricing evaluation, cart integration, sticky bar). Rewriting it would be high-risk. Instead: re-skin it. Keep the data flow and interaction behavior; swap the visual presentation.

## Ground truth

- `/Users/eadayeoh/Downloads/pv-product-v6.html` — visual reference. Ignore the Paper Chooser, Reviews, Gallery, and SEO magazine sections for this chunk.

## Section inventory (in-scope)

| # | Section | Behavior | Styling change |
|---|---------|----------|----------------|
| 1 | Breadcrumb | Keep existing logic | New mono style, subtle rule border. |
| 2 | PIP hero (title + meta + lede) | From `product.name`, computed badges, `product.tagline` | Big brutalist h1 with mono meta row. Replace current design. |
| 3 | Configurator (steps) | Existing `cfgState` + `visibleSteps` logic | Each step becomes a brutalist `.pv-card` (white + ink border + offset shadow). Pills restyled. Paper swatches restyled. Quantity table restyled. |
| 4 | Upload zone + file tips | Existing `designFilesUrl` logic | Magenta-dashed border upload area; ink-background tips box. |
| 5 | Price box (totals + Add to Cart) | Existing `computeTotal` + cart logic | Ink background, yellow total, magenta offset shadow, brutalist buttons. Breakdown rows preserved. |
| 6 | How we print (4 cards) | Static universal content | New section sourced from `site_settings.product_features` (already exists, default = 4 items). Rendered as brutalist rotating cards. |
| 7 | FAQ | Existing `product.faqs` | Restyled accordion on dark ink background per v6. |
| 8 | Related products | Existing `product.related` | Keep, restyled to match home category tiles. |
| 9 | Sticky price bar | Existing scroll logic | Restyled. Optional — hide if risky. |

## Out of scope (deferred)

- Paper Chooser interactive widget (v6 "Find your perfect card in 30 seconds"). Needs per-product Q&A data.
- Reviews band. Needs review content per product.
- Gallery band. Needs image sets per product.
- SEO magazine articles ("Issue №01"). Needs per-product long-form copy.
- Any change to `product.configurator` data model.

These each get their own later spec + admin UX once we have content to put in them.

## File plan

**Rewritten:**
- `components/product/product-page.tsx` — visual overhaul. Logic unchanged. We replace the JSX tree + the inline class names. Expect ~40–50% of the file to change; logic sections (~500 lines) stay.

**New (optional split-outs if file grows):**
- `components/product/product-hero.tsx` — hero block.
- `components/product/configurator-card.tsx` — per-step brutalist card.
- `components/product/price-box.tsx` — totals + cart CTA.
- `components/product/how-we-print.tsx` — the 4-card universal band (reads `site_settings.product_features`).
- `components/product/product-faq.tsx` — accordion.
- `components/product/product.module.css` OR `<style jsx>` in `product-page.tsx` for scoped styling.

Prefer splitting — `product-page.tsx` at 1045 lines is already brushing against "doing too much". Break out the hero, price box, configurator cards, how-we-print, and FAQ into their own components; `product-page.tsx` holds the state machine and composes children.

**Unchanged:**
- `app/(site)/product/[category]/[...slug]/page.tsx` — server page. No contract change.
- `lib/data/products.ts`, `lib/pricing.ts`, `lib/cart-store.ts`.
- `components/seo/json-ld.tsx` (but could add `ProductReview` schema in a future chunk once reviews exist).

## Styling

Reuse brutalist primitives from `app/pv-brutalist.css` (shipped in Chunk 1). Product-page-specific styles live in a component-scoped stylesheet or `<style jsx>`.

Typography: all headings in `var(--pv-f-display)`. Body in `var(--pv-f-body)`. Price numerals in display. Meta chips and breadcrumb use `var(--pv-f-mono)`.

Color: ink base for backgrounds where the v6 mockup uses cream; cream elsewhere. Magenta for accents; yellow for highlights (price numeral, breakdown discount).

## Admin

No new admin screens. `site_settings.product_features` already has an editor at `/admin/settings` — "How we print" reads from there and is already admin-editable.

FAQs per product are already editable in the product admin. No change.

## Testing

1. Visit `/product/cards/name-card` (or another known slug) — page loads, all configurator steps render, pricing updates on selection, Add to Cart works.
2. Visit a product with a formula-based configurator (uniforms/embroidery) — pricing breakdown populates correctly.
3. Visit a product with image upload enabled — upload flow unchanged.
4. Sticky bar: scroll past hero → sticky bar appears with current total; click Add → item added.
5. Mobile: configurator column stacks under preview column; price box still reachable via sticky bar.
6. TypeScript clean; no console errors.
7. Check `lighthouse` CLS on `/product/...` — brutalist shadows should not cause shifts on hover.

## Risks

- **Regression in configurator interactions** — highest risk. Rewriting JSX around `cfgState`/`visibleSteps`/`computeTotal` is the scary bit. Mitigate: split into smaller components with clear props; don't touch the state machine; run through every `configurator.type` variant (`select`, `swatch`, `text`, `qty`, `number`) on real products before shipping.
- **Sticky bar visual clash** — brutalist offset shadow on a sticky element can look weird. If so, strip the offset shadow in sticky state.
- **Related products tiles** — must match the home category tile look. Reuse the home tile component if it was split out in Chunk 2.
- **Upload zone z-index** — magenta dashed border + box-shadow. Verify it still accepts drops on all browsers.

## Follow-up ideas (not this chunk)

- Per-product Paper/Product Chooser widget. Needs `product_chooser_questions` table or a jsonb column on `products`.
- Per-product review collection (UGC or admin-curated). Needs `product_reviews` table.
- Per-product gallery. Needs `product_gallery_images` table or reuse a storage bucket convention.
- Per-product long-form SEO articles. Could live in `product.extras.seo_body` (already a string) or be promoted to a structured jsonb.
