/**
 * OpenAI Images Edit integration — the only AI provider in this app.
 *
 * Single endpoint: POST https://api.openai.com/v1/images/edits with
 * `model: gpt-image-2` (or the older gpt-image-1). Takes an input
 * image + prompt and returns base64 image bytes.
 *
 * Required env: OPENAI_API_KEY (or OpenAI / openai).
 *
 * Default params accept the same shape OpenAI does — `quality`,
 * `background`, `output_format`, `size` — passed through verbatim.
 */
const OPENAI_IMAGES_EDIT = 'https://api.openai.com/v1/images/edits';

export type OpenAiEditInput = {
  /** Model slug — typically 'gpt-image-2' (latest) or 'gpt-image-1'. */
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
