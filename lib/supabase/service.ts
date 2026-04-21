import 'server-only';
import { createClient as createSBClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. Bypasses RLS.
 * ONLY import this in server-side code (cron routes, admin server actions).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL or SERVICE_ROLE_KEY missing');
  return createSBClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
