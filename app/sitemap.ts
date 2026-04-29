import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // robots.ts currently disallow-alls the site (under construction).
  // Serving a populated sitemap would leak every active product/gift
  // slug to crawlers that ignore robots, so mirror the disallow-all
  // by returning an empty sitemap until robots.ts is restored to the
  // launch ruleset. Original product/bundle/gift/blog enumeration
  // lives in git history (pre-construction-mode commits) — restore
  // it alongside the robots launch flip.
  return [];
}
