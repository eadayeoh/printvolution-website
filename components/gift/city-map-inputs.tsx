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

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { geocodeAddress, searchAddresses, fetchCityMapPaths } from '@/app/(site)/gift/actions';
import type { CityMapVectors } from '@/lib/gifts/city-map-svg';

// Leaflet imports `window` at module load — must be client-only. The rest
// of CityMapInputs is fine to SSR since the picker only mounts after a
// location resolves.
const LocationPicker = dynamic(
  () => import('@/components/gift/city-map-location-picker'),
  { ssr: false, loading: () => (
    <div style={{ height: 220, border: '2px solid var(--pv-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-muted)' }}>
      Loading map…
    </div>
  ) },
);

type AddressSuggestion = { lat: number; lng: number; label: string; displayName: string };

/** Quick-pick chips. Each entry maps to an iconic landmark so the rendered
 *  map shows what customers visually associate with the city — not the
 *  geocoder's geographic centroid (e.g., "Singapore" → middle of the
 *  island, all HDB; vs Marina Bay, which is the iconic skyline). */
const QUICK_CITIES: Array<{ name: string; query: string }> = [
  { name: 'Singapore',  query: 'Marina Bay Sands, Singapore' },
  { name: 'London',     query: 'Westminster, London, UK' },
  { name: 'New York',   query: 'Times Square, New York' },
  { name: 'Paris',      query: 'Eiffel Tower, Paris' },
  { name: 'Tokyo',      query: 'Shibuya Crossing, Tokyo' },
  { name: 'Sydney',     query: 'Sydney Opera House, Sydney' },
];

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
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const debounceRef = useRef<number | null>(null);
  // Debounce + sequence-id for radius slider. The slider fires onChange
  // continuously during drag; we used to fire one Overpass fetch per
  // tick, then whichever returned last (often an intermediate value)
  // would clobber the slider position. Now: schedule one fetch 250ms
  // after the user stops dragging, and ignore any responses tagged with
  // an older sequence id.
  const radiusDebounceRef = useRef<number | null>(null);
  const radiusSeqRef = useRef(0);

  // Debounced autocomplete — Nominatim usage policy is 1 req/sec, so 300ms
  // debounce keeps us comfortably under that even when the customer types
  // continuously. Suggestions are also fetch-cached server-side per query.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = address.trim();
    // Hide suggestions for very short input or when address looks like raw
    // lat,lng coords (no point geocoding "1.35, 103.82").
    if (trimmed.length < 2 || /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(trimmed)) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const res = await searchAddresses(trimmed);
      if (res.ok) {
        setSuggestions(res.results);
        setShowSuggestions(true);
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [address]);

  async function resolveLocation(rawLat: number, rawLng: number, label: string, radius: number) {
    setLocalError(null);
    const v = await fetchCityMapPaths(rawLat, rawLng, radius);
    if (!v.ok) {
      setLocalError(v.error);
      return;
    }
    // The server may have fallen back to a smaller radius for a dense city —
    // surface the effective value so the slider matches the rendered map.
    onLocationResolved({
      lat: rawLat, lng: rawLng, label,
      radiusKm: v.effectiveRadiusKm,
      vectors: v.vectors,
    });
    if (v.effectiveRadiusKm < radius - 0.4) {
      setLocalNotice(`Auto-zoomed to ${v.effectiveRadiusKm} km — wider radius had too much data for this city.`);
    } else {
      setLocalNotice(null);
    }
  }

  async function pickSuggestion(s: AddressSuggestion) {
    setShowSuggestions(false);
    setAddress(s.label);
    setResolving(true);
    setLocalError(null);
    setLocalNotice(null);
    try {
      if (!cityLabel.trim()) onCityLabel(s.label.split(',')[0]);
      await resolveLocation(s.lat, s.lng, s.label, radiusKm);
    } finally {
      setResolving(false);
    }
  }

  async function pickQuickCity(c: { name: string; query: string }) {
    setShowSuggestions(false);
    setAddress(c.query);
    setResolving(true);
    setLocalError(null);
    setLocalNotice(null);
    try {
      const g = await geocodeAddress(c.query);
      if (!g.ok) { setLocalError(g.error); return; }
      onCityLabel(c.name.toUpperCase());
      await resolveLocation(g.lat, g.lng, g.label, radiusKm);
    } finally {
      setResolving(false);
    }
  }

  async function handleResolve() {
    const trimmed = address.trim();
    if (!trimmed) return;
    setResolving(true);
    setLocalError(null);
    setLocalNotice(null);
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

  async function handlePinMove(newLat: number, newLng: number) {
    setLocalError(null);
    setLocalNotice(null);
    setResolving(true);
    try {
      const v = await fetchCityMapPaths(newLat, newLng, radiusKm);
      if (!v.ok) { setLocalError(v.error); return; }
      onLocationResolved({
        lat: newLat, lng: newLng, label: cityLabel,
        radiusKm: v.effectiveRadiusKm,
        vectors: v.vectors,
      });
      if (v.effectiveRadiusKm < radiusKm - 0.4) {
        setLocalNotice(`Auto-zoomed to ${v.effectiveRadiusKm} km — wider radius had too much data here.`);
      }
    } finally {
      setResolving(false);
    }
  }

  function handleRadiusChange(r: number) {
    // Update the slider value + circle preview INSTANTLY so the UI tracks
    // the customer's drag. The expensive Overpass fetch fires only once
    // after they stop dragging (debounced 250ms), and stale responses
    // from a previous tick are dropped via the sequence id — without this
    // the slider visibly snaps back when an early intermediate fetch
    // returns after the final one was started.
    onRadius(r);
    if (lat == null || lng == null) return;
    if (radiusDebounceRef.current) window.clearTimeout(radiusDebounceRef.current);
    radiusDebounceRef.current = window.setTimeout(() => {
      const seq = ++radiusSeqRef.current;
      setLocalError(null);
      setLocalNotice(null);
      void (async () => {
        const v = await fetchCityMapPaths(lat, lng, r);
        if (seq !== radiusSeqRef.current) return;
        if (!v.ok) { setLocalError(v.error); return; }
        onLocationResolved({
          lat, lng, label: cityLabel,
          radiusKm: v.effectiveRadiusKm,
          vectors: v.vectors,
        });
        if (v.effectiveRadiusKm < r - 0.4) {
          setLocalNotice(`Auto-zoomed to ${v.effectiveRadiusKm} km — wider radius had too much data for this city.`);
        }
      })();
    }, 250);
  }

  const errorMsg = localError ?? fetchError;
  const busy = resolving || fetching;

  return (
    <div style={{ padding: '20px 22px', display: 'grid', gap: 14 }}>
      <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-magenta)' }}>
        Make your map
      </div>

      <div style={{ position: 'relative' }}>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            City or address
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setShowSuggestions(true); }}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleResolve(); } if (e.key === 'Escape') setShowSuggestions(false); }}
              placeholder="Start typing — e.g. Marina Bay, Singapore"
              autoComplete="off"
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
        </label>

        {showSuggestions && suggestions.length > 0 && !busy && (
          <ul
            role="listbox"
            style={{
              position: 'absolute',
              left: 0, right: 80, top: '100%',
              marginTop: 2,
              background: '#fff',
              border: '2px solid var(--pv-ink)',
              boxShadow: '4px 4px 0 var(--pv-ink)',
              listStyle: 'none',
              padding: 0,
              maxHeight: 240,
              overflowY: 'auto',
              zIndex: 20,
            }}
          >
            {suggestions.map((s, i) => (
              <li key={`${s.lat}-${s.lng}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); void pickSuggestion(s); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', background: 'transparent', border: 'none',
                    borderBottom: i < suggestions.length - 1 ? '1px solid var(--pv-rule)' : 'none',
                    fontFamily: 'var(--pv-f-body)', fontSize: 13,
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {s.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}

        {errorMsg && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: '#c00' }}>{errorMsg}</div>
        )}
        {localNotice && !errorMsg && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: '#a06400' }}>{localNotice}</div>
        )}
        {!errorMsg && !busy && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>
            {lat != null && lng != null
              ? `✦ ${lat.toFixed(4)}, ${lng.toFixed(4)}`
              : 'Pick a suggestion as you type, or hit Enter to search.'}
          </div>
        )}
        {busy && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-magenta)' }}>
            ↻ Loading map data — this can take 5–15 seconds for big cities…
          </div>
        )}
      </div>

      {/* Live picker preview — only mounts once a location is resolved.
          Customer can drag the pin to fine-tune. The pink circle visualises
          the current map radius so they see exactly what the print covers. */}
      {lat != null && lng != null && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
              Drag the pin to fine-tune
            </span>
            <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>
              Pink circle = print coverage
            </span>
          </div>
          <LocationPicker lat={lat} lng={lng} radiusKm={radiusKm} onMove={(la, lo) => void handlePinMove(la, lo)} />
        </div>
      )}

      {/* Quick-pick chips. Each landmark is curated so the rendered map shows
          the iconic part of that city (Marina Bay, Westminster, Times Sq…) —
          not the geocoder's geographic centroid. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)', alignSelf: 'center' }}>
          Quick pick:
        </span>
        {QUICK_CITIES.map((c) => (
          <button
            key={c.name}
            type="button"
            disabled={busy}
            onClick={() => void pickQuickCity(c)}
            style={{ padding: '5px 10px', background: '#fff', color: 'var(--pv-ink)', border: '1.5px solid var(--pv-ink)', fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {c.name}
          </button>
        ))}
      </div>

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
