import { getPageContent } from '@/lib/data/page_content';

export const metadata = {
  title: 'About Printvolution',
  description: 'Printing and personalised gifts at Paya Lebar Square, Singapore.',
};

export default async function AboutPage() {
  const content = await getPageContent('about');
  const values = (content.values?.items ?? []) as Array<{ emoji?: string; title: string; desc: string }>;
  const clients = (content.clients?.items ?? []) as Array<{ emoji?: string; title: string; desc: string }>;

  return (
    <>
      <section className="bg-ink px-6 py-20 text-white lg:px-12 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 text-xs font-bold uppercase tracking-wider text-yellow-brand">● About Us</div>
          <h1 className="mb-6 text-5xl font-black leading-tight lg:text-7xl">
            Print that <span className="text-pink">shows up</span>.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-white/70">
            At Paya Lebar Square, we&apos;ve been printing for startups, families, weddings, and Fortune 500s
            since the day we opened. Walk in with an idea — leave with something real.
          </p>
        </div>
      </section>

      {values.length > 0 && (
        <section className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-3xl font-black text-ink lg:text-4xl">What we value</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {values.map((v, i) => (
                <div key={i} className="rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
                  {v.emoji && <div className="mb-3 text-3xl">{v.emoji}</div>}
                  <h3 className="mb-2 text-lg font-black text-ink">{v.title}</h3>
                  <p className="text-sm text-neutral-600">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {clients.length > 0 && (
        <section className="bg-neutral-50 px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-3xl font-black text-ink lg:text-4xl">Who we serve</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {clients.map((c, i) => (
                <div key={i} className="rounded-lg border border-neutral-200 bg-white p-5">
                  {c.emoji && <div className="mb-2 text-2xl">{c.emoji}</div>}
                  <h3 className="mb-1 text-sm font-bold text-ink">{c.title}</h3>
                  <p className="text-xs text-neutral-600">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
