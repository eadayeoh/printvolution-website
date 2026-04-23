'use client';

// Multi-surface configurator for a variant. When the selected variant
// has a non-empty `surfaces` array (e.g. a 3D bar keychain's 4 sides),
// the customer sees:
//   - One input per surface (text / photo / both, per surface.accepts)
//   - A tabbed live preview at the top showing the chosen surface's
//     mockup with the customer's input overlayed at mockup_area
//
// Keeps internal state shallow: the parent owns the record of
// "surfaceId → { text?: string; photo?: File; thumbUrl?: string }"
// and feeds it in as `state`, so cart + generate flows can read it.

import { useEffect, useRef, useState } from 'react';
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
};

export function GiftVariantSurfaces({ surfaces, fills, onChange }: Props) {
  const [activeId, setActiveId] = useState(surfaces[0]?.id ?? '');
  useEffect(() => {
    if (!surfaces.find((s) => s.id === activeId)) {
      setActiveId(surfaces[0]?.id ?? '');
    }
  }, [surfaces, activeId]);
  const activeSurface = surfaces.find((s) => s.id === activeId) ?? surfaces[0];

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
      {/* Tabbed mockup preview (the chosen side) */}
      {activeSurface && (
        <div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            {surfaces.map((s) => {
              const active = s.id === activeId;
              const fill = fills[s.id];
              const filled = Boolean(fill?.text?.trim() || fill?.photoThumb);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  style={{
                    background: active ? 'var(--pv-ink)' : '#fff',
                    color: active ? '#fff' : 'var(--pv-ink)',
                    border: '2px solid var(--pv-ink)',
                    padding: '6px 12px',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {s.label}
                  {filled && <span style={{ color: active ? 'var(--pv-yellow)' : 'var(--pv-green)' }}>✓</span>}
                </button>
              );
            })}
          </div>
          <SurfacePreview surface={activeSurface} fill={fills[activeSurface.id] ?? {}} />
        </div>
      )}

      {/* Per-surface input row */}
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

/** One mockup with the customer's text / photo overlayed at
 *  surface.mockup_area. Uses CSS positioning — no canvas here because
 *  the big LIVE PREVIEW up top is for presentation quality, and the
 *  server composite is what actually gets printed. */
function SurfacePreview({ surface, fill }: { surface: GiftVariantSurface; fill: SurfaceFill }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerW, setContainerW] = useState(400);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const area = surface.mockup_area;
  const areaPx = {
    w: (area.width / 100) * containerW,
    h: (area.height / 100) * containerW,
  };
  const text = (fill.text ?? '').trim();
  const photo = fill.photoThumb;

  // Text sizing: default to ~70% of the area height if no font_size_pct
  // set on the surface, otherwise use the admin-provided percentage.
  const fontPx = Math.max(
    8,
    ((surface.font_size_pct ?? 70) / 100) * areaPx.h * 0.5,
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        background: 'var(--pv-cream)',
        border: '2px solid var(--pv-ink)',
        overflow: 'hidden',
      }}
    >
      {surface.mockup_url && (
        <img
          src={surface.mockup_url}
          alt={surface.label}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      {photo && (
        <img
          src={photo}
          alt=""
          style={{
            position: 'absolute',
            left: `${area.x}%`,
            top: `${area.y}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
            objectFit: 'cover',
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      )}
      {text && (
        <div
          style={{
            position: 'absolute',
            left: `${area.x}%`,
            top: `${area.y}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: surface.font_family ?? 'var(--pv-f-display)',
              fontSize: fontPx,
              fontWeight: 600,
              color: surface.color ?? '#0a0a0a',
              textAlign: 'center',
              lineHeight: 1.1,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}
          >
            {text}
          </span>
        </div>
      )}
    </div>
  );
}
