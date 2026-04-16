import { getContactMethods } from '@/lib/data/page_content';
import { ContactForm } from '@/components/contact/contact-form';

export const metadata = {
  title: 'Contact Us',
  description: 'WhatsApp, phone, or visit our store at Paya Lebar Square.',
  alternates: { canonical: 'https://printvolution.sg/contact' },
};

export default async function ContactPage() {
  const methods = await getContactMethods();
  const whatsapp = methods.find((m) => m.type === 'whatsapp');
  const phone = methods.find((m) => m.type === 'phone');

  return (
    <div className="screen active" id="screen-contact">
      {/* Hero full-width */}
      <div className="ct-hero">
        <div className="ct-hero-grid" />
        <div className="ct-hero-eyebrow">Get in touch</div>
        <h1 className="ct-hero-h1">Let&rsquo;s make<br /><em>something great.</em></h1>
        <p className="ct-hero-sub">Walk in, WhatsApp, or drop us a message. We respond fast and we never ghost a quote request.</p>
      </div>

      {/* Full-width map strip */}
      <div style={{ width: '100%', height: 340, position: 'relative' }}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.7763!2d103.8919!3d1.3174!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19a0a6555555%3A0x1!2sPaya+Lebar+Square%2C+60+Paya+Lebar+Rd%2C+Singapore+409051!5e0!3m2!1sen!2ssg!4v1"
          width="100%"
          height="340"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          href="https://maps.google.com/?q=Paya+Lebar+Square+Singapore"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute', bottom: 16, left: 16,
            background: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 700,
            color: '#E91E8C', textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,.15)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          📍 Open in Google Maps ↗
        </a>
      </div>

      <div className="ct-body">
        {/* Left info panel */}
        <div className="ct-info-panel">
          <div className="ct-info-block">
            <div className="ct-info-tag">Find Us</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 22, marginTop: 2 }}>📍</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>Paya Lebar Square</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                  #B1-35, 60 Paya Lebar Road<br />Singapore 409051
                </div>
                <a
                  href="https://maps.google.com/?q=Paya+Lebar+Square+Singapore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ct-map-link"
                  style={{ marginTop: 8, display: 'inline-flex' }}
                >
                  Open in Google Maps ↗
                </a>
              </div>
            </div>
          </div>

          <div className="ct-info-block">
            <div className="ct-info-tag">Opening Hours</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 22, marginTop: 2 }}>🕐</span>
              <div style={{ width: '100%' }}>
                <div className="ct-hours-row"><span className="ct-hours-day">Mon – Sat</span><span className="ct-hours-time">10:00am – 7:30pm</span></div>
                <div className="ct-hours-row"><span className="ct-hours-day">Sunday</span><span className="ct-hours-closed">Closed</span></div>
                <div className="ct-hours-row"><span className="ct-hours-day">Public Holidays</span><span className="ct-hours-closed">Closed</span></div>
              </div>
            </div>
          </div>

          <div className="ct-info-block">
            <div className="ct-info-tag">Contact</div>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.value.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  textDecoration: 'none', padding: '14px 16px',
                  border: '1px solid #e5e5e5', marginBottom: 10,
                  transition: 'border-color .15s',
                }}
              >
                <span style={{ fontSize: 22 }}>💬</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{whatsapp.value}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>WhatsApp — fastest response</div>
                </div>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone.value.replace(/\s/g, '')}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  textDecoration: 'none', padding: '14px 16px',
                  border: '1px solid #e5e5e5',
                  transition: 'border-color .15s',
                }}
              >
                <span style={{ fontSize: 22 }}>📞</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{phone.value}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Landline</div>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Right form */}
        <div className="ct-form-wrap">
          <div className="ct-form-title">Send us a<br /><em>message.</em></div>
          <p className="ct-form-sub">Quote requests, corporate accounts, order follow-ups — anything works.</p>
          <ContactForm whatsappNumber={whatsapp?.value ?? '+65 8553 3497'} />
        </div>
      </div>
    </div>
  );
}
