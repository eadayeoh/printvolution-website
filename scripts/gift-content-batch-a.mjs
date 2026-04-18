// Batch A — 13 gift products, unique content per slug.
// Pure data export. No DB writes, no side effects.

export const BATCH = [
  // ───────────────────────────────────────────────────────────
  // 1. 360-rotating-figurine (uv)
  // ───────────────────────────────────────────────────────────
  {
    slug: '360-rotating-figurine',
    seo_body:
      '360 rotating figurine photo frame Singapore — UV-printed portrait figurine, motorised rotating photo gift, acrylic 360 spinning frame, personalised desk photo. Scratch-resistant UV ink, USB-powered base, ships across SG.',
    seo_magazine: {
      issue_label: 'Issue №02 · 360° Rotating Figurine Photo Frame',
      title: 'Everything worth knowing,',
      title_em: 'before you spin it up.',
      lede:
        "A figurine that actually turns 360 degrees is only as good as four things — the print quality on the curved body, how quiet the motor runs after six months, what the underlight does to the photo, and where you park it at home. Get those right and it's the gift that stays on the shelf for years.",
      articles: [
        {
          num: '01',
          title: 'Curved UV printing is not flat UV printing.',
          body: [
            "Most shops can print a flat acrylic photo. Printing a recognisable face onto a **curved figurine body** is a different job entirely — the ink has to wrap without banding, the highlights can't blow out at the apex of the curve, and the **skin tones** need to hold together across a 180° sweep. We use a flatbed with jig alignment, so the head and body print in one pass at the same calibration.",
            "The ink itself is layered at about **12-14 microns**, which is thick enough to survive daily handling but thin enough not to feel rubbery on a smooth surface. Portraits come out warm, not posterised. If you upload a phone photo that's slightly soft, we'll flag it — a 5cm-wide face needs the original pixels, not a WhatsApp-compressed copy.",
          ],
          side: {
            kind: 'pills',
            label: 'Print surface',
            items: [
              { text: 'Body curve' },
              { text: 'Base ring', pop: true },
              { text: 'Name plate' },
              { text: 'Back panel' },
            ],
          },
        },
        {
          num: '02',
          title: 'The motor runs or it ruins the gift.',
          body: [
            "A rotating figurine that squeaks after two weeks is worse than a still one. Our base uses a **brushless micro-motor** geared down to roughly **12 rpm** — slow enough to look like a catalogue display, quiet enough that it disappears on a bedside table. No whine, no stutter when it catches on dust, no stop-start rhythm that the eye picks up.",
            "Power is USB-C from the bottom, so it runs off a laptop or a standard SG three-pin adaptor. Battery bases exist but the cell dies in under a year and you lose the rotation — the USB version just keeps working. We test each unit for **30 minutes continuous** before it leaves the workshop; anything that hesitates gets rebuilt.",
          ],
          side: {
            kind: 'stat',
            label: 'Rotation speed',
            num: '12',
            suffix: ' rpm',
            caption: 'slow enough to read the photo from across the room',
          },
        },
        {
          num: '03',
          title: 'Warm-white underlight, not cold LED.',
          body: [
            "The underlight is the detail most sellers get wrong. Cool 6500K LEDs turn skin tones **green-grey** and make the whole figurine look like a hospital prop. We light from below with a **2700-3000K warm-white ring**, the same colour temperature as a living-room lamp, which keeps flesh tones natural and lets the UV-printed face read properly in the dark.",
            "The light is always-on when plugged in — there's no separate switch because the rotation and the light share the same circuit. If you want it off, you unplug it. Simple, one less thing to break. The ring sits recessed so you don't see the individual diodes, just a soft halo coming up through the base.",
          ],
          side: {
            kind: 'list',
            label: 'Light temperatures',
            rows: [
              { text: 'Warm-white (ours)', time: '2700K' },
              { text: 'Neutral — too clinical', time: '4000K' },
              { text: 'Cool — skin turns green', time: '6500K' },
            ],
          },
        },
        {
          num: '04',
          title: 'Where it earns its place — desk or shelf.',
          body: [
            "A 10cm base fits on almost any surface but the figurine reads differently depending on height. On a **study desk** it sits at eye level when you're sat down — the face meets yours, which is the whole point for a graduation or partner gift. On a **top shelf** above eye-line, the rotation is less visible and the photo gets lost; you want it at chest height or lower.",
            "**HDB bedside tables** are the sweet spot — the light doubles as a soft nightlight and the rotation is slow enough not to annoy a sleeping partner. Avoid aircon-vent airflow (it makes the base wobble) and direct sun during the day (the UV ink is rated for indoor, not window-facing). Anywhere else in the home is fine.",
          ],
          side: {
            kind: 'quote',
            text: "Bought it for my mum's 60th. It's on the TV console and she shows it to every visitor. Still spinning after a year.",
            attr: 'Customer, Bedok',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Does the figurine actually show my face or is it just a photo stuck on?',
        answer:
          "The photo is UV-printed directly onto the curved figurine body — your face wraps around the head and upper body as part of the figurine itself. It's not a sticker or a paper insert. You can upload a portrait and we'll position the face on the head area during preflight.",
      },
      {
        question: 'How long does the motor last?',
        answer:
          'The brushless micro-motor is rated for several thousand hours of continuous use. Running it a few hours a day, it comfortably lasts years. If anything goes wrong with the base within the first 12 months, send it back and we replace it.',
      },
      {
        question: 'Can I turn off the rotation but keep the light?',
        answer:
          "No — the rotation and the warm-white underlight share one circuit, so they're on together when plugged in. If you want it still, unplug it. Most buyers leave it running because the rotation is slow and quiet enough to fade into the background.",
      },
      {
        question: 'What photo works best?',
        answer:
          'A clear front-facing portrait on a plain or softly-blurred background. Phone photos work if the face is sharp and at least 1500 pixels wide. We avoid group shots on a single figurine — one face reads cleanly, multiple faces compete for space on a curved 10cm body.',
      },
      {
        question: 'Is it safe for kids?',
        answer:
          'The base is USB-powered at low voltage with no exposed heat sources. The figurine itself is solid resin with a smooth UV-cured ink layer — no sharp edges, no lifting stickers. Young children should be supervised around the USB cable, as with any plugged-in desk item.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 2. 3d-bar-keychain (laser)
  // ───────────────────────────────────────────────────────────
  {
    slug: '3d-bar-keychain',
    seo_body:
      '3D bar keychain Singapore — laser-engraved acrylic layers, stacked depth keychain, personalised photo bar, custom keyring gift. Permanent engraving, split-ring or leather cord, made at Paya Lebar workshop.',
    seo_magazine: {
      issue_label: 'Issue №03 · 3D Bar Keychain',
      title: 'Everything worth knowing,',
      title_em: 'before you etch.',
      lede:
        "A 3D bar keychain looks simple until you realise it's three or four acrylic layers doing the heavy lifting. The depth trick, the readability up close, the hardware choice, and how the engraving ages — those are the four things that separate a keychain someone actually carries from one that lives in a drawer.",
      articles: [
        {
          num: '01',
          title: 'The layered acrylic stack is doing the magic.',
          body: [
            "A flat photo on acrylic looks like a flat photo on acrylic. Our 3D bar runs on **three stacked layers** — a back panel with the primary engraving, a middle spacer that lifts the foreground, and a clear front cap that seals the whole thing. The **~6mm total depth** is what tricks the eye into reading volume instead of a flat print.",
            "Each layer is cut on a **CO2 laser** calibrated for cast acrylic — not extruded, which flakes at the edges. The bond between layers uses a clear solvent weld, not glue, so the stack stays optically clean even under a direct light. Over years of wallet and keyring friction, the layers don't separate or yellow at the seam.",
          ],
          side: {
            kind: 'stat',
            label: 'Stack depth',
            num: '~6',
            suffix: 'mm',
            caption: 'three layers welded flush',
          },
        },
        {
          num: '02',
          title: "Why your photo needs 'space' to work 3D.",
          body: [
            "The depth trick only works if the subject has some separation from the background. A **head-and-shoulders portrait** against a plain wall reads beautifully in 3D — the face pops forward from the etched background. A **busy group photo** or a face buried in a crowd loses the effect completely, because every pixel is competing for the foreground plane.",
            "We auto-convert photos to a **two-tone depth map** during preflight and flag anything that won't render cleanly. Pets, couples against a sunset, kids against a studio backdrop — these work. Shots from a hawker centre lunch or a festival crowd don't, and we'll tell you before we engrave.",
          ],
          side: {
            kind: 'list',
            label: 'Photos that work',
            rows: [
              { text: 'Portrait, plain backdrop', time: 'Best' },
              { text: 'Pet, single subject', time: 'Best' },
              { text: 'Couple, close crop', time: 'Good' },
              { text: 'Group of 4+', time: 'Avoid' },
              { text: 'Busy outdoor scene', time: 'Avoid' },
            ],
          },
        },
        {
          num: '03',
          title: 'Split ring or leather cord — different gifts entirely.',
          body: [
            "A **split ring** is the default — flat, sits on a keyring with house keys, survives daily wallet-bag tumble. If the keychain is going on house keys or a car fob, this is the one. The ring is nickel-plated steel, doesn't corrode in SG humidity.",
            "A **leather cord** changes the object from a keychain into a bag charm. Tote, backpack, diaper bag — the cord hangs the bar at a readable angle and the leather softens over time. Couples often order one of each: cord for her bag, ring for his keys. Same engraving, different daily context.",
          ],
          side: {
            kind: 'pills',
            label: 'Hardware',
            items: [
              { text: 'Split ring', pop: true },
              { text: 'Leather cord' },
              { text: 'Swivel clip' },
              { text: 'Ball chain' },
            ],
          },
        },
        {
          num: '04',
          title: 'Readable from arm length, not just a magnifying glass.',
          body: [
            "A 40mm × 40mm bar is small. The engraving has to work at **normal holding distance** — about 30cm, the distance you'd look at a phone. We scale the primary photo to take up **70% of the frame** and leave a clear margin, so the eye finds the subject fast.",
            "Fine text under 8pt disappears at this size — we round up, or we nudge copy to a second line. Names, short dates, a single initial — all readable. A full address or a three-line quote doesn't fit without squinting, and we'll tell you before we run the plate rather than engrave something you can't read.",
          ],
          side: {
            kind: 'quote',
            text: "Clipped it on my lanyard at work and colleagues kept asking who designed it. Had to explain it's my dog.",
            attr: 'Customer, Tanjong Pagar',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'How does the 3D effect actually work?',
        answer:
          "Three layers of acrylic stacked together — the rear layer carries the engraved photo, a middle spacer lifts the foreground, and the front cap seals it. Your eye reads the depth between layers as dimension. It's not a printed 3D illusion, it's real physical separation about 6mm deep.",
      },
      {
        question: 'Will the engraving wear off on my keys?',
        answer:
          "Laser engraving is a permanent burn into the acrylic — it can't peel, lift, or fade the way printed stickers do. The only thing that ages is the surface gloss from key-to-key friction, and that happens over years, not months. The engraved image stays sharp for the life of the keychain.",
      },
      {
        question: 'Can I put text on it instead of a photo?',
        answer:
          'Yes. Names, dates, short quotes, a coordinate pair — all engrave cleanly at this size. We recommend keeping text to one or two short lines so it stays readable at arm length. You can combine a small photo with a name below if both fit comfortably in the 40mm frame.',
      },
      {
        question: 'Is it safe to carry daily with house keys?',
        answer:
          'Yes. The acrylic is impact-tested and the solvent-welded stack doesn\'t split under pocket or bag pressure. The split ring is nickel-plated steel. Expect the surface to pick up light surface scuffs over years, same as any plastic fob — the engraving underneath stays intact.',
      },
      {
        question: 'Can I order matching pairs for two people?',
        answer:
          'Yes, and it\'s popular — same photo, two keychains, or two different photos in matching layouts. Just note both engravings in the order. If you want one on a split ring and one on a leather cord, flag it in the notes and we\'ll pair them accordingly.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 3. 3d-vertical-bar-necklace (laser)
  // ───────────────────────────────────────────────────────────
  {
    slug: '3d-vertical-bar-necklace',
    seo_body:
      '3D vertical bar necklace Singapore — laser-engraved acrylic pendant, stacked-depth bar necklace, personalised photo jewellery, couple bar necklace. Permanent engraving, stainless chain, workshop made.',
    seo_magazine: {
      issue_label: 'Issue №04 · 3D Vertical Bar Necklace',
      title: 'Everything worth knowing,',
      title_em: 'before you wear it.',
      lede:
        "A vertical pendant sits differently from a horizontal one — it drapes along the sternum instead of across the collarbone. The weight, the chain length, which side gets engraved, and whether a matching pair makes sense are the four things worth thinking about before you buy.",
      articles: [
        {
          num: '01',
          title: 'Pendant weight changes how it drapes.',
          body: [
            "A 40mm vertical bar at three-layer stack weighs around **4-5 grams**. Light enough to forget you're wearing it, heavy enough that it doesn't flip backwards every time you bend over. Lighter pendants ride up; heavier ones pull the chain too far down the chest. We sit in the zone where the bar hangs vertical and stays vertical.",
            "The **vertical orientation** matters for reading the engraving — a photo of a couple, a date in stacked format, or a short phrase reads naturally top-to-bottom. Horizontal bars read left-to-right and suit single names; vertical bars suit compositions with a clear visual hierarchy. Pick based on what you're engraving, not just the shape.",
          ],
          side: {
            kind: 'stat',
            label: 'Pendant weight',
            num: '4-5',
            suffix: 'g',
            caption: 'light enough to forget, heavy enough to stay put',
          },
        },
        {
          num: '02',
          title: 'Chain length decides where the pendant lands.',
          body: [
            "The default stainless chain is **45cm**, which lands just above the sternum on most adults — visible above a crew-neck, tucked under a blouse. Add 5cm to **50cm** if you wear a lot of collared shirts; the pendant sits below the collar opening and shows naturally. Go to **55cm** only if you want a deliberately low-hanging piece for layering.",
            "We offer **stainless steel** as the default because it doesn't tarnish in SG humidity and won't green-skin sensitive necks. Rose gold and gold plating are available but plating wears with daily skin contact within 18-24 months; stainless lasts indefinitely.",
          ],
          side: {
            kind: 'list',
            label: 'Chain length guide',
            rows: [
              { text: 'High neck / choker feel', time: '40cm' },
              { text: 'Default, above sternum', time: '45cm' },
              { text: 'Below collared shirt', time: '50cm' },
              { text: 'Layering, low-hanging', time: '55cm' },
            ],
          },
        },
        {
          num: '03',
          title: 'Front or back engrave — the side nobody asks about.',
          body: [
            "The stacked acrylic reads from the **front face** by default — that's where the 3D depth lives. Engraving on the back of the pendant is possible but the image sits flat against the rear layer and loses the dimensional effect; it reads more like a subtle shadow than a clear photo.",
            "The better move for a hidden message is **front photo, back text** — the 3D portrait shows when you look at it, and a name, date, or short line is engraved into the rear layer so only the wearer sees it when they flip it. That's the setup most couples default to, and it's how we build it unless you ask otherwise.",
          ],
          side: {
            kind: 'pills',
            label: 'Engrave combinations',
            items: [
              { text: 'Front photo only' },
              { text: 'Front photo + back name', pop: true },
              { text: 'Front text + back date' },
              { text: 'Both sides full photo' },
            ],
          },
        },
        {
          num: '04',
          title: 'Couple pairing — same design, different side.',
          body: [
            "The vertical bar is one of our top couple-gift formats because the **top-to-bottom layout** splits cleanly: his name on one, her name on the other, same date underneath both. Or a shared coordinate pair — latitude on one pendant, longitude on the other — which means nothing to anyone else and everything to the two people wearing them.",
            "We engrave matching pairs in one session on the same laser setup, so the font weight and depth match exactly across both pendants. Order as a pair in the notes and we'll bundle them. No separate orders, no risk of slight calibration drift between units.",
          ],
          side: {
            kind: 'quote',
            text: "Got matching ones with our first-date coordinates. Nobody else notices. We both do.",
            attr: 'Customer, Bukit Timah',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Will the stainless chain react with my skin?',
        answer:
          'No. The default chain is 316L stainless steel — hypoallergenic and rated for daily wear against skin, including in Singapore humidity. It won\'t tarnish, turn green, or trigger reactions the way plated base metal does. Sensitive-skin friendly.',
      },
      {
        question: 'Can I wear it in the shower or at the pool?',
        answer:
          'The stainless chain handles water without issue. The acrylic pendant is water-resistant but we don\'t recommend chlorinated pools or salt water daily — the welded seams are fine but the surface gloss dulls over repeated chemical exposure. Rinse with fresh water after pool swims and it lasts years.',
      },
      {
        question: 'How small can the engraved text go?',
        answer:
          'Readable text tops out at about 1.5mm character height on this pendant — roughly an 8pt font. Anything smaller turns into a fuzzy line. A single name, a date, or a short word works cleanly. Full sentences or multi-line quotes won\'t fit without losing legibility.',
      },
      {
        question: 'Do I get to see the design before you engrave?',
        answer:
          'Yes. We send a digital preview after you upload — shows exactly how the photo and text will sit on the pendant. Sign off by reply and we run production. If something looks wrong in the preview, we fix it before any laser touches the acrylic.',
      },
      {
        question: 'Can I order one pendant on a longer chain for layering?',
        answer:
          'Yes, chain length is set at order. 45cm default, 50cm and 55cm available at no extra cost. For layering with a shorter necklace, 50cm or 55cm works best so the two pendants don\'t overlap on the chest.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 4. acrylic-drink-stirrer (uv)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'acrylic-drink-stirrer',
    seo_body:
      'Acrylic drink stirrer Singapore — UV-printed wedding stirrer, custom cocktail stirrer, branded event bar stirrer, personalised drink paddle. Food-safe acrylic, scratch-resistant print, bulk-quantity workshop runs.',
    seo_magazine: {
      issue_label: 'Issue №05 · Acrylic Drink Stirrer',
      title: 'Everything worth knowing,',
      title_em: 'before you stir.',
      lede:
        "A drink stirrer gets held, dunked, licked, dropped, and photographed all inside one evening. The acrylic grade, the print legibility when wet, what they're actually for at weddings and brand events, and whether they're reusable are the four things buyers always miss.",
      articles: [
        {
          num: '01',
          title: 'Food-grade acrylic is not the same as display acrylic.',
          body: [
            "Cheap acrylic stirrers are cut from **general-purpose extruded sheet** — fine for signage, not fine for mouth contact. Ours are cut from **food-grade cast acrylic** that meets the same material standards as baby-product enclosures and kitchenware. No leached plasticisers, no taste transfer to the drink, and the edges flame-polish clean without micro-burrs that catch on a lip.",
            "The difference matters at scale. A hundred wedding stirrers sitting in champagne flutes for two hours is a long contact time — you want the acrylic rated for it. We don't sub in cheaper sheet even on volume orders because the certification is what separates these from a dollar-store craft piece.",
          ],
          side: {
            kind: 'pills',
            label: 'Acrylic spec',
            items: [
              { text: 'Cast, not extruded', pop: true },
              { text: 'Food-contact grade' },
              { text: 'Flame-polished edges' },
              { text: '3mm thickness' },
            ],
          },
        },
        {
          num: '02',
          title: 'UV print has to stay readable when wet.',
          body: [
            "A stirrer lives in liquid. If the print smudges, runs, or loses contrast when submerged, the whole point is gone. Our **UV-cured ink** bonds into the surface during curing — it doesn't sit on top waiting to be rubbed off. Dunk it in champagne, cocktails, iced coffee, whatever; the print reads the same wet as dry.",
            "Legibility under liquid needs **high-contrast artwork** — dark ink on clear acrylic, or single-colour fill against transparency. Photos with subtle tones lose 20-30% of their shadow detail when surrounded by pale liquid. We recommend bold names, monograms, hashtags, dates — anything built for punch-first readability.",
          ],
          side: {
            kind: 'list',
            label: 'Works well in a drink',
            rows: [
              { text: 'Monogram initials', time: 'Strong' },
              { text: 'Wedding date', time: 'Strong' },
              { text: 'Brand logo', time: 'Strong' },
              { text: 'Full portrait photo', time: 'Weaker' },
              { text: 'Subtle gradient art', time: 'Weaker' },
            ],
          },
        },
        {
          num: '03',
          title: 'Wedding banquets vs brand activations — the use is not the same.',
          body: [
            "At a wedding, stirrers are **table-number detail** — one per glass, one per seat, matched to the menu cards and the seating chart. Quantity scales with headcount. Guests take them home, which is half the point; they end up in a kitchen drawer as a keepsake for years. We run these in the 80-200 quantity range typically.",
            "Brand activations are different — **bars at product launches, influencer events, pop-ups**. The stirrer carries the logo and hashtag, and it's designed to photograph well on the cocktail. Quantity is higher, turnaround is tighter, and the artwork often needs to match a wider campaign. Flag the event date on order so we can back-schedule production.",
          ],
          side: {
            kind: 'stat',
            label: 'Typical wedding order',
            num: '80-200',
            caption: 'one per glass, one per guest',
          },
        },
        {
          num: '04',
          title: "Reusable, but they're really single-event gifts.",
          body: [
            "Technically these are dishwasher-safe on a top rack at low temperature. In practice, **nobody washes a stirrer** — guests pocket them as souvenirs or the venue bins them at clean-up. We build them to survive the event, look beautiful in the photos, and travel home with a guest who wants to keep it.",
            "If you're ordering for a venue bar that genuinely wants reuse — a members' club, a hotel lobby bar — flag it and we'll spec a thicker 4mm stock with rounded-tip ends that survive hundreds of hand-wash cycles. The default 3mm with square tips is optimised for events, not commercial service.",
          ],
          side: {
            kind: 'quote',
            text: "We had 160 at the wedding and I don't think any went in the bin. Still finding them in our parents' kitchens.",
            attr: 'Customer, Holland Village',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Are these actually safe to put in a drink?',
        answer:
          "Yes. Cut from food-grade cast acrylic rated for direct mouth and liquid contact — same material class as kitchenware and baby-product enclosures. Edges are flame-polished smooth. No taste transfer, no leaching at normal beverage temperatures.",
      },
      {
        question: 'How small can the printed detail go?',
        answer:
          "Text down to about 6pt stays legible dry. When submerged in a drink, contrast drops, so we recommend 8pt or larger and high-contrast artwork — dark ink on clear acrylic reads best. Detailed photos lose shadow detail underwater; bold monograms and names are stronger bets.",
      },
      {
        question: 'What is the minimum order quantity?',
        answer:
          "There's no hard minimum — you can order a single stirrer. That said, the economics make more sense from around 50 pieces for events. We run batches efficiently at 80-200 for weddings and 200+ for brand activations. One-offs work if you're prototyping a design.",
      },
      {
        question: 'Can you match our wedding theme colours?',
        answer:
          "Yes. Upload the artwork with colour specified and we print CMYK accurate to your file. For exact brand-Pantone matches on large runs, mention the Pantone reference in the order notes and we calibrate the run against it. We print on clear acrylic by default; coloured-tint acrylic is available on request.",
      },
      {
        question: 'How should guests take them home?',
        answer:
          "Most guests just pocket them. If you want to formalise it, we can supply in small cellophane sleeves with a thank-you card — useful for bridal showers or corporate events where the stirrer doubles as a favour. Flag it on order and we'll quote the sleeving add-on.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 5. acrylic-photo-wall-art (uv)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'acrylic-photo-wall-art',
    seo_body:
      'Acrylic photo wall art Singapore — UV-printed acrylic photo panel, gallery-quality acrylic print, HDB wall photo display, standoff-mounted acrylic art. Fade-resistant UV ink, standoff hardware included, indoor guaranteed.',
    seo_magazine: {
      issue_label: 'Issue №06 · Acrylic Photo Wall Art',
      title: 'Everything worth knowing,',
      title_em: 'before you hang it.',
      lede:
        "Acrylic photo wall art is not a canvas print with delusions. The backing decision, the standoff hardware, how the ink handles SG window light, and where you actually put it on an HDB wall all change what the thing looks like at month twelve. Here's the plain version.",
      articles: [
        {
          num: '01',
          title: 'Print direct or print behind — two different products.',
          body: [
            "There are two ways to put a photo on acrylic. **Direct UV print on the front** gives a slightly textured surface that catches light and reads like a fine-art print. **Print on the back with second-surface ink** gives a glassy front face and a 'depth' effect, with the photo viewed through the clear acrylic.",
            "We default to **back-printing with white ink flood** for wall art — the whites stay bright, dark colours read rich, and the front face stays glass-smooth. It's the difference between 'acrylic print' and 'acrylic display' — the latter is what galleries use, and it's what we ship unless you specifically ask for direct front-print for a textured look.",
          ],
          side: {
            kind: 'pills',
            label: 'Print method',
            items: [
              { text: 'Back-printed (default)', pop: true },
              { text: 'Front-printed (textured)' },
              { text: 'White ink flood' },
              { text: 'No flood, see-through' },
            ],
          },
        },
        {
          num: '02',
          title: 'Standoff mounts make it float — they also make it replaceable.',
          body: [
            "Flush-mount adhesive locks the panel to the wall and ruins paint on removal. **Chrome standoff mounts** hold the panel **15mm off the wall**, throwing a soft shadow and making the print appear to float. Four mounts, four small drill holes — that's it. When you move apartment, four 6mm gap-filler dots and the wall is done.",
            "Standoffs also make the piece easier to clean and swap. Lift the panel off, wipe down the back, put it back. No more dust trapped behind a canvas frame. We include the hardware and a paper template for drill alignment — a DIY install takes 20 minutes with a rental drill from the HDB town council.",
          ],
          side: {
            kind: 'stat',
            label: 'Standoff depth',
            num: '15',
            suffix: 'mm',
            caption: 'enough shadow to read as floating',
          },
        },
        {
          num: '03',
          title: "UV fade resistance — SG windows are brutal.",
          body: [
            "Canvas prints near a window in Singapore start showing UV damage within **6-12 months**. Yellows shift first, then skin tones, then the whole tonal balance collapses. Our UV-cured ink sits in a **polymer matrix** that's rated for indoor fade resistance of several years — not gallery-archival, but significantly better than any standard photo print.",
            "That said, we don't hang any photo art in **direct afternoon sun** near a west-facing HDB window. The heat alone can soften acrylic over seasons. North and east-facing walls are fine, interior walls are ideal. If you have no choice but a sunny spot, consider rotating the piece seasonally.",
          ],
          side: {
            kind: 'list',
            label: 'Wall placement',
            rows: [
              { text: 'Interior wall', time: 'Best' },
              { text: 'North / east facing', time: 'Good' },
              { text: 'Near window, indirect', time: 'OK' },
              { text: 'West-facing, sun-hit', time: 'Avoid' },
            ],
          },
        },
        {
          num: '04',
          title: 'Room lighting changes what the print looks like.',
          body: [
            "Acrylic reflects. Under **warm LED downlights** (2700-3000K), photos read rich and saturated — this is the lighting condition we colour-calibrate for, and it's what most SG homes have in the living room. Under **cool-white tubes** (4000-5000K), the same print reads slightly cooler and higher-contrast, which some prefer for landscape photos but flattens skin tones.",
            "Avoid hanging directly under a pendant or spotlight — the glossy face will hotspot and reflect the bulb. Angle the panel slightly away from direct overhead lighting, or use diffused light from the side. Picture lights work beautifully if you're going gallery-style.",
          ],
          side: {
            kind: 'quote',
            text: "Put it above the sofa in our Toa Payoh flat. Looks like a proper gallery piece, not a photo print. Kena compliment every visit.",
            attr: 'Customer, Toa Payoh',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'How is this different from a canvas print?',
        answer:
          'Canvas softens the photo with a fabric texture and a frame. Acrylic gives a glassy, modern finish with real dimensional depth from the 4mm thickness and the 15mm standoff float. Acrylic also resists humidity and fades — canvas tends to sag or yellow in SG conditions within a year or two.',
      },
      {
        question: 'Do I need to drill into the wall?',
        answer:
          "Yes — the standoff mounts need four small screws to hold the panel at a floating 15mm gap. We supply the hardware, screws, anchors for HDB concrete walls, and a paper drill template. A rental drill from the town council does the job in 20 minutes. No adhesive options for this size — it's too heavy.",
      },
      {
        question: 'What photo resolution do I need?',
        answer:
          'For a 30cm × 30cm panel, we recommend an image at least 3000 × 3000 pixels at good sharpness. Larger panels need proportionally more. We run preflight on every upload and flag images that will look soft at the intended size — you\'ll hear from us before any ink touches acrylic.',
      },
      {
        question: 'Can I wipe it clean?',
        answer:
          "Yes. Soft microfibre cloth, dry for dust, lightly damp for smudges. No ammonia-based glass cleaners — they can dull the acrylic surface over time. The back-printed face is protected by the acrylic itself, so front-face cleaning doesn't risk the print.",
      },
      {
        question: 'Can I hang it in the bathroom?',
        answer:
          "Technically yes, but we don't recommend it for the 4mm display-grade panels — humidity cycling over years can stress the printed ink layer. For bathroom or kitchen wall art, ask about our 6mm outdoor-grade option which handles constant humidity. The standard panel is built for dry interior spaces.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 6. aluminium-fridge-magnets (uv)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'aluminium-fridge-magnets',
    seo_body:
      'Aluminium fridge magnets Singapore — UV-printed metal magnet, custom photo fridge magnet, wedding favour magnet, branded souvenir magnet. Rare-earth hold, scratch-resistant print, humidity-proof aluminium base.',
    seo_magazine: {
      issue_label: 'Issue №07 · Aluminium Fridge Magnets',
      title: 'Everything worth knowing,',
      title_em: 'before you stick it.',
      lede:
        "A fridge magnet lives on the most-viewed surface in any SG home for years. The magnet pull strength, how the UV print handles daily finger contact, what shape it's cut to, and whether it survives kitchen humidity are what separate a keepsake from a peel-it-off-in-month-three freebie.",
      articles: [
        {
          num: '01',
          title: 'Rare-earth magnets pull harder than fridge clips.',
          body: [
            "Most cheap photo magnets use a **rubberised ferrite strip** glued to the back. Grip is weak, the magnet slides down the fridge door when anything heavier than a takeaway menu gets clipped under it, and the glue fails after a humid year. We use **N35 rare-earth neodymium discs** set into the aluminium body — holds up to **800g** per magnet.",
            "That means you can actually clip a weekly shopping list, a school timetable, and a birthday card on the same magnet without it crashing to the kitchen floor at 3am. The pull is strong enough to feel premium when you lift it off, light enough not to scratch the fridge paint when you slide it around.",
          ],
          side: {
            kind: 'stat',
            label: 'Hold strength',
            num: '~800',
            suffix: 'g',
            caption: 'per magnet — holds real paper, not just a receipt',
          },
        },
        {
          num: '02',
          title: "UV ink on aluminium — the toughest combination we run.",
          body: [
            "Aluminium is one of the best substrates UV print bonds to. The ink **keys mechanically** into the brushed or matte-coated surface and cures rock-hard under UV lamps. Daily finger handling, kid smears, aircon condensation, soy-sauce splash — none of it shifts the print. We've had customers come back after **five years** with the original magnet still crisp.",
            "Compared to paper magnets (which fade and warp) and printed plastic magnets (which yellow and scratch), aluminium holds up the longest in an SG kitchen. The metal doesn't flex under magnet pressure, so the print surface never stresses. The only wear pattern we see is at the very edges after years — and even that's cosmetic, not failure.",
          ],
          side: {
            kind: 'pills',
            label: 'UV on aluminium',
            items: [
              { text: 'Scratch-resistant', pop: true },
              { text: 'No yellowing' },
              { text: 'Humidity-stable' },
              { text: 'Fingerprint-easy' },
            ],
          },
        },
        {
          num: '03',
          title: 'Die-cut shapes — not just rectangles.',
          body: [
            "A rectangle is the default — fits any photo ratio, sits neatly in a grid. But aluminium cuts cleanly on **CNC routing**, so we run custom silhouettes with no setup penalty above a certain quantity. **Heart-cut** for wedding favours, **house-shape** for new-home keepsakes, **circle** for clean modern kitchens, **souvenir Singapore skyline** for corporate gifts.",
            "Die-cut adds visual interest on the fridge door — a grid of rectangle photos reads as an album, a mix of shapes reads as a gallery. For weddings and anniversaries we often run hearts; for corporate orders, logos cut to brand silhouette. Flag the shape in the order notes or upload an SVG.",
          ],
          side: {
            kind: 'list',
            label: 'Shape options',
            rows: [
              { text: 'Rectangle (default)', time: 'Standard' },
              { text: 'Circle', time: 'Standard' },
              { text: 'Heart', time: 'Standard' },
              { text: 'Custom SVG silhouette', time: 'On request' },
            ],
          },
        },
        {
          num: '04',
          title: 'SG kitchen humidity is a stress test.',
          body: [
            "Kitchens in SG run hot and humid — cooking steam, aircon cycling off overnight, monsoon weeks where the whole flat hits 85% humidity for days. Paper-based magnets curl and delaminate in these conditions. **Aluminium doesn't absorb moisture at all**, and the UV ink is sealed against water ingress, so the magnet looks the same wet or dry.",
            "If your fridge sits next to the stove and regularly gets splashed, even better — wipe it clean with a damp cloth and it looks new. The only thing to avoid is soaking it or running it through a dishwasher. Kitchen-splash-and-wipe is fine indefinitely.",
          ],
          side: {
            kind: 'quote',
            text: "Ordered 60 for our wedding in 2021. Still on every auntie and uncle's fridge. Print hasn't moved a pixel.",
            attr: 'Customer, Clementi',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Will it scratch my fridge paint?',
        answer:
          'No. The back has a soft rubberised cap over the rare-earth magnet, so the fridge-contact face is plastic, not metal. Slide it around as much as you want — no scratch marks on the door. The magnet pull is strong but won\'t strip paint.',
      },
      {
        question: 'How many magnets do I need for a wedding favour order?',
        answer:
          "Most wedding orders run 80-200 pieces — one per guest family, not per head. Corporate and school-keepsake orders often run 300+. No hard minimum. The per-unit cost drops noticeably above 50 pieces as the batch efficiency kicks in.",
      },
      {
        question: 'Can I use a low-res phone photo?',
        answer:
          'For a 100mm × 100mm magnet, you want at least 1200 × 1200 pixels sharp. Phone photos usually work; WhatsApp-compressed photos often don\'t. We run preflight and flag anything that will print soft — no surprise pixelation after production.',
      },
      {
        question: 'Does the magnet demagnetise over time?',
        answer:
          'Neodymium magnets keep over 95% of their strength after a decade of normal use. The only way to significantly weaken them is sustained heat above 80°C, which your fridge door won\'t produce. Expect full hold strength for the life of the magnet.',
      },
      {
        question: 'Can I put multiple photos on one magnet?',
        answer:
          "Yes — a collage layout with 2-4 photos works on a 100mm × 100mm magnet. More than four gets crowded at this size; consider ordering matching magnets instead so each photo gets its own piece. We can build the collage in preflight if you upload the individual photos.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 7. bar-necklace (laser)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'bar-necklace',
    seo_body:
      'Bar necklace Singapore — laser-engraved horizontal bar pendant, name necklace, date necklace, minimal everyday necklace. Permanent engraving, stainless or rose-gold chain, SG workshop crafted.',
    seo_magazine: {
      issue_label: 'Issue №08 · Bar Necklace',
      title: 'Everything worth knowing,',
      title_em: 'before you engrave.',
      lede:
        "A bar necklace is all about the text. The font you pick, how well the chain survives everyday wear, whether both sides get engraved, and whether a matching pair holds up as a gift — those four decisions determine whether it becomes the daily necklace or ends up in a box.",
      articles: [
        {
          num: '01',
          title: "Script vs sans — it's not just aesthetic.",
          body: [
            "A flowing **script font** on a 40mm bar looks beautiful in the Instagram photo and illegible from arm's length. The thin strokes bunch up at this scale. A clean **sans-serif** like Helvetica Neue or Futura reads immediately — every letter defined, name recognisable across a room. For names longer than 6-7 characters, sans wins every time.",
            "Script works for short words — 'love', 'forever', a single first name, initials. If you're engraving 'Priscilla & Marcus 2024', don't use script; it collapses into a line. We preview the chosen font at actual size before we run the laser, so you see exactly what you'll get — no surprise chicken-scratch at delivery.",
          ],
          side: {
            kind: 'pills',
            label: 'Font by use',
            items: [
              { text: 'Sans — names, dates', pop: true },
              { text: 'Script — single words' },
              { text: 'Serif — formal feel' },
              { text: 'Monospace — coordinates' },
            ],
          },
        },
        {
          num: '02',
          title: 'Chain material decides the three-year test.',
          body: [
            "**316L stainless steel** is our default for a reason — it doesn't tarnish, doesn't react with skin, and the SG shower-shower-sweat cycle doesn't touch it. We've sold stainless chains that are still crisp five years in. No green neck, no dull finish.",
            "**Rose-gold and gold plating** is available and looks softer on most skin tones, but the **plating wears through** where the chain contacts the neck — typically 18-24 months of daily wear. We flag this at order so you're not surprised. If you want the rose-gold look with longevity, consider solid rose-gold-filled chain (upgrade), which wears years longer.",
          ],
          side: {
            kind: 'list',
            label: 'Chain lifespan',
            rows: [
              { text: '316L stainless', time: '5+ yrs' },
              { text: 'Rose-gold plated', time: '18-24 mo' },
              { text: 'Gold plated', time: '18-24 mo' },
              { text: 'Rose-gold filled', time: '3-5 yrs' },
            ],
          },
        },
        {
          num: '03',
          title: "Double-sided engrave — the detail worth the S$0.",
          body: [
            "Bar necklaces can be engraved on **one face or both** at no additional cost — it's the same laser session. Single-sided is fine for simple name bars. Double-sided unlocks a quieter layer: name on the front, date on the back. Coordinates on the front, a three-word message on the back. The wearer sees the hidden side when they flip it; nobody else does.",
            "We default to **single-sided** unless you specify otherwise, because most buyers don't think to ask. If you're giving this as a gift and want the hidden-message thing, mention it in the notes — we'll preview both sides before production.",
          ],
          side: {
            kind: 'stat',
            label: 'Hidden message fit',
            num: '~20',
            suffix: ' chars',
            caption: 'comfortable two-line on the back face',
          },
        },
        {
          num: '04',
          title: "Matching pairs — same bar, different names.",
          body: [
            "Couples and best-friend pairs order this format constantly. Same bar dimensions, same font, same chain — two names engraved across two pendants. The visual consistency is the gift; when you wear them in the same photo, they clearly read as a pair without being matchy in a way that ages badly.",
            "Mother-daughter, siblings, close friends — pairs also work for **generational gifts** where the same font and material creates a family through-line. Order both in one transaction and we batch-engrave on the same laser setup, so the character depth and baseline match perfectly across both pieces.",
          ],
          side: {
            kind: 'quote',
            text: "Three siblings all wear ours with each other's birthdays. Scattered across three countries but it's the same piece.",
            attr: 'Customer, Seletar',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'How many characters fit on the bar?',
        answer:
          "In sans-serif at readable size, comfortably 12-15 characters including spaces on the front. Script fonts fit fewer — 6-8 characters before legibility drops. For longer phrases, consider two lines or the hidden back-face engrave. We preview at actual size before cutting.",
      },
      {
        question: 'Can I wear it in the shower?',
        answer:
          'The stainless chain and the pendant handle daily shower water without issue. We recommend removing for pool swims (chlorine dulls the finish over time) and for saltwater (accelerates any plated-chain wear). Sweat from exercise is fine on stainless.',
      },
      {
        question: 'Is it OK for sensitive skin?',
        answer:
          '316L stainless is the default precisely because it\'s hypoallergenic — no nickel leaching, no skin reactions even for people who react to costume jewellery. If you\'re going rose-gold or gold-plated, the plating layer itself is also nickel-free, but any exposed base metal after wear could trigger sensitive skin.',
      },
      {
        question: 'Can I engrave a handwritten signature?',
        answer:
          'Yes. Upload a clear scan of the handwriting on white paper, and we vectorise it for the laser. Works beautifully for children\'s signatures, a parent\'s handwriting, or a partner\'s note. Minimum size for detail retention is about 4-5mm character height.',
      },
      {
        question: 'Will the engraving fade over years of wear?',
        answer:
          "No. Laser engraving is a physical burn into the metal or acrylic surface, not a printed layer. Daily wear polishes the pendant surface over years, but the engraved text stays cut into the material. We've seen pieces from 2019 that look almost identical today.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 8. bluetooth-spotify-magnet (uv)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'bluetooth-spotify-magnet',
    seo_body:
      'Bluetooth Spotify magnet Singapore — NFC tap-to-play magnet speaker, custom photo Bluetooth magnet, personalised song fridge gift, wireless speaker keepsake. UV-printed photo, NFC + Bluetooth dual, rechargeable.',
    seo_magazine: {
      issue_label: 'Issue №09 · Bluetooth Spotify Magnet',
      title: 'Everything worth knowing,',
      title_em: 'before you tap to play.',
      lede:
        "A fridge magnet that plays your song sounds gimmicky until you use one. The Bluetooth range and battery life, how NFC tap-to-play actually works, whether the built-in speaker is loud enough, and how it holds on a fridge door are the four things that separate this from a dead novelty.",
      articles: [
        {
          num: '01',
          title: 'Bluetooth range and the battery nobody asks about.',
          body: [
            "The Bluetooth module inside pairs with any phone from around **8-10 metres** line-of-sight — comfortably covers an HDB living room from kitchen fridge to sofa. Walls drop that to about 5m, which is still fine for a kitchen-dining setup but cuts out in a three-room flat if you walk into the bedroom.",
            "The **internal battery** runs **4-5 hours continuous playback** on one charge over USB-C. In practice, most people use it in bursts — few minutes here, full song there — so one charge lasts **1-2 weeks** of regular use. Charge indicator LED is on the side, flashes red below 15%.",
          ],
          side: {
            kind: 'stat',
            label: 'Battery life',
            num: '4-5',
            suffix: ' hrs',
            caption: 'continuous play per USB-C charge',
          },
        },
        {
          num: '02',
          title: 'NFC tap-to-play — the bit that makes it magic.',
          body: [
            "The magnet has an **NFC chip embedded behind the photo panel**. Pre-programmed with the Spotify URL of the song (or playlist) you specified at order. You tap your phone to the magnet, the phone reads the NFC, Spotify opens on that song. No manual search, no typing — just tap.",
            "Pairing to the built-in speaker is a separate **one-time Bluetooth** step from phone settings. Once paired, next time you tap, the phone auto-connects and plays through the magnet's speaker. Total time from 'picking up phone' to 'song playing' is about **3 seconds** once set up.",
          ],
          side: {
            kind: 'list',
            label: 'Setup flow',
            rows: [
              { text: 'Pair Bluetooth', time: '1x, 30s' },
              { text: 'Tap phone to magnet', time: 'Every use, 1s' },
              { text: 'Spotify auto-opens', time: 'Auto' },
              { text: 'Song plays through speaker', time: 'Auto' },
            ],
          },
        },
        {
          num: '03',
          title: "Speaker volume — honest about what 100mm can do.",
          body: [
            "A **100mm × 100mm magnet** has room for one micro-driver. Max volume is loud enough for **kitchen-background listening**, two people at dinner, a solo cook-along. It's not a party speaker — it won't fill a living room over conversation, and it won't compete with a TV playing alongside.",
            "For what it is — a photo-memory gift that happens to play your song — the audio is clean, mids are present, bass is non-existent. Voice, acoustic tracks, and mid-tempo pop play well. Bass-heavy hip-hop and dance tracks lose weight. Set expectations around 'nice background speaker that plays the right song' and you'll love it.",
          ],
          side: {
            kind: 'pills',
            label: 'Good use cases',
            items: [
              { text: 'Kitchen cook-along', pop: true },
              { text: 'Dinner for two' },
              { text: 'Bedroom morning' },
              { text: 'Quiet study' },
            ],
          },
        },
        {
          num: '04',
          title: "Magnet strength — sticks to steel, sticks with weight.",
          body: [
            "The internal magnet is **neodymium rated for 1.2kg pull** — comfortably holds the device itself (around 80g) against the fridge door even with a takeaway menu clipped underneath. No sagging, no sliding, no daily re-adjustment. It stays where you put it.",
            "The back has a **soft rubber ring** around the magnet, so it won't scratch the fridge paint when you slide it around to charge. Charging port is on the bottom edge — you can keep it on the fridge and just plug in the USB-C without taking it down. Or take it off entirely and carry it to a picnic; it's a portable Bluetooth speaker when pulled off the door.",
          ],
          side: {
            kind: 'quote',
            text: "My wife's morning routine now includes tapping her phone to our wedding song and making coffee. Worth every cent.",
            attr: 'Customer, Punggol',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'What Spotify link can I link it to?',
        answer:
          "Any Spotify shareable URL — a song, an album, an artist page, or a playlist (public or private). Paste the link at order and we program the NFC chip during build. You can't change the link yourself after — but if you need it updated later, we can reprogram the chip for a small fee.",
      },
      {
        question: 'Does it work with Apple Music or YouTube Music?',
        answer:
          "The NFC chip programs any URL, so yes — you can link it to an Apple Music, YouTube Music, SoundCloud, or even a YouTube video URL instead. Just provide the full shareable link at order. The tap-to-open behaviour is the same; whichever app handles the URL will open.",
      },
      {
        question: 'How do I charge it?',
        answer:
          "USB-C cable included. Takes about 1.5 hours from empty to full. The charge port is on the bottom edge so you can leave the magnet on the fridge while charging. One charge lasts 4-5 hours of continuous play or 1-2 weeks of typical use.",
      },
      {
        question: 'Will it work with any phone?',
        answer:
          "The NFC tap works with any phone that supports NFC — basically every Android from 2015 onwards and every iPhone from iPhone 7 onwards. Bluetooth pairing works with any phone, tablet, or laptop. First-time pairing takes 30 seconds.",
      },
      {
        question: 'Can the photo and the song be of different things?',
        answer:
          'Yes, and it\'s often more powerful that way — the photo is the visual anchor, the song is the emotional soundtrack. Wedding photo + first-dance song. Baby photo + lullaby. Holiday photo + the track you listened to in the car. Pair whatever means something.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 9. book-necklace (laser)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'book-necklace',
    seo_body:
      'Book necklace Singapore — laser-engraved mini book pendant, hidden message book necklace, personalised reader necklace, book lover gift. Functional hinge, engraved inside cover, permanent laser mark.',
    seo_magazine: {
      issue_label: 'Issue №10 · Book Necklace',
      title: 'Everything worth knowing,',
      title_em: 'before you open it.',
      lede:
        "A mini-book necklace is only as good as the hinge that makes it open. The secret-message reveal, chain length for the book-lover aesthetic, and whether to pair it with an actual physical book as a gift are the four things buyers don't think about until they've ordered.",
      articles: [
        {
          num: '01',
          title: "The hinge is the whole mechanism.",
          body: [
            "A book pendant that doesn't open is just a rectangle. Ours uses a **miniature brass hinge** set into the spine — the kind used in watchmaking and jewellery boxes, not stamped sheet metal. It opens cleanly, stays closed when worn, and survives **thousands of open-close cycles** without loosening.",
            "We test every hinge by opening and closing **50 times** before the piece ships. Anything that stutters or needs force goes back for rebuild. The closed position is held by the pendant's own weight and a small magnetic catch — no fiddly clasp, no risk of the book flopping open in the shower.",
          ],
          side: {
            kind: 'stat',
            label: 'Hinge tested',
            num: '50x',
            caption: 'open-close cycles before shipping',
          },
        },
        {
          num: '02',
          title: "The engraving inside is the whole point.",
          body: [
            "The 'secret message' is laser-engraved on the **inside face of the back cover** — invisible when the book is closed, revealed the moment it opens. We fit up to **15-20 characters** comfortably at readable size, which is enough for a short phrase, a date and a name, a coordinate pair, a meaningful lyric line.",
            "Front cover can also be engraved (name, initials, a tiny icon) for a layered effect — the outside tells the world one thing, the inside tells the wearer something else. That's the gift mechanic: something only the person wearing it sees. Parents giving to children, partners to each other, best friends across continents.",
          ],
          side: {
            kind: 'pills',
            label: 'Engrave locations',
            items: [
              { text: 'Inside back cover', pop: true },
              { text: 'Inside front cover' },
              { text: 'Outside front cover' },
              { text: 'Book spine' },
            ],
          },
        },
        {
          num: '03',
          title: "Chain length for the bookworm aesthetic.",
          body: [
            "A book pendant reads differently from a bar or heart — it's chunkier, more object-like, and it deserves **chain length that lets it sit naturally**, not ride up under the collar. Our default is **50cm** rather than the 45cm we use for flatter pendants; that extra 5cm gives the book room to hang open-faced against a shirt.",
            "If you layer necklaces, go **55cm** so the book sits below a shorter pendant without overlapping. For a very short-necked wearer, **45cm** still works but the book may sit closer to the collarbone than ideal. Stainless chain as default; rose-gold plated available.",
          ],
          side: {
            kind: 'list',
            label: 'Chain pick',
            rows: [
              { text: 'Default', time: '50cm' },
              { text: 'Layering', time: '55cm' },
              { text: 'Short neck', time: '45cm' },
              { text: 'Choker aesthetic', time: '40cm' },
            ],
          },
        },
        {
          num: '04',
          title: "Pair it with the actual book.",
          body: [
            "The best gift we see is the **physical book plus the book necklace** — the novel that changed her life, with a miniature version of it around her neck forever. We've engraved lines from *The Alchemist*, *The Little Prince*, *Norwegian Wood*, *Tuesdays with Morrie*, and countless poetry collections into the inside cover.",
            "If you're matching the pendant to a specific book, send us the title at order so we can engrave the outside front cover with it — making the necklace a literal miniature of the book on the shelf. It's the kind of gift that gets remembered years after whoever gave it is long forgotten.",
          ],
          side: {
            kind: 'quote',
            text: "Gave her the book necklace with the novel I was reading when we met. Five years later she still wears it every day.",
            attr: 'Customer, Dhoby Ghaut',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Will the book stay closed when I wear it?',
        answer:
          'Yes. The hinge has a small magnetic catch and the pendant\'s own weight keeps it closed during daily movement. It won\'t flop open during exercise, shower, or a bag being tossed around. It opens with a deliberate push, not accidentally.',
      },
      {
        question: 'How many words fit inside?',
        answer:
          'Comfortably 15-20 characters at clearly readable size — a short phrase, a name and date, a coordinate pair, or a meaningful few words. More is possible at smaller text but legibility drops below 1.5mm character height. We preview at actual size before engraving.',
      },
      {
        question: 'Can I engrave a quote from a specific book?',
        answer:
          "Yes — paste the quote in the order notes. If it's long, we'll help you pick the most meaningful line. For books still under copyright, we're engraving a personal keepsake rather than reproducing for sale, so standard quote use applies. Unattributed lines engrave exactly as you provide.",
      },
      {
        question: 'Is it suitable for daily wear?',
        answer:
          "Yes. The stainless chain is hypoallergenic and the brass hinge is sealed against sweat and humidity. The book itself is cut from laser-grade metal that doesn't tarnish. We'd avoid chlorinated pools (which dull any metal finish over time) but shower, sweat, and SG humidity are fine.",
      },
      {
        question: 'Does it make a good gift for a child?',
        answer:
          'For children over about 8, yes — younger kids may not understand the hinge mechanism and could force it. The engraved message inside works particularly well as a parent-to-child keepsake for a milestone — 10th birthday, first communion, graduation. Engraving a parent\'s handwriting inside is a detail that lands hard.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 10. bridal-sash (photo-resize)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'bridal-sash',
    seo_body:
      'Bridal sash Singapore — printed bride-to-be sash, bachelorette sash, hen party custom sash, wedding sash. 300 DPI print, satin ribbon grade, next-day-turnaround options for last-minute parties.',
    seo_magazine: {
      issue_label: 'Issue №11 · Bridal Sash',
      title: 'Everything worth knowing,',
      title_em: 'before the hen.',
      lede:
        "A bridal sash is a one-night object that ends up in a hundred photos. The ribbon weave, whether you need thread-matched embroidery or sharp printed text, how 'bachelorette' differs from 'wedding' in tone, and how the sash actually fits across the shoulder are the four things to sort before ordering.",
      articles: [
        {
          num: '01',
          title: "Satin grade — the ribbon you don't see is the ribbon that matters.",
          body: [
            "Cheap bridal sashes use **polyester ribbon at 70-100g/m²** — thin, shiny in a plastic way, creases in transit and doesn't recover. Our sashes are **double-faced satin at 150g/m²** — substantially heavier, drapes naturally, and the sheen reads as silk-like rather than costume.",
            "The difference shows in photos. A thin ribbon photographs flat and creased; a heavier satin catches light on the curve and reads as an actual garment detail, not a dress-up accessory. For a bride-to-be walking into a hotel bar for the hen, this is the hair between 'cute' and 'chic'.",
          ],
          side: {
            kind: 'stat',
            label: 'Ribbon weight',
            num: '150',
            suffix: ' g/m²',
            caption: 'drapes like a garment, not a streamer',
          },
        },
        {
          num: '02',
          title: "Printed text at 300 DPI — sharper than most embroidery.",
          body: [
            "Most bridal sashes use either screen-printed block text (cheap, fades fast) or embroidered text (premium, slow turnaround, limited fonts). Our photo-resize print runs at **true 300 DPI direct-to-fabric**, giving you **any font, any colour, any layout** at a crispness that reads as 'expensive'.",
            "Want rose-gold metallic foil text? Possible. Want a photo of the bride's face across the sash as a running joke at the hen? Also possible. Embroidery can't do either. The trade-off is that embroidery has a tactile raised feel, and print is flat — but for sharp typography and full-colour flexibility, print wins on a one-night piece.",
          ],
          side: {
            kind: 'pills',
            label: 'Print vs embroidery',
            items: [
              { text: 'Print — any font', pop: true },
              { text: 'Print — photos' },
              { text: 'Print — metallic' },
              { text: 'Embroidery — tactile' },
            ],
          },
        },
        {
          num: '03',
          title: "Bachelorette vs wedding — the text reads differently.",
          body: [
            "A **bachelorette sash** leans fun, loud, sometimes ironic — 'Bride Tribe', 'Last Fling Before the Ring', inside jokes only the girls get. Tone is high-energy, typography is playful, colours often pink or gold. These are single-use party props.",
            "A **wedding sash** is a different object — 'Bride', 'Mrs [Surname]', 'Future Mrs X' — worn at the tea ceremony, the bridal shower, or the pre-ceremony prep photos. Typography is cleaner, colours are closer to the wedding palette. Same physical sash, entirely different tone. Tell us which use-case on order so we guide the typography accordingly.",
          ],
          side: {
            kind: 'list',
            label: 'Tone by event',
            rows: [
              { text: 'Bachelorette', time: 'Loud, fun' },
              { text: 'Bridal shower', time: 'Pretty, clean' },
              { text: 'Tea ceremony prep', time: 'Elegant, simple' },
              { text: 'Wedding photos', time: 'Refined' },
            ],
          },
        },
        {
          num: '04',
          title: "The diagonal fit — one size doesn't fit every shoulder.",
          body: [
            "Our sash is cut at **600mm × 100mm** to hang diagonally from right shoulder to left hip, comfortably on anyone from petite to mid-plus-size. For **taller or plus-size** brides, the 600mm length works but the text sits higher on the torso; we can cut longer (750mm, 900mm) on request at no extra cost.",
            "For **petite brides**, 600mm can bunch slightly at the hip; request 500mm for a cleaner fit. No one-size-fits-all claim here — we cut to the person when asked. Mention height or dress size in order notes and we adjust.",
          ],
          side: {
            kind: 'quote',
            text: "Had to last-minute order for my bestie's hen when the original sash supplier ghosted. Came next day, looked incredible in every photo.",
            attr: 'Customer, Siglap',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'How fast can you turn this around?',
        answer:
          'Sash orders can turnaround quickly — the print-to-fabric process is single-pass and the ribbon cuts fast. For same-week hens, flag the event date at order and we prioritise. Rush charges may apply for under-48-hour turnaround, but we\'ve rescued a lot of last-minute bachelorette parties.',
      },
      {
        question: 'Can I add a photo to the sash?',
        answer:
          "Yes — full-colour photo print is possible on the satin. Works best for playful bachelorette sashes (e.g., bride's face across the sash as a joke). For wedding-day sashes, we recommend sticking to text and elegant typography; photos on a ceremony sash often read as too casual.",
      },
      {
        question: 'Will the printed text crack or fade?',
        answer:
          "For a sash worn a handful of times — bachelorette, bridal shower, wedding prep — no. The direct-to-fabric ink bonds at 300 DPI and stays crisp. These aren't built for hundreds of wash cycles like a t-shirt; they're built for peak-event use and then keepsake storage.",
      },
      {
        question: 'Can I wash the sash after the event?',
        answer:
          "Gentle hand-wash in cold water, line-dry flat. No machine wash, no hot dryer — the heat can dull the satin and warp the print. Most buyers frame or box the sash as a keepsake rather than wash it. If there's a specific stain (lipstick, champagne), spot-clean carefully.",
      },
      {
        question: 'What colours do you offer for the ribbon itself?',
        answer:
          'White, cream, blush pink, rose gold, black, and navy as standard. Custom colours available on request — we can match a wedding palette if you share the Pantone or hex reference. The printed text can be any colour regardless of the ribbon colour.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 11. circular-metallic-keychain (laser)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'circular-metallic-keychain',
    seo_body:
      'Circular metallic keychain Singapore — laser-engraved round keychain, stainless-steel keyring, personalised metal keychain, coin-shape keychain. Deep laser mark, split ring or swivel hook, SG workshop engraved.',
    seo_magazine: {
      issue_label: 'Issue №12 · Circular Metallic Keychain',
      title: 'Everything worth knowing,',
      title_em: 'before it lives on your keys.',
      lede:
        "A round metal keychain looks basic and survives the most abuse of any personalised gift format. The alloy and plating, how deep the laser goes for readability after years of pocket life, ring versus swivel hook mechanics, and how the surface wears are what separate a keychain that ages with dignity from one that's unreadable at month nine.",
      articles: [
        {
          num: '01',
          title: "316L stainless — the alloy that ignores SG weather.",
          body: [
            "Cheap metal keychains are pot metal or zinc alloy with thin chrome plating. They corrode from the inside out in SG humidity, pit at the edges within a year, and the plating peels from keyring-to-key abrasion. We cut from **316L marine-grade stainless steel** — the same alloy used in boat fittings and surgical instruments.",
            "No plating to peel, no base metal to corrode, no green stains on your pocket lining. The surface is brushed satin by default; polished mirror and matte-black PVD on request. All three handle daily handling the same way — the alloy underneath doesn't care about weather, the finish is what you choose aesthetically.",
          ],
          side: {
            kind: 'pills',
            label: 'Finish',
            items: [
              { text: 'Brushed satin', pop: true },
              { text: 'Polished mirror' },
              { text: 'Matte black PVD' },
              { text: 'Rose gold PVD' },
            ],
          },
        },
        {
          num: '02',
          title: "Laser depth matters for readability in year three.",
          body: [
            "Light surface marking — fibre laser at low power — looks sharp at purchase and **fades from pocket abrasion within 12-18 months**. The key-to-keychain contact polishes the mark off. We run our laser at **deep annealing depth**, about **0.08-0.12mm** into the surface, which survives years of pocket life without losing definition.",
            "The trade-off is a slightly softer edge on the engraving — not hair-thin precision, more like a confident inked line. For names, dates, short phrases, or a simple icon, this is exactly what you want. For microscopic typography, this keychain isn't the format — try the sleek necklace instead.",
          ],
          side: {
            kind: 'stat',
            label: 'Laser depth',
            num: '0.08-0.12',
            suffix: 'mm',
            caption: 'survives years of pocket wear',
          },
        },
        {
          num: '03',
          title: 'Split ring or swivel — they wear differently.',
          body: [
            "A **split ring** is the cheap-and-reliable default — the kind that comes on a new car key. Holds any number of keys, survives twist abuse, but the ring shape means the keychain pendant faces a random direction on the bunch. Fine for purely functional use.",
            "A **swivel hook** is an upgrade — the keychain pendant **always faces the right way** because the swivel rotates to orient it. Costs slightly more but looks deliberate on a car key or a handbag zipper. For gift orders, we default to swivel unless you specify; for self-buy, most people stick with split ring.",
          ],
          side: {
            kind: 'list',
            label: 'Hardware by use',
            rows: [
              { text: 'House keys, daily bunch', time: 'Split ring' },
              { text: 'Car key', time: 'Swivel' },
              { text: 'Bag zipper charm', time: 'Swivel' },
              { text: 'Corporate gift', time: 'Swivel' },
            ],
          },
        },
        {
          num: '04',
          title: "Wear patterns — where it shows its age beautifully.",
          body: [
            "Stainless keychains develop a **fine brushed-silver patina** where they rub against keys — the brushed-satin finish softens slightly over the years, catching light differently than a brand-new one. This is why people keep keychains for a decade. It reads as 'loved object', not 'damaged object'.",
            "The only part that actually wears is the **split ring itself**, which we spec in **nickel-plated steel**. After 3-5 years of very heavy use, the ring may start showing through the plating — a $2 ring replacement and the keychain looks new again. The engraved pendant itself lasts indefinitely.",
          ],
          side: {
            kind: 'quote',
            text: "Bought one with my daughter's name in 2018 when she was born. Still on my keys. The patina tells the story.",
            attr: 'Customer, Serangoon',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'What size is the keychain?',
        answer:
          'The disc is 40mm in diameter — a standard coin-size, readable at arm\'s length without being oversized on a bunch of keys. Thickness is 2mm. The split ring or swivel hook adds about 25mm to the overall length. Custom sizes (30mm or 50mm) available on request.',
      },
      {
        question: 'Can I engrave both sides?',
        answer:
          'Yes, and it\'s the same price. Front and back engraved in one laser session. Common split — photo or icon on one side, name and date on the other. We preview both sides before running.',
      },
      {
        question: 'How many characters of text fit?',
        answer:
          'Comfortably 20-25 characters across a 40mm diameter at readable size, or two lines of shorter text. A full name with date works cleanly. For a longer phrase or address, consider two-sided engraving to split the content.',
      },
      {
        question: 'Will the engraved photo look clear?',
        answer:
          "Yes for high-contrast photos — portraits with clear lighting, pet faces, line-art logos. The laser engraves in greyscale tonal gradation, so detailed photos with subtle mid-tones can look muddy. We run a conversion preview before engraving and flag anything that won't render cleanly.",
      },
      {
        question: 'Does it make noise on a keyring?',
        answer:
          "Not really — stainless at 2mm thickness is quiet, not the metal-on-metal jangle of cheap hollow keychains. If noise bothers you, go swivel hook instead of split ring; the swivel keeps the pendant in one position and reduces key-tapping.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 12. city-map-photo-frame (uv)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'city-map-photo-frame',
    seo_body:
      'City map photo frame Singapore — UV-printed coordinate map frame, custom city map art, travel keepsake map, personalised street-map photo gift. Precise coordinate engraving, multiple map styles, wall or desk mount.',
    seo_magazine: {
      issue_label: 'Issue №13 · City Map Photo Frame',
      title: 'Everything worth knowing,',
      title_em: 'before you print the place.',
      lede:
        "A city map photo frame is only as good as the map data it's built from. The coordinate precision, which map style you pick (street, satellite, terrain), whether your meaningful landmark is actually visible at frame scale, and what the travel-keepsake angle actually means for gifting are the four things worth sorting first.",
      articles: [
        {
          num: '01',
          title: "Coordinate precision to five decimals.",
          body: [
            "Most map prints are 'pretty close' to the address. Ours center on **GPS coordinates to 5 decimal places** — accurate to within about **1.1 metres on the ground**. That's the difference between 'this is the general area where I proposed' and 'this is the exact spot on the bridge'.",
            "We take the coordinate you provide (or we look it up from the address) and lock the map render to it, so the printed frame is genuinely centred on that exact point. The coordinate itself is engraved at the bottom of the frame in degrees-minutes-seconds format — readable, quietly visible, meaningful only to the person whose spot it is.",
          ],
          side: {
            kind: 'stat',
            label: 'Coordinate precision',
            num: '~1.1',
            suffix: 'm',
            caption: 'on the ground — accurate to the bridge, not the block',
          },
        },
        {
          num: '02',
          title: 'Street, satellite, terrain — each tells a different story.',
          body: [
            "**Street map** is the default — clean lines, named roads, the abstract version of the place. Best for urban locations where 'the street' is the identifier. **Satellite** reads as a real-world aerial view — best for nature locations (a beach, a waterfall, a vineyard) where the physical scene itself is the landmark.",
            "**Terrain** adds topographic shading — best for hiking trips, mountain weddings, or countryside destinations where the geography is the story. We also offer **vintage hand-drawn** for an aged-paper aesthetic and **minimal line** for a modern monochrome print. Pick based on what the place actually looks like and what reading of it you want to preserve.",
          ],
          side: {
            kind: 'pills',
            label: 'Map style',
            items: [
              { text: 'Street (default)', pop: true },
              { text: 'Satellite' },
              { text: 'Terrain' },
              { text: 'Vintage' },
              { text: 'Minimal line' },
            ],
          },
        },
        {
          num: '03',
          title: 'Landmark visibility at frame scale.',
          body: [
            "A 200mm × 250mm frame, scaled to show a neighbourhood, might not render small landmarks clearly. A coffee shop in Tiong Bahru at that scale is a dot; a named park at that scale is a named polygon. We can **zoom closer for landmark visibility** or **zoom wider for area context** — tell us which matters more.",
            "Common wins: zoom to **500m radius** for urban-personal landmarks (the bar you met at, the bridge where you proposed), **2km radius** for neighbourhood-scale memories (the suburb you grew up in, the district where you were married), **5km+ radius** for city-scale (Singapore skyline, central business district). We'll preview before we print.",
          ],
          side: {
            kind: 'list',
            label: 'Zoom by story',
            rows: [
              { text: 'Exact bar / bridge', time: '500m' },
              { text: 'Neighbourhood / suburb', time: '2km' },
              { text: 'City district', time: '5km' },
              { text: 'Whole city', time: '10km+' },
            ],
          },
        },
        {
          num: '04',
          title: "Travel keepsakes — the series people build.",
          body: [
            "Single-map frames are gifts. **Series orders** are travel chronicles — buyers commissioning one frame per destination for a milestone like a honeymoon trip or a decade of anniversaries in different cities. Paris. Kyoto. Hanoi. Singapore. Each frame matches in size and style; together they become a wall.",
            "If you're planning a series, tell us on the first order. We'll keep the style consistent across later orders — same map rendering, same typography, same frame. When you add frame seven in three years, it matches frames one through six pixel-for-pixel.",
          ],
          side: {
            kind: 'quote',
            text: "Started with Barcelona for our honeymoon. Now we have seven frames and every one marks a trip. The wall is our story.",
            attr: 'Customer, Marine Parade',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Do I provide the coordinates or can you look them up?',
        answer:
          "Either works. If you have the coordinates, paste them on order. If you have an address or a place name, we'll look up the coordinates and confirm the exact centre point with you before printing. Google Maps coordinate URLs (right-click a spot > copy coords) work directly.",
      },
      {
        question: 'Can I add a photo and the map together?',
        answer:
          'Yes — the frame composition includes a photo window above or beside the map on request. Most popular format is a 100mm × 100mm photo above the map, with the coordinate engraved below. We mock up the layout in preflight so you see the balance before we print.',
      },
      {
        question: 'Which cities can you map?',
        answer:
          "Any city worldwide. Our map data covers the global OpenStreetMap dataset plus satellite imagery at high resolution. Singapore, Jakarta, Kuala Lumpur, Bangkok, Tokyo, Paris, New York, London — anywhere with streets and GPS coordinates is fair game.",
      },
      {
        question: 'Can I customise the text on the frame?',
        answer:
          "Yes — below the coordinates, you can add a city name, a date, a phrase, or a couple of names. Typography is clean sans-serif by default; we can match to a specific font on request if the frame is part of a themed gift. Preview before printing.",
      },
      {
        question: 'Is it wall-mounted or a desk piece?',
        answer:
          'Both. The back has a sawtooth hanger for wall mount and a fold-out stand for desk display. You can switch between them depending on where it ends up. The frame is designed to work in either orientation.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 13. custom-cake-topper (laser)
  // ───────────────────────────────────────────────────────────
  {
    slug: 'custom-cake-topper',
    seo_body:
      'Custom cake topper Singapore — laser-cut acrylic cake topper, wedding cake topper, birthday cake topper, personalised name topper. Food-safe acrylic, extended stake length, workshop-cut and hand-polished.',
    seo_magazine: {
      issue_label: 'Issue №14 · Custom Cake Topper',
      title: 'Everything worth knowing,',
      title_em: 'before you pierce the cake.',
      lede:
        "A cake topper is on the cake for the time it takes to sing and cut. It's in the photos for life. The acrylic grade touching the cream, how long the stake needs to be for the cake height, whether cut-out or layered design is right for your cake, and how to transport it without snapping the stake are the four things to get right.",
      articles: [
        {
          num: '01',
          title: "Food-safe acrylic — the cream contact zone.",
          body: [
            "The stakes go into the cream. The topper sometimes rests on the frosting. **Food-grade cast acrylic** is non-toxic, non-reactive, and won't leach anything into the cake even with the topper sitting overnight in a fridge. We don't use generic sign-shop acrylic on cake toppers — the bottom portion that contacts food is always food-grade.",
            "We also **flame-polish the stake tips** to a smooth point, so they slide into frosted surfaces cleanly without tearing the cream. Rough-cut stakes drag fondant or buttercream up as they enter — ugly detail on the money shot. Flame-polished enters clean and exits clean when the cake is cut.",
          ],
          side: {
            kind: 'pills',
            label: 'Food-contact spec',
            items: [
              { text: 'Food-grade cast acrylic', pop: true },
              { text: 'Flame-polished tips' },
              { text: 'No residue transfer' },
              { text: 'Wipe-clean reusable' },
            ],
          },
        },
        {
          num: '02',
          title: "Stake length vs cake height — the mistake everyone makes.",
          body: [
            "A topper with 20mm stakes sinks halfway into a 150mm tall wedding cake and the topper dangles. A topper with 80mm stakes on a 40mm sponge cake looks like scaffolding. Our default is **50mm stakes** — fits most birthday cakes from cupcakes to a standard 6-inch two-layer. For tiered wedding cakes, we run **80-100mm stakes** so the topper actually stands up over the frosting.",
            "Tell us the cake dimensions at order — height especially. We'll cut stake length to match. For fondant-covered cakes, slightly longer stakes to push through the harder surface; for cream-frosted, default works.",
          ],
          side: {
            kind: 'list',
            label: 'Stake by cake',
            rows: [
              { text: 'Cupcake', time: '25mm' },
              { text: 'Single-layer birthday', time: '50mm' },
              { text: 'Tall two-layer', time: '70mm' },
              { text: 'Tiered wedding', time: '100mm' },
            ],
          },
        },
        {
          num: '03',
          title: 'Cut-out vs layered — two different looks.',
          body: [
            "**Cut-out (single-layer)** is the clean minimal option — laser-cut acrylic in a single colour, typography or silhouette, reads as deliberate design. Best for adult birthdays, elegant weddings, modern celebrations. Cheaper, faster, still beautiful.",
            "**Layered (multi-acrylic stack)** bonds two or three colours of acrylic together for dimensional depth — gold backing with white text on top, rose-gold glitter base with black name, etc. Costs more, takes longer, photographs richer. Best for birthday cakes with a strong theme, kids' parties, and cakes where the topper is the centerpiece.",
          ],
          side: {
            kind: 'stat',
            label: 'Layered depth',
            num: '~6',
            suffix: 'mm',
            caption: 'two-layer stack, noticeable shadow',
          },
        },
        {
          num: '04',
          title: "Transport — why the topper travels separately.",
          body: [
            "A cake topper pre-inserted into a cake for transport breaks. Every time. The topper stakes flex against the cake base as the box jostles and either snap off or crack the acrylic. We ship toppers **flat in protective packaging**, separate from any cake — you insert it at the venue, after the cake has stopped moving.",
            "For tiered wedding cakes where the topper is the structural apex, we can include **a small plastic sleeve** for each stake so the acrylic bonds cleanly to the fondant without residue. Flag it on order for weddings. For standard birthdays, just push the stakes in at the venue and call it done.",
          ],
          side: {
            kind: 'quote',
            text: "Had the topper shipped day-of for my son's first birthday. Inserted it at the party after the cake arrived. Not a single crack.",
            attr: 'Customer, Pasir Ris',
          },
        },
      ],
    },
    faqs: [
      {
        question: 'Is the acrylic safe to touch the cake?',
        answer:
          "Yes. We use food-grade cast acrylic on the stake portion that contacts the cream — same standard as food-contact utensils. The topper won't leach anything into the cake and can sit on frosting overnight without issue. Wash and reuse if you want to keep it as a keepsake after.",
      },
      {
        question: 'How long does turnaround take?',
        answer:
          "Standard orders ship in a few working days for cut-out toppers; layered toppers add a day for the stacking and curing. For wedding and event deadlines, flag the date at order and we back-schedule to arrive comfortably before — we don't want toppers delivered the morning of the event.",
      },
      {
        question: 'Can I get a topper in a specific colour?',
        answer:
          'Yes. We stock acrylic in white, black, gold mirror, silver mirror, rose-gold mirror, clear, frosted, and various glitter finishes. For very specific brand colours, we can source a custom acrylic sheet on request — adds to lead time. Standard colours run same week.',
      },
      {
        question: 'Can it be reused for another event?',
        answer:
          "Yes, if the design is reusable — 'Happy Birthday' works year after year, 'Happy 30th' doesn't. Wash with warm water and mild soap, dry, store flat. Acrylic lasts years in storage. Many customers keep birthday toppers as keepsakes in a memory box alongside photos.",
      },
      {
        question: 'What about cake sizes larger than tiered?',
        answer:
          'For 4-tier wedding cakes or showpiece birthday cakes where the topper is 30cm+ tall, we can scale the topper proportionally and use heavier 5mm acrylic with reinforced stakes. Flag the cake size at order and we\'ll quote accordingly. Standard 3mm acrylic is best for toppers under 20cm.',
      },
    ],
  },
];
