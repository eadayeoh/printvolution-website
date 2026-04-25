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
import { GIFT_FONT_FAMILIES } from '@/lib/gifts/types';
import type { CalendarFill } from '@/lib/gifts/pipeline/calendar-svg';
import { CalendarZoneInput } from './calendar-zone-input';

type Props = {
  template: GiftTemplate;
  isWorking: boolean;
  onGeneratePreview: (payload: {
    files: Record<string, File>;
    texts: Record<string, string>;
    textColors: Record<string, string>;
    textFonts: Record<string, string>;
    calendars: Record<string, CalendarFill>;
    calendarColors: Record<string, string>;
    foregroundColor: string | null;
    backgroundColor: string | null;
  }) => void;
  /** Fires whenever the customer's in-progress zone content changes so
   *  the parent can render a live layout preview before the server
   *  composite runs. */
  onStateChange?: (state: {
    thumbs: Record<string, string>;
    texts: Record<string, string>;
    textColors: Record<string, string>;
    textFonts: Record<string, string>;
    calendars: Record<string, CalendarFill>;
    calendarColors: Record<string, string>;
    foregroundColor: string | null;
    backgroundColor: string | null;
  }) => void;
  onReset?: () => void;
  currentPreviewUrl?: string | null;
  /** When true, hide the Generate button and fire onGeneratePreview
   *  silently (debounced) whenever the zones are filled. Used for
   *  non-AI modes where the server composite matches the CSS preview. */
  autoGenerate?: boolean;
  /** Pre-fill the form's text / colour / font / calendar state from a
   *  saved design draft. Applied on mount only — subsequent changes
   *  flow through the normal setters + onStateChange. */
  initialState?: {
    texts?: Record<string, string>;
    textColors?: Record<string, string>;
    textFonts?: Record<string, string>;
    calendars?: Record<string, CalendarFill>;
    calendarColors?: Record<string, string>;
    foregroundColor?: string | null;
    backgroundColor?: string | null;
  };
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
  initialState,
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
  const [calendars, setCalendars] = useState<Record<string, CalendarFill>>(initialState?.calendars ?? {});
  // Customer-overridable calendar colour per zone. Single colour
  // overrides the zone's grid_color + header_color (the highlight
  // shape colour stays admin-controlled so it reads as an accent).
  const [calendarColors, setCalendarColors] = useState<Record<string, string>>(initialState?.calendarColors ?? {});
  // One hidden <input type="file"> per image zone. We store refs so the
  // "+ Label" empty-state div can open the picker programmatically —
  // clicking a filled slot is a no-op (only the X button removes).
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // Prefill every editable text zone with its default_text so the
  // customer can submit without typing when defaults are acceptable.
  const initialTexts = useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const z of editableTextZones) out[z.id] = z.default_text ?? '';
    // Saved-draft restore: customer's last-typed values win over template defaults.
    if (initialState?.texts) Object.assign(out, initialState.texts);
    return out;
  // initialState is only consulted on mount — re-running this when
  // it changes would clobber in-progress typing. Effectively read-once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableTextZones]);
  const [texts, setTexts] = useState<Record<string, string>>(initialTexts);
  // Customer-overridable text color per zone. Only set when the
  // customer explicitly picks a different color than the template's
  // default; missing keys fall through to z.color in the renderer.
  const [textColors, setTextColors] = useState<Record<string, string>>(initialState?.textColors ?? {});
  // Customer-overridable text font family per zone. Stores the
  // GIFT_FONT_FAMILIES key (e.g. 'inter', 'caveat'). Missing keys
  // fall back to z.font_family in the renderer.
  const [textFonts, setTextFonts] = useState<Record<string, string>>(initialState?.textFonts ?? {});
  // Single customer-picked colour applied to the template's foreground
  // PNG via the alpha-mask cascade (icons, heart, progress bar — every
  // pixel of the foreground PNG inherits this colour). null = use the
  // original PNG colours.
  const [foregroundColor, setForegroundColor] = useState<string | null>(initialState?.foregroundColor ?? null);
  // Customer-picked background colour. When set, overrides the
  // template's background_url with a solid fill — both in the live
  // preview and in the server composite.
  const [backgroundColor, setBackgroundColor] = useState<string | null>(initialState?.backgroundColor ?? null);

  useEffect(() => {
    onStateChange?.({ thumbs, texts, textColors, textFonts, calendars, calendarColors, foregroundColor, backgroundColor });
  }, [thumbs, texts, textColors, textFonts, calendars, calendarColors, foregroundColor, backgroundColor, onStateChange]);

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
  const textColorsRef = useRef(textColors);
  textColorsRef.current = textColors;
  const textFontsRef = useRef(textFonts);
  textFontsRef.current = textFonts;
  const foregroundColorRef = useRef(foregroundColor);
  foregroundColorRef.current = foregroundColor;
  const backgroundColorRef = useRef(backgroundColor);
  backgroundColorRef.current = backgroundColor;
  const calendarsRef = useRef(calendars);
  calendarsRef.current = calendars;
  const calendarColorsRef = useRef(calendarColors);
  calendarColorsRef.current = calendarColors;
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
      onGenRef.current({ files: filesRef.current, texts: textsRef.current, textColors: textColorsRef.current, textFonts: textFontsRef.current, calendars: calendarsRef.current, calendarColors: calendarColorsRef.current, foregroundColor: foregroundColorRef.current, backgroundColor: backgroundColorRef.current });
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
        onGenRef.current({ files: filesRef.current, texts: textsRef.current, textColors: textColorsRef.current, textFonts: textFontsRef.current, calendars: calendarsRef.current, calendarColors: calendarColorsRef.current, foregroundColor: foregroundColorRef.current, backgroundColor: backgroundColorRef.current });
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
    onGeneratePreview({ files, texts, textColors, textFonts, calendars, calendarColors, foregroundColor, backgroundColor });
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
            {editableTextZones.map((z) => {
              const currentColor = textColors[z.id] ?? z.color ?? '#0a0a0a';
              const isOverridden = Boolean(textColors[z.id]) && textColors[z.id] !== z.color;
              return (
                <div key={z.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 10,
                        color: 'var(--pv-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      {z.label}
                    </span>
                    {template.customer_can_recolor && isOverridden && (
                      <button
                        type="button"
                        onClick={() => setTextColors((prev) => {
                          const next = { ...prev };
                          delete next[z.id];
                          return next;
                        })}
                        style={{
                          background: 'transparent', border: 'none',
                          fontFamily: 'var(--pv-f-mono)', fontSize: 9,
                          fontWeight: 700, letterSpacing: '0.06em',
                          textTransform: 'uppercase', color: 'var(--pv-magenta)',
                          cursor: 'pointer', padding: 0,
                        }}
                      >
                        Reset color
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                    <input
                      type="text"
                      value={texts[z.id] ?? ''}
                      placeholder={z.placeholder ?? z.default_text ?? ''}
                      maxLength={z.max_chars ?? 200}
                      onChange={(e) => setTexts((prev) => ({ ...prev, [z.id]: e.target.value }))}
                      style={{
                        flex: 1,
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
                    {template.customer_can_recolor && (
                      <label
                        title="Pick text colour"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '0 10px',
                          border: '2px solid var(--pv-ink)',
                          background: '#fff',
                          cursor: 'pointer',
                          fontFamily: 'var(--pv-f-mono)',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--pv-ink)',
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 18, height: 18,
                            background: currentColor,
                            border: '2px solid var(--pv-ink)',
                            flexShrink: 0,
                          }}
                        />
                        Color
                        <input
                          type="color"
                          value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#000000'}
                          onChange={(e) => setTextColors((prev) => ({ ...prev, [z.id]: e.target.value }))}
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                        />
                      </label>
                    )}
                  </div>
                  {template.customer_can_change_font && (
                    <div style={{ marginTop: 6 }}>
                      <select
                        value={textFonts[z.id] ?? z.font_family ?? 'inter'}
                        onChange={(e) => setTextFonts((prev) => ({ ...prev, [z.id]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '2px solid var(--pv-ink)',
                          background: '#fff',
                          fontFamily: 'var(--pv-f-body)',
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'var(--pv-ink)',
                          outline: 'none',
                        }}
                      >
                        {GIFT_FONT_FAMILIES.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
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
                {template.customer_can_recolor && (() => {
                  const fallback = z.grid_color ?? '#0a0a0a';
                  const currentColor = calendarColors[z.id] ?? fallback;
                  const isOverridden = Boolean(calendarColors[z.id]) && calendarColors[z.id] !== fallback;
                  return (
                    <div style={{ marginTop: 10 }}>
                      <div style={{
                        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                        marginBottom: 4,
                      }}>
                        <span style={{
                          fontFamily: 'var(--pv-f-mono)', fontSize: 10, fontWeight: 800,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          color: 'var(--pv-muted)',
                        }}>
                          Calendar color
                        </span>
                        {isOverridden && (
                          <button
                            type="button"
                            onClick={() => setCalendarColors((prev) => {
                              const next = { ...prev };
                              delete next[z.id];
                              return next;
                            })}
                            style={{
                              background: 'transparent', border: 'none',
                              fontFamily: 'var(--pv-f-mono)', fontSize: 9,
                              fontWeight: 700, letterSpacing: '0.06em',
                              textTransform: 'uppercase', color: 'var(--pv-magenta)',
                              cursor: 'pointer', padding: 0,
                            }}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <label
                        title="Pick the colour for the month name and day numbers"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px',
                          border: '2px solid var(--pv-ink)', background: '#fff',
                          cursor: 'pointer',
                          fontFamily: 'var(--pv-f-mono)', fontSize: 11,
                          fontWeight: 700, color: 'var(--pv-ink)',
                        }}
                      >
                        <span aria-hidden style={{
                          width: 22, height: 22, background: currentColor,
                          border: '2px solid var(--pv-ink)', flexShrink: 0,
                        }} />
                        <span style={{ flex: 1 }}>{currentColor.toUpperCase()}</span>
                        <span style={{ color: 'var(--pv-muted)', fontSize: 9 }}>Click to pick</span>
                        <input
                          type="color"
                          value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#000000'}
                          onChange={(e) => setCalendarColors((prev) => ({ ...prev, [z.id]: e.target.value }))}
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                        />
                      </label>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Background colour — solid fill that sits behind the photos
          and replaces the template's background_url. Only shown when
          admin has opted in via customer_can_recolor. */}
      {template.customer_can_recolor && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--pv-ink)',
              }}
            >
              Background color
            </span>
            {backgroundColor && (
              <button
                type="button"
                onClick={() => setBackgroundColor(null)}
                style={{
                  background: 'transparent', border: 'none',
                  fontFamily: 'var(--pv-f-mono)', fontSize: 9,
                  fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--pv-magenta)',
                  cursor: 'pointer', padding: 0,
                }}
              >
                Reset
              </button>
            )}
          </div>
          <label
            title="Pick the colour for the magnet's background"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              border: '2px solid var(--pv-ink)',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--pv-ink)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 28, height: 28,
                background: backgroundColor ?? 'transparent',
                border: '2px solid var(--pv-ink)',
                flexShrink: 0,
                backgroundImage: backgroundColor ? 'none' : 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 8px 8px',
              }}
            />
            <span style={{ flex: 1 }}>
              {backgroundColor ? backgroundColor.toUpperCase() : 'Default (template background)'}
            </span>
            <span style={{ color: 'var(--pv-muted)', textTransform: 'uppercase', fontSize: 10 }}>
              Click to pick
            </span>
            <input
              type="color"
              value={backgroundColor ?? '#ffffff'}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
          </label>
        </div>
      )}

      {/* Theme colour — single colour applied to the template's
          foreground PNG (icons + heart + progress bar). Only shown
          when the template actually has a foreground asset to recolour
          AND admin has opted in via customer_can_recolor. */}
      {template.foreground_url && template.customer_can_recolor && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--pv-ink)',
              }}
            >
              Theme color
            </span>
            {foregroundColor && (
              <button
                type="button"
                onClick={() => setForegroundColor(null)}
                style={{
                  background: 'transparent', border: 'none',
                  fontFamily: 'var(--pv-f-mono)', fontSize: 9,
                  fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--pv-magenta)',
                  cursor: 'pointer', padding: 0,
                }}
              >
                Reset
              </button>
            )}
          </div>
          <label
            title="Pick the colour for icons, hearts, and the player UI"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              border: '2px solid var(--pv-ink)',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--pv-f-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--pv-ink)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 28, height: 28,
                background: foregroundColor ?? '#0a0a0a',
                border: '2px solid var(--pv-ink)',
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>
              {foregroundColor ? foregroundColor.toUpperCase() : 'Default (template colours)'}
            </span>
            <span style={{ color: 'var(--pv-muted)', textTransform: 'uppercase', fontSize: 10 }}>
              Click to pick
            </span>
            <input
              type="color"
              value={foregroundColor ?? '#0a0a0a'}
              onChange={(e) => setForegroundColor(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
          </label>
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
              ? '✓ Saving your design…'
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
