import { notFound } from 'next/navigation';
import { GiftTemplateEditor } from '@/components/admin/gift-template-editor';
import { getTemplateByIdAdmin } from '@/lib/gifts/data';

export const dynamic = 'force-dynamic';

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const template = await getTemplateByIdAdmin(params.id);
  if (!template) notFound();
  return <GiftTemplateEditor template={template} />;
}
