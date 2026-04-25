'use client';

// Multi-slot customer form driven by a GiftTemplate's zones_json.
//
// One file picker per image zone + one text input per editable text
// zone. When every required zone has content the parent component's
// onGeneratePreview callback fires with the collected FormData, which
// the server action then decomposes into a per-zone composite render.

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  GiftTemplate,
  GiftTemplateZone,
  GiftTemplateImageZone,
  GiftTemplateTextZone,
  GiftTemplateCalendarZone,
} from '@/lib/gifts/types';
import type { CalendarFill } from '@/lib/gifts/pipeline/calendar-svg';
import { CalendarZoneInput } from './calendar-zone-input';

type Props = {
  template: GiftTemplate;
  isWorking: boolean;
  onGeneratePreview: (payload: {
    files: Record<string, File>;
    texts: Record<string, string>;
    calendars: Record<string, CalendarFill>;
  }) => void;
  /** Fires whenever the customer's in-progress zone content changes so
   *  the parent can render a live layout preview (dataURLs + text +
   *  calendar fills) before the server composite runs. */
  onStateChange?: (state: {
    thumbs: Record<string, string>;
    texts: Record<string, string>;
    calendars: Record<string, CalendarFill>;
  }) => void;
  onReset?: () => void;
  currentPreviewUrl?: string | null;
  /** When true, hide the Generate button and fire onGeneratePreview
   *  silently (debounced) whenever the zones are filled. Used for
   *  non-AI modes where the server composite matches the CSS preview. */
  autoGenerate?: boolean;
};

function isTextZone(z: GiftTemplateZone): z is GiftTemplateTextZone {
  return (z as GiftTemplateTextZone).type === 'text';
}
function isCalendarZone(z: GiftTemplateZone): z is GiftTemplateCalendarZone {
  return (z as GiftTemplateCalendarZone).type === 'calendar';
}

