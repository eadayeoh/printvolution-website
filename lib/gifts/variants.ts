import { createClient } from '@/lib/supabase/server';
import type { GiftProductVariant, GiftVariantColourSwatch } from './types';

// Defensive coercion: migration 0042 gives every row a non-null default
// `[]`, but older local DBs / staging envs may still have rows where
// the column is missing entirely. Treat any non-array value as empty.
function normalise(row: any): GiftProductVariant {
  const raw = row?.colour_swatches;
  const swatches: GiftVariantColourSwatch[] = Array.isArray(raw) ? raw : [];
  return { ...(row as GiftProductVariant), colour_swatches: swatches };
}

export async function listActiveVariants(giftProductId: string): Promise<GiftProductVariant[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_product_variants').select('*')
    .eq('gift_product_id', giftProductId).eq('is_active', true)
    .order('display_order');
  return (data ?? []).map(normalise);
}

export async function listAllVariantsAdmin(giftProductId: string): Promise<GiftProductVariant[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_product_variants').select('*')
    .eq('gift_product_id', giftProductId)
    .order('display_order');
  return (data ?? []).map(normalise);
}

export async function getVariantById(id: string): Promise<GiftProductVariant | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_product_variants').select('*').eq('id', id).maybeSingle();
  return data ? normalise(data) : null;
}
