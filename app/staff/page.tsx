import { createClient } from '@/lib/supabase/server';
import { StaffQueue } from '@/components/staff/staff-queue';

// Staff dashboard scope: order queue + customer fulfillment data only.
// Revenue (subtotal_cents / total_cents) is intentionally NOT selected
// so a compromised staff session can't pull a sales report by replaying
// this page's RSC fetch. Admin sees revenue at /admin/orders.

export const metadata = { title: 'Order Queue' };

export default async function StaffDashboard({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from('orders')
    .select(`
      id, order_number, customer_name, email, phone, delivery_method,
      status, notes, created_at,
      order_items(id, product_name, product_slug, icon, config, qty, personalisation_notes, production_method, production_status, gift_image_url)
    `)
    .order('created_at', { ascending: false });

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status);
  }
  if (searchParams.q) {
    const s = searchParams.q.trim();
    query = query.or(`order_number.ilike.%${s}%,customer_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  const { data } = await query.limit(200);

  // Count by status (for badges)
  const { data: counts } = await supabase.from('orders').select('status');
  const byStatus = { pending: 0, processing: 0, ready: 0, completed: 0, cancelled: 0 } as Record<string, number>;
  for (const o of ((counts ?? []) as any[])) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-black text-ink">Order queue</h1>
        <div className="text-xs text-neutral-500">
          {new Date().toLocaleString('en-SG', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <StaffQueue
        orders={((data ?? []) as any[])}
        counts={byStatus}
        initialStatus={searchParams.status ?? 'all'}
        initialSearch={searchParams.q ?? ''}
      />
    </div>
  );
}
