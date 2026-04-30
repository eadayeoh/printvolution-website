'use client';

/**
 * Two-tile output preview for the LED Light Reveal Frame:
 *   • Lights Off — the customer's Side 1 art on the natural cream backboard.
 *   • Lights On  — Side 2 photo backlit + Side 1 line art on top.
 *
 * Stylised approximation. Actual reveal depends on print opacity, paper
 * weight, and ambient light, so the tiles are labelled "Approximate look".
 *
 * Mounted only when product.slug === 'led-light-reveal-frame'.
 */

import { useEffect, useRef, useState } from 'react';

type Area = { x: number; y: number; width: number; height: number };

type Side = {
  label: string;
  photoUrl: string | null;
  text?: string | null;
};

export function LedRevealOutputBox({
  mockupUrl,
  area,
  side1,
  side2,
}: {
  mockupUrl: string;
  area: Area;
  side1: Side;
  side2: Side;
}) {
  const offCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        const [mockupImg, side1Img, side2Img] = await Promise.all([
          loadImage(mockupUrl),
          side1.photoUrl ? loadImage(side1.photoUrl) : Promise.resolve<HTMLImageElement | null>(null),
          side2.photoUrl ? loadImage(side2.photoUrl) : Promise.resolve<HTMLImageElement | null>(null),
        ]);
        if (cancelled) return;

        const offCanvas = offCanvasRef.current;
        const onCanvas = onCanvasRef.current;
        if (!offCanvas || !onCanvas) return;

        drawOffTile(offCanvas, mockupImg, area, side1Img, side1.text ?? null);
        drawOnTile(onCanvas, mockupImg, area, side1Img, side2Img, side1.text ?? null, side2.text ?? null);

        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [mockupUrl, area, side1.photoUrl, side1.text, side2.photoUrl, side2.text]);

  return (
    <div
      style={{
        marginTop: 16,
        padding: '14px 16px 16px',
        border: '2px solid var(--pv-ink)',
        background: 'var(--pv-cream-warm, #FFF4E5)',
        boxShadow: '4px 4px 0 var(--pv-ink)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--pv-ink)',
          }}
        >
          Output preview · lights off vs lights on
        </div>
        <div
          style={{
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(10,10,10,0.55)',
          }}
        >
          Approximate look
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <Tile label="Lights Off" canvasRef={offCanvasRef} dim={false} status={status} />
        <Tile label="Lights On"  canvasRef={onCanvasRef}  dim={true}  status={status} />
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 9.5,
          lineHeight: 1.5,
          letterSpacing: '0.04em',
          color: 'rgba(10,10,10,0.65)',
        }}
      >
        Approximate look — actual reveal varies with print opacity, paper weight, and ambient light.
      </div>
    </div>
  );
}

