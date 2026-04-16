import Link from 'next/link';
import { listBundles } from '@/lib/data/bundles';
import { formatSGD } from '@/lib/utils';

export const metadata = {
  title: 'Bundles',
  description: 'Curated bundles for launches, weddings, and corporate gifting.',
};

export default async function BundlesPage() {
  const bundles = await listBundles();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
      <div className="mb-12 text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-brand">● Bundle & Save</div>
        <h1 className="mb-4 text-4xl font-black text-ink lg:text-6xl">Curated packs, better value.</h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-600">
          Hand-picked combinations for specific occasions and business needs.
          Save more than buying individually.
        </p>
      </div>

      {bundles.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-neutral-200 p-16 text-center">
          <p className="text-lg font-semibold text-neutral-400">No bundles available right now.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {bundles.map((b) => {
            const savings = b.original_price_cents - b.price_cents;
            const savingsPct = b.original_price_cents > 0
              ? Math.round((savings / b.original_price_cents) * 100)
              : 0;
            return (
              <Link
                key={b.id}
                href={`/bundle/${b.slug}`}
                className="group rounded-lg border-2 border-ink bg-white p-8 shadow-brand transition-all hover:shadow-brand-lg"
              >
                {b.tagline && (
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">{b.tagline}</div>
                )}
                <h3 className="mb-3 text-2xl font-black text-ink group-hover:text-pink">{b.name}</h3>
                {b.description && <p className="mb-6 text-sm text-neutral-600">{b.description}</p>}

                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-pink">{formatSGD(b.price_cents)}</span>
                  {savings > 0 && (
                    <>
                      <span className="text-sm text-neutral-400 line-through">{formatSGD(b.original_price_cents)}</span>
                      <span className="rounded bg-yellow-brand px-2 py-0.5 text-[10px] font-bold text-ink">
                        Save {savingsPct}%
                      </span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
