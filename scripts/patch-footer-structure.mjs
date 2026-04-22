// Footer restructure:
//
//   1. Brand column socials → Facebook / Instagram / TikTok.
//      (WhatsApp dropped because it's already a contact channel in the
//      Visit column.) icon_url added so admin can upload real brand
//      icons later.
//
//   2. Visit column channel items (Landline / WhatsApp / Telegram /
//      Email) → get an icon_url field so admin can swap the default
//      icon for a custom image via the CMS editor.
//
// FB + TikTok URLs are placeholders — admin edits to the real ones
// through /admin → Pages → Global → Footer.

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

// -----------------------------------------------------------------------------
// footer.social — replace current 2 items with FB / IG / TikTok
// -----------------------------------------------------------------------------
{
  const row = await getSection('global', 'footer.social');
  row.data = {
    items: [
      { label: 'FB', aria: 'Facebook',  href: 'https://www.facebook.com/printvolution',  icon_url: null },
      { label: 'IG', aria: 'Instagram', href: 'https://www.instagram.com/printvolution/', icon_url: null },
      { label: 'TT', aria: 'TikTok',    href: 'https://www.tiktok.com/@printvolution',   icon_url: null },
    ],
  };
  await setSection(row.id, row.data);
  console.log('✓ footer.social → FB / IG / TikTok (icon_url open for admin upload)');
}

// -----------------------------------------------------------------------------
// footer.visit — add icon_url: null to each channel item
// -----------------------------------------------------------------------------
{
  const row = await getSection('global', 'footer.visit');
  const CHANNEL_KINDS = new Set(['phone', 'telegram', 'email']);
  row.data.items = row.data.items.map((it) => {
    if (CHANNEL_KINDS.has(it.kind)) {
      return { ...it, icon_url: it.icon_url ?? null };
    }
    return it;
  });
  await setSection(row.id, row.data);
  console.log('✓ footer.visit channel items now have icon_url slots');
}
