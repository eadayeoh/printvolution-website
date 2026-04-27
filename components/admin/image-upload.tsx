'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, X, Loader2, FolderOpen } from 'lucide-react';
import { uploadProductImage } from '@/app/admin/upload/actions';
import { ImageCropModal } from '@/components/admin/image-crop-modal';
import { MediaLibraryPicker } from '@/components/admin/media-library-picker';

type Props = {
  value: string;
  onChange: (url: string) => void;
  prefix?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Aspect ratio for the crop tool. Default 1 (square). Pass 16/9 for wide, etc. */
  aspect?: number;
  /**
   * Skip the crop modal entirely — upload the image as-is (compressed
   * if oversized). Use for logos / icons / anything where fixed-aspect
   * cropping would chop meaningful content.
   */
  skipCrop?: boolean;
  /**
   * Lets the parent track in-flight uploads. We fire (true) when an
   * upload starts and (false) when it finishes — including while the
   * crop modal is open. The parent should disable its Save button
   * while any upload is pending so the user can't save with a stale
   * (empty) URL before onChange has propagated the new one.
   */
  onUploadingChange?: (uploading: boolean) => void;
};

export function ImageUpload({
  value,
  onChange,
  prefix = 'product',
  label = 'Image',
  size = 'md',
  aspect = 1,
  skipCrop = false,
  onUploadingChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Pending file awaiting crop confirmation
  const [pending, setPending] = useState<{ src: string; name: string; type: string } | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Report busy to the parent whenever we're either pushing bytes to
  // the server (uploading) OR waiting on the user to confirm the crop
  // (pending). Both states should block a Save click upstream.
  useEffect(() => {
    onUploadingChange?.(uploading || pending !== null);
  }, [uploading, pending, onUploadingChange]);

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
    // Logos / icons skip crop: compress if oversized, upload as-is.
    if (skipCrop) {
      try {
        if (file.size > 3 * 1024 * 1024) {
          const compressed = await compressImage(file, 2400, 0.9);
          const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          uploadBlob(compressed.blob, name, compressed.type);
        } else {
          uploadBlob(file, file.name, file.type);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Could not read image');
      }
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
        try {
          const compressed = await compressImage(file, 2400, 0.85);
          displaySrc = await blobToDataUrl(compressed.blob);
          srcType = compressed.type;
          srcName = file.name.replace(/\.[^.]+$/, '') + '-compressed.jpg';
        } catch {
          // HEIC, RAW or weird format the browser can't decode → just
          // hand the original to the cropper and let the cropper try.
          displaySrc = await blobToDataUrl(file);
        }
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
      if (!result || !result.ok) {
        setUploading(false);
        setError((result && result.error) || 'Upload failed — try again');
        return;
      }
      // Propagate the URL BEFORE clearing the uploading flag so any
      // parent watching `onUploadingChange` doesn't briefly re-enable
      // their save button on an empty value. React batches these in a
      // single render, but the ordering protects against any effect
      // that runs on uploading flipping to false.
      if (result.url) onChange(result.url);
      setUploading(false);
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
    // Root <div> swallows clicks: if a parent wraps this component in a
    // <label>, its implicit "activate nested form control" behaviour
    // would race our own inputRef.current.click() and the browser can
    // swallow the second file-input activation. Stop propagation so the
    // click never bubbles past our handler.
    <div onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/heic,image/heif"
        style={{ display: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(f);
          e.target.value = '';
        }}
      />

      <div
        onClick={(e) => { e.stopPropagation(); if (!uploading) inputRef.current?.click(); }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-3.5 border-2 border-neutral-200 rounded-md bg-white transition-colors hover:border-pink"
        style={{ cursor: uploading ? 'wait' : 'pointer' }}
      >
        {/* Preview */}
        <div
          className="flex-shrink-0 mx-auto sm:mx-0 flex items-center justify-center overflow-hidden relative bg-neutral-50 border border-neutral-200"
          style={{ width: dim, height: dim }}
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
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="text-xs font-extrabold text-neutral-900 mb-1">
            {value ? label + ' uploaded' : `Upload ${label.toLowerCase()}`}
          </div>
          <div className="text-[11px] text-neutral-500 leading-snug">
            {uploading
              ? 'Uploading…'
              : value
                ? 'Click to replace · Max 20 MB · Auto-resized to fit'
                : 'Click to browse · Max 20 MB · JPG / PNG / WebP / HEIC · Cropped to ' + (aspect === 1 ? 'square' : `${aspect.toFixed(2)}:1`)}
          </div>
          {error && (
            <div className="text-[11px] text-red-600 mt-1">
              ✗ {error}
            </div>
          )}
        </div>

        {/* Buttons — keep on one row, recenter on mobile */}
        <div className="flex items-center justify-center sm:justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLibraryOpen(true); }}
            disabled={uploading}
            title="Pick from existing uploads"
            className="inline-flex items-center gap-1.5 rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-900 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ fontFamily: 'var(--pv-f-mono)' }}
          >
            <FolderOpen size={12} />
            Library
          </button>

          {value && !uploading && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="rounded border border-neutral-200 bg-white p-1.5 text-neutral-500"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          )}
        </div>
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

      <MediaLibraryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onPick={(url) => onChange(url)}
      />
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
