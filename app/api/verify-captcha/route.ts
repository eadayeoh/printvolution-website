import { NextResponse } from 'next/server';
import { verifyTurnstile } from '@/lib/captcha';

// POST /api/verify-captcha  { token: string }
// Returns { ok: true } on success, { ok: false, error, errorCodes? } otherwise.
// Used by forms that submit via client-side side effects (e.g. the
// contact form opens wa.me rather than hitting a server action) so we
// still get a server-side captcha check before the user is handed off.
export async function POST(req: Request) {
  let body: { token?: string } = {};
  try {
    body = (await req.json()) as { token?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null;

  const result = await verifyTurnstile(body.token, ip);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
