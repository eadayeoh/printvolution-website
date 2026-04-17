import { createClient } from '@/lib/supabase/server';
import { CategoriesEditor } from '@/components/admin/categories-editor';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const sb = createClient();
  const { data } = await sb
    .from('categories')
    .select('id, slug, name, parent_id, display_order')
    .order('display_order')
    .order('name');
  return <CategoriesEditor initial={(data ?? []) as any} />;
}
