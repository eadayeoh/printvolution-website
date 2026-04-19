// Pulls the live rates config from the pvpricelist Supabase project
// and dumps it to scripts/pvpricelist-snapshot.json for offline use.
//
// pvpricelist is a separate Supabase project (internal staff tool); its
// anon URL + publishable key live in ~/Desktop/Price List/priceless/.env.local.
// The rates live in app_config under key='rates_v1' as one big jsonb.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PVPL_URL = 'https://tjupqglepjackdqbgzql.supabase.co';
const PVPL_KEY = 'sb_publishable_mpx0Ol7nhKg1NJBpKnfsmA_KAiPUBo4';

const res = await fetch(
  `${PVPL_URL}/rest/v1/app_config?key=eq.rates_v1&select=value,updated_at`,
  {
    headers: {
      apikey: PVPL_KEY,
      Authorization: `Bearer ${PVPL_KEY}`,
      Accept: 'application/json',
    },
  },
);
if (!res.ok) {
  const t = await res.text();
  throw new Error(`HTTP ${res.status}: ${t}`);
}
const rows = await res.json();
if (!rows.length) throw new Error("No rates_v1 row in app_config");

const payload = {
  pulled_at: new Date().toISOString(),
  supabase_updated_at: rows[0].updated_at,
  rates: rows[0].value,
};

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outPath = path.join(root, 'scripts/pvpricelist-snapshot.json');
await fs.writeFile(outPath, JSON.stringify(payload, null, 2));

const rates = payload.rates;
console.log('✓ snapshot saved:', outPath);
console.log('  supabase updated_at:', payload.supabase_updated_at);
console.log('\ntop-level tabs:');
for (const k of Object.keys(rates)) {
  const sub = rates[k] && typeof rates[k] === 'object' ? Object.keys(rates[k]).length : 0;
  console.log(`  ${k} (${sub} keys)`);
}

// Quick peek at flyers
if (rates.flyers) {
  console.log('\nflyers keys:', Object.keys(rates.flyers));
  if (rates.flyers.EP_RATES) {
    const paperKeys = Object.keys(rates.flyers.EP_RATES);
    console.log(`  EP_RATES papers: ${paperKeys.length} combos`);
    console.log(`  e.g. ${paperKeys[0]}: ${Object.keys(rates.flyers.EP_RATES[paperKeys[0]]).length} qty tiers`);
  }
}
