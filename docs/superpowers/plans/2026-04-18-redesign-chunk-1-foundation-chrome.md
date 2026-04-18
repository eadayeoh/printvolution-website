# Redesign Chunk 1 — Foundation + Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site-wide chrome (announce bar, header, footer) with the v4 brutalist look. All content admin-editable. No page body changes.

**Architecture:** Introduce brutalist CSS tokens in `globals.css` + a shared `app/pv-brutalist.css` stylesheet. Rewrite `Header` and `Footer` against those tokens. New `AnnounceBar` sits above `Header` in `app/(site)/layout.tsx`. Content sources: existing `page_content` table (seeded by migration `0019`); existing `/admin/pages` editor handles all new sections.

**Tech Stack:** Next.js 14 App Router, React Server Components, Supabase Postgres, Tailwind (existing), plain CSS (new brutalist primitives), Zustand (cart store — untouched).

**Spec:** `docs/superpowers/specs/2026-04-18-redesign-chunk-1-foundation-chrome-design.md`

---

## File Structure

### New files

| Path | Responsibility |
|------|----------------|
| `app/pv-brutalist.css` | Shared brutalist primitives: buttons, card shadows, pill utility. ~80 lines. |
| `components/announce/announce-bar.tsx` | Server component; reads `page_content (global, announce)`; renders top strip. |
| `supabase/migrations/0019_redesign_chunk1_global_content.sql` | Seeds default `(global, *)` rows + admin-editor key registry updates. |

### Modified files

