import { GiftProductEditor } from '@/components/admin/gift-product-editor';
import { listAllTemplatesAdmin, listCategoriesForGifts } from '@/lib/gifts/data';

export const dynamic = 'force-dynamic';

export default async function NewGiftProductPage() {
  const [categories, allTemplates] = await Promise.all([
    listCategoriesForGifts(),
    listAllTemplatesAdmin(),
  ]);
  return <GiftProductEditor product={null} categories={categories as any} allTemplates={allTemplates} assignedTemplateIds={[]} />;
}
