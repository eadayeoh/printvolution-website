// Client-safe prompt utilities. Split out of prompts.ts so client
// components (e.g. gift-product-page.tsx) can import the type + filter
// without dragging next/headers (via lib/supabase/server) into the
// browser bundle.
import type { GiftMode, GiftStyle } from './types';

export type GiftPrompt = {
  id: string;
  mode: GiftMode;
  style: GiftStyle;
  pipeline_id: string | null;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  transformation_prompt: string;
  negative_prompt: string | null;
  params: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
  /** When set, the customer only sees this prompt on the PDP when one
   *  of the listed templates is the active selection. NULL or empty =
   *  applies to all templates. */
  applies_to_template_ids?: string[] | null;
};

/** Filter prompts to those that apply to a given template selection.
 *  A prompt applies when its applies_to_template_ids is null/empty
 *  (default — applies to all) OR when the active templateId is in the
 *  list. Pass `null` for templateId on products without a template
 *  picker; only globally-scoped prompts will pass. */
export function filterPromptsByTemplate(
  prompts: GiftPrompt[],
  templateId: string | null,
): GiftPrompt[] {
  return prompts.filter((p) => {
    const ids = p.applies_to_template_ids;
    if (!ids || ids.length === 0) return true;
    return templateId !== null && ids.includes(templateId);
  });
}
