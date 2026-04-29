import 'server-only';
import { serviceClient } from './storage';
import { GIFT_BUCKETS } from './storage';

export type PurgeResult = {
  sourcesDeleted: number;
  productionDeleted: number;
  errors: string[];
  inspected: number;
};

/**
 * Purge gift_order_items whose source + production assets are past the
 * per-product retention window. Deletes storage objects; flips the
 * *_purged_at timestamps. Keeps the 72 DPI watermarked preview indefinitely
 * so the customer's order history still renders.
 *
 * Writes a row to gift_retention_runs for audit.
 */
export async function purgeEligible(now: Date = new Date()): Promise<PurgeResult> {
  const sb = serviceClient();
  const result: PurgeResult = { sourcesDeleted: 0, productionDeleted: 0, errors: [], inspected: 0 };

  const { data: items, error } = await sb
    .from('gift_order_items')
    .select(`
      id, source_asset_id, production_asset_id, production_pdf_id, production_files,
      source_purged_at, production_purged_at,
      order:orders!inner(created_at),
      product:gift_products!inner(source_retention_days),
      source:gift_assets!source_asset_id(bucket, path),
      production:gift_assets!production_asset_id(bucket, path),
      production_pdf:gift_assets!production_pdf_id(bucket, path)
    `)
    .or('source_purged_at.is.null,production_purged_at.is.null')
    .limit(500);

  if (error) {
    result.errors.push(`query: ${error.message}`);
    await logRun(sb, result);
    return result;
  }

  result.inspected = items?.length ?? 0;
  const nowMs = now.getTime();

  // Pre-fetch surface rows for every inspected item in ONE query (was
  // an N+1 inside the loop — N=500 ran 500 sequential roundtrips). Group
  // by order_item_id so the loop body can look up O(1) instead of
  // dispatching its own query.
  const itemIds = (items ?? []).map((i: any) => i.id).filter(Boolean);
  const surfacesByItemId = new Map<string, any[]>();
  if (itemIds.length > 0) {
    const { data: allSurfaces } = await sb
      .from('gift_order_item_surfaces')
      .select(`
        id, order_item_id, production_asset_id, production_pdf_id,
        production:gift_assets!production_asset_id(bucket, path),
        production_pdf:gift_assets!production_pdf_id(bucket, path)
      `)
      .in('order_item_id', itemIds);
    for (const s of (allSurfaces ?? []) as any[]) {
      const list = surfacesByItemId.get(s.order_item_id) ?? [];
      list.push(s);
      surfacesByItemId.set(s.order_item_id, list);
    }
  }

  for (const item of (items ?? []) as any[]) {
    const orderCreated = new Date(item.order.created_at).getTime();
    const retentionDays = item.product.source_retention_days ?? 30;
    const cutoff = orderCreated + retentionDays * 24 * 60 * 60 * 1000;
    if (nowMs < cutoff) continue;

    // Delete source object
    if (!item.source_purged_at && item.source?.path) {
      const { error: e } = await sb.storage.from(item.source.bucket ?? GIFT_BUCKETS.sources).remove([item.source.path]);
      if (e) result.errors.push(`src ${item.id}: ${e.message}`);
      else result.sourcesDeleted++;
    }

    // Delete production PNG + PDF, plus dual-mode per-file entries
    // (production_files JSONB) and surface-driven production assets
    // (gift_order_item_surfaces). Without these branches, dual-mode
    // products and surfaces-driven products kept their fan-out files
    // around past retention.
    const prodPaths: Array<{ bucket: string; path: string }> = [];
    if (item.production?.path) prodPaths.push({ bucket: item.production.bucket ?? GIFT_BUCKETS.production, path: item.production.path });
    if (item.production_pdf?.path) prodPaths.push({ bucket: item.production_pdf.bucket ?? GIFT_BUCKETS.production, path: item.production_pdf.path });
    const productionFiles = Array.isArray(item.production_files) ? item.production_files : [];
    for (const f of productionFiles as any[]) {
      if (f?.png_path) prodPaths.push({ bucket: GIFT_BUCKETS.production, path: f.png_path });
      if (f?.pdf_path) prodPaths.push({ bucket: GIFT_BUCKETS.production, path: f.pdf_path });
    }
    // Surfaces-driven lines fan out into gift_order_item_surfaces; each
    // row carries its own production_asset_id / production_pdf_id. Pull
    // from the pre-fetched map and add their paths to the same
    // per-bucket batch.
    const surfaceRows = surfacesByItemId.get(item.id) ?? [];
    const surfaceAssetIds: string[] = [];
    for (const s of surfaceRows) {
      if (s.production?.path) prodPaths.push({ bucket: s.production.bucket ?? GIFT_BUCKETS.production, path: s.production.path });
      if (s.production_pdf?.path) prodPaths.push({ bucket: s.production_pdf.bucket ?? GIFT_BUCKETS.production, path: s.production_pdf.path });
      if (s.production_asset_id) surfaceAssetIds.push(s.production_asset_id);
      if (s.production_pdf_id) surfaceAssetIds.push(s.production_pdf_id);
    }
    if (!item.production_purged_at && prodPaths.length) {
      // group by bucket for one remove() call per bucket
      const byBucket = new Map<string, string[]>();
      for (const p of prodPaths) {
        if (!byBucket.has(p.bucket)) byBucket.set(p.bucket, []);
        byBucket.get(p.bucket)!.push(p.path);
      }
      const results = await Promise.all(
        Array.from(byBucket).map(([bucket, paths]) => sb.storage.from(bucket).remove(paths)),
      );
      let ok = true;
      for (const { error: e } of results) {
        if (e) { result.errors.push(`prod ${item.id}: ${e.message}`); ok = false; }
      }
      if (ok) result.productionDeleted++;
    }

    if (surfaceAssetIds.length > 0) {
      const { error: e } = await sb.from('gift_assets').delete().in('id', surfaceAssetIds);
      if (e) result.errors.push(`surface assets ${item.id}: ${e.message}`);
    }

    // Flip timestamps (always — so we don't retry next run on the same item
    // even if the storage delete silently no-oped because the object was
    // already gone).
    await sb.from('gift_order_items').update({
      source_purged_at: now.toISOString(),
      production_purged_at: now.toISOString(),
    }).eq('id', item.id);
  }

  await logRun(sb, result);
  return result;
}

async function logRun(sb: ReturnType<typeof serviceClient>, r: PurgeResult) {
  await sb.from('gift_retention_runs').insert({
    sources_deleted: r.sourcesDeleted,
    production_deleted: r.productionDeleted,
    errors: r.errors,
  });
}
