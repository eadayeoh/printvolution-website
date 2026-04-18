import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type HomeSections = Record<string, Array<Record<string, unknown>>>;

export const getHomePageContent = cache(async (): Promise<HomeSections> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('page_content')
    .select('section_key, data')
    .eq('page_key', 'home');

  const out: HomeSections = {};
  for (const row of (data ?? []) as Array<{ section_key: string; data: { items?: Array<Record<string, unknown>> } | null }>) {
    const items = row.data?.items;
    out[row.section_key] = Array.isArray(items) ? items : [];
  }
  return out;
});

export function homeItems(sections: HomeSections, key: string): Array<Record<string, unknown>> {
  return sections[key] ?? [];
}

export function homeFirst<T = Record<string, unknown>>(sections: HomeSections, key: string): T | null {
  const arr = sections[key];
  return arr && arr.length > 0 ? (arr[0] as unknown as T) : null;
}
