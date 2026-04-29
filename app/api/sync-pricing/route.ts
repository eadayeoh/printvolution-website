// /api/sync-pricing — pvpricelist webhook target.
//
// Called every time pvpricelist's Supabase fires an UPDATE webhook on
// app_config (key=rates_v1). The route pulls the latest rates, runs
// the translation layer, and upserts into products.pricing_table /
// products.pricing_compute for every product that maps to pvpricelist
// data. All side effects live inside this single transaction so
// partial writes can't leave the site in a split state.
//
// It is ALSO callable manually (no webhook required) by anyone who
// knows the shared secret. That's how the CLI / admin UI can trigger
// a re-sync.
//
// Protection: the route rejects requests that don't carry a valid
// shared secret in the X-Sync-Secret header. The secret is stored in
// the PVPRICELIST_WEBHOOK_SECRET Vercel env var.
//
// Supabase webhook config (done once in the pvpricelist dashboard):
//   Database → Webhooks → Create
//     Name: sync-printvolution-pricing
//     Table: app_config
//     Events: UPDATE
//     HTTP method: POST
//     URL: https://printvolution.vercel.app/api/sync-pricing
//     HTTP Headers:
//       X-Sync-Secret: <same secret as PVPRICELIST_WEBHOOK_SECRET>

import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/auth/require-admin';
import {
  fetchPvpricelistRates,
  buildAllProductPricingFromPvpricelist,
} from '@/lib/pricing/pvpricelist-sync';

/** Constant-time secret comparison. `===` short-circuits at the first
 *  mismatching byte, leaking position via timing — bad for header-borne
 *  shared secrets that an attacker can probe at high RPS. Both inputs
 *  are sha256-hashed first so the timingSafeEqual call always sees two
 *  32-byte buffers and the secret length isn't leaked by an early exit. */
function secretsMatch(got: string | null | undefined, want: string): boolean {
  if (!got) return false;
  const a = createHash('sha256').update(got).digest();
  const b = createHash('sha256').update(want).digest();
  return timingSafeEqual(a, b);
}

export const runtime = 'nodejs';
// Webhooks must hit a fresh handler every time — no ISR / cache.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.PVPRICELIST_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'PVPRICELIST_WEBHOOK_SECRET not configured' },
      { status: 500 },
    );
  }
  const got = req.headers.get('x-sync-secret');
  if (!secretsMatch(got, secret)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 1. Pull live rates from pvpricelist's Supabase.
    const rates = await fetchPvpricelistRates();

    // 2. Run translation → per-product updates.
    const updates = buildAllProductPricingFromPvpricelist(rates);

    // 3. Upsert into the site's products table. Use the service-role
    //    client (RLS bypass) since rows might be unpublished + admin-
    //    only. Touching only pricing_table / pricing_compute columns.
    const sb = createServiceClient();
    const synced: Array<{ slug: string; ok: boolean; error?: string }> = [];
    for (const u of updates) {
      const { error } = await sb
        .from('products')
        .update({
          pricing_table: u.pricing_table,
          pricing_compute: u.pricing_compute,
        })
        .eq('slug', u.slug);
      if (error) {
        synced.push({ slug: u.slug, ok: false, error: error.message });
      } else {
        synced.push({ slug: u.slug, ok: true });
      }
    }

    const anyFailed = synced.some((s) => !s.ok);
    return NextResponse.json(
      { ok: !anyFailed, synced, ts: new Date().toISOString() },
      { status: anyFailed ? 500 : 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Unknown error' },
      { status: 500 },
    );
  }
}

// Convenience — let a GET with the secret dry-run the fetch without
// writing to the DB. Useful to confirm the secret + fetch work before
// wiring up the Supabase webhook.
export async function GET(req: Request) {
  const secret = process.env.PVPRICELIST_WEBHOOK_SECRET;
  if (!secret || !secretsMatch(req.headers.get('x-sync-secret'), secret)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  try {
    const rates = await fetchPvpricelistRates();
    const updates = buildAllProductPricingFromPvpricelist(rates);
    return NextResponse.json({
      ok: true,
      dry_run: true,
      product_count: updates.length,
      slugs: updates.map((u) => u.slug),
      pricing_table_price_counts: updates.map((u) => ({
        slug: u.slug,
        prices: Object.keys(u.pricing_table?.prices ?? {}).length,
      })),
      ts: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
