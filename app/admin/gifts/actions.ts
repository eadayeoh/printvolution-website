'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { putObject, GIFT_BUCKETS } from '@/lib/gifts/storage';
import { parseShapeOptions } from '@/lib/gifts/shape-options';
import { requireAdmin as sharedRequireAdmin } from '@/lib/auth/require-admin';

// Local wrapper preserves the historical { sb } return shape used by
// every call site below — `const sb = await requireAdmin()`. The shared
// helper returns more (user, role, actor); call sharedRequireAdmin()
// directly when those are needed.
async function requireAdmin() {
  const { sb } = await sharedRequireAdmin();
  return sb;
}

// ---------------------------------------------------------------------------
// GIFT PRODUCTS CRUD
// ---------------------------------------------------------------------------

const AreaSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const MockupOverrideSchema = z.object({
  url: z.string().min(1),
  area: AreaSchema,
});

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
  preview_max_width_px: z.number().int().min(120).max(2000).nullable().optional(),
  // Mode slug — validated as non-empty string so custom modes added via
  // /admin/gifts/modes (no code change) flow through. The gift_modes
  // table is the source of truth.
  mode: z.string().min(1).max(40),
  // Optional second production method — max 2 modes per product. When
  // set, variant surface / template zone mode dropdowns are limited to
  // {mode, secondary_mode}. Validated distinct from `mode` below.
  secondary_mode: z.string().min(1).max(40).nullable().optional(),
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
  mockup_area: AreaSchema.nullable().optional(),
  // Admin-authored content overrides. NULL / empty = component falls
  // back to mode-based defaults.
  seo_body: z.string().nullable().optional(),
  seo_magazine: z.any().nullable().optional(),
  show_text_step: z.boolean().nullable().optional(),
  // Simple per-product text fields, no template required. Each entry
  // surfaces as one input on the PDP and one `text_<id>:<value>` line
  // in cart notes. Slug-style ids only so the cart-note key is safe.
  extra_text_zones: z
    .array(z.object({
      id: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits, dashes only').min(1).max(40),
      label: z.string().min(1).max(60),
      max_chars: z.number().int().positive().nullable().optional(),
    }))
    .default([]),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).nullable().optional(),
  occasions: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    tip: z.string(),
    suggested: z.string().optional(),
  })).nullable().optional(),
  process_steps: z.array(z.object({
    title: z.string(),
    time: z.string(),
    desc: z.string(),
  })).nullable().optional(),
  shape_options: z.array(z.object({
    kind: z.enum(['cutout', 'rectangle', 'template']),
    label: z.string().min(1),
    price_delta_cents: z.number().int().min(0).default(0),
    template_ids: z.array(z.string().uuid()).optional(),
  })).nullable().optional(),
  figurine_options: z.array(z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, hyphens only'),
    name: z.string().min(1),
    image_url: z.string().min(1),
    price_delta_cents: z.number().int().min(0).default(0),
  })).nullable().optional(),
  figurine_area: AreaSchema.nullable().optional(),
  pipeline_id: z.string().uuid().nullable().optional(),
  secondary_pipeline_id: z.string().uuid().nullable().optional(),
  prompt_ids: z.array(z.string().uuid()).nullable().optional(),
  source_retention_days: z.number().int().min(1).default(30),
  lead_time_days: z.number().int().min(1).default(5),
  allowed_fonts: z.array(z.string().min(1)).default([]),
  sizes: z.array(z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Size slug must be lowercase letters, numbers, hyphens'),
    name: z.string().min(1),
    width_mm: z.number().positive(),
    height_mm: z.number().positive(),
    price_delta_cents: z.number().int().min(0).default(0),
    display_order: z.number().int().default(0),
  })).default([]),
  production_files: z.array(z.enum(['png', 'jpg', 'svg', 'pdf'])).nullable().optional(),
});

/** Pretty-print a Zod error for the admin toast — takes the first
 *  issue so the user isn't swamped. Beats a generic "server-side
 *  exception" when `.parse()` used to throw silently. */
function friendlyZodError(err: z.ZodError): string {
  const issue = err.issues?.[0];
  if (!issue) return 'Validation failed';
  const path = Array.isArray(issue.path) && issue.path.length > 0
    ? ` (${issue.path.join('.')})`
    : '';
  return `${issue.message}${path}`;
}

function validateModes(p: { mode?: string; secondary_mode?: string | null }) {
  if (p.secondary_mode && p.mode && p.secondary_mode === p.mode) {
    return 'Secondary mode must differ from the primary mode — pick a different one, or clear it to keep the product single-mode.';
  }
  return null;
}

function validateShapeOptions(
  input: { shape_options?: unknown },
): string | null {
  if (!input.shape_options) return null;
  try {
    parseShapeOptions(input.shape_options);
  } catch (e: any) {
    return e?.message ?? 'Invalid shape_options';
  }
  return null;
}

