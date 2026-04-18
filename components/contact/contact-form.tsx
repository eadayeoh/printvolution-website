'use client';

import { useState } from 'react';

type Props = {
  whatsappNumber: string;
  enquiryTabs?: string[];
};

const DEFAULT_TABS = ['General', 'Quote Request', 'Corporate Account', 'File Check', 'Existing Order'];

export function ContactForm({ whatsappNumber, enquiryTabs }: Props) {
  const tabs = enquiryTabs && enquiryTabs.length > 0 ? enquiryTabs : DEFAULT_TABS;
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [sent, setSent] = useState(false);

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const name = (form.get('name') || '').toString();
    const company = (form.get('company') || '').toString();
    const email = (form.get('email') || '').toString();
    const phone = (form.get('phone') || '').toString();
    const product = (form.get('product') || '').toString();
    const quantity = (form.get('quantity') || '').toString();
    const message = (form.get('message') || '').toString();
    if (!name || !email || !message) return;

    const waNumber = whatsappNumber.replace(/\D/g, '');
    const lines = [
      `Hi Printvolution,`,
      ``,
      `Name: ${name}`,
      company ? `Company: ${company}` : '',
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : '',
      `Type: ${activeTab}`,
      product ? `Product: ${product}` : '',
      quantity ? `Quantity: ${quantity}` : '',
      ``,
      message,
    ].filter(Boolean);
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
    setSent(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSent(false), 6000);
  }

  return (
    <>
      {/* Enquiry tabs */}
      {tabs.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 26 }}>
          {tabs.map((t) => {
            const active = t === activeTab;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                style={{
                  padding: '8px 14px',
                  border: '2px solid var(--pv-ink)',
                  background: active ? 'var(--pv-ink)' : '#fff',
                  color: active ? '#fff' : 'var(--pv-ink)',
                  fontFamily: 'var(--pv-f-body)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  letterSpacing: '0.02em',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={submitForm}>
        {sent && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--pv-green)',
              color: 'var(--pv-ink)',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 18,
              border: '2px solid var(--pv-ink)',
            }}
          >
            ✓ Opening WhatsApp with your message pre-filled.
          </div>
        )}

        <FormRow>
          <Field label="Your Name" required>
            <input name="name" required autoComplete="name" placeholder="Jane Tan" style={INPUT_STYLE} />
          </Field>
          <Field label="Company" optional>
            <input name="company" autoComplete="organization" placeholder="ABC Pte Ltd" style={INPUT_STYLE} />
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Email" required>
            <input name="email" type="email" inputMode="email" autoComplete="email" required placeholder="jane@company.sg" style={INPUT_STYLE} />
          </Field>
          <Field label="Phone" optional>
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+65 9123 4567" style={INPUT_STYLE} />
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Product Interest">
            <select name="product" defaultValue="" style={INPUT_STYLE}>
              <option value="">Select a product…</option>
              <option>Name Cards</option>
              <option>Posters</option>
              <option>Stickers</option>
              <option>Booklets</option>
              <option>Flyers &amp; Leaflets</option>
              <option>Notebooks</option>
              <option>Personalised Gifts</option>
              <option>Other / Not sure</option>
            </select>
          </Field>
          <Field label="Quantity Estimate">
            <select name="quantity" defaultValue="" style={INPUT_STYLE}>
              <option value="">Select quantity…</option>
              <option>Under 100</option>
              <option>100 – 500</option>
              <option>500 – 1,000</option>
              <option>1,000 – 5,000</option>
              <option>5,000+</option>
            </select>
          </Field>
        </FormRow>

        <Field label="Your Message" required full>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="Tell us what you need — sizes, finishes, deadlines, references. The more detail, the faster we can quote."
            style={{ ...INPUT_STYLE, minHeight: 120, resize: 'vertical', fontFamily: 'var(--pv-f-body)' }}
          />
        </Field>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 24,
            paddingTop: 20,
            borderTop: '2px dashed var(--pv-rule)',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-muted)', letterSpacing: '0.04em' }}>
            Reply within 2 working hours · Open daily (except PH)
          </div>
          <button type="submit" className="pv-btn pv-btn-primary" style={{ padding: '14px 24px', fontSize: 13 }}>
            Send Message →
          </button>
        </div>
      </form>
    </>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  background: '#fff',
  border: '2px solid var(--pv-ink)',
  padding: '12px 14px',
  fontFamily: 'var(--pv-f-body)',
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--pv-ink)',
  width: '100%',
  outline: 'none',
  transition: 'background 0.12s',
};

function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="pv-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      {children}
      <style>{`
        @media (max-width: 640px) {
          .pv-form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...(full ? { marginBottom: 14 } : {}) }}>
      <label
        style={{
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 11,
          color: 'var(--pv-ink)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}{' '}
        {required && <span style={{ color: 'var(--pv-magenta)' }}>*</span>}
        {optional && (
          <span style={{ color: 'var(--pv-muted)', fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
