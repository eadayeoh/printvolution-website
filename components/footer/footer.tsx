import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-200 bg-ink text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 text-xl font-black">
              Print<span className="text-pink">volution</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              Printing services and personalised gifts at Paya Lebar Square. Walk in or order online.
            </p>
            <div className="space-y-1 text-sm text-white/70">
              <div>📍 60 Paya Lebar Road #B1-35, S409051</div>
              <div>📞 +65 6969 3837</div>
              <div>🕐 Mon–Sat 10am–7.30pm</div>
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href="https://www.instagram.com/printvolution/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold transition-colors hover:bg-pink"
              >
                IG
              </a>
              <a
                href="https://wa.me/6585533497"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold transition-colors hover:bg-pink"
              >
                WA
              </a>
            </div>
          </div>

          {/* Print */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Print</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><FooterLink href="/shop?category=advertising">Advertising</FooterLink></li>
              <li><FooterLink href="/shop?category=cards-and-types">Cards &amp; Stationery</FooterLink></li>
              <li><FooterLink href="/shop?category=business-stationery">Business Stationery</FooterLink></li>
              <li><FooterLink href="/shop?category=packaging">Packaging</FooterLink></li>
              <li><FooterLink href="/shop?category=wearables">Wearables</FooterLink></li>
              <li><FooterLink href="/shop?category=embroidery">Embroidery</FooterLink></li>
            </ul>
          </div>

          {/* Gifts */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Gifts</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><FooterLink href="/shop?category=personalised-gifts">Personalised Gifts</FooterLink></li>
              <li><FooterLink href="/shop?category=jewellery">Jewellery</FooterLink></li>
              <li><FooterLink href="/shop?category=lifestyle">Lifestyle</FooterLink></li>
              <li><FooterLink href="/shop?category=wedding-and-events">Wedding &amp; Events</FooterLink></li>
              <li><FooterLink href="/shop?category=drinkware-and-barware">Drinkware</FooterLink></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><FooterLink href="/about">About Us</FooterLink></li>
              <li><FooterLink href="/bundles">Bundles</FooterLink></li>
              <li><FooterLink href="/membership">Membership</FooterLink></li>
              <li><FooterLink href="/faq">FAQ</FooterLink></li>
              <li><FooterLink href="/contact">Contact</FooterLink></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
          © {new Date().getFullYear()} Printvolution Pte Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="transition-colors hover:text-pink">
      {children}
    </Link>
  );
}
