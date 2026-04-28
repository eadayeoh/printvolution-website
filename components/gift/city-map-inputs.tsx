'use client';

/**
 * City Map Photo Frame — customer inputs panel.
 *
 * Address goes through the OSM Nominatim geocoder server action. Once we
 * have lat/lng we call fetchCityMapPaths to get the OSM road/water vectors
 * and bubble them up to the parent (which feeds <CityMapTemplate>).
 *
 * Customer can also paste raw "lat, lng" coords directly.
 */

import { useState } from 'react';
import { geocodeAddress, fetchCityMapPaths } from '@/app/(site)/gift/actions';
import type { CityMapVectors } from '@/lib/gifts/city-map-svg';

type Props = {
  /** Coords + label flow up so the parent can persist them in cart notes. */
  lat: number | null;
  lng: number | null;
  cityLabel: string;
  radiusKm: number;
  onLocationResolved: (loc: {
    lat: number;
    lng: number;
    label: string;
    radiusKm: number;
    vectors: CityMapVectors;
  }) => void;
  onCityLabel: (s: string) => void;
  onRadius: (n: number) => void;
  /** Whether a vector fetch is currently in flight (driven by the parent). */
  fetching: boolean;
  /** Last resolution error, if any. */
  fetchError: string | null;

  names: string; onNames: (s: string) => void;
  event: string; onEvent: (s: string) => void;
  tagline: string; onTagline: (s: string) => void;
  showCoords: boolean; onShowCoords: (b: boolean) => void;

  allowedFonts: string[];
  cityFont: string;       onCityFont: (s: string) => void;
  namesFont: string;      onNamesFont: (s: string) => void;
  eventFont: string;      onEventFont: (s: string) => void;
  taglineFont: string;    onTaglineFont: (s: string) => void;
};

export function CityMapInputs({
  lat, lng, cityLabel, radiusKm,
  onLocationResolved, onCityLabel, onRadius,
  fetching, fetchError,
  names, onNames, event, onEvent, tagline, onTagline,
  showCoords, onShowCoords,
  allowedFonts,
  cityFont, onCityFont, namesFont, onNamesFont,
  eventFont, onEventFont, taglineFont, onTaglineFont,
}: Props) {
  const [address, setAddress] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function resolveLocation(rawLat: number, rawLng: number, label: string, radius: number) {
    setLocalError(null);
    const v = await fetchCityMapPaths(rawLat, rawLng, radius);
    if (!v.ok) {
      setLocalError(v.error);
      return;
    }
    onLocationResolved({ lat: rawLat, lng: rawLng, label, radiusKm: radius, vectors: v.vectors });
  }

  async function handleResolve() {
    const trimmed = address.trim();
    if (!trimmed) return;
    setResolving(true);
    setLocalError(null);
    try {
      // Allow "lat, lng" raw paste — quick path, no geocoder.
      const m = trimmed.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (m) {
        const la = parseFloat(m[1]);
        const lo = parseFloat(m[2]);
        await resolveLocation(la, lo, cityLabel || trimmed, radiusKm);
      } else {
        const g = await geocodeAddress(trimmed);
        if (!g.ok) { setLocalError(g.error); return; }
        if (!cityLabel.trim()) onCityLabel(g.label.split(',')[0]);
        await resolveLocation(g.lat, g.lng, g.label, radiusKm);
      }
    } finally {
      setResolving(false);
    }
  }

  async function handleRadiusChange(r: number) {
    onRadius(r);
    if (lat == null || lng == null) return;
    // Re-fetch silently when the customer scrubs the radius slider.
    setLocalError(null);
    const v = await fetchCityMapPaths(lat, lng, r);
    if (!v.ok) { setLocalError(v.error); return; }
    onLocationResolved({ lat, lng, label: cityLabel, radiusKm: r, vectors: v.vectors });
  }

  const errorMsg = localError ?? fetchError;
  const busy = resolving || fetching;

  return (
    <div style={{ padding: '20px 22px', display: 'grid', gap: 14 }}>
      <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-magenta)' }}>
        Make your map
      </div>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          City or address
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleResolve(); } }}
            placeholder="London, UK   ·   or paste 51.5074, -0.1278"
            style={{ flex: 1, padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
          <button
            type="button"
            onClick={handleResolve}
            disabled={busy || !address.trim()}
            style={{ padding: '10px 16px', background: 'var(--pv-ink)', color: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Loading…' : 'Find'}
          </button>
        </div>
        {errorMsg && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: '#c00' }}>{errorMsg}</div>
        )}
        {lat != null && lng != null && !errorMsg && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>
            ✦ {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        )}
      </label>

      <label style={{ display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>Map radius</span>
          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>{radiusKm.toFixed(1)} km</span>
        </div>
        <input
          type="range" min={2} max={12} step={0.5} value={radiusKm}
          onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--pv-magenta)' }}
        />
        <div style={{ marginTop: 4, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>
          Smaller = neighbourhood detail. Bigger = whole-city skyline.
        </div>
      </label>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          City label (big text)
        </span>
        <input
          type="text" value={cityLabel}
          onChange={(e) => onCityLabel(e.target.value.slice(0, 30))}
          placeholder="LONDON"
          style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            Names
          </span>
          <input
            type="text" value={names}
            onChange={(e) => onNames(e.target.value.slice(0, 40))}
            placeholder="EVA & JOHN"
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            Event / date
          </span>
          <input
            type="text" value={event}
            onChange={(e) => onEvent(e.target.value.slice(0, 40))}
            placeholder="OUR FIRST DATE"
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
      </div>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          Tagline (italic, under city name)
        </span>
        <input
          type="text" value={tagline}
          onChange={(e) => onTagline(e.target.value.slice(0, 60))}
          placeholder="Love now and always"
          style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
        />
      </label>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox" checked={showCoords}
          onChange={(e) => onShowCoords(e.target.checked)}
          style={{ accentColor: 'var(--pv-magenta)' }}
        />
        <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-ink)' }}>
          Show GPS coordinates under the map
        </span>
      </label>

      {allowedFonts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {([
            { label: 'City font',    value: cityFont,    onChange: onCityFont },
            { label: 'Names font',   value: namesFont,   onChange: onNamesFont },
            { label: 'Event font',   value: eventFont,   onChange: onEventFont },
            { label: 'Tagline font', value: taglineFont, onChange: onTaglineFont },
          ]).map((f) => (
            <label key={f.label} style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
                {f.label}
              </span>
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: f.value, fontSize: 14 }}
              >
                {allowedFonts.map((opt) => (
                  <option key={opt} value={opt} style={{ fontFamily: opt }}>{opt}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
