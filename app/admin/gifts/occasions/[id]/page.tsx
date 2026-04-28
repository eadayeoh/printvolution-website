import { notFound } from 'next/navigation';
import { GiftOccasionEditor } from '@/components/admin/gift-occasion-editor';
import { getOccasionByIdAdmin } from '@/lib/gifts/data';

export const dynamic = 'force-dynamic';

export default async function EditOccasionPage({ params }: { params: { id: string } }) {
  const occasion = await getOccasionByIdAdmin(params.id);
  if (!occasion) notFound();
  return <GiftOccasionEditor occasion={occasion} />;
}
