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
import { maskClipPathCss } from '@/lib/gifts/mask-shapes';
import { MaskShapeDefs } from './mask-shape-defs';
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
  /** Customer-picked text colour overrides, keyed by zone id. Falls
   *  through to z.color when a key is missing. */
  textColors?: Record<string, string>;
  /** Customer-picked font-family overrides, keyed by zone id. Stores
   *  GIFT_FONT_FAMILIES keys; falls through to z.font_family. */
  textFonts?: Record<string, string>;
  /** Customer-picked calendar fills, keyed by zone id. */
  calendars?: Record<string, Partial<CalendarFill>>;
  /** Customer-picked calendar colour overrides, keyed by zone id.
   *  Single colour overrides grid_color + header_color. */
  calendarColors?: Record<string, string>;
  /** Customer-picked foreground tint colour. When set, the template's
   *  foreground PNG renders as an alpha mask filled with this colour
   *  (icons, hearts, progress bar — every opaque pixel inherits it). */
  foregroundColor?: string | null;
  /** Customer-picked background colour. When set, replaces the
   *  template's background_url with a solid fill underneath every
   *  zone. */
  backgroundColor?: string | null;
  /** Real-world canvas dimensions (from the product / variant) so the
   *  preview matches the print aspect — NOT the zones_json 0..200 grid,
   *  which is just percentage coordinates. */
  widthMm: number;
  heightMm: number;
};

export function GiftTemplateLayoutPreview({ template, thumbs, texts, textColors, textFonts, calendars, calendarColors, foregroundColor, backgroundColor, widthMm, heightMm }: Props) {
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
        // Customer's backgroundColor wins over the template's
        // background_url. When neither is set, stay transparent so
        // the wrapper / mockup behind the preview shows through (LED
        // light products, foil prints — empty really means empty).
        background: backgroundColor ?? 'transparent',
        border: '2px solid var(--pv-ink)',
        overflow: 'hidden',
      }}
    >
      <MaskShapeDefs />

      {/* Skip the template background_url when the customer picked
          their own background — solid fill via the wrapper above. */}
      {!backgroundColor && template.background_url && (
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
        const clipPath = content ? maskClipPathCss(img.mask_preset) : undefined;
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
              borderRadius: img.mask_preset ? 0 : `${((img.border_radius_mm ?? 0) / CANVAS_UNITS) * 100}%`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              clipPath,
              WebkitClipPath: clipPath,
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
        foregroundColor ? (
          // Recolour cascade: treat the foreground PNG as an alpha
          // mask, fill the unmasked area with the customer's chosen
          // colour. Works perfectly for monochrome icon PNGs.
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              backgroundColor: foregroundColor,
              maskImage: `url(${template.foreground_url})`,
              maskSize: 'cover',
              maskRepeat: 'no-repeat',
              WebkitMaskImage: `url(${template.foreground_url})`,
              WebkitMaskSize: 'cover',
              WebkitMaskRepeat: 'no-repeat',
              pointerEvents: 'none',
            }}
          />
        ) : (
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
        )
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
                fontFamily: giftFontStack(textFonts?.[z.id] ?? z.font_family),
                fontSize: fontPx,
                fontWeight: z.font_weight ?? '700',
                fontStyle: z.font_style ?? 'normal',
                color: textColors?.[z.id] ?? z.color ?? '#0a0a0a',
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
          colorOverride: calendarColors?.[z.id],
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
