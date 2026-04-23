import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { advanceStatus } from './actions';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  production_status: string;
  admin_notes: string | null;
  created_at: string;
  variant_name_snapshot: string | null;
  source_purged_at: string | null;
  production_purged_at: string | null;
  bundle_id: string | null;
  order: { order_number: number | null; customer_email: string | null; created_at: string; shipping_name: string | null; shipping_address_1: string | null; shipping_city: string | null; shipping_postal_code: string | null } | null;
  product: { name: string; slug: string; source_retention_days: number | null } | null;
  bundle: { id: string; slug: string; name: string } | null;
  source: { bucket: string; path: string } | null;
  production: { bucket: string; path: string } | null;
  production_pdf: { bucket: string; path: string } | null;
  surfaces: Array<{
    id: string;
    surface_id: string;
    surface_label: string;
    text: string | null;
    mode: string;
    production_status: string;
    production_error: string | null;
    display_order: number;
    src_asset: { bucket: string; path: string } | null;
    prod_asset: { bucket: string; path: string } | null;
    pdf_asset: { bucket: string; path: string } | null;
  }>;
};

export default async function AdminGiftOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; from_bundle?: string };
}) {
  const sb = createClient();

  let q = sb.from('gift_order_items').select(`
    id, production_status, admin_notes, created_at, variant_name_snapshot,
    source_purged_at, production_purged_at, bundle_id,
    order:orders!inner(order_number, customer_email, created_at, shipping_name, shipping_address_1, shipping_city, shipping_postal_code),
    product:gift_products(name, slug, source_retention_days),
    bundle:bundles(id, slug, name),
    source:gift_assets!source_asset_id(bucket, path),
    production:gift_assets!production_asset_id(bucket, path),
    production_pdf:gift_assets!production_pdf_id(bucket, path),
    surfaces:gift_order_item_surfaces(
      id, surface_id, surface_label, text, mode, production_status, production_error, display_order,
      src_asset:gift_assets!source_asset_id(bucket, path),
      prod_asset:gift_assets!production_asset_id(bucket, path),
      pdf_asset:gift_assets!production_pdf_id(bucket, path)
    )
  `).order('created_at', { ascending: false }).limit(200);

  if (searchParams.status && searchParams.status !== 'all') {
    q = q.eq('production_status', searchParams.status);
  }
  if (searchParams.from_bundle === '1') {
    q = q.not('bundle_id', 'is', null);
  }

  const { data, error } = await q;
  const items = (data ?? []) as unknown as Row[];

  const statuses = ['all', 'pending', 'processing', 'ready', 'failed'];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">Gift production queue</h1>
        <Link href="/admin/gifts" className="text-xs underline">← Gifts admin</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {statuses.map((s) => {
          const active = (searchParams.status ?? 'all') === s;
          const href = s === 'all'
            ? (searchParams.from_bundle === '1' ? '/admin/gifts/orders?from_bundle=1' : '/admin/gifts/orders')
            : `/admin/gifts/orders?status=${s}${searchParams.from_bundle === '1' ? '&from_bundle=1' : ''}`;
          return (
            <Link key={s} href={href}
              className={`rounded border-2 px-3 py-1 font-bold uppercase ${active ? 'border-ink bg-ink text-white' : 'border-ink bg-white'}`}>
              {s}
            </Link>
          );
        })}
        <Link
          href={searchParams.from_bundle === '1'
            ? (searchParams.status ? `/admin/gifts/orders?status=${searchParams.status}` : '/admin/gifts/orders')
            : `/admin/gifts/orders?from_bundle=1${searchParams.status ? `&status=${searchParams.status}` : ''}`}
          className={`rounded border-2 border-pink px-3 py-1 font-bold uppercase ${searchParams.from_bundle === '1' ? 'bg-pink text-white' : 'bg-white text-pink'}`}>
          ● Bundle items only
        </Link>
      </div>

      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">{error.message}</div>}

      {items.length === 0 ? (
        <div className="rounded border-2 border-dashed p-8 text-center text-sm text-neutral-500">
          No matching items.
        </div>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead className="bg-neutral-100">
            <tr>
              <th className="border-b p-2 text-left">Order</th>
              <th className="border-b p-2 text-left">Customer</th>
              <th className="border-b p-2 text-left">Product</th>
              <th className="border-b p-2 text-left">Downloads</th>
              <th className="border-b p-2 text-left">Status</th>
              <th className="border-b p-2 text-left">Expires</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const retention = it.product?.source_retention_days ?? 30;
              const orderCreated = it.order ? new Date(it.order.created_at) : new Date(it.created_at);
              const expiresAt = new Date(orderCreated.getTime() + retention * 86400000);
              const expiresText = expiresAt.toISOString().slice(0, 10);
              const now = Date.now();
              const daysLeft = Math.max(0, Math.round((expiresAt.getTime() - now) / 86400000));
              const srcGone = !!it.source_purged_at || !it.source?.path;
              const prodGone = !!it.production_purged_at || !it.production?.path;
              const pdfGone = !!it.production_purged_at || !it.production_pdf?.path;

              return (
                <tr key={it.id} className="align-top">
                  <td className="border-b p-2 font-mono">
                    #{it.order?.order_number ?? '—'}
                    {it.bundle && (
                      <div className="mt-1 inline-block rounded bg-yellow-brand px-1.5 py-0.5 text-[9px] font-bold uppercase text-ink">
                        bundle · {it.bundle.name}
                      </div>
                    )}
                  </td>
                  <td className="border-b p-2">
                    <div className="font-bold">{it.order?.shipping_name ?? '—'}</div>
                    <div className="text-neutral-600">{it.order?.customer_email ?? '—'}</div>
                    {it.order?.shipping_address_1 && (
                      <div className="mt-1 text-[10px] text-neutral-500">
                        {it.order.shipping_address_1}, {it.order.shipping_city} {it.order.shipping_postal_code}
                      </div>
                    )}
                  </td>
                  <td className="border-b p-2">
                    <div className="font-bold">{it.product?.name ?? '—'}</div>
                    {it.variant_name_snapshot && (
                      <div className="text-[10px] text-neutral-600">· {it.variant_name_snapshot}</div>
                    )}
                  </td>
                  <td className="border-b p-2">
                    {!srcGone && it.source && (
                      <a href={`/api/admin/gift-download?bucket=${it.source.bucket}&path=${encodeURIComponent(it.source.path)}`}
                         className="mr-2 inline-block rounded border border-ink px-1.5 py-0.5 text-[10px] font-bold underline">src</a>
                    )}
                    {!prodGone && it.production && (
                      <a href={`/api/admin/gift-download?bucket=${it.production.bucket}&path=${encodeURIComponent(it.production.path)}`}
                         className="mr-2 inline-block rounded border border-ink bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">PNG 300</a>
                    )}
                    {!pdfGone && it.production_pdf && (
                      <a href={`/api/admin/gift-download?bucket=${it.production_pdf.bucket}&path=${encodeURIComponent(it.production_pdf.path)}`}
                         className="inline-block rounded border border-ink bg-pink px-1.5 py-0.5 text-[10px] font-bold text-white">PDF</a>
                    )}
                    {srcGone && prodGone && pdfGone && (it.surfaces?.length ?? 0) === 0 && (
                      <span className="text-[10px] text-neutral-400">purged</span>
                    )}
                    {(it.surfaces?.length ?? 0) > 0 && (
                      <div className="mt-2 space-y-1 border-t border-neutral-200 pt-2">
                        <div className="text-[9px] font-bold uppercase text-neutral-500 tracking-wider">Surfaces</div>
                        {it.surfaces
                          .slice()
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((sf) => (
                            <div key={sf.id} className="flex items-start gap-2">
                              <div className="w-20 flex-shrink-0">
                                <div className="font-bold">{sf.surface_label}</div>
                                <div className="text-[9px] text-neutral-500">({sf.mode})</div>
                              </div>
                              <div className="flex-1">
                                {sf.text && <div className="italic text-neutral-700">&quot;{sf.text}&quot;</div>}
                                <div className="mt-0.5 flex flex-wrap gap-1">
                                  {sf.src_asset && (
                                    <a href={`/api/admin/gift-download?bucket=${sf.src_asset.bucket}&path=${encodeURIComponent(sf.src_asset.path)}`}
                                       className="rounded border border-ink px-1 py-0.5 text-[10px] font-bold underline">src</a>
                                  )}
                                  {sf.prod_asset && (
                                    <a href={`/api/admin/gift-download?bucket=${sf.prod_asset.bucket}&path=${encodeURIComponent(sf.prod_asset.path)}`}
                                       className="rounded border border-ink bg-ink px-1 py-0.5 text-[10px] font-bold text-white">PNG</a>
                                  )}
                                  {sf.pdf_asset && (
                                    <a href={`/api/admin/gift-download?bucket=${sf.pdf_asset.bucket}&path=${encodeURIComponent(sf.pdf_asset.path)}`}
                                       className="rounded border border-ink bg-pink px-1 py-0.5 text-[10px] font-bold text-white">PDF</a>
                                  )}
                                  <span className={`rounded px-1 py-0.5 text-[10px] font-bold uppercase ${
                                    sf.production_status === 'ready' ? 'bg-green-100 text-green-800' :
                                    sf.production_status === 'failed' ? 'bg-red-100 text-red-800' :
                                    sf.production_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-neutral-100 text-neutral-700'
                                  }`}>
                                    {sf.production_status}
                                  </span>
                                </div>
                                {sf.production_error && (
                                  <div className="mt-0.5 text-[9px] text-red-600">{sf.production_error}</div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </td>
                  <td className="border-b p-2">
                    <form action={advanceStatus} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={it.id} />
                      <select name="status" defaultValue={it.production_status} className="border border-ink p-1 text-xs">
                        <option value="pending">pending</option>
                        <option value="processing">processing</option>
                        <option value="ready">ready</option>
                        <option value="failed">failed</option>
                      </select>
                      <button type="submit" className="rounded border border-ink bg-white px-1.5 py-0.5 font-bold uppercase">save</button>
                    </form>
                  </td>
                  <td className="border-b p-2">
                    <div className="font-mono text-[10px]">{expiresText}</div>
                    <div className="text-[10px] text-neutral-500">{daysLeft} days left</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
