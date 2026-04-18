#!/usr/bin/env node
/**
 * Wipe legacy @example.com sample members and create ONE fully-populated
 * demo customer (auth user + rich profile + members + orders + points)
 * for reviewing the admin UI against realistic data.
 *
 * Idempotent: safe to re-run.
 *
 *   node scripts/reseed-sample-customer.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const SAMPLE_EMAILS = [
  'jia.min@example.com',
  'wei.lun@example.com',
  'priya.k@example.com',
  'ahmad.rashid@example.com',
  'natalie.wong@example.com',
  'daniel.ng@example.com',
  'sofia.binte@example.com',
  'kenneth.tan@example.com',
];

const DEMO_EMAIL = 'demo.customer@printvolution.sg';
const DEMO_PASSWORD = 'Sample1234!';
const ALL_TARGET_EMAILS = [...SAMPLE_EMAILS, DEMO_EMAIL];

const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function wipeSamples() {
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const toDelete = (list?.users ?? []).filter((u) =>
    ALL_TARGET_EMAILS.includes((u.email ?? '').toLowerCase())
  );
  for (const u of toDelete) {
    await sb.auth.admin.deleteUser(u.id);
  }
  console.log(`✓ Removed ${toDelete.length} auth user(s)`);

  const delOrders = await pg`
    delete from orders where email = any(${ALL_TARGET_EMAILS}) returning id
  `;
  console.log(`✓ Removed ${delOrders.length} order(s) (order_items cascade)`);

  const delMembers = await pg`
    delete from members where email = any(${ALL_TARGET_EMAILS}) returning email
  `;
  console.log(`✓ Removed ${delMembers.length} member(s) (points_transactions cascade)`);
}

async function seedDemo() {
  const { data: userData, error: uErr } = await sb.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: 'Demo Customer' },
  });
  if (uErr) throw new Error(`createUser: ${uErr.message}`);
  const userId = userData.user.id;
  console.log(`✓ Auth user created: ${DEMO_EMAIL} (${userId})`);

  // handle_new_user trigger auto-inserted a profile. Enrich it.
  // admin_notes is guarded by a trigger; setting it via direct postgres
  // (no auth.uid) would be reverted, so we leave it unset.
  await pg`
    update profiles set
      name = 'Demo Customer',
      phone = '+65 9123 4567',
      address_line1 = '60 Paya Lebar Road',
      address_line2 = '#07-54',
      postal_code = '409051',
      country = 'SG',
      company = 'Acme Print Co Pte Ltd',
      telegram = '@democustomer',
      line_id = 'demo_customer',
      wechat = 'DemoCustomer88',
      date_of_birth = '1990-05-20',
      marketing_opt_in = true,
      referral_source = 'Instagram'
    where id = ${userId}
  `;
  console.log('✓ Profile enriched');

  const products = await pg`
    select id, name, slug, icon from products where is_active = true order by random() limit 3
  `;
  if (products.length < 3) throw new Error('Need at least 3 active products');

  // 0014 trigger zeroes points/tier unless is_staff_or_admin(). Simulate
  // an admin JWT claim for this one insert so the trigger lets us through.
  const [admin] = await pg`select id from profiles where role = 'admin' limit 1`;
  if (!admin) throw new Error('No admin profile found — cannot bypass members trigger');
  const member = await pg.begin(async (tx) => {
    await tx`select set_config('request.jwt.claim.sub', ${admin.id}, true)`;
    const [m] = await tx`
      insert into members (email, name, phone, tier, points_balance, total_earned, joined_at)
      values (${DEMO_EMAIL}, 'Demo Customer', '+65 9123 4567', 'gold', 680, 805, now() - interval '120 days')
      returning id
    `;
    return m;
  });
  console.log(`✓ Members row (gold, 680 pts, 805 earned)`);

  const specs = [
    { daysAgo: 90, status: 'completed',  qty: 250, unit: 2500,  earned: 625 },
    { daysAgo: 35, status: 'completed',  qty: 100, unit: 1800,  earned: 180 },
    { daysAgo: 5,  status: 'processing', qty:   1, unit: 12000, earned: 0   },
  ];
  const now = Date.now();
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const prod = products[i];
    const subtotal = s.qty * s.unit;
    const createdAt = new Date(now - s.daysAgo * 86_400_000).toISOString();
    const [order] = await pg`
      insert into orders (
        customer_name, email, phone, company,
        delivery_method, delivery_address,
        subtotal_cents, delivery_cents, total_cents, points_earned,
        status, notes, created_at, updated_at
      ) values (
        'Demo Customer', ${DEMO_EMAIL}, '+65 9123 4567', 'Acme Print Co Pte Ltd',
        'delivery', '60 Paya Lebar Road #07-54, Singapore 409051',
        ${subtotal}, 500, ${subtotal + 500}, ${s.earned},
        ${s.status}, 'Sample order — seeded for review.', ${createdAt}, ${createdAt}
      )
      returning id
    `;
    await pg`
      insert into order_items (
        order_id, product_id, product_name, product_slug, icon,
        qty, unit_price_cents, line_total_cents, production_status
      ) values (
        ${order.id}, ${prod.id}, ${prod.name}, ${prod.slug}, ${prod.icon},
        ${s.qty}, ${s.unit}, ${subtotal},
        ${s.status === 'completed' ? 'completed' : 'pending'}
      )
    `;
    if (s.earned > 0) {
      await pg`
        insert into points_transactions (member_id, order_id, delta, type, note, created_at)
        values (${member.id}, ${order.id}, ${s.earned}, 'earned', 'Earned from order', ${createdAt})
      `;
    }
  }
  console.log(`✓ Seeded ${specs.length} orders + order_items + points`);

  await pg`
    insert into points_transactions (member_id, delta, type, note, created_at)
    values (${member.id}, -125, 'redeemed', 'Redeemed $1.25 off at checkout', now() - interval '30 days')
  `;
  console.log('✓ Added one redemption transaction');

  return userId;
}

try {
  console.log('— Wiping sample data —');
  await wipeSamples();
  console.log('\n— Seeding demo customer —');
  const userId = await seedDemo();
  console.log('\n✓ Done.');
  console.log(`  Login:    /login`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  User ID:  ${userId}`);
  console.log(`  Admin:    /admin/members → search "demo.customer"`);
} catch (e) {
  console.error('\n✗ Failed:', e.message);
  process.exit(1);
} finally {
  await pg.end({ timeout: 2 });
}
