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

/** Sniff the actual image format from the first bytes. Used as a guard
 *  when `gift_assets.mime_type` is null — a wrongly-labelled data URI
 *  (e.g. PNG bytes inside `data:image/jpeg;...`) is silently accepted by
 *  most browsers but rejected by stricter SVG-to-PDF tools downstream. */
function sniffImageMime(buf: Buffer): string {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buf.length >= 12 && buf.toString('ascii', 4, 12) === 'ftypheic') return 'image/heic';
  return 'application/octet-stream';
}

export type ResolveImageZoneOptions = {
  /** Admin foil-svg routes set this to true so a retention-purged or
   *  hard-deleted asset doesn't block the entire SVG download — the
   *  zone renders as an outlined placeholder and the missing zone IDs
   *  surface via a response header so the admin can decide. Customer
   *  preview leaves it false: missing assets there indicate a real bug
   *  worth surfacing. */
  allowMissing?: boolean;
};

export type ResolveImageZoneResult = {
  fills: Record<string, string>;
  missing: string[];
};

export async function resolveImageZoneDataUris(
  sb: SupabaseClient,
  notes: ReturnType<typeof parsePersonalisationNotes>,
  opts: ResolveImageZoneOptions = {},
): Promise<ResolveImageZoneResult> {
  const out: Record<string, string> = {};
  const raw = notes['image_assets'];
  if (!raw) return { fills: out, missing: [] };

  let assetMap: Record<string, string> = {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      assetMap = parsed as Record<string, string>;
    }
  } catch {
    return { fills: out, missing: [] };
  }

  const ids = Object.values(assetMap).filter((v): v is string => typeof v === 'string' && v.length > 0);
  if (ids.length === 0) return { fills: out, missing: [] };

  const { data: rows } = await sb
    .from('gift_assets')
    .select('id, bucket, path, mime_type')
    .in('id', ids);

  const byId = new Map<string, { bucket: string; path: string; mime_type: string | null }>();
  for (const r of (rows ?? []) as Array<{ id: string; bucket: string; path: string; mime_type: string | null }>) {
    byId.set(r.id, { bucket: r.bucket, path: r.path, mime_type: r.mime_type });
  }

  const missing: string[] = [];
  await Promise.all(Object.entries(assetMap).map(async ([zoneId, assetId]) => {
    const meta = byId.get(assetId);
    if (!meta) { missing.push(zoneId); return; }
    const bucket = meta.bucket || GIFT_BUCKETS.sources;
    const { data: blob } = await sb.storage.from(bucket).download(meta.path);
    if (!blob) { missing.push(zoneId); return; }
    const buf = Buffer.from(await blob.arrayBuffer());
    const mime = meta.mime_type || sniffImageMime(buf);
    out[zoneId] = `data:${mime};base64,${buf.toString('base64')}`;
  }));

  if (missing.length > 0 && !opts.allowMissing) {
    throw new Error(`Missing or unreadable image assets: ${missing.join(', ')}`);
  }
  return { fills: out, missing };
}
