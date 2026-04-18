// Bulk SEO rewrite for all service pages (non-gift products).
// No brand name, no pricing, no material/technical specs — per SEO brief.
// Each record has unique keyword intent. Run with: node scripts/seo-rewrite-services.mjs

import fs from 'node:fs/promises';
import postgres from 'postgres';

const env = await fs.readFile(new URL('../.env.local', import.meta.url), 'utf8');
for (const raw of env.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('='); if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const REWRITES = [
  {
    slug: 'car-decal',
    seo_title: 'Car Decal Printing Singapore | Vehicle Stickers & Wraps',
    seo_desc: 'Custom car decals, vehicle stickers and fleet livery in Singapore. Weatherproof outdoor graphics cut to any shape for branding and promotions.',
    seo_body:
`Vehicle branding that works whether you're parked, driving, or delivering. Car decals put your message in front of thousands of people every time the vehicle hits the road.

Common use cases in Singapore:
- Delivery vans and logistics fleets
- F&B and retail shopfront vehicles
- Property agent branding
- Ride-share vehicle ad wraps
- Personal vehicle customisation

Decals survive Singapore's sun, rain, and daily washes without fading, lifting at the edges, or leaving sticky residue when it's time to remove them. We cut to any shape — bodywork, rear windows, bumpers, door panels. Upload your artwork, confirm dimensions, and we'll preflight the file before production.

Outdoor-graded vinyl gives you years of wear from a single print run, so the cost per impression is trivial compared to any other ad medium. Order once and the vehicle markets for you on every trip.`,
  },
  {
    slug: 'door-hanger',
    seo_title: 'Door Hanger Printing Singapore | Custom Marketing Hangers',
    seo_desc: 'Custom door hangers printed for property, F&B and neighbourhood marketing in Singapore. Die-cut hang holes, bulk runs, fast turnaround.',
    seo_body:
`Flyers get ignored. Door hangers don't. They sit on the handle until someone physically removes them — and in that one moment, they're read.

Where door hangers outperform flyers:
- Residential property marketing drops
- Hotel housekeeping and guest service notices
- Tuition, home service and renovation promotions
- F&B delivery launches in residential estates
- Grand opening announcements

We die-cut the hang hole so the finished piece drops onto any handle cleanly. Standard formats or fully custom shapes — square, rounded, keyhole cuts, shaped to your brand.

Turnaround is fast enough for time-sensitive campaigns: submit artwork, we preflight the same day, and bulk quantities are ready in a few working days. Ideal for citywide door-to-door drops where you need everything printed identically and delivered on schedule.`,
  },
  {
    slug: 'easel-stand',
    seo_title: 'Easel Stand Printing Singapore | Event & Signage Displays',
    seo_desc: 'Printed easel stands for events, exhibitions, weddings and retail. Portable signage displays with high-impact graphics, sized to your artwork.',
    seo_body:
`Easel stands are the most flexible portable signage format in Singapore. Set one up anywhere there's floor space — no fixings, no drilling, no tools — and you have a branded display ready in seconds.

Ideal for:
- Weddings and engagement ceremonies (seating plans, welcome signs)
- Trade shows and exhibitions
- Retail store promotions and sale announcements
- Conference and corporate event signage
- Open houses and showflat directionals

We print the graphic panel to the exact size and aspect of your easel, mounted on rigid board so it sits upright without warping. Multiple panels can be swapped in and out of a single stand for re-usable campaigns.

Upload your design, pick your display size, and your event-ready easel stand is produced and ready to collect or deliver in a few working days.`,
  },
  {
    slug: 'flyers',
    seo_title: 'Flyer Printing Singapore | Promotional & Marketing Flyers',
    seo_desc: 'Flyer printing in Singapore for promotions, events, and local campaigns. Fast turnaround, bulk quantities, vivid colour, human file check.',
    seo_body:
`Flyers remain one of the cheapest ways to reach a local audience in Singapore — provided the design lands and the copy gives the reader a reason to act. Handed out at MRT stations, slipped under doors, tucked into deliveries, or stacked on a counter, a good flyer still outperforms most digital ads on cost per attention.

Where flyers work in Singapore:
- Retail promotions and grand openings
- F&B menu drops in residential estates
- Tuition centre and enrichment class enrolment
- Property launches and roadshow follow-ups
- Event invitations and ticket sales

We print both standard and landscape formats, single or double-sided, in bulk or short runs. Every order is preflight-checked by a real person within hours — meaning your CMYK conversion, bleed, and resolution get flagged before the press runs, not after you receive 5,000 unusable flyers.

Submit artwork, confirm quantity, and islandwide delivery or same-location pickup is available once the job is printed.`,
  },
  {
    slug: 'hand-fan',
    seo_title: 'Custom Hand Fan Printing Singapore | Branded Event Fans',
    seo_desc: 'Personalised hand fans printed for weddings, corporate events, and outdoor promotions in Singapore. Full-colour graphics, bulk quantities.',
    seo_body:
`Singapore weather makes hand fans the rare promotional item that gets used — not stashed in a drawer. Weddings, outdoor events, and corporate giveaways all benefit from a keepsake that's actually functional.

When they work best:
- Wedding favours for outdoor solemnisations
- Corporate brand activations and expos
- Graduation and school milestone events
- Religious and cultural ceremonies
- Summer retail store gifting

Print full-colour artwork on both sides — bold brand graphics, wedding monograms, event branding, or a message from the sender. Handles are sturdy enough to keep the fan in use long after the event ends, which means passive brand exposure every time someone uses it.

Upload your design, confirm bulk quantity, and we preflight before printing so colours and edge bleed land correctly. Ideal for event gifting where the cost per impression keeps paying you back.`,
  },
  {
    slug: 'life-size-standee',
    seo_title: 'Life Size Standee Printing Singapore | Cardboard Cutouts',
    seo_desc: 'Life-size standee and cardboard cutout printing in Singapore for events, photo booths, retail and launches. Vivid print, freestanding.',
    seo_body:
`A life-size standee stops people in their tracks. It's the signage equivalent of having your celebrity, mascot, or product hero physically in the room — and in retail, event, and campaign settings, that's a photo opportunity waiting to be posted.

Popular applications in Singapore:
- Film, music and K-pop launches
- Birthday and bridal photo booths
- Retail product heroes and campaign ambassadors
- Corporate event brand moments
- Kids' parties and themed events

We print and cut the figure to your exact outline — full body, three-quarter, or chest-up — mounted on rigid board with a fold-out back support so it stands without a base or stand. Upload a high-res image or designed artwork and we'll preflight it for edge bleed before cutting.

Ready for collection or islandwide delivery once finished, packed flat for transport to your event venue.`,
  },
  {
    slug: 'acrylic-signage',
    seo_title: 'Acrylic Signage Singapore | Custom Business Signs',
    seo_desc: 'Personalised acrylic business signs in Singapore. Logo-cut shopfront signage, office plaques, reception wall signs with a premium finish.',
    seo_body:
`Acrylic signage is what walks the line between premium and practical. It reads as high-end at reception, holds up indoors for years, and can be fitted to a retail shopfront or office wall with standoffs that give it a floating look no paper or vinyl sign can match.

Common uses in Singapore:
- Shopfront logo signs for retail and F&B
- Office reception and boardroom signage
- Clinic, salon, and professional service branding
- Real estate showflat directionals
- Wedding and event welcome signs

We cut the acrylic to your logo or artwork outline — no rectangular backing unless you want one — and finish edges smoothly. Print direct onto the acrylic face for crisp full-colour branding, or layer with a laser-cut second piece for a dimensional look.

Mounting hardware included where standoffs are needed. Send artwork, confirm final size, and we'll preflight before cutting.`,
  },
  {
    slug: 'pvc-canvas',
    seo_title: 'PVC Canvas Banner Printing Singapore | Outdoor Banners',
    seo_desc: 'Heavy-duty PVC banner printing in Singapore for outdoor events, construction hoardings, stores, and promotional displays. Weather-resistant.',
    seo_body:
`PVC canvas banners are the workhorse of Singapore outdoor signage — cheap per square foot, weatherproof, and big enough to be read from across the street.

Where PVC canvas earns its keep:
- Construction and renovation hoardings
- Event backdrops and outdoor booths
- Grand opening storefront banners
- Sale season promotions
- Condo and community board messaging

We print edge-to-edge in full colour with eyelets or rope hems finished to your order. UV-rated print means the banner holds colour through Singapore sun without fading in the first campaign. Indoor applications — ceilings, walls, trade show booths — also work well and hang flat without creasing.

Any size from small pull-up banner through full hoarding wraps, produced to order. Upload artwork, confirm dimensions and finishing (eyelets, rope, pole pockets), and turnaround is fast enough for launch-week deadlines.`,
  },
  {
    slug: 'roll-up-banner',
    seo_title: 'Roll Up Banner Printing Singapore | Pull-Up Event Banners',
    seo_desc: 'Roll-up banner printing in Singapore for trade shows, events, retail and lobby branding. Portable pull-up stands with replaceable graphics.',
    seo_body:
`Roll-up banners are the most-ordered portable display in Singapore for a reason: they pack down into a tube, set up in 15 seconds, and deliver a full-height brand moment anywhere there's floor space.

Where they earn the space:
- Trade shows and exhibitions
- Retail store entry and window displays
- Conference and seminar stages
- Lobby and reception branding
- Roadshows and pop-up activations

The base and pole are reusable — only the printed graphic needs changing between campaigns. Keep one stand and cycle in new panels for sales seasons, product launches, or regional rollouts. Fits in the boot of most cars for easy transport between venues.

Design to standard portrait dimensions with clear top-third messaging (this is where attention lands first), upload, and we preflight before printing. Ready for pickup or delivery in a few working days.`,
  },
  {
    slug: 'table-tent',
    seo_title: 'Table Tent Printing Singapore | F&B & Event Display Cards',
    seo_desc: 'Table tent card printing in Singapore for restaurants, cafes, hotels, and events. Menu specials, promotions, and QR code placements.',
    seo_body:
`Table tents are the quietest, most effective upsell tool in F&B — a triangular prism that sits on the table, reads from every seat, and makes the case for dessert, drinks, or the house special while diners are already committed to the meal.

Where table tents pay for themselves:
- Daily specials and limited-time menus
- Reward programme and loyalty sign-ups
- QR code menu and feedback links
- Hotel room amenities and services
- Wedding and event reception details

Printed on both sides so every angle of the table has a view. The freestanding triangle shape holds itself up without clips or stands, which means fewer parts to manage and replace. Swap them out as often as your menu changes — cheap enough to reprint weekly for rotating specials.

Upload artwork, choose run size, and we finish and fold to standard or custom dimensions.`,
  },
  {
    slug: 'wobbler',
    seo_title: 'Shelf Wobbler Printing Singapore | Retail POS Signage',
    seo_desc: 'Shelf wobbler printing in Singapore for retail, supermarkets, and in-store promotions. Eye-catching point-of-sale signage with flexible arms.',
    seo_body:
`Wobblers catch the eye because they move. Attached to a shelf edge with a flexible arm, they wave gently as shoppers walk past — and in a retail aisle of 200 products competing for attention, that tiny bit of motion is the difference between "read" and "walked past."

Where wobblers win:
- Supermarket promotional pricing and new launches
- Pharmacy and beauty store shelf tags
- Bookstores and specialty retail highlights
- Convenience store checkout area promotions
- Trade show booth shelf branding

We cut the wobbler panel to your artwork shape — circular, pill, or brand-shaped — and attach the flexible arm to your shelf fitting. Branded both sides if you need it, single-sided if the placement is against a wall.

Bulk orders for chain rollouts are our most common use case. Upload the design once, specify store counts per SKU, and we'll print and pack for distribution.`,
  },
  {
    slug: 'x-stand-banner',
    seo_title: 'X Stand Banner Printing Singapore | Event Banner Display',
    seo_desc: 'X-stand banner printing in Singapore. Lightweight crossbar banners for events, lobbies, trade shows, and pop-up retail displays.',
    seo_body:
`X-stand banners are the lightest portable display format on the market — the entire kit, banner and frame combined, fits in a slim carry bag you can fly with. For roadshows and off-island events in particular, they're the go-to choice.

Where x-stand banners work best:
- Mall roadshows and short-term activations
- Inter-regional trade shows where equipment flies
- Job fair and recruitment booths
- Conference sponsor backdrops
- Retail promotional setup during peak periods

The x-frame clips to four eyelets on the banner and tensions flat — set up in under a minute, breakdown even faster. Replace the printed banner between campaigns while reusing the frame, so the cost over time trends toward just the graphic print.

Portrait orientation is standard; we also produce custom widths for off-spec frames. Upload artwork, we preflight for eyelet clearance, and the finished banner is ready in a few working days.`,
  },
  {
    slug: 'artist-canvas',
    seo_title: 'Canvas Printing Singapore | Photo & Art Canvas Prints',
    seo_desc: 'Photo and art canvas printing in Singapore. Gallery-wrapped canvas prints for home décor, office walls, gifts, and custom artwork.',
    seo_body:
`Canvas prints turn a photograph or artwork into a wall piece that feels crafted rather than printed. The texture of the canvas weave catches light differently from paper, and the gallery-wrap edges mean the piece hangs cleanly without framing.

Where canvas prints land best:
- Family and wedding portrait walls
- Office reception artwork and décor
- Personalised gifts (anniversaries, birthdays)
- Studio and gallery editions
- Hotel, café, and restaurant interiors

We stretch the canvas over a rigid wooden frame so the image wraps around the sides — no staples visible, no sagging over time. Any size from small accent pieces to oversized statement walls. Send a high-resolution photo or illustration and we'll preflight for colour accuracy before printing.

Ready to hang straight out of the box — hanging hardware pre-fitted so you mount it to the wall in seconds.`,
  },
  {
    slug: 'photo-frames',
    seo_title: 'Photo Frame Printing Singapore | Custom Framed Prints',
    seo_desc: 'Custom photo frame printing in Singapore. Personalised framed prints for gifts, home décor, and office walls. High-quality colour reproduction.',
    seo_body:
`Framed photo prints are the gift that moves from the delivery box to the wall or desk and stays there for years. Whether you're printing a wedding portrait, a family milestone, or a piece of artwork, a clean frame turns a digital file into a permanent piece of the room.

Where framed prints earn their space:
- Wedding and anniversary gifts
- Newborn and baby milestone prints
- Corporate recognition and retirement gifts
- Office wall portraits and branded pieces
- Memorial and tribute pieces

Upload your photo at the highest resolution available, pick frame style and orientation, and we handle the colour-accurate print and frame assembly. Matted or full-bleed options, portrait or landscape, sized to standard or custom dimensions.

Arrives ready to display — no assembly, no separate matting to mount. Ideal as a gift item because the unboxing is the moment, not the assembly.`,
  },
  {
    slug: 'poster',
    seo_title: 'Poster Printing Singapore | Custom Event & Wall Posters',
    seo_desc: 'Custom poster printing in Singapore for events, marketing, classrooms, and décor. Sharp colour reproduction, any size, fast turnaround.',
    seo_body:
`Posters are the format that still delivers maximum impact per dollar — big enough to read across a room, cheap enough to print in quantity, and universally understood by every audience.

Where posters still dominate:
- Event promotions (concerts, exhibitions, film)
- Education classroom and revision guides
- Retail window displays and product launches
- Conference signage and directionals
- Home and studio décor

Any size from small A3 up to oversized statement walls. Sharp colour reproduction for illustration-heavy work, neutral whites for typography-led designs. We print indoor-finish posters for permanent displays and weatherproof options for outdoor windows and bus stops.

Upload artwork, confirm dimensions, and we preflight before production. Bulk runs for venue-wide campaigns are handled in the same turnaround window as single-print orders.`,
  },
  {
    slug: 'books',
    seo_title: 'Book Printing Singapore | Custom Short & Long Runs',
    seo_desc: 'Custom book printing in Singapore — self-publishing, corporate reports, coffee table books, and short-run trade publications. Full-service finishing.',
    seo_body:
`Book printing in Singapore covers a wider range of use cases than most customers realise — self-published novels, corporate annual reports, coffee table photography books, school yearbooks, art portfolios, and everything in between.

What we commonly produce:
- Self-published fiction and non-fiction
- Company annual reports and anniversary books
- Coffee table photography and art books
- School yearbooks and graduation books
- Poetry collections and zines

We handle covers, interior pages, and binding as a complete service — saddle-stitched for shorter books, perfect-bound for anything over a certain page count, and case-bound hardcover for premium editions. Colour-accurate interior printing for photo-heavy books, crisp black-on-white for text-driven work.

Send the interior file and cover artwork, confirm page count and binding style, and we preflight before production. Short runs (tens of copies) and longer runs (hundreds to low thousands) are both welcome.`,
  },
  {
    slug: 'envelopes',
    seo_title: 'Envelope Printing Singapore | Branded Business Envelopes',
    seo_desc: 'Custom envelope printing in Singapore. Branded business envelopes, wedding invitations, and corporate mailing with logo and return address.',
    seo_body:
`Printed envelopes are where most brand experiences begin — the envelope lands on the desk before the letter does. For businesses, wedding senders, and direct mail campaigns, a branded envelope sets tone before a single word is read.

Common formats in Singapore:
- Corporate letter and invoice envelopes
- Wedding and formal invitation envelopes
- Direct mail campaign envelopes
- Thank-you card and gifting envelopes
- Legal and professional service envelopes

We print logos, return addresses, and full-colour artwork on the front, back, or both — window cut-outs available where addressing uses mail-merge inserts. Standard business sizes and custom dimensions for invitation cards and branded keepsakes.

Upload artwork, confirm quantity and finishing, and we handle the die-cut, print, and fold as a finished product ready to stuff and seal.`,
  },
  {
    slug: 'hang-tag',
    seo_title: 'Hang Tag Printing Singapore | Custom Product & Retail Tags',
    seo_desc: 'Custom hang tag printing in Singapore for retail, apparel, gift, and product branding. Die-cut shapes, stringing, and bulk production.',
    seo_body:
`Hang tags are the retail tag that carries brand tone — threaded onto clothing, attached to handmade goods, or tied to gift boxes. Done well, they double as both pricing tag and brand artifact worth keeping.

Where hang tags show up in Singapore:
- Apparel retail and fashion brands
- Handmade and artisan product lines
- Gift shop and wedding favour tagging
- F&B gift boxes and hampers
- Corporate gift and promotional bundle tags

We die-cut to your tag shape — round, square, tapered, or fully custom — and punch the string hole in the right spot. Print artwork edge-to-edge on both sides, with space left for pricing or product details to be stamped separately.

Upload your brand artwork and tag shape, confirm bulk quantity, and the finished tags are ready for threading or shipped with pre-attached string.`,
  },
  {
    slug: 'letterhead',
    seo_title: 'Letterhead Printing Singapore | Corporate Letterhead',
    seo_desc: 'Custom letterhead printing in Singapore for corporate, legal, and professional services. Branded A4 letterhead with full-colour logo.',
    seo_body:
`Branded letterhead signals that your business takes its correspondence seriously — and in legal, accounting, real estate, and professional services, that signal still counts. Clients who receive official communication on printed letterhead read it differently from a PDF attachment.

Where printed letterhead still matters:
- Legal firms and court-facing correspondence
- Audit, accounting, and financial services
- Property, notarisation, and official documents
- Corporate formal offers and engagement letters
- Recruitment, HR, and employment letters

Full-colour logos, footer contact blocks, watermarks, and second-page continuation formats are all standard. Clean white stock keeps printer behaviour predictable for office inkjet and laser top-up prints.

Upload artwork, confirm pack size, and the finished sheets are ready for use across printers, direct mail, and manual signing.`,
  },
  {
    slug: 'long-brochures',
    seo_title: 'Brochure Printing Singapore | Tri-Fold & Long Brochures',
    seo_desc: 'Brochure printing in Singapore — tri-fold, bi-fold, and long-form brochures for retail, events, hotels, and corporate information.',
    seo_body:
`Brochures do what websites can't: they live in the customer's hand, travel home with them, and sit on the counter until the buying decision is made. For hotels, retail, tourism, and services with a longer consideration cycle, a printed brochure still closes deals.

Where brochures still sell:
- Hotel, resort, and tourism information
- Real estate launches and showflat handouts
- Trade show and exhibition giveaways
- Service and B2B information packs
- Membership and club recruitment

We print bi-fold, tri-fold, gatefold, and long-form multi-panel layouts, creased so the folds stay sharp even after handling. Double-sided full-colour with edge-to-edge bleed for photography-heavy layouts.

Upload your artwork with fold guides, confirm fold style and quantity, and we preflight the file before scoring and folding the finished piece.`,
  },
  {
    slug: 'loose-sheets',
    seo_title: 'Loose Sheet Printing Singapore | Custom A4 & A5 Prints',
    seo_desc: 'Loose sheet printing in Singapore for worksheets, forms, training handouts, and office documents. A4, A5, any volume.',
    seo_body:
`Loose-sheet printing is the unglamorous workhorse of Singapore offices, classrooms, and training centres — any scenario where paper handouts get distributed and used immediately without binding or finishing.

Where loose sheets work:
- Training centre worksheets and handouts
- Tuition and enrichment class materials
- Corporate workshop and seminar packs
- Internal memos, forms, and procedure sheets
- Event programme inserts and one-pagers

Single-sided or double-sided, black-only or full-colour, any standard paper size. For high-volume worksheets we run cost-efficient digital prints; for colour-critical materials the output is kept press-matched.

Upload the file, confirm quantity and sides, and the finished stack is ready for use. Bulk pricing scales sensibly, so ordering thousands of sheets for a term's worth of lessons is significantly cheaper per page than topping up from an office printer.`,
  },
  {
    slug: 'mug',
    seo_title: 'Custom Mug Printing Singapore | Personalised Ceramic Mugs',
    seo_desc: 'Custom mug printing in Singapore for corporate gifting, events, birthdays, and weddings. Personalised photo and logo mugs, bulk or single.',
    seo_body:
`Printed mugs are the gift that sits on a desk, gets used daily, and quietly advertises a brand, family, or event for years. For corporate gifting, brand activations, and personalised occasions, they remain one of the highest-utilisation promotional items.

Where printed mugs get used:
- Corporate client gifts and staff appreciation
- Wedding favours and engagement gifts
- Birthday and anniversary personalised gifts
- Event merchandise and takeaways
- Brand merchandise for F&B and retail

Full-colour artwork wraps around the mug with crisp photo reproduction — personalised photos, logo placements, inside jokes, custom illustrations, or matching sets. Dishwasher-safe so the print survives daily use rather than fading after the third wash.

Order single pieces for personalised gifting or bulk quantities for corporate and event runs. Upload the image, choose mug style, and we preflight for print quality before production.`,
  },
  {
    slug: 'ncr-form',
    seo_title: 'NCR Form Printing Singapore | Carbonless Forms & Invoices',
    seo_desc: 'Carbonless NCR form printing in Singapore for invoices, receipts, delivery orders, and purchase orders. Two-part and three-part sets.',
    seo_body:
`NCR (no-carbon-required) forms are the invisible backbone of Singapore's service and logistics businesses — the duplicate and triplicate forms that record a transaction, delivery, or work order and leave a copy with both parties instantly.

Where NCR forms still run the business:
- Invoice, receipt, and bill books
- Delivery orders and proof-of-delivery
- Purchase orders and quotations
- Service reports and field work orders
- Inspection and inventory forms

Available as two-part (white + pink), three-part (white + pink + yellow), or four-part sets, bound into pads with perforated tear-off edges. Numbering available for sequential tracking — useful for audit trails and accounts reconciliation.

Upload your form layout, confirm pad count and numbering start range, and we produce the carbonless sets with glued-top pads ready for field use.`,
  },
  {
    slug: 'rubber-stamp',
    seo_title: 'Rubber Stamp Making Singapore | Self-Inking & Wooden Stamps',
    seo_desc: 'Custom rubber stamp making in Singapore — self-inking, pre-inked, and wooden handle stamps for business, legal, and creative use.',
    seo_body:
`Rubber stamps remain the fastest way to apply a company chop, signature, address, or mark to paperwork — no printer, no ink cartridge, no electricity. In Singapore's office and legal environment, they're still a daily tool.

Where rubber stamps still earn their keep:
- Company chops and official stamps
- Signature and name stamps for bulk signing
- Return address stamps for mailing
- Date stamps for receipts and forms
- Creative stamps for branding and packaging

Self-inking models carry thousands of impressions between ink refills and eliminate the separate ink pad. Wooden-handle stamps give a more traditional feel and work well for occasional-use or display. Pre-inked (laser) stamps deliver the crispest impression for official seals.

Upload your artwork — logo, text, signature, or mark — and we match to the right stamp body and impression size. Turnaround is fast enough for urgent same-week needs.`,
  },
  {
    slug: 'stickers',
    seo_title: 'Sticker Printing Singapore | Custom Die-Cut Stickers',
    seo_desc: 'Custom sticker printing in Singapore. Die-cut, kiss-cut, and roll stickers for packaging, branding, retail, and promotional use.',
    seo_body:
`Stickers are the cheapest branded object you can put into a customer's hand. Attached to packaging, laptops, shop windows, kids' workbooks, or event goodie bags, they travel further than any flyer and cost a fraction per impression.

Where stickers earn their spot:
- Product packaging and sealed labels
- Brand merchandise and free gifts
- Retail sale and promotional tags
- Event giveaways and kids' party favours
- Shop window, laptop, and helmet branding

We cut stickers to any shape — die-cut for fully custom outlines, kiss-cut if you want easy peel from a backing sheet, or as rolls for label dispensers. Single-sticker designs or mixed sheets with several designs per sheet, both work.

Upload artwork, pick cut style and quantity, and we preflight for bleed and cut accuracy before printing. Most orders collect or ship in a few working days.`,
  },
  {
    slug: 'uv-dtf-sticker',
    seo_title: 'UV DTF Sticker Printing Singapore | Premium Transfer Stickers',
    seo_desc: 'UV DTF sticker printing in Singapore for glassware, packaging, electronics, and premium product branding. Textured, durable, waterproof.',
    seo_body:
`UV DTF (direct-to-film) stickers are the premium upgrade to standard vinyl — textured, waterproof, scratch-resistant, and with a finish that reads more like printed enamel than a sticker. For packaging, glassware, and product personalisation, they elevate the unboxing.

Where UV DTF stickers land best:
- Tumblers, glasses, and drinkware branding
- Premium packaging and unboxing experiences
- Electronics, phone case, and accessory decoration
- Wedding favours and bespoke gift branding
- Limited-edition product runs

The transfer adheres to curved, textured, and non-flat surfaces that standard stickers can't grip, including glass, metal, wood, and coated plastics. Full-colour artwork with fine detail survives both the transfer process and everyday handling.

Upload your artwork at full colour, confirm final sticker size and run quantity, and we preflight before transfer production. Sold as ready-to-apply transfers with instructions included.`,
  },
  {
    slug: 'luxury-business-card',
    seo_title: 'Luxury Business Card Singapore | Premium Card Printing',
    seo_desc: 'Luxury business card printing in Singapore — premium finishes, foil stamping, letterpress, and heavy card stocks for executives and brands.',
    seo_body:
`Luxury business cards aren't about thickness alone — they're about the moment of exchange. Weight, edge, finish, and the subtle tactile detail that tells the recipient this person has invested in their presence. In Singapore's corporate and creative networking scenes, the detail is noticed.

Where luxury business cards land:
- C-suite and executive representation
- Creative directors, architects, and designers
- Wealth advisors and private banking
- Premium retail, fashion, and hospitality
- Fine dining restaurant management

We produce cards with metallic foil stamping, embossed or debossed logos, edge-painted sides, letterpress impressions, and heavyweight stocks that feel substantial between the fingers. Each premium detail is added case by case — single or combined — based on what fits your brand's reading of refined.

Upload artwork, talk us through the finishes you want, and we preflight and sample before production. Typical production runs are moderate rather than volume — luxury cards are ordered less often and kept longer.`,
  },
  {
    slug: 'name-card',
    seo_title: 'Name Card Printing Singapore | Business Card Printing',
    seo_desc: 'Name card printing in Singapore for business professionals, creatives, and new hires. Fast turnaround, full-colour, double-sided, and rush options.',
    seo_body:
`Name cards remain the single highest-frequency networking artefact in Singapore — passed at meetings, events, client visits, conferences, and chance introductions. In a country where face-to-face first impressions still decide business relationships, a good name card still matters.

Who orders name cards in Singapore:
- New hires and recent promotions
- Corporate sales and account managers
- Property, insurance, and financial advisors
- Creative freelancers and consultants
- Trade show and conference attendees

Standard portrait and landscape formats, single or double-sided, with room for QR codes, social handles, secondary offices, or language-swapped sides for cross-border clients. Same-day or rush options available when you need cards before tomorrow's meeting.

Upload your artwork, confirm run size, and we preflight within hours — flagging bleed, resolution, and colour issues before printing. Most standard orders finish within a few working days.`,
  },
  {
    slug: 'nfc-card',
    seo_title: 'NFC Business Card Singapore | Smart Digital Tap Cards',
    seo_desc: 'NFC smart business card printing in Singapore. Tap to share contact, socials, and portfolio — reprogrammable, durable, modern networking.',
    seo_body:
`NFC business cards are what networking looks like in Singapore's tech and creative scenes today — tap the card to a phone and your full contact profile, portfolio, or social links land instantly. No app install, no QR scan, no typing.

Where NFC cards take over from paper:
- Tech founders and product teams
- Real estate and financial advisors (instant profile handoff)
- Creative freelancers (portfolio and reel in one tap)
- Sales professionals at high-volume networking events
- Conference keynote and speaker roles

The card is programmed to link to whatever destination you update — a dedicated landing page, your company profile, a scheduling link, or a social-first media kit. Update the destination later without reprinting; the card forwards to whatever you configure.

Each card is durable enough for wallet storage and daily tapping. Upload your artwork for the front and back face, configure the NFC destination URL, and we preflight and program the cards before shipping.`,
  },
  {
    slug: 'pvc-card',
    seo_title: 'PVC Card Printing Singapore | Membership & ID Cards',
    seo_desc: 'PVC card printing in Singapore — membership cards, staff passes, gift cards, and loyalty cards. Credit-card format, durable, full-colour.',
    seo_body:
`PVC cards are the credit-card-format plastic that sits in a wallet for years — durable, water-resistant, and professional in a way paper or laminated cards never quite achieve. For membership, loyalty, ID, and gift-card programs, they're the default format in Singapore.

Where PVC cards are the right choice:
- Gym, salon, and club membership cards
- Staff ID and access cards
- Retail loyalty and stamp cards
- Gift card and voucher formats
- Hotel room key and resort access cards

Full-colour artwork both sides, with options for magnetic stripes, barcode printing, signature panels, and embossed names or numbers. Card numbering is printed sequentially for membership roll-out or one-to-one personalisation with names and photos for staff ID programs.

Upload your artwork and the list of names/numbers if personalisation is needed. We proof, preflight, and produce cards ready for issuing or laminating onto lanyards.`,
  },
  {
    slug: 'transparent-card',
    seo_title: 'Transparent Business Card Singapore | Clear Plastic Cards',
    seo_desc: 'Transparent plastic business card printing in Singapore. Unique see-through cards for creative brands, agencies, and premium positioning.',
    seo_body:
`Transparent business cards stop people mid-conversation — which is the entire point. When the standard format is a rectangle of white paper, a clear plastic card with selectively printed artwork is the card that gets kept in a wallet instead of the drawer.

Where transparent cards work best:
- Design studios and creative agencies
- Photography and film professionals
- Architecture and interior practices
- Premium retail and hospitality concepts
- Personal branding for creative directors

The clear plastic base shows through where your design leaves it — typography, logos, and graphic marks print opaque against the transparency, while negative space stays see-through. The tactile difference registers immediately on handover.

Any logo or artwork that uses strong contrast between printed and un-printed areas translates well. Upload your design, we advise on contrast and placement before proofing, and production runs to your order quantity.`,
  },
  {
    slug: 'money-packet',
    seo_title: 'Custom Money Packet Printing Singapore | Ang Pow Printing',
    seo_desc: 'Custom red packet and ang pow printing in Singapore for Chinese New Year, weddings, and corporate festive gifting. Bulk and small runs.',
    seo_body:
`Red packets carry meaning in Singapore's festive and life-event calendar — Chinese New Year, weddings, births, corporate celebrations — so the packet itself is part of the gift. A personalised design signals thought and investment in a way bank-branded packets don't.

Where personalised packets earn attention:
- Corporate CNY gifting to clients and staff
- Wedding yi ping (matching pair) packets
- Birth announcements and full-month celebrations
- Brand activation and festive campaigns
- Religious and community events

Full-colour artwork on the front, back, or both, with metallic gold and red inks where tradition calls for them. Die-cut and glued to the finished packet shape so the product is ready to fill and distribute — no assembly required.

Bulk runs for corporate CNY campaigns are our most common order. Upload artwork with your language and messaging, confirm quantity, and we produce packets ready for the season.`,
  },
  {
    slug: 'paper-bag',
    seo_title: 'Paper Bag Printing Singapore | Custom Branded Bags',
    seo_desc: 'Custom paper bag printing in Singapore for retail, F&B, events, and luxury packaging. Branded handles, gusset, and edge-to-edge artwork.',
    seo_body:
`A branded paper bag is a shopfront that travels. After the customer leaves your store, café, or event, the bag walks down Orchard Road carrying your logo — and every person who passes sees the brand without spending a dollar on that impression.

Where branded paper bags matter most:
- Retail and fashion boutique takeaway
- F&B takeout and gift packaging
- Event goodie bags and conference handouts
- Hotel amenity and welcome packaging
- Premium gifting and luxury unboxing

Full-colour artwork edge-to-edge on both sides, custom handle options (rope, twisted paper, ribbon, punch-out), and gusseted bases that hold structured items cleanly. Multiple sizes for different retail categories — flat bags for apparel, wide bases for boxed goods, slim for documents.

Upload your artwork with fold and handle guides, confirm bag size and run, and we produce bags ready for stocking at your till or packing table.`,
  },
  {
    slug: 'tote-bag',
    seo_title: 'Custom Tote Bag Printing Singapore | Branded Canvas Bags',
    seo_desc: 'Custom tote bag printing in Singapore for events, brands, schools, and corporate gifting. Canvas bags with full-colour logo printing.',
    seo_body:
`Tote bags are the branded merchandise that gets used rather than stashed. Grocery runs, weekend errands, conference refills, gym-to-office handoffs — a well-made tote earns its placement in the rotation, which means passive brand exposure every time it leaves the house.

Where tote bags earn the spend:
- Corporate client and staff gifting
- Conference and event delegate bags
- School, university, and alumni merchandise
- Retail loyalty rewards and purchase gifts
- Brand activation giveaways

Full-colour artwork, single-sided or both sides, with logo placements that fit the bag's natural focal area. Canvas construction holds up to heavy loads and frequent use, so your brand is still legible after a year of daily use.

Upload logo and artwork, confirm size and bulk quantity, and we print and finish bags ready for distribution or stocking at a merch counter.`,
  },
  {
    slug: 'aprons',
    seo_title: 'Apron Printing Singapore | Custom F&B & Retail Aprons',
    seo_desc: 'Custom apron printing and embroidery in Singapore for F&B, retail, salons, and event teams. Logo placement on chest, pockets, or full front.',
    seo_body:
`Branded aprons are what uniform does best in F&B and retail — marking staff as part of the team without the formality of a full uniform. For cafés, restaurants, bakeries, salons, and event staff, they're the minimum viable uniform that still reads professional.

Where branded aprons work:
- Café, restaurant, and bakery staff
- Salon, spa, and grooming businesses
- Butchers, artisan food stalls, and market vendors
- Cooking class, workshop, and event staff
- Merchandise for home cooks and gifting

Logo placement on the chest, pocket, or full-front, with name personalisation for longer-term staff. Embroidery for a premium, long-wearing brand mark; screen print for high-impact graphics that wash well over many cycles.

Upload your logo and tell us the placement, quantity, and whether you want names embroidered. We produce aprons ready for shift use.`,
  },
  {
    slug: 'embroidery',
    seo_title: 'Embroidery Services Singapore | Custom Logo Embroidery',
    seo_desc: 'Custom embroidery in Singapore for corporate uniforms, polo shirts, caps, aprons, and branded merchandise. Logo digitising and bulk orders.',
    seo_body:
`Embroidery outlasts print. For corporate uniforms, golf polos, caps, and branded merchandise, the stitched logo survives hundreds of wash cycles without fading, peeling, or cracking — which is why it remains the default for any workwear that's expected to last more than a season.

Where embroidery wins over print:
- Corporate uniforms and workwear
- Golf day and corporate event polos
- Caps, beanies, and headwear branding
- Branded jackets and windbreakers
- Premium merchandise lines

We digitise your logo into stitch-ready format, match thread colours to your brand palette, and apply to chest, sleeve, back, or cap-front positions. Fine detail in small logos — text, gradient effects, small brand marks — comes through cleanly when digitised properly.

Upload your logo in vector format if you have it; otherwise we recreate from raster artwork. Bulk embroidery for corporate uniform rollouts is our most common engagement.`,
  },
  {
    slug: 'polo-shirts',
    seo_title: 'Custom Polo Shirt Printing Singapore | Corporate Polos',
    seo_desc: 'Custom polo shirt printing and embroidery in Singapore for corporate teams, events, sports clubs, and schools. Logo placement and bulk orders.',
    seo_body:
`Polo shirts are Singapore's default for corporate outings, team-building, sports days, and company events — comfortable enough for a full day outdoors, smart enough for a client-facing setting, and easy to personalise with a chest or sleeve logo.

Where polos are ordered most:
- Corporate team-building and dinner & dance
- Sports days, golf days, and inter-office tournaments
- School sports teams and CCA uniforms
- Trade show booth staff
- Reunion, alumni, and group event orders

Embroidery for long-wearing logo placements; heat transfer or screen print for larger graphics and multi-colour event designs. Name and number personalisation available where each shirt needs individual identification.

Upload your logo or event artwork, pick polo colour and size breakdown, and we produce an order ready for event distribution or corporate uniform rollout.`,
  },
  {
    slug: 'round-neck-shirts',
    seo_title: 'Custom T-Shirt Printing Singapore | Round Neck Shirts',
    seo_desc: 'Custom round neck t-shirt printing in Singapore for events, schools, corporate teams, and merchandise. Full-colour and bulk printing.',
    seo_body:
`Round-neck t-shirts are the universal canvas — cheap enough for giveaway runs, comfortable enough for actual wear, and flexible across everything from CCA uniforms to corporate merch to band tour shirts. In Singapore's year-round heat, they're often the most-worn piece in anyone's wardrobe.

Where t-shirts get ordered:
- School events, orientation, and CCA uniforms
- Corporate team-building and internal events
- Community groups, marathons, and fundraisers
- Brand merchandise and retail drops
- Family reunions and group trip orders

Full-colour artwork on chest, back, sleeve, or full-front wrap, printed using methods matched to the design — screen print for flat colour graphics at scale, direct-to-garment for photographic detail, heat transfer for quick-turn short runs.

Upload your design, pick shirt colours and size breakdown across the order, and we produce finished shirts ready for an event or retail shelf.`,
  },
];

const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
let ok = 0, missing = 0;
try {
  for (const r of REWRITES) {
    const product = await sql`select id from products where slug = ${r.slug} limit 1`;
    if (!product.length) { console.warn(`[missing] ${r.slug}`); missing++; continue; }
    const pid = product[0].id;
    await sql`
      insert into product_extras (product_id, seo_title, seo_desc, seo_body)
      values (${pid}, ${r.seo_title}, ${r.seo_desc}, ${r.seo_body})
      on conflict (product_id) do update set
        seo_title = excluded.seo_title,
        seo_desc = excluded.seo_desc,
        seo_body = excluded.seo_body
    `;
    ok++;
  }
  console.log(`\nRewrote: ${ok} · Missing: ${missing} · Total: ${REWRITES.length}`);
} finally {
  await sql.end();
}
