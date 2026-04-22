// Contact channel cleanup across the site:
//
//   1. Footer: each channel on its own line with CHANNEL → identifier
//      (Landline / WhatsApp / Telegram / Email).
//   2. Contact /contact methods tiles:
//       • "Call us" → real landline +65 6969 3837 (was WhatsApp number)
//       • "WhatsApp" → +65 8553 3497 (kept)
//       • "Telegram" → @PrintVolution (added earlier)
//       • "Email" → enquiry@printvolution.sg (kept)
//       • "Visit the shop" → DROPPED (the location card + Google Map
//         below already show this; duplicate info confuses the grid)
//   3. Contact /contact location.main:
//       • Landline field added
//       • Phone field reframed as WhatsApp with prefix so the tile
//         label is unambiguous
//       • parking_label / parking_detail WIPED — the claim about
//         "first 30 min free" isn't accurate
//   4. Home /location.main: "Office" relabelled "Landline" with a
//      tel: href so it's clickable on mobile.

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

async function getSection(page_key, section_key) {
  const r = await fetch(
    `${BASE}/rest/v1/page_content?page_key=eq.${page_key}&section_key=eq.${section_key}&select=id,data`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  );
  return (await r.json())[0] ?? null;
}
async function setSection(id, data) {
  const r = await fetch(`${BASE}/rest/v1/page_content?id=eq.${id}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ data }),
  });
  if (!r.ok) throw new Error(`PATCH ${id}: ${await r.text()}`);
}

const LANDLINE     = '+65 6969 3837';
const LANDLINE_TEL = 'tel:+6569693837';
const WA_NUMBER    = '+65 8553 3497';
const WA_URL       = 'https://wa.me/6585533497';
const TG_HANDLE    = '@PrintVolution';
const TG_URL       = 'https://t.me/PrintVolution';
const EMAIL        = 'enquiry@printvolution.sg';
const MAILTO       = `mailto:${EMAIL}`;

// -----------------------------------------------------------------------------
// global / footer.visit
// -----------------------------------------------------------------------------
{
  const row = await getSection('global', 'footer.visit');
  row.data = {
    items: [
      { kind: 'address',  label: 'Paya Lebar Square', detail: '60 Paya Lebar Road, #B1-35, Singapore 409051' },
      { kind: 'hours',    label: 'Mon–Fri',           detail: '10am – 7:30pm' },
      { kind: 'hours',    label: 'Sat–Sun',           detail: '10am – 7pm' },
      { kind: 'hours',    label: 'PH',                detail: 'Closed' },
      { kind: 'phone',    label: 'Landline',          detail: LANDLINE,  href: LANDLINE_TEL },
      { kind: 'phone',    label: 'WhatsApp',          detail: WA_NUMBER, href: WA_URL },
      { kind: 'telegram', label: 'Telegram',          detail: TG_HANDLE, href: TG_URL },
      { kind: 'email',    label: EMAIL,               href: MAILTO },
    ],
  };
  await setSection(row.id, row.data);
  console.log('✓ global/footer.visit — channels now carry identifiers');
}

// -----------------------------------------------------------------------------
// contact / methods — drop Visit the shop, fix Call us to landline
// -----------------------------------------------------------------------------
{
  const row = await getSection('contact', 'methods');
  const kept = row.data.items
    .filter((m) => m.title !== 'Visit the shop')
    .map((m) => {
      if (m.title === 'Call us') {
        return {
          ...m,
          href: LANDLINE_TEL,
          value: LANDLINE,
        };
      }
      if (m.title === 'WhatsApp') {
        return { ...m, href: WA_URL, value: WA_NUMBER };
      }
      return m;
    });
  row.data.items = kept;
  await setSection(row.id, row.data);
  for (const m of kept) {
    console.log(`  contact/methods: ${String(m.title).padEnd(10)} → ${m.value} (${m.href})`);
  }
}

// -----------------------------------------------------------------------------
// contact / location.main — landline + WhatsApp distinct, parking fields wiped
// -----------------------------------------------------------------------------
{
  const row = await getSection('contact', 'location.main');
  const loc = row.data.items[0];
  // Wipe parking_* fields (user: "not even right")
  const {
    parking_label: _pl,
    parking_detail: _pd,
    ...rest
  } = loc;
  row.data.items = [
    {
      ...rest,
      landline_label: LANDLINE,
      landline_href:  LANDLINE_TEL,
      phone_label:    `WhatsApp · ${WA_NUMBER}`,
      phone_href:     WA_URL,
      telegram_label: TG_HANDLE,
      telegram_href:  TG_URL,
      email_href:     MAILTO,
      email_label:    EMAIL,
    },
  ];
  await setSection(row.id, row.data);
  console.log('✓ contact/location.main — landline added, parking_* wiped, phone reframed as WhatsApp');
}

// -----------------------------------------------------------------------------
// home / location.main — Office → Landline with tel: href
// -----------------------------------------------------------------------------
{
  const row = await getSection('home', 'location.main');
  row.data.items = row.data.items.map((it) => {
    if (it.kind === 'phone' && it.label === 'Office') {
      return { ...it, label: 'Landline', detail: LANDLINE, href: LANDLINE_TEL };
    }
    if (it.kind === 'phone' && it.label === 'WhatsApp') {
      return { ...it, detail: WA_NUMBER, href: WA_URL };
    }
    return it;
  });
  await setSection(row.id, row.data);
  console.log('✓ home/location.main — Office → Landline');
}
