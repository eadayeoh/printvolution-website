import { openSql } from './_lib-merge-gift-group.mjs';
const sql = await openSql();
try {
  console.log('=== page_content rows (grouped by page_key) ===');
  const rows = await sql`
    select page_key, section_key
    from page_content
    order by page_key, section_key
  `;
  const byPage = {};
  for (const r of rows) {
    (byPage[r.page_key] ||= []).push(r.section_key);
  }
  for (const [page, sections] of Object.entries(byPage)) {
    console.log(`  [${page}] ${sections.length} sections: ${sections.join(', ')}`);
  }
} finally {
  await sql.end();
}
