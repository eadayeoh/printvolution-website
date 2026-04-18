import { getNavigation, getMegaMenus, getProductRoutes } from '@/lib/data/navigation';
import { getSiteSettings } from '@/lib/data/site-settings';
import { createClient } from '@/lib/supabase/server';
import { HeaderClient } from './header-client';

export async function Header() {
  const supabase = createClient();

  // Look up the current user's admin/staff role (non-blocking on error —
  // the admin link just won't render for users without a role).
  let isAdmin = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      const role = profile?.role;
      isAdmin = role === 'admin' || role === 'staff';
    }
  } catch {
    // ignore — header still renders without admin link
  }

  const [nav, mega, productRoutes, settings] = await Promise.all([
    getNavigation(),
    getMegaMenus(),
    getProductRoutes(),
    getSiteSettings(),
  ]);

  return (
    <HeaderClient
      nav={nav}
      mega={mega}
      productRoutes={productRoutes}
      settings={settings}
      isAdmin={isAdmin}
    />
  );
}
