#!/usr/bin/env node
// scripts/print-supabase-templates.mjs
//
// One-off: prints HTML bodies for Supabase Auth email templates,
// ready to paste into Supabase Dashboard → Authentication → Email Templates.
//
// Usage:
//   node scripts/print-supabase-templates.mjs
//   node scripts/print-supabase-templates.mjs > /tmp/pv-supabase-templates.html
//
// IMPORTANT: keep the HTML below in sync with passwordResetEmailHtml() in
// lib/email.ts. The template is short, so a one-time copy is cheaper than
// wiring up a TypeScript-aware runner just for this helper.

const BRAND_INK  = '#0a0a0a';
const BRAND_PINK = '#E91E8C';
const FOOTER_LEGAL_NAME     = 'Printvolution Pte Ltd';
const FOOTER_ADDRESS        = '60 Paya Lebar Road #B1-35, S409051';
const FOOTER_WHATSAPP       = '+65 8553 3497';
const FOOTER_WHATSAPP_E164  = '6585533497';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function shell(title, body) {
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
          ${FOOTER_LEGAL_NAME} · ${FOOTER_ADDRESS}<br>
          <a href="https://wa.me/${FOOTER_WHATSAPP_E164}" style="color:${BRAND_PINK};text-decoration:none">WhatsApp ${FOOTER_WHATSAPP}</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function passwordResetEmailHtml() {
  const subject = 'Reset your Printvolution password';
  const body = `
    <h1 style="font-size:22px;font-weight:900;letter-spacing:-0.02em;margin:0 0 12px;color:${BRAND_INK};">
      Reset your password
    </h1>
    <p style="font-size:14px;color:#555;margin:0 0 16px;">
      Click the button below to set a new password. The link expires in 1 hour.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:${BRAND_PINK};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:800;font-size:13px;letter-spacing:0.3px;margin:4px 0 16px;">
      Reset password →
    </a>
    <p style="font-size:12px;color:#888;margin:16px 0 0;line-height:1.6;">
      Didn't ask for this? You can safely ignore this email — your password won't change.
    </p>
  `;
  return shell(subject, body);
}

console.log('=== RESET PASSWORD ===');
console.log('Subject: Reset your Printvolution password');
console.log('---- HTML below ----');
console.log(passwordResetEmailHtml());
console.log('=== END ===');
