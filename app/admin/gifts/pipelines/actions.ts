'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function parseParams(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function resolveModelSlug(form: FormData): string | null {
  // Form has `ai_model_slug_preset` (dropdown) + `ai_model_slug_custom`
  // (text). __custom__ sentinel means "use the custom field". Anything
  // else is the preset value. Empty string = clear.
  const preset = String(form.get('ai_model_slug_preset') ?? '').trim();
  const custom = String(form.get('ai_model_slug_custom') ?? '').trim();
  if (preset === '__custom__') return custom || null;
  if (preset === '') return null;
  return preset;
}

const VALID_PROVIDERS = new Set(['passthrough', 'replicate']);
function resolveProvider(form: FormData): 'passthrough' | 'replicate' {
  const v = String(form.get('provider') ?? '').trim();
  return VALID_PROVIDERS.has(v) ? (v as 'passthrough' | 'replicate') : 'replicate';
}

// Reject misconfigurations at save time so admin doesn't ship a
// silently broken pipeline (provider=replicate + no model would
// crash on first customer use).
function validatePipelineForm(form: FormData): string | null {
  const provider = resolveProvider(form);
  const model = resolveModelSlug(form);
  if (provider === 'replicate' && !model) {
    return 'Pick an AI model — Replicate provider needs one (try google/nano-banana).';
  }
  return null;
}

export async function createPipeline(form: FormData) {
  const validationError = validatePipelineForm(form);
  if (validationError) throw new Error(validationError);
  const sb = createClient();
  const { data, error } = await sb.from('gift_pipelines').insert({
    slug: String(form.get('slug') ?? '').trim(),
    name: String(form.get('name') ?? '').trim(),
    description: (String(form.get('description') ?? '').trim()) || null,
    kind: String(form.get('kind') ?? ''),
    provider: resolveProvider(form),
    ai_endpoint_url: (String(form.get('ai_endpoint_url') ?? '').trim()) || null,
    ai_model_slug: resolveModelSlug(form),
    default_params: parseParams(form.get('default_params')),
    thumbnail_url: (String(form.get('thumbnail_url') ?? '').trim()) || null,
    is_active: form.get('is_active') === 'on',
  }).select('id').single();
  if (error) throw new Error(`createPipeline: ${error.message}`);
  revalidatePath('/admin/gifts/pipelines');
  redirect(`/admin/gifts/pipelines/${data!.id}`);
}

export async function updatePipeline(id: string, form: FormData) {
  const validationError = validatePipelineForm(form);
  if (validationError) throw new Error(validationError);
  const sb = createClient();
  const { error } = await sb.from('gift_pipelines').update({
    name: String(form.get('name') ?? '').trim(),
    description: (String(form.get('description') ?? '').trim()) || null,
    kind: String(form.get('kind') ?? ''),
    provider: resolveProvider(form),
    ai_endpoint_url: (String(form.get('ai_endpoint_url') ?? '').trim()) || null,
    ai_model_slug: resolveModelSlug(form),
    default_params: parseParams(form.get('default_params')),
    thumbnail_url: (String(form.get('thumbnail_url') ?? '').trim()) || null,
    is_active: form.get('is_active') === 'on',
  }).eq('id', id);
  if (error) throw new Error(`updatePipeline: ${error.message}`);
  revalidatePath('/admin/gifts/pipelines');
  revalidatePath(`/admin/gifts/pipelines/${id}`);
}

export async function deletePipeline(id: string) {
  const sb = createClient();
  const { error } = await sb.from('gift_pipelines').delete().eq('id', id);
  if (error) throw new Error(`deletePipeline: ${error.message}`);
  revalidatePath('/admin/gifts/pipelines');
  redirect('/admin/gifts/pipelines');
}
