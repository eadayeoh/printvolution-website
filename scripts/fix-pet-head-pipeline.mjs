import fs from 'node:fs';
import postgres from 'postgres';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
for (const line of env.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq < 0) continue;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });

try {
  // Match the other active UV AI pipelines: replicate provider + google/nano-banana.
  const r = await sql`
    update gift_pipelines
    set provider = 'replicate',
        ai_model_slug = 'google/nano-banana',
        default_params = coalesce(default_params, '{}'::jsonb)
                        || '{"aspect_ratio":"match_input_image","output_format":"png"}'::jsonb
    where slug = 'pet-head'
    returning slug, provider, ai_model_slug, default_params
  `;
  console.log('Updated:', r);
} finally {
  await sql.end();
}
