'use client';

import { useMemo, useState } from 'react';
import { Turnstile } from '@/components/common/turnstile';

type Props = {
  whatsappNumber: string;
  enquiryTabs?: string[];
};

const DEFAULT_TABS = ['General', 'Quote Request', 'Corporate Account', 'File Check', 'Existing Order'];

// Each tab gets its own field set so the form actually reflects what
// the customer is asking for. All tabs share the identity block
// (name + email) and the free-text message at the bottom; the middle
// rows swap per tab.

type FieldKey =
  | 'company'
  | 'company_reg'
  | 'phone'
  | 'product'
  | 'quantity'
  | 'deadline'
  | 'order_number'
  | 'file_reference'
  | 'monthly_volume';

type TabSpec = {
  fields: FieldKey[];
  submitLabel: string;
  messagePlaceholder: string;
  intro?: string;
};

const TAB_SPECS: Record<string, TabSpec> = {
  General: {
    fields: ['company', 'phone', 'product', 'quantity'],
    submitLabel: 'Send Message →',
    messagePlaceholder:
      'Tell us what you need — sizes, finishes, deadlines, references. The more detail, the faster we can quote.',
  },
  'Quote Request': {
    fields: ['company', 'phone', 'product', 'quantity', 'deadline'],
    submitLabel: 'Send Quote Request →',
    messagePlaceholder:
      'Artwork specs, finishings, paper stock, delivery address. Attach references if any — we\'ll reply with a quote within 2 working hours.',
    intro: 'We\'ll return a written quote within 2 working hours. Product + quantity + deadline speed this up most.',
  },
  'Corporate Account': {
    fields: ['company', 'company_reg', 'phone', 'monthly_volume'],
    submitLabel: 'Request Corporate Account →',
    messagePlaceholder:
      'Tell us about your company — what you typically print, who handles POs, monthly volume expectations, whether you need GST invoicing and consolidated monthly billing.',
    intro: 'Volume pricing, dedicated account manager, monthly invoicing and PO workflow. 400+ SG businesses already set up.',
  },
  'File Check': {
    fields: ['product', 'file_reference'],
    submitLabel: 'Send File for Preflight →',
    messagePlaceholder:
      'Paste the WeTransfer / Drive / Dropbox link to your file(s). Our preflight team will check CMYK, bleed, 300dpi, font embedding, overprint — and flag any issues before you commit to a run. Free, no obligation.',
    intro: 'Free preflight, no obligation. Send a WeTransfer/Drive link in the message and we\'ll reply with any issues found.',
  },
  'Existing Order': {
    fields: ['order_number', 'phone'],
    submitLabel: 'Send Order Query →',
    messagePlaceholder:
      'Let us know what the question is — production status, a correction on the file, changed delivery details, collection timing.',
    intro: 'Order number speeds the lookup. If you don\'t have it, your name + the rough order date works too.',
  },
};

function specFor(tab: string): TabSpec {
  return TAB_SPECS[tab] ?? TAB_SPECS.General;
}

