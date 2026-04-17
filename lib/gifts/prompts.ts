import { createClient } from '@/lib/supabase/server';
import type { GiftMode } from './types';

export type GiftPrompt = {
  id: string;
  mode: GiftMode;
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
    .from('gift_prompts')
    .select('*')
    .eq('mode', mode)
    .eq('is_active', true)
    .order('display_order');
  return (data ?? []) as GiftPrompt[];
}

export async function listAllPromptsAdmin(): Promise<GiftPrompt[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_prompts')
    .select('*')
    .order('mode')
    .order('display_order');
  return (data ?? []) as GiftPrompt[];
}

export async function getPromptByIdAdmin(id: string): Promise<GiftPrompt | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_prompts').select('*').eq('id', id).maybeSingle();
  return data as GiftPrompt | null;
}
