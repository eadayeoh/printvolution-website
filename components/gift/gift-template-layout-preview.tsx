'use client';

// Client-side layout preview for a GiftTemplate. Renders zones_json on a
// 0..200 canvas using percentage positioning (same math the admin editor
// uses). Each image zone shows the customer's uploaded dataURL if present,
// else the zone's default_image_url, else a dashed placeholder. Text zones
// show the customer's typed text or the zone default. Purely visual — no
// server compositing. Used in the customer-facing LIVE PREVIEW so the
// layout updates the moment a photo is picked.

import type {
  GiftTemplate,
  GiftTemplateZone,
  GiftTemplateImageZone,
  GiftTemplateTextZone,
  GiftTemplateCalendarZone,
} from '@/lib/gifts/types';
import { giftFontStack } from '@/lib/gifts/types';
import { renderCalendarSvg, type CalendarFill } from '@/lib/gifts/pipeline/calendar-svg';
import { useEffect, useRef, useState } from 'react';

const CANVAS_UNITS = 200;

function isTextZone(z: GiftTemplateZone): z is GiftTemplateTextZone {
  return (z as GiftTemplateTextZone).type === 'text';
}
function isCalendarZone(z: GiftTemplateZone): z is GiftTemplateCalendarZone {
  return (z as GiftTemplateCalendarZone).type === 'calendar';
}

type Props = {
  template: GiftTemplate;
  thumbs: Record<string, string>;
  texts: Record<string, string>;
  /** Customer-picked calendar fills, keyed by zone id. */
  calendars?: Record<string, Partial<CalendarFill>>;
  /** Real-world canvas dimensions (from the product / variant) so the
   *  preview matches the print aspect — NOT the zones_json 0..200 grid,
   *  which is just percentage coordinates. */
  widthMm: number;
  heightMm: number;
};

export function GiftTemplateLayoutPreview({ template, thumbs, texts, calendars, widthMm, heightMm }: Props) {
  const zones = template.zones_json ?? [];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerW, setContainerW] = useState(400);

  // Track container pixel width so text zone font-size (authored in mm on
  // a 0..200 canvas) can be translated to a pixel size that tracks
  // responsive resizes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setContainerW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pxPerUnit = containerW / CANVAS_UNITS;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${widthMm} / ${heightMm}`,
        background: '#fafaf7',
        border: '2px solid var(--pv-ink)',
        overflow: 'hidden',
      }}
    >
      {template.background_url && (
        <img
          src={template.background_url}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      )}

      {zones.map((z, i) => {
        if (isTextZone(z) || isCalendarZone(z)) return null;
        const img = z as GiftTemplateImageZone;
        const thumb = thumbs[z.id];
        const content = thumb || img.default_image_url || null;
        const fit = img.fit_mode ?? 'cover';
        return (
          <div
            key={`img-${i}`}
            style={{
              position: 'absolute',
              left: `${(z.x_mm / CANVAS_UNITS) * 100}%`,
              top: `${(z.y_mm / CANVAS_UNITS) * 100}%`,
              width: `${(z.width_mm / CANVAS_UNITS) * 100}%`,
              height: `${(z.height_mm / CANVAS_UNITS) * 100}%`,
              transform: `rotate(${z.rotation_deg ?? 0}deg)`,
              transformOrigin: 'center',
              background: img.bg_color ?? (content ? 'transparent' : 'var(--pv-cream)'),
              border: content ? 'none' : '2px dashed var(--pv-rule)',
              borderRadius: `${((img.border_radius_mm ?? 0) / CANVAS_UNITS) * 100}%`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {content ? (
              <>
                <img
                  src={content}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
                />
                {img.mask_url && (
                  <img
                    src={img.mask_url}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </>
            ) : (
              <span
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--pv-muted)',
                  textAlign: 'center',
                  padding: 6,
                  fontWeight: 700,
                }}
              >
                + {img.label || `Photo ${i + 1}`}
              </span>
            )}
          </div>
        );
      })}

      {template.foreground_url && (
        <img
          src={template.foreground_url}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      )}

      {zones.map((z, i) => {
        if (!isTextZone(z)) return null;
        const t = texts[z.id] ?? z.default_text ?? z.placeholder ?? '';
        if (!t) return null;
        const fontPx = Math.max(6, (z.font_size_mm ?? 14) * pxPerUnit);
        const vAlign = z.vertical_align ?? 'middle';
        return (
          <div
            key={`txt-${i}`}
            style={{
              position: 'absolute',
              left: `${(z.x_mm / CANVAS_UNITS) * 100}%`,
              top: `${(z.y_mm / CANVAS_UNITS) * 100}%`,
              width: `${(z.width_mm / CANVAS_UNITS) * 100}%`,
              height: `${(z.height_mm / CANVAS_UNITS) * 100}%`,
              transform: `rotate(${z.rotation_deg ?? 0}deg)`,
              transformOrigin: 'center',
              display: 'flex',
              overflow: 'hidden',
              justifyContent:
                z.align === 'left' ? 'flex-start' : z.align === 'right' ? 'flex-end' : 'center',
              alignItems:
                vAlign === 'top' ? 'flex-start' : vAlign === 'bottom' ? 'flex-end' : 'center',
              padding: 2,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: giftFontStack(z.font_family),
                fontSize: fontPx,
                fontWeight: z.font_weight ?? '700',
                fontStyle: z.font_style ?? 'normal',
                color: z.color ?? '#0a0a0a',
                textAlign: z.align ?? 'center',
                lineHeight: z.line_height ?? 1.2,
                letterSpacing: `${z.letter_spacing_em ?? 0}em`,
                textTransform: z.text_transform ?? 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxWidth: '100%',
              }}
            >
              {t}
            </span>
          </div>
        );
      })}

      {/* Calendar zones — same generator the server composite will
          use, so what the customer sees here is what gets printed. */}
      {zones.map((z, i) => {
        if (!isCalendarZone(z)) return null;
        const fill = calendars?.[z.id];
        // Render in zone-local CANVAS_UNITS so font_size_mm values
        // sit in the same coordinate space the rest of the editor
        // uses. The wrapping div scales the SVG to its real pixel
        // size via width/height: 100%.
        const svg = renderCalendarSvg({
          zone: z,
          fill,
          width: z.width_mm,
          height: z.height_mm,
        });
        return (
          <div
            key={`cal-${i}`}
            style={{
              position: 'absolute',
              left: `${(z.x_mm / CANVAS_UNITS) * 100}%`,
              top: `${(z.y_mm / CANVAS_UNITS) * 100}%`,
              width: `${(z.width_mm / CANVAS_UNITS) * 100}%`,
              height: `${(z.height_mm / CANVAS_UNITS) * 100}%`,
              transform: `rotate(${z.rotation_deg ?? 0}deg)`,
              transformOrigin: 'center',
              pointerEvents: 'none',
            }}
            dangerouslySetInnerHTML={{ __html: svg.replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ' + z.width_mm + ' ' + z.height_mm + '" preserveAspectRatio="xMidYMid meet">') }}
          />
        );
      })}
    </div>
  );
}
