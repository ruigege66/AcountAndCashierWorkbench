/* 整站启动校验：按 index.html 顺序加载全部脚本，检查导航树与首页是否真正渲染 */
const fs = require('fs'), vm = require('vm');
const path = require('path');
const ROOT = path.dirname(path.dirname(__dirname));       // journal-pro
function read(rel) { return require('fs').readFileSync(path.join(ROOT, rel), 'utf8'); }
function samples() { return JSON.parse(read('tests/frontend/api_samples.json')); }


const REAL = JSON.parse(read('tests/frontend/api_samples.json'));
const store = {};            // id -> innerHTML
function el(id) {
  return {
    id,
    set innerHTML(v) { store[id] = String(v); },
    get innerHTML() { return store[id] || ''; },
    style: {}, value: '', textContent: '', files: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild() {}, removeChild() {}, addEventListener() {}, remove() {},
    querySelector: () => null, querySelectorAll: () => [],
    getAttribute: () => null, setAttribute() {}, focus() {}, blur() {}, click() {},
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 100 })
  };
}
const nodes = {};
function byId(id) { return (nodes[id] = nodes[id] || el(id)); }

const apiLog = [];
const ctx = {
  console,
  Math, JSON, Date, Number, String, Object, Array, Boolean, RegExp, Error, Promise,
  parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent,
  location: { hash: '', search: '', href: 'http://127.0.0.1:8765/', reload() {} },
  history: { replaceState() {}, pushState() {} },
  localStorage: { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: {
    getElementById: byId,
    querySelector: (s) => (s && s[0] === '#' ? byId(s.slice(1)) : null),
    querySelectorAll: () => [],
    createElement: () => el('tmp'),
    addEventListener() {}, body: el('body'), documentElement: el('html')
  },
  window: { open() {}, addEventListener() {}, location: { hash: '', href: 'http://127.0.0.1:8765/' }, print() {} },
  navigator: { clipboard: { writeText: async () => {} }, userAgent: 'node' },
  alert() {}, confirm: () => true, prompt: () => null,
  setTimeout: (f) => { try { typeof f === 'function' && f(); } catch (e) {} return 0; },
  clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: (f) => { try { f(0); } catch (e) {} return 0; },
  Chart: function Chart() { return { destroy() {}, update() {}, resize() {} }; },
  fetch: async (u) => {
    apiLog.push(u);
    const base = String(u).split('?')[0];
    let body = {};
    for (const k in REAL) { if (k === base || k.startsWith(base + '|')) { body = REAL[k]; break; } }
    return { ok: true, status: 200, redirected: false, headers: { get: () => 'application/json' },
             json: async () => body, text: async () => JSON.stringify(body) };
  }
};
ctx.globalThis = ctx;
ctx.self = ctx;
vm.createContext(ctx);

const files = ['core.js', 'pages_base.js', 'pages_v25.js', 'pages_v26.js', 'pages_v28.js',
  'actions_base.js', 'actions_v25.js', 'actions_v26.js', 'actions_v28.js', 'pages_work.js', 'app.js'];

let fail = 0;
for (const f of files) {
  const p = 'public/js/'+f;
  try { vm.runInContext(read(p), ctx, { filename: p }); console.log('✓ 载入', f); }
  catch (e) { console.log('✗ 载入失败', f, '→', e.message); fail++; }
}

setTimeout(() => {}, 0);
(async () => {
  await new Promise(r => setTimeout(() => r(), 50));
  await new Promise(r => { const t = Promise.resolve(); Promise.all([t]).then(() => setTimeout(r, 200)); });

  const nav = store['navTree'] || '';
  const page = store['page'] || '';
  const groups = (nav.match(/<summary/g) || []).length;
  const links = (nav.match(/data-page=/g) || []).length;
  console.log('\n── 渲染结果 ──');
  console.log('侧边栏 #navTree :', nav.length, '字符 | 分组', groups, '| 功能入口', links);
  console.log('#page           :', page.length, '字符 | 片段:', page.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90));
  console.log('API 调用次数    :', apiLog.length);
  if (nav.length < 500 || links < 40) { console.log('✗ 侧边栏未渲染出完整功能列表'); fail++; }
  if (page.length < 100 || /加载中/.test(page)) { console.log('✗ 首页未渲染'); fail++; }
  if (/undefined|NaN|\[object Object\]/.test(page)) { console.log('✗ 首页含坏标记'); fail++; }
  console.log(fail ? '\n不合格项: ' + fail : '\n全部通过');
  process.exitCode = fail ? 1 : 0;
})();
