import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderById } from '@/lib/data/admin';
import { formatSGD } from '@/lib/utils';
import { OrderStatusUpdater } from '@/components/admin/order-status-updater';

export const metadata = { title: 'Order Detail' };

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) notFound();

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/orders" className="mb-4 inline-flex items-center text-xs font-bold text-pink hover:underline">
        ← Back to orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink">{order.order_number}</h1>
          <p className="text-sm text-neutral-500">Placed {new Date(order.created_at).toLocaleString('en-SG')}</p>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3 font-bold text-ink">Items</div>
            <div className="divide-y divide-neutral-100">
              {(order.order_items ?? []).map((item: any) => (
                <div key={item.id} className="flex gap-4 p-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded bg-neutral-50 text-3xl">
                    {item.icon ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink">{item.product_name}</div>
                    {Object.keys(item.config ?? {}).length > 0 && (
                      <div className="mt-1 text-xs text-neutral-500">
                        {Object.entries(item.config).map(([k, v]) => (
                          <span key={k} className="mr-3">
                            <span className="text-neutral-400">{k}:</span> <span className="font-semibold text-neutral-700">{v as string}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {item.personalisation_notes && (
                      <div className="mt-1 text-xs text-neutral-700">
                        <strong>Notes:</strong> {item.personalisation_notes}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-neutral-500">Qty {item.qty}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-pink">{formatSGD(item.line_total_cents)}</div>
                    <div className="text-[10px] text-neutral-400">{formatSGD(item.unit_price_cents)} ea</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notes */}
          {order.notes && (
            <section className="rounded-lg border border-neutral-200 bg-white p-4">
              <h2 className="mb-2 font-bold text-ink">Customer notes</h2>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}
        </div>

        {/* Summary */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-ink">Customer</h2>
            <div className="space-y-1.5 text-sm">
              <div><span className="text-neutral-500">Name:</span> <strong className="text-ink">{order.customer_name}</strong></div>
              <div><span className="text-neutral-500">Email:</span> <a href={`mailto:${order.email}`} className="text-pink hover:underline">{order.email}</a></div>
              <div><span className="text-neutral-500">Phone:</span> <a href={`https://wa.me/${order.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">{order.phone}</a></div>
              {order.company && <div><span className="text-neutral-500">Company:</span> <strong className="text-ink">{order.company}</strong></div>}
              {order.position && <div><span className="text-neutral-500">Position:</span> <strong className="text-ink">{order.position}</strong></div>}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-ink">Delivery</h2>
            <div className="space-y-1.5 text-sm">
              <div><span className="text-neutral-500">Method:</span> <strong className="text-ink capitalize">{order.delivery_method}</strong></div>
              {order.delivery_address && <div className="whitespace-pre-wrap text-xs text-neutral-700">{order.delivery_address}</div>}
            </div>
          </div>

          <div className="rounded-lg border-2 border-ink bg-white p-4 shadow-brand">
            <h2 className="mb-3 font-bold text-ink">Totals</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal</span>
                <span className="text-ink">{formatSGD(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Delivery</span>
                <span className="text-ink">{order.delivery_cents > 0 ? formatSGD(order.delivery_cents) : 'Free'}</span>
              </div>
              {order.points_discount_cents > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Points discount ({order.points_redeemed} pts)</span>
                  <span>-{formatSGD(order.points_discount_cents)}</span>
                </div>
              )}
              {order.coupon_discount_cents > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Coupon{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                  <span>-{formatSGD(order.coupon_discount_cents)}</span>
                </div>
              )}
              <div className="border-t border-neutral-200 pt-1.5 flex justify-between font-bold">
                <span className="text-ink">Total</span>
                <span className="text-pink">{formatSGD(order.total_cents)}</span>
              </div>
              <div className="text-right text-[10px] text-neutral-400">
                +{order.points_earned} points earned
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
