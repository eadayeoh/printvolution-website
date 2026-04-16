import Link from 'next/link';
import { listBundles } from '@/lib/data/bundles';
import { formatSGD } from '@/lib/utils';

export const metadata = { title: 'Bundles' };

export default async function AdminBundles() {
  const bundles = await listBundles();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink">Bundles</h1>
          <p className="text-sm text-neutral-500">Curated product packs with admin-set discounts.</p>
        </div>
        <Link
          href="/admin/bundles/new"
          className="rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark"
        >
          + New Bundle
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {bundles.length === 0 ? (
          <div className="col-span-2 rounded-lg border-2 border-dashed border-neutral-200 p-12 text-center">
            <p className="mb-4 text-sm text-neutral-500">No bundles yet.</p>
            <Link
              href="/admin/bundles/new"
              className="inline-flex items-center rounded-full bg-pink px-4 py-2 text-xs font-bold text-white"
            >
              + Create your first bundle
            </Link>
          </div>
        ) : (
          bundles.map((b) => (
            <Link
              key={b.id}
              href={`/admin/bundles/${b.slug}`}
              className="rounded-lg border border-neutral-200 bg-white p-5 transition-all hover:border-ink hover:shadow-brand"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-bold text-ink">{b.name}</h3>
                {b.discount_cents > 0 && (
                  <span className="rounded bg-yellow-brand px-2 py-0.5 text-[10px] font-black uppercase text-ink">
                    {b.discount_type === 'pct' ? `${b.discount_value}% off` : `${formatSGD(b.discount_value)} off`}
                  </span>
                )}
              </div>
              {b.tagline && <p className="mb-3 text-xs text-neutral-500">{b.tagline}</p>}
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-pink">{formatSGD(b.price_cents)}</span>
                {b.discount_cents > 0 && (
                  <span className="text-xs text-neutral-400 line-through">{formatSGD(b.subtotal_cents)}</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        Bundle builder (create/edit) is being built in Phase 6. Public bundles are working with product selection + % or $ off.
      </p>
    </div>
  );
}
