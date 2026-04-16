import { createClient } from '@/lib/supabase/server';
import { PagesCmsEditor } from '@/components/admin/pages-cms-editor';

export const metadata = { title: 'Pages CMS' };

export default async function AdminPagesCms() {
  const supabase = createClient();
  const [pageContent, contacts, nav] = await Promise.all([
    supabase.from('page_content').select('page_key, section_key, data'),
    supabase.from('contact_methods').select('id, type, value, label, note, is_active, display_order').order('display_order'),
    supabase.from('navigation').select('label, type, action, mega_key, is_hidden, display_order').order('display_order'),
  ]);

  const sectionsMap: Record<string, any[]> = {};
  for (const row of ((pageContent.data ?? []) as any[])) {
    sectionsMap[`${row.page_key}:${row.section_key}`] = (row.data?.items ?? []);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">Pages CMS</h1>
        <p className="text-sm text-neutral-500">Edit homepage, about, navigation, contact methods — live changes.</p>
      </div>
      <PagesCmsEditor
        sections={sectionsMap}
        contacts={((contacts.data ?? []) as any[])}
        nav={((nav.data ?? []) as any[])}
      />
    </div>
  );
}
