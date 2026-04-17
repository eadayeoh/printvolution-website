import { createClient as admClient } from '@supabase/supabase-js';

export const GIFT_BUCKETS = {
  sources: 'gift-sources',
  previews: 'gift-previews',
  production: 'gift-production',
  templates: 'gift-templates',
} as const;

export function serviceClient() {
  return admClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Upload a Buffer/Uint8Array to a bucket and return the storage path used. */
export async function putObject(
  bucket: string,
  filename: string,
  data: Uint8Array | Buffer,
  contentType: string
): Promise<{ path: string; publicUrl: string | null }> {
  const sb = serviceClient();
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const { error } = await sb.storage.from(bucket).upload(filename, bytes, {
    contentType,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`storage upload failed: ${error.message}`);

  // Public buckets get a public URL; private buckets return null.
  let publicUrl: string | null = null;
  if (bucket === GIFT_BUCKETS.previews || bucket === GIFT_BUCKETS.templates) {
    const { data: urlData } = sb.storage.from(bucket).getPublicUrl(filename);
    publicUrl = urlData.publicUrl;
  }
  return { path: filename, publicUrl };
}

/** Download bytes from any bucket (used by pipelines) */
export async function getObject(bucket: string, path: string): Promise<Uint8Array> {
  const sb = serviceClient();
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`storage download failed: ${error?.message ?? 'no data'}`);
  const ab = await data.arrayBuffer();
  return new Uint8Array(ab);
}

/** Short-lived signed URL for admin-only production / source assets */
export async function signUrl(bucket: string, path: string, expiresInSec = 300): Promise<string> {
  const sb = serviceClient();
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expiresInSec);
  if (error || !data) throw new Error(`sign url failed: ${error?.message ?? 'no url'}`);
  return data.signedUrl;
}

/** Generate a unique object key with a prefix + extension */
export function makeKey(prefix: string, ext: string): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'gift';
  const safeExt = /^[a-z0-9]+$/i.test(ext) ? ext : 'bin';
  return `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
}

/** Parse a file extension from a filename or MIME type */
export function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'application/pdf': 'pdf',
    'image/tiff': 'tiff',
  };
  return map[mime] ?? 'bin';
}
