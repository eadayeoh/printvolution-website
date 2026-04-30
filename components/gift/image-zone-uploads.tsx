'use client';

/**
 * Multi-photo upload form for renderer-driven templates that carry
 * one or more `image` zones (heart-pair photo, polaroid strip,
 * sky+photo pair). Each zone gets its own file input + thumbnail
 * preview. The actual upload to gift-sources happens at cart-add
 * time so we don't burn storage on uploads the customer abandons.
 */

import type { GiftTemplateZone } from '@/lib/gifts/types';

export type ImageZoneFill = {
  file: File | null;
  previewUrl: string | null;
  assetId: string | null;
};

type Props = {
  zones: GiftTemplateZone[] | null | undefined;
  fills: Record<string, ImageZoneFill>;
  onChange: (next: Record<string, ImageZoneFill>) => void;
};

export function ImageZoneUploads({ zones, fills, onChange }: Props) {
  // URL lifecycle is owned by the parent — this component used to revoke
  // its minted blob URLs on unmount, but the form unmounts whenever the
  // customer picks a template with no image zones, leaving the parent
  // holding revoked URLs in `fills`. The parent now revokes on
  // template change and on its own unmount.
  const imageZones = (zones ?? []).filter((z) => z.type === 'image');
  if (imageZones.length === 0) return null;

  function setFile(zoneId: string, file: File | null) {
    const prev = fills[zoneId];
    if (prev?.previewUrl) {
      URL.revokeObjectURL(prev.previewUrl);
    }
    if (!file) {
      const next = { ...fills };
      delete next[zoneId];
      onChange(next);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onChange({
      ...fills,
      [zoneId]: { file, previewUrl, assetId: null },
    });
  }

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
        Photos ({imageZones.length})
      </div>
      <p style={{ fontSize: 12, color: 'var(--pv-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
        This template has {imageZones.length} photo {imageZones.length === 1 ? 'spot' : 'spots'}. Upload one image per spot.
      </p>
      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: `repeat(${Math.min(imageZones.length, 3)}, 1fr)`,
      }}>
        {imageZones.map((z) => {
          const fill = fills[z.id];
          return (
            <label
              key={z.id}
              style={{
                display: 'block', cursor: 'pointer',
                border: '1.5px dashed var(--pv-ink)',
                background: fill?.previewUrl ? '#fff' : 'transparent',
                aspectRatio: `${z.width_mm} / ${z.height_mm}`,
                position: 'relative', overflow: 'hidden',
                borderRadius: 4,
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={(e) => setFile(z.id, e.target.files?.[0] ?? null)}
                style={{ display: 'none' }}
              />
              {fill?.previewUrl ? (
                <>
                  <img
                    src={fill.previewUrl}
                    alt=""
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', display: 'block',
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(z.id, null);
                    }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      padding: '2px 8px', fontSize: 10, fontWeight: 700,
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid var(--pv-ink)',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </>
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 4,
                  fontSize: 11, fontFamily: 'var(--pv-f-mono)',
                  color: 'var(--pv-muted)', textAlign: 'center',
                  padding: 8,
                }}>
                  <span style={{ fontSize: 18 }}>+</span>
                  <span>{z.label || z.id}</span>
                </div>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
