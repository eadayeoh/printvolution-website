import 'server-only';
import { Resend } from 'resend';
import { formatSGD } from '@/lib/utils';
import { BRAND, SITE } from '@/lib/brand';

/**
 * Thin wrapper around Resend.
 *
 * Configuration via env:
 *   RESEND_API_KEY          API key from https://resend.com/api-keys
 *   EMAIL_FROM              "Printvolution <orders@printvolution.sg>"
 *   ADMIN_NOTIFICATION_EMAIL  where new-order alerts go
 *
 * If RESEND_API_KEY is missing the helper logs and no-ops — checkout
 * will not fail. This lets the app run locally without email setup.
 */

const FROM = process.env.EMAIL_FROM || 'Printvolution <orders@printvolution.sg>';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || '';

let _client: Resend | null = null;
function client() {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _client = new Resend(key);
  return _client;
}

type SendInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

export async function sendEmail(input: SendInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const c = client();
  if (!c) {
    console.log('[email] RESEND_API_KEY not set — would have sent:', input.subject, '→', input.to);
    return { ok: false, error: 'Email service not configured' };
  }
  try {
    const { data, error } = await c.emails.send({
      from: FROM,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      cc: input.cc as any,
      bcc: input.bcc as any,
    });
    if (error) {
      // Log tag + code only — provider error bodies can contain the
      // recipient email address or raw SMTP replies.
      console.error('[email] send failed', (error as any)?.statusCode ?? 'unknown');
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (e: any) {
    console.error('[email] threw');
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}

export function adminEmail(): string | null {
  return ADMIN_EMAIL || null;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const BRAND_PINK = BRAND.pink;
const BRAND_INK = BRAND.ink;

function shell(title: string, body: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#FAF7F0;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans',Helvetica,Arial,sans-serif;color:${BRAND_INK};line-height:1.5;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF7F0;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;border:2px solid ${BRAND_INK};">
      <tr>
        <td style="background:${BRAND_INK};padding:18px 24px;color:#fff;font-weight:900;font-size:22px;letter-spacing:-0.02em;">
          Print<span style="color:${BRAND_PINK}">volution</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 24px;">
          ${body}
        </td>
      </tr>
      <tr>
        <td style="background:#fafaf7;padding:14px 24px;font-size:11px;color:#888;text-align:center;border-top:1px solid #eee;">
          ${SITE.legalName} · ${SITE.address}<br>
          <a href="https://wa.me/${SITE.whatsappE164}" style="color:${BRAND_PINK};text-decoration:none">WhatsApp ${SITE.whatsappDisplay}</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}


export type OrderEmailItem = {
  product_name: string;
  qty: number;
  line_total_cents: number;
  config?: Record<string, string> | null;
};

export type OrderEmailPayload = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  delivery_method: 'pickup' | 'delivery';
  delivery_address?: string | null;
  items: OrderEmailItem[];
  subtotal_cents: number;
  delivery_cents: number;
  total_cents: number;
};

function itemsTable(items: OrderEmailItem[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:16px 0;">
    ${items.map((it) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;">
          <div style="font-weight:700;color:${BRAND_INK};">${escapeHtml(it.product_name)}</div>
          ${it.config && Object.keys(it.config).length > 0
            ? `<div style="font-size:11px;color:#888;margin-top:2px;">${Object.entries(it.config).map(([k, v]) => `${escapeHtml(k)}: <strong style="color:#555">${escapeHtml(String(v))}</strong>`).join(' · ')}</div>`
            : ''}
          <div style="font-size:11px;color:#888;margin-top:2px;">Qty ${it.qty}</div>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;font-weight:700;color:${BRAND_PINK};white-space:nowrap;">
          ${formatSGD(it.line_total_cents)}
        </td>
      </tr>
    `).join('')}
  </table>`;
}

export function customerOrderConfirmationEmail(p: OrderEmailPayload): { subject: string; html: string } {
  const subject = `Order ${p.order_number} confirmed — Printvolution`;
  const body = `
    <h1 style="font-size:24px;font-weight:900;letter-spacing:-0.02em;margin:0 0 8px;color:${BRAND_INK};">
      Thanks ${escapeHtml(p.customer_name.split(' ')[0])} — your order is in.
    </h1>
    <p style="font-size:14px;color:#555;margin:0 0 16px;">
      Order <strong>${escapeHtml(p.order_number)}</strong> has been received. We're getting it ready.
    </p>

    <div style="background:#fafaf7;border-radius:10px;padding:16px;margin:18px 0;">
      ${itemsTable(p.items)}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="font-size:12px;color:#666;padding:4px 0;">Subtotal</td><td align="right" style="font-size:12px;color:#666;padding:4px 0;">${formatSGD(p.subtotal_cents)}</td></tr>
        <tr><td style="font-size:12px;color:#666;padding:4px 0;">${p.delivery_method === 'pickup' ? 'Pickup' : 'Delivery'}</td><td align="right" style="font-size:12px;color:#666;padding:4px 0;">${p.delivery_cents > 0 ? formatSGD(p.delivery_cents) : 'Free'}</td></tr>
        <tr><td style="font-size:15px;font-weight:900;color:${BRAND_INK};padding:8px 0 0;border-top:1px solid #ddd;">Total</td><td align="right" style="font-size:15px;font-weight:900;color:${BRAND_PINK};padding:8px 0 0;border-top:1px solid #ddd;">${formatSGD(p.total_cents)}</td></tr>
      </table>
    </div>

    <h2 style="font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND_PINK};margin:24px 0 8px;">What happens next</h2>
    <ol style="margin:0 0 16px;padding-left:20px;font-size:13px;color:#444;line-height:1.7;">
      <li>We pre-press your files and prep production (usually within 1 working day)</li>
      <li>${p.delivery_method === 'pickup'
        ? 'You\'ll get a WhatsApp message when your order is ready for pickup at Paya Lebar Square.'
        : 'We dispatch via island-wide delivery — usually 2-3 working days from confirmation.'}</li>
      <li>Need to change anything? Reply to this email or WhatsApp us at +65 8553 3497.</li>
    </ol>

    ${p.delivery_method === 'delivery' && p.delivery_address ? `
      <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:12px;margin:16px 0;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:4px;">Delivery to</div>
        <div style="font-size:13px;color:${BRAND_INK};white-space:pre-wrap;">${escapeHtml(p.delivery_address)}</div>
      </div>
    ` : ''}
  `;
  return { subject, html: shell(subject, body) };
}

export function adminNewOrderEmail(p: OrderEmailPayload): { subject: string; html: string } {
  const subject = `🔔 New order ${p.order_number} — ${formatSGD(p.total_cents)}`;
  const body = `
    <h1 style="font-size:20px;font-weight:900;margin:0 0 8px;color:${BRAND_INK};">New order: ${escapeHtml(p.order_number)}</h1>
    <p style="font-size:13px;color:#555;margin:0 0 4px;">
      <strong>${escapeHtml(p.customer_name)}</strong> · <a href="mailto:${escapeHtml(p.customer_email)}" style="color:${BRAND_PINK};">${escapeHtml(p.customer_email)}</a>
    </p>
    <p style="font-size:13px;color:#555;margin:0 0 16px;">
      ${p.delivery_method === 'pickup' ? '🏬 Pickup' : '🚚 Delivery'}
      ${p.delivery_method === 'delivery' && p.delivery_address ? `to ${escapeHtml(p.delivery_address.split('\n')[0])}` : ''}
    </p>

    <div style="background:#fafaf7;border-radius:10px;padding:16px;margin:18px 0;">
      ${itemsTable(p.items)}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="font-size:15px;font-weight:900;color:${BRAND_INK};padding:8px 0 0;">Total</td><td align="right" style="font-size:15px;font-weight:900;color:${BRAND_PINK};padding:8px 0 0;">${formatSGD(p.total_cents)}</td></tr>
      </table>
    </div>

    <a href="https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'printvolution.sg'}/admin/orders" style="display:inline-block;background:${BRAND_PINK};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:800;font-size:13px;letter-spacing:0.3px;">
      Open in admin →
    </a>
  `;
  return { subject, html: shell(subject, body) };
}

export function orderStatusEmail(orderNumber: string, customerName: string, status: string): { subject: string; html: string } {
  const titles: Record<string, string> = {
    processing: 'Your order is in production',
    ready: 'Your order is ready for pickup',
    completed: 'Your order is complete',
    cancelled: 'Your order has been cancelled',
  };
  const messages: Record<string, string> = {
    processing: 'We\'re running your job now. We\'ll let you know when it\'s ready.',
    ready: 'Pop into Paya Lebar Square (60 Paya Lebar Road, #B1-35) — or reply if you\'d prefer delivery.',
    completed: 'Thanks for ordering. If anything\'s off, reply within 7 days and we\'ll fix it.',
    cancelled: 'Your order has been cancelled. If this wasn\'t expected, reply and we\'ll sort it out.',
  };
  const title = titles[status] ?? `Order ${status}`;
  const message = messages[status] ?? '';
  const subject = `${title} — Order ${orderNumber}`;
  const body = `
    <h1 style="font-size:22px;font-weight:900;letter-spacing:-0.02em;margin:0 0 12px;color:${BRAND_INK};">
      ${escapeHtml(title)}
    </h1>
    <p style="font-size:14px;color:#555;margin:0 0 16px;">
      Hi ${escapeHtml(customerName.split(' ')[0])} — order <strong>${escapeHtml(orderNumber)}</strong>.
    </p>
    <p style="font-size:14px;color:#444;line-height:1.65;">${escapeHtml(message)}</p>
  `;
  return { subject, html: shell(subject, body) };
}

export function welcomeEmail(email: string, name: string | null): { subject: string; html: string } {
  const first = (name ?? '').trim().split(/\s+/)[0] || 'there';
  const subject = `Welcome to Printvolution, ${first}`;
  const body = `
    <h1 style="font-size:26px;font-weight:900;letter-spacing:-0.02em;margin:0 0 8px;color:${BRAND_INK};">
      Welcome, ${escapeHtml(first)}.
    </h1>
    <p style="font-size:14px;color:#555;margin:0 0 20px;line-height:1.6;">
      Your account is live. Here's what it does for you:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:${BRAND_INK};">
          <strong style="color:${BRAND_PINK};">Track every order</strong> — see status from production to delivery, no email-digging.
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:${BRAND_INK};">
          <strong style="color:${BRAND_PINK};">Reorder in 2 clicks</strong> — past jobs are saved with the same files + specs.
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-size:13px;color:${BRAND_INK};">
          <strong style="color:${BRAND_PINK};">Earn points on every order</strong> — building this now; your past orders count.
        </td>
      </tr>
    </table>
    <a href="https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'printvolution.sg'}/shop" style="display:inline-block;background:${BRAND_PINK};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:800;font-size:13px;letter-spacing:0.3px;">
      Browse the shop →
    </a>
  `;
  return { subject, html: shell(subject, body) };
}
