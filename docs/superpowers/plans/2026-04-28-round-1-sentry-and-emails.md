# Round 1 — Sentry + transactional emails — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sentry error tracking (errors only, PII-scrubbed) and four new transactional emails (welcome, shipped, branded password reset, refund/cancel) on top of the existing Resend wrapper.

**Architecture:** Sentry installs as `@sentry/nextjs` with three runtime configs and an `instrumentation.ts` entrypoint, gated to preview + production. A thin `lib/observability.ts` helper enforces PII allowlisting on every explicit `reportError` call. Email work extends the existing `lib/email.ts` (Resend) with 4 new template functions, plus one `0068` migration adding tracking + refund columns and extending the order-status check constraint.

**Tech Stack:** Next.js 14 (App Router), Vercel, Supabase Postgres, Resend (already wired), `@sentry/nextjs` (new). No test framework in this repo — verification is manual via Sentry / Resend dashboards, per spec section "Testing strategy".

**Spec:** `docs/superpowers/specs/2026-04-28-round-1-sentry-and-emails-design.md`

---

## File Structure (locked decisions)

| File | Status | Responsibility |
|---|---|---|
| `sentry.client.config.ts` | new | Browser SDK init, sampling, `beforeSend` PII scrub |
| `sentry.server.config.ts` | new | Node-runtime SDK init |
| `sentry.edge.config.ts` | new | Edge-runtime SDK init |
| `instrumentation.ts` | new | Next 14 entrypoint that imports server / edge config |
| `lib/observability.ts` | new | `reportError(err, ctx)` helper with allowlisted ctx keys |
| `app/api/admin/_sentry-test/route.ts` | new (then deleted) | One-shot verification route |
| `next.config.js` | modify | Wrap with `withSentryConfig`; add Sentry hosts to CSP |
| `.env.local.example` | modify | Document `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` |
| `app/(site)/checkout/actions.ts` | modify | Call `reportError` in error catch around order creation |
| `app/admin/orders/actions.ts` | modify | Call `reportError`; accept tracking + refund fields; pick the right email per status change |
| `app/api/webhooks/hitpay/route.ts` | modify | Call `reportError` in catch |
| `app/api/cron/gift-purge/route.ts` | modify | Call `reportError` in catch |
| `supabase/migrations/0068_order_tracking_and_refund.sql` | new | Add tracking_*, refund_*, shipped_at columns; extend status check |
| `lib/email.ts` | modify | Add `welcomeEmail()`, `orderShippedEmail()`, `orderRefundedEmail()`, `passwordResetEmailHtml` constant |
| `app/(site)/account/actions.ts` | modify | Fire-and-forget welcome email after `signUp` success |
| `components/admin/order-status-updater.tsx` | modify | Add `shipped` to options; prompt for tracking on `shipped` and refund fields on `cancelled` |
| `scripts/print-supabase-templates.mjs` | new | One-off: prints branded password-reset HTML for paste-into-dashboard |

---

## Task 1: Install `@sentry/nextjs` and create runtime configs

**Files:**
- Install: `@sentry/nextjs`
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Create: `instrumentation.ts`
- Modify: `.env.local.example`

- [ ] **Step 1.1: Install the SDK**

```bash
npm install @sentry/nextjs@^9
```

Expected: package.json gains `@sentry/nextjs`. Lockfile updates. No errors.

- [ ] **Step 1.2: Create `sentry.client.config.ts`**

```ts
// sentry.client.config.ts — browser runtime
import * as Sentry from '@sentry/nextjs';

const env = process.env.VERCEL_ENV; // 'production' | 'preview' | 'development' | undefined
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && (env === 'production' || env === 'preview')) {
  Sentry.init({
    dsn,
    environment: env,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0,           // tracing off this round
    replaysSessionSampleRate: 0,   // replay off — PII risk
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event) {
      return scrub(event);
    },
  });
}

// Strip known-sensitive keys regardless of where they came from.
function scrub(event: Sentry.Event): Sentry.Event {
  const blocked = new Set([
    'customer_email', 'email', 'delivery_address', 'address',
    'phone', 'order_number', 'password', 'password_hash',
  ]);
  const walk = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(walk);
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = blocked.has(k.toLowerCase()) ? '[redacted]' : walk(v);
    }
    return out;
  };
  if (event.extra)   event.extra   = walk(event.extra);
  if (event.contexts) event.contexts = walk(event.contexts);
  if (event.request?.data) event.request.data = walk(event.request.data);
  // Always wipe user identifying fields beyond the UUID.
  if (event.user) event.user = { id: event.user.id };
  return event;
}
```

- [ ] **Step 1.3: Create `sentry.server.config.ts`**

