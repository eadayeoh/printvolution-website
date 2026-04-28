'use client';

/**
 * Spotify Music Plaque — customer-facing live preview.
 *
 * Builds the static layout (photo, title, artist, controls, progress)
 * via buildSpotifyPlaqueSvg with omitScanCode:true, then overlays a
 * plain HTML <img> for the Spotify scan code. We don't embed the scan
 * code as an SVG <image> because cross-origin SVG <image> elements
 * don't load reliably when SVG is injected via dangerouslySetInnerHTML
 * — switching to a regular <img> sidesteps that browser quirk.
 */

import { useMemo } from 'react';
import {
  buildSpotifyPlaqueSvg,
  spotifyScannableUrl,
  spotifyPlaqueScanRect,
  type SpotifyScanCodeColor,
} from '@/lib/gifts/spotify-plaque-svg';

type Props = {
  photoUrl: string | null;
  songTitle: string;
  artistName: string;
  spotifyTrackId: string | null;
  templateRefDims?: { width_mm: number; height_mm: number } | null;
  /** Hex colour for title, artist, controls, progress bar, time markers.
   *  Defaults to near-black ink. */
  textColor?: string;
  /** Black (default) or white scan-code bars. */
  scanCodeColor?: SpotifyScanCodeColor;
};

export function SpotifyPlaqueTemplate({
  photoUrl,
  songTitle,
  artistName,
  spotifyTrackId,
  templateRefDims,
  textColor,
  scanCodeColor = 'black',
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
      scanCodeColor,
    }),
    [photoUrl, songTitle, artistName, spotifyTrackId, templateRefDims, textColor, scanCodeColor],
  );

  const scanRect = spotifyPlaqueScanRect(templateRefDims);
  // darken keeps the black bars + drops the white background; lighten
  // does the inverse for a white scan code on its black background.
  const scanBlend = scanCodeColor === 'white' ? 'lighten' : 'darken';

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
          <img
            src={spotifyScannableUrl(spotifyTrackId, scanCodeColor)}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              // Spotify's scannable PNG bakes in an opaque background.
              // darken (black bars) / lighten (white bars) blends that
              // background into whatever sits behind the plaque while
              // preserving the scan bars + logo.
              mixBlendMode: scanBlend,
            }}
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
