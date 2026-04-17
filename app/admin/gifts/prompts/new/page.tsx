import { GiftPromptEditor } from '@/components/admin/gift-prompt-editor';
import type { GiftMode } from '@/lib/gifts/types';

export const dynamic = 'force-dynamic';

export default function NewPromptPage({ searchParams }: { searchParams: { mode?: string } }) {
  const m = searchParams.mode as GiftMode | undefined;
  const valid = m === 'laser' || m === 'uv' || m === 'embroidery' ? m : undefined;
  return <GiftPromptEditor prompt={null} defaultMode={valid} />;
}
