/**
 * Server-side helper used by admin foil-svg routes (city + star map) to
 * resolve `image_assets:{zoneId:assetId}` from a cart line into a
 * `Record<zoneId, dataUri>` map the SVG renderer can embed inline.
 *
 * Customer preview uses `URL.createObjectURL` blob: URLs — those don't
 * exist server-side. The admin download route fetches the actual bytes
 * from the gift-sources bucket and base64-encodes them so the rendered
 * SVG is fully self-contained (printer software doesn't need to chase
 * external URLs).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { GIFT_BUCKETS } from './storage';
import { parsePersonalisationNotes } from './personalisation-notes';

export async function resolveImageZoneDataUris(
  sb: SupabaseClient,
  notes: ReturnType<typeof parsePersonalisationNotes>,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const raw = notes['image_assets'];
  if (!raw) return out;

  let assetMap: Record<string, string> = {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      assetMap = parsed as Record<string, string>;
    }
  } catch {
    return out;
  }

  const ids = Object.values(assetMap).filter((v): v is string => typeof v === 'string' && v.length > 0);
  if (ids.length === 0) return out;

  const { data: rows } = await sb
    .from('gift_assets')
    .select('id, bucket, path, mime_type')
    .in('id', ids);
  if (!rows) return out;

  const byId = new Map<string, { bucket: string; path: string; mime_type: string | null }>();
  for (const r of rows as Array<{ id: string; bucket: string; path: string; mime_type: string | null }>) {
    byId.set(r.id, { bucket: r.bucket, path: r.path, mime_type: r.mime_type });
  }

  await Promise.all(Object.entries(assetMap).map(async ([zoneId, assetId]) => {
    const meta = byId.get(assetId);
    if (!meta) return;
    const bucket = meta.bucket || GIFT_BUCKETS.sources;
    const { data: blob } = await sb.storage.from(bucket).download(meta.path);
    if (!blob) return;
    const buf = Buffer.from(await blob.arrayBuffer());
    const mime = meta.mime_type || 'image/jpeg';
    out[zoneId] = `data:${mime};base64,${buf.toString('base64')}`;
  }));

  return out;
}
