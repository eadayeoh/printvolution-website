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
