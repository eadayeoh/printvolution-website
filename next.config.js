/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  experimental: {
    serverActions: {
      // Allow up to 25 MB uploads for gift photos (previously 10 MB for product images)
      bodySizeLimit: '60mb',
    },
    // Native deps must stay external so Webpack doesn't try to bundle them.
    serverComponentsExternalPackages: ['sharp', 'pdf-lib'],
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
      `img-src 'self' data: blob: https://${supabaseHost} https://picsum.photos https://*.hit-pay.com`,
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.hit-pay.com https://api.sandbox.hit-pay.com`,
      "frame-src 'self' https://hit-pay.com https://*.hit-pay.com",
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

module.exports = nextConfig;
