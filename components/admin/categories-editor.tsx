'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createCategory, updateCategory, deleteCategory } from '@/app/admin/categories/actions';

type Category = { id: string; slug: string; name: string; parent_id: string | null; display_order: number };

export function CategoriesEditor({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Category[]>(initial);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // New row form
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState('');

  const parents = rows.filter((r) => !r.parent_id);

  // Group children under their parents so the list reads as a tree.
  // Parents are sorted by display_order, then each parent's children
  // follow immediately after, also by display_order. This is the visible
  // order shown on the site so dragging reflects what the customer sees.
  const ordered = useMemo(() => {
    const topLevels = rows
      .filter((r) => !r.parent_id)
      .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
    const out: Category[] = [];
    for (const parent of topLevels) {
      out.push(parent);
      const kids = rows
        .filter((r) => r.parent_id === parent.id)
        .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
      out.push(...kids);
    }
    // Orphan subcategories (parent_id set but parent missing) — show at end
    const orphanSubs = rows.filter(
      (r) => r.parent_id && !topLevels.find((p) => p.id === r.parent_id)
    );
    out.push(...orphanSubs);
    return out;
  }, [rows]);

  function mark(id: string) {
    const next = new Set(dirty);
    next.add(id);
    setDirty(next);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } })
  );

  function onDragStart(e: DragStartEvent) {
    setDraggingId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || activeId === overId) return;

    const active = rows.find((r) => r.id === activeId);
    const over = rows.find((r) => r.id === overId);
    if (!active || !over) return;

    // Only allow reordering within the same "level" — parents swap with
    // parents, subcategories swap with siblings under the same parent.
    // Moving an item to a different parent is done via the parent dropdown
    // so we don't silently reparent on drop.
    if ((active.parent_id ?? null) !== (over.parent_id ?? null)) {
      setErr('Drag only reorders within the same parent. To move to another parent, use the Parent dropdown.');
      window.setTimeout(() => setErr(null), 4000);
      return;
    }

    const siblings = rows
      .filter((r) => (r.parent_id ?? null) === (active.parent_id ?? null))
      .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
    const fromIdx = siblings.findIndex((r) => r.id === activeId);
    const toIdx = siblings.findIndex((r) => r.id === overId);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = arrayMove(siblings, fromIdx, toIdx).map((r, i) => ({ ...r, display_order: i }));

    // Merge back into the full row list
    const changedById = new Map(reordered.map((r) => [r.id, r]));
    const nextRows = rows.map((r) => changedById.get(r.id) ?? r);
    setRows(nextRows);

    const newDirty = new Set(dirty);
    reordered.forEach((r) => newDirty.add(r.id));
    setDirty(newDirty);
  }

  function saveAll() {
    setErr(null);
    startTransition(async () => {
      for (const id of Array.from(dirty)) {
        const row = rows.find((r) => r.id === id);
        if (!row) continue;
        const r = await updateCategory(id, {
          slug: row.slug, name: row.name, parent_id: row.parent_id, display_order: row.display_order,
        });
        if (!r.ok) { setErr(`${row.name}: ${r.error}`); return; }
      }
      setDirty(new Set());
      router.refresh();
    });
  }

  function removeRow(id: string) {
    if (!confirm('Delete this category?')) return;
    startTransition(async () => {
      const r = await deleteCategory(id);
      if (!r.ok) { setErr(r.error); return; }
      setRows(rows.filter((x) => x.id !== id));
      router.refresh();
    });
  }

  function add() {
    setErr(null);
    if (!newSlug.trim() || !newName.trim()) { setErr('Slug and name required'); return; }
    startTransition(async () => {
      const r = await createCategory({
        slug: newSlug.trim().toLowerCase(),
        name: newName.trim(),
        parent_id: newParent || null,
        display_order: rows.length,
      });
      if (!r.ok) { setErr(r.error); return; }
      setNewSlug(''); setNewName(''); setNewParent('');
      router.refresh();
    });
  }

  const inputCls = 'rounded border-2 border-neutral-200 bg-white px-3 py-1.5 text-sm focus:border-pink focus:outline-none';
  const dragging = draggingId ? rows.find((r) => r.id === draggingId) ?? null : null;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink">Categories</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Organise Print + Gift products. Drag the pink handle on the left to reorder.
            Subcategories are indented under their parent.
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={isPending || dirty.size === 0}
          className="inline-flex items-center gap-2 rounded-full bg-pink px-5 py-2 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50"
        >
          <Save size={14} />
          {isPending ? 'Saving…' : dirty.size === 0 ? 'No changes' : `Save ${dirty.size} change${dirty.size === 1 ? '' : 's'}`}
        </button>
      </div>

      {err && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800">✗ {err}</div>}

      {/* Add new */}
      <div className="mb-6 rounded-lg border-2 border-dashed border-neutral-300 bg-white p-4">
        <div className="mb-2 text-xs font-bold text-ink">Add new category</div>
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name (e.g. Advertising)" className={inputCls} />
          <input value={newSlug} onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="slug (e.g. advertising)" className={`${inputCls} font-mono text-xs`} />
          <select value={newParent} onChange={(e) => setNewParent(e.target.value)} className={`${inputCls} text-xs`}>
            <option value="">— Top-level —</option>
            {parents.map((p) => <option key={p.id} value={p.id}>↳ subcategory of {p.name}</option>)}
          </select>
          <button type="button" onClick={add} disabled={isPending} className="inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-pink disabled:opacity-50">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          <div />
          <div>Name</div>
          <div>Slug</div>
          <div>Parent</div>
          <div />
        </div>
        {ordered.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">No categories yet. Add one above.</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={ordered.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              {ordered.map((r) => (
                <SortableCategoryRow
                  key={r.id}
                  row={r}
                  parents={parents}
                  isDirty={dirty.has(r.id)}
                  inputCls={inputCls}
                  onChange={(patch) => {
                    setRows(rows.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
                    mark(r.id);
                  }}
                  onRemove={() => removeRow(r.id)}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {dragging ? (
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] items-center gap-3 rounded-lg border-2 border-pink bg-white px-4 py-2 text-sm shadow-[0_20px_40px_-8px_rgba(233,30,140,0.35)]">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-pink text-white">
                    <GripVertical size={14} />
                  </div>
                  <div className="font-bold text-ink">
                    {dragging.parent_id ? '↳ ' : ''}{dragging.name}
                  </div>
                  <div className="font-mono text-xs text-neutral-500">{dragging.slug}</div>
                  <div />
                  <div />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function SortableCategoryRow({
  row, parents, isDirty, inputCls, onChange, onRemove,
}: {
  row: Category;
  parents: Category[];
  isDirty: boolean;
  inputCls: string;
  onChange: (patch: Partial<Category>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isSub = !!row.parent_id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[40px_1fr_1fr_1fr_40px] items-center gap-3 border-b border-neutral-100 px-4 py-2 text-sm ${
        isDragging ? 'opacity-40' : ''
      } ${isDirty ? 'bg-yellow-50' : isSub ? 'bg-neutral-50/50' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-7 w-7 cursor-grab items-center justify-center rounded bg-pink/10 text-pink hover:bg-pink hover:text-white active:cursor-grabbing active:bg-pink active:text-white"
        aria-label={`Drag ${row.name} to reorder`}
        title="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>
      <div className="flex items-center gap-2">
        {isSub && <span className="text-xs text-neutral-300" aria-hidden>↳</span>}
        <input
          value={row.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`${inputCls} flex-1 ${isSub ? 'ml-4' : ''}`}
        />
      </div>
      <input
        value={row.slug}
        onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
        className={`${inputCls} font-mono text-xs`}
      />
      <select
        value={row.parent_id ?? ''}
        onChange={(e) => onChange({ parent_id: e.target.value || null })}
        className={`${inputCls} text-xs`}
      >
        <option value="">— Top-level —</option>
        {parents.filter((p) => p.id !== row.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button onClick={onRemove} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
