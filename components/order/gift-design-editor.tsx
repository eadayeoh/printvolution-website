'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveGiftDesignEdits,
  replaceCustomerPhoto,
  revertCustomerPhoto,
} from '@/app/(site)/order/actions';

export type GiftDesignItem = {
  id: string;
  qty: number;
  productName: string;
  variantName: string | null;
  designDirty: boolean;
  hasOriginalBackup: boolean;
  personalisationNotes: string;
  previewUrl: string | null;
  photoEditable: boolean;
  pipelineProvider: string;
};

export function GiftDesignEditor({ token, item }: { token: string; item: GiftDesignItem }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [qty, setQty] = useState(item.qty);
  const [notes, setNotes] = useState(item.personalisationNotes);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const dirty = qty !== item.qty || notes !== item.personalisationNotes;

  function onSave() {
    setErr(null); setOk(null);
    start(async () => {
      const r = await saveGiftDesignEdits(token, {
        lines: [{ id: item.id, qty, personalisation_notes: notes.trim() || null }],
      });
      if (!r.ok) { setErr(r.error); return; }
      setOk('Saved.');
      router.refresh();
    });
  }

  async function onUploadFile(file: File) {
    setErr(null); setOk(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await replaceCustomerPhoto(token, item.id, fd);
      if (!r.ok) { setErr(r.error); return; }
      setOk('Photo replaced. We\'ll re-render before printing.');
      router.refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function onRevert() {
    setErr(null); setOk(null);
    start(async () => {
      const r = await revertCustomerPhoto(token, item.id);
      if (!r.ok) { setErr(r.error); return; }
      setOk('Restored to the original photo.');
      router.refresh();
    });
  }

  return (
    <div style={{
      display: 'grid', gap: 16, gridTemplateColumns: 'minmax(180px, 240px) 1fr',
      padding: 18, background: '#fff', border: '1.5px solid #0a0a0a', borderRadius: 12,
    }}>
      {/* Preview */}
      <div>
        <div style={{
          aspectRatio: '1 / 1', background: '#fafaf7', borderRadius: 8, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {item.previewUrl ? (
            <img src={item.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 12, color: '#888' }}>preview pending</span>
          )}
        </div>
        {item.designDirty && (
          <div style={{
            marginTop: 8, padding: '6px 10px', borderRadius: 6, fontSize: 11,
            background: '#fef3c7', color: '#92400e', fontWeight: 700, textAlign: 'center',
          }}>
            🟠 Edited — re-render pending
          </div>
        )}
      </div>

      {/* Edits */}
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 700, margin: 0, color: '#0a0a0a' }}>
            {item.productName}
          </h3>
          {item.variantName && (
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{item.variantName}</div>
          )}
        </div>

        {/* Photo controls — only when pipeline is AI-free. */}
        {item.photoEditable ? (
          <div style={{ background: '#fafaf7', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Photo
            </div>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 10px', lineHeight: 1.5 }}>
              Upload a different photo (JPG / PNG, up to 20MB). You can revert to the original any time.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                disabled={uploading || pending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadFile(f);
                }}
                style={{ fontSize: 12 }}
              />
              {item.hasOriginalBackup && (
                <button
                  type="button"
                  onClick={onRevert}
                  disabled={uploading || pending}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '6px 12px',
                    border: '1px solid #ddd', borderRadius: 999, background: '#fff',
                    cursor: 'pointer', color: '#0a0a0a',
                  }}
                >
                  ↺ Revert to original
                </button>
              )}
            </div>
            {uploading && <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>Uploading…</div>}
          </div>
        ) : (
          <div style={{
            background: '#fafaf7', borderRadius: 8, padding: 12, fontSize: 12, color: '#666', lineHeight: 1.5,
          }}>
            🔒 The artwork on this gift is AI-generated, so the photo can&rsquo;t be swapped from this page.
            To use a different photo, configure a new design from the gift page (it&rsquo;ll come in as a fresh order).
          </div>
        )}

        {/* Qty */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Quantity
          </label>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            border: '1.5px solid #0a0a0a', borderRadius: 999, overflow: 'hidden', background: '#fff',
          }}>
            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}
              style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>−</button>
            <input
              type="number"
              min={1}
              max={999}
              value={qty}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') { setQty(1); return; }
                const n = parseInt(raw, 10);
                if (!Number.isFinite(n)) return;
                setQty(Math.max(1, Math.min(999, n)));
              }}
              aria-label="Quantity"
              style={{
                width: 50, height: 32, border: 'none', outline: 'none',
                textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#0a0a0a',
                background: 'transparent', MozAppearance: 'textfield',
              }}
            />
            <button type="button" onClick={() => setQty(Math.min(999, qty + 1))}
              style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>+</button>
          </div>
        </div>

        {/* Notes — text fields here are free since they're rendered as
            overlays at production time, not by AI. */}
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Text / personalisation
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            rows={3}
            style={{
              width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e5e5',
              fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
            }}
            placeholder="Names, dates, message, anything you want engraved or printed."
          />
        </label>

        {err && <div style={{ fontSize: 12, color: '#dc2626' }}>{err}</div>}
        {ok && <div style={{ fontSize: 12, color: '#15803d' }}>{ok}</div>}

        <button
          type="button"
          onClick={onSave}
          disabled={pending || uploading || !dirty}
          style={{
            padding: '10px 18px', borderRadius: 999,
            background: !dirty ? '#ccc' : '#E91E8C', color: '#fff',
            fontWeight: 800, fontSize: 12, letterSpacing: 0.3, border: 'none',
            cursor: pending || uploading || !dirty ? 'not-allowed' : 'pointer',
            justifySelf: 'start',
          }}
        >
          {pending ? 'Saving…' : dirty ? 'Save text + qty' : 'Saved'}
        </button>
      </div>
    </div>
  );
}
