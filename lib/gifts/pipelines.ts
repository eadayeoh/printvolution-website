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
 *  New modes (eco-solvent / digital / uv-dtf) don't have a dedicated
 *  default yet — admin picks explicitly via product.pipeline_id, or we
 *  fall back to photo-resize (no AI transform, just crop + bleed). */
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
  const { data } = await sb.from('gift_pipelines').select('*').eq('slug', DEFAULT_SLUGS[mode]).maybeSingle();
  return data as GiftPipeline | null;
}
