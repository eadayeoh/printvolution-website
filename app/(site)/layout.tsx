import { Header } from '@/components/nav/header';
import { Footer } from '@/components/footer/footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-300px)]">{children}</main>
      <Footer />
    </>
  );
}
