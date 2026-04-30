'use client';

/**
 * Compact "additional sky events" form for multi-anchor star-map
 * templates (Three Circles, Star + photo pair). The PRIMARY event
 * stays in the existing StarMapInputs above; this handles events 2..N.
 *
 * Each row is a (date, time, location) triple — the projection runs
 * client-free from the bundled star catalogue, so there's no fetch.
 */

import { useState } from 'react';
import { geocodeAddress } from '@/app/(site)/gift/actions';

export type ExtraStarEvent = {
  lat: number | null;
  lng: number | null;
  label: string;
  dateIso: string;
  timeHm: string;
  caption: string;
};

type Props = {
  extras: ExtraStarEvent[];
  onChange: (next: ExtraStarEvent[]) => void;
};

export function ExtraStarEventsInputs({ extras, onChange }: Props) {
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
        Additional events ({extras.length})
      </div>
      <p style={{ fontSize: 12, color: 'var(--pv-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Your template has {extras.length + 1} sky charts. Add a date + place per chart below.
        The first chart uses the primary event above.
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
  row: ExtraStarEvent;
  onChange: (patch: Partial<ExtraStarEvent>) => void;
}) {
  const [query, setQuery] = useState(row.label);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function resolve() {
    const q = query.trim();
    if (!q) { setErr('Type a city or address'); return; }
    setErr(null);
    setBusy(true);
    try {
      const geo = await geocodeAddress(q);
      if (!geo.ok) { setErr(geo.error ?? 'Could not find that place'); return; }
      onChange({ lat: geo.lat, lng: geo.lng, label: geo.label.split(',')[0] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      display: 'grid', gap: 8,
      gridTemplateColumns: 'auto 1.4fr 1fr 0.7fr 1fr auto',
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
        placeholder="Place (e.g. Paris)"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); resolve(); } }}
        style={{ padding: '8px 10px', border: '1.5px solid var(--pv-ink)', background: '#fff', fontSize: 13, fontFamily: 'inherit', minWidth: 0 }}
      />
      <input
        type="date"
        value={row.dateIso}
        onChange={(e) => onChange({ dateIso: e.target.value })}
        style={{ padding: '8px 10px', border: '1.5px solid var(--pv-ink)', background: '#fff', fontSize: 13, fontFamily: 'inherit' }}
      />
      <input
        type="time"
        value={row.timeHm}
        onChange={(e) => onChange({ timeHm: e.target.value })}
        style={{ padding: '8px 10px', border: '1.5px solid var(--pv-ink)', background: '#fff', fontSize: 13, fontFamily: 'inherit' }}
      />
      <input
        type="text"
        value={row.caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Caption (e.g. Engaged)"
        style={{ padding: '8px 10px', border: '1.5px solid var(--pv-ink)', background: '#fff', fontSize: 12, fontFamily: 'inherit', minWidth: 0 }}
      />
      <button
        type="button"
        onClick={resolve}
        disabled={busy}
        style={{
          padding: '8px 14px', border: '1.5px solid var(--pv-ink)',
          background: row.lat != null ? 'var(--pv-ink)' : '#fff',
          color: row.lat != null ? '#fff' : 'var(--pv-ink)',
          fontSize: 11, fontFamily: 'inherit', fontWeight: 700,
          letterSpacing: 0.4, textTransform: 'uppercase',
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? '…' : row.lat != null ? '✓' : 'Resolve'}
      </button>
      {err && <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#c00' }}>{err}</div>}
    </div>
  );
}
