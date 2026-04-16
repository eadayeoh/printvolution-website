'use client';

import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X } from 'lucide-react';

type Props = {
  src: string;                 // data URL or blob URL of the picked file
  aspect: number;              // 1 for square thumbnail, 16/9, etc
  filename: string;
  mimeType: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

/**
 * Full-screen crop modal. Shows the picked image; the user drags/zooms to
 * choose what the frontend will display. Returns a Blob cropped to the
 * exact aspect, so frontend rendering is predictable.
 */
export function ImageCropModal({ src, aspect, filename, mimeType, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const onComplete = useCallback((_area: Area, pixels: Area) => {
    setPixelCrop(pixels);
  }, []);

  async function confirm() {
    if (!pixelCrop) return;
    setWorking(true);
    try {
      const blob = await cropToBlob(src, pixelCrop, mimeType);
      onConfirm(blob);
    } catch (e) {
      console.error(e);
      setWorking(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Crop image</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            Drag to reposition · Scroll or use the slider to zoom · Aspect {aspect === 1 ? '1:1 (square)' : aspect.toFixed(2)}
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 4, padding: 6, cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Cropper */}
      <div style={{ position: 'relative', flex: 1, background: '#000' }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
          restrictPosition={false}
        />
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 20px', background: '#111', color: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', minWidth: 40 }}>Zoom</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', minWidth: 40 }}>{zoom.toFixed(2)}×</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{filename}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onCancel}
              style={{
                padding: '10px 18px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 999, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              disabled={working || !pixelCrop}
              style={{
                padding: '10px 22px', border: 'none', background: '#E91E8C',
                color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 999, cursor: 'pointer',
                opacity: working || !pixelCrop ? 0.6 : 1, letterSpacing: 0.5,
              }}
            >
              {working ? 'Cropping…' : 'Crop & Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function cropToBlob(src: string, area: Area, mimeType: string): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas context');
  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height,
  );
  // Use JPEG for smaller file size unless the source was transparent (PNG/WebP)
  const out = mimeType === 'image/png' || mimeType === 'image/webp' ? mimeType : 'image/jpeg';
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('crop failed'))),
      out,
      0.92
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
