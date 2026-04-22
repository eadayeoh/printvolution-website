// Global contact-info refresh.
//
//   Opening hours    Mon–Fri  10am – 7:30pm
//                    Sat–Sun  10am – 7pm
//                    Closed on SG public holidays
//   Same-day cutoff  digital jobs submitted before 1pm  (was 4pm)
//   Address          Paya Lebar Square
//                    60 Paya Lebar Road
//                    #B1-35, Singapore 409051
//   Email            enquiry@printvolution.sg           (was hello@)
//   Telegram         @PrintVolution                     (new)
//
// Applied to:
//   page_content: global.footer.visit, global.announce (already 1pm),
//                 home.why, home.faq.items, home.location.main,
//                 about.promises.items,
//                 contact.hero.v4 (unchanged), contact.methods,
//                 contact.hours.header, contact.hours.days,
//                 contact.location.main, contact.faq (unchanged)
//   product_faqs: any answer mentioning "4pm"

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

const NEW_EMAIL = 'enquiry@printvolution.sg';
const NEW_MAILTO = `mailto:${NEW_EMAIL}`;
const TELEGRAM_HANDLE = '@PrintVolution';
const TELEGRAM_URL = 'https://t.me/PrintVolution';

async function getSection(page_key, section_key) {
  const r = await fetch(
    `${BASE}/rest/v1/page_content?page_key=eq.${page_key}&section_key=eq.${section_key}&select=id,data`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  );
  const rows = await r.json();
  return rows[0] ?? null;
}
async function setSection(id, data) {
  const r = await fetch(`${BASE}/rest/v1/page_content?id=eq.${id}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ data }),
  });
  if (!r.ok) throw new Error(`PATCH page_content ${id}: ${r.status} ${await r.text()}`);
}

// -----------------------------------------------------------------------------
// global / footer.visit  —  address, hours, email, whatsapp, telegram
// -----------------------------------------------------------------------------
{
  const row = await getSection('global', 'footer.visit');
  row.data = {
    items: [
      { kind: 'address', label: 'Paya Lebar Square',     detail: '60 Paya Lebar Road, #B1-35, Singapore 409051' },
      { kind: 'hours',   label: 'Mon–Fri',               detail: '10am – 7:30pm' },
      { kind: 'hours',   label: 'Sat–Sun',               detail: '10am – 7pm' },
      { kind: 'hours',   label: 'PH',                    detail: 'Closed' },
      { kind: 'email',   label: NEW_EMAIL,               href: NEW_MAILTO },
      { kind: 'phone',   label: '+65 8553 3497',         href: 'https://wa.me/6585533497' },
      { kind: 'telegram',label: TELEGRAM_HANDLE,         href: TELEGRAM_URL },
    ],
  };
  await setSection(row.id, row.data);
  console.log('✓ global/footer.visit updated (hours, email, telegram)');
}

// -----------------------------------------------------------------------------
// home / why  —  item 3 mentions old "Mon–Sat 10am–7.30pm" hours
// -----------------------------------------------------------------------------
{
  const row = await getSection('home', 'why');
  row.data.items = row.data.items.map((it) => {
    const text = it.desc;
    if (text && text.includes('Mon–Sat 10am–7.30pm')) {
      return {
        ...it,
        desc: text.replace(
          /Mon–Sat 10am–7\.30pm/g,
          'Mon–Fri 10am–7:30pm, Sat–Sun 10am–7pm',
        ),
      };
    }
    return it;
  });
  await setSection(row.id, row.data);
  console.log('✓ home/why updated (hours)');
}

// -----------------------------------------------------------------------------
// home / faq.items  —  Q1 (cutoff 4pm → 1pm), Q4 (hours)
// -----------------------------------------------------------------------------
{
  const row = await getSection('home', 'faq.items');
  row.data.items = row.data.items.map((it) => {
    let a = it.answer;
    a = a
      .replace(/before 4pm/g, 'before 1pm')
      .replace(
        /Mon–Sat 10am–7\.30pm/g,
        'Mon–Fri 10am–7:30pm, Sat–Sun 10am–7pm (closed on SG public holidays)',
      )
      .replace(/hello@printvolution\.sg/g, NEW_EMAIL);
    return { ...it, answer: a };
  });
  await setSection(row.id, row.data);
  console.log('✓ home/faq.items updated (cutoff, hours)');
}

// -----------------------------------------------------------------------------
// home / location.main  —  email href (label is already enquiry@), telegram add
// -----------------------------------------------------------------------------
{
  const row = await getSection('home', 'location.main');
  const existing = row.data.items;
  const patched = existing.map((it) => {
    if (it.kind === 'email') {
      return { ...it, href: NEW_MAILTO, detail: NEW_EMAIL };
    }
    if (it.kind === 'hours') {
      return {
        ...it,
        detail: 'Mon–Fri 10am–7:30pm · Sat–Sun 10am–7pm · Closed on PH',
      };
    }
    return it;
  });
  // Add a Telegram entry if not already present
  if (!patched.some((it) => it.kind === 'telegram')) {
    patched.push({ kind: 'telegram', label: 'Telegram', detail: TELEGRAM_HANDLE, href: TELEGRAM_URL });
  }
  row.data.items = patched;
  await setSection(row.id, row.data);
  console.log('✓ home/location.main updated (email, hours, telegram)');
}

// -----------------------------------------------------------------------------
// about / promises.items  —  item 03 "before 4pm"
// -----------------------------------------------------------------------------
{
  const row = await getSection('about', 'promises.items');
  row.data.items = row.data.items.map((it) => ({
    ...it,
    body: (it.body || '').replace(/before 4pm/g, 'before 1pm'),
  }));
  await setSection(row.id, row.data);
  console.log('✓ about/promises.items updated (cutoff)');
}

// -----------------------------------------------------------------------------
// contact / hours.header  —  body + title copy
// -----------------------------------------------------------------------------
{
  const row = await getSection('contact', 'hours.header');
  row.data.items = [
    {
      kicker: 'Opening hours',
      title: 'Open',
      title_yellow: 'every day,',
      title_suffix: 'except PH.',
      body: 'Mon–Fri 10am – 7:30pm · Sat–Sun 10am – 7pm. Same-day collection on digital jobs submitted before 1pm. Closed on Singapore public holidays.',
    },
  ];
  await setSection(row.id, row.data);
  console.log('✓ contact/hours.header updated (cutoff, hours)');
}

// -----------------------------------------------------------------------------
// contact / hours.days  —  the 7-cell grid
// -----------------------------------------------------------------------------
{
  const row = await getSection('contact', 'hours.days');
  row.data.items = [
    { day_label: 'Mon', time: '10 – 7:30' },
    { day_label: 'Tue', time: '10 – 7:30' },
    { day_label: 'Wed', time: '10 – 7:30' },
    { day_label: 'Thu', time: '10 – 7:30' },
    { day_label: 'Fri', time: '10 – 7:30' },
    { day_label: 'Sat', time: '10 – 7' },
    { day_label: 'Sun', time: '10 – 7' },
  ];
  await setSection(row.id, row.data);
  console.log('✓ contact/hours.days updated (M–F 10–7:30, Sat–Sun 10–7)');
}

// -----------------------------------------------------------------------------
// contact / methods  —  email + add telegram tile
// -----------------------------------------------------------------------------
{
  const row = await getSection('contact', 'methods');
  const items = row.data.items.map((m) => {
    if (m.title === 'Email') {
      return {
        ...m,
        href: NEW_MAILTO,
        value: NEW_EMAIL,
        body: 'Send files, ask questions, attach references. We reply within 2 working hours. Contact form is fastest.',
      };
    }
    return m;
  });
  // Add Telegram tile if missing
  if (!items.some((m) => m.title === 'Telegram')) {
    items.push({
      tone: 'cyan',
      icon: '✈',
      label: 'Chat channel',
      title: 'Telegram',
      body: 'DM on Telegram for quick questions. Reply time similar to WhatsApp during business hours.',
      value: TELEGRAM_HANDLE,
      href: TELEGRAM_URL,
    });
  }
  row.data.items = items;
  await setSection(row.id, row.data);
  console.log('✓ contact/methods updated (email, telegram)');
}

// -----------------------------------------------------------------------------
// contact / location.main  —  email href + telegram fields
// -----------------------------------------------------------------------------
{
  const row = await getSection('contact', 'location.main');
  const loc = row.data.items[0];
  row.data.items = [
    {
      ...loc,
      email_href: NEW_MAILTO,
      email_label: NEW_EMAIL,
      address_line1: 'Paya Lebar Square',
      address_line2: '60 Paya Lebar Road',
      address_line3: '#B1-35, Singapore 409051',
      telegram_label: TELEGRAM_HANDLE,
      telegram_href: TELEGRAM_URL,
    },
  ];
  await setSection(row.id, row.data);
  console.log('✓ contact/location.main updated (email, telegram, address)');
}

// -----------------------------------------------------------------------------
// product_faqs  —  any answer mentioning "4pm" (e.g. name-card)
// -----------------------------------------------------------------------------
{
  const r = await fetch(
    `${BASE}/rest/v1/product_faqs?answer=ilike.*4pm*&select=id,answer`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  );
  const hits = await r.json();
  let touched = 0;
  for (const f of hits) {
    const newAnswer = f.answer.replace(/before 4pm/g, 'before 1pm');
    if (newAnswer !== f.answer) {
      const p = await fetch(`${BASE}/rest/v1/product_faqs?id=eq.${f.id}`, {
        method: 'PATCH',
        headers: H,
        body: JSON.stringify({ answer: newAnswer }),
      });
      if (!p.ok) throw new Error(`PATCH faq ${f.id}: ${await p.text()}`);
      touched++;
    }
  }
  console.log(`✓ product_faqs updated — ${touched} answers touched`);
}

console.log('\nAll DB contact-info refresh complete.');
