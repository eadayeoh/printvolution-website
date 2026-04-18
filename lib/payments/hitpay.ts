import 'server-only';
import crypto from 'node:crypto';

/**
 * HitPay payment-gateway stub.
 *
 * Wired but DORMANT. Nothing in the app calls `createHitPayRequest()`
 * today — the checkout flow runs with `payment_method='manual'` until
 * `HITPAY_ENABLED=true` and the credentials are set.
 *
 * When the operator is ready:
 *   1. Set these env vars in Vercel + .env.local:
 *        HITPAY_ENABLED=true
 *        HITPAY_API_KEY=...          (from HitPay dashboard → API Keys)
 *        HITPAY_SALT=...             (from HitPay dashboard → API Keys)
 *        HITPAY_MODE=live            ('live' | 'sandbox')
 *        HITPAY_WEBHOOK_URL=https://printvolution.sg/api/webhooks/hitpay
 *   2. Flip the `redirectToGatewayIfEnabled()` call in checkout to
 *      actually redirect (currently a no-op).
 *   3. Test against HITPAY_MODE=sandbox first — their sandbox dashboard
 *      will show the test charges.
 *
 * No card data is ever stored on our side. HitPay is hosted-redirect:
 * the customer types card details on hitpay.com, HitPay signs a
 * webhook back to us with a payment_id + status. We only store the
 * opaque payment_id and the status transitions. Keeps us out of PCI
 * scope.
 *
 * See: https://hit-pay.com/docs#payment-requests
 */

export type HitPayConfig = {
  enabled: boolean;
  apiKey: string | null;
  salt: string | null;
  mode: 'live' | 'sandbox';
  webhookUrl: string | null;
};

export function getHitPayConfig(): HitPayConfig {
  const enabledRaw = (process.env.HITPAY_ENABLED ?? '').toLowerCase();
  return {
    enabled: enabledRaw === 'true' || enabledRaw === '1',
    apiKey: process.env.HITPAY_API_KEY ?? null,
    salt: process.env.HITPAY_SALT ?? null,
    mode: (process.env.HITPAY_MODE === 'live' ? 'live' : 'sandbox'),
    webhookUrl: process.env.HITPAY_WEBHOOK_URL ?? null,
  };
}

export function hitPayBaseUrl(mode: 'live' | 'sandbox'): string {
  return mode === 'live'
    ? 'https://api.hit-pay.com/v1'
    : 'https://api.sandbox.hit-pay.com/v1';
}

export type CreatePaymentRequestInput = {
  order_id: string;
  amount_cents: number;
  currency: 'SGD';
  customer_email: string;
  customer_name: string;
  redirect_url: string;     // where the customer lands after paying
  reference_number: string; // e.g. the order_number
};

export type CreatePaymentRequestOutput = {
  id: string;              // HitPay payment_request_id
  url: string;             // redirect the customer here to pay
  status: string;          // 'pending' typically
};

/**
 * Create a payment request. NOT CALLED anywhere yet — when checkout
 * is wired for real payment, call this after the order row is inserted
 * and before returning to the client, so we can redirect them to the
 * HitPay hosted page.
 *
 * Always throws if HITPAY_ENABLED is not set, so accidental calls in
 * the current flow fail loudly in logs instead of silently hitting a
 * stubbed endpoint.
 */
export async function createHitPayRequest(
  input: CreatePaymentRequestInput
): Promise<CreatePaymentRequestOutput> {
  const cfg = getHitPayConfig();
  if (!cfg.enabled) throw new Error('HITPAY_ENABLED=false — payment gateway is inactive');
  if (!cfg.apiKey) throw new Error('HITPAY_API_KEY missing');

  const body = new URLSearchParams({
    amount: (input.amount_cents / 100).toFixed(2),
    currency: input.currency,
    email: input.customer_email,
    name: input.customer_name,
    reference_number: input.reference_number,
    redirect_url: input.redirect_url,
    ...(cfg.webhookUrl ? { webhook: cfg.webhookUrl } : {}),
    // Payment methods — defer to HitPay dashboard setup
  });

  const res = await fetch(`${hitPayBaseUrl(cfg.mode)}/payment-requests`, {
    method: 'POST',
    headers: {
      'X-BUSINESS-API-KEY': cfg.apiKey,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HitPay API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { id: string; url: string; status: string };
  return { id: json.id, url: json.url, status: json.status };
}

/**
 * Verify a webhook HMAC signature. HitPay signs the raw form-encoded
 * body using a concatenation of the sorted key=value pairs + salt.
 * See their docs for the exact algorithm.
 *
 * Returns true only if the signature matches. Use constant-time compare.
 */
export function verifyHitPaySignature(params: Record<string, string>, receivedSignature: string, salt: string): boolean {
  const { hmac, ...rest } = params;
  // Sort keys alphabetically, concat as k=v pairs (no separator) per HitPay docs.
  const sortedKeys = Object.keys(rest).sort();
  const signatureBase = sortedKeys.map((k) => `${k}${rest[k]}`).join('');
  const expected = crypto.createHmac('sha256', salt).update(signatureBase).digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from((receivedSignature || '').toLowerCase(), 'hex')
    );
  } catch {
    return false;
  }
}
