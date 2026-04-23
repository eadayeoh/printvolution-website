'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { putObject, GIFT_BUCKETS } from '@/lib/gifts/storage';
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
  mode: z.enum(['laser', 'uv', 'embroidery', 'photo-resize', 'eco-solvent', 'digital', 'uv-dtf']),
  // Optional second production method — max 2 modes per product. When
  // set, variant surface / template zone mode dropdowns are limited to
  // {mode, secondary_mode}. Validated distinct from `mode` below.
  secondary_mode: z
    .enum(['laser', 'uv', 'embroidery', 'photo-resize', 'eco-solvent', 'digital', 'uv-dtf'])
    .nullable()
    .optional(),
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
  mockup_url: z.string().nullable().optional(),
  mockup_area: z.object({
    x: z.number(), y: z.number(), width: z.number(), height: z.number(),
  }).nullable().optional(),
  // Admin-authored content overrides. NULL / empty = component falls
  // back to mode-based defaults.
  seo_body: z.string().nullable().optional(),
  seo_magazine: z.any().nullable().optional(),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).nullable().optional(),
  // Migration 0035 additions
  pipeline_id: z.string().uuid().nullable().optional(),
  // Migration 0047 — pipeline override for the secondary mode.
  secondary_pipeline_id: z.string().uuid().nullable().optional(),
  source_retention_days: z.number().int().min(1).default(30),
});

function validateModes(p: { mode?: string; secondary_mode?: string | null }) {
  if (p.secondary_mode && p.mode && p.secondary_mode === p.mode) {
    return 'Secondary mode must differ from the primary mode — pick a different one, or clear it to keep the product single-mode.';
  }
  return null;
}

export async function createGiftProduct(input: z.input<typeof GiftProductSchema>) {
  const sb = await requireAdmin();
  const parsed = GiftProductSchema.parse(input);
  const err = validateModes(parsed);
  if (err) return { ok: false as const, error: err };
  const { data, error } = await sb.from('gift_products').insert(parsed as any).select('id').single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts');
  return { ok: true as const, id: data.id };
}

