import { NextResponse } from 'next/server';
import { verifyTurnstile } from '@/lib/captcha';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// POST /api/verify-captcha  { token: string }
// Returns { ok: true } on success, { ok: false, error, errorCodes? } otherwise.
// Used by forms that submit via client-side side effects (e.g. the
// contact form opens wa.me rather than hitting a server action) so we
// still get a server-side captcha check before the user is handed off.
export async function POST(req: Request) {
  // Per-IP rate limit so an attacker can't flood Cloudflare's siteverify
  // endpoint via this proxy and burn our outbound quota / log noise.
  // 30 verifies per IP per minute is generous for legit form retries.
  const ip = getClientIp();
  const rl = await checkRateLimit(`verify-captcha:${ip}`, { max: 30, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  let body: { token?: string } = {};
  try {
    body = (await req.json()) as { token?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = await verifyTurnstile(body.token, ip === 'unknown' ? null : ip);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
