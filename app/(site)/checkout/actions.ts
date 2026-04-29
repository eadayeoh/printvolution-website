'use server';

import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { runProductionPipeline, runSurfaceProductionPipeline } from '@/lib/gifts/pipeline';
import { GIFT_BUCKETS, serviceClient } from '@/lib/gifts/storage';
import type { GiftProduct } from '@/lib/gifts/types';
import { giftUnitPrice } from '@/lib/gifts/types';
import { evaluateCouponForOrder } from '@/lib/coupons';
import { DELIVERY_FLAT_CENTS, GIFT_WRAP_FLAT_CENTS } from '@/lib/checkout-rates';
import { reportError } from '@/lib/observability';
import { parsePersonalisationNotes } from '@/lib/gifts/personalisation-notes';
import { parseShapeOptions, shapeOptionsPriceDelta } from '@/lib/gifts/shape-options';
import { createClient as createUserClient } from '@/lib/supabase/server';
import { getAnonSessionId } from '@/lib/gifts/anon-session';

/**
 * Public coupon-validation endpoint used by the checkout form
 * before submit, so customers see an error inline instead of
 * discovering it on order placement. Rate-limited to deter
 * brute-forcing of coupon codes.
 */
export async function validateCouponForCheckout(
  code: string,
  subtotalCents: number,
): Promise<{ ok: true; code: string; discountCents: number } | { ok: false; error: string }> {
  const ip = getClientIp();
  const rl = await checkRateLimit(`coupon:${ip}`, { max: 10, windowSeconds: 600 });
  if (!rl.allowed) return { ok: false, error: `Too many tries. Try again in ${rl.retryAfterSeconds}s.` };

  const r = await evaluateCouponForOrder(code, subtotalCents);
  if (!r.ok) return r;
  return { ok: true, code: r.coupon.code, discountCents: r.discountCents };
}

/**
 * Fire off the production pipeline for each gift line. Runs
 * non-blocking so the customer sees their order confirmation right away.
 * Each line's production_status transitions pending → processing → ready/failed.
 */
type ProductionQueueLine = {
  id: string;
  gift_product_id: string;
  source_asset_id: string | null;
  mode: string;
  template_id: string | null;
  shape_kind: string | null;
  shape_template_id: string | null;
  personalisation_notes: string | null;
};

async function queueGiftProduction(giftLines: ProductionQueueLine[]) {
  for (const line of giftLines) {
    runOne(line).catch(() => console.error('[gift production] line failed', line.id));
  }
}

async function runOne(line: ProductionQueueLine) {
  const sb = serviceClient();
  // Idempotency gate: only proceed if the line is in 'pending'.
  // Without this, a duplicate trigger (admin clicks Regenerate twice,
  // background retry, etc.) would re-run the OpenAI pipeline AND
  // create a second production_asset_id, leaving the first orphaned.
  // Atomically transition pending → processing; if the WHERE clause
  // matches no rows, another worker is already running.
  const { data: claimed } = await sb
    .from('gift_order_items')
    .update({ production_status: 'processing' })
    .eq('id', line.id)
    .eq('production_status', 'pending')
    .select('id');
  if (!claimed || claimed.length === 0) {
    console.warn('[gift production] line not pending, skipping duplicate run', line.id);
    return;
  }
  try {
    if (!line.source_asset_id) throw new Error('No source asset on order line');
    const [{ data: product }, { data: source }] = await Promise.all([
      sb.from('gift_products').select('*').eq('id', line.gift_product_id).maybeSingle(),
      sb.from('gift_assets').select('bucket, path, mime_type').eq('id', line.source_asset_id).maybeSingle(),
    ]);
    if (!product || !source) throw new Error('Product or source asset not found');

    // Resolve the template the customer picked at order time. Without
    // this, templated gifts (Spotify Plaque, zone composites, cutouts)
    // would silently ship as plain photos because runProductionPipeline
    // has no template_id to dispatch on.
    const effectiveTemplateId = line.shape_kind === 'template'
      ? (line.shape_template_id ?? line.template_id)
      : line.template_id;

    const out = await runProductionPipeline({
      product: product as unknown as GiftProduct,
      sourcePath: source.path,
      sourceMime: source.mime_type ?? 'image/jpeg',
      templateId: effectiveTemplateId ?? null,
      shapeKind: (line.shape_kind as 'cutout' | 'rectangle' | 'template' | null) ?? null,
      personalisationNotes: line.personalisation_notes,
    } as any);

    // Register the primary production asset. The pipeline emits the
    // right format per mode (PNG / JPG / SVG) — we just record it.
    const { data: prodAsset } = await sb.from('gift_assets').insert({
      role: 'production',
      bucket: GIFT_BUCKETS.production,
      path: out.productionPath,
      mime_type: out.productionMime,
      width_px: out.widthPx,
      height_px: out.heightPx,
      dpi: out.dpi,
    }).select('id').single();
    // PDF is only generated for modes that need print-ready vectors
    // around the bitmap (everything except laser / uv / digital /
    // embroidery / foil — see productionFormatsForMode).
    const pdfAsset = out.productionPdfPath
      ? (await sb.from('gift_assets').insert({
          role: 'production-pdf',
          bucket: GIFT_BUCKETS.production,
          path: out.productionPdfPath,
          mime_type: out.productionPdfMime,
        }).select('id').single()).data
      : null;

    // Dual-mode template fan-out: persist the full per-mode set in
    // production_files so the admin order view can surface each file
    // with its mode label. Empty array when single-mode.
    const productionFiles = out.files?.map((f) => ({
      mode: f.mode,
      png_path: f.pngPath,
      pdf_path: f.pdfPath,
      width_px: f.widthPx,
      height_px: f.heightPx,
      dpi: f.dpi,
    })) ?? [];

    await sb.from('gift_order_items').update({
      production_asset_id: prodAsset?.id ?? null,
      production_pdf_id: pdfAsset?.id ?? null,
      production_files: productionFiles,
      production_status: 'ready',
    }).eq('id', line.id);
  } catch (e: any) {
    await sb.from('gift_order_items').update({
      production_status: 'failed',
      production_error: e?.message ?? 'unknown production failure',
    }).eq('id', line.id);
    reportError(e, { route: 'checkout', action: 'gift_production', extras: { line_id: line.id } });
    // Admin alert — without this, orders silently sit in
    // production_status='failed' forever; nobody knows to retry.
    try {
      const { sendEmail, adminEmail } = await import('@/lib/email');
      const to = adminEmail();
      if (to) {
        await sendEmail({
          to,
          subject: `[PrintVolution] Gift production FAILED — line ${line.id.slice(0, 8)}`,
          html: `<p>Gift order line <code>${line.id}</code> failed during production.</p>
                 <p><b>Error:</b> ${(e?.message ?? 'unknown').toString().slice(0, 500)}</p>
                 <p>Re-trigger from /admin/orders.</p>`,
        });
      }
    } catch { /* non-fatal */ }
  }
}

