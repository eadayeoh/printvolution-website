'use client';

/**
 * Composites the customer's transformed preview onto the admin-uploaded
 * product mockup image in real time via HTML Canvas. Shows what the
 * customer's final product will look like (design on a mug / shirt /
 * keychain etc).
 */

import { useEffect, useRef, useState } from 'react';

type Area = { x: number; y: number; width: number; height: number };

export function GiftMockupPreview({
  mockupUrl,
  previewUrl,
  area,
  tintHex,
}: {
  mockupUrl: string;
  previewUrl: string;
  area: Area;
  /** Hex tint applied to the entire mockup with `multiply` blend before
   *  the design composites. Used by auto-tint swatches so admin can
   *  upload one neutral base mockup and let N hex codes recolour it. */
  tintHex?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        const [mockupImg, designImg] = await Promise.all([
          loadImage(mockupUrl),
          loadImage(previewUrl),
        ]);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        // Maintain square aspect — templates / mockups are typically square
        const targetW = mockupImg.naturalWidth;
        const targetH = mockupImg.naturalHeight;
        canvas.width = Math.round(targetW * dpr);
        canvas.height = Math.round(targetH * dpr);
        canvas.style.aspectRatio = `${targetW} / ${targetH}`;

        const ctx = canvas.getContext('2d');
        if (!ctx) { setStatus('error'); return; }
        ctx.scale(dpr, dpr);

        // Background: draw mockup
        ctx.drawImage(mockupImg, 0, 0, targetW, targetH);

        // Auto-tint: paint the customer-picked colour over the mockup
        // with multiply, so the neutral shirt body picks up the hex
        // before the design lands on top.
        if (tintHex) {
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = tintHex;
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.restore();
        }

        // Composite the design inside the admin-defined area.
        const ax = (area.x / 100) * targetW;
        const ay = (area.y / 100) * targetH;
        const aw = (area.width / 100) * targetW;
        const ah = (area.height / 100) * targetH;

        // Scale the design to cover the area, maintaining aspect.
        const dAspect = designImg.naturalWidth / designImg.naturalHeight;
        const aAspect = aw / ah;
        let dw: number, dh: number, dx: number, dy: number;
        if (dAspect > aAspect) {
          // design wider — fit to height, crop left/right
          dh = ah;
          dw = dh * dAspect;
          dx = ax + (aw - dw) / 2;
          dy = ay;
        } else {
          dw = aw;
          dh = dw / dAspect;
          dx = ax;
          dy = ay + (ah - dh) / 2;
        }

        // Multiply blend mode so the design picks up shadows/curves of
        // the mockup (e.g. a mug's barrel shading stays visible through
        // the design).
        ctx.save();
        ctx.beginPath();
        ctx.rect(ax, ay, aw, ah);
        ctx.clip();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(designImg, dx, dy, dw, dh);
        ctx.restore();

        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [mockupUrl, previewUrl, area, tintHex]);

  return (
    <div style={{ position: 'relative', background: '#fafaf7', borderRadius: 12, overflow: 'hidden', border: '2px solid #0a0a0a' }}>
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12 }}>
          Compositing your design onto the product…
        </div>
      )}
      {status === 'error' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b', fontSize: 12 }}>
          Mockup preview failed to load
        </div>
      )}
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${src}`));
    img.src = src;
  });
}
