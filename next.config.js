/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
      // picsum.photos 302s to fastly.picsum.photos, so the CDN host
      // has to be whitelisted too or <img> loads are CSP-blocked.
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      // randomuser.me portraits — used as face placeholder defaults
      // on gift templates so admin sees layouts at a glance.
      { protocol: 'https', hostname: 'randomuser.me' },
    ],
  },
  experimental: {
    serverActions: {
      // Allow up to 25 MB uploads for gift photos (previously 10 MB for product images)
      bodySizeLimit: '60mb',
    },
    // Native deps must stay external so Webpack doesn't try to bundle them.
    serverComponentsExternalPackages: ['sharp', 'pdf-lib', '@resvg/resvg-js', 'potrace'],
  },
  async headers() {
    // Defence-in-depth response headers. CSP is intentionally NOT
    // frame-ancestors-none (we need to serve in a browser, not blocked
    // from iframes used by tests) but does lock down script / frame
    // origins to our own site + Supabase storage.
    const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^https?:\/\//, '');
    const csp = [
      "default-src 'self'",
      // Next.js ships inline bootstrap scripts and styled-jsx inline styles.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: https://${supabaseHost} https://picsum.photos https://fastly.picsum.photos https://randomuser.me https://*.hit-pay.com`,
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.hit-pay.com https://api.sandbox.hit-pay.com https://*.sentry.io https://*.ingest.sentry.io`,
      "frame-src 'self' https://hit-pay.com https://*.hit-pay.com https://www.google.com",
      "form-action 'self' https://hit-pay.com https://*.hit-pay.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    const base = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=(self "https://hit-pay.com")' },
      { key: 'Content-Security-Policy', value: csp },
    ];

    return [
      {
        source: '/:path*',
        headers: base,
      },
    ];
  },
};

const { withSentryConfig } = require('@sentry/nextjs');

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
