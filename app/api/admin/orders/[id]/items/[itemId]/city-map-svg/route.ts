/**
 * Admin-only download: regenerates the foil-printable city-map SVG for an
 * order item. Re-fetches the OSM vectors for the customer's coords +
 * radius, parses the footer text from the line's notes, and streams an
 * `image/svg+xml` file with materialColor=null so only the foil paths
 * ship to the printer.
 *
 * Customers never have a download surface — admin-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { reportError } from '@/lib/observability';
import { buildCityMapSvg, fetchCityMapVectors } from '@/lib/gifts/city-map-svg';
import { parsePersonalisationNotes, validateFontKey } from '@/lib/gifts/personalisation-notes';

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
    const lat = parseFloat(n['city_lat'] ?? '');
    const lng = parseFloat(n['city_lng'] ?? '');
    const radius = parseFloat(n['city_radius'] ?? '5');

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Order has no city coordinates' }, { status: 400 });
    }

    const vectors = await fetchCityMapVectors(lat, lng, Math.max(1, Math.min(15, radius || 5)));

    const showCoords = n['city_show_coords'] === '1';
    // Whitelist customer-supplied font keys; anything outside the
    // GIFT_FONT_FAMILIES whitelist becomes undefined and the builder
    // falls back to its defaults.
    const safeCityFont    = validateFontKey(n['city_font_title'])   ?? undefined;
    const safeNamesFont   = validateFontKey(n['city_font_names'])   ?? undefined;
    const safeEventFont   = validateFontKey(n['city_font_event'])   ?? undefined;
    const safeTaglineFnt  = validateFontKey(n['city_font_tagline']) ?? undefined;
    const svgMarkup = buildCityMapSvg({
      vectors,
      names:     n['city_names']   ?? '',
      event:     n['city_event']   ?? '',
      cityLabel: n['city_label']   ?? '',
      tagline:   n['city_tagline'] ?? '',
      coordinates: showCoords ? `${lat.toFixed(4)}° N · ${lng.toFixed(4)}° E` : undefined,
      cityFont:    safeCityFont,
      namesFont:   safeNamesFont,
      eventFont:   safeEventFont,
      taglineFont: safeTaglineFnt,
      // Drop the navy background — foil printer wants only the gold paths.
      materialColor: null,
    });

    // Stamp the physical print size onto the <svg> root from the size
    // the customer selected at checkout (saved in cart notes by the PDP).
    // Without width/height, downstream printer software has to be told
    // the size out-of-band; with them, the SVG is self-describing.
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
    reportError(err, { route: 'admin.orders.city_map_svg', order_id: params.id });
    return NextResponse.json({ error: 'Failed to generate SVG' }, { status: 500 });
  }
}
