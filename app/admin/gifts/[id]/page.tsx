import { notFound } from 'next/navigation';
import { GiftProductEditor } from '@/components/admin/gift-product-editor';
import { getGiftProductByIdAdmin, listAllTemplatesAdmin, listCategoriesForGifts } from '@/lib/gifts/data';
import { listActivePipelines } from '@/lib/gifts/pipelines';
import { listActiveModes } from '@/lib/gifts/modes';
import { listAllVariantsAdmin } from '@/lib/gifts/variants';
import { listPromptsForProduct, listPromptsForModes } from '@/lib/gifts/prompts';
import type { GiftMode } from '@/lib/gifts/types';

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
  // Prompts visible to admin's per-prompt mockup block on each variant.
  // Uses the same filter as the customer page — honouring pinned pipelines.
  const parentPrompts = (product.mode === 'photo-resize')
    ? []
    : (await listPromptsForProduct({
        mode: product.mode,
        secondary_mode: product.secondary_mode,
        pipeline_id: product.pipeline_id,
        secondary_pipeline_id: product.secondary_pipeline_id,
        prompt_ids: (product as any).prompt_ids ?? null,
      })).map((p) => ({ id: p.id, name: p.name, mode: p.mode }));
  // Every active prompt that COULD apply to this product (matches the
  // primary OR secondary mode). Drives the per-product allowlist
  // picker — admin sees the full set, regardless of what's currently
  // selected.
  const allCandidatePrompts = (product.mode === 'photo-resize')
    ? []
    : (await listPromptsForModes(
        [product.mode, ...(product.secondary_mode ? [product.secondary_mode as GiftMode] : [])],
      )).map((p) => ({ id: p.id, name: p.name, mode: p.mode, thumbnail_url: p.thumbnail_url ?? null }));
  return (
    <GiftProductEditor
      product={product}
      categories={categories as any}
      allTemplates={allTemplates}
      assignedTemplateIds={assignedTemplateIds}
      pipelines={pipelines}
      modes={modes}
      variants={variants}
      parentPrompts={parentPrompts}
      allCandidatePrompts={allCandidatePrompts}
    />
  );
}

async function listAllAssignedForProduct(productId: string): Promise<string[]> {
  const { createClient } = await import('@/lib/supabase/server');
  const sb = createClient();
  const { data } = await sb.from('gift_product_templates').select('template_id').eq('gift_product_id', productId);
  return (data ?? []).map((r: any) => r.template_id);
}
