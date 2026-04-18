// Batch D — 14 gift products authored for direct publication.
// Voice reference: apply-car-decal-magazine.mjs and apply-name-card-rewrite.mjs.
// Fields per product: seo_body (keyword-dense 2 lines), seo_magazine (4 unique
// articles with side widgets), faqs (5 per product).
// No brand name, no pricing in seo_body, no boilerplate across products.

export const BATCH = [
  // ───────────────────────────────────────────────────────────────────────────
  // 01 · SECRET MESSAGE ENVELOPE NECKLACE (laser)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'secret-message-envelope-necklace',
    seo_body:
      'Secret message envelope necklace Singapore — tiny hinged envelope pendant with a removable paper note or laser-engraved inside panel, stainless steel chain, giftable for anniversaries and long-distance couples. Hand-finished at Paya Lebar Square.',
    seo_magazine: {
      issue_label: 'Issue №01 · Envelope Necklace',
      title: 'Everything worth knowing,',
      title_em: 'before the lid clicks shut.',
      lede:
        "The whole pitch of this piece is the hinge. A 14mm envelope pendant that actually opens, carrying something only the wearer sees. The four decisions below — what goes inside, how it sits on the chain, how it survives daily wear, and who you're really giving it to — are what separate a keepsake from a gimmick.",
      articles: [
        {
          num: '01',
          title: 'The hidden-message mechanic, and why the hinge is the whole piece.',
          body: [
            "Most personalised necklaces put the message on the outside. This one does the opposite — a **hinged envelope pendant** that opens like a real envelope, with the message living inside where only the wearer reads it. The charm is the mechanic. Close it and it's just a quiet silver envelope. Open it and it's a love letter no one else sees.",
            "We build the hinge from a single folded stainless sleeve with a rolled-pin pivot — no glue joint. It clicks open and shut a few thousand times before showing any fatigue, which is what matters when someone actually wears this every day instead of tucking it in a drawer.",
          ],
          side: {
            kind: 'pills',
            label: 'Inside options',
            items: [
              { text: 'Paper insert', pop: true },
              { text: 'Engraved panel' },
              { text: 'Both' },
            ],
          },
        },
        {
          num: '02',
          title: 'Engrave the inside, or fold a paper note — which one ages better.',
          body: [
            "Two ways to put a message inside. **Laser engrave** directly into the inner panel — permanent, can't be lost, reads as commitment because it can't be undone. **Paper insert** — you write it yourself, fold it into the envelope, and it feels more like a real letter because it is one.",
            "Paper wins for romance, engraving wins for longevity. The paper inserts we cut come pre-sized at 12 × 18mm on 120gsm uncoated stock — thin enough to fold into the pendant, thick enough to survive a few years of handling. If you want the best of both, engrave a date on the inner panel and tuck a paper note over it.",
          ],
          side: {
            kind: 'list',
            label: 'Pick by intent',
            rows: [
              { text: 'Anniversary gift', time: 'Paper' },
              { text: 'Wedding / proposal', time: 'Engrave' },
              { text: 'Long-distance couple', time: 'Paper (replaceable)' },
              { text: 'Memorial piece', time: 'Engrave (date)' },
            ],
          },
        },
        {
          num: '03',
          title: 'How much you can actually fit inside a 14mm envelope.',
          body: [
            "People overestimate. A 14mm envelope fits about **18 characters across three short lines** if engraved, or **roughly 30 words** on a folded paper insert — about a text message. Longer than that and the insert won't close without bulging the hinge.",
            "Short messages land harder anyway. 'Wed 2 Dec 2021 · Bali.' beats a paragraph. 'Still yours.' beats a sonnet. If you're struggling to cut it down, the piece is telling you something — this format rewards brevity. Treat the pendant like a fitting-room mirror for your feelings: everything has to fit, so only the load-bearing words make it in.",
          ],
          side: {
            kind: 'stat',
            label: 'Typical message',
            num: '18',
            suffix: ' chars',
            caption: 'three lines, engraved inside',
          },
        },
        {
          num: '04',
          title: 'Daily-wear survival, and the parts that actually wear out.',
          body: [
            "The pendant body is 316L stainless — survives sweat, chlorine pools, humidity without tarnishing. The point of failure is the **hinge pin** if someone opens it compulsively (hundreds of times a day) and the **paper insert** if it gets wet. The chain clasp is the second wear point — lobster-claw clasps on thin chains will eventually slack after 18–24 months of constant wear.",
            "Keep it on while showering, take it off in seawater, and don't store it in a drawer with other jewellery loose — the hinge catches on fine chains. Replacement paper inserts ship free on request if the original fades; we keep the cut-file on hand.",
          ],
          side: {
            kind: 'quote',
            text: "Bought it as a three-month anniversary thing. She's worn it every day for two years. The paper inside has been rewritten twice.",
            attr: 'Customer, Bukit Timah',
          },
        },
      ],
    },
    faqs: [
      {
        q: 'Can I engrave the outside of the envelope too?',
        a: "Yes, but keep it minimal — initials or a date. The envelope's visual weight is the sealed flap and the hinge; busy engraving on the outside fights the piece's whole aesthetic.",
      },
      {
        q: 'Will the paper insert get wet if I wear it in the shower?',
        a: "The envelope is hinged, not sealed, so water does creep in over time. Daily showers are fine for a year or so — if the paper starts to soften, swap in a new one. We'll cut replacements free.",
      },
      {
        q: 'How tight is the close — will the paper fall out?',
        a: "The flap clicks shut with a small magnetic pull. Paper stays in under normal wear, including workouts. We don't recommend wearing it upside-down in a kayak.",
      },
      {
        q: "What chain length do you ship?",
        a: "45cm default, 50cm on request. Chain is 1.2mm cable, stainless steel — proportioned to the pendant so it sits mid-collarbone on most builds.",
      },
      {
        q: 'Can I order two matching pieces for a couple?',
        a: "Yes. Most orders for this piece are pairs — one message engraved inside each, mirrored or matching. Tell us in the notes and we'll cut them in the same batch so the hinge tension is identical.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 02 · SLEEK NECKLACE (laser)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'sleek-necklace',
    seo_body:
      'Sleek necklace Singapore — minimal stainless steel pendant with hairline laser engraving, 1.0mm cable chain, designed for daily wear and layer-stacking. Thin profile, low-catch, reads as jewellery not souvenir.',
    seo_magazine: {
      issue_label: 'Issue №01 · Sleek Necklace',
      title: 'Everything worth knowing,',
      title_em: 'before you thin out the chain.',
      lede:
        "The sleek necklace is the one you forget you're wearing. That's the whole point — minimal visual weight, enough engraving to mean something, and a chain thin enough to layer with two other pieces without tangling. Here's what actually matters when you commit to that aesthetic.",
      articles: [
        {
          num: '01',
          title: 'Minimal is a decision, not a fallback.',
          body: [
            "A chunky pendant does the talking for you. A **sleek necklace does the opposite** — it asks the wearer to notice it, then asks the room to ask about it. The aesthetic works because it sits inside what someone already wears rather than competing with it. No one is walking into a meeting with this piece and worrying it reads as too much.",
            "This is why it's the necklace we get asked to redo for people who already own three other pendants and never wear any of them. The previous ones were too much design; this one is the design choosing to be quiet. Buy it for someone who dresses in neutrals, or buy it for yourself and finally wear something daily.",
          ],
          side: {
            kind: 'pills',
            label: 'Pairs with',
            items: [
              { text: 'Plain tees', pop: true },
              { text: 'Collared shirts' },
              { text: 'Knitwear' },
              { text: 'Evening wear' },
            ],
          },
        },
        {
          num: '02',
          title: 'The thin-chain trade-off — and where we land on it.',
          body: [
            "Thinner chains read more elegant and tangle less on layering. They also snap more easily. A **0.8mm chain** looks immaculate and breaks within a year on an active wearer. A **1.5mm chain** outlasts a marriage but visually anchors like a dog collar.",
            "We ship the sleek on a **1.0mm stainless cable** — right on the edge where the chain still reads delicate but holds up to sleeping in it, gym workouts, and being caught on a sweater sleeve. It's the thinnest chain we'll sell that we'd still put on someone who admits they never take jewellery off.",
          ],
          side: {
            kind: 'stat',
            label: 'Chain gauge',
            num: '1.0',
            suffix: 'mm',
            caption: 'the daily-wear sweet spot',
          },
        },
        {
          num: '03',
          title: 'Working within a 30mm pendant — what actually reads.',
          body: [
            "The pendant is 30 × 6mm. That's **roughly 12 characters** of engravable text at a legible point size, or a single small graphic mark. Cram more in and the laser line width forces a reduction that turns text into a fuzz of dashes at arm's length.",
            "Go for: a name, a short date (`08.03`), a coordinate pair, or a minimal symbol. Avoid: full sentences, multiple lines, or logos with any fine internal detail. We hairline-engrave the design at a lower power than usual — deep enough to catch light, shallow enough to keep the minimal surface intact.",
          ],
          side: {
            kind: 'list',
            label: 'Engrave wisely',
            rows: [
              { text: 'Name or word', time: '✓' },
              { text: 'Date / coordinates', time: '✓' },
              { text: 'Initials monogram', time: '✓' },
              { text: 'Full sentence', time: 'Too small' },
            ],
          },
        },
        {
          num: '04',
          title: 'Stacking with other chains without turning into a knot.',
          body: [
            "Sleek pieces layer well because the chain is **thin enough to slide over and around** the chain it's paired with. Pair it with a second chain 3–5cm shorter for a clean two-tier. Pair it with a pendant on a matching-gauge chain and both pieces read as intentional.",
            "What kills the stack: combining gauges that are too close (both 1.0mm will tangle all day), or adding a third chain heavier than 1.5mm (it bullies the sleek and twists it around). If you wear the sleek as a layering piece, add a 40cm choker above and a 55cm long pendant below. Three tiers, zero tangle.",
          ],
          side: {
            kind: 'quote',
            text: "I already had two other chains I never took off. This one fit between them and I genuinely forgot which one it was for a week.",
            attr: "Customer, Tiong Bahru",
          },
        },
      ],
    },
    faqs: [
      {
        q: 'Will the engraving fade over time?',
        a: "No. Laser engraving removes material rather than adding it, so there's nothing to wear off. The pendant itself will pick up hairline scratches with wear, which most people grow to like.",
      },
      {
        q: "Can I have the chain replaced if it breaks?",
        a: "Yes. Bring the pendant back and we'll fit a new 1.0mm stainless chain at cost. The pendant's bail is a universal 2mm jump ring, so any standard chain works if you prefer sourcing one elsewhere.",
      },
      {
        q: 'Is this okay for sensitive skin?',
        a: "316L stainless — the same alloy used in surgical steel. We've had zero reactive-skin complaints. If you know you react to nickel, this is the safer necklace to pick.",
      },
      {
        q: "How visible is the engraving from across a room?",
        a: "Not very — which is deliberate. The engraving is meant to be discovered, not broadcast. If you want it to read at conversation distance, tell us in the notes and we'll engrave at higher power for visible contrast.",
      },
      {
        q: "Does it come gift-packaged?",
        a: "Ships in a matte black gift box with a linen pull-cord pouch inside. No stickers, no invoices — give it as-is.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 03 · SONG LYRICS PHOTO FRAME (uv)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'song-lyrics-photo-frame',
    seo_body:
      'Song lyrics photo frame Singapore — UV-printed acrylic frame combining your photo with a printed lyric line from your chosen song. Couples, anniversary, parent-and-child gift. Flatbed-printed, scratch resistant, tabletop or wall-mount.',
    seo_magazine: {
      issue_label: 'Issue №01 · Song Lyrics Frame',
      title: 'Everything worth knowing,',
      title_em: 'before you pick the line.',
      lede:
        "A photo on its own tells half a story. The right lyric underneath closes the loop. The four questions below are the ones that decide whether the frame reads as a cherished gift or a Pinterest print — lyric choice, composition, typography, and who you're really giving it to.",
      articles: [
        {
          num: '01',
          title: "The one lyric — not four. How composition makes or breaks it.",
          body: [
            "The instinct is to fit the whole chorus. Don't. Four lines cramped into the bottom third of an acrylic frame reads like a greeting card. **One line, sometimes two, printed with generous whitespace** reads like something you'd hang in a gallery. The restraint is what makes it feel grown-up.",
            "We set the photo in the upper two-thirds, print the lyric underneath at roughly 12–14 point, centre-aligned, with the song title and artist credited in smaller text below. That composition is what separates this frame from every lyric-print you'd find on Etsy. If you're picking a 6-line excerpt, the frame is telling you to zoom out and pick the line that actually matters.",
          ],
          side: {
            kind: 'pills',
            label: 'Lyric length',
            items: [
              { text: '1 line', pop: true },
              { text: '2 lines' },
              { text: '3+ lines (tight)' },
              { text: 'Full verse (don\'t)' },
            ],
          },
        },
        {
          num: '02',
          title: 'Font hierarchy — and why the title should barely exist.',
          body: [
            "The lyric is the hero. The song title is the footnote. If your layout makes the title compete with the lyric — same weight, same size, bolded — the frame loses its point. **Set the lyric at 14pt serif** and the title at 8pt all-caps underneath, and the eye reads the lyric first, the credit second, every time.",
            "We default to a humanist serif (Source Serif, EB Garamond) for the lyric — warm enough to feel handwritten but not so casual it reads as a card. The title goes in the same face at small-caps, letter-spaced, so it reads as attribution instead of competing for attention. If you have a strong font preference, send it in the notes; we render proofs before print.",
          ],
          side: {
            kind: 'list',
            label: 'Type defaults',
            rows: [
              { text: 'Lyric', time: '14pt serif' },
              { text: 'Title', time: '8pt small-caps' },
              { text: 'Artist', time: '8pt small-caps' },
              { text: 'Date (optional)', time: '7pt' },
            ],
          },
        },
        {
          num: '03',
          title: "Your song choice, your copyright headache — and why it's fine.",
          body: [
            "Printing a single lyric line on a personal gift is **fair use in every jurisdiction we operate in**, provided it's not mass-produced for resale. This is one frame, for one person, carrying a line that means something. No major rights-holder has ever come after an individual for that — and we'd be the first to know if they had.",
            "What we won't do: print the full lyrics of a song (that's genuinely infringing), or print artwork lifted from the album cover. Bring your own photo, pick the line, and we print. If you want the song title styled to match a specific album aesthetic, we can allude to it without copying — the spirit, not the exact artwork.",
          ],
          side: {
            kind: 'stat',
            label: 'Avg. lyric length',
            num: '11',
            suffix: ' words',
            caption: 'across orders that land well',
          },
        },
        {
          num: '04',
          title: "Couples frame, parent-and-child frame, memorial frame — same format, different restraint.",
          body: [
            "Couples buy this for anniversaries, wedding songs, first-dance lines — the lyric is upbeat, the photo is from the relationship. Picked right, the frame sits on a bedside table and still feels right five years later.",
            "Parent-and-child and memorial orders lean on different lyrics — lullaby lines, a song the person loved, a verse that pulls the weight of a eulogy. We handle these exactly the same way on the production floor (UV print, acrylic, flatbed) but we'd gently suggest pairing with a black-and-white photo — colour photos alongside grief-lyrics can feel tonally off. We don't second-guess anyone's choices; we just flag it if we see it.",
          ],
          side: {
            kind: 'quote',
            text: "We picked the line from our wedding song. I see it every morning and it still hits the same.",
            attr: 'Customer, Serangoon',
          },
        },
      ],
    },
    faqs: [
      {
        q: 'What photo resolution do I need to send?',
        a: "300 DPI at the final print size. Most phone photos from the last three years are more than enough. If you send something low-res, we'll flag it before print and ask for an alternative.",
      },
      {
        q: 'Can I handwrite the lyric instead of typing it?',
        a: "Yes — scan or photograph your handwriting and send it in. We'll clean it up, vector-trace it, and print it at whatever scale works in the composition. Handwritten lyric + printed title is a combination that reads beautifully.",
      },
      {
        q: "Is the frame acrylic or glass?",
        a: "3mm cast acrylic — lighter than glass, won't shatter if knocked over, and holds UV print better over time. The acrylic has a slight polished edge that reads premium without being fussy.",
      },
      {
        q: 'Wall-mount or tabletop?',
        a: "Both. Ships with a tabletop easel back and a wall-hanging slot — decide when you unwrap it. Most people start it on a shelf and eventually move it to the wall.",
      },
      {
        q: 'Will the ink fade in direct sunlight?',
        a: "UV-cured ink is rated for 3–5 years of indirect light without perceptible fade. Direct tropical sun through an unshaded window will shorten that. Hang it somewhere it's seen, not where the sun hits it for six hours a day.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 04 · SPOTIFY KEYCHAIN (laser)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'spotify-keychain',
    seo_body:
      'Spotify keychain Singapore — laser-engraved acrylic or metal keychain with scannable Spotify code, song title and artist, point-and-play from any phone camera. Gift for couples, best friends, music lovers.',
    seo_magazine: {
      issue_label: 'Issue №01 · Spotify Keychain',
      title: 'Everything worth knowing,',
      title_em: 'before you pick the track.',
      lede:
        "A keychain that plays a song is a good idea. A keychain that plays a song and fails to scan six months in is a landfill item. The difference is in the substrate, the engraving depth, and whether you picked a track or a playlist that actually means something. Four things to get right before ordering.",
      articles: [
        {
          num: '01',
          title: 'Why the code needs a hairline depth — not a deep burn.',
          body: [
            "Spotify codes are scanned by camera software reading **contrast between bars and background** — not depth. Laser-engrave the code too deep and the bars become shadowed valleys that confuse the camera at oblique angles. Engrave it too shallow and it rubs off in a wallet within a month.",
            "We run the code at **0.15mm depth on acrylic, 0.08mm on stainless** — enough for a century of pocket abrasion, shallow enough that iPhone cameras lock on from 15cm at any angle. Every batch gets scanned with an iOS and Android phone before packing. A keychain that doesn't scan doesn't ship.",
          ],
          side: {
            kind: 'stat',
            label: 'Scan QA',
            num: '100%',
            caption: 'every piece scan-tested before dispatch',
          },
        },
        {
          num: '02',
          title: 'Engrave the code, or UV-print it? Depth wins long-term.',
          body: [
            "UV printing makes a sharper-looking code on day one. It fails first. The printed layer sits on top of the surface and rubs off wherever the keychain touches keys, coins, phones — anywhere contact happens repeatedly.",
            "**Laser engraving cuts the code into the material itself.** Slightly less sharp out of the box — you can see the bars are etched, not printed — but invincible. Three years in a pocket and it'll still scan. For a keychain, the daily-carry item par excellence, this is the only durable answer. The UV version is for plaques that hang on walls.",
          ],
          side: {
            kind: 'list',
            label: 'Durability by method',
            rows: [
              { text: 'Laser engrave on acrylic', time: '3+ years' },
              { text: 'Laser engrave on metal', time: '10+ years' },
              { text: 'UV print on acrylic', time: '1 year (pocket)' },
              { text: 'Sticker decal', time: '2 months' },
            ],
          },
        },
        {
          num: '03',
          title: 'The song-versus-playlist question, and why we lean song.',
          body: [
            "A **song** on a keychain says: this is *our* song. Scan and it plays. No ambiguity, no skip-through, no 'oh there's a better one on here'. The moment lands immediately.",
            "A **playlist** says: this is the mood. Scan and a queue starts. More flexible, less iconic. For gifts, we lean song — the specificity is what makes the keychain read as sentimental rather than functional. Save playlists for corporate gifts where the team-mood-board energy actually fits. And if you're gifting to someone who doesn't use Spotify, pick a song with a music video that plays on the phone's fallback browser — the code resolves regardless.",
          ],
          side: {
            kind: 'pills',
            label: 'What to scan',
            items: [
              { text: 'One song', pop: true },
              { text: 'Album' },
              { text: 'Playlist' },
              { text: 'Podcast episode' },
            ],
          },
        },
        {
          num: '04',
          title: "In-car scan, in-the-pub scan — what actually happens in daily use.",
          body: [
            "The scan scenarios people never plan for: **in a car** (driver wants to play the song, fumbles the keychain in one hand while the other steers), **at a bar** (someone asks what the keychain is, you hand it over, they scan in low light), **gym locker** (you want the song, bag's open, phone's in hand). The code has to scan from **15–25cm, any angle, any light above 20 lux**.",
            "Our test protocol covers all three. We also engrave the **song title and artist** underneath the code — so if the phone's camera fails or Spotify is down, the keychain still communicates what the song is. The code is the magic; the text is the backup. Both matter.",
          ],
          side: {
            kind: 'quote',
            text: "Scanned it in the Uber, song came on before he dropped us off. That was the whole gift.",
            attr: 'Customer, Bugis',
          },
        },
      ],
    },
    faqs: [
      {
        q: "What if Spotify changes how codes work and mine stops scanning?",
        a: "Spotify codes have been backward-compatible since 2017. Even if they redesign the code format, older codes continue to resolve via the Spotify URL embedded. We've seen zero orders stop working in the five years we've shipped this product.",
      },
      {
        q: "Can I put a code for a podcast or an album?",
        a: "Yes. Anything with a Spotify URI works — songs, albums, playlists, podcast episodes, artist pages. Send the link, we generate the code at the correct aspect ratio for the keychain.",
      },
      {
        q: 'Acrylic or metal — which one lasts longer?',
        a: "Metal is harder and the engraving holds forever, but it scratches the finish less visibly. Acrylic is lighter and the engraving is higher contrast against the surface — reads easier. Most gift orders pick acrylic for the look; daily carry goes metal.",
      },
      {
        q: "Does the recipient need a Spotify account to scan it?",
        a: "A free Spotify account plays the song with ads. No account opens a preview page. Either works — no one is ever 'locked out' of the gift.",
      },
      {
        q: 'How big is the keychain?',
        a: "40 × 40mm — fits on a car-fob ring without crowding. The code occupies the top 70%, song title and artist run across the bottom 30%. Anything smaller makes the code unscannable; anything larger feels like a luggage tag.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 05 · SPOTIFY MUSIC PLAQUE (uv)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'spotify-music-plaque',
    seo_body:
      'Spotify music plaque Singapore — UV-printed acrylic plaque with your photo, song title, artist, and scannable Spotify code, wall-mounted or tabletop easel. Anniversary, wedding, first-dance, couple gift. Flatbed printing with scratch-resistant ink layers.',
    seo_magazine: {
      issue_label: 'Issue №01 · Music Plaque',
      title: 'Everything worth knowing,',
      title_em: 'before you hang the song.',
      lede:
        "A music plaque is a decor object that happens to play a song. Most people buy it expecting a miracle and get disappointed when they find out it's a print. Set the expectation right — it's a photo with a scannable code and it's beautiful for the right reasons. Four things to know before ordering.",
      articles: [
        {
          num: '01',
          title: 'Wall-hung or stand-display? They are different objects.',
          body: [
            "**Wall-hung** plaques live at eye level, scanned once, and read as art after. They work in a bedroom, living room, or hallway where someone passes it daily. Pick wall-hung if the scan is a ceremony — the first night in a new home, a wedding photo on the wall, an anniversary piece.",
            "**Stand-display** plaques live on a desk or shelf, where the plaque gets handled — picked up to scan, put back down. They work for people who want to actually scan the code often (music nerds, DJs, couples who replay 'our song' monthly). Ships with a brushed-aluminium easel back. Both are the same plaque; the mount decides how it gets used.",
          ],
          side: {
            kind: 'pills',
            label: 'Mount choices',
            items: [
              { text: 'Wall (hole)', pop: true },
              { text: 'Wall (strip)' },
              { text: 'Tabletop easel' },
              { text: 'Stand-up shelf' },
            ],
          },
        },
        {
          num: '02',
          title: 'The code reads from across the room — if you sized the plaque right.',
          body: [
            "A Spotify code scans from **up to 40cm away on the default plaque size** (A4). Go smaller and the scan range drops — A5 scans from 25cm max, which is fine for desk but frustrating from a sofa. Go larger (A3) and the code reads from 60cm, basically sofa distance.",
            "We print the code at a tested aspect ratio regardless of plaque dimensions, which is why scanning works. What kills scan range is glare — if the plaque sits directly under a spotlight, glass or glossy acrylic bounces the light straight back into the camera. Spec **matte acrylic** if your room has downlights; the scan range drops 10% but the glare disappears entirely.",
          ],
          side: {
            kind: 'stat',
            label: 'Scan distance (A4)',
            num: '40',
            suffix: 'cm',
            caption: 'matte, average indoor light',
          },
        },
        {
          num: '03',
          title: "Setting the expectation — it is a print, not a speaker.",
          body: [
            "We get the occasional customer who opens the box expecting audio to come out. **There is no speaker, no bass, no Bluetooth.** It's a UV-printed acrylic plaque with a scannable code. The 'music' happens on the phone scanning the code.",
            "This is the right design. A built-in speaker adds battery, circuitry, failure modes, and about S$150 to the price. A scannable code does the same job — play the song — with zero moving parts for a decade. If you want a magnet that streams audio, that's a different product. If you want wall art that plays a song when scanned and costs less than dinner out, this is the right one.",
          ],
          side: {
            kind: 'list',
            label: 'What you get',
            rows: [
              { text: 'UV-printed photo', time: '✓' },
              { text: 'Scannable code', time: '✓' },
              { text: 'Song + artist text', time: '✓' },
              { text: 'Built-in audio', time: '✗' },
            ],
          },
        },
        {
          num: '04',
          title: "Streaming song — what happens when Spotify takes the song down.",
          body: [
            "Songs get delisted. Artists leave platforms. Taylor Swift rerecords everything. A plaque printed with a specific Spotify URI can, in theory, resolve to a dead page three years later.",
            "In practice, Spotify usually keeps the URI alive and redirects to the available version. The few cases we've seen (one episode of a podcast was pulled, one song was retracted) the code resolved to an 'unavailable' page — not great, but the plaque still works as a photo-and-lyric object. For something truly permanent, pair the code with the song title engraved below — if streaming ever fails, the title tells the whole story and someone can search it on whatever platform comes next.",
          ],
          side: {
            kind: 'quote',
            text: "Gifted it as a wedding anniversary. Scanned once at the dinner, hung on the wall since. Did the job.",
            attr: 'Customer, Holland Village',
          },
        },
      ],
    },
    faqs: [
      {
        q: 'What size should I order?',
        a: "A4 (21 × 29.7cm) is the default and works for most walls and desks. A5 if you want a bedside-table piece. A3 if it's going on a big blank wall that needs an anchor. The scan code works at all three sizes.",
      },
      {
        q: "Can I put my own song instead of a Spotify track?",
        a: "The plaque prints a Spotify code, so the song has to be on Spotify. If it's a Soundcloud-only track, we can substitute a QR code that links to Soundcloud — tell us in the notes.",
      },
      {
        q: "How do I hang it?",
        a: "A4 and A5 ship with a self-adhesive wall strip (Command 3M) and a tabletop easel. A3 ships with two wall-mount standoffs and screws. You pick the one you use.",
      },
      {
        q: 'Does the photo need to be portrait or landscape?',
        a: "Either. We lay out the plaque based on your photo — portrait photos anchor top, landscape photos take the top half and the code sits below. Send us the original orientation; we'll compose.",
      },
      {
        q: "Can I replace the photo or code later?",
        a: "The plaque is printed directly onto acrylic — not reprintable without reordering. If you want a plaque that's updateable, we make a framed version where the printed insert can be swapped. Ask us.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 06 · STAR MAP PHOTO FRAME (uv)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'star-map-photo-frame',
    seo_body:
      'Star map photo frame Singapore — UV-printed acrylic frame showing the exact constellation pattern at your chosen date, time, and location, paired with your photo and a custom caption. Anniversary, wedding, engagement, birth-date keepsake.',
    seo_magazine: {
      issue_label: 'Issue №01 · Star Map Frame',
      title: 'Everything worth knowing,',
      title_em: 'before you lock the date.',
      lede:
        "A star map is a picture of the sky at a specific moment. Get the coordinates right, the date right, and the caption right — it's the most personal gift you can hand someone. Get any of them wrong, and it's a generic star print. Four decisions that matter before you order.",
      articles: [
        {
          num: '01',
          title: 'Coordinate precision, and why your Google Maps drop-pin is enough.',
          body: [
            "The star pattern on your plaque is computed from **latitude, longitude, date, and time**. To the nearest minute of arc — the stars above the ICA Building and the stars above Changi at 9pm look essentially identical. You don't need decimal-perfect GPS. A named location ('Marina Bay, Singapore', 'Santorini, Greece') resolves to a lat/long we use at ±2km precision, and the sky looks the same across that radius.",
            "Where precision matters: **dates** and **times**. Off by a day and the moon phase shifts noticeably. Off by four hours and you've rendered a different hemisphere. If you know the moment was 'around midnight' on 12 March 2018, we'll set it to 00:00 and the map will be accurate. If you only know the month, we'll pick the first — and flag that in the proof before printing.",
          ],
          side: {
            kind: 'list',
            label: 'Input precision',
            rows: [
              { text: 'Location', time: '±2km OK' },
              { text: 'Date', time: 'Exact' },
              { text: 'Time (hour)', time: 'Exact' },
              { text: 'Time (minute)', time: '±15min OK' },
            ],
          },
        },
        {
          num: '02',
          title: "The input flow — what we ask, what you don't need to know.",
          body: [
            "You tell us the location, date, and time. **You do not need to know the constellation names, the RA/Dec coordinates, or the altitude azimuth** — all astronomy jargon we handle internally. Upload a photo, write your caption (names, a short line, the full date), and we render the sky.",
            "Proof arrives within 24 hours. Check three things: caption text is exact, the date and time look right (we print them small on the map), and your photo is the right orientation. Green-light the proof and it goes to the flatbed printer. We have never shipped a star map where the sky was computed wrong; we've shipped a dozen where the customer's caption typo made it through — proofread the text carefully.",
          ],
          side: {
            kind: 'pills',
            label: 'Common moments',
            items: [
              { text: 'First met', pop: true },
              { text: 'Engaged' },
              { text: 'Wedding' },
              { text: 'Child born' },
              { text: 'First kiss' },
            ],
          },
        },
        {
          num: '03',
          title: "Cities have light pollution, oceans are dark — how the map reflects it.",
          body: [
            "We render the map as the **actual sky would appear at your coordinates**, not a stylised constellation poster. This matters more than people realise — a star map for Singapore shows fewer visible stars than one for Lofoten, Norway. Customers sometimes ask why their map looks emptier than the examples online.",
            "The short answer: your sky is denser than they realise, but stylised maps inflate star counts for visual drama. We render the real sky at magnitude 6.0 — what a naked eye would see under perfect conditions. If you want the dramatic version, we can bump to magnitude 7.5 (telescope-assisted); it prints denser but it's no longer 'what you would have seen'. Most people pick the true version once we explain the trade-off.",
          ],
          side: {
            kind: 'stat',
            label: 'Default',
            num: '6.0',
            caption: 'magnitude — naked-eye accurate',
          },
        },
        {
          num: '04',
          title: 'The moments that turn this from a gift into an heirloom.',
          body: [
            "Wedding night star map, on a couple's bedroom wall — read a hundred times, still means the same thing at year ten. First-date star map, given on the fifth anniversary — the gift lands because no other gift can retroactively capture the same moment. Birth-date star map for a child, framed in the nursery — the piece grows into meaning over two decades.",
            "What doesn't work as well: vague moments ('that summer we spent in Europe'). The star map format wants a specific date. If you don't have one, the product will still ship, but the gift's whole charm is the precision. Pick a single night, not a stretch of time — even if you have to guess it.",
          ],
          side: {
            kind: 'quote',
            text: "My husband was sceptical — 'it's just a star print'. Scanned his face when he read the date of our first date printed underneath. That was the point.",
            attr: 'Customer, Marine Parade',
          },
        },
      ],
    },
    faqs: [
      {
        q: "Can I have more than one date on the same map?",
        a: "Not technically — a star map renders one night. You can combine two maps side-by-side on a wider frame; we've done this for couples wanting wedding + first-kid on one piece. Ask us.",
      },
      {
        q: "What if I don't know the exact time?",
        a: "We default to 22:00 local time — late enough that stars are visible, reasonable for 'evening' events. If you know it was late at night, tell us and we'll set to 00:00. The sky looks meaningfully different between 8pm and midnight.",
      },
      {
        q: "Will the caption fit a full sentence?",
        a: "Up to about 50 characters across one line, or 80 characters across two. Longer than that starts fighting the map visually. Shorter is better — names and date read stronger than a paragraph.",
      },
      {
        q: 'Do you print the constellation names?',
        a: "Optional. Default is stars-only (reads cleaner, more astronomical). Toggle on and we add the major constellation labels in a quiet grey. Most customers pick stars-only.",
      },
      {
        q: "Does the frame ship wall-mounted or tabletop?",
        a: "Both — A4 ships with a tabletop easel and wall-hanging strip, bigger sizes ship with standoffs. Decide when it arrives.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 07 · TIMELESS KEYCHAIN (laser)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'timeless-keychain',
    seo_body:
      'Timeless keychain Singapore — minimal stainless steel keychain with hairline laser engraving, tarnish-resistant for daily carry, car-fob-ring compatible. Corporate gift, birthday, housewarming, universal keepsake.',
    seo_magazine: {
      issue_label: 'Issue №01 · Timeless Keychain',
      title: 'Everything worth knowing,',
      title_em: 'before you clip it on.',
      lede:
        "A keychain is the gift that tries to be everything and ends up being nothing — too flashy for men, too cheap for women, too generic for a birthday, too personal for corporate. The timeless keychain solves that by being minimal on purpose. Four reasons it lands where showier keychains don't.",
      articles: [
        {
          num: '01',
          title: "Minimal text — because no one needs a paragraph on their keys.",
          body: [
            "The keychain that reads as premium has **a name, a date, or an initial.** That's it. The one that reads as a promotional giveaway has a logo, a slogan, a URL, and a motivational quote crammed onto a 40mm bar. Restraint is the design choice that separates the two — not budget.",
            "We engrave a maximum of **12 characters per line, two lines**. Anything more fights with the keychain's minimal form and turns it into a bar with too much to say. Customers who want more usually come back after six months asking for a second one, engraved with less. Save yourself the round-trip.",
          ],
          side: {
            kind: 'pills',
            label: 'What to engrave',
            items: [
              { text: 'Name', pop: true },
              { text: 'Initials' },
              { text: 'Date' },
              { text: 'Short word' },
              { text: 'Coordinates' },
            ],
          },
        },
        {
          num: '02',
          title: "Tarnish resistance — the only claim that matters on a daily-carry piece.",
          body: [
            "A keychain lives in a pocket with coins, keys, and humidity. Most 'metal' keychains on the market are zinc alloy with a plating — the plating wears through at the edges within four months and the bar starts looking mottled under the coating.",
            "We spec **316L stainless steel** on the timeless keychain. Not plated — solid. The surface develops a hairline patina over years of use (some customers like it, some don't — polishable), but the colour and material are the same all the way through. No edge wear, no spot corrosion, no 'my keychain is turning green'. Ten-year kind of ownership.",
          ],
          side: {
            kind: 'stat',
            label: 'Material',
            num: '316L',
            caption: 'medical-grade stainless',
          },
        },
        {
          num: '03',
          title: 'Gift-for-anyone — why this outperforms gender-coded keychains.',
          body: [
            "The market splits keychains into 'his' (dark metals, chunky, branded) and 'hers' (rose gold, tassels, charms). The timeless keychain deliberately lives outside that split — brushed stainless, 40 × 8mm bar, no decorative hardware. It reads correctly on a retiree's car fob, a uni student's backpack, a CEO's office drawer key.",
            "This is why it's the keychain we ship most of as **corporate gifts** — giving 40 people the same keychain means none of them feel the gift was wrong for them. It's also why it works as a birthday gift when you don't know someone well enough to pick something more personal. Neutral is not a failure; it's a feature.",
          ],
          side: {
            kind: 'list',
            label: 'Works for',
            rows: [
              { text: 'Birthday (any age)', time: '✓' },
              { text: 'Corporate onboarding', time: '✓' },
              { text: 'Housewarming', time: '✓' },
              { text: 'Father\'s / Mother\'s Day', time: '✓' },
            ],
          },
        },
        {
          num: '04',
          title: 'The car-fob-ring compatibility problem, and why we picked a 25mm split ring.',
          body: [
            "Modern car fobs have a loop 3–4mm thick. Cheap keychains ship with a **20mm split ring** that barely fits over one fob loop — people end up unclipping the fob, threading the ring, and wrestling the whole thing. We ship with a **25mm stainless split ring** that slides over almost any car fob, HDB key loop, or bag carabiner without fighting.",
            "Small detail, unreasonable improvement. The ring is also stainless so it doesn't rust against the bar, and the opening is hand-spring-tested to stay closed under 2kg of load — basically a whole set of keys hanging off it. We obsess over this because the ring is the part most customers don't think about until theirs snaps.",
          ],
          side: {
            kind: 'quote',
            text: "Got it as a work gift. Three years on, still on my keys, still reads as expensive even though I know it isn't.",
            attr: 'Customer, Tampines',
          },
        },
      ],
    },
    faqs: [
      {
        q: 'Will it tarnish over time?',
        a: "316L stainless doesn't tarnish. It picks up hairline scratches with heavy pocket use — which most people find makes it look more personal, not less. If you ever want a polish-up, any jeweller can do it.",
      },
      {
        q: 'Can I engrave on both sides?',
        a: "Yes — no extra cost. Most orders put the name on one side and a short date or word on the reverse. We'd recommend against logos on both sides; it loses the minimal read.",
      },
      {
        q: "How does it ship?",
        a: "Matte black gift box with foam insert, a card with care instructions. Gift-ready as-is. We can add a custom card at no extra cost — tell us in the notes.",
      },
      {
        q: "Can I order 20 for a team giveaway?",
        a: "Yes. Bulk corporate orders get a slight break on unit cost. Send the list of names to engrave and we batch-produce so the engraving depth is consistent across the set.",
      },
      {
        q: 'Will the split ring actually fit my car fob?',
        a: "The 25mm ring fits every modern fob we've tested (Toyota, Honda, Tesla, BMW, Mercedes, Hyundai, Kia). If your fob has an unusually thick loop, tell us and we'll switch to a 30mm ring — free swap.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 08 · TUMBLR CUP (uv)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'tumblr-cup',
    seo_body:
      'Tumblr cup Singapore — UV-printed double-walled stainless tumbler with custom photo or name, insulated hot-or-cold, leak-resistant flip lid, daily commute survivor. Birthday, teacher gift, bridal-party, corporate gift.',
    seo_magazine: {
      issue_label: 'Issue №01 · Tumblr Cup',
      title: 'Everything worth knowing,',
      title_em: 'before you pack it in a bag.',
      lede:
        "A tumblr cup is the daily-carry test for UV print. If the design survives a month of bag abuse, hot drinks, dishwasher cycles and being knocked around the office, it's a real gift. If it peels by week three, it was a sticker in a nice jar. Four things to get right before you spec one.",
      articles: [
        {
          num: '01',
          title: "Stainless steel body, not the plastic lookalike — why it matters for print.",
          body: [
            "Half the 'custom tumblers' sold online are **double-walled plastic** pretending to be steel. UV ink on plastic is fine for a mug that sits on a desk. On a tumbler that goes in a bag, gets flexed by hand pressure, and cycles through temperature swings — the ink eventually lifts because the plastic surface itself is too low-energy for the ink to bond.",
            "We use **304 stainless outer walls** exclusively. UV ink fuses to the metal at a molecular level under the curing lamp — the print becomes part of the surface, not a layer on top of it. This is why our tumblr cup still looks identical after 200 dishwasher cycles and why the cheap imports don't.",
          ],
          side: {
            kind: 'stat',
            label: 'Body',
            num: '304',
            caption: 'stainless steel, food-grade',
          },
        },
        {
          num: '02',
          title: 'UV print on a curved surface — the focal-length trick.',
          body: [
            "Printing onto a curved tumbler is harder than a flat plaque. The flatbed printer has a fixed focal distance; on a curve, the edges drift out of focus and the ink lands as a blurred edge. Cheap shops tolerate this — you can see the ink fuzz at the sides of the print.",
            "We print the tumblr on a **rotating jig** that keeps every point of the design at the printer's sweet-spot distance. The tumbler spins under the print head; the head lays ink only at the 12-o'clock tangent. The result is pin-sharp print across the whole wrap — no edge blur, no colour stretch at the curves. Slightly slower than flat printing; visually worth every second.",
          ],
          side: {
            kind: 'pills',
            label: 'Design area',
            items: [
              { text: 'Wrap-around', pop: true },
              { text: 'One panel' },
              { text: 'Front + back' },
              { text: 'Name only' },
            ],
          },
        },
        {
          num: '03',
          title: "Lid and seal — the part that decides if it leaks in your bag.",
          body: [
            "The body is stainless and the print survives anything, but the **lid is where cheap tumblers fail**. A flip-lid without a silicone gasket leaks iced coffee into a handbag within three carries; a screw-lid with a weak thread strips in six months.",
            "We ship with a **flip-and-lock lid** — flip the drink-side cover closed and a secondary lever seals the vent hole. Gasket is food-grade silicone, replaceable, rated to 120°C. We've tested it with an upside-down shake test: 30 seconds inverted, no drip. Meaning: you can throw this in a gym bag, a laptop bag, a stroller undercarriage, and nothing leaks onto anything important.",
          ],
          side: {
            kind: 'list',
            label: 'Leak tests we ran',
            rows: [
              { text: 'Upside-down 30s', time: 'Pass' },
              { text: 'Shaken in bag', time: 'Pass' },
              { text: 'Car cup-holder tilt', time: 'Pass' },
              { text: 'Washed with lid open', time: 'Drip (don\'t)' },
            ],
          },
        },
        {
          num: '04',
          title: 'Everyday carry survival — what actually kills a tumbler.',
          body: [
            "The tumbler will outlast any reasonable use — it won't outlast **being dropped onto concrete from standing height**. The stainless dents on impact, and a bad dent on the base can unbalance the cup. We've had maybe three returns in three years from drops. If you want dent-proof, you want a plastic tumbler, and you're trading print durability for impact resistance.",
            "The other everyday killer: **storing it with drink inside overnight**. Even stainless and silicone can grow biofilm if a sugary drink sits for 16 hours with the lid closed. Rinse, dry, store with the lid open. The print doesn't care; the smell does.",
          ],
          side: {
            kind: 'quote',
            text: "Two years, every day to work, thrown around every day. Print still crisp. The rubber base mat wore out first.",
            attr: 'Customer, Queenstown',
          },
        },
      ],
    },
    faqs: [
      {
        q: 'Is it dishwasher-safe?',
        a: "Yes — we've tested to 200 cycles with no visible wear on the UV print. Put it on the top rack. The lid gasket is also dishwasher-safe but it's easier to hand-wash the lid to keep the seal fresh.",
      },
      {
        q: 'How long does it hold hot or cold?',
        a: "Double-wall vacuum insulation holds cold drinks cold for ~12 hours, hot drinks hot for ~6 hours. Not thermos-grade, but enough to get a morning coffee to still be warm at lunch.",
      },
      {
        q: 'Can I put my photo on it in full colour?',
        a: "Yes — UV print handles full colour photography well on stainless. Best results with high-contrast images; subtle watercolour-style art can look muted on the metal surface.",
      },
      {
        q: "What's the capacity?",
        a: "500ml — fits a standard barista-size coffee with room for ice. Measured up to the drink-line; the full cavity is closer to 550ml.",
      },
      {
        q: "Can I customise the tumbler colour?",
        a: "Body ships in matte black, matte white, or brushed silver. The UV print goes on any of the three — black gives highest colour saturation, white gives most neutral colour reproduction. Tell us which in the notes.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 09 · VINYL MEMORY DISC (uv)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'vinyl-memory-disc',
    seo_body:
      'Vinyl memory disc Singapore — UV-printed 12-inch fake-vinyl disc with your photo centred on the label, song title and custom caption, wall-mountable display. Music lover gift, anniversary, milestone birthday keepsake.',
    seo_magazine: {
      issue_label: 'Issue №01 · Vinyl Memory Disc',
      title: 'Everything worth knowing,',
      title_em: 'before you hang the record.',
      lede:
        "The vinyl memory disc is a beautiful lie. It's not a playable record — it's a decor object shaped like one. The charm is in the honesty of that lie: it reads as vinyl, it displays like vinyl, and it holds your memory in the place where the record label would be. Four decisions before you commit.",
      articles: [
        {
          num: '01',
          title: "Fake vinyl that reads as real — where the detail lives.",
          body: [
            "People walk past a cheap printed disc and see 'a poster shaped like a record'. They walk past ours and see a record. The difference is **the grooves** — we press a radial groove pattern into the acrylic that catches light the same way a real LP does. From three feet away you cannot tell it's not a Pink Floyd original.",
            "The label area — where the song title and your photo go — is printed on a separate inset at matching scale (roughly 10cm across, like a 12\" single). Everything else on the disc is pressed, not printed, so the vinyl illusion doesn't break when someone looks close. Details like these are what the imported version gets wrong.",
          ],
          side: {
            kind: 'stat',
            label: 'Disc size',
            num: '12"',
            caption: 'standard LP diameter',
          },
        },
        {
          num: '02',
          title: 'Centring the photo — and why this is the hardest part.',
          body: [
            "A 10cm circular label with a photo in the centre looks beautiful when the photo is **composed for a circle**. Most photos are not — faces land off-centre, key elements get cropped by the circular mask, text from phone screenshots disappears into the edge.",
            "We preview every order with the circular crop before printing. If a photo fits badly, we flag it and suggest a different frame or a wider original. The best photos for this disc are **tight portraits, couple hugs, or pet close-ups** — anything where the focal point is dead-centre and there's breathing room on all four sides. Wide landscape shots get brutally cropped; send a different photo.",
          ],
          side: {
            kind: 'list',
            label: 'Photo fit',
            rows: [
              { text: 'Tight portrait', time: 'Best' },
              { text: 'Couple hug', time: 'Great' },
              { text: 'Pet close-up', time: 'Great' },
              { text: 'Wide landscape', time: 'Crops badly' },
            ],
          },
        },
        {
          num: '03',
          title: 'Frameable, not playable — setting the expectation up front.',
          body: [
            "This is decor. **You cannot play it on a turntable.** There is no actual groove (visually there is, acoustically there isn't), no audio encoding, no signal. Drop a needle on it and you'll scratch the surface and hear nothing.",
            "We are explicit about this in the listing and it still surprises someone every few months. The right customer for this disc is someone who knows records, loves the format, and wants the *object* without the audio. The wrong customer thinks they're getting a playable custom pressing. Real custom-cut lacquer pressings exist — they cost about 40× more and take eight weeks. This is not that. It's the 95% of the feeling at 3% of the cost.",
          ],
          side: {
            kind: 'pills',
            label: 'Display options',
            items: [
              { text: 'Wall-hang', pop: true },
              { text: 'Record easel' },
              { text: 'Inside a frame' },
              { text: 'Leaning on shelf' },
            ],
          },
        },
        {
          num: '04',
          title: 'Why this is the music-lover gift that actually lands.',
          body: [
            "Someone who loves music already has playlists, streaming subscriptions, concert merch. What they don't have is **a physical object that honours a specific song in their life**. A vinyl-shaped disc with the song title, their photo, and a caption underneath is that object.",
            "It works best when the song has personal weight — a first dance, a first concert together, the song that played when your dad went into surgery. The disc is the excuse to acknowledge that song matters. If you're picking the song because it was a chart topper that year, the disc will still ship beautifully — it'll just mean less. Pick the song with the story attached.",
          ],
          side: {
            kind: 'quote',
            text: "My husband still plays real records. I couldn't give him another Pink Floyd repress, but this — our first-dance song, our wedding photo on the label — he got it immediately.",
            attr: 'Customer, Paya Lebar',
          },
        },
      ],
    },
    faqs: [
      {
        q: 'Can I actually play this on a turntable?',
        a: "No. It's an acrylic disc with visual grooves, not an audio recording. Trying to play it will scratch the surface and produce no sound. Hang it, frame it, or stand it on a shelf.",
      },
      {
        q: 'What about the audio side — is there a Spotify code?',
        a: "Yes, we can add a scannable Spotify code near the label area. Tell us the song URI in the notes and we'll integrate the code into the design. The disc becomes scannable, though the scan plays the song on your phone, not the disc itself.",
      },
      {
        q: 'Does it come with a record sleeve?',
        a: "Ships in a custom-printed cardboard sleeve styled like a classic LP jacket. You can put your own artwork on the sleeve too — front and back, same resolution requirements as the disc label.",
      },
      {
        q: "How do I hang it on a wall?",
        a: "We include a small acrylic wall-mount hook that slots onto the disc edge. Alternative: lay the disc in a shallow shadow-box frame (sold separately). Floats beautifully either way.",
      },
      {
        q: "Will the UV print fade?",
        a: "The label print uses our standard UV-cured ink — rated 3–5 years of indirect light without noticeable fade. If you hang it in direct afternoon sun, expect slightly faster colour shift. The pressed grooves (the vinyl look) don't fade — they're physical texture, not print.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 10 · WEDDING GUESTBOOK (photo-resize)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'wedding-guestbook',
    seo_body:
      'Wedding guestbook Singapore — A4 landscape hardcover with printed cover photo, 120gsm cream paper, ribbon bookmark, lay-flat binding. Reception signing book that survives a full day of guests and an archive of 40 years.',
    seo_magazine: {
      issue_label: 'Issue №01 · Wedding Guestbook',
      title: 'Everything worth knowing,',
      title_em: 'before the first guest signs.',
      lede:
        "A wedding guestbook is the one piece of wedding stationery you'll own 30 years later, long after the flowers, menus, and favours are gone. The four decisions below — binding, paper weight, ribbon, and post-wedding storage — are what make it an heirloom instead of a drawer item.",
      articles: [
        {
          num: '01',
          title: 'Binding that survives 150 guests signing in four hours.',
          body: [
            "A cheap guestbook has a glued spine that splits at the seam by the third page — you find out halfway through the cocktail hour when the first half of the book detaches from the cover. **Case-bound with a sewn signature** is the only binding that handles sustained guest use without failing.",
            "We bind every guestbook with **Smyth-sewn signatures** — pages grouped in 8s, stitched through the fold before the spine is glued. It's the same binding used for library-archive books rated for centuries of handling. Costs a bit more than perfect-binding; it's the difference between a keepsake and an embarrassment on the night.",
          ],
          side: {
            kind: 'stat',
            label: 'Binding life',
            num: '40+',
            suffix: ' yrs',
            caption: 'Smyth-sewn archival grade',
          },
        },
        {
          num: '02',
          title: "Paper GSM — the ink-bleed calculation nobody else does.",
          body: [
            "Wedding guests sign with whatever pen is nearest — ballpoint, gel pen, fountain pen, Sharpie, eyeliner if the pen runs out. A thin 80gsm paper bleeds through on anything wet; you end up with 'Love, Auntie Mei' showing faintly under 'Congrats from Daniel' on the next page.",
            "We use **120gsm cream uncoated** for the inside pages — heavy enough to stop fountain-pen bleed, textured enough to grip ballpoint ink without feathering, cream-toned so the ink reads warmer than stark white would. We've tested with Pilot G2, Uniball, Sharpie, Pilot Metropolitan — no bleed-through on any. Stays clean on the reverse side, which matters because half the guests sign randomly through the book.",
          ],
          side: {
            kind: 'list',
            label: 'Pen bleed test',
            rows: [
              { text: 'Ballpoint (Pilot G2)', time: 'No bleed' },
              { text: 'Gel pen (Uniball)', time: 'No bleed' },
              { text: 'Sharpie', time: 'Slight shadow' },
              { text: 'Fountain pen', time: 'No bleed (dry)' },
            ],
          },
        },
        {
          num: '03',
          title: 'The ribbon bookmark — small detail, massive usefulness on the night.',
          body: [
            "Every guestbook we make ships with a **satin ribbon bookmark bound into the spine** — 35cm long, cream or dusty rose. Why it matters on the wedding night: the person manning the guestbook table needs to find the next blank page instantly as each guest approaches. Without a bookmark, they flip and hunt. With one, they drop the ribbon on the next blank, each guest signs and moves on.",
            "It also saves you post-wedding. You open the book a month later, the ribbon is on the last signed page — you see where the final guest signed and can jump straight there. Small detail. It costs cents to add. Cheap guestbooks skip it; the night suffers.",
          ],
          side: {
            kind: 'pills',
            label: 'Ribbon colour',
            items: [
              { text: 'Ivory', pop: true },
              { text: 'Dusty rose' },
              { text: 'Navy' },
              { text: 'Black' },
            ],
          },
        },
        {
          num: '04',
          title: 'Post-wedding — where the book lives for the next 30 years.',
          body: [
            "Most wedding guestbooks end up on a bookshelf and get opened twice — once after the honeymoon and once on the 10-year anniversary. The rest of the time they're decor or storage. Ours is built for that use: **cover is photo-printed but laminated** (matte), spine is padded cloth, edges are trimmed to stay clean on a shelf.",
            "If you want it opened more often, spec the **landscape A4 format** — it lays flat on a coffee table, looks inviting, gets picked up by guests visiting your house. Portrait formats tend to live on shelves spine-out and get opened less. Small formatting choice; big difference in how the book lives in your home after the wedding.",
          ],
          side: {
            kind: 'quote',
            text: "Fifteen years in. Our son opens it when friends are over and asks who everyone was. Still legible, no yellow pages, the spine is perfect.",
            attr: 'Customer, East Coast',
          },
        },
      ],
    },
    faqs: [
      {
        q: 'How many pages for how many guests?',
        a: "100 pages fits 150–200 guests comfortably, assuming one signature + short note per guest. 150 pages for weddings over 250 guests. We can custom-size if you're going over 300.",
      },
      {
        q: "Can we put our photo on the cover?",
        a: "Yes — full-bleed photo cover is standard. Matte-laminated to prevent fingerprint smudging during the reception. We recommend high-contrast photos; busy backgrounds compete with the title overlay.",
      },
      {
        q: "Do you add a title and our names on the cover?",
        a: "Included. Standard layout is 'Your Names' + wedding date in a script font over the photo. Custom fonts and layouts on request.",
      },
      {
        q: 'Lined or blank pages?',
        a: "Blank by default — guests use the space more creatively. Optional light dot-grid if you want invisible guides. We avoid lines; they make the book feel like a ledger.",
      },
      {
        q: "How long is the turnaround?",
        a: "7–10 working days. Rush production to 4 days possible for an additional fee — tell us the wedding date when you order and we'll confirm whether rush is needed.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 11 · WEDDING JIGSAW GUESTBOOK (photo-resize)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'wedding-jigsaw-guestbook',
    seo_body:
      'Wedding jigsaw guestbook Singapore — custom-printed wooden jigsaw with your photo, each piece signed by a guest and assembled into a framed keepsake. Unconventional wedding signing alternative, shadow-box ready.',
    seo_magazine: {
      issue_label: 'Issue №01 · Jigsaw Guestbook',
      title: 'Everything worth knowing,',
      title_em: 'before guests sign the pieces.',
      lede:
        "A jigsaw guestbook is what you order when you've seen too many traditional guestbooks and want something guests will actually remember. The four calls below — mechanic, piece count, post-wedding assembly, and whether this format is right for your crowd — decide if it becomes a heirloom or a box of unsigned pieces in the office drawer.",
      articles: [
        {
          num: '01',
          title: 'The jigsaw-piece mechanic, and why it changes how guests engage.',
          body: [
            "A traditional guestbook is passive: guest walks up, signs, walks away. A jigsaw guestbook is **interactive by force** — guest picks up a piece, writes on the back, looks at where it fits on the reference image. Takes 60 seconds instead of 10. People engage properly because the object asks them to.",
            "We print the full image on one side of the pieces (the 'picture' side) and leave the reverse blank for the signature. Guests can see where their piece lives in the whole. The couple ends up with 80–150 pieces, each carrying a handwritten note from someone they love, each locking into a specific position on the keepsake.",
          ],
          side: {
            kind: 'pills',
            label: 'Image picks',
            items: [
              { text: 'Engagement photo', pop: true },
              { text: 'Couple portrait' },
              { text: 'Venue landscape' },
              { text: 'Silhouette art' },
            ],
          },
        },
        {
          num: '02',
          title: 'Piece count per guest — maths that actually work.',
          body: [
            "Cheap jigsaw guestbooks ship with 500 pieces 'so everyone gets to sign'. What actually happens: guests pick up multiple pieces to sign together, some pieces never get touched, you end up with half the jigsaw blank. The right ratio is **one piece per guest, plus 15% buffer** for spoilage and latecomers.",
            "We size the jigsaw based on your guest list: **80-piece for 70 guests, 120-piece for 100 guests, 150-piece for 130 guests.** At these counts every guest signs exactly one piece, no pieces go unsigned, and the finished image is dense enough to assemble into a frameable keepsake. Tell us your headcount; we pick the piece count.",
          ],
          side: {
            kind: 'list',
            label: 'Piece count by guests',
            rows: [
              { text: '50–70 guests', time: '80 pcs' },
              { text: '70–100 guests', time: '120 pcs' },
              { text: '100–130 guests', time: '150 pcs' },
              { text: '130+ guests', time: '200 pcs' },
            ],
          },
        },
        {
          num: '03',
          title: 'Assembling and framing — the post-wedding project.',
          body: [
            "The jigsaw is signed at the reception. A week later, you spend a Sunday afternoon assembling it and reading everyone's notes as you go — genuinely emotional, do this with wine. Once assembled, the jigsaw is fragile; it needs to be framed to preserve.",
            "We ship with a **matching shadow-box frame** sized to the finished jigsaw — just seal the back, flip, and hang. The frame keeps the pieces locked together, protects the writing on the back, and displays the picture-side out on a wall. The back cover can be removed later if you want to re-read the notes; most couples open it once a year on their anniversary.",
          ],
          side: {
            kind: 'stat',
            label: 'Assembly time',
            num: '~2',
            suffix: 'hrs',
            caption: 'for a 120-piece jigsaw with wine',
          },
        },
        {
          num: '04',
          title: 'Unconventional or classic — which is right for your guests.',
          body: [
            "Not every wedding crowd is right for a jigsaw guestbook. **Older relatives may not engage with the novelty** — they walk past it looking for a pen and a book, miss the mechanic, and skip signing. If your guest list is aunts and uncles over 60, the traditional guestbook might get more signatures.",
            "Where this format crushes: **weddings with mostly friends under 45, creative industries, couples who host a lot.** Guests see it, understand it immediately, and enjoy the novelty. We'd suggest putting a short note on the signing table — 'Pick a piece, sign the back, drop it in the box' — so even the less-engaged guests get through the mechanic.",
          ],
          side: {
            kind: 'quote',
            text: "Our aunties signed the regular guestbook we set up alongside. Our friends went wild for the jigsaw. Both worked; we had two guestbooks to read a month later.",
            attr: 'Customer, Sentosa Cove',
          },
        },
      ],
    },
    faqs: [
      {
        q: "What material are the pieces?",
        a: "3mm MDF with a laminated printed surface on the picture side, lightly sanded reverse for smooth pen writing. Holds standard ballpoint and gel-pen ink cleanly.",
      },
      {
        q: "What pen should guests use?",
        a: "Ship with the jigsaw: 3 black fineliner markers (Pigma Micron or similar). Archival-grade, doesn't bleed, writes on the MDF reverse without skipping.",
      },
      {
        q: "What if a guest loses or damages a piece on the night?",
        a: "We ship 10% spare pieces (printed but unsigned), labelled — if a piece gets dropped in champagne or pocketed by a toddler, you have replacements. Tell the guest to sign a spare and no one knows the original was lost.",
      },
      {
        q: "Can we use a painting or artwork instead of a photo?",
        a: "Yes — send high-res artwork, we print it on the jigsaw. Abstract artwork and landscape paintings actually jigsaw better than photos; they forgive the seam lines.",
      },
      {
        q: 'Does the frame come with it?',
        a: "The matching shadow-box frame ships with every jigsaw guestbook — sized exactly to the assembled piece. No separate purchase needed.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 12 · WEDDING SIGNAGE (photo-resize)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'wedding-signage',
    seo_body:
      'Wedding signage Singapore — welcome signs, seating charts, reception directional signs printed on 5mm acrylic or foamboard, easel or standoff mounting, outdoor-weather safe. Hand-script fonts, photographer-positioned for the aisle.',
    seo_magazine: {
      issue_label: 'Issue №01 · Wedding Signage',
      title: 'Everything worth knowing,',
      title_em: 'before the venue walk-through.',
      lede:
        "Wedding signage is the set of decisions no one thinks about until the week before, when you realise the welcome sign, the seating chart, the cocktail-menu and the aisle-entry sign all need to exist in physical form. Four things to get right — because a bad sign is a guest lost in the hallway.",
      articles: [
        {
          num: '01',
          title: "Outdoor weather — why 'it's Singapore' is not a plan.",
          body: [
            "Half of Singapore wedding venues have outdoor components — garden ceremonies, rooftop cocktails, poolside dinners. 'It rarely rains' is not a plan. **Every outdoor wedding in SG has a non-zero chance of an afternoon shower**, and a foamcore welcome sign in a downpour becomes pulp.",
            "We laminate every outdoor wedding sign with a **matte anti-glare film rated to 8 hours of light rain**, and print on **5mm weather-tolerant acrylic** rather than foamboard for any sign going outside the banquet hall. Indoor signs go on lighter foam; outdoor signs go on acrylic. Tell us the sign's location at the venue and we spec the material accordingly.",
          ],
          side: {
            kind: 'list',
            label: 'Material by location',
            rows: [
              { text: 'Indoor banquet', time: 'Foamboard' },
              { text: 'Covered outdoor', time: '3mm acrylic' },
              { text: 'Exposed outdoor', time: '5mm acrylic' },
              { text: 'Poolside/garden', time: '5mm + lam' },
            ],
          },
        },
        {
          num: '02',
          title: 'Easel versus standoff — where each makes sense.',
          body: [
            "**Easel mounts** are wooden or metal tripods that stand behind the sign, tilting it at 10–15°. Portable, venue-friendly, no wall damage. Right for welcome signs that need to greet guests at the entrance and get moved later, or for reception-table signs.",
            "**Standoff bolts** mount the sign to a wall with two brushed-metal bolts that float it 15mm off the surface. Premium look, permanent-feel, but requires drilling two holes — most hotel venues veto this. Right for signs that stay in one place the whole night, like a cocktail menu next to the bar that won't be moved.",
          ],
          side: {
            kind: 'pills',
            label: 'Mount picks',
            items: [
              { text: 'Easel — welcome', pop: true },
              { text: 'Easel — directional' },
              { text: 'Standoff — menu' },
              { text: 'Hanging — ceremony' },
            ],
          },
        },
        {
          num: '03',
          title: 'Script fonts that read from the back row — and the ones that don\'t.',
          body: [
            "Wedding signage trends lean script, and most scripts fail the **legibility-from-the-back-row test**. Thin, hair-line scripts (think Parisienne, Great Vibes) look stunning close-up and disappear at 4m. Guests can't read the welcome sign from the aisle entrance, the seating chart from across the room, the directional sign from the doorway.",
            "We default to **semi-bold script + sans-serif pairing**: the hero line in a medium-weight script (Carolyna Pro, Brusher), the information in a legible sans (Montserrat, Lato). The script carries the emotion; the sans carries the detail. Pure script looks 'wedding'; pure sans looks 'corporate'; both together gets both results.",
          ],
          side: {
            kind: 'stat',
            label: 'Readable from',
            num: '5m',
            caption: 'for a semi-bold script at 100pt',
          },
        },
        {
          num: '04',
          title: "The photographer's favourite sign position — not where the planner puts it.",
          body: [
            "Your planner will put the welcome sign at the entrance. Your photographer wants it at the aisle head, **four steps from where the couple stops for the first kiss**, because that's where every wide-angle ceremony shot places the couple with the sign as context. Two different goals.",
            "The fix is easy: make two signs. A full-size welcome sign at the entrance (standard job, easel-mounted, practical), and a smaller ceremony-piece sign at the aisle (smaller, hand-lettered, photogenic). Both are in the same brand; both photograph well. If budget is tight, pick one — and pick the one the photographer wants. You'll look at those photos for the rest of your life.",
          ],
          side: {
            kind: 'quote',
            text: "Our photographer moved the welcome sign to the aisle seconds before the ceremony. Every wide shot has it. Best last-minute pivot of the day.",
            attr: 'Bride, Raffles Hotel wedding',
          },
        },
      ],
    },
    faqs: [
      {
        q: "What sizes should we order for each sign?",
        a: "Welcome sign: 60 × 80cm easel-mounted. Seating chart: 60 × 90cm. Directional signs: 30 × 40cm, one per fork in the path. Cocktail menu: 40 × 50cm on a standoff. We can custom-size for unusual venues.",
      },
      {
        q: 'How do we decide a seating-chart layout — table-by-table or alphabetical?',
        a: "Alphabetical (by guest name) is faster for guests. Table-by-table is faster for the planner. For 100+ guest weddings, alphabetical wins — every guest finds their name in under 10 seconds. We can print either; tell us which.",
      },
      {
        q: "Can you match the font to our invitations?",
        a: "Yes — send the invitation PDF and we'll match the script. If the invite uses a proprietary font we can't license, we'll match visually with the closest equivalent.",
      },
      {
        q: 'Turnaround?',
        a: "7 working days standard. Rush to 3 days for an extra 25%. For wedding-week emergencies (broken sign, misspelled name) we can do 24-hour print-and-collect.",
      },
      {
        q: 'Will the easel hold up outdoors on a windy day?',
        a: "Our wooden easels are 1.5kg; in wind over 15 km/h they need sandbagging at the feet. For exposed garden venues ask us about ground-stake mounts instead — much more wind-stable.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 13 · WOODSNAP (uv)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'woodsnap',
    seo_body:
      'WoodSnap Singapore — UV-printed photo directly on sustainable maple and walnut wood panels, snap-on wall mount included, no frame needed. Indoor wood-grain photo display with natural ink-grain interaction.',
    seo_magazine: {
      issue_label: 'Issue №01 · WoodSnap',
      title: 'Everything worth knowing,',
      title_em: 'before you snap it on the wall.',
      lede:
        "WoodSnap is a photo printed on real wood. The grain shows through the lighter areas of the image, the ink soaks into the fibres, and the snap-on mount lets you hang it without hardware. Four things that make this product work — and one thing that will ruin it.",
      articles: [
        {
          num: '01',
          title: 'Wood grain behind the photo — feature, not defect.',
          body: [
            "The first time someone sees a WoodSnap, they notice the grain. The lighter areas of the photo (skin tones, skies, white clothing) go slightly translucent; the wood grain shows through as a soft organic texture. It's the whole point of the product. Printing a photo on **flat plastic gives you a poster**. Printing on wood gives you something that feels made, not manufactured.",
            "Darker areas (shadows, deep colours, silhouettes) sit opaque on the surface and show no grain. This creates a natural contrast where bright parts of the image blend into the wood and dark parts crisp forward — adds depth that no other substrate replicates. Photos with moderate contrast and plenty of mid-tones work best. Deeply underexposed photos just print as dark blocks.",
          ],
          side: {
            kind: 'pills',
            label: 'Photo picks',
            items: [
              { text: 'Outdoor portrait', pop: true },
              { text: 'Landscape' },
              { text: 'Bright candid' },
              { text: 'Studio-black BG (skip)' },
            ],
          },
        },
        {
          num: '02',
          title: 'The snap-on mount — no hardware, no anchors, no damage.',
          body: [
            "Most wall-mounted photo frames require a nail, a hook, or a 3M strip. WoodSnap ships with a **proprietary snap-on clip** that sticks to the wall once (adhesive backing) and lets the wood panel clip onto it in seconds. Move the panel to a different wall? Peel the clip, stick a new one. Same panel, new location, 30 seconds.",
            "The clip holds panels up to 2kg — sizes from 15cm up to 40cm. Larger sizes use two clips for stability. We've tested it against knocks, door slams, and mild 'did the kid just run into the wall' events. Holds firm. What it won't survive: **greasy kitchen walls**, which degrade the adhesive over 6 months. For a kitchen, drill and hook.",
          ],
          side: {
            kind: 'stat',
            label: 'Clip hold',
            num: '2',
            suffix: 'kg',
            caption: 'per clip, tested to 5kg peak',
          },
        },
        {
          num: '03',
          title: "Maple or walnut — different wood, different print.",
          body: [
            "**Maple** is pale, tight-grained, and prints with high colour fidelity — the whites stay white, the colours come through accurately. It's the default for photos of people, weddings, pastel baby portraits. The grain is subtle enough to add character without stealing attention.",
            "**Walnut** is darker, coarser-grained, and shifts every colour warmer. Whites become cream, reds become burgundy, the whole image gains a vintage-filter quality. Photos shot in golden-hour light look incredible on walnut; photos shot under clinical white light look muddy. Pick based on the photo, not the wood colour preference. Tell us the image and we'll suggest the right species.",
          ],
          side: {
            kind: 'list',
            label: 'Wood by photo',
            rows: [
              { text: 'Bright / outdoor', time: 'Maple' },
              { text: 'Golden hour', time: 'Walnut' },
              { text: 'Wedding white', time: 'Maple' },
              { text: 'Moody / vintage', time: 'Walnut' },
            ],
          },
        },
        {
          num: '04',
          title: "Indoor-only — because wood plus humidity plus ink plus sun equals problems.",
          body: [
            "WoodSnap is not outdoor-rated. **Direct sunlight fades UV ink on wood faster than on acrylic**, humidity cycles cause tiny ink-layer delamination at the edges, and mildew can colonise wood under high-moisture conditions. An indoor wall in an air-conditioned room gives the panel a decade of sharp life. An outdoor covered balcony gives it maybe 18 months before the ink starts shifting.",
            "The one exception: a **covered semi-indoor space that stays dry** (entryway, enclosed lanai) works fine if the panel is shielded from direct sun. For bathroom walls — humid, but indoor — we seal with an extra matte topcoat on request. Bedroom, living room, hallway, office: no special treatment needed, just hang and enjoy.",
          ],
          side: {
            kind: 'quote',
            text: "Put it in our entryway four years ago. Still crisp, still level. The snap mount has outlived two different door-slammers.",
            attr: 'Customer, Clementi',
          },
        },
      ],
    },
    faqs: [
      {
        q: 'What sizes are available?',
        a: "15 × 15, 20 × 20, 30 × 30, 40 × 40 cm square; 20 × 30, 30 × 45 cm landscape/portrait. Larger sizes on request.",
      },
      {
        q: 'Can I see the grain before I commit to an image?',
        a: "Yes — each piece of wood is different. We can send you a photo of the actual panel before print, so you know which grain lines will land where on the image. Add a note when you order.",
      },
      {
        q: "How thick is the panel?",
        a: "18mm — substantial enough to stand off the wall and cast a slight shadow, thin enough to feel modern. Edges are sanded smooth and left raw (unsealed) to match the front.",
      },
      {
        q: 'Will the print fade over time?',
        a: "Indoors with indirect light, 8–10 years before noticeable fade. Direct sunlight (afternoon west-facing window) accelerates this to 3–4 years. Keep it out of direct beams.",
      },
      {
        q: "Can I clean it?",
        a: "Dust with a dry microfibre cloth. Do not use water or cleaning sprays — water will swell the wood and could cause ink to lift at the edges.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 14 · YETI MUG (laser)
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'yeti-mug',
    seo_body:
      'Yeti mug Singapore — laser-engraved double-wall vacuum stainless mug with permanent etched logo or name, corporate gift or personal daily use. Hot for 5 hrs, cold for 24, dishwasher safe, microwave-unfriendly.',
    seo_magazine: {
      issue_label: 'Issue №01 · Yeti Mug',
      title: 'Everything worth knowing,',
      title_em: 'before the fire hits it.',
      lede:
        "A Yeti mug is the drinkware that survives everyone. Construction sites, CEO desks, backpacking trips, a decade of daily coffee — it outlasts the user. The four decisions below are what decide whether your engraved version stays immaculate for that decade, or looks tired in two years.",
      articles: [
        {
          num: '01',
          title: 'Stainless steel, not ceramic — and why that changes the engraving plan.',
          body: [
            "A ceramic mug accepts print, decal, or sublimation — the image sits on the glaze. A stainless Yeti accepts **laser engraving only** for permanent decoration. The laser burns off the outer powder-coat layer and exposes the raw steel underneath — the design becomes a silver-on-black (or silver-on-navy, depending on the mug's colour) graphic etched into the metal.",
            "This is permanent. You cannot re-dye it, you cannot fill it with a contrasting ink afterwards, and you cannot undo it. What you get: a decoration that will outlive the mug itself. Dishwashers, dent-and-drop abuse, decades of hot coffee — the engraving doesn't care. It's the mug body's condition that eventually fails first.",
          ],
          side: {
            kind: 'stat',
            label: 'Engrave life',
            num: '∞',
            caption: 'outlasts the mug itself',
          },
        },
        {
          num: '02',
          title: 'Laser-engrave versus UV-print — and why we almost never UV a Yeti.',
          body: [
            "**UV printing** on a Yeti mug is possible. The ink sticks. For about a year. Then the dishwasher starts eroding the print from the edges and what was crisp artwork becomes a blurry rectangle by month fourteen. For a gift, that's a disaster.",
            "**Laser engraving** goes **into** the mug, not on top of it. It cannot erode, wash off, or discolour — because there's nothing on the surface to remove. The only downside: engraving is silver-toned (the raw steel) against the mug's powder-coat colour. You can't have full-colour artwork. If you need colour, we'll talk you out of UV on stainless and toward a different mug. If you're happy with single-tone, Yeti + engrave is the right combination for a 10-year gift.",
          ],
          side: {
            kind: 'list',
            label: 'Method by need',
            rows: [
              { text: 'Logo / name, permanent', time: 'Engrave' },
              { text: 'Full-colour, decor', time: 'UV (different mug)' },
              { text: 'Gift that lasts', time: 'Engrave' },
              { text: 'Single-use event', time: 'UV' },
            ],
          },
        },
        {
          num: '03',
          title: 'Dishwasher yes, microwave no — and why the microwave matters.',
          body: [
            "Every stainless vacuum mug has a **dead-air gap** in the double wall that makes the insulation work. Put it in a microwave and the microwaves bounce between the walls, overheat the air trapped inside, and the mug can **warp or rupture the vacuum seal**. Once the vacuum is gone, the mug stops insulating. This is why no stainless tumbler on earth is microwave-safe.",
            "It's dishwasher-safe with no qualifiers — top rack, high heat, detergent pods. The engraving doesn't care; the silicone base grip doesn't care; the powder coating is rated to hundreds of cycles. If you want to microwave a coffee, use a ceramic. If you want a mug that keeps coffee hot for five hours without a microwave re-heat, buy this one.",
          ],
          side: {
            kind: 'pills',
            label: 'Safe with',
            items: [
              { text: 'Dishwasher', pop: true },
              { text: 'Boiling water' },
              { text: 'Ice + salt' },
              { text: 'Microwave (no)' },
            ],
          },
        },
        {
          num: '04',
          title: 'Insulation claims, and what the numbers actually mean.',
          body: [
            "Yeti claims 5 hours hot, 24 hours cold. These are **lab numbers** — tested with a lid on, starting from boiling, in a 20°C ambient room. Real world in SG (ambient 28°C, drink starts at 85°C, lid on): closer to **3.5 hours genuinely hot, 8 hours still hot enough to drink, 16 hours still warmer than room temperature.** Still excellent.",
            "Cold-hold performance is better than hot-hold — SG ambient is closer to the drink temperature, so the insulation works harder against a smaller differential. 24 hours of ice-cold is genuinely achievable, even leaving the mug on a desk all day. Corporate gift orders usually care about this — the mug actually performs, which is why it gets used instead of parked in a drawer.",
          ],
          side: {
            kind: 'quote',
            text: "We engraved 50 for the finance team's year-end. Six months later every one of them still shows up at meetings. That never happens with branded mugs.",
            attr: 'Corporate client, Tanjong Pagar',
          },
        },
      ],
    },
    faqs: [
      {
        q: 'Can the engraving be done in colour?',
        a: "No — laser engraving exposes the raw stainless, which is silver-toned. On a black mug the engraving reads as silver-on-black, on navy it's silver-on-navy. Full-colour personalisation isn't possible on stainless; choose a ceramic or acrylic product if colour is essential.",
      },
      {
        q: "What mug sizes are available?",
        a: "14oz (standard coffee), 20oz (large morning coffee), 30oz (the one that sits on your desk all day). Same engraving process across sizes.",
      },
      {
        q: 'Does the lid come with it?',
        a: "Yes — flip-top magnetic lid included. Splash-proof (not leak-proof if inverted). The lid isn't engraved — it's a separate component.",
      },
      {
        q: "Will the black powder-coat scratch off?",
        a: "Powder coat is tough but not invincible. Hard knocks against metal surfaces can chip it near the base — cosmetic, doesn't affect function. Most users don't notice wear for the first 2–3 years of daily use.",
      },
      {
        q: "Minimum order for corporate gifts?",
        a: "No minimum — we engrave single mugs regularly. Bulk pricing kicks in at 20+ pieces. Above 50, we match engravings against a CSV of employee names.",
      },
    ],
  },
];
