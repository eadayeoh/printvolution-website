export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    processing: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    shipped: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  // Unknown status used to fall through to amber (pending), which
  // hid e.g. a typo'd or out-of-range value as a normal state. Use a
  // visually distinct dashed-outline so the admin spots it instead.
  const known = status in styles;
  const cls = known
    ? styles[status]
    : 'bg-fuchsia-50 text-fuchsia-900 border-dashed border-fuchsia-400';
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}
      title={known ? undefined : 'Unrecognised status — check admin/staff allow-list'}
    >
      {status || '—'}
    </span>
  );
}