export function ContactForm({ whatsappNumber, enquiryTabs }: Props) {
  const tabs = enquiryTabs && enquiryTabs.length > 0 ? enquiryTabs : DEFAULT_TABS;
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const spec = useMemo(() => specFor(activeTab), [activeTab]);
  const has = (f: FieldKey) => spec.fields.includes(f);

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setCaptchaError(null);
    const form = new FormData(e.target as HTMLFormElement);
    const get = (k: string) => (form.get(k) || '').toString().trim();

    const name = get('name');
    const email = get('email');
    const message = get('message');
    if (!name || !email || !message) return;

    if (!captchaToken) {
      setCaptchaError('Please complete the captcha.');
      return;
    }
    setSubmitting(true);
    try {
      const verify = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      });
      if (!verify.ok) {
        const data = (await verify.json().catch(() => ({}))) as { error?: string };
        setCaptchaError(data.error ?? 'Captcha failed — please retry.');
        setSubmitting(false);
        return;
      }
    } catch {
      setCaptchaError('Could not reach captcha server — please retry.');
      setSubmitting(false);
      return;
    }

    const rawRows: Array<[string, string]> = [
      ['Name',          name],
      ['Email',         email],
      ['Type',          activeTab],
      ['Company',       has('company')        ? get('company')        : ''],
      ['UEN / Co. Reg', has('company_reg')    ? get('company_reg')    : ''],
      ['Phone',         has('phone')          ? get('phone')          : ''],
      ['Product',       has('product')        ? get('product')        : ''],
      ['Quantity',      has('quantity')       ? get('quantity')       : ''],
      ['Deadline',      has('deadline')       ? get('deadline')       : ''],
      ['Monthly vol.',  has('monthly_volume') ? get('monthly_volume') : ''],
      ['Order #',       has('order_number')   ? get('order_number')   : ''],
      ['File link',     has('file_reference') ? get('file_reference') : ''],
    ];
    const rows = rawRows.filter((r) => r[1]);

    const waNumber = whatsappNumber.replace(/\D/g, '');
    const body = [
      `Hi Printvolution,`,
      ``,
      ...rows.map(([k, v]) => `${k}: ${v}`),
      ``,
      message,
    ];
    const text = encodeURIComponent(body.join('\n'));
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
    setSent(true);
    (e.target as HTMLFormElement).reset();
    setCaptchaToken(null);
    setSubmitting(false);
    setTimeout(() => setSent(false), 6000);
  }

  return (
    <>
      {/* Enquiry tabs */}
      {tabs.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
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

      {spec.intro && (
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--pv-yellow)',
            border: '2px solid var(--pv-ink)',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 22,
            letterSpacing: '0.01em',
            lineHeight: 1.45,
          }}
        >
          {spec.intro}
        </div>
      )}

      <form onSubmit={submitForm} key={activeTab /* reset on tab change */}>
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

        {/* Identity block — on every tab */}
        <FormRow>
          <Field label="Your Name" required>
            <input name="name" required autoComplete="name" placeholder="Jane Tan" style={INPUT_STYLE} />
          </Field>
          <Field label="Email" required>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="jane@company.sg"
              style={INPUT_STYLE}
            />
          </Field>
        </FormRow>

        {/* Company + phone / reg / monthly volume — varies by tab */}
        {(has('company') || has('company_reg') || has('phone') || has('monthly_volume')) && (
          <FormRow>
            {has('company') && (
              <Field label="Company" optional>
                <input name="company" autoComplete="organization" placeholder="ABC Pte Ltd" style={INPUT_STYLE} />
              </Field>
            )}
            {has('company_reg') && (
              <Field label="UEN / Company Reg" optional>
                <input name="company_reg" placeholder="201812345K" style={INPUT_STYLE} />
              </Field>
            )}
            {has('phone') && (
              <Field label="Phone" optional>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+65 9123 4567"
                  style={INPUT_STYLE}
                />
              </Field>
            )}
            {has('monthly_volume') && (
              <Field label="Monthly Volume">
                <select name="monthly_volume" defaultValue="" style={INPUT_STYLE}>
                  <option value="">Select typical spend…</option>
                  <option>Under S$500</option>
                  <option>S$500 – S$2,000</option>
                  <option>S$2,000 – S$5,000</option>
                  <option>S$5,000 – S$20,000</option>
                  <option>S$20,000+</option>
                </select>
              </Field>
            )}
          </FormRow>
        )}

        {/* Product + Quantity — Quote Request, General */}
        {(has('product') || has('quantity')) && (
          <FormRow>
            {has('product') && (
              <Field label={activeTab === 'Quote Request' ? 'Product' : 'Product Interest'} required={activeTab === 'Quote Request'}>
                <select name="product" defaultValue="" required={activeTab === 'Quote Request'} style={INPUT_STYLE}>
                  <option value="">Select a product…</option>
                  <option>Name Cards</option>
                  <option>Luxury Business Cards</option>
                  <option>Transparent Cards</option>
                  <option>PVC / Loyalty Cards</option>
                  <option>NFC Cards</option>
                  <option>Posters</option>
                  <option>Stickers</option>
                  <option>Booklets</option>
                  <option>Flyers &amp; Leaflets</option>
                  <option>Notebooks</option>
                  <option>Personalised Gifts</option>
                  <option>Other / Not sure</option>
                </select>
              </Field>
            )}
            {has('quantity') && (
              <Field label="Quantity Estimate" required={activeTab === 'Quote Request'}>
                <select name="quantity" defaultValue="" required={activeTab === 'Quote Request'} style={INPUT_STYLE}>
                  <option value="">Select quantity…</option>
                  <option>Under 100</option>
                  <option>100 – 500</option>
                  <option>500 – 1,000</option>
                  <option>1,000 – 5,000</option>
                  <option>5,000+</option>
                </select>
              </Field>
            )}
          </FormRow>
        )}

        {/* Deadline — Quote Request */}
        {has('deadline') && (
          <Field label="Deadline" full>
            <input
              name="deadline"
              type="date"
              style={INPUT_STYLE}
            />
          </Field>
        )}

        {/* Order # — Existing Order */}
        {has('order_number') && (
          <Field label="Order Number" full>
            <input
              name="order_number"
              placeholder="e.g. PV-2026-04-1234"
              style={INPUT_STYLE}
            />
          </Field>
        )}

        {/* File link — File Check */}
        {has('file_reference') && (
          <Field label="File Link (WeTransfer / Drive / Dropbox)" full>
            <input
              name="file_reference"
              type="url"
              placeholder="https://we.tl/... or https://drive.google.com/..."
              style={INPUT_STYLE}
            />
          </Field>
        )}

        <Field label="Your Message" required full>
          <textarea
            name="message"
            required
            rows={5}
            placeholder={spec.messagePlaceholder}
            style={{ ...INPUT_STYLE, minHeight: 120, resize: 'vertical', fontFamily: 'var(--pv-f-body)' }}
          />
        </Field>

        <div style={{ marginTop: 22, marginBottom: 4 }}>
          <Turnstile
            onVerify={(token) => { setCaptchaToken(token); setCaptchaError(null); }}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaError('Captcha failed to load — please refresh.')}
          />
          {captchaError && (
            <div
              style={{
                marginTop: 8,
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 12,
                color: 'var(--pv-magenta)',
                fontWeight: 700,
              }}
            >
              ✗ {captchaError}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 18,
            paddingTop: 20,
            borderTop: '2px dashed var(--pv-rule)',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-muted)', letterSpacing: '0.04em' }}>
            Reply within 2 working hours · Mon–Fri 10–7:30 · Sat–Sun 10–7 · Closed on PH
          </div>
          <button
            type="submit"
            className="pv-btn pv-btn-primary"
            disabled={submitting || !captchaToken}
            style={{ padding: '14px 24px', fontSize: 13, opacity: submitting || !captchaToken ? 0.5 : 1 }}
          >
            {submitting ? 'Verifying…' : spec.submitLabel}
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
    <label style={{ display: 'flex', flexDirection: 'column', ...(full ? { marginBottom: 14 } : {}) }}>
      <span
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
      </span>
      {children}
    </label>
  );
}
