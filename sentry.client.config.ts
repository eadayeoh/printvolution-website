// sentry.client.config.ts — browser runtime
import * as Sentry from '@sentry/nextjs';
import type { ErrorEvent } from '@sentry/core';

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
    beforeSend(event: ErrorEvent): ErrorEvent {
      return scrub(event);
    },
  });
}

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const ORDER_RE = /\bPV-\d{4,}\b/g;

function redactString(s: string): string {
  return s.replace(EMAIL_RE, '[redacted-email]').replace(ORDER_RE, '[redacted-order]');
}

// Strip known-sensitive keys regardless of where they came from.
function scrub(event: ErrorEvent): ErrorEvent {
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
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(b =>
      b.data ? { ...b, data: walk(b.data) } : b
    );
  }
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map(v => ({
      ...v,
      value: v.value ? redactString(v.value) : v.value,
    }));
  }
  if (event.message && typeof event.message === 'string') {
    event.message = redactString(event.message);
  }
  // Always wipe user identifying fields beyond the UUID.
  if (event.user) {
    const id = event.user.id;
    event.user = (typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)) ? { id } : {};
  }
  return event;
}
