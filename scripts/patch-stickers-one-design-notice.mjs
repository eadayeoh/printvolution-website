// Stickers: reformat "1 sheet = 1 design, 1 size" as a prominent notice.
//   • Strengthen the matcher right_note so the rule is visible on the page
//   • Rewrite FAQ #2 to cover BOTH constraints (design + size), not just design
//   • Prepend a one-line notice to the intro so the rule is unmissable

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };

const PID = 'adb6bb6d-63d0-41c2-8908-64e64541ef04';

// Pull existing extras to preserve matcher shape
const [row] = await (await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}&select=intro,matcher`, { headers: H })).json();

// ─── 1. Prepend a visible notice to intro ─────────────────────────
const NOTICE = '**One sheet = one design, one size. No mixing designs or sizes on the same sheet — order separate sheets for each design or size.** ';
const nextIntro = row.intro.startsWith('**One sheet = one design')
  ? row.intro
  : NOTICE + row.intro;

// ─── 2. Strengthen the matcher right-note ─────────────────────────
const nextMatcher = {
  ...row.matcher,
  right_note_title: 'One sheet. One design. One size.',
  right_note_body: 'Each sheet prints a single design at a single size — no mixing designs or sizes on the same sheet. Need two designs or two sizes? Order them as separate sheets. Minimum is one sheet.',
};

await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, {
  method: 'PATCH', headers: H,
  body: JSON.stringify({ intro: nextIntro, matcher: nextMatcher }),
});
console.log('[1/2] intro + matcher notice updated');

// ─── 3. Rewrite FAQ (display_order 2) to cover BOTH design + size ─
await fetch(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}&display_order=eq.2`, {
  method: 'PATCH', headers: H,
  body: JSON.stringify({
    question: 'Can I mix different designs or sizes on one sheet?',
    answer: 'No. Each sheet is a single design at a single size — no mixing on the same sheet. The minimum unit is one sheet. If you need multiple designs or two sizes of the same design, order them as separate line items (one sheet per design/size combination). For gang-printed mixed designs on a single sheet, use our UV DTF sticker product instead.',
  }),
});
console.log('[2/2] FAQ #2 rewritten to cover design + size rule');

console.log('\n✓ Sticker one-sheet-one-design notice set.');
