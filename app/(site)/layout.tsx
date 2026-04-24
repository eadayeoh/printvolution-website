import { Header } from '@/components/nav/header';
import { Footer } from '@/components/footer/footer';
import { AnnounceBar } from '@/components/announce/announce-bar';

// Header pulls the nav/mega-menu on every request (admin edits should
// land instantly). Force-dynamic disables any static-generation cache
// Vercel might otherwise apply to this shared layout.
export const dynamic = 'force-dynamic';

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
