import { notFound } from 'next/navigation';
import { GiftTemplateEditor } from '@/components/admin/gift-template-editor';
import { getTemplateByIdAdmin, listAllTemplatesAdmin } from '@/lib/gifts/data';
import { listAllModesAdmin } from '@/lib/gifts/modes';

export const dynamic = 'force-dynamic';

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const [template, all, modes] = await Promise.all([
    getTemplateByIdAdmin(params.id),
    listAllTemplatesAdmin(),
    listAllModesAdmin(),
  ]);
  if (!template) notFound();
  const existingGroups = Array.from(
    new Set(all.map((t) => t.group_name).filter((g): g is string => !!g && g.trim().length > 0)),
  ).sort();
  return (
    <GiftTemplateEditor
      template={template}
      existingGroups={existingGroups}
      availableModes={modes.map((m) => ({ slug: m.slug, label: m.label || m.slug }))}
    />
  );
}
