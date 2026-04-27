import { NextResponse } from 'next/server';
import { purgeEligible } from '@/lib/gifts/retention';
import { reportError } from '@/lib/observability';

export const dynamic = 'force-dynamic';
// Vercel cron hits this via HTTP GET. Protected by CRON_SECRET header.

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
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
