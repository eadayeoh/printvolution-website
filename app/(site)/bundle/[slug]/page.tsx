import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getBundleBySlug } from '@/lib/data/bundles';
import { getProductRoutes, productHref } from '@/lib/data/navigation';
import { formatSGD } from '@/lib/utils';
import { BundleFAQ } from '@/components/product/bundle-faq';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const bundle = await getBundleBySlug(params.slug);
  if (!bundle) return { title: 'Not found' };
  return {
    title: bundle.name,
    description: bundle.description ?? bundle.tagline ?? undefined,
  };
}

export default async function BundlePage({ params }: { params: { slug: string } }) {
  const [bundle, routes] = await Promise.all([
    getBundleBySlug(params.slug),
    getProductRoutes(),
  ]);
  if (!bundle) notFound();

  const savingsPct = bundle.subtotal_cents > 0
    ? Math.round((bundle.discount_cents / bundle.subtotal_cents) * 100)
    : 0;
  const discountLabel = bundle.discount_type === 'pct'
    ? `${bundle.discount_value}% off`
    : bundle.discount_type === 'flat'
      ? `${formatSGD(bundle.discount_value)} off`
      : 'No discount';

  return (
    <>
      {/* Hero — emphasise the bundle pitch + savings, NOT a product grid */}
      <section className="relative overflow-hidden bg-ink px-6 py-16 text-white lg:px-12 lg:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-yellow-brand blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-pink blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-4 text-xs text-white/60">
            <Link href="/" className="hover:text-yellow-brand">Home</Link>
            {' › '}
            <Link href="/bundles" className="hover:text-yellow-brand">Bundles</Link>
            {' › '}
            <span className="text-white">{bundle.name}</span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-brand/50 bg-yellow-brand/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-brand">
              💎 Bundle Deal
            </span>
            {bundle.discount_cents > 0 && (
              <span className="rounded-full bg-yellow-brand px-3 py-1 text-[10px] font-black uppercase text-ink">
                Save {savingsPct}% · {discountLabel}
              </span>
            )}
          </div>

          <h1 className="mb-3 text-4xl font-black leading-tight lg:text-6xl">{bundle.name}</h1>
          {bundle.tagline && <p className="mb-3 text-xl font-semibold text-yellow-brand">{bundle.tagline}</p>}
          {bundle.description && <p className="mb-8 max-w-2xl text-base text-white/70 lg:text-lg">{bundle.description}</p>}

          <div className="mb-8 flex flex-wrap items-baseline gap-4">
            <div>
              <span className="text-6xl font-black text-yellow-brand">{formatSGD(bundle.price_cents)}</span>
            </div>
            {bundle.discount_cents > 0 && (
              <div className="flex flex-col">
                <span className="text-sm text-white/50 line-through">{formatSGD(bundle.subtotal_cents)}</span>
                <span className="text-sm font-bold text-green-400">
                  You save {formatSGD(bundle.discount_cents)}
                </span>
              </div>
            )}
          </div>

          <a
            href="https://wa.me/6585533497"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-yellow-brand px-8 py-4 text-sm font-bold text-ink transition-colors hover:brightness-95"
          >
            💬 WhatsApp to order this bundle
          </a>
        </div>
      </section>

      {/* What's inside — detailed per-product cards, not a shop grid */}
      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">● What you get</div>
            <h2 className="text-3xl font-black text-ink lg:text-4xl">{bundle.products.length} products, one price</h2>
          </div>

          <div className="space-y-4">
            {bundle.products.map((p, i) => (
              <div
                key={p.slug}
                className="flex flex-col gap-6 rounded-lg border-2 border-ink bg-white p-6 shadow-brand md:flex-row md:items-start lg:p-8"
              >
                {/* Icon + index */}
                <div className="flex items-center gap-4 md:flex-col md:items-start">
                  <div className="text-xs font-black text-pink">{String(i + 1).padStart(2, '0')}</div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-neutral-50 text-5xl md:h-28 md:w-28 md:text-6xl">
                    {p.icon ?? '📦'}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-ink lg:text-2xl">{p.name}</h3>
                    <span className="rounded bg-pink/10 px-2 py-0.5 text-[10px] font-bold uppercase text-pink">
                      × {p.override_qty}
                    </span>
                  </div>
                  {p.tagline && <p className="mb-2 text-sm italic text-neutral-500">{p.tagline}</p>}
                  {p.description && <p className="mb-4 text-sm text-neutral-700">{p.description}</p>}
                  <div className="flex items-center gap-3">
                    {p.line_price_cents !== null ? (
                      <span className="text-xs text-neutral-500">
                        Individual value: <strong className="text-ink">{formatSGD(p.line_price_cents)}</strong>
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">Custom pricing</span>
                    )}
                    <Link
                      href={productHref(p.slug, routes)}
                      className="text-xs font-bold text-pink hover:underline"
                    >
                      View product details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total recap */}
          <div className="mt-8 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">If bought separately</div>
                <div className="text-lg font-bold text-neutral-600 line-through">{formatSGD(bundle.subtotal_cents)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wider text-pink">Bundle price</div>
                <div className="text-3xl font-black text-pink">{formatSGD(bundle.price_cents)}</div>
              </div>
            </div>
            {bundle.discount_cents > 0 && (
              <div className="mt-3 rounded bg-green-50 border border-green-200 px-4 py-2 text-center text-sm font-bold text-green-800">
                ✓ You save {formatSGD(bundle.discount_cents)} ({savingsPct}%) with this bundle
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why */}
      {bundle.whys.length > 0 && (
        <section className="bg-neutral-50 px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-2xl font-black text-ink lg:text-3xl">Why this bundle?</h2>
            <ul className="space-y-3">
              {bundle.whys.map((w, i) => (
                <li key={i} className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-5">
                  <span className="text-2xl font-black text-yellow-brand">0{i + 1}</span>
                  <span className="font-semibold text-ink">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ */}
      {bundle.faqs.length > 0 && <BundleFAQ faqs={bundle.faqs} />}

      {/* CTA */}
      <section className="bg-yellow-brand px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-black text-ink lg:text-4xl">Ready to order this bundle?</h2>
          <p className="mb-8 text-sm text-ink/70">
            WhatsApp us and we&apos;ll set everything up in minutes.
          </p>
          <a
            href="https://wa.me/6585533497"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-pink"
          >
            💬 WhatsApp Us to Order
          </a>
        </div>
      </section>
    </>
  );
}
