#!/usr/bin/env node
/**
 * Extract data structures from legacy/assets/app.js → JSON files in /data/
 *
 * Approach: Stub out browser globals (document, window, navigator, etc.) and
 * evaluate the legacy file in a Node VM, then capture the global variables.
 *
 * Outputs:
 *   data/products.json
 *   data/product_extras.json
 *   data/configurator.json
 *   data/gift_personalisation.json
 *   data/bundles.json
 *   data/page_data.json
 *   data/related.json
 *   data/cat_chip_defaults.json
 *   data/discount_rules.json
 *   data/coupons.json
 *   data/gift_methods.json
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LEGACY_JS = path.join(ROOT, 'legacy', 'assets', 'app.js');
const OUT_DIR = path.join(ROOT, 'data');

if (!fs.existsSync(LEGACY_JS)) {
  console.error('ERROR: legacy/assets/app.js not found');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Build a sandbox that mimics the browser well enough to load app.js ─────
const noop = () => {};
const fakeEl = () => ({
  className: '', style: { cssText: '' }, innerHTML: '', textContent: '',
  setAttribute: noop, getAttribute: () => null, appendChild: noop,
  classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  addEventListener: noop, removeEventListener: noop,
  querySelector: () => null, querySelectorAll: () => fakeNodeList(),
  insertBefore: noop, removeChild: noop, replaceChild: noop,
  dataset: {}, sheet: { insertRule: noop }, files: [], value: '',
  parentNode: null, firstChild: null, nextElementSibling: null,
  cloneNode: function () { return this; }, focus: noop, click: noop,
});
const fakeNodeList = () => Object.assign([], { forEach: noop, length: 0, item: () => null });

const sandbox = {
  console,
  navigator: { onLine: false, userAgent: 'node' },
  document: {
    readyState: 'complete',
    createElement: () => fakeEl(),
    createTextNode: () => fakeEl(),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => fakeNodeList(),
    addEventListener: noop, removeEventListener: noop,
    body: fakeEl(), head: fakeEl(),
    title: '', cookie: '',
  },
  localStorage: {
    _store: {},
    getItem(k) { return this._store[k] ?? null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; },
    clear() { this._store = {}; },
  },
  sessionStorage: {
    _store: {},
    getItem(k) { return this._store[k] ?? null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; },
  },
  location: { hash: '', protocol: 'https:', href: '', hostname: 'test', search: '', pathname: '/' },
  history: { replaceState: noop, pushState: noop },
  setTimeout: (fn) => 0,            // run nothing async
  setInterval: () => 0,
  clearTimeout: noop,
  clearInterval: noop,
  requestAnimationFrame: () => 0,
  scrollTo: noop,
  alert: noop,
  confirm: () => false,
  prompt: () => null,
  matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
  getComputedStyle: () => ({}),
  fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }),
  Image: function () { this.onload = null; this.onerror = null; this.src = ''; },
  XMLHttpRequest: function () { this.open = noop; this.send = noop; this.setRequestHeader = noop; },
  MutationObserver: function () { this.observe = noop; this.disconnect = noop; },
  IntersectionObserver: function () { this.observe = noop; this.disconnect = noop; },
  ResizeObserver: function () { this.observe = noop; this.disconnect = noop; },
  FileReader: function () { this.readAsDataURL = noop; this.readAsText = noop; this.result = ''; },
  Blob: function () {}, URL: { createObjectURL: () => '', revokeObjectURL: noop },
  crypto: globalThis.crypto,
  TextEncoder: globalThis.TextEncoder, TextDecoder: globalThis.TextDecoder,
  // Some legacy code uses these:
  jsPDF: function () { return { addPage: noop, save: noop, text: noop }; },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
sandbox.addEventListener = noop;
sandbox.removeEventListener = noop;
sandbox.dispatchEvent = noop;

console.log('Loading legacy/assets/app.js into sandbox...');
const code = fs.readFileSync(LEGACY_JS, 'utf8');

const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(code, ctx, { filename: 'app.js', timeout: 10000 });
} catch (err) {
  // Many runtime errors are expected (DOM stuff). Continue if data globals are present.
  console.warn('runtime warn:', err.message);
}

// ── Extract data structures ────────────────────────────────────────────────
const get = (name) => sandbox[name];

const data = {
  products: get('PRODUCTS_DATA') || {},
  product_extras: get('PP_EXTRA') || {},
  configurator: get('CONFIGURATOR') || {},
  gift_personalisation: get('GIFT_PERSONALISATION') || {},
  bundles: get('BUNDLES') || [],
  page_data: get('PG_DATA') || {},
  related: get('RELATED') || {},
  cat_chip_defaults: get('CAT_CHIP_DEFAULTS') || {},
  discount_rules: get('DISC_RULES') || [],
  coupons: get('COUPONS') || [],
  gift_methods: get('GIFT_METHODS') || [],
  contact_methods: get('PG_CONTACT_METHODS') || [],
  gift_cats: Array.from(get('GIFT_CATS') || []),
  cat_group: get('CAT_GROUP') || {},
};

const summary = {
  products: Object.keys(data.products).length,
  product_extras: Object.keys(data.product_extras).length,
  configurator: Object.keys(data.configurator).length,
  gift_personalisation: Object.keys(data.gift_personalisation).length,
  bundles: data.bundles.length,
  page_data_keys: Object.keys(data.page_data),
  related: Object.keys(data.related).length,
  cat_chip_defaults: Object.keys(data.cat_chip_defaults).length,
  discount_rules: data.discount_rules.length,
  coupons: data.coupons.length,
  gift_methods: data.gift_methods.length,
  contact_methods: data.contact_methods.length,
  gift_cats: data.gift_cats.length,
  cat_group_keys: Object.keys(data.cat_group),
};

console.log('\nExtracted:');
for (const [k, v] of Object.entries(summary)) {
  console.log(`  ${k}: ${Array.isArray(v) ? '[' + v.join(', ') + ']' : v}`);
}

for (const [name, value] of Object.entries(data)) {
  const out = path.join(OUT_DIR, `${name}.json`);
  fs.writeFileSync(out, JSON.stringify(value, null, 2));
  console.log(`  → ${path.relative(ROOT, out)}`);
}

// Sanity check: every product should have a pricing block
const broken = [];
for (const [slug, p] of Object.entries(data.products)) {
  if (!p.pricing || !p.pricing.configs || !p.pricing.rows) {
    broken.push(slug);
  }
}
if (broken.length) {
  console.warn(`\n⚠️  ${broken.length} product(s) have incomplete pricing data:`);
  broken.forEach((s) => console.warn(`     ${s}`));
} else {
  console.log('\n✓ All products have valid pricing data');
}

console.log('\n✓ Done');
