#!/usr/bin/env node
// Tiny migration runner: reads .env.local for SUPABASE_DB_URL, then
// executes the SQL file passed as argv[2] against the remote database.
//
// Usage:  node scripts/run-migration.mjs supabase/migrations/0007_gifts.sql

import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const envFile = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('Missing SUPABASE_DB_URL in .env.local');
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-migration.mjs <path-to-sql-file>');
  process.exit(1);
}
const absPath = path.resolve(process.cwd(), file);
if (!fs.existsSync(absPath)) {
  console.error('File not found:', absPath);
  process.exit(1);
}

const sql = fs.readFileSync(absPath, 'utf8');

// Supabase connection pooler prefers statement timeouts and specific opts.
const pg = postgres(DB_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log(`Running: ${file}`);
  await pg.unsafe(sql);
  console.log('✓ Migration applied successfully');
} catch (err) {
  console.error('✗ Migration failed:');
  console.error(err.message ?? err);
  process.exit(1);
} finally {
  await pg.end({ timeout: 5 });
}