/** Reject template-kind shape rows whose templates use modes the product
 *  doesn't support — same rule as setProductTemplates, so there's only
 *  one place for this invariant to drift. */
async function validateShapeTemplatesCompat(
  sb: Awaited<ReturnType<typeof requireAdmin>>,
  input: { mode?: string; secondary_mode?: string | null; shape_options?: unknown },
): Promise<string | null> {
  const raw = Array.isArray(input.shape_options) ? input.shape_options : null;
  if (!raw) return null;
  const tpl = raw.find((s: any) => s?.kind === 'template');
  const ids = tpl && Array.isArray(tpl.template_ids) ? (tpl.template_ids as string[]) : [];
  if (ids.length === 0) return null;
  const { data: templates } = await sb
    .from('gift_templates')
    .select('id, name, zones_json')
    .in('id', ids);
  const allowed = new Set<string>([
    (input.mode ?? '') as string,
    ...(input.secondary_mode ? [input.secondary_mode as string] : []),
  ].filter(Boolean));
  for (const t of templates ?? []) {
    const zones = Array.isArray((t as any).zones_json) ? (t as any).zones_json : [];
    for (const z of zones) {
      if (z?.mode && !allowed.has(z.mode)) {
        return `Template "${(t as any).name}" uses mode ${z.mode} which isn't enabled on this product.`;
      }
    }
  }
  return null;
}

/** Resolve the effective thumbnail_url to write. Admin-set value
 *  wins; falls back to product.mockup_url (already on the row being
 *  saved), then to the first active variant's mockup_url. Keeps the
 *  thumbnail_url column populated so all catalogue surfaces
 *  (homepage tiles, mega menu cards, cart line icons) keep working
 *  without admin uploading the same shot twice. */
async function resolveGiftThumbnail(
  sb: Awaited<ReturnType<typeof requireAdmin>>,
  productId: string | null,
  incoming: { thumbnail_url?: string | null; mockup_url?: string | null },
): Promise<string | null | undefined> {
  if (typeof incoming.thumbnail_url === 'string' && incoming.thumbnail_url.trim()) return incoming.thumbnail_url;
  if (typeof incoming.mockup_url === 'string' && incoming.mockup_url.trim()) return incoming.mockup_url;
  if (!productId) return incoming.thumbnail_url;
  const { data: variants } = await sb
    .from('gift_product_variants')
    .select('mockup_url')
    .eq('gift_product_id', productId)
    .eq('is_active', true)
    .order('display_order')
    .limit(1);
  const first = variants?.[0]?.mockup_url;
  if (typeof first === 'string' && first.trim()) return first;
  return incoming.thumbnail_url ?? null;
}

/** Resolve the effective base_price_cents to write. Admin-set positive
 *  value wins. When admin left it at 0 AND the product has variants
 *  with positive prices, auto-derive as the lowest variant price so
 *  catalogue "from $X" cards stay accurate without manual upkeep. */
async function resolveBasePrice(
  sb: Awaited<ReturnType<typeof requireAdmin>>,
  productId: string | null,
  incomingBase: number | undefined,
): Promise<number | undefined> {
  if (typeof incomingBase === 'number' && incomingBase > 0) return incomingBase;
  if (!productId) return incomingBase;
  const { data: vs } = await sb
    .from('gift_product_variants')
    .select('base_price_cents, is_active')
    .eq('gift_product_id', productId);
  const prices = (vs ?? [])
    .filter((v: any) => v.is_active !== false && typeof v.base_price_cents === 'number' && v.base_price_cents > 0)
    .map((v: any) => v.base_price_cents as number);
  if (prices.length === 0) return incomingBase;
  return Math.min(...prices);
}

export async function createGiftProduct(input: z.input<typeof GiftProductSchema>) {
  const sb = await requireAdmin();
  const parseResult = GiftProductSchema.safeParse(input);
  if (!parseResult.success) {
    return { ok: false as const, error: friendlyZodError(parseResult.error) };
  }
  const parsed = parseResult.data;
  const err = validateModes(parsed);
  if (err) return { ok: false as const, error: err };
  const shapeErr = validateShapeOptions(parsed);
  if (shapeErr) return { ok: false as const, error: shapeErr };
  const tplErr = await validateShapeTemplatesCompat(sb, parsed);
  if (tplErr) return { ok: false as const, error: tplErr };
  // Can't auto-derive here — variants don't exist until after insert.
  // Admin's manual value (or 0) goes in as-is. First variant save
  // triggers recomputeParentBasePrice which fills it.
  const { data, error } = await sb.from('gift_products').insert(parsed as any).select('id').single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts');
  return { ok: true as const, id: data.id };
}

