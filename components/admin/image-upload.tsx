'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadProductImage } from '@/app/admin/upload/actions';
import { ImageCropModal } from '@/components/admin/image-crop-modal';

type Props = {
  value: string;
  onChange: (url: string) => void;
  prefix?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Aspect ratio for the crop tool. Default 1 (square). Pass 16/9 for wide, etc. */
  aspect?: number;
};

export function ImageUpload({
  value,
  onChange,
  prefix = 'product',
  label = 'Image',
  size = 'md',
  aspect = 1,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Pending file awaiting crop confirmation
  const [pending, setPending] = useState<{ src: string; name: string; type: string } | null>(null);

  const dim = size === 'sm' ? 80 : size === 'lg' ? 160 : 120;

  async function onPickFile(file: File) {
    setError(null);
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large (max 20MB)');
      return;
    }
    // SVG isn't croppable on canvas reliably — upload as-is.
    if (file.type === 'image/svg+xml') {
      uploadBlob(file, file.name, file.type);
      return;
    }
    // Auto-compress oversized images BEFORE the crop tool so we stay
    // well under Vercel's server-action body limit. Anything over ~3MB
    // gets re-encoded at 2400px max / quality 0.85.
    let displaySrc: string;
    let srcName = file.name;
    let srcType = file.type;
    try {
      if (file.size > 3 * 1024 * 1024) {
        const compressed = await compressImage(file, 2400, 0.85);
        displaySrc = await blobToDataUrl(compressed.blob);
        srcType = compressed.type;
        srcName = file.name.replace(/\.[^.]+$/, '') + '-compressed.jpg';
      } else {
        displaySrc = await blobToDataUrl(file);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not read image');
      return;
    }
    setPending({ src: displaySrc, name: srcName, type: srcType });
  }

  async function uploadBlob(blob: Blob, name: string, type: string) {
    setUploading(true);
    setError(null);
    // Final safety: re-encode again if the blob is over 4MB (Vercel's
    // practical server-action body limit on some plans).
    let sendBlob = blob;
    let sendType = type;
    let sendName = name;
    if (blob.size > 4 * 1024 * 1024 && type !== 'image/svg+xml') {
      try {
        const shrunk = await compressImage(blob, 2000, 0.82);
        sendBlob = shrunk.blob;
        sendType = shrunk.type;
        sendName = name.replace(/\.[^.]+$/, '') + '.jpg';
      } catch {
        // fall through — try original
      }
    }
    const fd = new FormData();
    const file = new File([sendBlob], sendName, { type: sendType });
    fd.append('file', file);
    fd.append('prefix', prefix);
    try {
      const result = await uploadProductImage(fd);
      setUploading(false);
      if (!result || !result.ok) {
        setError((result && result.error) || 'Upload failed — try again');
        return;
      }
      if (result.url) onChange(result.url);
    } catch (e: any) {
      setUploading(false);
      setError(e?.message ?? 'Upload failed — try again');
    }
  }

  function onCropConfirm(blob: Blob) {
    if (!pending) return;
    const name = pending.name.replace(/\.[^.]+$/, '') + '-cropped.jpg';
    const type = pending.type === 'image/png' || pending.type === 'image/webp' ? pending.type : 'image/jpeg';
    setPending(null);
    uploadBlob(blob, name, type);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(f);
          e.target.value = '';
        }}
      />

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 14, border: '2px solid #e5e5e5', borderRadius: 6,
          background: '#fff', cursor: uploading ? 'wait' : 'pointer',
          transition: 'border-color .15s',
        }}
        onMouseEnter={(e) => { if (!uploading) (e.currentTarget as HTMLDivElement).style.borderColor = '#E91E8C'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e5e5'; }}
      >
        {/* Preview */}
        <div
          style={{
            width: dim, height: dim, flexShrink: 0,
            background: '#fafaf7', border: '1px solid #eee',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative',
          }}
        >
          {uploading ? (
            <Loader2 size={28} className="animate-spin" style={{ color: '#888' }} />
          ) : value ? (
            <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Upload size={28} style={{ color: '#ccc' }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0a0a0a', marginBottom: 4 }}>
            {value ? label + ' uploaded' : `Upload ${label.toLowerCase()}`}
          </div>
          <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>
            {uploading
              ? 'Uploading…'
              : value
                ? 'Click to replace · Max 10 MB · Crop tool shown after pick'
                : 'Click to browse · Max 10 MB · JPG / PNG / WebP · Cropped to ' + (aspect === 1 ? 'square' : `${aspect.toFixed(2)}:1`)}
          </div>
          {error && (
            <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>
              ✗ {error}
            </div>
          )}
        </div>

        {value && !uploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            style={{
              padding: 6, background: '#fff', border: '1px solid #e5e5e5',
              borderRadius: 4, cursor: 'pointer', color: '#666',
            }}
            aria-label="Remove"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {pending && (
        <ImageCropModal
          src={pending.src}
          filename={pending.name}
          mimeType={pending.type}
          aspect={aspect}
          onCancel={() => setPending(null)}
          onConfirm={onCropConfirm}
        />
      )}
    </div>
  );
}

/** Resize a file to a max long-edge (pixels) and re-encode as JPEG. */
async function compressImage(
  source: Blob,
  maxEdge: number,
  quality: number
): Promise<{ blob: Blob; type: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const i = new Image();
    i.onload = () => { URL.revokeObjectURL(url); resolve(i); };
    i.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not decode image')); };
    i.src = url;
  });
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compress failed'))), 'image/jpeg', quality);
  });
  return { blob, type: 'image/jpeg' };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read file'));
    r.readAsDataURL(blob);
  });
}
