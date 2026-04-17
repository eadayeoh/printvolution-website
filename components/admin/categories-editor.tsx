'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createCategory, updateCategory, deleteCategory } from '@/app/admin/categories/actions';

type Category = { id: string; slug: string; name: string; parent_id: string | null; display_order: number };

export function CategoriesEditor({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Category[]>(initial);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // New row form
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState('');

  const parents = rows.filter((r) => !r.parent_id);

  function mark(id: string) {
    const next = new Set(dirty);
    next.add(id);
    setDirty(next);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || activeId === overId) return;
    const fromIdx = rows.findIndex((r) => r.id === activeId);
    const toIdx = rows.findIndex((r) => r.id === overId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = arrayMove(rows, fromIdx, toIdx);
    // Reassign display_order based on new positions and mark all reordered as dirty
    const updated = next.map((r, i) => ({ ...r, display_order: i }));
    setRows(updated);
    const newDirty = new Set(dirty);
    updated.forEach((r) => newDirty.add(r.id));
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink">Categories</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Organise Print + Gift products. Categories with a parent are subcategories.
            Slug shows up in URLs — keep it lowercase, letters/numbers/hyphens only.
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
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="grid grid-cols-[36px_1fr_1fr_1fr_60px_40px] gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          <div />
          <div>Name</div>
          <div>Slug</div>
          <div>Parent</div>
          <div>Order</div>
          <div />
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">No categories yet. Add one above.</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              {rows.map((r) => (
                <SortableCategoryRow
                  key={r.id}
                  row={r}
                  parents={parents}
                  isDirty={dirty.has(r.id)}
                  inputCls={inputCls}
                  onChange={(patch) => { setRows(rows.map((x) => x.id === r.id ? { ...x, ...patch } : x)); mark(r.id); }}
                  onRemove={() => removeRow(r.id)}
                />
              ))}
            </SortableContext>
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
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className={`grid grid-cols-[36px_1fr_1fr_1fr_60px_40px] items-center gap-3 border-b border-neutral-100 px-4 py-2 text-sm ${isDirty ? 'bg-yellow-50' : ''}`}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-neutral-400 hover:text-ink active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <input
        value={row.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className={inputCls}
      />
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
      <input
        type="number"
        value={row.display_order}
        onChange={(e) => onChange({ display_order: parseInt(e.target.value, 10) || 0 })}
        className={`${inputCls} text-center`}
      />
      <button onClick={onRemove} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
