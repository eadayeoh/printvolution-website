export function ComingSoon({ title, description, phase }: { title: string; description?: string; phase?: string }) {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">{title}</h1>
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </div>
      <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-white p-12 text-center">
        <div className="mb-2 text-4xl">🚧</div>
        <p className="mb-1 font-bold text-ink">Coming soon</p>
        <p className="text-sm text-neutral-500">{phase ?? 'This admin page is being built.'}</p>
      </div>
    </div>
  );
}
