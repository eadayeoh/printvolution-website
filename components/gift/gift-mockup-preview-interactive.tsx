'use client';

/**
 * Interactive live preview: composites the customer's transformed
 * photo onto the mockup image and lets the customer drag / resize
 * the design within admin-defined bounds.
 *
 * Position and size are emitted as percentages of the mockup image
 * so they can be stored on the order line and re-applied by the
 * 300 DPI production pipeline server-side.
 */

import { useEffect, useRef, useState } from 'react';

type Rect = { x: number; y: number; width: number; height: number };

export type TextLayer = {
  text: string;
  /** Position of the text's centre (as % of mockup image). */
  x: number;
  y: number;
  /** Font size as % of mockup-image height. */
  sizePct: number;
  fontFamily: string;
  color: string;
};

export function GiftMockupPreviewInteractive({
  mockupUrl,
  previewUrl,
  area,
  bounds,
  onAreaChange,
  textLayer,
  onTextChange,
}: {
  mockupUrl: string;
  previewUrl: string;
  area: Rect;
  bounds: Rect | null;
  onAreaChange: (next: Rect) => void;
  /** Optional draggable text overlay. Null = no text. */
  textLayer?: TextLayer | null;
  onTextChange?: (next: TextLayer) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<
    | { mode: 'move'; startX: number; startY: number; startArea: Rect }
    | { mode: 'resize'; startX: number; startY: number; startArea: Rect }
    | { mode: 'text'; startX: number; startY: number; startText: TextLayer }
    | null
  >(null);

  // Clamp `area` inside `bounds` (or 0-100 if no bounds). Pure — no
  // DOM dependency, so it's safe to call before the stage mounts.
  function clampInsideBounds(candidate: Rect): Rect {
    const b = bounds ?? { x: 0, y: 0, width: 100, height: 100 };
    // Width/height can't exceed the bounds' width/height.
    const width = Math.max(2, Math.min(candidate.width, b.width));
    const height = Math.max(2, Math.min(candidate.height, b.height));
    // Position must keep the design fully inside the bounds rectangle.
    const x = Math.max(b.x, Math.min(candidate.x, b.x + b.width - width));
    const y = Math.max(b.y, Math.min(candidate.y, b.y + b.height - height));
    return { x, y, width, height };
  }

  useEffect(() => {
    if (!drag) return;
    function pctDelta(clientX: number, clientY: number) {
      const stage = stageRef.current;
      if (!stage) return { dxPct: 0, dyPct: 0 };
      const r = stage.getBoundingClientRect();
      return {
        dxPct: ((clientX - drag!.startX) / r.width) * 100,
        dyPct: ((clientY - drag!.startY) / r.height) * 100,
      };
    }
    function onMove(e: PointerEvent) {
      const { dxPct, dyPct } = pctDelta(e.clientX, e.clientY);
      if (drag!.mode === 'move' && 'startArea' in drag!) {
        onAreaChange(clampInsideBounds({
          x: drag!.startArea.x + dxPct,
          y: drag!.startArea.y + dyPct,
          width: drag!.startArea.width,
          height: drag!.startArea.height,
        }));
      } else if (drag!.mode === 'resize' && 'startArea' in drag!) {
        const ratio = drag!.startArea.height / drag!.startArea.width;
        const newW = Math.max(5, drag!.startArea.width + dxPct);
        const newH = newW * ratio;
        onAreaChange(clampInsideBounds({
          x: drag!.startArea.x,
          y: drag!.startArea.y,
          width: newW,
          height: newH,
        }));
      } else if (drag!.mode === 'text' && 'startText' in drag! && onTextChange) {
        const b = bounds ?? { x: 0, y: 0, width: 100, height: 100 };
        const nx = Math.max(b.x, Math.min(b.x + b.width, drag!.startText.x + dxPct));
        const ny = Math.max(b.y, Math.min(b.y + b.height, drag!.startText.y + dyPct));
        onTextChange({ ...drag!.startText, x: nx, y: ny });
      }
    }
    function onUp() { setDrag(null); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  function startMove(e: React.PointerEvent) {
    e.preventDefault();
    setDrag({ mode: 'move', startX: e.clientX, startY: e.clientY, startArea: { ...area } });
  }
  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ mode: 'resize', startX: e.clientX, startY: e.clientY, startArea: { ...area } });
  }

  const canAdjust = !!bounds;

  return (
    <div
      ref={stageRef}
      style={{
        position: 'relative',
        background: '#fafaf7',
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid #0a0a0a',
        userSelect: 'none',
        touchAction: 'none',
        containerType: 'size',
      }}
    >
      <img
        src={mockupUrl}
        alt=""
        draggable={false}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
      {/* Bounds guide + label — explains what the dashed box is */}
      {bounds && (
        <>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: `${bounds.x}%`,
              top: `${bounds.y}%`,
              width: `${bounds.width}%`,
              height: `${bounds.height}%`,
              border: '1.5px dashed rgba(10,10,10,0.35)',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: `${bounds.x}%`,
              top: `calc(${bounds.y}% - 22px)`,
              display: 'inline-block',
              padding: '3px 8px',
              background: '#0a0a0a',
              color: '#fff',
              fontFamily: 'var(--pv-f-mono, monospace)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            ⤢ Safe zone · drag your photo inside
          </div>
        </>
      )}
      {/* Customer's design — draggable */}
      <div
        onPointerDown={canAdjust ? startMove : undefined}
        style={{
          position: 'absolute',
          left: `${area.x}%`,
          top: `${area.y}%`,
          width: `${area.width}%`,
          height: `${area.height}%`,
          cursor: canAdjust ? (drag?.mode === 'move' ? 'grabbing' : 'grab') : 'default',
          mixBlendMode: 'multiply',
          backgroundImage: `url(${previewUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          outline: canAdjust ? '2px solid rgba(233,30,140,0.6)' : undefined,
          outlineOffset: 1,
          transition: drag ? undefined : 'outline-color 0.2s',
        }}
      >
        {canAdjust && (
          <div
            onPointerDown={startResize}
            aria-label="Drag to resize"
            style={{
              position: 'absolute',
              right: -6,
              bottom: -6,
              width: 14,
              height: 14,
              background: '#E91E8C',
              border: '2px solid #fff',
              borderRadius: 2,
              cursor: 'nwse-resize',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        )}
      </div>
      {/* Customer's text — draggable */}
      {textLayer && textLayer.text.trim() && (
        <div
          onPointerDown={(e) => {
            if (!onTextChange) return;
            e.preventDefault();
            e.stopPropagation();
            setDrag({ mode: 'text', startX: e.clientX, startY: e.clientY, startText: { ...textLayer } });
          }}
          style={{
            position: 'absolute',
            left: `${textLayer.x}%`,
            top: `${textLayer.y}%`,
            transform: 'translate(-50%, -50%)',
            cursor: onTextChange ? (drag?.mode === 'text' ? 'grabbing' : 'grab') : 'default',
            fontFamily: textLayer.fontFamily,
            fontSize: `${textLayer.sizePct}cqh`,
            color: textLayer.color,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            textShadow: '0 0 2px rgba(255,255,255,0.5)',
            padding: '2px 6px',
            outline: onTextChange ? '1px dashed rgba(233,30,140,0.6)' : undefined,
            outlineOffset: 2,
            lineHeight: 1,
            pointerEvents: 'auto',
          }}
        >
          {textLayer.text}
        </div>
      )}
    </div>
  );
}
