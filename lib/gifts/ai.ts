/**
 * Replicate integration for AI image stylisation.
 *
 * Replicate uses a predictions API: POST creates a job, the response
 * includes a URL you poll until status is 'succeeded' or 'failed'.
 * Output is a URL (or array of URLs) pointing to the generated image.
 *
 * Required env: REPLICATE_API_TOKEN — generate one at
 * replicate.com/account/api-tokens.
 */

const REPLICATE_API = 'https://api.replicate.com/v1';

export type ReplicateInput = {
  /** Model slug — e.g. "fofr/flux-dev-lora-lineart" */
  model: string;
  /** Version hash pinned to the model. If omitted, Replicate resolves
   *  the current latest via the models endpoint first. */
  version?: string;
  /** Input parameters merged with anything the model-specific pipeline
   *  has defined in default_params. The customer's image bytes are
   *  passed via the `image` key (as a data URI). */
  input: Record<string, unknown>;
  /** Bytes of the uploaded photo to stylise. */
  imageBytes: Uint8Array;
  imageMime: string;
  /** Optional prompt text — merged into `input` if the model accepts
   *  a `prompt` key (most img2img/controlnet models do). */
  prompt?: string | null;
  negativePrompt?: string | null;
};

export async function runReplicate(opts: ReplicateInput): Promise<Buffer> {
  // Replicate occasionally returns transient "Prediction interrupted"
  // (PA / E6716) errors. Retry a couple of times before giving up.
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await runReplicateOnce(opts);
    } catch (e: any) {
      lastErr = e;
      const msg = e?.message ?? '';
      const transient = /interrupted|aborted|timed out|ECONN|ETIMEDOUT|5\d\d|429|PA\b|E67/i.test(msg);
      if (!transient || attempt === MAX_ATTEMPTS) throw e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastErr;
}

async function runReplicateOnce(opts: ReplicateInput): Promise<Buffer> {
  // Accept either the canonical `REPLICATE_API_TOKEN` or the friendlier
  // `Replicate` / `REPLICATE` names — Vercel lets admins pick anything
  // and we don't want a name mismatch to silently disable AI.
  const token = process.env.REPLICATE_API_TOKEN
    ?? process.env.Replicate
    ?? process.env.REPLICATE
    ?? process.env.replicate;
  if (!token) {
    throw new Error('Replicate token not set — add REPLICATE_API_TOKEN (or Replicate) to Vercel env');
  }

  // Encode the image as a data URI so we don't need to upload to Replicate's
  // file-storage endpoint separately. Works for images up to a few MB.
  const b64 = Buffer.from(opts.imageBytes).toString('base64');
  const dataUri = `data:${opts.imageMime};base64,${b64}`;

  // Different Replicate models use different parameter shapes for the
  // source image:
  //   - `google/nano-banana` and some others → `image_input` (ARRAY of URIs)
  //   - flux-canny-pro / flux-depth-pro     → `control_image`
  //   - most img2img models                 → `image`
  // The pipeline's default_params can set `image_input_key` + optional
  // `image_as_array: true` to override. Otherwise we pick a sensible
  // default based on the model slug.
  const explicitKey = typeof opts.input.image_input_key === 'string' ? opts.input.image_input_key : null;
  const isNanoBanana = opts.model.includes('nano-banana');
  const isGptImage  = opts.model.includes('gpt-image');
  const modelDefaultKey = isNanoBanana ? 'image_input'
    : isGptImage ? 'input_images'
    : opts.model.includes('canny') ? 'control_image'
    : opts.model.includes('depth') ? 'control_image'
    : 'image';
  const imageKey = explicitKey ?? modelDefaultKey;
  const asArray = opts.input.image_as_array === true || isNanoBanana || isGptImage;
  const input: Record<string, unknown> = { ...opts.input };
  delete input.image_input_key;
  delete input.image_as_array;
  input[imageKey] = asArray ? [dataUri] : dataUri;
  if (opts.prompt) input.prompt = opts.prompt;
  if (opts.negativePrompt) input.negative_prompt = opts.negativePrompt;

  // OpenAI-hosted models on Replicate (gpt-image-1) are BYO-key:
  // Replicate forwards the request and bills the caller's OpenAI
  // account, so the key has to be passed in the input. Read from
  // env so it never lands in the gift_pipelines.default_params row.
  if (opts.model.startsWith('openai/') && !input.openai_api_key) {
    const oaiKey = process.env.OPENAI_API_KEY ?? process.env.OpenAI ?? process.env.openai;
    if (!oaiKey) {
      throw new Error('OpenAI model needs OPENAI_API_KEY in env (Vercel → Settings → Environment Variables).');
    }
    input.openai_api_key = oaiKey;
  }

  // Resolve the latest version if not pinned
  let version = opts.version;
  if (!version) {
    const res = await fetch(`${REPLICATE_API}/models/${opts.model}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Replicate model lookup failed: ${res.status} ${await res.text()}`);
    const body = await res.json() as any;
    version = body?.latest_version?.id;
    if (!version) throw new Error(`Model ${opts.model} has no latest_version`);
  }

  // Kick off the prediction
  const createRes = await fetch(`${REPLICATE_API}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',   // Replicate holds the request open up to 60s
    },
    body: JSON.stringify({ version, input }),
  });
  if (!createRes.ok) {
    throw new Error(`Replicate create failed: ${createRes.status} ${await createRes.text()}`);
  }
  let prediction = await createRes.json() as any;

  // If Prefer: wait didn't resolve it, poll.
  const deadline = Date.now() + 120_000; // 2-minute hard cap
  while (prediction.status && prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    if (Date.now() > deadline) {
      throw new Error(`Replicate prediction timed out after 2min (id=${prediction.id})`);
    }
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(`${REPLICATE_API}/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!poll.ok) throw new Error(`Replicate poll failed: ${poll.status}`);
    prediction = await poll.json();
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(`Replicate ${prediction.status}: ${prediction.error ?? 'unknown'}`);
  }

  // Output can be a URL string or an array of URLs. Take the first.
  const raw = prediction.output;
  const url = Array.isArray(raw) ? raw[0] : raw;
  if (typeof url !== 'string') {
    throw new Error(`Replicate returned no URL (output=${JSON.stringify(raw).slice(0, 200)})`);
  }

  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`Failed to download replicate output: ${imgRes.status}`);
  const ab = await imgRes.arrayBuffer();
  return Buffer.from(ab);
}

