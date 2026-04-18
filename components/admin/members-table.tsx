'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, Search } from 'lucide-react';
import { deleteMember, deleteMembers } from '@/app/admin/members/actions';

export type MemberRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  points_balance: number;
  total_earned: number;
  tier: string | null;
  joined_at: string;
};

export function MembersTable({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      m.email.toLowerCase().includes(q) ||
      (m.name ?? '').toLowerCase().includes(q) ||
      (m.phone ?? '').toLowerCase().includes(q)
    );
  }, [members, query]);

  const allOnPage = filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const anySelected = selected.size > 0;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (allOnPage) {
      const next = new Set(selected);
      filtered.forEach((m) => next.delete(m.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((m) => next.add(m.id));
      setSelected(next);
    }
  }

  function removeOne(id: string, label: string) {
    if (!confirm(`Delete member "${label}"? Their points history is lost. This can't be undone.`)) return;
    setErr(null);
    startTransition(async () => {
      const r = await deleteMember(id);
      if (!r.ok) { setErr(r.error); return; }
      const next = new Set(selected);
      next.delete(id);
      setSelected(next);
      router.refresh();
    });
  }

  function removeSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} member${selected.size === 1 ? '' : 's'}? This can't be undone.`)) return;
    setErr(null);
    startTransition(async () => {
      const r = await deleteMembers(Array.from(selected));
      if (!r.ok) { setErr(r.error); return; }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {/* Search + bulk bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded border-2 border-neutral-200 bg-white px-9 py-2 text-sm focus:border-pink focus:outline-none"
          />
        </div>
        <div className="text-[11px] text-neutral-500">
          {filtered.length} of {members.length} shown
          {anySelected && ` · ${selected.size} selected`}
        </div>
      </div>

      {anySelected && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border-2 border-pink bg-pink/5 px-4 py-2">
          <div className="text-sm font-bold text-ink">
            {selected.size} member{selected.size === 1 ? '' : 's'} selected
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={isPending}
              className="rounded-full px-3 py-1 text-xs font-bold text-neutral-500 hover:text-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={removeSelected}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Delete {selected.size}
            </button>
          </div>
        </div>
      )}

      {err && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
          ✗ {err}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allOnPage}
                  onChange={toggleAll}
                  aria-label="Select all on page"
                  className="h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3 text-left">Tier</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="w-16 px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-sm text-neutral-500">
                  {members.length === 0 ? 'No members yet.' : 'No members match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-neutral-50 ${selected.has(m.id) ? 'bg-pink/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggle(m.id)}
                      aria-label={`Select ${m.email}`}
                      className="h-4 w-4 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3 font-bold text-ink">
                    <Link href={`/admin/members/${m.id}`} className="hover:text-pink">
                      {m.name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{m.email}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{m.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-pink tabular-nums">
                    {m.points_balance}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-700">
                      {m.tier ?? 'Standard'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(m.joined_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="rounded px-2 py-1 text-[11px] font-bold text-pink hover:bg-pink/10"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeOne(m.id, m.name || m.email)}
                        disabled={isPending}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="Delete this member"
                        aria-label={`Delete ${m.email}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
