import { Header } from '@/components/nav/header';
import { Footer } from '@/components/footer/footer';
import { AnnounceBar } from '@/components/announce/announce-bar';

// Header pulls the nav/mega-menu on every request — but admin edits
// only need to propagate within a minute, not instantly. Switching
// from force-dynamic to revalidate=60 lets static pages stay
// cacheable while still picking up nav changes. Pages that genuinely
// need request-time data (cart, auth, product pricing) still set
// their own `dynamic = 'force-dynamic'`.
export const revalidate = 60;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnounceBar />
      <Header />
      <main className="min-h-[calc(100vh-300px)]">{children}</main>
      <Footer />
    </>
  );
}
