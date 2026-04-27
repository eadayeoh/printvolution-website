'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, createServiceClient as adminClient } from '@/lib/auth/require-admin';
import { NAVIGATION_TAG } from '@/lib/data/navigation';

const PageSectionSchema = z.object({
  page_key: z.string(),
  section_key: z.string(),
  items: z.array(z.record(z.string(), z.any())),
});

export async function saveSection(input: z.infer<typeof PageSectionSchema>) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const parsed = PageSectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const sb = adminClient();

  const { error } = await sb.from('page_content').upsert(
    { page_key: d.page_key, section_key: d.section_key, data: { items: d.items } },
    { onConflict: 'page_key,section_key' }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/about');
  revalidatePath('/admin/pages');
  return { ok: true };
}

// Contact methods CRUD
const ContactMethodSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['whatsapp', 'phone', 'email', 'instagram', 'facebook', 'tiktok', 'line', 'telegram', 'other']),
  value: z.string().min(1),
  label: z.string().nullable(),
  note: z.string().nullable(),
  is_active: z.boolean(),
});

export async function saveContactMethods(methods: z.infer<typeof ContactMethodSchema>[]) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();
  // Wipe + reinsert (simpler than diffing)
  await sb.from('contact_methods').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (methods.length) {
    const rows = methods.map((m, i) => ({
      type: m.type,
      value: m.value,
      label: m.label,
      note: m.note,
      is_active: m.is_active,
      display_order: i,
    }));
    const { error } = await sb.from('contact_methods').insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath('/');
  revalidatePath('/contact');
  return { ok: true };
}

// Navigation CRUD
const NavItemSchema = z.object({
  label: z.string().nullable(),
  type: z.enum(['link', 'dropdown', 'sep']),
  action: z.string().nullable(),
  mega_key: z.string().nullable(),
  is_hidden: z.boolean(),
});

export async function saveNavigation(items: z.infer<typeof NavItemSchema>[]) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();
  await sb.from('navigation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (items.length) {
    const rows = items.map((n, i) => ({ ...n, display_order: i }));
    const { error } = await sb.from('navigation').insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  // Bust the cached fetch first (cross-request data cache), then invalidate
  // every page under the root layout so visitors see the new nav on the next
  // hit instead of waiting on the layout's revalidate window.
  revalidateTag(NAVIGATION_TAG);
  revalidatePath('/', 'layout');
  return { ok: true };
}

// Mega menu editor — save sections and their items for a given menu_key
const MegaItemSchema = z.object({
  product_slug: z.string().min(1),
  label: z.string().min(1),
});
const MegaSectionSchema = z.object({
  section_heading: z.string().min(1),
  items: z.array(MegaItemSchema),
});

export async function saveMegaMenu(
  menuKey: string,
  sections: z.infer<typeof MegaSectionSchema>[]
) {
  try { await requireAdmin(); } catch (e: any) { return { ok: false, error: e?.message ?? 'Forbidden' }; }
  const sb = adminClient();

  // Fetch existing section IDs for this menu (we'll wipe them via cascade)
  const { data: existing } = await sb
    .from('mega_menus')
    .select('id')
    .eq('menu_key', menuKey);

  if (existing && existing.length > 0) {
    const ids = existing.map((r: any) => r.id);
    // Delete items first (FK), then sections
    await sb.from('mega_menu_items').delete().in('mega_menu_id', ids);
    await sb.from('mega_menus').delete().in('id', ids);
  }

  // Insert sections in order
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const { data: inserted, error: sErr } = await sb
      .from('mega_menus')
      .insert({
        menu_key: menuKey,
        section_heading: sec.section_heading,
        column_index: 0,
        display_order: i,
      })
      .select('id')
      .single();

    if (sErr || !inserted) {
      return { ok: false, error: `Section "${sec.section_heading}" failed: ${sErr?.message}` };
    }

    if (sec.items.length > 0) {
      const itemRows = sec.items.map((it, j) => ({
        mega_menu_id: inserted.id,
        product_slug: it.product_slug,
        label: it.label,
        display_order: j,
      }));
      const { error: iErr } = await sb.from('mega_menu_items').insert(itemRows);
      if (iErr) return { ok: false, error: `Items for "${sec.section_heading}" failed: ${iErr.message}` };
    }
  }

  revalidateTag(NAVIGATION_TAG);
  revalidatePath('/', 'layout');
  return { ok: true };
}
