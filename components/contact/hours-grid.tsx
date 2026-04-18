'use client';

// Client-side hours grid: highlights today's cell in magenta based on
// the visitor's local time, so a Singaporean visiting on Wednesday
// afternoon sees WED tinted pink. Day matching is done by the first
// three letters of day_label (case-insensitive) to stay tolerant of
// admin copy like "Mon" / "MON" / "Monday".

import { useEffect, useState } from 'react';

export type HoursDay = {
  day_label: string;
  time: string;
  is_closed: boolean;
};

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function HoursGrid({ days }: { days: HoursDay[] }) {
  // todayIdx starts null so server render and first client render match;
  // useEffect swaps it to the real index after hydration.
  const [todayIdx, setTodayIdx] = useState<number | null>(null);

  useEffect(() => {
    const key = DAY_KEYS[new Date().getDay()];
    const idx = days.findIndex((d) => d.day_label.toLowerCase().startsWith(key));
    setTodayIdx(idx >= 0 ? idx : null);
  }, [days]);

  return (
    <div
      className="pv-hours-table"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, 1fr)`, gap: 6 }}
    >
      {days.map((d, i) => {
        const closed = d.is_closed;
        const isToday = i === todayIdx;
        return (
          <div
            key={i}
            aria-current={isToday ? 'date' : undefined}
            style={{
              padding: '14px 4px',
              textAlign: 'center',
              border: isToday ? '2px solid var(--pv-magenta)' : '2px solid rgba(255,255,255,0.15)',
              background: isToday ? 'var(--pv-magenta)' : 'rgba(255,255,255,0.04)',
              opacity: closed ? 0.45 : 1,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isToday ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                marginBottom: 6,
                fontWeight: 700,
              }}
            >
              {isToday ? 'Today' : d.day_label}
            </div>
            <div
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 14,
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
                color: isToday ? '#fff' : undefined,
              }}
            >
              {closed ? 'Closed' : d.time}
            </div>
          </div>
        );
      })}
    </div>
  );
}