export async function updateGiftProduct(id: string, input: Partial<z.input<typeof GiftProductSchema>>) {
  const sb = await requireAdmin();
  const err = validateModes(input);
  if (err) return { ok: false as const, error: err };
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

// ---------------------------------------------------------------------------
// GIFT MODES metadata (label / description / icon / order / active)
// ---------------------------------------------------------------------------
// Slug is the Postgres gift_mode enum value — NOT editable (each enum
// value has a distinct render strategy wired into lib/gifts/pipeline.ts).
// Everything else on the row is admin-editable from /admin/gifts/modes.

const ModeSchema = z.object({
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function updateGiftMode(slug: string, input: z.input<typeof ModeSchema>) {
  const sb = await requireAdmin();
  const parsed = ModeSchema.parse(input);
  const { error } = await sb.from('gift_modes').update(parsed).eq('slug', slug);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/modes');
  revalidatePath('/admin/gifts');
  return { ok: true as const };
}

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
  reference_width_mm:  z.number().positive().nullable().optional(),
  reference_height_mm: z.number().positive().nullable().optional(),
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

// ---------------------------------------------------------------------------
// GIFT PROMPTS CRUD (mode-level transformation presets)
// ---------------------------------------------------------------------------

const PromptSchema = z.object({
  mode: z.enum(['laser', 'uv', 'embroidery']),
  style: z.enum(['line-art', 'realistic']).default('line-art'),
  pipeline_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  transformation_prompt: z.string().default(''),
  negative_prompt: z.string().nullable().optional(),
  params: z.record(z.string(), z.unknown()).default({}),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function createGiftPrompt(input: z.input<typeof PromptSchema>) {
  const sb = await requireAdmin();
  const parsed = PromptSchema.parse(input);
  const { data, error } = await sb.from('gift_prompts').insert(parsed as any).select('id').single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/prompts');
  return { ok: true as const, id: data.id };
}

export async function updateGiftPrompt(id: string, input: Partial<z.input<typeof PromptSchema>>) {
  const sb = await requireAdmin();
  const { error } = await sb.from('gift_prompts').update(input as any).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/prompts');
  revalidatePath(`/admin/gifts/prompts/${id}`);
  return { ok: true as const };
}

export async function deleteGiftPrompt(id: string) {
  const sb = await requireAdmin();
  const { error } = await sb.from('gift_prompts').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/prompts');
  return { ok: true as const };
}

/**
 * Short-lived signed URL for a private gift asset (source / production /
 * pdf). Used by the admin order page to let admins download production
 * files. Customers cannot call this — requireAdmin enforces.
 */
export async function signGiftAssetUrl(assetId: string, expiresInSec = 300): Promise<{ ok: boolean; url?: string; error?: string }> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e.message }; }
  const sb = (await import('@/lib/supabase/server')).createClient();
  const { data: asset } = await sb.from('gift_assets').select('bucket, path').eq('id', assetId).maybeSingle();
  if (!asset) return { ok: false, error: 'Asset not found' };
  try {
    const { signUrl } = await import('@/lib/gifts/storage');
    const url = await signUrl(asset.bucket as string, asset.path as string, expiresInSec);
    return { ok: true, url };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * Quick test: admin uploads a sample photo with a prompt's transformation
 * settings (without saving the prompt first). Returns a preview URL.
 */
export async function testGiftPrompt(formData: FormData): Promise<{ ok: boolean; previewUrl?: string; error?: string }> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e.message }; }
  const file = formData.get('file');
  const mode = (formData.get('mode') || '').toString() as 'laser' | 'uv' | 'embroidery';
  const transformationPrompt = (formData.get('transformation_prompt') || '').toString();
  const negativePrompt = (formData.get('negative_prompt') || '').toString();

  if (!(file instanceof File)) return { ok: false, error: 'No file' };
  if (!['laser', 'uv', 'embroidery'].includes(mode)) return { ok: false, error: 'Invalid mode' };
  if (file.size === 0) return { ok: false, error: 'Empty file' };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: 'File too large (max 20 MB)' };

  try {
    const { runPreviewPipeline } = await import('@/lib/gifts/pipeline');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const fakeProduct: any = {
      slug: 'prompt-test',
      name: 'Prompt Test',
      mode,
      width_mm: 100, height_mm: 100, bleed_mm: 2, safe_zone_mm: 3,
      ai_prompt: transformationPrompt,
      ai_negative_prompt: negativePrompt || null,
      ai_params: {},
    };
    const out = await runPreviewPipeline({
      product: fakeProduct,
      sourceBytes: bytes,
      sourceMime: file.type,
      cropRect: null,
    });
    return { ok: true, previewUrl: out.previewPublicUrl };
  } catch (e: any) {
    return { ok: false, error: e.message ?? 'test failed' };
  }
}

/** Re-run the production pipeline for a failed or stale gift line */
export async function rerunGiftProduction(lineId: string): Promise<{ ok: boolean; error?: string }> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e.message }; }
  const sb = (await import('@/lib/gifts/storage')).serviceClient();
  const { data: line } = await sb.from('gift_order_items').select('id, gift_product_id, source_asset_id, mode').eq('id', lineId).maybeSingle();
  if (!line) return { ok: false, error: 'Line not found' };
  if (!line.source_asset_id) return { ok: false, error: 'No source asset on this line' };

  await sb.from('gift_order_items').update({ production_status: 'processing', production_error: null }).eq('id', lineId);
  try {
    const [{ data: product }, { data: source }] = await Promise.all([
      sb.from('gift_products').select('*').eq('id', line.gift_product_id).maybeSingle(),
      sb.from('gift_assets').select('path, mime_type').eq('id', line.source_asset_id).maybeSingle(),
    ]);
    if (!product || !source) throw new Error('Product or source missing');
    const { runProductionPipeline } = await import('@/lib/gifts/pipeline');
    const { GIFT_BUCKETS } = await import('@/lib/gifts/storage');
    const out = await runProductionPipeline({
      product: product as any, sourcePath: source.path as string, sourceMime: (source.mime_type as string) ?? 'image/jpeg',
    });
    const { data: prodAsset } = await sb.from('gift_assets').insert({
      role: 'production', bucket: GIFT_BUCKETS.production, path: out.productionPath, mime_type: out.productionMime,
      width_px: out.widthPx, height_px: out.heightPx, dpi: out.dpi,
    }).select('id').single();
    const { data: pdfAsset } = await sb.from('gift_assets').insert({
      role: 'production-pdf', bucket: GIFT_BUCKETS.production, path: out.productionPdfPath, mime_type: out.productionPdfMime,
    }).select('id').single();
    await sb.from('gift_order_items').update({
      production_asset_id: prodAsset?.id ?? null,
      production_pdf_id: pdfAsset?.id ?? null,
      production_status: 'ready',
    }).eq('id', lineId);
    return { ok: true };
  } catch (e: any) {
    await sb.from('gift_order_items').update({ production_status: 'failed', production_error: e?.message ?? 'unknown' }).eq('id', lineId);
    return { ok: false, error: e.message };
  }
}

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

