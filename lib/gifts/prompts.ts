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
  const sb = createClient();
  const { data } = await sb
    .from('gift_prompts').select('*')
    .eq('mode', mode).eq('is_active', true)
    .order('display_order');
  return (data ?? []) as GiftPrompt[];
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
