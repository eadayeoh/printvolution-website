import Link from 'next/link';
import { getPageContent, getContactMethods } from '@/lib/data/page_content';
import { listBundles } from '@/lib/data/bundles';
import { listTopCategories } from '@/lib/data/categories';
import { listProducts } from '@/lib/data/products';
import { formatSGD } from '@/lib/utils';

export default async function HomePage() {
  const [homeContent, contacts, bundles, topCats, products] = await Promise.all([
    getPageContent('home'),
    getContactMethods(),
    listBundles(),
    listTopCategories(),
    listProducts(),
  ]);

  const pain = (homeContent.pain?.items ?? []) as Array<{ q: string; a: string }>;
  const steps = (homeContent.steps?.items ?? []) as Array<{ title: string; desc: string }>;
  const why = (homeContent.why?.items ?? []) as Array<{ title: string; desc: string; emoji?: string }>;

  const whatsapp = contacts.find((c) => c.type === 'whatsapp');
  const email = contacts.find((c) => c.type === 'email');

  // Top categories with a sample product count
  const productsByCat = new Map<string, number>();
  for (const p of products) {
    if (p.category) {
      productsByCat.set(p.category.slug, (productsByCat.get(p.category.slug) ?? 0) + 1);
    }
  }

  return (
    <>
      {/* Split hero */}
      <section className="grid min-h-[600px] lg:grid-cols-2">
        <div className="relative flex items-center px-8 py-16 lg:px-16 lg:py-24">
          <div className="max-w-lg">
            <span className="mb-4 inline-block rounded-full border border-pink px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pink">
              01 / 02 · Print
            </span>
            <span className="mb-8 block w-fit rounded-full border border-pink px-3 py-1 text-[11px] font-bold text-pink">
              Printing Services
            </span>
            <h1 className="mb-6 text-5xl font-black leading-[0.95] tracking-tight text-ink lg:text-7xl">
              Print that
              <br />
              makes
              <br />
              <span className="text-pink">your brand</span>
              <br />
              <span className="text-pink">look</span>
              <br />
              <span className="text-pink">the part.</span>
            </h1>
            <p className="mb-8 border-l-2 border-pink pl-4 text-sm leading-relaxed text-neutral-600 lg:text-base">
              Name cards, flyers, banners, uniforms, signage — all under one roof at Paya Lebar Square. File check on every job. Express 24h available.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex items-center rounded-full bg-pink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-pink-dark">
                Browse Printing
              </Link>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.value.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border-2 border-ink bg-white px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-white"
                >
                  WhatsApp Us
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex items-center bg-ink px-8 py-16 text-white lg:px-16 lg:py-24">
          <div className="max-w-lg">
            <span className="mb-4 inline-block rounded-full border border-yellow-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-brand">
              02 / 02 · Gifts
            </span>
            <span className="mb-8 block w-fit rounded-full border border-yellow-brand px-3 py-1 text-[11px] font-bold text-yellow-brand">
              Personalised Gifts
            </span>
            <h1 className="mb-6 text-5xl font-black leading-[0.95] tracking-tight text-white lg:text-7xl">
              Gifts that
              <br />
              feel
              <br />
              <span className="text-yellow-brand">made for</span>
              <br />
              <span className="text-yellow-brand">them.</span>
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-white/70 lg:text-base">
              LED photo frames, engraved tumblers, custom tote bags, corporate hampers. Walk in with an idea — leave with a gift they&apos;ll keep.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop?gift=1" className="inline-flex items-center rounded-full bg-yellow-brand px-6 py-3 text-sm font-bold text-ink transition-colors hover:brightness-95">
                Shop Gifts
              </Link>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.value.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border-2 border-cyan-brand bg-ink px-6 py-3 text-sm font-bold text-cyan-brand transition-colors hover:bg-cyan-brand hover:text-ink"
                >
                  WhatsApp Us
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category marquee */}
      <section className="overflow-hidden border-y-2 border-ink bg-pink py-4">
        <div className="flex animate-marquee gap-12 whitespace-nowrap text-xl font-black text-white">
          {[...topCats, ...topCats].map((c, i) => (
            <Link key={`${c.slug}-${i}`} href={`/shop?category=${c.slug}`} className="hover:text-ink">
              — {c.name.toUpperCase()}
            </Link>
          ))}
        </div>
      </section>

      {/* Why us / Pain points */}
      {pain.length > 0 && (
        <section className="px-6 py-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">● What Our Customers Say</div>
              <h2 className="text-4xl font-black text-ink lg:text-5xl">The conversations we have every week.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pain.map((p, i) => (
                <div key={i} className="border-l-4 border-pink bg-white p-6 shadow-sm">
                  <div className="mb-3 text-sm italic text-neutral-500">&ldquo;{p.q}&rdquo;</div>
                  <div className="text-sm font-semibold text-ink">{p.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process steps */}
      {steps.length > 0 && (
        <section className="bg-neutral-50 px-6 py-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">● How It Works</div>
              <h2 className="text-4xl font-black text-ink lg:text-5xl">From WhatsApp to your hands.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div key={i} className="rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
                  <div className="mb-3 text-5xl font-black text-pink">0{i + 1}</div>
                  <div className="mb-2 text-sm font-bold text-ink">{s.title}</div>
                  <div className="text-xs leading-relaxed text-neutral-600">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bundles */}
      {bundles.length > 0 && (
        <section className="px-6 py-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-brand">● Bundle & Save</div>
              <h2 className="text-4xl font-black text-ink lg:text-5xl">Curated packs, better value.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {bundles.map((b) => (
                <Link
                  key={b.id}
                  href={`/bundle/${b.slug}`}
                  className="group rounded-lg border-2 border-ink bg-white p-8 shadow-brand transition-all hover:shadow-brand-lg"
                >
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">{b.tagline ?? 'Bundle'}</div>
                  <h3 className="mb-3 text-2xl font-black text-ink">{b.name}</h3>
                  {b.description && <p className="mb-4 text-sm text-neutral-600">{b.description}</p>}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-pink">{formatSGD(b.price_cents)}</span>
                    {b.original_price_cents > b.price_cents && (
                      <>
                        <span className="text-sm text-neutral-400 line-through">{formatSGD(b.original_price_cents)}</span>
                        <span className="rounded bg-yellow-brand px-2 py-0.5 text-[10px] font-bold text-ink">
                          Save {formatSGD(b.original_price_cents - b.price_cents)}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-ink py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-yellow-brand">● Need Printing?</div>
          <h2 className="mb-8 text-4xl font-black leading-tight lg:text-6xl">WhatsApp us for an instant quote.</h2>
          {whatsapp && (
            <div className="mb-10 flex justify-center">
              <a
                href={`https://wa.me/${whatsapp.value.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full bg-green-500 px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-green-600"
              >
                💬 WhatsApp · {whatsapp.value}
              </a>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <span className="rounded-full border border-white/20 px-4 py-2">📍 60 Paya Lebar Rd #B1-35</span>
            <span className="rounded-full border border-white/20 px-4 py-2">🕐 Mon–Sat · 10am–7.30pm</span>
            {email && <span className="rounded-full border border-white/20 px-4 py-2">✉️ {email.value}</span>}
            <span className="rounded-full border border-white/20 px-4 py-2">⚡ Same-day Express</span>
          </div>
        </div>
      </section>
    </>
  );
}