```ts
// sentry.server.config.ts — Node runtime
import * as Sentry from '@sentry/nextjs';

const env = process.env.VERCEL_ENV;
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && (env === 'production' || env === 'preview')) {
  Sentry.init({
    dsn,
    environment: env,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event) {
      return scrub(event);
    },
  });
}

function scrub(event: Sentry.Event): Sentry.Event {
  const blocked = new Set([
    'customer_email', 'email', 'delivery_address', 'address',
    'phone', 'order_number', 'password', 'password_hash',
    'service_role_key', 'authorization',
  ]);
  const walk = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(walk);
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = blocked.has(k.toLowerCase()) ? '[redacted]' : walk(v);
    }
    return out;
  };
  if (event.extra)   event.extra   = walk(event.extra);
  if (event.contexts) event.contexts = walk(event.contexts);
  if (event.request?.data)    event.request.data = walk(event.request.data);
  if (event.request?.headers) event.request.headers = walk(event.request.headers);
  if (event.user) event.user = { id: event.user.id };
  return event;
}
```

- [ ] **Step 1.4: Create `sentry.edge.config.ts`**

```ts
// sentry.edge.config.ts — Edge runtime (middleware, edge routes)
import * as Sentry from '@sentry/nextjs';

const env = process.env.VERCEL_ENV;
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && (env === 'production' || env === 'preview')) {
  Sentry.init({
    dsn,
    environment: env,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}
```

- [ ] **Step 1.5: Create `instrumentation.ts`**

```ts
// instrumentation.ts — Next.js 14 server entrypoint
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
```

- [ ] **Step 1.6: Document env vars in `.env.local.example`**

Append to the file:

```
# Sentry error tracking — only fires in Vercel preview + production.
# DSN is from https://sentry.io → Project Settings → Client Keys (DSN)
# Without these the SDK no-ops; the app still works.
# NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxx@oXXXX.ingest.sentry.io/YYYY
# SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxx     # build-time, for source map upload
# SENTRY_ORG=printvolution
# SENTRY_PROJECT=printvolution-web
```

- [ ] **Step 1.7: Verify `next build` still passes locally**

```bash
npm run build
```

Expected: build completes. Sentry isn't wrapped yet, but the new TS files must compile.

- [ ] **Step 1.8: Commit**

```bash
git add package.json package-lock.json sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts instrumentation.ts .env.local.example
git commit -m "Sentry: install SDK + runtime configs (not yet wrapped)"
git push origin HEAD
```

---

## Task 2: Wrap next.config.js with Sentry and extend CSP

**Files:**
- Modify: `next.config.js`

- [ ] **Step 2.1: Add Sentry hosts to the CSP `connect-src` directive**

In `next.config.js`, find the line:

```js
`connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.hit-pay.com https://api.sandbox.hit-pay.com`,
```

Replace with:

```js
`connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.hit-pay.com https://api.sandbox.hit-pay.com https://*.sentry.io https://*.ingest.sentry.io`,
```

- [ ] **Step 2.2: Wrap the export with `withSentryConfig`**

At the top of `next.config.js`, after the `nextConfig` object:

```js
const { withSentryConfig } = require('@sentry/nextjs');
```

Replace the bottom `module.exports = nextConfig;` with:

```js
module.exports = withSentryConfig(nextConfig, {
  // Build-time options — only run when a token is present.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Don't upload source maps in dev — only when token + project are set.
  disableLogger: true,
  hideSourceMaps: true,           // remove .map files from public output
  widenClientFileUpload: true,    // upload all client-side maps
  tunnelRoute: undefined,         // not using a tunnel — CSP allows direct sentry.io
});
```

- [ ] **Step 2.3: Verify `next build` still passes**

```bash
npm run build
```

Expected: build completes. Without `SENTRY_AUTH_TOKEN` set, Sentry's webpack plugin warns about no auth token but does not fail the build (`silent: !process.env.CI`).

- [ ] **Step 2.4: Commit**

```bash
git add next.config.js
git commit -m "Sentry: wrap next.config.js + extend CSP for sentry.io"
git push origin HEAD
```

---

## Task 3: Create observability helper + one-shot verification route

**Files:**
- Create: `lib/observability.ts`
- Create: `app/api/admin/_sentry-test/route.ts`

- [ ] **Step 3.1: Create `lib/observability.ts`**

```ts
// lib/observability.ts — wrapper around Sentry.captureException with PII allowlisting.
import 'server-only';
import * as Sentry from '@sentry/nextjs';

type ReportContext = {
  route?: string;          // e.g. 'checkout' | 'admin.orders.update_status'
  action?: string;         // sub-action within a route
  order_id?: string;       // UUID, NOT order_number
  user_id?: string;        // Supabase auth.users.id (UUID)
  extras?: Record<string, string | number | boolean | null>;
};

