'use client';

// SafeEmail — renders an email address in a way that defeats naive
// DOM-scraping spam harvesters. Server-side HTML shows a non-clickable
// "enquiry [at] printvolution.sg" with the two parts split by an
// aria-hidden span, so a regex scanning HTML sees no literal '@' next
// to the domain. On mount we hydrate the real value and swap in a
// live mailto link.
//
// Input format: pass the email as user + domain props — never render
// the concatenated form into the server HTML.
//
// Usage:
//   <SafeEmail user="enquiry" domain="printvolution.sg" />
//
// Notes:
//   - This won't stop determined scrapers that execute JS (rare), but
//     it stops the 95% of harvesters that run on static HTML.
//   - For public anchors that must ship a clickable mailto in the
//     server HTML (e.g. inside page_content for accessibility), prefer
//     the contact form as the primary channel and let SafeEmail cover
//     the visible address.

import { useEffect, useState } from 'react';

type Props = {
  user: string;
  domain: string;
  className?: string;
  style?: React.CSSProperties;
  /** Copy shown before hydration / if JS is disabled. */
  fallbackSeparator?: string; // default " [at] "
};

export function SafeEmail({
  user,
  domain,
  className,
  style,
  fallbackSeparator = ' [at] ',
}: Props) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    // Server/pre-hydration render: no real @ adjacent to the domain.
    return (
      <span className={className} style={style}>
        {user}
        <span aria-hidden>{fallbackSeparator}</span>
        {domain}
      </span>
    );
  }

  const address = `${user}@${domain}`;
  return (
    <a href={`mailto:${address}`} className={className} style={style}>
      {address}
    </a>
  );
}