export async function updateGiftProduct(id: string, input: Partial<z.input<typeof GiftProductSchema>>) {
  const sb = await requireAdmin();
  const err = validateModes(input);
  if (err) return { ok: false as const, error: err };
  const shapeErr = validateShapeOptions(input);
  if (shapeErr) return { ok: false as const, error: shapeErr };
  const tplErr = await validateShapeTemplatesCompat(sb, input);
  if (tplErr) return { ok: false as const, error: tplErr };
  // Auto-derive base price from variants when admin saves with 0.
  const effectiveBase = await resolveBasePrice(sb, id, input.base_price_cents);
  // Auto-derive thumbnail: admin value → mockup_url → first variant.
  const effectiveThumb = await resolveGiftThumbnail(sb, id, {
    thumbnail_url: input.thumbnail_url ?? null,
    mockup_url: input.mockup_url ?? null,
  });
  const patch = {
    ...input,
    ...(effectiveBase !== undefined ? { base_price_cents: effectiveBase } : {}),
    thumbnail_url: effectiveThumb ?? null,
  };
  // Need the slug to revalidate the customer PDP cache.
  const { data: slugRow } = await sb.from('gift_products').select('slug').eq('id', id).maybeSingle();
  const { error } = await sb.from('gift_products').update(patch as any).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts');
  revalidatePath(`/admin/gifts/${id}`);
  const slug = (slugRow as { slug: string } | null)?.slug;
  if (slug) revalidatePath(`/gift/${slug}`);
  revalidatePath('/gifts');
  return { ok: true as const };
}

export async function deleteGiftProduct(id: string) {
  const sb = await requireAdmin();
  // Refuse hard-delete if any gift_order_items still reference this
  // product. The FK is set null on delete, which would silently break
  // every order's render. Admin should soft-delete (is_active=false)
  // for retired products instead.
  const { count } = await sb
    .from('gift_order_items')
    .select('id', { count: 'exact', head: true })
    .eq('gift_product_id', id);
  if ((count ?? 0) > 0) {
    return {
      ok: false as const,
      error: `Cannot delete — ${count} order line(s) still reference this gift. Set the product to inactive instead.`,
    };
  }
  const { error } = await sb.from('gift_products').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts');
  revalidatePath('/gifts');
  return { ok: true as const };
}

