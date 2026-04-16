'use client';

import { useState } from 'react';

export function ContactForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [sent, setSent] = useState(false);

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    // Build a WhatsApp message from the form contents
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
    <form onSubmit={submitForm}>
      {sent && (
        <div id="ct-ok" style={{ display: 'block' }}>
          ✓ Opening WhatsApp with your message pre-filled.
        </div>
      )}
      <div className="ct-field-group">
        <div className="ct-field-row">
          <div className="ct-field">
            <label className="ct-label">Name *</label>
            <input name="name" required className="ct-input" placeholder="Your name" />
          </div>
          <div className="ct-field">
            <label className="ct-label">Phone</label>
            <input name="phone" className="ct-input" placeholder="+65 XXXX XXXX" />
          </div>
        </div>
        <div className="ct-field">
          <label className="ct-label">Email *</label>
          <input name="email" type="email" required className="ct-input" placeholder="you@email.com" />
        </div>
        <div className="ct-field">
          <label className="ct-label">Enquiry Type</label>
          <select name="enquiry" className="ct-input" defaultValue="General Enquiry">
            <option>General Enquiry</option>
            <option>Request a Quote</option>
            <option>Corporate Account</option>
            <option>Order Follow-up</option>
          </select>
        </div>
        <div className="ct-field">
          <label className="ct-label">Message *</label>
          <textarea name="message" required className="ct-textarea" placeholder="Tell us what you need — product, quantity, timeline..." />
        </div>
        <button type="submit" className="ct-submit">Send Message →</button>
      </div>
    </form>
  );
}
