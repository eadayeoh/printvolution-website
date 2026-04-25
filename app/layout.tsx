import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OrganizationAndWebSiteSchema } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: {
    default: 'Printvolution | Printing Services Singapore',
    template: '%s | Printvolution',
  },
  description:
    'Printing services Singapore at Paya Lebar Square. Name cards from $28, flyers, banners, custom embroidery, personalised gifts, NFC business cards. WhatsApp for instant quote. Same-day express available.',
  metadataBase: new URL('https://printvolution.sg'),
  openGraph: {
    type: 'website',
    siteName: 'Printvolution',
    locale: 'en_SG',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Printvolution' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-default.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  // SITE IS UNDER CONSTRUCTION — block all search engines until launch.
  // To re-enable indexing later, remove the `robots` field below AND update
  // /app/robots.ts to allow crawling.
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Archivo:wght@400;500;600;700;800;900&family=Archivo+Black&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <OrganizationAndWebSiteSchema />
        <div className="cmyk-bar">
          <div /><div /><div /><div />
        </div>
        {children}
      </body>
    </html>
  );
}
