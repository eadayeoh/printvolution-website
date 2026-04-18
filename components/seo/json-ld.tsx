export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
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
        email: 'hello@printvolution.sg',
        image: 'https://printvolution.sg/images/hero-home-print.png',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '60 Paya Lebar Road #B1-35',
          addressLocality: 'Singapore',
          postalCode: '409051',
          addressCountry: 'SG',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '10:00',
            closes: '19:30',
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
  name, slug, description, category, imageUrl, priceFromCents,
}: {
  name: string; slug: string; description?: string | null; category?: string | null;
  imageUrl?: string | null; priceFromCents?: number | null;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        url: `https://printvolution.sg/product/${slug}`,
        description: description ?? undefined,
        category: category ?? undefined,
        image: imageUrl ?? 'https://printvolution.sg/images/hero-home-print.png',
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
