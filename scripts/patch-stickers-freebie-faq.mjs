// Stickers: reframe the monotonicity-floor FAQ as a positive "1 free
// sheet at every tier" perk instead of a technical explanation.

import fs from 'node:fs';

const env = fs.readFileSync(
  '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
  'utf8',
);
const kv = Object.fromEntries(
  env.trim().split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }),
);
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

const PID = 'adb6bb6d-63d0-41c2-8908-64e64541ef04';

const OLD_Q = "Why doesn't the price go down when I add a sheet that crosses a tier?";
const NEW_Q = "Do I get a bonus at the volume tiers?";
const NEW_A =
  "Yes — at 20, 30, 40, and 50 sheets you effectively get one sheet on the house. The total holds at the previous tier's peak price while the new tier rate catches up, so the extra sheet is on us at the tier jump.";

const res = await fetch(
  `${BASE}/rest/v1/product_faqs?product_id=eq.${PID}&question=eq.${encodeURIComponent(OLD_Q)}`,
  {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ question: NEW_Q, answer: NEW_A }),
  },
);
if (!res.ok) throw new Error(`PATCH faq: ${res.status} ${await res.text()}`);
const rows = await res.json();
console.log(`✓ FAQ reframed (${rows.length} row)`);

// Also reframe the magazine's volume-pricing article to match —
// swap the "we never let the price drop" paragraph for the positive
// "1 sheet free at every tier jump" framing.

const [ex] = await (await fetch(
  `${BASE}/rest/v1/product_extras?product_id=eq.${PID}&select=seo_magazine`,
  { headers: H },
)).json();
if (!ex?.seo_magazine?.articles) throw new Error('no seo_magazine.articles');

const mag = ex.seo_magazine;
const art = mag.articles.find((a) => a.num === '03');
if (!art) throw new Error("couldn't find article 03");

art.body = [
  "Type any number of sheets from **1 to 50**. The per-sheet rate drops at each tier: **$15/sheet at qty 1**, **$14 at 10**, **$13 at 20**, **$12 at 30**, **$11 at 40**, **$10 at 50**. Between tiers the rate stays at the tier you fall into — so 7 sheets is 7 × $15 = $105, and 25 sheets is 25 × $13 = $325.",
  "At every tier jump (20 / 30 / 40 / 50 sheets) **you effectively get 1 sheet free** — the total matches what the previous qty would have cost, so the extra sheet lands on the house. For runs over 50 sheets the price becomes a custom quote — higher volumes move into roll-sticker production or gang-run economics which price differently. Planning a large merch run? Tell us the target qty and we'll route the job to the right process.",
];
art.side = {
  kind: 'list',
  label: 'Per-sheet tier',
  rows: [
    { text: '1 sheet',   time: '$15/sheet' },
    { text: '10 sheets', time: '$14/sheet' },
    { text: '20 sheets', time: '$13/sheet · +1 free' },
    { text: '30 sheets', time: '$12/sheet · +1 free' },
    { text: '40 sheets', time: '$11/sheet · +1 free' },
    { text: '50 sheets', time: '$10/sheet · +1 free' },
  ],
};

const res2 = await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ seo_magazine: mag }),
});
if (!res2.ok) throw new Error(`PATCH extras: ${res2.status} ${await res2.text()}`);
console.log('✓ seo_magazine article 03 reframed');