/**
 * Direct call to OpenAI's Images Edit endpoint with gpt-image-1.
 * Bypasses Replicate. The model takes an input image + prompt and
 * returns an edited image as base64.
 *
 * Required env: OPENAI_API_KEY (or OpenAI / openai).
 *
 * Default params accept the same shape OpenAI does — `quality`,
 * `background`, `output_format`, `size` — passed through verbatim.
 */
const OPENAI_IMAGES_EDIT = 'https://api.openai.com/v1/images/edits';

export type OpenAiEditInput = {
  /** Model slug — typically 'gpt-image-1'. */
  model: string;
  imageBytes: Uint8Array;
  imageMime: string;
  prompt: string;
  /** Defaults from the pipeline row — merged into the multipart form. */
  defaults: Record<string, unknown>;
};

export async function runOpenAiImageEdit(opts: OpenAiEditInput): Promise<Buffer> {
  const key = process.env.OPENAI_API_KEY ?? process.env.OpenAI ?? process.env.openai;
  if (!key) {
    throw new Error('OPENAI_API_KEY missing — add it to Vercel env (Settings → Environment Variables).');
  }
  if (!opts.prompt?.trim()) {
    throw new Error('OpenAI image edit needs a prompt.');
  }

  // OpenAI's Images Edit endpoint takes multipart/form-data.
  const form = new FormData();
  form.append('model', opts.model);
  form.append('prompt', opts.prompt);
  form.append('image', new Blob([new Uint8Array(opts.imageBytes)], { type: opts.imageMime }), 'image.png');
  // Pass-through admin-configured defaults (quality, background, size,
  // output_format). String-coerce so booleans/numbers serialise cleanly.
  for (const [k, v] of Object.entries(opts.defaults ?? {})) {
    if (v === null || v === undefined) continue;
    form.append(k, String(v));
  }

  const res = await fetch(OPENAI_IMAGES_EDIT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI image edit failed: ${res.status} ${text.slice(0, 400)}`);
  }
  const body = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  const first = body?.data?.[0];
  if (first?.b64_json) {
    return Buffer.from(first.b64_json, 'base64');
  }
  if (first?.url) {
    const imgRes = await fetch(first.url);
    if (!imgRes.ok) throw new Error(`OpenAI output download failed: ${imgRes.status}`);
    return Buffer.from(await imgRes.arrayBuffer());
  }
  throw new Error(`OpenAI returned no image (body=${JSON.stringify(body).slice(0, 400)})`);
}
