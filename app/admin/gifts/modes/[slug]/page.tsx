import { notFound } from 'next/navigation';
import { getModeBySlug } from '@/lib/gifts/modes';
import { GiftModeEditor } from '@/components/admin/gift-mode-editor';

export const dynamic = 'force-dynamic';

export default async function AdminGiftModeEditPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const mode = await getModeBySlug(slug as any);
  if (!mode) notFound();
  return <GiftModeEditor mode={mode} />;
}
