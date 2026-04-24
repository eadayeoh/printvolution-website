import type { GiftPipeline } from '@/lib/gifts/types';

const KINDS = ['laser', 'uv', 'embroidery', 'photo-resize', 'eco-solvent', 'digital', 'uv-dtf'] as const;

const PROVIDERS = [
  { value: 'replicate',  label: 'Replicate (AI model)' },
  { value: 'passthrough', label: 'Pass-through (no AI — just crop + 300 DPI)' },
  { value: 'local_edge',  label: 'Local edge detection (free, deterministic)' },
  { value: 'local_bw',    label: 'Local greyscale (free, deterministic)' },
] as const;

const KNOWN_MODELS = [
  { value: 'google/nano-banana',                  label: 'Google · Nano Banana (gemini-2.5-flash-image)' },
  { value: 'openai/gpt-image-1',                  label: 'OpenAI · GPT Image 1' },
  { value: 'black-forest-labs/flux-canny-pro',    label: 'Flux · Canny Pro (edge-preserving)' },
  { value: 'black-forest-labs/flux-dev',          label: 'Flux · Dev (general img2img)' },
  { value: 'fofr/face-to-many',                   label: 'fofr · Face-to-many (cartoon / 3D / emoji)' },
  { value: '__custom__',                          label: 'Other — type a Replicate model slug' },
] as const;

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
  const currentModel = pipeline?.ai_model_slug ?? '';
  const isKnownModel = KNOWN_MODELS.some((m) => m.value === currentModel);
  // If the stored model isn't in our dropdown, preselect "Other" and
  // pre-fill the custom field so admin sees what's currently configured.
  const modelSelectValue = currentModel === '' ? '' : isKnownModel ? currentModel : '__custom__';
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
        <span className="text-xs font-bold uppercase">Provider</span>
        <select
          name="provider"
          defaultValue={(pipeline as any)?.provider ?? 'replicate'}
          required
          className="mt-1 w-full border-2 border-ink p-2"
        >
          {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <span className="mt-1 block text-[11px] text-neutral-500">
          Replicate uses the model below. Pass-through / local-* providers ignore the model — they run a fixed transform.
        </span>
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">AI model</span>
        <select
          name="ai_model_slug_preset"
          defaultValue={modelSelectValue}
          className="mt-1 w-full border-2 border-ink p-2"
        >
          <option value="">— None —</option>
          {KNOWN_MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <span className="mt-1 block text-[11px] text-neutral-500">
          Only used when provider = Replicate. Pick a model; the code auto-maps its input parameters.
        </span>
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">Custom model slug (only if "Other" above)</span>
        <input
          name="ai_model_slug_custom"
          defaultValue={isKnownModel ? '' : currentModel}
          placeholder="owner/model-name"
          className="mt-1 w-full border-2 border-ink p-2 font-mono text-xs"
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase">AI endpoint URL (optional, advanced)</span>
        <input
          name="ai_endpoint_url"
          type="url"
          defaultValue={pipeline?.ai_endpoint_url ?? ''}
          placeholder="https://api.replicate.com/v1/predictions"
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
