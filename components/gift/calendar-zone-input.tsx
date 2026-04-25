'use client';

// Customer-facing picker for a calendar zone. Three controls in one
// row: month dropdown, year dropdown, and a clickable day grid. Tap a
// day to highlight; tap again to clear.
//
// Pure controlled component — the parent owns `fill` and reacts to
// onChange. State stays at the form level so cart submission is
// straightforward.

import type { GiftTemplateCalendarZone } from '@/lib/gifts/types';
import { daysInMonth, resolveCalendarFill, type CalendarFill } from '@/lib/gifts/pipeline/calendar-svg';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Props = {
  zone: GiftTemplateCalendarZone;
  fill: Partial<CalendarFill> | undefined;
  onChange: (next: CalendarFill) => void;
  /** Current year to anchor the year dropdown range. Defaults to
   *  current calendar year; injectable for tests. */
  now?: Date;
};

export function CalendarZoneInput({ zone, fill, onChange, now = new Date() }: Props) {
  const resolved = resolveCalendarFill(zone, fill, now);
  const thisYear = now.getFullYear();
  // Five years back, ten forward — covers most "anniversary" /
  // "birthday" gift scenarios. Admin can extend if needed in v2.
  const yearOptions: number[] = [];
  for (let y = thisYear - 5; y <= thisYear + 10; y++) yearOptions.push(y);

  const dim = daysInMonth(resolved.month, resolved.year);
  const days = Array.from({ length: dim }, (_, i) => i + 1);

  function set(patch: Partial<CalendarFill>) {
    onChange({ ...resolved, ...patch });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <label style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)',
            marginBottom: 4,
          }}>
            Month
          </div>
          <select
            value={resolved.month}
            onChange={(e) => set({ month: Number(e.target.value) })}
            style={selectStyle}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </label>
        <label style={{ width: 110 }}>
          <div style={{
            fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)',
            marginBottom: 4,
          }}>
            Year
          </div>
          <select
            value={resolved.year}
            onChange={(e) => set({ year: Number(e.target.value) })}
            style={selectStyle}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div style={{
          fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-muted)',
          marginBottom: 6,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span>Highlight a day</span>
          {resolved.highlightedDay !== null && (
            <button
              type="button"
              onClick={() => set({ highlightedDay: null })}
              style={{
                background: 'transparent', border: 'none',
                fontFamily: 'var(--pv-f-mono)', fontSize: 9,
                fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--pv-magenta)',
                cursor: 'pointer', padding: '0 4px',
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
        }}>
          {days.map((d) => {
            const active = resolved.highlightedDay === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => set({ highlightedDay: active ? null : d })}
                style={{
                  background: active ? 'var(--pv-magenta)' : '#fff',
                  color: active ? '#fff' : 'var(--pv-ink)',
                  border: '2px solid var(--pv-ink)',
                  padding: '6px 0',
                  fontFamily: 'var(--pv-f-mono)',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '2px solid var(--pv-ink)',
  background: '#fff',
  fontFamily: 'var(--pv-f-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--pv-ink)',
  outline: 'none',
};
