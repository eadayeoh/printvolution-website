#!/usr/bin/env node
// Generic migration runner.
//
// Usage:
//   node scripts/apply-migration.mjs 0064
//   node scripts/apply-migration.mjs 0001b
//   node scripts/apply-migration.mjs 0064_gift_product_prompt_ids
//   node scripts/apply-migration.mjs 0064 0065 0066    # batch
//
// The arg is matched against filenames in supabase/migrations/ — either the
// numeric prefix alone (e.g. "0064"), or the full slug. Exits non-zero on any
// failure, so it's safe to chain in CI.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const migrationsDir = path.join(root, 'supabase/migrations');

async function loadEnv() {
  const candidates = [
    path.join(root, '.env.local'),
    '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
  ];
  for (const file of candidates) {
    try {
      const body = await fs.readFile(file, 'utf8');
      for (const raw of body.split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq < 0) continue;
        const k = line.slice(0, eq).trim();
        const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
      return file;
    } catch {
      // try next candidate
    }
  }
  throw new Error('No .env.local found in repo root or PrintVolution-Tools root');
}

async function resolveMigration(arg) {
  const entries = await fs.readdir(migrationsDir);
  const sql = entries.filter((e) => e.endsWith('.sql')).sort();
  // Exact filename match (with or without .sql)
  const exact = sql.find((e) => e === arg || e === `${arg}.sql`);
  if (exact) return exact;
  // Prefix match — e.g. "0064" matches "0064_gift_product_prompt_ids.sql"
  const prefixed = sql.filter((e) => e.startsWith(`${arg}_`));
  if (prefixed.length === 1) return prefixed[0];
  if (prefixed.length > 1) {
    throw new Error(`Ambiguous migration "${arg}" — matches: ${prefixed.join(', ')}`);
  }
  throw new Error(`No migration matches "${arg}" in ${migrationsDir}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/apply-migration.mjs <migration-id> [more-ids...]');
    process.exit(2);
  }
  const envFile = await loadEnv();
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error(`SUPABASE_DB_URL missing from ${envFile}`);
  }
  const targets = [];
  for (const arg of args) targets.push(await resolveMigration(arg));

  const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
  try {
    for (const file of targets) {
      const body = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      console.log(`• applying ${file}`);
      await sql.unsafe(body);
      console.log(`  ✓ done`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
