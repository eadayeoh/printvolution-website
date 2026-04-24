// Seed gift pipelines + prompts per the 2026-04-25 spec:
//   Laser       → Line Art + Realistic Imagery
//   UV          → 3D Cartoon + Pass-through
//   Embroidery  → Faceless flat vector + Line Art for embroidery
//
// Models are best-guess defaults — admin can swap them at
// /admin/gifts/pipelines without code changes.

import fs from 'node:fs/promises';
import { openSql } from './_lib-merge-gift-group.mjs';

const sql = await openSql();

const PIPELINES = [
  {
    slug: 'laser-lineart',
    name: 'Laser — Line Art',
    kind: 'laser',
    provider: 'replicate',
    ai_model_slug: 'black-forest-labs/flux-canny-pro',
    default_params: { guidance_scale: 3, num_inference_steps: 28, output_format: 'png' },
    description: 'Edge-preserving line art for laser engraving. Flux Canny keeps facial features as clean strokes.',
  },
  {
    slug: 'laser-realistic',
    name: 'Laser — Realistic Imagery',
    kind: 'laser',
    provider: 'replicate',
    ai_model_slug: 'black-forest-labs/flux-dev',
    default_params: { guidance: 3.5, num_inference_steps: 28, output_format: 'png' },
    description: 'High-detail black-and-white photographic conversion. Preserves shading for laser greyscale engraving.',
  },
  {
    slug: 'uv-3d-cartoon',
    name: 'UV — 3D Cartoon',
    kind: 'uv',
    provider: 'replicate',
    ai_model_slug: 'fofr/face-to-many',
    default_params: { style: '3D', prompt_strength: 4.5, denoising_strength: 0.65 },
    description: 'Pixar-style 3D cartoon conversion. Preserves facial identity while stylising.',
  },
  {
    slug: 'uv-passthrough',
    name: 'UV — Pass-through',
    kind: 'uv',
    provider: 'passthrough',
    ai_model_slug: null,
    default_params: {},
    description: 'No stylisation — customer photo is cropped + resized to 300 DPI exactly.',
  },
  {
    slug: 'embroidery-flat-vector',
    name: 'Embroidery — Flat Vector (Faceless)',
    kind: 'embroidery',
    provider: 'replicate',
    ai_model_slug: 'black-forest-labs/flux-dev',
    default_params: { guidance: 4, num_inference_steps: 28, output_format: 'png' },
    description: 'Faceless minimalist flat-colour illustration suitable for digitising into stitch patterns.',
  },
  {
    slug: 'embroidery-lineart',
    name: 'Embroidery — Line Art',
    kind: 'embroidery',
    provider: 'replicate',
    ai_model_slug: 'black-forest-labs/flux-canny-pro',
    default_params: { guidance_scale: 3, num_inference_steps: 28, output_format: 'png' },
    description: 'Line-art output so you can digitise it into outline stitch patterns.',
  },
];

const PROMPTS = [
  {
    mode: 'laser',
    name: 'Line Art',
    pipeline_slug: 'laser-lineart',
    transformation_prompt: 'clean minimalist black line art drawing, bold confident strokes, white background, no shading, no gradients, preserving facial structure and key features',
    negative_prompt: 'colour, grey tones, shading, gradients, blurry, photographic',
    display_order: 1,
    style: 'line-art',
  },
  {
    mode: 'laser',
    name: 'Realistic Imagery',
    pipeline_slug: 'laser-realistic',
    transformation_prompt: 'high-detail black and white photograph conversion, rich tonal range from deep blacks to bright whites, preserve all facial features and textures, high contrast, suitable for laser greyscale engraving',
    negative_prompt: 'colour, cartoon, drawing, illustration, low detail',
    display_order: 2,
    style: 'realistic',
  },
  {
    mode: 'uv',
    name: '3D Cartoon',
    pipeline_slug: 'uv-3d-cartoon',
    transformation_prompt: '3D animated character style, Pixar-like rendering, soft lighting, vibrant colours, preserve facial identity, smooth textures',
    negative_prompt: 'flat, 2D, line art, realistic photograph',
    display_order: 1,
    style: '3d-cartoon',
  },
  {
    mode: 'uv',
    name: 'Pass-through',
    pipeline_slug: 'uv-passthrough',
    transformation_prompt: '',
    negative_prompt: '',
    display_order: 2,
    style: 'passthrough',
  },
  {
    mode: 'embroidery',
    name: 'Faceless Flat Vector',
    pipeline_slug: 'embroidery-flat-vector',
    transformation_prompt: 'minimalist flat vector illustration, 3 to 5 solid colours, no gradients, no facial features (faceless silhouette), clean geometric shapes, suitable for embroidery digitising',
    negative_prompt: 'face details, eyes, mouth, gradients, photographic, realistic',
    display_order: 1,
    style: 'flat-vector',
  },
  {
    mode: 'embroidery',
    name: 'Line Art',
    pipeline_slug: 'embroidery-lineart',
    transformation_prompt: 'clean continuous line art suitable for outline embroidery, bold strokes, minimal detail, no shading, white background',
    negative_prompt: 'colour fills, shading, gradients, photographic, complex detail',
    display_order: 2,
    style: 'line-art',
  },
];