export async function setProductTemplates(productId: string, templateIds: string[]) {
  const sb = await requireAdmin();

  // Mode-vs-zone validation used to live here ("UV-template on a
  // laser product"); admins explicitly want the freedom to attach
  // any template regardless of its zone modes. The production
  // pipeline already dispatches per-zone mode at fan-out time, so
  // off-mode zones still produce correctly — they just route through
  // their own pipeline rather than the product's primary.

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

const NewModeSchema = ModeSchema.extend({
  // Slug is fixed once created — orders, prompts and surfaces reference it
  // by string. Letters, digits and dashes only so it stays URL-safe.
  slug: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and dashes only'),
});

export async function createGiftMode(input: z.input<typeof NewModeSchema>) {
  const sb = await requireAdmin();
  const parsed = NewModeSchema.parse(input);
  const { error } = await sb.from('gift_modes').insert(parsed);
  if (error) {
    // Surface a nicer message for the duplicate-slug case (Postgres 23505).
    if (error.code === '23505') return { ok: false as const, error: 'A mode with that slug already exists.' };
    return { ok: false as const, error: error.message };
  }
  revalidatePath('/admin/gifts/modes');
  revalidatePath('/admin/gifts');
  return { ok: true as const };
}

// ---------------------------------------------------------------------------

// Zone shape — at minimum, every saved zone must have id + type + the
// four mm dimensions. Other fields (font_family, color, etc.) are
// type-specific; we accept them via .passthrough() so the schema
// doesn't have to enumerate every possible variant. Without this,
// zones_json was z.record(unknown) which let admin save objects with
// no id at all, breaking the renderer at customer time.
const ZoneShape = z.object({
  id: z.string().min(1),
  type: z.enum(['image', 'text', 'calendar', 'render_anchor', 'shape']),
  x_mm: z.number().finite(),
  y_mm: z.number().finite(),
  width_mm: z.number().finite().positive(),
  height_mm: z.number().finite().positive(),
}).passthrough();

const TemplateSchema = z.object({
  name: z.string().min(1),
  // Bucket label for the templates-list page. NULL / empty → "Ungrouped".
  // Without this in the schema, Zod strips it before the DB update and
  // every save silently reverts the group dropdown.
  group_name: z.string().nullable().optional(),
  // Per-template upcharge (in cents) — added to expected unit price
  // at checkout when this template is selected. Server-side floor
  // enforces it; client-side display surfaces it on the picker tile.
  price_delta_cents: z.number().int().nonnegative().default(0).optional(),
  description: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  background_url: z.string().nullable().optional(),
  foreground_url: z.string().nullable().optional(),
  zones_json: z.array(ZoneShape).default([]),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  reference_width_mm:  z.number().positive().nullable().optional(),
  reference_height_mm: z.number().positive().nullable().optional(),
  customer_can_recolor: z.boolean().default(false),
  customer_can_recolor_background: z.boolean().optional(),
  customer_can_recolor_text: z.boolean().optional(),
  customer_can_recolor_calendar: z.boolean().optional(),
  customer_can_change_font: z.boolean().default(false),
  // Per-template customer colour picker (migration 0079).
  customer_picker_role: z.enum(['none', 'mockup_swap', 'foil_overlay']).nullable().optional(),
  customer_swatches: z
    .array(
      z.object({
        name: z.string().min(1),
        hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex must be #RRGGBB'),
        mockup_url: z.string().default(''),
      }),
    )
    .default([])
    .refine(
      (arr) => {
        const names = arr.map((s) => s.name.trim().toLowerCase());
        return new Set(names).size === names.length;
      },
      { message: 'Swatch names must be unique (case-insensitive).' },
    ),
  // Per-template production-mode override (migration 0080). Free-form
  // string — must match a gift_modes.slug, but no DB FK so admins can
  // add custom slugs at runtime without breaking this validation.
  mode_override: z.string().min(1).max(40).nullable().optional(),
  // Date-windowed occasion FK (migration 0084). NULL = always-on. When
  // set, the customer-facing PDP only shows the template inside the
  // occasion's date window.
  occasion_id: z.string().uuid().nullable().optional(),
  allowed_shape_kinds: z.array(z.enum(['cutout', 'rectangle', 'template'])).nullable().optional(),
  production_files: z.array(z.enum(['png', 'jpg', 'svg', 'pdf'])).nullable().optional(),
});

/** Validates that mode_override (if set) matches an active gift_modes
 *  row. Without this check, admin could save mode_override='nonexistent'
 *  and the customer-facing checkout would silently fall back to the
 *  product's primary mode, invisible until someone reports an order
 *  shipped on the wrong machine. */
async function validateModeOverride(sb: any, override: string | null | undefined): Promise<string | null> {
  if (!override) return null;
  const { data: row } = await sb
    .from('gift_modes')
    .select('slug, is_active')
    .eq('slug', override)
    .maybeSingle();
  if (!row) return `mode_override "${override}" is not a known gift_modes slug.`;
  if (row.is_active === false) return `mode_override "${override}" is paused — pick an active mode.`;
  return null;
}

export async function createTemplate(input: z.input<typeof TemplateSchema>) {
  const sb = await requireAdmin();
  const parsed = TemplateSchema.parse(input);
  const modeErr = await validateModeOverride(sb, parsed.mode_override);
  if (modeErr) return { ok: false as const, error: modeErr };
  const { data, error } = await sb.from('gift_templates').insert(parsed as any).select('id').single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/templates');
  return { ok: true as const, id: data.id };
}

export async function updateTemplate(id: string, input: Partial<z.input<typeof TemplateSchema>>) {
  const sb = await requireAdmin();
  // Parse against the partial schema so an admin can't smuggle in
  // unknown fields or types Zod would reject on create. createTemplate
  // already does TemplateSchema.parse(input); this matches.
  const parseResult = TemplateSchema.partial().safeParse(input);
  if (!parseResult.success) {
    return { ok: false as const, error: friendlyZodError(parseResult.error) };
  }
  const parsed = parseResult.data;
  if ('mode_override' in parsed) {
    const modeErr = await validateModeOverride(sb, parsed.mode_override);
    if (modeErr) return { ok: false as const, error: modeErr };
  }
  const { error } = await sb.from('gift_templates').update(parsed as any).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/templates');
  revalidatePath(`/admin/gifts/templates/${id}`);
  return { ok: true as const };
}

export async function deleteTemplate(id: string) {
  const sb = await requireAdmin();
  // Refuse if any gift_order_items still reference this template.
  // FK is non-cascading so order pages would break trying to render
  // the saved template snapshot.
  const { count } = await sb
    .from('gift_order_items')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', id);
  if ((count ?? 0) > 0) {
    return {
      ok: false as const,
      error: `Cannot delete — ${count} order line(s) still reference this template.`,
    };
  }
  const { error } = await sb.from('gift_templates').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/templates');
  return { ok: true as const };
}

/** Bulk-rename every template tagged with `oldName` to `newName`. Used
 *  by the editor's inline "Rename group" action so admins can fix typos
 *  ("LED bases" → "LED Bases") without editing every template. No-op
 *  when names are identical. */
export async function renameTemplateGroup(oldName: string, newName: string) {
  const sb = await requireAdmin();
  const o = oldName.trim();
  const n = newName.trim();
  if (!o) return { ok: false as const, error: 'Old group name required' };
  if (!n) return { ok: false as const, error: 'New group name required' };
  if (o === n) return { ok: true as const, count: 0 };
  const { error, count } = await sb
    .from('gift_templates')
    .update({ group_name: n }, { count: 'exact' })
    .eq('group_name', o);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/templates');
  return { ok: true as const, count: count ?? 0 };
}

/** Drop a group label from every template using it (sets group_name to
 *  null). Templates stay; they just become Ungrouped. */
export async function clearTemplateGroup(name: string) {
  const sb = await requireAdmin();
  const n = name.trim();
  if (!n) return { ok: false as const, error: 'Group name required' };
  const { error, count } = await sb
    .from('gift_templates')
    .update({ group_name: null }, { count: 'exact' })
    .eq('group_name', n);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/templates');
  return { ok: true as const, count: count ?? 0 };
}

// Clone a template's row. Same zones / assets, new id, prefixed name,
// inactive by default so it doesn't ship to customers until reviewed.
// Product assignments (gift_product_templates) are NOT copied — admin
// re-assigns the duplicate where they want it.
export async function duplicateTemplate(id: string) {
  const sb = await requireAdmin();
  const { data: src, error: readErr } = await sb
    .from('gift_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (readErr || !src) return { ok: false as const, error: readErr?.message ?? 'Not found' };
  const { id: _drop, created_at: _c, updated_at: _u, ...rest } = src as any;
  const copy = {
    ...rest,
    name: `Copy of ${src.name}`,
    is_active: false,
  };
  const { data: created, error } = await sb
    .from('gift_templates')
    .insert(copy)
    .select('id')
    .single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/templates');
  return { ok: true as const, id: created.id };
}

// ---------------------------------------------------------------------------
// GIFT OCCASIONS CRUD (date-windowed template visibility — migration 0084)
// ---------------------------------------------------------------------------

const OccasionSchema = z.object({
  name: z.string().min(1),
  badge_label: z.string().nullable().optional(),
  // Plain YYYY-MM-DD; the gift_occasions.target_date column is a DATE.
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  days_before: z.number().int().min(0).default(14),
  days_after:  z.number().int().min(0).default(2),
  is_active:   z.boolean().default(true),
});

export async function createGiftOccasion(input: z.input<typeof OccasionSchema>) {
  const sb = await requireAdmin();
  const parsed = OccasionSchema.parse(input);
  const { data, error } = await sb
    .from('gift_occasions')
    .insert(parsed as any)
    .select('id')
    .single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/occasions');
  return { ok: true as const, id: data.id };
}

export async function updateGiftOccasion(
  id: string,
  input: Partial<z.input<typeof OccasionSchema>>,
) {
  const sb = await requireAdmin();
  const { error } = await sb.from('gift_occasions').update(input as any).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/occasions');
  revalidatePath(`/admin/gifts/occasions/${id}`);
  // Templates whose occasion changed: regenerate the templates list +
  // any PDP that may render them.
  revalidatePath('/admin/gifts/templates');
  return { ok: true as const };
}

export async function deleteGiftOccasion(id: string) {
  const sb = await requireAdmin();
  // gift_templates.occasion_id is ON DELETE SET NULL — affected templates
  // simply revert to always-on, no cascade pain.
  const { error } = await sb.from('gift_occasions').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/gifts/occasions');
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
  applies_to_template_ids: z.array(z.string().uuid()).nullable().optional(),
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
  const pipelineId = (formData.get('pipeline_id') || '').toString() || null;

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
      // Pin to the prompt's pipeline so the test runs the same AI
      // config the customer would hit. Without this the runtime falls
      // back to the mode default — which may not exist in the DB,
      // collapsing to a legacy passthrough.
      pipeline_id: pipelineId,
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

/** Re-run the production pipeline for a failed or stale gift line.
 *  Three rules: (1) surface lines fan out per surface, (2) the status
 *  CAS prevents two workers running the same line at once, (3) the
 *  per-mode `production_files` JSONB is refreshed for dual-mode runs. */
export async function rerunGiftProduction(lineId: string): Promise<{ ok: boolean; error?: string }> {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e.message }; }
  const { serviceClient, GIFT_BUCKETS } = await import('@/lib/gifts/storage');
  const sb = serviceClient();
  const { data: line } = await sb.from('gift_order_items')
    .select('id, gift_product_id, variant_id, source_asset_id, mode, template_id, shape_kind, shape_template_id, personalisation_notes, production_asset_id, production_pdf_id, production_files')
    .eq('id', lineId).maybeSingle();
  if (!line) return { ok: false, error: 'Line not found' };

  // Idempotency gate: only re-run if the line is currently failed,
  // pending, or already ready (admin-initiated retry can re-run a
  // successful one). Bail when another worker is mid-run.
  // Also clear design_dirty here — running production means admin
  // has acknowledged whatever the customer changed.
  const { data: claimed } = await sb
    .from('gift_order_items')
    .update({ production_status: 'processing', production_error: null, design_dirty: false })
    .eq('id', lineId)
    .in('production_status', ['failed', 'pending', 'ready'])
    .select('id');
  if (!claimed || claimed.length === 0) {
    return { ok: false, error: 'Line is already being processed by another worker' };
  }

  // Surfaces-driven lines fan out per surface (mirrors checkout's
  // queueSurfaceProduction). Each surface has its own production
  // pipeline + status; the parent's production_status is rolled up.
  const { data: surfaces } = await sb
    .from('gift_order_item_surfaces')
    .select('id')
    .eq('order_item_id', lineId);
  const hasSurfaces = (surfaces ?? []).length > 0;

  if (hasSurfaces) {
    try {
      const { runSurfaceProductionPipeline } = await import('@/lib/gifts/pipeline');
      const [{ data: product }, { data: surfaceRows }] = await Promise.all([
        sb.from('gift_products').select('*').eq('id', line.gift_product_id).maybeSingle(),
        sb.from('gift_order_item_surfaces').select('*').eq('order_item_id', lineId).order('display_order'),
      ]);
      if (!product) throw new Error('Product missing');
      const variantId = (line as any).variant_id ?? null;
      const { data: variant } = variantId
        ? await sb.from('gift_product_variants').select('surfaces, width_mm, height_mm').eq('id', variantId).maybeSingle()
        : { data: null };

      // Render every surface in parallel — they're independent and the
      // per-surface try/catch already isolates failures. Skip the prior
      // reset-then-CAS pair: admin is the only caller of rerunGiftProduction,
      // so claim races aren't real here. One UPDATE to `processing` is
      // enough.
      await Promise.all((surfaceRows ?? []).map(async (row) => {
        await sb.from('gift_order_item_surfaces').update({
          production_status: 'processing',
          production_error: null,
        }).eq('id', row.id);
        try {
          let areaMm: { widthMm: number; heightMm: number } | null = null;
          const variantSurfaces = Array.isArray(variant?.surfaces) ? variant!.surfaces : [];
          const surfCfg = variantSurfaces.find((s: any) => s.id === row.surface_id);
          const physW = Number(variant?.width_mm ?? product.width_mm);
          const physH = Number(variant?.height_mm ?? product.height_mm);
          if (surfCfg?.mockup_area && Number.isFinite(physW) && Number.isFinite(physH)) {
            areaMm = {
              widthMm:  (Number(surfCfg.mockup_area.width)  / 100) * physW,
              heightMm: (Number(surfCfg.mockup_area.height) / 100) * physH,
            };
          }

          let sourcePath: string | null = null;
          let sourceMime: string | null = null;
          if (row.source_asset_id) {
            const { data: src } = await sb.from('gift_assets').select('path, mime_type').eq('id', row.source_asset_id).maybeSingle();
            sourcePath = (src as any)?.path ?? null;
            sourceMime = (src as any)?.mime_type ?? null;
          }

          const out = await runSurfaceProductionPipeline({
            product: product as any,
            mode: row.mode,
            text: row.text ?? undefined,
            sourcePath,
            sourceMime,
            surfaceLabel: row.surface_label,
            areaMm,
          });

          const { data: prodAsset } = await sb.from('gift_assets').insert({
            role: 'production',
            bucket: GIFT_BUCKETS.production,
            path: out.productionPath,
            mime_type: out.productionMime,
            width_px: out.widthPx,
            height_px: out.heightPx,
            dpi: out.dpi,
          }).select('id').single();
          const pdfAsset = out.productionPdfPath
            ? (await sb.from('gift_assets').insert({
                role: 'production-pdf',
                bucket: GIFT_BUCKETS.production,
                path: out.productionPdfPath,
                mime_type: out.productionPdfMime,
              }).select('id').single()).data
            : null;

          await sb.from('gift_order_item_surfaces').update({
            production_asset_id: prodAsset?.id ?? null,
            production_pdf_id: pdfAsset?.id ?? null,
            production_status: 'ready',
          }).eq('id', row.id);
        } catch (e: any) {
          await sb.from('gift_order_item_surfaces').update({
            production_status: 'failed',
            production_error: e?.message ?? 'unknown',
          }).eq('id', row.id);
        }
      }));

      // Roll up parent status — mirrors checkout's tail.
      const { data: final } = await sb
        .from('gift_order_item_surfaces')
        .select('production_status')
        .eq('order_item_id', lineId);
      const statuses = (final ?? []).map((r: any) => r.production_status);
      const rollup = statuses.length > 0 && statuses.every((s: string) => s === 'ready')
        ? 'ready'
        : statuses.some((s: string) => s === 'failed')
          ? 'failed'
          : 'processing';
      await sb.from('gift_order_items').update({ production_status: rollup }).eq('id', lineId);
      return { ok: rollup === 'ready' };
    } catch (e: any) {
      await sb.from('gift_order_items').update({ production_status: 'failed', production_error: e?.message ?? 'unknown' }).eq('id', lineId);
      return { ok: false, error: e.message };
    }
  }

  // Single-source line — original path, plus production_files refresh
  // so dual-mode template runs surface their per-mode files.
  if (!line.source_asset_id) {
    await sb.from('gift_order_items').update({ production_status: 'failed', production_error: 'No source asset on this line' }).eq('id', lineId);
    return { ok: false, error: 'No source asset on this line' };
  }
  try {
    const [{ data: product }, { data: source }] = await Promise.all([
      sb.from('gift_products').select('*').eq('id', line.gift_product_id).maybeSingle(),
      sb.from('gift_assets').select('path, mime_type').eq('id', line.source_asset_id).maybeSingle(),
    ]);
    if (!product || !source) throw new Error('Product or source missing');
    const { runProductionPipeline } = await import('@/lib/gifts/pipeline');
    const effectiveTemplateId = (line as any).shape_kind === 'template'
      ? ((line as any).shape_template_id ?? (line as any).template_id)
      : (line as any).template_id;
    const out = await runProductionPipeline({
      product: product as any,
      sourcePath: source.path as string,
      sourceMime: (source.mime_type as string) ?? 'image/jpeg',
      templateId: effectiveTemplateId ?? null,
      shapeKind: ((line as any).shape_kind as 'cutout' | 'rectangle' | 'template' | null) ?? null,
      personalisationNotes: (line as any).personalisation_notes ?? null,
    });
    const { data: prodAsset } = await sb.from('gift_assets').insert({
      role: 'production', bucket: GIFT_BUCKETS.production, path: out.productionPath, mime_type: out.productionMime,
      width_px: out.widthPx, height_px: out.heightPx, dpi: out.dpi,
    }).select('id').single();
    const pdfAsset = out.productionPdfPath
      ? (await sb.from('gift_assets').insert({
          role: 'production-pdf', bucket: GIFT_BUCKETS.production, path: out.productionPdfPath, mime_type: out.productionPdfMime,
        }).select('id').single()).data
      : null;
    // Mirror the checkout flow: persist the dual-mode per-file set so
    // the admin order view shows each emitted file with its mode label.
    // Empty array when single-mode.
    const productionFiles = out.files?.map((f) => ({
      mode: f.mode,
      png_path: f.pngPath,
      pdf_path: f.pdfPath,
      width_px: f.widthPx,
      height_px: f.heightPx,
      dpi: f.dpi,
    })) ?? [];
    // Capture the OLD production asset IDs BEFORE swapping so we can
    // garbage-collect their storage objects + rows. Without this, every
    // rerun strands the previous run's production PNG/PDF in
    // gift-production with no DB reference (Supabase storage has no GC).
    const oldProdId = (line as any).production_asset_id as string | null;
    const oldPdfId  = (line as any).production_pdf_id  as string | null;
    // Same problem for the dual-mode per-file array: the old run wrote
    // png_path / pdf_path keys directly into production_files (no
    // gift_assets row), so swapping the JSONB without clearing storage
    // strands them too.
    const oldProductionFiles = Array.isArray((line as any).production_files)
      ? ((line as any).production_files as Array<{ png_path?: string; pdf_path?: string }>)
      : [];

    await sb.from('gift_order_items').update({
      production_asset_id: prodAsset?.id ?? null,
      production_pdf_id: pdfAsset?.id ?? null,
      production_files: productionFiles,
      production_status: 'ready',
    }).eq('id', lineId);

    // Best-effort cleanup of the prior run. Failures here don't fail the
    // rerun (the new files are already authoritative) — they just leave
    // an orphan we can sweep later.
    const oldIds = [oldProdId, oldPdfId].filter((x): x is string => !!x && x !== prodAsset?.id && x !== pdfAsset?.id);
    if (oldIds.length > 0) {
      try {
        const { data: oldRows } = await sb
          .from('gift_assets')
          .select('id, bucket, path')
          .in('id', oldIds);
        const byBucket: Record<string, string[]> = {};
        for (const r of oldRows ?? []) {
          const b = (r as any).bucket as string;
          (byBucket[b] = byBucket[b] ?? []).push((r as any).path as string);
        }
        await Promise.all(
          Object.entries(byBucket).map(([bucket, paths]) => sb.storage.from(bucket).remove(paths)),
        );
        await sb.from('gift_assets').delete().in('id', oldIds);
      } catch (e) {
        console.warn('[rerun] old asset cleanup failed', (e as any)?.message);
      }
    }
    if (oldProductionFiles.length > 0) {
      try {
        const newPaths = new Set<string>();
        for (const f of productionFiles) {
          if (f.png_path) newPaths.add(f.png_path);
          if (f.pdf_path) newPaths.add(f.pdf_path);
        }
        const stalePaths: string[] = [];
        for (const f of oldProductionFiles) {
          if (f.png_path && !newPaths.has(f.png_path)) stalePaths.push(f.png_path);
          if (f.pdf_path && !newPaths.has(f.pdf_path)) stalePaths.push(f.pdf_path);
        }
        if (stalePaths.length > 0) {
          await sb.storage.from(GIFT_BUCKETS.production).remove(stalePaths);
        }
      } catch (e) {
        console.warn('[rerun] old production_files cleanup failed', (e as any)?.message);
      }
    }
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
  mockup_area: AreaSchema,
  mockup_bounds: AreaSchema.nullable().optional(),
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
        // Optional. Empty string = colour-overlay swatch (just retints
        // the renderer's foil colour, doesn't swap the displayed photo).
        // Populated = mockup-swatch (photo swap on pick).
        mockup_url: z.string().default(''),
      }),
    )
    .default([])
    .refine(
      (arr) => {
        const names = arr.map((s) => s.name.trim().toLowerCase());
        return new Set(names).size === names.length;
      },
      { message: 'Swatch names must be unique (case-insensitive).' },
    ),
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
        mockup_area: AreaSchema,
        max_chars: z.number().int().positive().nullable().optional(),
        font_family: z.string().nullable().optional(),
        font_size_pct: z.number().positive().nullable().optional(),
        color: z.string().nullable().optional(),
        // Optional per-surface production method. Null = inherit parent.
        // Free string for custom modes added via /admin/gifts/modes.
        mode: z.string().min(1).max(40).nullable().optional(),
        price_delta_cents: z.number().int().nonnegative().default(0),
      }),
    )
    .default([]),
  photo_pan_mode: z.boolean().default(false),
  mockup_by_prompt_id: z
    .record(z.string().uuid(), MockupOverrideSchema)
    .nullable()
    .optional(),
  // Shaped as optional fields (NOT z.record) because Zod v4's
  // record(enum, ...) demands every enum value be present.
  mockup_by_shape: z
    .object({
      cutout: MockupOverrideSchema.optional(),
      rectangle: MockupOverrideSchema.optional(),
      template: MockupOverrideSchema.optional(),
    })
    .nullable()
    .optional(),
  // Per-variant overrides keyed by gift_products.sizes[].slug — flips a
  // size off for this variant or overrides the price delta. Missing
  // entries inherit the product defaults.
  size_overrides: z
    .record(
      z.string().min(1).max(60),
      z.object({
        available: z.boolean().optional(),
        price_delta_cents: z.number().int().nonnegative().optional(),
      }),
    )
    .default({}),
  // Material / background colour for renderer-driven products. Hex.
  // Null = renderer default per layout.
  material_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Material colour must be a 6-digit hex like #000000')
    .nullable()
    .optional(),
});