| Path | Change |
|------|--------|
| `app/globals.css` | Add brutalist CSS custom props block; `@import './pv-brutalist.css'` line. |
| `app/(site)/layout.tsx` | Mount `<AnnounceBar />` above `<Header />`. |
| `components/nav/header.tsx` | No logic change — only swaps announce fetch in / out if we add it here (we won't). |
| `components/nav/header-client.tsx` | Full visual rewrite. Data flow + mega/mobile preserved. |
| `components/footer/footer.tsx` | Convert to async server component; fetch from `page_content (global, footer.*)`; render v4 layout. |
| `lib/data/page_content.ts` | Add `getGlobalSection(key)` convenience helper. |

### Unchanged

- `app/layout.tsx` — fonts already load.
- `lib/data/site-settings.ts` — interface unchanged.
- `lib/data/navigation.ts` — nav/mega reads unchanged.
- All pages under `app/(site)/` other than layout.

## Testing approach

This repo has no test suite. Each task verifies via:

1. `npx tsc --noEmit` — no type errors introduced.
2. `npm run dev` + manual browser check against a listed URL and a described expected result.
3. `npm run lint` when touching client-heavy components.

Every task ends with a commit. Commits stay small and buildable.

---

## Task 1: Design tokens + brutalist primitives

**Files:**
- Create: `app/pv-brutalist.css`
- Modify: `app/globals.css`

- [ ] **Step 1: Create `app/pv-brutalist.css`**

```css
/* pv-brutalist.css — shared primitives used by the v4 chrome
   (announce bar, header, footer) and the redesigned homepage /
   product pages. Keep this file small and vocabulary-focused;
   component-specific CSS stays inside the component. */

.pv-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border: 2px solid var(--pv-ink);
  font-family: var(--pv-f-body);
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s, color 0.15s;
  white-space: nowrap;
}

.pv-btn-primary {
  background: var(--pv-magenta);
  color: #fff;
  box-shadow: 4px 4px 0 var(--pv-ink);
}
.pv-btn-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--pv-ink);
}

.pv-btn-ghost {
  background: #fff;
  color: var(--pv-ink);
}
.pv-btn-ghost:hover {
  background: var(--pv-ink);
  color: #fff;
}

.pv-card {
  background: #fff;
  border: 2px solid var(--pv-ink);
  box-shadow: 6px 6px 0 var(--pv-ink);
}

.pv-pill-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 2px solid var(--pv-ink);
  background: var(--pv-yellow);
  box-shadow: 3px 3px 0 var(--pv-ink);
  font-family: var(--pv-f-mono);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pv-mono {
  font-family: var(--pv-f-mono);
  letter-spacing: 0.04em;
}
.pv-display {
  font-family: var(--pv-f-display);
  letter-spacing: -0.02em;
}
```

- [ ] **Step 2: Add tokens + import to `app/globals.css`**

Find the `@layer base { :root { ... } }` block (around line 7). Add a second `@layer base` block immediately after, and a top import.

At the top of `app/globals.css`, change the first line block:

```css
@import './legacy-design.css';
@import './shop-design.css';
@import './pv-brutalist.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

After the existing `@layer base { :root { ... } }` block (immediately after it closes, before `@layer base { * { ... } }`), insert:

```css
@layer base {
  :root {
    /* v4/v6 brutalist palette — coexists with the legacy Tailwind pink. */
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
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Visual sanity check**

Run: `npm run dev` in a background shell, open `http://localhost:3000/`.
Expected: page loads unchanged (no visual regressions — we only *added* CSS). In devtools, inspect `:root` and confirm `--pv-magenta` is defined.

- [ ] **Step 5: Commit**

```bash
git add app/pv-brutalist.css app/globals.css
git commit -m "Redesign ch1: brutalist design tokens + primitives"
```

---

## Task 2: Migration + data helper

**Files:**
- Create: `supabase/migrations/0019_redesign_chunk1_global_content.sql`
- Modify: `lib/data/page_content.ts`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0019_redesign_chunk1_global_content.sql`:

```sql
-- 0019_redesign_chunk1_global_content.sql
-- Seed default (global, *) page_content rows that back the v4 redesign chrome.
-- Idempotent — safe to re-run; existing admin edits are preserved.

insert into public.page_content (page_key, section_key, data) values
  ('global', 'announce', '{"items":[
     {"text":"Same-day collection until 4pm","bold_part":"4pm"},
     {"text":"Paya Lebar Square, SG"},
     {"text":"Free delivery over S$80","bold_part":"S$80"}
   ]}'::jsonb),
  ('global', 'footer.brand', '{"items":[
     {"tagline":"Singapore''s friendliest print house. Printing services and personalised gifts, under one roof. Est. 2014."}
   ]}'::jsonb),
  ('global', 'footer.company', '{"items":[
     {"label":"About us","href":"/about"},
     {"label":"Corporate accounts","href":"/contact"},
     {"label":"Blog","href":"/blog"},
     {"label":"Membership","href":"/membership"}
   ]}'::jsonb),
  ('global', 'footer.support', '{"items":[
     {"label":"Contact us","href":"/contact"},
     {"label":"FAQs","href":"/faq"},
     {"label":"Bundles","href":"/bundles"},
     {"label":"My account","href":"/account"}
   ]}'::jsonb),
  ('global', 'footer.visit', '{"items":[
     {"kind":"address","label":"60 Paya Lebar Road","detail":"#B1-35, Singapore 409051"},
     {"kind":"hours","label":"Mon–Sat","detail":"10am – 7.30pm"},
     {"kind":"email","label":"hello@printvolution.sg","href":"mailto:hello@printvolution.sg"},
     {"kind":"phone","label":"+65 8553 3497","href":"https://wa.me/6585533497"}
   ]}'::jsonb),
  ('global', 'footer.social', '{"items":[
     {"label":"IG","href":"https://www.instagram.com/printvolution/","aria":"Instagram"},
     {"label":"WA","href":"https://wa.me/6585533497","aria":"WhatsApp"}
   ]}'::jsonb)
on conflict (page_key, section_key) do nothing;
```

- [ ] **Step 2: Apply the migration**

Apply via the project's existing Supabase workflow (either `supabase db push` if using the Supabase CLI locally, or by pasting into the Supabase dashboard SQL editor for the remote DB).

Verify: query `select section_key from page_content where page_key='global' order by section_key;` — six rows expected: `announce`, `footer.brand`, `footer.company`, `footer.social`, `footer.support`, `footer.visit`.

- [ ] **Step 3: Add `getGlobalSection` helper**

Modify `lib/data/page_content.ts`. After the existing `getPageContent` export, add:

```ts
export type GlobalSectionItem = Record<string, unknown>;

export const getGlobalSection = cache(async (sectionKey: string): Promise<GlobalSectionItem[]> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('page_content')
    .select('data')
    .eq('page_key', 'global')
    .eq('section_key', sectionKey)
    .maybeSingle();
  const items = (data?.data as { items?: GlobalSectionItem[] } | null)?.items;
  return Array.isArray(items) ? items : [];
});
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0019_redesign_chunk1_global_content.sql lib/data/page_content.ts
git commit -m "Redesign ch1: global page_content seed + getGlobalSection helper"
```

---

## Task 3: Announce bar component + layout mount

**Files:**
- Create: `components/announce/announce-bar.tsx`
- Modify: `app/(site)/layout.tsx`

- [ ] **Step 1: Create `components/announce/announce-bar.tsx`**

```tsx
import { getGlobalSection } from '@/lib/data/page_content';

