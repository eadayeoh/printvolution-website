import { getNavigation, getMegaMenus, getProductRoutes } from '@/lib/data/navigation';
import { getSiteSettings } from '@/lib/data/site-settings';
import { HeaderClient } from './header-client';

export async function Header() {
  const [nav, mega, productRoutes, settings] = await Promise.all([
    getNavigation(),
    getMegaMenus(),
    getProductRoutes(),
    getSiteSettings(),
  ]);

  return <HeaderClient nav={nav} mega={mega} productRoutes={productRoutes} settings={settings} />;
}
