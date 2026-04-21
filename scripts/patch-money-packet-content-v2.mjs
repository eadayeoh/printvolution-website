// Money Packet content v2 — copy was rewritten previously around
// 500-50k runs (with Soft Touch + Foil extending to 80k). Admin has
// since capped qty at 9,000, so this pass rewrites the price anchors,
// matcher rows, magazine article 03 tier list, and FAQs to match.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };
const PID = 'e7b979d0-d327-439a-9e4b-ae4abefe755b';

const productUpdate = {
  tagline: 'Ang pow people keep and reuse — your brand stays in circulation',
  description:
    "Offset-printed ang pow / money packets on 157gsm Art or Matt Art paper, 4C + 0C single-sided. Vertical or Horizontal orientation (same price), five finish tiers from plain to full-luxury Soft Touch + Spot UV + Foil, and pack sizes 5 / 8 / 10 pieces per pack. Runs from 500 packets to 9,000. From S$223.80 / 500 packets. 10 working days offset production.",
};

const extras = {
  seo_title: 'Custom Money Packet Printing Singapore | Ang Pow Printing',
  seo_desc:
    "Custom ang pow printing in Singapore — 157gsm Art or Matt Art, 4C + 0C offset, Vertical or Horizontal. Finishes from plain to Soft Touch + Spot UV + Foil. From S$223.80 / 500 packets. Pack sizes 5 / 8 / 10.",
  seo_body: `Money packet printing Singapore — custom ang pow / red packet printing on 157gsm Art or Matt Art paper, 4C + 0C single-sided offset. Vertical or Horizontal orientation (same price across both). Five finish tiers: No Finishing, Soft Touch, Soft Touch + Spot UV, Soft Touch + Foil, Soft Touch + Spot UV + Foil. Pack sizes 5 / 8 / 10 pieces per pack. Runs from 500 to 9,000 packets. From S$223.80 / 500 pieces. 10 working days offset production. Chinese New Year corporate gifting, wedding ang pow favours, property launches, brand festive drops.`,
  intro: `An ang pow that gets tucked into a drawer and reused isn't a waste — it's a branding touchpoint that comes back into circulation at the next festive moment, the next wedding, the next red-envelope handover. We offset-print custom money packets on **157gsm Art or Matt Art paper, 4C + 0C** single-sided, in either **Vertical or Horizontal orientation (same price)**. Pick a finish from plain print all the way to the full-luxury **Soft Touch + Spot UV + Foil** stack, pack them **5 / 8 / 10 pieces per pack**, and run as few as **500** or as many as **9,000**. From **S$223.80 for 500 plain packets**. **10 working days offset production.**`,
  matcher: {
    rows: [
      { need: "*Chinese New Year* corporate gift drop — clean, straightforward", pick_title: "Vertical · No Finishing · 2,000 packets", pick_detail: "S$339.20 · 157gsm Art / Matt Art · ~$0.17 per packet · 5 per pack = 400 packs" },
      { need: "*Wedding favour* ang pow — small premium run", pick_title: "Vertical · Soft Touch + Spot UV · 500 packets", pick_detail: "S$383.00 · velvet face + glossy logo highlight · 5 per pack = 100 packs" },
      { need: "*Luxury brand* CNY drop — full premium finish", pick_title: "Horizontal · Soft Touch + Spot UV + Foil · 5,000 packets", pick_detail: "S$2,503.80 · soft face + raised UV logo + metallic foil · 8 per pack = 625 packs" },
      { need: "*Mid-size corporate* gift run — balanced cost", pick_title: "Vertical · Soft Touch · 3,000 packets", pick_detail: "S$815.10 · velvety soft-touch finish · 10 per pack = 300 packs" },
      { need: "*Large-scale* brand drop — maximum standard run", pick_title: "Horizontal · Soft Touch + Foil · 9,000 packets", pick_detail: "S$3,398.70 · brand foil logo + soft face · ceiling of the standard ladder" },
    ],
    title: "Tell us the run,\nwe'll tell you", kicker: "Quick guide", title_em: "the pick.",
    right_note_body: "157gsm Art or Matt Art paper · 4C + 0C single-sided offset · Vertical and Horizontal priced the same.",
    right_note_title: "One paper, one price across orientations.",
  },
  seo_magazine: {
    lede: "An ang pow is a branding object that survives the transaction — people tuck it into a drawer, pull it out at the next wedding, the next Lunar New Year, and your logo gets another handover. The four decisions below shape what actually ships and how it lands in your recipient's hand.",
    title: "Everything worth knowing,", title_em: "before you print the run.",
    articles: [
      { num: "01", title: "Vertical or Horizontal — pick by the ang pow moment.",
        body: [
          "The **Vertical money packet** is the classic — held in portrait, the design reads top-to-bottom, logo or greeting anchored at the top. Default for Chinese New Year corporate drops, wedding tea ceremony favours, and any run where the giver hands a packet from a stack.",
          "The **Horizontal packet** rotates 90° — wider than tall, better for artwork that needs landscape room (panoramic photography, wordmarks, dual-language greetings, photo-background designs). Both orientations run on the same 157gsm Art or Matt Art paper at the **exact same price** per (finish, qty) combo — pick by what fits the artwork, not the budget.",
        ],
        side: { kind:'list', label:'Orientation by use', rows:[
          { text:'Vertical',   time:'CNY corporate · tea ceremony' },
          { text:'Horizontal', time:'Panoramic art · landscape logos' },
        ]},
      },
      { num: "02", title: "Finish — plain, or go luxury in layers.",
        body: [
          "**No Finishing** is a clean 4C + 0C offset print on 157gsm Art or Matt Art paper — the cheapest tier, fine for high-volume handouts. **Soft Touch** adds a velvet-matte lamination over the front face; customers recognise the hand-feel instantly, and the step up from plain is small (S$282.60 vs S$223.80 at 500pc) — most runs go Soft Touch by default.",
          "Add **Spot UV** to highlight the logo or artwork with a glossy raised detail against the matte background — branding catches the light as the packet moves. **Foil** burnishes a metallic gold or silver into the design element — the premium stack for luxury CNY drops, brand partnerships, once-a-year gifts. The full stack is **Soft Touch + Spot UV + Foil** (S$501.80 at 500pc) — velvet face, glossy raised logo, metallic accent.",
        ],
        side: { kind:'list', label:'Finish · 500pc / 9,000pc', rows:[
          { text:'No Finishing',           time:'$223.80 · ~$1,053' },
          { text:'Soft Touch',             time:'$282.60 · ~$2,056' },
          { text:'+ Spot UV',              time:'$383.00 · ~$2,761' },
          { text:'+ Foil',                 time:'$401.40 · ~$3,398' },
          { text:'Soft Touch + UV + Foil', time:'$501.80 · ~$4,103' },
        ]},
      },
      { num: "03", title: "Qty — 500 minimum, 9,000 top of the standard ladder.",
        body: [
          "Offset setup means the **minimum run is 500 packets**. At 500pc plain, S$223.80 — roughly S$0.45 per packet. Scale up and the per-piece cost drops sharply: 2,000pc plain is S$339.20 (~S$0.17 each), 5,000pc plain is S$759.40 (~S$0.15), 9,000pc plain is S$1,052.80 (~S$0.12). The unit economics reward larger single runs over multiple smaller ones.",
          "**9,000 is the top of the standard ladder.** Above that we quote separately — larger runs can go offset or swap to gang-run / roll-fed depending on finish. If you need 10,000+ for a property launch, CNY corporate programme, or brand drop, tell us the target qty and finish combo and we'll route the job accordingly.",
        ],
        side: { kind:'list', label:'Qty at a glance', rows:[
          { text:'500pc',   time:'Minimum · small CNY drop' },
          { text:'2,000pc', time:'Mid SME corporate gift' },
          { text:'5,000pc', time:'Large corporate / property' },
          { text:'9,000pc', time:'Max in standard ladder' },
          { text:'10k+',    time:'Contact for custom quote' },
        ]},
      },
      { num: "04", title: "Pack sizes — 5, 8, or 10 per pack, your pick.",
        body: [
          "The customer-facing packet count is what people remember about an ang pow box — **5 per pack** for boutique premium gifts or wedding favours, **8 per pack** for the classic CNY gift (the auspicious number), **10 per pack** for corporate handouts where staff distribute packets internally. Pack size **doesn't change the price** — it's a packaging choice, not a pricing axis. The price is driven entirely by orientation × finish × qty.",
          "Pick the pack that matches how your packets will be distributed. Small gift boxes read better with 5; 8 is the traditional CNY count; 10 is the most efficient for corporate bulk where the recipient is expected to re-distribute. We pack accordingly before shipping — just tell the configurator which one.",
        ],
        side: { kind:'list', label:'Pack by use', rows:[
          { text:'5 per pack',  time:'Boutique · wedding · small gift' },
          { text:'8 per pack',  time:'CNY gift (auspicious number)' },
          { text:'10 per pack', time:'Corporate bulk · staff distribution' },
        ]},
      },
    ],
  },
};

