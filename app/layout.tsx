import type { Metadata } from 'next';
import './globals.css';

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
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="cmyk-bar">
          <div /><div /><div /><div />
        </div>
        {children}
      </body>
    </html>
  );
}
