'use server';

import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';

export type OptionImageRow = {
  id: string;
  url: string;
  label: string;
  created_at: string;
};

/** List the shared option-image library. Sorted most-recent first so
 *  admins see what they just uploaded at the top. */
export async function listOptionImages(): Promise<
  { ok: true; rows: OptionImageRow[] } | { ok: false; error: string }
> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('option_image_library')
    .select('id, url, label, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return { ok: false, error: error.message };
  return { ok: true, rows: (data ?? []) as OptionImageRow[] };
}

/** Add a row to the library. Called after a successful upload so the
 *  image can be reused on other products without re-uploading. Label
 *  is supplied by the caller — usually the current option label. */
export async function createOptionImage(input: {
  url: string;
  label: string;
}): Promise<{ ok: true; row: OptionImageRow } | { ok: false; error: string }> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  if (!input.url) return { ok: false, error: 'url required' };
  const label = (input.label || 'Untitled').trim().slice(0, 200);
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('option_image_library')
    .insert({ url: input.url, label })
    .select('id, url, label, created_at')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data as OptionImageRow };
}

/** Rename an existing library row. Renaming is useful when admins
 *  upload with a generic label and later want to tidy up. */
export async function renameOptionImage(input: {
  id: string;
  label: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const label = (input.label || '').trim();
  if (!input.id || !label) return { ok: false, error: 'id and label required' };
  const sb = createServiceClient();
  const { error } = await sb.from('option_image_library').update({ label: label.slice(0, 200) }).eq('id', input.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Delete a library row. Doesn't touch Supabase Storage — the blob
 *  stays so any products already using the URL keep rendering. */
export async function deleteOptionImage(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  if (!id) return { ok: false, error: 'id required' };
  const sb = createServiceClient();
  const { error } = await sb.from('option_image_library').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
