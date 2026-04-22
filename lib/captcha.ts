// Cloudflare Turnstile verification helper.
//
// We use Turnstile rather than reCAPTCHA because it's free for
// unlimited volume, doesn't require a Google account, and is much
// lighter on user privacy. The widget renders invisibly 99% of the
// time and only challenges users who look automated.
//
// Environment variables:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY   — public site key (browser)
//   TURNSTILE_SECRET_KEY              — secret for server verify
//
// If TURNSTILE_SECRET_KEY is unset, `verifyTurnstile` returns
// { ok: true, skipped: true } so dev environments don't block forms.
// Production deploys MUST have the secret set or bots will walk in.
//
// Cloudflare publishes test keys that always pass / always fail —
// see components/common/turnstile.tsx for the defaults used when the
// site key env var is missing.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileVerifyResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  errorCodes?: string[];
};

/**
 * Verify a Turnstile token against Cloudflare's siteverify endpoint.
 * Call this from server actions or API routes before trusting a
 * form submission.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // No secret configured — skip verification. Dev environments or
    // first-deploy scenarios. Log once per process so it's visible
    // but not noisy.
    const g = globalThis as { __pvTurnstileWarned?: boolean };
    if (!g.__pvTurnstileWarned) {
      console.warn('[captcha] TURNSTILE_SECRET_KEY not set — skipping verification');
      g.__pvTurnstileWarned = true;
    }
    return { ok: true, skipped: true };
  }

  if (!token) {
    return { ok: false, error: 'Missing captcha token' };
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    if (data.success) return { ok: true };
    return {
      ok: false,
      error: 'Captcha failed — please retry',
      errorCodes: data['error-codes'] ?? [],
    };
  } catch (err) {
    return { ok: false, error: `Captcha verify threw: ${String(err)}` };
  }
}
