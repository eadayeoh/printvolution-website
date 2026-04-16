export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    processing: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  const cls = styles[status] ?? styles.pending;
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}
