'use client';

// Per-option image control with a shared library behind it. Admins can:
//   1. Click the thumbnail to open the library modal
//   2. Pick an already-uploaded image (no re-upload)
//   3. Upload a new one — it's auto-saved into the library, then set
//      on the option
// The component returns nothing but an image URL via onChange; the
// library plumbing is invisible to the caller.

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, Trash2, Upload, X } from 'lucide-react';
import { uploadProductImage } from '@/app/admin/upload/actions';
import {
  createOptionImage,
  deleteOptionImage,
  listOptionImages,
  type OptionImageRow,
} from '@/app/admin/upload/option-images';

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Label used when adding a freshly-uploaded image to the library.
   *  Typically the option's label so the admin can find it later. */
  defaultLabel?: string;
};

export function OptionImagePicker({ value, onChange, defaultLabel = '' }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex w-fit items-center gap-3 rounded border border-dashed border-neutral-300 bg-white p-2 pr-3 transition-colors hover:border-pink"
      >
        <div
          className="flex h-14 w-14 items-center justify-center overflow-hidden bg-neutral-50"
          style={{ border: '1px solid #eee' }}
        >
          {value ? (
            <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Upload size={20} style={{ color: '#ccc' }} />
          )}
        </div>
        <div className="text-left">
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-700">
            {value ? 'Change image' : 'Add image'}
          </div>
          <div className="text-[10px] text-neutral-500">
            Pick from library or upload new
          </div>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        )}
      </button>

      {modalOpen && (
        <OptionImageLibraryModal
          currentUrl={value}
          defaultLabel={defaultLabel}
          onClose={() => setModalOpen(false)}
          onPick={(url) => {
            onChange(url);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function OptionImageLibraryModal({
  currentUrl,
  defaultLabel,
  onClose,
  onPick,
}: {
  currentUrl: string;
  defaultLabel: string;
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  const [rows, setRows] = useState<OptionImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await listOptionImages();
      setLoading(false);
      if (!res) { setError('Could not load the image library (no response).'); return; }
      if (res.ok) setRows(res.rows);
      else setError(res.error);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message ?? 'Could not load the image library.');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onUploadPicked(file: File) {
    if (!file) return;
    setError(null);
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large (max 20MB)');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('prefix', 'opt');
      const upload = await uploadProductImage(fd);
      if (!upload || !upload.ok || !upload.url) {
        setError(upload?.error || 'Upload failed (no response from server)');
        setUploading(false);
        return;
      }
      // Save into the library so other products can reuse it. The
      // admin can rename later if they want — we seed with the option
      // label (or filename, if no label was given).
      const libLabel =
        defaultLabel.trim() ||
        file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 80) ||
        'Untitled';
      const added = await createOptionImage({ url: upload.url, label: libLabel });
      setUploading(false);
      if (!added || !added.ok) {
        // Still usable on this option even if library save failed.
        setError(`Image uploaded, but library save failed: ${added?.error ?? 'no response from server'}`);
        onPick(upload.url);
        return;
      }
      // Prepend the new row and auto-select it
      setRows((prev) => [added.row, ...prev]);
      onPick(upload.url);
    } catch (e: any) {
      setUploading(false);
      setError(e?.message ?? 'Upload failed');
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Remove this image from the library? Products already using it will keep rendering.')) return;
    try {
      const res = await deleteOptionImage(id);
      if (!res) { alert('No response from server'); return; }
      if (res.ok) setRows((prev) => prev.filter((r) => r.id !== id));
      else alert(res.error);
    } catch (e: any) {
      alert(e?.message ?? 'Delete failed');
    }
  }

  const filtered = query.trim()
    ? rows.filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase()))
    : rows;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(900px, 100%)',
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <div className="text-sm font-bold text-ink">Option image library</div>
            <div className="text-[11px] text-neutral-500">
              Pick an existing image or upload a new one — uploads are saved here for reuse.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-5 py-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by label…"
              className="w-full rounded border border-neutral-300 bg-white py-1.5 pl-7 pr-3 text-sm outline-none focus:border-ink"
            />
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/heic,image/heif"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadPicked(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => !uploading && inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded bg-pink px-3 py-1.5 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-60"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? 'Uploading…' : 'Upload new'}
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-neutral-400">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded border border-dashed border-neutral-300 bg-neutral-50 py-12 text-center text-xs text-neutral-500">
              {query
                ? `Nothing matches "${query}"`
                : 'Library is empty — upload your first image above.'}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((row) => {
                const selected = row.url === currentUrl;
                return (
                  <div
                    key={row.id}
                    className={`group relative overflow-hidden rounded border-2 bg-white transition-colors ${selected ? 'border-pink' : 'border-neutral-200 hover:border-ink'}`}
                  >
                    <button
                      type="button"
                      onClick={() => onPick(row.url)}
                      className="block w-full text-left"
                    >
                      <div className="aspect-square bg-neutral-50">
                        <img
                          src={row.url}
                          alt={row.label}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="px-2 py-1.5">
                        <div className="truncate text-[11px] font-bold text-ink" title={row.label}>
                          {row.label}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="absolute right-1 top-1 rounded bg-white/90 p-1 text-neutral-500 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                      aria-label="Delete from library"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
