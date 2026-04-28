import { GiftTemplateEditor } from '@/components/admin/gift-template-editor';
import { listAllOccasionsAdmin, listAllTemplatesAdmin } from '@/lib/gifts/data';
import { listAllModesAdmin, toModeOptions } from '@/lib/gifts/modes';

export const dynamic = 'force-dynamic';

export default async function NewTemplatePage() {
  const [all, modes, occasions] = await Promise.all([
    listAllTemplatesAdmin(),
    listAllModesAdmin(),
    listAllOccasionsAdmin(),
  ]);
  const existingGroups = Array.from(
    new Set(all.map((t) => t.group_name).filter((g): g is string => !!g && g.trim().length > 0)),
  ).sort();
  return (
    <GiftTemplateEditor
      template={null}
      existingGroups={existingGroups}
      availableModes={toModeOptions(modes)}
      availableOccasions={occasions}
    />
  );
}