type AnnounceItem = {
  text?: string;
  bold_part?: string;
};

export async function AnnounceBar() {
  const items = (await getGlobalSection('announce')) as AnnounceItem[];
  if (!items.length) return null;

  return (
    <div
      style={{
        background: 'var(--pv-ink)',
        color: '#fff',
        padding: '10px 24px',
        fontFamily: 'var(--pv-f-mono)',
        fontSize: 12,
        letterSpacing: '0.02em',
        display: 'flex',
        justifyContent: 'center',
        gap: 32,
        flexWrap: 'wrap',
      }}
    >
      {items.map((item, i) => {
        const text = item.text ?? '';
        if (!text) return null;
        if (item.bold_part && text.includes(item.bold_part)) {
          const [before, after] = text.split(item.bold_part);
          return (
            <span key={i}>
              {before}
              <b style={{ color: 'var(--pv-yellow)', fontWeight: 500 }}>{item.bold_part}</b>
              {after}
            </span>
          );
        }
        return <span key={i}>{text}</span>;
      })}
    </div>
  );
}
```

- [ ] **Step 2: Mount in site layout**

Modify `app/(site)/layout.tsx`:

```tsx
import { Header } from '@/components/nav/header';
import { Footer } from '@/components/footer/footer';
import { AnnounceBar } from '@/components/announce/announce-bar';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnounceBar />
      <Header />
      <main className="min-h-[calc(100vh-300px)]">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Visual check**

Open `http://localhost:3000/`. Expected: thin black strip at the very top with three mono text items, yellow-bolded "4pm" and "S$80".

Open `http://localhost:3000/shop`. Expected: announce bar also present (site layout applies).

- [ ] **Step 5: CMS round-trip check**

Open `http://localhost:3000/admin/pages`. Find the `global.announce` section. Change one of the item `text` values, save, refresh `/`. Expected: the new text appears.

- [ ] **Step 6: Commit**

```bash
git add components/announce/announce-bar.tsx app/\(site\)/layout.tsx
git commit -m "Redesign ch1: announce bar component + layout mount"
```

---

## Task 4: Header visual rewrite

**Files:**
- Modify: `components/nav/header-client.tsx`

Data flow (`nav`, `mega`, `productRoutes`, `settings`) is unchanged. Only JSX + inline styles change. Mega menu and mobile drawer behavior preserved.

- [ ] **Step 1: Rewrite the client header**

