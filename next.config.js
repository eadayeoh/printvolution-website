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
      bodySizeLimit: '25mb',
    },
    // Native deps must stay external so Webpack doesn't try to bundle them.
    serverComponentsExternalPackages: ['sharp', 'pdf-lib'],
  },
};

module.exports = nextConfig;