/** If the parent product's base_price_cents is still at 0, recompute
 *  it from the lowest active variant price. Leaves admin-set
 *  non-zero values alone (manual override wins). Also backfills the
 *  thumbnail_url when parent has no mockup + no explicit thumbnail
 *  yet — a fresh variant's mockup becomes the catalogue tile. */
async function maybeRecomputeParentBase(
  sb: Awaited<ReturnType<typeof requireAdmin>>,
  giftProductId: string,
) {
  const { data: parent } = await sb
    .from('gift_products').select('base_price_cents, thumbnail_url, mockup_url').eq('id', giftProductId).maybeSingle();
  if (!parent) return;
  const patch: Record<string, unknown> = {};

  // Price: only auto-fill when admin left it at 0.
  if ((parent.base_price_cents ?? 0) === 0) {
    const resolved = await resolveBasePrice(sb, giftProductId, 0);
    if (typeof resolved === 'number' && resolved > 0) patch.base_price_cents = resolved;
  }

  // Thumbnail: only fill when there's nothing on the parent (no
  // explicit thumbnail AND no product-level mockup). Any manual value
  // survives untouched.
  if (!parent.thumbnail_url && !parent.mockup_url) {
    const thumb = await resolveGiftThumbnail(sb, giftProductId, { thumbnail_url: null, mockup_url: null });
    if (thumb) patch.thumbnail_url = thumb;
  }

  if (Object.keys(patch).length > 0) {
    await sb.from('gift_products').update(patch).eq('id', giftProductId);
  }
}

