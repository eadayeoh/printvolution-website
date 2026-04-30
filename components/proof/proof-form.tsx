'use client';

import { useState } from 'react';
import { respondToProof } from '@/app/(site)/proof/actions';

export function ProofForm({ token }: { token: string }) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!decision) return;
    if (decision === 'rejected' && !note.trim()) {
      setErr('Tell us briefly what to change so we can fix it.');
      return;
    }
    setErr(null);
    setSubmitting(true);
    const r = await respondToProof(token, decision, note.trim() || null);
    setSubmitting(false);
    if (r.ok) setDone(decision);
    else setErr(r.error);
  }

  if (done) {
    return (
      <div style={{
        padding: 20, borderRadius: 12,
        background: done === 'approved' ? '#dcfce7' : '#fee2e2',
        border: done === 'approved' ? '1px solid #86efac' : '1px solid #fca5a5',
        color: done === 'approved' ? '#166534' : '#991b1b',
        fontSize: 14, fontWeight: 600, textAlign: 'center',
      }}>
        {done === 'approved' ? '✓ Thanks — we\'ll send it to print.' : '↺ Got it — we\'ll be in touch shortly.'}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setDecision('approved')}
          aria-pressed={decision === 'approved'}
          style={{
            padding: '14px 12px', borderRadius: 12, fontWeight: 800, fontSize: 14,
            cursor: 'pointer',
            border: `2px solid ${decision === 'approved' ? '#16a34a' : '#e5e5e5'}`,
            background: decision === 'approved' ? '#dcfce7' : '#fff',
            color: decision === 'approved' ? '#166534' : '#0a0a0a',
          }}
        >
          ✓ Approve
        </button>
        <button
          type="button"
          onClick={() => setDecision('rejected')}
          aria-pressed={decision === 'rejected'}
          style={{
            padding: '14px 12px', borderRadius: 12, fontWeight: 800, fontSize: 14,
            cursor: 'pointer',
            border: `2px solid ${decision === 'rejected' ? '#dc2626' : '#e5e5e5'}`,
            background: decision === 'rejected' ? '#fee2e2' : '#fff',
            color: decision === 'rejected' ? '#991b1b' : '#0a0a0a',
          }}
        >
          Request changes
        </button>
      </div>

      {decision === 'rejected' && (
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 8 }}>
            What needs changing?
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={4}
            style={{
              width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e5e5e5',
              fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
            }}
            placeholder="Move the photo up, change the text, etc."
          />
        </label>
      )}

      {err && <div style={{ marginBottom: 12, fontSize: 12, color: '#dc2626' }}>{err}</div>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting || !decision}
        style={{
          width: '100%', padding: '14px 24px', borderRadius: 999,
          background: !decision ? '#ccc' : '#E91E8C', color: '#fff',
          fontWeight: 800, fontSize: 13, letterSpacing: 0.3, border: 'none',
          cursor: submitting || !decision ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Sending…' : decision === 'rejected' ? 'Send change request' : 'Submit decision'}
      </button>
    </div>
  );
}
