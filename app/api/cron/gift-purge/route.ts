import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-auth';
import { purgeEligible } from '@/lib/gifts/retention';
import { reportError } from '@/lib/observability';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = await purgeEligible();
    return NextResponse.json(result);
  } catch (e: any) {
    reportError(e, { route: 'cron.gift-purge', action: 'purge' });
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
