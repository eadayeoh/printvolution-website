'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const PageSectionSchema = z.object({
  page_key: z.string(),
  section_key: z.string(),
  items: z.array(z.record(z.string(), z.any())),
});

export async function saveSection(input: z.infer<typeof PageSectionSchema>) {
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
  const sb = adminClient();
  await sb.from('navigation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (items.length) {
    const rows = items.map((n, i) => ({ ...n, display_order: i }));
    const { error } = await sb.from('navigation').insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}
