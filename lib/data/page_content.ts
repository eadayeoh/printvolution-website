import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export type PageContent = Record<string, { items: any[] }>;

export const getPageContent = cache(async (pageKey: string): Promise<PageContent> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('page_content')
    .select('section_key, data')
    .eq('page_key', pageKey);
  const out: PageContent = {};
  for (const row of data ?? []) {
    out[row.section_key as string] = row.data as { items: any[] };
  }
  return out;
});

export type ContactMethod = {
  type: string;
  value: string;
  label: string | null;
  note: string | null;
};

export const getContactMethods = cache(async (): Promise<ContactMethod[]> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('contact_methods')
    .select('type, value, label, note')
    .eq('is_active', true)
    .order('display_order');
  return (data ?? []) as unknown as ContactMethod[];
});

export type GlobalSectionItem = Record<string, unknown>;

export const getGlobalSection = cache(async (sectionKey: string): Promise<GlobalSectionItem[]> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('page_content')
    .select('data')
    .eq('page_key', 'global')
    .eq('section_key', sectionKey)
    .maybeSingle();
  const items = (data?.data as { items?: GlobalSectionItem[] } | null)?.items;
  return Array.isArray(items) ? items : [];
});
