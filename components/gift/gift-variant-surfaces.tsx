'use client';

// Multi-surface configurator for a variant. When the selected variant
// has a non-empty `surfaces` array (e.g. a 3D bar keychain's 4 sides),
// the customer gets one input per surface (text / photo / both, per
// surface.accepts). The big LIVE PREVIEW above the configurator shows
// the active face composited — this component owns no preview of its
// own.
//
// Keeps internal state shallow: the parent owns the record of
// "surfaceId → { text?: string; photo?: File; thumbUrl?: string }"
// and feeds it in as `state`, so cart + generate flows can read it.

import { useEffect, useState } from 'react';
import type { GiftVariantSurface } from '@/lib/gifts/types';

export type SurfaceFill = {
  text?: string;
  photoFile?: File;
  photoThumb?: string; // dataURL for instant preview
};

export type SurfaceFillMap = Record<string, SurfaceFill>;

type Props = {
  surfaces: GiftVariantSurface[];
  fills: SurfaceFillMap;
  onChange: (next: SurfaceFillMap) => void;
  /** Controlled active surface id — lifted to the parent so the big
   *  live preview (in the left column) can mirror whichever face the
   *  customer last tapped. Uncontrolled = internal state. */
  activeSurfaceId?: string;
  onActiveSurfaceChange?: (id: string) => void;
};

export function GiftVariantSurfaces({ surfaces, fills, onChange, activeSurfaceId, onActiveSurfaceChange }: Props) {
  const isControlled = typeof activeSurfaceId === 'string';
  const [internalActiveId, setInternalActiveId] = useState(surfaces[0]?.id ?? '');
  const activeId = isControlled ? activeSurfaceId : internalActiveId;
  const setActiveId = (id: string) => {
    if (!isControlled) setInternalActiveId(id);
    onActiveSurfaceChange?.(id);
  };
  useEffect(() => {
    if (isControlled) return;
    if (!surfaces.find((s) => s.id === internalActiveId)) {
      setInternalActiveId(surfaces[0]?.id ?? '');
    }
  }, [surfaces, internalActiveId, isControlled]);

  function updateFill(surfaceId: string, patch: Partial<SurfaceFill>) {
    onChange({ ...fills, [surfaceId]: { ...(fills[surfaceId] ?? {}), ...patch } });
  }
  function pickPhoto(surfaceId: string, file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateFill(surfaceId, { photoFile: file, photoThumb: String(reader.result ?? '') });
    };
    reader.readAsDataURL(file);
  }
  function removePhoto(surfaceId: string) {
    const next = { ...(fills[surfaceId] ?? {}) };
    delete next.photoFile;
    delete next.photoThumb;
    onChange({ ...fills, [surfaceId]: next });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Per-surface input row. The big LIVE PREVIEW above the
          configurator already shows the active face composited; a
          second mini-preview here would only duplicate it (and got
          out of sync when the customer toggled Side 1/Side 2). */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {surfaces.map((s) => {
          const fill = fills[s.id] ?? {};
          const acceptsText = s.accepts === 'text' || s.accepts === 'both';
          const acceptsPhoto = s.accepts === 'photo' || s.accepts === 'both';
          return (
            <div
              key={s.id}
              style={{
                padding: 12,
                border: s.id === activeId ? '2px solid var(--pv-magenta)' : '2px solid var(--pv-rule)',
                background: '#fff',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--pv-ink)',
                  marginBottom: 8,
                }}
              >
                {s.label}
                <span style={{ color: 'var(--pv-muted)', fontWeight: 500, marginLeft: 8 }}>
                  ({s.accepts})
                </span>
              </div>
              {acceptsText && (
                <input
                  type="text"
                  value={fill.text ?? ''}
                  placeholder={`Text for ${s.label.toLowerCase()}`}
                  maxLength={s.max_chars ?? undefined}
                  onChange={(e) => {
                    updateFill(s.id, { text: e.target.value });
                    setActiveId(s.id);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid var(--pv-ink)',
                    background: '#fff',
                    fontFamily: 'var(--pv-f-body)',
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--pv-ink)',
                    outline: 'none',
                  }}
                />
              )}
              {acceptsPhoto && (
                <div style={{ marginTop: acceptsText ? 8 : 0 }}>
                  {fill.photoThumb ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={fill.photoThumb}
                        alt=""
                        style={{ width: 56, height: 56, objectFit: 'cover', border: '2px solid var(--pv-ink)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(s.id)}
                        style={{
                          background: 'var(--pv-ink)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 10px',
                          fontFamily: 'var(--pv-f-mono)',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: 'inline-block',
                        cursor: 'pointer',
                        background: 'var(--pv-cream)',
                        border: '2px dashed var(--pv-magenta)',
                        padding: '8px 14px',
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      + Upload photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { pickPhoto(s.id, f); setActiveId(s.id); }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
              {s.max_chars != null && acceptsText && (
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 10,
                    color: 'var(--pv-muted)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {(fill.text ?? '').length} / {s.max_chars} chars
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