export function reportError(err: unknown, ctx: ReportContext = {}): void {
  // No-op in dev / when SDK didn't init.
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error('[reportError]', ctx.route ?? '?', err);
    return;
  }
  try {
    Sentry.withScope((scope) => {
      if (ctx.route)    scope.setTag('route', ctx.route);
      if (ctx.action)   scope.setTag('action', ctx.action);
      if (ctx.order_id) scope.setTag('order_id', ctx.order_id);
      if (ctx.user_id)  scope.setUser({ id: ctx.user_id });
      if (ctx.extras) {
        for (const [k, v] of Object.entries(ctx.extras)) {
          scope.setExtra(k, v);
        }
      }
      Sentry.captureException(err);
    });
  } catch {
    // Sentry must never break the request path.
  }
}
```

- [ ] **Step 3.2: Create the admin-only verification route**

```ts
// app/api/admin/_sentry-test/route.ts — TEMPORARY. Delete after verifying.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  try { await requireAdmin(); } catch (e: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Throw inside a server route so Sentry catches it via auto-instrumentation.
  throw new Error('Sentry verification: this should appear in the dashboard.');
  // unreachable
  // eslint-disable-next-line
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3.3: Verify build passes**

```bash
npm run build
```

Expected: build completes.

- [ ] **Step 3.4: Commit + push (so Vercel deploys it)**

```bash
git add lib/observability.ts app/api/admin/_sentry-test/route.ts
git commit -m "Sentry: observability helper + admin-only verification route"
git push origin HEAD
```

- [ ] **Step 3.5: MANUAL — set Vercel env vars + trigger verification**

Once `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` are added to Vercel's project env (Production + Preview scopes), the next deploy will wire Sentry. Then:

1. Wait for Vercel deploy to finish.
2. As an admin, hit `https://printvolution.vercel.app/api/admin/_sentry-test`.
3. Open Sentry → Issues → confirm the "Sentry verification" event arrives within 60 s.

If event does NOT arrive within 60 s: check Vercel deploy logs for "Sentry CLI" output, check that `NEXT_PUBLIC_SENTRY_DSN` is set in the Production scope (not just Preview), and confirm the deploy has the env vars (Vercel needs a redeploy after adding env vars).

- [ ] **Step 3.6: Delete the verification route**

```bash
rm app/api/admin/_sentry-test/route.ts
git add -A app/api/admin/_sentry-test/route.ts
git commit -m "Sentry: remove verification route"
git push origin HEAD
```

---

## Task 4: Wire `reportError` into the four high-leverage paths

**Files:**
- Modify: `app/(site)/checkout/actions.ts`
- Modify: `app/admin/orders/actions.ts`
- Modify: `app/api/webhooks/hitpay/route.ts`
- Modify: `app/api/cron/gift-purge/route.ts`

- [ ] **Step 4.1: Wire into checkout action**

In `app/(site)/checkout/actions.ts`, find the top-level `try / catch` around order creation (the function that posts to Supabase and returns `{ ok, order_id, ... }`). At the top of the file add:

```ts
import { reportError } from '@/lib/observability';
```

Inside every `catch (e)` block in that file, add:

```ts
reportError(e, { route: 'checkout', action: '<the action name>' });
```

Pick `action` per catch: e.g. `'create_order'`, `'send_emails'`, `'verify_captcha'`. Keep the existing `console.error` lines — Sentry is additive, not a replacement.

- [ ] **Step 4.2: Wire into admin orders action**

In `app/admin/orders/actions.ts`, add at the top:

```ts
import { reportError } from '@/lib/observability';
```

Inside the `void (async () => { try { ... } catch (e) { console.error('[status email] failed'); } })()` block (around line 36), change the catch:

```ts
} catch (e) {
  console.error('[status email] failed');
  reportError(e, { route: 'admin.orders.status_email', order_id: orderId });
}
```

Add `reportError` to any other `catch` blocks in this file using `route: 'admin.orders.<action>'` and `order_id` when available.

- [ ] **Step 4.3: Wire into HitPay webhook**

In `app/api/webhooks/hitpay/route.ts`, add at the top:

```ts
import { reportError } from '@/lib/observability';
```

Wrap the handler body in a `try / catch` (or extend the existing one) so that any thrown error calls:

```ts
reportError(e, { route: 'webhook.hitpay', action: '<best-guess action name>' });
```

Then re-throw or return a 500 response so HitPay retries — do NOT swallow the error after reporting.

- [ ] **Step 4.4: Wire into gift-purge cron**

In `app/api/cron/gift-purge/route.ts`, add at the top:

```ts
import { reportError } from '@/lib/observability';
```

Wrap the cron body's main `try / catch` to call:

```ts
reportError(e, { route: 'cron.gift-purge' });
```

- [ ] **Step 4.5: Verify build passes**

```bash
npm run build
```

Expected: build completes, no TypeScript errors.

- [ ] **Step 4.6: Commit**

