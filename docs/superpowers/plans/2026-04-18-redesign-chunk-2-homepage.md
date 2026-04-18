# Redesign Chunk 2 — Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/` using the v4 brutalist layout. Every section is backed by `page_content (page_key='home', …)` so admins can edit all copy, links, imagery, and featured products via `/admin/pages`.

**Architecture:** `app/(site)/page.tsx` becomes a thin server component that fetches all home sections + products once and fans out to per-section server components under `components/home/*`. Only the Category Tiles tab switcher needs client JS. Section components render nothing (or a small empty state) if their backing row is absent.

**Tech Stack:** Next.js 14 App Router, React Server Components, Supabase, brutalist CSS tokens from Chunk 1.

**Spec:** `docs/superpowers/specs/2026-04-18-redesign-chunk-2-homepage-design.md`

**Depends on:** Chunk 1 merged (tokens + chrome live).

---

## File Structure

### New files

| Path | Responsibility |
|------|----------------|
| `lib/data/home.ts` | Single `getHomePageContent()` helper that fetches all `home:*` section rows in one trip. |
| `components/home/split-hero.tsx` | Print / Gifts split hero band. Server component. |
| `components/home/ticker.tsx` | Infinite horizontal marquee. |
| `components/home/why-cards.tsx` | Three brutalist why cards. |
| `components/home/category-tiles.tsx` | Client component — Print / Gifts tabs + product grid. |
| `components/home/proof.tsx` | Quote + stats band (dark). |
| `components/home/how-it-works.tsx` | Steps + side callout CTA. |
| `components/home/faq.tsx` | `<details>` accordion FAQ. |
| `components/home/location.tsx` | Address / hours / contacts table + image. |
| `components/home/final-cta.tsx` | Magenta bottom CTA band. |
| `supabase/migrations/0020_redesign_chunk2_home_content.sql` | Seeds `home:*` rows with default v4 copy. |

### Modified files

| Path | Change |
|------|--------|
| `app/(site)/page.tsx` | Rewritten — composes section components. |
| `components/seo/json-ld.tsx` | Add `FAQPageSchema` helper. |

### Unchanged

- `components/nav/header.tsx`, `components/nav/header-client.tsx`, `components/footer/footer.tsx`, `components/announce/announce-bar.tsx` (Chunk 1).
- `lib/data/products.ts`, `lib/data/navigation.ts`.

## Testing approach

No test suite. Verify with:

1. `npx tsc --noEmit` after each component — clean.
2. `npm run dev`, open `/`, section-by-section visual inspection.
3. Admin round-trip (edit `/admin/pages` → refresh homepage).
4. `npm run build` at the end.

---

## Task 1: Data layer — `getHomePageContent`

**Files:**
- Create: `lib/data/home.ts`

- [ ] **Step 1: Create the helper**

```ts
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type HomeSections = Record<string, Array<Record<string, unknown>>>;

export const getHomePageContent = cache(async (): Promise<HomeSections> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('page_content')
    .select('section_key, data')
    .eq('page_key', 'home');

  const out: HomeSections = {};
  for (const row of (data ?? []) as Array<{ section_key: string; data: { items?: Array<Record<string, unknown>> } | null }>) {
    const items = row.data?.items;
    out[row.section_key] = Array.isArray(items) ? items : [];
  }
  return out;
});

export function homeItems(sections: HomeSections, key: string): Array<Record<string, unknown>> {
  return sections[key] ?? [];
}

export function homeFirst<T = Record<string, unknown>>(sections: HomeSections, key: string): T | null {
  const arr = sections[key];
  return (arr && arr.length > 0 ? (arr[0] as unknown as T) : null);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/data/home.ts
git commit -m "Redesign ch2: getHomePageContent helper"
```

---

## Task 2: Migration — seed home sections

