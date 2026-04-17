import { createClient } from '@/lib/supabase/server';
import type { GiftProduct, GiftTemplate } from './types';

/** Public catalog listing (customer-facing) */
export async function listActiveGiftProducts(): Promise<GiftProduct[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_products')
    .select('*')
    .eq('is_active', true)
    .order('name');
  return (data ?? []) as any[];
}

export async function getGiftProductBySlug(slug: string): Promise<GiftProduct | null> {
  const sb = createClient();
  const { data } = await sb.from('gift_products').select('*').eq('slug', slug).maybeSingle();
  if (!data) return null;
  return data as any;
}

/** Admin listing (shows inactive too) */
export async function listAllGiftProductsAdmin() {
  const sb = createClient();
  const { data } = await sb
    .from('gift_products')
    .select('*')
    .order('updated_at', { ascending: false });
  return (data ?? []) as GiftProduct[];
}

export async function getGiftProductByIdAdmin(id: string) {
  const sb = createClient();
  const { data } = await sb.from('gift_products').select('*').eq('id', id).maybeSingle();
  return data as GiftProduct | null;
}

export async function listTemplatesForProduct(productId: string): Promise<GiftTemplate[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_product_templates')
    .select('display_order, template:gift_templates(*)')
    .eq('gift_product_id', productId)
    .order('display_order');
  return (data ?? [])
    .map((r: any) => r.template)
    .filter((t: any) => t && t.is_active) as GiftTemplate[];
}

export async function listAllTemplatesAdmin(): Promise<GiftTemplate[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_templates')
    .select('*')
    .order('display_order')
    .order('name');
  return (data ?? []) as GiftTemplate[];
}

export async function getTemplateByIdAdmin(id: string) {
  const sb = createClient();
  const { data } = await sb.from('gift_templates').select('*').eq('id', id).maybeSingle();
  return data as GiftTemplate | null;
}

export async function listTemplateAssignments(templateId: string): Promise<string[]> {
  const sb = createClient();
  const { data } = await sb
    .from('gift_product_templates')
    .select('gift_product_id')
    .eq('template_id', templateId);
  return (data ?? []).map((r: any) => r.gift_product_id);
}

export async function listCategoriesForGifts() {
  const sb = createClient();
  const { data } = await sb.from('categories').select('id, slug, name, parent_id').order('name');
  return data ?? [];
}