function Tile({
  label,
  canvasRef,
  dim,
  status,
}: {
  label: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  dim: boolean;
  status: 'loading' | 'ready' | 'error';
}) {
  return (
    <div
      style={{
        position: 'relative',
        background: dim ? '#0d0d10' : '#fafaf7',
        border: '2px solid var(--pv-ink)',
        borderRadius: 6,
        overflow: 'hidden',
        padding: dim ? 18 : 6,
        transition: 'background 200ms',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: dim ? 'rgba(255,221,160,0.65)' : '#888',
            fontSize: 10,
            fontFamily: 'var(--pv-f-mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Rendering…
        </div>
      )}
      {status === 'error' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: dim ? '#fca5a5' : '#991b1b',
            fontSize: 10,
            fontFamily: 'var(--pv-f-mono)',
          }}
        >
          Preview failed
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          padding: '3px 8px',
          background: dim ? 'rgba(255, 221, 160, 0.92)' : 'var(--pv-ink)',
          color: dim ? 'var(--pv-ink)' : 'var(--pv-yellow, #FFDD00)',
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          borderRadius: 3,
          boxShadow: dim ? '0 0 14px rgba(255,221,160,0.55)' : 'none',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function drawOffTile(
  canvas: HTMLCanvasElement,
  mockupImg: HTMLImageElement,
  area: Area,
  side1Img: HTMLImageElement | null,
  side1Text: string | null,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = mockupImg.naturalWidth;
  const targetH = mockupImg.naturalHeight;
  canvas.width = Math.round(targetW * dpr);
  canvas.height = Math.round(targetH * dpr);
  canvas.style.aspectRatio = `${targetW} / ${targetH}`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  ctx.drawImage(mockupImg, 0, 0, targetW, targetH);

  const ax = (area.x / 100) * targetW;
  const ay = (area.y / 100) * targetH;
  const aw = (area.width / 100) * targetW;
  const ah = (area.height / 100) * targetH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(ax, ay, aw, ah);
  ctx.clip();
  // Cream backboard inside the frame — what the customer sees on a real
  // unlit reveal frame (the diffuser sheet behind the front print).
  ctx.fillStyle = '#f4ead8';
  ctx.fillRect(ax, ay, aw, ah);
  if (side1Img) {
    drawCover(ctx, side1Img, ax, ay, aw, ah, 'multiply');
  }
  if (side1Text) {
    drawTextLayer(ctx, side1Text, ax, ay, aw, ah, 'rgba(10,10,10,0.85)');
  }
  ctx.restore();
}

function drawOnTile(
  canvas: HTMLCanvasElement,
  mockupImg: HTMLImageElement,
  area: Area,
  side1Img: HTMLImageElement | null,
  side2Img: HTMLImageElement | null,
  side1Text: string | null,
  side2Text: string | null,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = mockupImg.naturalWidth;
  const targetH = mockupImg.naturalHeight;
  canvas.width = Math.round(targetW * dpr);
  canvas.height = Math.round(targetH * dpr);
  canvas.style.aspectRatio = `${targetW} / ${targetH}`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  // Slightly dimmed mockup — the wood frame in a low-light room.
  ctx.save();
  ctx.filter = 'brightness(0.78) saturate(0.9)';
  ctx.drawImage(mockupImg, 0, 0, targetW, targetH);
  ctx.restore();

  const ax = (area.x / 100) * targetW;
  const ay = (area.y / 100) * targetH;
  const aw = (area.width / 100) * targetW;
  const ah = (area.height / 100) * targetH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(ax, ay, aw, ah);
  ctx.clip();

  // Warm backlight: bright glow layer behind the artwork. Even with no
  // Side 2 photo this gives the empty frame a clear "lit" look.
  const grad = ctx.createRadialGradient(
    ax + aw / 2, ay + ah / 2, Math.min(aw, ah) * 0.05,
    ax + aw / 2, ay + ah / 2, Math.max(aw, ah) * 0.7,
  );
  grad.addColorStop(0, '#fff7d6');
  grad.addColorStop(0.6, '#ffe9a8');
  grad.addColorStop(1, '#f5c97a');
  ctx.fillStyle = grad;
  ctx.fillRect(ax, ay, aw, ah);

  if (side2Img) {
    // Side 2 shows together with Side 1 when the LED is on, but at 70%
    // opacity so the warm backlight + Side 1 line art still read clearly
    // on top of it.
    ctx.save();
    ctx.globalAlpha = 0.7;
    drawCover(ctx, side2Img, ax, ay, aw, ah);
    ctx.restore();
  }
  if (side2Text) {
    drawTextLayer(ctx, side2Text, ax, ay, aw, ah, 'rgba(10,10,10,0.7)');
  }

  // Side 1 line art stays visible on top — this is what the customer
  // sees in both states; backlight just reveals what's behind it.
  if (side1Img) {
    drawCover(ctx, side1Img, ax, ay, aw, ah, 'multiply');
  }
  if (side1Text) {
    drawTextLayer(ctx, side1Text, ax, ay, aw, ah, 'rgba(10,10,10,0.85)');
  }

  ctx.restore();

  // Soft warm glow leaking into the room around the frame.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(
    ax + aw / 2, ay + ah / 2, Math.max(aw, ah) * 0.4,
    ax + aw / 2, ay + ah / 2, Math.max(aw, ah) * 1.1,
  );
  halo.addColorStop(0, 'rgba(255, 220, 150, 0.35)');
  halo.addColorStop(1, 'rgba(255, 220, 150, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.restore();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  blend: GlobalCompositeOperation = 'source-over',
) {
  const iAspect = img.naturalWidth / img.naturalHeight;
  const aAspect = aw / ah;
  let dw: number, dh: number, dx: number, dy: number;
  if (iAspect > aAspect) {
    dh = ah;
    dw = dh * iAspect;
    dx = ax + (aw - dw) / 2;
    dy = ay;
  } else {
    dw = aw;
    dh = dw / iAspect;
    dx = ax;
    dy = ay + (ah - dh) / 2;
  }
  ctx.save();
  ctx.globalCompositeOperation = blend;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  text: string,
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  color: string,
) {
  const fontSize = Math.max(14, Math.min(aw, ah) * 0.08);
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 ${fontSize}px var(--pv-f-display, serif)`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, ax + aw / 2, ay + ah / 2, aw * 0.9);
  ctx.restore();
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
