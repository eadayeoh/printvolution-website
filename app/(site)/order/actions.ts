'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { deliveryCentsFor } from '@/lib/checkout-rates';

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const EditSchema = z.object({
  lines: z.array(z.object({
    id: z.string().uuid(),
    qty: z.number().int().min(0).max(999),
    personalisation_notes: z.string().max(500).nullable().optional(),
  })).min(1),
  delivery_method: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function saveCustomerOrderEdit(
  token: string,
  input: z.input<typeof EditSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Per-IP rate limit. The token itself is the auth, so an attacker
  // who's iterating tokens shouldn't get to abuse the write path
  // even on hits.
  const ip = getClientIp();
  const rl = await checkRateLimit(`order-edit:${ip}`, { max: 20, windowSeconds: 60 });
  if (!rl.allowed) return { ok: false, error: 'Too many submissions. Try again in a minute.' };

  const parse = EditSchema.safeParse(input);
  if (!parse.success) return { ok: false, error: 'Invalid edit payload.' };
  const data = parse.data;

  if (data.delivery_method === 'delivery' && !data.delivery_address?.trim()) {
    return { ok: false, error: 'Delivery address is required.' };
  }

  const sb = service();

  // Find the order by token, with all current line items so we can
  // sanity-check the customer's edits against what was actually
  // billed. We re-derive prices from the SNAPSHOT (unit_price_cents
  // already on the row), not from product pricing tables — qty
  // changes don't unlock new tiers via this flow.
  const { data: orderRow } = await sb
    .from('orders')
    .select(`
      id, customer_edit_locked, gift_wrap, gift_wrap_cents,
      coupon_code, coupon_discount_cents,
      points_redeemed, points_discount_cents,
      order_items(id, unit_price_cents)
    `)
    .eq('customer_edit_token', token)
    .maybeSingle();

  if (!orderRow) return { ok: false, error: 'Edit link not found or expired.' };
  const o = orderRow as any;
  if (o.customer_edit_locked) {
    return { ok: false, error: 'This order is locked from customer edits.' };
  }

  // Build a map of authorised line ids → unit_price_cents so the
  // customer can't smuggle in unrelated items, change unit price,
  // or reference a deleted line.
  const authorised = new Map<string, number>(
    ((o.order_items ?? []) as Array<{ id: string; unit_price_cents: number }>)
      .map((l) => [l.id, l.unit_price_cents] as const),
  );

  let newSubtotal = 0;
  for (const line of data.lines) {
    const unit = authorised.get(line.id);
    if (unit === undefined) return { ok: false, error: 'Unknown line in edit.' };
    newSubtotal += unit * line.qty;
  }
  // Allow zeroing-out lines but not zeroing the entire order; if
  // they want a full cancel they reach out to staff.
  if (newSubtotal === 0) {
    return { ok: false, error: 'At least one item must have qty > 0.' };
  }

  const newDelivery = deliveryCentsFor(data.delivery_method, newSubtotal);
  const wrap = o.gift_wrap ? (o.gift_wrap_cents ?? 0) : 0;
  // Cap stored coupon + points discounts to the new (smaller) order
  // total — admin re-issues coupon if they want to give more, but
  // customer can't lift an existing discount past subtotal.
  const couponCapped = Math.min(o.coupon_discount_cents ?? 0, newSubtotal);
  const pointsCapped = Math.min(o.points_discount_cents ?? 0, Math.max(0, newSubtotal - couponCapped));
  const newTotal = Math.max(0, newSubtotal + newDelivery + wrap - couponCapped - pointsCapped);

  // Apply line updates first, then order totals. A failure in either
  // half leaves the row in a transitional state but the customer
  // sees the error and can retry.
  for (const line of data.lines) {
    const unit = authorised.get(line.id)!;
    const lineTotal = unit * line.qty;
    const { error } = await sb
      .from('order_items')
      .update({
        qty: line.qty,
        line_total_cents: lineTotal,
        personalisation_notes: line.personalisation_notes ?? null,
      })
      .eq('id', line.id)
      .eq('order_id', o.id);
    if (error) return { ok: false, error: 'Failed to save item: ' + error.message };
  }

  const { error: orderErr } = await sb
    .from('orders')
    .update({
      delivery_method: data.delivery_method,
      delivery_address: data.delivery_address ?? null,
      notes: data.notes ?? null,
      subtotal_cents: newSubtotal,
      delivery_cents: newDelivery,
      coupon_discount_cents: couponCapped,
      points_discount_cents: pointsCapped,
      total_cents: newTotal,
      customer_edit_last_at: new Date().toISOString(),
    })
    .eq('id', o.id)
    .eq('customer_edit_locked', false);
  if (orderErr) return { ok: false, error: 'Failed to save order: ' + orderErr.message };

  return { ok: true };
}
