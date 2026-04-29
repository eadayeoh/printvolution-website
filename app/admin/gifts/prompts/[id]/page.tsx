import { notFound } from 'next/navigation';
import { GiftPromptEditor } from '@/components/admin/gift-prompt-editor';
import { getPromptByIdAdmin, listPromptVisibility } from '@/lib/gifts/prompts';
import { listActivePipelines } from '@/lib/gifts/pipelines';
import { listAllTemplatesAdmin } from '@/lib/gifts/data';

export const dynamic = 'force-dynamic';

export default async function EditPromptPage({ params }: { params: { id: string } }) {
  const p = await getPromptByIdAdmin(params.id);
  if (!p) notFound();
  const [pipelines, visibility, templates] = await Promise.all([
    listActivePipelines(),
    listPromptVisibility(p),
    listAllTemplatesAdmin(),
  ]);
  return (
    <GiftPromptEditor
      prompt={p}
      pipelines={pipelines}
      visibility={visibility}
      availableTemplates={templates}
    />
  );
}
