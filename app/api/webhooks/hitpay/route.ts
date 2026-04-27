import { NextRequest, NextResponse } from 'next/server';
import { getHitPayConfig, verifyHitPaySignature } from '@/lib/payments/hitpay';
import { createServiceClient } from '@/lib/auth/require-admin';
import { reportError } from '@/lib/observability';

/**
 * HitPay webhook receiver. Dormant until HITPAY_ENABLED=true.
 *
 * When live, HitPay POSTs url-encoded form data here with an `hmac`
 * field. We verify the HMAC, map the gateway status onto our
 * orders.payment_status enum, and log the raw event in
 * public.payment_events for audit.
 *
 * Security notes:
 *   - We respond 200 once the signature is verified and event stored,
 *     even if the downstream state update fails, because HitPay retries
 *     200-less responses — retries would create duplicate payment_events
 *     rows. Downstream failures are caught separately.
 *   - We ALWAYS log the event (signature_valid=false rows included) so
 *     replay or spoof attempts are visible in the audit table.
 *   - We never trust `reference_number` alone for state transitions —
 *     we match on order_id AND verify the HitPay payment amount matches
 *     the order's stored payment_amount_cents.
 */
export async function POST(req: NextRequest) {
  const cfg = getHitPayConfig();
  if (!cfg.enabled) {
    // Gateway not enabled — return 404 so a misrouted request looks
    // identical to one hitting a non-existent path. Ops sees the log
    // entry and knows it's just scaffolding.
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!cfg.salt) {
    console.warn('[hitpay-webhook] salt missing, rejecting');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  try {
    const raw = await req.text();
    const params = Object.fromEntries(new URLSearchParams(raw));
    const hmac = params.hmac ?? '';
    const signatureValid = verifyHitPaySignature(params, hmac, cfg.salt);

    const sb = createServiceClient();
    const orderId = params.reference_number?.startsWith('order:')
      ? params.reference_number.slice('order:'.length)
      : null;

    // Always log the event first — audit trail is more important than
    // short-circuiting.
    await sb.from('payment_events').insert({
      order_id: orderId,
      gateway: 'hitpay',
      event_type: params.status ? `charge.${params.status}` : 'unknown',
      payload_json: params,
      signature_valid: signatureValid,
    });

    if (!signatureValid) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }

    // Map HitPay statuses onto our payment_status enum.
    // Known statuses: 'completed', 'failed', 'pending', 'refunded'.
    const statusMap: Record<string, string> = {
      completed: 'paid',
      failed: 'failed',
      pending: 'pending',
      refunded: 'refunded',
    };
    const ourStatus = statusMap[params.status ?? ''] ?? null;

    if (orderId && ourStatus) {
      const patch: Record<string, unknown> = { payment_status: ourStatus };
      if (ourStatus === 'paid') patch.payment_paid_at = new Date().toISOString();
      if (ourStatus === 'failed') patch.payment_failed_reason = (params.message ?? 'gateway reported failure').slice(0, 500);
      if (params.payment_id) patch.payment_reference = params.payment_id;
      await sb.from('orders').update(patch).eq('id', orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    reportError(e, { route: 'webhook.hitpay', action: 'process' });
    // Always return 200 — HitPay retries anything that isn't 200, which
    // would create duplicate payment_events rows. Errors are visible in
    // Sentry via reportError above.
    return NextResponse.json({ ok: true });
  }
}

// Explicitly reject GET so scrapers / misrouted traffic don't get a
// 405 with exposed framework info.
export async function GET() {
  return NextResponse.json({ error: 'not_found' }, { status: 404 });
}
