// sentry.server.config.ts — Node runtime
import * as Sentry from '@sentry/nextjs';
import type { ErrorEvent } from '@sentry/core';

const env = process.env.VERCEL_ENV;
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && (env === 'production' || env === 'preview')) {
  Sentry.init({
    dsn,
    environment: env,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event: ErrorEvent): ErrorEvent {
      return scrub(event);
    },
  });
}

function scrub(event: ErrorEvent): ErrorEvent {
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
