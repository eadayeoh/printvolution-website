'use client';

/**
 * Star Map Photo Frame — customer-facing live preview.
 *
 * Wraps the shared `buildStarMapSvg` in a thin React component. The scene
 * (the projected star positions for a given date + lat/lng) is computed
 * client-side via `buildStarMapScene` since it's pure compute — no network
 * round-trip required. Memoised so customers can drag/type footer text
 * without re-running the projection.
 *
 * Renders via dangerouslySetInnerHTML so the live preview pixel-matches
 * the SVG the admin downloads from the order — one builder, one source
 * of truth.
 */

import { useMemo } from 'react';
import {
  buildStarMapSvg,
  buildStarMapScene,
  type StarMapLayout,
} from '@/lib/gifts/star-map-svg';

type Props = {
  lat: number | null;
  lng: number | null;
  /** UTC date/time the sky should be computed for. */
  dateUtc: Date | null;
  names: string;
  event: string;
  locationLabel: string;
  tagline: string;
  coordinates?: string;
  showLines?: boolean;
  showLabels?: boolean;
  namesFont?: string;
  eventFont?: string;
  locationFont?: string;
  taglineFont?: string;
  layout?: StarMapLayout;
  foilColor?: string;
  materialColor?: string | null;
};

export function StarMapTemplate({
  lat,
  lng,
  dateUtc,
  names,
  event,
  locationLabel,
  tagline,
  coordinates,
  showLines,
  showLabels,
  namesFont,
  eventFont,
  locationFont,
  taglineFont,
  foilColor,
  materialColor,
}: Props) {
  // Scene is the only expensive bit (190 stars × atan2/sin/cos + constellation
  // segments). Recompute only when the inputs that affect it change.
  const scene = useMemo(
    () => (lat != null && lng != null && dateUtc != null
      ? buildStarMapScene(lat, lng, dateUtc)
      : null),
    [lat, lng, dateUtc],
  );

  const svgMarkup = useMemo(
    () => buildStarMapSvg({
      scene,
      dateUtc,
      names,
      event,
      locationLabel,
      tagline,
      coordinates,
      showLines,
      showLabels,
      namesFont,
      eventFont,
      locationFont,
      taglineFont,
      foilColor,
      materialColor,
    }),
    [scene, dateUtc, names, event, locationLabel, tagline, coordinates, showLines, showLabels, namesFont, eventFont, locationFont, taglineFont, foilColor, materialColor],
  );

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'block' }}
      // svgMarkup is built from buildStarMapSvg with all customer text
      // XML-escaped — safe to inject as innerHTML.
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
