import { notFound } from 'next/navigation';
import { GiftProductEditor } from '@/components/admin/gift-product-editor';
import { getGiftProductByIdAdmin, listAllTemplatesAdmin, listCategoriesForGifts } from '@/lib/gifts/data';
import { listActivePipelines } from '@/lib/gifts/pipelines';
import { listActiveModes } from '@/lib/gifts/modes';
import { listAllVariantsAdmin } from '@/lib/gifts/variants';

export const dynamic = 'force-dynamic';

export default async function EditGiftProductPage({ params }: { params: { id: string } }) {
  const [product, categories, allTemplates, pipelines, modes, variants] = await Promise.all([
    getGiftProductByIdAdmin(params.id),
    listCategoriesForGifts(),
    listAllTemplatesAdmin(),
    listActivePipelines(),
    listActiveModes(),
    listAllVariantsAdmin(params.id),
  ]);
  if (!product) notFound();
  const assignedTemplateIds = await listAllAssignedForProduct(params.id);
  return (
    <GiftProductEditor
      product={product}
      categories={categories as any}
      allTemplates={allTemplates}
      assignedTemplateIds={assignedTemplateIds}
      pipelines={pipelines}
      modes={modes}
      variants={variants}
    />
  );
}

async function listAllAssignedForProduct(productId: string): Promise<string[]> {
  const { createClient } = await import('@/lib/supabase/server');
  const sb = createClient();
  const { data } = await sb.from('gift_product_templates').select('template_id').eq('gift_product_id', productId);
  return (data ?? []).map((r: any) => r.template_id);
}
