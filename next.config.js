/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  // Bust any cached .html URLs from the old static site
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/about.html', destination: '/about', permanent: true },
      { source: '/contact.html', destination: '/contact', permanent: true },
      { source: '/shop.html', destination: '/shop', permanent: true },
      { source: '/cart.html', destination: '/cart', permanent: true },
      { source: '/checkout.html', destination: '/checkout', permanent: true },
      { source: '/faq.html', destination: '/faq', permanent: true },
      { source: '/membership.html', destination: '/membership', permanent: true },
      { source: '/bundles.html', destination: '/bundles', permanent: true },
      { source: '/admin.html', destination: '/admin', permanent: true },
      { source: '/staff.html', destination: '/staff', permanent: true },
      { source: '/login.html', destination: '/login', permanent: true },
      // Old /product/...category.../slug/ URLs: Next.js already handles this
      // same URL shape via [category]/[...slug]/page.tsx, so no redirect needed.
    ];
  },
};

module.exports = nextConfig;
