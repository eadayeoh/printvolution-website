import { createClient } from '@/lib/supabase/server';
import { PagesCmsEditor } from '@/components/admin/pages-cms-editor';

export const metadata = { title: 'Pages CMS' };

export default async function AdminPagesCms() {
  const supabase = createClient();
  const [pageContent, contacts, nav, megaRaw, products] = await Promise.all([
    supabase.from('page_content').select('page_key, section_key, data'),
    supabase.from('contact_methods').select('id, type, value, label, note, is_active, display_order').order('display_order'),
    supabase.from('navigation').select('label, type, action, mega_key, is_hidden, display_order').order('display_order'),
    supabase.from('mega_menus').select(`
      id, menu_key, section_heading, display_order,
      items:mega_menu_items(product_slug, label, display_order)
    `).order('display_order'),
    supabase.from('products').select('slug, name').eq('is_active', true).order('name'),
  ]);

  const sectionsMap: Record<string, any[]> = {};
  for (const row of ((pageContent.data ?? []) as any[])) {
    sectionsMap[`${row.page_key}:${row.section_key}`] = (row.data?.items ?? []);
  }

  // Group mega menu sections by menu_key
  const megaByKey: Record<string, Array<{ section_heading: string; items: Array<{ product_slug: string; label: string }> }>> = {};
  for (const row of ((megaRaw.data ?? []) as any[])) {
    const key = row.menu_key as string;
    if (!megaByKey[key]) megaByKey[key] = [];
    const items = ((row.items ?? []) as any[])
      .sort((a, b) => a.display_order - b.display_order)
      .map((i: any) => ({ product_slug: i.product_slug, label: i.label }));
    megaByKey[key].push({ section_heading: row.section_heading, items });
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">Pages CMS</h1>
        <p className="text-sm text-neutral-500">Edit homepage, about, navigation, mega menus, contact methods — live changes.</p>
      </div>
      <PagesCmsEditor
        sections={sectionsMap}
        contacts={((contacts.data ?? []) as any[])}
        nav={((nav.data ?? []) as any[])}
        megaByKey={megaByKey}
        products={((products.data ?? []) as any[])}
      />
    </div>
  );
}
