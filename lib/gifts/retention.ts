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
      id, source_asset_id, production_asset_id, production_pdf_id,
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

    // Delete production PNG + PDF
    const prodPaths: Array<{ bucket: string; path: string }> = [];
    if (item.production?.path) prodPaths.push({ bucket: item.production.bucket ?? GIFT_BUCKETS.production, path: item.production.path });
    if (item.production_pdf?.path) prodPaths.push({ bucket: item.production_pdf.bucket ?? GIFT_BUCKETS.production, path: item.production_pdf.path });
    if (!item.production_purged_at && prodPaths.length) {
      // group by bucket for one remove() call per bucket
      const byBucket = new Map<string, string[]>();
      for (const p of prodPaths) {
        if (!byBucket.has(p.bucket)) byBucket.set(p.bucket, []);
        byBucket.get(p.bucket)!.push(p.path);
      }
      let ok = true;
      for (const [bucket, paths] of byBucket) {
        const { error: e } = await sb.storage.from(bucket).remove(paths);
        if (e) { result.errors.push(`prod ${item.id}: ${e.message}`); ok = false; }
      }
      if (ok) result.productionDeleted++;
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
