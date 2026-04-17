import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { DEFAULT_PRODUCT_FEATURES, type ProductFeature, type SiteSettings } from './site-settings-types';

export { DEFAULT_PRODUCT_FEATURES };
export type { ProductFeature, SiteSettings };

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
