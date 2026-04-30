'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { sendEmail, proofApprovalEmail } from '@/lib/email';

async function requireAdmin() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin only');
  }
  return sb;
}

function siteOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url && url.length > 0) return url.replace(/\/$/, '');
  return 'https://printvolution.sg';
}

export async function advanceStatus(form: FormData) {
  const sb = await requireAdmin();
  const id = String(form.get('id'));
  const status = String(form.get('status'));
  if (!['pending', 'processing', 'ready', 'failed'].includes(status)) {
    throw new Error('invalid status');
  }
  const { error } = await sb.from('gift_order_items').update({ production_status: status }).eq('id', id);
  if (error) throw new Error(error.message);

  // Auto-send proof email on the pending/processing → ready hand-off.
  // We mint an opaque token and stamp proof_sent_at; the customer
  // page at /proof/[token] renders the preview asset and lets them
  // approve or reject. Skipped if a proof was already sent for this
  // line, so re-toggling status doesn't spam the customer.
  if (status === 'ready') {
    await maybeSendProofEmail(sb, id, {});
  }

  revalidatePath('/admin/gifts/orders');
}

export async function sendProofManually(form: FormData) {
  const sb = await requireAdmin();
  const id = String(form.get('id'));
  await maybeSendProofEmail(sb, id, { force: true });
  revalidatePath('/admin/gifts/orders');
}

export async function saveNotes(form: FormData) {
  const sb = await requireAdmin();
  const id = String(form.get('id'));
  const notes = String(form.get('notes') ?? '');
  const { error } = await sb.from('gift_order_items').update({ admin_notes: notes }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/gifts/orders');
}

async function maybeSendProofEmail(
  sb: Awaited<ReturnType<typeof requireAdmin>>,
  giftItemId: string,
  opts: { force?: boolean },
): Promise<void> {
  const { data } = await sb
    .from('gift_order_items')
    .select(`
      id, proof_status, proof_sent_at, product_name_snapshot,
      preview_asset_id,
      order:orders(order_number, customer_name, email)
    `)
    .eq('id', giftItemId)
    .maybeSingle();
  if (!data) return;
  const row = data as any;
  if (!row.preview_asset_id) return;
  if (!opts.force && row.proof_sent_at) return;
  const order = Array.isArray(row.order) ? row.order[0] : row.order;
  if (!order?.email) return;

  const token = randomBytes(24).toString('base64url');
  const { error: upErr } = await sb
    .from('gift_order_items')
    .update({
      proof_status: 'pending',
      proof_token: token,
      proof_sent_at: new Date().toISOString(),
    })
    .eq('id', giftItemId);
  if (upErr) return;

  const { subject, html } = proofApprovalEmail({
    order_number: order.order_number,
    customer_name: order.customer_name ?? 'there',
    product_name: row.product_name_snapshot ?? 'your gift',
    approveUrl: `${siteOrigin()}/proof/${token}`,
  });
  await sendEmail({ to: order.email, subject, html });
}
