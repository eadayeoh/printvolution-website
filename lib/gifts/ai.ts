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
