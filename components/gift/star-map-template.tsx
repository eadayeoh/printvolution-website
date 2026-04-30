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
import type { GiftTemplateZone } from '@/lib/gifts/types';

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
  /** Optional admin-authored layout zones from the template editor.
   *  Star map renderer reads disk position from the render_anchor and
   *  footer text positions/fonts/sizes from named text zones. */
  zones?: GiftTemplateZone[] | null;
  /** Template's reference dimensions in mm — locks the SVG canvas
   *  aspect to these so the rendered output matches the admin's
   *  variant-editor preview without letterboxing. */
  templateRefDims?: { width_mm: number; height_mm: number } | null;
  /** Multi-anchor templates: per-disk (lat, lng, date, caption). The
   *  template renders one disk per render_anchor; spots[i] feeds the
   *  i-th disk. Index 0 typically equals the primary lat/lng/date. */
  extras?: Array<{
    lat: number | null;
    lng: number | null;
    dateUtc: Date | null;
    caption?: string | null;
  }>;
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
  layout,
  foilColor,
  materialColor,
  zones,
  templateRefDims,
  extras,
}: Props) {
  // Scene is the only expensive bit (190 stars × atan2/sin/cos + constellation
  // segments). Recompute only when the inputs that affect it change.
  const scene = useMemo(
    () => (lat != null && lng != null && dateUtc != null
      ? buildStarMapScene(lat, lng, dateUtc)
      : null),
    [lat, lng, dateUtc],
  );
  // Per-extra-disk scenes — built only when both lat/lng/dateUtc are
  // present. Memo guards against rebuilding on unrelated state changes
  // (e.g., font picks).
  const extraSpots = useMemo(
    () => (extras ?? []).map((e) => ({
      scene: e.lat != null && e.lng != null && e.dateUtc != null
        ? buildStarMapScene(e.lat, e.lng, e.dateUtc)
        : null,
      caption: e.caption ?? null,
    })),
    [extras],
  );
  // Compose spots[]: index 0 is the primary, then each extra. The
  // renderer's disks loop (via zones' star_disk anchors) picks up
  // spots[i] for the i-th anchor.
  const spots = useMemo(
    () => (extraSpots.length === 0
      ? undefined
      : [{ scene, caption: null as string | null }, ...extraSpots]),
    [scene, extraSpots],
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
      layout,
      foilColor,
      materialColor,
      zones,
      templateRefDims,
      spots,
    }),
    [scene, dateUtc, names, event, locationLabel, tagline, coordinates, showLines, showLabels, namesFont, eventFont, locationFont, taglineFont, layout, foilColor, materialColor, zones, templateRefDims, spots],
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
