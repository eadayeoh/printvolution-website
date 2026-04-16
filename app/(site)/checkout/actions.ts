'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const OrderSchema = z.object({
  customer_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  company: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  delivery_method: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(
    z.object({
      product_slug: z.string(),
      product_name: z.string(),
      icon: z.string().nullable(),
      config: z.record(z.string(), z.string()),
      qty: z.number().int().positive(),
      unit_price_cents: z.number().int().nonnegative(),
      line_total_cents: z.number().int().nonnegative(),
      personalisation_notes: z.string().optional(),
      gift_image_url: z.string().optional(),
    })
  ).min(1),
});

export type OrderInput = z.infer<typeof OrderSchema>;

export type OrderResult =
  | { ok: true; order_number: string; id: string }
  | { ok: false; error: string };

export async function submitOrder(input: OrderInput): Promise<OrderResult> {
  // Rate limit: 3 orders per IP per 10 minutes (real humans don't place
  // 4+ orders in 10 min; scripts do).
  const ip = getClientIp();
  const rl = await checkRateLimit(`checkout:${ip}`, { max: 3, windowSeconds: 600 });
  if (!rl.allowed) {
    return {
      ok: false,
      error: `Too many orders from your IP. Please try again in ${rl.retryAfterSeconds}s or WhatsApp us.`,
    };
  }

  // Validate
  const parsed = OrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid order data: ' + parsed.error.issues[0].message };
  }
  const data = parsed.data;

  // Service-role client so we can insert regardless of RLS session
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  // Calculate totals
  const subtotal = data.items.reduce((s, i) => s + i.line_total_cents, 0);
  const delivery = data.delivery_method === 'delivery' ? 800 : 0; // S$8.00 flat
  const total = subtotal + delivery;
  const pointsEarned = Math.floor(subtotal / 100); // 1 point per S$1

  // Look up product IDs by slug for FK link
  const slugs = Array.from(new Set(data.items.map((i) => i.product_slug)));
  const { data: products, error: pErr } = await sb
    .from('products')
    .select('id, slug')
    .in('slug', slugs);
  if (pErr) return { ok: false, error: 'Product lookup failed: ' + pErr.message };
  const slugToId = new Map((products ?? []).map((p: any) => [p.slug, p.id]));

  // Insert the order
  const { data: order, error: oErr } = await sb
    .from('orders')
    .insert({
      customer_name: data.customer_name,
      email: data.email,
      phone: data.phone,
      company: data.company || null,
      position: data.position || null,
      delivery_method: data.delivery_method,
      delivery_address: data.delivery_address || null,
      notes: data.notes || null,
      subtotal_cents: subtotal,
      delivery_cents: delivery,
      total_cents: total,
      points_earned: pointsEarned,
      status: 'pending',
    })
    .select('id, order_number')
    .single();

  if (oErr || !order) return { ok: false, error: 'Order create failed: ' + oErr?.message };

  // Insert line items
  const itemRows = data.items.map((i) => ({
    order_id: order.id,
    product_id: slugToId.get(i.product_slug) ?? null,
    product_name: i.product_name,
    product_slug: i.product_slug,
    icon: i.icon,
    config: i.config,
    qty: i.qty,
    unit_price_cents: i.unit_price_cents,
    line_total_cents: i.line_total_cents,
    personalisation_notes: i.personalisation_notes ?? null,
    gift_image_url: i.gift_image_url ?? null,
  }));
  const { error: iErr } = await sb.from('order_items').insert(itemRows);
  if (iErr) {
    // Roll back the order
    await sb.from('orders').delete().eq('id', order.id);
    return { ok: false, error: 'Order items failed: ' + iErr.message };
  }

  // Upsert member record (for points tracking)
  const { data: existing } = await sb.from('members').select('id, points_balance, total_earned').eq('email', data.email).maybeSingle();
  if (existing) {
    await sb.from('members').update({
      name: data.customer_name,
      phone: data.phone,
      points_balance: (existing.points_balance as number) + pointsEarned,
      total_earned: (existing.total_earned as number) + pointsEarned,
    }).eq('id', existing.id);
    await sb.from('points_transactions').insert({
      member_id: existing.id,
      order_id: order.id,
      delta: pointsEarned,
      type: 'earned',
      note: `Order ${order.order_number}`,
    });
  } else {
    const { data: newMember } = await sb.from('members').insert({
      email: data.email,
      name: data.customer_name,
      phone: data.phone,
      points_balance: pointsEarned,
      total_earned: pointsEarned,
    }).select('id').single();
    if (newMember) {
      await sb.from('points_transactions').insert({
        member_id: newMember.id,
        order_id: order.id,
        delta: pointsEarned,
        type: 'earned',
        note: `First order ${order.order_number}`,
      });
    }
  }

  return { ok: true, order_number: order.order_number as string, id: order.id as string };
}
