import { notFound } from 'next/navigation';
import { GiftTemplateEditor } from '@/components/admin/gift-template-editor';
import { getTemplateByIdAdmin, listAllTemplatesAdmin } from '@/lib/gifts/data';

export const dynamic = 'force-dynamic';

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const [template, all] = await Promise.all([
    getTemplateByIdAdmin(params.id),
    listAllTemplatesAdmin(),
  ]);
  if (!template) notFound();
  const existingGroups = Array.from(
    new Set(all.map((t) => t.group_name).filter((g): g is string => !!g && g.trim().length > 0)),
  ).sort();
  return <GiftTemplateEditor template={template} existingGroups={existingGroups} />;
}
