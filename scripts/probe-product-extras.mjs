#!/usr/bin/env node
/**
 * Replays the exact Supabase REST query getProductBySlug runs, then
 * dumps the raw response. Lets us see whether product_extras(*) is
 * resolving via PostgREST's embed.
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const slug = process.argv[2] || 'car-decal';

const { data, error } = await sb
  .from('products')
  .select(`
    id, slug, name,
    product_extras(seo_title, seo_desc, h1, h1em, intro),
    cat:categories!products_category_id_fkey(slug, name)
  `)
  .eq('slug', slug)
  .eq('is_active', true)
  .maybeSingle();

console.log('error:', error);
console.log('keys :', data ? Object.keys(data) : null);
console.log('product_extras field type:', typeof data?.product_extras, Array.isArray(data?.product_extras) ? `array(${data.product_extras.length})` : '');
console.log('product_extras value:');
console.dir(data?.product_extras, { depth: 4 });
