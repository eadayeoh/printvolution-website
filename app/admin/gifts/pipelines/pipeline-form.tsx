import type { GiftPipeline } from '@/lib/gifts/types';

const KINDS = ['laser', 'uv', 'embroidery', 'photo-resize'] as const;

export function PipelineForm({
  pipeline,
  action,
  isNew = false,
}: {
  pipeline?: Partial<GiftPipeline>;
  action: (fd: FormData) => void | Promise<void>;
  isNew?: boolean;
}) {
  const params = pipeline?.default_params ? JSON.stringify(pipeline.default_params, null, 2) : '{}';
  return (
    <form action={action} className="grid max-w-3xl gap-4">
      <label className="block">
        <span className="text-xs font-bold uppercase">Slug</span>
        <input
          name="slug"
          defaultValue={pipeline?.slug ?? ''}
          required
          disabled={!isNew}
          className="mt-1 w-full border-2 border-ink p-2 font-mono text-sm disabled:bg-neutral-100"
          placeholder="laser-handdrawn-v1"
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">Name</span>
        <input
          name="name"
          defaultValue={pipeline?.name ?? ''}
          required
          className="mt-1 w-full border-2 border-ink p-2"
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">Description</span>
        <textarea
          name="description"
          defaultValue={pipeline?.description ?? ''}
          className="mt-1 w-full border-2 border-ink p-2"
          rows={2}
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">Kind</span>
        <select
          name="kind"
          defaultValue={pipeline?.kind ?? 'laser'}
          required
          className="mt-1 w-full border-2 border-ink p-2"
        >
          {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">AI endpoint URL</span>
        <input
          name="ai_endpoint_url"
          type="url"
          defaultValue={pipeline?.ai_endpoint_url ?? ''}
          placeholder="https://api.replicate.com/v1/predictions"
          className="mt-1 w-full border-2 border-ink p-2 font-mono text-xs"
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">AI model slug</span>
        <input
          name="ai_model_slug"
          defaultValue={pipeline?.ai_model_slug ?? ''}
          placeholder="stability-ai/stable-diffusion-xl"
          className="mt-1 w-full border-2 border-ink p-2 font-mono text-xs"
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">Default params (JSON)</span>
        <textarea
          name="default_params"
          defaultValue={params}
          rows={6}
          className="mt-1 w-full border-2 border-ink p-2 font-mono text-xs"
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">Thumbnail URL</span>
        <input
          name="thumbnail_url"
          type="url"
          defaultValue={pipeline?.thumbnail_url ?? ''}
          className="mt-1 w-full border-2 border-ink p-2"
        />
      </label>
      <label className="inline-flex items-center gap-2">
        <input name="is_active" type="checkbox" defaultChecked={pipeline?.is_active ?? true} />
        <span className="text-sm font-bold uppercase">Active</span>
      </label>
      <button type="submit" className="rounded border-2 border-ink bg-yellow-brand px-4 py-2 font-bold">
        {isNew ? 'Create pipeline' : 'Save changes'}
      </button>
    </form>
  );
}
