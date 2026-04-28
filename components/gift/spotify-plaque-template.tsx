'use client';

/**
 * Spotify Music Plaque — customer-facing live preview.
 *
 * Thin wrapper around buildSpotifyPlaqueSvg so the live preview pixel-
 * matches the SVG the production pipeline renders. SVG is rebuilt on
 * every input change via useMemo.
 */

import { useMemo } from 'react';
import { buildSpotifyPlaqueSvg } from '@/lib/gifts/spotify-plaque-svg';

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
    }),
    [photoUrl, songTitle, artistName, spotifyTrackId, templateRefDims],
  );

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'block' }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
