/**
 * Admin-only download: regenerates the foil-printable star-map SVG for an
 * order item. Re-projects the bundled star catalogue for the customer's
 * coords + UTC moment, parses the footer text from the line's notes, and
 * streams an `image/svg+xml` file with materialColor=null so only the
 * foil paths ship to the printer.
 *
 * Customers never have a download surface — admin-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { reportError } from '@/lib/observability';
import { buildStarMapSvg, buildStarMapScene } from '@/lib/gifts/star-map-svg';
import { parsePersonalisationNotes } from '@/lib/gifts/personalisation-notes';

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
    const lat = parseFloat(n['star_lat'] ?? '');
    const lng = parseFloat(n['star_lng'] ?? '');

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Order has no star-map coordinates' }, { status: 400 });
    }

    // Prefer the absolute UTC ISO. Fall back to local-time + offset if for
    // some reason the customer's order didn't get the UTC stamp written
    // (older orders, or a bug in serialisation).
    let dateUtc: Date | null = null;
    if (n['star_date_utc']) {
      const d = new Date(n['star_date_utc']);
      if (!Number.isNaN(d.getTime())) dateUtc = d;
    }
    if (!dateUtc && n['star_local_date'] && n['star_local_time']) {
      const [yy, mm, dd] = n['star_local_date'].split('-').map((s) => parseInt(s, 10));
      const [hh, mi]     = n['star_local_time'].split(':').map((s) => parseInt(s, 10));
      const tzOff = parseInt(n['star_tz_offset'] ?? '0', 10) || 0;
      if ([yy, mm, dd, hh, mi].every(Number.isFinite)) {
        dateUtc = new Date(Date.UTC(yy, mm - 1, dd, hh, mi) - tzOff * 60 * 1000);
      }
    }
    if (!dateUtc) {
      return NextResponse.json({ error: 'Order has no date/time for the sky' }, { status: 400 });
    }

    const scene = buildStarMapScene(lat, lng, dateUtc);

    const showCoords = n['star_show_coords'] === '1';
    const showLines  = n['star_show_lines']  === '1';
    const showLabels = n['star_show_labels'] === '1';

    // Layout drives the visual treatment. Fall back from the saved cart
    // note to a slug-derived default so older orders without star_layout
    // still render the right product. Anything that isn't 'poster' is
    // treated as the original foil layout.
    const layout: 'foil' | 'poster' =
      n['star_layout'] === 'poster' || row.product_slug === 'star-map-poster'
        ? 'poster'
        : 'foil';

    const coordinates = showCoords
      ? (layout === 'poster'
          ? `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} / ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`
          : `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`)
      : undefined;

    const svgMarkup = buildStarMapSvg({
      scene,
      dateUtc,
      names:         n['star_names']   ?? '',
      event:         n['star_event']   ?? '',
      locationLabel: n['star_label']   ?? '',
      tagline:       n['star_tagline'] ?? '',
      coordinates,
      showLines,
      showLabels,
      layout,
      locationFont: n['star_font_loc']     ?? undefined,
      namesFont:    n['star_font_names']   ?? undefined,
      eventFont:    n['star_font_event']   ?? undefined,
      taglineFont:  n['star_font_tagline'] ?? undefined,
      // Foil: drop the navy background so only the gold paths ship to
      // the foil printer. Poster: keep the white background — paper
      // prints need the full artwork.
      materialColor: layout === 'foil' ? null : undefined,
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
    reportError(err, { route: 'admin.orders.star_map_svg', order_id: params.id });
    return NextResponse.json({ error: 'Failed to generate SVG' }, { status: 500 });
  }
}
