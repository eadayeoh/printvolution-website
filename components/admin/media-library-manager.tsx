'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { bulkDeleteMedia, type MediaItem } from '@/app/admin/media/actions';

type Filter = 'all' | 'used' | 'orphan';

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryManager({ initialItems }: { initialItems: MediaItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [filter, setFilter] = useState<Filter>('orphan');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const orphanCount = useMemo(() => items.filter((i) => i.references.length === 0).length, [items]);
  const usedCount = useMemo(() => items.filter((i) => i.references.length > 0).length, [items]);

  const visible = useMemo(() => {
    const base =
      filter === 'orphan'
        ? items.filter((i) => i.references.length === 0)
        : filter === 'used'
        ? items.filter((i) => i.references.length > 0)
        : [...items];
    // Orphans first within "all"
    if (filter === 'all') {
      base.sort((a, b) => a.references.length - b.references.length || a.filename.localeCompare(b.filename));
    }
    return base;
  }, [items, filter]);

  function toggleItem(filename: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const it of visible) next.add(it.filename);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleFilterChange(f: Filter) {
    setFilter(f);
    setSelected(new Set());
  }

  async function handleDelete() {
    const filenames = [...selected];
    setShowConfirm(false);
    startTransition(async () => {
      setFlash(null);
      const result = await bulkDeleteMedia(filenames);
      if (result.ok) {
        setItems((prev) => prev.filter((i) => !filenames.includes(i.filename)));
        setSelected(new Set());
        setFlash({ type: 'success', msg: `Deleted ${result.deleted} file${result.deleted === 1 ? '' : 's'}.` });
        router.refresh();
      } else {
        setFlash({ type: 'error', msg: result.error });
      }
    });
  }

  const selectedOrphansOnly = [...selected].every(
    (fn) => items.find((i) => i.filename === fn)?.references.length === 0,
  );

  const selectedHasUsed = [...selected].some(
    (fn) => (items.find((i) => i.filename === fn)?.references.length ?? 0) > 0,
  );

  const selectedUsedCount = [...selected].filter(
    (fn) => (items.find((i) => i.filename === fn)?.references.length ?? 0) > 0,
  ).length;

  return (
    <div>
      {/* Flash */}
      {flash && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
            flash.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {flash.msg}
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="ml-3 text-xs underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Filter pills */}
        <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1">
          {(
            [
              { key: 'all', label: `All (${items.length})` },
              { key: 'used', label: `Used (${usedCount})` },
              { key: 'orphan', label: `Orphan (${orphanCount})` },
            ] as { key: Filter; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleFilterChange(key)}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                filter === key
                  ? key === 'orphan'
                    ? 'bg-red-600 text-white'
                    : 'bg-ink text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-neutral-400 italic">
          Recently uploaded files are excluded for 1 hour
        </span>

        {/* Select all / clear */}
        <button
          type="button"
          onClick={selectAllVisible}
          className="flex items-center gap-1.5 rounded border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink"
        >
          <CheckSquare size={13} />
          Select all visible
        </button>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="flex items-center gap-1.5 rounded border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-neutral-400"
          >
            <Square size={13} />
            Clear ({selected.size})
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && selectedHasUsed && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
              <AlertTriangle size={13} />
              Selection includes referenced files
            </span>
          )}
          <button
            type="button"
            disabled={selected.size === 0 || isPending}
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 rounded border-2 border-red-600 bg-red-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
            Delete {selected.size > 0 ? `${selected.size} selected` : 'selected'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white px-6 py-16 text-center text-sm text-neutral-500">
          {filter === 'orphan' ? 'No orphaned images found.' : 'No images found.'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
          }}
        >
          {visible.map((it) => {
            const isSelected = selected.has(it.filename);
            const isOrphan = it.references.length === 0;
            return (
              <div
                key={it.filename}
                onClick={() => toggleItem(it.filename)}
                style={{
                  position: 'relative',
                  background: '#fafaf7',
                  border: `2px solid ${isSelected ? '#E91E8C' : isOrphan ? '#fca5a5' : '#e5e5e5'}`,
                  borderRadius: 6,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  opacity: isPending && isSelected ? 0.5 : 1,
                  transition: 'border-color .15s',
                  boxShadow: isSelected ? '0 0 0 3px rgba(233,30,140,0.18)' : undefined,
                }}
              >
                {/* Checkbox overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    zIndex: 2,
                    background: isSelected ? '#E91E8C' : 'rgba(255,255,255,0.92)',
                    border: `2px solid ${isSelected ? '#E91E8C' : '#e5e5e5'}`,
                    borderRadius: 4,
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    zIndex: 2,
                    background: isOrphan ? '#dc2626' : '#16a34a',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 5px',
                    borderRadius: 3,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {isOrphan ? 'Orphan' : `Used ×${it.references.length}`}
                </div>

                {/* Image */}
                <div style={{ aspectRatio: '1 / 1', background: '#fff', overflow: 'hidden', position: 'relative' }}>
                  <Image
                    src={it.url}
                    alt={it.filename}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 200px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>

                {/* Filename + size */}
                <div style={{ padding: '6px 8px' }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#555',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--pv-f-mono, monospace)',
                      marginBottom: 2,
                    }}
                    title={it.filename}
                  >
                    {it.filename}
                  </div>
                  <div style={{ fontSize: 10, color: '#999' }}>{fmtBytes(it.size_bytes)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(10,10,10,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              background: '#fff',
              borderRadius: 8,
              border: '2px solid #0a0a0a',
              boxShadow: '6px 6px 0 #0a0a0a',
              padding: 24,
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
              <h2 className="text-base font-black text-ink">Delete {selected.size} file{selected.size === 1 ? '' : 's'}?</h2>
            </div>
            <p className="mb-2 text-sm text-neutral-600">
              This permanently removes the selected image{selected.size === 1 ? '' : 's'} from the storage bucket.{' '}
              <strong>This cannot be undone.</strong> Any page still pointing at a deleted URL will show a broken image.
            </p>
            {!selectedOrphansOnly && (
              <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                Warning: {selectedUsedCount} of your {selected.size} selected file{selected.size === 1 ? '' : 's'}{' '}
                {selectedUsedCount === 1 ? 'is' : 'are'} currently referenced by products / pages — deleting{' '}
                {selectedUsedCount === 1 ? 'it' : 'them'} will break those references.
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 rounded border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                <Trash2 size={14} />
                Yes, delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
