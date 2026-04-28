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
} from '@/lib/gifts/spotify-plaque-svg';

type Props = {
  photoUrl: string | null;
  songTitle: string;
  artistName: string;
  spotifyTrackId: string | null;
  templateRefDims?: { width_mm: number; height_mm: number } | null;
};

export function SpotifyPlaqueTemplate({
  photoUrl,
  songTitle,
  artistName,
  spotifyTrackId,
  templateRefDims,
}: Props) {
  const svgMarkup = useMemo(
    () => buildSpotifyPlaqueSvg({
      photoUrl,
      songTitle,
      artistName,
      spotifyTrackId,
      templateRefDims,
      omitScanCode: true,
    }),
    [photoUrl, songTitle, artistName, spotifyTrackId, templateRefDims],
  );

  const scanRect = spotifyPlaqueScanRect(templateRefDims);

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
            src={spotifyScannableUrl(spotifyTrackId)}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
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
