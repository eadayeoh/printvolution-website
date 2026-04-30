import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';

export type CouponRow = {
  id: string;
  code: string;
  type: 'pct' | 'flat';
  value_cents: number | null;
  percent: number | null;
  min_spend_cents: number | null;
  max_uses: number | null;
  uses_count: number | null;
  expires_at: string | null;
  is_active: boolean | null;
};

export type CouponEvalResult =
  | { ok: true; coupon: CouponRow; discountCents: number }
  | { ok: false; error: string };

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

// Escape Postgres LIKE wildcards so untrusted input can't match unrelated rows.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Pure: compute the discount for a given coupon + subtotal, applying
 *  the ceiling at subtotal so the order can't go negative. Returns a
 *  cents amount (0 if the coupon doesn't yield a positive discount). */
export function computeCouponDiscountCents(coupon: CouponRow, subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  let raw = 0;
  if (coupon.type === 'pct') {
    const pct = Math.max(0, Math.min(100, coupon.percent ?? 0));
    raw = Math.round((subtotalCents * pct) / 100);
  } else if (coupon.type === 'flat') {
    raw = Math.max(0, coupon.value_cents ?? 0);
  }
  return Math.max(0, Math.min(raw, subtotalCents));
}

/** Look up a coupon by code and run all the activation checks against
 *  the order being placed. Used by the checkout server action AND the
 *  pre-submit "Apply code" preview, so customers see an error before
 *  they hit the final submit.
 *
 *  When `customerEmail` is supplied, we also reject the redemption if
 *  this email has already used the coupon — without it the global
 *  `max_uses` cap is the only protection, and a discount-hunter on
 *  one address can wipe out the whole quota in a single sitting.
 */
export async function evaluateCouponForOrder(
  rawCode: string,
  subtotalCents: number,
  customerEmail?: string | null,
): Promise<CouponEvalResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: 'Enter a code.' };

  const sb = createServiceClient();
  const { data, error } = await sb
    .from('coupons')
    .select('id, code, type, value_cents, percent, min_spend_cents, max_uses, uses_count, expires_at, is_active')
    .ilike('code', escapeLike(code))
    .maybeSingle();

  if (error) return { ok: false, error: 'Could not check that code right now.' };
  // Generic "not valid" message for missing / inactive / expired /
  // exhausted codes — distinct messages would let an attacker map the
  // coupons table by trying codes. Min-spend stays specific because
  // it's actionable for the customer.
  const NOT_VALID = 'Not a valid code.';
  if (!data) return { ok: false, error: NOT_VALID };

  const c = data as CouponRow;
  if (c.is_active === false) return { ok: false, error: NOT_VALID };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
    return { ok: false, error: NOT_VALID };
  }
  if (c.max_uses !== null && c.uses_count !== null && c.uses_count >= c.max_uses) {
    return { ok: false, error: NOT_VALID };
  }
  const minSpend = c.min_spend_cents ?? 0;
  if (subtotalCents < minSpend) {
    // With no real cart, treat as a probing attempt — don't leak the
    // threshold. With a non-zero cart, tell the customer the gap so
    // they can act on it.
    if (subtotalCents <= 0) return { ok: false, error: NOT_VALID };
    const dollars = (minSpend / 100).toFixed(2);
    return { ok: false, error: `Minimum spend S$${dollars} not met.` };
  }

  // Per-customer cap. We don't have a max_uses_per_email column on
  // coupons, so the rule is hard-coded: each email can redeem each
  // coupon at most once. If you ever introduce a multi-use loyalty
  // coupon, add a column and gate this check on it.
  if (customerEmail && customerEmail.trim()) {
    const email = customerEmail.trim().toLowerCase();
    const { data: prior, error: priorErr } = await sb
      .from('coupon_redemptions')
      .select('order_id, orders!inner(email)')
      .eq('coupon_id', c.id)
      .ilike('orders.email', escapeLike(email))
      .limit(1);
    if (!priorErr && prior && prior.length > 0) {
      return { ok: false, error: 'This code has already been used on your email.' };
    }
  }

  const discountCents = computeCouponDiscountCents(c, subtotalCents);
  if (discountCents <= 0) return { ok: false, error: NOT_VALID };
  return { ok: true, coupon: c, discountCents };
}
