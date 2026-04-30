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
import { requireAdminOrStaff, createServiceClient } from '@/lib/auth/require-admin';
import { reportError } from '@/lib/observability';
import { buildCityMapSvg, fetchCityMapVectors } from '@/lib/gifts/city-map-svg';
import { parsePersonalisationNotes, validateFontKey } from '@/lib/gifts/personalisation-notes';
import { stampSvgSize } from '@/lib/gifts/svg-size';
import { resolveImageZoneDataUris } from '@/lib/gifts/image-zone-data-uris';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  try {
    await requireAdminOrStaff();
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

    // Multi-anchor extras: customer entered up to N additional cities
    // (one per city_disk anchor beyond the primary). The cart-line
    // PRESERVES empty slots so anchor[i] alignment is stable — an
    // unfilled extra renders as the placeholder, not a shifted map.
    type Extra = { lat: number; lng: number; label?: string | null; caption?: string | null; radius_km?: number | null } | null;
    let extras: Extra[] = [];
    try {
      const raw = n['city_extras'];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          extras = (parsed as any[]).map(
            (e) => (e && Number.isFinite(e?.lat) && Number.isFinite(e?.lng)
              ? (e as Extra)
              : null),
          );
        }
      }
    } catch {
      // Malformed JSON — fall back to single-anchor render. Don't 500
      // because the customer's primary city is still good.
    }

    const safeRadius = Math.max(1, Math.min(15, radius || 5));
    // Per-extra radius wins when present so the customer's tighter zoom
    // ("the cafe" → 1km) doesn't get widened back to the primary's 5km.
    const extraRadiusFor = (e: Extra) => {
      if (!e) return safeRadius;
      const r = typeof e.radius_km === 'number' && Number.isFinite(e.radius_km) ? e.radius_km : safeRadius;
      return Math.max(1, Math.min(15, r));
    };
    const [primaryVectors, ...extraVectors] = await Promise.all([
      fetchCityMapVectors(lat, lng, safeRadius),
      ...extras.map((e) => (e ? fetchCityMapVectors(e.lat, e.lng, extraRadiusFor(e)) : Promise.resolve(null))),
    ]);

    // Look up the template's zones so the renderer iterates anchors at
    // the admin-positioned rectangles. Try gift_order_items first
    // (city-map-photo-frame is a gift_product); fall back to whatever
    // the order_items row carries via its config jsonb.
    let templateZones: import('@/lib/gifts/types').GiftTemplateZone[] | null = null;
    {
      const { data: giftLine } = await sb
        .from('gift_order_items')
        .select('template_id')
        .eq('id', params.itemId)
        .maybeSingle();
      const tplId = (giftLine as { template_id?: string } | null)?.template_id ?? null;
      if (tplId) {
        const { data: tpl } = await sb
          .from('gift_templates')
          .select('zones_json')
          .eq('id', tplId)
          .maybeSingle();
        const zj = (tpl as { zones_json?: unknown } | null)?.zones_json;
        if (Array.isArray(zj)) templateZones = zj as any;
      }
    }

    const showCoords = n['city_show_coords'] === '1';
    // Whitelist customer-supplied font keys; anything outside the
    // GIFT_FONT_FAMILIES whitelist becomes undefined and the builder
    // falls back to its defaults.
    const safeCityFont    = validateFontKey(n['city_font_title'])   ?? undefined;
    const safeNamesFont   = validateFontKey(n['city_font_names'])   ?? undefined;
    const safeEventFont   = validateFontKey(n['city_font_event'])   ?? undefined;
    const safeTaglineFnt  = validateFontKey(n['city_font_tagline']) ?? undefined;
    // Photo zones — fetch each gift_assets row and base64-encode so the
    // SVG is self-contained (printer software doesn't need to chase a
    // signed URL). Map keyed by zone id, same shape the renderer wants.
    const imageFills = await resolveImageZoneDataUris(sb, n);
    const svgMarkup = buildCityMapSvg({
      vectors: primaryVectors,
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
      zones: templateZones,
      imageFills,
      spots: extras.length > 0
        ? [
            { vectors: primaryVectors, cityLabel: n['city_label'] ?? '' },
            ...extras.map((e, i) => (e
              ? {
                  vectors: extraVectors[i] ?? null,
                  cityLabel: e.label ?? '',
                  caption: e.caption ?? undefined,
                }
              : { vectors: null, cityLabel: '' }
            )),
          ]
        : undefined,
    });

    // Stamp the physical print size onto the <svg> root from the size
    // the customer selected at checkout (saved in cart notes by the PDP).
    // Without width/height, downstream printer software has to be told
    // the size out-of-band; with them, the SVG is self-describing.
    const sizeWmm = parseFloat(n['size_w_mm'] ?? '');
    const sizeHmm = parseFloat(n['size_h_mm'] ?? '');
    const hasSize = Number.isFinite(sizeWmm) && sizeWmm > 0 && Number.isFinite(sizeHmm) && sizeHmm > 0;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${stampSvgSize(svgMarkup, sizeWmm, sizeHmm)}`;
    const sizeSuffix = hasSize ? `-${Math.round(sizeWmm)}x${Math.round(sizeHmm)}mm` : '';
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
