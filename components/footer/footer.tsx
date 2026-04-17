import Link from 'next/link';
import { MessageCircle, MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-white">
      {/* CMYK stripe at top */}
      <div className="grid h-1.5 grid-cols-4">
        <div className="bg-cyan-400" />
        <div className="bg-pink" />
        <div className="bg-yellow-300" />
        <div className="bg-black" />
      </div>

      {/* Big lockup + CTA */}
      <div className="relative">
        {/* Watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-6 top-8 select-none text-[min(22vw,300px)] font-black leading-none tracking-[-0.06em] text-white/[0.04]"
        >
          Printvolution
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-10 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="text-[26px] font-black leading-none">
                  Print<span className="text-pink">volution</span>
                </div>
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
                  SG
                </span>
              </div>
              <p className="mb-5 max-w-sm text-sm leading-relaxed text-white/60">
                Printing services and personalised gifts at Paya Lebar Square.
                Honest pricing, sharp quality, people who pick up the phone.
              </p>

              <div className="space-y-2 text-[13px] text-white/70">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-pink" />
                  <a
                    href="https://maps.google.com/?q=60+Paya+Lebar+Road+B1-35"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    60 Paya Lebar Road, #B1-35, S409051
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <Phone size={14} className="mt-0.5 shrink-0 text-pink" />
                  <a href="https://wa.me/6585533497" className="hover:text-white">+65 8553 3497</a>
                </div>
                <div className="flex items-start gap-2">
                  <Clock size={14} className="mt-0.5 shrink-0 text-pink" />
                  <span>Mon–Sat · 10am – 7.30pm</span>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <a
                  href="https://www.instagram.com/printvolution/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-pink hover:bg-pink"
                  aria-label="Instagram"
                >
                  <span className="text-[11px] font-black">IG</span>
                </a>
                <a
                  href="https://wa.me/6585533497"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-pink hover:bg-pink"
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={16} />
                </a>
              </div>
            </div>

            {/* Print column */}
            <FooterColumn title="Print">
              <FooterLink href="/shop?category=advertising">Banners & Displays</FooterLink>
              <FooterLink href="/shop?category=cards">Cards & Stationery</FooterLink>
              <FooterLink href="/shop?category=books">Brochures</FooterLink>
              <FooterLink href="/shop?category=stickers">Stickers</FooterLink>
              <FooterLink href="/shop?category=wearables">Apparel</FooterLink>
              <FooterLink href="/shop?category=packaging">Packaging</FooterLink>
            </FooterColumn>

            {/* Gifts column */}
            <FooterColumn title="Gifts">
              <FooterLink href="/gift/led-photo-frame">Photo Frames</FooterLink>
              <FooterLink href="/gift/bar-necklace">Jewellery</FooterLink>
              <FooterLink href="/gift/3d-bar-keychain">Keychains</FooterLink>
              <FooterLink href="/gift/line-art-embroidery-shirt">Embroidery</FooterLink>
              <FooterLink href="/gift/yeti-mug">Drinkware</FooterLink>
              <FooterLink href="/gift/custom-cake-topper">Wedding</FooterLink>
            </FooterColumn>

            {/* Company column */}
            <FooterColumn title="Company">
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/bundles">Bundles</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/membership">Membership</FooterLink>
              <FooterLink href="/faq">FAQ</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </FooterColumn>
          </div>

          {/* Giant call-to-action word */}
          <Link
            href="/contact"
            className="group relative mt-16 block border-t border-white/10 pt-10"
          >
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-[clamp(40px,7vw,96px)] font-black leading-[0.9] tracking-[-0.04em] transition-colors group-hover:text-pink">
                Let&apos;s make something{' '}
                <span className="italic font-serif font-normal text-pink group-hover:text-white">loud.</span>
              </div>
              <ArrowUpRight
                size={60}
                className="shrink-0 text-white transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-pink"
                strokeWidth={1.5}
              />
            </div>
            <div className="mt-2 text-sm text-white/50">
              Walk in, WhatsApp us, or order online — we&apos;ll sort it out.
            </div>
          </Link>

          {/* Bottom strip */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-white/40">
            <div>© {new Date().getFullYear()} Printvolution Pte Ltd. All rights reserved.</div>
            <div className="flex items-center gap-5">
              <span>Made in Singapore</span>
              <span>·</span>
              <span>SGD pricing</span>
              <span>·</span>
              <a href="https://wa.me/6585533497" target="_blank" rel="noopener noreferrer" className="hover:text-pink">WhatsApp 30-min reply</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-pink">{title}</h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1 text-sm text-white/65 transition-colors hover:text-white"
      >
        <span className="h-1 w-1 rounded-full bg-pink/0 transition-colors group-hover:bg-pink" />
        {children}
      </Link>
    </li>
  );
}
