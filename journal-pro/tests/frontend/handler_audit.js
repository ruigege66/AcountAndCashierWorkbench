/* 前端完整性审计：按 index.html 顺序加载全部 JS，检查
   ① 有无脚本抛异常（含 "is not iterable" 之类）
   ② 所有内联事件（onclick/oninput/...）里调用的自定义函数是否真的存在于全局
   ③ go()/goPage() 的目标页面是否都在 PAGES 注册
   用法: node tests/frontend/handler_audit.js
*/
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.dirname(path.dirname(__dirname));
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function el() {
  return {
    innerHTML: '', textContent: '', value: '', files: [], dataset: {}, checked: false,
    style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, focus() {},
    click() {}, querySelector: () => el(), querySelectorAll: () => [],
    getAttribute: () => null, setAttribute() {}, closest: () => null,
  };
}

const ctx = {
  console, Math, JSON, Date, Number, String, Object, Array, Boolean, RegExp, Error,
  Promise, parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent,
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0,
  location: { hash: '', search: '' }, history: { replaceState() {} },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: {
    getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [],
    createElement: () => el(), addEventListener() {}, body: el(), head: el(),
  },
  navigator: { clipboard: { writeText: async () => {} } },
  alert() {}, confirm: () => true, prompt: () => '',
  Chart: function () {}, Blob: function () {}, URL: { createObjectURL: () => '', revokeObjectURL() {} },
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  FileReader: function () {}, FormData: function () {},
  addEventListener() {},
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);

// 按 index.html 顺序
const FILES = ['core.js', 'pages_base.js', 'pages_v25.js', 'pages_v26.js', 'pages_v28.js',
  'actions_base.js', 'actions_v25.js', 'actions_v26.js', 'actions_v28.js',
  'pages_work.js', 'app.js'];
const errors = [];
for (const f of FILES) {
  try {
    vm.runInContext(read('public/js/' + f), ctx, { filename: f });
  } catch (e) {
    errors.push(`${f}: ${e.message}`);
  }
}

// 收集所有内联事件属性里的调用标识符；排除关键字/内置/属性访问
const ATTR_RE = /on(?:click|input|change|submit|blur|focus|keyup|keydown|keypress|dblclick)\s*=\s*(["'])([\s\S]*?)\1/g;
const KEYWORDS = new Set(['if', 'for', 'while', 'return', 'typeof', 'new', 'delete', 'void',
  'switch', 'catch', 'try', 'else', 'throw', 'function', 'const', 'let', 'var',
  'event', 'this', 'true', 'false', 'null', 'undefined', 'in', 'of', 'do']);
const BUILTINS = new Set(['alert', 'confirm', 'prompt', 'parseInt', 'parseFloat', 'String',
  'Number', 'Boolean', 'JSON', 'Math', 'Object', 'Array', 'Date', 'encodeURIComponent',
  'decodeURIComponent', 'setTimeout', 'console', 'isNaN', 'open', 'print']);
const called = new Set();
const gotoTargets = new Set();
const sources = FILES.map(f => 'public/js/' + f).concat(['public/index.html']);
for (const rel of sources) {
  const s = read(rel);
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(s))) {
    const code = m[2];
    // 函数调用：前面不是 . 或字母数字，避免把 obj.method() 当成全局函数
    const callRe = /(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g;
    let c;
    while ((c = callRe.exec(code))) {
      const name = c[1];
      if (!KEYWORDS.has(name) && !BUILTINS.has(name)) called.add(name);
    }
    // go()/goPage() 的字面量目标页
    const goRe = /\b(?:go|goPage)\s*\(\s*['"]([\w]+)['"]\s*\)/g;
    let g;
    while ((g = goRe.exec(code))) gotoTargets.add(g[1]);
  }
}

// 逐个检查全局是否存在且可调用
const missing = [];
for (const name of [...called].sort()) {
  let val;
  try { val = vm.runInContext(`typeof ${name}`, ctx); } catch (e) { val = 'undefined'; }
  if (val !== 'function') missing.push(name);
}

// 各岗位视角下侧栏渲染必须成功
const navErrors = [];
for (const pos of ['all', 'business', 'manager', 'executive']) {
  vm.runInContext(`localStorage.setItem('position', ${JSON.stringify(pos)})`, ctx);
  // 上面的 localStorage 桩不持久，直接覆盖 currentPosition 的返回
  try {
    const html = vm.runInContext(
      `(function(){ const saved = currentPosition; currentPosition = () => ${JSON.stringify(pos)};
         try { const h = navTreeHtml(); return h.length; } finally { currentPosition = saved; } })()`, ctx);
    if (!html || html < 500) navErrors.push(`${pos}: 输出过短(${html})`);
  } catch (e) { navErrors.push(`${pos}: ${e.message}`); }
}

// go()/goPage() 字面量目标必须在 PAGES 注册（动态模板目标无法静态判断，忽略）
const pages = vm.runInContext('Object.keys(PAGES)', ctx);
const badTargets = [...gotoTargets].filter(p => !pages.includes(p));

// ④ 真实执行「进入工作台 / 去办理」按钮调用的函数，断言页面确实切换
//    （函数存在 ≠ 点了有反应；这里覆盖 go() 内部的 render 以避免异步干扰）
let jump = null;
try {
  ctx.history = { replaceState(n, a, u) { ctx.location.hash = u; } };
  jump = JSON.parse(vm.runInContext(`(function(){
    const orig = render; render = function(){};
    const before = S.page;
    goPage('work_1');
    const after = S.page;
    render = orig;
    return JSON.stringify({before: before, after: after, hash: location.hash});
  })()`, ctx));
} catch (e) { jump = { error: e.message }; }
const jumpOK = jump && jump.after === 'work_1' && jump.hash === '#work_1';

console.log('加载脚本数:', FILES.length);
console.log('脚本异常:', errors.length ? errors.join(' | ') : '无');
console.log('内联处理函数:', called.size, '| 缺失:', missing.length ? missing.join(', ') : '（无）');
console.log('侧栏四视角:', navErrors.length ? navErrors.join(' | ') : '全部正常');
console.log('go/goPage 字面量目标:', gotoTargets.size, '| 未注册:', badTargets.length ? badTargets.join(', ') : '（无）');
console.log('PAGES 注册页面数:', pages.length);
console.log('按钮跳转验证:', jumpOK ? '成功（S.page: ' + jump.before + ' → ' + jump.after + ', hash: ' + jump.hash + '）'
  : '失败 ' + JSON.stringify(jump));
if (errors.length || missing.length || navErrors.length || badTargets.length || !jumpOK) process.exit(1);
