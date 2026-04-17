'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, X, Search } from 'lucide-react';
import { saveMegaMenu } from '@/app/admin/pages/actions';

type Section = {
  section_heading: string;
  items: Array<{ product_slug: string; label: string }>;
};

type Product = { slug: string; name: string };

export function MegaEditorDnd({
  menuKey, heading, initial, products,
}: {
  menuKey: string; heading: string; initial: Section[]; products: Product[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sections, setSections] = useState<Section[]>(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [addingToSection, setAddingToSection] = useState<number | null>(null);

  const productBySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function save() {
    setStatus(null);
    startTransition(async () => {
      const payload = sections
        .filter((s) => s.section_heading.trim())
        .map((s) => ({
          section_heading: s.section_heading.trim(),
          items: s.items.filter((i) => i.product_slug && i.label.trim()),
        }));
      const r = await saveMegaMenu(menuKey, payload);
      if (r.ok) {
        setStatus('✓ Saved');
        setTimeout(() => setStatus(null), 1600);
        router.refresh();
      } else {
        setStatus('✗ ' + (r.error ?? 'Failed'));
      }
    });
  }

  // --- Drag-and-drop -------------------------------------------------------
  const [activeKey, setActiveKey] = useState<string | null>(null);

  function onDragStart(e: DragStartEvent) {
    setActiveKey(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveKey(null);
    const active = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (!over || active === over) return;

    // Section drag: ids are `sec:<idx>`
    if (active.startsWith('sec:') && over.startsWith('sec:')) {
      const from = parseInt(active.slice(4), 10);
      const to = parseInt(over.slice(4), 10);
      setSections(arrayMove(sections, from, to));
      return;
    }

    // Item drag: ids are `it:<sectionIdx>:<itemIdx>`
    if (active.startsWith('it:')) {
      const [, sStr, iStr] = active.split(':');
      const fromSec = parseInt(sStr, 10);
      const fromItem = parseInt(iStr, 10);

      if (over.startsWith('it:')) {
        // Drop on another item — reorder / move across sections
        const [, oSStr, oIStr] = over.split(':');
        const toSec = parseInt(oSStr, 10);
        const toItem = parseInt(oIStr, 10);
        const item = sections[fromSec].items[fromItem];

        setSections((prev) => {
          const next = prev.map((s, i) => ({ ...s, items: [...s.items] }));
          // remove from source
          next[fromSec].items.splice(fromItem, 1);
          // insert at destination (account for index shift if same section & after)
          let insertAt = toItem;
          if (fromSec === toSec && fromItem < toItem) insertAt = toItem - 1;
          next[toSec].items.splice(insertAt, 0, item);
          return next;
        });
      } else if (over.startsWith('dropzone:')) {
        // Dropped on an empty section's drop zone
        const toSec = parseInt(over.slice(9), 10);
        const item = sections[fromSec].items[fromItem];
        setSections((prev) => {
          const next = prev.map((s) => ({ ...s, items: [...s.items] }));
          next[fromSec].items.splice(fromItem, 1);
          next[toSec].items.push(item);
          return next;
        });
      }
    }
  }

  // Find the dragged item for the overlay
  let overlayContent: React.ReactNode = null;
  if (activeKey) {
    if (activeKey.startsWith('sec:')) {
      const idx = parseInt(activeKey.slice(4), 10);
      overlayContent = <SectionCardChrome title={sections[idx]?.section_heading || 'Section'} ghost />;
    } else if (activeKey.startsWith('it:')) {
      const [, s, i] = activeKey.split(':');
      const it = sections[+s]?.items?.[+i];
      if (it) overlayContent = <ItemChip label={it.label || productBySlug.get(it.product_slug)?.name || '?'} ghost />;
    }
  }

  // --- Mutations -----------------------------------------------------------
  function updateSection(i: number, patch: Partial<Section>) {
    setSections(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }
  function removeSection(i: number) {
    if (!confirm('Remove this section and its items?')) return;
    setSections(sections.filter((_, j) => j !== i));
  }
  function removeItem(si: number, ii: number) {
    setSections(sections.map((s, j) => (j === si ? { ...s, items: s.items.filter((_, k) => k !== ii) } : s)));
  }
  function addProductsToSection(si: number, slugs: string[]) {
    const have = new Set(sections[si].items.map((x) => x.product_slug));
    const toAdd = slugs.filter((s) => !have.has(s));
    const additions = toAdd
      .map((slug) => productBySlug.get(slug))
      .filter(Boolean)
      .map((p) => ({ product_slug: p!.slug, label: p!.name }));
    setSections(sections.map((s, j) => (j === si ? { ...s, items: [...s.items, ...additions] } : s)));
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-ink">{heading}</h2>
          <p className="text-xs text-neutral-500">
            Drag section cards to reorder columns · drag chips to reorder or move between sections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status && <span className={`text-xs font-bold ${status.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{status}</span>}
          <button onClick={save} disabled={isPending} className="rounded-full bg-pink px-5 py-2 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50">
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((_, i) => `sec:${i}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sections.length === 0 && (
              <div className="rounded border-2 border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-500">
                No sections. Click <strong>Add section</strong> below to start.
              </div>
            )}
            {sections.map((section, si) => (
              <SortableSection key={`sec:${si}`} id={`sec:${si}`}>
                <SectionCardChrome
                  title={section.section_heading}
                  onTitleChange={(v) => updateSection(si, { section_heading: v })}
                  onRemove={() => removeSection(si)}
                  itemCount={section.items.length}
                >
                  <SortableContext items={section.items.map((_, ii) => `it:${si}:${ii}`)} strategy={verticalListSortingStrategy}>
                    <div
                      className="flex flex-wrap gap-2"
                      data-dropzone={`dropzone:${si}`}
                      id={`dropzone:${si}`}
                    >
                      {section.items.length === 0 ? (
                        <EmptyDropZone sectionIdx={si} />
                      ) : (
                        section.items.map((it, ii) => (
                          <SortableItem
                            key={`it:${si}:${ii}`}
                            id={`it:${si}:${ii}`}
                            label={it.label || productBySlug.get(it.product_slug)?.name || it.product_slug}
                            slug={it.product_slug}
                            onLabelChange={(v) => setSections(sections.map((s, j) => j === si ? { ...s, items: s.items.map((x, k) => k === ii ? { ...x, label: v } : x) } : s))}
                            onRemove={() => removeItem(si, ii)}
                          />
                        ))
                      )}
                      <button
                        type="button"
                        onClick={() => setAddingToSection(si)}
                        className="flex h-10 items-center gap-1 rounded-full border-2 border-dashed border-neutral-300 px-4 text-xs font-bold text-neutral-500 hover:border-pink hover:text-pink"
                      >
                        <Plus size={14} /> Add products
                      </button>
                    </div>
                  </SortableContext>
                </SectionCardChrome>
              </SortableSection>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>{overlayContent}</DragOverlay>
      </DndContext>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setSections([...sections, { section_heading: 'New section', items: [] }])}
          className="flex items-center gap-1.5 rounded border-2 border-neutral-200 px-4 py-2 text-xs font-bold text-ink hover:border-ink"
        >
          <Plus size={14} /> Add section
        </button>
      </div>

      {addingToSection !== null && (
        <ProductPickerModal
          products={products}
          excludeSlugs={new Set(sections[addingToSection]?.items.map((i) => i.product_slug) ?? [])}
          onCancel={() => setAddingToSection(null)}
          onConfirm={(slugs) => {
            addProductsToSection(addingToSection!, slugs);
            setAddingToSection(null);
          }}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sortable primitives
// ---------------------------------------------------------------------------

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-stretch gap-2">
        <div
          className="flex cursor-grab items-center rounded-l-lg bg-neutral-100 px-2 text-neutral-400 hover:bg-neutral-200 hover:text-ink active:cursor-grabbing"
          {...listeners}
          aria-label="Drag section"
        >
          <GripVertical size={18} />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function SectionCardChrome({
  title, onTitleChange, onRemove, itemCount, children, ghost,
}: {
  title: string;
  onTitleChange?: (v: string) => void;
  onRemove?: () => void;
  itemCount?: number;
  children?: React.ReactNode;
  ghost?: boolean;
}) {
  return (
    <div className={`rounded-lg border-2 ${ghost ? 'border-pink bg-pink/5 shadow-lg' : 'border-neutral-200'} bg-white p-4`}>
      <div className="mb-3 flex items-center gap-2">
        {onTitleChange ? (
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Section heading"
            className="flex-1 rounded border-2 border-neutral-200 bg-white px-3 py-1.5 text-sm font-bold focus:border-pink focus:outline-none"
          />
        ) : (
          <div className="flex-1 text-sm font-bold text-ink">{title || 'Untitled section'}</div>
        )}
        {typeof itemCount === 'number' && (
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
        )}
        {onRemove && (
          <button type="button" onClick={onRemove} className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600" title="Remove section">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function SortableItem({
  id, label, slug, onLabelChange, onRemove,
}: {
  id: string; label: string; slug: string;
  onLabelChange: (v: string) => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const [editing, setEditing] = useState(false);
  return (
    <div ref={setNodeRef} style={style} className="group flex h-10 items-center rounded-full border border-neutral-200 bg-white pr-1 text-xs font-semibold text-ink">
      <div
        className="flex h-full cursor-grab items-center rounded-l-full px-2 text-neutral-400 hover:text-ink active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </div>
      {editing ? (
        <input
          autoFocus
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Enter') setEditing(false); }}
          className="mx-0 w-40 rounded border border-pink bg-white px-2 py-0.5 text-xs font-semibold focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="max-w-[220px] truncate px-2 py-0.5 hover:text-pink"
          title={`Slug: ${slug} — click to rename the menu label`}
        >
          {label}
        </button>
      )}
      <span className="mx-1 font-mono text-[9px] text-neutral-400">{slug}</span>
      <button type="button" onClick={onRemove} className="rounded-full p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600" title="Remove">
        <X size={12} />
      </button>
    </div>
  );
}

function ItemChip({ label, ghost }: { label: string; ghost?: boolean }) {
  return (
    <div className={`flex h-10 items-center rounded-full border border-pink bg-pink/10 px-3 text-xs font-semibold text-pink ${ghost ? 'shadow-lg' : ''}`}>
      <GripVertical size={14} className="mr-1" />
      {label}
    </div>
  );
}

function EmptyDropZone({ sectionIdx }: { sectionIdx: number }) {
  const { setNodeRef, isOver } = useSortable({ id: `dropzone:${sectionIdx}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex h-10 w-full items-center justify-center rounded-full border-2 border-dashed px-4 text-xs italic ${isOver ? 'border-pink bg-pink/10 text-pink' : 'border-neutral-200 text-neutral-400'}`}
    >
      Drop products here
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product picker modal
// ---------------------------------------------------------------------------

function ProductPickerModal({
  products, excludeSlugs, onCancel, onConfirm,
}: {
  products: Product[];
  excludeSlugs: Set<string>;
  onCancel: () => void;
  onConfirm: (slugs: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) =>
      !excludeSlugs.has(p.slug) && (!q || p.name.toLowerCase().includes(q) || p.slug.includes(q))
    );
  }, [query, products, excludeSlugs]);

  function toggle(slug: string) {
    const next = new Set(picked);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setPicked(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 p-4">
          <div>
            <div className="font-bold text-ink">Add products</div>
            <div className="text-[11px] text-neutral-500">{picked.size} selected</div>
          </div>
          <button onClick={onCancel} className="rounded p-1 text-neutral-500 hover:bg-neutral-100">
            <X size={18} />
          </button>
        </div>
        <div className="border-b border-neutral-100 p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded border-2 border-neutral-200 bg-white px-9 py-2 text-sm focus:border-pink focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500">
              {query ? `No matches for "${query}"` : 'All products are already in this section.'}
            </div>
          ) : (
            <div className="grid gap-1 sm:grid-cols-2">
              {filtered.map((p) => {
                const isPicked = picked.has(p.slug);
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => toggle(p.slug)}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-xs transition-colors ${isPicked ? 'border-pink bg-pink/5' : 'border-neutral-200 hover:border-neutral-400'}`}
                  >
                    <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 ${isPicked ? 'border-pink bg-pink' : 'border-neutral-300'}`}>
                      {isPicked && <span className="text-[9px] text-white">✓</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-ink">{p.name}</div>
                      <div className="truncate font-mono text-[10px] text-neutral-400">{p.slug}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 p-3">
          <button onClick={onCancel} className="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-bold text-ink hover:border-ink">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(Array.from(picked))}
            disabled={picked.size === 0}
            className="rounded-full bg-pink px-5 py-1.5 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50"
          >
            Add {picked.size > 0 && `(${picked.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
