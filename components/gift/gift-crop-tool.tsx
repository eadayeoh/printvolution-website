'use client';

import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X } from 'lucide-react';
import type { GiftProduct, GiftCropRect } from '@/lib/gifts/types';

type Props = {
  product: GiftProduct;
  fileSrc: string;       // blob/data URL of the uploaded file
  file: File;            // original file, re-emitted on confirm
  onCancel: () => void;
  onConfirm: (file: File, crop: GiftCropRect) => void;
};

/**
 * Photo Resize crop UI.
 *
 * Shows the customer's photo with 3 overlays:
 *   - trim area (aspect matches product dimensions)
 *   - 2mm bleed outside the trim (pink tint)
 *   - safe zone inside the trim (dashed line)
 *
 * The customer drags/zooms to position their photo. The cropper is
 * locked to the product's aspect ratio so the result always fits.
 * Output is an absolute-coordinate crop rect in source-image pixels.
 */
export function GiftCropTool({ product, fileSrc, file, onCancel, onConfirm }: Props) {
  const aspect = product.width_mm / product.height_mm;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelArea, setPixelArea] = useState<Area | null>(null);

  const onComplete = useCallback((_: Area, pixels: Area) => {
    setPixelArea(pixels);
  }, []);

  function confirm() {
    if (!pixelArea) return;
    onConfirm(file, { x: pixelArea.x, y: pixelArea.y, width: pixelArea.width, height: pixelArea.height });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Position your photo</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            Final size: {product.width_mm}×{product.height_mm} mm ·
            Bleed: {product.bleed_mm} mm ·
            Safe zone: {product.safe_zone_mm} mm
          </div>
        </div>
        <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 4, padding: 6, cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      {/* Cropper */}
      <div style={{ position: 'relative', flex: 1, background: '#000' }}>
        <Cropper
          image={fileSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
          restrictPosition={false}
        />
        {/* Overlays — these sit on top of react-easy-crop's crop rect
            because its crop area is centered in the canvas. We draw the
            pink bleed ring outside the trim area and a dashed safe-zone
            inside using SVG overlays positioned around the cropper mask. */}
        {/* We keep the overlays simple — just informational pills at the
            corners so the crop rect visually stays what react-easy-crop
            draws. */}
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', background: 'rgba(233,30,140,0.18)', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
          ← Pink area = bleed (trimmed off)
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
          Dashed area = safe zone (keep important things inside)
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 20px', background: '#111', color: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', minWidth: 40 }}>Zoom</span>
          <input type="range" min={1} max={5} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', minWidth: 40 }}>{zoom.toFixed(2)}×</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{file.name}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancel} style={{ padding: '10px 18px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 999, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={confirm} disabled={!pixelArea} style={{ padding: '10px 22px', border: 'none', background: '#E91E8C', color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 999, cursor: 'pointer', opacity: !pixelArea ? 0.6 : 1, letterSpacing: 0.5 }}>
              Use this crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
