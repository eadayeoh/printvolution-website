import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // SITE IS UNDER CONSTRUCTION — hard-block all crawlers.
  // When ready to launch, restore the previous rule set:
  //   rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', ...] }],
  //   sitemap: 'https://printvolution.sg/sitemap.xml',
  return {
    rules: [
      { userAgent: '*', disallow: '/' },
    ],
  };
}
