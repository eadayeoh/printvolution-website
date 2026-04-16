/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  async redirects() {
    return [
      // Old hash URLs from legacy site - redirect to new product pages
      // Handled client-side via middleware if hash is present
    ];
  },
};

module.exports = nextConfig;
