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
  console.log('=== Default UV pipeline (uv-flat-v1) — what the test falls back to ===');
  const def = await sql`
    select slug, name, provider, ai_model_slug, is_active
    from gift_pipelines where slug = 'uv-flat-v1'
  `;
  console.log(def);

  console.log('\n=== Pet Head pipeline (full) ===');
  const pipes = await sql`
    select id, slug, name, kind, provider, ai_endpoint_url, ai_model_slug,
           default_params, is_active
    from gift_pipelines
    where lower(name) like '%pet%' or lower(slug) like '%pet%'
  `;
  console.log(pipes);

  console.log('\n=== Pet Head prompt (full) ===');
  const fullPrompt = await sql`
    select id, mode, style, name, is_active, pipeline_id, transformation_prompt,
           negative_prompt, params
    from gift_prompts
    where lower(name) like '%pet%'
  `;
  console.log(fullPrompt);

  console.log('\n=== Prompts matching "pet" or pinned to a pet pipeline ===');
  const prompts = await sql`
    select p.id, p.mode, p.style, p.name, p.is_active, p.pipeline_id,
           pl.name as pipeline_name, pl.slug as pipeline_slug, pl.kind as pipeline_kind
    from gift_prompts p
    left join gift_pipelines pl on pl.id = p.pipeline_id
    where lower(p.name) like '%pet%'
       or lower(pl.name) like '%pet%'
       or lower(pl.slug) like '%pet%'
    order by p.mode, p.style
  `;
  console.log(prompts);

  console.log('\n=== UV products + their pipeline pin + prompt_ids ===');
  const uvProds = await sql`
    select gp.slug, gp.name, gp.is_active,
           gp.mode, gp.secondary_mode,
           prim.name as primary_pipeline,
           sec.name as secondary_pipeline,
           coalesce(jsonb_array_length(gp.prompt_ids), 0) as prompt_ids_count,
           gp.prompt_ids
    from gift_products gp
    left join gift_pipelines prim on prim.id = gp.pipeline_id
    left join gift_pipelines sec on sec.id = gp.secondary_pipeline_id
    where (gp.mode = 'uv' or gp.secondary_mode = 'uv')
      and gp.is_active
    order by gp.name
  `;
  console.log(uvProds);

  console.log('\n=== Other AI pipelines (replicate-provider) for reference ===');
  const aiPipes = await sql`
    select slug, name, kind, provider, ai_model_slug, default_params
    from gift_pipelines
    where provider = 'replicate' and is_active = true
    order by kind, name
  `;
  console.log(aiPipes);

  console.log('\n=== Products that USE a pet pipeline (primary or secondary) ===');
  const prods = await sql`
    select gp.id, gp.slug, gp.name, gp.is_active, gp.mode, gp.secondary_mode,
           gp.pipeline_id, prim.name as primary_pipeline_name,
           gp.secondary_pipeline_id, sec.name as secondary_pipeline_name,
           gp.prompt_ids
    from gift_products gp
    left join gift_pipelines prim on prim.id = gp.pipeline_id
    left join gift_pipelines sec on sec.id = gp.secondary_pipeline_id
    where lower(prim.name) like '%pet%'
       or lower(sec.name) like '%pet%'
       or lower(prim.slug) like '%pet%'
       or lower(sec.slug) like '%pet%'
    order by gp.name
  `;
  console.log(prods);
} finally {
  await sql.end();
}
