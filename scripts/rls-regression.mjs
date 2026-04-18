#!/usr/bin/env node
/**
 * RLS regression check — query sensitive tables with the anon key
 * and confirm we get nothing back (or only the publicly safe subset).
 *
 * Run locally:  node scripts/rls-regression.mjs
 * In CI:        exit code 0 = all assertions passed; non-zero = fail.
 *
 * This catches the kind of "public read on members" mistake that
 * migration 0014 already fixed — future migrations that re-open a
 * table to anon will trip this check and fail the deploy.
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

let pass = 0;
let fail = 0;

async function assertEmpty(label, table, cols = '*') {
  const { data, error } = await anon.from(table).select(cols).limit(5);
  if (error && /permission denied|row-level/i.test(error.message)) {
    console.log(`  ✓ ${label}  (RLS rejected read)`);
    pass++;
    return;
  }
  if ((data ?? []).length === 0) {
    console.log(`  ✓ ${label}  (no rows returned)`);
    pass++;
    return;
  }
  console.log(`  ✗ ${label}  — anon got ${data.length} row(s) back from ${table}`);
  fail++;
}

async function assertInsertBlocked(label, table, row) {
  const { error } = await anon.from(table).insert(row).select().maybeSingle();
  if (error) {
    console.log(`  ✓ ${label}  (insert rejected: ${error.code ?? error.message?.slice(0, 40)})`);
    pass++;
    return;
  }
  console.log(`  ✗ ${label}  — anon insert into ${table} succeeded`);
  fail++;
}

async function assertPointsCannotBeRaised(label) {
  // Supply a fake member row with a huge points balance; the trigger
  // should zero the financial fields even if the insert is permitted.
  const email = `rls-test-${Date.now()}@example.invalid`;
  const { data, error } = await anon
    .from('members')
    .insert({ email, name: 'rls test', points_balance: 999999, total_earned: 999999 })
    .select('points_balance, total_earned')
    .maybeSingle();
  if (error) {
    // Insert rejected entirely — also fine.
    console.log(`  ✓ ${label}  (insert rejected: ${error.code ?? error.message?.slice(0, 40)})`);
    pass++;
    return;
  }
  if (data && data.points_balance === 0 && data.total_earned === 0) {
    console.log(`  ✓ ${label}  (trigger zeroed points)`);
    pass++;
    return;
  }
  console.log(`  ✗ ${label}  — anon set points_balance=${data?.points_balance}`);
  fail++;
}

console.log('── Read policies (anon should not see PII) ──');
await assertEmpty('orders hidden from anon', 'orders', 'id, email');
await assertEmpty('order_items hidden from anon', 'order_items');
await assertEmpty('members hidden from anon', 'members');
await assertEmpty('points_transactions hidden from anon', 'points_transactions');
await assertEmpty('admin_audit hidden from anon', 'admin_audit');
await assertEmpty('payment_events hidden from anon', 'payment_events');
await assertEmpty('profiles hidden from anon', 'profiles');

console.log('\n── Write policies (anon should not be able to escalate) ──');
await assertInsertBlocked('anon cannot write admin_audit', 'admin_audit', {
  action: 'rls.attack', target_id: 'x',
});
await assertInsertBlocked('anon cannot write payment_events', 'payment_events', {
  gateway: 'rls-test', event_type: 'charge.fake', payload_json: {}, signature_valid: true,
});
await assertInsertBlocked('anon cannot write rate_limit_attempts directly', 'rate_limit_attempts', {
  key: 'rls-test',
});
await assertInsertBlocked('anon cannot mark an order paid', 'orders', {
  order_number: 'RLSX', customer_name: 'x', email: 'x@x', phone: '0', items_total_cents: 1, total_cents: 1,
  payment_status: 'paid',
});

console.log('\n── Members trigger (anon should not be able to seed points) ──');
await assertPointsCannotBeRaised('anon insert zeroed by trigger');

console.log(`\nResult: ${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
