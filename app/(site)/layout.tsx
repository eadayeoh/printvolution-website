import { Header } from '@/components/nav/header';
import { Footer } from '@/components/footer/footer';
import { AnnounceBar } from '@/components/announce/announce-bar';

// Header pulls the nav/mega-menu on every request — but the layout has to
// be cacheable so static pages stay fast. 5s strikes a balance: nav edits
// surface within a hard refresh or two, page-level ISR for other pages
// (where individual routes set their own revalidate) still works. The
// admin save actions ALSO call revalidatePath/revalidateTag to short-circuit
// this for the first visitor after a change.
export const revalidate = 5;

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
