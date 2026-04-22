import { GiftProductEditor } from '@/components/admin/gift-product-editor';
import { listAllTemplatesAdmin, listCategoriesForGifts } from '@/lib/gifts/data';
import { listActiveModes } from '@/lib/gifts/modes';

export const dynamic = 'force-dynamic';

export default async function NewGiftProductPage() {
  const [categories, allTemplates, modes] = await Promise.all([
    listCategoriesForGifts(),
    listAllTemplatesAdmin(),
    listActiveModes(),
  ]);
  return (
    <GiftProductEditor
      product={null}
      categories={categories as any}
      allTemplates={allTemplates}
      assignedTemplateIds={[]}
      modes={modes}
    />
  );
}
