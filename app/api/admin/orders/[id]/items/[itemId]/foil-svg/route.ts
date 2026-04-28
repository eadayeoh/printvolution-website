/**
 * Admin-only download: regenerates the foil SVG for a song-lyrics order item
 * by re-rendering the SongLyricsTemplate React component with the customer's
 * inputs (parsed out of the line's `personalisation_notes` string) and
 * streaming it back as `image/svg+xml` with a download header.
 *
 * Customers never have a download surface — this is the production team's
 * file for foil printing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createServiceClient } from '@/lib/auth/require-admin';
import { reportError } from '@/lib/observability';
import { buildSongLyricsSvg } from '@/lib/gifts/song-lyrics-svg';
import type { SongLyricsLayout } from '@/components/gift/song-lyrics-template';

/** Parse the cart-line `personalisation_notes` "k:v;k:v" string into a map. */
function parseNotes(notes: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!notes) return out;
  for (const part of notes.split(';')) {
    const idx = part.indexOf(':');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1);
    if (k) out[k] = v;
  }
  return out;
}

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

    const n = parseNotes(row.personalisation_notes as string | null);
    const layout: SongLyricsLayout = (n['song_layout'] as SongLyricsLayout) || 'song';

    // materialColor=null drops the background <rect> so the file ships only
    // the printable foil paths — what the foil printer expects.
    const svgMarkup = buildSongLyricsSvg({
      photoUrl: null,
      lyrics: n['song_lyrics'] ?? '',
      title:   n['song_title']   ?? '',
      names:   n['song_names']   ?? '',
      year:    n['song_year']    ?? '',
      subtitle: n['song_subtitle'] ?? '',
      tagline:  n['song_tagline']  ?? '',
      titleFont: n['song_title_font'],
      namesFont: n['song_names_font'],
      yearFont:  n['song_year_font'],
      lyricsScale: n['song_lyrics_scale'] ? parseFloat(n['song_lyrics_scale']) : 1,
      layout,
      materialColor: null,
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${svgMarkup}`;
    const filename = `${row.product_slug}-${row.id.slice(0, 8)}.svg`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    reportError(err, { route: 'admin.orders.foil_svg', order_id: params.id });
    return NextResponse.json({ error: 'Failed to generate SVG' }, { status: 500 });
  }
}