const faqs = [
  { question: "What orientations and paper do you offer?", answer: "Two orientations — Vertical and Horizontal — both on 157gsm Art or Matt Art paper, 4C + 0C single-sided offset print. Both orientations price the same. Standard money-packet dimensions; contact us for a custom size or shape if you need one." },
  { question: "What finishes are available?", answer: "Five options: No Finishing (plain offset print), Soft Touch (velvet-matte lamination front), Soft Touch + Spot UV (soft base with glossy highlight detail), Soft Touch + Foil (soft base with 1-side metallic foil — gold or silver), and Soft Touch + Spot UV + Foil (the full luxury stack). Soft Touch is the most common upgrade from plain; Foil goes on premium brand drops and luxury gifts." },
  { question: "What's the minimum and maximum run?", answer: "Minimum 500 packets per run — offset plate setup means smaller runs don't make economic sense. Maximum 9,000 packets in the standard ladder. For larger runs (10k+) contact us for a custom quote." },
  { question: "How much does custom ang pow printing cost in Singapore?", answer: "From S$223.80 for 500 plain money packets. 2,000pc plain is S$339.20, 5,000pc plain is S$759.40, 9,000pc plain is S$1,052.80. With finishes: 500pc with Soft Touch is S$282.60; 500pc with the full Soft Touch + Spot UV + Foil stack is S$501.80. Use the configurator for an exact quote on your combo." },
  { question: "Does pack size (5 / 8 / 10) change the price?", answer: "No. Pack size is a packaging choice, not a pricing axis. The price is driven entirely by orientation × finish × qty. Whether you order 2,000 packets packed as 400 × 5-packs, 250 × 8-packs, or 200 × 10-packs, the total stays the same." },
  { question: "Why are Vertical and Horizontal the same price?", answer: "Same paper, same offset setup, same finish options — orientation is a design decision, not a production cost difference. Pick the one that fits the artwork." },
  { question: "How long does production take?", answer: "10 working days from approved digital proof. Offset plate setup, print on 157gsm Art or Matt Art, die-cut to packet shape, any selected finishes (Soft Touch lamination / Spot UV / Foil — each adds its own pressing or curing step), and packing into your chosen pack size." },
  { question: "What file format do you need?", answer: "Print-ready PDF at the packet size with 3mm bleed, CMYK for body colour, fonts embedded. For Spot UV: a separate vector layer named \"SpotUV\" showing where the gloss varnish goes (100% black on that layer, nothing on the colour layers). For Foil: a separate vector layer named \"Foil\", also in 100% black, marking the metallic area. Send only the layers you want finished — everything else prints as 4C offset." },
];

async function main() {
  await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, { method:'PATCH', headers:H, body: JSON.stringify(productUpdate) });
  await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, { method:'PATCH', headers:H, body: JSON.stringify(extras) });
  await fetch(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}`, { method:'DELETE', headers:H });
  await fetch(`${BASE}/rest/v1/product_faqs`, {
    method:'POST', headers:H,
    body: JSON.stringify(faqs.map((f,i) => ({ product_id: PID, question: f.question, answer: f.answer, display_order: i }))),
  });
  console.log('✓ Money Packet content v2 (9k cap).');
}
main().catch(e => { console.error(e); process.exit(1); });
