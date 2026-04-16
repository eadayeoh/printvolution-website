# Printvolution Web

Next.js 14 + Supabase rewrite of the Printvolution website.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Postgres, Auth, Storage, Realtime)
- **Tailwind CSS** + **shadcn/ui**
- **React Hook Form + Zod** for forms
- **Zustand** for client-side cart state
- **Vercel** for hosting

## Structure

```
/app                Next.js App Router pages
  /(site)           Public routes (Header + Footer layout)
  /admin            Admin dashboard (Phase 5-6)
  /staff            Staff production dashboard (Phase 7)
  /login            Auth (Phase 5)
/components         React components
  /ui               shadcn/ui primitives
  /nav, /footer, /product, /cart, /admin
/lib                Utilities and clients
  /supabase         Browser, server, middleware clients
  cart-store.ts     Zustand store
  pricing.ts        Safe price formula evaluator
  utils.ts          cn(), formatSGD(), slugify()
/supabase           Migrations + seed (Phase 1-2)
/scripts            Data extraction scripts
/types              TypeScript types (database.ts auto-generated)
/public             Static assets
/legacy             Old static HTML site (reference only, not deployed)
```

## Development

```bash
# Install deps
npm install

# Copy env template and fill in Supabase keys
cp .env.local.example .env.local

# Run dev server
npm run dev
```

## Build roadmap

- [x] **Phase 0** — Scaffold + brand design tokens
- [ ] **Phase 1** — Supabase setup + schema migrations
- [ ] **Phase 2** — Extract data from legacy/assets/app.js → seed.sql
- [ ] **Phase 3** — Design system (completed with Phase 0)
- [ ] **Phase 4** — Public pages (homepage, shop, product, cart, checkout)
- [ ] **Phase 5** — Auth + admin shell
- [ ] **Phase 6** — Admin CRUD
- [ ] **Phase 7** — Staff dashboard
- [ ] **Phase 8** — SEO + Lighthouse polish
- [ ] **Phase 9** — Cutover on `printvolution.sg`

## Legacy

The old static HTML site lives in `/legacy/`. It's preserved on the `legacy-static` branch and can be restored if needed. Data extraction scripts in `/scripts` read from `/legacy/assets/app.js` during Phase 2.

## Brand

- **Primary:** `#E91E8C` (pink)
- **Ink:** `#0D0D0D` / `#1a1a1a`
- **Accents:** `#FFD100` (yellow), `#00B8D9` (cyan)
- **Fonts:** Plus Jakarta Sans (sans), Fraunces (serif)
