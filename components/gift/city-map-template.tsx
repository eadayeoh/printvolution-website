'use client';

/**
 * City Map Photo Frame — customer-facing live preview.
 *
 * Wraps the shared `buildCityMapSvg` in a thin React component. We render
 * via dangerouslySetInnerHTML so the live preview pixel-matches the SVG
 * the admin downloads from the order — one builder, one source of truth.
 *
 * Vectors come from the server action `fetchCityMapPaths` (or `null` while
 * the customer is still typing the address). The component itself is dumb:
 * pass in props, get an SVG.
 */

import { useMemo } from 'react';
import { buildCityMapSvg, type CityMapLayout, type CityMapSpot } from '@/lib/gifts/city-map-svg';
import type { CityMapVectors } from '@/lib/gifts/city-map-svg';
import type { GiftTemplateZone } from '@/lib/gifts/types';

type Props = {
  vectors: CityMapVectors | null;
  names: string;
  event: string;
  cityLabel: string;
  tagline: string;
  coordinates?: string;
  namesFont?: string;
  eventFont?: string;
  cityFont?: string;
  taglineFont?: string;
  layout?: CityMapLayout;
  foilColor?: string;
  materialColor?: string | null;
  /** Optional template zones for multi-anchor layouts. */
  zones?: GiftTemplateZone[] | null;
  /** Per-anchor map data for multi-anchor layouts. */
  spots?: CityMapSpot[];
};

export function CityMapTemplate({
  vectors,
  names,
  event,
  cityLabel,
  tagline,
  coordinates,
  namesFont,
  eventFont,
  cityFont,
  taglineFont,
  foilColor,
  materialColor,
  zones,
  spots,
}: Props) {
  // Memoise the SVG string — buildCityMapSvg can be heavy when there are
  // thousands of road paths, and the customer types into footer text often.
  // Recompute only when an input that affects the output changes.
  const svgMarkup = useMemo(
    () => buildCityMapSvg({
      vectors,
      names,
      event,
      cityLabel,
      tagline,
      coordinates,
      namesFont,
      eventFont,
      cityFont,
      taglineFont,
      foilColor,
      materialColor,
      zones,
      spots,
    }),
    [vectors, names, event, cityLabel, tagline, coordinates, namesFont, eventFont, cityFont, taglineFont, foilColor, materialColor, zones, spots],
  );

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'block' }}
      // svgMarkup is built from buildCityMapSvg with all customer text
      // XML-escaped — safe to inject as innerHTML.
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
