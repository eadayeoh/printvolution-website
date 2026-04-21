// Surgical patch: NCR Form lead time 5 working days → 7 working days minimum.
// Touches the one FAQ answer, the extras.seo_body, and the extras.intro.
// Everything else on NCR is left alone.

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
const URL = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

const NCR_ID = 'cf2b00c8-6cfc-4749-9988-68d36c0f4332';

const NEW_FAQ_ANSWER =
  "Minimum 7 working days from approved digital proof. Carbonless stock cutting, 1 or 2 colour offset print, numbering, binding into books — all in-house, no middleman delays.";

async function patchFaq() {
  const q = `${URL}/rest/v1/product_faqs?product_id=eq.${NCR_ID}&question=eq.${encodeURIComponent('How long does production take?')}`;
  const res = await fetch(q, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ answer: NEW_FAQ_ANSWER }),
  });
  if (!res.ok) throw new Error(`PATCH faq: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  console.log(`✓ FAQ updated (${rows.length} row)`);
}

async function patchExtras() {
  const getRes = await fetch(
    `${URL}/rest/v1/product_extras?product_id=eq.${NCR_ID}&select=seo_body,intro`,
    { headers: H },
  );
  if (!getRes.ok) throw new Error(`GET extras: ${getRes.status}`);
  const [current] = await getRes.json();
  if (!current) throw new Error('no product_extras row for NCR');

  const seo_body = current.seo_body.replace(
    '5 working days offset',
    '7 working days min offset',
  );
  const intro = current.intro.replace(
    '5 working days offset',
    '7 working days min offset',
  );

  if (seo_body === current.seo_body && intro === current.intro) {
    console.log('· extras already updated, skipping');
    return;
  }

  const res = await fetch(`${URL}/rest/v1/product_extras?product_id=eq.${NCR_ID}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ seo_body, intro }),
  });
  if (!res.ok) throw new Error(`PATCH extras: ${res.status} ${await res.text()}`);
  console.log('✓ extras.seo_body + extras.intro updated');
}

async function main() {
  await patchFaq();
  await patchExtras();
}

main().catch((e) => { console.error(e); process.exit(1); });
