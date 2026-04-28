'use client';

/**
 * Star Map Photo Frame — customer inputs panel.
 *
 * Address goes through the same OSM Nominatim geocoder as the City Map
 * frame. Once we have lat/lng + a date + a time, the parent component
 * renders the sky entirely client-side (no network round-trip — the
 * star catalogue is bundled).
 *
 * Customer can also paste raw "lat, lng" coords directly.
 */

import { useState, useEffect, useRef } from 'react';
import { geocodeAddress, searchAddresses } from '@/app/(site)/gift/actions';

type AddressSuggestion = { lat: number; lng: number; label: string; displayName: string };

/** Quick-pick chips. Matches the city-map convention so customers see
 *  identical UI between the two frame products. */
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
  locationLabel: string;
  /** ISO date string yyyy-mm-dd, in customer-local terms. */
  dateIso: string;
  /** HH:MM (24h), in customer-local terms. */
  timeHm: string;
  /** Local TZ offset in minutes east of UTC (e.g. +480 for SGT). */
  tzOffsetMin: number;

  onLocationResolved: (loc: { lat: number; lng: number; label: string }) => void;
  onLocationLabel: (s: string) => void;
  onDateIso: (s: string) => void;
  onTimeHm: (s: string) => void;
  onTzOffsetMin: (n: number) => void;

  names: string; onNames: (s: string) => void;
  event: string; onEvent: (s: string) => void;
  tagline: string; onTagline: (s: string) => void;
  showCoords: boolean; onShowCoords: (b: boolean) => void;
  showLines: boolean; onShowLines: (b: boolean) => void;
  showLabels: boolean; onShowLabels: (b: boolean) => void;

  allowedFonts: string[];
  locationFont: string;  onLocationFont: (s: string) => void;
  namesFont: string;     onNamesFont: (s: string) => void;
  eventFont: string;     onEventFont: (s: string) => void;
  taglineFont: string;   onTaglineFont: (s: string) => void;
};