// ---------------------------------------------------------------------------
// GIFT PRODUCT VARIANTS (migration 0034) — per-product physical bases
// ---------------------------------------------------------------------------

const VariantSchema = z.object({
  id: z.string().uuid().optional(),
  gift_product_id: z.string().uuid(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  features: z.array(z.string()).default([]),
  // Mockup image is only meaningful for base variants (LED stand A / B / C).
  // Size / colour / material variants typically reuse the product's
  // mockup, so these are relaxed to allow an empty string.
  mockup_url: z.string().default(''),
  mockup_area: z.object({
    x: z.number(), y: z.number(), width: z.number(), height: z.number(),
  }),
  variant_thumbnail_url: z.string().nullable().optional(),
  base_price_cents: z.number().int().min(0).default(0),
  price_tiers: z.array(z.object({
    qty: z.number().int().positive(), price_cents: z.number().int().min(0),
  })).default([]),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  variant_kind: z.enum(['base', 'size', 'colour', 'material']).default('base'),
  width_mm:  z.number().positive().nullable().optional(),
  height_mm: z.number().positive().nullable().optional(),
  colour_swatches: z
    .array(
      z.object({
        name: z.string().min(1),
        hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex must be #RRGGBB'),
        mockup_url: z.string().min(1),
      }),
    )
    .default([]),
  surfaces: z
    .array(
      z.object({
        id: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Surface id must be lowercase-slug'),
        label: z.string().min(1),
        accepts: z.enum(['photo', 'text', 'both']),
        // Mockup image for the customer-facing preview only. Optional —
        // text-only surfaces render fine on a blank background, and
        // production never uses this field. If omitted, the parent
        // variant's mockup_url serves as the fallback visual at render
        // time.
        mockup_url: z.string().default(''),
        mockup_area: z.object({
          x: z.number(), y: z.number(), width: z.number(), height: z.number(),
        }),
        max_chars: z.number().int().positive().nullable().optional(),
        font_family: z.string().nullable().optional(),
        font_size_pct: z.number().positive().nullable().optional(),
        color: z.string().nullable().optional(),
        // Optional per-surface production method. Null = inherit parent.
        mode: z
          .enum(['laser', 'uv', 'embroidery', 'photo-resize', 'eco-solvent', 'digital', 'uv-dtf'])
          .nullable()
          .optional(),
      }),
    )
    .default([]),
});

export async function upsertGiftVariant(input: z.input<typeof VariantSchema>) {
  const sb = await requireAdmin();
  const parsed = VariantSchema.parse(input);
  const { id, ...row } = parsed as any;
  if (id) {
    const { error } = await sb.from('gift_product_variants').update(row).eq('id', id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await sb.from('gift_product_variants').insert(row);
    if (error) return { ok: false as const, error: error.message };
  }
  revalidatePath(`/admin/gifts/${parsed.gift_product_id}`);
  revalidatePath(`/gift/${parsed.gift_product_id}`);
  return { ok: true as const };
}

export async function deleteGiftVariant(id: string) {
  const sb = await requireAdmin();
  const { error } = await sb.from('gift_product_variants').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts');
  return { ok: true as const };
}
