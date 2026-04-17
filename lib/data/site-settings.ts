import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export type SiteSettings = {
  logo_url: string | null;
  logo_width_px: number | null;
  favicon_url: string | null;
  brand_text: string;
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const sb = createClient();
  const { data } = await sb
    .from('site_settings')
    .select('logo_url, logo_width_px, favicon_url, brand_text')
    .eq('id', 1)
    .maybeSingle();
  return {
    logo_url: data?.logo_url ?? null,
    logo_width_px: data?.logo_width_px ?? null,
    favicon_url: data?.favicon_url ?? null,
    brand_text: data?.brand_text ?? 'Printvolution',
  };
});
