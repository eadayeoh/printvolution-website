export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Site-wide Organization + WebSite (with SearchAction). Renders
 *  in the root layout so every page carries the brand identity +
 *  enables Google's sitelinks-searchbox treatment. Uses '@id' to
 *  cross-reference LocalBusiness on the homepage. */
export function OrganizationAndWebSiteSchema() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': 'https://printvolution.sg/#org',
          name: 'Printvolution',
          url: 'https://printvolution.sg',
          logo: 'https://printvolution.sg/icon.png',
          sameAs: [],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': 'https://printvolution.sg/#website',
          name: 'Printvolution',
          url: 'https://printvolution.sg',
          publisher: { '@id': 'https://printvolution.sg/#org' },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://printvolution.sg/shop?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
          },
        }}
      />
    </>
  );
}

/** Schema.org LocalBusiness for homepage */
export function LocalBusinessSchema() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://printvolution.sg/#business',
        name: 'Printvolution',
        url: 'https://printvolution.sg',
        telephone: '+65-6969-3837',
        email: 'enquiry@printvolution.sg',
        image: 'https://printvolution.sg/og-default.png',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Paya Lebar Square, 60 Paya Lebar Road, #B1-35',
          addressLocality: 'Singapore',
          postalCode: '409051',
          addressCountry: 'SG',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '10:00',
            closes: '19:30',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Saturday', 'Sunday'],
            opens: '10:00',
            closes: '19:00',
          },
        ],
        priceRange: 'S$$',
      }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; item?: string }> }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          ...(it.item ? { item: it.item } : {}),
        })),
      }}
    />
  );
}

export function FAQPageSchema({ items }: { items: Array<{ question?: string; answer?: string }> }) {
  const qas = items.filter((i) => i.question && i.answer);
  if (!qas.length) return null;
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: qas.map((i) => ({
          '@type': 'Question',
          name: i.question,
          acceptedAnswer: { '@type': 'Answer', text: i.answer },
        })),
      }}
    />
  );
}

export function ProductSchema({
  name, slug, urlPath, description, category, imageUrl, priceFromCents,
}: {
  name: string;
  /** Print-product slug — paired with the legacy `/product/{slug}` path. */
  slug?: string;
  /** Explicit URL path (without origin). Wins over `slug` when provided
   *  — use this for gifts (`/gift/...`), bundles (`/bundle/...`), etc. */
  urlPath?: string;
  description?: string | null; category?: string | null;
  imageUrl?: string | null; priceFromCents?: number | null;
}) {
  const path = urlPath ?? (slug ? `/product/${slug}` : '/');
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        url: `https://printvolution.sg${path}`,
        description: description ?? undefined,
        category: category ?? undefined,
        image: imageUrl ?? 'https://printvolution.sg/og-default.png',
        brand: { '@type': 'Brand', name: 'Printvolution' },
        offers: priceFromCents !== null && priceFromCents !== undefined ? {
          '@type': 'Offer',
          priceCurrency: 'SGD',
          price: (priceFromCents / 100).toFixed(2),
          availability: 'https://schema.org/InStock',
          seller: { '@id': 'https://printvolution.sg/#business' },
        } : undefined,
      }}
    />
  );
}
