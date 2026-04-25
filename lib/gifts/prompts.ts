import { createClient } from '@/lib/supabase/server';
import type { GiftMode, GiftStyle } from './types';

export type GiftPrompt = {
  id: string;
  mode: GiftMode;
  style: GiftStyle;
  pipeline_id: string | null;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  transformation_prompt: string;
  negative_prompt: string | null;
  params: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
};

export async function listPromptsForMode(mode: GiftMode): Promise<GiftPrompt[]> {
  return listPromptsForModes([mode]);
}

/** Load every active prompt that matches any of the given modes.
 *  Used by dual-mode products (e.g. a UV/laser frame) so the customer's
 *  art-style picker can offer BOTH production methods' prompts. */
export async function listPromptsForModes(modes: GiftMode[]): Promise<GiftPrompt[]> {
  if (modes.length === 0) return [];
  const sb = createClient();
  const { data } = await sb
    .from('gift_prompts').select('*')
    .in('mode', modes).eq('is_active', true)
    .order('display_order');
  return (data ?? []) as GiftPrompt[];
}

/** Prompts to show on THIS product's art-style picker. Honours the
 *  product's per-mode pipeline overrides: when the product pins a
 *  pipeline for a mode (e.g. "use uv-passthrough for UV printing"),
 *  other prompts under that same mode are hidden — customers only see
 *  prompts tied to the pinned pipeline. Falls back to all active
 *  prompts for the mode when no pipeline is pinned. */
export async function listPromptsForProduct(product: {
  mode: GiftMode;
  secondary_mode?: GiftMode | null;
  pipeline_id?: string | null;
  secondary_pipeline_id?: string | null;
  prompt_ids?: string[] | null;
}): Promise<GiftPrompt[]> {
  // Per-product allowlist wins over mode/pipeline filtering. When
  // admin curates a subset, we still hit the mode-level cache (so
  // active-flag + ordering stays consistent) and then narrow the
  // result to the picked IDs in the order admin saved them.
  if (Array.isArray(product.prompt_ids) && product.prompt_ids.length > 0) {
    const modes: GiftMode[] = [
      product.mode,
      ...(product.secondary_mode ? [product.secondary_mode] : []),
    ];
    const all = await listPromptsForModes(modes);
    const allowed = new Set(product.prompt_ids);
    const byId = new Map(all.filter((p) => allowed.has(p.id)).map((p) => [p.id, p] as const));
    // Preserve admin's ordering.
    return product.prompt_ids.map((id) => byId.get(id)).filter((p): p is GiftPrompt => Boolean(p));
  }

  const modes: GiftMode[] = [
    product.mode,
    ...(product.secondary_mode ? [product.secondary_mode] : []),
  ];
  const all = await listPromptsForModes(modes);
  return all.filter((p) => {
    if (p.mode === product.mode && product.pipeline_id) {
      return p.pipeline_id === product.pipeline_id;
    }
    if (
      product.secondary_mode &&
      p.mode === product.secondary_mode &&
      product.secondary_pipeline_id
    ) {
      return p.pipeline_id === product.secondary_pipeline_id;
    }
    return true;
  });
}

/**
 * Resolve the prompt for a product + style choice, honouring pipeline_id override.
 * Order: (1) prompt pinned to product's pipeline_id + style; (2) mode-level prompt
 * for this style with pipeline_id = null.
 */
export async function resolvePromptForProduct(
  productPipelineId: string | null,
  productMode: GiftMode,
  style: GiftStyle,
): Promise<GiftPrompt | null> {
  const sb = createClient();
  if (productPipelineId) {
    const { data } = await sb
      .from('gift_prompts').select('*')
      .eq('pipeline_id', productPipelineId)
      .eq('style', style).eq('is_active', true)
      .order('display_order').limit(1);
    if (data && data[0]) return data[0] as GiftPrompt;
  }
  const { data } = await sb
    .from('gift_prompts').select('*')
    .is('pipeline_id', null).eq('mode', productMode)
    .eq('style', style).eq('is_active', true)
    .order('display_order').limit(1);
  return (data?.[0] ?? null) as GiftPrompt | null;
}

export async function listAllPromptsAdmin(): Promise<GiftPrompt[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_prompts').select('*')
    .order('mode').order('style').order('display_order');
  return (data ?? []) as GiftPrompt[];
}

export async function getPromptByIdAdmin(id: string): Promise<GiftPrompt | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_prompts').select('*').eq('id', id).maybeSingle();
  return data as GiftPrompt | null;
}
