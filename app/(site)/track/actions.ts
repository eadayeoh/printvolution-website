'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { giftItemDisplayName } from '@/lib/gifts/types';

// Escape Postgres LIKE wildcards so untrusted input can't match unrelated rows.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

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
  // Cheap shape gate so junk input doesn't burn a rate-limit slot
  // and doesn't widen our query surface.
  if (!/^[A-Za-z0-9-]{3,32}$/.test(num)) return { ok: false, error: 'That doesn\'t look like an order number.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) || em.length > 254) return { ok: false, error: 'Enter a valid email.' };

  // Second rate limit keyed on the order_number itself so a botnet
  // hitting many IPs against one target order can't bypass the
  // per-IP cap. This also covers the case where getClientIp()
  // falls back to "unknown" and many requesters share that bucket.
  const numRl = await checkRateLimit(`track-num:${num}`, { max: 30, windowSeconds: 600 });
  if (!numRl.allowed) return { ok: false, error: `Too many tries — wait ${numRl.retryAfterSeconds}s.` };

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
    .ilike('email', escapeLike(em))
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
        product_name: giftItemDisplayName(g),
        production_status: g.production_status,
      })),
    },
  };
}
