import { listOrders } from '@/lib/data/admin';
import { OrdersTable } from '@/components/admin/orders-table';

export const metadata = { title: 'Orders' };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const orders = await listOrders({ status: searchParams.status, search: searchParams.q });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Orders</h1>
          <p className="text-sm text-neutral-500">{orders.length} result{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <OrdersTable orders={orders} initialStatus={searchParams.status ?? 'all'} initialSearch={searchParams.q ?? ''} />
    </div>
  );
}