```bash
git add 'app/(site)/checkout/actions.ts' app/admin/orders/actions.ts app/api/webhooks/hitpay/route.ts app/api/cron/gift-purge/route.ts
git commit -m "Sentry: wire reportError into checkout, admin orders, hitpay webhook, gift-purge cron"
git push origin HEAD
```

---

## Task 5: Apply migration `0068_order_tracking_and_refund.sql`

**Files:**
- Create: `supabase/migrations/0068_order_tracking_and_refund.sql`

- [ ] **Step 5.1: Verify the constraint name first**

Per CLAUDE.md "Refresh pvpricelist before pricing work" — same principle: confirm DB state before DDL. Run:

```bash
psql "$DATABASE_URL" -c "\d orders" | grep -i 'check'
```

(If `psql` isn't installed locally, use Supabase Studio → SQL Editor → run `select conname from pg_constraint where conrelid = 'public.orders'::regclass and contype = 'c';`)

Expected: a row like `"orders_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'ready'::text, 'completed'::text, 'cancelled'::text]))`.

If the constraint name is NOT `orders_status_check`, substitute the actual name in step 5.2.

- [ ] **Step 5.2: Create the migration file**

```sql
-- supabase/migrations/0068_order_tracking_and_refund.sql
-- Adds tracking + refund columns and extends the order status check
-- to include 'shipped'. Round 1 of the launch checklist.

alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists tracking_url    text,
  add column if not exists shipped_at      timestamptz,
  add column if not exists refund_cents    int4 default 0,
  add column if not exists refunded_at     timestamptz,
  add column if not exists refund_note     text;

-- Extend the status check constraint to allow 'shipped'.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add  constraint orders_status_check
  check (status in ('pending','processing','ready','shipped','completed','cancelled'));
```

- [ ] **Step 5.3: Apply the migration**

```bash
node scripts/apply-migration.mjs 0068
```

Expected: "Applied 0068_order_tracking_and_refund.sql" or equivalent success line, exit 0.

- [ ] **Step 5.4: Verify columns + constraint**

```bash
psql "$DATABASE_URL" -c "\d orders" | grep -E 'tracking|refund|shipped|status'
```

Expected: see the 6 new columns and the updated check constraint listing `'shipped'`.

- [ ] **Step 5.5: Commit**

```bash
git add supabase/migrations/0068_order_tracking_and_refund.sql
git commit -m "DB: 0068 — order tracking + refund columns; extend status to allow 'shipped'"
git push origin HEAD
```

---

## Task 6: Welcome email after signup

**Files:**
- Modify: `lib/email.ts`
- Modify: `app/(site)/account/actions.ts`

- [ ] **Step 6.1: Add `welcomeEmail()` to `lib/email.ts`**

Append to the bottom of `lib/email.ts`:

```ts
export function welcomeEmail(email: string, name: string | null): { subject: string; html: string } {
  const first = (name ?? '').trim().split(/\s+/)[0] || 'there';
  const subject = `Welcome to Printvolution, ${first}`;
  const body = `
    <h1 style="font-size:26px;font-weight:900;letter-spacing:-0.02em;margin:0 0 8px;color:${BRAND_INK};">
      Welcome, ${escapeHtml(first)}.
    </h1>
    <p style="font-size:14px;color:#555;margin:0 0 20px;line-height:1.6;">
      Your account is live. Here's what it does for you:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:${BRAND_INK};">
          <strong style="color:${BRAND_PINK};">Track every order</strong> — see status from production to delivery, no email-digging.
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:${BRAND_INK};">
          <strong style="color:${BRAND_PINK};">Reorder in 2 clicks</strong> — past jobs are saved with the same files + specs.
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-size:13px;color:${BRAND_INK};">
          <strong style="color:${BRAND_PINK};">Earn points on every order</strong> — building this now; your past orders count.
        </td>
      </tr>
    </table>
    <a href="https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'printvolution.sg'}/shop" style="display:inline-block;background:${BRAND_PINK};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:800;font-size:13px;letter-spacing:0.3px;">
      Browse the shop →
    </a>
  `;
  return { subject, html: shell(subject, body) };
}
```

- [ ] **Step 6.2: Wire welcome email into signup (fire-and-forget)**

In `app/(site)/account/actions.ts`, find the `signUpWithPassword` function. After:

```ts
  if (error) {
    return { ok: false as const, error: 'Could not create account' };
  }
  return { ok: true as const };
```

Replace with:

```ts
  if (error) {
    return { ok: false as const, error: 'Could not create account' };
  }

  // Fire-and-forget welcome email — never block signup on Resend latency.
  void (async () => {
    try {
      const { sendEmail, welcomeEmail } = await import('@/lib/email');
      const m = welcomeEmail(email, name);
      await sendEmail({ to: email, subject: m.subject, html: m.html });
    } catch (e) {
      const { reportError } = await import('@/lib/observability');
      reportError(e, { route: 'account.signup', action: 'welcome_email' });
    }
  })();

  return { ok: true as const };
```

- [ ] **Step 6.3: Verify build passes**

```bash
npm run build
```

Expected: build completes.

- [ ] **Step 6.4: Commit**

```bash
git add lib/email.ts 'app/(site)/account/actions.ts'
git commit -m "Email: welcome email after signup (fire-and-forget)"
git push origin HEAD
```

- [ ] **Step 6.5: MANUAL — verify on prod**

After Vercel deploys, sign up at `https://printvolution.vercel.app/account/signup` with a real test address (e.g. `dev+welcome@printvolution.sg`). In Resend dashboard → Logs, confirm the welcome email was sent with subject `Welcome to Printvolution, dev`.

---

## Task 7: Order shipped email + admin tracking input

**Files:**
- Modify: `lib/email.ts`
- Modify: `app/admin/orders/actions.ts`
- Modify: `components/admin/order-status-updater.tsx`

- [ ] **Step 7.1: Add `orderShippedEmail()` to `lib/email.ts`**

Append below the existing `orderStatusEmail`:

```ts
export type ShippedEmailPayload = {
  order_number: string;
  customer_name: string;
  tracking_number: string | null;
  tracking_url: string | null;
};

export function orderShippedEmail(p: ShippedEmailPayload): { subject: string; html: string } {
  const first = p.customer_name.split(/\s+/)[0] || 'there';
  const subject = `Your Printvolution order is on the way — ${p.order_number}`;
  const trackingUrl = p.tracking_url
    || `https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'printvolution.sg'}/track?order=${encodeURIComponent(p.order_number)}`;
  const trackingPill = p.tracking_number
    ? `<div style="display:inline-block;background:#fafaf7;border:1px dashed #ccc;border-radius:8px;padding:10px 14px;font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:${BRAND_INK};margin:12px 0;">
         ${escapeHtml(p.tracking_number)}
       </div>`
    : '';
  const body = `
    <h1 style="font-size:24px;font-weight:900;letter-spacing:-0.02em;margin:0 0 8px;color:${BRAND_INK};">
      Hi ${escapeHtml(first)} — your order is on the way.
    </h1>
    <p style="font-size:14px;color:#555;margin:0 0 12px;">
      Order <strong>${escapeHtml(p.order_number)}</strong> shipped today.
    </p>
    ${trackingPill}
    <div>
      <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:${BRAND_PINK};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:800;font-size:13px;letter-spacing:0.3px;margin-top:8px;">
        Track shipment →
      </a>
    </div>
    <p style="font-size:12px;color:#888;margin:18px 0 0;line-height:1.6;">
      If anything's off, reply to this email or WhatsApp ${escapeHtml(SITE.whatsappDisplay)}.
    </p>
  `;
  return { subject, html: shell(subject, body) };
}
```

