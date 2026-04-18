# Redesign · Chunk 1 — Foundation + Chrome

**Date:** 2026-04-18
**Scope:** Design tokens, global chrome (Header, Footer, Announcement bar). Affects every page.
**Follow-ups:** Chunk 2 (Homepage), Chunk 3 (Product page shell). Separate specs.

## Why

Roll out the v4 brutalist look site-wide by replacing the chrome *first*, so every subsequent page lands inside the new frame. Keep existing data sources (DB-driven nav/mega, site_settings), extend them where content is new. Everything admin-editable — no hardcoded strings in components.

## Ground truth

- `/Users/eadayeoh/Downloads/pv-homepage-v4.html` — visual reference (announce bar, header, footer markup + styles).
- CMS spine that already exists:
  - `public.navigation` — header nav items.
  - `public.mega_menus` + `mega_menu_items` — dropdowns.
  - `public.page_content (page_key, section_key, data jsonb)` — free-form section blobs.
  - `public.contact_methods` — phone/email/WhatsApp.
  - `public.site_settings` singleton (via `getSiteSettings`) — logo, brand, product_features.
  - `/admin/pages` + `/admin/settings` — editors that back both.

## Design tokens

Introduce brutalist tokens alongside (not replacing) current ones. Add to `app/globals.css`:

```css
:root {
  --pv-magenta: #EC008C;
  --pv-magenta-dark: #C20074;
  --pv-cyan: #00AEEF;
  --pv-yellow: #FFDD00;
  --pv-purple: #7B2CBF;
  --pv-green: #06D6A0;
  --pv-ink: #0A0A0A;
  --pv-ink-soft: #2A2A2A;
  --pv-cream: #FFF9F0;
  --pv-muted: #6B6B6B;
  --pv-rule: #E8E8E8;

  --pv-f-display: 'Archivo Black', sans-serif;
  --pv-f-body: 'Archivo', system-ui, sans-serif;
  --pv-f-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

Fonts already load in `app/layout.tsx` (Archivo + Archivo Black + JetBrains Mono). No change there.

Existing Tailwind `pink` token (`#E91E8C`) and the CMYK stripe stay. Over time the pink tokens converge; in this chunk they coexist (E91E8C for legacy pages, EC008C for new chrome). Tailwind is not touched.

Create a new stylesheet `app/pv-brutalist.css` imported from `globals.css` that holds the reusable brutalist primitives used by Header/Footer (and later Homepage/Product page):

- `.pv-btn-primary` — magenta fill, 3px ink border, 6px offset ink shadow, hover translate.
- `.pv-btn-ghost` — white fill, ink border, invert on hover.
- `.pv-pill` — yellow highlight pill (used in hero tagline + announce bar).
- `.pv-card` — white + ink border + offset ink shadow.
- `.pv-shadow-offset`, `.pv-shadow-offset-cyan`, `.pv-shadow-offset-magenta` — variants.

Rule of thumb: utilities live in `pv-brutalist.css`; component-scoped styles live in `<style jsx>` inside the component. This keeps the shared vocabulary small and searchable.

## Announcement bar (new)

Content source: new `page_content` row — `page_key='global'`, `section_key='announce'`, `data.items = [{ icon?, text, bold_part?, href? }, ...]`.

Component: `components/announce/announce-bar.tsx` (server component). Loads via a new `getAnnounce()` helper in `lib/data/page_content.ts`. Renders 1–3 items depending on how many the admin sets. Empty / disabled → nothing renders.

Mount point: `app/(site)/layout.tsx`, above `<Header />`. (`<Header />` stays sticky; announce bar scrolls away.)

Admin UX: `/admin/pages` already renders `page_content` sections — the new key shows up automatically as a new editable section. No new admin screen.

## Header redesign

Rewrite `components/nav/header.tsx` + `header-client.tsx`:

- Same data inputs: `nav`, `mega`, `productRoutes`, `settings`. No data migration.
- Visual: v4 layout — logo left, center nav, right CTAs (Sign in + magenta "Cart" / "Start a Job" button with offset shadow). Sticky with 2px ink border-bottom.
- Mega menu: preserved behavior, restyled (white panel, ink border, offset shadow, yellow column headers).
- Mobile drawer: preserved behavior, restyled.
- Keep `Settings` (admin) icon and `Cart` count bubble.
- Logo: if `settings.logo_url` set, render `<img>` at 38px height (current behavior). Else, render text wordmark using new brutalist display font.

New dependencies: none. Lucide icons stay.

Breaking changes: visual only. All existing links and keyboard behavior preserved.

## Footer redesign

Rewrite `components/footer/footer.tsx` (server component) to fetch from CMS:

Sources:
- `site_settings.brand_text` + new `site_settings.brand_tagline` (add column), or re-use a new `page_content` row `page_key='global', section_key='footer.brand'` with `data.items = [{ tagline }]`. **Pick:** `page_content` route. Reason: less schema churn, admin already edits page_content. Add `brand_tagline` only if we end up with lots of brand fields.
- `page_content (global, footer.company | footer.support | footer.visit)` — each row is `{ items: [{ label, href }] }`. Render 3 columns.
- `contact_methods` — already exists; use for phone/email in the Visit column if admin prefers referencing it there (advanced, skip for v1 — keep hardcoded-per-column links).
- Social links: new `page_content` row `(global, footer.social)` with `data.items = [{ label, href }]`.