/** Fan-out producer for surfaces-driven gift lines. Loads every
 *  pending surface on the given lines, runs the per-surface production
 *  pipeline, and updates each row with the produced asset IDs + status.
 *  Runs non-blocking — checkout returns before this finishes. */
async function queueSurfaceProduction(
  items: Array<{ lineId: string; gift_product_id: string }>,
) {
  for (const it of items) {
    void runOneLineSurfaces(it).catch(() =>
      console.error('[gift surface production] line failed', it.lineId),
    );
  }
}

async function runOneLineSurfaces(it: { lineId: string; gift_product_id: string }) {
  const sb = serviceClient();
  const [{ data: product }, { data: surfaces }] = await Promise.all([
    sb.from('gift_products').select('*').eq('id', it.gift_product_id).maybeSingle(),
    sb.from('gift_order_item_surfaces').select('*').eq('order_item_id', it.lineId).order('display_order'),
  ]);
  if (!product || !surfaces) return;

  // Load variant so we can honour its per-surface area dimensions. The
  // cart stores gift_variant_id on the order item — reach it via the
  // gift_order_items row.
  const { data: orderItem } = await sb
    .from('gift_order_items')
    .select('variant_id')
    .eq('id', it.lineId)
    .maybeSingle();
  const variantId = (orderItem as any)?.variant_id ?? null;
  const { data: variant } = variantId
    ? await sb.from('gift_product_variants').select('surfaces, width_mm, height_mm').eq('id', variantId).maybeSingle()
    : { data: null };

  for (const row of surfaces) {
    // Idempotency gate per surface — same pattern as runOne above.
    const { data: claimed } = await sb
      .from('gift_order_item_surfaces')
      .update({ production_status: 'processing' })
      .eq('id', row.id)
      .eq('production_status', 'pending')
      .select('id');
    if (!claimed || claimed.length === 0) continue;
    try {
      // Resolve this surface's areaMm from the variant config. The
      // surface.mockup_area is in percent; combine with the variant's
      // (or product's) physical dims to get mm.
      let areaMm: { widthMm: number; heightMm: number } | null = null;
      const variantSurfaces = Array.isArray(variant?.surfaces) ? variant!.surfaces : [];
      const surfCfg = variantSurfaces.find((s: any) => s.id === row.surface_id);
      const physW = Number(variant?.width_mm ?? product.width_mm);
      const physH = Number(variant?.height_mm ?? product.height_mm);
      if (surfCfg?.mockup_area && Number.isFinite(physW) && Number.isFinite(physH)) {
        areaMm = {
          widthMm:  (Number(surfCfg.mockup_area.width)  / 100) * physW,
          heightMm: (Number(surfCfg.mockup_area.height) / 100) * physH,
        };
      }

      let sourcePath: string | null = null;
      let sourceMime: string | null = null;
      if (row.source_asset_id) {
        const { data: src } = await sb.from('gift_assets').select('path, mime_type').eq('id', row.source_asset_id).maybeSingle();
        sourcePath = (src as any)?.path ?? null;
        sourceMime = (src as any)?.mime_type ?? null;
      }

      const out = await runSurfaceProductionPipeline({
        product: product as any,
        mode: row.mode,
        text: row.text ?? undefined,
        sourcePath,
        sourceMime,
        surfaceLabel: row.surface_label,
        areaMm,
      });

      const { data: prodAsset } = await sb.from('gift_assets').insert({
        role: 'production',
        bucket: GIFT_BUCKETS.production,
        path: out.productionPath,
        mime_type: out.productionMime,
        width_px: out.widthPx,
        height_px: out.heightPx,
        dpi: out.dpi,
      }).select('id').single();
      // Mirror the parent path (line ~110): only persist a production-pdf
      // asset row when the pipeline actually produced a PDF. Without the
      // gate, skipping PDF emission for laser/uv/embroidery surfaces
      // would still create an asset row pointing at an empty key.
      const pdfAsset = out.productionPdfPath
        ? (await sb.from('gift_assets').insert({
            role: 'production-pdf',
            bucket: GIFT_BUCKETS.production,
            path: out.productionPdfPath,
            mime_type: out.productionPdfMime,
          }).select('id').single()).data
        : null;

      await sb.from('gift_order_item_surfaces').update({
        production_asset_id: prodAsset?.id ?? null,
        production_pdf_id: pdfAsset?.id ?? null,
        production_status: 'ready',
      }).eq('id', row.id);
    } catch (e: any) {
      await sb.from('gift_order_item_surfaces').update({
        production_status: 'failed',
        production_error: e?.message ?? 'unknown',
      }).eq('id', row.id);
      reportError(e, { route: 'checkout', action: 'surface_production', extras: { surface_row_id: row.id, line_id: it.lineId } });
    }
  }

  // Roll up to the parent gift_order_items.production_status so the
  // admin orders queue reflects surface results without having to
  // join. "ready" only if every surface succeeded; "failed" if any.
  const { data: final } = await sb
    .from('gift_order_item_surfaces')
    .select('production_status')
    .eq('order_item_id', it.lineId);
  const statuses = (final ?? []).map((r: any) => r.production_status);
  const rollup = statuses.every((s: string) => s === 'ready')
    ? 'ready'
    : statuses.some((s: string) => s === 'failed')
      ? 'failed'
      : 'processing';
  await sb.from('gift_order_items').update({ production_status: rollup }).eq('id', it.lineId);
}

