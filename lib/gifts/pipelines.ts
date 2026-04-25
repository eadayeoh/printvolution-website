import { createClient } from '@/lib/supabase/server';
import type { GiftMode, GiftPipeline } from './types';

export async function listActivePipelines(): Promise<GiftPipeline[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_pipelines').select('*')
    .eq('is_active', true).order('kind').order('name');
  return (data ?? []) as GiftPipeline[];
}

export async function listAllPipelinesAdmin(): Promise<GiftPipeline[]> {
  const sb = createClient();
  const { data } = await sb.from('gift_pipelines').select('*').order('kind').order('name');
  return (data ?? []) as GiftPipeline[];
}

export async function getPipelineByIdAdmin(id: string): Promise<GiftPipeline | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_pipelines').select('*').eq('id', id).maybeSingle();
  return data as GiftPipeline | null;
}

/** Default pipeline for a mode, used when product.pipeline_id is null.
 *  Tries the canonical slug first; if it's not seeded, falls back to
 *  ANY active pipeline of the matching kind, preferring `replicate`
 *  providers over `passthrough` so AI products actually run AI.
 *  Without this fallback, a UV product with no pinned pipeline_id
 *  drops to the legacy saturation+sharpen stub at runtime — looks
 *  like the photo passed through unchanged. */
export async function getDefaultPipelineForMode(mode: GiftMode): Promise<GiftPipeline | null> {
  const sb = createClient();
  const DEFAULT_SLUGS: Record<GiftMode, string> = {
    laser: 'laser-v1',
    uv: 'uv-flat-v1',
    embroidery: 'embroidery-4c-v1',
    'photo-resize': 'photo-resize-v1',
    'eco-solvent': 'photo-resize-v1',
    'digital':     'photo-resize-v1',
    'uv-dtf':      'photo-resize-v1',
  };
  const { data: canonical } = await sb
    .from('gift_pipelines').select('*')
    .eq('slug', DEFAULT_SLUGS[mode]).maybeSingle();
  if (canonical) return canonical as GiftPipeline;
  // Self-heal when the canonical slug isn't seeded: prefer an active
  // passthrough pipeline for this kind (photo unchanged, no surprise
  // AI transform). Returning null falls into runAiTransform's legacy
  // stub which is also passthrough-ish — but having a real pipeline
  // row means the dispatcher takes the explicit passthrough branch.
  const { data: passthrough } = await sb
    .from('gift_pipelines').select('*')
    .eq('kind', mode).eq('is_active', true).eq('provider', 'passthrough')
    .order('name').limit(1);
  if (passthrough && passthrough[0]) return passthrough[0] as GiftPipeline;
  return null;
}
