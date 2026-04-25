'use client';

// Modal grid of every image already in the product-images bucket.
// Click a tile → the parent's onPick fires with the file's public URL.
// Eliminates the "I uploaded this same logo 12 times" tax on building
// out templates / variants / mockups.

import { useEffect, useState } from 'react';
import { X, Search, Loader2, Trash2 } from 'lucide-react';
import { listProductImages, deleteProductImage } from '@/app/admin/upload/actions';

type Item = { name: string; url: string; createdAt: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
};

export function MediaLibraryPicker({ open, onClose, onPick }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProductImages({ limit: 300 }).then((r) => {
      if (cancelled) return;
      if (!r.ok) setError(r.error ?? 'Could not load library');
      else setItems(r.items ?? []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open]);

  // Esc to dismiss — keeps the modal feeling light. Skip when closed
  // so we don't leak a listener.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handleDelete(it: Item) {
    if (!window.confirm(`Delete "${it.name}" from the media library? This cannot be undone, and any product / template still pointing at this URL will show a broken image.`)) return;
    setDeleting(it.name);
    try {
      const r = await deleteProductImage(it.name);
      if (!r.ok) {
        setError(r.error ?? 'Delete failed');
      } else {
        setItems((prev) => prev.filter((x) => x.name !== it.name));
      }
    } finally {
      setDeleting(null);
    }
  }

  if (!open) return null;

  const q = search.trim().toLowerCase();
  const filtered = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,10,10,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 960, maxHeight: '85vh',
          background: '#fff', borderRadius: 8, border: '2px solid #0a0a0a',
          boxShadow: '6px 6px 0 #0a0a0a',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid #eee',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Pick from library</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {loading ? 'Loading…' : `${filtered.length} image${filtered.length === 1 ? '' : 's'}`}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 4, padding: 6, cursor: 'pointer' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #eee' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#888' }} />
            <input
              type="text"
              placeholder="Search filename…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                fontSize: 13,
                border: '2px solid #e5e5e5',
                borderRadius: 4,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {error && (
            <div style={{ padding: 24, color: '#dc2626', fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}
          {loading && !error && (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: '#888', display: 'inline-block' }} />
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: '#888', fontSize: 13 }}>
              {q ? 'No matches.' : 'No images yet — upload one first.'}
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8,
            }}>
              {filtered.map((it) => {
                const isDeleting = deleting === it.name;
                return (
                  <div
                    key={it.name}
                    style={{
                      position: 'relative',
                      background: '#fafaf7',
                      border: '2px solid #e5e5e5',
                      borderRadius: 6,
                      overflow: 'hidden',
                      transition: 'border-color .15s, transform .15s',
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E91E8C'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e5e5'; }}
                  >
                    <button
                      type="button"
                      onClick={() => { onPick(it.url); onClose(); }}
                      disabled={isDeleting}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: 0,
                        background: 'transparent',
                        border: 'none',
                        cursor: isDeleting ? 'wait' : 'pointer',
                        textAlign: 'left',
                      }}
                      title={it.name}
                    >
                      <div style={{ aspectRatio: '1 / 1', background: '#fff', overflow: 'hidden' }}>
                        <img
                          src={it.url}
                          alt={it.name}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: '#666',
                        padding: '6px 8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--pv-f-mono)',
                      }}>
                        {it.name}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(it)}
                      disabled={isDeleting}
                      title="Delete from library (irreversible)"
                      aria-label={`Delete ${it.name}`}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid #e5e5e5',
                        cursor: isDeleting ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#dc2626',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }}
                    >
                      {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
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