const OrderSchema = z.object({
  customer_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  company: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  delivery_method: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  coupon_code: z.string().max(60).optional().nullable(),
  gift_wrap: z.boolean().default(false),
  gift_message: z.string().max(280).optional().nullable(),
  items: z.array(
    z.object({
      product_slug: z.string(),
      product_name: z.string(),
      icon: z.string().nullable(),
      config: z.record(z.string(), z.string()),
      qty: z.number().int().positive(),
      unit_price_cents: z.number().int().nonnegative(),
      line_total_cents: z.number().int().nonnegative(),
      personalisation_notes: z.string().optional(),
      gift_image_url: z.string().optional(),
      gift_variant_id: z.string().uuid().optional(),
      shape_kind: z.enum(['cutout', 'rectangle', 'template']).nullable().optional(),
      shape_template_id: z.string().uuid().nullable().optional(),
      figurine_slug: z.string().max(120).nullable().optional(),
      surfaces: z.array(z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        text: z.string().max(500).optional(),
        source_asset_id: z.string().uuid().optional(),
        // Free string — admins can add custom modes via /admin/gifts/modes,
        // gift_modes is the source of truth, no DB enum to keep in sync.
        mode: z.string().min(1).max(40),
      })).optional(),
    })
  ).min(1),
});

export type OrderInput = z.infer<typeof OrderSchema>;

export type OrderResult =
  | { ok: true; order_number: string; id: string }
  | { ok: false; error: string };

