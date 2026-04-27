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
