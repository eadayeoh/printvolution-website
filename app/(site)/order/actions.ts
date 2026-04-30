'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import sharp from 'sharp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { deliveryCentsFor } from '@/lib/checkout-rates';
import { GIFT_BUCKETS, putObject, makeKey, extFromMime } from '@/lib/gifts/storage';

/** Pipeline providers that DON'T touch OpenAI. Customer is allowed
 *  to replace the source photo for these — re-runs only Sharp +
 *  storage, both already paid for. Anything outside this set forces
 *  the customer back through /gift/[slug] to set up a new design. */
const COST_FREE_PROVIDERS = new Set(['passthrough', 'local_edge', 'local_bw']);

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const EditSchema = z.object({
  lines: z.array(z.object({
    id: z.string().uuid(),
    qty: z.number().int().min(0).max(999),
    personalisation_notes: z.string().max(500).nullable().optional(),
  })).min(1),
  delivery_method: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function saveCustomerOrderEdit(
  token: string,
  input: z.input<typeof EditSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Per-IP rate limit. The token itself is the auth, so an attacker
  // who's iterating tokens shouldn't get to abuse the write path
  // even on hits.
  const ip = getClientIp();
  const rl = await checkRateLimit(`order-edit:${ip}`, { max: 20, windowSeconds: 60 });
  if (!rl.allowed) return { ok: false, error: 'Too many submissions. Try again in a minute.' };

  const parse = EditSchema.safeParse(input);
  if (!parse.success) return { ok: false, error: 'Invalid edit payload.' };
  const data = parse.data;

  if (data.delivery_method === 'delivery' && !data.delivery_address?.trim()) {
    return { ok: false, error: 'Delivery address is required.' };
  }

  const sb = service();

  // Find the order by token, with all current line items so we can
  // sanity-check the customer's edits against what was actually
  // billed. We re-derive prices from the SNAPSHOT (unit_price_cents
  // already on the row), not from product pricing tables — qty
  // changes don't unlock new tiers via this flow.
  const { data: orderRow } = await sb
    .from('orders')
    .select(`
      id, customer_edit_locked, gift_wrap, gift_wrap_cents,
      coupon_code, coupon_discount_cents,
      points_redeemed, points_discount_cents,
      order_items(id, unit_price_cents)
    `)
    .eq('customer_edit_token', token)
    .maybeSingle();

  if (!orderRow) return { ok: false, error: 'Edit link not found or expired.' };
  const o = orderRow as any;
  if (o.customer_edit_locked) {
    return { ok: false, error: 'This order is locked from customer edits.' };
  }

  // Build a map of authorised line ids → unit_price_cents so the
  // customer can't smuggle in unrelated items, change unit price,
  // or reference a deleted line.
  const authorised = new Map<string, number>(
    ((o.order_items ?? []) as Array<{ id: string; unit_price_cents: number }>)
      .map((l) => [l.id, l.unit_price_cents] as const),
  );

  let newSubtotal = 0;
  for (const line of data.lines) {
    const unit = authorised.get(line.id);
    if (unit === undefined) return { ok: false, error: 'Unknown line in edit.' };
    newSubtotal += unit * line.qty;
  }
  // Allow zeroing-out lines but not zeroing the entire order; if
  // they want a full cancel they reach out to staff.
  if (newSubtotal === 0) {
    return { ok: false, error: 'At least one item must have qty > 0.' };
  }

  const newDelivery = deliveryCentsFor(data.delivery_method, newSubtotal);
  const wrap = o.gift_wrap ? (o.gift_wrap_cents ?? 0) : 0;
  // Cap stored coupon + points discounts to the new (smaller) order
  // total — admin re-issues coupon if they want to give more, but
  // customer can't lift an existing discount past subtotal.
  const couponCapped = Math.min(o.coupon_discount_cents ?? 0, newSubtotal);
  const pointsCapped = Math.min(o.points_discount_cents ?? 0, Math.max(0, newSubtotal - couponCapped));
  const newTotal = Math.max(0, newSubtotal + newDelivery + wrap - couponCapped - pointsCapped);

  // Apply line updates first, then order totals. A failure in either
  // half leaves the row in a transitional state but the customer
  // sees the error and can retry.
  for (const line of data.lines) {
    const unit = authorised.get(line.id)!;
    const lineTotal = unit * line.qty;
    const { error } = await sb
      .from('order_items')
      .update({
        qty: line.qty,
        line_total_cents: lineTotal,
        personalisation_notes: line.personalisation_notes ?? null,
      })
      .eq('id', line.id)
      .eq('order_id', o.id);
    if (error) return { ok: false, error: 'Failed to save item: ' + error.message };
  }

  const { error: orderErr } = await sb
    .from('orders')
    .update({
      delivery_method: data.delivery_method,
      delivery_address: data.delivery_address ?? null,
      notes: data.notes ?? null,
      subtotal_cents: newSubtotal,
      delivery_cents: newDelivery,
      coupon_discount_cents: couponCapped,
      points_discount_cents: pointsCapped,
      total_cents: newTotal,
      customer_edit_last_at: new Date().toISOString(),
    })
    .eq('id', o.id)
    .eq('customer_edit_locked', false);
  if (orderErr) return { ok: false, error: 'Failed to save order: ' + orderErr.message };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Gift design edits (text / qty / notes / customer photo upload)
// ---------------------------------------------------------------------------

const GiftLineEditSchema = z.object({
  id: z.string().uuid(),
  qty: z.number().int().min(1).max(999).optional(),
  personalisation_notes: z.string().max(1000).nullable().optional(),
});

const GiftEditsSchema = z.object({
  lines: z.array(GiftLineEditSchema).min(1),
});

/** Apply text/qty/notes edits to gift order lines. Free — touches no
 *  external API. Sets design_dirty so the admin sees the line as
 *  "customer edited, re-check before printing". */
export async function saveGiftDesignEdits(
  token: string,
  input: z.input<typeof GiftEditsSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = getClientIp();
  const rl = await checkRateLimit(`gift-edit:${ip}`, { max: 30, windowSeconds: 60 });
  if (!rl.allowed) return { ok: false, error: 'Too many submissions. Try again in a minute.' };

  const parse = GiftEditsSchema.safeParse(input);
  if (!parse.success) return { ok: false, error: 'Invalid edit payload.' };

  const sb = service();
  const { data: order } = await sb
    .from('orders')
    .select('id, customer_edit_locked')
    .eq('customer_edit_token', token)
    .maybeSingle();
  if (!order) return { ok: false, error: 'Edit link not found or expired.' };
  if ((order as any).customer_edit_locked) {
    return { ok: false, error: 'This order is locked from customer edits.' };
  }

  // Authorise every line id against this order so an attacker with a
  // token can't edit gift items on a different order by smuggling
  // the wrong id.
  const { data: existing } = await sb
    .from('gift_order_items')
    .select('id')
    .eq('order_id', (order as any).id);
  const allowed = new Set(((existing ?? []) as Array<{ id: string }>).map((r) => r.id));

  for (const line of parse.data.lines) {
    if (!allowed.has(line.id)) return { ok: false, error: 'Unknown gift item.' };
    const patch: Record<string, unknown> = {
      design_dirty: true,
      design_last_edited_at: new Date().toISOString(),
    };
    if (typeof line.qty === 'number') patch.qty = line.qty;
    if (line.personalisation_notes !== undefined) {
      patch.personalisation_notes = line.personalisation_notes ?? null;
    }
    const { error } = await sb.from('gift_order_items').update(patch).eq('id', line.id);
    if (error) return { ok: false, error: 'Failed to save gift line: ' + error.message };
  }

  return { ok: true };
}

/** Replace the source photo on a gift line with a customer-uploaded
 *  image. Allowed only when the line's pipeline.provider is in the
 *  cost-free set — otherwise we'd silently re-charge OpenAI. The
 *  pre-replacement source is snapshotted into original_source_asset_id
 *  the first time so "Revert" can restore it. */
export async function replaceCustomerPhoto(
  token: string,
  giftItemId: string,
  formData: FormData,
): Promise<{ ok: true; assetId: string } | { ok: false; error: string }> {
  const ip = getClientIp();
  const rl = await checkRateLimit(`gift-photo:${ip}`, { max: 6, windowSeconds: 300 });
  if (!rl.allowed) return { ok: false, error: 'Too many uploads. Try again in a few minutes.' };

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(giftItemId)) {
    return { ok: false, error: 'Invalid gift item id.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'No file uploaded.' };
  if (file.size === 0) return { ok: false, error: 'Empty file.' };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: 'Image too large (max 20MB).' };

  const sb = service();

  // Look up the gift line + its pipeline provider in one round-trip.
  // Token + locked check is on the parent order; provider check
  // gates the cost-free path.
  const { data: line } = await sb
    .from('gift_order_items')
    .select(`
      id, source_asset_id, original_source_asset_id,
      order:orders!inner(id, customer_edit_token, customer_edit_locked),
      pipeline:gift_pipelines(provider)
    `)
    .eq('id', giftItemId)
    .maybeSingle();
  if (!line) return { ok: false, error: 'Gift item not found.' };
  const lineRow = line as any;
  const orderRow = Array.isArray(lineRow.order) ? lineRow.order[0] : lineRow.order;
  if (!orderRow || orderRow.customer_edit_token !== token) {
    return { ok: false, error: 'Edit link does not match this order.' };
  }
  if (orderRow.customer_edit_locked) {
    return { ok: false, error: 'This order is locked from customer edits.' };
  }
  const pipeline = Array.isArray(lineRow.pipeline) ? lineRow.pipeline[0] : lineRow.pipeline;
  const provider = (pipeline?.provider ?? 'passthrough') as string;
  if (!COST_FREE_PROVIDERS.has(provider)) {
    return {
      ok: false,
      error: 'This gift uses an AI-generated design, so the photo can\'t be swapped here. To use a different photo, set up a new design from the gift page.',
    };
  }

  // Validate by attempting a sharp metadata read — also normalises
  // arbitrary heic/heif/etc input down to jpeg/png/webp via the
  // pipeline's existing renderer. If sharp can't parse it, the file
  // isn't a real image regardless of its declared content-type.
  let buffer: Buffer;
  let mime: string;
  let detectedExt: string;
  try {
    const inputBuf = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(inputBuf, { limitInputPixels: 41_000_000, failOn: 'warning' })
      .metadata();
    if (!meta.width || !meta.height) throw new Error('Image has no dimensions');
    if (meta.width < 200 || meta.height < 200) {
      return { ok: false, error: 'Image too small — please upload at least 200×200 pixels.' };
    }
    // Re-encode to a known format so we don't store exotic inputs.
    if (meta.format === 'png') {
      buffer = await sharp(inputBuf).png({ compressionLevel: 8 }).toBuffer();
      mime = 'image/png';
      detectedExt = 'png';
    } else {
      buffer = await sharp(inputBuf).jpeg({ quality: 92 }).toBuffer();
      mime = 'image/jpeg';
      detectedExt = 'jpg';
    }
  } catch (e: any) {
    return { ok: false, error: 'Could not read image: ' + (e?.message ?? 'invalid file') };
  }

  // Persist to gift-sources bucket + register a gift_assets row.
  const key = makeKey(`customer-${giftItemId.slice(0, 8)}`, detectedExt);
  try {
    await putObject(GIFT_BUCKETS.sources, key, buffer, mime);
  } catch (e: any) {
    return { ok: false, error: 'Upload failed: ' + (e?.message ?? 'storage error') };
  }
  const { data: asset, error: assetErr } = await sb
    .from('gift_assets')
    .insert({
      role: 'source',
      bucket: GIFT_BUCKETS.sources,
      path: key,
      mime_type: mime,
    })
    .select('id')
    .single();
  if (assetErr || !asset) {
    return { ok: false, error: 'Asset registration failed: ' + (assetErr?.message ?? 'unknown') };
  }

  // First customer upload? Snapshot the staff-configured original
  // before we overwrite source_asset_id. On subsequent uploads we
  // leave original_source_asset_id alone so the original is always
  // recoverable via Revert.
  const patch: Record<string, unknown> = {
    source_asset_id: asset.id,
    design_dirty: true,
    design_last_edited_at: new Date().toISOString(),
  };
  if (!lineRow.original_source_asset_id) {
    patch.original_source_asset_id = lineRow.source_asset_id;
  }
  const { error: updErr } = await sb
    .from('gift_order_items')
    .update(patch)
    .eq('id', giftItemId);
  if (updErr) return { ok: false, error: 'Update failed: ' + updErr.message };

  return { ok: true, assetId: asset.id };
}

/** Restore source_asset_id from the snapshot taken on first customer
 *  upload. Free — no pipeline call, just a column flip. */
export async function revertCustomerPhoto(
  token: string,
  giftItemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = getClientIp();
  const rl = await checkRateLimit(`gift-revert:${ip}`, { max: 10, windowSeconds: 60 });
  if (!rl.allowed) return { ok: false, error: 'Too many requests. Try again in a minute.' };

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(giftItemId)) {
    return { ok: false, error: 'Invalid gift item id.' };
  }
  const sb = service();
  const { data: line } = await sb
    .from('gift_order_items')
    .select(`
      id, original_source_asset_id,
      order:orders!inner(customer_edit_token, customer_edit_locked)
    `)
    .eq('id', giftItemId)
    .maybeSingle();
  if (!line) return { ok: false, error: 'Gift item not found.' };
  const lineRow = line as any;
  const orderRow = Array.isArray(lineRow.order) ? lineRow.order[0] : lineRow.order;
  if (!orderRow || orderRow.customer_edit_token !== token) {
    return { ok: false, error: 'Edit link does not match this order.' };
  }
  if (orderRow.customer_edit_locked) {
    return { ok: false, error: 'This order is locked from customer edits.' };
  }
  if (!lineRow.original_source_asset_id) {
    return { ok: false, error: 'No original on file to revert to.' };
  }

  const { error } = await sb
    .from('gift_order_items')
    .update({
      source_asset_id: lineRow.original_source_asset_id,
      design_dirty: true,
      design_last_edited_at: new Date().toISOString(),
    })
    .eq('id', giftItemId);
  if (error) return { ok: false, error: 'Revert failed: ' + error.message };

  return { ok: true };
}