export async function submitOrder(input: OrderInput): Promise<OrderResult> {
  // Rate limit: 3 orders per IP per 10 minutes (real humans don't place
  // 4+ orders in 10 min; scripts do).
  const ip = getClientIp();
  const rl = await checkRateLimit(`checkout:${ip}`, { max: 3, windowSeconds: 600 });
  if (!rl.allowed) {
    return {
      ok: false,
      error: `Too many orders from your IP. Please try again in ${rl.retryAfterSeconds}s or WhatsApp us.`,
    };
  }

  // Validate
  const parsed = OrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid order data: ' + parsed.error.issues[0].message };
  }
  const data = parsed.data;
  // Schema declares min(1) but z.array().min() can be skipped if the
  // field is omitted entirely — defend explicitly.
  if (!data.items || data.items.length === 0) {
    return { ok: false, error: 'Cart is empty.' };
  }

  // Service-role client so we can insert regardless of RLS session
  const sb = serviceClient();

  // Calculate totals
  const subtotal = data.items.reduce((s, i) => s + i.line_total_cents, 0);
  const delivery = data.delivery_method === 'delivery' ? DELIVERY_FLAT_CENTS : 0;

  // Server-side coupon re-validation. Trust nothing from the client —
  // re-evaluate against the freshly-computed subtotal.
  let couponCode: string | null = null;
  let couponDiscount = 0;
  let couponId: string | null = null;
  if (data.coupon_code && data.coupon_code.trim()) {
    const r = await evaluateCouponForOrder(data.coupon_code, subtotal);
    if (!r.ok) return { ok: false, error: `Promo code: ${r.error}` };
    couponCode = r.coupon.code;
    couponDiscount = r.discountCents;
    couponId = r.coupon.id;
  }

  const giftWrapCents = data.gift_wrap ? GIFT_WRAP_FLAT_CENTS : 0;

  const total = Math.max(0, subtotal - couponDiscount + delivery + giftWrapCents);
  // Points only earn on what the customer actually paid (post-discount).
  const pointsEarned = Math.floor(Math.max(0, subtotal - couponDiscount) / 100); // 1 point per S$1

  // Look up both product catalogs by slug to figure out which items are
  // PRINT and which are GIFT. Each item is in exactly one of the two
  // tables (gift_products wins if for some reason both exist).
  const slugs = Array.from(new Set(data.items.map((i) => i.product_slug)));
  const [printRes, giftRes, pricingRes] = await Promise.all([
    sb.from('products').select('id, slug, is_active').in('slug', slugs),
    sb.from('gift_products').select('id, slug, mode, base_price_cents, is_active, sizes, figurine_options, shape_options, price_tiers').in('slug', slugs),
    sb.from('product_pricing').select('product_id, rows'),
  ]);
  if (printRes.error) return { ok: false, error: 'Product lookup failed: ' + printRes.error.message };
  const printSlugToId = new Map((printRes.data ?? []).map((p: any) => [p.slug, p.id]));
  const printActive = new Map((printRes.data ?? []).map((p: any) => [p.slug, p.is_active]));
  const giftSlugToInfo = new Map(
    (giftRes.data ?? []).map((p: any) => [p.slug, {
      id: p.id,
      mode: p.mode,
      base_price_cents: p.base_price_cents,
      is_active: p.is_active,
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      figurine_options: Array.isArray(p.figurine_options) ? p.figurine_options : [],
      shape_options: p.shape_options ?? null,
      price_tiers: Array.isArray(p.price_tiers) ? p.price_tiers : [],
    }])
  );

  // Fetch any gift variants the cart references, so server can recompute
  // the per-line expected unit price (variant base + size delta + shape
  // upcharge + figurine delta + per-surface deltas) without trusting the
  // client snapshot. Missing variant_id falls through to the product's
  // base_price_cents.
  const variantIds = Array.from(new Set(
    data.items
      .map((i) => i.gift_variant_id)
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
  ));
  const variantsRes = variantIds.length > 0
    ? await sb.from('gift_product_variants')
        .select('id, gift_product_id, base_price_cents, price_tiers, size_overrides, surfaces')
        .in('id', variantIds)
    : { data: [] as any[], error: null };
  const variantById = new Map(
    ((variantsRes.data ?? []) as any[]).map((v: any) => [v.id, v])
  );

  // Compute PRICE FLOOR per print product — the lowest unit price in
  // the pricing matrix. Used to reject manipulated low-priced orders.
  const printFloor = new Map<string, number>();
  const productIdToSlug = new Map((printRes.data ?? []).map((p: any) => [p.id, p.slug]));
  for (const row of ((pricingRes.data ?? []) as any[])) {
    const slug = productIdToSlug.get(row.product_id);
    if (!slug) continue;
    let min: number | null = null;
    for (const r of (row.rows ?? []) as any[]) {
      for (const price of (r.prices ?? []) as any[]) {
        if (typeof price === 'number' && price > 0 && (min === null || price < min)) min = price;
      }
    }
    if (min !== null) printFloor.set(slug, min);
  }

  // ───────── PRICE VALIDATION ─────────
  // Reject if any item claims to cost less than what the product allows.
  // Also reject inactive/unknown products.
  for (const item of data.items) {
    const isGift = giftSlugToInfo.has(item.product_slug);
    const isPrint = printSlugToId.has(item.product_slug);
    if (!isGift && !isPrint) {
      return { ok: false, error: `Unknown product: ${item.product_slug}` };
    }
    if (isPrint && printActive.get(item.product_slug) === false) {
      return { ok: false, error: `Product not available: ${item.product_slug}` };
    }
    if (isGift && giftSlugToInfo.get(item.product_slug)?.is_active === false) {
      return { ok: false, error: `Product not available: ${item.product_slug}` };
    }

    if (isGift) {
      // Gifts: server recomputes the expected BASE unit-price floor
      // (deltas for the customer's picks, with tier-discounted base
      // allowed). Reject the line when its claimed unit price is
      // below this server-computed floor.
      //
      // Floor = lowest tier-allowed base for the active variant or
      //         product (so a legitimate qty-tier discount on the
      //         base passes — tier discounts apply to the qty
      //         multiplier, not to the deltas)
      //       + size delta (variant override → product default)
      //       + shape upcharge (cutout +200c canonical, or custom from product.shape_options)
      //       + figurine delta (matched on figurine_slug)
      //       + per-surface deltas (each filled surface's price_delta_cents)
      const giftInfo = giftSlugToInfo.get(item.product_slug)!;
      if (!giftInfo.base_price_cents || giftInfo.base_price_cents <= 0) {
        return { ok: false, error: `Product is not priced: ${item.product_name}. Please contact us.` };
      }

      const variant = item.gift_variant_id ? variantById.get(item.gift_variant_id) : null;
      // Variant must belong to the cart's product, otherwise the client
      // smuggled a cheaper variant id under a richer product slug.
      if (item.gift_variant_id && (!variant || variant.gift_product_id !== giftInfo.id)) {
        return { ok: false, error: `Invalid variant for ${item.product_name}. Please refresh your cart.` };
      }

      // Tier base for THIS line's qty. Earlier we used the lowest
      // tier as the floor — that let a qty=1 customer pay the qty=100
      // tier price and pass. The correct gate is the tier whose qty
      // bracket the line falls into; below the smallest tier, the
      // base price applies.
      const baseTiers: Array<{ qty: number; price_cents: number }> = ((variant && Array.isArray(variant.price_tiers) && variant.price_tiers.length > 0)
        ? variant.price_tiers
        : giftInfo.price_tiers) as any;
      const baselineBase = (variant && typeof variant.base_price_cents === 'number')
        ? variant.base_price_cents
        : giftInfo.base_price_cents;
      const variantBase = giftUnitPrice(baselineBase, baseTiers, item.qty);

      const notes = parsePersonalisationNotes(item.personalisation_notes ?? '');

      // Size delta — read from product.sizes[].price_delta_cents,
      // overridable per variant via variant.size_overrides[slug].price_delta_cents.
      let sizeDelta = 0;
      const sizeSlug = notes['size_slug'];
      if (sizeSlug) {
        const size = giftInfo.sizes.find((s: any) => s?.slug === sizeSlug);
        if (size) {
          const override = variant?.size_overrides?.[sizeSlug];
          sizeDelta = (typeof override?.price_delta_cents === 'number')
            ? override.price_delta_cents
            : (typeof size.price_delta_cents === 'number' ? size.price_delta_cents : 0);
        }
      }

      // Shape upcharge — cutout canonical fallback is 200 cents (no
      // shared constant in the codebase as of this write); admin-
      // configured product.shape_options[].price_delta_cents wins when
      // present.
      let shapeDelta = 0;
      if (item.shape_kind) {
        try {
          const shapeOptions = parseShapeOptions(giftInfo.shape_options);
          const fromOptions = shapeOptionsPriceDelta(shapeOptions, item.shape_kind);
          shapeDelta = fromOptions > 0
            ? fromOptions
            : (item.shape_kind === 'cutout' ? 200 : 0);
        } catch {
          shapeDelta = item.shape_kind === 'cutout' ? 200 : 0;
        }
      }

      // Figurine delta — keyed by figurine_slug on the cart line.
      let figurineDelta = 0;
      if (item.figurine_slug) {
        const fig = giftInfo.figurine_options.find((f: any) => f?.slug === item.figurine_slug);
        if (fig && typeof fig.price_delta_cents === 'number') {
          figurineDelta = fig.price_delta_cents;
        }
      }

      // Per-surface deltas — each surface filled by the customer pays
      // its variant.surfaces[].price_delta_cents (when surfaces exist).
      // "Filled" matches the customer-side definition: typed text OR an
      // uploaded photo asset. Empty surfaces don't bill.
      let surfaceDelta = 0;
      if (Array.isArray(item.surfaces) && variant && Array.isArray(variant.surfaces)) {
        for (const s of item.surfaces) {
          const filled = Boolean((s.text && s.text.trim()) || s.source_asset_id);
          if (!filled) continue;
          const cfg = variant.surfaces.find((vs: any) => vs?.id === s.id);
          if (cfg && typeof cfg.price_delta_cents === 'number') {
            surfaceDelta += cfg.price_delta_cents;
          }
        }
      }

      const expectedUnitCents = variantBase + sizeDelta + shapeDelta + figurineDelta + surfaceDelta;
      if (item.unit_price_cents < expectedUnitCents) {
        return { ok: false, error: `Price mismatch on ${item.product_name}. Please refresh your cart.` };
      }
    } else {
      // Print: unit price must be >= minimum price from pricing matrix.
      // (Upper bound not enforced — higher prices mean a pricier config.)
      const floor = printFloor.get(item.product_slug);
      // Reject if the product has no known price floor at all — that
      // means the product has no pricing matrix rows configured, which
      // should never reach checkout. Treat it as a manipulated cart.
      if (floor === undefined) {
        return { ok: false, error: `Product is not priced: ${item.product_name}. Please contact us.` };
      }
      if (item.unit_price_cents < floor) {
        return { ok: false, error: `Price mismatch on ${item.product_name}. Please refresh your cart.` };
      }
    }

    // No free prints or gifts from the checkout path.
    if (item.unit_price_cents <= 0 || item.line_total_cents <= 0) {
      return { ok: false, error: `Invalid price on ${item.product_name}. Please refresh your cart.` };
    }

    // line_total sanity: must equal unit * qty (1 cent rounding tolerance).
    // The previous Math.max(1, qty) tolerance scaled with qty — a qty=200
    // order could be off by $2 silently. Fixed cap keeps the cart honest.
    const expectedLine = item.unit_price_cents * item.qty;
    if (Math.abs(item.line_total_cents - expectedLine) > 1) {
      return { ok: false, error: `Line total mismatch on ${item.product_name}. Please refresh your cart.` };
    }
  }

  // For gift items, parse the source/preview/template IDs out of
  // personalisation_notes — the upload + add-to-cart actions wrote them
  // there as "gift_source:<uuid>;gift_preview:<uuid>;gift_template:<uuid>".
  // The template id is optional: products with template_mode='none' or
  // a single auto-selected template don't smuggle it.
  function parseGiftRefs(
    notes: string | undefined,
  ): { sourceId?: string; previewId?: string; templateId?: string } {
    if (!notes) return {};
    const out: { sourceId?: string; previewId?: string; templateId?: string } = {};
    for (const part of notes.split(';')) {
      // Use split(':', 2) limit so values containing ':' (e.g. URLs)
      // don't get truncated, and so a missing-colon part doesn't
      // silently produce undefined values.
      const idx = part.indexOf(':');
      if (idx <= 0) continue;
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      if (!v) continue;
      if (k === 'gift_source')   out.sourceId   = v;
      if (k === 'gift_preview')  out.previewId  = v;
      if (k === 'gift_template') out.templateId = v;
    }
    return out;
  }

  const giftItems = data.items.filter((i) => giftSlugToInfo.has(i.product_slug));
  const printItems = data.items.filter((i) => !giftSlugToInfo.has(i.product_slug));

  // Asset-ownership verification. Migration 0092 adds {user_id,
  // anon_session_id} to gift_assets at insert time. For every gift line
  // in this checkout we look up the source/preview/surface assets and
  // confirm the row's owner matches the caller. Legacy rows (both
  // columns null) get a free pass + log so in-flight carts don't break
  // while the column rolls forward — strict mode is a follow-up.
  if (giftItems.length > 0) {
    const callerAnon = getAnonSessionId();
    const allRefs: string[] = [];
    for (const it of giftItems) {
      const r = parseGiftRefs(it.personalisation_notes);
      if (r.sourceId) allRefs.push(r.sourceId);
      if (r.previewId) allRefs.push(r.previewId);
      if (Array.isArray(it.surfaces)) {
        for (const s of it.surfaces) if (s.source_asset_id) allRefs.push(s.source_asset_id);
      }
    }
    const uniqueRefs = Array.from(new Set(allRefs));
    if (uniqueRefs.length > 0) {
      // Auth + asset-row fetch don't depend on each other — kick both
      // off together. Saves one roundtrip's worth of latency on every
      // checkout that has at least one gift line.
      const [callerUserId, assetRows] = await Promise.all([
        (async () => {
          try {
            const c = createUserClient();
            const { data: u } = await c.auth.getUser();
            return u?.user?.id ?? null;
          } catch { return null; }
        })(),
        sb.from('gift_assets').select('id, user_id, anon_session_id').in('id', uniqueRefs).then(({ data }) => data),
      ]);
      const byId = new Map((assetRows ?? []).map((r: any) => [r.id as string, r]));
      for (const ref of uniqueRefs) {
        const row = byId.get(ref);
        if (!row) continue;
        const ownerUser = (row as any).user_id as string | null;
        const ownerAnon = (row as any).anon_session_id as string | null;
        const hasOwner = ownerUser !== null || ownerAnon !== null;
        if (!hasOwner) {
          console.warn('[checkout] legacy gift_asset without owner — free pass', { asset_id: ref });
          continue;
        }
        const ownedByUser = callerUserId !== null && ownerUser === callerUserId;
        const ownedByAnon = !ownedByUser && ownerAnon !== null && ownerAnon === callerAnon;
        if (!ownedByUser && !ownedByAnon) {
          reportError(new Error('gift_asset ownership mismatch at checkout'), {
            route: 'checkout', action: 'asset_ownership',
            extras: { asset_id: ref, asset_user_id: ownerUser, caller_user_id: callerUserId },
          });
          return { ok: false, error: 'One of your photos is not available for this order. Please re-upload it.' };
        }
      }
    }
  }

  // Insert the order
  const { data: order, error: oErr } = await sb
    .from('orders')
    .insert({
      customer_name: data.customer_name,
      email: data.email,
      phone: data.phone,
      company: data.company || null,
      position: data.position || null,
      delivery_method: data.delivery_method,
      delivery_address: data.delivery_address || null,
      notes: data.notes || null,
      subtotal_cents: subtotal,
      delivery_cents: delivery,
      total_cents: total,
      coupon_code: couponCode,
      coupon_discount_cents: couponDiscount,
      gift_wrap: data.gift_wrap,
      gift_wrap_cents: giftWrapCents,
      gift_message: data.gift_message?.trim() || null,
      points_earned: pointsEarned,
      status: 'pending',
    })
    .select('id, order_number')
    .single();

  if (oErr || !order) return { ok: false, error: 'Order create failed: ' + oErr?.message };

  // Best-effort: a failure here doesn't roll back the order — the
  // customer already got their discount, we just lose accounting.
  // Use the atomic increment RPC (migration 0087) so two concurrent
  // checkouts can't both read uses_count=N and both write N+1, skipping
  // a use against max_uses.
  if (couponId && couponDiscount > 0) {
    const [redRes, incRes] = await Promise.all([
      sb.from('coupon_redemptions').insert({
        coupon_id: couponId,
        order_id: order.id,
        discount_cents: couponDiscount,
      }),
      sb.rpc('increment_coupon_uses', { p_coupon_id: couponId }),
    ]);
    if (redRes.error) console.error('[coupon] redemption insert', redRes.error.message);
    if (incRes.error) console.error('[coupon] uses increment', incRes.error.message);
  }

  // Insert PRINT line items into order_items (existing flow)
  if (printItems.length > 0) {
    const itemRows = printItems.map((i) => ({
      order_id: order.id,
      product_id: printSlugToId.get(i.product_slug) ?? null,
      product_name: i.product_name,
      product_slug: i.product_slug,
      icon: i.icon,
      config: i.config,
      qty: i.qty,
      unit_price_cents: i.unit_price_cents,
      line_total_cents: i.line_total_cents,
      personalisation_notes: i.personalisation_notes ?? null,
      gift_image_url: i.gift_image_url ?? null,
    }));
    const { error: iErr } = await sb.from('order_items').insert(itemRows);
    if (iErr) {
      await sb.from('orders').delete().eq('id', order.id);
      return { ok: false, error: 'Order items failed: ' + iErr.message };
    }
  }

  // Insert GIFT line items into gift_order_items (new flow) and fire off
  // the production pipeline for each — source/preview asset IDs were
  // captured at upload time and embedded in personalisation_notes.
  if (giftItems.length > 0) {
    // Bulk-fetch mode_override for any referenced templates so a
    // multi-SKU product (e.g. Star Map: foil vs poster) routes by the
    // customer's pick instead of the product's default mode.
    const itemsWithRefs = giftItems.map((item) => ({
      item,
      refs: parseGiftRefs(item.personalisation_notes),
    }));
    const templateIds = Array.from(
      new Set(
        itemsWithRefs.map(({ refs }) => refs.templateId).filter((id): id is string => !!id),
      ),
    );
    const templateOverrides = new Map<string, string | null>();
    if (templateIds.length > 0) {
      const { data: tplRows } = await sb
        .from('gift_templates')
        .select('id, mode_override')
        .in('id', templateIds);
      for (const t of tplRows ?? []) {
        templateOverrides.set(t.id as string, (t.mode_override as string | null) ?? null);
      }
    }
    const giftRows = itemsWithRefs.map(({ item: i, refs }) => {
      const info = giftSlugToInfo.get(i.product_slug)!;
      const overrideMode = refs.templateId ? templateOverrides.get(refs.templateId) : undefined;
      return {
        order_id: order.id,
        gift_product_id: info.id,
        variant_id: i.gift_variant_id ?? null,
        template_id: refs.templateId ?? null,
        qty: i.qty,
        unit_price_cents: i.unit_price_cents,
        line_total_cents: i.line_total_cents,
        source_asset_id: refs.sourceId ?? null,
        preview_asset_id: refs.previewId ?? null,
        mode: overrideMode ?? info.mode,
        product_name_snapshot: i.product_name,
        personalisation_notes: i.personalisation_notes ?? null,
        production_status: 'pending' as const,
        shape_kind: i.shape_kind ?? null,
        shape_template_id: i.shape_kind === 'template' ? (i.shape_template_id ?? null) : null,
      };
    });
    const { data: insertedGifts, error: giErr } = await sb
      .from('gift_order_items')
      .insert(giftRows)
      .select('id, gift_product_id, source_asset_id, mode, template_id, shape_kind, shape_template_id, personalisation_notes');
    if (giErr) {
      await sb.from('order_items').delete().eq('order_id', order.id);
      await sb.from('orders').delete().eq('id', order.id);
      return { ok: false, error: 'Gift items failed: ' + giErr.message };
    }

    // Fan out per-surface rows for any gift line that carried surfaces
    // from the cart. Line items without surfaces fall back to the
    // original single-mode production runner below.
    const itemsWithSurfaces: Array<{ lineId: string; gift_product_id: string; surfaces: NonNullable<OrderInput['items'][0]['surfaces']> }> = [];
    for (let idx = 0; idx < giftItems.length; idx++) {
      const raw = giftItems[idx];
      if (!raw.surfaces || raw.surfaces.length === 0) continue;
      const insertedRow = insertedGifts?.[idx];
      if (!insertedRow) continue;
      const rows = raw.surfaces.map((s, sIdx) => ({
        order_item_id: insertedRow.id,
        surface_id: s.id,
        surface_label: s.label,
        text: s.text ?? null,
        source_asset_id: s.source_asset_id ?? null,
        mode: s.mode,
        display_order: sIdx,
        production_status: 'pending' as const,
      }));
      const { error: sErr } = await sb.from('gift_order_item_surfaces').insert(rows);
      if (sErr) {
        console.error('[gift surfaces] insert failed', sErr.message);
      } else {
        itemsWithSurfaces.push({
          lineId: insertedRow.id,
          gift_product_id: insertedRow.gift_product_id,
          surfaces: raw.surfaces,
        });
      }
    }

    // Mark the gift products as "ordered" so the mode becomes locked.
    // Kick off production in the background — don't block checkout on it.
    // Production updates gift_order_items.production_status when it lands.
    const singleProductionLines = (insertedGifts ?? []).filter(
      (l: any) => !itemsWithSurfaces.some((s) => s.lineId === l.id),
    );
    void queueGiftProduction(singleProductionLines);
    void queueSurfaceProduction(itemsWithSurfaces);
    const giftProductIds = Array.from(new Set(giftRows.map((r) => r.gift_product_id)));
    if (giftProductIds.length > 0) {
      // Fan out — sequential awaits stalled multi-product carts on each
      // RTT. The .is('first_ordered_at', null) filter still keeps it
      // upsert-like even with concurrent updates.
      const stamp = new Date().toISOString();
      await Promise.all(giftProductIds.map((gpId) =>
        sb.from('gift_products')
          .update({ first_ordered_at: stamp })
          .eq('id', gpId)
          .is('first_ordered_at', null)
      ));
    }
  }

  // Upsert member record (for points tracking)
  const { data: existing } = await sb.from('members').select('id, points_balance, total_earned').eq('email', data.email).maybeSingle();
  if (existing) {
    await sb.from('members').update({
      name: data.customer_name,
      phone: data.phone,
      points_balance: (existing.points_balance as number) + pointsEarned,
      total_earned: (existing.total_earned as number) + pointsEarned,
    }).eq('id', existing.id);
    await sb.from('points_transactions').insert({
      member_id: existing.id,
      order_id: order.id,
      delta: pointsEarned,
      type: 'earned',
      note: `Order ${order.order_number}`,
    });
  } else {
    const { data: newMember } = await sb.from('members').insert({
      email: data.email,
      name: data.customer_name,
      phone: data.phone,
      points_balance: pointsEarned,
      total_earned: pointsEarned,
    }).select('id').single();
    if (newMember) {
      await sb.from('points_transactions').insert({
        member_id: newMember.id,
        order_id: order.id,
        delta: pointsEarned,
        type: 'earned',
        note: `First order ${order.order_number}`,
      });
    }
  }

  // Send order confirmation emails (non-blocking — never fail the order
  // because email didn't go out)
  void sendOrderEmails({
    order_number: order.order_number as string,
    customer_name: data.customer_name,
    customer_email: data.email,
    delivery_method: data.delivery_method,
    delivery_address: data.delivery_address,
    items: data.items.map((i) => ({
      product_name: i.product_name,
      qty: i.qty,
      line_total_cents: i.line_total_cents,
      config: i.config,
    })),
    subtotal_cents: subtotal,
    delivery_cents: delivery,
    total_cents: total,
  });

  return { ok: true, order_number: order.order_number as string, id: order.id as string };
}

async function sendOrderEmails(payload: import('@/lib/email').OrderEmailPayload) {
  try {
    const { sendEmail, customerOrderConfirmationEmail, adminNewOrderEmail, adminEmail } = await import('@/lib/email');
    const customer = customerOrderConfirmationEmail(payload);
    await sendEmail({ to: payload.customer_email, subject: customer.subject, html: customer.html });
    const admin = adminEmail();
    if (admin) {
      const a = adminNewOrderEmail(payload);
      await sendEmail({ to: admin, subject: a.subject, html: a.html, replyTo: payload.customer_email });
    }
  } catch (e) {
    console.error('[order email] failed');
    reportError(e, { route: 'checkout', action: 'send_emails' });
  }
}
