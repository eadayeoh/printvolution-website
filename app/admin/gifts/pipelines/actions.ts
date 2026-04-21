'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function parseParams(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export async function createPipeline(form: FormData) {
  const sb = createClient();
  const { data, error } = await sb.from('gift_pipelines').insert({
    slug: String(form.get('slug') ?? '').trim(),
    name: String(form.get('name') ?? '').trim(),
    description: (String(form.get('description') ?? '').trim()) || null,
    kind: String(form.get('kind') ?? ''),
    ai_endpoint_url: (String(form.get('ai_endpoint_url') ?? '').trim()) || null,
    ai_model_slug: (String(form.get('ai_model_slug') ?? '').trim()) || null,
    default_params: parseParams(form.get('default_params')),
    thumbnail_url: (String(form.get('thumbnail_url') ?? '').trim()) || null,
    is_active: form.get('is_active') === 'on',
  }).select('id').single();
  if (error) throw new Error(`createPipeline: ${error.message}`);
  revalidatePath('/admin/gifts/pipelines');
  redirect(`/admin/gifts/pipelines/${data!.id}`);
}

export async function updatePipeline(id: string, form: FormData) {
  const sb = createClient();
  const { error } = await sb.from('gift_pipelines').update({
    name: String(form.get('name') ?? '').trim(),
    description: (String(form.get('description') ?? '').trim()) || null,
    kind: String(form.get('kind') ?? ''),
    ai_endpoint_url: (String(form.get('ai_endpoint_url') ?? '').trim()) || null,
    ai_model_slug: (String(form.get('ai_model_slug') ?? '').trim()) || null,
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
