import { createClient } from '@/lib/supabase/server';
import type { GiftMode, GiftStyle } from './types';
// Type + client-safe filter moved to prompts-shared.ts so client
// components can import them without pulling in next/headers (via
// the server supabase client). prompts.ts re-exports nothing from
// there — Webpack was following the re-export edge and still
// dragging server.ts into the client bundle.
import type { GiftPrompt } from './prompts-shared';

export async function listPromptsForMode(mode: GiftMode): Promise<GiftPrompt[]> {
  return listPromptsForModes([mode]);
}

/** Every active prompt across every mode. Drives the admin product-
 *  editor's art-style allowlist picker, where admin can mix-and-
 *  match prompts from any mode regardless of the product's own
 *  primary/secondary set. The customer-facing path
 *  (listPromptsForProduct) honours allow-listed prompts of any mode
 *  by ID, so admin's selection lands as picked. */
export async function listAllActivePrompts(): Promise<GiftPrompt[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_prompts').select('*')
    .eq('is_active', true)
    .order('mode')
    .order('display_order');
  return (data ?? []) as GiftPrompt[];
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
  // Per-product allowlist wins over mode/pipeline filtering. Admin
  // is allowed to attach prompts from any mode (not just the
  // product's primary/secondary), so we resolve the picked ids
  // directly instead of restricting to the product's modes first.
  if (Array.isArray(product.prompt_ids) && product.prompt_ids.length > 0) {
    const sb = createClient();
    const { data } = await sb
      .from('gift_prompts').select('*')
      .in('id', product.prompt_ids)
      .eq('is_active', true);
    const byId = new Map(((data ?? []) as GiftPrompt[]).map((p) => [p.id, p] as const));
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

export type PromptVisibility = {
  product_id: string;
  slug: string;
  name: string;
  visible: boolean;
  reason: 'curated-allowlist' | 'curated-not-listed' | 'pipeline-pinned' | 'mode-default';
};

/** For each active gift product, decide whether the given prompt would
 *  appear on its art-style picker. Mirrors listPromptsForProduct's
 *  filter logic — admin uses this to verify wiring without guessing.
 *  Visible only to admin pages; runs the same query the customer
 *  page would. */
export async function listPromptVisibility(prompt: GiftPrompt): Promise<PromptVisibility[]> {
  const sb = createClient();
  const { data: products } = await sb
    .from('gift_products')
    .select('id, slug, name, mode, secondary_mode, pipeline_id, secondary_pipeline_id, prompt_ids')
    .eq('is_active', true)
    .order('name');

  const out: PromptVisibility[] = [];
  for (const p of (products ?? []) as any[]) {
    const modeMatch = p.mode === prompt.mode || p.secondary_mode === prompt.mode;
    if (!modeMatch) continue;

    if (Array.isArray(p.prompt_ids) && p.prompt_ids.length > 0) {
      const inAllowlist = p.prompt_ids.includes(prompt.id);
      out.push({
        product_id: p.id,
        slug: p.slug,
        name: p.name,
        visible: inAllowlist,
        reason: inAllowlist ? 'curated-allowlist' : 'curated-not-listed',
      });
      continue;
    }

    const pinId = p.mode === prompt.mode ? p.pipeline_id : p.secondary_pipeline_id;
    if (pinId) {
      const matches = prompt.pipeline_id === pinId;
      out.push({
        product_id: p.id,
        slug: p.slug,
        name: p.name,
        visible: matches,
        reason: 'pipeline-pinned',
      });
      continue;
    }

    out.push({
      product_id: p.id,
      slug: p.slug,
      name: p.name,
      visible: true,
      reason: 'mode-default',
    });
  }
  return out;
}
