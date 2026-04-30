'use client';

/**
 * Compact "additional cities" form for multi-anchor city-map templates
 * (Three Circles, Heart Pair, Circle + photos). The PRIMARY location
 * stays in the existing CityMapInputs above; this component handles
 * locations 2..N. Each row geocodes the city via OSM Nominatim and
 * fetches OSM road/water vectors so the live preview can render the
 * disc immediately, same flow as the primary location.
 */

import { useRef, useState } from 'react';
import { geocodeAddress, fetchCityMapPaths } from '@/app/(site)/gift/actions';
import type { CityMapVectors } from '@/lib/gifts/city-map-svg';

export type ExtraCityLocation = {
  lat: number | null;
  lng: number | null;
  label: string;
  vectors: CityMapVectors | null;
  caption: string;
};

type Props = {
  extras: ExtraCityLocation[];
  onChange: (next: ExtraCityLocation[]) => void;
};

export function ExtraCityLocationsInputs({ extras, onChange }: Props) {
  return (
    <div style={{
      marginTop: 18,
      padding: 14,
      background: '#fafaf7',
      border: '1px solid #e8e2d3',
      borderRadius: 8,
    }}>
      <div style={{
        fontFamily: 'var(--pv-f-mono)', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 1, color: 'var(--pv-ink)',
        marginBottom: 4,
      }}>
        Additional cities ({extras.length})
      </div>
      <p style={{ fontSize: 12, color: 'var(--pv-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Your template has {extras.length + 1} maps. Fill in a city per map below.
        The first map uses the primary location above.
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {extras.map((row, i) => (
          <ExtraRow
            key={i}
            index={i}
            row={row}
            onChange={(patch) => {
              const next = extras.map((r, j) => (j === i ? { ...r, ...patch } : r));
              onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ExtraRow({
  index, row, onChange,
}: {
  index: number;
  row: ExtraCityLocation;
  onChange: (patch: Partial<ExtraCityLocation>) => void;
}) {
  const [query, setQuery] = useState(row.label);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Monotonic sequence id so a slow earlier resolve can't clobber the
  // result of a later one (customer types City A, hits Resolve,
  // changes mind, types City B, hits Resolve — A's stale vectors
  // mustn't land in state on top of B).
  const seqRef = useRef(0);

  async function resolve() {
    const q = query.trim();
    if (!q) { setErr('Type a city or address'); return; }
    setErr(null);
    setBusy(true);
    const mySeq = ++seqRef.current;
    try {
      const geo = await geocodeAddress(q);
      if (mySeq !== seqRef.current) return; // a later resolve raced us
      if (!geo.ok) { setErr(geo.error ?? 'Could not find that place'); return; }
      const lat = geo.lat;
      const lng = geo.lng;
      const label = geo.label.split(',')[0];
      const vec = await fetchCityMapPaths(lat, lng, 3);
      if (mySeq !== seqRef.current) return;
      if (!vec.ok) { setErr(vec.error ?? 'Map fetch failed'); return; }
      onChange({ lat, lng, label, vectors: vec.vectors });
    } finally {
      if (mySeq === seqRef.current) setBusy(false);
    }
  }

  return (
    <div style={{
      display: 'grid', gap: 8,
      gridTemplateColumns: 'auto 1fr auto auto',
      alignItems: 'center',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 24, height: 24, borderRadius: '50%',
        background: 'var(--pv-magenta)', color: '#fff',
        fontSize: 11, fontWeight: 700,
      }}>{index + 2}</span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="City or address (e.g. Paris)"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); resolve(); } }}
        style={{
          padding: '8px 10px',
          border: '1.5px solid var(--pv-ink)',
          background: '#fff',
          fontSize: 13, fontFamily: 'inherit', minWidth: 0,
        }}
      />
      <input
        type="text"
        value={row.caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Caption (e.g. Engaged)"
        style={{
          padding: '8px 10px',
          border: '1.5px solid var(--pv-ink)',
          background: '#fff',
          fontSize: 12, fontFamily: 'inherit', width: 140,
        }}
      />
      <button
        type="button"
        onClick={resolve}
        disabled={busy}
        style={{
          padding: '8px 14px',
          border: '1.5px solid var(--pv-ink)',
          background: row.vectors ? 'var(--pv-ink)' : '#fff',
          color: row.vectors ? '#fff' : 'var(--pv-ink)',
          fontSize: 11, fontFamily: 'inherit', fontWeight: 700,
          letterSpacing: 0.4, textTransform: 'uppercase',
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? '…' : row.vectors ? '✓ Set' : 'Resolve'}
      </button>
      {err && (
        <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#c00' }}>{err}</div>
      )}
    </div>
  );
}
