import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export type ProductFeature = {
  icon_url: string | null;
  emoji: string | null;
  title: string;
  desc: string;
};

export type SiteSettings = {
  logo_url: string | null;
  logo_width_px: number | null;
  favicon_url: string | null;
  brand_text: string;
  product_features: ProductFeature[];
};

export const DEFAULT_PRODUCT_FEATURES: ProductFeature[] = [
  { icon_url: null, emoji: '✓', title: 'Pre-press file check', desc: 'We inspect every file before it hits the printer.' },
  { icon_url: null, emoji: '🖼', title: 'Digital mockup', desc: 'Preview your design before we produce it.' },
  { icon_url: null, emoji: '🚚', title: 'Island-wide delivery', desc: 'Or free pickup at Paya Lebar Square.' },
  { icon_url: null, emoji: '⚡', title: 'Express available', desc: '24-hour turnaround for rush jobs — ask us.' },
];

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const sb = createClient();
  const { data } = await sb
    .from('site_settings')
    .select('logo_url, logo_width_px, favicon_url, brand_text, product_features')
    .eq('id', 1)
    .maybeSingle();
  const features = Array.isArray(data?.product_features) && data!.product_features.length > 0
    ? (data!.product_features as ProductFeature[])
    : DEFAULT_PRODUCT_FEATURES;
  return {
    logo_url: data?.logo_url ?? null,
    logo_width_px: data?.logo_width_px ?? null,
    favicon_url: data?.favicon_url ?? null,
    brand_text: data?.brand_text ?? 'Printvolution',
    product_features: features,
  };
});
