import { openSql } from './_lib-merge-gift-group.mjs';
const sql = await openSql();
try {
  const rows = await sql`
    select section_key, data
    from page_content
    where page_key = 'home' and section_key = 'categories.tabs'
  `;
  for (const r of rows) {
    console.log(JSON.stringify(r.data, null, 2));
  }
} finally {
  await sql.end();
}
