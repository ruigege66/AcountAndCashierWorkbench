/* 检查侧栏条目是否有中文名（NAV_LABEL 缺失会直接显示英文 key） */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.dirname(path.dirname(__dirname));
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function el() { return { innerHTML: '', style: {}, value: '', files: [], dataset: {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  addEventListener() {}, appendChild() {}, remove() {}, focus() {}, click() {},
  querySelector: () => null, querySelectorAll: () => [], getAttribute: () => null, setAttribute() {} }; }
const ctx = {
  console, Math, JSON, Date, Number, String, Object, Array, Boolean, RegExp, Error, Promise,
  parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent,
  location: { hash: '', search: '' }, history: { replaceState() {} },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { getElementById: () => el(), querySelector: () => null, querySelectorAll: () => [],
    createElement: () => el(), addEventListener() {}, body: el() },
  window: { addEventListener() {}, open() {} }, navigator: { clipboard: { writeText: async () => {} } },
  alert() {}, confirm: () => true, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0,
  clearInterval() {}, requestAnimationFrame: () => 0, Chart: function () {},
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  toast() {}, chart() {}, destroyCharts() {}, table: () => ''
};
ctx.globalThis = ctx; ctx.self = ctx; vm.createContext(ctx);
for (const f of ['core.js', 'pages_base.js', 'pages_v25.js', 'pages_v26.js', 'pages_v28.js',
  'actions_base.js', 'actions_v25.js', 'actions_v26.js', 'actions_v28.js', 'pages_work.js'])
  vm.runInContext(read('public/js/' + f), ctx, { filename: f });
const nav = vm.runInContext('navTreeHtml()', ctx);
const labels = vm.runInContext('NAV_LABEL', ctx);
const ids = [...nav.matchAll(/data-page="([^"]+)"/g)].map(m => m[1]);
const raw = ids.filter(id => !labels[id]);
console.log('侧栏入口', ids.length, '| 缺中文名：', raw.join(', ') || '（无）');
