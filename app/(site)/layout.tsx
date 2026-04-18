import { Header } from '@/components/nav/header';
import { Footer } from '@/components/footer/footer';
import { AnnounceBar } from '@/components/announce/announce-bar';

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
