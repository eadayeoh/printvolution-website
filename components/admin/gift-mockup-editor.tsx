'use client';

import { useRef, useState, useEffect } from 'react';
import { ImageUpload } from '@/components/admin/image-upload';

// Sample placeholder design used to preview compositing in the editor.
const SAMPLE_DESIGN =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffb3d1"/>
        <stop offset="100%" stop-color="#c4b5fd"/>
      </linearGradient></defs>
      <rect width="200" height="200" fill="url(#g)"/>
      <text x="100" y="110" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="#fff">
        DESIGN HERE
      </text>
    </svg>`
  );

type Area = { x: number; y: number; width: number; height: number };

type Props = {
  mockupUrl: string;
  setMockupUrl: (v: string) => void;
  area: Area;
  setArea: (a: Area) => void;
  slug: string;
};

export function GiftMockupEditor({ mockupUrl, setMockupUrl, area, setArea, slug }: Props) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 500, h: 500 });

  useEffect(() => {
    function measure() {
      const el = canvasRef.current;
      if (el) setSize({ w: el.clientWidth, h: el.clientHeight });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const [drag, setDrag] = useState<null | {
    kind: 'move' | 'resize';
    startX: number; startY: number;
    startArea: Area;
  }>(null);

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const dx = ((e.clientX - drag.startX) / size.w) * 100;
    const dy = ((e.clientY - drag.startY) / size.h) * 100;
    if (drag.kind === 'move') {
      const nx = clamp(drag.startArea.x + dx, 0, 100 - drag.startArea.width);
      const ny = clamp(drag.startArea.y + dy, 0, 100 - drag.startArea.height);
      setArea({ ...drag.startArea, x: nx, y: ny });
    } else {
      const nw = clamp(drag.startArea.width + dx, 5, 100 - drag.startArea.x);
      const nh = clamp(drag.startArea.height + dy, 5, 100 - drag.startArea.y);
      setArea({ ...drag.startArea, width: nw, height: nh });
    }
  }
  function end() { setDrag(null); }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="rounded border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900">
        Upload a product photo (mug / shirt / keychain etc). Position the <strong>pink rectangle</strong>
        over the area where the customer&apos;s design will be composited. Customers see their final
        design rendered on this mockup in real time — no admin action needed per order.
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Upload + inputs */}
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-2 text-xs font-bold text-ink">Mockup image</div>
            <p className="mb-2 text-[11px] text-neutral-500">
              A clean product shot (white background preferred). Can include hands, surface, etc.
            </p>
            <ImageUpload
              value={mockupUrl}
              onChange={setMockupUrl}
              prefix={`mockup-${slug || 'product'}`}
              aspect={1}
              size="lg"
              label="Mockup"
            />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
            <div className="text-xs font-bold text-ink">Design area (% of mockup)</div>
            <div className="grid grid-cols-2 gap-2">
              <Num label="X" value={area.x} onChange={(v) => setArea({ ...area, x: clamp(v, 0, 100 - area.width) })} />
              <Num label="Y" value={area.y} onChange={(v) => setArea({ ...area, y: clamp(v, 0, 100 - area.height) })} />
              <Num label="W" value={area.width} onChange={(v) => setArea({ ...area, width: clamp(v, 5, 100 - area.x) })} />
              <Num label="H" value={area.height} onChange={(v) => setArea({ ...area, height: clamp(v, 5, 100 - area.y) })} />
            </div>
            <p className="text-[10px] text-neutral-500">
              Drag the pink rectangle on the canvas to position · Drag the corner handle to resize.
            </p>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative aspect-square w-full select-none overflow-hidden rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-100"
          onPointerMove={onPointerMove}
          onPointerUp={end}
          onPointerLeave={end}
          style={{ touchAction: 'none' }}
        >
          {/* Mockup */}
          {mockupUrl ? (
            <img src={mockupUrl} alt="" className="absolute inset-0 h-full w-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-neutral-400">
              <div className="mb-2 text-4xl">📷</div>
              <div className="text-xs">Upload a mockup image on the left.</div>
            </div>
          )}

          {/* Sample design in the area (shows where customer preview lands) */}
          {mockupUrl && (
            <div
              className="absolute overflow-hidden"
              style={{
                left: `${area.x}%`, top: `${area.y}%`,
                width: `${area.width}%`, height: `${area.height}%`,
                pointerEvents: 'none',
                opacity: 0.9,
              }}
            >
              <img src={SAMPLE_DESIGN} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          {/* Draggable rectangle */}
          {mockupUrl && (
            <div
              className="absolute border-2 border-pink bg-pink/10 shadow-[0_0_0_3px_rgba(233,30,140,0.25)]"
              style={{
                left: `${area.x}%`, top: `${area.y}%`,
                width: `${area.width}%`, height: `${area.height}%`,
                cursor: 'move',
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                setDrag({ kind: 'move', startX: e.clientX, startY: e.clientY, startArea: area });
              }}
            >
              <div className="absolute left-1 top-1 rounded bg-pink px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                Design area
              </div>
              <div
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  setDrag({ kind: 'resize', startX: e.clientX, startY: e.clientY, startArea: area });
                }}
                className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-full border-2 border-pink bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-bold uppercase text-neutral-500">{label}</span>
      <input
        type="number"
        step="1"
        value={Math.round(value)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded border-2 border-neutral-200 bg-white px-2 py-1 text-xs font-mono focus:border-pink focus:outline-none"
      />
    </label>
  );
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
