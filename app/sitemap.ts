import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { productHref, getProductRoutes } from '@/lib/data/navigation';

const BASE = 'https://printvolution.sg';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const [products, bundles, routes] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('is_active', true),
    supabase.from('bundles').select('slug, updated_at').eq('status', 'active'),
    getProductRoutes(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/shop`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/bundles`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/membership`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const productPages: MetadataRoute.Sitemap = ((products.data ?? []) as any[]).map((p) => ({
    url: `${BASE}${productHref(p.slug, routes)}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const bundlePages: MetadataRoute.Sitemap = ((bundles.data ?? []) as any[]).map((b) => ({
    url: `${BASE}/bundle/${b.slug}`,
    lastModified: b.updated_at ? new Date(b.updated_at) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...bundlePages];
}
