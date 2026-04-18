'use client';

import { useState } from 'react';

export function ContactForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [sent, setSent] = useState(false);

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const name = (form.get('name') || '').toString();
    const phone = (form.get('phone') || '').toString();
    const email = (form.get('email') || '').toString();
    const enquiry = (form.get('enquiry') || '').toString();
    const message = (form.get('message') || '').toString();
    if (!name || !email || !message) return;

    const waNumber = whatsappNumber.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hi Printvolution,\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\nType: ${enquiry}\n\n${message}`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
    setSent(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSent(false), 6000);
  }

  return (
    <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {sent && (
        <div style={{
          padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0',
          color: '#15803d', fontSize: 13, fontWeight: 700, borderRadius: 6, textAlign: 'center',
        }}>
          ✓ Opening WhatsApp with your message pre-filled.
        </div>
      )}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Field label="Name *">
          <input name="name" required autoComplete="name" className="pv-checkout-input" placeholder="Your name" />
        </Field>
        <Field label="Phone">
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" className="pv-checkout-input" placeholder="+65 XXXX XXXX" />
        </Field>
      </div>

      <Field label="Email *">
        <input name="email" type="email" inputMode="email" autoComplete="email" required className="pv-checkout-input" placeholder="you@email.com" />
      </Field>

      <Field label="Enquiry Type">
        <select name="enquiry" className="pv-checkout-input" defaultValue="General Enquiry">
          <option>General Enquiry</option>
          <option>Request a Quote</option>
          <option>Corporate Account</option>
          <option>Order Follow-up</option>
        </select>
      </Field>

      <Field label="Message *">
        <textarea
          name="message"
          required
          rows={5}
          className="pv-checkout-input"
          placeholder="Tell us what you need — product, quantity, timeline..."
        />
      </Field>

      <button
        type="submit"
        style={{
          marginTop: 8, padding: '16px 24px', borderRadius: 999,
          background: '#E91E8C', color: '#fff', fontSize: 13, fontWeight: 800,
          letterSpacing: 0.5, textTransform: 'uppercase', border: 'none',
          cursor: 'pointer', fontFamily: 'var(--sans)',
          boxShadow: '4px 4px 0 #0a0a0a',
          transition: 'transform .1s',
        }}
      >
        Send Message →
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{
        display: 'block', fontSize: 10, fontWeight: 800,
        letterSpacing: 1.5, textTransform: 'uppercase',
        color: '#0a0a0a', marginBottom: 8,
      }}>
        {label}
      </span>
      {children}
    </label>
  );
}
