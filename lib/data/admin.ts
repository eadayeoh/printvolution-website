import { createClient } from '@/lib/supabase/server';

export type AdminStats = {
  total_orders: number;
  revenue_cents: number;
  pending_count: number;
  processing_count: number;
  ready_count: number;
  completed_count: number;
  total_members: number;
  total_products: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient();
  const [orders, members, products] = await Promise.all([
    supabase.from('orders').select('status, total_cents'),
    supabase.from('members').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const stats: AdminStats = {
    total_orders: 0, revenue_cents: 0, pending_count: 0,
    processing_count: 0, ready_count: 0, completed_count: 0,
    total_members: members.count ?? 0,
    total_products: products.count ?? 0,
  };

  for (const o of (orders.data ?? []) as any[]) {
    stats.total_orders++;
    if (o.status === 'pending') stats.pending_count++;
    else if (o.status === 'processing') stats.processing_count++;
    else if (o.status === 'ready') stats.ready_count++;
    else if (o.status === 'completed') {
      stats.completed_count++;
      stats.revenue_cents += o.total_cents ?? 0;
    }
  }
  return stats;
}

export type RecentOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  total_cents: number;
  status: string;
  created_at: string;
  item_count: number;
};

export async function getRecentOrders(limit = 10): Promise<RecentOrder[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, email, total_cents, status, created_at, order_items(id)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return ((data ?? []) as any[]).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    email: o.email,
    total_cents: o.total_cents,
    status: o.status,
    created_at: o.created_at,
    item_count: (o.order_items ?? []).length,
  }));
}

export type OrderListItem = RecentOrder & {
  phone: string;
  delivery_method: string;
  subtotal_cents: number;
};

export async function listOrders(filters?: { status?: string; search?: string }): Promise<OrderListItem[]> {
  const supabase = createClient();
  let query = supabase
    .from('orders')
    .select('id, order_number, customer_name, email, phone, delivery_method, subtotal_cents, total_cents, status, created_at, order_items(id)')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.search) {
    const s = filters.search.trim();
    query = query.or(`order_number.ilike.%${s}%,customer_name.ilike.%${s}%,email.ilike.%${s}%`);
  }

  const { data } = await query.limit(200);
  return ((data ?? []) as any[]).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    email: o.email,
    phone: o.phone,
    delivery_method: o.delivery_method,
    subtotal_cents: o.subtotal_cents,
    total_cents: o.total_cents,
    status: o.status,
    created_at: o.created_at,
    item_count: (o.order_items ?? []).length,
  }));
}

export async function getOrderById(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(id, product_name, product_slug, icon, config, qty, unit_price_cents, line_total_cents, personalisation_notes, gift_image_url),
      gift_order_items(
        id, qty, unit_price_cents, line_total_cents, mode, product_name_snapshot,
        production_status, production_error, admin_notes,
        gift_product:gift_products(id, slug, name, thumbnail_url, mode),
        source:gift_assets!gift_order_items_source_asset_id_fkey(id, bucket, path, mime_type),
        preview:gift_assets!gift_order_items_preview_asset_id_fkey(id, bucket, path, mime_type),
        production:gift_assets!gift_order_items_production_asset_id_fkey(id, bucket, path, mime_type, width_px, height_px, dpi),
        production_pdf:gift_assets!gift_order_items_production_pdf_id_fkey(id, bucket, path, mime_type)
      )
    `)
    .eq('id', id)
    .maybeSingle();
  return data as any;
}
