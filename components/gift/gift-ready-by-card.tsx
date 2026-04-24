'use client';

import { useEffect, useState } from 'react';

// Business-day math — weekends skipped, public holidays not (lead
// time is a quote, admin bumps the day count to absorb them).
function nextBusinessDay(from: Date): Date {
  const d = new Date(from);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}
function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  return d;
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function DateTile({ label, date, tone }: { label: string; date: Date; tone: 'muted' | 'highlight' }) {
  const isHi = tone === 'highlight';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--pv-f-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: isHi ? 'var(--pv-magenta)' : 'var(--pv-muted, #888)', marginBottom: 6,
      }}>{label}</div>
      <div style={{
        border: `2px solid ${isHi ? 'var(--pv-magenta)' : 'var(--pv-ink)'}`,
        background: isHi ? 'var(--pv-yellow)' : '#fff',
        padding: '6px 10px 8px', display: 'inline-block', minWidth: 80,
      }}>
        <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--pv-ink)' }}>
          {WEEKDAY_SHORT[date.getDay()]}
        </div>
        <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 32, lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--pv-ink)', margin: '2px 0' }}>
          {date.getDate()}
        </div>
        <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--pv-ink)' }}>
          {MONTH_SHORT[date.getMonth()]}
        </div>
      </div>
    </div>
  );
}

export function GiftReadyByCard({ leadTimeDays }: { leadTimeDays: number }) {
  // Defer the date math to after mount so SSR and client render
  // match (today's date differs between the server build and the
  // user's browser otherwise).
  const [readyBy, setReadyBy] = useState<{ today: Date; ready: Date } | null>(null);

  useEffect(() => {
    const today = new Date();
    const jobStart = nextBusinessDay(today);
    const ready = addBusinessDays(jobStart, Math.max(0, leadTimeDays - 1));
    setReadyBy({ today, ready });
  }, [leadTimeDays]);

  if (!readyBy || !leadTimeDays) return null;

  return (
    <div style={{
      border: '2px solid var(--pv-ink)',
      boxShadow: '6px 6px 0 var(--pv-magenta)',
      background: '#fff',
      marginBottom: 14,
    }}>
      <div style={{
        background: 'var(--pv-ink)', color: 'var(--pv-yellow)',
        fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.15em', textTransform: 'uppercase',
        padding: '8px 14px', display: 'flex', justifyContent: 'space-between',
      }}>
        <span>Ready by</span>
        <span style={{ color: '#fff' }}>
          {leadTimeDays} working day{leadTimeDays === 1 ? '' : 's'}
        </span>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 10, padding: '18px 14px',
      }}>
        <DateTile label="Order today" date={readyBy.today} tone="muted" />
        <div aria-hidden style={{ fontFamily: 'var(--pv-f-display)', fontSize: 24, color: 'var(--pv-magenta)', letterSpacing: '-0.05em' }}>→</div>
        <DateTile label="Ready for collection" date={readyBy.ready} tone="highlight" />
      </div>
      <div style={{
        borderTop: '1px dashed var(--pv-rule, #e0dcd0)',
        padding: '10px 14px', fontFamily: 'var(--pv-f-mono)', fontSize: 10,
        color: 'var(--pv-muted, #888)', letterSpacing: '0.06em', textAlign: 'center',
      }}>
        Production clock starts the next working day. Weekends and file revisions add time.
      </div>
    </div>
  );
}