Replace the entire contents of `components/nav/header-client.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import type { NavItem, MegaMenuSection, ProductLookup } from '@/lib/data/navigation-types';
import { productHref } from '@/lib/data/navigation-types';
import type { SiteSettings } from '@/lib/data/site-settings';

type Props = {
  nav: NavItem[];
  mega: Record<string, MegaMenuSection[]>;
  productRoutes: ProductLookup;
  settings?: SiteSettings;
};

export function HeaderClient({ nav, mega, productRoutes, settings }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function openKey(key: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMega(key);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMega(null), 200);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <>
      <header
        style={{
          background: '#fff',
          borderBottom: '2px solid var(--pv-ink)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <nav
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            padding: '16px 24px',
            gap: 32,
            maxWidth: 1560,
            margin: '0 auto',
          }}
          aria-label="Main"
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.brand_text || 'Printvolution'}
                style={{
                  height: 38,
                  width: 'auto',
                  maxWidth: settings.logo_width_px ? `${settings.logo_width_px}px` : 220,
                  objectFit: 'contain',
                }}
              />
            ) : (
              <span
                style={{
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 26,
                  letterSpacing: '-0.02em',
                  color: 'var(--pv-ink)',
                }}
              >
                <span style={{ color: 'var(--pv-magenta)' }}>Print</span>volution
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <div
            className="pv-header-links"
            style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 600,
            }}
            onMouseLeave={scheduleClose}
            onMouseEnter={cancelClose}
          >
            {nav.map((item, i) => {
              if (item.type === 'sep') {
                return <span key={i} style={{ alignSelf: 'center', height: 14, width: 1, background: 'var(--pv-rule)' }} />;
              }
              if (item.type === 'dropdown' && item.mega_key) {
                const key = item.mega_key;
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => openKey(key)}
                    onClick={() => setOpenMega(openMega === key ? null : key)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '6px 0',
                      fontFamily: 'var(--pv-f-body)',
                      fontSize: 15,
                      fontWeight: 600,
                      color: openMega === key ? 'var(--pv-magenta)' : 'var(--pv-ink)',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label} ▾
                  </button>
                );
              }
              return (
                <Link
                  key={i}
                  href={mapAction(item.action) ?? '/shop'}
                  style={{ padding: '6px 0', color: 'var(--pv-ink)' }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/account"
              className="pv-header-account"
              style={{
                color: 'var(--pv-muted)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Sign in
            </Link>
            <Link
              href="/cart"
              className="pv-btn pv-btn-primary"
              style={{ padding: '10px 18px', fontSize: 13 }}
              aria-label="Cart"
            >
              <ShoppingCart size={14} />
              Cart
              {mounted && count > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    background: 'var(--pv-yellow)',
                    color: 'var(--pv-ink)',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 10,
                    padding: '2px 6px',
                    letterSpacing: 0,
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="pv-header-hamburger"
              style={{
                border: 'none',
                background: 'transparent',
                padding: 6,
                cursor: 'pointer',
                color: 'var(--pv-ink)',
              }}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Mega menu (desktop) */}
        {openMega && mega[openMega] && (
          <div
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '100%',
              background: '#fff',
              borderTop: '1px solid var(--pv-rule)',
              borderBottom: '2px solid var(--pv-ink)',
              boxShadow: '0 12px 30px rgba(10,10,10,0.08)',
            }}
          >
            <div style={{ maxWidth: 1560, margin: '0 auto', padding: '32px 24px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 40,
                }}
              >
                {mega[openMega].map((section) => (
                  <div key={section.id}>
                    <h4
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 11,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--pv-magenta)',
                        marginBottom: 12,
                        paddingBottom: 6,
                        borderBottom: '1px solid var(--pv-rule)',
                      }}
                    >
                      {section.section_heading}
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                      {section.items.map((it) => (
                        <li key={it.product_slug}>
                          <Link
                            href={productHref(it.product_slug, productRoutes)}
                            onClick={() => setOpenMega(null)}
                            style={{ fontSize: 13, color: 'var(--pv-ink)' }}
                          >
                            {it.label}
                          </Link>
                        </li>
                      ))}
                      {section.items.length === 0 && (
                        <li style={{ fontSize: 11, color: 'var(--pv-muted)' }}>Coming soon</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            background: '#fff',
            zIndex: 60,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottom: '2px solid var(--pv-ink)',
            }}
          >
            <span style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22 }}>Menu</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
              style={{ border: 'none', background: 'transparent', padding: 6, cursor: 'pointer' }}
            >
              <X size={22} />
            </button>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {nav.map((item, i) => {
              if (item.type === 'sep') return <div key={i} style={{ borderTop: '1px solid var(--pv-rule)', margin: '6px 0' }} />;
              if (item.type === 'dropdown' && item.mega_key) {
                return (
                  <div key={i} style={{ padding: '8px 0' }}>
                    <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 18, marginBottom: 8 }}>{item.label}</div>
                    {mega[item.mega_key]?.map((section) => (
                      <div key={section.id} style={{ paddingLeft: 8, marginBottom: 10 }}>
                        <div
                          style={{
                            fontFamily: 'var(--pv-f-mono)',
                            fontSize: 11,
                            color: 'var(--pv-magenta)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: 4,
                          }}
                        >
                          {section.section_heading}
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
                          {section.items.slice(0, 8).map((it) => (
                            <li key={it.product_slug}>
                              <Link
                                href={productHref(it.product_slug, productRoutes)}
                                onClick={() => setMobileOpen(false)}
                                style={{ fontSize: 14, color: 'var(--pv-ink)' }}
                              >
                                {it.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <Link
                  key={i}
                  href={mapAction(item.action) ?? '/shop'}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: '10px 0',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--pv-ink)',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              style={{ padding: '10px 0', fontSize: 16, fontWeight: 700, color: 'var(--pv-ink)' }}
            >
              Sign in
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              style={{ padding: '10px 0', fontSize: 13, color: 'var(--pv-muted)' }}
            >
              Admin
            </Link>
          </div>
        </div>
      )}

      {/* Responsive tweaks */}
      <style jsx global>{`
        @media (min-width: 900px) {
          .pv-header-hamburger { display: none; }
        }
        @media (max-width: 899px) {
          .pv-header-links { display: none !important; }
          .pv-header-account { display: none; }
        }
      `}</style>
    </>
  );
}

function mapAction(action: string | null): string | null {
  if (!action) return null;
  if (action.startsWith('/')) return action;
  const m = action.match(/go\(['"]([^'"]+)['"]\)/);
  if (m) {
    const key = m[1];
    const map: Record<string, string> = {
      home: '/', shop: '/shop', bundles: '/bundles', about: '/about',
      contact: '/contact', cart: '/cart', checkout: '/checkout',
      faq: '/faq', membership: '/membership', blog: '/blog',
    };
    return map[key] ?? '/shop';
  }
  return action;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check (desktop)**

Open `http://localhost:3000/` on a ≥1000px viewport. Expected:
- Sticky header with 2px ink border bottom.
- Logo (image or text) on the left.
- Nav links centered in body font.
- "Sign in" + magenta "Cart" button with offset shadow on the right.
- Cart count bubble reflects cart store (add an item to test).
- Hovering the "Products" dropdown shows the mega menu as a white panel with magenta-underlined column headers.

