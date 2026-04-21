// Money Packet final cleanup — qty step presets still referenced
// 10,000 / 20,000 / 50,000 which were removed from qty_tiers.
// Trim presets to tiers that actually exist (500-9000).

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };
const PID = 'e7b979d0-d327-439a-9e4b-ae4abefe755b';

const res = await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.qty`,
  {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      step_config: {
        min: 500, step: 500,
        presets: [500, 1000, 2000, 3000, 5000, 9000],
        note: null, discount_note: null, labelMultiplier: null,
      },
    }),
  },
);
if (!res.ok) throw new Error(`PATCH: ${res.status} ${await res.text()}`);
console.log('✓ Money Packet qty presets cleaned: [500, 1000, 2000, 3000, 5000, 9000]');
