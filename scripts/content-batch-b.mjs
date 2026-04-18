// Batch B content — 9 products authored per product.
// Pure data. No side effects. Consumed by the applier script that
// writes into product_extras (matcher / seo_body / seo_magazine / how_we_print).

export const BATCH = [
  // ─────────────────────────── 1 · hand-fan ───────────────────────────
  {
    slug: 'hand-fan',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Every fan is event-graded.',
      right_note_body: 'Stick glued in a straight line, card stock that survives sweat.',
      rows: [
        {
          need: 'Your roadshow at *Bugis Junction* is this Saturday',
          pick_title: 'Round, 310gsm Art Card, 100pcs',
          pick_detail: 'From S$290 · 2–3 day production · wooden stick pre-assembled',
        },
        {
          need: 'You need *500 fans* for the National Day block party',
          pick_title: 'Round, 310gsm Art Card, 500pcs',
          pick_detail: 'From S$410 · bulk-assembled · same colour fan 1 to fan 500',
        },
        {
          need: 'It has to survive *three hours of outdoor heat* without warping',
          pick_title: 'Custom Shape, 500gsm Synthetic Card, 300pcs',
          pick_detail: 'From S$520 · waterproof synthetic · holds rigid in humid air',
        },
        {
          need: 'You want a *die-cut silhouette* that matches the brand mark',
          pick_title: 'Custom Shape, 500gsm Synthetic Card, 200pcs',
          pick_detail: 'From S$450 · any outline you draw · bleed lines pre-checked',
        },
        {
          need: 'Small GE event booth, *tight budget*, still looks proper',
          pick_title: 'Round, 310gsm Art Card, 100pcs, Plastic Stick',
          pick_detail: 'From S$285 · cheapest route · light to carry in bulk',
        },
      ],
    },
    seo_body:
      'Hand fan printing Singapore — custom shape die-cut, wooden or plastic handle, 310gsm art card, 500gsm synthetic for outdoor. Event-graded assembly, 2–3 day production for roadshows and GE rallies.',
    seo_magazine: {
      issue_label: 'Issue №01 · Hand Fan',
      title: 'Everything worth knowing,',
      title_em: 'before you fan out.',
      lede:
        'A branded hand fan is the only promo item people actually pocket at an outdoor booth in Singapore. The four things that decide whether it gets used all weekend or tossed by noon are the card stock, the shape, what the handle is made of, and how the print reads from two metres away.',
      articles: [
        {
          num: '01',
          title: 'Why 310gsm is the floor, and when to jump to 500gsm synthetic.',
          body: [
            'A hand fan on a 32°C afternoon at Gardens by the Bay gets flapped maybe 400 times in an hour. **310gsm art card** with matt lamination survives that — the edge stays crisp, the ink does not crack at the crease near the stick. Anything lighter curls within thirty minutes, and the audience reads a curled fan as cheap.',
            'If the event is longer than a day or the fan will travel in a goodie bag back to a humid HDB flat, spec **500gsm synthetic card** instead. It is waterproof, does not absorb perspiration from the palm, and still takes four-colour CMYK cleanly. The trade-off is cost — roughly 50% more per piece — but for a corporate anniversary handout it is worth the jump.',
          ],
          side: {
            kind: 'pills',
            label: 'Card stock',
            items: [
              { text: '310gsm art card', pop: true },
              { text: '500gsm synthetic' },
              { text: 'Matt lam default' },
              { text: 'Gloss on request' },
            ],
          },
        },
        {
          num: '02',
          title: 'Round versus die-cut — what the shape actually buys you.',
          body: [
            'A round fan is the default because the cutting die is already set up. It is the cheapest route and still looks tidy when 500 of them are fanned out on a welcome table. The reason to pay extra for a **custom die-cut shape** is visibility from across a venue — a mascot silhouette, a bottle outline, a logo mark cut into the body of the fan itself.',
            'What people get wrong is drawing a shape with thin protrusions — cat ears, antenna, narrow handles sticking out. Anything under **5mm wide** snaps off when someone flicks the fan. We pre-check every custom outline for weak necks before the plotter runs, and thicken them with your permission so the fan survives a full afternoon of use.',
          ],
          side: {
            kind: 'list',
            label: 'Shape by event',
            rows: [
              { text: 'Generic booth', time: 'Round' },
              { text: 'Branded mascot', time: 'Custom die-cut' },
              { text: 'Religious festival', time: 'Round + foil' },
              { text: 'Product launch', time: 'Custom die-cut' },
            ],
          },
        },
        {
          num: '03',
          title: 'Wooden stick, plastic stick, or no stick at all.',
          body: [
            '**Wooden sticks** feel better in the hand, do not slip when palms are sweaty, and photograph warmer. Cost is neutral in our pricing so the default is wood. The catch is bulk weight — 500 wooden-stick fans in a box is noticeably heavier when the marketing intern has to carry two boxes up the MRT stairs to the event venue.',
            '**Plastic sticks** shave a few cents per unit and drop weight meaningfully in large orders. They suit indoor giveaways where nobody is outdoors sweating on the handle. For religious festivals and temple distributions where the fan will be used in prayer halls, plastic holds up better to repeated wiping. Tell us the venue, we will spec the stick.',
          ],
          side: {
            kind: 'stat',
            label: 'Handle-glue hold',
            num: '48hr',
            caption: 'before the glue reaches final strength',
          },
        },
        {
          num: '04',
          title: 'Designing for a surface that will be in constant motion.',
          body: [
            'A fan is read while moving. That changes the design brief. Small body copy and thin sans-serif taglines smear into nothing when the fan is flapping — the audience sees a blur and reads nothing. Push the **logo to 40% of the fan face**, strip the copy to a single line of large type, and put the QR code on the back where a person holds the fan still to scan.',
            'Double-sided printing is free on our presses — the card takes ink on both faces. The front sells the brand. The back does the job — event date, QR, hashtag, booth number. Never split the logo across front and back hoping both faces read. Commit to one face per message.',
          ],
          side: {
            kind: 'quote',
            text: 'We ordered 300 fans for the CNY mall activation. Every one of them went home with a customer — none left in the bin.',
            attr: 'Marketing Lead, SG mall tenant',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🪭', title: 'Straight-glued sticks', desc: 'Handle aligned to the centre axis — no drift, no wobble when the fan is flapped.' },
      { icon_url: null, emoji: '✂️', title: 'Custom die-cut ready', desc: 'Any outline you can vector. Weak-neck areas flagged before the plotter runs.' },
      { icon_url: null, emoji: '💦', title: '500gsm synthetic stock', desc: 'Waterproof option for outdoor heat, humid air, and sweaty palms.' },
      { icon_url: null, emoji: '📦', title: 'Event-pack ready', desc: 'Bulk-boxed by 100s, fan face protected, stick down — grab and distribute.' },
    ],
  },

  // ─────────────────────────── 2 · hang-tag ───────────────────────────
  {
    slug: 'hang-tag',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Every tag ships with string.',
      right_note_body: 'Hole pre-punched, twine or ribbon threaded — ready for the shop floor.',
      rows: [
        {
          need: 'Your *capsule drop* hits the shelf next Monday',
          pick_title: '55×90mm, 350gsm Art Card, Matt Lam, Twine',
          pick_detail: 'From S$80 · 2 day production · twine pre-threaded',
        },
        {
          need: 'You run a *kopitiam food brand* — tag every jar in the range',
          pick_title: '60×90mm, Kraft Paper, No Lam, Twine',
          pick_detail: 'From S$100 · uncoated kraft feel · takes a handwritten addition',
        },
        {
          need: 'Boutique wants tags that survive *months on a rack*',
          pick_title: '60×90mm, 400gsm Art Card, Matt Lam, Ribbon',
          pick_detail: 'From S$130 · heavy stock, no curl · ribbon colour to match brand',
        },
        {
          need: 'Luxury line, the tag is *part of the unboxing*',
          pick_title: '60×90mm, 400gsm Art Card, Foil + Matt, Ribbon',
          pick_detail: 'From S$280 · gold foil logo · heavy card, ribbon-threaded',
        },
        {
          need: '*Market stall*, simple tags, small run',
          pick_title: '55×90mm, 350gsm Art Card, Matt Lam, No String',
          pick_detail: 'From S$80 · cheapest route · punch your own hole if you change your mind',
        },
      ],
    },
    seo_body:
      'Hang tag printing Singapore — 350gsm or 400gsm art card, kraft paper, matt or gloss lam, spot UV, foil, twine or ribbon included. Die-cut shapes, reinforced eyelet option, 2 day production for boutique retail and F&B.',
    seo_magazine: {
      issue_label: 'Issue №01 · Hang Tag',
      title: 'Everything worth knowing,',
      title_em: 'before you tag it.',
      lede:
        'A hang tag is the last thing a customer touches before they decide to buy or put it back. That final-inch moment is where weight, string choice, hole reinforcement, and finish decide whether the product reads as premium or as pasar malam. Four details do most of the lifting.',
      articles: [
        {
          num: '01',
          title: 'Why 350gsm is the polite floor and 400gsm is the flex.',
          body: [
            'At **350gsm art card** a hang tag already feels substantial — thicker than a name card, audible when it thuds onto glass. That is the correct weight for most retail tags, and it is what we default to unless the brief says otherwise. Nothing below this passes a boutique-rack test because thinner stock dog-ears in the first week.',
            'Jump to **400gsm** when the tag is the unboxing moment on a luxury item, or when the retailer expects it to survive months of customer handling. The difference between 350 and 400 is small on paper but obvious when you flex one in each hand. Customers notice without knowing why — the tag reads as if it costs more than the dollar of card it is made from.',
          ],
          side: {
            kind: 'pills',
            label: 'Stock weight',
            items: [
              { text: '350gsm (default)', pop: true },
              { text: '400gsm (luxury)' },
              { text: 'Kraft (rustic)' },
              { text: 'No laminate option' },
            ],
          },
        },
        {
          num: '02',
          title: 'Twine, ribbon, or let the retailer string it themselves.',
          body: [
            '**Twine** is the SG default — neutral, rustic, goes with kraft and white card, costs us nothing extra. It suits F&B, artisanal jars, farmer-market stalls, and most capsule apparel drops. **Ribbon** is the upgrade when the brand lives in pastels, florals, or bridal territory — we stock satin in several widths and match the colour to your brand sheet if you specify.',
            'The third option is **no string** — cheaper, faster to ship flat-pack, and some retailers prefer to thread their own in-house to match a specific collection. We still pre-punch the hole cleanly and can add a metallic eyelet so the hole does not tear when the tag is pulled. Tell us upstream if the retailer will thread on their side.',
          ],
          side: {
            kind: 'list',
            label: 'String pairings',
            rows: [
              { text: 'Kraft card', time: 'Natural twine' },
              { text: 'White art card', time: 'Twine or ribbon' },
              { text: 'Foil-stamped premium', time: 'Satin ribbon' },
              { text: 'Retailer threads', time: 'No string' },
            ],
          },
        },
        {
          num: '03',
          title: 'The hole is where cheap tags fail — and how to fix it.',
          body: [
            'A hang tag hole is under tension every time the garment is tried on. The card tears at the **hole rim** first, then the tag falls off the rack, then the SKU is unbranded on the floor. On **kraft** this happens faster because kraft fibres are longer and weaker at the cut edge. On **400gsm art card** it happens slower but still happens.',
            'The fix is a **metal eyelet** set through the hole, or a reinforced die-punched hole that leaves at least 4mm of card between the hole edge and the card edge. We default to 5mm and will not cut closer without a reason. If the brief has the hole sitting close to the edge for aesthetic reasons, tell us, and we will spec the eyelet so the tag survives the shop floor.',
          ],
          side: {
            kind: 'stat',
            label: 'Edge-to-hole clearance',
            num: '5mm',
            caption: 'minimum before we add an eyelet',
          },
        },
        {
          num: '04',
          title: 'Foil, spot UV, or leave it alone — the retail-read question.',
          body: [
            '**Spot UV** is glossy clear lacquer applied only on the logo. Under shop floor lighting it catches the eye without changing colour. It is the cheap-and-deadly premium signal for a tag — adds roughly 20 cents a piece and instantly makes a 350gsm tag read as 400. Works best over matt lamination, where the contrast between matte card and glossy logo is highest.',
            '**Gold or silver foil** is the upgrade for luxury SKUs. It is applied by heat-stamp, sits physically on the card surface, and catches light like a watch face. Expensive per piece, cheap per impression — a foil tag stays with the buyer long after the product is unwrapped. Reserve foil for items priced over S$80 where the buyer will read it as proportionate.',
          ],
          side: {
            kind: 'quote',
            text: 'We added spot UV to the new season tags and got asked three times at the launch if we had rebranded.',
            attr: 'Brand Owner, local streetwear',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🔖', title: 'Reinforced eyelet option', desc: '5mm minimum edge-to-hole on every tag — metal eyelet when the hole runs close.' },
      { icon_url: null, emoji: '🪡', title: 'String pre-threaded', desc: 'Twine or ribbon threaded and knotted — the tag lands ready for the rack.' },
      { icon_url: null, emoji: '✨', title: 'Spot UV over matt', desc: 'Matt lam for the base, glossy lacquer on the logo — premium without the foil budget.' },
      { icon_url: null, emoji: '🎁', title: 'Die-cut shape library', desc: 'Beyond rectangles — arched, scalloped, shield, custom — all pre-pressed for clean edges.' },
    ],
  },

  // ─────────────────────────── 3 · letterhead ───────────────────────────
  {
    slug: 'letterhead',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Every sheet lies flat.',
      right_note_body: 'Short-grain stock, print in the right direction so it feeds clean.',
      rows: [
        {
          need: 'Your firm sends *formal letters weekly* — partners sign in ink',
          pick_title: 'A4, 100gsm Premium, 2000 sheets',
          pick_detail: 'From S$180 · 3 day production · ballpoint and fountain tested',
        },
        {
          need: 'HR prints *offer letters in bulk* every quarter',
          pick_title: 'A4, 100gsm Premium, 5000 sheets',
          pick_detail: 'From S$270 · year-supply in one run · price-per-sheet drops',
        },
        {
          need: 'Letters are *filed for years* — need to stay white, not yellow',
          pick_title: 'A4, 120gsm Letterhead Bond, 3000 sheets',
          pick_detail: 'From S$420 · acid-free bond · archive-grade stock',
        },
        {
          need: 'Boutique practice, heavy *desk presence*, clients notice',
          pick_title: 'A4, 120gsm Letterhead Bond, 2000 sheets',
          pick_detail: 'From S$320 · heavier hand-feel · watermark option available',
        },
        {
          need: '*Internal memos*, printed in volume, budget tight',
          pick_title: 'A4, 80gsm Office Paper, 3000 sheets',
          pick_detail: 'From S$350 · runs through any office MFP · cheapest per sheet',
        },
      ],
    },
    seo_body:
      'Letterhead printing Singapore — A4, 80gsm office, 100gsm premium, 120gsm bond, watermark option. Corporate stationery for law firms, clinics and partnerships, 3 day production, matching envelope system available.',
    seo_magazine: {
      issue_label: 'Issue №01 · Letterhead',
      title: 'Everything worth knowing,',
      title_em: 'before you write.',
      lede:
        'A letterhead is judged in the three seconds it takes a client to unfold it on their desk. Four things decide that read — the paper weight, whether the nib skips, how the sheet behaves in a standard office MFP, and whether it matches the envelope it arrived in. Here is the plain version.',
      articles: [
        {
          num: '01',
          title: 'Why 100gsm is the right weight, and when 120gsm earns its keep.',
          body: [
            'A standard office printer handles **100gsm** without complaint — that is the weight of most premium writing paper, heavy enough to feel like correspondence, thin enough to fold cleanly into a DL envelope without a ridge. Anything at **80gsm** reads as internal memo the moment the recipient touches it. Not wrong, just not a letter.',
            'Step up to **120gsm Letterhead Bond** when the sheet is going to sit on a client desk or be filed for years. Bond stock is acid-free — it does not yellow around the edges in the way cheap office paper does after eighteen months. The hand-feel is noticeably stiffer. Good for law firms, clinics, private practices, and anywhere the document is treated as a record rather than a message.',
          ],
          side: {
            kind: 'pills',
            label: 'Paper by role',
            items: [
              { text: '80gsm — internal', pop: false },
              { text: '100gsm — correspondence', pop: true },
              { text: '120gsm — archive' },
              { text: 'Watermark on request' },
            ],
          },
        },
        {
          num: '02',
          title: 'The nib test — what ink does to your letterhead.',
          body: [
            'If partners sign in ink, the paper matters more than most print buyers realise. **Ballpoint** survives on almost anything. **Gel pens** feather on 80gsm office paper but sit cleanly on 100gsm uncoated. **Fountain pens** bleed through anything coated — gloss art paper, matt lam, anything with a surface film — and only behave on uncoated bond.',
            'We stock **uncoated 100gsm and 120gsm bond** specifically because they take fountain-pen ink cleanly. If your firm signs formally, spec bond and skip the laminate. If the letterhead is purely for laser output with a printed signature block, the 100gsm premium uncoated is the default — dry ink never bleeds through.',
          ],
          side: {
            kind: 'list',
            label: 'Pen compatibility',
            rows: [
              { text: 'Ballpoint', time: 'Any stock' },
              { text: 'Gel pen', time: '100gsm+' },
              { text: 'Fountain pen', time: 'Uncoated bond' },
              { text: 'Printed signature', time: 'Any stock' },
            ],
          },
        },
        {
          num: '03',
          title: 'Grain direction — why the office printer jams.',
          body: [
            '**Paper grain** runs along the fibres laid down during manufacture. When the grain is parallel to the feed direction of your office MFP, sheets glide through and stack neatly. When it is perpendicular, sheets curl at the leading edge, double-feed, and jam at volume. Cheap printers will not tell you this — your IT admin will blame the driver.',
            'Letterhead sits in printer trays for weeks and gets fed in batches of fifty. We cut every run with **grain long** for A4, which is the SG office standard and matches Ricoh, Canon, HP, and Epson paper-path assumptions. If you print from an unusual machine, tell us the make — we can invert the grain on request.',
          ],
          side: {
            kind: 'stat',
            label: 'MFP jam rate',
            num: '~0',
            caption: 'when grain is aligned to feed',
          },
        },
        {
          num: '04',
          title: 'Matching envelopes — the full stationery system.',
          body: [
            'A letterhead that arrives in an unbranded DL envelope is a half-finished system. The recipient reads the envelope first. Matching the **envelope stock to the letterhead** — same shade of white, same weight family, same logo treatment — turns a letter into a piece of identity that travels the whole postal journey.',
            'We run DL and C5 envelopes off the same paper family and can print the return address on the flap or the face. For law firms and clinics that send formal correspondence weekly, we batch envelope and letterhead together so the two sheets leave the same factory on the same day. Nothing looks worse than a crisp letterhead in a yellowing envelope from a different supplier.',
          ],
          side: {
            kind: 'quote',
            text: 'Clients started commenting on the envelopes — which means they are reading everything we send now.',
            attr: 'Partner, SG boutique law firm',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '📄', title: 'Grain-long cut', desc: 'A4 cut along the feed direction — sheets stack flat and feed clean through office MFPs.' },
      { icon_url: null, emoji: '🖋️', title: 'Fountain-pen safe', desc: 'Uncoated bond options that take gel and fountain-pen ink without feathering or bleed.' },
      { icon_url: null, emoji: '💧', title: 'Watermark option', desc: 'Embedded watermark available on 120gsm bond — visible when held to light.' },
      { icon_url: null, emoji: '✉️', title: 'Envelope matching', desc: 'DL and C5 envelopes printed on the same paper family so the set arrives as one identity.' },
    ],
  },

  // ─────────────────────────── 4 · life-size-standee ───────────────────────────
  {
    slug: 'life-size-standee',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Every standee ships flat.',
      right_note_body: 'Base slot laser-cut, stands without tools — no screws, no glue on site.',
      rows: [
        {
          need: 'Your *K-pop meet-and-greet* lands this weekend',
          pick_title: '160cm Height, Matt Lamination, 1pc',
          pick_detail: 'From S$120 · 2–3 day production · fan-photo ready',
        },
        {
          need: 'Mall roadshow, *5 brand ambassadors*, identical cutouts',
          pick_title: '180cm Height, Matt Lamination, 5pcs',
          pick_detail: 'From S$728 · colour-matched across the set · flat-pack transport',
        },
        {
          need: 'Will stand in a *sun-lit atrium* for three weeks',
          pick_title: '180cm Height, Matt Lamination, 1pc',
          pick_detail: 'From S$150 · matt kills glare · heavy base, no tipping',
        },
        {
          need: 'Brand launch *feature piece* — has to photograph well',
          pick_title: '180cm Height, Gloss Lamination, 1pc',
          pick_detail: 'From S$150 · punchy colour on camera · ring-light friendly',
        },
        {
          need: '*Kiasu retail*, one cutout for the window, minimum spend',
          pick_title: '160cm Height, Matt Lamination, 1pc',
          pick_detail: 'From S$120 · cheapest height · still reads as life-size',
        },
      ],
    },
    seo_body:
      'Life size standee printing Singapore — 160cm or 180cm human cutout, matt or gloss lamination, flat-pack transport, laser-cut base slot. Mall roadshow, K-pop fan-meet, brand ambassador cutouts, 2–3 day production.',
    seo_magazine: {
      issue_label: 'Issue №01 · Life Size Standee',
      title: 'Everything worth knowing,',
      title_em: 'before you cut it out.',
      lede:
        'A life-size cardboard cutout is the only display in a mall atrium that gets photographed without being asked to. Four decisions decide whether it stops foot traffic for a week or buckles on day three — the board stiffness, the cutout complexity, the base design, and how flat-pack it ships into the venue.',
      articles: [
        {
          num: '01',
          title: 'Rigidity — why 5mm foam is the floor in a mall atrium.',
          body: [
            'A **5mm PVC foamboard** holds its own plumb in a mall with aircon currents and foot traffic brushing past. Anything thinner flexes at the waist and starts to lean by the afternoon of day one. At **180cm height** the board does not stand on its own — the entire weight of the panel is borne by a slotted base, and a floppy panel wrenches the base out of shape inside a day.',
            'We only print life-size standees on rigid PVC foamboard with a matched-strength base of the same material. The panel is cut oversize at the feet to give the base slot grip. The result holds up to a ten-day activation and packs down to a flat 5mm again when the run ends. Cheaper shops cut on cardboard — it warps in humidity and tears at the slot within a weekend.',
          ],
          side: {
            kind: 'pills',
            label: 'Board spec',
            items: [
              { text: '5mm PVC foam', pop: true },
              { text: 'Laminated face' },
              { text: 'Laser-cut contour' },
              { text: 'No cardboard' },
            ],
          },
        },
        {
          num: '02',
          title: 'Cutout complexity — where the design fights the plotter.',
          body: [
            'A life-size cutout with a simple silhouette cuts in twenty minutes. One with **flyaway hair, extended fingers, a prop held at arm\'s length** takes longer and risks breaking at the weak necks. The bits that snap are always the same — strands of hair thinner than 8mm, microphones on skinny stems, loose jackets flapping off the body line.',
            'Send the source file with the cutout path on a separate layer and we will review it before the plotter runs. Where a weak neck will snap in transport or handling, we propose a **path compromise** — merging a microphone stem with the hand, or removing a stray hair strand that reads as noise at two metres. The audience never notices the edit. They would notice a snapped mic.',
          ],
          side: {
            kind: 'list',
            label: 'Cutout rules',
            rows: [
              { text: 'Thin hair strand', time: '8mm minimum' },
              { text: 'Held prop', time: 'Attach to body' },
              { text: 'Finger silhouette', time: 'Keep closed' },
              { text: 'Background lift', time: 'Merge to outline' },
            ],
          },
        },
        {
          num: '03',
          title: 'The base slot — what holds a 180cm panel upright.',
          body: [
            'The **laser-cut base slot** is the only thing between the standee and the floor. Get the slot tolerance wrong by a millimetre and the panel wobbles all day. Get it right and the cutout stands without screws, without tape, without anyone having to hold it while the activation staff rigs the rest of the booth.',
            'Our base is cut with a **1mm interference fit** — the panel slides in with a firm push and stays put without glue. For an atrium with air-con down-blasts, we supply a second foot piece that cross-braces the slot and adds weight at the base. No tools on site. Two people can walk a 180cm standee into place in under a minute.',
          ],
          side: {
            kind: 'stat',
            label: 'Slot fit tolerance',
            num: '1mm',
            caption: 'interference — firm push, no glue',
          },
        },
        {
          num: '04',
          title: 'Flat-pack transport and how five standees fit in a Grab XL.',
          body: [
            'A 180cm standee is five feet eleven of panel on a panel that is only 5mm thick. Vertical in a van, it scratches every time the driver brakes. The fix is a **corner-protected flat-pack** — we slide each standee into a foam-edged sleeve, stack them horizontally on a pallet or in a vehicle, and the foam absorbs the contact.',
            'Five 180cm standees ship flat in the back of a Grab XL or a small logistics van. Ten ship in a single delivery pallet. The laminated face means the cutout survives light rain on the way into the venue — do not leave them out overnight, but an ad-hoc dash from the loading bay to the atrium in Singapore drizzle is fine.',
          ],
          side: {
            kind: 'quote',
            text: 'Our mall run had five standees across two weekends. Same Grab XL delivery both weekends — they pack flat.',
            attr: 'Events Manager, FMCG brand',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🪵', title: '5mm PVC foamboard', desc: 'Rigid panel that holds plumb in mall aircon currents — no cardboard sag.' },
      { icon_url: null, emoji: '🔪', title: 'Laser-cut contour', desc: 'Your silhouette, plotter-cut. Weak-neck alerts before we run the file.' },
      { icon_url: null, emoji: '🦵', title: 'Slot-in base', desc: 'Laser-cut base fits without glue or tools — stands in a minute, packs down to 5mm.' },
      { icon_url: null, emoji: '📦', title: 'Flat-pack sleeved', desc: 'Foam-edged sleeves for transport. Five 180cm standees in a Grab XL, no scuffs.' },
    ],
  },

  // ─────────────────────────── 5 · long-brochures ───────────────────────────
  {
    slug: 'long-brochures',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Every fold is scored first.',
      right_note_body: 'Score lines crease clean — no cracked ink, no fraying edge at the gutter.',
      rows: [
        {
          need: 'Your *property launch* in two weeks needs a DL handout',
          pick_title: 'A4 Base, Tri-fold, 157gsm Art Paper, 500pcs',
          pick_detail: 'From S$450 · 3–4 day production · 6-panel standard fit',
        },
        {
          need: 'Clinic wants *service menus* for waiting-room display racks',
          pick_title: 'A4 Base, Bi-fold, 128gsm Art Paper, 1000pcs',
          pick_detail: 'From S$480 · 4-panel simple read · fits standard display rack',
        },
        {
          need: 'Event *programme sheet* with a long schedule',
          pick_title: 'A3 Base, Z-fold, 157gsm Art Paper, 2000pcs',
          pick_detail: 'From S$880 · 6 panels wider · accordion reveal for the agenda',
        },
        {
          need: 'Hotel *in-room information* — stays on the desk for weeks',
          pick_title: 'A3 Base, Tri-fold, 157gsm Art Paper, 1000pcs',
          pick_detail: 'From S$580 · heavier stock, no limp fold · reads like a map',
        },
        {
          need: '*Tight budget* mailer insert, volume order',
          pick_title: 'A4 Base, Bi-fold, 128gsm Art Paper, 3000pcs',
          pick_detail: 'From S$750 · cheapest route at volume · mailbox-friendly DL',
        },
      ],
    },
    seo_body:
      'Long brochure printing Singapore — DL tri-fold, bi-fold, Z-fold, A4 or A3 base, 128gsm or 157gsm art paper. Property launch handout, clinic service menu, event programme, 3–4 day production with scored fold lines.',
    seo_magazine: {
      issue_label: 'Issue №01 · Long Brochures',
      title: 'Everything worth knowing,',
      title_em: 'before you fold.',
      lede:
        'A DL brochure lives or dies at the fold. Crack the ink at the crease, align the panels 2mm off, or pick the wrong fold for the content, and the whole piece reads as amateur. Four details — fold mechanics, grain direction, panel economics, and readable panel order — do the heavy lifting.',
      articles: [
        {
          num: '01',
          title: 'Bi-fold, tri-fold, Z-fold — which fold fits the story.',
          body: [
            '**Bi-fold** gives you four panels and a clean double-page spread inside. Best for clinic menus, product one-sheets, and anything where the content wants to breathe. **Tri-fold** gives six panels in a sequential reveal, with a front flap that opens to the inside panels — ideal for a property brochure or a service list where the reader works panel by panel.',
            '**Z-fold** also gives six panels but folds in an accordion — each panel reveals the next, no front flap hiding the content. It is the right fold for an event schedule, a timeline, or a map that unfolds into a full A3 sheet. Pick Z-fold when the reader is expected to lay the brochure flat on a table. Pick tri-fold when it stays in a display rack.',
          ],
          side: {
            kind: 'pills',
            label: 'Fold by content',
            items: [
              { text: 'Bi-fold — menu', pop: false },
              { text: 'Tri-fold — property', pop: true },
              { text: 'Z-fold — schedule' },
              { text: 'A3 base for maps' },
            ],
          },
        },
        {
          num: '02',
          title: 'Grain direction — why cheap brochures crack at the fold.',
          body: [
            'Paper has a **grain** running along the long fibre axis. Fold parallel to the grain and the crease is clean. Fold across the grain and the ink cracks along the fold line — a white hairline visible against solid colour backgrounds. This is why some supermarket flyers look cheap even with nice art direction: the grain is wrong.',
            'We orient every long brochure so the fold runs **parallel to the paper grain** and add a **scoring pass** on anything 128gsm and above. Scoring is a pre-crease that breaks the paper fibre in a controlled line, so the fold happens exactly where intended without stress on the surrounding ink. No cracked edges, no fraying at the gutter, even on deep colour fields.',
          ],
          side: {
            kind: 'list',
            label: 'Fold prep',
            rows: [
              { text: '128gsm', time: 'Scored + folded' },
              { text: '157gsm', time: 'Scored + folded' },
              { text: 'Grain direction', time: 'Parallel to fold' },
              { text: 'Ink at crease', time: 'Handled in scoring' },
            ],
          },
        },
        {
          num: '03',
          title: 'Panel count — where the price breaks are real.',
          body: [
            'Adding panels does not add cost linearly. The jump from **bi-fold (4 panels)** to **tri-fold (6 panels)** costs roughly 5 cents per piece on our press because it is the same sheet and the same ink, just one more fold. The jump from A4 base to A3 base costs more — the sheet itself is bigger and uses more paper per piece.',
            'At **500 to 1000 pieces** the economics favour going wider — tri-fold on A4 at 1000pcs is the sweet spot where unit cost collapses. At **3000 pieces and above** bi-fold A4 on 128gsm wins on pure budget. Most briefs want more panels than the content needs; look at the panel count honestly, and you might find three panels of content in a five-panel layout.',
          ],
          side: {
            kind: 'stat',
            label: 'Bi to tri-fold',
            num: '+5¢',
            caption: 'per piece at standard runs',
          },
        },
        {
          num: '04',
          title: 'Panel order — how a reader actually unfolds the brochure.',
          body: [
            'A tri-fold has a **front panel**, a **reveal panel** visible first when opened, and **four internal panels** seen when the brochure opens fully. Put your headline hook on the front. Put the hard sell on the reveal. Put the details inside. Most briefs reverse this, and the best content ends up on the back panel nobody unfolds.',
            'For a Z-fold, the reader sees the panels in accordion order — panel 1, panel 2, panel 3, and the whole thing unfolds to an A3 spread on panel 4–6. Design the front three panels for the hand-held skim, and the back three for the table-top deep read. We can print a dummy fold before the full run so you can hold the sequence and catch panel-order mistakes while the plate is still cheap to change.',
          ],
          side: {
            kind: 'quote',
            text: 'We caught the panel-order mistake on the dummy fold before we printed 3000 copies. Would have been a whole re-run.',
            attr: 'Marketing Lead, SG property agency',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '📐', title: 'Grain-aligned folds', desc: 'Paper oriented so every fold runs parallel to grain — no cracked ink at the crease.' },
      { icon_url: null, emoji: '〰️', title: 'Scored before folded', desc: 'Pre-score on 128gsm and up — crease happens exactly where intended, no fraying.' },
      { icon_url: null, emoji: '🧾', title: 'Dummy fold on request', desc: 'Hold a real fold in your hand before the 3000-copy run. Panel order caught before plates lock.' },
      { icon_url: null, emoji: '🎨', title: 'Panel-spread colour check', desc: 'Colour checked across the spread, not just per panel — no shift where two panels meet.' },
    ],
  },

  // ─────────────────────────── 6 · loose-sheets ───────────────────────────
  {
    slug: 'loose-sheets',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'No minimum order.',
      right_note_body: 'From 10 copies same-day, up to bulk overnight. Uncoated and coated on hand.',
      rows: [
        {
          need: 'You need *10 training handouts* for the 4pm session',
          pick_title: 'A4, 100gsm, Single Sided, 10pcs',
          pick_detail: 'From S$18 · same-day if by noon · runs on any office printer',
        },
        {
          need: 'Restaurant wants *table menus* with a specials update',
          pick_title: 'A4, 260gsm Art Card, Double Sided, 100pcs',
          pick_detail: 'From S$58 · stiff enough to survive spills · double-sided',
        },
        {
          need: 'Notice will be *on the wall for a month* — needs to hold',
          pick_title: 'A3, 200gsm, Single Sided, 50pcs',
          pick_detail: 'From S$42 · heavy stock, no curl · readable from across the room',
        },
        {
          need: '*Event programmes* for a product launch reception',
          pick_title: 'A4, 150gsm Premium, Double Sided, 200pcs',
          pick_detail: 'From S$78 · hand-feel above office copy paper · double-sided clean',
        },
        {
          need: 'You write on it with a pen — *annotations and notes*',
          pick_title: 'A4, 100gsm, Single Sided, 50pcs',
          pick_detail: 'From S$20 · uncoated, takes gel pen · cheapest writable stock',
        },
      ],
    },
    seo_body:
      'Loose sheet printing Singapore — A4, A5, A3, from 100gsm to 260gsm art card, single or double sided, uncoated or coated. No minimum order — 10 pieces same-day, bulk runs overnight. Inserts, notices, menus, handouts.',
    seo_magazine: {
      issue_label: 'Issue №01 · Loose Sheets',
      title: 'Everything worth knowing,',
      title_em: 'before you print one.',
      lede:
        'Loose sheets are the pragmatic workhorse of SG office and retail — training handouts, table menus, lift-lobby notices, event one-sheets. Four choices decide whether they do the job cleanly — paper weight, coated versus uncoated, short-run economics, and when double-sided is worth the extra cent.',
      articles: [
        {
          num: '01',
          title: 'Paper weight — when to stop using 80gsm office copy.',
          body: [
            'Office copy paper is **80gsm**. It is fine for internal memos read once and filed. The moment the sheet has to sit on a wall, sit on a table next to a drink, or be handed to a customer, **100gsm uncoated** is the minimum that does not read as cheap. The jump from 80 to 100 is invisible in cost and visible in hand-feel.',
            'Step to **150gsm premium** when the sheet is an event programme or a leave-behind at a client meeting. At **200gsm and 260gsm** the sheet is a card in everything but name — that is the right weight for a notice that lives on the wall for a month, or a restaurant table menu that takes coffee splashes without warping.',
          ],
          side: {
            kind: 'pills',
            label: 'Weight by role',
            items: [
              { text: '100gsm — handout', pop: true },
              { text: '150gsm — programme' },
              { text: '200gsm — notice' },
              { text: '260gsm — menu' },
            ],
          },
        },
        {
          num: '02',
          title: 'Coated versus uncoated — and the pen-on-paper test.',
          body: [
            '**Coated (art paper)** has a thin clay coating that holds ink on the surface. Colour pops. Photos look glossy. Gel pens skate across and do not write — the ink beads on the coating. **Uncoated (woodsfree)** lets the fibre breathe, accepts pen and pencil cleanly, and looks more textural. Colour is slightly duller but feels more considered.',
            'Rule of thumb: if the reader will write on it, go uncoated. If they will only read it, go coated for the colour punch. For a **training handout with spaces for notes**, uncoated 100gsm is the default. For a **menu with food photography**, coated 260gsm art card is the pick. Mixing these up is the single most common brief mistake we see.',
          ],
          side: {
            kind: 'list',
            label: 'Coating choice',
            rows: [
              { text: 'Write on it', time: 'Uncoated' },
              { text: 'Read only', time: 'Coated' },
              { text: 'Food photos', time: 'Coated' },
              { text: 'Fountain-pen notes', time: 'Uncoated only' },
            ],
          },
        },
        {
          num: '03',
          title: 'Short-run economics — why 10 copies can cost more than 100.',
          body: [
            'At **10 copies** the cost is dominated by setup — cutting, paper handling, plate alignment — not by the paper itself. Printing 10 A4 sheets and printing 100 A4 sheets are not ten times apart in price; they are closer to two times apart. The crossover is roughly at **50 copies**, after which unit cost starts to matter.',
            'This is why we do not set a minimum order. A same-day handout job at 10 copies is priced fairly — not as if you are buying a bulk run at bulk rates. If your brief needs flexibility — 10 today, 50 next week — tell us, and we will quote the short run at a rate that does not punish the small volume.',
          ],
          side: {
            kind: 'stat',
            label: 'Short-run floor',
            num: '10',
            caption: 'copies — no minimum, no surcharge',
          },
        },
        {
          num: '04',
          title: 'Double-sided — when the extra 5¢ per sheet pays off.',
          body: [
            'Double-sided adds roughly **5 cents per sheet** on our press. For a notice that is content-light, single-sided is fine — the back is wasted whitespace on a wall. For a **training handout, restaurant menu, or event programme**, the back is where the supporting content lives — appendix, QR code, schedule, dessert menu. Skipping it doubles the number of sheets needed.',
            'On **heavy stock (200gsm+)** double-sided is preferred anyway — single-sided heavy stock feels oddly unbalanced. At **100gsm uncoated** double-sided works but can show ghosting on deep solid colours; we test-print the back before the full run so you can confirm the bleed-through is acceptable.',
          ],
          side: {
            kind: 'quote',
            text: 'We print 80 programmes a week for different events. Same supplier, different paper every week — and it always just works.',
            attr: 'Venue Operations, SG lifestyle brand',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🪶', title: 'No minimum order', desc: 'Ten copies priced fairly, not as if you bought a bulk run at bulk rates.' },
      { icon_url: null, emoji: '⏱️', title: 'Same-day turnaround', desc: 'Files received before noon — loose sheets picked up or delivered same business day.' },
      { icon_url: null, emoji: '✍️', title: 'Uncoated for writing', desc: 'Gel and fountain-pen safe stock on hand — no ink beading, no bleed.' },
      { icon_url: null, emoji: '🔁', title: 'Double-sided bleed-test', desc: 'Back-face proof run on heavy solids — confirm ghosting before the full job.' },
    ],
  },

  // ─────────────────────────── 7 · luxury-business-card ───────────────────────────
  {
    slug: 'luxury-business-card',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Every card is pressure-checked.',
      right_note_body: 'Emboss depth, foil temperature, edge paint thickness — tested before the run.',
      rows: [
        {
          need: 'You want *the card that ends the meeting* on a good note',
          pick_title: '350gsm Grandeur White, Gold Hotstamp, Matt Lam',
          pick_detail: 'From quote · 5 day production · heavy-feel premium stock',
        },
        {
          need: 'Creative director, *personality card* for the portfolio drop',
          pick_title: '300gsm Pearlux White, Spot UV, Rounded R5',
          pick_detail: 'From quote · iridescent stock · spot UV on logo mark',
        },
        {
          need: 'Law partner upgrade — *conservative but unmistakably premium*',
          pick_title: '350gsm Grandeur White, Silver Hotstamp, No Lam',
          pick_detail: 'From quote · traditional hand-feel · silver on cream',
        },
        {
          need: 'Brand founder, *foil-and-emboss hero* for the launch',
          pick_title: '300gsm Shiruku Ivory, Rose Gold Hotstamp + Spot UV',
          pick_detail: 'From quote · dual-finish upgrade · kept in wallets not binned',
        },
        {
          need: 'Consultant sample, *small run to test the stock*',
          pick_title: '310gsm Art Card, Matt Lam, Rounded R3',
          pick_detail: 'From quote · cheapest route into luxury tier · 10pc minimum',
        },
      ],
    },
    seo_body:
      'Luxury business card printing Singapore — 310gsm to 350gsm Grandeur, Maple, Pearlux, Shiruku Ivory stock, gold/rose gold/silver hotstamp, spot UV, rounded corners. Foil-on-cotton premium cards, 5 day production.',
    seo_magazine: {
      issue_label: 'Issue №01 · Luxury Business Card',
      title: 'Everything worth knowing,',
      title_em: 'before you hand it over.',
      lede:
        'A luxury card is judged in three seconds — the weight in the palm, the texture under the thumb, the catch of light on the finish. Four decisions separate a genuine premium card from an art-card with lamination trying hard — the stock family, the foil versus emboss economics, edge treatments, and when double-sided is pointless.',
      articles: [
        {
          num: '01',
          title: 'Why stock weight is a lie — what actually matters is density.',
          body: [
            'Two 300gsm cards can feel completely different. **Grandeur White** at 350gsm is dense, snaps when you flex it, sits heavy in the hand. **Pearlux** at 300gsm is lighter by weight but iridescent under light, with a mother-of-pearl sheen that catches the eye at a dinner table. Weight alone does not tell you how the card is read.',
            'The stock families matter more than the GSM number. **Tangerine** is warm cream uncoated, feels like old bank notes. **Maple Bright** is crisp white with a soft tooth, suits minimalist marks. **Shiruku Ivory** is silk-finish off-white, flatters colour, hides fingerprints. Pick the family first, then the GSM — not the other way round.',
          ],
          side: {
            kind: 'pills',
            label: 'Stock character',
            items: [
              { text: 'Grandeur — heavy', pop: true },
              { text: 'Pearlux — iridescent' },
              { text: 'Shiruku — silk' },
              { text: 'Tangerine — warm cream' },
            ],
          },
        },
        {
          num: '02',
          title: 'Foil, emboss, deboss — three premium signals, three different costs.',
          body: [
            '**Gold hotstamp** is heat-stamped foil. The logo catches light like a watch face. Costs roughly S$0.70 per card at standard volumes — cheap per impression for a card kept in a wallet. **Spot UV** is glossy clear lacquer applied only on the logo — costs about half of foil and gives a tactile gloss against matt lamination.',
            '**Emboss and deboss** are pressure marks — no ink, just a physical impression. Deboss is cheaper and sinks the logo into the card. Emboss raises it. Both are luxurious in a way foil is not — subtle, understated, felt more than seen. At higher stock weights the impression depth is visible from the back of the card. We pressure-test every emboss die before the run to calibrate depth.',
          ],
          side: {
            kind: 'list',
            label: 'Finish economics',
            rows: [
              { text: 'Gold foil', time: '~S$0.70/card' },
              { text: 'Spot UV', time: '~S$0.30/card' },
              { text: 'Deboss', time: '~S$0.40/card' },
              { text: 'Emboss', time: '~S$0.50/card' },
            ],
          },
        },
        {
          num: '03',
          title: 'Edge painting — the detail most cards skip and everyone notices.',
          body: [
            '**Edge paint** is colour applied to the cut edge of the card — the thin face between front and back. On a 700gsm triplex card the edge is thick enough to hold a paint line of meaningful width. Red edges on a white card, black on cream, metallic on dark — it is the finish that says someone cared about the whole surface, not just the two faces.',
            'Edge painting only works on **triplex and quadplex stacks** — 500gsm and above. On a standard 310gsm card the edge is too thin to paint meaningfully. If the brief wants edge paint, spec the triplex upgrade first, then the paint colour. We hand-apply edge paint with a felt blade at the trimming stage so the colour stops exactly at the cut, no bleed onto the face.',
          ],
          side: {
            kind: 'stat',
            label: 'Edge-paint minimum',
            num: '500gsm',
            caption: 'stack thickness for a readable line',
          },
        },
        {
          num: '04',
          title: 'Double-sided — when to use the back, when to leave it blank.',
          body: [
            'On a luxury card, **blank backs are a statement**. The card is confident enough to not need to fill every surface. Designers of high-end perfumery and private banking cards lean blank-back on purpose. The recipient flips the card, sees nothing, and the card reads as having nothing to prove.',
            'Use the back when the content earns it — a second language (English front, Chinese back for SG dual-market), a QR code to a portfolio, an address block that does not fit on the face with the logo. What does not earn the back is social handles squeezed in at 6pt. If it is worth saying, it is worth saying at size. If it is not, leave the back blank and let the stock speak.',
          ],
          side: {
            kind: 'quote',
            text: 'The cards changed how my first meetings started — people would turn them over, see blank, and laugh. Then hand me one of theirs that looked plain.',
            attr: 'Founder, SG private wealth',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🥇', title: 'Foil pressure-tested', desc: 'Every die temperature-checked for clean stamp — no lift, no ghosting on heavy stocks.' },
      { icon_url: null, emoji: '🖇️', title: 'Stock family library', desc: 'Grandeur, Pearlux, Shiruku, Maple, Tangerine — hand-feel samples on request before order.' },
      { icon_url: null, emoji: '🎨', title: 'Edge paint by hand', desc: 'Triplex and quadplex edges painted with a felt blade — colour stops at the cut.' },
      { icon_url: null, emoji: '📐', title: 'Emboss depth check', desc: 'Deboss and emboss dies tested on scrap first — impression depth calibrated per stock weight.' },
    ],
  },

  // ─────────────────────────── 8 · money-packet ───────────────────────────
  {
    slug: 'money-packet',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Every packet CNY-stress-tested.',
      right_note_body: 'Fits SGD 2/10/50 notes flat, seals cleanly, foil survives the gift route.',
      rows: [
        {
          need: 'Your firm gives *ang baos to staff* this CNY — 500 packets',
          pick_title: '310gsm Art Card, Gold Foil, 500pcs',
          pick_detail: 'From S$455 · 5–7 day production · gold foil on red, premium standard',
        },
        {
          need: 'Bank distributes *to clients* — branding must read conservative-premium',
          pick_title: '300gsm Maple Bright, Gold Foil, 2000pcs',
          pick_detail: 'From S$745 · cream-toned stock · gold foil on a less-red ground',
        },
        {
          need: 'Retail chain, *3000 packets* across outlets',
          pick_title: '260gsm Art Card, Matt Lam, 3000pcs',
          pick_detail: 'From S$715 · cheapest route at volume · clean print, no foil',
        },
        {
          need: 'Luxury brand *hero packet* — kept in a drawer after CNY',
          pick_title: 'Metallic Paper, Gold Foil, 1000pcs',
          pick_detail: 'From S$385 · metallic base catches light · foil on metallic reads high-end',
        },
        {
          need: 'Family prints *personal packets* for the whole extended family',
          pick_title: '260gsm Art Card, Print Only, 500pcs',
          pick_detail: 'From S$235 · lowest minimum · dual language sets common',
        },
      ],
    },
    seo_body:
      'Money packet printing Singapore — custom red packets, 260gsm to 310gsm art card, metallic paper, gold foil, matt lamination, landscape and portrait. CNY ang bao for corporate, bank client, retail distribution with 5–7 day production.',
    seo_magazine: {
      issue_label: 'Issue №01 · Money Packet',
      title: 'Everything worth knowing,',
      title_em: 'before you fill it.',
      lede:
        'An ang bao is read on reception, kept in a drawer, reused next year, and seen across three CNY seasons. Four decisions make the difference between a packet that gets thrown after one use and one that stays in circulation — stock choice, the foil versus print question, dual-language layout, and the CNY production window that nobody plans for early enough.',
      articles: [
        {
          num: '01',
          title: 'Stock weight — why 260gsm is the floor and metallic earns its cost.',
          body: [
            'Below **260gsm** a money packet feels like a gift-shop freebie. The flap does not stay closed, the note visibly bends the card inside, and the whole packet reads as throwaway. 260gsm art card is the industry floor for corporate CNY packets and handles a flat SGD 50 note without flexing.',
            '**300gsm Maple Bright** is the sweet spot for bank and private-client packets — cream undertone reads less commercial than pure red stock, and the weight is noticeable. **Metallic paper** is a different conversation — the base stock itself catches light, so the packet reads as premium even before foil is added. Pair metallic with gold foil and you have a packet that lives in someone\'s drawer for years.',
          ],
          side: {
            kind: 'pills',
            label: 'Packet stock',
            items: [
              { text: '260gsm — volume', pop: false },
              { text: '310gsm — premium', pop: true },
              { text: '300gsm Maple — cream tone' },
              { text: 'Metallic — hero' },
            ],
          },
        },
        {
          num: '02',
          title: 'Gold foil versus print — when the premium upgrade earns its keep.',
          body: [
            'A four-colour print of gold ink reads as yellow-brown on red. It never reads as gold. The only way to get the metallic reflection that an ang bao tradition calls for is **real hotstamp foil** — a thin metallic film pressed onto the card with heat. It catches light, it looks like metal, and the recipient immediately reads the packet as proper.',
            'For corporate and bank packets foil is effectively mandatory. For retail or F&B giveaway packets at high volume the budget often does not stretch — in that case **matt lamination with a tight four-colour print** and a small gold foil accent on the logo alone is the compromise that reads fine at three steps back. What you cannot do is print the entire design in gold ink and expect it to pass.',
          ],
          side: {
            kind: 'list',
            label: 'Foil choices',
            rows: [
              { text: 'Corporate CNY', time: 'Full gold foil' },
              { text: 'Bank / private client', time: 'Full gold foil' },
              { text: 'Retail volume', time: 'Logo foil only' },
              { text: 'Family / personal', time: 'Print only fine' },
            ],
          },
        },
        {
          num: '03',
          title: 'Dual-language — why every packet needs to work in English and Chinese.',
          body: [
            'The recipients of an ang bao in SG span four generations and three languages. **Chinese characters** carry the blessing — 恭喜发财, 新年快乐, 大吉大利 — and are expected. English appears for the company name and any contemporary design language. The packet should feel balanced in both scripts, not like a translation job pasted onto the layout.',
            'The common mistake is making the English dominant and the Chinese an afterthought — or vice versa. We set dual-language layouts on a **baseline grid** that matches the character heights of Chinese to the cap-height of Latin, so the two scripts read as one system. For brands with no existing Chinese name, we help select a culturally sound rendering before the foil plate is cut.',
          ],
          side: {
            kind: 'stat',
            label: 'Proof turnaround',
            num: '24hr',
            caption: 'for dual-language layout review',
          },
        },
        {
          num: '04',
          title: 'The CNY production window — and why November is not early.',
          body: [
            'Every year the SG printing industry hits a wall around **mid-December**. Foil machine bookings fill up, specialty paper stocks sell out, and production queues run 14 days deep. By **late January** most printers have turned away all new CNY orders. The bands that get their packets by end-December are the ones who locked artwork in **early November**.',
            'We start taking CNY orders from **October** and prioritise the foil-and-metallic jobs first — they need the most machine time. If your packet needs gold foil, a metallic substrate, and 2000+ pieces, book it before the national broadcaster starts running CNY adverts. Leaving it to the post-Deepavali rush means paying expedite or settling for print-only.',
          ],
          side: {
            kind: 'quote',
            text: 'Last year we left it to December and got no foil slot. This year we locked artwork by late October — done by mid-December.',
            attr: 'Admin Lead, SG family office',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🧧', title: 'Gold foil hotstamp', desc: 'Real metallic foil — not gold ink. Reflects light the way an ang bao is meant to.' },
      { icon_url: null, emoji: '📏', title: 'SGD note test-fit', desc: 'Flap and pocket dimensioned for flat SGD 2/10/50 notes — no fold, no force.' },
      { icon_url: null, emoji: '漢', title: 'Dual-language grid', desc: 'Chinese and English set on matched baselines — not translated, composed.' },
      { icon_url: null, emoji: '📅', title: 'CNY calendar aware', desc: 'Foil machine booked from October — no expedite surprise in December.' },
    ],
  },

  // ─────────────────────────── 9 · mug ───────────────────────────
  {
    slug: 'mug',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Every mug dishwasher-tested.',
      right_note_body: 'Sublimation ink bonded at 200°C — survives daily washes without fading.',
      rows: [
        {
          need: 'Your *onboarding swag* for new hires arriving Monday',
          pick_title: '11oz Ceramic White, With Gift Box, 10pcs',
          pick_detail: 'From quote · 5 day production · boxed and ready to hand over',
        },
        {
          need: 'Corporate *100-person townhall* — one mug per attendee',
          pick_title: '11oz Ceramic White, With Gift Box, 100pcs',
          pick_detail: 'From quote · bulk-priced · colour-matched across the set',
        },
        {
          need: 'Coffee brand wants *retail stock* that survives daily use',
          pick_title: '15oz Ceramic White, No Box, 50pcs',
          pick_detail: 'From quote · larger volume for coffee · sublimation ink, dishwasher-safe',
        },
        {
          need: 'Executive gift — *colour-changing* mug as a novelty hero',
          pick_title: '11oz Black Color-Changing, With Gift Box, 25pcs',
          pick_detail: 'From quote · design reveals on hot pour · boxed premium',
        },
        {
          need: 'Bar launch, *beer mug giveaway* for opening week',
          pick_title: '20oz Frosted Glass Beer Mug, 30pcs',
          pick_detail: 'From quote · frosted glass, branded · fits standard bar pour',
        },
      ],
    },
    seo_body:
      'Mug printing Singapore — 11oz, 15oz ceramic, black patch, color-changing, 10oz and 20oz frosted glass beer mugs. Sublimation full-wrap print, dishwasher-safe, gift-boxed, 5 day production for corporate gifting and retail.',
    seo_magazine: {
      issue_label: 'Issue №01 · Mugs',
      title: 'Everything worth knowing,',
      title_em: 'before you fire.',
      lede:
        'A branded mug sits on a desk for years and becomes the highest-frequency brand touchpoint in any corporate gift programme. Four details decide whether it survives that distance — the print method, how it handles a dishwasher and a microwave, the handle-side alignment on a right-handed desk, and where bulk pricing actually breaks.',
      articles: [
        {
          num: '01',
          title: 'Sublimation versus direct print — why the difference is invisible until it fades.',
          body: [
            '**Dye sublimation** is the method that turns ink into gas under heat and bonds it into the ceramic glaze itself. The print is not on top of the mug — it is **inside the glaze**. That is why sublimated mugs survive the dishwasher, the microwave, and years of daily coffee. It is also why they cost a few dollars more per piece than the cheap mugs sold at mass bazaars.',
            '**Direct-print or pad-print** mugs have the ink sitting on the surface. They look identical on day one. They fade in the dishwasher by month three, scratch at the handle contact point by month six, and ghost around the logo by year one. Every mug we print is sublimated — the cheaper method is not on the menu, because the brand lives on the mug for years.',
          ],
          side: {
            kind: 'pills',
            label: 'Print method',
            items: [
              { text: 'Dye sublimation', pop: true },
              { text: '200°C heat bond' },
              { text: 'In-glaze, not on-top' },
              { text: 'No direct-print' },
            ],
          },
        },
        {
          num: '02',
          title: 'Dishwasher and microwave — what actually kills a mug.',
          body: [
            'A dishwasher cycle combines **hot water, alkaline detergent, and repeated thermal shock**. Ink on the surface gives up within three months. Ink bonded into the glaze lasts years. Microwave exposure is harsher than most people assume — the ceramic heats, the logo area heats slightly differently from the surrounding glaze, and a poorly bonded print cracks along that boundary.',
            'We spec **11oz and 15oz ceramic** stock from suppliers that certify dishwasher and microwave safety on the blank mug, then bond the sublimation print at 200°C for full in-glaze integration. We test a sample from every batch through a 30-cycle dishwasher run before the batch ships. If the logo ghosts in that test, the batch does not leave the factory.',
          ],
          side: {
            kind: 'list',
            label: 'Daily-life survival',
            rows: [
              { text: 'Dishwasher', time: 'Safe, sublimation' },
              { text: 'Microwave', time: 'Safe, sublimation' },
              { text: 'Oven', time: 'Not recommended' },
              { text: 'Freezer', time: 'Safe, warm gradually' },
            ],
          },
        },
        {
          num: '03',
          title: 'Handle-side alignment — the detail most gifts get wrong.',
          body: [
            'A right-handed desk user picks up a mug with the handle at **3 o\'clock**. The logo should be on the **front-facing side opposite the handle** so the brand is visible when the mug sits on the desk. If the artwork wraps or is placed at 9 o\'clock, the logo is hidden behind the handle every time the mug is set down — which is ninety-nine percent of the mug\'s waking hours.',
            'The exception is a **full-wrap design** that covers the entire circumference — in that case handle position is irrelevant and the design reads as continuous. For a logo-only or text-only brand mug, commit to handle-right alignment. We can also split the artwork into a left-side logo and a right-side QR for dual-handed users, but the default is right-handed because 88% of SG is right-handed.',
          ],
          side: {
            kind: 'stat',
            label: 'Logo face',
            num: '180°',
            caption: 'opposite the handle — default',
          },
        },
        {
          num: '04',
          title: 'Bulk pricing — where the real break happens.',
          body: [
            'At **1 to 5 mugs** the cost is dominated by the sublimation setup — heat press time, blank handling, the gift box if specified. The per-mug price is high because the setup overhead has nowhere to spread. At **25 mugs** the per-mug cost drops meaningfully. At **100 mugs** the batch run becomes efficient and unit cost compresses again.',
            'For corporate onboarding programmes that need 5 to 10 mugs a month, consider **batching quarterly** — order 30 at once, hold them in stock, and draw from the supply as hires arrive. The unit cost at 30 is roughly 40% lower than a 5-mug run ordered four separate times, and the blanks keep fine in a sealed box for months. We can hold stock on your behalf if warehouse is tight.',
          ],
          side: {
            kind: 'quote',
            text: 'We batch quarterly now — 30 mugs per order. New hire picks one up on day one instead of waiting two weeks.',
            attr: 'People Ops, SG tech scale-up',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '☕', title: 'Dye sublimation only', desc: 'In-glaze bond at 200°C — survives dishwashers, microwaves, and years of daily coffee.' },
      { icon_url: null, emoji: '🧽', title: '30-cycle wash test', desc: 'Sample from every batch through 30 dishwasher cycles before the batch ships.' },
      { icon_url: null, emoji: '🤏', title: 'Handle-right default', desc: 'Logo aligned opposite the handle so the brand faces out on every desk setdown.' },
      { icon_url: null, emoji: '📦', title: 'Batch hold option', desc: 'Order 30, draw 5 at a time — we can hold stock for quarterly onboarding programmes.' },
    ],
  },
];