**Files:**
- Create: `supabase/migrations/0020_redesign_chunk2_home_content.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0020_redesign_chunk2_home_content.sql
-- Seed default (home, *) page_content rows for the v4 brutalist homepage.
-- Idempotent — existing admin edits are preserved.

insert into public.page_content (page_key, section_key, data) values

  ('home', 'hero.split', '{"items":[
     {"side":"print","kicker":"Printing Services","headline":"Print that","headline_accent":"shows up on time.","body":"Name cards, flyers, banners, uniforms, signage — all under one roof at Paya Lebar Square. File check on every job. Express 24h available.","cta_label":"Browse Printing","cta_href":"/shop","image_url":"/images/name-card.webp"},
     {"side":"gifts","kicker":"Personalised Gifts","headline":"Gifts they''ll","headline_accent":"actually keep.","body":"LED photo frames, engraved tumblers, custom tote bags, corporate hampers. Walk in with an idea — leave with a gift they''ll keep.","cta_label":"Shop Gifts","cta_href":"/shop?gift=1","image_url":"/images/custom-keychain.webp"}
   ]}'::jsonb),

  ('home', 'ticker', '{"items":[
     {"text":"Name Cards"},{"text":"Flyers"},{"text":"Roll-Up Banners"},
     {"text":"Stickers"},{"text":"Embroidery"},{"text":"Polo Shirts"},
     {"text":"UV DTF"},{"text":"NFC Cards"},{"text":"Booklets"},
     {"text":"Tote Bags"},{"text":"Acrylic Signs"},{"text":"Corporate Gifts"}
   ]}'::jsonb),

  ('home', 'why.cards', '{"items":[
     {"num":"01","title":"Files checked by humans","body":"Every print file is reviewed by a real person within 2 hours. We catch CMYK issues, low-res images, missing bleed — before the press runs."},
     {"num":"02","title":"Live, honest pricing","body":"No quote emails. No ''contact us for pricing.'' Configure your job, see the real number. Volume discounts shown, never hidden."},
     {"num":"03","title":"Fast. Not reckless.","body":"Same-day collection for digital jobs before 4pm. Offset runs 3 working days. Delivery next day. We hit the deadline or tell you early."}
   ]}'::jsonb),

  ('home', 'categories.tabs', '{"items":[
     {"tab_key":"print","tab_label":"Printing","product_slugs":["name-card","flyers","roll-up-banner","stickers","acrylic-signage","polo-shirts","books","paper-bag"],
      "badges":{"name-card":"Bestseller","flyers":"Same-day","roll-up-banner":"Hot","stickers":"New"}},
     {"tab_key":"gifts","tab_label":"Gifts","product_slugs":["led-photo-frame","nfc-card","bar-necklace","yeti-mug","3d-bar-keychain","line-art-embroidery-shirt","custom-cake-topper","apron"],
      "badges":{"led-photo-frame":"Bestseller","nfc-card":"New"}}
   ]}'::jsonb),

  ('home', 'proof.main', '{"items":[
     {"kind":"quote","text":"They caught a CMYK conversion issue in my file before it went to press. Nobody else did that.","cite":"Marketing Director, SG fintech"},
     {"kind":"stat","num":"12","suffix":"yrs","label":"Printing since 2014"},
     {"kind":"stat","num":"90","suffix":"+","label":"Products on catalogue"},
     {"kind":"stat","num":"400","suffix":"+","label":"Corporate accounts"},
     {"kind":"stat","num":"24","suffix":"h","label":"Express turnaround"}
   ]}'::jsonb),

  ('home', 'how.header', '{"items":[
     {"headline":"Upload. Check.","headline_accent":"Press.","body":"No back-and-forth emails. No mystery pricing. No ''we''ll get back to you.'' This is how printing in Singapore should''ve always worked.","cta_label":"Start Your First Job","cta_href":"/shop"}
   ]}'::jsonb),

  ('home', 'how.steps', '{"items":[
     {"num":"01","title":"Configure & see live price","body":"Stock, size, finish, quantity — price updates as you go.","time":"~2 min"},
     {"num":"02","title":"Upload your print file","body":"PDF, AI, PSD. Auto-checked for bleed, resolution, CMYK.","time":"~1 min"},
     {"num":"03","title":"Preflight by our team","body":"A real human checks it. We flag issues before press runs.","time":"within 2h"},
     {"num":"04","title":"Print, pack, deliver","body":"Collect at Paya Lebar or islandwide next-day delivery.","time":"1–3 days"}
   ]}'::jsonb),

  ('home', 'faq.items', '{"items":[
     {"question":"How fast is printing at Printvolution?","answer":"Same-day collection is available for digital print jobs submitted before 4pm at our Paya Lebar Square location. Offset printing runs 3 working days. Islandwide delivery is next-day after production."},
     {"question":"What printing services do you offer?","answer":"90+ products across business cards (digital, offset, luxury), posters, stickers, booklets, flyers, letterheads, envelopes, notebooks, canvas, paper bags, uniforms, and personalised gifts. B2B corporate and B2C individual orders."},
     {"question":"Do you check my print file before printing?","answer":"Yes. Every file is reviewed by a real person within 2 hours. We check CMYK conversion, 300dpi resolution, 3mm bleed, font embedding, and overprint settings."},
     {"question":"Where are you located?","answer":"60 Paya Lebar Road, #B1-35, Singapore 409051. Walk-in collection and consultations Mon–Sat 10am–7.30pm. Two minutes from Paya Lebar MRT."},
     {"question":"Do you offer corporate accounts with invoicing?","answer":"Yes. 400+ SG businesses have corporate accounts with us. Consolidated monthly invoicing, PO support, GST-registered billing, dedicated account management, and volume pricing."},
     {"question":"What file formats do you accept?","answer":"Print-ready PDF preferred. Also AI, PSD, INDD (packaged). Use CMYK, 300dpi, 3mm bleed."}
   ]}'::jsonb),

  ('home', 'location.main', '{"items":[
     {"kind":"address","label":"Address","detail":"60 Paya Lebar Road, #B1-35, Singapore 409051"},
     {"kind":"hours","label":"Hours","detail":"Mon–Sat · 10am – 7.30pm"},
     {"kind":"phone","label":"Phone","detail":"+65 8553 3497","href":"https://wa.me/6585533497"},
     {"kind":"email","label":"Email","detail":"hello@printvolution.sg","href":"mailto:hello@printvolution.sg"},
     {"kind":"mrt","label":"MRT","detail":"Paya Lebar (EW8 / CC9) — 2 min walk"}
   ]}'::jsonb),

  ('home', 'final_cta.main', '{"items":[
     {"headline":"Got a file?","headline_accent":"Press start.","body":"Live pricing, human preflight, same-day collection. Your print, done properly.","cta_label":"Start a Job Now","cta_href":"/shop"}
   ]}'::jsonb)

on conflict (page_key, section_key) do nothing;
```

