import { GiftPromptEditor } from '@/components/admin/gift-prompt-editor';
import { listActivePipelines } from '@/lib/gifts/pipelines';
import { listAllTemplatesAdmin } from '@/lib/gifts/data';
import type { GiftMode } from '@/lib/gifts/types';

export const dynamic = 'force-dynamic';

export default async function NewPromptPage({ searchParams }: { searchParams: { mode?: string } }) {
  const m = searchParams.mode as GiftMode | undefined;
  const valid = m === 'laser' || m === 'uv' || m === 'embroidery' ? m : undefined;
  const [pipelines, templates] = await Promise.all([
    listActivePipelines(),
    listAllTemplatesAdmin(),
  ]);
  return (
    <GiftPromptEditor
      prompt={null}
      defaultMode={valid}
      pipelines={pipelines}
      availableTemplates={templates}
    />
  );
}