export async function upsertGiftVariant(input: z.input<typeof VariantSchema>) {
  const sb = await requireAdmin();
  const parseResult = VariantSchema.safeParse(input);
  if (!parseResult.success) {
    return { ok: false as const, error: friendlyZodError(parseResult.error) };
  }
  const parsed = parseResult.data;
  const { id, ...row } = parsed as any;
  if (id) {
    const { error } = await sb.from('gift_product_variants').update(row).eq('id', id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await sb.from('gift_product_variants').insert(row);
    if (error) return { ok: false as const, error: error.message };
  }
  await maybeRecomputeParentBase(sb, parsed.gift_product_id);
  revalidatePath(`/admin/gifts/${parsed.gift_product_id}`);
  revalidatePath(`/gift/${parsed.gift_product_id}`);
  return { ok: true as const };
}

export async function deleteGiftVariant(id: string) {
  const sb = await requireAdmin();
  // Remember the parent BEFORE deletion so we can recompute its base.
  const { data: v } = await sb
    .from('gift_product_variants').select('gift_product_id').eq('id', id).maybeSingle();
  const { error } = await sb.from('gift_product_variants').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  if (v?.gift_product_id) await maybeRecomputeParentBase(sb, v.gift_product_id);
  revalidatePath('/admin/gifts');
  return { ok: true as const };
}
