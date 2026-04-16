import { getContactMethods } from '@/lib/data/page_content';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Printvolution. WhatsApp, phone, or visit our store at Paya Lebar Square.',
};

const TYPE_META: Record<string, { icon: string; href: (v: string) => string }> = {
  whatsapp: { icon: '💬', href: (v) => `https://wa.me/${v.replace(/\D/g, '')}` },
  phone: { icon: '📞', href: (v) => `tel:${v.replace(/\s/g, '')}` },
  email: { icon: '✉️', href: (v) => `mailto:${v}` },
  instagram: { icon: '📷', href: (v) => `https://instagram.com/${v.replace('@', '')}` },
  facebook: { icon: '👥', href: (v) => v.startsWith('http') ? v : `https://facebook.com/${v}` },
  tiktok: { icon: '🎵', href: (v) => `https://tiktok.com/@${v.replace('@', '')}` },
  line: { icon: '💬', href: (v) => `https://line.me/ti/p/${v}` },
  telegram: { icon: '✈️', href: (v) => `https://t.me/${v.replace('@', '')}` },
  other: { icon: '📎', href: (v) => v },
};

export default async function ContactPage() {
  const methods = await getContactMethods();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10 lg:py-24">
      <div className="mb-12 text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">● Contact</div>
        <h1 className="mb-4 text-5xl font-black text-ink lg:text-6xl">Get in touch.</h1>
        <p className="text-lg text-neutral-600">
          Walk in, call, or WhatsApp us. We reply fastest on WhatsApp.
        </p>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        {methods.map((m: any, i: number) => {
          const meta = TYPE_META[m.type] ?? TYPE_META.other;
          return (
            <a
              key={i}
              href={meta.href(m.value)}
              target={m.type !== 'phone' && m.type !== 'email' ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="group flex gap-4 rounded-lg border-2 border-ink bg-white p-6 shadow-brand transition-all hover:shadow-brand-lg"
            >
              <div className="text-3xl">{meta.icon}</div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-pink">{m.type}</div>
                <div className="text-lg font-black text-ink group-hover:text-pink">{m.label ?? m.value}</div>
                {m.note && <div className="mt-1 text-xs text-neutral-500">{m.note}</div>}
              </div>
            </a>
          );
        })}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-pink">📍 Visit Us</div>
        <div className="mb-1 text-xl font-black text-ink">60 Paya Lebar Road #B1-35</div>
        <div className="mb-4 text-sm text-neutral-600">Paya Lebar Square, Singapore 409051</div>
        <div className="text-xs text-neutral-500">Mon–Sat · 10am–7.30pm · Closed Sunday</div>
      </div>
    </div>
  );
}
