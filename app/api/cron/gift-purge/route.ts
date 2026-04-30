import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { purgeEligible } from '@/lib/gifts/retention';
import { reportError } from '@/lib/observability';

export const dynamic = 'force-dynamic';
// Vercel cron hits this via HTTP GET. Protected by CRON_SECRET header.

// Constant-time secret compare — `===` leaks the matching prefix
// length via timing, which an attacker can probe at high RPS. Both
// inputs are sha256-hashed first so timingSafeEqual sees equal-length
// buffers and the secret length isn't leaked either.
function secretsMatch(got: string | null | undefined, want: string): boolean {
  if (!got) return false;
  const a = createHash('sha256').update(got).digest();
  const b = createHash('sha256').update(want).digest();
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!secretsMatch(token, expected)) {
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