Visual: v4 footer — dark ink background, 4-column grid (brand 1.5fr + 3×1fr), magenta top border, yellow column titles, mono tagline strip at bottom with © + legal.

Keep the existing CMYK bar at the very top of `<body>` — v4 doesn't fight it, and it's a brand signature.

Drop the "Let's make something loud." oversized CTA (v4 has no equivalent; the Homepage gets its own final CTA band in Chunk 2).

## Admin

- `/admin/pages` already edits all new `page_content` sections (`global:announce`, `global:footer.company`, etc.) with no code change — `PagesCmsEditor` renders any section it gets.
- If a section is missing from `page_content`, the page just renders empty state (no crash). Seed a migration with sensible defaults so the site doesn't look hollow on first deploy.

## Data migration

One SQL migration `supabase/migrations/<n>_redesign_chunk1.sql`:

```sql
-- Seed default global sections if missing.
insert into page_content (page_key, section_key, data) values
  ('global', 'announce', '{"items":[
     {"text":"Same-day collection until 4pm","bold_part":"4pm"},
     {"text":"Paya Lebar Square, SG"},
     {"text":"Free delivery over S$80","bold_part":"S$80"}
   ]}'::jsonb),
  ('global', 'footer.brand', '{"items":[{"tagline":"Singapore''s friendliest print house. Printing services and personalised gifts, under one roof. Est. 2014."}]}'::jsonb),
  ('global', 'footer.company', '{"items":[
     {"label":"About us","href":"/about"},
     {"label":"Corporate accounts","href":"/contact"},
     {"label":"Careers","href":"/careers"},
     {"label":"Press","href":"/press"}
   ]}'::jsonb),
  ('global', 'footer.support', '{"items":[
     {"label":"Contact us","href":"/contact"},
     {"label":"File prep guide","href":"/file-prep"},
     {"label":"Help centre","href":"/help"},
     {"label":"FAQs","href":"/faq"}
   ]}'::jsonb),
  ('global', 'footer.visit', '{"items":[
     {"kind":"address","label":"Paya Lebar Square","detail":"#B1-35, Singapore 409051"},
     {"kind":"hours","label":"Mon–Sat","detail":"10am – 7.30pm"},
     {"kind":"email","label":"hello@printvolution.sg","href":"mailto:hello@printvolution.sg"},
     {"kind":"phone","label":"+65 8553 3497","href":"tel:+6585533497"}
   ]}'::jsonb),
  ('global', 'footer.social', '{"items":[
     {"label":"IG","href":"https://www.instagram.com/printvolution/"},
     {"label":"FB","href":"#"},
     {"label":"TT","href":"#"},
     {"label":"WA","href":"https://wa.me/6585533497"}
   ]}'::jsonb)
on conflict (page_key, section_key) do nothing;
```

(Adjust `on conflict` clause to match the existing unique key on `page_content`.)

## Files touched

**New:**
- `app/pv-brutalist.css` — shared primitives.
- `components/announce/announce-bar.tsx` — announce bar.
- `supabase/migrations/<n>_redesign_chunk1.sql` — seed.

**Rewritten:**
- `components/nav/header.tsx` — fetch unchanged, pass-through to client.
- `components/nav/header-client.tsx` — new visual layout, preserves mega + mobile.
- `components/footer/footer.tsx` — now async server component, fetches from page_content.
- `app/globals.css` — adds brutalist token vars + imports `pv-brutalist.css`.
- `app/(site)/layout.tsx` — mounts `<AnnounceBar />` above `<Header />`.

**Unchanged:**
- `app/layout.tsx` (fonts already loading).
- `lib/data/site-settings.ts` (interface unchanged).
- `lib/data/navigation.ts` (nav/mega reads unchanged).
- All other pages in `(site)`.

## Testing

No test suite in the repo today. Verification is manual:

1. `npm run dev`, open `/`, `/shop`, `/faq`, `/cart`, `/account` — announce bar shows, header looks v4, footer looks v4, nothing crashes.
2. Resize to <900px — announce collapses to stacked, nav collapses to hamburger, footer goes 2-column then 1-column.
3. `/admin/pages` — edit announce bar items, refresh `/` → new text renders.
4. `/admin/pages` — delete all `global:footer.company` items → column disappears cleanly (empty state).
5. Mega menu: hover "Products" in header → dropdown still populated from DB.
6. Cart: add a product, header cart bubble updates.
7. TypeScript: `npx tsc --noEmit` clean.
8. No new console errors in browser devtools.

## Non-goals (explicitly)

- Paper Chooser widget — Chunk 3 or later.
- Homepage sections — Chunk 2.
- Product page body — Chunk 3.
- Removing the old legacy-design.css — deferred. Both coexist.
- Tailwind pink token migration from `#E91E8C` → `#EC008C` — deferred until a later cleanup. New chrome uses the new CSS var; legacy pages stay on Tailwind pink.
- New admin screens. We reuse existing editors.

## Risks & mitigations

- **Color drift** — two pinks coexist. Mitigation: clearly-named tokens (`--pv-magenta` vs Tailwind `pink`); cleanup sweep scheduled after all 3 chunks land.
- **Empty CMS on first deploy** — seed migration covers it.
- **Cart state hydration** — client header still uses `useCart`; no change to cart store, safe.
- **Logo sizing** — v4 mockup uses a text lockup; real site uses an uploaded image. Image path stays primary; wordmark is the fallback (matches current behavior).
