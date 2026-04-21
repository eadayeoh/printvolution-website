import Link from 'next/link';
import { listAllPipelinesAdmin } from '@/lib/gifts/pipelines';

export const dynamic = 'force-dynamic';

export default async function AdminGiftPipelinesPage() {
  const pipelines = await listAllPipelinesAdmin();
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">Gift Pipelines</h1>
        <Link
          href="/admin/gifts/pipelines/new"
          className="rounded border-2 border-ink bg-yellow-brand px-4 py-2 font-bold hover:bg-yellow-300"
        >
          + New pipeline
        </Link>
      </div>
      <p className="mb-4 text-sm text-neutral-600">
        Named processing recipes. Each gift product is pinned to a pipeline (or falls back to the mode default).
      </p>
      {pipelines.length === 0 ? (
        <div className="rounded border-2 border-dashed p-8 text-center text-neutral-500">
          No pipelines yet.
        </div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead className="bg-neutral-100">
            <tr>
              <th className="border-b p-2 text-left">Slug</th>
              <th className="border-b p-2 text-left">Name</th>
              <th className="border-b p-2 text-left">Kind</th>
              <th className="border-b p-2 text-left">Model</th>
              <th className="border-b p-2 text-left">Active</th>
            </tr>
          </thead>
          <tbody>
            {pipelines.map((p) => (
              <tr key={p.id} className="hover:bg-yellow-50">
                <td className="border-b p-2 font-mono text-xs">
                  <Link href={`/admin/gifts/pipelines/${p.id}`} className="underline">{p.slug}</Link>
                </td>
                <td className="border-b p-2">{p.name}</td>
                <td className="border-b p-2 text-xs">{p.kind}</td>
                <td className="border-b p-2 font-mono text-xs">{p.ai_model_slug ?? '—'}</td>
                <td className="border-b p-2 text-center">{p.is_active ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
