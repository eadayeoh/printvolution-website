import { createClient } from '@/lib/supabase/server';
import type { GiftMode } from './types';

export type GiftModeMeta = {
  slug: GiftMode;
  label: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
};

/** Customer-facing + editor-facing view: only active modes, ordered. */
export async function listActiveModes(): Promise<GiftModeMeta[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_modes')
    .select('*')
    .eq('is_active', true)
    .order('display_order')
    .order('slug');
  return (data ?? []) as GiftModeMeta[];
}

/** Admin view: all modes including inactive ones. */
export async function listAllModesAdmin(): Promise<GiftModeMeta[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_modes')
    .select('*')
    .order('display_order')
    .order('slug');
  return (data ?? []) as GiftModeMeta[];
}

export async function getModeBySlug(slug: GiftMode): Promise<GiftModeMeta | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_modes').select('*').eq('slug', slug).maybeSingle();
  return data as GiftModeMeta | null;
}
