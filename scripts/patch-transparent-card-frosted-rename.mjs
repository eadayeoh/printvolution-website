// Transparent Card — rename the "Frosted Plastic / Touche" material
// to just "Frosted". The Touche variant isn't offered on this product
// line, so the grouped label was misleading.
//
// Surgical: only touches the material axis label + any page copy that
// mentioned Touche by name. Pricing and slugs (frosted_plastic_touche)
// stay unchanged so we don't invalidate the 60 price entries keyed on
// that slug — only display strings change.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
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

const PID = '445d3c29-7fa2-4637-8d44-57e2f610c009';

// -----------------------------------------------------------------------------
// 1. pricing_table — relabel the material option, keep the slug
// -----------------------------------------------------------------------------
const productRes = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}&select=pricing_table`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const productRow = (await productRes.json())[0];
const pt = productRow.pricing_table;

pt.axes.material = pt.axes.material.map((m) => {
  if (m.slug === 'frosted_plastic_touche') {
    return { ...m, label: 'Frosted', note: 'Velvet-feel frosted PVC · 100/box' };
  }
  return m;
});

const prodPatch = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ pricing_table: pt }),
});
if (!prodPatch.ok) throw new Error(`PATCH pricing_table: ${prodPatch.status} ${await prodPatch.text()}`);
console.log('✓ pricing_table material label updated to "Frosted"');

// -----------------------------------------------------------------------------
// 2. product_configurator — update the material step option label in place
// -----------------------------------------------------------------------------
const cfgRes = await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.material&select=options`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
);
const cfgRow = (await cfgRes.json())[0];
const newOptions = cfgRow.options.map((o) => {
  if (o.slug === 'frosted_plastic_touche') {
    return { ...o, label: 'Frosted', note: 'Velvet-feel frosted PVC · 100/box' };
  }
  return o;
});

const cfgPatch = await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.material`,
  {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ options: newOptions }),
  },
);
if (!cfgPatch.ok) throw new Error(`PATCH configurator: ${cfgPatch.status} ${await cfgPatch.text()}`);
console.log('✓ configurator material option updated to "Frosted"');

// -----------------------------------------------------------------------------
// 3. product_extras — strip "/ Touche" mentions from the body copy
// -----------------------------------------------------------------------------
const exRes0 = await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}&select=*`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const ex = (await exRes0.json())[0];

function replaceAll(s) {
  if (!s || typeof s !== 'string') return s;
  return s
    .replace(/Frosted Plastic \/ Touche/g, 'Frosted')
    .replace(/Frosted \/ Touche/g, 'Frosted')
    .replace(/Frosted Plastic/g, 'Frosted');
}

function deepReplace(v) {
  if (typeof v === 'string') return replaceAll(v);
  if (Array.isArray(v)) return v.map(deepReplace);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = deepReplace(val);
    return out;
  }
  return v;
}

const exPatch = {
  seo_desc: replaceAll(ex.seo_desc),
  intro: replaceAll(ex.intro),
  seo_body: replaceAll(ex.seo_body),
  seo_magazine: deepReplace(ex.seo_magazine),
  matcher: deepReplace(ex.matcher),
};

const exRes = await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify(exPatch),
});
if (!exRes.ok) throw new Error(`PATCH extras: ${exRes.status} ${await exRes.text()}`);
console.log('✓ product_extras copy updated (Touche stripped)');

// -----------------------------------------------------------------------------
// 4. product_faqs — same string replace pass
// -----------------------------------------------------------------------------
const faqsRes0 = await fetch(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}&select=id,answer,question`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const faqs = await faqsRes0.json();
let faqTouches = 0;
for (const f of faqs) {
  const newQ = replaceAll(f.question);
  const newA = replaceAll(f.answer);
  if (newQ !== f.question || newA !== f.answer) {
    faqTouches++;
    const patch = await fetch(`${BASE}/rest/v1/product_faqs?id=eq.${f.id}`, {
      method: 'PATCH',
      headers: H,
      body: JSON.stringify({ question: newQ, answer: newA }),
    });
    if (!patch.ok) throw new Error(`PATCH faq ${f.id}: ${patch.status} ${await patch.text()}`);
  }
}
console.log(`✓ faqs updated — ${faqTouches} touched`);

console.log('\nDone. Slug frosted_plastic_touche is unchanged (prices still keyed on it).');
