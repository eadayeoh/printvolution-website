import { notFound } from 'next/navigation';
import { GiftPromptEditor } from '@/components/admin/gift-prompt-editor';
import { getPromptByIdAdmin } from '@/lib/gifts/prompts';
import { listActivePipelines } from '@/lib/gifts/pipelines';

export const dynamic = 'force-dynamic';

export default async function EditPromptPage({ params }: { params: { id: string } }) {
  const [p, pipelines] = await Promise.all([
    getPromptByIdAdmin(params.id),
    listActivePipelines(),
  ]);
  if (!p) notFound();
  return <GiftPromptEditor prompt={p} pipelines={pipelines} />;
}
