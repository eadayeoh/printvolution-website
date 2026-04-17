#!/usr/bin/env node
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data } = await sb
  .from('products')
  .select('slug, product_pricing(label, rows)')
  .eq('slug', 'car-decal')
  .maybeSingle();

console.log('product_pricing shape:', Array.isArray(data?.product_pricing) ? `ARRAY(${data.product_pricing.length})` : `OBJECT (keys: ${Object.keys(data?.product_pricing ?? {}).join(',')})`);