try {
  console.log('→ Upserting pipelines…');
  for (const p of PIPELINES) {
    const existing = await sql`select id from gift_pipelines where slug = ${p.slug}`;
    if (existing.length > 0) {
      await sql`
        update gift_pipelines
           set name = ${p.name},
               kind = ${p.kind},
               provider = ${p.provider},
               ai_model_slug = ${p.ai_model_slug},
               default_params = ${JSON.stringify(p.default_params)}::jsonb,
               description = ${p.description},
               is_active = true,
               updated_at = now()
         where id = ${existing[0].id}
      `;
      console.log(`  ✓ updated ${p.slug}`);
    } else {
      await sql`
        insert into gift_pipelines (slug, name, kind, provider, ai_model_slug, default_params, description, is_active)
        values (${p.slug}, ${p.name}, ${p.kind}, ${p.provider}, ${p.ai_model_slug}, ${JSON.stringify(p.default_params)}::jsonb, ${p.description}, true)
      `;
      console.log(`  + inserted ${p.slug}`);
    }
  }

  console.log('\n→ Upserting prompts…');
  for (const pr of PROMPTS) {
    const [pipeline] = await sql`select id from gift_pipelines where slug = ${pr.pipeline_slug}`;
    if (!pipeline) { console.log(`  ✗ skip ${pr.name} — pipeline ${pr.pipeline_slug} missing`); continue; }
    const existing = await sql`select id from gift_prompts where mode = ${pr.mode} and name = ${pr.name}`;
    if (existing.length > 0) {
      await sql`
        update gift_prompts
           set transformation_prompt = ${pr.transformation_prompt},
               negative_prompt = ${pr.negative_prompt},
               pipeline_id = ${pipeline.id},
               style = ${pr.style},
               display_order = ${pr.display_order},
               is_active = true,
               updated_at = now()
         where id = ${existing[0].id}
      `;
      console.log(`  ✓ updated [${pr.mode}] ${pr.name}`);
    } else {
      await sql`
        insert into gift_prompts (mode, name, transformation_prompt, negative_prompt, pipeline_id, style, display_order, is_active, params)
        values (${pr.mode}, ${pr.name}, ${pr.transformation_prompt}, ${pr.negative_prompt}, ${pipeline.id}, ${pr.style}, ${pr.display_order}, true, '{}'::jsonb)
      `;
      console.log(`  + inserted [${pr.mode}] ${pr.name}`);
    }
  }

  console.log('\nFinal state:');
  const report = await sql`
    select gp.name, gp.mode, pl.slug as pipeline, pl.provider, pl.ai_model_slug
    from gift_prompts gp
    left join gift_pipelines pl on pl.id = gp.pipeline_id
    order by gp.mode, gp.display_order
  `;
  for (const r of report) console.log(`  [${r.mode}] ${r.name.padEnd(28)} → ${r.pipeline}  (${r.provider}${r.ai_model_slug ? ' · ' + r.ai_model_slug : ''})`);
} finally {
  await sql.end();
}
