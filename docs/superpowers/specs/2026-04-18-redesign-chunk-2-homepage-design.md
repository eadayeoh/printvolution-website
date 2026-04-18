# Redesign · Chunk 2 — Homepage

**Date:** 2026-04-18
**Depends on:** Chunk 1 (foundation tokens, header, footer, announce bar) must ship first.
**Scope:** Rebuild `/` using v4 brutalist layout. Every section's content comes from CMS.
**Non-goals:** Paper Chooser / Reviews / Gallery / SEO articles on product pages (Chunk 3-and-beyond).

## Ground truth

- `/Users/eadayeoh/Downloads/pv-homepage-v4.html` — section-by-section reference.
- Existing CMS tables: `page_content`, `products`, `categories`.

## Section inventory (top-to-bottom)

Each section reads from `page_content` where `page_key='home'` unless noted.

| # | Section | section_key | Shape | Notes |
|---|---------|-------------|-------|-------|
| 1 | Split hero (Print \| Gifts) | `hero.split` | `{ items: [{ side, kicker, headline, headline_accent, body, cta_label, cta_href, image_url }] }` (2 items) | `side` = "print" \| "gifts". Mobile collapses to stacked. |
| 2 | Why (3 numbered cards) | `why.cards` | `{ items: [{ num, title, body }] }` (typically 3) | `num` displayed big + colored per position. |
| 3 | Category tiles | `categories.tabs` | `{ items: [{ tab_key, tab_label, product_slugs: [...], badges: {slug: "Bestseller"|"Hot"|"New"|"..."} }] }` | Two tabs (print/gifts). Products rendered with DB image/name/min_price. Admin selects slugs + assigns a badge per slug. |
| 4 | Proof / testimonial + stats | `proof.main` | `{ items: [{ kind:"quote", text, cite }, { kind:"stat", num, suffix, label }, ...] }` | Admin can mix — typically 1 quote + 4 stats. |
| 5 | How it works (4 steps) | `how.steps` | `{ items: [{ num, title, body, time }] }` | Left side has title + body + primary CTA (below). |
| 6 | How it works header | `how.header` | `{ items: [{ headline, headline_accent, body, cta_label, cta_href }] }` (1 item) | |
| 7 | FAQ | `faq.items` | `{ items: [{ question, answer }] }` | Accordion (`<details>`). |
| 8 | Location | `location.main` | `{ items: [{ kind, label, detail, href? }] }` | `kind` ∈ address, hours, phone, email, mrt. Image on right is from `site_settings` (new field) or a fixed path for now. |
| 9 | Final CTA band | `final_cta.main` | `{ items: [{ headline, headline_accent, body, cta_label, cta_href }] }` (1 item) | Magenta background. |

Ticker marquee (small horizontal scroller above Why) — reuse `page_content (home, ticker)` with `{ items: [{ text }] }`.

## File plan

**New:**
- `components/home/split-hero.tsx`
- `components/home/ticker.tsx`
- `components/home/why-cards.tsx`
- `components/home/category-tiles.tsx` — client component for tab switching.
- `components/home/proof.tsx`
- `components/home/how-it-works.tsx`
- `components/home/faq.tsx`
- `components/home/location.tsx`
- `components/home/final-cta.tsx`
- `app/(site)/page.tsx.home-sections.css` OR a shared `components/home/home.module.css` — section-scoped styles.

**Rewritten:**
- `app/(site)/page.tsx` — now just composes the section components. Fetches `page_content (home, *)`, `products`, `productRoutes` once, fans out.

**Unchanged:**
- `lib/data/products.ts`, `lib/data/page_content.ts` (maybe add a `getHomeContent()` convenience wrapper).
- All other (site) routes.

## Data migration

One SQL migration `supabase/migrations/<n>_redesign_chunk2.sql` seeding default home sections. Default copy mirrors the v4 mockup so the page is visually complete on first deploy. Admin replaces as needed.

Ensure `categories.tabs` default references real product slugs that exist in DB. Pick from `FEATURED_SLUGS` already in the old homepage (`name-card`, `flyers`, `roll-up-banner`, etc.) for the print tab; pick gift slugs from `is_gift=true` products for the gifts tab.

## Category tile rendering rules

`CategoryTiles` (client) renders only tiles whose `slug` resolves in the DB products list. For each tile:
- image: `product.image_url` (fall back to a pink placeholder with product name if null).
- name: `product.name`.
- subtext: `product.tagline` if present, else empty.
- price: `From {formatSGD(product.min_price)}` if set, else "Quote".
- badge: from `badges[slug]` on the section item, or none.
- href: `productHref(slug, routes)`.

Empty tab → render nothing for that tab (don't show the tab button).

## FAQ rendering

`<details>` accordion, same as v4 markup. No JS needed. Expanded content is plain paragraphs — no markdown parsing in v1.

## SEO / metadata

Keep existing `metadata` export. Schema: keep `LocalBusinessSchema`. Add a `FAQPage` JSON-LD built from the FAQ section items.

Structured data component lives in `components/seo/json-ld.tsx` — extend it with a `FAQPageSchema` helper.

## Admin

`/admin/pages` already edits `page_content`. The new home sections show up automatically once the migration seeds them. Verify that `PagesCmsEditor` can render arbitrary section keys or extend it with the new keys (likely requires adding to the known-keys registry in `components/admin/pages-cms-editor.tsx`).

Out of scope for this chunk: a per-section live preview. Admin edits → save → refresh homepage.

## Testing

1. Home loads with full default content.
2. Each section renders; hitting the FAQ details toggles answers.
3. Category tiles: click "Gifts" tab → gift products shown; click "Print" → print. Each tile links to the correct product page.
4. Admin edits one FAQ answer → refresh → appears on homepage.
5. Admin empties `categories.tabs.items[0].product_slugs` for the print tab → print tab button disappears (gifts-only).
6. Lighthouse pass: LCP on hero image; no layout shift from ticker.
7. TypeScript clean; no console errors.

## Risks

- **Tab with no resolvable products** — hide the tab rather than show empty grid.
- **`page_content` missing rows** — each section component must render nothing (or a subtle empty state) rather than crash.
- **`PagesCmsEditor` known-key registry** — it may not auto-render unknown keys. Plan step: inspect the editor; add known keys if needed.
- **Hero image selection** — v4 shows two image panels (Print + Gifts). Source from `page_content.hero.split.items[].image_url`. Seed migration points to `/images/name-card.webp` and `/images/custom-keychain.webp` (already in repo per `globals.css` line 45–51).
