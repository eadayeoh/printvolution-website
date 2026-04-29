'use client';

/**
 * Spotify Music Plaque — customer-facing live preview.
 *
 * Builds the static layout (photo, title, artist, controls, progress)
 * via buildSpotifyPlaqueSvg with omitScanCode:true, then overlays the
 * Spotify scan code as a CSS-masked div. The scannable PNG is used as
 * a luminance mask: black bars become opaque, the white background
 * becomes transparent — and we fill the whole element with the
 * customer-picked text colour, so bars + logo + text all share the
 * same colour. SVG <image> with a cross-origin URL doesn't render
 * reliably when the SVG is injected via dangerouslySetInnerHTML, so
 * the overlay sits OUTSIDE the SVG.
 */

import { useMemo } from 'react';
import {
  buildSpotifyPlaqueSvg,
  spotifyScannableUrl,
  spotifyPlaqueScanRect,
} from '@/lib/gifts/spotify-plaque-svg';

type Props = {
  photoUrl: string | null;
  songTitle: string;
  artistName: string;
  spotifyTrackId: string | null;
  templateRefDims?: { width_mm: number; height_mm: number } | null;
  /** Hex colour for title, artist, controls, progress bar, time
   *  markers, AND the Spotify scan-code bars + logo. */
  textColor?: string;
  /** Admin-editable layout zones from the template's zones_json.
   *  Recognised IDs: photo, song_title, artist_name, heart. */
  zones?: Array<{ id?: string; type?: string; x_mm?: number; y_mm?: number; width_mm?: number; height_mm?: number; font_family?: string; font_size_mm?: number; font_weight?: string; color?: string; hidden?: boolean; default_image_url?: string | null }> | null;
  /** Optional template background — renders behind the SVG (admin-
   *  uploaded acrylic-plaque texture, finish render, etc.). */
  backgroundUrl?: string | null;
  /** Optional template foreground — renders above the SVG (overlay
   *  graphics like emboss highlights). Should have transparency. */
  foregroundUrl?: string | null;
};

export function SpotifyPlaqueTemplate({
  photoUrl,
  songTitle,
  artistName,
  spotifyTrackId,
  templateRefDims,
  textColor,
  zones,
  backgroundUrl,
  foregroundUrl,
}: Props) {
  const svgMarkup = useMemo(
    () => buildSpotifyPlaqueSvg({
      photoUrl,
      songTitle,
      artistName,
      spotifyTrackId,
      templateRefDims,
      omitScanCode: true,
      textColor,
      zones,
    }),
    [photoUrl, songTitle, artistName, spotifyTrackId, templateRefDims, textColor, zones],
  );

  const scanRect = spotifyPlaqueScanRect(templateRefDims, zones ?? null);
  const fillColor = textColor && textColor.trim() ? textColor : '#0a0a0a';
  // The scannable URL we mask off — request white-bars on black bg so
  // the luminance mask makes the BARS opaque (background-color shows
  // through them = bars get the customer's colour) and the BACKGROUND
  // drops out (transparent rectangle, no coloured backdrop).
  const maskUrl = spotifyTrackId
    ? `url(${spotifyScannableUrl(spotifyTrackId, 'white')})`
    : undefined;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {backgroundUrl && (
        <img
          src={backgroundUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
      )}
      <div
        style={{ position: 'relative', width: '100%', height: '100%', display: 'block' }}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      {foregroundUrl && (
        <img
          src={foregroundUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
      )}
      {/* Generic image zones from zones_json — admin can drop a PNG into
       *  any image-type zone (e.g. a controls-graphic overlay, decorative
       *  band, etc.). Mirrors the admin canvas's z-order: rendered ABOVE
       *  the SVG dynamic content so transparent regions in the PNG let
       *  the photo / title / artist show through. Coordinates are in the
       *  editor's 0..200 canvas, so percentages map directly. */}
      {(zones ?? []).map((z, i) => {
        if (z?.type !== 'image' || z.hidden) return null;
        const zi = z as { default_image_url?: string | null; fit_mode?: 'cover' | 'contain' | string; rotation_deg?: number };
        const url = zi.default_image_url;
        if (!url) return null;
        const x = z.x_mm, y = z.y_mm, w = z.width_mm, h = z.height_mm;
        if (x == null || y == null || w == null || h == null) return null;
        const fit: 'cover' | 'contain' = zi.fit_mode === 'contain' ? 'contain' : 'cover';
        const rot = zi.rotation_deg ?? 0;
        return (
          <img
            key={`img-zone-${i}`}
            src={url}
            alt=""
            style={{
              position: 'absolute',
              left: `${(x / 200) * 100}%`,
              top: `${(y / 200) * 100}%`,
              width: `${(w / 200) * 100}%`,
              height: `${(h / 200) * 100}%`,
              objectFit: fit,
              transform: rot ? `rotate(${rot}deg)` : undefined,
              transformOrigin: 'center',
              pointerEvents: 'none',
            }}
          />
        );
      })}
      {!scanRect.hidden && (
      <div
        style={{
          position: 'absolute',
          left: `${scanRect.xPct}%`,
          top: `${scanRect.yPct}%`,
          width: `${scanRect.widthPct}%`,
          height: `${scanRect.heightPct}%`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: spotifyTrackId ? 'transparent' : '#d4d4d4',
        }}
      >
        {spotifyTrackId ? (
          <div
            aria-label="Spotify scan code"
            // luminance mask: black pixels in the source PNG are
            // opaque (so the backgroundColor shows through there →
            // the bars + logo take the customer's colour); white
            // pixels are transparent. Cast because React's CSS types
            // don't yet know about mask-mode shorthand variants.
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: fillColor,
              WebkitMaskImage: maskUrl,
              maskImage: maskUrl,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              ['WebkitMaskMode' as never]: 'luminance',
              ['maskMode' as never]: 'luminance',
            } as React.CSSProperties}
          />
        ) : (
          <span
            style={{
              fontFamily: 'Archivo, sans-serif',
              fontStyle: 'italic',
              fontSize: 'clamp(10px, 1.6cqw, 16px)',
              color: '#7a7a7a',
            }}
          >
            Paste a Spotify URL
          </span>
        )}
      </div>
      )}
    </div>
  );
}
