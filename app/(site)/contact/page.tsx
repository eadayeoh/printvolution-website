import { getContactMethods } from '@/lib/data/page_content';
import { ContactForm } from '@/components/contact/contact-form';

export const metadata = {
  title: 'Contact Us',
  description: 'WhatsApp, phone, or visit our store at Paya Lebar Square. Same-day express available.',
  alternates: { canonical: 'https://printvolution.sg/contact' },
};

const SOCIAL_META: Record<string, { icon: string; href: (v: string) => string; name: string }> = {
  instagram: { icon: 'IG', href: (v) => `https://instagram.com/${v.replace('@', '')}`, name: 'Instagram' },
  facebook: { icon: 'FB', href: (v) => (v.startsWith('http') ? v : `https://facebook.com/${v}`), name: 'Facebook' },
  tiktok: { icon: 'TT', href: (v) => `https://tiktok.com/@${v.replace('@', '')}`, name: 'TikTok' },
  telegram: { icon: 'TG', href: (v) => `https://t.me/${v.replace('@', '')}`, name: 'Telegram' },
  line: { icon: 'LN', href: (v) => `https://line.me/ti/p/${v}`, name: 'LINE' },
};

export default async function ContactPage() {
  const methods = await getContactMethods();
  const whatsapp = methods.find((m) => m.type === 'whatsapp');
  const landline = methods.find((m) => m.type === 'phone');
  const email = methods.find((m) => m.type === 'email');
  const socials = methods.filter((m) => SOCIAL_META[m.type]);

  return (
    <div className="screen active" id="screen-contact">
      {/* HERO — dark */}
      <section style={{ background: '#0D0D0D', color: '#fff', padding: '80px 28px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 40%, rgba(233,30,140,.12), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', border: '1.5px solid #E91E8C', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 20 }}>
            Get in touch
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 700, lineHeight: 1.05, margin: 0, color: '#fff', letterSpacing: '-0.01em' }}>
            Let&rsquo;s make<br /><em style={{ color: '#E91E8C' }}>something great.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', marginTop: 18, maxWidth: 640, marginInline: 'auto', lineHeight: 1.7 }}>
            Walk in, WhatsApp, or drop us a message. We respond fast and we never ghost a quote request.
          </p>
        </div>
      </section>

      {/* MAP */}
      <div style={{ width: '100%', height: 320, position: 'relative' }}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.7763!2d103.8919!3d1.3174!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19a0a6555555%3A0x1!2sPaya+Lebar+Square%2C+60+Paya+Lebar+Rd%2C+Singapore+409051!5e0!3m2!1sen!2ssg!4v1"
          width="100%"
          height="320"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* INFO CARDS (CMYK-shadowed) on dotted bg */}
      <section
        style={{
          background: '#fafaf7',
          backgroundImage: 'radial-gradient(circle, #e8e4dc 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
          padding: '56px 28px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* WALK IN */}
            <div style={{ background: '#fff', border: '2px solid #0a0a0a', padding: '28px 28px 24px', boxShadow: '6px 6px 0 #E91E8C', position: 'relative' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 14 }}>
                Walk In
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, lineHeight: 1.1, color: '#0a0a0a', marginBottom: 14 }}>
                Paya Lebar Square<br />B1-35
              </div>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: '0 0 14px' }}>
                60 Paya Lebar Road, Singapore 409051 &middot; 2 min walk from Paya Lebar MRT
              </p>
              <a
                href="https://maps.google.com/?q=Paya+Lebar+Square+Singapore"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#E91E8C', textDecoration: 'none' }}
              >
                Get directions ↗
              </a>
            </div>

            {/* OPENING HOURS */}
            <div style={{ background: '#fff', border: '2px solid #0a0a0a', padding: '28px', boxShadow: '6px 6px 0 #00B8D9' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#00B8D9', marginBottom: 14 }}>
                Opening Hours
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, lineHeight: 1.1, color: '#0a0a0a', marginBottom: 14 }}>
                Mon – Sat<br />10am – 7.30pm
              </div>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0 }}>
                Closed Sundays &amp; Singapore public holidays
              </p>
            </div>

            {/* DIRECT LINE */}
            <div style={{ background: '#fff', border: '2px solid #0a0a0a', padding: '28px', boxShadow: '6px 6px 0 #FFD100' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#e6b800', marginBottom: 14 }}>
                Direct Line
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, lineHeight: 1.1, color: '#0a0a0a', marginBottom: 14 }}>
                {whatsapp?.value ?? '+65 8553 3497'}
              </div>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0 }}>
                Call or WhatsApp &middot; Same-day express available
              </p>
              {landline && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#666' }}>
                  <span style={{ fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 }}>Landline</span>
                  <a href={`tel:${landline.value.replace(/\s/g, '')}`} style={{ color: '#0a0a0a', fontWeight: 700, textDecoration: 'none' }}>
                    {landline.value}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Socials row */}
          {(socials.length > 0 || email) && (
            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
              {email && (
                <a
                  href={`mailto:${email.value}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px', background: '#fff', border: '1.5px solid #0a0a0a',
                    borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#0a0a0a',
                    textDecoration: 'none',
                  }}
                >
                  ✉️ {email.value}
                </a>
              )}
              {socials.map((s, i) => {
                const meta = SOCIAL_META[s.type];
                if (!meta) return null;
                return (
                  <a
                    key={i}
                    href={meta.href(s.value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 16px', background: '#fff', border: '1.5px solid #0a0a0a',
                      borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#0a0a0a',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>{meta.icon}</span>
                    {s.label ?? meta.name}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* WHATSAPP HERO */}
      <section
        style={{
          background: '#fafaf7',
          backgroundImage: 'radial-gradient(circle, #e8e4dc 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
          padding: '0 28px 64px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              background: '#0D0D0D', color: '#fff',
              padding: '64px 32px', textAlign: 'center',
              border: '2px solid #0a0a0a',
              boxShadow: '8px 8px 0 #22c55e',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(34,197,94,.12), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#22c55e', marginBottom: 14 }}>
                ● Fastest way to reach us ●
              </div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px,4.5vw,60px)', fontWeight: 700, lineHeight: 1.05, margin: '0 0 18px', color: '#fff', letterSpacing: '-0.01em' }}>
                Prefer WhatsApp? <em style={{ color: '#FFD100', fontStyle: 'italic' }}>Same.</em>
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', maxWidth: 640, margin: '0 auto 28px', lineHeight: 1.75 }}>
                Send us your files, describe what you need, or just ask a question. Most WhatsApp
                messages get a reply within one business hour during opening hours — faster than email, faster than calling.
              </p>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.value.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '14px 28px', background: '#22c55e', color: '#fff',
                    fontSize: 14, fontWeight: 800, letterSpacing: 0.3,
                    textDecoration: 'none', border: '2px solid #fff',
                    borderRadius: 999,
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#fff',
                    color: '#22c55e', display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14,
                  }}>💬</span>
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FORM on dotted bg */}
      <section
        style={{
          background: '#fafaf7',
          backgroundImage: 'radial-gradient(circle, #e8e4dc 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
          padding: '0 28px 96px',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.05, margin: '0 0 6px', color: '#0a0a0a', letterSpacing: '-0.01em' }}>
              Send us a<br /><em style={{ color: '#E91E8C' }}>message.</em>
            </h2>
          </div>

          <div
            style={{
              background: '#fff',
              border: '2px solid #0a0a0a',
              padding: 40,
              boxShadow: '8px 8px 0 #E91E8C',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px dashed #e5e5e5' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#E91E8C' }}>
                ✉️ Send us a message
              </span>
            </div>
            <ContactForm whatsappNumber={whatsapp?.value ?? '+65 8553 3497'} />
          </div>
        </div>
      </section>
    </div>
  );
}
