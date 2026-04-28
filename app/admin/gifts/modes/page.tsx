import Link from 'next/link';
import { listAllModesAdmin } from '@/lib/gifts/modes';
import { GiftModeCreateForm } from '@/components/admin/gift-mode-create-form';

export const dynamic = 'force-dynamic';

export default async function AdminGiftModesPage() {
  const modes = await listAllModesAdmin();
  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/admin/gifts" className="text-sm text-neutral-500 hover:text-ink">← Back to gifts</Link>
      </div>
      <h1 className="mb-1 text-2xl font-black">Processing Modes</h1>
      <p className="mb-4 max-w-2xl text-sm text-neutral-600">
        Labels, descriptions, icons and display order for the processing modes on every gift product.
        Add new modes here — they become selectable on products, variants and templates immediately.
        Slugs are immutable once created. Toggle inactive to retire a mode without losing data on
        historical orders.
      </p>
      <GiftModeCreateForm />

      {modes.length === 0 ? (
        <div className="rounded border-2 border-dashed p-8 text-center text-neutral-500">
          No modes yet. Run migration 0038.
        </div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead className="bg-neutral-100">
            <tr>
              <th className="border-b p-2 text-left">Slug</th>
              <th className="border-b p-2 text-left">Label</th>
              <th className="border-b p-2 text-left">Description</th>
              <th className="border-b p-2 text-center">Order</th>
              <th className="border-b p-2 text-center">Active</th>
              <th className="border-b p-2" />
            </tr>
          </thead>
          <tbody>
            {modes.map((m) => (
              <tr key={m.slug} className={m.is_active ? '' : 'opacity-50'}>
                <td className="border-b p-2 font-mono text-xs">{m.slug}</td>
                <td className="border-b p-2 font-bold">{m.label}</td>
                <td className="border-b p-2 text-xs text-neutral-600">{m.description ?? ''}</td>
                <td className="border-b p-2 text-center font-mono text-xs">{m.display_order}</td>
                <td className="border-b p-2 text-center">{m.is_active ? '✓' : '—'}</td>
                <td className="border-b p-2 text-right">
                  <Link
                    href={`/admin/gifts/modes/${m.slug}`}
                    className="rounded border border-ink px-3 py-1 text-xs font-bold hover:bg-yellow-brand"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
