#!/usr/bin/env node
/**
 * Create an admin user via Supabase Auth admin API, then upgrade their
 * profile.role to 'admin'.
 *
 * Usage:
 *   node scripts/create-admin.mjs <email> <password>
 *
 * If the user already exists, this script just sets their role to admin.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password>');
  process.exit(1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Check if user already exists
  const { data: list } = await sb.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  let userId;
  if (existing) {
    console.log(`✓ User already exists: ${email} (${existing.id})`);
    userId = existing.id;
    // Also update password to what was provided
    const { error: pErr } = await sb.auth.admin.updateUserById(userId, { password });
    if (pErr) console.warn(`  password update: ${pErr.message}`);
    else console.log(`✓ Password updated`);
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: email.split('@')[0] },
    });
    if (error) { console.error('Failed to create user:', error.message); process.exit(1); }
    userId = data.user.id;
    console.log(`✓ Created user: ${email} (${userId})`);
  }

  // Upsert profile with admin role (trigger may have created it; we upgrade)
  const { error: pErr } = await sb.from('profiles').upsert({
    id: userId,
    role: 'admin',
    name: email.split('@')[0],
  });
  if (pErr) { console.error('Failed to set admin role:', pErr.message); process.exit(1); }

  console.log(`✓ Role set to 'admin' for ${email}`);
  console.log(`\nLogin at /login with:`);
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
