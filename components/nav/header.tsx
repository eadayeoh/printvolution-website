import Link from 'next/link';
import { getNavigation, getMegaMenus, getProductRoutes } from '@/lib/data/navigation';
import { HeaderClient } from './header-client';

export async function Header() {
  const [nav, mega, productRoutes] = await Promise.all([
    getNavigation(),
    getMegaMenus(),
    getProductRoutes(),
  ]);

  return <HeaderClient nav={nav} mega={mega} productRoutes={productRoutes} />;
}
