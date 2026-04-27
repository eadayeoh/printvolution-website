# Round 1 — Sentry + transactional email coverage

**Status:** draft → awaiting review
**Date:** 2026-04-28
**Scope:** Foundation work before Round 2 (conversion features). Adds production error visibility and closes the gap on customer-facing transactional emails.

---

## Goals

1. **Sentry** — catch unhandled errors and slow requests in production. Today, a 500 disappears unless the user reports it.
2. **Transactional emails** — fill four missing customer touchpoints on top of the existing `lib/email.ts` Resend wrapper:
   - **Welcome** after signup
   - **Order shipped / out for delivery** with tracking
   - **Branded password reset** (replace Supabase's generic template)
   - **Refund / cancellation receipt** with $ amount

## Non-goals

- Marketing email, broadcasts, or list management — Resend is for transactional only.
- Abandoned-cart email — that belongs to Round 2 (#4).
- Email A/B testing infra — overkill at current volume.
- Sentry session replay (PII risk for an order-photo flow; can be added later behind a flag).
- Sentry Performance / Tracing on every route — start with errors only, add tracing for `/checkout` and `/api/admin/orders/*` in a later round if useful.

---

## Part 1: Sentry

### Decision summary

| | Choice | Why |
|---|---|---|
| Plan | Sentry SaaS, free tier (5K errors/mo, 10K perf events) | Site is pre-launch; volume is tiny. Upgrade later. |
| SDK | `@sentry/nextjs` | First-party, wraps client + server + edge in one install. |
| Source maps | Uploaded via Sentry Webpack plugin during `next build` on Vercel | Required to get readable stack traces. Needs `SENTRY_AUTH_TOKEN` build-time secret. |
| Replay | **off** | Records DOM mutations including customer photos / addresses. Re-evaluate after launch. |
| Tracing sample rate | `0.0` for now | Can flip to `0.1` later. Errors only this round. |
| PII | `sendDefaultPii: false`, plus a `beforeSend` hook that scrubs `customer_email`, `delivery_address`, `order_number` from event extras | Order data must not leak to a third-party error tracker. |
| User context | Set Supabase user `id` only (UUID), never email/name | Lets us see "this user hit X errors" without identifying them. |
| CSP | Add `https://*.sentry.io` and `https://*.ingest.sentry.io` to `connect-src` in `next.config.js` | Otherwise the in-browser SDK is blocked by our hardened CSP. |
| Where it runs | Server runtime + Edge runtime + Browser. Skip during `next dev` (gated on `process.env.VERCEL_ENV === 'production' \|\| === 'preview'`) | Local dev errors are fine on the terminal. Don't waste quota. |

### Files added / changed

```
sentry.client.config.ts          NEW — browser SDK init, scrubbing, sampling
sentry.server.config.ts          NEW — Node runtime SDK init
sentry.edge.config.ts            NEW — Edge runtime SDK init (middleware / edge routes)
instrumentation.ts               NEW — Next.js entrypoint that loads server/edge config
next.config.js                   wrap with withSentryConfig(...); add CSP hosts
.env.local.example               document NEXT_PUBLIC_SENTRY_DSN + SENTRY_AUTH_TOKEN
lib/observability.ts             NEW — captureException(err, ctx) helper, ctx is allowlisted keys only
```

### Helper interface

```ts
// lib/observability.ts
export function reportError(err: unknown, ctx?: {
  route?: string;
  action?: string;
  order_id?: string;     // UUID, not order_number
  user_id?: string;      // Supabase auth uid
  extras?: Record<string, string | number | boolean | null>;
}): void;
```

Why a helper: forces every call site to think about what context is safe to send. `extras` is intentionally typed to scalars only — no `payload`, no `email`, no `body` slipping in.

### Where to actually call it

Initially wire into the highest-leverage spots — don't sprinkle:

- `app/(site)/checkout/actions.ts` — wrap the order-creation try/catch, drop `order_id` + `route: 'checkout'`
- `app/admin/orders/actions.ts` — wrap status-change + admin mutations
- `app/api/webhooks/*/route.ts` — every webhook handler (HitPay payment confirms etc)
- `app/api/cron/*/route.ts` — every cron route
- The unhandled-rejection / uncaught-exception path is auto-captured by the SDK; helpers are for places where we want explicit context.

### Verification

- After deploy, hit `/api/admin/_sentry-test` (a route guarded by admin auth that throws on purpose) → confirm event lands in Sentry within 60 s
- Tear down the test route once verified

---

## Part 2: Transactional emails (4 new templates)

All four follow the existing pattern in `lib/email.ts` — pure functions returning `{ subject, html }`, sent through `sendEmail()`. The shell + brand colours are reused.

### 2.1 Welcome (after signup)

**Trigger:** Inside `signUpWithPassword` in `app/(site)/account/actions.ts`, after Supabase returns success. Fire-and-forget (do not block signup on Resend latency).

**Subject:** "Welcome to Printvolution, {first_name}"

**Body:** 1-line warm welcome, then 3-icon row:
- Track every order from your account
- Reorder past jobs in 2 clicks
- Earn points on every order *(forward-compatible with #16 loyalty; if loyalty isn't live, copy still reads fine)*

**CTA:** "Browse the shop →" (links to `/shop`)

**De-dup:** signup action only runs once per address; no extra dedup needed.

### 2.2 Order shipped (with tracking)

**Schema change required:** add to `orders` table:
- `tracking_number text`
- `tracking_url text` (denormalised — admin can paste full courier URL or we synthesise from courier slug)
- `shipped_at timestamptz`

**Migration file:** `supabase/migrations/00XX_order_tracking.sql` (next available number).

**Trigger:** When admin sets `status = 'shipped'` in `app/admin/orders/actions.ts`. Status is currently `text` with a check constraint `('pending','processing','ready','completed','cancelled')` (verified at `supabase/migrations/0001_init.sql:200`). Adding `'shipped'` means dropping and re-adding that check constraint inside the migration. Existing `orderStatusEmail` handles status changes generically; we'll override the `shipped` case with a richer template that pulls tracking fields.

**Subject:** "Your Printvolution order is on the way — {order_number}"

**Body:** "Order shipped on {date}. Track it here." Big tracking-number pill, "Track shipment →" button (links to `tracking_url` if present, else `/track?order={order_number}`).

**Admin UI:** In the order detail page, when status is changed to `shipped`, show two new fields (tracking #, tracking URL). Required only when status = `shipped`.

### 2.3 Branded password reset

**Trigger:** Supabase Auth's password-reset-email hook (`auth.email_change_email_template`). Two options:

- **Option A (chosen):** Override Supabase's default email template via the Supabase dashboard → Auth → Email Templates → "Reset Password". Paste our branded HTML, leaving the `{{ .ConfirmationURL }}` token in place. **No app code change.**
- Option B: Disable Supabase's email and call `resend.emails.send` from a custom server action. More work, more failure modes (we now own retry, deliverability). Skip.

**Spec deliverable:** Generate the branded HTML in `lib/email.ts` as `passwordResetEmailTemplate()` (returning HTML with `{{ .ConfirmationURL }}` left raw), output it to a one-off scratch file `scripts/print-supabase-templates.mjs` for paste-into-dashboard. Document the dashboard step in the migration notes.

**Subject (set in dashboard):** "Reset your Printvolution password"

### 2.4 Refund / cancellation receipt

**Trigger:** When admin sets status to `cancelled`. Today this sends a generic "your order is cancelled" — extend it to include the refund amount and method.

**Schema change:** add to `orders`:
- `refund_cents int4 default 0`
- `refunded_at timestamptz`
- `refund_note text`

**Same migration file as 2.2.**

**Admin UI:** When status changes to `cancelled`, show "Refund amount" (default = `total_cents`), "Refund note" (free text, optional, e.g. "deposit retained for design work").

**Subject:** "Order {order_number} cancelled — refund {SGD}"

**Body:** Confirms cancellation, line "Refund of {SGD} {amount} processed via {payment_method}", optional refund note, plus "If anything's off, reply within 7 days" line that already exists.

**Why this is a separate template, not a tweak:** the `orderStatusEmail` is generic (no money in it). Cancellations specifically need the customer to see the $ amount in writing — that's the most-disputed touchpoint.

---

## Order status enum migration

Combining the changes for emails 2.2 + 2.4 into one migration. Next available number is **`0068`**.

```sql
-- 0068_order_tracking_and_refund.sql
alter table orders
  add column if not exists tracking_number text,
  add column if not exists tracking_url    text,
  add column if not exists shipped_at      timestamptz,
  add column if not exists refund_cents    int4 default 0,
  add column if not exists refunded_at     timestamptz,
  add column if not exists refund_note     text;

-- Extend the status check constraint to allow 'shipped'.
alter table orders drop constraint if exists orders_status_check;
alter table orders add  constraint orders_status_check
  check (status in ('pending','processing','ready','shipped','completed','cancelled'));
```

The constraint name `orders_status_check` is Postgres' default for an inline check on a column called `status`. The plan step that runs this migration must verify the actual constraint name with `\d orders` first and adjust if Supabase named it differently.

---

## Testing strategy

Per CLAUDE.md feedback: prefer surgical patches; live site is `noindex`. So no full test suite — verification is:

- **Sentry**: hit the throw-route, confirm event lands. Then remove the route.
- **Welcome**: sign up a test account at `dev+welcome@printvolution.sg`, confirm receipt.
- **Shipped**: place a test order, set to `shipped` with a fake tracking number, confirm email.
- **Password reset**: trigger reset, confirm branded template renders.
- **Refund/cancel**: place a test order, cancel with a refund amount, confirm email shows $ amount.

Each verified manually via Resend's "Logs" tab in their dashboard.

---

## Risks / open issues

1. **CSP collision** — adding Sentry hosts to `connect-src` is fine, but if anyone proxies through a custom subdomain (`o0.ingest.de.sentry.io` etc) we may need `*.sentry.io` rather than the specific ingest host. Will use the wildcard.
2. **Resend deliverability** — `EMAIL_FROM` uses `orders@printvolution.sg`. Need to confirm SPF/DKIM are set up on the domain before launch (this is a launch checklist item, not part of this round, but flagged here so we don't ship the new templates and have them all spam-foldered).
3. **Supabase template override is dashboard-only** — there's no migration file capturing it. Will document in `docs/operational-runbook.md` (or create one if it doesn't exist) so it's not lost if the project moves projects.
4. **Status enum** — assumed `status text`. If it's actually a Postgres enum, the migration grows by an `ALTER TYPE … ADD VALUE 'shipped'`. Will verify and adjust.

---

## Out of scope for Round 1, queued for follow-up

- Sentry release tracking (tie deploy SHA → release in Sentry) — nice but not blocking
- Email open / click tracking via Resend — comes for free, just not analysed yet
- Per-customer email preferences page (`/account/notifications`) — needed once we add Round 2 abandoned-cart, defer to that round
