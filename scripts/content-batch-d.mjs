// Batch D — product-specific content for 9 products.
// round-neck-shirts, rubber-stamp, stickers, table-tent, tote-bag,
// transparent-card, uv-dtf-sticker, wobbler, x-stand-banner.
//
// Every product has its own matcher, seo_body, seo_magazine, and
// how_we_print. Voice: lowercase-ish, blunt, SG-specific, anchored to
// real configurator options. No pricing in seo_body, no "Printvolution"
// brand name, no car-decal or name-card residue.

export const BATCH = [
  // ─────────────────────────────────────────────────────────────
  // 1. ROUND NECK SHIRTS
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'round-neck-shirts',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'DTF on every fabric in stock.',
      right_note_body: 'Full-colour, no silkscreen setup fees, soft hand-feel.',
      rows: [
        {
          need: 'Your team needs shirts that *survive wash 50*',
          pick_title: '100% Cotton, DTF Print, Navy',
          pick_detail: 'From S$16/pc · 7–10 day production · ink bonded into fibre, no crack',
        },
        {
          need: "You're running a *sports event* — shirts get sweaty",
          pick_title: 'Dri-fit Polyester, DTF Print, Royal Blue',
          pick_detail: 'From S$18/pc · moisture-wicking · breathable for outdoor runs',
        },
        {
          need: 'Corporate roadshow — *everyone in matching black*',
          pick_title: 'Poly-cotton Blend, DTF Print, Black',
          pick_detail: 'From S$16/pc · holds shape after repeated wear · smart look for booth staff',
        },
        {
          need: 'You want *photo-quality artwork* on the front',
          pick_title: '100% Cotton, DTF Print, White',
          pick_detail: 'From S$16/pc · gradients, skin tones, tiny type — all sharp',
        },
        {
          need: 'CNY / D&D / company milestone — *one-off batch*',
          pick_title: '100% Cotton, DTF Print, Red',
          pick_detail: 'From S$16/pc · no minimum silkscreen setup · mix sizes in one run',
        },
      ],
    },
    seo_body: `Custom round neck t-shirts printed in Singapore on cotton, poly-cotton and dri-fit polyester — DTF printed so every shirt comes out full-colour, soft-hand, and wash-durable without silkscreen setup fees.

Pick from white, black, navy, grey, red, royal or custom colour, mix sizes in one run, and skip the minimum order pain of screen printing. Built for team events, roadshows, D&Ds, sports meets and CNY batch gifting.`,
    seo_magazine: {
      issue_label: 'Issue №01 · Round Neck Tees',
      title: 'The shirt choices that actually',
      title_em: 'matter.',
      lede:
        "Most tee jobs in Singapore get picked on price alone, and the client ends up with a shirt nobody wears twice. Four decisions separate a shirt that lives in the wardrobe from one that becomes a rag — the fabric, the print method, the neck construction, and how it handles wash cycle fifty.",
      articles: [
        {
          num: '01',
          title: 'Fabric weight is why one shirt lives and one dies.',
          body: [
            "A **100% cotton** round neck breathes, holds shape, and ages well — but weight matters. Under 160gsm feels like a pyjama top by wash ten. We build on **180gsm body stock** so the shirt has enough structure to look smart on booth staff but doesn't feel like a beach towel in SG heat.",
            "For sports and roadshow crews outdoors all day, **dri-fit polyester** is the right call — moisture-wicking beats breathability when you're sweating through a Saturday event at Marina Bay. **Poly-cotton blend** sits in between: less shrink than pure cotton, more comfort than pure poly.",
          ],
          side: {
            kind: 'pills',
            label: 'Fabric',
            items: [
              { text: '100% Cotton', pop: true },
              { text: 'Poly-cotton Blend' },
              { text: 'Dri-fit Polyester' },
            ],
          },
        },
        {
          num: '02',
          title: 'Why we print DTF, not silkscreen, on every order.',
          body: [
            "**DTF (direct-to-film)** prints full colour without the silkscreen setup charges. No minimum order to justify a screen, no flat-colour-only limitation, no rough plastisol hand-feel on the chest. Gradients, photo images, tiny text — all come out sharp on the first shirt off the heat press.",
            "The ink bonds *into* the fibre rather than sitting on top, which is why our DTF prints survive 50+ wash cycles without cracking at the fold lines. Silkscreen is still king for 500pc flat-logo runs. For everything under that — D&D shirts, CNY batches, sports tees — DTF wins on cost, turnaround, and finish.",
          ],
          side: {
            kind: 'list',
            label: 'DTF vs silkscreen',
            rows: [
              { text: 'Full-colour art', time: 'DTF' },
              { text: 'Photo gradients', time: 'DTF' },
              { text: '500pc flat logo', time: 'Silkscreen' },
              { text: 'Mixed sizes, one run', time: 'DTF' },
            ],
          },
        },
        {
          num: '03',
          title: 'Neck tape and shoulder seams — the parts nobody checks.',
          body: [
            "The neck is the first thing that fails on a cheap shirt. **Taped shoulder-to-shoulder** construction stops the neck stretching out after three wears, so the shirt still sits flat on the collarbone a year in. Untaped shirts develop that sad lettuce-edge by month two and nobody wears them again.",
            "Double-needle stitched hems on sleeves and bottom keep the shape through industrial laundry. Before we quote, we tell you which stock has the tape and which doesn't — because a S$2 saving on body stock disappears the moment staff refuse to wear the shirt to the second event.",
          ],
          side: {
            kind: 'stat',
            label: 'Taped shoulders',
            num: '50+',
            caption: 'wash cycles before neck-stretch',
          },
        },
        {
          num: '04',
          title: 'Wash durability: what "industrial wash" actually does.',
          body: [
            "F&B and hospitality teams wash shirts hot, often with bleach-based detergents. That's a brutal test for any print. **DTF ink** chemically bonds with the fibre through heat-press activation, which is why it outlasts vinyl-transfer prints in commercial laundry conditions.",
            "For wash longevity we flag two things upfront: **no fabric softener** (it coats the fibre and weakens ink grip), and turn the shirt inside-out for the first five washes. After that the print has fully cured into the weave and the shirt behaves like any other garment — just with your logo still on the chest.",
          ],
          side: {
            kind: 'quote',
            text: 'Our event crew wore the same tees through six roadshows. Still looking fresh on shirt number seven.',
            attr: 'Events Manager, SG tech firm',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '👕', title: '180gsm body stock', desc: 'No pyjama-weight tees sneaked in — shirts hold shape past wash 50.' },
      { icon_url: null, emoji: '🎨', title: 'DTF full-colour', desc: 'Gradients, photos and tiny type all sharp — no silkscreen setup fees.' },
      { icon_url: null, emoji: '🧵', title: 'Taped shoulders', desc: 'Neck stays flat after a year of wear. We check this before we quote.' },
      { icon_url: null, emoji: '🧺', title: 'Wash-fast ink', desc: 'Heat-press bonded into the fibre — survives hot commercial laundry.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. RUBBER STAMP
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'rubber-stamp',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Laser-engraved rubber, crisp edges.',
      right_note_body: 'Self-inking mechanisms tested before they leave the bench.',
      rows: [
        {
          need: 'You stamp *hundreds of invoices* a week',
          pick_title: 'Self-inking L (70×42mm), Blue',
          pick_detail: 'From S$32/pc · 5–7 day production · 10,000 impressions per refill',
        },
        {
          need: 'Small logo on *kraft packaging* — one-handed',
          pick_title: 'Self-inking S (30×10mm), Black',
          pick_detail: 'From S$18/pc · pocket-sized · clean impression on rough kraft',
        },
        {
          need: 'You need a *PAID / APPROVED* office stamp',
          pick_title: 'Self-inking M (47×18mm), Red',
          pick_detail: 'From S$24/pc · bold type, red for urgency · self-ink saves refills',
        },
        {
          need: "You're a *notary / clinic* — formal impression",
          pick_title: 'Traditional Rubber Stamp, Green',
          pick_detail: 'From S$14/pc · wooden handle · pad-inked for the record-book look',
        },
        {
          need: 'Address block for *envelope mail-outs*',
          pick_title: 'Self-inking M (47×18mm), Blue',
          pick_detail: 'From S$24/pc · 5 lines fit cleanly · no smudging on coated envelopes',
        },
      ],
    },
    seo_body: `Custom rubber stamps made in Singapore — self-inking in S (30×10mm), M (47×18mm), L (70×42mm) and traditional wooden-handle models, laser-engraved for crisp impression on paper, kraft and coated stock.

Choose blue, black, red or green ink. Built for invoices, address blocks, PAID markers, clinic stamps, notary seals and SME branding on packaging.`,
    seo_magazine: {
      issue_label: 'Issue №01 · Rubber Stamp',
      title: 'Four decisions behind a stamp',
      title_em: 'that lasts.',
      lede:
        "A cheap stamp leaves a blurry impression on invoice five and a dry one by invoice twenty. The difference is in the rubber quality, the mount depth, the ink chemistry, and picking the right mechanism for the job. Here's the plain version.",
      articles: [
        {
          num: '01',
          title: 'Self-inking vs wooden handle — pick for the workflow.',
          body: [
            "**Self-inking** stamps carry the pad inside the mechanism — press down, the die flips onto the pad, then flips onto the paper. One-handed, 10,000+ impressions before a refill, zero mess. Right pick for invoice processing, address blocks, and anyone stamping hundreds a week.",
            "**Traditional wooden-handle** stamps need a separate ink pad. Slower per-stamp, but the die lasts longer because it's not being slammed against a spring-loaded mount every time. Notaries, clinics, and anyone who needs a *ceremonial* impression still prefer the wooden version — it's the one that shows up on document photos.",
          ],
          side: {
            kind: 'pills',
            label: 'Mechanism',
            items: [
              { text: 'Self-inking S', pop: true },
              { text: 'Self-inking M' },
              { text: 'Self-inking L' },
              { text: 'Traditional (wooden)' },
            ],
          },
        },
        {
          num: '02',
          title: 'Impression size: the 47mm sweet spot.',
          body: [
            "**S (30×10mm)** fits a one-line logo, a short date, or a small monogram. Pocket-sized, good for kraft packaging where you don't want the stamp dominating the surface. **M (47×18mm)** is the workhorse — five lines of address detail fit comfortably, and it covers most office stamping jobs without being unwieldy.",
            "**L (70×42mm)** is for full logos with tagline, multi-line shop chops, and anything that needs to read across a room (PAID, CANCELLED, RECEIVED). Pick the size against the smallest type on the artwork — anything under 1.5mm line-height won't come through cleanly even on premium rubber.",
          ],
          side: {
            kind: 'list',
            label: 'Size by use case',
            rows: [
              { text: 'Logo on kraft', time: 'S (30×10)' },
              { text: 'Address block', time: 'M (47×18)' },
              { text: 'PAID / CANCELLED', time: 'M or L' },
              { text: 'Full shop chop', time: 'L (70×42)' },
            ],
          },
        },
        {
          num: '03',
          title: 'Ink colour — not just an aesthetic choice.',
          body: [
            "**Blue** reads as *signed and handled* on invoices and contracts. Scans cleanly, photocopies distinguishably from the black type underneath — which is why banks and law firms default to it. **Black** disappears into black-text documents; fine for logo stamps on packaging, wrong for invoice processing.",
            "**Red** signals urgency — PAID, VOID, APPROVED. Pairs well with high-visibility office workflows. **Green** is the quiet option, used by clinics and by businesses that want their chop to feel distinct without shouting. We ship with matching refill ink so you're not hunting Daiso in six months.",
          ],
          side: {
            kind: 'stat',
            label: 'Typical pad life',
            num: '10,000+',
            caption: 'impressions before refill',
          },
        },
        {
          num: '04',
          title: "The mount depth nobody talks about.",
          body: [
            "Cheap stamps have a thin rubber die glued to a hard plastic mount. Press too hard and the edges of the die catch the paper, leaving ghost lines around the impression. Our rubber is laser-engraved with **deep relief** — the non-printing areas are cut far enough back that they never touch the paper, even when the stamper is heavy-handed.",
            "The mount is foam-cushioned so the die flexes against uneven surfaces — rough kraft, laid stock, textured envelopes. Before any stamp leaves the bench we test five impressions on three paper types. If the type breaks up, we remake. Cheaper than a client getting a box of stamps that smudge.",
          ],
          side: {
            kind: 'quote',
            text: 'Ordered 30 self-inking stamps for our clinic chain. Still crisp six months in, across all branches.',
            attr: 'Practice Manager, SG medical group',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🔪', title: 'Laser-engraved rubber', desc: 'Deep relief cuts — no ghost-line edges, no smudging on thick paper.' },
      { icon_url: null, emoji: '🎯', title: 'Impression tested', desc: 'Every stamp fires five test impressions before it leaves the bench.' },
      { icon_url: null, emoji: '🖋️', title: '10k-impression pads', desc: 'Self-inking mechanism rated for heavy office use — not hobby-grade.' },
      { icon_url: null, emoji: '♻️', title: 'Refill ink matched', desc: 'We supply matching ink so you are not hunting Daiso in six months.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. STICKERS
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'stickers',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Kiss-cut or full die-cut to art.',
      right_note_body: 'Vinyl is waterproof and outdoor-rated. Kraft for the indoor crafty look.',
      rows: [
        {
          need: 'You want *die-cut to your logo shape* — no white border',
          pick_title: 'Vinyl Gloss, Custom Die-cut, A6',
          pick_detail: 'From S$0.53/pc · plotter-cut to vector · peel clean, no scrap edges',
        },
        {
          need: 'Stickers going on *laptops and water bottles*',
          pick_title: 'Vinyl Matt, Circle, A7',
          pick_detail: 'From S$0.45/pc · scratch-resistant · survives coffee spills and scanner tape',
        },
        {
          need: 'You want *foil shine* — stands out in a pile',
          pick_title: 'Holographic, Rectangle, A7',
          pick_detail: 'From S$0.60/pc · rainbow shift catches light · premium-feel product mark',
        },
        {
          need: 'Stickers for *glass shopfronts* — see-through background',
          pick_title: 'Clear Vinyl, Custom Die-cut, A5',
          pick_detail: 'From S$0.53/pc · prints like it floats on the glass · white-ink underlay option',
        },
        {
          need: 'Craft-brand look for *packaging seals*',
          pick_title: 'Kraft Paper, Circle, A7',
          pick_detail: 'From S$0.35/pc · uncoated feel · pairs with brown-box packaging',
        },
      ],
    },
    seo_body: `Custom stickers printed in Singapore on waterproof vinyl (gloss, matt, clear), holographic foil, and kraft paper — kiss-cut or full die-cut to your shape, rated for indoor and outdoor surfaces.

Logo seals, laptop swag, shopfront window decals, product labels, packaging stickers, event giveaways — plotter-cut to your vector artwork, sized up to A5, with the white-ink underlay layer handled in-house.`,
    seo_magazine: {
      issue_label: 'Issue №01 · Stickers',
      title: 'Four things that separate a good sticker',
      title_em: 'from a peely one.',
      lede:
        "Stickers are the cheapest piece of brand collateral that goes absolutely everywhere. They also fail in the most visible ways — curling edges, faded ink, smudged printing, gummy residue on a customer's laptop. Here are the four decisions that keep a sticker looking sharp a year in.",
      articles: [
        {
          num: '01',
          title: 'Die-cut vs kiss-cut — what the customer actually sees.',
          body: [
            "**Kiss-cut** means the sticker shape is cut through the vinyl but not through the backing — the sticker stays on a square backing sheet, easy to grab and peel. Right choice for giveaways, trade-show handouts, and anything that needs to survive a tote bag without bending.",
            "**Full die-cut** means the sticker *and* the backing are cut to shape — no white border, no excess paper. The look on a customer's laptop is tighter, more premium, because there's no rectangle of unused backing around the art. We plotter-cut both from your vector artwork, so no AI-guessed contours.",
          ],
          side: {
            kind: 'pills',
            label: 'Cut type',
            items: [
              { text: 'Kiss-cut (with border)', pop: true },
              { text: 'Full die-cut' },
              { text: 'Rectangle / Square' },
              { text: 'Circle' },
            ],
          },
        },
        {
          num: '02',
          title: 'Vinyl vs paper — the outdoor question.',
          body: [
            "**Vinyl** is waterproof, UV-rated, and survives outdoor conditions for 2+ years. Gloss reads as bold and punchy. Matt looks premium and reduces glare on laptops. Clear vinyl prints invisibly on the transparent areas — floats on glass shopfronts.",
            "**Kraft paper** is uncoated, indoor-only, and built for craft-brand packaging seals where you want the eco feel. It tears if it gets wet, which is by design — customers know it's a one-use seal, not a permanent mark. Don't stick kraft on a water bottle. Don't print a wedding invitation seal on vinyl.",
          ],
          side: {
            kind: 'list',
            label: 'Material by surface',
            rows: [
              { text: 'Laptop / bottle', time: 'Vinyl matt' },
              { text: 'Shopfront glass', time: 'Clear vinyl' },
              { text: 'Packaging seal', time: 'Kraft paper' },
              { text: 'Foil-shine mark', time: 'Holographic' },
            ],
          },
        },
        {
          num: '03',
          title: 'Why clear vinyl needs a white-ink underlay.',
          body: [
            "Print full-colour artwork on clear vinyl without a white base and every pigment becomes transparent — the red of your logo tints whatever's behind it. **White-ink underlay** is a layer printed underneath the colour that anchors pigment so it reads the way you designed it, even on a dark shopfront window.",
            "We handle the white-ink layer in-house. You send vector art, we separate the underlay, and the print comes out opaque where you designed opaque and transparent where you designed transparent. Other shops will charge extra for this step or skip it and blame your file.",
          ],
          side: {
            kind: 'stat',
            label: 'Outdoor life',
            num: '2+ yrs',
            caption: 'on vinyl with UV-rated inks',
          },
        },
        {
          num: '04',
          title: 'Adhesive strength — grippy enough, clean enough.',
          body: [
            "A laptop sticker that peels after a month is useless. One that takes paint off a customer's wall when it comes down is worse. Our **standard adhesive** bonds aggressively to plastics, metals and painted walls but lifts clean after 1–2 years — no gummy residue, no ghost-outlines.",
            "For packaging seals we match adhesive to the surface — kraft paper sticker on a glossy box uses a low-tack glue that peels without tearing the box. Vinyl on a water bottle uses a high-tack glue that survives being scrubbed daily. Tell us the surface when you quote and we spec the right one.",
          ],
          side: {
            kind: 'quote',
            text: 'Die-cut vinyl logo stickers on 3,000 packages. Not one peel complaint from customers.',
            attr: 'Founder, SG skincare brand',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '✂️', title: 'Plotter-cut to art', desc: 'Vector contour-cut — die-cut or kiss-cut to your actual shape, not a rectangle.' },
      { icon_url: null, emoji: '💧', title: 'Waterproof vinyl', desc: 'UV-rated stock survives outdoor mounting, coffee spills, and daily scrubs.' },
      { icon_url: null, emoji: '⚪', title: 'White-ink underlay', desc: 'Clear-vinyl colour stays opaque on dark glass — no ghost-pigment.' },
      { icon_url: null, emoji: '🧴', title: 'Clean-peel adhesive', desc: 'Lifts after 1–2 years with no gummy residue on the customer laptop.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. TABLE TENT
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'table-tent',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Thick stock that stands — no floppy tents.',
      right_note_body: 'Matt or gloss lamination included, spot UV optional on the hero panel.',
      rows: [
        {
          need: 'F&B outlet — *drink specials and QR menu*',
          pick_title: 'TC02 Medium (14×11.6cm), Matt Lam',
          pick_detail: 'From S$0.95/pc · eye-level at arm\'s reach · readable from both sides of the table',
        },
        {
          need: 'Hotel lobby / desk — *premium finish*',
          pick_title: 'TC03 Large (13×15.5cm), Gloss Lam + Spot UV',
          pick_detail: 'From S$1.55/pc · spot UV on the logo · matches 5-star room standards',
        },
        {
          need: 'Event table — *keep it small, keep it cheap*',
          pick_title: 'TC01 Small (8.6×11.6cm), Matt Lam',
          pick_detail: 'From S$1.80/pc · compact footprint · space-efficient on crowded booths',
        },
        {
          need: 'Big promotion — *read from across the store*',
          pick_title: 'TC04 XL (21×17.5cm), Gloss Lam',
          pick_detail: 'From quote · biggest hero image area · pairs with counter displays',
        },
        {
          need: 'Menu changes *every week* — reprint cheap',
          pick_title: 'TC02 Medium (14×11.6cm), Matt Lam',
          pick_detail: 'From S$0.95/pc · 300pc runs keep unit cost low · swap weekly without guilt',
        },
      ],
    },
    seo_body: `Custom table tents printed in Singapore on stand-up card stock — sizes TC01 (8.6×11.6cm), TC02 (14×11.6cm), TC03 (13×15.5cm), and TC04 (21×17.5cm), with matt or gloss lamination and optional spot UV on the hero panel.

Built for F&B specials, hotel room cards, event booth signage, and retail counter promotions. Double-sided, triangle-folded, ready to deploy on any table or counter.`,
    seo_magazine: {
      issue_label: 'Issue №01 · Table Tents',
      title: 'Why some table tents fall over',
      title_em: 'at table three.',
      lede:
        "A table tent that won't stand up is a chore for your service staff and an embarrassment on every occupied table. The difference between a tent that lives a full promotion cycle and one that collapses by Thursday is in four production calls — the paperweight, the fold, the lamination, and how the artwork handles being read from both sides.",
      articles: [
        {
          num: '01',
          title: 'The fold pattern — triangle vs A-frame.',
          body: [
            "Our table tents are **triangle-folded** with a sealed base flap, which means the tent forms a stable prism that won't collapse when a customer knocks the table. A-frame folds without a base flap look fine empty but fall flat the first time someone reaches for a chopstick.",
            "The triangle pattern also prints cleanly on **all three panels** — two reading faces and a top banner — so a customer across the table reads the same message as the one sitting next to it. F&B doesn't have time for single-sided tents that make half the room miss the promotion.",
          ],
          side: {
            kind: 'pills',
            label: 'Fold',
            items: [
              { text: 'Triangle (base flap)', pop: true },
              { text: 'Double-sided print' },
              { text: 'Sealed construction' },
            ],
          },
        },
        {
          num: '02',
          title: "Paper weight: why thin stock wilts by lunch service.",
          body: [
            "A tent that sags looks tired. We print on thick **art-card stock** that holds shape through a full lunch and dinner rotation — including the times a tea spill hits the base. Thinner stock buckles with humidity, which in SG means the tent sags the moment an aircon vent stops blowing on it.",
            "**Matt lamination** is standard across all sizes — it protects from grease splatter, oily fingers, and the inevitable kopi-C ring someone parks on it. Without lamination the print fades by week two and the card wicks moisture from the table. Gloss is an option if you want the menu photos to pop harder.",
          ],
          side: {
            kind: 'list',
            label: 'Size by use',
            rows: [
              { text: 'F&B specials', time: 'TC02 (14cm)' },
              { text: 'Hotel desk', time: 'TC03 (13×15.5cm)' },
              { text: 'Event booth', time: 'TC01 (8.6cm)' },
              { text: 'Hero promotion', time: 'TC04 (21cm)' },
            ],
          },
        },
        {
          num: '03',
          title: 'Spot UV — when the hero panel deserves it.',
          body: [
            "**Spot UV** is a clear gloss coating applied only to specific areas of the artwork — a logo, a headline, a hero dish photo. On matt-laminated card it creates a tactile contrast that catches light and draws the eye before anything else on the tent.",
            "Not every tent needs it. A weekly drink-special tent that gets reprinted every Friday is wasted on spot UV. A hotel lobby tent that stays deployed for a year, or a launch-promotion tent anchoring a new menu, earns the extra step. Ask for it when the campaign calendar is long enough to justify the finish.",
          ],
          side: {
            kind: 'stat',
            label: 'Spot UV add',
            num: '+S$50',
            caption: 'flat fee per artwork',
          },
        },
        {
          num: '04',
          title: 'Print turnaround when the menu changes weekly.',
          body: [
            "F&B promotions change fast. Soft-launch Tuesday, full menu Thursday, LTO swap next month. Our table tents are built for **short reprint cycles** — 100-to-500pc runs come off the press in days, not weeks, and the art-card stock is kept on hand so we're not waiting on paper.",
            "Tell us upfront if you're planning a recurring campaign and we'll keep your production profile on file. Next month's reprint comes off the same stock, same lamination, same colour profile — so the tent on table one in June looks identical to the one on table fifty in December.",
          ],
          side: {
            kind: 'quote',
            text: 'We reprint table tents every fortnight for new drink specials. Turnaround has never been the bottleneck.',
            attr: 'F&B Manager, SG cafe chain',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '📐', title: 'Triangle-fold stability', desc: 'Sealed base flap — the tent stands through a full dinner service, no wilting.' },
      { icon_url: null, emoji: '🎨', title: 'Thick art-card stock', desc: 'Holds shape in SG humidity. No sag, no buckling by lunch break.' },
      { icon_url: null, emoji: '✨', title: 'Matt lam included', desc: 'Shields print from grease, kopi rings, and wet-tray drips — zero upcharge.' },
      { icon_url: null, emoji: '🔁', title: 'Reprint-ready profile', desc: 'Art-card in stock, colour profile logged — weekly menu swaps land fast.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. TOTE BAG
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'tote-bag',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Canvas that people actually carry.',
      right_note_body: 'Non-woven for budget runs, cotton canvas for brand-worthy daily use.',
      rows: [
        {
          need: 'Conference swag — *2,000 bags, tight budget*',
          pick_title: 'Non-woven, Single Sided',
          pick_detail: 'From S$3.80/pc · lowest unit cost · holds shape for day-of use',
        },
        {
          need: 'You want people to *actually carry it daily*',
          pick_title: 'Canvas, Double Sided',
          pick_detail: 'From S$7/pc · 10oz weight · survives groceries, gym kit, MRT commutes',
        },
        {
          need: 'Premium client gift — *looks like retail*',
          pick_title: 'Premium Canvas, Double Sided',
          pick_detail: 'From S$9/pc · heavy 12oz weight · handles a MacBook without sagging',
        },
        {
          need: 'CNY giveaway — *branded both sides matters*',
          pick_title: 'Canvas, Double Sided',
          pick_detail: 'From S$7/pc · logo walks in both directions · better brand mileage',
        },
        {
          need: 'Event stall — *quick grab-and-go bag*',
          pick_title: 'Non-woven, Single Sided',
          pick_detail: 'From S$3.80/pc · lightweight · perfect for loose flyers and freebies',
        },
      ],
    },
    seo_body: `Custom tote bags printed in Singapore on non-woven, canvas, and premium canvas — single or double-sided print, built for conference swag, CNY giveaways, retail gift-with-purchase, and daily-wear brand exposure.

Canvas holds a 10oz daily load (groceries, laptop, gym kit), premium canvas sits at 12oz for bags that need to look retail-grade. Non-woven keeps unit costs down for big-volume event runs.`,
    seo_magazine: {
      issue_label: 'Issue №01 · Tote Bags',
      title: 'The difference between a tote',
      title_em: 'and a wardrobe bin-liner.',
      lede:
        "Most event totes end up in a drawer within a week. A few end up carrying groceries, gym kit, and a laptop for the next three years — walking billboards that pay for themselves many times over. Four production decisions separate the two outcomes.",
      articles: [
        {
          num: '01',
          title: 'Canvas weight: 10oz is the daily-use threshold.',
          body: [
            "Under 8oz and the bag sags empty. At **10oz canvas** the tote holds a shape while hanging, supports a full grocery run without tearing at the handle base, and retains colour after 50+ washes. This is the bag people use for the MRT commute, not the one that ends up in the recycle bin.",
            "**12oz premium canvas** is where bags start feeling retail-grade. Heavy enough to carry a MacBook + charger + gym towel without the bottom rounding out. We stock both weights — pick by how the bag will be used, not the cheapest quote.",
          ],
          side: {
            kind: 'pills',
            label: 'Fabric',
            items: [
              { text: 'Non-woven (event)', pop: true },
              { text: '10oz Canvas' },
              { text: '12oz Premium' },
            ],
          },
        },
        {
          num: '02',
          title: 'Handles: the failure point nobody tests.',
          body: [
            "Totes almost always fail at the handle junction first. Cheap bags have handles stitched with a single line into the top hem, which rips the moment someone overloads it with Cold Storage groceries. Our canvas totes are **double-stitched with a reinforced X-box** at each handle root — the same construction used on retail carry bags.",
            "Handle length matters too. **Short handles** (shoulder-only) for a clean retail look. **Long handles** (over-the-shoulder for adults) for daily use — a bag you can't sling over your jacket is a bag nobody takes out twice. We'll spec the length before print if you haven't picked one.",
          ],
          side: {
            kind: 'list',
            label: 'Handle by bag type',
            rows: [
              { text: 'Event swag', time: 'Short, single-stitch' },
              { text: 'Daily carry', time: 'Long, X-box reinforced' },
              { text: 'Retail gift', time: 'Long, 12oz body' },
              { text: 'Heavy-load', time: 'Long, double-stitched' },
            ],
          },
        },
        {
          num: '03',
          title: 'Print method — silkscreen vs DTF vs heat transfer.',
          body: [
            "**Silkscreen** is the gold standard for flat-logo, large-quantity canvas — colour soaks into the fibre, zero hand-feel on the chest-strap area, holds up through industrial wash. Best for orders 100pc and above with simple artwork.",
            "**DTF** handles gradients, photos, and full-colour brand marks with no screen setup fees. Ideal for under-100pc runs and mixed-design projects. **Heat transfer** is for one-off personalisation (names, numbers). We pick the method against your artwork and quantity, not the margin on our side.",
          ],
          side: {
            kind: 'stat',
            label: 'Canvas wash cycles',
            num: '50+',
            caption: 'before colour-fade on silkscreen',
          },
        },
        {
          num: '04',
          title: 'Non-woven vs cotton: honest tradeoff.',
          body: [
            "**Non-woven polypropylene** is the budget material — keeps unit cost low enough to hit big-volume conference budgets, holds shape for day-of use, and takes flat-colour screen print fine. It's a one-event bag, not a daily carry.",
            "**Cotton canvas** costs more but lives longer. If the goal is walking brand exposure — a bag that ends up at wet markets, airport security trays, NUS lecture halls — cotton is the only answer. We'll give you honest numbers on both so you pick by use case, not by the cheaper-per-unit headline.",
          ],
          side: {
            kind: 'quote',
            text: 'Our CNY canvas totes came back to three events this year — staff still carrying them to the fourth.',
            attr: 'Marketing Lead, SG fintech',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🧺', title: '10oz canvas body', desc: 'Holds shape empty or full — not the sag-when-empty event bag.' },
      { icon_url: null, emoji: '🪢', title: 'X-box handle stitch', desc: 'Reinforced junctions — survives Cold Storage runs without tearing.' },
      { icon_url: null, emoji: '🎨', title: 'Print method matched', desc: 'Silkscreen for bulk, DTF for gradients, heat transfer for names.' },
      { icon_url: null, emoji: '♻️', title: 'Honest material call', desc: 'We spec non-woven vs cotton against use case, not margin.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6. TRANSPARENT CARD
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'transparent-card',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'PVC clarity with full-colour + white ink.',
      right_note_body: 'Every card white-underlay printed in-house. No separate charge.',
      rows: [
        {
          need: 'You want the *see-through drama* on first handover',
          pick_title: 'Clear PVC, Full Colour + White Ink',
          pick_detail: 'From S$28/pc · see-through body, opaque artwork · stands out in any holder',
        },
        {
          need: "You're *architecture / design* — minimal, quiet",
          pick_title: 'Frosted PVC, White Ink Only',
          pick_detail: 'From S$30/pc · soft milky translucence · reads premium without colour noise',
        },
        {
          need: 'Luxe brand — *gold or navy* on see-through',
          pick_title: 'Clear PVC, Full Colour + White Ink',
          pick_detail: 'From S$28/pc · spot-colour over white underlay · looks printed on glass',
        },
        {
          need: 'Corporate, but *not another matt name card*',
          pick_title: 'Frosted PVC, Full Colour + White Ink',
          pick_detail: 'From S$32/pc · frosted body with opaque ink · quiet premium feel',
        },
        {
          need: 'Event pass / VIP card — *feels like glass*',
          pick_title: 'Clear PVC, Full Colour + White Ink',
          pick_detail: 'From S$28/pc · 0.76mm thickness · plastic-credit-card durable',
        },
      ],
    },
    seo_body: `Transparent name cards printed in Singapore on clear PVC and frosted PVC — full-colour with white-ink underlay or white-ink-only, built for architects, design studios, luxury brands, and VIP event passes.

See-through body, opaque artwork, credit-card thickness. The white-ink underlay layer is handled in-house so every colour reads opaque the way you designed it.`,
    seo_magazine: {
      issue_label: 'Issue №01 · Transparent Card',
      title: 'The card that makes',
      title_em: 'every other card look loud.',
      lede:
        "A transparent name card lands different. In a stack of matt cardstock, it's the only one the recipient picks up and angles to the light. Four production decisions decide whether it arrives at the meeting looking premium or looking like a cheap novelty.",
      articles: [
        {
          num: '01',
          title: 'PVC vs PET — why we spec PVC.',
          body: [
            "**PVC** holds a sharper edge when cut, accepts white-ink underlay without adhesion problems, and sits at credit-card thickness (0.76mm) with enough stiffness to feel premium. **PET** is greener and slightly clearer but flexes more and tends to scratch under sleeve friction in a business-card holder.",
            "We stock both **Clear PVC** (full see-through) and **Frosted PVC** (milky translucent). Clear is for maximum see-through drama — recipient holds it to the window. Frosted is for quieter premium — the card looks like sanded glass, less flashy, more architectural.",
          ],
          side: {
            kind: 'pills',
            label: 'Material',
            items: [
              { text: 'Clear PVC', pop: true },
              { text: 'Frosted PVC' },
              { text: '0.76mm thickness' },
              { text: 'Credit-card feel' },
            ],
          },
        },
        {
          num: '02',
          title: 'Why the white-ink layer is everything.',
          body: [
            "Full-colour ink on clear PVC is *transparent* — your red logo tints whatever's behind the card. **White-ink underlay** is a printed layer placed beneath the colour to anchor pigment, so the red reads red against a dark boardroom table or a sunny window.",
            "Most shops charge a white-ink surcharge or skip it entirely. We handle it in-house, separate the underlay from your vector art, and bake it into the base quote. If you send black-and-white artwork and want the white-ink-only option (just the white, no colour on top), we scale down the price to match.",
          ],
          side: {
            kind: 'list',
            label: 'Print option by look',
            rows: [
              { text: 'Logo + info, colour', time: 'Full + white underlay' },
              { text: 'Minimal / mono', time: 'White ink only' },
              { text: 'Luxe spot colour', time: 'Full + white underlay' },
              { text: 'Frosted architect', time: 'White ink only' },
            ],
          },
        },
        {
          num: '03',
          title: 'Opacity: how much see-through the eye actually wants.',
          body: [
            "Fully transparent body with every element 100% opaque is striking for the first handover — and unreadable in a stack. We coach the opacity balance before print: body logo at 100% white underlay, secondary type at 100% so it reads on any surface, and a couple of accent elements at 40% so the see-through quality stays visible.",
            "Frosted PVC solves this differently — the body already diffuses background interference, so even 100%-opaque artwork still reads as *floating* when the card is handed over. Good pick for small-type-heavy cards where clear PVC would be a readability nightmare.",
          ],
          side: {
            kind: 'stat',
            label: 'Card thickness',
            num: '0.76mm',
            caption: 'credit-card-grade PVC stock',
          },
        },
        {
          num: '04',
          title: 'Edge finish — the detail that separates cheap from custom.',
          body: [
            "Clear PVC cut rough leaves a frosted cloudy edge that kills the see-through effect at the exact point the card meets the hand. We **precision die-cut** every card and polish the edge so clarity runs right to the border — the card looks like it was pressed from a single sheet of glass.",
            "Corner radius matters too. Sharp 90° corners scratch other cards in a holder and catch pocket lining. A **3mm corner radius** keeps the premium feel without snagging — same spec as bank ATM cards. We ship cards shrink-wrapped in 100s so edges stay clean until first unwrap.",
          ],
          side: {
            kind: 'quote',
            text: 'Handed one to a client and they actually stopped mid-conversation to look at it. Never happened with our old cards.',
            attr: 'Principal, SG architecture studio',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🪟', title: '0.76mm PVC stock', desc: 'Credit-card thickness, stiff enough to feel premium on first handover.' },
      { icon_url: null, emoji: '⚪', title: 'White underlay in-house', desc: 'Separated from your vector, baked in — every colour stays opaque.' },
      { icon_url: null, emoji: '🔪', title: 'Polished cut edges', desc: 'No frosted cloudy border — clarity runs to the edge, like pressed glass.' },
      { icon_url: null, emoji: '📐', title: '3mm corner radius', desc: 'ATM-card spec — no scratching neighbours in a holder, no pocket snag.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 7. UV DTF STICKER
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'uv-dtf-sticker',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Peel-press-stick on any hard surface.',
      right_note_body: 'No heat, no tools. Two-layer film leaves ink fused to the surface.',
      rows: [
        {
          need: "You're branding *glass bottles / tumblers*",
          pick_title: 'UV DTF Sticker, Up to A6',
          pick_detail: 'From S$2.20/pc · fuses to glass like printed-on · no ghost bubbles',
        },
        {
          need: 'Wooden coasters / crates — *textured surface*',
          pick_title: 'UV DTF Sticker, Up to A5',
          pick_detail: 'From S$3.50/pc · adheres into wood grain · no edge-lift at the corners',
        },
        {
          need: 'Metal water bottle or *tin container*',
          pick_title: 'UV DTF Sticker, Up to A6',
          pick_detail: 'From S$2.20/pc · survives daily wash · colour-locked by UV cure',
        },
        {
          need: 'Ceramic mug with *full-wrap artwork*',
          pick_title: 'UV DTF Sticker, Up to A4',
          pick_detail: 'From S$5.50/pc · widest wrap format · looks fired-on at arm\'s length',
        },
        {
          need: 'Acrylic signage — *small-run, no printer access*',
          pick_title: 'UV DTF Sticker, Up to A5',
          pick_detail: 'From S$3.50/pc · skip the UV-flatbed booking · apply in-office in minutes',
        },
      ],
    },
    seo_body: `UV DTF stickers printed in Singapore — peel-press-stick transfers that fuse to glass, metal, wood, acrylic, and ceramic without heat or tools, leaving behind a printed-on look with full-colour UV-cured pigment.

Three sizes (up to A6, A5, A4). Built for branded tumblers, mug wraps, wooden coaster packs, bottle labels, acrylic signage, and anywhere a standard vinyl sticker would lift off a textured surface.`,
    seo_magazine: {
      issue_label: 'Issue №01 · UV DTF Sticker',
      title: 'Why UV DTF beats vinyl',
      title_em: 'on hard surfaces.',
      lede:
        "Standard vinyl stickers are for laptops and notebooks. The moment the surface gets textured — wood grain, frosted glass, matt ceramic — vinyl starts lifting at the edges. UV DTF is a different animal: a two-layer film that leaves pigment fused into the surface, no adhesive sandwich. Here's what that unlocks.",
      articles: [
        {
          num: '01',
          title: 'The two-layer film that makes UV DTF different.',
          body: [
            "A normal vinyl sticker is one sheet: ink-on-vinyl-on-adhesive-on-backing. A **UV DTF sticker** is two films: the *A film* carries the UV-cured ink, the *B film* is a transfer layer. You peel, press, rub, lift the B film — the ink transfers onto the surface without any vinyl layer in between.",
            "That's why a UV DTF logo on a glass tumbler looks *printed on*, not *stuck on*. No edge you can catch with a fingernail, no vinyl sheen under a side-light, no bubble trapped at the corner of a curved bottle. Just pigment fused to the surface, same as a screen-printed glass.",
          ],
          side: {
            kind: 'pills',
            label: 'Surface compatibility',
            items: [
              { text: 'Glass', pop: true },
              { text: 'Metal' },
              { text: 'Wood / ceramic' },
              { text: 'Acrylic / PET' },
            ],
          },
        },
        {
          num: '02',
          title: 'Why textured surfaces kill standard vinyl.',
          body: [
            "A vinyl sticker needs a flat surface for the adhesive to bond evenly. Put it on **wood grain** and the high ridges hold the vinyl off the valleys — bubbles everywhere, edges lift within days. Put it on **frosted glass** and the sand-etched surface prevents the adhesive from flowing into micro-texture, so peel starts at the corner.",
            "UV DTF pigment flows with the texture because the transfer happens at ink level, not vinyl level. We've printed successful jobs on **live-edge wooden coasters**, **frosted acrylic signage**, **tin gift boxes**, and **ceramic mug curves** — all surfaces where vinyl would have lifted in a fortnight.",
          ],
          side: {
            kind: 'list',
            label: 'Where vinyl fails, UV DTF works',
            rows: [
              { text: 'Wood grain', time: 'UV DTF only' },
              { text: 'Frosted glass', time: 'UV DTF only' },
              { text: 'Curved ceramic', time: 'UV DTF only' },
              { text: 'Laptop (smooth)', time: 'Vinyl fine' },
            ],
          },
        },
        {
          num: '03',
          title: 'Colour gamut: UV-cured ink vs standard eco-solvent.',
          body: [
            "Eco-solvent vinyl ink is fine for outdoor decals but compresses the colour gamut — deep reds dull, navy blues go muddy, white is never truly white. **UV-cured ink** hits a brighter saturation point because it cures instantly under UV lamps, locking pigment before it spreads into the film.",
            "This matters on **brand-colour jobs** — F&B tumblers with a specific shade of turquoise, architectural signage in a brand navy, luxury packaging with metallic accents. The UV DTF version reads as the Pantone you specified, not a faded approximation.",
          ],
          side: {
            kind: 'stat',
            label: 'UV-cure advantage',
            num: '+30%',
            caption: 'colour saturation vs eco-solvent',
          },
        },
        {
          num: '04',
          title: 'Apply in-office: no heat press, no flatbed booking.',
          body: [
            "The quiet unlock of UV DTF is **self-service application**. Peel the backing, press down firmly, rub with the included squeegee card, peel the transfer film away. Takes 60 seconds per sticker, on any hard surface, with no equipment. F&B crew can brand 200 tumblers during a quiet shift instead of paying a printer to handle them.",
            "For removal, UV DTF isn't as peel-clean as vinyl — the pigment is fused, not stuck. Scrape with a plastic card, follow with isopropyl alcohol, allow five minutes per sticker. Plan on this being a one-and-done job, not a seasonal swap like vinyl.",
          ],
          side: {
            kind: 'quote',
            text: 'Branded 500 tumblers in-house over two afternoons. Would have taken a week at a UV flatbed vendor.',
            attr: 'Ops Lead, SG bubble-tea chain',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🖨️', title: 'UV-cured pigment', desc: 'Locks colour instantly — +30% saturation vs eco-solvent vinyl inks.' },
      { icon_url: null, emoji: '🫙', title: 'Fuses to textured surface', desc: 'Works on wood grain, frosted glass, curved ceramic — where vinyl fails.' },
      { icon_url: null, emoji: '🖐️', title: 'No tools to apply', desc: 'Peel, press, rub, lift. 60 seconds per sticker, any hard surface.' },
      { icon_url: null, emoji: '🎯', title: 'Printed-on look', desc: 'Ink only, no vinyl layer — no edge, no sheen, no catchable lip.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 8. WOBBLER
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'wobbler',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Spring arm that actually wobbles.',
      right_note_body: '260gsm art card — thick enough to hold shape, light enough to flex.',
      rows: [
        {
          need: 'Shelf-edge promo — *price drop, small space*',
          pick_title: 'A7 Round, 260gsm Art Card',
          pick_detail: 'From S$1.10/pc · compact for shelf strips · visible from the aisle',
        },
        {
          need: 'Product-top hero — *launch of the month*',
          pick_title: 'A5 Custom, 260gsm Art Card',
          pick_detail: 'From S$1.90/pc · biggest hero panel · die-cut to product shape',
        },
        {
          need: 'Supermarket rollout — *300 outlets, tight budget*',
          pick_title: 'A6 Custom, 260gsm Art Card',
          pick_detail: 'From S$1.44/pc · unit cost scales on 500pc runs · bulk-shipped flat',
        },
        {
          need: 'Point-of-sale — *draws eyes at checkout*',
          pick_title: 'A7 Round, 260gsm Art Card',
          pick_detail: 'From S$1.10/pc · counter-side mounting · peel-stick pad included',
        },
        {
          need: 'Fresh-food fridge — *must survive condensation*',
          pick_title: 'A6 Custom, 260gsm Art Card',
          pick_detail: 'From S$1.44/pc · matt-laminated card · holds up in fridge humidity',
        },
      ],
    },
    seo_body: `Custom wobblers printed in Singapore on 260gsm art card — spring-arm shelf talkers die-cut to A7 round, A6 custom or A5 custom shapes, built for supermarket aisles, shelf-edge promos, product-top hero cards, and point-of-sale displays.

Peel-stick mounting pad included. Matt-laminated so condensation in fridge aisles won't ruin the print. Spring arm flex-tested to survive cart bumps without snapping.`,
    seo_magazine: {
      issue_label: 'Issue №01 · Wobblers',
      title: 'Why a $1.50 card',
      title_em: 'beats the shelf strip.',
      lede:
        "A wobbler is a shelf-edge promotional card on a springy plastic arm that flexes when air or a passing cart disturbs it. That tiny motion is the reason shoppers notice it — peripheral vision is wired for movement. Four production calls decide whether the wobbler lives out the campaign or snaps on day three.",
      articles: [
        {
          num: '01',
          title: 'Spring arm length — the wobble that catches eyes.',
          body: [
            "Too short and there's no wobble. Too long and the arm whips against a cart and snaps. We build on a **standard spring-arm length** (roughly 10cm) calibrated for supermarket aisles — wide enough to clear shelf-strip brackets, short enough to survive a cart clipping it.",
            "The arm itself is **flexible PET plastic** — won't crack when bent back during shelf stocking, returns to its natural position without retention-creasing. Rigid-arm wobblers look cheaper and fail faster. Ask any FMCG merchandiser which ones survive the Friday restock shift.",
          ],
          side: {
            kind: 'pills',
            label: 'Size',
            items: [
              { text: 'A7 Round', pop: true },
              { text: 'A6 Custom' },
              { text: 'A5 Custom' },
            ],
          },
        },
        {
          num: '02',
          title: 'Peel-stick vs clip mount — pick by shelf furniture.',
          body: [
            "Most wobbler jobs ship with a **3M peel-stick pad** on the back of the arm — adheres to metal shelf edges, plastic price-strip channels, and most counter-edge surfaces. One-handed application, no tools, clean removal with a bit of isopropyl at end-of-campaign.",
            "For **shelf-edge clip** mounting (common in hypermart setups where strips have existing clip channels), we ship a plastic clip in place of the pad. Tell us which one at quote — swapping mid-run means a second production pass and the timelines move.",
          ],
          side: {
            kind: 'list',
            label: 'Mount by location',
            rows: [
              { text: 'Metal shelf edge', time: 'Peel-stick' },
              { text: 'Price-strip channel', time: 'Clip' },
              { text: 'Counter edge', time: 'Peel-stick' },
              { text: 'Product top', time: 'Peel-stick' },
            ],
          },
        },
        {
          num: '03',
          title: '260gsm art card: the right weight to flex.',
          body: [
            "The card-face is where the artwork lives, and it has to do two things — flex with the arm without creasing, and hold shape against aircon airflow in a supermarket aisle. **260gsm art card** is the sweet spot: thick enough to hold die-cut shape, light enough to respond to the spring arm without over-dampening the wobble.",
            "Thinner stock (200gsm) collapses on the arm and looks like a limp flag. Heavier stock (350gsm) stops the arm wobbling entirely — you've printed a flat sign that cost double. 260gsm is the FMCG industry default for a reason.",
          ],
          side: {
            kind: 'stat',
            label: 'Card weight',
            num: '260gsm',
            caption: 'FMCG-standard flex balance',
          },
        },
        {
          num: '04',
          title: 'Shelf-edge vs product-top — where the wobbler actually works.',
          body: [
            "**Shelf-edge** mounting is the highest-volume use — wobbler sits perpendicular to the aisle, motion catches peripheral vision from shoppers walking past. A7 round is the default because it clears neighbouring shelf strips without overlapping.",
            "**Product-top** mounting flips the script — wobbler sits above the product hero, pointing straight at the approaching shopper. Bigger A5 custom sizes make sense here because the viewing angle is full-face, not edge-on. For fridge aisles (dairy, chilled ready-meals), matt lamination is essential — condensation will buckle unlaminated card by day two.",
          ],
          side: {
            kind: 'quote',
            text: 'Ran the same campaign with static shelf strips vs wobblers. Wobbler aisles doubled the promo uplift.',
            attr: 'Trade Marketing, SG FMCG brand',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🌀', title: 'Flex-tuned spring arm', desc: 'Calibrated length — enough wobble to catch eyes, short enough to survive carts.' },
      { icon_url: null, emoji: '📇', title: '260gsm art card face', desc: 'Right weight to flex with the arm without collapsing or over-dampening.' },
      { icon_url: null, emoji: '📎', title: '3M peel-stick or clip', desc: 'Mount hardware matched to shelf furniture — metal edge, strip channel, counter.' },
      { icon_url: null, emoji: '💧', title: 'Matt-laminated face', desc: 'Survives fridge-aisle condensation without buckling the print.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 9. X STAND BANNER
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'x-stand-banner',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Under 2kg, 45-second setup.',
      right_note_body: 'Pole kit + carry bag included. Stores under a desk between events.',
      rows: [
        {
          need: 'Roadshow booth — *one banner, high foot traffic*',
          pick_title: '80×180cm, PVC Canvas, Matt Lam',
          pick_detail: 'From S$70/pc · durable PVC · handles humid outdoor events',
        },
        {
          need: 'Indoor conference — *clean, light, carryable*',
          pick_title: '60×160cm, Poster Paper, Matt Lam',
          pick_detail: 'From S$60/pc · smallest footprint · fits through any venue door',
        },
        {
          need: 'Trade show — *biggest impact at the booth*',
          pick_title: '120×200cm, PVC Canvas, Gloss Lam',
          pick_detail: 'From S$110/pc · read from across the hall · strongest brand visibility',
        },
        {
          need: 'You *travel between venues weekly*',
          pick_title: '80×180cm, Poster Paper, Matt Lam',
          pick_detail: 'From S$70/pc · rolls into carry bag · sets up in under a minute',
        },
        {
          need: 'Tight budget — *10 banners for a roadshow tour*',
          pick_title: '60×160cm, Poster Paper, Matt Lam',
          pick_detail: 'From S$60/pc · lowest unit cost at 10pc · quick refresh between legs',
        },
      ],
    },
    seo_body: `Custom X-stand banners printed in Singapore on poster paper and PVC canvas — sizes 60×160cm, 80×180cm, and 120×200cm, matt or gloss laminated, shipped with pole kit and carry bag for 45-second setup.

Built for roadshows, trade shows, conferences, booth signage, and pop-up retail. Under 2kg, stores flat under a desk, opens flat without edge-curl.`,
    seo_magazine: {
      issue_label: 'Issue №01 · X-Stand Banners',
      title: 'The banner setup that doesn\'t',
      title_em: 'eat your morning.',
      lede:
        "A rollup banner mechanism weighs 4kg and takes three minutes to deploy. An X-stand weighs under 2kg and opens in 45 seconds. Four production calls decide whether you end up with a portable brand display or a crumpled poster on a wobbly frame.",
      articles: [
        {
          num: '01',
          title: 'Pole assembly — the mechanics of the X-frame.',
          body: [
            "The X-stand is a cross of four telescoping fibreglass poles that clip together at the centre and at the banner corners. Unfold poles, click joins, hook corner grommets — banner is upright in **under a minute**. No tools, no cables, no spring-loaded rollup mechanism to wrestle.",
            "We ship with **fibreglass poles** rather than plastic — 30% lighter than aluminium for the same strength, won't rust in outdoor humidity, and the telescoping joints lock smoothly even after 100+ setups. Cheap plastic pole kits crack at the joint after five roadshows.",
          ],
          side: {
            kind: 'pills',
            label: 'Size',
            items: [
              { text: '60×160cm', pop: true },
              { text: '80×180cm' },
              { text: '120×200cm' },
            ],
          },
        },
        {
          num: '02',
          title: 'Pole weight and balance — under 2kg, sets stable.',
          body: [
            "Weight is the whole point of an X-stand. Full kit (banner + poles + carry bag) sits **under 2kg** for the 80×180cm — one-handed carry from carpark to conference room, no weight distribution that throws your shoulder.",
            "Balance matters equally. The X-frame spreads load across four grounded points, not one fixed base. On uneven surfaces (event-floor cable covers, slightly warped venue carpet) the X-stand still reads vertical because each pole foot adjusts independently. Rollup banners fall over when one corner sits on a cable bump.",
          ],
          side: {
            kind: 'list',
            label: 'Format vs use',
            rows: [
              { text: 'Indoor conf', time: '60×160cm' },
              { text: 'Roadshow / booth', time: '80×180cm' },
              { text: 'Trade show hero', time: '120×200cm' },
              { text: 'Window display', time: '60×160cm' },
            ],
          },
        },
        {
          num: '03',
          title: 'Poster paper vs PVC canvas — pick by venue humidity.',
          body: [
            "**Poster paper** is the standard stock — sharp print, matt-laminated, flat-folds into the carry bag without creasing. Right call for indoor, air-conditioned venues — conferences, hotel ballrooms, showrooms.",
            "**PVC canvas** is the outdoor-and-humid-event call. Survives drizzle at an open-air roadshow, won't warp in the muggy tent of a Saturday market fair, rolls tighter than paper for travel. Pick PVC if the banner will live through weather or humidity. Pick poster paper if it lives indoors and the finish matters more than the weather-proofing.",
          ],
          side: {
            kind: 'stat',
            label: 'Full kit weight',
            num: '<2kg',
            caption: '80×180cm with poles and bag',
          },
        },
        {
          num: '04',
          title: "Setup time: why X-stand beats rollup for most teams.",
          body: [
            "A rollup banner has a spring-loaded cassette that always wants to retract — fighting the spring during setup and teardown is the real tax of owning one. X-stands have no spring, no cassette, no retraction mechanism to break. Open, deploy, close, bag. **45 seconds each way.**",
            "Tradeoff: rollup banners are self-retracting and protect the print inside the cassette between uses. X-stand banners need careful rolling to avoid edge-creasing — which is why we ship with a **padded carry bag** with a banner-rolling sleeve inside. Follow the sleeve, no creasing. Skip it, you'll get one at the top corner.",
          ],
          side: {
            kind: 'quote',
            text: 'Switched from rollups to X-stands for our 12-person roadshow team. Setup time halved, no more broken springs.',
            attr: 'Field Marketing Lead, SG bank',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🎪', title: '45-second setup', desc: 'No spring cassette, no wrestling — open, hook, done in under a minute.' },
      { icon_url: null, emoji: '🪶', title: 'Under 2kg full kit', desc: 'Fibreglass poles, paper or PVC banner, carry bag — one-hand portable.' },
      { icon_url: null, emoji: '🌧️', title: 'PVC for outdoor', desc: 'Humidity and drizzle-proof canvas for open-air roadshows and markets.' },
      { icon_url: null, emoji: '🎒', title: 'Padded carry bag', desc: 'Banner-rolling sleeve prevents edge-creasing between events.' },
    ],
  },
];
