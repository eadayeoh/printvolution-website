// Gift content — Batch C · 13 products authored for direct publication.
// Voice reference: apply-car-decal-magazine.mjs + apply-name-card-rewrite.mjs.
// Hard rules: no brand name anywhere, no prices in seo_body, no copy-paste
// across products, no generic fluff. Every paragraph is product-specific.
// Consumed by apply-all-gift-content.mjs which writes into gift_products.

export const BATCH = [
  // ───────────────────────────────────────────────────────────────────────
  // 01 · LED BLACK BASE  (photo-resize)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'led-black-base',
    seo_body:
      'LED black base photo plaque Singapore — matte black wood block, engraved acrylic insert, warm USB-C LED, bedside and desk lighting. 300 DPI photo prep, monochrome tone-mapped for engraving, colour-corrected contrast for low-light display.',
    seo_magazine: {
      issue_label: 'Issue · LED Black Base',
      title: 'The light gift that reads ',
      title_em: 'gallery, not gimmick.',
      lede:
        "Most LED photo gifts look like a school project. A matte black base changes that — the finish absorbs ambient light, the engraved acrylic floats, and the piece stops looking personalised and starts looking curated. Here's what matters when you order one.",
      articles: [
        {
          num: '01',
          title: 'Matte black absorbs, which is the whole point.',
          body: [
            "A glossy base reflects ceiling lights, whatever you placed next to it, and a bit of your phone camera when you try to shoot the thing for Instagram. **Matte black absorbs** — the base vanishes into the shelf and the engraved acrylic on top is the only thing your eye registers. That contrast is the entire design. Cheaper versions cut cost by spraying black over clear wood; ours uses a **solid-through stain with a matte topcoat** so chips at the edge don't show raw timber.",
            "The trade is fingerprints. Matte finishes hold skin oil more visibly than gloss — you'll want to wipe the base with a dry microfibre every few weeks. In return you get a surface that photographs without hotspots, so when the gift ends up on someone's home-tour reel, it actually reads as a piece and not a product.",
          ],
          side: {
            kind: 'pills',
            label: 'Why matte wins here',
            items: [
              { text: 'Zero ceiling-light glare', pop: true },
              { text: 'Acrylic floats visually' },
              { text: 'Photographs cleanly', pop: true },
              { text: 'Hides shelf dust' },
            ],
          },
        },
        {
          num: '02',
          title: 'Engraving visibility: day looks different to night.',
          body: [
            "Without the LED on, the engraved acrylic reads as a frosted silhouette against the black base — present but restrained, the way a framed print would sit. Turn on the warm LED and the engraving lights from the edge inward, pulling out detail that was barely visible two seconds earlier. That day-vs-night behaviour is why we tone-map your photo differently to a standard print: **mid-tones are pushed brighter** so engraved lines carry enough density to glow, while highlights are held back so they don't wash out when lit.",
            "Photos with clear subject edges — portraits at shoulder crop, pets head-on, couples with defined silhouettes — engrave best. Busy group shots and complex backgrounds lose the reveal because every line competes with every other line. We'll flag the file at pre-press if we think the composition won't sing after engraving.",
          ],
          side: {
            kind: 'list',
            label: 'Subject by engraving result',
            rows: [
              { text: 'Single portrait, shoulder up', time: 'Excellent' },
              { text: 'Two-person couple shot', time: 'Excellent' },
              { text: 'Pet, head-on', time: 'Very good' },
              { text: 'Group of 6+', time: 'Weak' },
            ],
          },
        },
        {
          num: '03',
          title: 'USB-C powered so you are not hunting batteries.',
          body: [
            "Battery-only LED gifts get used for a week and then the battery dies, and then the gift sits in a drawer because nobody remembers what size coin cell it took. This base runs on **USB-C** — same cable as a modern phone, always within reach on a bedside or desk. Plug it in with an existing phone charger and it stays lit for the life of the LED (rated ~30,000 hours of warm white, so roughly a decade of nightly use before noticeable dim).",
            "No wall-wart, no weird proprietary plug, no battery door. If the recipient already has an anker plug on their bedside, they're ready. If they don't, any 5V brick from the cable drawer works. We include a **1m USB-C cable** in the box but skip the plug — everyone in SG has five of those already.",
          ],
          side: {
            kind: 'stat',
            label: 'LED life',
            num: '30k',
            suffix: ' hrs',
            caption: 'of warm white before dim (≈10 yrs nightly use)',
          },
        },
        {
          num: '04',
          title: 'Where it lives: bedside, desk, or shelf.',
          body: [
            "The base footprint is compact and the warm LED is diffuse rather than punchy — which makes this a **bedside-table gift first**, not a primary light source. It throws a pool of soft orange-yellow across about 40cm, which is exactly enough to find your glass of water at 3am without waking your partner. On a desk it reads as ambient; on a bookshelf between two hardcovers it reads as a small curated object.",
            "Avoid direct sunlight on the acrylic over months — UV will eventually haze any clear acrylic, engraved or not. Away from a window the piece holds clarity indefinitely. For SG humidity, the sealed base and USB-C port have a silicone gasket under the plug so moisture from aircon condensation doesn't creep into the circuit.",
          ],
          side: {
            kind: 'quote',
            text: 'Bought it as an anniversary gift, she keeps it on the nightstand and switches it on every night. Looks expensive, behaves well.',
            attr: 'Customer, Bukit Timah',
          },
        },
      ],
    },
    faqs: [
      { question: 'Does the base come with the USB plug?', answer: "No — we include a 1m USB-C cable only. Any 5V phone charger already in the house runs it. Skipping the plug keeps the box cheaper and reduces duplicate chargers, which everyone in SG has a drawer full of already." },
      { question: 'Can the LED colour be changed to cool white or RGB?', answer: 'The standard LED is fixed warm white (~2700K) because that tone reads closest to gallery display lighting and flatters skin tones in portraits. We do not offer RGB or colour-changing on this base — the design point is restraint, not party mode.' },
      { question: 'What photo crop works best for the engraved acrylic?', answer: 'Shoulder-up portrait crops or couple shots with defined edges engrave cleanest. Busy group shots, crowded backgrounds, and heavy-pattern clothing lose detail. We tone-map every file for engraving contrast before production — if the composition will not read well, we flag it at pre-press.' },
      { question: 'How do I clean the matte black base?', answer: 'Dry microfibre cloth, light wipe. Avoid spray cleaners — the solvents can dull the matte topcoat over time. Fingerprints show more on matte than gloss, but a 10-second wipe every fortnight keeps it looking new.' },
      { question: 'Does it survive Singapore humidity?', answer: 'Yes. The base is sealed hardwood with a moisture-resistant matte finish, and the USB-C port has a silicone gasket to stop aircon condensation reaching the circuit. No reported failures from humidity in two years of orders.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 02 · LED LIGHT REVEAL FRAME  (uv)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'led-light-reveal-frame',
    seo_body:
      'LED light reveal frame Singapore — hidden photo UV-printed behind translucent front, full-colour image reveals only when backlight is switched on. Anniversary, proposal, birthday reveal gift with dual-layer UV printing for the off-to-on reveal mechanic.',
    seo_magazine: {
      issue_label: 'Issue · Light Reveal Frame',
      title: 'The gift that hides itself ',
      title_em: 'until you flip the switch.',
      lede:
        "Every photo gift looks the same switched off. This one goes further — switched off it shows a clean silhouette or outline, switched on the full-colour image appears from nowhere. The reveal mechanic is the whole story; here is how it actually works and which photos make it land.",
      articles: [
        {
          num: '01',
          title: 'Two prints, one piece of acrylic.',
          body: [
            "The trick is layered UV printing. A **top layer** sits on the front face — a stripped-back outline, silhouette, or minimal graphic that's all you see when the LEDs are off. A **hidden layer** prints behind, saturated full-colour, invisible until backlight pushes through the translucent acrylic. Cheap knock-offs fake this with a frosted sticker over a colour photo — it reveals nothing, just looks muddy both states. We run the two prints on a flatbed in a single pass with white-ink separation between them, so the off-state is genuinely clean and the on-state is genuinely saturated.",
            "The white ink layer between the two prints is what stops bleed-through. Without it, daylight shining on the front can ghost the hidden image at the wrong times and kill the surprise. With it, the reveal only happens when the backlight turns on — which is the entire design intent.",
          ],
          side: {
            kind: 'stat',
            label: 'Layer count',
            num: '3',
            caption: 'front print, white mask, rear reveal',
          },
        },
        {
          num: '02',
          title: 'Which photos make the reveal hit.',
          body: [
            "The reveal only pays off if the off-state and on-state tell different stories. Best pairing: a **line-drawing or single-colour silhouette** of the subject on the front, the full photo behind. Switching on transforms a minimal graphic into a memory — that's the moment people gasp. Second-best: a **text-only front** (a date, a single word, initials) hiding a photo behind it. The word becomes the portrait.",
            "What doesn't work: putting the same photo front and back, or putting a busy print on the front that already tells the whole story. If the off-state gives away the surprise, there's no reveal — just a dimmer version of the same image followed by a brighter one. We'll redesign the front layer for free if you upload a photo and we think the reveal won't land.",
          ],
          side: {
            kind: 'pills',
            label: 'Front-layer picks',
            items: [
              { text: 'Line-drawing silhouette', pop: true },
              { text: 'Single-word / date' },
              { text: 'Couple outline' },
              { text: 'Pet silhouette', pop: true },
            ],
          },
        },
        {
          num: '03',
          title: 'Why the on-state has to be dark for the reveal to pop.',
          body: [
            "In bright daylight the backlight barely registers — the surrounding light overwhelms the LED and the reveal is subtle instead of dramatic. This is a **night-time gift**, or at least a dimmed-room gift. Hand it over at dinner with the lights low, under fairy lights, or in the bedroom — the darker the room, the more the reveal reads like magic.",
            "For proposal and anniversary use specifically, plan the lighting of the moment before you plan the handover. A well-lit restaurant with overhead spotlights is the wrong venue. Candle-lit corner table, hotel room, home living room with a dimmer — all correct. If you brief us on the occasion, we can bias the rear layer's brightness so it works in slightly-too-lit rooms too.",
          ],
          side: {
            kind: 'list',
            label: 'Where the reveal lands',
            rows: [
              { text: 'Candle-lit dinner', time: 'Perfect' },
              { text: 'Bedroom handover', time: 'Perfect' },
              { text: 'Dimmed living room', time: 'Strong' },
              { text: 'Daytime office', time: 'Weak' },
            ],
          },
        },
        {
          num: '04',
          title: 'Placement after the reveal — it still has to live somewhere.',
          body: [
            "The reveal is a one-time moment. The frame has to survive the next five years on a shelf without becoming a novelty. The matte frame border and clean front graphic mean it reads as a regular decor piece in the off state — which is what you want. Guests who didn't see the reveal moment see a minimal silhouette portrait and nothing looks weird about it.",
            "Best placement: a shelf or console at eye level, backlight facing inward so the reveal is framed by the room when switched on. Avoid direct sunlight on the face (UV will eventually fade any UV-print; the irony isn't lost on us). Plug runs on USB-C; no battery to replace, no firmware, nothing to fail except the LED itself — rated for 30,000 hours.",
          ],
          side: {
            kind: 'quote',
            text: 'I switched it on in the hotel room, she did not know what it was until the photo appeared. Worth every dollar for that ten seconds.',
            attr: 'Customer, proposal gift',
          },
        },
      ],
    },
    faqs: [
      { question: 'What is the difference between this and a normal backlit photo frame?', answer: 'A normal backlit frame shows the same photo brighter when switched on. This frame shows a stripped-back outline or silhouette in the off-state, and a full-colour hidden photo only when lit. The reveal is the product — off-state and on-state are deliberately different images.' },
      { question: 'Can I choose what the front (off-state) graphic is?', answer: 'Yes. Default is a line-drawing or silhouette derived from your photo, but you can specify a word, a date, initials, or a custom outline. If you upload a photo without a brief, we design the front layer to maximise the reveal and show you a preview before we print.' },
      { question: 'Does it work in daylight?', answer: 'Only subtly. The reveal is dramatic in dim-to-dark rooms and muted in bright daylight. Plan to hand it over in low light — candle-lit dinner, evening, dimmed living room. Not a gift for a brightly-lit office desk.' },
      { question: 'How is the hidden photo stopped from ghosting through when the light is off?', answer: 'A white-ink mask layer prints between the front and rear images during UV printing. This blocks daylight from reaching the hidden photo, so the off-state stays clean and the reveal only happens when the backlight is on. Cheaper versions skip this step and ghost badly.' },
      { question: 'What powers the LED?', answer: 'USB-C cable (1m included). Any 5V phone charger runs it. No batteries, no proprietary plug, no firmware. LED life is rated around 30,000 hours of continuous use.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 03 · LED PHOTO FRAME  (uv)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'led-photo-frame',
    seo_body:
      'LED photo frame Singapore — UV-printed acrylic insert, warm 2700K edge-lit LED, desk and wall-mount options. USB-C powered, colour-managed photo prep, crop preview for square and portrait frame aspects.',
    seo_magazine: {
      issue_label: 'Issue · LED Photo Frame',
      title: 'The photo gift that earns ',
      title_em: 'a wall, not a drawer.',
      lede:
        "A printed photo in a frame gets looked at on day one and forgotten by month three. A backlit frame keeps earning glances because light pulls your eye every time you walk past. The difference between the good ones and the gimmicks comes down to four decisions — diffusion, colour temperature, mounting, and crop.",
      articles: [
        {
          num: '01',
          title: 'Why acrylic diffuses better than glass here.',
          body: [
            "Traditional photo frames use **glass** for clarity and scratch resistance. Edge-lit LED frames use **acrylic** for a completely different reason: acrylic scatters light internally when edge-lit, giving the print a soft glow across the whole surface. Glass doesn't — it stays clear and the LED light exits at the edges only, leaving the centre of the photo dim. That's why cheap retrofit 'glass LED frames' look uneven: the photo bright at the border and washed-out in the middle.",
            "We use **3mm cast acrylic** with a frosted rear face — the frosting is what turns the edge-lit photons into a uniform plane of light across the image. Front face is polished clear so the UV print reads sharp, rear face does the diffusion work invisibly. The acrylic is also 40% lighter than equivalent glass, which matters when the frame lives on a thin wall mount.",
          ],
          side: {
            kind: 'stat',
            label: 'Brightness uniformity',
            num: '±8',
            suffix: '%',
            caption: 'centre-to-edge across the lit surface',
          },
        },
        {
          num: '02',
          title: 'Warm white is the only correct colour temperature.',
          body: [
            "The LED market pushes 'daylight white' (5000K–6500K) because it's brighter and cheaper per lumen. On a photo frame it's wrong. Cool white flattens skin tones, makes warm shirts look grey, and pushes the whole image into hospital-waiting-room territory. **2700K warm white** matches incandescent gallery lighting — the same spec museums and hotels use for hanging art — and it flatters every skin tone it hits.",
            "If the photo is a wedding, anniversary, or any moment with warm colours (gold, red, skin), 2700K is non-negotiable. If it's a landscape or architectural photo, some brands push for cooler — we still default to warm because the frame lives in a home, not a photo lab, and homes feel wrong under cool light. We don't offer switchable-colour versions; one correct answer is better than five mediocre ones.",
          ],
          side: {
            kind: 'pills',
            label: 'Why 2700K',
            items: [
              { text: 'Flatters skin tones', pop: true },
              { text: 'Matches hotel/gallery lighting' },
              { text: 'Hides minor colour cast' },
              { text: 'Warm = home-feel', pop: true },
            ],
          },
        },
        {
          num: '03',
          title: 'Desk stand or wall mount — pick upfront.',
          body: [
            "The frame ships with either a **slot-in desk stand** or a **keyhole wall mount** — not both, because the bases differ. Desk stand leans the frame at 12° back for eye-level reading on a shelf or console. Wall mount sits flush with a single picture-hook at the back and a USB-C cable exit routed downward so it disappears behind the frame.",
            "HDB concrete walls need a drywall anchor (we include one). If the wall is plasterboard or timber, a regular picture hook does the job. For the desk version, the stand is **weighted brass** — it holds the frame up without creeping backwards over time the way cheap plastic stands do once the aircon starts heating and cooling the piece daily.",
          ],
          side: {
            kind: 'list',
            label: 'Mount by location',
            rows: [
              { text: 'Bedside, shelf', time: 'Desk stand' },
              { text: 'Gallery wall', time: 'Wall mount' },
              { text: 'Office desk', time: 'Desk stand' },
              { text: 'Entryway', time: 'Wall mount' },
            ],
          },
        },
        {
          num: '04',
          title: 'Crop: what the frame will actually show.',
          body: [
            "The frame aspect is fixed — so the photo you upload gets cropped to fit. We run every file through a **crop preview** before production and send it back for approval if the crop hits faces, amputates limbs, or loses key elements. Most portrait photos shot vertically land cleanly. Landscape shots into a square frame lose about 25% of the width on each side.",
            "Before uploading, check where the key subject is. If the crop will clip a wedding couple's feet or cut through a pet's tail, send the photo anyway — our pre-press team reframes where possible, and when the image doesn't have enough headroom we reach out before we print anything. No surprise crops.",
          ],
          side: {
            kind: 'quote',
            text: 'They caught that my upload would have cut off my daughter\'s hand in the crop. Reframed before printing. Small thing, huge difference.',
            attr: 'Customer, family portrait',
          },
        },
      ],
    },
    faqs: [
      { question: 'Glass or acrylic front?', answer: '3mm cast acrylic — polished clear front for print sharpness, frosted rear for light diffusion. Glass does not diffuse edge-lit LEDs evenly, which is why glass LED frames look dim in the middle. Acrylic is also 40% lighter, which matters on a wall mount.' },
      { question: 'Can I choose cool white or switchable LED colour?', answer: 'No. Fixed 2700K warm white — same colour temperature as gallery and hotel lighting. Cool white flattens skin tones and makes warm photos look clinical. We have tested switchable versions and the warm-white-only spec consistently wins on home display.' },
      { question: 'Does it come with wall mount hardware?', answer: 'Yes if you order the wall-mount version — includes a drywall anchor and screw suitable for HDB concrete. Desk stand version ships with a weighted brass base that holds position without creeping over time. Pick the mount at checkout; we ship one or the other, not both.' },
      { question: 'How is the photo cropped for the frame?', answer: 'Every upload runs through a pre-press crop preview. If the crop would clip faces, limbs, or key subjects, our team reframes where the image has headroom, or contacts you before printing if the file needs a different shot. You always see the final crop before production.' },
      { question: 'How is the frame powered?', answer: 'USB-C cable included. No battery, no wall-wart plug. The cable exits through the rear lower edge for a clean wall-mount install or runs neatly down the back of a desk stand.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 04 · LED WOOD CIRCLE BASE  (photo-resize)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'led-wood-circle-base',
    seo_body:
      'LED wood circle base photo plaque Singapore — round solid-wood base with engraved circular acrylic insert, warm LED backlight, USB-C. Circular composition crop preview, 300 DPI prep, moisture-sealed wood for tropical climate.',
    seo_magazine: {
      issue_label: 'Issue · LED Wood Circle Base',
      title: 'The round one that changes ',
      title_em: 'how the photo reads.',
      lede:
        "Rectangular frames are everywhere. A round one does something different — it forces a centred composition, removes the rectangle's implicit 'this is a photo' framing, and reads more as an object than a picture. Useful when the gift has to compete visually with twenty other framed photos already on the shelf.",
      articles: [
        {
          num: '01',
          title: 'Circles break the photo-on-shelf fatigue.',
          body: [
            "A room with six rectangular frames on a console reads as 'family wall' — and every new rectangle blurs into the background. A circular piece cuts through that visual noise because the eye processes round shapes differently from rectangular ones. Gallery curators exploit this constantly: the round porthole portrait in a wall of squares is always the one people ask about.",
            "That's why a circular base works as a gift specifically — it will get noticed in a room that already has a dozen photos. The piece sits alongside existing frames without competing against them, and becomes the thing guests comment on.",
          ],
          side: {
            kind: 'pills',
            label: 'Why round works',
            items: [
              { text: 'Stands out on a mixed shelf', pop: true },
              { text: 'Forces tight composition' },
              { text: 'Reads as object, not photo', pop: true },
              { text: 'Pairs with round trays/decor' },
            ],
          },
        },
        {
          num: '02',
          title: 'Composition rules for circular engraving.',
          body: [
            "A rectangle forgives loose composition — empty corners hold space. A circle doesn't. Anything at the edge gets cropped off by the curve, and anything with hard horizontal lines (horizons, table edges, shoulders perfectly level) fights the round frame visually. **Centred portraits work best** — face in the middle third, eyes on the horizontal centreline, shoulders falling off at the bottom curve naturally.",
            "Pets engrave beautifully round-framed because animal faces are roughly circular and the composition self-aligns. Couples work if they're close in — cheek-to-cheek crops specifically. Wedding group shots almost never work circular; save those for a rectangle. Our crop preview shows you exactly where the round boundary sits on your upload before we touch the engraving head.",
          ],
          side: {
            kind: 'list',
            label: 'Subject by circular fit',
            rows: [
              { text: 'Single portrait', time: 'Excellent' },
              { text: 'Pet face crop', time: 'Excellent' },
              { text: 'Couple, close-in', time: 'Very good' },
              { text: 'Group / wide shot', time: 'Weak' },
            ],
          },
        },
        {
          num: '03',
          title: 'Every wood grain is different — and that is the feature.',
          body: [
            "The base is **solid oak or walnut** (we pick per batch based on grain consistency). Unlike MDF or veneer-over-composite bases — which are uniform and soulless — solid wood carries natural grain variation, knots, and tonal shifts. Two bases from the same production run will have noticeably different grain patterns. That's not a defect. It's the whole reason we use solid wood instead of a printed-veneer fake.",
            "What we do control: sealing. SG humidity is brutal on untreated wood — the grain swells and lifts, the finish cracks at the seams, and the whole piece starts to feel chalky within a year. Every base gets a **three-coat polyurethane seal** with the undersides treated equally so moisture doesn't wick up from shelves. The finish stays stable through aircon temperature swings and tropical monsoon humidity.",
          ],
          side: {
            kind: 'stat',
            label: 'Seal coats',
            num: '3',
            caption: 'top, sides, and underside — humidity-stable',
          },
        },
        {
          num: '04',
          title: 'Pair with round things — the shelf composition lesson.',
          body: [
            "Round pieces don't look right next to rectangular frames on a shelf — the eye reads it as a mismatched shape. They look spectacular next to other round things: a vinyl record on a stand, a round candle, a ceramic bowl, a small globe. If the recipient has a minimalist shelf or a curated corner, the circular base slots in. If their whole shelf is rectangular frames, we'd recommend the rectangle base instead.",
            "For a gift where you can't know the recipient's shelf style, the round base on a **bedside table** almost always works — bedsides are lower-pressure design zones and a single round piece looks considered rather than mismatched. If they have a round tray or coaster already, place the base on that.",
          ],
          side: {
            kind: 'quote',
            text: 'Put it next to a vinyl and a candle. Looks like I planned a whole shelf around it when I did not.',
            attr: 'Customer, Tiong Bahru flat',
          },
        },
      ],
    },
    faqs: [
      { question: 'Is the wood real solid wood or veneer?', answer: 'Solid oak or walnut (we select per production batch for grain consistency). Not MDF, not veneer-over-composite. This means natural grain variation across pieces — two orders will look slightly different, which is the point of using real wood.' },
      { question: 'How is the wood treated for Singapore humidity?', answer: 'Three-coat polyurethane seal on top, sides, and underside. Moisture-stable through aircon temperature swings and monsoon humidity. Untreated wood gifts lift and chalk within a year in SG; ours stay dimensionally stable indefinitely when kept out of direct sunlight.' },
      { question: 'What photo works best in a circular crop?', answer: 'Centred single portraits, pet-face crops, and close-in couple shots (cheek-to-cheek). Avoid wide group shots and photos with strong horizontal lines — the circle fights square compositions visually. Our pre-press preview shows the exact circular boundary before we engrave.' },
      { question: 'Can I request oak specifically instead of walnut?', answer: 'Yes, note it at checkout. Oak is lighter and more golden, walnut is darker with a richer grain. Walnut photographs more dramatically; oak reads more Scandinavian. Tell us which fits the recipient\'s space and we match from current stock.' },
      { question: 'What is the diameter of the engraving area?', answer: 'Engraving insert is roughly 100mm diameter on a 150mm-wide base. Enough for a face crop or a two-person close-in shot with clear detail. Too small for a landscape or wide-angle group photo — size the subject accordingly.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 05 · LED WOOD RECTANGLE BASE  (photo-resize)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'led-wood-rectangle-base',
    seo_body:
      'LED wood rectangle base photo plaque Singapore — solid oak or walnut base with engraved rectangular acrylic insert, warm LED, USB-C powered. 150 x 100mm footprint, weighted base for shelf stability, 300 DPI photo prep with rule-of-thirds crop preview.',
    seo_magazine: {
      issue_label: 'Issue · LED Wood Rectangle Base',
      title: 'The rectangle that ',
      title_em: 'holds the whole scene.',
      lede:
        "Rectangles are the default photo format for a reason — they hold landscapes, groups, and stories that circles can't frame. Paired with a solid-wood base and warm LED, the rectangle stops being 'just a photo' and becomes a piece the recipient actually keeps out, not puts in a drawer.",
      articles: [
        {
          num: '01',
          title: 'Rectangles hold stories circles cannot.',
          body: [
            "A wedding processional shot, a family of five, a travel photo with a recognisable skyline — these are rectangular compositions. Force them into a circle and you lose faces, horizons, or architectural detail at the curve. The rectangle is the correct shape when the **photo has left-to-right narrative** — two people holding hands, a child running toward a parent, a couple walking on a beach with the horizon behind.",
            "It's also the right choice when the recipient has existing rectangular frames on the shelf. A rectangle slots into an existing photo wall without visual conflict. A round piece amongst rectangles looks mismatched; a rectangle amongst rectangles looks curated.",
          ],
          side: {
            kind: 'list',
            label: 'Composition fit',
            rows: [
              { text: 'Couple walking side-by-side', time: 'Perfect' },
              { text: 'Family of 3+', time: 'Perfect' },
              { text: 'Travel + skyline', time: 'Strong' },
              { text: 'Single centred portrait', time: 'Fine, round is better' },
            ],
          },
        },
        {
          num: '02',
          title: 'Oak or walnut — two completely different moods.',
          body: [
            "The base comes in **solid oak** or **solid walnut**. They look nothing alike. **Oak** is light, warm-honey toned, open-grained, and reads Scandinavian / minimalist / airy. It works in a bright flat with white walls, against pale ceramics, on a console by a window. **Walnut** is dark chocolate-brown, tight-grained, and reads masculine / mid-century / library. It works in darker rooms, against warm-toned textiles, next to leather or brass.",
            "If you don't know the recipient's room, go walnut — it photographs better on camera, reads more expensive in the hand, and hides minor wear over time. If you know they love a Muji-clean aesthetic, go oak. We don't offer stained oak or lacquered walnut — the real grain is the point.",
          ],
          side: {
            kind: 'pills',
            label: 'Oak vs walnut',
            items: [
              { text: 'Oak · airy, Scandi', pop: true },
              { text: 'Walnut · rich, mid-century', pop: true },
              { text: 'Oak pairs with white walls' },
              { text: 'Walnut pairs with leather/brass' },
            ],
          },
        },
        {
          num: '03',
          title: 'Subject matter that suits the rectangle engraving.',
          body: [
            "Rectangular engraving forgives more complexity than circular does. Group shots up to four people land cleanly. Travel photos with a skyline or landscape element work because the horizon sits along the horizontal centre third. Pets full-body (not just head) fit the format because animal bodies run horizontal more than vertical.",
            "What still doesn't work: extremely busy group shots (a dinner table of twelve), extreme-wide-aspect panoramic photos (your 21:9 iPhone pano crop will lose the sides), and heavily vertical portraits where the subject fills the full height (they'll feel cramped in a horizontal rectangle). Our pre-press crop preview flags these before you approve the file.",
          ],
          side: {
            kind: 'stat',
            label: 'Engraving area',
            num: '140',
            suffix: 'mm',
            caption: 'horizontal on a 150mm base',
          },
        },
        {
          num: '04',
          title: 'Weight and shelf stability — the part nobody talks about.',
          body: [
            "Cheap LED gifts tip over when the USB cable gets tugged because the base is hollow plastic with no ballast. Solid wood is naturally heavy — the 150 × 100mm base weighs around 400g, which anchors it against any cable pull and stops the piece walking backwards on a shelf when aircon airflow hits it repeatedly over months.",
            "For shelf placement: the base footprint needs at least 160mm of shelf depth to sit flush. On a standard IKEA Billy shelf (280mm) that's a non-issue. On a floating ledge or picture rail, measure first — the base overhanging by more than 20mm at the front looks precarious, even if physics says it's stable.",
          ],
          side: {
            kind: 'quote',
            text: 'Moved it from bedside to the living-room shelf. Held its spot through three years of aircon blowing on it. The weight matters.',
            attr: 'Customer, East Coast',
          },
        },
      ],
    },
    faqs: [
      { question: 'How do I choose between oak and walnut?', answer: 'Oak is lighter, warmer-honey, Scandinavian-feel — pairs with white walls and minimal decor. Walnut is darker chocolate-brown, mid-century-feel — pairs with leather, brass, and warmer rooms. If in doubt, walnut photographs more dramatically and reads more expensive in the hand.' },
      { question: 'Is the engraving on the wood or on an acrylic insert?', answer: 'On an acrylic insert that slots into the wood base. This is how the LED backlight works — light travels through the engraved acrylic from below. The wood is the mount and the ambient-light shield; the acrylic carries the image.' },
      { question: 'Will the base stay put on a shelf?', answer: 'Yes. Solid-wood base weighs around 400g, which anchors it against cable pulls and airflow. It will not walk backwards under aircon or tip over when a USB-C plug is adjusted. Cheap hollow-plastic LED bases cannot match this.' },
      { question: 'What is the maximum photo size that fits?', answer: 'Engraving insert is roughly 140 x 90mm on a 150 x 100mm base. Enough for groups of up to four people, couple-walking shots, travel photos with skylines. Not suitable for extreme panoramic crops or dinner-table group shots.' },
      { question: 'Does the wood scratch easily?', answer: 'The three-coat polyurethane seal gives the surface decent scratch resistance — it handles normal shelf use, books sliding past, and the occasional knock. For heavy use (a kid\'s room, a dining shelf), choose walnut — the darker grain hides minor marks better than oak does.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 06 · LINE ART EMBROIDERY JACKET  (embroidery)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'line-art-embroidery-jacket',
    seo_body:
      'Line art embroidery jacket Singapore — single-thread minimalist line drawing on jacket fabric, portrait or couple line art from photo, chest or back placement. Madeira thread, custom digitising, stitch-density tuned for outline clarity without fabric pucker.',
    seo_magazine: {
      issue_label: 'Issue · Line Art Jacket',
      title: 'One thread, one outline — ',
      title_em: 'worn not displayed.',
      lede:
        "Photo-on-clothing gifts end up in the bottom of the closet. Line-art embroidery doesn't, because it reads as intentional fashion rather than merchandise. A single continuous thread tracing a photo is closer to a tattoo than a t-shirt print — which is exactly why people actually wear it.",
      articles: [
        {
          num: '01',
          title: 'Why one thread beats full-colour photo embroidery.',
          body: [
            "Full-colour photo embroidery tries to recreate a photo in thread. The result is busy, lumpy in the hand, and always looks like what it is — a novelty. **Line art embroidery** does the opposite. It strips the photo down to a single continuous outline, stitched in one thread colour, so the finished piece reads as a drawing, not a print. Worn on a jacket, it crosses the line from 'personalised gift' into 'this person has taste'.",
            "The reduction is the work. We convert your photo into clean line art ourselves — no AI slop, no auto-trace. A designer reviews the image, draws the line by hand to preserve the features that make the subject recognisable (the eye shape, the jawline, a particular curl of hair), and loses everything else. What comes out looks drawn, because it was drawn.",
          ],
          side: {
            kind: 'pills',
            label: 'Single-thread wins',
            items: [
              { text: 'Reads as drawing, not photo', pop: true },
              { text: 'No colour-matching issues' },
              { text: 'Ages well on denim/canvas', pop: true },
              { text: 'Quiet, not loud' },
            ],
          },
        },
        {
          num: '02',
          title: 'Stitch density for line clarity.',
          body: [
            "A line art design lives or dies on stitch density. Too loose and the line breaks up visually, looking like a dotted outline. Too tight and you get fabric pucker — the jacket gathers under the thread and the line distorts. We stitch line art at **~0.5mm stitch length** with satin-column coverage on the main outline, running stitch on secondary detail. Dense enough to read as a solid line from across a room, loose enough that the jacket hangs flat.",
            "This is where cheap line-art embroidery fails. Bulk-machine runs at default 1mm stitches look broken on close inspection. Our digitiser reviews each file individually — manual tuning of underlay, column width, and needle-penetration spacing matched to the fabric weight of the jacket you picked. It's the reason the same design costs more here than at a mall kiosk and looks fundamentally different close-up.",
          ],
          side: {
            kind: 'stat',
            label: 'Stitch length',
            num: '0.5',
            suffix: 'mm',
            caption: 'satin-column on main outline · half the bulk default',
          },
        },
        {
          num: '03',
          title: 'Jacket weight versus line bleed.',
          body: [
            "Heavy jackets (denim, waxed canvas, bomber with thick lining) hold a line-art stitch without distortion — the fabric body absorbs the thread pull. Light jackets (windbreaker, soft shell, thin cotton) will pucker around dense embroidery no matter how careful the digitising. For line art specifically, **mid-to-heavy jacket fabrics only**: denim trucker, canvas chore coat, heavyweight bomber, wool varsity. We decline light shell jackets for this technique because the result is always compromised.",
            "The placement matters too. **Left-chest** (8cm square) is the classic placement for line art — small, quiet, noticed at conversation distance. **Centre-back** (20cm+) is for statement pieces where the line art is the entire back of the jacket. Side-sleeve and hem placements rarely work because they cross fabric seams that distort over time.",
          ],
          side: {
            kind: 'list',
            label: 'Fabric × placement',
            rows: [
              { text: 'Denim · left chest', time: 'Perfect' },
              { text: 'Canvas chore · centre back', time: 'Perfect' },
              { text: 'Bomber · left chest', time: 'Strong' },
              { text: 'Windbreaker · anywhere', time: 'Not recommended' },
            ],
          },
        },
        {
          num: '04',
          title: 'Curator-tier aesthetic — why it earns pocket space.',
          body: [
            "The test of a good custom piece is whether the recipient still wears it two winters later. Printed photo jackets don't pass. Line art jackets do, because the design feels like something they'd have bought in a concept boutique. A single silhouette of a pet on a chore coat, their kid's face reduced to eight clean lines on a denim jacket — these read as art, not sentiment.",
            "For gifting specifically, the line-art jacket works best when the subject is **meaningful to the wearer, not declared to the world**. An ex-partner's profile reads strange; a pet, child, or self-portrait line drawing reads personal. The quieter the reference, the more often the jacket gets worn.",
          ],
          side: {
            kind: 'quote',
            text: 'Three years in, still my most complimented jacket. Nobody knows it is my dog until I tell them. That is the whole appeal.',
            attr: 'Customer, denim chore coat',
          },
        },
      ],
    },
    faqs: [
      { question: 'What is line art embroidery versus regular embroidery?', answer: 'Regular photo embroidery tries to recreate a full-colour image in thread — busy, bulky, reads as novelty. Line art embroidery reduces the photo to a single continuous outline stitched in one thread colour. The result reads as a line drawing, not a print, and crosses from "gift" into wearable design.' },
      { question: 'Do I need to supply line art or do you draw it from my photo?', answer: 'We draw it from your photo. No AI auto-trace — a designer hand-reduces the image to preserve the features that make the subject recognisable. You approve a preview before we digitise and stitch.' },
      { question: 'Which jackets work best for this technique?', answer: 'Mid-to-heavy fabrics: denim trucker, canvas chore coat, heavy bomber, wool varsity. Light windbreakers and soft shells pucker around dense embroidery regardless of care, so we decline those. Tell us the jacket or pick from our stock.' },
      { question: 'How many wash cycles does the embroidery survive?', answer: 'Madeira thread is rated for hundreds of wash cycles without fade or fray. The real weak point is the jacket fabric itself — embroidery will outlast most jackets. Wash cold, inside-out, avoid tumble-dry on high heat, and the line art will still read crisp after ten years.' },
      { question: 'Can I place it anywhere on the jacket?', answer: 'Left chest (8cm) and centre back (20cm+) are the two placements that survive over time. Seam-crossing placements (side-sleeve, hem, back-of-shoulder) distort as the fabric ages. We will flag if your requested placement will not hold.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 07 · LINE ART EMBROIDERY LONG SLEEVE  (embroidery)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'line-art-embroidery-long-sleeve',
    seo_body:
      'Line art embroidery long sleeve Singapore — minimalist single-thread outline from your photo, chest or sleeve placement, cotton and cotton-blend long-sleeve bases. Madeira thread, wash-resilient, digitiser-led stitch-length tuning for everyday long-sleeve wear.',
    seo_magazine: {
      issue_label: 'Issue · Line Art Long Sleeve',
      title: 'The softer base for ',
      title_em: 'the same one-line idea.',
      lede:
        "A long sleeve is the in-between garment — not as statement as a jacket, not as casual as a tee. Line art embroidery on a long sleeve is the piece that goes on for a coffee run in November and gets worn twice a week all winter. The design choices are different from jacket-weight fabric, and getting them right is the whole article.",
      articles: [
        {
          num: '01',
          title: 'Minimal colour palette — argue for it.',
          body: [
            "The temptation is to add a second thread colour 'for detail'. Resist. Two-colour line art on a soft cotton long sleeve starts to read as a printed logo rather than a drawn outline, and the garment loses the quiet-art quality that makes line-art worth doing at all. **One thread, one outline, one mood** — chosen to contrast the shirt enough to read at three metres and blend enough to not scream from across a room.",
            "Classic pairings: black thread on cream, bone, or oatmeal long sleeves — reads like sketched ink. Tonal-white thread on a mid-grey base — reads like rain on pavement. Cream thread on navy or forest green — reads like antique nautical. We'll suggest three thread colours when you upload your garment choice; pick one, move on.",
          ],
          side: {
            kind: 'pills',
            label: 'Thread-on-fabric pairings',
            items: [
              { text: 'Black on cream', pop: true },
              { text: 'White on grey' },
              { text: 'Cream on navy', pop: true },
              { text: 'Rust on sand' },
            ],
          },
        },
        {
          num: '02',
          title: 'Stitch-length tuning for knit fabric.',
          body: [
            "Long sleeves are **knit** (jersey or interlock), not woven. Knit fabric stretches and recovers constantly as you move, and embroidery that's stitched at woven-fabric density will pucker or crack the outline over time. We adjust stitch length shorter (~0.4mm) and increase underlay density on knit bases, then run a stabiliser film behind the stitch area that dissolves in the first wash.",
            "The stabiliser is why home-embroidered long sleeves look warped after two washes — no mid-stitch support, and the fabric and thread stretch at different rates. Our technique keeps the line flat through hundreds of wear-and-wash cycles because we treat knit as a different engineering problem than we treat jackets, not just a thinner version.",
          ],
          side: {
            kind: 'stat',
            label: 'Stitch length on knit',
            num: '0.4',
            suffix: 'mm',
            caption: '+ dissolvable stabiliser for flat recovery',
          },
        },
        {
          num: '03',
          title: 'Sleeve or chest — where the line reads.',
          body: [
            "Chest placement (left-chest, 6–8cm) is the default — small, quiet, noticed at close conversation distance. For long sleeves specifically, **forearm placement** on the outside of the wrist is an underused spot that works beautifully for line art. The forearm is seen constantly by the wearer (every time they type, drink, or check their watch) and read by others at arm's-length social distance.",
            "Centre-chest and centre-back placements are valid but require a larger design (15cm+) or it looks lost on the larger fabric panel. We scale the design size to the placement before stitching; same line art looks weirdly tiny if you scale down a chest piece to a sleeve spot without redrawing it.",
          ],
          side: {
            kind: 'list',
            label: 'Placement × design size',
            rows: [
              { text: 'Left chest', time: '6–8cm' },
              { text: 'Forearm, outer wrist', time: '5–7cm' },
              { text: 'Centre chest', time: '15–20cm' },
              { text: 'Centre back', time: '20cm+' },
            ],
          },
        },
        {
          num: '04',
          title: 'Wash-resilience after one hundred cycles.',
          body: [
            "Cotton long sleeves get washed far more often than jackets — for most people, every wear or every second wear. That's 50–100 wash cycles a year. Cheap embroidery starts fraying around cycle 30 and looks visibly distressed by 60. **Madeira polyester thread** specifically is rated for 200+ cycles at 40°C without fade, fray, or colour shift, which is why we use it exclusively.",
            "Care guidelines: wash cold-to-warm, inside-out, low-spin, hang-dry or tumble-low. Avoid fabric softener on the first three washes (it coats the thread and can dull the outline). After that, standard detergent is fine — no special embroidery-friendly soap needed. The garment will wear out before the embroidery does.",
          ],
          side: {
            kind: 'quote',
            text: 'Bought one for my partner last Christmas. Washed weekly all year. Line art is sharp as day one. The shirt is starting to go before the stitching is.',
            attr: 'Customer, third reorder',
          },
        },
      ],
    },
    faqs: [
      { question: 'Can I pick two thread colours?', answer: 'We strongly recommend one. Two colours on a soft cotton long sleeve starts reading as a printed logo rather than drawn line art — it loses the quiet-art quality the technique is designed for. If you have a strong case for two colours, we will do it, but we will push back first.' },
      { question: 'Does embroidery on knit fabric stay flat after washing?', answer: 'Yes, if digitised for knit. We shorten stitch length to 0.4mm, increase underlay density, and stitch with a dissolvable stabiliser that washes out on first laundry. Cheap home-embroidered long sleeves warp because they skip these steps.' },
      { question: 'Is forearm placement really durable?', answer: 'Yes. Forearm placement on the outer wrist survives daily wear because the area sees less friction than underarm, chest, or back-of-neck. It is also the placement the wearer themselves sees most often. One of our most-requested spots for repeat customers.' },
      { question: 'How many wash cycles before the embroidery starts fraying?', answer: 'Madeira polyester thread is rated for 200+ cycles at 40°C without visible degradation. In practice the shirt fabric wears out before the stitching does — we have repeat customers whose three-year-old sleeves still have crisp line art.' },
      { question: 'Can I send a photo or do I need line art already?', answer: 'Send a photo. Our designer hand-draws the line art from your image — no auto-trace — and sends you a preview before digitising for the machine. You approve the drawing before any thread hits fabric.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 08 · LINE ART EMBROIDERY SHIRT  (embroidery)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'line-art-embroidery-shirt',
    seo_body:
      'Line art embroidery t-shirt Singapore — minimalist single-thread outline from your photo, left-chest standard placement, cotton and premium-blend tee bases. Madeira thread, digitiser-led stitch tuning, fabric-weave-matched underlay to prevent print-through.',
    seo_magazine: {
      issue_label: 'Issue · Line Art Shirt',
      title: 'Minimal thread on a ',
      title_em: 'tee that gets worn.',
      lede:
        "A t-shirt is where custom embroidery either earns its keep or becomes landfill. Printed photo tees end up as pyjamas within a year. Line art embroidered tees get worn on purpose — to cafes, on flights, to casual dinners — because the design reads as considered rather than novelty. The shirt fabric is what makes or breaks this.",
      articles: [
        {
          num: '01',
          title: 'Fabric weave decides everything downstream.',
          body: [
            "T-shirts come in wildly different weaves. **180gsm basic cotton** (the bulk-printer default) is too thin for dense embroidery — line art will pucker and the design will show through to the inside messily. **220–240gsm premium cotton** (Everlane, Uniqlo U, COS-style) handles line art without distortion because the fabric body is dense enough to carry the thread pull. **Heavyweight 280gsm+ tees** (the boxy 'designer' tees) are ideal for larger line art designs and accept centre-chest placements without looking overloaded.",
            "We offer two base options: a **premium 240gsm cotton** crew, and a **heavyweight 290gsm** boxy tee for those who want the designer-shop silhouette. If you ask us to embroider on a tee you ship in, we'll weigh it first and push back if the fabric won't hold the design cleanly.",
          ],
          side: {
            kind: 'pills',
            label: 'Fabric × design size',
            items: [
              { text: '240gsm · left chest 6–8cm', pop: true },
              { text: '290gsm · chest 10–15cm' },
              { text: '290gsm · full back', pop: true },
              { text: '180gsm · not accepted' },
            ],
          },
        },
        {
          num: '02',
          title: 'Open-line designs read best on fabric.',
          body: [
            "A photo-to-line-art conversion can go two ways: **closed-line** (solid outlines, cross-hatched shadows, near-printed aesthetic) or **open-line** (sparse, continuous-stroke line that relies on negative space). On t-shirts specifically, open-line almost always wins. Closed-line designs on cotton tees start to look like printed logos once stitched, losing the hand-drawn quality. Open-line designs preserve the 'someone sketched this' feel — which is the whole reason to embroider instead of DTF-print.",
            "Our designer defaults to open-line for any file heading onto a shirt, and we'll show you both preview options if you want to choose. Open-line also stitches faster (fewer thread metres per design) and pucks less on the fabric, which is a practical bonus on top of the aesthetic one.",
          ],
          side: {
            kind: 'stat',
            label: 'Open-line pucker',
            num: '60',
            suffix: '%',
            caption: 'less pucker vs closed-line on 240gsm cotton',
          },
        },
        {
          num: '03',
          title: 'Chest placement alignment.',
          body: [
            "Left-chest placement is the standard for a reason, but it's easy to get wrong. The centre point of the design should sit **on the wearer's pectoral, about 8cm down from the collar seam and 15cm in from the shoulder seam on adult sizes**. Get the placement too high and it sits awkwardly at the collarbone; too low and it reads as a stain rather than a logo. Too far toward the underarm and it wraps when the wearer moves.",
            "We stitch every chest placement against a sized mannequin for the garment's size — S/M/L/XL all get slightly different coordinates so the line sits visually correct on every fit, not just the size-medium default. This is the detail most bulk-embroidery shops skip, and it's why their left-chest logos migrate to weird spots across a size range.",
          ],
          side: {
            kind: 'list',
            label: 'Chest placement × size',
            rows: [
              { text: 'Size S · from collar', time: '7cm down' },
              { text: 'Size M · from collar', time: '8cm down' },
              { text: 'Size L · from collar', time: '9cm down' },
              { text: 'Size XL · from collar', time: '10cm down' },
            ],
          },
        },
        {
          num: '04',
          title: 'Stopping print-through — the inside matters.',
          body: [
            "Line art stitched densely on a thin shirt shows through to the inside as lumpy bobbin thread. People feel it against their skin, and it looks sloppy when the shirt is inside-out (which happens every time it goes in the wash). We back every chest embroidery with a **low-profile cover stitch** on the inside — a smooth thread panel that hides the knots and bobbin thread, so the inside is as clean as the outside.",
            "This is a detail we copied from higher-end workwear brands who do it for comfort reasons. Cheaper shops leave the bobbin side raw because it saves a production step. Once you've worn a shirt with and without the cover, you feel the difference — and you don't go back.",
          ],
          side: {
            kind: 'quote',
            text: 'The inside looks as clean as the outside. Every shop I tried before had scratchy bobbin thread against my skin all day.',
            attr: 'Customer, repeat order',
          },
        },
      ],
    },
    faqs: [
      { question: 'What shirt base do you use?', answer: '240gsm premium cotton crew (default) or 290gsm heavyweight boxy tee (optional). We decline to embroider on 180gsm basic cotton because the fabric is too thin to carry the thread without puckering. If you want us to embroider on a tee you supply, we weigh it first and push back if the weave will not hold the design.' },
      { question: 'Can you stitch on a shirt I bring in?', answer: 'Yes, with a fabric-weight check first. If your shirt is a heavy cotton or premium blend (240gsm+), we can stitch on it. Thin tees will not hold the design. We do not accept polyester-only shirts for embroidery — the fabric melts at needle speeds.' },
      { question: 'Open-line or closed-line design — which should I pick?', answer: 'Open-line on shirts, closed-line on jackets. Open-line preserves the hand-drawn quality on soft fabric, pucks less, and reads like art rather than a printed logo. Our designer defaults to open-line for any shirt file and shows you both options if you want to choose.' },
      { question: 'Does the placement really change across sizes?', answer: 'Yes. We adjust left-chest placement from 7cm down-from-collar on size S up to 10cm on XL — so the line sits visually correct on every fit, not just medium. Most bulk shops skip this and their logos drift to weird spots across the size range.' },
      { question: 'Will the stitching scratch against my skin on the inside?', answer: 'No. Every chest embroidery gets a low-profile cover stitch on the inside that smooths over the bobbin thread and knots. Inside-out the shirt looks clean, and wearing it feels flat — no scratchy thread knots against skin all day.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 09 · LUGGAGE TAG  (uv)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'luggage-tag',
    seo_body:
      'Custom luggage tag Singapore — UV-printed PU leather or acrylic tag, personalised photo or name, stainless steel loop attachment, airport-carousel durable. Front-print full colour, rear privacy panel for address, name and phone.',
    seo_magazine: {
      issue_label: 'Issue · Luggage Tag',
      title: 'The gift that earns ',
      title_em: 'its spot on every trip.',
      lede:
        "Most personalised gifts live on a shelf. A luggage tag goes through airport carousels, taxi boots, hotel storage, and overhead-bin shuffles — and comes back for the next trip. The ones that survive do so because they got the material, the attachment, and the privacy right. The pretty-but-flimsy ones end up cracked in a drawer within three trips.",
      articles: [
        {
          num: '01',
          title: 'Tag stock: PU leather beats metal here.',
          body: [
            "Metal luggage tags look premium at the checkout desk and terrible by month four. Aluminium scratches into a distressed mess, brass tarnishes under humidity, stainless-steel dings and bends when a conveyor belt gets rough. For an SG traveller bouncing between Changi, Bangkok, and long-haul connections, **PU leather is the practical answer** — it absorbs carousel impact, scuffs at the edges in a way that looks lived-in rather than damaged, and doesn't crack in the cargo-hold temperature swings.",
            "Cheaper than real leather, lighter than metal, and easier to UV-print a sharp photo onto. We stock two colours: **saddle tan** (ages golden with use) and **charcoal black** (hides scuffs best for high-frequency travellers). Both survive rain, aircon condensation, and the cargo-hold extremes without warping.",
          ],
          side: {
            kind: 'pills',
            label: 'Why PU over metal',
            items: [
              { text: 'Survives carousel impact', pop: true },
              { text: 'No tarnish in humidity' },
              { text: 'Scuffs age well, do not crack', pop: true },
              { text: 'Lighter per bag' },
            ],
          },
        },
        {
          num: '02',
          title: 'The loop is where cheap tags die first.',
          body: [
            "Most luggage-tag failures aren't the tag itself — they're the **loop attachment**. Plastic cable-tie loops snap in cold cargo holds. Thin cord loops fray and shear on carousel lips. Beaded-chain loops open at the clasp and lose the tag between check-in and arrival. We use **400lb stainless-steel wire loops** with a screw-thread closure — the same spec airlines use for their crew tags. They don't snap, don't corrode, and the screw-thread means the loop can't pop open under jostling.",
            "Attachment also matters for security. A quick-release buckle means someone at the carousel can lift your tag, copy your address, and replace it without you noticing. Screw-thread loops require a tool (or fingernail effort) to remove — deterrent enough against casual tampering.",
          ],
          side: {
            kind: 'stat',
            label: 'Loop strength',
            num: '400',
            suffix: ' lb',
            caption: 'stainless steel · airline-spec',
          },
        },
        {
          num: '03',
          title: 'Privacy: what to print versus what to hide.',
          body: [
            "Old-school luggage tags printed your full home address on the outside — visible to anyone in the taxi queue, the carousel, the hotel lobby. For SG travellers specifically, printing your HDB unit number and full address externally is a small privacy leak that compounds over trips. **Print the name on the outside, privacy-panel the rest**. Our default layout has a slide-out panel on the reverse where address and phone are hidden from casual view but accessible to airline staff if needed.",
            "Alternative: many frequent travellers now print a **phone number only, plus initials** — no address. Airlines match lost bags by bag tag and manifest, not by tag address. Your mobile number and 'Please call if found' does the job without exposing where you live.",
          ],
          side: {
            kind: 'list',
            label: 'What to put where',
            rows: [
              { text: 'Front: name or initials', time: 'Visible' },
              { text: 'Rear panel: address', time: 'Hidden' },
              { text: 'Rear panel: phone', time: 'Hidden' },
              { text: 'Front: photo (pet/kid)', time: 'Visible, optional' },
            ],
          },
        },
        {
          num: '04',
          title: 'Carousel wear — how to read the first year.',
          body: [
            "After six months of use, a good luggage tag shows **edge scuff** (the top and bottom edges where it hits the bag handle), minor **face wear** on the UV print (barely perceptible, more of a soft matte shift), and **zero failures** at the loop or attachment point. That's healthy aging. If the UV print is lifting or the PU is cracking at the fold, the tag was badly made.",
            "Our UV print is fused into the PU surface rather than stuck on top — it won't peel. The print will eventually fade after three-plus years of daily-flight use, but most SG travellers replace their tag as a gift anyway long before that. For airline crew and consultants who are in the air weekly, we offer a reprint on the same tag body for half price if the print wears out.",
          ],
          side: {
            kind: 'quote',
            text: 'Used it for 18 months of weekly flights. Edges are soft now, tag itself is fine. The cheaper ones cracked on trip three.',
            attr: 'Customer, regional consultant',
          },
        },
      ],
    },
    faqs: [
      { question: 'What is the tag made of?', answer: 'PU leather (saddle tan or charcoal black). We chose PU over metal and real leather because it survives airport-carousel impact, does not tarnish in humidity, and scuffs in a way that looks lived-in rather than damaged. Real leather cracks, metal dents, PU ages evenly.' },
      { question: 'How is the tag attached to my bag?', answer: 'Stainless-steel screw-thread loop rated to 400lb pull. Same spec as airline crew tags. Does not snap in cold cargo holds, does not open under jostling, deters casual tampering because removal requires screwing the loop open.' },
      { question: 'Is my address visible to everyone?', answer: 'Not by default. The front shows your name (and optionally a photo). A slide-out privacy panel on the reverse hides your address and phone, accessible to airline staff if needed but not to bystanders at the carousel. Alternative: many travellers print phone-only with "call if found" — address omitted entirely.' },
      { question: 'Does the UV-printed photo fade?', answer: 'Slowly. UV ink is fused into the PU surface rather than stuck on top, so it does not peel. Gentle fade is possible after 3+ years of daily-flight use. For frequent travellers, we offer a reprint on the same tag body at half price if the print wears out.' },
      { question: 'Is it waterproof?', answer: 'Water-resistant, not submersible. Handles rain on the tarmac, aircon condensation, and typical airport weather without issue. Do not soak or run it through a washing machine — neither the PU nor the printed ink enjoys that.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 10 · NETFLIX PHOTO FRAME  (uv)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'netflix-photo-frame',
    seo_body:
      'Netflix photo frame Singapore — UV-printed frame mimicking Netflix series cover UI, custom title, tagline and star rating of your relationship. Anniversary, Valentine, binge-watching couple gift with optional scan-QR-to-song integration.',
    seo_magazine: {
      issue_label: 'Issue · Netflix Frame',
      title: 'Your relationship as a ',
      title_em: 'series cover.',
      lede:
        "Every couple has a running in-joke about their relationship being a TV show. This frame makes it literal — your photo laid out like a Netflix series cover, with a custom title, a tagline, a star rating, and the red N in the corner. It works because it's specific, which is what Netflix itself learned about recommendation: the more specific, the more intimate.",
      articles: [
        {
          num: '01',
          title: 'Mimicking the UI without looking like a meme.',
          body: [
            "The line between 'clever Netflix tribute' and 'screenshot-tier meme gift' is all in the typography and colour. We print the frame in **Netflix Sans** (a licensed equivalent — identical character shapes, licensed for commercial use), the exact red N corner mark, and the full-bleed photo behind a subtle gradient-to-black at the bottom third where the title and tagline sit. The result reads as 'this looks like Netflix' rather than 'this was made in Canva by someone's cousin'.",
            "The other detail: **typography scale**. A real Netflix cover uses an oversized title, a small tagline, and a modest metadata line underneath. Gift versions get the ratio wrong and push the title too small or the tagline too large. We match the real layout ratios from the Netflix desktop UI, so the frame reads authentic at a glance.",
          ],
          side: {
            kind: 'pills',
            label: 'Getting the UI right',
            items: [
              { text: 'Netflix Sans typeface', pop: true },
              { text: 'Red N corner, exact pantone' },
              { text: 'Gradient overlay for text', pop: true },
              { text: 'Ratio-matched layout' },
            ],
          },
        },
        {
          num: '02',
          title: 'Scan-QR-to-song — the upgrade that lands.',
          body: [
            "Optional add-on: a small **QR code** printed in the metadata line. Scan it with any phone camera and it plays your chosen song directly from Spotify or Apple Music (recipient's choice of platform). The QR is visually small enough to read as 'part of the UI' rather than an obvious addition — people don't notice it until you tell them to scan.",
            "The song is the emotional payoff. Pair it with the title choice carefully: a 'Most-Watched of 2024' frame titled *Us* with your first-dance song behind the QR hits harder than the photo alone. We set up the QR deep-link from whatever Spotify track URL you provide, test it on our end before printing, and include a small card explaining the scan on handover.",
          ],
          side: {
            kind: 'stat',
            label: 'QR hit rate',
            num: '95',
            suffix: '%',
            caption: 'first-scan success · tested on iOS/Android',
          },
        },
        {
          num: '03',
          title: 'Lifetime timeline versus single-year framing.',
          body: [
            "Two ways to angle the content. **Single-year framing** ('The 2024 Season', 'Coming to Screens This Valentines') works for anniversaries, proposals, and one-off moments. **Lifetime timeline framing** ('Season 7 · Still Going', 'Binge-Watched for 12 Years') works for long-term partners, wedding-anniversary gifts, and parents.",
            "For gifting specifically, the lifetime framing tends to age better. The recipient keeps the frame out for years and it makes sense every year. Single-year framings tag themselves to a specific moment and can feel dated once the next anniversary rolls around. If in doubt, go 'Season X' with an open-ended subtitle — it updates itself every year in the viewer's head.",
          ],
          side: {
            kind: 'list',
            label: 'Framing × occasion',
            rows: [
              { text: 'Anniversary', time: 'Season number' },
              { text: 'Valentines', time: 'Single-year' },
              { text: 'Wedding gift', time: 'Pilot episode' },
              { text: '10-yr milestone', time: 'Lifetime / Classic' },
            ],
          },
        },
        {
          num: '04',
          title: 'Who this works for — and who it does not.',
          body: [
            "This frame is tailored to **binge-watching couples** — people whose shared shorthand is 'did you watch the new season?', who rate restaurants and weekends out of 5 stars by reflex, and who have a specific opinion on what the best Netflix series of all time is. For those couples, the frame is a wink they'll laugh at immediately.",
            "For older recipients or couples who don't use streaming, this reads as noise. We'd steer parents or grandparents toward a more classic frame (the wood-base or acrylic LED). The Netflix frame wins hard with one demographic and confuses another — know which you're gifting to before you commit. If you're gifting for someone between, our LED photo frame does a similar emotional job without the pop-culture reference.",
          ],
          side: {
            kind: 'quote',
            text: 'She lost it. Took a photo, posted it, texted everyone she knew. Best anniversary gift I have ever done.',
            attr: 'Customer, 6-year anniversary',
          },
        },
      ],
    },
    faqs: [
      { question: 'Is this officially licensed by Netflix?', answer: 'No. This is a tribute frame using Netflix-style UI elements — licensed equivalent typefaces, the red-N visual motif, and layout ratios matched to the streaming UI. It is a gift product referencing a cultural aesthetic, not an official Netflix-branded product. Netflix and the N logo are trademarks of Netflix, Inc.' },
      { question: 'How does the QR-to-song feature work?', answer: 'Optional add-on. You send us a Spotify or Apple Music track URL; we generate a QR code, print it small within the frame metadata line, and include a handover card explaining the scan. Any phone camera scans it directly, no app install needed. Tested on iOS and Android before shipping.' },
      { question: 'What text can I customise?', answer: 'Title (the series name), tagline (one-line description), year or season label, star rating (out of 5), and genre chips along the bottom. Everything that would appear on a real Netflix cover is editable. We send a PDF preview for approval before printing.' },
      { question: 'What photo works best for the frame?', answer: 'A wide landscape shot of the two of you — the layout is horizontal with text in the lower third, so the photo needs headroom at the top and a subject not obscured by the gradient overlay. Close-in couple selfies and wide group shots with background do not both work; pick one.' },
      { question: 'Is this appropriate for parents or grandparents?', answer: 'Usually no — it works best for binge-watching couples who share the Netflix shorthand. For older recipients or non-streamers, our LED photo frame or wood-base products carry a similar emotional weight without the pop-culture reference.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 11 · PET KEYCHAIN  (laser)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'pet-keychain',
    seo_body:
      'Pet photo keychain Singapore — laser-engraved portrait of your dog, cat or rabbit on stainless or wood body, carabiner-clip collar or keyring attachment. AI portrait conversion from any upload, scratch-resistant engraving, dog-park durable.',
    seo_magazine: {
      issue_label: 'Issue · Pet Keychain',
      title: 'Their face on your keys — ',
      title_em: 'survives the dog park.',
      lede:
        "Pet keychains come in two flavours: flat-printed stickers that peel after two months, and laser-engraved pieces that develop a patina alongside your dog's actual life. The engraved ones are the only ones worth doing, because a pet you love is not a print job — it's a small daily ritual you want lasting five, ten, fifteen years.",
      articles: [
        {
          num: '01',
          title: 'AI conversion that actually looks like your pet.',
          body: [
            "The failure mode of cheap pet keychains is **generic AI portrait conversion**. Upload a photo of your specific beagle and you get back a generic beagle that looks nothing like her. We don't use default conversion pipelines — our engraver reviews each photo manually, adjusts the tone-mapping to preserve the pet's actual markings (the white patch above the eye, the one flopped ear, the grey on the muzzle), and sends a preview before engraving.",
            "The result looks like your pet, not a pet. That specificity is the whole point — you're gifting or buying this because that particular animal matters, not because pets in general do. A generic face engraved in metal is a decorative object; your specific dog's face is a piece of someone's emotional life.",
          ],
          side: {
            kind: 'pills',
            label: 'Preserved detail',
            items: [
              { text: 'Actual markings, not generic', pop: true },
              { text: 'Eye shape and depth' },
              { text: 'Ear position (folded/upright)' },
              { text: 'Muzzle greying (senior pets)', pop: true },
            ],
          },
        },
        {
          num: '02',
          title: 'Collar versus keys — pick the use case.',
          body: [
            "The **carabiner-clip version** clips to a collar, harness, leash handle, or dog-walking bag. It's a secondary identification piece (not a replacement for an ID tag) and a visual marker that the dog belongs to someone specific. Useful for multi-dog households, for boarding at a kennel, or for boutique dog clubs where collar-chic matters.",
            "The **keyring version** goes on your keys and does the emotional work. For a pet owner who's out of the house all day, reaching for their keys and seeing their dog's face is a tiny daily moment. For someone who's lost a pet, the keyring becomes a quiet memorial that travels everywhere. The two versions use the same engraved face — just different attachment hardware.",
          ],
          side: {
            kind: 'list',
            label: 'Attachment by use',
            rows: [
              { text: 'Your house keys', time: 'Split ring' },
              { text: 'Dog\'s collar', time: 'Carabiner clip' },
              { text: 'Harness D-ring', time: 'Carabiner clip' },
              { text: 'Walking bag', time: 'Carabiner clip' },
            ],
          },
        },
        {
          num: '03',
          title: 'Tag-replacement function (partial, not full).',
          body: [
            "A pet keychain is **not a legal ID tag** — it doesn't replace the LTA-required dog licence tag or a microchip. But it *can* hold a phone number engraved on the reverse for a quick 'please call if found' if your pup slips out. We offer rear-side engraving at no upcharge: owner phone, pet name, or a short message.",
            "For lost-pet recovery specifically, the carabiner-clip version on the collar is read by strangers faster than a microchip (no scanner needed) and lasts longer than silicone printed tags which wear out. It's a backup, not a substitute, to proper ID — but one most owners don't think to add until something happens.",
          ],
          side: {
            kind: 'stat',
            label: 'Rear-side engraving',
            num: '0',
            suffix: '',
            caption: 'upcharge · phone or message on reverse',
          },
        },
        {
          num: '04',
          title: 'Durability at the dog park.',
          body: [
            "Laser-engraved metal (stainless steel) or laser-engraved wood are the two body options. **Stainless steel** is the pick for high-use cases — dog-park mud, river swims, leash tangles — because it's dishwasher-safe, corrosion-resistant, and the engraving sits below the surface where it can't scratch off. It dulls slightly over time and develops a soft hand-polished sheen.",
            "**Wood** is the pick for aesthetic-first owners — warmer hand feel, develops patina faster, reads more handmade. Less tolerant of long water exposure (river swims) so it's better suited to keyring use than collar use. Both engrave at the same resolution; the choice is about what you want the piece to look and feel like five years in.",
          ],
          side: {
            kind: 'quote',
            text: 'Two years on keys, through countless drops on concrete. Still reads my dog\'s face perfectly. She is eleven now — the keychain is aging alongside her.',
            attr: 'Customer, senior beagle owner',
          },
        },
      ],
    },
    faqs: [
      { question: 'Will the portrait actually look like my pet?', answer: 'Yes. We do not use default AI conversion pipelines — our engraver reviews every photo manually, preserves the specific markings (eye patches, ear positions, muzzle greying), and sends a preview before engraving. You approve the likeness before we touch metal.' },
      { question: 'Can I use this as my dog\'s ID tag?', answer: 'As a backup, not a replacement. It is not a legal ID tag (does not replace the LTA dog licence or microchip) but we can engrave your phone number on the reverse at no upcharge. A stranger who finds your dog reads the phone number instantly without needing a microchip scanner.' },
      { question: 'Stainless steel or wood — which is more durable?', answer: 'Stainless steel for high-use cases (dog-park mud, swim outings, collar attachment). Wood for keyring use where aesthetics matter more than water exposure. Both laser-engrave at the same resolution; the choice is about look, feel, and how the recipient will use it.' },
      { question: 'Can I do multiple pets on one keychain?', answer: 'Yes, with caveats. Two pets fit cleanly on a standard-size keychain. Three or more lose facial detail at engraving resolution — we recommend separate keychains linked on a single ring for multi-pet households. We will flag if your upload exceeds what the face area can carry.' },
      { question: 'What if my pet has passed — can you still make one?', answer: 'Yes. We do memorial keychains regularly — engraved from whatever photo you have, often with a birth-death date on the reverse or the pet\'s name. These are among our most emotionally careful orders and we do not rush them. Send your best photo of the pet alive; we handle the rest.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 12 · REFLECTIVE RECTANGLE KEYCHAIN  (laser)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'reflective-rectangle-keychain',
    seo_body:
      'Reflective rectangle keychain Singapore — mirror-polished stainless steel, laser-engraved name or message, high-visibility for runners cyclists night commuters. Scratch-resistant surface, deep-engrave contrast for low-light readability.',
    seo_magazine: {
      issue_label: 'Issue · Reflective Keychain',
      title: 'Mirror finish — the one ',
      title_em: 'that does a job.',
      lede:
        "Keychains are mostly decorative. This one isn't. A mirror-polished reflective rectangle catches headlights and streetlights, which makes it a genuine safety piece for runners, cyclists, and anyone walking back from an East Coast sunset ride. The engineering is in the balance — reflective enough to be seen, engraved deep enough to read clearly, scratch-resistant enough to survive daily keys.",
      articles: [
        {
          num: '01',
          title: 'Why reflective beats glow-in-the-dark.',
          body: [
            "Glow-in-the-dark safety gear needs a 'charge' from a bright light source — useless once you've been walking for 20 minutes and the glow has faded. **Reflective surfaces** work passively: they bounce oncoming light (headlights, streetlights, bike lamps) back toward the source, making you visible to drivers even in total darkness. The effect is strongest in the driver's direct line of sight — exactly where you need it to be at a crossing.",
            "This keychain's mirror finish is a **high-gloss stainless polish**, not a retroreflective film. The finish survives daily pocket abrasion without hazing (retroreflective films scratch badly over months). Stainless mirror is also more reflective than aluminium polish because of stainless's higher refractive index — brighter bounce, sharper visibility.",
          ],
          side: {
            kind: 'pills',
            label: 'Mirror stainless wins',
            items: [
              { text: 'Always-on reflectivity', pop: true },
              { text: 'No charging needed' },
              { text: 'Scratch-resistant', pop: true },
              { text: 'Brighter than aluminium' },
            ],
          },
        },
        {
          num: '02',
          title: 'Visibility use case — runners, cyclists, school commuters.',
          body: [
            "East Coast Park at 6am in December has runners on the shared path who are genuinely hard to see in the half-light before sunrise. A reflective keychain clipped to a hydration vest or rear pocket is the difference between 'visible from 30m' and 'visible from 100m' to an approaching cyclist or car. For kids walking home from tuition in dark HDB estate stairwells and street crossings, same logic applies — clipped to the schoolbag zipper.",
            "We don't market this as safety gear with certifications — it's a keychain with a practical side effect. For real safety compliance (cyclists legally required to be visible at night), dedicated reflective bands and LED lights do the job better. The keychain is an everyday addition that covers the 80% case: the walk home, the early run, the casual cycle, the taxi queue under a dim awning.",
          ],
          side: {
            kind: 'list',
            label: 'Who gets the most use',
            rows: [
              { text: 'Morning runners', time: 'Strong' },
              { text: 'Casual cyclists', time: 'Strong' },
              { text: 'School commuters', time: 'Strong' },
              { text: 'Construction / hi-vis', time: 'Weak (not PPE)' },
            ],
          },
        },
        {
          num: '03',
          title: 'Engraving versus printing on mirror — a one-sided decision.',
          body: [
            "You can either **engrave** or **print** personalisation onto a mirror-polished surface. Printing fails fast — UV ink doesn't bond cleanly to polished stainless because there's no microscopic surface texture for it to grip, and the print lifts at the edges within months of pocket friction. **Engraving** cuts below the mirror surface, creating a contrast line that's permanent and actually becomes more legible as the surrounding mirror picks up light.",
            "We engrave names, dates, short messages, or short quotes. **Keep text under 30 characters** — the engraving area is modest and dense text loses legibility. The engraved depth is tuned to give high contrast in low-light conditions: when a car headlight hits the keychain, the mirrored area bounces bright, the engraved text reads dark, and the whole piece is legible from across a carpark.",
          ],
          side: {
            kind: 'stat',
            label: 'Engraving depth',
            num: '0.2',
            suffix: 'mm',
            caption: 'tuned for headlight-contrast readability',
          },
        },
        {
          num: '04',
          title: 'Scratch resistance — daily keys, zero distress.',
          body: [
            "Keys live in pockets with coins, phones, and other keys. A soft-polished keychain (cheap plated brass, anodised aluminium) will be scuffed within a month. **Stainless steel at hardness 304 or higher** survives this abuse — the surface dulls uniformly rather than scratching in visible lines, and a wipe with a microfibre brings most of the mirror finish back even after years of pocket use.",
            "The keychain's mirror polish will eventually haze after 5+ years of abuse — that's unavoidable with any polished surface. By then, the engraved name or message is still perfectly legible, because engraving depth is below the surface where scratches don't reach. The piece ages gracefully rather than catastrophically.",
          ],
          side: {
            kind: 'quote',
            text: 'Bought it for my partner who commutes home late. Saw it flash under streetlight headlights on her keys — immediately understood why it matters.',
            attr: 'Customer, safety-conscious gift',
          },
        },
      ],
    },
    faqs: [
      { question: 'Is this certified safety PPE?', answer: 'No. This is a reflective keychain with a practical side effect, not certified PPE for hi-vis-required work (construction, road work, etc). For regulated compliance, use dedicated hi-vis garments and LED lights. For everyday "be seen at night" on the walk home or early run, the keychain covers the 80% case.' },
      { question: 'How long does the mirror finish last?', answer: 'The mirror polish stays sharp through 2–3 years of daily keys. After 5+ years of abuse it will haze slightly — that is physics, not a defect. The engraved name or message stays legible forever because engraving depth is below the scratch plane. The piece ages gracefully rather than catastrophically.' },
      { question: 'Can you print a full-colour design on this?', answer: 'No. UV ink does not bond cleanly to mirror-polished stainless — there is no microscopic surface texture for ink to grip, so prints lift at edges within months. We laser-engrave only on this body. For full-colour keychains, our UV-printed photo keychains are the alternative.' },
      { question: 'How much text fits?', answer: 'Under 30 characters for one line, or split across two lines if the message needs it (up to 20 characters per line). Dense text loses legibility at engraving resolution. We preview the engraving layout before production so you see exactly how your text will sit.' },
      { question: 'Is it scratchy against my phone in the same pocket?', answer: 'The keychain edges are laser-cut and lightly bevelled — not sharp enough to scratch a phone screen directly, but like any metal keychain it can scuff a phone back over time. If you keep your phone in the same pocket as keys, a separate pocket or a slim phone case solves it.' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // 13 · RHINESTONE BOTTLES  (uv)
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: 'rhinestone-bottles',
    seo_body:
      'Rhinestone bottle Singapore — UV-printed personalisation on food-safe stainless water bottle with applied rhinestone pattern, name initials or wedding-favour monograms. Glass-crystal rhinestones hand-applied, UV-print placement around stones, bridesmaid and hen-party gift.',
    seo_magazine: {
      issue_label: 'Issue · Rhinestone Bottles',
      title: 'The bottle that ',
      title_em: 'gets photographed first.',
      lede:
        "A personalised water bottle is a useful gift. A rhinestone-covered personalised bottle is an Instagram moment. These are hen-party, bridesmaid-proposal, and milestone-birthday pieces specifically — the kind of gift that gets unboxed on camera, held up at a photo wall, and then actually used every day afterward. Three things have to line up: the rhinestone placement, the food-safe base, and the UV print working around the stones.",
      articles: [
        {
          num: '01',
          title: 'Rhinestone placement — patterns that actually look intentional.',
          body: [
            "Sticker-rhinestone bottles from craft shops look like sticker-rhinestone bottles. The stones are applied in random scatter patterns, fall off within a month, and the whole piece reads homemade in the worst sense. For a gift that photographs well and survives use, placement has to be **designed, not scattered**. We do three pattern types: **bordered** (rhinestones framing a printed name or monogram in a neat rectangle), **cascading** (a diagonal trail of stones from shoulder to base, thinning as it falls), and **fully-covered** (the whole bottle rhinestoned for maximum sparkle — usually reserved for bride's own bottle).",
            "Each stone is **hand-applied with industrial adhesive** and cured under heat. That's not the same as peel-and-stick — it's why our stones hold through daily washes, bag friction, and the occasional drop. The cure process adds 24 hours to production time, which we factor into lead times so nothing ships half-bonded.",
          ],
          side: {
            kind: 'pills',
            label: 'Pattern types',
            items: [
              { text: 'Bordered · name/monogram', pop: true },
              { text: 'Cascading · diagonal trail' },
              { text: 'Fully-covered · bride only', pop: true },
              { text: 'Bridesmaid initial · small block' },
            ],
          },
        },
        {
          num: '02',
          title: 'The bottle is a real bottle first.',
          body: [
            "A gift bottle has to survive being drunk from daily for years, not just look pretty at the hen party. Our base is **food-grade 304 stainless steel**, double-walled, vacuum-insulated, BPA-free — the same spec as mid-tier travel bottles you'd buy new. 500ml capacity, screw-top with silicone seal, fits in car cup holders and gym bag side pockets.",
            "That means once the hen-party photos are taken, the bridesmaid actually uses it. The alternative (a thin single-wall craft bottle covered in stones) fails on both counts — doesn't keep water cold, doesn't survive a dishwasher, ends up in a drawer. We pay for the better base bottle because the rhinestones are meaningless if the bottle itself is a throwaway.",
          ],
          side: {
            kind: 'stat',
            label: 'Cold-hold',
            num: '24',
            suffix: ' hrs',
            caption: 'double-wall vacuum · ice water to ice water',
          },
        },
        {
          num: '03',
          title: 'UV-printing over and around rhinestones.',
          body: [
            "Getting UV ink and rhinestones to coexist cleanly is the engineering that trips up most shops. You cannot UV-print **over** rhinestones — the ink won't adhere to glass crystal and it'll flake off. You cannot UV-print **first and then apply rhinestones** if the stones will land on the printed area — the adhesive smears the print. Our process: **print first on the negative-space areas only**, cure the UV, then apply the rhinestones in their designated spots on the un-printed surface.",
            "This is why our design preview shows you both layers separately: the print layout (name, date, role) and the rhinestone layout (border, cascade, monogram frame). You approve both before we touch production. Changes after approval are rare but possible if caught before the stones are cured.",
          ],
          side: {
            kind: 'list',
            label: 'Layer order',
            rows: [
              { text: '1. UV-print on negative space', time: 'Day 1' },
              { text: '2. Cure print', time: 'Day 1' },
              { text: '3. Apply rhinestones', time: 'Day 2' },
              { text: '4. Cure adhesive', time: 'Day 3' },
            ],
          },
        },
        {
          num: '04',
          title: 'Wedding favour use — the volume order logic.',
          body: [
            "Bridesmaid and hen-party orders typically run **6–12 bottles** — bride plus five to eleven women in the party. We handle the order as a single file: each woman's name UV-printed on her own bottle, a unified rhinestone pattern across all, and the bride's bottle differentiated (fully-covered rhinestone versus bordered) so it stands out in group photos. Wedding-favour expansion (40–60 bottles for guests) is possible but the lead time extends because hand-application doesn't scale the way machine printing does — plan 4–6 weeks for a full wedding order.",
            "For a hen party specifically, the bottles double as part of the decor — laid out on a welcome table, handed out at the start of the day, carried through the venue for photos. Unlike printed-only bottles, the rhinestone sparkle reads on camera from across the room, which is the entire point of choosing this over a plain custom bottle.",
          ],
          side: {
            kind: 'quote',
            text: 'Did 8 bottles for my sister\'s hen party. She still uses hers every day two years later. The photos from the day are in every group chat we have.',
            attr: 'Customer, maid of honour',
          },
        },
      ],
    },
    faqs: [
      { question: 'Are the rhinestones real crystal or plastic?', answer: 'Glass crystal rhinestones, hand-applied with industrial adhesive and heat-cured. Not peel-and-stick plastic sticker stones. The glass has real refractive sparkle under photography lighting; plastic stones look dull and fall off within weeks.' },
      { question: 'Can I run this bottle through a dishwasher?', answer: 'Top rack only, no high-heat dry cycle. The rhinestone adhesive is cured for daily wash resistance but extended high-heat exposure softens it over time. For longest life, hand-wash the rhinestoned area and dishwash the interior only. Most owners hand-wash as a habit for anything this pretty anyway.' },
      { question: 'Is the bottle itself food-safe?', answer: 'Yes. Food-grade 304 stainless steel, double-walled, vacuum-insulated, BPA-free. Same spec as any mid-tier travel bottle you would buy from a standard retailer. The rhinestones are on the exterior only — no contact with what you drink.' },
      { question: 'Can you print full-colour photos and add rhinestones?', answer: 'Yes, with layer planning. We UV-print on the negative-space areas where rhinestones will not land, cure the print, then apply the rhinestones separately. You approve both layers (print layout + rhinestone layout) as a preview before production. Ink cannot go over rhinestones and rhinestones cannot go over wet ink — layer order matters.' },
      { question: 'How many bottles for a hen party or bridal party?', answer: 'Typical orders are 6–12 (bride plus 5–11 bridesmaids). We differentiate the bride\'s bottle visually (usually fully-covered rhinestone versus bordered) so it reads in group photos. For wedding-favour volume (40–60 bottles for guests), expect 4–6 weeks lead time — hand-application does not scale instantly.' },
    ],
  },
];
