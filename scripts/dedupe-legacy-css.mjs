#!/usr/bin/env node
// The legacy-design.css appears to contain the same content repeated ~4x.
// Detect the duplication boundary and keep only one copy.
import fs from 'node:fs';
const path = 'app/legacy-design.css';
const raw = fs.readFileSync(path, 'utf8');
// Find the first occurrence of a unique anchor phrase and check if the
// file content up to that point is repeated verbatim.
const anchor = '/* ── HOME SECTIONS ── */';
const positions = [];
let idx = 0;
while ((idx = raw.indexOf(anchor, idx)) !== -1) {
  positions.push(idx);
  idx += anchor.length;
}
console.log(`Anchor "${anchor}" found ${positions.length} times`);
if (positions.length <= 1) { console.log('No dedup needed'); process.exit(0); }

// Guess: repetition period = length / N copies
const sectionLen = Math.floor(raw.length / positions.length);
const first = raw.slice(0, sectionLen);
// Check if each subsequent section is identical
let allIdentical = true;
for (let i = 1; i < positions.length; i++) {
  const chunk = raw.slice(i * sectionLen, (i + 1) * sectionLen);
  if (chunk !== first) { allIdentical = false; break; }
}
if (!allIdentical) {
  console.log('Sections differ — not safe to dedup automatically. Keeping file as-is.');
  process.exit(0);
}
fs.writeFileSync(path, first);
console.log(`Deduplicated: ${raw.length} → ${first.length} bytes (kept 1 of ${positions.length} copies)`);