export function StarMapInputs({
  lat, lng, locationLabel,
  dateIso, timeHm, tzOffsetMin,
  onLocationResolved, onLocationLabel,
  onDateIso, onTimeHm, onTzOffsetMin,
  names, onNames, event, onEvent, tagline, onTagline,
  showCoords, onShowCoords,
  showLines, onShowLines,
  showLabels, onShowLabels,
  allowedFonts,
  locationFont, onLocationFont,
  namesFont, onNamesFont,
  eventFont, onEventFont,
  taglineFont, onTaglineFont,
}: Props) {
  const [address, setAddress] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const debounceRef = useRef<number | null>(null);

  // Debounced autocomplete — same 300 ms debounce as city-map. Nominatim's
  // usage policy is 1 req/sec; this keeps us comfortably under.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = address.trim();
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

  async function pickSuggestion(s: AddressSuggestion) {
    setShowSuggestions(false);
    setAddress(s.label);
    setLocalError(null);
    if (!locationLabel.trim()) onLocationLabel(s.label.split(',')[0]);
    onLocationResolved({ lat: s.lat, lng: s.lng, label: s.label });
  }

  async function pickQuickCity(c: { name: string; query: string }) {
    setShowSuggestions(false);
    setAddress(c.query);
    setResolving(true);
    setLocalError(null);
    try {
      const g = await geocodeAddress(c.query);
      if (!g.ok) { setLocalError(g.error); return; }
      onLocationLabel(c.name.toUpperCase());
      onLocationResolved({ lat: g.lat, lng: g.lng, label: g.label });
    } finally {
      setResolving(false);
    }
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
        onLocationResolved({ lat: la, lng: lo, label: locationLabel || trimmed });
      } else {
        const g = await geocodeAddress(trimmed);
        if (!g.ok) { setLocalError(g.error); return; }
        if (!locationLabel.trim()) onLocationLabel(g.label.split(',')[0]);
        onLocationResolved({ lat: g.lat, lng: g.lng, label: g.label });
      }
    } finally {
      setResolving(false);
    }
  }

  const tzHours = tzOffsetMin / 60;
  const tzLabel = (tzHours >= 0 ? '+' : '') + tzHours.toFixed(tzHours % 1 === 0 ? 0 : 1);

  return (
    <div style={{ padding: '20px 22px', display: 'grid', gap: 14 }}>
      <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-magenta)' }}>
        Make your star map
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
              disabled={resolving || !address.trim()}
              style={{ padding: '10px 16px', background: 'var(--pv-ink)', color: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: resolving ? 'wait' : 'pointer', opacity: resolving ? 0.6 : 1 }}
            >
              {resolving ? 'Loading…' : 'Find'}
            </button>
          </div>
        </label>

        {showSuggestions && suggestions.length > 0 && !resolving && (
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

        {localError && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: '#c00' }}>{localError}</div>
        )}
        {!localError && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>
            {lat != null && lng != null
              ? `✦ ${lat.toFixed(4)}, ${lng.toFixed(4)}`
              : 'Pick a suggestion as you type, or hit Enter to search.'}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)', alignSelf: 'center' }}>
          Quick pick:
        </span>
        {QUICK_CITIES.map((c) => (
          <button
            key={c.name}
            type="button"
            disabled={resolving}
            onClick={() => void pickQuickCity(c)}
            style={{ padding: '5px 10px', background: '#fff', color: 'var(--pv-ink)', border: '1.5px solid var(--pv-ink)', fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: resolving ? 'wait' : 'pointer', opacity: resolving ? 0.6 : 1 }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Date + time pickers — local-time inputs, parent converts to UTC
          using tzOffsetMin before passing to buildStarMapScene. */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            Date
          </span>
          <input
            type="date" value={dateIso}
            onChange={(e) => onDateIso(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            Time
          </span>
          <input
            type="time" value={timeHm}
            onChange={(e) => onTimeHm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
            UTC offset
          </span>
          <input
            type="number" step={0.5} value={tzHours}
            onChange={(e) => onTzOffsetMin(Math.round(parseFloat(e.target.value || '0') * 60))}
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
      </div>
      <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)', marginTop: -8 }}>
        Date and time are LOCAL to where the moment happened. Current offset:
        UTC{tzLabel}{Math.abs(tzHours - new Date().getTimezoneOffset() / -60) < 0.01
          ? ' (matches your browser)'
          : ''}.
      </div>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          Location label (big text)
        </span>
        <input
          type="text" value={locationLabel}
          onChange={(e) => onLocationLabel(e.target.value.slice(0, 30))}
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
            Event / moment
          </span>
          <input
            type="text" value={event}
            onChange={(e) => onEvent(e.target.value.slice(0, 40))}
            placeholder="THE NIGHT WE MET"
            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
          />
        </label>
      </div>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 11, fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)' }}>
          Tagline (italic, under location)
        </span>
        <input
          type="text" value={tagline}
          onChange={(e) => onTagline(e.target.value.slice(0, 60))}
          placeholder="Under our stars"
          style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '2px solid var(--pv-ink)', fontFamily: 'var(--pv-f-body)', fontSize: 14 }}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox" checked={showLines}
            onChange={(e) => onShowLines(e.target.checked)}
            style={{ accentColor: 'var(--pv-magenta)' }}
          />
          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-ink)' }}>
            Connect the constellations with thin foil lines
          </span>
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox" checked={showLabels}
            onChange={(e) => onShowLabels(e.target.checked)}
            style={{ accentColor: 'var(--pv-magenta)' }}
          />
          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-ink)' }}>
            Label the brightest named stars
          </span>
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox" checked={showCoords}
            onChange={(e) => onShowCoords(e.target.checked)}
            style={{ accentColor: 'var(--pv-magenta)' }}
          />
          <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-ink)' }}>
            Print the GPS coordinates under the disk
          </span>
        </label>
      </div>

      {allowedFonts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {([
            { label: 'Location font', value: locationFont, onChange: onLocationFont },
            { label: 'Names font',    value: namesFont,    onChange: onNamesFont },
            { label: 'Event font',    value: eventFont,    onChange: onEventFont },
            { label: 'Tagline font',  value: taglineFont,  onChange: onTaglineFont },
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
