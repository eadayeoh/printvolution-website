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

export function GiftMockupPreviewInteractive({
  mockupUrl,
  previewUrl,
  area,
  bounds,
  onAreaChange,
}: {
  mockupUrl: string;
  previewUrl: string;
  area: Rect;
  bounds: Rect | null;
  onAreaChange: (next: Rect) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<
    | { mode: 'move'; startX: number; startY: number; startArea: Rect }
    | { mode: 'resize'; startX: number; startY: number; startArea: Rect }
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
      if (drag!.mode === 'move') {
        onAreaChange(clampInsideBounds({
          x: drag!.startArea.x + dxPct,
          y: drag!.startArea.y + dyPct,
          width: drag!.startArea.width,
          height: drag!.startArea.height,
        }));
      } else {
        // Resize from the bottom-right handle, maintain aspect ratio
        // of the starting rectangle so photos don't distort.
        const ratio = drag!.startArea.height / drag!.startArea.width;
        const newW = Math.max(5, drag!.startArea.width + dxPct);
        const newH = newW * ratio;
        onAreaChange(clampInsideBounds({
          x: drag!.startArea.x,
          y: drag!.startArea.y,
          width: newW,
          height: newH,
        }));
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
      }}
    >
      <img
        src={mockupUrl}
        alt=""
        draggable={false}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
      {/* Bounds guide — faint dashed outline so customer sees where they can drag */}
      {bounds && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: `${bounds.x}%`,
            top: `${bounds.y}%`,
            width: `${bounds.width}%`,
            height: `${bounds.height}%`,
            border: '1px dashed rgba(10,10,10,0.25)',
            pointerEvents: 'none',
          }}
        />
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
    </div>
  );
}
