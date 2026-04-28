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
};

export function SpotifyPlaqueTemplate({
  photoUrl,
  songTitle,
  artistName,
  spotifyTrackId,
  templateRefDims,
  textColor,
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
    }),
    [photoUrl, songTitle, artistName, spotifyTrackId, templateRefDims, textColor],
  );

  const scanRect = spotifyPlaqueScanRect(templateRefDims);
  const fillColor = textColor && textColor.trim() ? textColor : '#0a0a0a';
  // The scannable URL we mask off — request black-on-white so the
  // luminance mask makes the bars opaque and the background drop out.
  const maskUrl = spotifyTrackId
    ? `url(${spotifyScannableUrl(spotifyTrackId, 'black')})`
    : undefined;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{ width: '100%', height: '100%', display: 'block' }}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
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
    </div>
  );
}