- [ ] **Step 2: Apply the migration**

Apply via your Supabase workflow. Verify: `select section_key from page_content where page_key='home' order by section_key;` — 10 rows.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0020_redesign_chunk2_home_content.sql
git commit -m "Redesign ch2: seed home page_content sections"
```

---

## Task 3: Split Hero component

**Files:**
- Create: `components/home/split-hero.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from 'next/link';

export type SplitHeroItem = {
  side?: 'print' | 'gifts' | string;
  kicker?: string;
  headline?: string;
  headline_accent?: string;
  body?: string;
  cta_label?: string;
  cta_href?: string;
  image_url?: string;
};

export function SplitHero({ items }: { items: SplitHeroItem[] }) {
  if (!items.length) return null;
  return (
    <section style={{ borderBottom: '3px solid var(--pv-ink)', position: 'relative' }}>
      <div
        className="pv-split-hero-inner"
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: items.length > 1 ? '1fr 1fr' : '1fr',
          minHeight: 640,
          position: 'relative',
        }}
      >
        {items.length > 1 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-6deg)',
              zIndex: 10,
              width: 88,
              height: 88,
              background: 'var(--pv-yellow)',
              border: '3px solid var(--pv-ink)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--pv-f-display)',
              fontSize: 42,
              color: 'var(--pv-ink)',
              boxShadow: '5px 5px 0 var(--pv-ink)',
            }}
          >
            &amp;
          </div>
        )}
        {items.map((item, i) => {
          const accent = item.side === 'gifts' ? 'var(--pv-cyan)' : 'var(--pv-magenta)';
          const bg = item.side === 'gifts' ? 'var(--pv-cream)' : '#fff';
          return (
            <div
              key={i}
              className="pv-split-side"
              style={{
                background: bg,
                borderRight: i === 0 && items.length > 1 ? '3px solid var(--pv-ink)' : 'none',
                padding: '64px 48px',
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                gap: 32,
                overflow: 'hidden',
              }}
            >
              <div>
                {item.kicker && (
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: accent,
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ width: 24, height: 2, background: accent }} />
                    {item.kicker}
                  </div>
                )}
                <h1
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 'clamp(40px, 5.5vw, 72px)',
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    margin: 0,
                    marginBottom: 14,
                    color: 'var(--pv-ink)',
                  }}
                >
                  {item.headline}
                  {item.headline_accent && (
                    <>
                      <br />
                      <span style={{ color: accent }}>{item.headline_accent}</span>
                    </>
                  )}
                </h1>
                {item.body && (
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.45,
                      maxWidth: 420,
                      color: 'var(--pv-muted)',
                      fontWeight: 500,
                      marginBottom: 22,
                      margin: 0,
                    }}
                  >
                    {item.body}
                  </p>
                )}
                {item.cta_label && item.cta_href && (
                  <Link
                    href={item.cta_href}
                    className="pv-btn pv-btn-primary"
                    style={{
                      marginTop: 22,
                      display: 'inline-flex',
                      background: item.side === 'gifts' ? 'var(--pv-ink)' : 'var(--pv-magenta)',
                      boxShadow: item.side === 'gifts' ? '6px 6px 0 var(--pv-cyan)' : '6px 6px 0 var(--pv-ink)',
                    }}
                  >
                    {item.cta_label} →
                  </Link>
                )}
              </div>

              <div
                style={{
                  width: '100%',
                  minHeight: 280,
                  border: '3px solid var(--pv-ink)',
                  boxShadow: item.side === 'gifts' ? '8px 8px 0 var(--pv-cyan)' : '8px 8px 0 var(--pv-ink)',
                  backgroundImage: item.image_url ? `url(${item.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  background: item.image_url ? undefined : 'var(--pv-cream)',
                }}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .pv-split-hero-inner { grid-template-columns: 1fr !important; min-height: auto !important; }
          .pv-split-side { padding: 48px 24px !important; border-right: none !important; }
          .pv-split-side:first-child { border-bottom: 3px solid var(--pv-ink); }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/home/split-hero.tsx
git commit -m "Redesign ch2: split hero component"
```

---

## Task 4: Ticker, WhyCards, Proof, Location, FinalCTA, HowItWorks, FAQ components

Group them in one task (each is small). Commit per file to keep commits readable.

**Files:**
- Create: `components/home/ticker.tsx`
- Create: `components/home/why-cards.tsx`
- Create: `components/home/proof.tsx`
- Create: `components/home/how-it-works.tsx`
- Create: `components/home/faq.tsx`
- Create: `components/home/location.tsx`
- Create: `components/home/final-cta.tsx`

- [ ] **Step 1: Ticker**

Create `components/home/ticker.tsx`:

```tsx
export type TickerItem = { text?: string };

export function Ticker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div
      style={{
        background: 'var(--pv-magenta)',
        color: '#fff',
        borderTop: '3px solid var(--pv-ink)',
        borderBottom: '3px solid var(--pv-ink)',
        overflow: 'hidden',
        padding: '14px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 48,
          fontFamily: 'var(--pv-f-display)',
          fontSize: 20,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          animation: 'pv-ticker-scroll 35s linear infinite',
          letterSpacing: '-0.01em',
        }}
      >
        {doubled.map((it, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
            {it.text}
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                background: 'var(--pv-yellow)',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              }}
            />
          </span>
        ))}
      </div>
      <style>{`
        @keyframes pv-ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: WhyCards**

Create `components/home/why-cards.tsx`:

```tsx
export type WhyItem = { num?: string; title?: string; body?: string };

const NUM_COLORS = ['var(--pv-magenta)', 'var(--pv-cyan)', 'var(--pv-purple)'];

export function WhyCards({
  items,
  label = '01 Why Printvolution',
  title = 'Three reasons',
  title_accent = "we don't suck.",
  intro = "Most printing companies in Singapore treat your file like a transaction — upload, pay, hope for the best. We treat it like a job with your name on it.",
}: {
  items: WhyItem[];
  label?: string;
  title?: string;
  title_accent?: string;
  intro?: string;
}) {
  if (!items.length) return null;
  return (
    <section
      style={{
        background: 'var(--pv-cream)',
        borderTop: '3px solid var(--pv-ink)',
        borderBottom: '3px solid var(--pv-ink)',
        padding: '96px 24px',
      }}
    >
      <div style={{ maxWidth: 1560, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--pv-ink)',
            color: '#fff',
            padding: '6px 14px',
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 24,
          }}
        >
          {label}
        </div>
        <h2
          style={{
            fontFamily: 'var(--pv-f-display)',
            fontSize: 'clamp(40px, 6vw, 80px)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            margin: 0,
            marginBottom: 24,
            color: 'var(--pv-purple)',
            maxWidth: 1100,
          }}
        >
          {title}
          <br />
          <span style={{ color: 'var(--pv-ink)' }}>{title_accent}</span>
        </h2>
        <p
          style={{
            maxWidth: 720,
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--pv-ink-soft)',
            marginBottom: 48,
            fontWeight: 500,
          }}
        >
          {intro}
        </p>
        <div
          className="pv-why-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 28,
          }}
        >
          {items.map((c, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                border: '3px solid var(--pv-ink)',
                boxShadow: '6px 6px 0 var(--pv-ink)',
                padding: 28,
              }}
            >
              {c.num && (
                <div
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 72,
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    marginBottom: 16,
                    color: NUM_COLORS[i % NUM_COLORS.length],
                  }}
                >
                  {c.num}
                </div>
              )}
              {c.title && (
                <h3
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 22,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    marginBottom: 10,
                  }}
                >
                  {c.title}
                </h3>
              )}
              {c.body && (
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--pv-ink-soft)', margin: 0, fontWeight: 500 }}>{c.body}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-why-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 3: Proof**

Create `components/home/proof.tsx`:

```tsx
export type ProofItem =
  | { kind: 'quote'; text?: string; cite?: string }
  | { kind: 'stat'; num?: string; suffix?: string; label?: string };

export function Proof({ items }: { items: ProofItem[] }) {
  if (!items.length) return null;
  const quote = items.find((i) => i.kind === 'quote') as Extract<ProofItem, { kind: 'quote' }> | undefined;
  const stats = items.filter((i): i is Extract<ProofItem, { kind: 'stat' }> => i.kind === 'stat');
  const statColors = ['var(--pv-magenta)', 'var(--pv-cyan)', 'var(--pv-yellow)', 'var(--pv-green)'];

  return (
    <section
      style={{
        background: 'var(--pv-ink)',
        color: '#fff',
        padding: '96px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(236,0,140,0.15) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,174,239,0.12) 0, transparent 40%)',
        }}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
        {quote?.text && (
          <>
            <h2
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(28px, 4vw, 56px)',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                margin: '24px 0',
              }}
            >
              "{quote.text}"
            </h2>
            {quote.cite && (
              <div
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                — {quote.cite}
              </div>
            )}
          </>
        )}
        {stats.length > 0 && (
          <div
            className="pv-proof-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
              gap: 28,
              marginTop: 56,
              paddingTop: 40,
              borderTop: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            {stats.map((s, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 60,
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    color: statColors[i % statColors.length],
                  }}
                >
                  {s.num}
                  {s.suffix && <sup style={{ fontSize: 22 }}>{s.suffix}</sup>}
                </div>
                {s.label && (
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.7)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginTop: 8,
                    }}
                  >
                    {s.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-proof-stats { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 4: HowItWorks**

Create `components/home/how-it-works.tsx`:

```tsx
import Link from 'next/link';

export type HowHeader = {
  headline?: string;
  headline_accent?: string;
  body?: string;
  cta_label?: string;
  cta_href?: string;
};

export type HowStep = {
  num?: string;
  title?: string;
  body?: string;
  time?: string;
};

const STEP_COLORS = ['var(--pv-magenta)', 'var(--pv-cyan)', 'var(--pv-purple)', 'var(--pv-green)'];

export function HowItWorks({ header, steps }: { header: HowHeader | null; steps: HowStep[] }) {
  if (!header && steps.length === 0) return null;
  return (
    <section style={{ padding: '96px 24px' }}>
      <div
        className="pv-how-grid"
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: 64,
          alignItems: 'start',
        }}
      >
        {header && (
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--pv-ink)',
                color: '#fff',
                padding: '6px 14px',
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 24,
              }}
            >
              04 How it works
            </div>
            <h2
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(40px, 6vw, 72px)',
                lineHeight: 0.9,
                letterSpacing: '-0.03em',
                margin: 0,
                marginBottom: 20,
              }}
            >
              {header.headline}{' '}
              {header.headline_accent && (
                <span style={{ color: 'var(--pv-magenta)' }}>{header.headline_accent}</span>
              )}
            </h2>
            {header.body && (
              <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--pv-ink-soft)', marginBottom: 28, fontWeight: 500 }}>
                {header.body}
              </p>
            )}
            {header.cta_label && header.cta_href && (
              <Link href={header.cta_href} className="pv-btn pv-btn-primary">
                {header.cta_label} →
              </Link>
            )}
          </div>
        )}

        {steps.length > 0 && (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
            {steps.map((s, i) => (
              <li
                key={i}
                style={{
                  background: '#fff',
                  border: '3px solid var(--pv-ink)',
                  padding: '22px 24px',
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr auto',
                  gap: 18,
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 40,
                    color: STEP_COLORS[i % STEP_COLORS.length],
                    lineHeight: 1,
                  }}
                >
                  {s.num}
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 20, letterSpacing: '-0.01em', marginBottom: 2 }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--pv-muted)', fontWeight: 500 }}>{s.body}</div>
                </div>
                {s.time && (
                  <span
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      background: 'var(--pv-ink)',
                      color: '#fff',
                      padding: '3px 9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {s.time}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-how-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 5: FAQ**

Create `components/home/faq.tsx`:

```tsx
export type FaqItem = { question?: string; answer?: string };

export function Faq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section
      style={{
        background: 'var(--pv-cream)',
        borderTop: '3px solid var(--pv-ink)',
        padding: '96px 24px',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--pv-ink)',
            color: '#fff',
            padding: '6px 14px',
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 24,
          }}
        >
          05 Questions
        </div>
        <h2
          style={{
            fontFamily: 'var(--pv-f-display)',
            fontSize: 'clamp(40px, 5vw, 64px)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            margin: 0,
            marginBottom: 40,
          }}
        >
          Things people <span style={{ color: 'var(--pv-cyan)' }}>ask us.</span>
        </h2>
        <div style={{ display: 'grid', gap: 14 }}>
          {items.map((f, i) => (
            <details
              key={i}
              className="pv-faq-item"
              style={{
                border: '3px solid var(--pv-ink)',
                background: '#fff',
                boxShadow: '4px 4px 0 var(--pv-ink)',
              }}
            >
              <summary
                style={{
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 20,
                  letterSpacing: '-0.01em',
                  padding: '18px 22px',
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                {f.question}
                <span
                  aria-hidden
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    background: 'var(--pv-magenta)',
                    color: '#fff',
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 22,
                  }}
                >
                  +
                </span>
              </summary>
              <div
                style={{
                  padding: '0 22px 22px',
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'var(--pv-ink-soft)',
                  fontWeight: 500,
                }}
              >
                {f.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
      <style>{`
        .pv-faq-item summary::-webkit-details-marker { display: none; }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 6: Location**

Create `components/home/location.tsx`:

```tsx
export type LocationItem = {
  kind?: string;
  label?: string;
  detail?: string;
  href?: string;
};

export function Location({ items, imageSrc }: { items: LocationItem[]; imageSrc?: string | null }) {
  if (!items.length) return null;
  return (
    <section
      style={{
        padding: '96px 24px',
        borderTop: '3px solid var(--pv-ink)',
      }}
    >
      <div
        className="pv-location-grid"
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--pv-ink)',
              color: '#fff',
              padding: '6px 14px',
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 24,
            }}
          >
            06 Visit Us
          </div>
          <h2
            style={{
              fontFamily: 'var(--pv-f-display)',
              fontSize: 'clamp(34px, 4.5vw, 56px)',
              lineHeight: 0.9,
              letterSpacing: '-0.03em',
              margin: 0,
              marginBottom: 20,
            }}
          >
            Paya Lebar
            <br />
            Square, <span style={{ color: 'var(--pv-magenta)' }}>SG.</span>
          </h2>
          <div style={{ marginTop: 24 }}>
            {items.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr',
                  padding: '12px 0',
                  borderBottom: '2px dashed var(--pv-rule)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    color: 'var(--pv-muted)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  {row.label}
                </span>
                {row.href ? (
                  <a
                    href={row.href}
                    target={row.href.startsWith('http') ? '_blank' : undefined}
                    rel={row.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    style={{ color: 'var(--pv-ink)' }}
                  >
                    {row.detail}
                  </a>
                ) : (
                  <span>{row.detail}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div
          role="img"
          aria-label="Printvolution storefront at Paya Lebar Square"
          style={{
            minHeight: 480,
            border: '3px solid var(--pv-ink)',
            boxShadow: '8px 8px 0 var(--pv-ink)',
            backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            background: imageSrc ? undefined : 'var(--pv-cream)',
          }}
        />
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-location-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 7: FinalCta**

Create `components/home/final-cta.tsx`:

```tsx
import Link from 'next/link';

export type FinalCtaItem = {
  headline?: string;
  headline_accent?: string;
  body?: string;
  cta_label?: string;
  cta_href?: string;
};

export function FinalCta({ item }: { item: FinalCtaItem | null }) {
  if (!item) return null;
  return (
    <section
      style={{
        background: 'var(--pv-magenta)',
        color: '#fff',
        padding: '96px 24px',
        textAlign: 'center',
        borderTop: '3px solid var(--pv-ink)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--pv-f-display)',
          fontSize: 'clamp(44px, 8vw, 104px)',
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          margin: '0 auto 20px',
          maxWidth: 1100,
        }}
      >
        {item.headline}{' '}
        {item.headline_accent && <span style={{ color: 'var(--pv-yellow)' }}>{item.headline_accent}</span>}
      </h2>
      {item.body && (
        <p style={{ fontSize: 18, maxWidth: 560, margin: '0 auto 32px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
          {item.body}
        </p>
      )}
      {item.cta_label && item.cta_href && (
        <Link
          href={item.cta_href}
          className="pv-btn"
          style={{
            background: 'var(--pv-yellow)',
            color: 'var(--pv-ink)',
            fontSize: 16,
            padding: '20px 36px',
          }}
        >
          {item.cta_label} →
        </Link>
      )}
    </section>
  );
}
```

- [ ] **Step 8: Typecheck and commit**

Run: `npx tsc --noEmit`
Expected: clean.

```bash
git add components/home/
git commit -m "Redesign ch2: home section components (ticker, why, proof, how, faq, location, final CTA)"
```

---

## Task 5: Category Tiles (client component)

**Files:**
- Create: `components/home/category-tiles.tsx`

This component needs client-side state for the tab switcher. It receives pre-resolved product data from the server.

- [ ] **Step 1: Create the client component**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export type CategoryTile = {
  slug: string;
  name: string;
  image_url: string | null;
  tagline: string | null;
  min_price_cents: number | null;
  href: string;
  badge?: string | null;
};

export type CategoryTab = {
  tab_key: string;
  tab_label: string;
  tiles: CategoryTile[];
};

function formatSGD(cents: number): string {
  return `S$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function badgeColor(badge: string): string {
  const b = badge.toLowerCase();
  if (b.includes('best')) return 'var(--pv-yellow)';
  if (b.includes('hot')) return 'var(--pv-magenta)';
  if (b.includes('new')) return 'var(--pv-cyan)';
  return 'var(--pv-ink)';
}
function badgeText(badge: string): string {
  const b = badge.toLowerCase();
  if (b.includes('hot') || b.includes('new')) return '#fff';
  if (b.includes('best')) return 'var(--pv-ink)';
  return '#fff';
}

export function CategoryTiles({ tabs }: { tabs: CategoryTab[] }) {
  const visible = tabs.filter((t) => t.tiles.length > 0);
  const [activeKey, setActiveKey] = useState(visible[0]?.tab_key ?? '');
  if (!visible.length) return null;
  const active = visible.find((t) => t.tab_key === activeKey) ?? visible[0];

  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1560, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--pv-ink)',
            color: '#fff',
            padding: '6px 14px',
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 24,
          }}
        >
          02 Product Catalogue
        </div>
        <h2
          style={{
            fontFamily: 'var(--pv-f-display)',
            fontSize: 'clamp(40px, 6vw, 80px)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            margin: 0,
            marginBottom: 24,
          }}
        >
          Everything we <span style={{ color: 'var(--pv-magenta)' }}>make.</span>
        </h2>
        <p style={{ maxWidth: 720, fontSize: 17, lineHeight: 1.55, color: 'var(--pv-ink-soft)', marginBottom: 32, fontWeight: 500 }}>
          From silk-laminated business cards to custom photo mugs — pick a side, pick a product, configure live, order in under 5 minutes.
        </p>

        {visible.length > 1 && (
          <div
            style={{
              display: 'inline-flex',
              background: '#fff',
              border: '2px solid var(--pv-ink)',
              boxShadow: '4px 4px 0 var(--pv-ink)',
              marginBottom: 32,
              padding: 4,
            }}
          >
            {visible.map((t) => {
              const isActive = t.tab_key === active.tab_key;
              return (
                <button
                  key={t.tab_key}
                  type="button"
                  onClick={() => setActiveKey(t.tab_key)}
                  style={{
                    background: isActive ? 'var(--pv-ink)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--pv-ink)',
                    padding: '10px 20px',
                    border: 'none',
                    fontFamily: 'var(--pv-f-body)',
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {t.tab_label}
                  <span
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 10,
                      background: isActive ? 'var(--pv-yellow)' : 'var(--pv-cream)',
                      color: 'var(--pv-ink)',
                      padding: '2px 6px',
                      fontWeight: 600,
                      letterSpacing: 0,
                    }}
                  >
                    {t.tiles.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div
          className="pv-cat-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 18,
          }}
        >
          {active.tiles.map((t) => (
            <Link
              key={t.slug}
              href={t.href}
              className="pv-cat-tile"
              style={{
                background: '#fff',
                border: '3px solid var(--pv-ink)',
                boxShadow: '6px 6px 0 var(--pv-ink)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 360,
                transition: 'transform 0.15s, box-shadow 0.15s',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minHeight: 200,
                  borderBottom: '3px solid var(--pv-ink)',
                  backgroundImage: t.image_url ? `url(${t.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  background: t.image_url ? undefined : 'var(--pv-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--pv-muted)',
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 11,
                }}
              >
                {!t.image_url && t.name}
              </div>
              <div style={{ padding: '18px 20px' }}>
                {t.badge && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '3px 8px',
                      marginBottom: 8,
                      background: badgeColor(t.badge),
                      color: badgeText(t.badge),
                    }}
                  >
                    {t.badge}
                  </span>
                )}
                <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em', margin: 0, marginBottom: 6 }}>
                  {t.name}
                </h3>
                {t.tagline && (
                  <p style={{ fontSize: 13, color: 'var(--pv-muted)', lineHeight: 1.4, margin: 0, marginBottom: 12, fontWeight: 500 }}>
                    {t.tagline}
                  </p>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingTop: 10,
                    borderTop: '2px dashed var(--pv-rule)',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      From
                    </div>
                    <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, color: 'var(--pv-magenta)' }}>
                      {t.min_price_cents != null ? formatSGD(t.min_price_cents) : 'Quote'}
                    </div>
                  </div>
                  <div
                    aria-hidden
                    style={{
                      background: 'var(--pv-ink)',
                      color: '#fff',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}
                  >
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        .pv-cat-tile:hover {
          transform: translate(-4px, -4px);
          box-shadow: 10px 10px 0 var(--pv-ink) !important;
        }
        @media (max-width: 1100px) {
          .pv-cat-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 820px) {
          .pv-cat-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          .pv-cat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/home/category-tiles.tsx
git commit -m "Redesign ch2: category tiles client component (tab switcher)"
```

---

## Task 6: Rewrite `app/(site)/page.tsx`

**Files:**
- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Replace the homepage**

```tsx
import { listProducts } from '@/lib/data/products';
import { getProductRoutes, productHref } from '@/lib/data/navigation';
import { getHomePageContent, homeItems, homeFirst } from '@/lib/data/home';
import { LocalBusinessSchema } from '@/components/seo/json-ld';
import { SplitHero, type SplitHeroItem } from '@/components/home/split-hero';
import { Ticker, type TickerItem } from '@/components/home/ticker';
import { WhyCards, type WhyItem } from '@/components/home/why-cards';
import { CategoryTiles, type CategoryTab } from '@/components/home/category-tiles';
import { Proof, type ProofItem } from '@/components/home/proof';
import { HowItWorks, type HowHeader, type HowStep } from '@/components/home/how-it-works';
import { Faq, type FaqItem } from '@/components/home/faq';
import { Location, type LocationItem } from '@/components/home/location';
import { FinalCta, type FinalCtaItem } from '@/components/home/final-cta';

export const metadata = {
  title: 'Printvolution | Printing Services Singapore · Name Cards, Flyers, Banners & Gifts',
  description:
    'Printing services Singapore at Paya Lebar Square. Name cards from $28, flyers, banners, custom embroidery, personalised gifts, NFC business cards. WhatsApp for instant quote. Same-day express available.',
  alternates: { canonical: 'https://printvolution.sg/' },
};

type CategoryTabSection = {
  tab_key?: string;
  tab_label?: string;
  product_slugs?: string[];
  badges?: Record<string, string>;
};

export default async function HomePage() {
  const [sections, products, routes] = await Promise.all([
    getHomePageContent(),
    listProducts(),
    getProductRoutes(),
  ]);

  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const heroItems = homeItems(sections, 'hero.split') as SplitHeroItem[];
  const tickerItems = homeItems(sections, 'ticker') as TickerItem[];
  const whyItems = homeItems(sections, 'why.cards') as WhyItem[];
  const proofItems = homeItems(sections, 'proof.main') as ProofItem[];
  const howHeader = homeFirst<HowHeader>(sections, 'how.header');
  const howSteps = homeItems(sections, 'how.steps') as HowStep[];
  const faqItems = homeItems(sections, 'faq.items') as FaqItem[];
  const locationItems = homeItems(sections, 'location.main') as LocationItem[];
  const finalCta = homeFirst<FinalCtaItem>(sections, 'final_cta.main');

  const categoryTabs: CategoryTab[] = (homeItems(sections, 'categories.tabs') as CategoryTabSection[]).map((t) => {
    const badges = (t.badges ?? {}) as Record<string, string>;
    const slugs = Array.isArray(t.product_slugs) ? t.product_slugs : [];
    return {
      tab_key: t.tab_key ?? 'default',
      tab_label: t.tab_label ?? 'Products',
      tiles: slugs
        .map((slug) => {
          const p = bySlug.get(slug);
          if (!p) return null;
          return {
            slug: p.slug,
            name: p.name,
            image_url: p.image_url,
            tagline: p.tagline,
            min_price_cents: p.min_price,
            href: productHref(p.slug, routes),
            badge: badges[slug] ?? null,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    };
  });

  return (
    <>
      <LocalBusinessSchema />
      <SplitHero items={heroItems} />
      <Ticker items={tickerItems} />
      <WhyCards items={whyItems} />
      <CategoryTiles tabs={categoryTabs} />
      <Proof items={proofItems} />
      <HowItWorks header={howHeader} steps={howSteps} />
      <Faq items={faqItems} />
      <Location items={locationItems} />
      <FinalCta item={finalCta} />
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add 'app/(site)/page.tsx'
git commit -m "Redesign ch2: rewrite homepage to compose v4 sections"
```

---

## Task 7: FAQ JSON-LD + home sanity check

**Files:**
- Modify: `components/seo/json-ld.tsx` (if it has existing helpers) — add `FAQPageSchema`.
- Modify: `app/(site)/page.tsx` — mount the new schema helper.

- [ ] **Step 1: Inspect existing json-ld helper**

Read `components/seo/json-ld.tsx` and identify the current pattern (likely each helper renders a `<script type="application/ld+json">`). Follow the same pattern.

- [ ] **Step 2: Add FAQPageSchema helper**

Append to `components/seo/json-ld.tsx`:

```tsx
export function FAQPageSchema({ items }: { items: Array<{ question?: string; answer?: string }> }) {
  if (!items.length) return null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items
      .filter((i) => i.question && i.answer)
      .map((i) => ({
        '@type': 'Question',
        name: i.question,
        acceptedAnswer: { '@type': 'Answer', text: i.answer },
      })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

- [ ] **Step 3: Mount on the homepage**

In `app/(site)/page.tsx`, import `FAQPageSchema` and add it right below `<LocalBusinessSchema />`:

```tsx
import { LocalBusinessSchema, FAQPageSchema } from '@/components/seo/json-ld';
...
<LocalBusinessSchema />
<FAQPageSchema items={faqItems} />
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit`
Run: `npm run build`
Expected: no errors, `/` route listed in the build output.

- [ ] **Step 5: Commit**

```bash
git add components/seo/json-ld.tsx 'app/(site)/page.tsx'
git commit -m "Redesign ch2: FAQPage JSON-LD on homepage"
```

---

## Task 8: Admin editor compatibility check

**Files:** (none modified if `PagesCmsEditor` auto-handles unknown keys)

- [ ] **Step 1: Inspect the editor**

Read `components/admin/pages-cms-editor.tsx`. Look for:
- A registry object / switch that enumerates known `page_key:section_key` combinations.
- Whether it renders arbitrary keys generically or requires updates.

- [ ] **Step 2: Register new keys if needed**

If the editor uses a registry, add entries for:
- `home:hero.split`, `home:ticker`, `home:why.cards`, `home:categories.tabs`, `home:proof.main`, `home:how.header`, `home:how.steps`, `home:faq.items`, `home:location.main`, `home:final_cta.main`.

Each entry needs the fields defined in the spec's Section Inventory table so admins can edit them via structured forms rather than raw JSON.

If the editor falls back to raw-JSON editing for unknown keys, skip this step (defer per-field UI to a later cycle).

- [ ] **Step 3: Typecheck + commit (if edits were made)**

Run: `npx tsc --noEmit`

```bash
git add components/admin/pages-cms-editor.tsx
git commit -m "Redesign ch2: register home section keys in admin editor"
```

If no changes, skip the commit.

---

## Self-review checklist (for the implementer)

- [ ] Homepage renders all 10 sections in order.
- [ ] Tabs switch between Print and Gifts; unresolved slugs silently skipped.
- [ ] FAQ `<details>` toggles.
- [ ] Admin round-trip edits reflect on refresh.
- [ ] `npm run build` clean.
- [ ] No new console errors.
- [ ] Mobile layout intact (< 900px).
