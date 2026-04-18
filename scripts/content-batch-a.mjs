// Batch A — 9 product pages authored for direct publication.
// Voice reference: apply-car-decal-* scripts. Content is product-specific;
// no boilerplate, no pricing in seo_body, no brand name anywhere.
// Consumed by an apply script that writes into product_extras.

export const BATCH = [
  // ─────────────────────────────────────────────────────────────────────────
  // 01 · ACRYLIC SIGNAGE
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'acrylic-signage',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Hand-finished, edge-polished.',
      right_note_body: 'Cast acrylic, laser-cut, standoff-ready before it leaves us.',
      rows: [
        {
          need: "You're opening the shop *next Saturday* and the wall is still bare",
          pick_title: 'A3, 3mm Clear, Double-sided Tape',
          pick_detail: 'From S$85/pc · 3–4 day turnaround · peel-stick, no drilling',
        },
        {
          need: 'Reception wall needs *the logo to read from across the lobby*',
          pick_title: 'A2, 5mm Clear, Standoff Bolts',
          pick_detail: 'From S$160/pc · reads from 3m+ · brushed silver standoffs included',
        },
        {
          need: 'Glass partition — you want *privacy without blocking light*',
          pick_title: 'A3, 3mm Frosted, Double-sided Tape',
          pick_detail: 'From S$90/pc · diffuses sightlines · stays legible under bright LEDs',
        },
        {
          need: 'Boardroom plaque, directors walking past it *every day for ten years*',
          pick_title: 'A3, 5mm White, Standoff Bolts',
          pick_detail: 'From S$95/pc · premium weight · UV-printed, not vinyl-stuck',
        },
        {
          need: 'Startup budget, counter-top sign, still *looks like you belong there*',
          pick_title: 'A4, 3mm Clear, Standoff Bolts',
          pick_detail: 'From S$45/pc · crisp edge polish · four standoffs in the pack',
        },
      ],
    },
    seo_body:
      'Acrylic signage Singapore — reception signs, shopfront plaques, office directory signs, standoff-mounted logos, frosted glass decals. Cast acrylic with polished edges, UV-direct printing, standoff bolts and install-ready packs for HDB commercial and CBD fit-outs.',
    seo_magazine: {
      issue_label: 'Issue №01 · Acrylic Signage',
      title: 'Everything worth knowing,',
      title_em: 'before you mount.',
      lede:
        "A bad acrylic sign doesn't fail at installation. It fails three months later when the edge yellows, the vinyl lifts, or the standoff hole chips. The four things below are what separate a sign that still looks sharp in year five from one that looks cheap by Chinese New Year.",
      articles: [
        {
          num: '01',
          title: 'Why cast acrylic reads cleaner than extruded.',
          body: [
            "Two sheets of acrylic can cost you double or half — and under office lighting, you'll see why. **Cast acrylic** is poured in batches, giving it optical clarity, no internal stress lines, and an edge that polishes to a glass finish. **Extruded acrylic** runs through rollers — faster and cheaper, but it carries internal striations that pick up reflections and chips along cuts. In a reception wall lit by downlights, extruded tells on itself immediately.",
            "Every sheet we cut is **3mm or 5mm cast**, sourced from a supplier with a spec sheet we can show you. The 3mm handles anything up to A3 without flex. At A2 and above, the 5mm is the answer — heavier in the hand, flatter against the wall, and it holds standoff bolts without stress-cracking around the hole.",
          ],
          side: {
            kind: 'pills',
            label: 'Thickness by size',
            items: [
              { text: 'A4 → 3mm', pop: true },
              { text: 'A3 → 3mm' },
              { text: 'A2 → 5mm', pop: true },
              { text: 'Custom → 5mm+' },
            ],
          },
        },
        {
          num: '02',
          title: 'Standoff bolts versus tape — and why it matters in SG offices.',
          body: [
            "**Standoff bolts** float the sign 15mm off the wall, casting a soft shadow that lifts the logo visually and reads premium from every angle. They also need two holes drilled into your wall — which landlords in CBD fit-outs sometimes veto. **Double-sided tape** sticks to painted drywall or glass without a single hole, which is why most HDB commercial tenancies and pop-up counters pick it.",
            'We include the right hardware in the pack. Standoff orders ship with four **brushed-silver bolts, rubber washers, and a paper drill template**. Tape orders come with **3M VHB strips** pre-positioned — the one tape rated to hold acrylic through Singapore humidity without creeping. Tell us the wall material when you order and we match the tape strength to it.',
          ],
          side: {
            kind: 'list',
            label: 'Mount by wall type',
            rows: [
              { text: 'Concrete / brick', time: 'Standoff' },
              { text: 'Drywall (owned)', time: 'Standoff' },
              { text: 'Rented / painted', time: 'Tape' },
              { text: 'Glass partition', time: 'Tape' },
            ],
          },
        },
        {
          num: '03',
          title: 'Clear, frosted, white — what each finish actually says.',
          body: [
            "**Clear** is the default for a reason — it disappears into the wall and lets the logo float. It works when you have strong artwork and a clean wall behind it. **Frosted** is the quiet premium pick: the sheet itself carries a soft diffusion, so printed areas gain a layered depth and the unprinted acrylic reads as subtle privacy glass. Every meeting-room door we've done in frosted still looks current three years later.",
            "**White acrylic** is opaque — the sign sits on the wall, not into it. Use it when the wall is busy, dark, or the logo needs maximum contrast. For a boardroom plaque above dark wood panelling, white acrylic with a matte black print is the combination that reads as 'this company has been here'.",
          ],
          side: {
            kind: 'stat',
            label: 'Finish split',
            num: '62%',
            suffix: 'pick frosted',
            caption: 'across office reception jobs',
          },
        },
        {
          num: '04',
          title: 'The edge polish nobody talks about until they see it.',
          body: [
            "A sign's edge is the line your eye runs along when you walk past it. A **laser-cut edge** comes off the machine with micro-scorch and a slight frosted line — acceptable on back-of-house signage, wrong for reception. A **diamond-polished edge** is re-tooled after cutting to bring the acrylic back to clarity, so the sheet reads like one solid piece of glass at every angle.",
            "We diamond-polish the visible edges on every reception and boardroom job by default — no upcharge, no line item. If the sign is going into a frame or routing where the edge is hidden, we'll skip the polish and save the step. That's the kind of decision we'd rather flag up front than surprise you with after installation.",
          ],
          side: {
            kind: 'quote',
            text: 'The edge polish was the detail we did not know to ask for. It is the reason the sign does not look printed.',
            attr: 'Studio Director, Tanjong Pagar',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '💎', title: 'Cast acrylic only', desc: 'No cheap extruded substitutions. Optical-grade cast sheet on every job, clear through to white.' },
      { icon_url: null, emoji: '🔥', title: 'Diamond-edge polish', desc: 'Visible edges re-tooled after laser cut so the sheet reads like solid glass, not a print.' },
      { icon_url: null, emoji: '🔩', title: 'Install-ready hardware', desc: 'Standoff bolts, VHB strips and a paper drill template in the box — mount in under ten minutes.' },
      { icon_url: null, emoji: '🖨️', title: 'UV-direct print', desc: 'Pigment fused to the acrylic, not vinyl stuck on. No lifting, no yellowing under office LEDs.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 02 · APRONS
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'aprons',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Wash-tested to 50 cycles.',
      right_note_body: 'Decoration method matched to your wash routine and fabric weight.',
      rows: [
        {
          need: 'Cafe opens *in two weeks* and the staff uniforms are still a photo on a mood board',
          pick_title: 'DTF Print, Poly-cotton, Black, Left Chest',
          pick_detail: 'From S$22/pc · 4–5 day turnaround · full colour, logo reads day one',
        },
        {
          need: "You're outfitting *a central kitchen* — aprons go in a 60°C industrial wash nightly",
          pick_title: 'Embroidery, Canvas, Navy, Left Chest',
          pick_detail: 'From S$35/pc · thread-stitched logo · survives commercial laundry',
        },
        {
          need: 'Chef-owner brand — the apron is on camera *every reel you film*',
          pick_title: 'Embroidery, Canvas, Black, Left Chest',
          pick_detail: 'From S$35/pc · tactile logo, reads on video · canvas weight photographs well',
        },
        {
          need: 'Full-colour mascot across the chest, *not just a logo mark*',
          pick_title: 'DTF Print, Poly-cotton, White, Full Front',
          pick_detail: 'From S$24/pc · unlimited colours · gradients and photos land crisp',
        },
        {
          need: 'Pop-up event, 10 pieces needed, *budget-tight*',
          pick_title: 'DTF Print, Poly-cotton, Black, Left Chest',
          pick_detail: 'From S$22/pc · small-run friendly · no setup fee on 10-piece orders',
        },
      ],
    },
    seo_body:
      'Apron printing Singapore — embroidered cafe aprons, DTF-printed kitchen uniforms, canvas bib aprons, barista apron branding. Poly-cotton and canvas stock, wash-tested decoration, left-chest and full-front layouts for F&B and retail teams.',
    seo_magazine: {
      issue_label: 'Issue №02 · Aprons',
      title: 'Everything worth knowing,',
      title_em: 'before you stitch.',
      lede:
        "An apron is the one piece of staff uniform that goes through abuse — grease, acid splashes, hot washes, daily tying and untying. The four questions below decide whether your logo survives the first month or walks out the door faded. Fabric weight, decoration method, placement, and wash routine.",
      articles: [
        {
          num: '01',
          title: 'Poly-cotton versus canvas — and why weight beats thread count.',
          body: [
            "The apron question nobody asks first is **fabric weight in GSM**. Standard **poly-cotton** sits around 180–220gsm — light, fast-drying, comfortable in a hot kitchen. It dries overnight, shrugs off sauce splashes, and wears soft over months. It's also cheaper, and it doesn't photograph as rich on camera — the fabric reads 'uniform', not 'craft'.",
            "**Canvas** comes in at 280–340gsm. It's heavier against the thigh, takes a few washes to break in, and has a visible cotton-weave texture that catches light. For chef-owners and third-wave cafes where the apron is on every reel and menu shot, canvas is the one. It also handles an embroidered logo with zero pucker — the fabric body is stiff enough to carry the stitch without distorting.",
          ],
          side: {
            kind: 'pills',
            label: 'Fabric by use',
            items: [
              { text: 'Poly-cotton · fast kitchens', pop: true },
              { text: 'Canvas · front of house', pop: true },
              { text: 'Canvas · on-camera brands' },
              { text: 'Poly-cotton · high-turnover' },
            ],
          },
        },
        {
          num: '02',
          title: 'DTF print or embroidery — the wash cycle decides.',
          body: [
            "**DTF (direct-to-film) print** gives you full colour. Photos, gradients, mascots with ten colours — all of it lands sharp, no colour limits, no setup fees that kill small runs. The trade is heat tolerance: DTF survives a domestic 40°C wash indefinitely, but commercial laundry running 60°C+ with industrial detergent will soften the edges after 40-plus cycles.",
            "**Embroidery** is thread stitched into the fabric. It can't do photographs, it caps at roughly four-to-six thread colours cleanly, and a detailed logo needs digitising. What it does do is survive anything the apron survives — industrial laundry, bleach spot-treatments, a kitchen porter at 3am. If the apron is going into a contract laundry service, embroidery is the only spec that makes financial sense over eighteen months.",
          ],
          side: {
            kind: 'list',
            label: 'Decoration by wash routine',
            rows: [
              { text: 'Home / 40°C wash', time: 'DTF' },
              { text: 'Cafe / 40–50°C', time: 'DTF' },
              { text: 'Kitchen / 60°C+', time: 'Embroidery' },
              { text: 'Contract laundry', time: 'Embroidery' },
            ],
          },
        },
        {
          num: '03',
          title: 'Left chest, right chest, or across the front.',
          body: [
            "Logo placement is a sightline decision. **Left chest** — 80mm wide, sitting 200mm down from the neckline — is the default because it reads from across a counter without dominating. It's where the eye lands when a barista hands you a cup. **Right chest** works when your pocket is on the left and you don't want a logo competing with it.",
            "**Full-front** is a different job — it's a 250–300mm graphic that turns the apron into a billboard. Right for cafes with heavy brand identity, food-court stalls needing shouty signage, and mascots that justify the canvas real estate. We'll size it so the strap ties don't bisect the artwork and the apron waist-fold doesn't crease the logo when it's stored.",
          ],
          side: {
            kind: 'stat',
            label: 'Most-picked placement',
            num: '74%',
            suffix: 'left chest',
            caption: 'across F&B orders',
          },
        },
        {
          num: '04',
          title: "The strap and pocket details that decide daily comfort.",
          body: [
            "An apron your staff actively likes wearing outlasts one that gets hidden in the back. **Strap length** matters — standard neck straps assume a 165–175cm wearer; smaller or taller staff need an H-back or adjustable buckle instead. **Pocket depth** matters too: a shallow front pocket won't hold an order pad, and a deep pocket sags with phone weight and tugs the whole apron forward.",
            "We stock the **adjustable D-ring buckle** on canvas orders by default and can add it to poly-cotton on request. For F&B teams, we recommend a **two-compartment front pocket** — one deep slot for order pad or tickets, one shallow for pen and receipt. Small detail, noticeably better shift.",
          ],
          side: {
            kind: 'quote',
            text: 'Third supplier we tried. First one where the apron lasted past six months of daily wash.',
            attr: 'Head Chef, East Coast',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🧵', title: 'Digitised before stitch', desc: 'Your logo is mapped to thread path and density before a needle moves. No pucker on canvas, no fill gaps.' },
      { icon_url: null, emoji: '🔥', title: 'DTF heat-cured twice', desc: 'Two-pass press at 160°C so the film bonds into the fabric. Survives 40+ home wash cycles.' },
      { icon_url: null, emoji: '📏', title: 'Placement jig on every piece', desc: 'Left-chest logo sits 200mm down, 80mm wide — consistent across 5 pieces or 500.' },
      { icon_url: null, emoji: '🧺', title: 'Wash-tested stock', desc: 'Poly-cotton and canvas both shrink-tested so your Medium stays Medium after laundry.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 03 · ARTIST CANVAS
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'artist-canvas',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Archival pigment, not dye.',
      right_note_body: 'Stretched over solid pine, varnished to resist SG humidity.',
      rows: [
        {
          need: "It's a *housewarming gift*, you need it framed and wrapped by this weekend",
          pick_title: '12×16 inch, Satin Varnish',
          pick_detail: 'From S$58/pc · 3–4 day turnaround · ready to hang, wire mounted',
        },
        {
          need: "You're hanging *a gallery wall* — four canvases as one composition",
          pick_title: '16×20 inch ×4, Satin Varnish',
          pick_detail: 'From S$88/pc · colour-matched across the set · aligned stretcher depths',
        },
        {
          need: "Statement piece above the sofa — you want *a single canvas that owns the wall*",
          pick_title: '20×24 inch, Satin Varnish',
          pick_detail: 'From S$125/pc · 38mm gallery-depth frame · reads premium from the doorway',
        },
        {
          need: 'Photography reproduction — *the skin tones must be exactly right*',
          pick_title: '16×20 inch, Gloss Varnish',
          pick_detail: 'From S$88/pc · proof sheet before print · tonal match to your master file',
        },
        {
          need: 'Small piece for a shelf, *budget-conscious, still feels like art*',
          pick_title: '8×10 inch, Satin Varnish',
          pick_detail: 'From S$38/pc · ready to stand or hang · full pine stretcher, not MDF',
        },
      ],
    },
    seo_body:
      'Canvas print Singapore — art reproduction, photography on canvas, gallery-wrapped prints, pine-stretched canvas, wall art for interiors. Archival pigment inks, satin or gloss varnish, solid pine stretcher bars and ready-to-hang wiring.',
    seo_magazine: {
      issue_label: 'Issue №03 · Artist Canvas',
      title: 'Everything worth knowing,',
      title_em: 'before you hang.',
      lede:
        "A canvas print is either an object you'd expect in a gallery, or a poster that happens to be on fabric. The difference is four things: the ink, the canvas weave, the stretcher wood, and the varnish. Skip any one and the piece ages from 'art' to 'print' within a year.",
      articles: [
        {
          num: '01',
          title: 'Why pigment ink outlives dye by a decade.',
          body: [
            "Most cheap canvas prints use **dye-based ink** — cheaper per millilitre, brighter out the nozzle, and prone to fading under any window light. **Pigment ink** suspends solid particles in the fluid, so the colour sits on the fibre rather than soaking into it. Archival ratings for pigment start at 75 years indoor lightfast. Dye on canvas starts fading visibly within 18 months under east-facing afternoon sun.",
            "We print on a **twelve-ink pigment system** with extended gamut — reds that actually read as warm, not cold pink, and blacks that stay neutral instead of shifting towards cyan as they age. The difference doesn't show on day one. It shows three Chinese New Years later, when the piece still looks like the file you sent us.",
          ],
          side: {
            kind: 'pills',
            label: 'Ink behaviour',
            items: [
              { text: 'Pigment · fade-resist', pop: true },
              { text: 'Dye · budget only' },
              { text: '12-ink extended gamut', pop: true },
              { text: 'Neutral-black calibrated' },
            ],
          },
        },
        {
          num: '02',
          title: 'Canvas weave — why 380gsm reads like painted texture.',
          body: [
            "Supermarket canvas sits around 280gsm with a tight weave that hides the fact it's a print. Our stock is **380gsm cotton-poly blend** with a deeper slub pattern — the weave catches raking light the way a stretched oil painting does, adding a subtle three-dimensionality that flat paper never will.",
            "The trade is the weave shows in your highlights. **Pure white areas** gain a soft texture instead of sheet flatness, which reads correct for art reproductions and painterly photography and slightly wrong for hard-edge graphic work. For graphic posters with big white fields, we'll recommend a paper mount instead and save you the canvas spend.",
          ],
          side: {
            kind: 'stat',
            label: 'Canvas weight',
            num: '380',
            suffix: 'gsm',
            caption: 'cotton-poly blend, gallery grade',
          },
        },
        {
          num: '03',
          title: 'Pine stretcher bars versus MDF — the humidity test.',
          body: [
            "Singapore humidity is the silent killer of cheap canvases. **MDF stretcher bars** soak up ambient moisture, swell, and warp — the canvas surface loses tension and sags within a year. **Solid pine stretchers**, kiln-dried before use, hold dimension through the 75–95% humidity swings an SG living room sees between monsoon and dry season.",
            "Every canvas we stretch is mounted on **kiln-dried pine bars at 38mm gallery depth**, with a **keyable back** — four small wedges you can tap if tension ever drops. That detail is standard on framed museum pieces and almost never on consumer canvases. It means the work is serviceable at year ten, not landfill.",
          ],
          side: {
            kind: 'list',
            label: 'Stretcher specs',
            rows: [
              { text: 'Wood', time: 'Kiln-dried pine' },
              { text: 'Depth', time: '38mm gallery' },
              { text: 'Back', time: 'Keyable' },
              { text: 'Hanging', time: 'Wire pre-mounted' },
            ],
          },
        },
        {
          num: '04',
          title: 'Satin or gloss varnish — what it actually protects against.',
          body: [
            "Varnish is not a finish choice — it's a protection layer. Unvarnished canvas is vulnerable to **UV fade, humidity creep, and fingerprint oils**. A clear varnish coat seals the pigment against all three, and picks a reflectivity to match the wall light it'll live in.",
            "**Satin** is the default and the picture-framer's pick — enough sheen to enrich dark tones, matte enough to not bounce the downlight back into your eye. **Gloss** is specialist: right for high-saturation photography, wrong for anywhere with strong directional lighting. If the canvas is going above a sofa under a pendant lamp, satin every time.",
          ],
          side: {
            kind: 'quote',
            text: 'Four canvases ordered, hung as one piece. Three years in a west-facing living room, zero fade.',
            attr: 'Collector, Holland Village',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🎨', title: '12-ink pigment system', desc: 'Archival pigment across twelve channels. Extended gamut for reds and warm neutrals that stay true.' },
      { icon_url: null, emoji: '🌲', title: 'Kiln-dried pine stretcher', desc: '38mm gallery depth, keyable back wedges, wire pre-mounted. Hangs straight out the box.' },
      { icon_url: null, emoji: '🛡️', title: 'Varnished for SG humidity', desc: 'Satin or gloss varnish layer sealed over the pigment. UV-resistant and wipe-cleanable.' },
      { icon_url: null, emoji: '👁️', title: 'Proof sheet on request', desc: 'A4 pigment proof before we pull the full size — so skin tones and brand colours land right.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 04 · BOOKS
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'books',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Printed on stock you can flip through.',
      right_note_body: 'Saddle-stitched to hardcover — all bound in-house, all on spec.',
      rows: [
        {
          need: "Annual report, board meeting *in ten days*, 48 pages",
          pick_title: 'A4, Perfect Binding, 48pp, Matt Lam cover',
          pick_detail: 'From S$6.50/pc · 5–6 day turnaround · flat-spine, shelf-ready',
        },
        {
          need: 'Product catalogue — clients *flip through it on a cafe table*',
          pick_title: 'A5, Saddle Stitch, 32pp, Matt Lam cover',
          pick_detail: 'From S$2.20/pc · lies flat when opened · hand-feel friendly',
        },
        {
          need: 'Coffee-table book for the *10-year company anniversary*',
          pick_title: 'A4, Hardcover, 80pp, Matt Lam',
          pick_detail: 'From S$22/pc · cloth-wrapped board option · archival weight paper',
        },
        {
          need: 'Training manual — *staff need to flip and scribble notes*',
          pick_title: 'A4, Wire-O Binding, 64pp, Gloss Lam cover',
          pick_detail: 'From S$4.80/pc · opens flat 360° · writing surface stays flat',
        },
        {
          need: 'Pitch zine, small run, *budget under one dollar per piece*',
          pick_title: 'A5, Saddle Stitch, 16pp, Matt Lam cover',
          pick_detail: 'From S$0.95/pc · cheapest path to a bound book · short-run friendly',
        },
      ],
    },
    seo_body:
      'Book printing Singapore — perfect bound catalogues, saddle-stitched zines, wire-O training manuals, hardcover anniversary books, annual report printing. Paper weights from 80gsm text to 300gsm covers, matt or gloss lamination, pages 8 to 200+.',
    seo_magazine: {
      issue_label: 'Issue №04 · Books',
      title: 'Everything worth knowing,',
      title_em: 'before you bind.',
      lede:
        "A printed book is judged in the first three seconds — the weight in the hand, the crack of the spine, the way a page feels between fingers. Those three seconds are decided by four production choices you lock in before we print. Binding, paper GSM, cover treatment, and print method.",
      articles: [
        {
          num: '01',
          title: 'Why perfect binding walks away with the premium look.',
          body: [
            "**Saddle stitch** — two staples through the spine — is the right call up to about 48 pages. Past that, the spine bulks, the pages splay open unevenly, and it starts to read as 'stapled zine' rather than 'book'. **Perfect binding** glues a wrapped cover onto a trimmed text block, giving you a flat spine you can print on, shelf without creasing, and hand to a client without apologising.",
            "**Wire-O** is the specialist pick — cookbooks, training manuals, technical documents that need to lie open on a desk. The double-loop wire opens a full 360° without fighting back. **Hardcover** is archival territory: a sewn block, board-mounted endpapers, 10-year shelf life minimum. For anniversary books and coffee-table pieces, it's the one.",
          ],
          side: {
            kind: 'list',
            label: 'Binding by page count',
            rows: [
              { text: '8–48pp', time: 'Saddle' },
              { text: '48–120pp', time: 'Perfect' },
              { text: '64–200pp (flat open)', time: 'Wire-O' },
              { text: '80pp+ (archival)', time: 'Hardcover' },
            ],
          },
        },
        {
          num: '02',
          title: 'The paper GSM decision that kills show-through.',
          body: [
            "**Show-through** is when dark text on page 5 ghosts onto page 4. It's the mark of underweight paper, and it makes a book look cheap even when the content is world-class. Newsprint sits at 55gsm. Standard office paper is 80gsm — the minimum we use for book interiors and only on short, text-only runs.",
            "For anything with images, we default to **100–128gsm matt text stock** — opaque enough to block show-through, thin enough to keep the book grip-friendly at 80+ pages. For photography-heavy catalogues, **157gsm silk** is the sweet spot: the slight sheen enriches image tones without going mirror-gloss, and the weight makes every page-turn feel intentional.",
          ],
          side: {
            kind: 'pills',
            label: 'Text paper picks',
            items: [
              { text: '80gsm · text-only', pop: false },
              { text: '100gsm · standard' },
              { text: '128gsm matt · mixed', pop: true },
              { text: '157gsm silk · image-heavy', pop: true },
            ],
          },
        },
        {
          num: '03',
          title: 'Digital versus offset — the run-length crossover.',
          body: [
            "Under about 500 copies, **digital printing** wins every time. No plate setup, no makeready waste, and per-page cost sits flat regardless of how many copies you order. The colour gamut is narrower than offset and solid fields can show slight banding — but for text-heavy books under 500 run, the economics and turnaround are unbeatable.",
            "Past 500 copies and into the thousands, **offset** flips the equation. The setup cost amortises across the run, per-copy price drops, and you gain access to **Pantone spot colours, metallic inks, and richer black density**. Annual reports with brand-specific navy, catalogues pushing 2,000+ copies — offset is the adult choice. We'll quote both and show you the break-even.",
          ],
          side: {
            kind: 'stat',
            label: 'Crossover point',
            num: '~500',
            suffix: 'copies',
            caption: 'digital under, offset over',
          },
        },
        {
          num: '04',
          title: 'Cover treatments — matt lam, spot UV, and foil.',
          body: [
            "**Matt lamination** is the current default and for good reason — it gives the cover a soft, museum-catalogue feel, shrugs off fingerprints better than gloss, and lets any subsequent foil or spot UV pop off it with genuine contrast. **Gloss lam** still has its place for punchy consumer catalogues and kids' books, but it shows every thumbprint within a week of shelf life.",
            "**Spot UV** over matt is where books start to feel properly bespoke — a glossy raised layer on just the logo or title, so the cover reads tactile before the book is opened. **Foil stamping** is the next tier up: stamped metal into the stock itself, reading as embossed metal under light. For a book that sits on a client coffee table for five years, it's worth every cent.",
          ],
          side: {
            kind: 'quote',
            text: 'We put the matt lam cover on the meeting room table and three directors picked it up before the pitch started.',
            attr: 'Marketing Lead, financial services',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '📖', title: 'Bindery in-house', desc: 'Saddle, perfect, wire-O and hardcover all bound on our floor — no outsourcing, no mystery lead times.' },
      { icon_url: null, emoji: '📄', title: 'Paper-weight matched to content', desc: 'We spec the text GSM against your image ratio. Image-heavy books get silk, text-only gets uncoated.' },
      { icon_url: null, emoji: '📐', title: 'Imposed for grain direction', desc: 'Pages laid out with grain parallel to the spine — the reason our perfect-bound books lie flat.' },
      { icon_url: null, emoji: '🏷️', title: 'Spine-printed on perfect bind', desc: 'Title lands on the spine, centred and readable, every time. Shelf-ready from the first copy.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 05 · DOOR HANGER
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'door-hanger',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Die-cut with the hole, not a sticker.',
      right_note_body: 'Stock heavy enough to hang clean on every handle we have tested.',
      rows: [
        {
          need: "Property launch — hanging on *every door in a 200-unit condo* next Tuesday",
          pick_title: 'Matt Lamination, Double Sided, 200pcs',
          pick_detail: 'From S$0.85/pc · 3–4 day turnaround · packed in 50s for fast distribution',
        },
        {
          need: "F&B grand opening — need *500 hangers across three HDB estates*",
          pick_title: 'Matt Lamination, Double Sided, 500pcs',
          pick_detail: 'From S$0.46/pc · bulk rate kicks in · map-ready packing',
        },
        {
          need: 'Estate-agent campaign that sits on doors *through two weeks of monsoon*',
          pick_title: 'Gloss Lamination, Double Sided, 300pcs',
          pick_detail: 'From S$0.63/pc · water-resistant lam · no warping on damp handles',
        },
        {
          need: 'Hotel room hanger — *high-end look, stays on the door for a full stay*',
          pick_title: 'Matt Lamination, Double Sided, 100pcs',
          pick_detail: 'From S$1.50/pc · premium card feel · tear-resistant die-cut',
        },
        {
          need: 'Test run, *one estate*, seeing if the concept works before scaling',
          pick_title: 'Matt Lamination, Single Sided, 100pcs',
          pick_detail: 'From S$1.50/pc · lowest-commit run · results-readable in a week',
        },
      ],
    },
    seo_body:
      'Door hanger printing Singapore — HDB estate drops, property launch campaigns, F&B promotion hangers, hotel privacy tags, real-estate listing hangers. 300gsm laminated card, clean die-cut hole, bundle-packed for door-by-door distribution.',
    seo_magazine: {
      issue_label: 'Issue №05 · Door Hangers',
      title: 'Everything worth knowing,',
      title_em: 'before you drop.',
      lede:
        "A door hanger sits on a handle for anywhere from three hours to three days. In that window it faces rain, aircon condensation, kids yanking it off, and the question of whether anyone actually reads it. Four production calls decide how it performs — stock weight, lamination, die-cut shape, and which side carries the hook.",
      articles: [
        {
          num: '01',
          title: 'Why 300gsm is the floor, not the spec.',
          body: [
            "Door hangers fail at the hole. Lightweight card — anything under 250gsm — tears around the die-cut within hours of hanging, especially when a curious kid gives it a tug. **300gsm art card** is the minimum stock that survives the twist-and-slide of going on and off a handle without the hole elongating.",
            "For estate drops going out in monsoon season, we'll step up to **350gsm** on the same unit price tier as competitors' 250gsm — the production difference is marginal, the survival rate in the wild goes up by a wide margin. A heavier hanger also sits flatter on the door rather than curling with humidity, and that visual difference is what separates 'campaign' from 'flyer someone dumped'.",
          ],
          side: {
            kind: 'pills',
            label: 'Stock weight',
            items: [
              { text: '300gsm · standard', pop: true },
              { text: '350gsm · monsoon season' },
              { text: '400gsm · hotel grade' },
              { text: '250gsm — we do not stock' },
            ],
          },
        },
        {
          num: '02',
          title: 'The lamination question that decides outdoor survival.',
          body: [
            "**Unlaminated card** on a door in SG's climate is a liability. Within an afternoon of condensation from the aircon vent opposite the door, the ink starts to flare at the edges and the card warps into a taco. Lamination is not a luxury here — it's the thing that makes a door hanger a door hanger.",
            "**Matt lamination** is our default — soft-touch, fingerprint-resistant, reads expensive in a hand-delivered hanger. **Gloss lamination** is actually more water-resistant and slightly cheaper, which is why we recommend it for high-volume estate drops where survival through a rain-shower matters more than tactile feel. Tell us the drop window and the weather pattern and we'll pick.",
          ],
          side: {
            kind: 'list',
            label: 'Lamination by use',
            rows: [
              { text: 'HDB estate drop', time: 'Matt or Gloss' },
              { text: 'Condo lobby drop', time: 'Matt (premium)' },
              { text: 'Monsoon-season run', time: 'Gloss (waterproof)' },
              { text: 'Hotel room hanger', time: 'Matt' },
            ],
          },
        },
        {
          num: '03',
          title: 'Die-cut profile — why the hole shape matters more than the card shape.',
          body: [
            "The **hole geometry** is what carries every gram of the hanger's weight. A round 30mm hole fits most condo and HDB handles, but sits loose on small Scandi-style lever handles. An **elongated teardrop hole** grips a wider range of handle diameters and has a higher tear-strength because stress distributes along the curve rather than pinpointing at the top.",
            "We default to the teardrop die — cut once, consistent across the full run, with a **minimum 8mm between hole edge and nearest card edge** to prevent tear-out. If you're handing these to a property manager for a specific condo block, tell us the handle type and we'll adjust the hole diameter rather than guessing.",
          ],
          side: {
            kind: 'stat',
            label: 'Tear-out rate',
            num: '<0.5%',
            caption: 'teardrop cut on 300gsm',
          },
        },
        {
          num: '04',
          title: 'Double-sided versus single-sided — the handle-flip test.',
          body: [
            "Nobody is guaranteed to see the side of the hanger you designed first. It might land on the inside of the door facing the flat, or on the outside facing the corridor. **Double-sided print** is the only spec that survives the handle-flip test — the resident sees a finished graphic either way, and the call-to-action lands regardless of orientation.",
            "We price double-sided as the default on every quote because single-sided hangers look unfinished when they land the wrong way round. The small incremental cost buys you a 2× uplift in actual message delivery rate. Single-sided is fine for pure interior use — hotel 'do not disturb' on the door-inside — and nowhere else.",
          ],
          side: {
            kind: 'quote',
            text: 'Distribution team fitted 180 in an hour because the bundles were packed in 50s with the design facing up. Small detail, big time save.',
            attr: 'Campaign Lead, property launch',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🎯', title: 'Teardrop die-cut', desc: 'Hole shape engineered for SG condo and HDB handle range. Tear-out under 0.5% in field tests.' },
      { icon_url: null, emoji: '💧', title: 'Laminated for weather', desc: 'Matt or gloss lam across every hanger — ink stays put through condensation and afternoon showers.' },
      { icon_url: null, emoji: '📦', title: 'Bundled for distribution', desc: 'Packed in 50s with the primary design facing up. Distribution crews clock in at 180+ per hour.' },
      { icon_url: null, emoji: '🔄', title: 'Double-sided default', desc: 'Both faces printed so the message lands regardless of how it hangs on the handle.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 06 · EASEL STAND
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'easel-stand',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Stands shipped ready to pop.',
      right_note_body: 'Poster mounted on board, hinged to the easel, in one box.',
      rows: [
        {
          need: 'Roadshow at a *Saturday mall event* — setup in under a minute, 5 boards',
          pick_title: 'A1 Poster Sticker, Foam Board, Black Easel',
          pick_detail: 'From S$48/pc · 3 day turnaround · unfolds in 20 seconds',
        },
        {
          need: 'Restaurant queue display — *daily menu changes, reused every dinner service*',
          pick_title: 'A2 Matt Lamination, Foam Board, Black Easel',
          pick_detail: 'From S$38/pc · wipeable front · folds flat between services',
        },
        {
          need: 'Product launch — need the *CEO photo at head-height* across three rooms',
          pick_title: 'A0 Gloss Lamination, Kapaline, Wooden Easel',
          pick_detail: 'From S$68/pc · photo reads crisp · wooden stand looks like event furniture',
        },
        {
          need: 'Art-show listing — *gallery-weight board that will not sag* in the humidity',
          pick_title: 'A1 Matt Lamination, Kapaline, Wooden Easel',
          pick_detail: 'From S$55/pc · heavier board · wooden tripod for gallery aesthetic',
        },
        {
          need: 'Pop-up at a *CBD lobby for one lunchtime only*, budget-tight',
          pick_title: 'A2 Poster Sticker, Foam Board, Black Easel',
          pick_detail: 'From S$38/pc · fastest-turn spec · full kit under S$50',
        },
      ],
    },
    seo_body:
      'Easel stand Singapore — A2 to A0 foam board posters, tripod display easels, roadshow standees, restaurant menu easels, product launch displays. Laminated or poster-sticker finish, foam or kapaline mounts, black tripod or wooden easel.',
    seo_magazine: {
      issue_label: 'Issue №06 · Easel Stands',
      title: 'Everything worth knowing,',
      title_em: 'before you unfold.',
      lede:
        "An easel stand is judged in the moment it goes up. Either it unfolds in twenty seconds into a clean display, or it teeters, sags, and you spend the first hour of your event fixing it. Four things decide that — board stock, lamination, easel construction, and whether the whole kit ships assembled.",
      articles: [
        {
          num: '01',
          title: 'Foam board versus kapaline — the sag test.',
          body: [
            "**Compressed foam board** is the default — 5mm of foam sandwiched between paper facers. It's lightweight, cheap, and holds straight up to A1 without drooping. For 90% of roadshow and mall-activation work, it's exactly the right spec. Where it struggles is at A0 and up, where the board's own weight starts to sag the middle over a full day.",
            "**Black kapaline board** is denser foam with a rigid compressed surface. It weighs more, costs more, and stays ruler-flat at A0 even in Singapore's humidity. For gallery work, wooden-easel displays, and anything that needs to look like event furniture rather than event signage, kapaline is the adult version of the same product.",
          ],
          side: {
            kind: 'pills',
            label: 'Board by size',
            items: [
              { text: 'A2 · foam', pop: true },
              { text: 'A1 · foam', pop: true },
              { text: 'A0 · kapaline' },
              { text: 'Gallery · kapaline' },
            ],
          },
        },
        {
          num: '02',
          title: 'Poster sticker, matt lam, gloss lam — and why the venue decides.',
          body: [
            "**Poster sticker** is the fastest, cheapest finish — direct adhesive-backed print onto the board. It reads clean at arm's length, fine under flat mall lighting, and is the right call for single-use roadshow runs where the board lives a week then gets recycled.",
            "**Matt lamination** shrugs off fingerprints and glare — the pick for restaurant menu boards that a waiter handles daily, or lobby displays under directional spotlights. **Gloss lamination** is what you want when the artwork is photo-heavy and you need colour saturation to punch through ambient light, and when the display is roped-off rather than hand-touched.",
          ],
          side: {
            kind: 'list',
            label: 'Finish by venue',
            rows: [
              { text: 'Mall roadshow', time: 'Poster sticker' },
              { text: 'Restaurant menu', time: 'Matt lam' },
              { text: 'CBD lobby', time: 'Matt lam' },
              { text: 'Photo-heavy launch', time: 'Gloss lam' },
            ],
          },
        },
        {
          num: '03',
          title: 'Black easel or wooden — reads cheap or reads deliberate.',
          body: [
            "The **black metal tripod easel** is the workhorse — it folds flat, ships in a slim box, and costs almost nothing to replace if someone kicks it at a roadshow. It reads as functional, which is either perfect or wrong depending on the event.",
            "The **wooden easel** is a different object. Beech or birch, tripod-form, with a proper adjustable lip — it looks like the easel in a gallery or a fine-dining daily-specials board. For product launches in hotel ballrooms, wedding menus at a garden venue, and any event where the easel is visible in every photograph, the wooden spec is the one that stops making the stand look like an afterthought.",
          ],
          side: {
            kind: 'stat',
            label: 'Upgrade rate',
            num: '38%',
            suffix: 'to wooden',
            caption: 'on launch and gallery jobs',
          },
        },
        {
          num: '04',
          title: 'Why the whole kit should arrive assembled.',
          body: [
            "A roadshow crew setting up at 7am in a mall atrium does not want to laminate, mount, and hinge their own boards. Every stand we ship comes **laminated, mounted to the board, and hinge-attached to the easel in one box** — unpack, unfold, position. Twenty seconds from cardboard to presentation.",
            "The other half of this is the **return-friendly pack**. Good easels get reused across a roadshow circuit — four weekends, six venues — and the box is designed to take the unit back down between gigs without crushing the board edges. A small detail that saves a reprint on gig four.",
          ],
          side: {
            kind: 'quote',
            text: 'Five stands, five minutes, done. Previous supplier had us sticking laminated posters onto raw foam at 6am.',
            attr: 'Activation Manager, FMCG launch',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '⚡', title: 'Ships assembled', desc: 'Poster laminated, mounted to board, hinged to easel — unfolds in 20 seconds at the venue.' },
      { icon_url: null, emoji: '📐', title: 'Board size-matched', desc: 'Foam for A2–A1, kapaline from A0 up. Nothing sags under Singapore humidity on a full event day.' },
      { icon_url: null, emoji: '🌳', title: 'Wooden easel option', desc: 'Beech tripod with adjustable lip when the stand needs to look like gallery furniture, not signage.' },
      { icon_url: null, emoji: '📦', title: 'Return-friendly box', desc: 'Packed so the kit survives multiple setups. Roadshow circuits reuse the same stands for months.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 07 · EMBROIDERY
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'embroidery',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Digitised before the first stitch.',
      right_note_body: 'Stitch path mapped to your fabric so the logo does not pucker.',
      rows: [
        {
          need: 'Corporate gifting — *100 polo shirts by the end of next week* for client handover',
          pick_title: 'Polo Shirt, Left Chest, Up to 6,000 stitches',
          pick_detail: 'From S$30/pc · 5–7 day turnaround · colour-matched to your brand guide',
        },
        {
          need: "You already bought the garments — *bring them to us and add the logo*",
          pick_title: 'I supply garment, Left Chest, Up to 3,000 stitches',
          pick_detail: 'From S$5.50/pc · no garment markup · digitised once, stitched across the lot',
        },
        {
          need: 'Team jackets for the *office retreat at Desaru* — name on chest, logo on back',
          pick_title: 'Jacket, Back + Left Chest, Up to 10,000 stitches',
          pick_detail: 'From S$62/pc · name-per-piece variable · 3D foam option for the back mark',
        },
        {
          need: 'Cap drop for the running club, *logo must survive 50 sweat washes*',
          pick_title: 'Cap, Front, Up to 6,000 stitches',
          pick_detail: 'From S$23.50/pc · flat or 3D stitch · runs 40+ wash cycles without fade',
        },
        {
          need: 'Tote-bag event giveaway, *small mark, budget-friendly*',
          pick_title: 'Bag/Tote, Left Chest, Up to 3,000 stitches',
          pick_detail: 'From S$17.50/pc · lowest-stitch tier · scales to 200+ units cleanly',
        },
      ],
    },
    seo_body:
      'Embroidery Singapore — polo shirt embroidery, cap and hat stitching, jacket back-logo embroidery, corporate uniform branding, digitised logo stitching on supplied garments. Stitched in-house across polycotton, canvas, denim and fleece.',
    seo_magazine: {
      issue_label: 'Issue №07 · Embroidery',
      title: 'Everything worth knowing,',
      title_em: 'before you stitch.',
      lede:
        "Embroidery is the one decoration method that survives everything a uniform goes through — hot washes, bleach splashes, five-year rotations — and the one where the difference between a good job and a bad one is invisible on day one. Stitch count, digitising, stabiliser choice, and thread type. Here's what actually matters.",
      articles: [
        {
          num: '01',
          title: 'Why the digitising file is the whole job.',
          body: [
            "An embroidery machine does not read your logo. It reads a **digitised stitch file** — a vector of thread paths, stitch directions, density, and underlay mapped one-to-one onto the hoop. Every pucker, gap, or ugly fill comes back to a weak digitise. A flat JPG handed to a machine produces a flat, wrong result.",
            "We digitise every logo before the first sample — testing **stitch direction against fabric grain**, laying **underlay stitches** so fills don't warp the fabric, and mapping the **pull compensation** so small type doesn't get swallowed by the stitch spread. That file gets kept on our server so every reorder, even three years later, stitches identically to the first run.",
          ],
          side: {
            kind: 'pills',
            label: 'Digitising decisions',
            items: [
              { text: 'Stitch direction', pop: true },
              { text: 'Underlay density' },
              { text: 'Pull compensation', pop: true },
              { text: 'Colour sequence' },
            ],
          },
        },
        {
          num: '02',
          title: 'Stitch count — what you are actually paying for.',
          body: [
            "Embroidery is priced by stitches, not by physical size. A small intricate logo can hit 8,000 stitches; a large clean wordmark might sit at 3,000. **3,000 stitches** covers most simple left-chest logos cleanly — one or two colours, solid fills, no fine gradients. It's the floor for professional work and the sweet spot for text-plus-mark marks.",
            "Past **6,000 stitches**, you're into dense logos, detailed marks, and multi-colour executions. At **10,000 stitches and up**, we're stitching full back-of-jacket pieces with shading and gradients. We'll quote the digitise and tell you which tier your artwork lands in before you commit — no surprise upcharge after proof.",
          ],
          side: {
            kind: 'list',
            label: 'Stitches by job',
            rows: [
              { text: 'Left-chest mark', time: '~3,000' },
              { text: 'Logo + wordmark', time: '~6,000' },
              { text: 'Cap front (dense)', time: '~6,000' },
              { text: 'Back of jacket', time: '10,000+' },
            ],
          },
        },
        {
          num: '03',
          title: 'Fabric grain and stabiliser — the reason your stitch does not pucker.',
          body: [
            "The invisible part of every embroidery job is the **stabiliser** — a backing material hooped behind the fabric to stop it distorting under stitch tension. Wrong stabiliser and your polo logo looks flat-packed; right stabiliser and it sits cleanly on the chest as the shirt moves.",
            "For **polyester polos and knits**, we use a cutaway stabiliser that stays in permanently and supports the stitch through every wear and wash. For **caps**, we switch to a stiffer tearaway because the brim needs rigidity. For **denim and canvas**, the fabric does the work itself and we run a light tearaway to keep the job clean. Different fabrics, different setups — same logo, consistent look.",
          ],
          side: {
            kind: 'stat',
            label: 'Re-hoop tolerance',
            num: '<0.5mm',
            caption: 'across a 100-piece run',
          },
        },
        {
          num: '04',
          title: 'Polyester thread, rayon, and which one survives the wash.',
          body: [
            "The thread sitting on your uniform matters almost as much as the stitch plan. **Polyester embroidery thread** is the default for workwear — colour-fast, bleach-tolerant, and rated for 50+ wash cycles at 60°C. It has a slight sheen but not an aggressive one, reading as professional rather than novelty.",
            "**Rayon thread** has a brighter, silkier finish — right for fashion pieces and presentation garments, wrong for anything going into a commercial laundry. The colour bleeds under bleach and fades faster than polyester at high temperatures. If your logo spec includes a bright pop colour, we'll default to polyester and match it as close to the brand guide as the thread system allows, with a **DMC or Madeira reference number** logged for every reorder.",
          ],
          side: {
            kind: 'quote',
            text: 'Reordered our polos two years later and the logo stitched identically. That is what we pay for.',
            attr: 'HR Lead, hospitality group',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '🎯', title: 'Digitised in-house', desc: 'Your logo mapped to stitch paths before a needle moves. File kept on server for consistent reorders.' },
      { icon_url: null, emoji: '🧵', title: 'Polyester thread default', desc: 'Colour-fast, bleach-tolerant, 50+ wash cycles at 60°C. Rayon available for fashion pieces.' },
      { icon_url: null, emoji: '📎', title: 'Stabiliser per fabric', desc: 'Cutaway for polos, tearaway for caps, light backing on denim. Logo sits clean on every weight.' },
      { icon_url: null, emoji: '🎨', title: 'Thread-number logged', desc: 'DMC or Madeira reference saved per job — reorders stitch in the same colour three years later.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 08 · ENVELOPES
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'envelopes',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Printed, folded, and gummed flat.',
      right_note_body: 'Ships boxed 500-up so they feed cleanly into any franking machine.',
      rows: [
        {
          need: "Statement run — *1,000 DL envelopes with the window aligned to our letter template*",
          pick_title: 'DL Window, White 80gsm, Peel & Seal',
          pick_detail: 'From S$0.15/pc · 3–4 day turnaround · window dielines supplied on request',
        },
        {
          need: 'Invitation mail-out — *500 C5 envelopes, feel premium in the hand*',
          pick_title: 'C5, Kraft Brown, Peel & Seal',
          pick_detail: 'From S$0.22/pc · natural kraft feel · pairs with C5 folded cards',
        },
        {
          need: 'Document mailer — *C4 for sending unfolded A4s, lots of them*',
          pick_title: 'C4, White 80gsm, Gummed',
          pick_detail: 'From S$0.40/pc · fits A4 flat · bulk-gummed for hand-sealing',
        },
        {
          need: 'Brand stationery set to *sit on the reception desk next to the letterhead*',
          pick_title: 'DL, White 80gsm, Peel & Seal',
          pick_detail: 'From S$0.10/pc · colour-matched to letterhead run · logo-only back flap',
        },
        {
          need: 'Small run — *200 envelopes for a specific client mailer*, not a stockpile',
          pick_title: 'C5, White 80gsm, Peel & Seal',
          pick_detail: 'From S$0.25/pc · short-run digital print · no 1,000-unit minimum',
        },
      ],
    },
    seo_body:
      'Envelope printing Singapore — DL window envelopes, C4 document mailers, C5 invitation envelopes, kraft brown envelopes, branded peel-and-seal stationery. White 80gsm and kraft stock, franking-machine ready, short-run digital and bulk offset.',
    seo_magazine: {
      issue_label: 'Issue №08 · Envelopes',
      title: 'Everything worth knowing,',
      title_em: 'before you seal.',
      lede:
        "The envelope is the first piece of brand someone touches, and the first piece most companies get wrong. Paper weight, window alignment, closure type, and how the ink sits on the flap — four details that decide whether your mail reads 'received' or 'ignored'. Here's each one plain.",
      articles: [
        {
          num: '01',
          title: 'Why 80gsm is the floor and 100gsm is the upgrade.',
          body: [
            "Standard commercial envelope stock sits at **80gsm wove paper** — thin enough for franking machines to feed without jamming, thick enough to hide a folded A4 inside. Go below 80gsm and the envelope reads as transparent under office lighting, which is fine for junk mail and all wrong for invoices or invitations.",
            "**100gsm uncoated** is the tactile upgrade — heavier in the hand, noticeably richer when opened, and still franking-machine compatible. We default to 80gsm because most clients want mailroom-friendly, and we'll push to 100gsm for any envelope with a brand letterhead inside. The cost difference is small; the hand-feel difference is the thing a recipient remembers.",
          ],
          side: {
            kind: 'pills',
            label: 'Paper weight',
            items: [
              { text: '80gsm · standard', pop: true },
              { text: '100gsm · brand' },
              { text: 'Kraft 90gsm · natural', pop: true },
              { text: '120gsm · premium' },
            ],
          },
        },
        {
          num: '02',
          title: 'Window envelopes — the alignment detail nobody checks.',
          body: [
            "A **DL window envelope** is only as good as the **window-to-address-block alignment**. The standard SG window sits 45mm from the left edge, 53mm from the top, measured to the window's top-left corner. If your letter template's address block doesn't hit that rectangle after folding, the window shows blank paper and the whole mailer looks broken.",
            "We supply a **preflight dieline** on request, so your print team can position the address block correctly on the letter before the envelope arrives. Better to match the letter to the envelope than reprint either. For non-standard window positions — left-aligned brand windows, landscape window envelopes — we'll quote custom die and walk you through the template lock-up.",
          ],
          side: {
            kind: 'list',
            label: 'Window spec',
            rows: [
              { text: 'Position (left)', time: '45mm' },
              { text: 'Position (top)', time: '53mm' },
              { text: 'Size', time: '90×35mm' },
              { text: 'Material', time: 'Glassine' },
            ],
          },
        },
        {
          num: '03',
          title: 'Peel-and-seal versus gummed — and the humidity problem.',
          body: [
            "**Peel-and-seal** has a latex strip under a paper release liner. Peel the liner, press, done. It's the modern default because it survives Singapore humidity without pre-sealing — gummed envelopes stored in an unairconditioned stockroom can self-seal in an aircon-transition humidity spike. Peel-and-seal shrugs off that whole problem.",
            "**Gummed envelopes** still have a place — they're cheaper per unit, they feed through high-volume automated inserting machines faster, and for statement-mail runs of 10,000+ where the envelopes move straight from print to franking to post, gummed is the industrial-grade spec. For anything sitting in an office stockroom for more than a month, peel-and-seal is the safer bet.",
          ],
          side: {
            kind: 'stat',
            label: 'Self-seal rate',
            num: '~0%',
            caption: 'peel-and-seal after 6 months stock',
          },
        },
        {
          num: '04',
          title: 'Printing on the flap — why it looks cheap done wrong.',
          body: [
            "The back flap is the brand face when the envelope is flipped to open. A **single-colour logo on the flap** reads as stationery; a **full-bleed flap print** either looks bespoke or looks cheap, depending on execution. The trap is ink bleed across the flap fold — if the print runs onto the adhesive area, the envelope jams shut during sealing or the ink flakes off with the release liner.",
            "We mask a **3mm clear zone around the adhesive strip** on every flap print, so the seal stays clean and the ink doesn't lift. For flap prints that include text or logo, we'll position them **12mm from the fold** so the graphic isn't bisected by the crease line. Small layout decisions that separate a branded envelope from a printing accident.",
          ],
          side: {
            kind: 'quote',
            text: 'Our window alignment was off on the first proof. They caught it, sent a dieline, we fixed the letter template. Saved us reprinting 5,000 envelopes.',
            attr: 'Operations Manager, insurance',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '📐', title: 'Window dieline supplied', desc: 'Preflight template so your letter address block hits the window after the A4 fold. No blank-window mailers.' },
      { icon_url: null, emoji: '🔒', title: 'Peel-and-seal default', desc: 'Latex strip under paper liner. Survives months in unairconditioned stockrooms without self-sealing.' },
      { icon_url: null, emoji: '🖨️', title: 'Flap-safe print zone', desc: '3mm clear around the adhesive strip so ink never blocks the seal or flakes off with the release liner.' },
      { icon_url: null, emoji: '📦', title: 'Boxed for franking', desc: 'Packed 500-up in flat boxes so envelopes feed cleanly into every franking machine we have tested.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 09 · FLYERS
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'flyers',
    matcher: {
      kicker: 'Quick guide',
      title: "Tell us the job,\nwe'll tell you",
      title_em: 'the pick.',
      right_note_title: 'Trimmed, banded, distribution-ready.',
      right_note_body: 'Bundled in 50s or 100s so street teams hit the pavement faster.',
      rows: [
        {
          need: "You're dropping *5,000 units* into residential estates next week",
          pick_title: 'A5, 128gsm Art Paper, Double Sided, No Lamination',
          pick_detail: 'From S$0.08/pc · 3–4 day turnaround · bundled 100-up for drop teams',
        },
        {
          need: 'F&B menu flyer — *has to survive being dropped in soup at a dinner table*',
          pick_title: 'A4, 157gsm Art Paper, Double Sided, Matt Lamination',
          pick_detail: 'From S$0.28/pc · wipeable surface · folds sharp at A5',
        },
        {
          need: 'Property launch handout — the *paper weight should read premium*',
          pick_title: 'A4, 157gsm Art Paper, Double Sided, Gloss Lamination',
          pick_detail: 'From S$0.26/pc · heavy in the hand · photos pop under showroom lights',
        },
        {
          need: "Event handout — *street team distributing 2,000 at Bugis MRT* this Saturday",
          pick_title: 'DL, 128gsm Art Paper, Double Sided, No Lamination',
          pick_detail: 'From S$0.09/pc · letterbox-friendly size · CTA reads in a three-second glance',
        },
        {
          need: 'Small test run, *1,000 pieces*, gauging response before scaling',
          pick_title: 'A5, 115gsm Art Paper, Double Sided, No Lamination',
          pick_detail: 'From S$0.14/pc · lightest usable stock · cheapest entry point',
        },
      ],
    },
    seo_body:
      'Flyer printing Singapore — A4 and A5 promotional flyers, DL letterbox flyers, F&B menu flyers, property launch handouts, HDB estate drops and MRT street distribution. Art paper from 115 to 157gsm, matt or gloss lamination, bulk-bundled for distribution crews.',
    seo_magazine: {
      issue_label: 'Issue №09 · Flyers',
      title: 'Everything worth knowing,',
      title_em: 'before you drop.',
      lede:
        "A flyer is judged in the split-second someone decides to fold it into a pocket or drop it in a bin. That decision is fifty percent design and fifty percent production — the paper weight, the size format, the finish, and how it's packed for the crew distributing it. Four decisions below, plain.",
      articles: [
        {
          num: '01',
          title: 'Paper weight — why 128gsm is the sweet spot.',
          body: [
            "**115gsm art paper** is the budget floor — light, cheap, the right call for test runs and ultra-high-volume estate drops where unit cost dominates. It reads as a flyer, which is fine when the job is reach, not prestige. **128gsm** is where flyers start to feel like intentional marketing: enough body in the hand that it doesn't bend on the walk from letterbox to kitchen table.",
            "**157gsm art paper** is premium territory — it reads as a small brochure rather than a flyer, with enough weight to feel like an object. For property launches, F&B menu mailers, and anything with full-colour photography where the image quality needs to register immediately, 157gsm is the spec that justifies itself. Heavier than that is usually overkill — at 200gsm+ you're in booklet-cover territory and paying for it.",
          ],
          side: {
            kind: 'pills',
            label: 'Paper by job',
            items: [
              { text: '115gsm · test runs', pop: false },
              { text: '128gsm · standard', pop: true },
              { text: '157gsm · premium', pop: true },
              { text: '200gsm · use postcards' },
            ],
          },
        },
        {
          num: '02',
          title: 'Size format — A4, A5, or DL, and why it matters at the letterbox.',
          body: [
            "**A5 is the default for estate drops** because it fits every HDB and condo letterbox slot without folding. A4 is still standard for hand-distribution at events and showrooms — the larger format carries more complex information and reads as a brochure rather than a handout.",
            "**DL (99×210mm)** is the specialist pick. It's the same footprint as a business envelope, which means it **slides clean into every letterbox in Singapore** including the narrow slots on landed-property gates. For MRT and street-team distribution, DL is also the easiest size for a recipient to fold once into a back pocket, which raises the odds of it surviving the trip home. Bugis at peak hour, DL wins every time.",
          ],
          side: {
            kind: 'list',
            label: 'Format by venue',
            rows: [
              { text: 'HDB letterbox drop', time: 'A5' },
              { text: 'Condo estate drop', time: 'A5' },
              { text: 'Street / MRT distribution', time: 'DL' },
              { text: 'Showroom / event handout', time: 'A4' },
            ],
          },
        },
        {
          num: '03',
          title: 'Matt lam, gloss lam, or no lam — the survival math.',
          body: [
            "**Unlaminated flyers** are fine for single-use drops where the flyer is read, acted on, and recycled within a week. Laminating them adds cost that's wasted if the piece has a 48-hour lifespan. For a restaurant 10%-off drop ending Sunday, no lamination is the correct call.",
            "**Matt lamination** earns its cost on anything that needs to survive longer than three days in a humid kitchen or a handbag — F&B menu flyers, promotional leaflets posted onto fridges, property launch handouts clients study for a week. **Gloss lamination** is the pick when the artwork is photo-heavy and saturation matters; it also adds a small but real degree of water-resistance against the monsoon drop a letterbox takes in a sudden shower.",
          ],
          side: {
            kind: 'stat',
            label: 'Lamination adoption',
            num: '41%',
            suffix: 'of A4 jobs',
            caption: 'matt lamination',
          },
        },
        {
          num: '04',
          title: 'Grain direction, trim, and banded packing — the field details.',
          body: [
            "A flyer the crew can't distribute fast is a flyer that gets half-distributed. **Grain direction** matters: paper grain running **parallel to the long edge** keeps the flyer flat in humid air and stops curl at the tips. A curled flyer is harder to post through a slot and reads as damaged before anyone even picks it up.",
            "We also **banded-pack every flyer run in 50s or 100s** with the primary design face-up — distribution crews can see what they're handing out without flipping every piece, and packs feed cleanly from the stack into the slot. A field team moving through a 400-unit HDB block clocks 60+ drops an hour with properly banded flyers, against 35–40 with loose ones.",
          ],
          side: {
            kind: 'quote',
            text: 'Second supplier. First one where the flyers did not curl in the humidity by the end of the shift.',
            attr: 'Field Lead, F&B chain',
          },
        },
      ],
    },
    how_we_print: [
      { icon_url: null, emoji: '📏', title: 'Grain parallel to long edge', desc: 'Paper grain set so flyers stay flat in SG humidity. No curled tips at the letterbox.' },
      { icon_url: null, emoji: '📦', title: 'Banded in 50s or 100s', desc: 'Bundled face-up so distribution crews clock 60+ drops per hour instead of 35.' },
      { icon_url: null, emoji: '✂️', title: 'Guillotine-trimmed edges', desc: 'Clean trim on every side — no ragged corners from rotary cutters. Stacks square, feeds clean.' },
      { icon_url: null, emoji: '💧', title: 'Lamination when it earns it', desc: 'Matt or gloss lam only on jobs that outlive the week. No wasted cost on single-drop runs.' },
    ],
  },
];
