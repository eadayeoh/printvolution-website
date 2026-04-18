// Batch C — 9 products authored in the approved voice.
// Slugs: ncr-form, nfc-card, paper-bag, photo-frames, polo-shirts,
// poster, pvc-canvas, pvc-card, roll-up-banner.
//
// Every matcher pick_title references a real configurator option,
// every article is product-specific, no car-decal/name-card residue.

export const BATCH = [
  // ===========================================================
  // 1. NCR FORM
  // ===========================================================
  {
    slug: 'ncr-form',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Carbonless on every ply.',
      right_note_body: 'White → yellow → pink transfer, no smudge, no stray carbon dust.',
      rows: [
        {
          need: 'The driver needs a book *by this Friday* for new routes',
          pick_title: 'A5, 2-Ply (White + Yellow), Numbered',
          pick_detail: 'From S$150/10 books · 3–4 day production · numbered from 0001 upward',
        },
        {
          need: "Your workshop writes *50 DOs a day* — need sharp duplicates",
          pick_title: 'A5, 3-Ply (White + Yellow + Pink), Numbered',
          pick_detail: 'From S$170/10 books · office keeps pink, driver keeps yellow, customer keeps white',
        },
        {
          need: 'Pad sits on a *delivery van dashboard* for months',
          pick_title: 'A5, 2-Ply, Padded at top',
          pick_detail: 'From S$150/10 books · glued head, tears clean off one sheet at a time',
        },
        {
          need: 'You want *full-size invoices* with line items and GST box',
          pick_title: 'A4, 3-Ply, Numbered',
          pick_detail: 'From S$210/10 books · room for 15+ line items · accounting-ready layout',
        },
        {
          need: 'Small F&B, need *simple order chits* in a hurry',
          pick_title: 'A5, 2-Ply, No Numbering',
          pick_detail: 'From S$150/10 books · quickest turnaround · standard 50 sets per book',
        },
      ],
    },
    seo_body:
      'NCR form printing Singapore — carbonless duplicate books, 2-ply and 3-ply, sequential numbering, padded and booklet bind, A4 and A5, delivery order / invoice / receipt / job sheet formats. Proper CF-CFB-CB paper, sharp second-copy transfer, no smudging after a week in the glovebox.',
    seo_magazine: {
      issue_label: 'Issue №01 · NCR Form',
      title: 'Everything worth knowing,',
      title_em: 'before you order the books.',
      lede:
        "NCR forms look like the most boring print job on the list — until the driver's second copy comes back blank and the accounts team can't reconcile the delivery. Four things decide whether a book actually works in the field: ply count, numbering, bind, and which paper goes to which person. Here's the plain version.",
      articles: [
        {
          num: '01',
          title: 'Two-ply or three-ply — it depends on who needs a copy.',
          body: [
            "The number of carbonless layers is a paperwork decision, not a printing one. **2-ply (white + yellow)** works when only you and the customer need a copy — quick F&B order chits, simple receipts, basic job cards. **3-ply (white + yellow + pink)** kicks in the moment a third party enters the loop: office retains the pink, driver files the yellow, customer signs and keeps the white. That's the standard logistics setup across SG.",
            "The carbonless chemistry is layered — the top sheet is **CF (coated front)**, the middle is **CFB (coated front and back)**, the bottom is **CB (coated back)**. Press hard enough with a ballpoint and the image transfers down the stack. Press softly with a pencil and it won't. We stock proper CB-graded stock so the second and third copies come out readable, not ghosted.",
          ],
          side: {
            kind: 'list',
            label: 'Who keeps what',
            rows: [
              { text: 'White (top)', time: 'Customer' },
              { text: 'Yellow (middle)', time: 'Driver / Ops' },
              { text: 'Pink (bottom)', time: 'Office / Accounts' },
              { text: 'Optional 4th', time: 'On request' },
            ],
          },
        },
        {
          num: '02',
          title: 'Sequential numbering — why accounts will insist on it.',
          body: [
            "A book of DOs without numbers is a headache waiting for the auditor. **Sequential numbering** prints a unique code (usually six digits, starting from 0001 or wherever your last book ended) on every set — white, yellow, and pink all carry the same number. Miss a book, the gap screams. Double-issue a number, it's obvious. Your accounts team stops calling you at 9pm.",
            "We number from whatever starting point you give us — continue from book 30,001 if your previous batch ended at 30,000, or restart at 0001 for a new series. Numbering sits in red ink at the top-right corner by default, but we can move it anywhere the layout needs. Tell us the range before we plate and it costs nothing extra to maintain across every reprint.",
          ],
          side: {
            kind: 'stat',
            label: 'Range we print',
            num: '0001→999999',
            caption: 'six-digit red ink, top-right',
          },
        },
        {
          num: '03',
          title: 'Padded top versus booklet bind — which one survives the job.',
          body: [
            "A **padded pad** glues all sets at the head — you tear one completed set off the top and the rest stays stacked. Fastest to write, fastest to file, dies quickly in a wet van. A **saddle-stitched booklet** with staples and perforated tear lines holds up longer, keeps the carbon copies attached until you need them, and is the standard for numbered invoice books where losing a sheet is a problem.",
            "For drivers who write on a clipboard in the rain, booklet wins. For F&B counters where the chit gets torn off instantly and thrown on a spike, padded is faster and cheaper. Tell us the use case and we'll pick the bind that matches — no surcharge for choosing the right one.",
          ],
          side: {
            kind: 'pills',
            label: 'Bind type',
            items: [
              { text: 'Padded top', pop: true },
              { text: 'Booklet (stapled)' },
              { text: 'Perforated' },
              { text: 'Numbered stubs' },
            ],
          },
        },
        {
          num: '04',
          title: 'Industry templates — DO, invoice, job sheet, receipt.',
          body: [
            "Most orders fall into four layouts. **Delivery Order (DO)**: consignor / consignee / item list / signatures on receipt. **Tax Invoice**: company header, GST number, line items, subtotal and GST box. **Job Sheet**: workshop or service — vehicle number, fault description, labour hours, parts used. **Receipt / Order Chit**: F&B or retail point-of-sale, minimal fields, maximum speed.",
            "Bring us your current layout and we redraw it clean, or pick a template and fill in your company header. Either way we send back a PDF proof before any paper gets cut — catch the GST-registration number typo on screen, not after 50 books are printed. Reprints to fix one wrong digit cost more than the original run.",
          ],
          side: {
            kind: 'list',
            label: 'Common formats',
            rows: [
              { text: 'Delivery Order', time: 'Logistics' },
              { text: 'Tax Invoice', time: 'B2B' },
              { text: 'Job Sheet', time: 'Workshop / service' },
              { text: 'Receipt / chit', time: 'F&B / retail' },
            ],
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '📑', title: 'Proper CF-CFB-CB stock', desc: 'Real carbonless paper, graded layers — second and third copies read clean, not ghosted.' },
      { icon_url: null, emoji: '🔢', title: 'Sequential numbering', desc: 'Continue from 30,001 or restart at 0001 — red ink, top-right, matching across every ply.' },
      { icon_url: null, emoji: '📎', title: 'Padded or stapled bind', desc: 'Glue-head pads for counters, saddle-stitched booklets for drivers — you pick the field use.' },
      { icon_url: null, emoji: '🧾', title: 'DO / invoice / job templates', desc: 'Bring your layout or pick ours — GST-box, signature lines, and company header placed clean.' },
    ],
  },

  // ===========================================================
  // 2. NFC CARD
  // ===========================================================
  {
    slug: 'nfc-card',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Encoded before it ships.',
      right_note_body: 'We program your link, test every card on-site, send it working.',
      rows: [
        {
          need: 'You meet clients *this week* and want a tap-ready card',
          pick_title: 'PVC Card, white, URL link',
          pick_detail: 'From S$85/10 cards · 2–3 day turnaround · encoded and tested before delivery',
        },
        {
          need: 'Sales team needs *matching cards* pointing to personal vCards',
          pick_title: 'PVC Card, metallic silver, vCard per person',
          pick_detail: 'From S$263/10 cards · each card encoded individually · name-matched',
        },
        {
          need: 'You want the card to *feel premium* when it taps',
          pick_title: 'Premium Soft Touch, metallic black',
          pick_detail: 'From quote · velvet finish · chip reads clean through the surface coat',
        },
        {
          need: 'Event booth — tap opens *wifi or booking page* instantly',
          pick_title: 'PVC Card, metallic gold, wifi / URL',
          pick_detail: 'From S$85/10 cards · guests tap and connect · no app install needed',
        },
        {
          need: 'Trying the idea out, *budget-friendly* first batch',
          pick_title: 'Matt Paper Card, URL link',
          pick_detail: 'From S$65/10 cards · entry-level chip · good for pop-ups and short runs',
        },
      ],
    },
    seo_body:
      'NFC card printing Singapore — tap-to-share business cards, URL / vCard / wifi encoding, PVC and metallic stock, soft-touch finish. Chip programmed and tested before delivery, works on iPhone and Android without an app.',
    seo_magazine: {
      issue_label: 'Issue №01 · NFC Card',
      title: 'Everything worth knowing,',
      title_em: 'before it leaves your pocket.',
      lede:
        "Most NFC cards sold in SG are two-ring-circus: a pretty card, a chip that reads once out of three taps, and a link that breaks the first time the user reinstalls iOS. Four things decide whether a card actually works three years from now — the chip spec, what you encode, how the graphic sits over the coil, and the stock underneath. Here's the plain version.",
      articles: [
        {
          num: '01',
          title: 'URL, vCard, or wifi — pick the right payload.',
          body: [
            "What the chip stores changes how the card gets used. A **URL link** is the most common — tap and the phone opens your LinkedIn, a portfolio microsite, a booking page. Easy to update later if you host the link yourself with a redirect. A **vCard (VCF)** dumps your name, phone, email, and company straight into the recipient's contacts — no website round-trip, no data charges — but the information is baked in at encoding time.",
            "A **wifi credential** pushes SSID and password to the guest's phone with a single tap — useful for cafés, co-working desks, event booths where the password is a pain to read off a board. Tell us the use case and we encode accordingly. One card, one payload, written with proper **NDEF formatting** so iOS and Android read it the same way.",
          ],
          side: {
            kind: 'pills',
            label: 'Payload options',
            items: [
              { text: 'URL / redirect', pop: true },
              { text: 'vCard (VCF)' },
              { text: 'Wifi (SSID+PW)' },
              { text: 'Call / SMS trigger' },
            ],
          },
        },
        {
          num: '02',
          title: 'Why a tap sometimes misses — and how we fix it before shipping.',
          body: [
            "**Near-field communication** runs at 13.56 MHz and only reads through about 4cm of air. Put the chip too close to a metal wallet, wrap it in a thick case, or bury the coil under an off-centre graphic and the tap becomes hit-or-miss. Worst case: the card works on your phone, fails on your client's, and the conversation dies right there.",
            "We test every card before it ships — on both iOS and Android reference devices, from three different tap angles. Any unit that reads inconsistently goes back for rework. We also position the graphic so the phone's antenna aligns with the chip's coil, not the edge of the card where reception is weakest.",
          ],
          side: {
            kind: 'stat',
            label: 'Read distance',
            num: '<4cm',
            caption: 'tested on iPhone + Android',
          },
        },
        {
          num: '03',
          title: 'Printing over the coil — the thing most print shops get wrong.',
          body: [
            "The NFC antenna is a flat copper coil spiralling around inside the card. Use heavy metallic ink or thick foil over that coil and you **shield the signal** — the chip is still in there, but the phone can't talk to it through the foil layer. That's why some budget NFC cards feel premium and tap terribly.",
            "We run metallic backgrounds on **thin metallic-pigment inks** that don't detune the antenna, and we keep heavy foil work off the coil footprint entirely. The visible finish stays premium — gold, silver, black — while the chip reads at full range. If your design needs foil on both sides, we'll flag the tradeoff and propose a hybrid before we print.",
          ],
          side: {
            kind: 'list',
            label: 'Finish vs read range',
            rows: [
              { text: 'Standard PVC', time: 'Full range' },
              { text: 'Metallic print', time: 'Full range' },
              { text: 'Thin foil accent', time: 'Safe if offset' },
              { text: 'Heavy foil panel', time: 'Shields chip' },
            ],
          },
        },
        {
          num: '04',
          title: 'PVC versus metal stock — and where soft-touch fits.',
          body: [
            "**PVC at 760 microns** is the standard — same thickness as a bank card, fits every card slot, takes full-colour print and spot lamination. It's what 90% of professional NFC cards ride on. **Premium soft-touch** is PVC with a velvet-feel top coat — the tactile upgrade clients notice the moment they hold it, and the chip still reads cleanly through the coat.",
            "Metal-composite NFC cards exist, and they feel like a steakhouse check — but the metal layer needs a shielded cutout over the coil, which constrains the design. For most SG use cases — sales, property agents, creative directors, clinic cards — premium PVC or soft-touch delivers the weight and finish without the engineering compromise. We'll quote metal if you genuinely need it.",
          ],
          side: {
            kind: 'quote',
            text: 'Ordered 200 for the team — every card worked first tap. The soft-touch finish made it feel like a gift, not a business card.',
            attr: 'Sales Director, SG Property Group',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '📡', title: 'Chip encoded + tested', desc: 'URL, vCard or wifi written to every card, read-tested on iOS and Android before packing.' },
      { icon_url: null, emoji: '🎨', title: 'Coil-safe artwork', desc: 'Heavy foil and metallic inks kept off the antenna footprint — design looks premium, chip reads full-range.' },
      { icon_url: null, emoji: '💳', title: '760-micron PVC stock', desc: 'Bank-card thickness, same as a credit card — fits every wallet slot, survives years of pocket use.' },
      { icon_url: null, emoji: '🔄', title: 'Editable link on request', desc: 'We can set up a redirect URL so you update the destination without reprinting the card.' },
    ],
  },

  // ===========================================================
  // 3. PAPER BAG
  // ===========================================================
  {
    slug: 'paper-bag',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Handle-tested before shipping.',
      right_note_body: 'Cotton rope pulled, twisted paper tugged, die-cuts stress-checked.',
      rows: [
        {
          need: 'Retail *launch next month* — need bags that feel premium',
          pick_title: 'Medium (25×11×28cm), Cotton Rope, White',
          pick_detail: 'From S$80/5000 · popular size · rope handles hold weight without cutting into fingers',
        },
        {
          need: 'F&B takeaway — *grease-resistant* and kraft-natural',
          pick_title: 'Small (18×8×22cm), Twisted Paper, Kraft',
          pick_detail: 'From S$55/5000 · twisted handle stays attached · kraft hides oil marks',
        },
        {
          need: 'Event gifting — *A4 inserts* must slide in flat',
          pick_title: 'Large (32×12×35cm), Cotton Rope, White',
          pick_detail: 'From S$98/5000 · fits A4 flat plus booklets · wide gusset for boxed gifts',
        },
        {
          need: 'Fashion retail — *the bag itself* is the hero',
          pick_title: 'Medium (25×11×28cm), Cotton Rope, Kraft',
          pick_detail: 'From S$80/5000 · logo-forward print · reused as tote long after the purchase',
        },
        {
          need: 'Quick mall activation, *cost-down* per unit',
          pick_title: 'Small (18×8×22cm), Die-cut Handle, White',
          pick_detail: 'From quote · lowest handle cost · lightweight inserts only',
        },
      ],
    },
    seo_body:
      'Paper bag printing Singapore — kraft and white art paper, cotton rope / twisted paper / die-cut handles, gusseted retail bags, food-safe liner on request. Small medium large sizes, 5000–50000 quantity runs, branded for retail and F&B.',
    seo_magazine: {
      issue_label: 'Issue №01 · Paper Bag',
      title: 'Everything worth knowing,',
      title_em: 'before the first mall run.',
      lede:
        "A bag fails in one of three ways: the handle rips at the till, the paper tears on the MRT, or it looks so cheap the customer bins it at the next bench. Four decisions stop all three — handle type, paper weight, gusset depth, and whether you need food-safe lining. Here's the plain version.",
      articles: [
        {
          num: '01',
          title: 'Handle type decides how the bag fails.',
          body: [
            "**Cotton rope handles** are the premium default — threaded through reinforced eyelets, they distribute weight across the top panel and feel soft in the hand. Good for retail bags carrying 2–3kg of purchases over a long walk home. **Twisted paper handles** are glued directly onto the bag body, cost less, and suit F&B takeaway where the bag is carried ten minutes to the car. Still sturdy, just not premium.",
            "**Die-cut handles** (holes punched in a reinforced top panel) are the cheapest option and work for lightweight inserts — flyers, small samples, documents. Put a bottle of wine in one and the handle tears within two escalator rides. We'll tell you upfront which handle matches your contents, not upsell you into rope when twisted does the job.",
          ],
          side: {
            kind: 'list',
            label: 'Handle by load',
            rows: [
              { text: 'Die-cut', time: '<500g' },
              { text: 'Twisted paper', time: '1–2kg' },
              { text: 'Cotton rope', time: '2–4kg' },
              { text: 'Reinforced rope', time: '4kg+' },
            ],
          },
        },
        {
          num: '02',
          title: 'Kraft versus art paper — the look is half the job.',
          body: [
            "**Kraft paper** is the unbleached brown roll — rustic, recyclable-looking, forgives smudges and grease marks. Perfect for artisan bakeries, natural-brand cosmetics, zero-waste retail positioning. It takes one- or two-colour print well but struggles with gradients and photographic images because the base tone is warm brown.",
            "**White art paper** is the bright, coated substrate — takes full-colour CMYK prints sharp, keeps brand pantones accurate, and pairs with gloss or matt lamination for that premium retail feel. Beauty brands, fashion, jewellery, any SKU where colour fidelity matters. Cost is comparable; the choice is almost entirely about brand identity, not paper performance.",
          ],
          side: {
            kind: 'pills',
            label: 'Paper pairings',
            items: [
              { text: 'Kraft + twisted', pop: true },
              { text: 'Kraft + cotton' },
              { text: 'White + cotton' },
              { text: 'White + laminated' },
            ],
          },
        },
        {
          num: '03',
          title: 'Gusset depth — the measurement nobody gets right.',
          body: [
            "The **gusset** is the side fold that gives the bag its 3D volume. Too shallow and your boxed products won't fit; too deep and a flat document looks lost at the bottom. Standard retail gussets run 8–12cm depending on the bag size. A medium-sized 25×11×28cm bag has 11cm of gusset — enough for most shoebox-sized goods, tight on wine bottles.",
            "Tell us what's going inside before we cut the die. A fashion brand packing folded knits and tissue wants a deeper gusset; a stationery brand packing flat notebooks can run shallower. We template the bag dimensions against the product — not a standard size chart — and send you a flat dieline proof before production locks in.",
          ],
          side: {
            kind: 'stat',
            label: 'Gusset range',
            num: '8–12cm',
            caption: 'spec to your product, not a chart',
          },
        },
        {
          num: '04',
          title: 'Food-grade lining — when you actually need it.',
          body: [
            "Plain kraft paper is porous. Bánh mì, pastries, anything with oil or sauce will seep through and leave a ring by the time the customer gets home. A **food-grade inner lining** (usually a thin greaseproof layer) solves this without changing the outer look — the bag still photographs clean on social, the grease stays inside.",
            "We flag this for F&B clients who didn't ask. If your bag is for takeaway dishes, carry-away pastries, or anything warm, specify food contact at the quote stage and we'll spec the right liner. For retail bags carrying boxed or wrapped SKUs, skip it — it's cost you don't need.",
          ],
          side: {
            kind: 'list',
            label: 'Lining by contents',
            rows: [
              { text: 'Dry retail', time: 'No liner needed' },
              { text: 'Bakery', time: 'Greaseproof' },
              { text: 'Hot takeaway', time: 'Food-grade liner' },
              { text: 'Beverages', time: 'Coated + bottle insert' },
            ],
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🪢', title: 'Handle spec to load', desc: 'Cotton rope, twisted paper, or die-cut — matched to what the bag is actually carrying.' },
      { icon_url: null, emoji: '📦', title: 'Gusset sized to product', desc: 'Dielines templated against your SKU dimensions — not a generic size chart.' },
      { icon_url: null, emoji: '🎨', title: 'Kraft or coated white', desc: 'Unbleached rustic or bright CMYK-ready — picked to fit your brand, not our standard.' },
      { icon_url: null, emoji: '🍞', title: 'Food-grade option', desc: 'Greaseproof liner available for bakery and takeaway — tell us the contents at quote stage.' },
    ],
  },

  // ===========================================================
  // 4. PHOTO FRAMES
  // ===========================================================
  {
    slug: 'photo-frames',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Print, mount, frame — all here.',
      right_note_body: 'One shop, one brief, one delivery — no chasing a framer on the side.',
      rows: [
        {
          need: "You need it *by the weekend* — anniversary is Sunday",
          pick_title: '5×7 inch, Wood Frame',
          pick_detail: 'From S$24/pc · quick production · tabletop stand included',
        },
        {
          need: 'Corporate gift run — *20 frames* for retirement wall',
          pick_title: '8×10 inch, Wood Frame, personalised plaque',
          pick_detail: 'From S$760/20pcs · matching frames · personalisation text engraved',
        },
        {
          need: 'Heritage photo — *must survive 20 years* on the wall',
          pick_title: '8×10 inch, Metal Frame, acrylic front',
          pick_detail: 'From quote · shatter-safe acrylic · UV-resistant mounting · no glass breakage risk',
        },
        {
          need: 'Family portrait — you want *gallery-grade presence*',
          pick_title: '8×10 inch, Acrylic Frame, mat board',
          pick_detail: 'From S$43/pc · float-mount look · white bevelled mat · wall-ready',
        },
        {
          need: 'Kids art, small desk, *budget-friendly*',
          pick_title: '4×6 inch, Wood Frame',
          pick_detail: 'From S$18/pc · lightest frame · slots straight onto a shelf',
        },
      ],
    },
    seo_body:
      'Photo frame printing Singapore — giclée photo prints in wood / acrylic / metal frames, 4×6 5×7 8×10 inch standard sizes, mat board mounting, wall or tabletop orientation, personalised engraving. Anniversary, portrait, heritage, corporate gifting.',
    seo_magazine: {
      issue_label: 'Issue №01 · Photo Frames',
      title: 'Everything worth knowing,',
      title_em: 'before it goes on the wall.',
      lede:
        "A framed print should outlast the furniture it sits on. Most don't — the mat warps from humidity, the glass falls out of a cheap profile, the print fades because nobody specified UV protection. Four decisions keep a frame looking right ten years in: profile depth, mat board choice, front material, and how it hangs.",
      articles: [
        {
          num: '01',
          title: 'Frame profile and depth — the carpentry nobody sees.',
          body: [
            "A **frame profile** is the cross-section shape of the moulding. Thin profiles (1–2cm wide) disappear into the art — great for gallery-style minimalism, weak at holding weight on a big print. Chunky profiles (3–4cm) frame the image with deliberate weight — right for heritage photos, certificates, statement pieces. The depth matters too: a shallow profile won't accept a mat board plus a backing without the print bulging forward.",
            "Our **wood frames** run a mid-depth profile that handles mat-and-backing without drama. **Acrylic** frames are lighter and float the image against the wall. **Metal** (aluminium-composite) profiles are the thinnest structurally stable option and pair well with large prints where a thick wood edge would dominate.",
          ],
          side: {
            kind: 'pills',
            label: 'Frame material',
            items: [
              { text: 'Wood', pop: true },
              { text: 'Acrylic' },
              { text: 'Metal (aluminium)' },
              { text: 'Custom stain' },
            ],
          },
        },
        {
          num: '02',
          title: 'Mat board — the white border that changes everything.',
          body: [
            "A **mat board** is the thick cardstock window between the print and the glass. Two jobs: it creates visual breathing room so the image doesn't crash into the frame edge, and it physically holds the print off the glass so humidity can't fuse them together. Without a mat, a Singapore-humidity summer can stick a glossy print to its own front glass within a year.",
            "Standard mat is **acid-free off-white**, bevel-cut at a 45-degree angle so the window edge catches the light and adds depth. We'll cut custom mat windows — multi-aperture for family photo clusters, offset rectangles for landscape crops, coloured mats for contrast. The mat is specified at order time, sized against your print so the crop looks intentional.",
          ],
          side: {
            kind: 'list',
            label: 'Mat by use',
            rows: [
              { text: 'Portrait', time: 'Single window, centred' },
              { text: 'Family group', time: 'Multi-aperture mat' },
              { text: 'Certificate', time: 'Bevelled off-white' },
              { text: 'Gallery print', time: 'Wide white border' },
            ],
          },
        },
        {
          num: '03',
          title: 'Glass versus acrylic — the trade-off.',
          body: [
            "**Glass** front is sharper, cheaper, and more scratch-resistant — but heavy and breakable. A large framed print fell off a wall in a typical SG renovation is a small disaster. **Acrylic** front is lighter, shatter-safe, and survives a drop — but scratches more easily and costs more per square inch.",
            "For anything above 8×10 inch or anything hanging over a sofa, seating, or a child's room, we default to **UV-filtering acrylic**. It blocks ~98% of UV, which matters because SG afternoon light through a window will fade a photo print in three years flat. For small tabletop pieces where nothing's going to fall on anyone, glass is fine and cheaper.",
          ],
          side: {
            kind: 'stat',
            label: 'UV blocked',
            num: '~98%',
            caption: 'with UV-grade acrylic front',
          },
        },
        {
          num: '04',
          title: 'Wall-drilled or tabletop — mount at the quote stage.',
          body: [
            "**Tabletop** frames come with a fold-out kickstand on the back — portrait or landscape orientation specified up front, because flipping it later means a new backing. Good for desks, shelves, bedside tables. **Wall-drilled** frames come with a D-ring or sawtooth hanger, positioned so the frame sits level when a single nail goes in.",
            "For large frames (A3 and up), we fit **two D-rings and a wire**, so the frame self-levels slightly as it settles against the wall. For HDB drywall, we can include a 3M Command strip pack with the rated weight — no drill marks, no landlord problems. Tell us the wall type at order time.",
          ],
          side: {
            kind: 'quote',
            text: 'We ordered 15 for a client retirement wall — arrived pre-hung with wire, plaques engraved, laid them up in an hour.',
            attr: 'Office Manager, SG Accounting Firm',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🖼️', title: 'Profile matched to art', desc: 'Thin minimal or chunky statement — picked against the image, not a default moulding.' },
      { icon_url: null, emoji: '🎴', title: 'Acid-free mat boards', desc: 'Bevel-cut white or custom colour — holds the print off the front glass so humidity cannot fuse them.' },
      { icon_url: null, emoji: '☀️', title: 'UV-grade acrylic option', desc: 'Blocks ~98% of UV — we default to it on anything hanging near an SG window.' },
      { icon_url: null, emoji: '🔨', title: 'Mount hardware pre-fitted', desc: 'D-rings, wire, or 3M strips — specified for your wall type, ready to hang out of the box.' },
    ],
  },

  // ===========================================================
  // 5. POLO SHIRTS
  // ===========================================================
  {
    slug: 'polo-shirts',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Sized on a real-person fit.',
      right_note_body: 'SG body-shape sizing — our M is not a shrunk-in-the-wash US M.',
      rows: [
        {
          need: 'Client-facing team — *embroidered logo*, sharp look',
          pick_title: 'Embroidery, Poly-cotton, Navy',
          pick_detail: 'From S$22/pc · thread-stitched crest · survives daily wash cycles for years',
        },
        {
          need: 'Roadshow crew in *outdoor heat*, need breathable',
          pick_title: 'DTF Print, 100% Polyester Dri-fit, Red',
          pick_detail: 'From S$20/pc · wicks sweat · full-colour graphic prints edge-to-edge',
        },
        {
          need: 'Trade-show staff — *bright full-colour artwork* on the back',
          pick_title: 'DTF Print, Poly-cotton, Black',
          pick_detail: 'From S$18/pc · photo-quality transfer · unlimited colours in one artwork',
        },
        {
          need: 'Corporate uniform — *colour-matched across 50+ staff*',
          pick_title: 'Embroidery, Poly-cotton, Custom (Pantone)',
          pick_detail: 'From quote · dye-lot locked · reorders match the first batch exactly',
        },
        {
          need: 'Small team, *mixed sizes*, need it fast',
          pick_title: 'DTF Print, Poly-cotton, Grey',
          pick_detail: 'From S$18/pc · XS to 4XL in one run · specify sizes at order',
        },
      ],
    },
    seo_body:
      'Polo shirt printing Singapore — embroidery and DTF full-colour print, poly-cotton pique and Dri-fit polyester, corporate uniforms, event staff shirts, F&B crew tees. SG sizing XS to 4XL, dye-lot matching across reorders, wash-fast for daily rotation.',
    seo_magazine: {
      issue_label: 'Issue №01 · Polo Shirts',
      title: 'Everything worth knowing,',
      title_em: 'before the staff put them on.',
      lede:
        "A branded polo succeeds when the team wears it to lunch without being asked. It fails when the collar curls up after two washes, the logo peels at the edges, or the XL from the reorder is a full size smaller than the original batch. Four things decide which shirt you get — fabric, decoration method, collar build, and sizing discipline.",
      articles: [
        {
          num: '01',
          title: 'Poly-cotton or Dri-fit — a climate question, not a style one.',
          body: [
            "**Poly-cotton pique** is the classic polo weave — textured, breathable, holds its shape, and takes embroidery cleanly. The cotton content gives it hand-feel and softens with every wash, which is why staff actually wear it off duty. Pique knit construction hides wrinkles better than flat jersey — good for client-facing roles where the shirt sits for eight hours.",
            "**100% polyester Dri-fit** is the performance spec — moisture-wicks, dries fast, stays light when the wearer is sweating. Non-negotiable for roadshow staff, outdoor brand ambassadors, F&B delivery riders. Takes DTF print beautifully, doesn't love embroidery (the dense thread can pucker the stretch fabric). Choose by the work environment, not by what looks best on the hanger.",
          ],
          side: {
            kind: 'list',
            label: 'Fabric by role',
            rows: [
              { text: 'Office / client-facing', time: 'Poly-cotton pique' },
              { text: 'F&B front-of-house', time: 'Poly-cotton' },
              { text: 'Outdoor / roadshow', time: 'Dri-fit polyester' },
              { text: 'Warehouse / workshop', time: 'Dri-fit + reinforced' },
            ],
          },
        },
        {
          num: '02',
          title: 'Embroidery, heat transfer, or DTF — pick by the artwork.',
          body: [
            "**Embroidery** is thread stitched through the fabric — physically permanent, premium feel, survives 200+ wash cycles. Best for logos under 10cm with solid colours and clean vector shapes. It cannot reproduce gradients, photographic detail, or colours outside the standard thread chart. Cost scales with stitch count, so a complex logo is slower and pricier than a simple crest.",
            "**DTF (direct-to-film)** is a full-colour transfer — no colour limits, handles photographic artwork, gradients, and small text down to 6pt. The edge sits slightly proud of the fabric, soft to touch but visible against the weave. Wash-fast to 30+ cycles when the garment is inside-out cold wash. Heat transfer (older vinyl method) is cheaper for single-colour text but cracks at the fold lines — we skip it unless the brief specifically calls for it.",
          ],
          side: {
            kind: 'pills',
            label: 'Decoration',
            items: [
              { text: 'Embroidery', pop: true },
              { text: 'DTF full-colour' },
              { text: 'Back panel print' },
              { text: 'Sleeve hit' },
            ],
          },
        },
        {
          num: '03',
          title: 'Collar roll — the detail that separates S$18 from S$40.',
          body: [
            "The **collar roll** is how the collar sits when the shirt is worn unbuttoned. A good collar stands up with a slight curl, frames the neck, and doesn't go limp after one wash. A cheap collar flops flat within a month — the interfacing is thin, the stitch density is low, and the shirt starts looking tired. Your staff feel it before you notice it.",
            "We stock polos with **double-needle collar construction** and a stiffer interfacing — the collar holds shape across the full wash cycle life of the shirt. Combined with a ribbed cuff on the sleeve end, the garment keeps its silhouette long after the logo would have faded on a lesser blank. Ask and we'll send a blank sample before the full order commits.",
          ],
          side: {
            kind: 'stat',
            label: 'Wash cycle life',
            num: '50+',
            caption: 'collar shape holds, on our spec',
          },
        },
        {
          num: '04',
          title: 'Sizing consistency across reorders — the uniform trap.',
          body: [
            "Order 30 shirts today, reorder 15 next quarter, discover the new XL is half a size smaller than the old one. This is how corporate uniform programmes fall apart — dye-lot drift, mill-batch differences, and unreported spec changes between production runs. The shirts are fine individually; mixed, they look sloppy.",
            "For repeat orders we log the **dye-lot reference** and the **blank supplier batch** on file. Reorder within 12 months and we'll hold as close to the original as the mill allows — if a colour drifts noticeably we flag it before cutting. For one-off runs, colour-match under lighting conditions that match where the shirts will actually be seen.",
          ],
          side: {
            kind: 'quote',
            text: 'Reordered our team polos six months later — XL matched the first batch exactly, stacked them on the shelf and nobody could tell which was new.',
            attr: 'HR Lead, SG Retail Chain',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🧵', title: 'Embroidery or DTF', desc: 'Thread-stitched for logos, full-colour transfer for photographic art — picked to the artwork.' },
      { icon_url: null, emoji: '👕', title: 'Fabric to the role', desc: 'Poly-cotton pique for client-facing, 100% Dri-fit for outdoor — we spec by the workplace.' },
      { icon_url: null, emoji: '📐', title: 'SG body-shape sizing', desc: 'XS to 4XL on an Asian fit, not shrunk-in-the-wash US sizing — samples available before bulk.' },
      { icon_url: null, emoji: '🎨', title: 'Dye-lot locked for reorders', desc: 'Batch reference stored on file — reorder six months later and the shade still matches.' },
    ],
  },

  // ===========================================================
  // 6. POSTER
  // ===========================================================
  {
    slug: 'poster',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Sharp from across the room.',
      right_note_body: 'Print-ready DPI checked — if it would look pixelated, we flag before printing.',
      rows: [
        {
          need: 'Retail window — *this weekend sale*, high-impact',
          pick_title: 'A1 Poster Paper, Gloss Lamination',
          pick_detail: 'From S$17/pc · pops against glass · wipes clean if something spills',
        },
        {
          need: 'Lobby standee — *freestanding*, 1m+ from viewer',
          pick_title: 'A2 Poster Paper, Matt Lamination, Cardboard Standee',
          pick_detail: 'From S$10/pc + S$6 standee · self-supporting · no wall drilling',
        },
        {
          need: 'Long-term display — *stays up 6+ months* without fading',
          pick_title: 'A1 Poster Paper, Matt Lamination, Black Kapaline Board',
          pick_detail: 'From S$17/pc + S$6 board · lamination blocks UV · kapaline backing rigid',
        },
        {
          need: 'Launch event — *giant A0 hero* by the stage',
          pick_title: 'A0 Poster Paper, Gloss Lamination, Compressed Foam Board',
          pick_detail: 'From S$28/pc + S$3 foam · readable from 10m · foam-board mount stays flat',
        },
        {
          need: 'Community notice board — *cheap and cheerful*',
          pick_title: 'A3 Poster Paper, No Lamination',
          pick_detail: 'From S$8/pc · lowest cost per piece · short-term indoor use',
        },
      ],
    },
    seo_body:
      'Poster printing Singapore — A4 A3 A2 A1 A0 large format, gloss matt silk finishes, indoor and outdoor grade paper, mounted on foam board or kapaline, retail window / event / lobby displays. Sharp 300dpi prints, colour-matched to brand, delivered flat or rolled.',
    seo_magazine: {
      issue_label: 'Issue №01 · Poster',
      title: 'Everything worth knowing,',
      title_em: 'before it goes up on the wall.',
      lede:
        "A poster is judged from across the room, not from arm's length. Most DIY jobs fail the distance test — the image is sharp at 30cm and a blur at 3 metres because the file was sized wrong. Four decisions fix that: paper finish, indoor versus outdoor substrate, mount, and matching the artwork DPI to the actual viewing distance.",
      articles: [
        {
          num: '01',
          title: 'Paper finish — gloss, matt, or silk, and why it matters.',
          body: [
            "**Gloss** finish gives the sharpest colour saturation and the highest contrast — blacks look black, reds pop. The tradeoff is glare: a gloss poster lit by an overhead retail spotlight will throw a reflective patch right across the centre of the image. Great for window displays where the light is behind the viewer; painful on a lobby wall with downlights.",
            "**Matt** finish kills glare, reads cleanly from any angle, and is the safe default for lobby art, exhibition panels, and office décor. Silk sits in between — slight sheen, reduced glare, warmer colour depth than pure matt. Pick by the lighting the poster will actually live under, not by what looks best on the proof under shop lights.",
          ],
          side: {
            kind: 'pills',
            label: 'Finish by location',
            items: [
              { text: 'Window — Gloss', pop: true },
              { text: 'Lobby — Matt' },
              { text: 'Gallery — Silk' },
              { text: 'Outdoor — Synthetic' },
            ],
          },
        },
        {
          num: '02',
          title: 'Indoor paper versus outdoor substrate — a waterproof question.',
          body: [
            "Standard **poster paper** is cellulose-based — takes ink beautifully, holds colour indoors for years. Outside? One afternoon of SG rain and the edges curl, the ink bleeds, the whole sheet turns into papier-mâché. Nobody tells you until the poster is already soaked. If the display is anywhere the weather can touch it — bus shelters, shop-front exterior, covered walkway near the pavement — you need a synthetic substrate.",
            "**Synthetic outdoor paper** (polypropylene or tyvek-type stock) takes the same ink, looks near-identical indoors, and shrugs off rain. Slightly pricier per square foot, saves reprinting three weeks in. Tell us where the poster lives and we'll spec the right stock — no upsell if the display is indoor-only.",
          ],
          side: {
            kind: 'list',
            label: 'Substrate by location',
            rows: [
              { text: 'Indoor retail', time: 'Poster paper' },
              { text: 'Lobby / office', time: 'Poster paper' },
              { text: 'Covered outdoor', time: 'Synthetic' },
              { text: 'Exposed outdoor', time: 'PVC / banner' },
            ],
          },
        },
        {
          num: '03',
          title: 'Mount and lamination — keeping it flat and clean.',
          body: [
            "A poster without a mount is a droopy rectangle within a week — SG humidity buckles unlaminated paper at the corners. **Matt or gloss lamination** seals the surface against moisture, UV, and fingerprints. **Compressed foam board** backing adds rigidity for standalone display. **Black kapaline** is the premium option — denser, stays flatter, edges look clean from the side. Cardboard standees prop up lobby posters without wall-drilling.",
            "For retail rotations where the poster changes monthly, we skip lamination and mount on light foam — cheap to print, easy to swap. For permanent lobby art, we laminate and mount on kapaline so the piece sits flat for years. Match the build to the rotation schedule and the budget goes further.",
          ],
          side: {
            kind: 'stat',
            label: 'Mount options',
            num: '3 grades',
            caption: 'foam, kapaline, standee',
          },
        },
        {
          num: '04',
          title: 'Viewing distance and DPI — the maths nobody does.',
          body: [
            "A poster viewed from 3 metres doesn't need 300 DPI — it needs about 100 DPI at print size, because the human eye can't resolve finer detail at that distance. Conversely, a poster viewed from 50cm (think a café wall above a table) does need 300 DPI, or the image goes soft. **File the source at the right resolution for the viewing distance** and the image looks sharp; oversize and you're wasting upload bandwidth.",
            "We preflight every upload against the print size. If the source file is 72 DPI and you've asked for A1, we'll flag it — the print will look soft from any distance closer than 2 metres. Send a higher-res original or we'll advise cropping to the sharp zone. Better to fix at the file stage than ship a fuzzy poster.",
          ],
          side: {
            kind: 'list',
            label: 'DPI by distance',
            rows: [
              { text: 'Hand-held (30cm)', time: '300 DPI' },
              { text: 'Desk (1m)', time: '200 DPI' },
              { text: 'Wall (3m)', time: '100 DPI' },
              { text: 'Across room (5m+)', time: '72 DPI' },
            ],
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🎨', title: 'Finish picked to the light', desc: 'Gloss for windows, matt for lobbies, silk for galleries — specified against the actual display lighting.' },
      { icon_url: null, emoji: '☔', title: 'Indoor or outdoor stock', desc: 'Paper for inside, synthetic polypropylene for covered outdoor — we spec by where the poster lives.' },
      { icon_url: null, emoji: '🧱', title: 'Foam or kapaline mount', desc: 'Light foam for monthly rotations, kapaline for permanent display — matched to the swap schedule.' },
      { icon_url: null, emoji: '🔍', title: 'DPI preflight before print', desc: 'We check source resolution against print size — flag soft files before they hit the press.' },
    ],
  },

  // ===========================================================
  // 7. PVC CANVAS
  // ===========================================================
  {
    slug: 'pvc-canvas',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Hem welded, not taped.',
      right_note_body: 'Heat-sealed edges, stitched reinforcement — survives monsoon gusts.',
      rows: [
        {
          need: 'Construction hoarding — *up for months* on a building site',
          pick_title: '3m × 2m, Hemmed + Eyelets',
          pick_detail: 'From S$210/pc · welded hem holds against wind · eyelets every 50cm',
        },
        {
          need: 'Quick roadshow — *goes up and down* the same day',
          pick_title: '2m × 1m, Eyelets only',
          pick_detail: 'From S$70/pc · standard finish · cable-tie ready',
        },
        {
          need: 'Outdoor banner that must *look good for a year*',
          pick_title: '3m × 1m, Hemmed + Eyelets',
          pick_detail: 'From S$105/pc · UV-stable ink · welded edge resists tear',
        },
        {
          need: 'Event backdrop — *clean top and bottom*, no stand',
          pick_title: '1m × 1m, Wooden Poles + Eyelets',
          pick_detail: 'From S$35/pc + S$15 poles · hangs flat · no ripple in the print',
        },
        {
          need: 'High-wind exposed spot — *wind slits needed*',
          pick_title: '3m × 2m, Hemmed + Eyelets + wind slits',
          pick_detail: 'From S$210/pc · perforated vents · banner survives storms without flapping off',
        },
      ],
    },
    seo_body:
      'PVC canvas banner printing Singapore — outdoor weatherproof banners, welded hems, brass eyelets, wind-slit perforation, wooden pole finishing. Construction hoarding, event backdrops, roadshow banners, 1m to 3m+ custom sizes, UV-stable solvent ink.',
    seo_magazine: {
      issue_label: 'Issue №01 · PVC Canvas',
      title: 'Everything worth knowing,',
      title_em: 'before it faces the weather.',
      lede:
        "An outdoor banner is a wind-sail, a UV target, and a weather punching-bag all at once. Fail any one of those and the banner comes down in a week. Four decisions decide whether it lasts a month or eighteen months: eyelet spacing, edge finish, wind-slit placement, and how it hangs on site.",
      articles: [
        {
          num: '01',
          title: 'Eyelets — spacing, size, and where the banner tears first.',
          body: [
            "Brass **eyelets** are the attachment points — cable ties, rope, bungee cords all thread through them. Spacing decides how the load distributes when the wind hits. Too few eyelets and the wind concentrates stress on two or three points; the grommets tear out of the canvas and the banner folds over itself. Standard spacing is one eyelet every **50cm around the perimeter**, with corner reinforcement.",
            "We fit **#4 brass grommets** by default — bigger ID than the cheap aluminium stamps, won't crack in cold snaps, won't oxidise in SG humidity. For banners over 3m × 2m we add intermediate eyelets along the top and bottom edges so the banner stays taut instead of billowing. Spacing is specced to the size, not a standard.",
          ],
          side: {
            kind: 'stat',
            label: 'Eyelet spacing',
            num: '~50cm',
            caption: 'brass grommets, corner-reinforced',
          },
        },
        {
          num: '02',
          title: 'Welded edges versus taped — the 90-day difference.',
          body: [
            "A **taped edge** is the budget finish — the canvas edge is folded over and stuck down with adhesive tape. Looks fine day one, peels after three months of UV and rain. The edge frays, water gets behind the tape, and the whole banner starts delaminating from the edge inward.",
            "A **welded hem** is heat-sealed — the canvas edge is folded and the PVC fuses to itself under heat and pressure. No tape, no adhesive, no peel point. It's what holds a banner in place through a full monsoon season without lifting. We weld as standard on anything spec'd for outdoor long-term use; taped only on indoor or short-duration jobs where the saving justifies the lower spec.",
          ],
          side: {
            kind: 'pills',
            label: 'Edge finish',
            items: [
              { text: 'Welded hem', pop: true },
              { text: 'Stitched seam' },
              { text: 'Taped (indoor only)' },
              { text: 'Reinforced corner' },
            ],
          },
        },
        {
          num: '03',
          title: 'Wind-slit perforation — the hole that saves the banner.',
          body: [
            "A large banner in an exposed spot catches wind like a sail. The force tries to rip the grommets out of the fabric, or tear the print down the middle. **Wind slits** are small staggered cuts through the canvas that let air pass through instead of load up against the face. The banner stays flat, the grommets stay put, and the print stays readable.",
            "We pattern the slits in a scattered diamond grid — enough airflow to break the wind load, few enough cuts to keep the graphic legible at viewing distance. For banners on rooftops, exposed hoardings, or high-wind sites, specify wind slits at quote stage. For enclosed event backdrops where there's no wind to speak of, skip it — the slits are visible up close.",
          ],
          side: {
            kind: 'list',
            label: 'Wind slits by site',
            rows: [
              { text: 'Enclosed event', time: 'No slits' },
              { text: 'Street-level', time: 'Optional' },
              { text: 'Rooftop / exposed', time: 'Recommended' },
              { text: 'High-rise hoarding', time: 'Mandatory' },
            ],
          },
        },
        {
          num: '04',
          title: 'Hanging method — pole, cable tie, or rope lashing.',
          body: [
            "**Wooden poles** threaded through a top sleeve give the banner a rigid hang, no corner wrinkle, no ripple in the print. Right for event backdrops, retail window banners, anything where presentation matters. Bottom pole adds weight so the banner doesn't curl up. **Cable ties** through grommets are faster, cheaper, fine for construction hoarding or temporary signage where straightness isn't mission-critical.",
            "**Rope lashing** is the old-school method — loop rope through every eyelet and tension around a frame. Holds the best against wind on an exposed structure, takes longer to install. Tell us at quote stage how the banner is hanging and we'll ship the right finishing hardware — pole sleeves, cable ties, rope length — not a generic pack.",
          ],
          side: {
            kind: 'quote',
            text: 'Hoarding survived a full monsoon season — welded hems, proper eyelet spacing, no tears. Re-ordered the same spec for the next site.',
            attr: 'Project Engineer, SG Construction',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🔩', title: 'Brass grommets, ~50cm spacing', desc: 'Corner-reinforced, #4 brass — does not tear out in wind load, does not corrode in humidity.' },
      { icon_url: null, emoji: '🔥', title: 'Welded hems, not taped', desc: 'Heat-sealed edges — no peel point, no delamination through an SG monsoon season.' },
      { icon_url: null, emoji: '💨', title: 'Wind-slit patterning', desc: 'Staggered diamond perforation on exposed sites — banner stays flat instead of ripping off.' },
      { icon_url: null, emoji: '🪵', title: 'Pole, tie, or rope kit', desc: 'Hanging hardware shipped to match the site — wooden pole sleeves or ties, specified at quote.' },
    ],
  },

  // ===========================================================
  // 8. PVC CARD
  // ===========================================================
  {
    slug: 'pvc-card',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Bank-card 760µm thickness.',
      right_note_body: 'CR80 standard — fits every wallet slot, reader, and terminal on the island.',
      rows: [
        {
          need: 'Membership launch — *cards out by next week*',
          pick_title: 'Gloss Finish, Double Sided',
          pick_detail: 'From S$9/10pcs · standard spec · 2–3 day production',
        },
        {
          need: 'Staff access cards — *need lanyard holes* pre-punched',
          pick_title: 'Matt Finish, Double Sided, Lanyard Hole',
          pick_detail: 'From S$10/10pcs + S$3 lanyard · slot cleanly punched · no tearing at the edge',
        },
        {
          need: 'Clinic appointment card — *writeable surface*',
          pick_title: 'Matt Finish, Double Sided',
          pick_detail: 'From S$10/10pcs · matt lam accepts ballpoint · wipes clean with alcohol',
        },
        {
          need: 'Premium loyalty programme — *high-end tactile finish*',
          pick_title: 'Frosted Finish, Double Sided, Lanyard Hole',
          pick_detail: 'From S$11/10pcs · textured coat · feels like a platinum card',
        },
        {
          need: 'Bulk run — *500+ cards*, cost-down per unit',
          pick_title: 'Gloss Finish, Double Sided, numbered',
          pick_detail: 'From S$3/pc at 500pcs · sequential member numbers · per-card personalisation',
        },
      ],
    },
    seo_body:
      'PVC card printing Singapore — 760-micron CR80 standard thickness, gloss / matt / frosted finishes, single or double sided, lanyard hole punch, sequential numbering and personalisation. Membership, loyalty, access, clinic, and ID cards.',
    seo_magazine: {
      issue_label: 'Issue №01 · PVC Card',
      title: 'Everything worth knowing,',
      title_em: 'before it goes into the wallet.',
      lede:
        "A PVC card has one job: survive the wallet. Every knock against coins, every fold of a back pocket, every three-year sweat-and-heat cycle. Four things decide whether the card reaches year three looking clean or turns into a warped, peeling relic — thickness standard, lamination, stripe/chip integration, and how the personalisation gets printed.",
      articles: [
        {
          num: '01',
          title: 'Why 760 microns is the non-negotiable standard.',
          body: [
            "**760 microns** (0.76mm) is the **ISO/IEC CR80** card standard — the exact thickness of every bank card, driver's licence, and building access card issued in SG. Hit that spec and the card fits every wallet slot, every magnetic reader, every chip terminal. Go thinner to save cost and the card bends in the wallet, falls out of slots, and looks cheap the moment a real card sits next to it.",
            "We run 760µm as standard across gloss, matt, and frosted finishes. The stock is fused from multiple PVC layers under heat and pressure — it doesn't delaminate, doesn't bow, doesn't warp. Cheaper 500µm cards exist for throwaway short-term use, but we don't stock them — the cost difference isn't worth the trade in perceived quality.",
          ],
          side: {
            kind: 'stat',
            label: 'Thickness',
            num: '760µm',
            caption: 'ISO/IEC CR80 — bank-card standard',
          },
        },
        {
          num: '02',
          title: 'Magnetic stripe, chip, or barcode — pick by the reader.',
          body: [
            "The card's technology has to match the reader system it's hitting. **HiCo magnetic stripes** (high-coercivity) are right for access systems that read door locks, gym turnstiles, parking gates — the stripe survives repeated swipes and stray magnets. **LoCo** is cheaper, easier to encode on-site, but demagnetises if left next to a phone speaker for a few days.",
            "**Chip / RFID** (125kHz or 13.56MHz) works for touchless access and cashless loyalty — no swipe, tap and go. **Barcode** (linear or QR) is the simplest — printed on the card surface, read by handheld scanners. Tell us the reader model and we'll spec the right integration. Wrong tech on the card is a useless card.",
          ],
          side: {
            kind: 'pills',
            label: 'Technology',
            items: [
              { text: 'HiCo magnetic', pop: true },
              { text: 'RFID 13.56MHz' },
              { text: 'QR barcode' },
              { text: 'Plain (visual only)' },
            ],
          },
        },
        {
          num: '03',
          title: 'Lamination — the difference between year one and year three.',
          body: [
            "**Gloss lamination** is the standard — clear, smooth, resists scratches for the first 6–12 months. **Matt lamination** hides fingerprint smudges, accepts ballpoint pen marks (useful for clinic appointment cards where the next date gets written on), and wipes clean with alcohol wipes. **Frosted** is the textured premium finish — velvet-feel surface, hides micro-scratches, reads as high-end.",
            "The laminate layer is fused at press temperature — it doesn't peel, even after a year in a back-pocket wallet. Edges are die-cut through the full laminate stack, so the side profile is one clean PVC line, not a peelable sandwich. Cards handed to customers should survive three years of daily use; the lamination is what makes that true.",
          ],
          side: {
            kind: 'list',
            label: 'Finish by use',
            rows: [
              { text: 'Loyalty / membership', time: 'Gloss' },
              { text: 'Clinic / appointment', time: 'Matt (writeable)' },
              { text: 'Premium / VIP', time: 'Frosted' },
              { text: 'Access / staff', time: 'Gloss or matt' },
            ],
          },
        },
        {
          num: '04',
          title: 'Number ranges and personalisation — printed, not stickered.',
          body: [
            "Card numbering isn't a sticker. Member IDs, staff codes, serial runs get **direct-printed** onto the card as part of the personalisation pass, under the lamination. No peel, no fade, no smudge. We'll number a run from 0001 to whatever, with matching barcodes or QR codes keyed to each number if the reader system needs it.",
            "For **name personalisation** (staff passes, named loyalty cards), we print each card individually — Jane's card says Jane, Raj's card says Raj, photo embedded per person if you send a roster. Turnaround is slightly longer than a blank run because each card is a unique print, but it's the difference between a card the holder owns and a generic blank they'll lose.",
          ],
          side: {
            kind: 'quote',
            text: 'Ordered 200 member cards, each with a unique number and QR — arrived ready to activate, reader scanned every one first try.',
            attr: 'Operations Lead, SG Fitness Chain',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '💳', title: '760µm CR80 stock', desc: 'Bank-card standard thickness — fits every reader, slot, and wallet on the island.' },
      { icon_url: null, emoji: '🛡️', title: 'Fused lamination', desc: 'Gloss, matt, or frosted laminate fused at press temperature — no peel, three-year wallet life.' },
      { icon_url: null, emoji: '🔢', title: 'Numbered + personalised', desc: 'Sequential IDs and names printed per-card under the laminate — no stickers, no fade.' },
      { icon_url: null, emoji: '📶', title: 'Mag stripe / RFID / QR', desc: 'Integration specced to your reader model — the card works first scan, not third.' },
    ],
  },

  // ===========================================================
  // 9. ROLL UP BANNER
  // ===========================================================
  {
    slug: 'roll-up-banner',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Stand in a carry case.',
      right_note_body: 'Pops up in 30 seconds — wheeled bag included on the big size.',
      rows: [
        {
          need: 'Trade-show booth *this Friday* — need it standing upright',
          pick_title: '85cm × 200cm, Matt Lamination',
          pick_detail: 'From S$75/pc · most popular size · carry bag included',
        },
        {
          need: 'Tight booth corner — *narrow footprint*',
          pick_title: '60cm × 160cm, Matt Lamination',
          pick_detail: 'From S$75/pc · slim stand · fits between wall panels',
        },
        {
          need: 'Campaign rebrand — *swap the graphic*, keep the stand',
          pick_title: '85cm × 200cm, Matt Lamination, replaceable panel',
          pick_detail: 'From S$75/pc panel-only · same base · reorder the graphic at fraction of full cost',
        },
        {
          need: 'Outdoor-ish event — *need gloss* to fight venue lighting',
          pick_title: '85cm × 200cm, Gloss Lamination',
          pick_detail: 'From S$75/pc · reflective surface · pops against dim trade-show halls',
        },
        {
          need: 'Event manager with *50 banners* for a rollout',
          pick_title: '85cm × 200cm, Matt Lamination, bulk discount',
          pick_detail: 'From quote · price drops per unit · colour-matched across the set',
        },
      ],
    },
    seo_body:
      'Roll-up banner printing Singapore — retractable stand in 60×160cm and 85×200cm, matt or gloss lamination, carry case included, replaceable graphic panels. Trade show booths, lobby signage, launch events, quick-deploy promotion stands.',
    seo_magazine: {
      issue_label: 'Issue №01 · Roll Up Banner',
      title: 'Everything worth knowing,',
      title_em: 'before the booth opens.',
      lede:
        "A roll-up banner is judged at two moments: when it goes up in front of the venue manager, and when it comes down after the event. Fail either — the mechanism jams, the carry case doesn't close, the graphic warps in the bag — and you've bought a disposable. Four things separate a year-one banner from a 50-show veteran: stand mechanism, replaceable panel, transport case, and height options.",
      articles: [
        {
          num: '01',
          title: 'Stand mechanism — the part that fails first.',
          body: [
            "The **retractable mechanism** is a spring-loaded roller inside the base, and it's the first thing to break on a cheap banner. Cheap stands use a plastic housing and an under-specced spring — the graphic unrolls fine the first five times, then starts sticking, then jams halfway up, then won't retract at all. You're now carrying a floppy banner and a broken base to the next show.",
            "We stock **aluminium-housing stands** with a rated spring life of 200+ deploy cycles. The base has a stabiliser bar that flips out to stop the stand tipping forward when the graphic is fully extended. The graphic bottom is clamped, not taped — the banner stays attached to the stand even after dozens of rollouts, no sagging, no peeling.",
          ],
          side: {
            kind: 'stat',
            label: 'Deploy cycles',
            num: '200+',
            caption: 'aluminium housing, rated spring',
          },
        },
        {
          num: '02',
          title: 'Replaceable panel — the move that saves budget.',
          body: [
            "Most of the cost of a roll-up banner isn't the graphic — it's the stand. The graphic is PVC canvas with a top clamp and a bottom rail, maybe S$30 of material. The stand housing, spring, feet, and case make up the rest. When your campaign rebrands six months later, throwing away the whole stand to reprint the graphic is waste.",
            "We build the banner so the **graphic panel is replaceable** — unclamp the top rail, roll out the old graphic, clip in the new one. Same stand, fresh artwork, a fraction of the full unit cost. Great for brands that rotate campaigns quarterly, or event agencies that keep a pool of stands and swap graphics for each client. Ask at quote and we'll ship the stand with replaceable-panel hardware.",
          ],
          side: {
            kind: 'pills',
            label: 'Reuse strategy',
            items: [
              { text: 'Replace panel', pop: true },
              { text: 'Keep stand' },
              { text: 'Swap per campaign' },
              { text: 'Agency pool' },
            ],
          },
        },
        {
          num: '03',
          title: 'Transport case — what protects the banner between shows.',
          body: [
            "A roll-up banner lives in a **padded carry case** — zippered nylon sleeve, reinforced ends, shoulder strap. The case protects the aluminium base from knocks in a car boot, keeps the graphic clean between deployments, and lets event crew carry two or three banners in one hand. Lose the case and the banner picks up scratches and dust within a week.",
            "Our **85×200cm** banners ship with a **wheeled trolley-style case** — telescopic handle, wheels, airline-style rollaway. For event managers handling multiple shows a week, this saves shoulders and keeps the stand straight. The 60×160cm smaller banners ship with a standard zippered sleeve; the whole kit fits under an airline overhead bin.",
          ],
          side: {
            kind: 'list',
            label: 'Case by size',
            rows: [
              { text: '60×160cm', time: 'Shoulder sleeve' },
              { text: '85×200cm', time: 'Wheeled trolley' },
              { text: 'Agency bulk', time: 'Logo-printed cases' },
              { text: 'Air travel', time: 'Fits overhead bin' },
            ],
          },
        },
        {
          num: '04',
          title: 'Height options — what fits the booth you are actually given.',
          body: [
            "Trade show booths in SG are typically 2.5m or 3m tall. An **85×200cm banner** sits comfortably inside either, with headroom above. A **60×160cm** fits tighter spaces — retail counters, narrow booth corners, HDB lobby notice areas where a full-height stand would look overbearing. The banner should frame the booth, not dominate it.",
            "For unusual venues — low-ceiling basements, pop-up café activations, kiosk roadshows — we'll quote custom heights. Match the banner to the room and the graphic reads cleanly from the walkway distance it needs to work at. Tell us the venue at quote stage and we'll spec the right size instead of defaulting to the popular one.",
          ],
          side: {
            kind: 'quote',
            text: 'Five banners for a three-city roadshow — same stands, fresh panels at each stop. Pulled them out, set them up in under a minute each.',
            attr: 'Events Manager, SG FMCG Brand',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '⚙️', title: 'Aluminium stand mechanism', desc: '200+ deploy-cycle spring, stabiliser bar, clamped graphic — survives a full tour schedule.' },
      { icon_url: null, emoji: '🔁', title: 'Replaceable graphic panel', desc: 'Keep the stand, swap the artwork each campaign — reorder at a fraction of full unit cost.' },
      { icon_url: null, emoji: '🎒', title: 'Carry case included', desc: 'Wheeled trolley on 85×200cm, shoulder sleeve on 60×160cm — banner travels clean between shows.' },
      { icon_url: null, emoji: '📏', title: 'Height to the venue', desc: 'Two standard sizes plus custom heights — matched to booth ceiling, not defaulted to one spec.' },
    ],
  },
];
