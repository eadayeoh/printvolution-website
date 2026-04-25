'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export type TrackedOrder = {
  order_number: string;
  status: string;
  created_at: string;
  delivery_method: string;
  total_cents: number;
  customer_name: string;
  email: string;
  gift_wrap: boolean;
  items: Array<{ qty: number; product_name: string }>;
  gifts: Array<{ qty: number; product_name: string; production_status: string }>;
};

export type TrackResult =
  | { ok: true; order: TrackedOrder }
  | { ok: false; error: string };

/** Look up an order by order_number + email. Both must match — email is
 *  the soft authentication. Rate-limited per IP to deter scraping. */
export async function trackOrder(orderNumber: string, email: string): Promise<TrackResult> {
  const ip = getClientIp();
  const rl = await checkRateLimit(`track:${ip}`, { max: 15, windowSeconds: 600 });
  if (!rl.allowed) return { ok: false, error: `Too many tries — wait ${rl.retryAfterSeconds}s.` };

  const num = orderNumber.trim();
  const em = email.trim().toLowerCase();
  if (!num || !em) return { ok: false, error: 'Order number and email both required.' };

  const sb = createServiceClient();
  const { data, error } = await sb
    .from('orders')
    .select(`
      order_number, status, created_at, delivery_method, total_cents,
      customer_name, email, gift_wrap,
      order_items(qty, product_name),
      gift_order_items(qty, product_name_snapshot, production_status, gift_product:gift_products(name))
    `)
    .eq('order_number', num)
    .ilike('email', em)
    .maybeSingle();

  if (error) return { ok: false, error: 'Lookup failed — try again in a moment.' };
  if (!data) return { ok: false, error: 'No order matches that number + email combo.' };

  const o: any = data;
  return {
    ok: true,
    order: {
      order_number: o.order_number,
      status: o.status,
      created_at: o.created_at,
      delivery_method: o.delivery_method,
      total_cents: o.total_cents,
      customer_name: o.customer_name,
      email: o.email,
      gift_wrap: !!o.gift_wrap,
      items: (o.order_items ?? []).map((i: any) => ({ qty: i.qty, product_name: i.product_name })),
      gifts: (o.gift_order_items ?? []).map((g: any) => ({
        qty: g.qty,
        product_name: g.product_name_snapshot ?? g.gift_product?.name ?? 'Gift',
        production_status: g.production_status,
      })),
    },
  };
}
