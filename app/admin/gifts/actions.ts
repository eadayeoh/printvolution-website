'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { putObject, GIFT_BUCKETS } from '@/lib/gifts/storage';
import type { GiftMode, GiftTemplateMode } from '@/lib/gifts/types';

async function requireAdmin() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    throw new Error('Admin/staff only');
  }
  return sb;
}

// ---------------------------------------------------------------------------
// GIFT PRODUCTS CRUD
// ---------------------------------------------------------------------------

const GiftProductSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, hyphens only'),
  name: z.string().min(1),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  gallery_images: z.array(z.string()).default([]),
  thumbnail_url: z.string().nullable().optional(),
  width_mm: z.number().positive(),
  height_mm: z.number().positive(),
  bleed_mm: z.number().min(0).default(2),
  safe_zone_mm: z.number().min(0).default(3),
  min_source_px: z.number().int().min(300).default(1200),
  mode: z.enum(['laser', 'uv', 'embroidery', 'photo-resize']),
  template_mode: z.enum(['none', 'optional', 'required']).default('none'),
  ai_prompt: z.string().nullable().optional(),
  ai_negative_prompt: z.string().nullable().optional(),
  ai_params: z.record(z.string(), z.unknown()).default({}),
  color_profile: z.string().nullable().optional(),
  base_price_cents: z.number().int().min(0).default(0),
  price_tiers: z.array(z.object({ qty: z.number().int().positive(), price_cents: z.number().int().min(0) })).default([]),
  seo_title: z.string().nullable().optional(),
  seo_desc: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export async function createGiftProduct(input: z.input<typeof GiftProductSchema>) {
  const sb = await requireAdmin();
  const parsed = GiftProductSchema.parse(input);
  const { data, error } = await sb.from('gift_products').insert(parsed as any).select('id').single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts');
  return { ok: true as const, id: data.id };
}

export async function updateGiftProduct(id: string, input: Partial<z.input<typeof GiftProductSchema>>) {
  const sb = await requireAdmin();
  const { error } = await sb.from('gift_products').update(input as any).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts');
  revalidatePath(`/admin/gifts/${id}`);
  return { ok: true as const };
}

export async function deleteGiftProduct(id: string) {
  const sb = await requireAdmin();
  const { error } = await sb.from('gift_products').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts');
  return { ok: true as const };
}

export async function setProductTemplates(productId: string, templateIds: string[]) {
  const sb = await requireAdmin();
  // Clear existing then re-insert
  await sb.from('gift_product_templates').delete().eq('gift_product_id', productId);
  if (templateIds.length > 0) {
    const rows = templateIds.map((id, i) => ({
      gift_product_id: productId,
      template_id: id,
      display_order: i,
    }));
    const { error } = await sb.from('gift_product_templates').insert(rows);
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath(`/admin/gifts/${productId}`);
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// TEMPLATES CRUD
// ---------------------------------------------------------------------------

const TemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  background_url: z.string().nullable().optional(),
  foreground_url: z.string().nullable().optional(),
  zones_json: z.array(z.record(z.string(), z.unknown())).default([]),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function createTemplate(input: z.input<typeof TemplateSchema>) {
  const sb = await requireAdmin();
  const parsed = TemplateSchema.parse(input);
  const { data, error } = await sb.from('gift_templates').insert(parsed as any).select('id').single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/templates');
  return { ok: true as const, id: data.id };
}

export async function updateTemplate(id: string, input: Partial<z.input<typeof TemplateSchema>>) {
  const sb = await requireAdmin();
  const { error } = await sb.from('gift_templates').update(input as any).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/templates');
  revalidatePath(`/admin/gifts/templates/${id}`);
  return { ok: true as const };
}

export async function deleteTemplate(id: string) {
  const sb = await requireAdmin();
  const { error } = await sb.from('gift_templates').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/templates');
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// ASSET UPLOAD — admin-side (for template backgrounds, thumbnails, etc.)
// ---------------------------------------------------------------------------

export async function uploadTemplateAsset(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e.message }; }

  const file = formData.get('file');
  const role = (formData.get('role') || 'template').toString();
  if (!(file instanceof File)) return { ok: false, error: 'No file' };
  if (file.size === 0) return { ok: false, error: 'Empty file' };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: 'File too large (max 20 MB)' };

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || 'bin'}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const { publicUrl } = await putObject(GIFT_BUCKETS.templates, key, bytes, file.type || 'application/octet-stream');
    return { ok: true, url: publicUrl ?? undefined };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
