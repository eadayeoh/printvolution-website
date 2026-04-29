/**
 * Admin-only download: regenerates the Spotify Plaque SVG for an order
 * item. Re-builds the now-playing layout (photo + title/artist + scancode)
 * from the saved cart-line notes and streams it back as `image/svg+xml`
 * with a download header.
 *
 * Customers never have a download surface — admin-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { reportError } from '@/lib/observability';
import { buildSpotifyPlaqueSvg } from '@/lib/gifts/spotify-plaque-svg';
import { parsePersonalisationNotes, validateHexColor } from '@/lib/gifts/personalisation-notes';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sb = createServiceClient();
    const { data: row, error } = await sb
      .from('order_items')
      .select('id, order_id, product_name, product_slug, personalisation_notes')
      .eq('id', params.itemId)
      .eq('order_id', params.id)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
    }

    const n = parsePersonalisationNotes(row.personalisation_notes as string | null);

    // Sanitise customer-supplied values at the parsing boundary so
    // attribute-injection payloads can't ride the raw note string into
    // the rendered SVG. Bad values become null/undefined and the
    // builder falls back to its defaults.
    const rawTrackId = (n['spotify_track_id'] ?? '').trim();
    const safeTrackId = /^[A-Za-z0-9]{16,32}$/.test(rawTrackId) ? rawTrackId : null;
    const safeTextColor = validateHexColor(n['spotify_text_color']) ?? undefined;
    const svgMarkup = buildSpotifyPlaqueSvg({
      photoUrl: null,
      songTitle:  n['spotify_title']  ?? '',
      artistName: n['spotify_artist'] ?? '',
      spotifyTrackId: safeTrackId,
      textColor: safeTextColor,
      zones: null,
    });

    const sizeWmm = parseFloat(n['size_w_mm'] ?? '');
    const sizeHmm = parseFloat(n['size_h_mm'] ?? '');
    const sizeAttrs = (Number.isFinite(sizeWmm) && sizeWmm > 0 && Number.isFinite(sizeHmm) && sizeHmm > 0)
      ? ` width="${sizeWmm}mm" height="${sizeHmm}mm"`
      : '';
    const stamped = sizeAttrs
      ? svgMarkup.replace('<svg ', `<svg${sizeAttrs} `)
      : svgMarkup;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${stamped}`;
    const sizeSuffix = sizeAttrs ? `-${Math.round(sizeWmm)}x${Math.round(sizeHmm)}mm` : '';
    const filename = `${row.product_slug}-${row.id.slice(0, 8)}${sizeSuffix}.svg`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    reportError(err, { route: 'admin.orders.spotify_plaque_svg', order_id: params.id });
    return NextResponse.json({ error: 'Failed to generate SVG' }, { status: 500 });
  }
}
