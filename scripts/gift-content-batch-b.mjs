// Batch B — 13 gift products, unique per-product content.
// Author: editorial. Do NOT regenerate from templates.
// Each product: seo_body, seo_magazine, faqs. Voice = lowercase-ish, blunt, SG-local.

export const BATCH = [
  // ─────────────────────────────────────────────────────────────
  // 1. disc-metallic-bracelet (laser)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'disc-metallic-bracelet',
    seo_body:
      'Disc metallic bracelet engraving Singapore — personalised disc bracelet, name bracelet, date bracelet, anniversary gift, couple jewellery. Surgical-grade stainless steel with 18k plating, 3–5 working days from Paya Lebar workshop.',
    seo_magazine: {
      issue_label: 'Issue №02 · Disc Metallic Bracelet',
      title: 'Everything worth knowing,',
      title_em: 'before the plating decides.',
      lede:
        "A disc bracelet that is worn every day lives on wrists that go through sweat, chlorine, shower water, and East Coast humidity. Four things decide whether it still looks right in year three — the plating, the engraving depth, the clasp, and how the base metal reacts to skin. Here's the plain version.",
      articles: [
        {
          num: '01',
          title: 'Gold, silver, or rose gold — the plating decision nobody explains.',
          body: [
            "The disc itself is **316L surgical-grade stainless steel** — the same grade used in jewellery pins and dental implants. What you see on the outside is a thin layer of **PVD plating** (physical vapour deposition), which is what gives you gold, silver-tone, or rose gold. PVD is harder than traditional electroplating, rated around **5× more scratch-resistant**, and bonds at the molecular level rather than sitting on top of the metal.",
            "**Gold** wears warmest and hides minor wrist scuffs well. **Silver-tone** stays cleanest against dark sleeves and is the safer pick for clinical and corporate wrists. **Rose gold** reads as intentional — reads well on most skin tones but the pink tint can drift yellow over years of detergent exposure. If you're buying for someone who showers with the bracelet on, stick with gold or silver.",
          ],
          side: {
            kind: 'pills',
            label: 'Plating options',
            items: [
              { text: '18k Gold', pop: true },
              { text: 'Silver-tone' },
              { text: 'Rose Gold' },
            ],
          },
        },
        {
          num: '02',
          title: 'Engraving depth is why cheap bracelets stop reading after year two.',
          body: [
            "Entry-level disc bracelets from mall kiosks are often **surface-etched** — the laser only marks the top oxide layer. Rub a year of cuff contact against it and the characters fade to a ghost. Our engrave goes **0.15–0.2mm into the steel**, deep enough that wear actually deepens the contrast rather than erasing it.",
            "Font choice matters more than people expect. **Script fonts under 2mm** start filling in at depth — the thin connectors blur. For a disc this size, we default to **clean sans-serif at 3–4mm cap height**, which stays legible for names, dates, and short words. Anything longer than 12 characters and we'll flag it before cutting.",
          ],
          side: {
            kind: 'stat',
            label: 'Engrave depth',
            num: '0.2',
            suffix: 'mm',
            caption: 'deep enough to outlast the plating',
          },
        },
        {
          num: '03',
          title: 'The clasp is where every cheap bracelet dies.',
          body: [
            "Most people don't lose a bracelet because the chain snapped — they lose it because the **clasp sprung open** on the MRT. We use a **lobster-claw clasp** with a sprung trigger rated for more than ten thousand open-close cycles. The pin is solid steel, not stamped sheet, which is the invisible difference between a clasp that lasts three months and one that lasts three years.",
            "The chain length pairs to the clasp — we size bracelets to **16–18cm standard SG wrist** with a built-in **2cm extender loop**, so the wearer adjusts without a trip to the jeweller. For thicker wrists or layering over another bracelet, flag it at checkout and we'll resize before production.",
          ],
          side: {
            kind: 'list',
            label: 'Clasp checkpoints',
            rows: [
              { text: 'Lobster-claw trigger', time: 'Sprung' },
              { text: 'Solid pin', time: 'Not stamped' },
              { text: 'Cycle rating', time: '10k+' },
              { text: 'Extender loop', time: '2cm' },
            ],
          },
        },
        {
          num: '04',
          title: 'Nickel-allergy skin in SG heat — the base metal question.',
          body: [
            "Singapore wrists sweat. Cheap alloys contain nickel that reacts with sweat to form nickel salts — the itch, redness, and green wrist-stain that people blame on 'my skin turning everything green'. Our base is **316L with <0.05% nickel release** under the EU nickel directive — the hypoallergenic threshold recognised by dermatologists.",
            "If the wearer already reacts to costume jewellery or has a diagnosed nickel allergy, tell us at checkout and we'll upgrade to a **full stainless-with-gold-fill layer** for extra isolation. No extra charge on single pieces — we'd rather ship a bracelet that stays on the wrist than one that ends up in a drawer.",
          ],
          side: {
            kind: 'quote',
            text: "Bought three other bracelets before this, all turned my wrist green by week two. This one has lived through two years of gym showers.",
            attr: 'Repeat buyer, Tampines',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Can I shower and swim with the disc bracelet on?',
        answer:
          'Showering and rain are fine — the 316L steel and PVD plating both handle fresh water daily. Chlorinated pools and saltwater are fine for a session but rinse it off after, because chlorine residue pitted on the plating over months is the one thing that will dull it. Take it off before hot springs or spas.',
      },
      {
        question: 'How many characters will actually fit on the disc?',
        answer:
          'The disc is 25mm across with 18mm of safe engraving area. Sans-serif text fits 12–14 characters on one line at a clean 3mm height, or up to 20 characters on two lines. Single-line dates like "28.09.24" sit beautifully. If you want a full sentence, we will flag it before cutting and suggest a different product.',
      },
      {
        question: 'What if the wrist measurement is wrong when it arrives?',
        answer:
          'The built-in 2cm extender usually covers a wrist that is one size off. If the bracelet is genuinely too small or too large, bring it to our Paya Lebar Square workshop and we will resize the chain free within 14 days of delivery — we just ask that the disc engraving is untouched.',
      },
      {
        question: 'Will the rose gold fade to yellow over time?',
        answer:
          'PVD-plated rose gold holds its pink hue for 3–5 years under normal wear. What shifts it is concentrated detergent contact — dishwashing without gloves, hand sanitiser applied directly over it, aggressive perfume sprays. If the bracelet lives on a work wrist, silver or classic gold holds its tone longer.',
      },
      {
        question: 'Can I add a second engraving on the back?',
        answer:
          'Yes — the back takes the same engraving depth as the front and it is a common ask for couple gifts, where the date goes on the back and the name on the front. Add a note at checkout with exactly what you want on each side, and we will proof it back to you before cutting.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. duo-heart-necklace (laser)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'duo-heart-necklace',
    seo_body:
      'Duo heart necklace engraving Singapore — couple necklace, magnetic matching necklace, anniversary gift, best friend necklace, his and hers jewellery. Two interlocking hearts with personalised engraving, 3–5 working days from Paya Lebar workshop.',
    seo_magazine: {
      issue_label: 'Issue №02 · Duo Heart Necklace',
      title: 'Everything worth knowing,',
      title_em: 'before you split the pair.',
      lede:
        "Two hearts that connect into one and separate into two necklaces — worn by couples, best friends, mothers and daughters. Four things decide whether the piece still feels right when the pair separates into different lives — the magnetic pairing, the two-sided engraving, the chain pairing, and what happens if the relationship ends. Here is how we think about each.",
      articles: [
        {
          num: '01',
          title: 'How the magnetic pairing actually holds together.',
          body: [
            "The two hearts aren't just cut to fit — each half contains an **N52-grade neodymium magnet** with opposite polarity, so when the hearts are brought within 2cm of each other they click together with a decisive snap. Cheaper duo necklaces use bonded ferrite magnets that lose **15–20% of their pull per year** and end up just sitting next to each other, not actually locking.",
            "N52 is the strongest commercial rare-earth grade — rated to hold for **30+ years** before any measurable demagnetisation, and strong enough that the two hearts find each other through a t-shirt layer if the wearers stand close. The magnet sits behind a steel backing, not exposed — so nothing comes into contact with skin or the engraved face.",
          ],
          side: {
            kind: 'stat',
            label: 'Magnet grade',
            num: 'N52',
            caption: 'rare-earth, no fade over decades',
          },
        },
        {
          num: '02',
          title: 'Two faces, two sides — the engraving decision couples miss.',
          body: [
            "Most people engrave the same thing on both hearts — 'Jia Wei' on one, 'Samantha' on the other. Predictable. What we quietly recommend: **engrave the partner's name on each half** so the wearer reads the other person's name on their own chest. The asymmetry is the point.",
            "The **back of each heart** takes engraving too and is often ignored. A date on the back (first-met, first-kissed, wedding) gives the piece a private second layer — visible only when the wearer looks down at it. On couple orders we proof both fronts and both backs before cutting, so you can catch anything off before steel is touched.",
          ],
          side: {
            kind: 'list',
            label: 'Engraving layout ideas',
            rows: [
              { text: 'Front: partner name', time: 'His/Hers' },
              { text: 'Back: anniversary date', time: 'Private' },
              { text: 'Joined reads', time: 'Full word' },
              { text: 'Initials + date', time: 'Minimal' },
            ],
          },
        },
        {
          num: '03',
          title: 'Chain length — why one couple keeps losing a necklace.',
          body: [
            "The two chains ship at **45cm and 50cm** by default — close enough that both read as standard, different enough that a couple doesn't accidentally swap them. One partner pocketing the wrong chain and leaving for work is the #1 reason a duo necklace gets 'lost' at home. The 5cm difference makes the pair distinguishable by touch.",
            "If one half is for a child or someone with a smaller neck, ask for a **40cm short chain** in checkout notes. Conversely, if one wearer prefers the heart sitting lower (over a shirt, outside collar), we stock **55cm and 60cm chain upgrades** that match the plating tone of the heart itself — silver with silver, gold with gold, no mismatch at the clasp.",
          ],
          side: {
            kind: 'pills',
            label: 'Chain lengths',
            items: [
              { text: '40cm short' },
              { text: '45cm standard', pop: true },
              { text: '50cm standard' },
              { text: '55cm long' },
              { text: '60cm long' },
            ],
          },
        },
        {
          num: '04',
          title: "The quiet promise — two necklaces, not one shared object.",
          body: [
            "The duo heart necklace is often bought for a 'forever' moment — new relationship, engagement, birthday. What nobody talks about: **relationships end**. The piece is designed so that even separated, **each half is a complete necklace on its own** — the cut edge is polished as carefully as the outer curve, the back has a finished line, the engraving on each half stands alone as its own piece.",
            "That's deliberate. A duo necklace shouldn't become something you have to hide if things change — it should be able to exist as a standalone memento of a period of your life. We've shipped enough of these over the years to know the pairing doesn't always last, and the jewellery shouldn't force a ritual disposal when it ends.",
          ],
          side: {
            kind: 'quote',
            text: "We broke up two years after. I kept wearing mine — people who don't know just see a heart. It's still mine.",
            attr: 'Buyer, via follow-up survey',
          },
        },
      ],
    },
    faqs: [
      {
        question: "Do I have to buy the pair together or can I order just one half?",
        answer:
          "The set ships as a pair because the two magnets are polarity-matched — one north, one south. Buying a single half later from a different batch means there is no guarantee the magnets click. If you need a replacement for a lost half, contact us with the original order number and we cut a polarity-matched partner from the same batch file.",
      },
      {
        question: 'Will the magnet affect a phone or card?',
        answer:
          'N52 is strong but small. The pull field extends roughly 2cm — enough to click with the other heart but not enough to corrupt a credit card kept in a wallet on the opposite side of the body. Keep the necklace off a mechanical watch if you are storing them next to each other long-term, as any strong magnet will eventually drift a balance wheel.',
      },
      {
        question: 'Can both chains be the same colour but different metals?',
        answer:
          'Yes, and it is a common ask. Gold-plated for one, silver-tone for the other — same heart cut, different finish. Tell us the pairing at checkout and we match the clasp, jump ring, and chain tone to each heart so nothing looks like an afterthought.',
      },
      {
        question: 'Is it okay to sleep and shower with the necklace on?',
        answer:
          'Showering and sleeping are both fine. The magnet is sealed behind steel and the plating is PVD, not electroplate, so daily water contact does not dull it. What we advise against is hot tubs and saunas — sustained high heat above 80°C can slowly weaken the neodymium magnet over the years.',
      },
      {
        question: 'How long does a duo order actually take?',
        answer:
          'Standard lead time is 3–5 working days from artwork approval, cut and engraved at our Paya Lebar Square workshop. If you need it for a specific date — anniversary, proposal, birthday — tell us the deadline in the order notes and we prioritise it. Rush-slot availability depends on the week but we are usually honest about whether we can hit it.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. embroidered-aprons (embroidery)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'embroidered-aprons',
    seo_body:
      'Embroidered aprons Singapore — cafe uniforms, F&B staff aprons, custom logo embroidery, kitchen apparel, barista apron. Drill and canvas fabric, Madeira polyester thread, Pantone-matched logos, 5–7 working days.',
    seo_magazine: {
      issue_label: 'Issue №02 · Embroidered Aprons',
      title: 'Everything worth knowing,',
      title_em: 'before the kitchen takes it in.',
      lede:
        "An apron lives its life being washed hot, splashed with oil, tugged, tied, and shoved into a laundry trolley three times a day. Four things separate an apron that still looks sharp in month eighteen from one that fades by the first staff meal — the fabric weight, the thread type, the embroidery method, and how many wash cycles it is actually built for. Here is how each decision plays out in a Singapore F&B kitchen.",
      articles: [
        {
          num: '01',
          title: 'Drill, canvas, or twill — what the fabric weight does.',
          body: [
            "A lightweight apron (around **180gsm cotton twill**) feels soft day one and looks ragged after the first industrial wash. Commercial kitchens need **240–320gsm drill** — cotton or poly-cotton woven tight enough to take oil splashes without staining through, heavy enough to hold its shape when tied around a moving waist. We stock **280gsm cotton drill** as our default because it is the sweet spot between hand-feel and longevity.",
            "For rougher work — workshops, ceramic studios, outdoor F&B concepts — **canvas at 340gsm** is the pick. Heavier than drill, stiffer in the first few washes, softens into a lived-in feel around month three. Not for front-of-house in a clean cafe, where it reads too utility. Tell us the environment and we suggest accordingly.",
          ],
          side: {
            kind: 'stat',
            label: 'Default drill weight',
            num: '280',
            suffix: 'gsm',
            caption: 'balanced for SG F&B use',
          },
        },
        {
          num: '02',
          title: 'Polyester thread vs cotton thread — a fifty-wash test.',
          body: [
            "Embroidery thread is where the logo either lives or dies. We use **Madeira Polyneon polyester thread** as our house standard, because it survives **hot washes up to 95°C** (industrial laundry spec) and doesn't crack under commercial dryers. Cotton thread is softer and has a prettier matte finish, but it **loses colour after 30–40 washes** and starts fraying at stitch ends.",
            "For boutique concepts where the apron gets hand-washed and the softer matte cotton look matters, we can switch to **Madeira Classic rayon** for a premium finish — but we'll flag it if you're ordering for an industrial kitchen, because rayon won't survive the laundry service. Tell us how the apron gets washed and we pick the thread accordingly.",
          ],
          side: {
            kind: 'list',
            label: 'Thread pick by washing',
            rows: [
              { text: 'Industrial laundry', time: 'Polyester' },
              { text: 'Hot home wash', time: 'Polyester' },
              { text: 'Cold hand-wash', time: 'Cotton / Rayon' },
              { text: 'Colour-fast need', time: 'Polyester' },
            ],
          },
        },
        {
          num: '03',
          title: 'Machine embroidery vs heat-press — why we won\'t heat-press.',
          body: [
            "Heat-press vinyl on aprons is the quick path — same-day turnaround, low minimum, cheaper per piece. Three weeks into a busy kitchen and the edges of the vinyl start lifting at the corners, and by month three the logo cracks down the middle as the apron flexes at the waist tie. **Machine embroidery** is stitched into the weave itself — the logo is part of the fabric, not sitting on top of it.",
            "We **digitise** every logo first — the artwork is converted into stitch-path coordinates by a human, not a button-push auto-digitiser, because auto-digitising on anything with small type (under 5mm) produces muddy unreadable stitch. Give us your logo as a vector (AI, SVG, PDF) and we'll preview the digitised file before we queue production.",
          ],
          side: {
            kind: 'quote',
            text: "Had heat-press from another supplier — cracked in two months across 30 aprons. Re-ordered embroidered. Two years in, all still sharp.",
            attr: 'Cafe owner, Tiong Bahru',
          },
        },
        {
          num: '04',
          title: 'The wash-cycle question most shops don\'t answer.',
          body: [
            "How many washes should an embroidered logo last? We rate our aprons to **100+ industrial wash cycles** before the embroidery shows any thread fray, based on a real 60°C test cycle with commercial detergent. That's roughly **2 years of daily use** with a standard F&B rotation of 3 aprons per staff member.",
            "The apron fabric itself tends to outlive the embroidery — cotton drill can run 200+ washes before the weave thins. If you need a lifetime-of-business apron for a premium concept, spec the **320gsm drill + poly thread** combo. Volume orders above 50 get Pantone-matched thread spools held on file for easy reorder when new hires come in.",
          ],
          side: {
            kind: 'pills',
            label: 'Apron options',
            items: [
              { text: 'Drill 280gsm', pop: true },
              { text: 'Drill 320gsm' },
              { text: 'Canvas 340gsm' },
              { text: 'Half bib' },
              { text: 'Full bib' },
            ],
          },
        },
      ],
    },
    faqs: [
      {
        question: 'How small can the embroidered logo be before it looks bad?',
        answer:
          'Our minimum readable text height is 5mm — anything smaller and the stitch count can\'t resolve individual characters, so your brand name looks like a smudge. For logos with fine detail (thin lines, serif type under 3mm stroke) we recommend simplifying for embroidery. We will flag it and suggest edits before digitising.',
      },
      {
        question: 'Can you match my exact brand Pantone?',
        answer:
          'Yes — Madeira Polyneon has 400+ colours that map directly to Pantone Solid Coated. Give us your Pantone code in checkout and we match. For a colour that falls between stock thread shades, we\'ll show you the two nearest options and let you pick, rather than guessing.',
      },
      {
        question: 'What is the minimum order quantity?',
        answer:
          'Single-piece orders are fine for personal or gift aprons — each is digitised and stitched individually. For commercial runs, **10 pieces is the quantity where pricing starts to scale down**, and 30+ unlocks the volume bracket. We don\'t punish small orders but we pass on savings when the run supports it.',
      },
      {
        question: 'Do you stock black, white, or beige aprons only?',
        answer:
          'Our standard stock is black, white, charcoal, navy, khaki, and natural ecru — the six colours that cover 90% of SG F&B concepts. For custom colours (burgundy, forest green, sage) we source from the mill with a 2-week lead time added. Tell us the Pantone and we\'ll confirm availability.',
      },
      {
        question: 'Can you embroider on an apron I already own?',
        answer:
          'Yes, but with caveats. The apron has to be washed clean before we embroider (oils on the fabric affect the stitch), and we can\'t guarantee colour-match on pre-used garments. For 5+ existing aprons we run a batch service — drop them at our Paya Lebar workshop and we turn them around in 5 working days.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. embroidered-towels (embroidery)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'embroidered-towels',
    seo_body:
      'Embroidered towels Singapore — personalised monogrammed towels, hotel towels, bridal gift towels, spa and gym branding, corporate towels. 550gsm cotton, Turkish and Egyptian options, Madeira thread, 5–7 working days from Paya Lebar.',
    seo_magazine: {
      issue_label: 'Issue №02 · Embroidered Towels',
      title: 'Everything worth knowing,',
      title_em: 'before the monogram goes on.',
      lede:
        "A branded towel is either a disposable giveaway or a keepsake someone reaches for ten years later — the difference lives in four details. GSM of the cotton, thread density against the looped pile, cotton origin (Turkish, Egyptian, Xinjiang), and where the monogram sits on the piece. Here is how each one changes the towel.",
      articles: [
        {
          num: '01',
          title: 'GSM is the number that actually matters.',
          body: [
            "Hotel bath towels run **400–500gsm**. Decent home towels run **500–600gsm**. Five-star spa and luxury bridal towels run **600–700gsm**. The GSM number is the weight per square metre — higher gsm means denser, thicker loops, more absorbency, and heavier hand-feel. We stock our default at **550gsm combed cotton**, which covers the gift, hotel, and spa use cases without pushing into bulky-dryer territory.",
            "Go under 400gsm and the towel reads thin and disposable — fine for gym giveaways, wrong for a wedding favour. Over 700gsm and the towel starts needing 2× the dry time, which matters if you're shipping 100 for a corporate retreat and they all need to be washed and ready in a single day.",
          ],
          side: {
            kind: 'stat',
            label: 'Default weight',
            num: '550',
            suffix: 'gsm',
            caption: 'premium-gift range, fast-drying',
          },
        },
        {
          num: '02',
          title: 'Thread density on a looped surface is its own problem.',
          body: [
            "Embroidering on a looped-pile towel is genuinely harder than embroidering on a flat shirt. The loops flex under the needle, which means standard flat-stitch settings produce a monogram that looks like it's sinking into the towel. We run **water-soluble topping film** on every towel embroidery — a thin layer that holds the loops flat during stitching, then dissolves in the first wash.",
            "The stitch count goes up too — roughly **1.5× the density** of a flat-fabric logo, because the pile sucks thread into the weave. A clean three-letter monogram on a bath towel takes around **8,000–10,000 stitches** at the right density, versus 5,000 on a polo. That's why we quote embroidery by piece, not by letter — the real cost is machine time.",
          ],
          side: {
            kind: 'list',
            label: 'Stitch density per job',
            rows: [
              { text: '3-letter monogram', time: '8–10k stitches' },
              { text: 'Full name', time: '15–20k' },
              { text: 'Hotel crest', time: '25–40k' },
              { text: 'Brand wordmark', time: '12–18k' },
            ],
          },
        },
        {
          num: '03',
          title: 'Turkish vs Egyptian vs Xinjiang — does the cotton origin matter?',
          body: [
            "**Egyptian cotton** has the longest staple fibre (35mm+), which produces the softest and most absorbent towels — luxury hotel spec. **Turkish cotton** has medium-long staple (28–33mm), dries faster than Egyptian, and is what most Nordic-minimalist homeware brands use. **Xinjiang cotton** is a middle-ground staple that's become the workhorse of the SG gifting market — good value, 90% of the quality at 60% of the price.",
            "If the towel is a one-time bridal favour or a hotel amenity, Egyptian justifies itself. If it's a gym brand that gets washed 3× a week, Turkish is the smart pick — it survives repeated washing without losing pile height. For most corporate gifts and mid-tier hotels, our default Xinjiang-blend 550gsm hits the right balance. Tell us the end use.",
          ],
          side: {
            kind: 'pills',
            label: 'Cotton origin',
            items: [
              { text: 'Xinjiang blend', pop: true },
              { text: 'Turkish' },
              { text: 'Egyptian' },
            ],
          },
        },
        {
          num: '04',
          title: 'Corner or centre — where the monogram sits.',
          body: [
            "The default is the **bottom-right corner of a folded bath towel**, 8cm from each edge — visible when the towel is stacked on a shelf, out of the way when the towel is in use. That's the standard because hotels and spas want brand recognition on display without letting the logo press against a wet face.",
            "**Centre placement** reads as a keepsake or personal monogram — bridal shower favours, anniversary gifts, housewarming pieces. **Hem-band placement** (a thin strip across the short edge) is the hotel-crest look, premium and reserved. For volume gifts we recommend corner. For single personal pieces, centre earns the extra visibility.",
          ],
          side: {
            kind: 'quote',
            text: "Bought embroidered bath towels for our hotel opening — five years in, the corner monograms still look new. Guests ask where we sourced them.",
            attr: 'Operations Manager, SG boutique hotel',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'What towel sizes do you stock?',
        answer:
          'We stock face (30×30cm), hand (40×70cm), bath (70×140cm), and bath sheet (90×180cm) as standard. Most corporate and hotel orders run bath + hand as a set. For bridal gifts, a single bath towel with paired monograms is the common pick. Tell us the set you want and we quote by piece.',
      },
      {
        question: 'Can the embroidery withstand hotel-grade laundry?',
        answer:
          'Yes. Our Madeira Polyneon thread is rated for 95°C industrial washes with commercial detergent — standard for hotel and spa laundry. We have clients whose embroidered towels are on year four of 3× weekly hot washes with no visible fade. Cotton thread is not suitable for industrial laundry and we will recommend against it for commercial use.',
      },
      {
        question: 'Do embroidered towels shrink after the first wash?',
        answer:
          'All cotton towels shrink 3–5% on the first wash, which is why we pre-wash the towel blank before embroidering on premium orders. For standard orders we embroider then ship, and the slight shrinkage afterwards has no effect on the embroidery — the stitches compress evenly with the fabric.',
      },
      {
        question: 'What is the minimum order for embroidered towels?',
        answer:
          'Single pieces are fine for personal gifts and bridal favours. For hotel, spa, or corporate branding, 30+ pieces unlocks the volume rate. Orders below 10 are priced at a single-piece rate because the machine setup cost stays the same regardless of quantity.',
      },
      {
        question: 'Can you do matching sets for a bridal gift — his and hers monograms?',
        answer:
          'Yes, and it is one of our most common bridal orders. We embroider the groom\'s initial on one towel and the bride\'s on the other, same colour thread, same placement, as a matching bath-towel pair. For a full bathroom set (2× bath, 2× hand, 2× face) we can run all six pieces with coordinated monograms.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. fancy-envelopes (photo-resize)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'fancy-envelopes',
    seo_body:
      'Fancy envelopes printing Singapore — wedding invitation envelopes, custom addressed envelopes, premium paper envelopes, luxury stationery, wax seal ready. 120–200gsm stocks, 300 DPI addressing, 4–6 working days from SG studio.',
    seo_magazine: {
      issue_label: 'Issue №02 · Fancy Envelopes',
      title: 'Everything worth knowing,',
      title_em: 'before the guest opens it.',
      lede:
        "The envelope is the first object your guest touches — before the invitation, before the RSVP, before the venue reveal. Four decisions decide whether it reads as 'this wedding will be thoughtful' or 'this is probably from a bank'. Paper weight, wax-seal compatibility, how the address is applied, and how the envelope pairs with the invitation inside. Here is the plain version of each.",
      articles: [
        {
          num: '01',
          title: 'Paper GSM — what the envelope weight is actually signalling.',
          body: [
            "**120gsm** envelopes are the SingPost standard — thin, functional, feels like any utility mail. Guests register nothing. **150gsm** is the baseline for anything that wants to be noticed — enough stiffness to stand upright when handed over, enough weight to not flop when held at a corner. **180gsm** is the wedding-stationery sweet spot — substantial, handles fine addressing without bleed, holds a wax seal without warping.",
            "Beyond 200gsm the envelope starts becoming a mini-folder and complicates SingPost handling — expect automated sorting to reject it and a manual handling surcharge. For hand-delivered invitations and RSVP-by-hand culture, 200gsm+ is fine. For mailed invitations, stay at 180gsm.",
          ],
          side: {
            kind: 'stat',
            label: 'Wedding spec',
            num: '180',
            suffix: 'gsm',
            caption: 'the right weight for sealed mail',
          },
        },
        {
          num: '02',
          title: 'Wax seals — and the paper that refuses to hold them.',
          body: [
            "A wax seal on a thin envelope tears the paper when the recipient opens it, or the seal itself **cracks in transit** because the envelope flexed in a SingPost sorting machine. Seals work on **180gsm+ uncoated stocks** only — the wax bonds to the paper fibres, not a glossy surface.",
            "We recommend **ivory cotton-feel or antique laid** paper for any wedding that's using seals. Both are uncoated, both take wax beautifully, both have enough tooth that the seal cools in contact without slipping. If you're doing seals, hand-deliver or use padded envelopes — posting a wax-sealed envelope through standard mail is how most couples end up with 30 cracked seals on arrival.",
          ],
          side: {
            kind: 'list',
            label: 'Wax seal compatibility',
            rows: [
              { text: '120gsm coated', time: 'Don\'t' },
              { text: '150gsm matte', time: 'Marginal' },
              { text: '180gsm uncoated', time: 'Yes' },
              { text: '200gsm cotton', time: 'Ideal' },
            ],
          },
        },
        {
          num: '03',
          title: 'Digital addressing vs hand-calligraphy — what we actually recommend.',
          body: [
            "**Digital addressing** at 300 DPI with a calligraphy-style font reads as intentional and saves two weeks of a stationer's time. For 80–200 guest weddings, it is the realistic pick. We print addresses directly onto the envelope in a single pass — no labels, no stickers, no offset registration issues.",
            "**Hand-calligraphy** still wins when it matters — close family invites, dignitary envelopes, anniversary cards. But hand-addressing 200 envelopes at S$8–12 per envelope is how wedding budgets break. A compromise many couples land on: digital-address the bulk, then hand-letter just the top 20 (family, VIPs, overseas). We print in runs that leave some envelopes blank for the hand-work.",
          ],
          side: {
            kind: 'pills',
            label: 'Addressing options',
            items: [
              { text: 'Digital print', pop: true },
              { text: 'Hand lettering' },
              { text: 'Mixed run' },
              { text: 'Blank / DIY' },
            ],
          },
        },
        {
          num: '04',
          title: 'How the envelope pairs with what\'s inside.',
          body: [
            "A heavy 200gsm envelope paired with a flimsy 120gsm invitation card is a visual mismatch the guest registers subconsciously — 'the outside was nice, the actual invite felt cheap'. The rule of thumb: **invitation card ≥ envelope weight**, or within 30gsm. If the envelope is 180gsm uncoated cotton, the invite inside should be at least **250gsm cotton or art card**.",
            "Colour pairing matters too. An ivory-tone envelope with a bright-white invite inside reads as uncoordinated. We stock envelopes in the **same paper families as our invitation card stocks** — ivory matches ivory, pearl matches pearl, black matches black — so the whole suite reads as one decision.",
          ],
          side: {
            kind: 'quote',
            text: "Guests kept telling us the invitation felt like a real event — turned out they meant the envelope. We upgraded to 180gsm cotton; everyone noticed.",
            attr: 'Bride, Sep 2024',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Do you handle the envelope addressing or do I provide a list?',
        answer:
          'You provide the guest list as a spreadsheet (name + address, one per row) and we handle the layout, font pairing, and printing. We proof 5 sample envelopes back to you before running the full batch, so you catch any address typos before 200 envelopes are committed to print.',
      },
      {
        question: 'Can you print on dark-coloured envelopes (black, navy)?',
        answer:
          'Yes, with white ink using our digital press — it takes a dedicated setup and a slightly longer lead time (add 2 days). For metallic effects on dark stock (rose gold ink on navy, silver on black), we run hot-foil stamping as a secondary pass. Upload your artwork and we quote the finish options.',
      },
      {
        question: 'What envelope sizes do you stock for wedding invites?',
        answer:
          'Our standard wedding stocks are C5 (229×162mm, fits A5 invites flat) and C6 (162×114mm, fits A6 or folded A5). For oversized invites with RSVP cards, response envelopes, and accommodation inserts, we run B5 (250×176mm) or custom-cut to your spec with a 5-day lead time.',
      },
      {
        question: 'Will the printing survive SingPost delivery without smudging?',
        answer:
          'Digital print on uncoated stocks cures immediately and is smudge-resistant for normal handling. What does smudge is printing on glossy or coated envelopes left unsealed in humidity. If your invites are mailing rather than being hand-delivered, we recommend uncoated stocks only — and we flag anything mail-unfriendly before printing.',
      },
      {
        question: 'Can I order envelopes without addressing — just for DIY?',
        answer:
          'Yes. We ship blank premium envelopes in any of our stocks, boxed flat, for calligraphers or DIY couples. Minimum order is 25 pieces. If you want the envelope printed with just a return address on the flap (no guest addressing on the front), that is a common compromise and cheaper than full addressing.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6. forever-necklace (laser)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'forever-necklace',
    seo_body:
      'Forever necklace Singapore — welded permanent necklace, soldered chain, couple appointment fitting, infinity chain, friendship forever necklace. 316L steel and 18k gold-fill, walk-in appointments at Paya Lebar Square workshop.',
    seo_magazine: {
      issue_label: 'Issue №02 · Forever Necklace',
      title: 'Everything worth knowing,',
      title_em: 'before we close the link.',
      lede:
        "The forever necklace is the one piece we sell that doesn't have a clasp. The chain is **measured on the neck** and **soldered shut** in under 30 seconds — it comes off only when it is cut off. Four things decide whether that's a piece worth committing to or a pretty idea you regret. The concept itself, how the fitting works in SG, the tarnish math, and what happens when life forces it off.",
      articles: [
        {
          num: '01',
          title: 'What "forever" actually means (and why it isn\'t a gimmick).',
          body: [
            "A forever necklace is a chain **permanently welded shut around the neck** — no clasp, no opening, no taking it off at night. The idea is that a piece you never remove becomes part of the body's rhythm rather than an object you put on and take off. Originated in NYC jewellery studios in 2019, arrived in SG boutique jewellers around 2022, and has settled into weddings, engagements, and mother-daughter milestones as the quiet alternative to a ring.",
            "The weld itself is done with a **micro-argon welding tool** — a pinpoint arc that fuses two jump-ring ends in under two seconds. The chain is already around your neck when this happens; the tool is a millimetre away from skin and the arc is contained by a carbon shield. Safer than it sounds, faster than most ear-piercings, and the result is a seamless closed loop where the weld is indistinguishable from the rest of the chain.",
          ],
          side: {
            kind: 'stat',
            label: 'Weld time',
            num: '<30',
            suffix: 's',
            caption: 'from clipped to closed loop',
          },
        },
        {
          num: '02',
          title: 'Appointment-based fitting at Paya Lebar — why we don\'t ship this one.',
          body: [
            "Every other piece we make ships with tracking. The forever necklace doesn't — because the whole point is that the chain has to be **measured and welded on your neck**, not packed in a box. Walk-in fittings are available at our **Paya Lebar Square workshop** by appointment, typically 15–20 minutes per person, longer for couples or groups.",
            "For couples and small groups (hen parties, best-friend trios, mother-daughter milestones), book a **group appointment slot** and we set aside a longer window so everyone gets fitted together. Walk-ins without appointment are welcome if the schedule allows but we can't guarantee same-day — weekends book out 2–3 weeks ahead during Valentine's and anniversary season.",
          ],
          side: {
            kind: 'list',
            label: 'Fitting options',
            rows: [
              { text: 'Solo fitting', time: '15 min' },
              { text: 'Couple', time: '30 min' },
              { text: 'Group of 4', time: '60 min' },
              { text: 'Private booking', time: 'Full hour' },
            ],
          },
        },
        {
          num: '03',
          title: 'Tarnish resistance — the real question nobody asks up front.',
          body: [
            "A necklace that never comes off goes through sweat, sunscreen, chlorine, shampoo, detergent, perfume, and the occasional round of pool chlorine. Our default forever chain is **316L surgical stainless steel** — the same spec we use on medical jewellery — and is rated to stay tarnish-free through all of that for **5+ years continuous wear**.",
            "Our gold option is **18k gold-fill** (a heavy-plated solid layer bonded under heat and pressure, not electroplated), rated for **3+ years continuous wear** before any visible plating wear at the highest-friction spots (back of the neck, under hair). Solid 14k and 18k gold chains are also available for clients who want a truly decades-long piece — flag it in booking.",
          ],
          side: {
            kind: 'pills',
            label: 'Chain material',
            items: [
              { text: '316L steel', pop: true },
              { text: '18k gold-fill' },
              { text: '14k solid' },
              { text: '18k solid' },
            ],
          },
        },
        {
          num: '04',
          title: 'When it has to come off — the spare-link policy.',
          body: [
            "A forever necklace isn't literally forever. MRI scans, surgery, some jobs, and some life events require the chain to come off. The chain is designed to be **cut at any point with standard jewellery cutters** — the snip is clean, no damage to the rest of the piece.",
            "We keep a **free re-weld** on file for every client for the life of the piece — cut it off for an MRI, come back to the workshop, and we weld it closed again at no extra charge. If the chain itself is damaged rather than cleanly cut, we replace the chain at cost and keep any engraved pendant from the original. That promise is why most clients are comfortable making the commitment in the first place.",
          ],
          side: {
            kind: 'quote',
            text: "Had to cut it off for surgery. Walked back in two weeks later, they welded it back on free, same chain. Still the piece I wear.",
            attr: 'Client, forever necklace since 2023',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Does the welding hurt or feel hot on the neck?',
        answer:
          'No. The micro-argon weld is a pinpoint arc less than 1mm across, contained by a carbon shield that sits between the chain and your skin. You feel a very faint warmth at the shield (room-temperature heat, nothing that registers as hot) for about two seconds. Most clients tell us they didn\'t realise it was done.',
      },
      {
        question: 'How do I book an appointment?',
        answer:
          'Walk in during workshop hours at Paya Lebar Square (10am–7pm, Mon–Sat) or book ahead through our WhatsApp or IG DM. For weekend slots or couple fittings, booking 1–2 weeks ahead is strongly recommended — weekends fill up fast, especially Feb and Dec.',
      },
      {
        question: 'Can I add a pendant or charm to a forever necklace?',
        answer:
          'Yes. The chain is welded shut but the pendant sits on a floating jump-ring that we solder on before the neck fitting. Initial letters, small heart charms, and engraved discs are our most common pendant additions. Bring or order the pendant in advance so we can weld-ready it before your appointment.',
      },
      {
        question: 'What happens at airport security — will it set off metal detectors?',
        answer:
          'A thin steel or gold chain rarely triggers airport scanners — it is below the threshold for most walk-through detectors. If it does trigger, it is identifiable as jewellery on inspection and clears with no issues. We have clients who fly weekly with no problem across SG, SEA, and Europe airports.',
      },
      {
        question: 'Can I get the necklace cut off at home in an emergency?',
        answer:
          'Yes — any standard pair of jewellery or wire cutters will snip the chain cleanly in one pass. No special tool needed, no risk to skin. The cut edge is a flat clean end, no sharp fragments. Bring the cut chain back to us and we re-weld it closed free of charge.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 7. full-color-embroidery-jacket (embroidery)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'full-color-embroidery-jacket',
    seo_body:
      'Full colour embroidery jackets Singapore — corporate bomber jackets, team varsity jackets, branded zip-ups, high-stitch logo embroidery, Pantone-matched thread. Chest, back and sleeve placement, 7–10 working days for volume orders.',
    seo_magazine: {
      issue_label: 'Issue №02 · Full Colour Embroidery Jacket',
      title: 'Everything worth knowing,',
      title_em: 'before it goes on a shoulder.',
      lede:
        "A branded jacket is the hardest garment to get right in embroidery. The fabric is heavier than a shirt, the back panel invites large-format logos, and clients routinely ask for a 40,000-stitch crest where a shirt would take 8,000. Four decisions keep the jacket from turning into a lumpy over-stitched mess — the stitch count vs fabric density, the placement, the jacket weight itself, and whether it survives real wear.",
      articles: [
        {
          num: '01',
          title: 'Stitch count vs fabric — the density math nobody explains.',
          body: [
            "A chest logo on a polo takes **5,000–8,000 stitches**. The same logo on a bomber jacket back panel gets blown up to **35,000–50,000 stitches** because clients want impact at arm's-length visibility. That volume of thread on a soft fabric **distorts the weave** — the embroidered area contracts, the jacket puckers around it, and the logo looks like a sewn-on patch rather than part of the garment.",
            "The fix is **woven fusible backing** — a stabiliser layer that we iron onto the back of the embroidery zone before stitching, which holds the fabric flat during the 45-minute stitch run. On heavy bomber and varsity jackets we also step down stitch density by 15% to prevent thread build-up, and the logo reads as embedded rather than raised.",
          ],
          side: {
            kind: 'stat',
            label: 'Back crest',
            num: '45k',
            caption: 'average stitches on a full-back logo',
          },
        },
        {
          num: '02',
          title: 'Chest, sleeve, or back — placement changes the brand message.',
          body: [
            "**Left chest** is the quiet corporate default — logo visible in meetings, reads as uniform not merch. **Full back** is loud — reads as team, event, or sports team, and is the placement clients use for retreats and staff-launch drops. **Sleeve placement** (upper arm or forearm) is the modern sportswear choice — visible in motion, less visible at a desk.",
            "The combination most corporate clients settle on: **small left-chest logo + larger back panel** — formal enough for client visits, bold enough for team photos. For merch drops and event-specific jackets, the full back alone is cleaner. For premium quiet branding (think law firm away-day jackets), left chest only is the correct answer.",
          ],
          side: {
            kind: 'list',
            label: 'Placement by intent',
            rows: [
              { text: 'Left chest', time: 'Corporate' },
              { text: 'Full back', time: 'Event / team' },
              { text: 'Sleeve', time: 'Sportswear' },
              { text: 'Chest + back', time: 'All-purpose' },
            ],
          },
        },
        {
          num: '03',
          title: 'The jacket weight decides how much logo the garment can carry.',
          body: [
            "**Lightweight coach jackets** (nylon, 100gsm, water-resistant) can't take a 40k-stitch back logo without severe puckering, even with backing — we cap chest-only embroidery on these. **Bomber jackets** (poly-cotton, 320gsm, MA-1 cut) handle anything up to a 35k back crest comfortably. **Varsity and wool-melton jackets** (450gsm+) can take a full-size chenille-patched logo plus back embroidery in the same piece.",
            "Tell us the jacket style at quote stage. We stock **cotton twill bombers** and **fleece-lined zip-ups** as our volume default, because they balance embroidery capacity with SG-weather wearability. Heavyweight varsity and wool jackets are available as special-order but ship slower.",
          ],
          side: {
            kind: 'pills',
            label: 'Jacket types',
            items: [
              { text: 'Coach jacket' },
              { text: 'Cotton bomber', pop: true },
              { text: 'Fleece zip-up' },
              { text: 'Varsity wool' },
            ],
          },
        },
        {
          num: '04',
          title: 'Wash durability — what the back panel actually survives.',
          body: [
            "A full-colour embroidered jacket back is the hardest embroidery to test because clients rarely wash the jacket at 60°C. Most home washes run **30–40°C cold cycles**, which our Madeira polyester thread survives effortlessly — rated to **500+ wash cycles with no visible fade**, which is ten years of normal jacket use.",
            "The thread outlasts the jacket itself in most cases. What does fail is a cotton thread on a polyester-shell jacket (the poly shell shrinks at different rates to the cotton thread during washing, eventually cracking the stitch) — which is why we use polyester thread as default on all synthetic-shell jackets. Tell us the jacket material and we match thread spec accordingly.",
          ],
          side: {
            kind: 'quote',
            text: "Ran 30 branded bombers for our company's 10-year anniversary. Half the team still wears them to the gym. Logos look untouched.",
            attr: 'HR Lead, SG tech firm',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'What is the maximum embroidery size on a jacket back?',
        answer:
          'Our default hoop frame handles up to 300mm × 300mm — enough for a full-back logo on most bomber sizes. Beyond that we use a sectional hoop that stitches in two passes with perfect alignment, capable of 400mm × 400mm. Anything larger and we recommend a combination of embroidery and screen-print or patches.',
      },
      {
        question: 'How many colours can full-colour embroidery actually handle?',
        answer:
          'Up to 15 thread colours in a single logo run, using Madeira\'s 400-colour Polyneon range. Beyond 10 colours the digitising gets complex and we quote higher — not because the machine can\'t handle it, but because each colour change is a thread swap. For logos with 20+ colours, we suggest simplifying to the 10 most critical.',
      },
      {
        question: 'Can you match my exact brand Pantone on the embroidery?',
        answer:
          'Madeira Polyneon has a published Pantone cross-reference — we match Pantone Solid Coated codes to the nearest thread shade, and for 90% of brand colours the match is spot-on. For in-between shades we sample two options and you pick. Send us your brand guide (including Pantone codes) at quote stage.',
      },
      {
        question: 'What is the turnaround time for a volume jacket order?',
        answer:
          'For 20–50 jackets with a single logo placement, plan for 7–10 working days from artwork approval. Complex multi-placement (chest + back + sleeve) orders add 2 days. Jackets themselves (the blank garment) can add 1–2 weeks if we\'re sourcing a non-stock style. Tell us the deadline and we\'ll commit only to what we can hit.',
      },
      {
        question: 'Can I order just one jacket for a gift?',
        answer:
          'Yes. Single-piece orders ship at single-piece pricing — setup cost is similar for one or twenty, which is why we recommend bundling a jacket gift with other embroidery items (a cap, a polo) to amortise the digitising. For a solo anniversary or birthday gift jacket, we digitise once and ship within 5 working days.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 8. full-color-embroidery-long-sleeve (embroidery)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'full-color-embroidery-long-sleeve',
    seo_body:
      'Full colour embroidery long sleeve Singapore — corporate long-sleeve uniforms, staff shirts, embroidered cuffs, sleeve logos, brand polo long-sleeve. Cotton and cotton-poly blends, 12 mm hoop arm embroidery, 5–7 working days.',
    seo_magazine: {
      issue_label: 'Issue №02 · Full Colour Embroidery Long Sleeve',
      title: 'Everything worth knowing,',
      title_em: 'before the sleeve goes on the line.',
      lede:
        "A long-sleeve uniform has placement options a short-sleeve doesn't — bicep, cuff, forearm — and each one signals something different about the brand. Four decisions make the difference between a long-sleeve that looks like a uniform and one that looks like a gift-shop buy. Arm placement, fabric stretch tolerance, thread brightness under indoor lights, and what 'corporate uniform' really means in SG.",
      articles: [
        {
          num: '01',
          title: 'Bicep, cuff, or forearm — the placement decides the read.',
          body: [
            "**Left chest + right bicep** is the uniform standard — logo on the chest for face-to-face, brand text on the bicep for side-profile visibility across a service counter. **Cuff-button embroidery** (small monogram or year on the outer cuff) reads premium and tailored — used on hospitality uniforms and law-firm dress shirts. **Full forearm logo** is bold merch, not uniform — it belongs on event-staff or activewear, not front-of-house.",
            "For Singapore's service sector (banks, hotels, airlines), the default is chest + cuff, because the chest reads in meetings and the cuff reads when the wearer gestures or reaches across a desk. Test it on yourself — look in the mirror with a long-sleeve on and see where your eye actually lands. That's where the brand should sit.",
          ],
          side: {
            kind: 'list',
            label: 'Placement by sector',
            rows: [
              { text: 'Banking / finance', time: 'Chest + cuff' },
              { text: 'Hospitality', time: 'Chest + bicep' },
              { text: 'Retail / F&B', time: 'Chest only' },
              { text: 'Events / activewear', time: 'Forearm / back' },
            ],
          },
        },
        {
          num: '02',
          title: 'Fabric stretch tolerance — where embroidery goes wrong on a sleeve.',
          body: [
            "Embroidering on a sleeve is harder than the chest because the fabric is **curved and under tension** during wear — flex your arm and the bicep area stretches 8–12%. Cheap embroidery on a cuff or bicep **distorts the moment the wearer moves**, because the stitch was set on flat fabric that no longer exists once the sleeve is on an arm.",
            "Our sleeve embroidery runs **reduced-density stitch settings** (15% less than chest) with **water-soluble topping** that holds the fabric flat during stitching, then dissolves. The result is a sleeve logo that reads clean whether the arm is extended, bent, or at rest. For highly stretchy poly-elastane blends (gym long-sleeves), we use a dedicated stretch-compatible thread.",
          ],
          side: {
            kind: 'stat',
            label: 'Stretch tolerance',
            num: '12',
            suffix: '%',
            caption: 'fabric flex we design stitch density around',
          },
        },
        {
          num: '03',
          title: 'Thread glow under indoor lights — the colour question nobody tests.',
          body: [
            "A polyester thread that looks vibrant under daylight can look **washed out under fluorescent office tubes** — a known gotcha for corporate uniforms that are only ever worn indoors. Madeira Polyneon includes a **high-sheen luminosity spec** that stays visibly saturated under 4000K office lighting, which is the SG corporate default.",
            "We flag this at quote stage if your brand uses a mid-tone (forest green, burgundy, mustard) that's known to flatten under fluorescent light. In practice, we pull a sample thread swatch from the Madeira book and walk it to an overhead light source before committing. It takes an extra 10 minutes and saves a re-run.",
          ],
          side: {
            kind: 'pills',
            label: 'Office-safe shades',
            items: [
              { text: 'Deep navy', pop: true },
              { text: 'Charcoal' },
              { text: 'White' },
              { text: 'Burgundy' },
              { text: 'Forest green' },
            ],
          },
        },
        {
          num: '04',
          title: 'Singapore corporate uniform standards — what the HR team actually expects.',
          body: [
            "SG corporate procurement has a standard unwritten spec for long-sleeve uniforms: **cotton-poly blend (60/40 or 65/35)** for breathability in humidity, **easy-iron finish** so staff don't need a press before every shift, and **long-sleeve must stay tucked** through a full day of movement. Our default long-sleeve blank meets all three, and we stock it in fitted and regular cuts.",
            "For sectors with stricter dress codes (airlines, banks), we can source **100% cotton Egyptian-weave** with an easy-iron treatment — softer, cooler, more expensive by about 40% per piece. Tell us the sector and the budget ceiling, and we recommend the right tier without upselling to the most expensive option by default.",
          ],
          side: {
            kind: 'quote',
            text: "Ordered 60 long-sleeves for our frontline team. Thread tone survived six months of fluorescent lighting and hot washes. HR hasn't re-ordered — which for us means it worked.",
            attr: 'Procurement Lead, SG bank',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Can embroidery on a cuff survive repeated ironing?',
        answer:
          'Yes. Madeira Polyneon tolerates direct iron contact up to 200°C — which is higher than any domestic iron setting. The stitch stays locked and the thread sheen doesn\'t flatten. We recommend ironing on the reverse side of the cuff to be extra careful, but direct-side ironing has not caused any issues on our client base.',
      },
      {
        question: 'Do you offer fitted vs regular-cut long-sleeves for uniforms?',
        answer:
          'Yes — our default stock is available in regular and slim/fitted cuts across M, L, XL, XXL. For female-cut long-sleeves we offer a separate block with a defined waist and narrower shoulder. Tell us the sizing mix at order stage and we suggest a size-spec sheet based on your team\'s average build.',
      },
      {
        question: 'Can you embroider on a long-sleeve I already own?',
        answer:
          'Yes, but the shirt must be washed clean and we inspect the fabric first — some stretch blends are unsuitable for embroidery and we flag those before committing. Drop-off embroidery on client-supplied shirts is a 5-working-day turnaround and we charge by piece rather than as a bulk rate.',
      },
      {
        question: 'What is the minimum order for long-sleeve embroidery?',
        answer:
          'Single pieces welcome for personal and gift orders. For corporate uniforms, 10 is where per-piece pricing starts to step down; 30 unlocks the volume bracket; 100+ gets a dedicated project manager. Digitising is a one-time cost that we waive on orders above 20 pieces.',
      },
      {
        question: 'How do I get a physical sample before committing to a volume order?',
        answer:
          'We run **paid sample pieces** — one long-sleeve with your embroidery in the final spec, full thread colour match, so you can see and feel the result before committing to 60 pieces. The sample cost credits back against the volume order when it goes through. Turnaround on a sample is 3 working days.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 9. full-color-embroidery-shirt (embroidery)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'full-color-embroidery-shirt',
    seo_body:
      'Full colour embroidery shirts Singapore — corporate polo embroidery, branded tee shirts, Pantone-matched logos, left chest standard, bulk staff uniforms. Cotton and cotton-poly pique polos, 15-colour thread capability, 5–7 working days.',
    seo_magazine: {
      issue_label: 'Issue №02 · Full Colour Embroidery Shirt',
      title: 'Everything worth knowing,',
      title_em: 'before the chest goes on the wrong side.',
      lede:
        "The embroidered shirt is the most-ordered corporate garment in Singapore — every company has a batch in a cupboard somewhere. Four decisions separate the shirts people actually wear outside work from the ones that end up in the gym-bag pile. Left-chest placement math, Pantone matching to brand spec, polo vs tee fabric difference, and how bulk timing plays out in reality.",
      articles: [
        {
          num: '01',
          title: 'Why the left-chest placement is 8cm from the seam.',
          body: [
            "Corporate embroidery on a polo chest has a specific placement — **8cm down from the shoulder seam, 9cm in from the centre**, on the wearer's left. That's not arbitrary. It puts the logo in the natural eyeline during a handshake, clear of the collar on most body types, and high enough that a pocket badge or name plate can sit below it without clashing.",
            "Drift by 2cm in any direction and the logo reads wrong — too low looks slumped, too high catches the collar, too far in looks misaligned. We use a **magnetic placement jig** that locks to the polo shoulder seam, so every shirt in a 200-piece run has the logo in exactly the same spot. No drift, no 'oh that one looks different'.",
          ],
          side: {
            kind: 'stat',
            label: 'Chest placement',
            num: '8',
            suffix: 'cm',
            caption: 'from shoulder seam, consistent across every shirt',
          },
        },
        {
          num: '02',
          title: 'Pantone matching — where brand managers quietly check.',
          body: [
            "A procurement team will shake hands on the quote and then quietly compare the embroidered Pantone against their brand deck a week later. If the **red is off**, if the navy drifts purple, if the brand green lands teal — the order gets flagged and the shirts come back. We run a **Pantone-swatch sample** on every first-time brand order, showing you the exact thread shade against your brand guide before any shirt is committed.",
            "Madeira Polyneon covers **400+ colours** with a published Pantone cross-reference. For exact-match Pantones we thread-blend when needed — loading two adjacent Madeira shades into adjacent needle positions for a 50/50 mix. It's more work; it's the difference between 'close enough' and 'matches the deck'.",
          ],
          side: {
            kind: 'list',
            label: 'Brand-check workflow',
            rows: [
              { text: 'Digitise proof', time: 'Day 1' },
              { text: 'Thread swatch', time: 'Day 2' },
              { text: 'Sample piece', time: 'Day 3' },
              { text: 'Full run', time: 'Day 5–7' },
            ],
          },
        },
        {
          num: '03',
          title: 'Polo vs tee — two different fabric problems.',
          body: [
            "A **pique polo** is dense, structured, and takes embroidery cleanly — the knitted weave holds the stitch flat without puckering. A **cotton tee** (especially single-jersey, 160gsm) is soft and flexible, and embroidery on a tee can sag or pull if the digitising doesn't account for the stretchy base. We set a **lower stitch density** on tee embroidery and use a **cutaway stabiliser** that stays in the garment rather than dissolving.",
            "For corporate orders we default-recommend polo because it survives the office day better — fewer wrinkles, more structured, handles air-con office-to-field transitions. For brand merch drops and casual event shirts, a quality **220gsm combed cotton tee** is the right pick. Tell us the end use and we recommend the right base.",
          ],
          side: {
            kind: 'pills',
            label: 'Shirt base',
            items: [
              { text: 'Pique polo', pop: true },
              { text: 'Interlock polo' },
              { text: 'Cotton tee 180gsm' },
              { text: 'Cotton tee 220gsm' },
              { text: 'Tri-blend tee' },
            ],
          },
        },
        {
          num: '04',
          title: 'Bulk timing — what a 100-shirt order really takes.',
          body: [
            "A **single-colour chest logo** on 100 polos takes about **8 working hours** on our machine — roughly 5 minutes per shirt at 8,000 stitches. That translates to a realistic **5–7 working day turnaround** once artwork is locked, with digitising done on day 1 and stitching on days 3–5. We hold days 6–7 for QC and packing.",
            "Pushing faster is possible — we can compress to 3 working days for urgent orders, but only on single-colour single-placement jobs. Anything with multi-placement (chest + sleeve + back) or 10+ thread colours needs the full window. **Tell us your event date at quote stage** — if we can't hit it we say so upfront, rather than promising and scrambling.",
          ],
          side: {
            kind: 'quote',
            text: "Need 80 polos in 7 days for a launch. They hit it, shirts matched our Pantone, logo placement was identical across all 80.",
            attr: 'Event Lead, SG fintech',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Do I need to provide a vector file or will a JPG work?',
        answer:
          'We strongly prefer vector (AI, SVG, EPS, PDF with live vectors) because embroidery digitising needs clean paths for stitch generation. A JPG or PNG can work for simple logos but small text and fine details will lose fidelity in the conversion. If you only have raster, we can redraw it to vector for a one-time fee.',
      },
      {
        question: 'Can you embroider on a shirt I provide?',
        answer:
          'Yes. Drop-off embroidery on client-supplied shirts is a 5-working-day turnaround. We inspect each shirt for fabric compatibility first — some blends (high-stretch athletic shirts) are unsuitable without backing. Minimum is 5 pieces for drop-off service; below that we price at single-piece rates.',
      },
      {
        question: 'What sizes do you stock for corporate polo orders?',
        answer:
          'Our default polo stock runs XS–4XL across both unisex and fitted cuts, with separate female-cut blocks available on request. For volume orders we provide a **size-fit sample pack** — one polo in each size, posted to you for try-on before final quantity is committed. This is free on orders above 50 pieces.',
      },
      {
        question: 'Will the embroidered logo shrink or distort after the first wash?',
        answer:
          'A well-digitised embroidered logo on a pre-shrunk polo stays intact through the first and every subsequent wash. We use pre-shrunk base stock as default so the 2–3% cotton shrinkage on first wash doesn\'t pull the logo out of shape. Our polyester thread has zero shrinkage, so it compresses evenly with the fabric.',
      },
      {
        question: 'Can I reorder next year and get identical logos?',
        answer:
          'Yes — we hold the **digitised stitch file and thread-code list** on your account for unlimited reorders. Year 2 reorders match year 1 exactly, same Pantone, same placement, same stitch density. There\'s no re-digitising fee on reorders; just tell us the quantity and we queue production.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 10. heart-charm-necklace (laser)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'heart-charm-necklace',
    seo_body:
      'Heart charm necklace engraving Singapore — personalised heart pendant, initial necklace, anniversary gift, birthday jewellery, bridesmaid gift. 316L steel and 18k gold-plated, 3–5 working days from Paya Lebar workshop.',
    seo_magazine: {
      issue_label: 'Issue №02 · Heart Charm Necklace',
      title: 'Everything worth knowing,',
      title_em: 'before it sits on a collarbone.',
      lede:
        "A heart charm necklace is the most-bought starter jewellery gift in SG — it works at 16, at 30, at 60, and for every occasion where a ring would say too much. Four details decide whether the piece reads as intentional or as a kiosk souvenir. The weight of the charm against the chain, how the chain itself pairs, the engraving space you actually have, and what to do when it layers with other pieces.",
      articles: [
        {
          num: '01',
          title: 'Charm-to-chain weight ratio — the detail nobody explains.',
          body: [
            "A heart pendant that's **too heavy for its chain** flips around during wear — the front face ends up pointing at the wearer's chin, not outward. A pendant that's **too light** swings around the neck and catches on hair. The ideal ratio: **charm weight under 1.5g for a 0.8mm chain, under 2.5g for a 1.2mm chain**. Our default heart charm sits at 1.8g on a 1.0mm chain, which holds its front-facing position through a full day of movement.",
            "The lobster clasp should sit **at the back of the neck**, not visible from the front — anything shorter than 40cm on a heart charm puts the clasp on the collarbone, which looks mis-sized. Our chains ship at 45cm and 50cm, both of which let the clasp fall properly behind the neck.",
          ],
          side: {
            kind: 'stat',
            label: 'Charm weight',
            num: '1.8',
            suffix: 'g',
            caption: 'balanced to 1.0mm chain — stays face-out',
          },
        },
        {
          num: '02',
          title: 'Chain pairing — the same charm, four different reads.',
          body: [
            "The same heart charm reads entirely differently depending on the chain style. **Cable chain** (round links, our default) reads classic and versatile — works with every outfit. **Box chain** reads architectural and modern — pairs with minimalist wardrobes. **Rope chain** reads dressy, evening-appropriate. **Herringbone flat chain** reads statement, editorial.",
            "Most first-time buyers default to cable, and it's the right call for a gift where you don't know the recipient's style precisely. For a second purchase or a same-person upgrade, the chain swap is where the piece gets more personal. We stock all four styles in matching gold and silver tone, so the same charm can be repaired with a new chain over years.",
          ],
          side: {
            kind: 'pills',
            label: 'Chain styles',
            items: [
              { text: 'Cable', pop: true },
              { text: 'Box' },
              { text: 'Rope' },
              { text: 'Herringbone' },
            ],
          },
        },
        {
          num: '03',
          title: 'Engraving space — the front has less than you think.',
          body: [
            "A heart charm at 20mm outside dimension has about **14mm of usable engraving surface** — the curved top half is too narrow for text, the pointed bottom drifts off-centre. Realistically you get **one line of 8–10 characters** in the centre band, or a small symbol (initial, tiny heart, single kanji character).",
            "The **back of the charm** has more space than the front because it's flat — you can fit two lines of text there, typically a date on top and a short word (name, anniversary, phrase) below. Common layouts: **front = initial, back = full name + date**. Or **front = name, back = date**. Tell us the layout in checkout notes and we proof both sides before cutting.",
          ],
          side: {
            kind: 'list',
            label: 'Engraving capacity',
            rows: [
              { text: 'Front centre', time: '8–10 char' },
              { text: 'Back, 2 lines', time: '20 char' },
              { text: 'Symbol + name', time: '1 icon + 6 char' },
              { text: 'Date only', time: 'DD.MM.YY' },
            ],
          },
        },
        {
          num: '04',
          title: "Layering with other charms — the quiet gift upgrade.",
          body: [
            "A heart charm often gets **layered with a second necklace** — a thin nameplate, a star, a birthstone. The pairing rule: **keep the lengths 5cm apart** so each piece sits at its own line, and **match the metal tone** across both pieces (gold with gold, silver with silver — mixed metals look uncoordinated on the chest).",
            "For bridesmaid and best-friend gifts, buyers often order **matching heart charms on different-length chains** — one at 40cm, one at 45cm, one at 50cm — so when worn together they layer naturally. We offer a **matched-set discount** on 3+ hearts ordered together for this reason. It's the most common repeat-order pattern we see.",
          ],
          side: {
            kind: 'quote',
            text: "Bought three matching hearts for my two best friends' weddings — we still wear them at brunches. You can't tell which one is mine.",
            attr: 'Buyer, triple matched set',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Can I engrave both sides of the heart?',
        answer:
          'Yes, both sides take engraving at the same depth. The most common layout is a single initial or short word on the front and a longer name plus date on the back. Add your layout in checkout notes and we will proof both sides before cutting. There is no extra charge for engraving both sides.',
      },
      {
        question: 'What if I want a different colour — rose gold or black?',
        answer:
          'Our standard hearts come in silver-tone (316L steel), classic gold (PVD-plated), and rose gold (PVD-plated). Black-finish hearts (IP-plated black steel) are available on request with a 2-day added lead time. All plating is PVD, not electroplate, so none of them chip or flake with normal wear.',
      },
      {
        question: 'Is the chain hypoallergenic?',
        answer:
          'Yes. Our default chain is 316L surgical stainless steel with under 0.05% nickel release — meets the EU nickel directive for hypoallergenic jewellery. For anyone with a confirmed metal allergy, tell us at checkout and we will upgrade to a gold-fill chain (solid 18k plating over steel core) for extra isolation. No extra charge.',
      },
      {
        question: 'How long is the chain?',
        answer:
          'Default chain length is 45cm with a 2cm extender loop — fits most SG necks with the charm falling at the collarbone. We also stock 40cm (short, sits closer to the throat), 50cm (longer, sits lower on the chest), and 55cm (for layering below a shorter piece). Specify in checkout.',
      },
      {
        question: 'Can I buy a matching set for two or three people?',
        answer:
          'Yes, and this is our most common gift pattern — bridesmaid trios, best-friend pairs, mother-and-daughter sets. Order 2+ hearts with matching engravings or paired lengths, add the details in checkout, and we match the production run so the pieces ship identical. 3+ matched hearts qualify for a small set discount.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 11. heartlink-metallic-keychain (laser)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'heartlink-metallic-keychain',
    seo_body:
      'HeartLink metallic keychain engraving Singapore — couple keychain set, matching friendship keychain, anniversary gift, long-distance relationship, his and hers. Two interlocking halves with hidden messages, 3–5 working days from Paya Lebar.',
    seo_magazine: {
      issue_label: 'Issue №02 · HeartLink Metallic Keychain',
      title: 'Everything worth knowing,',
      title_em: 'before the halves connect.',
      lede:
        "A paired keychain carries a quieter promise than a paired necklace — keys are handled every day, by hand, usually without anyone looking. Four things make the HeartLink work as a couple or friendship piece. The mechanism that links the two halves, why keychains outlast necklaces as couple gifts, the hidden two-sided engraving, and how the metal actually ages against a pocket full of coins.",
      articles: [
        {
          num: '01',
          title: 'The linked-hearts mechanism — not magnetic, why it matters.',
          body: [
            "Duo necklaces use magnets because the pieces rest on skin. Keychains can't — a magnet strong enough to hold through keys and coins would ruin credit cards in the same pocket. The HeartLink uses a **machined interlocking cut** — the two halves fit together like a micro-puzzle, held by the geometry of the cut rather than magnetism. Slide them together and they click into a single shape; pull them apart and they separate cleanly.",
            "The cut tolerance is **0.15mm** across the interlock — tight enough to hold the pieces together when joined, loose enough to separate without force. We laser-cut every pair from the same steel sheet to guarantee the halves mate exactly. Buying them separately from different batches won't work; the pairs are made as a pair.",
          ],
          side: {
            kind: 'stat',
            label: 'Cut tolerance',
            num: '0.15',
            suffix: 'mm',
            caption: 'halves mate cleanly, no play',
          },
        },
        {
          num: '02',
          title: 'Why a keychain outlasts a necklace as a couple gift.',
          body: [
            "A couple's necklace is worn openly; it announces the relationship and the wearer has to explain it to every new person. A paired keychain is private — it's in a pocket, on a bag, visible only to whoever is looking for it. That privacy makes it last through phases where a necklace gets taken off. Our returning buyers who bought both — necklace first, keychain later — almost all tell us the keychain got more continuous use.",
            "Keychains also survive wear that necklaces can't. A necklace off skin for a week is forgotten on a dresser. A keychain off the keys means you locked yourself out — it stays attached. The piece is **physically integrated into daily function**, which is the best guarantee a gift keeps getting seen.",
          ],
          side: {
            kind: 'quote',
            text: "Bought the necklaces first, the keychains a year later. The necklaces come off; the keychains haven't left our keys in three years.",
            attr: 'Buyer, second-purchase',
          },
        },
        {
          num: '03',
          title: 'Hidden messages — engraving both sides is the trick.',
          body: [
            "The HeartLink has two distinct engraving zones per half: the **outside face** (visible when the keychain is on the keys) and the **inside face** (only visible when the halves are joined together). The standard move is **name/initial outside, private message inside** — a short phrase, date, or inside joke that only the two halves together can read.",
            "We've stitched in messages like 'come home', 'for the road', 'half of me' — one phrase split across both halves, readable only when the two keychains meet again. For long-distance couples this becomes a ritual; when they reunite, the halves click together and the full message appears. More romantic than it sounds; our most-repeated pattern.",
          ],
          side: {
            kind: 'list',
            label: 'Engraving zones',
            rows: [
              { text: 'Outside front', time: 'Visible daily' },
              { text: 'Inside face', time: 'Hidden / joined' },
              { text: 'Back', time: 'Dates / bonus' },
              { text: 'Edge', time: 'Symbols only' },
            ],
          },
        },
        {
          num: '04',
          title: 'Wear test — what a year in a pocket actually does.',
          body: [
            "Keychains live a harder life than jewellery. They live in pockets full of coins, keys, lipsticks, phone edges, and MRT-card cases. Our steel is **316L grade** with a **PVD-plated finish** rated for 5+ years of keychain-level abrasion. We stress-tested a prototype set for 3 months in a pocket alongside 2 keys and a handful of coins — the plating held, the engraving stayed sharp, the interlock cut still mated cleanly.",
            "What does wear faster is the **split ring** (the actual keyring part). That's a replaceable steel part; bring the HeartLink back to our workshop if the ring opens up after years and we swap it free. The engraved half itself is built to outlive the ring hardware, which is how it should be.",
          ],
          side: {
            kind: 'pills',
            label: 'Finish options',
            items: [
              { text: 'Silver-tone', pop: true },
              { text: '18k Gold' },
              { text: 'Black IP' },
              { text: 'Rose Gold' },
            ],
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Can I buy just one half of the HeartLink?',
        answer:
          'The set ships as a pair because the two halves are cut from the same sheet and matched to each other at 0.15mm tolerance. Buying a single half from a different batch won\'t mate with an existing half. For lost-half replacement, contact us with the original order reference and we cut a new partner from the archived file.',
      },
      {
        question: 'Is the engraving on the hidden inside face guaranteed to stay sharp?',
        answer:
          'Yes — actually more so than the outside face, because the inside is protected from pocket abrasion when the halves are apart, and completely enclosed when they\'re joined. The laser engraving goes 0.2mm deep and the inside face sees zero wear. It\'ll outlast the outer surface.',
      },
      {
        question: 'What kind of messages work best for the hidden engraving?',
        answer:
          'Short phrases — 3 to 8 characters per half — work best. The rectangle inside face is about 30mm × 8mm of usable space. Common patterns: split a word or phrase across both halves ("come/home", "you/me", "half/full"), or engrave a private date. Longer phrases get cramped; simpler is better.',
      },
      {
        question: 'Will the interlock loosen over years of clicking together?',
        answer:
          'The interlock cut is sized for 5,000+ connect-disconnect cycles with no measurable loosening. For most users that\'s 10+ years of daily separate-and-reunite. If the halves do eventually become loose, we can tighten the cut by relasering the edge — bring it back to the workshop.',
      },
      {
        question: 'How big is the HeartLink keychain overall?',
        answer:
          'Each half is 40mm × 40mm, joined the pair reads as a single 40mm heart roughly 5mm thick. Compact enough to sit comfortably on a keyring with 3–5 keys, substantial enough not to get lost at the bottom of a bag. The split ring adds about 20mm of additional length.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 12. inspirational-keyring (laser)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'inspirational-keyring',
    seo_body:
      'Inspirational keyring engraving Singapore — motivational quote keychain, mantra keyring, graduation gift, self-gift, encouragement gift. Stainless steel with deep laser engraving, 3–5 working days from Paya Lebar workshop.',
    seo_magazine: {
      issue_label: 'Issue №02 · Inspirational Keyring',
      title: 'Everything worth knowing,',
      title_em: 'before the words go on.',
      lede:
        "A mantra on a keyring is a daily reminder that survives in a pocket when an app notification is ignored. Four things decide whether the piece ends up on the real keys or in a drawer. The font you pick for the words, the steel that carries them, the packaging that makes it gift-ready, and the question of whether it's for yourself or for someone else. Here's how each one changes the piece.",
      articles: [
        {
          num: '01',
          title: 'Font selection — mantras fail when the typography is wrong.',
          body: [
            "'Breathe' in Comic Sans doesn't land. The same word in **Garamond italic** suddenly reads like something to come back to. Typography for mantras is the whole game, and most online engraving services give you three sans-serif options and call it a day. We stock **12 font options** specifically curated for short-phrase engraving — including a handwritten script, a serif italic, a modern sans, and a monospace for 'set it in stone' phrases.",
            "Match the font to the phrase. **Soft phrases** (breathe, peace, grace, she believed) — script or serif italic. **Imperative phrases** (do the work, keep going, not today) — bold sans-serif or monospace. **Ambiguous phrases** (stay, begin, remember) — serif italic splits the difference. We preview the font choice before cutting so you can change your mind without wasting steel.",
          ],
          side: {
            kind: 'pills',
            label: 'Font families',
            items: [
              { text: 'Script', pop: true },
              { text: 'Serif italic' },
              { text: 'Modern sans' },
              { text: 'Monospace' },
              { text: 'Bold sans' },
            ],
          },
        },
        {
          num: '02',
          title: 'Stainless steel durability — why the material outlasts the phrase.',
          body: [
            "Keyrings live a hard life — keys bang against them, coins rub them, they get dropped on pavements. Our inspirational keyring is **316L surgical stainless steel** with a **0.3mm laser engraving depth** — deep enough that the phrase survives years of abrasion, because wear actually **deepens the contrast** on engraved steel rather than erasing it.",
            "Plated brass and aluminium keyrings are common in the mall-kiosk market — they're cheap, they look fine in the first month, and the plating rubs through within the year. 316L steel has no plating to wear off; the colour you see on day one is the colour you see ten years in. It's genuinely the last keyring most buyers need to own.",
          ],
          side: {
            kind: 'stat',
            label: 'Engrave depth',
            num: '0.3',
            suffix: 'mm',
            caption: 'survives pocket abrasion for a decade+',
          },
        },
        {
          num: '03',
          title: 'Gift packaging — why the box matters more than the piece.',
          body: [
            "An inspirational keyring gifted in a ziploc bag lands as a trinket. The same keyring presented in a **linen-lined kraft box** with a printed card lands as a considered gift. We include the box by default on every keyring order — it's not an upgrade, it's the standard, because a keyring is a small object that needs the weight of presentation to read as a real gift.",
            "For bulk gift orders (team appreciation, graduation classes, wedding favours), we offer **custom-printed gift card inserts** — your own handwritten note printed onto a card that sits inside the box. Adds 1 day to the turnaround and lands the whole piece as intentional and personal. Cheaper than any bouquet and lasts years longer.",
          ],
          side: {
            kind: 'list',
            label: 'Packaging tiers',
            rows: [
              { text: 'Standard box', time: 'Included' },
              { text: 'Custom card insert', time: '+1 day' },
              { text: 'Ribbon wrap', time: 'Gift-ready' },
              { text: 'Bulk gift kit', time: '10+ orders' },
            ],
          },
        },
        {
          num: '04',
          title: 'Self-gift vs gift for someone else — the word choice differs.',
          body: [
            "**Self-purchase mantras** tend to be imperative and private — 'trust', 'keep going', 'i am enough' — words the buyer is telling themselves. **Gift mantras** tend to be warmer and outward-facing — 'I'm proud of you', 'you've got this', 'always be you' — words the giver wants the recipient to hear. Mixing the registers lands wrong.",
            "If you're buying for yourself, go short and imperative. If you're buying for someone else, go longer and warmer, and feel free to put the phrase in quotes or add a sign-off ('love mum', '— j', 'from us'). Both register as intentional because they're framed as a conversation rather than a slogan. Our most-engraved phrase on gift orders: 'proud of you'. On self-purchase: 'begin'.",
          ],
          side: {
            kind: 'quote',
            text: "Bought one for myself that just says 'begin'. Five years in, it's the first thing I see reaching for the door every morning.",
            attr: 'Buyer, self-purchase',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'How long can the phrase actually be?',
        answer:
          'The keyring face is 40mm × 40mm with about 30mm × 30mm of safe engraving area. For a single line in readable sans-serif, 12–15 characters. For a two-line phrase, up to 24 characters. For a longer phrase (25–40 characters), we split across both sides with the start on the front and the continuation on the back. We preview before cutting.',
      },
      {
        question: 'Can I engrave a phrase in a non-Latin script — Chinese, Tamil, Japanese?',
        answer:
          'Yes — our laser handles any Unicode character set, including Chinese (simplified and traditional), Tamil, Japanese kana and kanji, Korean hangul, and Arabic. Upload the phrase in a text field at checkout, and specify the script if the system doesn\'t auto-detect. We proof the glyphs before cutting to catch any font substitution issues.',
      },
      {
        question: 'Does the engraving fade over time?',
        answer:
          'No. Laser engraving on 316L steel physically removes material — the phrase is a set of micro-grooves in the metal, not ink or paint. Abrasion from keys and pockets actually darkens the engraved area over years, which improves legibility rather than erasing it. A 5-year-old engrave reads crisper than a new one.',
      },
      {
        question: 'Is the keyring heavy on a set of keys?',
        answer:
          'Each keyring weighs about 15g — noticeable in the hand but not heavy once it\'s on a real key set. It\'s the same weight as a standard car remote or a large key. If weight matters (minimalist key setup, bag attachment rather than keyring), we can substitute a lighter aluminium base for 20% less weight and mention that option at checkout.',
      },
      {
        question: 'Can I order matching keyrings for a team or class?',
        answer:
          'Yes, and it\'s a common graduation and team-appreciation order. 10+ matching keyrings with a shared phrase qualify for volume pricing. Each can have an additional personalised initial or name on the back, at no extra engraving charge — we batch the cutting so the per-piece cost stays low.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 13. leather-snap-keychain (laser)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'leather-snap-keychain',
    seo_body:
      'Leather snap keychain engraving Singapore — full-grain leather keyring, debossed initials, personalised leather gift, key fob, luggage leather tag. Italian vegetable-tanned leather, laser-debossed engraving, 5–7 working days from Paya Lebar.',
    seo_magazine: {
      issue_label: 'Issue №02 · Leather Snap Keychain',
      title: 'Everything worth knowing,',
      title_em: 'before it patinas.',
      lede:
        "Leather is the only material that looks better at year five than at year one — if you start with the right grade. Four things separate a leather keychain that ages into something beautiful from one that cracks within six months. The leather grade itself, the snap closure's real durability, how laser engraving sits on leather vs metal, and how the colour actually fades in SG humidity. Here's how each one plays out.",
      articles: [
        {
          num: '01',
          title: 'Full-grain vs top-grain vs corrected — the grade that decides everything.',
          body: [
            "**Full-grain leather** is the top layer of the hide with all its natural markings and grain intact — it's the strongest layer, develops the best patina, and is what real leather goods use. **Top-grain** is the same layer sanded down and coated with a smooth finish — more uniform, less character, shorter lifespan. **Corrected grain** (also called 'genuine leather') is the leftover split coated with plastic film — cheap, plastic-feel, cracks within 18 months.",
            "Our keychain uses **Italian vegetable-tanned full-grain** — the gold standard for leather goods. Vegetable-tanning uses tree-bark tannins rather than chromium salts, which means the leather develops a **deeper patina over years** and is safer against skin (no hexavalent chromium exposure). It costs more, it ships slower, and it's the difference between a keychain that gets more beautiful and one that peels.",
          ],
          side: {
            kind: 'pills',
            label: 'Leather grades',
            items: [
              { text: 'Full-grain', pop: true },
              { text: 'Top-grain' },
              { text: 'Corrected' },
              { text: 'Bonded (avoid)' },
            ],
          },
        },
        {
          num: '02',
          title: 'Snap closure durability — the detail that usually fails first.',
          body: [
            "Most leather keychain failures aren't the leather — they're the snap. A cheap **stamped-sheet snap** fatigues within 300–500 open-close cycles; a quality **solid-brass snap with spring-loaded pin** handles 10,000+ cycles with no measurable wear. We fit every keychain with **YKK-grade solid brass snaps** — the same brass-snap standard used in mid-tier leather goods.",
            "The snap placement matters too. We set the snap **8mm from the edge** of the leather strap, not flush with the edge — because an edge-mounted snap pulls the leather apart at the seam within a year. The 8mm buffer spreads the stress across the leather fibres rather than concentrating it at the rivet point. Small detail, decides whether the keychain lasts two years or ten.",
          ],
          side: {
            kind: 'stat',
            label: 'Snap cycles',
            num: '10k+',
            caption: 'brass-pin snap, no fatigue',
          },
        },
        {
          num: '03',
          title: 'Laser engraving on leather — why it\'s different from steel.',
          body: [
            "Laser on metal removes material. Laser on leather **burns the top grain**, producing a debossed mark with a rich dark-brown contrast against the undyed leather. The depth is **0.1–0.15mm** — just enough to read clearly, shallow enough not to weaken the leather. Cut too deep and the leather crimps; cut too shallow and the mark is invisible after the first polish.",
            "We calibrate laser power per leather batch, because vegetable-tanned leather has natural variation in tannin density — the same power on a different hide produces different contrast. A sample cut on the offcut of your hide confirms the right depth before the real engraving. No other engraving method on leather produces the same clean, permanent result — hot-foil stamps fade, ink-prints rub off.",
          ],
          side: {
            kind: 'list',
            label: 'Engraving techniques',
            rows: [
              { text: 'Laser deboss', time: 'Permanent' },
              { text: 'Hot foil', time: 'Fades 2y' },
              { text: 'Ink print', time: 'Rubs off' },
              { text: 'Blind emboss', time: 'Low contrast' },
            ],
          },
        },
        {
          num: '04',
          title: 'Colour over years — how the leather actually ages in SG humidity.',
          body: [
            "Vegetable-tanned leather **darkens with UV and handling** — a tan keychain at year one is a warm honey-brown at year three and a deep cognac at year five. The colour shift is the patina, and it's the whole appeal. Chrome-tanned and dyed leathers don't patina — they just get dirty, then fade.",
            "SG humidity **accelerates patina** compared to dry climates — the leather takes up moisture from the air, which feeds the tanning process and produces a faster, richer colour shift. The tradeoff: humidity also produces **mould if the leather isn't conditioned**. We ship every keychain with a small leather-care instruction card — condition once every 6 months with any neutral leather balm, and it lasts indefinitely.",
          ],
          side: {
            kind: 'quote',
            text: "Started tan, now it's the colour of dark whisky. Five years old, used every day. Gets better every time I pick it up.",
            attr: 'Buyer, leather keychain since 2020',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'What colours does the leather come in?',
        answer:
          'Our standard colours are natural (undyed, patinas the most), tan (mid-brown, reliable warm tone), dark brown (chocolate, patinas to black-brown), and black (saddle-dyed, patinas very slowly). Natural and tan show the richest patina over years. Dark brown and black are lower-maintenance and hide everyday handling marks.',
      },
      {
        question: 'How does leather handle SG rain and humidity?',
        answer:
          'Short rain exposure is fine — wipe it dry with a cloth and let it air-dry at room temperature. Prolonged soaking should be avoided because water darkens vegetable-tanned leather unevenly and can leave marks. Condition with a neutral leather balm once every six months to keep the leather supple and protected; humidity otherwise accelerates the patina beautifully.',
      },
      {
        question: 'Can I engrave on both sides of the leather?',
        answer:
          'Yes. The front (grain side) is the standard engraving face and produces the cleanest, darkest contrast. The back (flesh side) takes engraving too but the result is softer and less defined because the fibres are less dense. Most buyers put a name or monogram on the front and a date on the back. Specify both in checkout.',
      },
      {
        question: 'How big is the leather strap?',
        answer:
          'The strap is 70mm × 20mm with the brass snap at one end and the keyring loop at the other. Engraving area is roughly 50mm × 15mm — enough for a name of 8–10 characters in clean sans-serif, or an initial and date across two lines. Larger custom sizes (for bag tags or oversized fobs) are available on request with a longer lead time.',
      },
      {
        question: 'Is it okay to attach this to a car key with a metal fob?',
        answer:
          'Yes — the leather sits between the keyring and the fob, absorbing the click of the metal against metal and softening the key set in your pocket. The brass snap handles the weight of 4–5 keys plus a car fob without stress. For heavier sets (keys plus multiple fobs and a luggage tag), we recommend a double-stitched strap upgrade.',
      },
    ],
  },
];
