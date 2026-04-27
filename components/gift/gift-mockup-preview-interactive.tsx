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
  /** Rotation in degrees, -180..180. Defaults to 0 if absent. */
  rotation?: number;
};

export function GiftMockupPreviewInteractive({
  mockupUrl,
  previewUrl,
  area,
  bounds,
  onAreaChange,
  textLayer,
  onTextChange,
  captureMode,
  panMode,
  panOffset,
  onPanOffsetChange,
  figurineLayer,
}: {
  mockupUrl: string;
  previewUrl: string;
  area: Rect;
  bounds: Rect | null;
  onAreaChange: (next: Rect) => void;
  /** Optional draggable text overlay. Null = no text. */
  textLayer?: TextLayer | null;
  onTextChange?: (next: TextLayer) => void;
  /** When true, hide all editor chrome (dashed bounds, safe-zone label,
   *  magenta design outline, resize handle, text dashed outline) so a
   *  DOM snapshot only captures the final composited visual. */
  captureMode?: boolean;
  /** When true the `area` rectangle is locked; customer drags the
   *  photo INSIDE it and `panOffset` (background-position %) updates. */
  panMode?: boolean;
  /** Pan offset % — only meaningful in panMode. */
  panOffset?: { x: number; y: number };
  onPanOffsetChange?: (next: { x: number; y: number }) => void;
  /** Optional figurine overlay composited on top of everything. */
  figurineLayer?: {
    imageUrl: string;
    area: Rect;
  } | null;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<
    | { mode: 'move'; startX: number; startY: number; startArea: Rect }
    | { mode: 'resize'; startX: number; startY: number; startArea: Rect }
    | { mode: 'text'; startX: number; startY: number; startText: TextLayer }
    | { mode: 'pan'; startX: number; startY: number; startOffset: { x: number; y: number } }
    | null
  >(null);
  const effectivePanOffset = panOffset ?? { x: 50, y: 50 };

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
      } else if (drag!.mode === 'pan' && 'startOffset' in drag! && onPanOffsetChange) {
        // Pan mode: dragging the photo translates its background-position
        // within the fixed area. Drag delta is stage-pct; scale by
        // stage/area ratio so a 1-stage-pct pull moves the photo by
        // about 2 area-pct inside an area that's half the stage. Clamp
        // 0-100 so the photo never fully leaves the window.
        const areaWPct = Math.max(area.width, 1);
        const areaHPct = Math.max(area.height, 1);
        const scaledDx = (dxPct / areaWPct) * 100;
        const scaledDy = (dyPct / areaHPct) * 100;
        const nx = Math.max(0, Math.min(100, drag!.startOffset.x - scaledDx));
        const ny = Math.max(0, Math.min(100, drag!.startOffset.y - scaledDy));
        onPanOffsetChange({ x: nx, y: ny });
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

  // Measure the stage width so we can set a reliable font-size for the
  // draggable text overlay (in px, not container queries — those were
  // collapsing the whole preview on some browsers).
  const [stageWidth, setStageWidth] = useState(400);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => setStageWidth(stage.getBoundingClientRect().width || 400);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

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
        width: '100%',
        // Force 1:1 stage to match the admin editor (which forces aspectRatio
        // 1/1). Without this, the customer stage stretches to the image's
        // natural aspect, so an area at e.g. (23.9%, 83.1%) lands on a
        // different physical pixel here than admin saw, and the SAFE ZONE
        // appears in the wrong place.
        aspectRatio: '1 / 1',
      }}
    >
      <img
        src={mockupUrl}
        alt=""
        draggable={false}
        // object-contain matches admin's letterbox behaviour so admin's
        // % coordinates map to the same physical position on the customer
        // preview. Without this the image fills width and overflows
        // height, breaking the area placement.
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {/* Bounds guide + label — explains what the dashed box is */}
      {bounds && !captureMode && !panMode && (
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
      {/* Customer's design — draggable.
          panMode: rectangle locked, photo pans inside via background-position.
          Default (admin-drag) mode: whole rectangle moves + resizes. */}
      <div
        onPointerDown={(e) => {
          if (panMode) {
            if (!onPanOffsetChange) return;
            e.preventDefault();
            setDrag({
              mode: 'pan',
              startX: e.clientX,
              startY: e.clientY,
              startOffset: { ...effectivePanOffset },
            });
          } else if (canAdjust) {
            startMove(e);
          }
        }}
        style={{
          position: 'absolute',
          left: `${area.x}%`,
          top: `${area.y}%`,
          width: `${area.width}%`,
          height: `${area.height}%`,
          cursor: panMode
            ? (drag?.mode === 'pan' ? 'grabbing' : 'grab')
            : canAdjust ? (drag?.mode === 'move' ? 'grabbing' : 'grab') : 'default',
          mixBlendMode: panMode ? 'normal' : 'multiply',
          backgroundImage: `url(${previewUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: panMode
            ? `${effectivePanOffset.x}% ${effectivePanOffset.y}%`
            : 'center',
          outline: !panMode && canAdjust && !captureMode ? '2px solid rgba(233,30,140,0.6)' : undefined,
          outlineOffset: 1,
          transition: drag ? undefined : 'outline-color 0.2s',
          overflow: 'hidden',
        }}
      >
        {!panMode && canAdjust && !captureMode && (
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
      {/* Figurine overlay — non-interactive, composites on top of the
          photo at the admin-configured area. Only present when the
          product has figurine_options enabled + a selection. */}
      {figurineLayer && figurineLayer.imageUrl && (
        <img
          src={figurineLayer.imageUrl}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: `${figurineLayer.area.x}%`,
            top: `${figurineLayer.area.y}%`,
            width: `${figurineLayer.area.width}%`,
            height: `${figurineLayer.area.height}%`,
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      )}
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
            // Centre the text on (x,y) AND apply customer-set rotation. Order
            // matters: translate first to anchor at the centre, then rotate
            // around that anchor.
            transform: `translate(-50%, -50%) rotate(${textLayer.rotation ?? 0}deg)`,
            cursor: onTextChange ? (drag?.mode === 'text' ? 'grabbing' : 'grab') : 'default',
            fontFamily: textLayer.fontFamily,
            fontSize: `${Math.max(10, (textLayer.sizePct / 100) * stageWidth)}px`,
            color: textLayer.color,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            textShadow: '0 0 2px rgba(255,255,255,0.5)',
            padding: '2px 6px',
            outline: onTextChange && !captureMode ? '1px dashed rgba(233,30,140,0.6)' : undefined,
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
