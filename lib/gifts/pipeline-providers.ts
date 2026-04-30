/** Gift pipeline providers — see lib/gifts/pipeline/transforms.ts. */
export type GiftPipelineProvider =
  | 'passthrough'    // Sharp resize/crop only — no AI, free.
  | 'local_edge'     // Local edge-detect filter — free.
  | 'local_bw'       // Local B&W conversion — free.
  | 'openai';        // OpenAI gpt-image-2 image edits — paid.

/** Providers that don't touch OpenAI. The customer is allowed to
 *  replace the source photo for these — re-runs cost only Sharp +
 *  storage, both already paid for. Anything outside this set forces
 *  the customer back through /gift/[slug] to set up a new design. */
export const COST_FREE_PROVIDERS: ReadonlySet<GiftPipelineProvider> = new Set([
  'passthrough',
  'local_edge',
  'local_bw',
]);

export function isCostFreeProvider(provider: string | null | undefined): boolean {
  return !!provider && COST_FREE_PROVIDERS.has(provider as GiftPipelineProvider);
}
