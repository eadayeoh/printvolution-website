import { notFound } from 'next/navigation';
import { GiftPromptEditor } from '@/components/admin/gift-prompt-editor';
import { getPromptByIdAdmin } from '@/lib/gifts/prompts';

export const dynamic = 'force-dynamic';

export default async function EditPromptPage({ params }: { params: { id: string } }) {
  const p = await getPromptByIdAdmin(params.id);
  if (!p) notFound();
  return <GiftPromptEditor prompt={p} />;
}
