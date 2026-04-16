'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadProductImage } from '@/app/admin/upload/actions';

type Props = {
  value: string;
  onChange: (url: string) => void;
  prefix?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function ImageUpload({ value, onChange, prefix = 'product', label = 'Image', size = 'md' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dim = size === 'sm' ? 80 : size === 'lg' ? 160 : 120;

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('prefix', prefix);
    const result = await uploadProductImage(fd);
    setUploading(false);
    if (!result.ok) {
      setError(result.error ?? 'Upload failed');
      return;
    }
    if (result.url) onChange(result.url);
  }

  function clear() {
    onChange('');
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
          if (f) handleFile(f);
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
                ? 'Click to replace · Max 5 MB · JPG / PNG / WebP / GIF / SVG'
                : 'Click to browse · Max 5 MB · JPG / PNG / WebP / GIF / SVG'}
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
            onClick={(e) => { e.stopPropagation(); clear(); }}
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
    </div>
  );
}
