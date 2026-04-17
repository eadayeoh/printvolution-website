#!/usr/bin/env node
/**
 * Seed sample data:
 * - 8 sample customer members with realistic Singapore names + point balances
 * - 4 sample blog posts so /blog doesn't look empty
 *
 * Idempotent: skips anything that already exists by email / slug.
 */
import fs from 'node:fs';
import postgres from 'postgres';
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });

const MEMBERS = [
  { email: 'jia.min@example.com', name: 'Jia Min Tan', phone: '+6591234561', tier: 'silver', points_balance: 320, total_earned: 780 },
  { email: 'wei.lun@example.com', name: 'Wei Lun Lim', phone: '+6591234562', tier: 'gold',   points_balance: 1240, total_earned: 2100 },
  { email: 'priya.k@example.com', name: 'Priya Krishnan', phone: '+6591234563', tier: 'silver', points_balance: 88,  total_earned: 140 },
  { email: 'ahmad.rashid@example.com', name: 'Ahmad Rashid', phone: '+6591234564', tier: 'bronze', points_balance: 45,  total_earned: 45 },
  { email: 'natalie.wong@example.com', name: 'Natalie Wong', phone: '+6591234565', tier: 'gold',   points_balance: 2180, total_earned: 4500 },
  { email: 'daniel.ng@example.com', name: 'Daniel Ng', phone: '+6591234566', tier: 'bronze', points_balance: 180, total_earned: 180 },
  { email: 'sofia.binte@example.com', name: 'Sofia Binte Hassan', phone: '+6591234567', tier: 'silver', points_balance: 460, total_earned: 920 },
  { email: 'kenneth.tan@example.com', name: 'Kenneth Tan', phone: '+6591234568', tier: 'bronze', points_balance: 30,  total_earned: 30 },
];

