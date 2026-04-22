'use client';

// Multi-slot customer form driven by a GiftTemplate's zones_json.
//
// One file picker per image zone + one text input per editable text
// zone. When every required zone has content the parent component's
// onGeneratePreview callback fires with the collected FormData, which
// the server action then decomposes into a per-zone composite render.

import { useMemo, useState } from 'react';
import type {
  GiftTemplate,
  GiftTemplateZone,
  GiftTemplateImageZone,
  GiftTemplateTextZone,
} from '@/lib/gifts/types';

type Props = {
  template: GiftTemplate;
  isWorking: boolean;
  onGeneratePreview: (payload: {
    files: Record<string, File>;
    texts: Record<string, string>;
  }) => void;
  onReset?: () => void;
  currentPreviewUrl?: string | null;
};

function isTextZone(z: GiftTemplateZone): z is GiftTemplateTextZone {
  return (z as GiftTemplateTextZone).type === 'text';
}

export function TemplateMultiSlotForm({ template, isWorking, onGeneratePreview, onReset, currentPreviewUrl }: Props) {
  const zones = template.zones_json ?? [];
  const imageZones = useMemo(
    () => zones.filter((z): z is GiftTemplateImageZone => !isTextZone(z)),
    [zones],
  );
  const editableTextZones = useMemo(
    () =>
      zones.filter(
        (z): z is GiftTemplateTextZone =>
          isTextZone(z) && z.editable !== false,
      ),
    [zones],
  );

  const [files, setFiles] = useState<Record<string, File>>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  // Prefill every editable text zone with its default_text so the
  // customer can submit without typing when defaults are acceptable.
  const initialTexts = useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const z of editableTextZones) out[z.id] = z.default_text ?? '';
    return out;
  }, [editableTextZones]);
  const [texts, setTexts] = useState<Record<string, string>>(initialTexts);

  function pickFile(zoneId: string, file: File | null) {
    if (!file) return;
    setFiles((prev) => ({ ...prev, [zoneId]: file }));
    const reader = new FileReader();
    reader.onload = () => {
      setThumbs((prev) => ({ ...prev, [zoneId]: String(reader.result ?? '') }));
    };
    reader.readAsDataURL(file);
  }

  function removeFile(zoneId: string) {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[zoneId];
      return next;
    });
    setThumbs((prev) => {
      const next = { ...prev };
      delete next[zoneId];
      return next;
    });
  }

  const filledImageCount = Object.keys(files).length;
  // Require at least the first image zone (typically the hero) so the
  // renderer has SOMETHING to composite. Other image zones fall back
  // to the first-supplied file server-side.
  const canGenerate = filledImageCount > 0 && !isWorking;

  function submit() {
    onGeneratePreview({ files, texts });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Preview at top if present */}
      {currentPreviewUrl && (
        <div
          style={{
            background: 'var(--pv-cream)',
            border: '2px solid var(--pv-ink)',
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              border: '2px solid var(--pv-ink)',
              backgroundImage: `url(${currentPreviewUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>Preview ready</div>
            <div
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 10,
                color: 'var(--pv-green)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              ✓ Tweak anything below and regenerate, or add to cart
            </div>
          </div>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
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
              Reset
            </button>
          )}
        </div>
      )}

      {/* Image zones */}
      {imageZones.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--pv-ink)',
              marginBottom: 8,
            }}
          >
            Photos ({filledImageCount}/{imageZones.length})
          </div>
          <div
            style={{
              display: 'grid',
              gap: 8,
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            }}
          >
            {imageZones.map((z, i) => {
              const thumb = thumbs[z.id];
              const file = files[z.id];
              return (
                <label
                  key={z.id}
                  style={{
                    display: 'block',
                    background: thumb ? '#fff' : 'var(--pv-cream)',
                    border: thumb ? '2px solid var(--pv-green)' : '2px dashed var(--pv-rule)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: `${z.width_mm} / ${z.height_mm}`,
                      backgroundImage: thumb ? `url(${thumb})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--pv-muted)',
                    }}
                  >
                    {!thumb && (
                      <span
                        style={{
                          fontFamily: 'var(--pv-f-mono)',
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: 8,
                          textAlign: 'center',
                        }}
                      >
                        + {z.label || `Photo ${i + 1}`}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      padding: '6px 8px',
                      background: '#fff',
                      borderTop: '1px solid var(--pv-rule)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 10,
                      letterSpacing: '0.04em',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {z.label || `Photo ${i + 1}`}
                    </span>
                    {file && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); removeFile(z.id); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--pv-magenta)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) pickFile(z.id, f);
                      e.target.value = '';
                    }}
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Editable text zones */}
      {editableTextZones.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--pv-ink)',
              marginBottom: 8,
            }}
          >
            Text
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {editableTextZones.map((z) => (
              <label key={z.id} style={{ display: 'block' }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 10,
                    color: 'var(--pv-muted)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {z.label}
                </span>
                <input
                  type="text"
                  value={texts[z.id] ?? ''}
                  placeholder={z.placeholder ?? z.default_text ?? ''}
                  maxLength={z.max_chars ?? 200}
                  onChange={(e) => setTexts((prev) => ({ ...prev, [z.id]: e.target.value }))}
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
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canGenerate}
        onClick={submit}
        style={{
          padding: '12px 20px',
          background: canGenerate ? 'var(--pv-magenta)' : 'var(--pv-rule)',
          color: '#fff',
          border: '2px solid var(--pv-ink)',
          fontFamily: 'var(--pv-f-display)',
          fontSize: 14,
          letterSpacing: '-0.01em',
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          boxShadow: canGenerate ? '3px 3px 0 var(--pv-ink)' : 'none',
        }}
      >
        {isWorking
          ? 'Generating…'
          : currentPreviewUrl
            ? 'Regenerate preview'
            : 'Generate preview'}
      </button>

      {filledImageCount > 0 && filledImageCount < imageZones.length && (
        <div
          style={{
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 10,
            color: 'var(--pv-muted)',
            letterSpacing: '0.04em',
          }}
        >
          Zones without a photo will reuse your first uploaded photo.
        </div>
      )}
    </div>
  );
}
