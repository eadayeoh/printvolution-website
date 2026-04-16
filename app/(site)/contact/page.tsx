import { getContactMethods } from '@/lib/data/page_content';

export const metadata = {
  title: 'Contact Us',
  description: 'WhatsApp, phone, or visit our store at Paya Lebar Square.',
  alternates: { canonical: 'https://printvolution.sg/contact' },
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
    <div className="screen active" id="screen-contact">
      {/* Hero */}
      <div className="ab-hero">
        <div className="ab-hero-inner" style={{ gridTemplateColumns: '1fr', maxWidth: 900 }}>
          <div className="ab-hero-text">
            <div className="hs-tag" style={{ color: '#E91E8C' }}>Contact</div>
            <h1 className="ab-h1">Get in touch.<br /><em>We pick up.</em></h1>
            <p className="ab-sub" style={{ color: 'rgba(255,255,255,.7)' }}>
              WhatsApp is fastest — usually a reply within 30 minutes during opening hours.
            </p>
          </div>
        </div>
      </div>

      {/* Methods grid */}
      <div className="ab-section">
        <div className="ab-section-in">
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {methods.map((m, i) => {
              const meta = TYPE_META[m.type] ?? TYPE_META.other;
              return (
                <a
                  key={i}
                  href={meta.href(m.value)}
                  target={m.type !== 'phone' && m.type !== 'email' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', gap: 16, padding: 24,
                    background: '#fff', border: '2px solid #0a0a0a',
                    textDecoration: 'none', color: 'inherit',
                    transition: 'all .2s', boxShadow: '4px 4px 0 #E91E8C',
                  }}
                >
                  <div style={{ fontSize: 36 }}>{meta.icon}</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 4 }}>
                      {m.type}
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: '#0a0a0a' }}>
                      {m.label ?? m.value}
                    </div>
                    {m.note && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{m.note}</div>}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visit */}
      <div className="ab-section" style={{ background: '#f8f8f8' }}>
        <div className="ab-section-in">
          <div style={{ background: '#fff', padding: 40, border: '1px solid #eee', textAlign: 'center' }}>
            <div className="hs-tag" style={{ marginBottom: 12 }}>📍 Visit Us</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>
              60 Paya Lebar Road #B1-35
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>Paya Lebar Square, Singapore 409051</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Mon–Sat · 10am–7.30pm · Closed Sunday</div>
            <a
              href="https://maps.google.com/?q=60+Paya+Lebar+Road+B1-35"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
