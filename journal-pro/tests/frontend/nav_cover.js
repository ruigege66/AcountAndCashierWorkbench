/* 覆盖校验：所有已注册页面是否都能从侧边栏点到 */
const fs = require('fs'), vm = require('vm');
const path = require('path');
const ROOT = path.dirname(path.dirname(__dirname));       // journal-pro
function read(rel) { return require('fs').readFileSync(path.join(ROOT, rel), 'utf8'); }
function samples() { return JSON.parse(read('tests/frontend/api_samples.json')); }

function el() { return { innerHTML: '', style: {}, value: '', files: [], dataset: {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  addEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, focus() {}, click() {},
  querySelector: () => null, querySelectorAll: () => [], getAttribute: () => null, setAttribute() {} }; }
const ctx = {
  console, Math, JSON, Date, Number, String, Object, Array, Boolean, RegExp, Error, Promise,
  parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent,
  location: { hash: '', search: '' }, history: { replaceState() {} },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { getElementById: () => el(), querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, appendChild() {} }), addEventListener() {}, body: {} },
  window: { addEventListener() {}, open() {} }, navigator: { clipboard: { writeText: async () => {} } },
  alert() {}, confirm: () => true, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0,
  clearInterval() {}, requestAnimationFrame: () => 0, Chart: function () {},
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  toast() {}, chart() {}, destroyCharts() {}, table: () => ''
};
ctx.globalThis = ctx; ctx.self = ctx; vm.createContext(ctx);
for (const f of ['core.js', 'pages_base.js', 'pages_v25.js', 'pages_v26.js', 'pages_v28.js', 'actions_base.js', 'actions_v25.js', 'actions_v26.js', 'actions_v28.js', 'pages_work.js'])
  vm.runInContext(read('public/js/'+f), ctx, { filename: f });
const all = vm.runInContext('Object.keys(PAGES)', ctx);
const nav = vm.runInContext('navTreeHtml()', ctx);
const inNav = new Set([...nav.matchAll(/data-page="([^"]+)"/g)].map(m => m[1]));
const missing = all.filter(p => !inNav.has(p));
console.log('注册页面数:', all.length, '| 侧栏入口数:', inNav.size);
console.log('未出现在侧栏:', missing.join(', ') || '（无）');
