# Redesign Chunk 3 — Product page shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Single-task plan (this is a targeted re-skin, not a new feature build).

**Goal:** Re-skin `/product/[category]/[...slug]` to the v6 brutalist look while preserving every line of configurator / pricing / cart logic in `components/product/product-page.tsx`.

**Architecture:** Full rewrite of the file's `return (…)` JSX tree only. All state hooks, memos, handlers, and computed values stay byte-for-byte. No file split — that's a follow-up cleanup once the new look is verified.

**Tech Stack:** Same as Chunks 1–2.

**Spec:** `docs/superpowers/specs/2026-04-18-redesign-chunk-3-product-page-design.md`

**Depends on:** Chunks 1 + 2 shipped.

---

## File Structure

### Modified

| Path | Change |
|------|--------|
| `components/product/product-page.tsx` | Rewrite JSX. Lines 1–300 (state/memos/handlers) unchanged. Lines 301–1045 (JSX) replaced. |

### Unchanged

- All of `lib/`, `app/`, other components.

## What to preserve (load-bearing)

- Every hook: `useState`, `useEffect`, `useMemo`, `useCart`.
- Every state variable name: `rowIdx`, `cfgState`, `openFaq`, `designFilesUrl`, `stickyVisible`, `addedFlash`, `manualColIdx`.
- Every memo: `visibleSteps`, `qty`, `colIdx`, `breakdown`, `lineTotal`, `unitPrice`, `savings`, `undiscountedTotal`, `savingsPct`, `fromPrice`, `priceLadder`.
- Handler `handleAddToCart` and the cart payload.
- The three JSON-LD inline scripts (product, breadcrumb, FAQ).

## What to replace (visual)

- Sticky bar — brutalist: white + 2px ink border-bottom, magenta CTA, no pink gradient.
- Hero — brutalist: white background, mono breadcrumb, yellow pill kicker, display H1 with magenta accent, image in an offset-shadow frame. Remove aurora pink blobs.
- Product features row — brutalist mini-cards (`.pv-card` primitive).
- Configurator (Build your order) — each step in a `.pv-card`; pills with 1.5px ink border, active = ink fill; swatches with light cream on hover.
- Order summary — ink background, yellow total number, magenta offset shadow; breakdown rows mono-labelled.
- Price ladder — brutalist tiles with offset shadow.
- About / Highlights / Specs — cream section with ink-bordered spec table.
- Why us (dark) — keep dark ink background, magenta numerals, mono caption bar on top.
- FAQ — ink-background band with yellow-shadowed detail cards.
- Related — 4-up grid matching home category tiles.
- SEO body — tiny mono type, left rule, unchanged position.

## Testing approach

1. `npx tsc --noEmit` after rewrite.
2. `npm run build` — `/product/...` route builds.
3. `npm run dev` + walk through several products:
   - `/product/cards/name-card` — matrix pricing + volume ladder.
   - `/product/advertising/roll-up-banner` — formula pricing.
   - A product with a text configurator field (name engraving, etc.).
   - A gift product (should still route through `/gift/...` — not affected by this task).
4. Verify Add to Cart still fires and header cart count increments.

---

## Task 1: Rewrite `components/product/product-page.tsx` JSX

**Files:**
- Modify: `components/product/product-page.tsx` (full rewrite)

- [ ] **Step 1: Replace the file**

Use the new file contents below. All state / memo / handler code from the top of the existing file is preserved verbatim (it's copy-pasted into the new version). The `return (…)` block is replaced entirely.

(See the implementation commit for the exact file contents.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `/product/[category]/[...slug]` route builds.

- [ ] **Step 4: Manual smoke test**

Hit the dev server and exercise 3–4 products; confirm price updates and Add to Cart.

- [ ] **Step 5: Commit**

```bash
git add components/product/product-page.tsx
git commit -m "Redesign ch3: product page v6 brutalist re-skin"
```

---

## Self-review checklist

- [ ] State hooks intact; variable names unchanged.
- [ ] `handleAddToCart` behavior unchanged.
- [ ] JSON-LD scripts still render.
- [ ] Sticky bar still shows/hides on scroll.
- [ ] Breakdown rows + volume-discount logic intact.
- [ ] Price ladder tiles set `rowIdx` on click.
- [ ] FAQ accordion state intact.
- [ ] `npm run build` clean.

## Non-goals

Paper Chooser, Reviews, Gallery, SEO magazine articles — deferred per spec.