- [ ] **Step 4: Visual check (mobile)**

Resize to <900px. Expected:
- Nav links hide; hamburger shows.
- Click hamburger → full-screen drawer with nav items and product sub-lists.
- Close button (X) dismisses drawer.

- [ ] **Step 5: Route sanity check**

Click each top-level nav item and the mega-menu product links. Expected: each lands on the correct route (shop, product pages, etc.).

- [ ] **Step 6: Commit**

```bash
git add components/nav/header-client.tsx
git commit -m "Redesign ch1: header visual rewrite (v4 brutalist)"
```

---

## Task 5: Footer rewrite (CMS-driven)

**Files:**
- Modify: `components/footer/footer.tsx`

- [ ] **Step 1: Rewrite the footer**

Replace the entire contents of `components/footer/footer.tsx`:

```tsx
import Link from 'next/link';
import { getGlobalSection } from '@/lib/data/page_content';

type BrandItem = { tagline?: string };
type LinkItem = { label?: string; href?: string };
type VisitItem = { kind?: string; label?: string; detail?: string; href?: string };
type SocialItem = { label?: string; href?: string; aria?: string };

export async function Footer() {
  const [brandItems, companyItems, supportItems, visitItems, socialItems] = await Promise.all([
    getGlobalSection('footer.brand') as Promise<BrandItem[]>,
    getGlobalSection('footer.company') as Promise<LinkItem[]>,
    getGlobalSection('footer.support') as Promise<LinkItem[]>,
    getGlobalSection('footer.visit') as Promise<VisitItem[]>,
    getGlobalSection('footer.social') as Promise<SocialItem[]>,
  ]);

  const tagline = brandItems[0]?.tagline ?? '';

  return (
    <footer
      style={{
        background: 'var(--pv-ink)',
        color: '#fff',
        padding: '80px 24px 28px',
        borderTop: '3px solid var(--pv-magenta)',
      }}
    >
      <div
        className="pv-footer-grid"
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
          gap: 48,
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontFamily: 'var(--pv-f-display)',
              fontSize: 28,
              letterSpacing: '-0.02em',
              marginBottom: 16,
              color: '#fff',
            }}
          >
            <span style={{ color: 'var(--pv-magenta)' }}>Print</span>volution
          </div>
          {tagline && (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.72)',
                maxWidth: 340,
                margin: 0,
                marginBottom: 20,
              }}
            >
              {tagline}
            </p>
          )}
          {socialItems.length > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              {socialItems.map((s, i) =>
                s.href ? (
                  <a
                    key={i}
                    href={s.href}
                    aria-label={s.aria ?? s.label ?? 'Social link'}
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="pv-social-btn"
                    style={{
                      width: 40,
                      height: 40,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 13,
                    }}
                  >
                    {s.label ?? ''}
                  </a>
                ) : null
              )}
            </div>
          )}
        </div>

        <FooterColumn title="Company" items={companyItems} />
        <FooterColumn title="Support" items={supportItems} />

        {/* Visit column */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--pv-yellow)',
              marginTop: 0,
              marginBottom: 18,
              fontWeight: 700,
            }}
          >
            Visit the shop
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {visitItems.map((v, i) => (
              <li
                key={i}
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.65)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.5,
                }}
              >
                {v.href ? (
                  <a
                    href={v.href}
                    target={v.href.startsWith('http') ? '_blank' : undefined}
                    rel={v.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    style={{ color: '#fff', fontWeight: 600 }}
                  >
                    {v.label}
                  </a>
                ) : (
                  <b style={{ color: '#fff', fontWeight: 600 }}>{v.label}</b>
                )}
                {v.detail && (
                  <>
                    <br />
                    {v.detail}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1560,
          margin: '56px auto 0',
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        <span>© {new Date().getFullYear()} Printvolution Pte Ltd</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>

      <style>{`
        .pv-social-btn { transition: background 0.15s, border-color 0.15s, transform 0.15s; }
        .pv-social-btn:hover {
          background: var(--pv-magenta);
          border-color: var(--pv-magenta);
          transform: translateY(-2px);
        }
        @media (max-width: 900px) {
          .pv-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }
        }
        @media (max-width: 560px) {
          .pv-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: { label?: string; href?: string }[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4
        style={{
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--pv-yellow)',
          marginTop: 0,
          marginBottom: 18,
          fontWeight: 700,
        }}
      >
        {title}
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
        {items.map((it, i) =>
          it.href && it.label ? (
            <li key={i} style={{ fontSize: 14 }}>
              <Link href={it.href} style={{ color: 'rgba(255,255,255,0.85)' }}>
                {it.label}
              </Link>
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}
```

Note: `lucide-react` icons (MapPin, Phone, etc.) are no longer imported. The old unused `ArrowUpRight` and "Let's make something loud" giant CTA are gone — the homepage gets its own final-CTA band in Chunk 2.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check (desktop)**

Scroll to the bottom of `http://localhost:3000/`. Expected:
- Dark ink background with 3px magenta top border.
- 4-column grid: brand lockup + tagline + social on the left; 2 link columns; "Visit the shop" details on the right.
- Yellow mono column headers.
- Small uppercase mono copyright strip at the bottom.
- No giant "Let's make something loud" text.

- [ ] **Step 4: Visual check (mobile)**

Resize <900px. Expected: grid collapses to 2 columns, then 1 column under 560px. Readable.

- [ ] **Step 5: CMS round-trip check**

Open `/admin/pages`. Find `global.footer.company`. Add a link `{ label: "Test link", href: "/about" }`, save, refresh. Expected: new link appears in the Company column. Revert edit.

- [ ] **Step 6: Commit**

```bash
git add components/footer/footer.tsx
git commit -m "Redesign ch1: footer rewrite (CMS-driven v4 layout)"
```

---

## Task 6: Full-site regression walkthrough

**Files:** none modified unless a bug is found.

- [ ] **Step 1: Manual regression across key routes**

Visit each of the following in the dev server:
- `/`
- `/shop`
- `/product/cards/name-card` (or any product page)
- `/faq`
- `/about`
- `/contact`
- `/cart`
- `/account`
- `/admin`

For each, verify:
- Announce bar renders at the top.
- Header is sticky and layout matches the new design.
- Footer renders at the bottom.
- No unexpected console errors in devtools.
- Core interactions (add to cart, form focus, login flow) still work.

If anything breaks, fix and add a follow-up commit (`fix(ch1): …`).

- [ ] **Step 2: Lint pass**

Run: `npm run lint`
Expected: clean, or only pre-existing warnings.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Final cleanup commit (if any)**

If Steps 1–3 surfaced fixes, group them into one commit:

```bash
git commit -am "Redesign ch1: cleanup fixes from regression walkthrough"
```

Otherwise nothing to commit here — Chunk 1 is complete.

---

## Self-review checklist (for the implementer)

Before marking Chunk 1 done, confirm:

- [ ] Announce bar visible on every `(site)` route.
- [ ] Header sticky, mega menu works, mobile drawer works.
- [ ] Footer fully populated from `page_content`.
- [ ] No hardcoded footer links that should be editable.
- [ ] Admin edits on `/admin/pages` → visible on refresh.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run build` succeeds.
- [ ] No new runtime console errors.
- [ ] Cart badge still counts correctly.
- [ ] Two pinks (`#E91E8C` legacy, `#EC008C` new) coexist without clashing in chrome.