export function TemplateMultiSlotForm({
  template,
  isWorking,
  onGeneratePreview,
  onStateChange,
  onReset,
  currentPreviewUrl,
  autoGenerate = false,
}: Props) {
  const zones = template.zones_json ?? [];
  const imageZones = useMemo(
    () => zones.filter((z): z is GiftTemplateImageZone => !isTextZone(z) && !isCalendarZone(z)),
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
  const calendarZones = useMemo(
    () => zones.filter((z): z is GiftTemplateCalendarZone => isCalendarZone(z)),
    [zones],
  );

  const [files, setFiles] = useState<Record<string, File>>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [calendars, setCalendars] = useState<Record<string, CalendarFill>>({});
  // One hidden <input type="file"> per image zone. We store refs so the
  // "+ Label" empty-state div can open the picker programmatically —
  // clicking a filled slot is a no-op (only the X button removes).
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // Prefill every editable text zone with its default_text so the
  // customer can submit without typing when defaults are acceptable.
  const initialTexts = useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const z of editableTextZones) out[z.id] = z.default_text ?? '';
    return out;
  }, [editableTextZones]);
  const [texts, setTexts] = useState<Record<string, string>>(initialTexts);

  useEffect(() => {
    onStateChange?.({ thumbs, texts, calendars });
  }, [thumbs, texts, calendars, onStateChange]);

  // Auto-generate: in non-AI modes we want the server composite to run
  // silently as the customer edits, so Add to Cart is always ready.
  // Refs keep the callback + latest state accessible without bloating the
  // debounce effect's dep list.
  const onGenRef = useRef(onGeneratePreview);
  onGenRef.current = onGeneratePreview;
  const filesRef = useRef(files);
  filesRef.current = files;
  const textsRef = useRef(texts);
  textsRef.current = texts;
  const calendarsRef = useRef(calendars);
  calendarsRef.current = calendars;
  const pendingRegenRef = useRef(false);
  const prevWorkingRef = useRef(isWorking);

  // Debounced auto-fire. When a generate is in flight, we set a
  // "pending" flag and re-fire once it finishes (handled in the next
  // effect) so nothing gets dropped.
  useEffect(() => {
    if (!autoGenerate) return;
    if (Object.keys(files).length === 0) return;
    if (isWorking) {
      pendingRegenRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      onGenRef.current({ files: filesRef.current, texts: textsRef.current, calendars: calendarsRef.current });
    }, 800);
    return () => clearTimeout(t);
    // NOTE: deps are FILES ONLY — not text or calendar fills, and not
    // isWorking. Text + calendar changes are reflected instantly via
    // the local layout preview; firing a server-composite roundtrip
    // on every keystroke is wasteful and floods the preview-history
    // strip. The server composite runs once when files arrive (so
    // the cart payload has a real preview asset) and again at
    // add-to-cart time (production resolution). isWorking is omitted
    // to avoid an infinite re-upload loop on the true→false flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, autoGenerate]);

  // When a generate finishes and changes arrived during it, fire once
  // more immediately so the server composite is always up to date.
  useEffect(() => {
    const wasWorking = prevWorkingRef.current;
    prevWorkingRef.current = isWorking;
    if (!autoGenerate) return;
    if (wasWorking && !isWorking && pendingRegenRef.current) {
      pendingRegenRef.current = false;
      if (Object.keys(filesRef.current).length > 0) {
        onGenRef.current({ files: filesRef.current, texts: textsRef.current, calendars: calendarsRef.current });
      }
    }
  }, [isWorking, autoGenerate]);

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
    onGeneratePreview({ files, texts, calendars });
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
              {autoGenerate
                ? '✓ Tweak anything below — saves automatically'
                : '✓ Tweak anything below and regenerate, or add to cart'}
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
              const openPicker = () => inputRefs.current[z.id]?.click();
              return (
                <div
                  key={z.id}
                  style={{
                    display: 'block',
                    background: thumb ? '#fff' : 'var(--pv-cream)',
                    border: thumb ? '2px solid var(--pv-green)' : '2px dashed var(--pv-rule)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {thumb ? (
                    // Filled state: purely visual, zero click handlers.
                    // Only the X button in the footer can remove the
                    // photo. pointer-events: none belt-and-braces against
                    // any stray bubble.
                    <div
                      style={{
                        aspectRatio: `${z.width_mm} / ${z.height_mm}`,
                        backgroundImage: `url(${thumb})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        pointerEvents: 'none',
                      }}
                    />
                  ) : (
                    // Empty state: whole area is the click target for the
                    // file picker. Using <button> over onClick-div so
                    // keyboard / assistive tech can activate it too.
                    <button
                      type="button"
                      onClick={openPicker}
                      style={{
                        aspectRatio: `${z.width_mm} / ${z.height_mm}`,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--pv-muted)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--pv-f-mono)',
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: 8,
                          textAlign: 'center',
                          color: 'var(--pv-muted)',
                        }}
                      >
                        + {z.label || `Photo ${i + 1}`}
                      </span>
                    </button>
                  )}
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
                        onClick={(e) => { e.stopPropagation(); removeFile(z.id); }}
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
                    ref={(el) => { inputRefs.current[z.id] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) pickFile(z.id, f);
                      e.target.value = '';
                    }}
                  />
                </div>
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

      {/* Calendar zones — month / year dropdowns + clickable day grid
          per zone. Each picker is independent so a template can in
          principle host two calendars (separate months). v1 designs
          use only one. */}
      {calendarZones.length > 0 && (
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
            Calendar
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {calendarZones.map((z) => (
              <div key={z.id}>
                {z.label && (
                  <div
                    style={{
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
                  </div>
                )}
                <CalendarZoneInput
                  zone={z}
                  fill={calendars[z.id]}
                  onChange={(next) =>
                    setCalendars((prev) => ({ ...prev, [z.id]: next }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {autoGenerate ? (
        // Status line replaces the Generate button in auto-mode. The
        // server composite runs silently on debounced state changes
        // (see the auto-fire effect above).
        filledImageCount === 0 ? null : (
          <div
            style={{
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isWorking
                ? 'var(--pv-ink)'
                : currentPreviewUrl
                  ? 'var(--pv-green)'
                  : 'var(--pv-muted)',
              padding: '12px 16px',
              background: 'var(--pv-cream)',
              border: '2px solid var(--pv-ink)',
              textAlign: 'center',
            }}
          >
            {isWorking
              ? 'Building preview…'
              : currentPreviewUrl
                ? '✓ Design saved — print-ready file generated when you add to cart'
                : 'Preparing…'}
          </div>
        )
      ) : (
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
      )}

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
