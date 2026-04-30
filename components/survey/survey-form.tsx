'use client';

import { useState } from 'react';
import { submitNps } from '@/app/(site)/survey/actions';

export function SurveyForm({ token }: { token: string }) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    if (score === null) {
      setErr('Pick a score from 0 to 10.');
      return;
    }
    setErr(null);
    setSubmitting(true);
    const r = await submitNps(token, score, comment.trim() || null);
    setSubmitting(false);
    if (r.ok) setDone(true);
    else setErr(r.error);
  }

  if (done) {
    return (
      <div style={{
        padding: 24, borderRadius: 12, background: '#dcfce7', border: '1px solid #86efac',
        color: '#166534', fontSize: 14, fontWeight: 600, textAlign: 'center',
      }}>
        🙏 Thanks — recorded.
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(11, minmax(0, 1fr))', gap: 6,
      }}>
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            aria-pressed={score === n}
            style={{
              padding: '12px 0', borderRadius: 8, fontWeight: 800, fontSize: 14,
              cursor: 'pointer', transition: 'all 120ms ease-out',
              border: `2px solid ${score === n ? '#E91E8C' : '#e5e5e5'}`,
              background: score === n ? '#E91E8C' : '#fff',
              color: score === n ? '#fff' : '#0a0a0a',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginTop: 6 }}>
        <span>Not likely</span>
        <span>Very likely</span>
      </div>

      <label style={{ display: 'block', marginTop: 28 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 8 }}>
          Anything we should know? (optional)
        </span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          style={{
            width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e5e5',
            fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          }}
          placeholder="What worked, what didn't, anything we missed..."
        />
      </label>

      {err && <div style={{ marginTop: 12, fontSize: 12, color: '#dc2626' }}>{err}</div>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || score === null}
        style={{
          marginTop: 16, padding: '14px 24px', borderRadius: 999,
          background: score === null ? '#ccc' : '#E91E8C', color: '#fff',
          fontWeight: 800, fontSize: 13, letterSpacing: 0.3, border: 'none',
          cursor: submitting || score === null ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  );
}