- [ ] **Step 7.2: Update `OrderStatusUpdater` component**

Replace the entire body of `components/admin/order-status-updater.tsx` with:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus, deleteOrder } from '@/app/admin/orders/actions';
import { useRouter } from 'next/navigation';

const STATUSES = ['pending', 'processing', 'ready', 'shipped', 'completed', 'cancelled'];

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);

  // Inputs that show conditionally on shipped / cancelled.
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [refundCents, setRefundCents] = useState('');
  const [refundNote, setRefundNote] = useState('');

  const [pendingNewStatus, setPendingNewStatus] = useState<string | null>(null);

  function onSelect(newStatus: string) {
    setError(null);
    if (newStatus === 'shipped' || newStatus === 'cancelled') {
      // Don't apply yet — show the inline form first.
      setPendingNewStatus(newStatus);
      return;
    }
    apply(newStatus, {});
  }

  function apply(newStatus: string, extras: { tracking_number?: string; tracking_url?: string; refund_cents?: number; refund_note?: string }) {
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus, extras);
      if (!result.ok) {
        setError(result.error ?? 'Failed');
        setStatus(currentStatus);
      } else {
        setPendingNewStatus(null);
        router.refresh();
      }
    });
  }

  function confirmShipped() {
    if (!trackingNumber.trim()) { setError('Tracking number required'); return; }
    apply('shipped', { tracking_number: trackingNumber.trim(), tracking_url: trackingUrl.trim() || undefined });
  }

  function confirmCancelled() {
    const cents = Math.round(Number(refundCents) * 100);
    if (!Number.isFinite(cents) || cents < 0) { setError('Refund amount must be 0 or more'); return; }
    apply('cancelled', { refund_cents: cents, refund_note: refundNote.trim() || undefined });
  }

  function handleDelete() {
    if (!confirm('Delete this order permanently? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (result.ok) { router.push('/admin/orders'); router.refresh(); }
      else setError(result.error ?? 'Failed');
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <select
          value={pendingNewStatus ?? status}
          onChange={(e) => onSelect(e.target.value)}
          disabled={isPending}
          className="rounded border-2 border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold focus:border-pink focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
        {error && <span className="text-[11px] text-red-600">{error}</span>}
      </div>

      {pendingNewStatus === 'shipped' && (
        <div className="rounded border-2 border-neutral-200 bg-neutral-50 p-3 flex flex-col gap-2 max-w-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Mark as shipped</div>
          <input
            type="text" placeholder="Tracking number" value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <input
            type="url" placeholder="Tracking URL (optional)" value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <button onClick={confirmShipped} disabled={isPending} className="rounded bg-pink px-3 py-1 text-xs font-bold text-white">
              Send shipped email
            </button>
            <button onClick={() => setPendingNewStatus(null)} disabled={isPending} className="rounded border px-3 py-1 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {pendingNewStatus === 'cancelled' && (
        <div className="rounded border-2 border-neutral-200 bg-neutral-50 p-3 flex flex-col gap-2 max-w-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Cancel + refund</div>
          <input
            type="number" step="0.01" min="0" placeholder="Refund amount in SGD (e.g. 45.00)" value={refundCents}
            onChange={(e) => setRefundCents(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <textarea
            rows={2} placeholder="Refund note (optional)" value={refundNote}
            onChange={(e) => setRefundNote(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <button onClick={confirmCancelled} disabled={isPending} className="rounded bg-pink px-3 py-1 text-xs font-bold text-white">
              Cancel + send refund email
            </button>
            <button onClick={() => setPendingNewStatus(null)} disabled={isPending} className="rounded border px-3 py-1 text-xs">
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7.3: Update `updateOrderStatus` server action signature**

In `app/admin/orders/actions.ts`, replace the existing `updateOrderStatus` function (and its `ALLOWED_STATUSES` constant) with:

```ts
const ALLOWED_STATUSES = ['pending', 'processing', 'ready', 'shipped', 'completed', 'cancelled'] as const;

export async function updateOrderStatus(
  orderId: string,
  status: string,
  extras: {
    tracking_number?: string;
    tracking_url?: string;
    refund_cents?: number;
    refund_note?: string;
  } = {},
) {
  let actor;
  try { actor = (await requireAdmin()).actor; } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  if (!ALLOWED_STATUSES.includes(status as any)) return { ok: false, error: 'Invalid status' };

  const supabase = createServiceClient();
  const { data: before } = await supabase
    .from('orders')
    .select('order_number, customer_name, email, status, total_cents, payment_method')
    .eq('id', orderId)
    .maybeSingle();

  // Build the update patch, including conditional fields per target status.
  const patch: Record<string, any> = { status };
  if (status === 'shipped') {
    if (!extras.tracking_number) return { ok: false, error: 'Tracking number required to mark shipped' };
    patch.tracking_number = extras.tracking_number.trim().slice(0, 200);
    patch.tracking_url    = (extras.tracking_url ?? '').trim().slice(0, 500) || null;
    patch.shipped_at      = new Date().toISOString();
  }
  if (status === 'cancelled') {
    const cents = Number.isFinite(extras.refund_cents) ? Math.max(0, Math.floor(extras.refund_cents!)) : 0;
    patch.refund_cents = cents;
    patch.refunded_at  = cents > 0 ? new Date().toISOString() : null;
    patch.refund_note  = (extras.refund_note ?? '').trim().slice(0, 500) || null;
  }

  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) {
    reportError(error, { route: 'admin.orders.update_status', order_id: orderId, extras: { to: status } });
    return { ok: false, error: error.message };
  }

  await logAdminAction(actor, {
    action: 'order.status_update',
    targetType: 'order',
    targetId: orderId,
    metadata: { from: before?.status, to: status },
  });

  if (before && before.status !== status) {
    void (async () => {
      try {
        const email = await import('@/lib/email');
        let m: { subject: string; html: string } | null = null;
        if (status === 'shipped') {
          m = email.orderShippedEmail({
            order_number: before.order_number as string,
            customer_name: before.customer_name as string,
            tracking_number: patch.tracking_number ?? null,
            tracking_url:    patch.tracking_url ?? null,
          });
        } else if (status === 'cancelled') {
          m = email.orderRefundedEmail({
            order_number: before.order_number as string,
            customer_name: before.customer_name as string,
            refund_cents:  patch.refund_cents,
            payment_method: (before.payment_method as string | null) ?? null,
            refund_note:   patch.refund_note ?? null,
          });
        } else if (['processing', 'ready', 'completed'].includes(status)) {
          m = email.orderStatusEmail(before.order_number as string, before.customer_name as string, status);
        }
        if (m) {
          await email.sendEmail({ to: before.email as string, subject: m.subject, html: m.html });
        }
      } catch (e) {
        console.error('[status email] failed');
        reportError(e, { route: 'admin.orders.status_email', order_id: orderId });
      }
    })();
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin');
  return { ok: true };
}
```

(Note: this references `orderRefundedEmail` which is created in Task 8.)

- [ ] **Step 7.4: Verify build (will fail temporarily — that's expected)**

```bash
npm run build
```

Expected: TypeScript error about missing `orderRefundedEmail`. **Do not commit yet.** Move to Task 8 to satisfy the reference.

---

## Task 8: Refund / cancellation receipt email

**Files:**
- Modify: `lib/email.ts`

- [ ] **Step 8.1: Add `orderRefundedEmail()` to `lib/email.ts`**

Append below `orderShippedEmail`:

```ts
export type RefundedEmailPayload = {
  order_number: string;
  customer_name: string;
  refund_cents: number;
  payment_method: string | null;
  refund_note: string | null;
};

export function orderRefundedEmail(p: RefundedEmailPayload): { subject: string; html: string } {
  const first = p.customer_name.split(/\s+/)[0] || 'there';
  const refundLabel = formatSGD(p.refund_cents);
  const subject = p.refund_cents > 0
    ? `Order ${p.order_number} cancelled — refund ${refundLabel}`
    : `Order ${p.order_number} cancelled`;
  const refundLine = p.refund_cents > 0
    ? `<p style="font-size:14px;color:#444;margin:0 0 12px;">
         A refund of <strong style="color:${BRAND_PINK};">${refundLabel}</strong>${p.payment_method ? ` will be processed to your <strong>${escapeHtml(p.payment_method)}</strong> within 5–10 working days` : ' will be processed within 5–10 working days'}.
       </p>`
    : `<p style="font-size:14px;color:#444;margin:0 0 12px;">
         No refund is being processed for this cancellation.
       </p>`;
  const noteLine = p.refund_note
    ? `<div style="background:#fafaf7;border-left:3px solid ${BRAND_PINK};padding:10px 12px;margin:12px 0;font-size:13px;color:#444;">
         ${escapeHtml(p.refund_note)}
       </div>`
    : '';
  const body = `
    <h1 style="font-size:22px;font-weight:900;letter-spacing:-0.02em;margin:0 0 12px;color:${BRAND_INK};">
      Order cancelled
    </h1>
    <p style="font-size:14px;color:#555;margin:0 0 12px;">
      Hi ${escapeHtml(first)} — order <strong>${escapeHtml(p.order_number)}</strong> has been cancelled.
    </p>
    ${refundLine}
    ${noteLine}
    <p style="font-size:13px;color:#666;margin:16px 0 0;line-height:1.6;">
      If anything's off, reply within 7 days and we'll sort it out.
    </p>
  `;
  return { subject, html: shell(subject, body) };
}
```

- [ ] **Step 8.2: Verify build passes**

```bash
npm run build
```

Expected: build completes. The Task-7 reference is now satisfied.

- [ ] **Step 8.3: Commit Tasks 7 + 8 together**

```bash
git add lib/email.ts app/admin/orders/actions.ts components/admin/order-status-updater.tsx
git commit -m "Email: shipped + refund/cancel templates with admin inline forms"
git push origin HEAD
```

- [ ] **Step 8.4: MANUAL — verify on prod**

After Vercel deploys:

1. Place a test order through the live site (use a real address you control).
2. In `/admin/orders/<id>`, change status to `shipped`. Inline form should appear. Enter a fake tracking number `TEST123`. Click "Send shipped email".
3. Confirm Resend logs show the shipped email; open it and check the tracking pill renders.
4. Change status to `cancelled`. Enter refund amount equal to the order total. Click "Cancel + send refund email".
5. Confirm Resend logs show the refund email with the SGD amount.

If either email is missing, check Vercel function logs for `[status email] failed` and the corresponding Sentry event.

---

## Task 9: Branded password-reset template

**Files:**
- Modify: `lib/email.ts`
- Create: `scripts/print-supabase-templates.mjs`

- [ ] **Step 9.1: Add `passwordResetEmailHtml()` to `lib/email.ts`**

Append at the bottom of `lib/email.ts`:

```ts
/**
 * Returns the HTML body to paste into Supabase Dashboard → Auth → Email Templates → "Reset Password".
 *
 * Supabase substitutes {{ .ConfirmationURL }} server-side. Leave that token raw —
 * do NOT escape it.
 */
export function passwordResetEmailHtml(): string {
  const subject = 'Reset your Printvolution password';
  const body = `
    <h1 style="font-size:22px;font-weight:900;letter-spacing:-0.02em;margin:0 0 12px;color:${BRAND_INK};">
      Reset your password
    </h1>
    <p style="font-size:14px;color:#555;margin:0 0 16px;">
      Click the button below to set a new password. The link expires in 1 hour.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:${BRAND_PINK};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:800;font-size:13px;letter-spacing:0.3px;margin:4px 0 16px;">
      Reset password →
    </a>
    <p style="font-size:12px;color:#888;margin:16px 0 0;line-height:1.6;">
      Didn't ask for this? You can safely ignore this email — your password won't change.
    </p>
  `;
  return shell(subject, body);
}
```

- [ ] **Step 9.2: Create `scripts/print-supabase-templates.mjs`**

```js
#!/usr/bin/env node
// One-off helper: prints HTML bodies for Supabase Auth email templates,
// ready to paste into Supabase Dashboard → Auth → Email Templates.
//
// Usage:  node scripts/print-supabase-templates.mjs > /tmp/supabase-templates.html

import { passwordResetEmailHtml } from '../lib/email.ts';

console.log('=== RESET PASSWORD ===');
console.log('Subject: Reset your Printvolution password');
console.log('---- HTML below ----');
console.log(passwordResetEmailHtml());
console.log('=== END ===');
```

- [ ] **Step 9.3: Generate the HTML**

```bash
npx tsx scripts/print-supabase-templates.mjs > /tmp/pv-supabase-templates.html
```

If `tsx` isn't installed, use `npm install -D tsx` first or temporarily extract the HTML by importing into a `.ts` script run via `next` build artifacts. Easiest: convert the script to use a copy of the HTML inlined here, since the template is short.

(Alternative if tsx isn't desired: just open `/tmp/pv-supabase-templates.html` after copy-pasting the rendered HTML from `lib/email.ts` manually.)

Expected: file at `/tmp/pv-supabase-templates.html` containing the full branded HTML with `{{ .ConfirmationURL }}` token preserved.

- [ ] **Step 9.4: MANUAL — paste into Supabase Dashboard**

1. Open Supabase Dashboard → Project → Authentication → Email Templates.
2. Select "Reset Password".
3. Set Subject: `Reset your Printvolution password`.
4. Replace the Message body with the generated HTML.
5. Save.
6. Trigger a password reset for a test account. Confirm the branded email arrives (check Resend Logs and the inbox).

- [ ] **Step 9.5: Commit**

```bash
git add lib/email.ts scripts/print-supabase-templates.mjs
git commit -m "Email: branded password-reset template + Supabase paste helper"
git push origin HEAD
```

---

## Task 10: Final round-up — env var checklist + smoke test summary

- [ ] **Step 10.1: Confirm Vercel env vars are set**

Production scope must contain:
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `RESEND_API_KEY` (already there)
- `EMAIL_FROM` (already there)
- `ADMIN_NOTIFICATION_EMAIL` (already there)

Run `vercel env ls production` to verify, or check the dashboard.

- [ ] **Step 10.2: End-to-end smoke**

After everything's deployed, perform this sequence on prod:

1. Sign up a new account → welcome email arrives.
2. Place a real test order → existing order-confirmation arrives.
3. In admin, change order status to `processing` → existing generic status email arrives.
4. Change to `shipped` with tracking → new shipped email arrives.
5. Trigger a password reset → new branded reset email arrives.
6. Place another test order, change to `cancelled` with refund → new refund email arrives.
7. Confirm zero unexpected events in Sentry over the next hour.

- [ ] **Step 10.3: No commit needed unless something was broken in 10.2**

If a step fails: open the corresponding Sentry issue, fix the root cause (do not patch around it — see CLAUDE.md "No invented operational facts"), commit + push, repeat.

---

## Self-review

- **Spec coverage:** Sentry install ✓ (Task 1–4), CSP update ✓ (Task 2), PII scrubbing ✓ (Task 1), `lib/observability.ts` ✓ (Task 3), wired call sites ✓ (Task 4), order tracking + refund migration ✓ (Task 5), welcome email ✓ (Task 6), shipped email + admin UI ✓ (Task 7), refund/cancel email + admin UI ✓ (Task 7+8), branded password reset ✓ (Task 9). Verification routes ✓ (Task 3, deleted in 3.6). End-to-end smoke ✓ (Task 10).
- **Placeholder scan:** every step has the actual code or command. The only manual steps are unavoidably manual: setting Vercel env vars, pasting HTML into Supabase dashboard, watching Resend logs.
- **Type consistency:** `ShippedEmailPayload` and `RefundedEmailPayload` are defined in Task 7/8 and consumed by `updateOrderStatus` in Task 7 — names match. `welcomeEmail(email, name)` matches signup call site signature. `reportError(err, ctx)` signature matches every call site.
- **Risk noted in spec — constraint name:** addressed in Step 5.1 (verify before applying).
- **Risk noted in spec — Resend deliverability (SPF/DKIM):** flagged but NOT a Round-1 task per spec; pre-launch checklist item.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-04-28-round-1-sentry-and-emails.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — I execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
