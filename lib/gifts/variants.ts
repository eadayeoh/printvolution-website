import { createClient } from '@/lib/supabase/server';
import type { GiftProductVariant, GiftVariantColourSwatch, GiftVariantSurface } from './types';

// Defensive coercion: migrations 0042 + 0044 give every row non-null
// defaults (`[]`), but older local DBs / staging envs may still have
// rows where the columns are missing entirely. Treat any non-array
// value as empty.
function normalise(row: any): GiftProductVariant {
  const swatches: GiftVariantColourSwatch[] = Array.isArray(row?.colour_swatches) ? row.colour_swatches : [];
  const surfaces: GiftVariantSurface[] = Array.isArray(row?.surfaces) ? row.surfaces : [];
  return { ...(row as GiftProductVariant), colour_swatches: swatches, surfaces };
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