const POSTS = [
  {
    slug: 'how-to-pick-the-right-paper-for-name-cards',
    title: 'How to pick the right paper for name cards (without sounding like a printer)',
    excerpt: 'Matte, gloss, soft-touch, uncoated — every option sounds good until you hold it. Here\'s the cheat sheet from someone who prints 10,000 cards a week.',
    author: 'Printvolution team',
    tags: ['name cards', 'paper', 'guides'],
    published_at: '2024-09-18T09:00:00Z',
    content_html: `
<p>You walk into our shop at Paya Lebar Square and point at the paper swatch wheel. The first thing every customer asks is: <em>"Which one will make me look serious?"</em> It\u2019s the right question. The wrong answer is to rattle off paper weights.</p>
<h2>Start with the feel, not the weight</h2>
<p>Hand a customer three cards \u2014 one matte, one gloss, one soft-touch \u2014 and they pick soft-touch 90% of the time. It feels expensive because it IS expensive (roughly 15% more than standard matte), but the lift in perceived quality is disproportionate. If you\u2019re a consultant, coach, or designer, this is almost always the right choice.</p>
<h2>Matte vs gloss isn\u2019t the question</h2>
<p>Most printers will ask you to choose between matte and gloss. Here\u2019s the real answer: <strong>matte for text-heavy cards, gloss for image-heavy cards.</strong> Matte reads like a book. Gloss reads like a photo. That\u2019s it.</p>
<h2>The 350gsm rule</h2>
<p>Anything under 300gsm feels like a flyer, not a card. Anything over 400gsm costs disproportionately more and won\u2019t fit most card-holders. 350gsm is the sweet spot that almost every serious business runs. Don\u2019t let us talk you into 450gsm unless you\u2019re handing cards to architects.</p>
<h2>What about luxury cards?</h2>
<p>Our luxury line runs 600gsm double-sided with painted edges. These are for closing dinners, not networking events. If you have 30 meetings a week, stick to 350gsm soft-touch \u2014 the difference isn\u2019t worth burning $3 per card.</p>
<p>Come by the shop and feel the samples. It\u2019s a 5-minute decision if you do. WhatsApp us if you can\u2019t drop in.</p>
    `.trim(),
  },
  {
    slug: 'why-your-roll-up-banner-looks-cheap-and-how-to-fix-it',
    title: 'Why your roll-up banner looks cheap (and how to fix it in one edit)',
    excerpt: '90% of the cheap-looking banners we reprint have the same issue: text crammed into the top third. The fix is free and takes 30 seconds.',
    author: 'Printvolution team',
    tags: ['banners', 'design tips', 'guides'],
    published_at: '2024-10-02T09:00:00Z',
    content_html: `
<p>We print 400+ roll-up banners a month. At this volume, you start to see patterns. Here\u2019s the one that keeps coming up: people design banners with everything in the top third, leaving the bottom two-thirds blank \u2014 because they think that\u2019s the "important" area.</p>
<h2>It\u2019s actually the opposite</h2>
<p>A standing adult\u2019s eye level is about 1.5m from the floor. A standard roll-up banner stands 2m tall. The <strong>middle third</strong> of the banner is what people actually read. The top third is decorative. The bottom third is basically invisible because people\u2019s bodies get in the way.</p>
<h2>Reallocate your real estate</h2>
<ul>
  <li><strong>Top 30%:</strong> logo + one-word attention grab</li>
  <li><strong>Middle 40%:</strong> your actual message and visual</li>
  <li><strong>Bottom 30%:</strong> call-to-action, URL, QR code</li>
</ul>
<p>That\u2019s the template. If you zoom out and squint, you should still be able to see the headline from 3m away. If you can\u2019t, the font is too small or the contrast is too low.</p>
<h2>Colour that survives exhibition lighting</h2>
<p>Event venues are weirdly lit. Fluorescent overheads wash out cool blues. Warm halogens turn yellows green. Solution: run your artwork past a printed proof under your phone\u2019s torch \u2014 if it still reads, it\u2019ll read under event lighting.</p>
<p>We run pre-press checks on every banner. If something will look off, we\u2019ll flag it before we print. That\u2019s part of why our reprints are basically zero.</p>
    `.trim(),
  },
  {
    slug: 'embroidery-vs-printed-t-shirts-when-each-one-wins',
    title: 'Embroidery vs printed T-shirts: when each one wins',
    excerpt: 'Same logo, two outputs. One feels premium, one washes out in 20 cycles. Here\'s when embroidery is worth the extra cost \u2014 and when print is the smarter choice.',
    author: 'Printvolution team',
    tags: ['embroidery', 'apparel', 'guides'],
    published_at: '2024-10-28T09:00:00Z',
    content_html: `
<p>Embroidery is usually 2\u20133x the price of print. So when should you actually pay for it?</p>
<h2>Embroidery wins when:</h2>
<ul>
  <li><strong>You want it to last.</strong> Stitched thread outlives printed ink by years. A corporate uniform lasts its full 2-year cycle looking sharp.</li>
  <li><strong>The logo is simple and blocky.</strong> Fine detail (below 1.5mm) gets lost in stitches. A "clean" logo = happy embroidery.</li>
  <li><strong>You\u2019re stitching on polos, jackets, caps.</strong> The thicker fabric supports stitches better. Thin T-shirts pucker.</li>
  <li><strong>You want perceived value.</strong> Clients can feel the difference when they shake your hand in an embroidered polo.</li>
</ul>
<h2>Print wins when:</h2>
<ul>
  <li><strong>The design is colourful or photographic.</strong> Embroidery caps out around 15 thread colours and hates gradients.</li>
  <li><strong>You\u2019re doing an event run.</strong> 50 shirts for a charity fun run? Print. Nobody wears these past next weekend.</li>
  <li><strong>The back is large.</strong> Full-back embroidery is technically possible but takes 45 minutes per shirt \u2014 expensive.</li>
</ul>
<h2>The 100-unit rule</h2>
<p>Our rough heuristic: under 100 units and it\u2019s a short-term campaign, print it. Over 100 units or it\u2019s uniforms/kit that lasts a year+, embroider it. The per-unit cost converges fast at volume.</p>
    `.trim(),
  },
  {
    slug: 'personalised-gifts-for-clients-that-dont-end-up-in-the-drawer',
    title: 'Personalised gifts for clients that don\'t end up in the drawer',
    excerpt: 'Every year end, companies buy generic corporate gifts and every year end, 80% land in a desk drawer. Here\'s what actually gets used.',
    author: 'Printvolution team',
    tags: ['gifts', 'corporate', 'guides'],
    published_at: '2024-11-15T09:00:00Z',
    content_html: `
<p>We\u2019ve talked to enough purchasing managers to know: generic corporate gifts \u2014 stress balls, branded pens, tote bags with a logo \u2014 go in the drawer within a week. If you\u2019re going to spend money on something a client will remember, it needs to pass <strong>one test: would they actually use it if it wasn\u2019t branded?</strong></p>
<h2>What passes the test</h2>
<ul>
  <li><strong>A photo gift from something they shared with you.</strong> Map of the client\u2019s HQ as a frame. Photo of their team at the last offsite, printed on wood. The stuff that lands on their desk stays on their desk.</li>
  <li><strong>Embroidered premium drinkware.</strong> Yeti-style mug with their name. Not a logo, their actual name. They\u2019ll drink coffee from it for years.</li>
  <li><strong>A laser-engraved keychain.</strong> Wooden keychain with a tiny inside joke only you and they know. This is a relationship-building gift, not a branding gift.</li>
  <li><strong>A high-quality leather luggage tag.</strong> Travellers use these daily. Brandless but personalised with their initials.</li>
</ul>
<h2>What fails the test</h2>
<ul>
  <li>Branded tote bags (they already own 12)</li>
  <li>Stress balls (nobody has ever reached for one under stress)</li>
  <li>Cheap pens (worse than hotel pens)</li>
  <li>Generic chocolate boxes (thoughtful wrapping can\u2019t fix this)</li>
</ul>
<h2>Budget guide</h2>
<p>If you have $30\u201350 per client, go personalised. If you have $10\u201315 per client, do nothing \u2014 write a handwritten card instead. The middle-tier is the no-man\u2019s-land where gifts go to die in drawers.</p>
<p>We do custom runs of personalised gifts at any volume from 1 to 500. Upload a photo, pick a product, we ship.</p>
    `.trim(),
  },
];

