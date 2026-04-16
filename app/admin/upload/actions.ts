'use server';

import { createClient as admClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'product-images';

function serviceClient() {
  return admClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Upload a file to Supabase Storage and return its public URL.
 * Called from admin-only forms. Requires the current user to have admin role.
 */
export async function uploadProductImage(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  // Auth check — only admin can upload
  const userSb = createClient();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const { data: profile } = await userSb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return { ok: false, error: 'Admin/staff only' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'No file' };
  if (file.size === 0) return { ok: false, error: 'Empty file' };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'File too large (max 5MB)' };

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: `File type ${file.type} not allowed` };
  }

  // Generate a unique filename
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const prefix = (formData.get('prefix') || 'img').toString().replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const sb = serviceClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(filename, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (upErr) return { ok: false, error: upErr.message };

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(filename);
  return { ok: true, url: urlData.publicUrl };
}
