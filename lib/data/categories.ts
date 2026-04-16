import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export type Category = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  display_order: number;
};

/** All categories (top-level + sub), sorted. */
export const listCategories = cache(async (): Promise<Category[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, parent_id, display_order')
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as Category[];
});

/** Top-level categories only (parent_id is null). */
export const listTopCategories = cache(async (): Promise<Category[]> => {
  const all = await listCategories();
  return all.filter((c) => !c.parent_id);
});
