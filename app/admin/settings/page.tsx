import { getSiteSettings } from '@/lib/data/site-settings';
import { SiteSettingsForm } from '@/components/admin/site-settings-form';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return <SiteSettingsForm initial={settings} />;
}
