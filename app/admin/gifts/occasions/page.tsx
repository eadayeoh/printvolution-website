import Link from 'next/link';
import { Plus } from 'lucide-react';
import { countTemplatesByOccasion, listAllOccasionsAdmin } from '@/lib/gifts/data';
import { describeOccasionWindow, isOccasionInWindow } from '@/lib/gifts/occasion';

export const dynamic = 'force-dynamic';

export default async function OccasionsListPage() {
  const [occasions, counts] = await Promise.all([
    listAllOccasionsAdmin(),
    countTemplatesByOccasion(),
  ]);
  const now = new Date();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/gifts" className="text-xs font-bold text-neutral-500 hover:text-ink">← Back to Gifts</Link>
          <h1 className="mt-2 text-2xl font-black text-ink">Gift Occasions</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Date-windowed campaigns. Tag a template with an occasion to make it appear only inside the window.
          </p>
        </div>
        <Link href="/admin/gifts/occasions/new" className="inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark">
          <Plus size={14} /> New occasion
        </Link>
      </div>

      {occasions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="text-2xl mb-2">📆</div>
          <div className="text-sm font-bold text-ink">No occasions yet</div>
          <div className="mt-1 text-xs text-neutral-500">Create one (e.g. Mother&rsquo;s Day 2026), then tag templates with it.</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-[11px] uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Occasion</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Templates</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {occasions.map((o) => {
                const { fromIso, untilIso } = describeOccasionWindow(o);
                const inWindow = isOccasionInWindow(o, now);
                const tplCount = counts[o.id] ?? 0;
                return (
                  <tr key={o.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/gifts/occasions/${o.id}`} className="font-bold text-ink hover:text-pink">
                        {o.name}
                      </Link>
                      {o.badge_label ? (
                        <div className="mt-0.5 text-[10px] text-neutral-500">badge: {o.badge_label}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{o.target_date}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      <span className="text-[11px]">{fromIso} → {untilIso}</span>
                      <div className="text-[10px] text-neutral-500">−{o.days_before}d / +{o.days_after}d</div>
                    </td>
                    <td className="px-4 py-3">
                      {!o.is_active ? (
                        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">Paused</span>
                      ) : inWindow ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">In window</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-700">Out of window</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{tplCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/gifts/occasions/${o.id}`} className="text-xs font-bold text-neutral-500 hover:text-ink">Edit</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
