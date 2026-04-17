import { createClient } from '@/lib/supabase/server';

export type DailyRevenuePoint = { date: string; cents: number; orders: number };

export type AnalyticsBundle = {
  daily: DailyRevenuePoint[];        // last 30 days
  revenue7d: number;                 // last 7 days (completed only)
  revenue30d: number;                // last 30 days
  revenueToday: number;
  orders7d: number;
  orders30d: number;
  avgOrderCents: number;             // across last 30 days
  topProducts: Array<{ slug: string; name: string; orders: number; revenue_cents: number }>;
  ordersByStatus: Record<string, number>;
};

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export async function getAnalytics(): Promise<AnalyticsBundle> {
  const sb = createClient();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

  const [ordersRes, itemsRes] = await Promise.all([
    sb.from('orders').select('id, status, total_cents, created_at').gte('created_at', since30),
    sb.from('order_items').select('product_slug, product_name, qty, line_total_cents, order:orders!inner(created_at, status)').gte('order.created_at', since30),
  ]);

  const orders = (ordersRes.data ?? []) as Array<{ id: string; status: string; total_cents: number; created_at: string }>;

  // Seed 30 days with zeros
  const dailyMap = new Map<string, { cents: number; orders: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dailyMap.set(d.toISOString().slice(0, 10), { cents: 0, orders: 0 });
  }

  let revenue7d = 0, revenue30d = 0, revenueToday = 0;
  let orders7d = 0, orders30d = 0;
  const ordersByStatus: Record<string, number> = {};
  const todayKey = startOfToday.toISOString().slice(0, 10);
  const since7date = new Date(since7);

  for (const o of orders) {
    const k = dayKey(o.created_at);
    const entry = dailyMap.get(k);
    const isCompleted = o.status === 'completed';
    if (entry) {
      entry.orders++;
      if (isCompleted) entry.cents += o.total_cents ?? 0;
    }
    orders30d++;
    if (isCompleted) revenue30d += o.total_cents ?? 0;
    if (new Date(o.created_at) >= since7date) {
      orders7d++;
      if (isCompleted) revenue7d += o.total_cents ?? 0;
    }
    if (k === todayKey && isCompleted) revenueToday += o.total_cents ?? 0;
    ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
  }

  // Top products by revenue in the last 30 days
  const productRevenue = new Map<string, { name: string; orders: number; revenue_cents: number }>();
  for (const it of (itemsRes.data ?? []) as any[]) {
    if (!it.product_slug) continue;
    // only count items from completed orders
    const st = Array.isArray(it.order) ? it.order[0]?.status : it.order?.status;
    if (st !== 'completed') continue;
    const prev = productRevenue.get(it.product_slug) ?? { name: it.product_name, orders: 0, revenue_cents: 0 };
    prev.orders += it.qty ?? 1;
    prev.revenue_cents += it.line_total_cents ?? 0;
    productRevenue.set(it.product_slug, prev);
  }
  const topProducts = Array.from(productRevenue.entries())
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.revenue_cents - a.revenue_cents)
    .slice(0, 5);

  const daily: DailyRevenuePoint[] = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v }));
  const avgOrderCents = orders30d > 0 ? Math.round(revenue30d / orders30d) : 0;

  return {
    daily,
    revenue7d, revenue30d, revenueToday,
    orders7d, orders30d,
    avgOrderCents,
    topProducts,
    ordersByStatus,
  };
}
