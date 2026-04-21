import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signUrl } from '@/lib/gifts/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!prof || !['admin', 'staff'].includes(prof.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const u = new URL(req.url);
  const bucket = u.searchParams.get('bucket');
  const path = u.searchParams.get('path');
  if (!bucket || !path) return NextResponse.json({ error: 'bucket + path required' }, { status: 400 });

  // Only allow our private gift buckets through this endpoint.
  if (!['gift-sources', 'gift-production'].includes(bucket)) {
    return NextResponse.json({ error: 'invalid bucket' }, { status: 400 });
  }

  try {
    const url = await signUrl(bucket, path, 120);
    return NextResponse.redirect(url);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}
