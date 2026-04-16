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

  const savings = bundle.original_price_cents - bundle.price_cents;
  const savingsPct = bundle.original_price_cents > 0
    ? Math.round((savings / bundle.original_price_cents) * 100)
    : 0;

  return (
    <>
      {/* Hero */}
      <section className="bg-ink px-6 py-16 text-white lg:px-12 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-xs text-white/60">
            <Link href="/" className="hover:text-yellow-brand">Home</Link>
            {' › '}
            <Link href="/bundles" className="hover:text-yellow-brand">Bundles</Link>
            {' › '}
            <span className="text-white">{bundle.name}</span>
          </div>
          {bundle.tagline && (
            <span className="mb-4 inline-block rounded-full border border-yellow-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-brand">
              {bundle.tagline}
            </span>
          )}
          <h1 className="mb-4 text-4xl font-black leading-tight lg:text-6xl">{bundle.name}</h1>
          {bundle.description && <p className="mb-8 max-w-2xl text-lg text-white/70">{bundle.description}</p>}

          <div className="flex flex-wrap items-baseline gap-4">
            <span className="text-5xl font-black text-yellow-brand">{formatSGD(bundle.price_cents)}</span>
            {savings > 0 && (
              <>
                <span className="text-lg text-white/50 line-through">{formatSGD(bundle.original_price_cents)}</span>
                <span className="rounded-full bg-yellow-brand px-3 py-1 text-xs font-bold text-ink">
                  Save {formatSGD(savings)} ({savingsPct}%)
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Products included */}
      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-black text-ink lg:text-3xl">What&apos;s inside</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {bundle.products.map((p) => (
              <Link
                key={p.slug}
                href={productHref(p.slug, routes)}
                className="group flex flex-col rounded-lg border-2 border-ink bg-white p-6 shadow-brand transition-all hover:shadow-brand-lg"
              >
                <div className="mb-4 flex h-24 items-center justify-center rounded bg-neutral-50 text-5xl">
                  {p.icon ?? '📦'}
                </div>
                <h3 className="mb-1 text-lg font-black text-ink group-hover:text-pink">{p.name}</h3>
                {p.qty && <div className="mb-1 text-xs font-semibold text-pink">{p.qty}</div>}
                {p.spec && <p className="mb-3 text-xs text-neutral-600">{p.spec}</p>}
                {p.value && (
                  <div className="mt-auto text-xs text-neutral-500">
                    Value: <span className="font-bold text-ink">{p.value}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      {bundle.whys.length > 0 && (
        <section className="bg-neutral-50 px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-2xl font-black text-ink lg:text-3xl">Why this bundle?</h2>
            <ul className="space-y-4">
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
            WhatsApp us and we&apos;ll get the details set up for you in minutes.
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
