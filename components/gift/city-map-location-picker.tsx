'use client';

/**
 * Location picker for the City Map Photo Frame product.
 *
 * Shows a real OpenStreetMap tile map with a draggable pin so the customer
 * can verify the geocoded location and fine-tune it before committing to
 * the foil render. Surrounds it with a circle visualising the current
 * map radius so the customer sees exactly what will be on the print.
 *
 * Loaded dynamically (ssr: false) by the parent because Leaflet touches
 * `window` on import.
 */

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons reference relative URLs that don't
// resolve under Next.js's bundler. Build a tiny inline SVG pin instead.
const PIN_ICON = L.divIcon({
  className: 'pv-citymap-pin',
  iconSize: [22, 32],
  iconAnchor: [11, 30],
  html: `<svg viewBox="0 0 22 32" xmlns="http://www.w3.org/2000/svg" width="22" height="32">
    <path d="M11 1 C5 1 1 5 1 11 c0 7 10 20 10 20 s10-13 10-20 c0-6-4-10-10-10 z"
          fill="#d4af37" stroke="#1a2740" stroke-width="1.5"/>
    <circle cx="11" cy="11" r="4" fill="#1a2740"/>
  </svg>`,
});

type Props = {
  lat: number;
  lng: number;
  /** Current radius — drives the visual circle. */
  radiusKm: number;
  onMove: (lat: number, lng: number) => void;
};

/**
 * Recenters the map when the parent's lat/lng changes (e.g., the customer
 * picked a new suggestion or quick-pick city). Without this, the map
 * stays on the old center even though the marker prop updated.
 */
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function CityMapLocationPicker({ lat, lng, radiusKm, onMove }: Props) {
  const markerRef = useRef<L.Marker | null>(null);

  // Pick a zoom level that makes the radius circle fill ~70% of the map.
  // 3 km ≈ zoom 13, 6 km ≈ zoom 12, 12 km ≈ zoom 11.
  const zoom = useMemo(() => {
    if (radiusKm <= 2.5) return 14;
    if (radiusKm <= 5) return 13;
    if (radiusKm <= 8) return 12;
    return 11;
  }, [radiusKm]);

  return (
    <div style={{ width: '100%', height: 220, border: '2px solid var(--pv-ink)', position: 'relative' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter lat={lat} lng={lng} />
        <Circle
          center={[lat, lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#c41e6f', fillColor: '#c41e6f', fillOpacity: 0.08, weight: 2 }}
        />
        <Marker
          position={[lat, lng]}
          draggable
          icon={PIN_ICON}
          eventHandlers={{
            dragend: () => {
              const m = markerRef.current;
              if (!m) return;
              const p = m.getLatLng();
              onMove(p.lat, p.lng);
            },
          }}
          ref={markerRef}
        />
      </MapContainer>
    </div>
  );
}
