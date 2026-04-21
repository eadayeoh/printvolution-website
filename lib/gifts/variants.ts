import { createClient } from '@/lib/supabase/server';
import type { GiftProductVariant } from './types';

export async function listActiveVariants(giftProductId: string): Promise<GiftProductVariant[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_product_variants').select('*')
    .eq('gift_product_id', giftProductId).eq('is_active', true)
    .order('display_order');
  return (data ?? []) as GiftProductVariant[];
}

export async function listAllVariantsAdmin(giftProductId: string): Promise<GiftProductVariant[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_product_variants').select('*')
    .eq('gift_product_id', giftProductId)
    .order('display_order');
  return (data ?? []) as GiftProductVariant[];
}

export async function getVariantById(id: string): Promise<GiftProductVariant | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_product_variants').select('*').eq('id', id).maybeSingle();
  return data as GiftProductVariant | null;
}
