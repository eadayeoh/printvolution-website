export function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="mb-3 inline-block rounded-full border border-pink px-3 py-1 text-xs font-bold text-pink">
        Coming soon
      </div>
      <h1 className="mb-4 text-4xl font-black text-ink">{title}</h1>
      {description && <p className="text-neutral-600">{description}</p>}
      <p className="mt-6 text-sm text-neutral-500">
        This page is being rebuilt. Database integration comes in Phase 1.
      </p>
    </div>
  );
}
