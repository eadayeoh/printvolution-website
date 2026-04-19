import { listProducts } from '@/lib/data/products';
import { getProductRoutes, productHref } from '@/lib/data/navigation';
import { getHomePageContent, homeItems, homeFirst } from '@/lib/data/home';
import { LocalBusinessSchema, FAQPageSchema } from '@/components/seo/json-ld';
import { SplitHero, type SplitHeroItem } from '@/components/home/split-hero';
import { WhyCards, type WhyItem, type WhyHeader } from '@/components/home/why-cards';
import { CategoryTiles, type CategoryTab, type CategoryTilesHeader } from '@/components/home/category-tiles';
import { Proof, type ProofItem, type ProofHeader } from '@/components/home/proof';
import { HowItWorks, type HowHeader, type HowStep } from '@/components/home/how-it-works';
import { Faq, type FaqItem, type FaqHeader } from '@/components/home/faq';
import { Location, type LocationItem, type LocationHeader } from '@/components/home/location';
import { FinalCta, type FinalCtaItem } from '@/components/home/final-cta';

export const metadata = {
  title: 'Printvolution | Printing Services Singapore · Name Cards, Flyers, Banners & Gifts',
  description:
    'Printing services Singapore at Paya Lebar Square. Name cards from $28, flyers, banners, custom embroidery, personalised gifts, NFC business cards. WhatsApp for instant quote. Same-day express available.',
  alternates: { canonical: 'https://printvolution.sg/' },
};

type CategoryTabSection = {
  tab_key?: string;
  tab_label?: string;
  product_slugs?: string[];
  badges?: Record<string, string>;
};

export default async function HomePage() {
  const [sections, products, routes] = await Promise.all([
    getHomePageContent(),
    listProducts(),
    getProductRoutes(),
  ]);

  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const heroItems = homeItems(sections, 'hero.split') as SplitHeroItem[];
  const whyItems = homeItems(sections, 'why.cards') as WhyItem[];
  const whyHeader = homeFirst<WhyHeader>(sections, 'why.header');
  const categoriesHeader = homeFirst<CategoryTilesHeader>(sections, 'categories.header');
  const proofItems = homeItems(sections, 'proof.main') as ProofItem[];
  const proofHeader = homeFirst<ProofHeader>(sections, 'proof.header');
  const howHeader = homeFirst<HowHeader>(sections, 'how.header');
  const howSteps = homeItems(sections, 'how.steps') as HowStep[];
  const faqItems = homeItems(sections, 'faq.items') as FaqItem[];
  const faqHeader = homeFirst<FaqHeader>(sections, 'faq.header');
  const locationItems = homeItems(sections, 'location.main') as LocationItem[];
  const locationHeader = homeFirst<LocationHeader>(sections, 'location.header');
  const finalCta = homeFirst<FinalCtaItem>(sections, 'final_cta.main');

  const categoryTabs: CategoryTab[] = (homeItems(sections, 'categories.tabs') as CategoryTabSection[]).map((t) => {
    const badges = (t.badges ?? {}) as Record<string, string>;
    const slugs = Array.isArray(t.product_slugs) ? t.product_slugs : [];
    return {
      tab_key: t.tab_key ?? 'default',
      tab_label: t.tab_label ?? 'Products',
      tiles: slugs
        .map((slug) => {
          const p = bySlug.get(slug);
          if (!p) return null;
          return {
            slug: p.slug,
            name: p.name,
            image_url: p.image_url,
            tagline: p.tagline,
            min_price_cents: p.min_price,
            href: productHref(p.slug, routes),
            badge: badges[slug] ?? null,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    };
  });

  return (
    <>
      <LocalBusinessSchema />
      <FAQPageSchema items={faqItems} />
      <SplitHero items={heroItems} />
      <WhyCards items={whyItems} header={whyHeader} />
      <CategoryTiles tabs={categoryTabs} header={categoriesHeader} />
      <Proof items={proofItems} header={proofHeader} />
      <HowItWorks header={howHeader} steps={howSteps} />
      <Faq items={faqItems} header={faqHeader} />
      <Location items={locationItems} header={locationHeader} />
      <FinalCta item={finalCta} />
    </>
  );
}
