import { NextRequest, NextResponse } from 'next/server';
import { getHitPayConfig, verifyHitPaySignature } from '@/lib/payments/hitpay';
import { createServiceClient } from '@/lib/auth/require-admin';
import { reportError } from '@/lib/observability';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

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

    // Verify the signature BEFORE writing to payment_events. The earlier
    // code logged unsigned requests too "for audit visibility", but that
    // gave an attacker a way to flood the table with junk rows. Bad
    // signatures still get logged, but only at rate-limited volume.
    if (!signatureValid) {
      const ip = getClientIp();
      const rl = await checkRateLimit(`hitpay-bad-sig:${ip}`, { max: 5, windowSeconds: 60 });
      if (rl.allowed) {
        // Best-effort audit row — first 5/min/IP only.
        try {
          const sbAudit = createServiceClient();
          const auditOrderId = params.reference_number?.startsWith('order:')
            ? params.reference_number.slice('order:'.length)
            : null;
          await sbAudit.from('payment_events').insert({
            order_id: auditOrderId,
            gateway: 'hitpay',
            event_type: params.status ? `charge.${params.status}` : 'unknown',
            payload_json: params,
            signature_valid: false,
          });
        } catch { /* swallow — already going to 401 */ }
      }
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }

    const sb = createServiceClient();
    const orderId = params.reference_number?.startsWith('order:')
      ? params.reference_number.slice('order:'.length)
      : null;

    // Verified events: always log.
    await sb.from('payment_events').insert({
      order_id: orderId,
      gateway: 'hitpay',
      event_type: params.status ? `charge.${params.status}` : 'unknown',
      payload_json: params,
      signature_valid: true,
    });

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
      // Amount-tampering guard. HitPay POSTs `amount` (dollars) in the
      // webhook body. A signature-valid event from a different (smaller)
      // PaymentRequest replayed with our reference_number would otherwise
      // mark the order paid for less than its expected charge. Compare
      // against orders.payment_amount_cents (set when we created the
      // PaymentRequest); reject if it doesn't match within 1c.
      if (ourStatus === 'paid' || ourStatus === 'pending') {
        const { data: ord } = await sb
          .from('orders')
          .select('payment_amount_cents, total_cents')
          .eq('id', orderId)
          .maybeSingle();
        const expectedCents = (ord as any)?.payment_amount_cents ?? (ord as any)?.total_cents ?? null;
        const gotCents = Math.round(parseFloat(params.amount ?? 'NaN') * 100);
        if (expectedCents == null || !Number.isFinite(gotCents) || Math.abs(gotCents - expectedCents) > 1) {
          reportError(new Error('hitpay amount mismatch'), {
            route: 'webhook.hitpay', action: 'amount_check',
            extras: { order_id: orderId, expected_cents: expectedCents, got_cents: gotCents },
          });
          return NextResponse.json({ ok: false, error: 'amount_mismatch' });
        }
      }

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