try {
  // Members
  let mAdded = 0, mSkipped = 0;
  for (const m of MEMBERS) {
    const [exists] = await pg`select id from members where email = ${m.email} limit 1`;
    if (exists) { mSkipped++; continue; }
    const joinedDate = new Date(Date.now() - (100 - mAdded * 10) * 24 * 60 * 60 * 1000).toISOString();
    await pg`
      insert into members (email, name, phone, tier, points_balance, total_earned, joined_at)
      values (${m.email}, ${m.name}, ${m.phone}, ${m.tier}, ${m.points_balance}, ${m.total_earned}, ${joinedDate})
    `;
    mAdded++;
  }
  console.log(`Members: ${mAdded} added, ${mSkipped} already existed`);

  // Blog posts
  let pAdded = 0, pSkipped = 0;
  for (const p of POSTS) {
    const [exists] = await pg`select id from blog_posts where slug = ${p.slug} limit 1`;
    if (exists) { pSkipped++; continue; }
    await pg`
      insert into blog_posts (slug, title, excerpt, content_html, author, tags, status, published_at)
      values (${p.slug}, ${p.title}, ${p.excerpt}, ${p.content_html}, ${p.author}, ${p.tags}, 'published', ${p.published_at})
    `;
    pAdded++;
  }
  console.log(`Blog posts: ${pAdded} added, ${pSkipped} already existed`);

  console.log('\n✓ Sample data seeded');
} finally {
  await pg.end({ timeout: 2 });
}
