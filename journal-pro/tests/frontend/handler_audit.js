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
  const cs = new Set();
  return {
    innerHTML: '', textContent: '', value: '', files: [], dataset: {}, checked: false,
    style: {},
    classList: {
      add(c) { cs.add(c); }, remove(c) { cs.delete(c); },
      toggle(c, f) { if (f === undefined) f = !cs.has(c); f ? cs.add(c) : cs.delete(c); },
      contains(c) { return cs.has(c); },
    },
    addEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, focus() {},
    click() {}, querySelector: () => el(), querySelectorAll: () => [],
    getAttribute: () => null, setAttribute() {}, closest: () => null,
  };
}

const els = {};
const listeners = {};
const getEl = id => els[id] || (els[id] = el());
const store = {
  _d: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};

const ctx = {
  console, Math, JSON, Date, Number, String, Object, Array, Boolean, RegExp, Error,
  Promise, parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent,
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: fn => { try { fn(); } catch (e) {} return 1; },
  location: { hash: '', search: '' }, history: { replaceState() {} },
  localStorage: store,
  document: {
    getElementById: id => getEl(id), querySelector: () => el(), querySelectorAll: () => [],
    createElement: () => el(),
    addEventListener(t, fn) { (listeners[t] = listeners[t] || []).push(fn); },
    body: el(), head: el(),
    documentElement: {
      _theme: 'light',
      getAttribute(k) { return k === 'data-theme' ? this._theme : null; },
      setAttribute(k, v) { if (k === 'data-theme') this._theme = v; },
    },
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
  'pages_work.js', 'help.js', 'motion.js', 'app.js'];
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

// ⑤ 主题切换必须真的翻转 data-theme（否则按钮是摆设、深色皮肤永远看不到）
let theme = null, themeOK = false;
try {
  const before = vm.runInContext('currentTheme()', ctx);
  vm.runInContext('toggleTheme()', ctx);            // light → dark
  const after = vm.runInContext('currentTheme()', ctx);
  vm.runInContext('toggleTheme()', ctx);            // 复原，避免污染后续
  const restored = vm.runInContext('currentTheme()', ctx);
  theme = { before, after, restored };
  themeOK = before === 'light' && after === 'dark' && restored === 'light';
} catch (e) { theme = { error: e.message }; }

console.log('加载脚本数:', FILES.length);
console.log('脚本异常:', errors.length ? errors.join(' | ') : '无');
console.log('内联处理函数:', called.size, '| 缺失:', missing.length ? missing.join(', ') : '（无）');
console.log('侧栏四视角:', navErrors.length ? navErrors.join(' | ') : '全部正常');
console.log('go/goPage 字面量目标:', gotoTargets.size, '| 未注册:', badTargets.length ? badTargets.join(', ') : '（无）');
console.log('PAGES 注册页面数:', pages.length);
// ⑥ 角色下拉必须同时联动「侧栏视角 + 审计操作人 + 下拉选中值」
let role = null, roleOK = false;
try {
  role = JSON.parse(vm.runInContext(`(function(){
    const orig = render; render = function(){};
    try {
      setRole('manager');
      const a = { pos: currentPosition(), actor: actor(), sel: $('roleSwitch').value };
      setRole('all');                       // 复原，避免污染其它断言
      a.restored = currentPosition();
      return JSON.stringify(a);
    } finally { render = orig; }
  })()`, ctx));
  roleOK = role.pos === 'manager' && role.actor === '总账会计'
    && role.sel === 'manager' && role.restored === 'all';
} catch (e) { role = { error: e.message }; }

// ⑦ 功能说明体系：每个注册页面都要有说明，页面内关键词规则与三个组件齐备
let helpOK = false, helpInfo = '';
try {
  const pages = vm.runInContext('Object.keys(PAGES)', ctx);
  const helps = vm.runInContext('typeof NAV_HELP === "object" ? Object.keys(NAV_HELP) : []', ctx);
  const noHelp = pages.filter(p => !helps.includes(p));
  const rules = vm.runInContext('typeof HELP_RULES !== "undefined" ? HELP_RULES.length : 0', ctx);
  const fns = ['pageHelpHtml', 'attachHelp', 'initHelp']
    .every(f => vm.runInContext('typeof ' + f, ctx) === 'function');
  const navPages = new Set([...vm.runInContext('navTreeHtml()', ctx)
    .matchAll(/data-page="([^"]+)"/g)].map(m => m[1]));
  const noNav = pages.filter(p => !navPages.has(p));
  helpOK = !noHelp.length && !noNav.length && rules >= 30 && fns;
  helpInfo = `说明 ${helps.length}/${pages.length} · 侧栏 ${navPages.size}/${pages.length} · 规则 ${rules} 条 · 组件 ${fns ? '齐备' : '缺失'}`
    + (noHelp.length ? ' · 缺说明: ' + noHelp.join(',') : '')
    + (noNav.length ? ' · 侧栏遗漏: ' + noNav.join(',') : '');
} catch (e) { helpInfo = e.message; }

console.log('按钮跳转验证:', jumpOK ? '成功（S.page: ' + jump.before + ' → ' + jump.after + ', hash: ' + jump.hash + '）'
  : '失败 ' + JSON.stringify(jump));
console.log('主题切换验证:', themeOK ? '成功（light ↔ dark）' : '失败 ' + JSON.stringify(theme));
console.log('角色切换验证:', roleOK ? '成功（视角/操作人/下拉三者同步）' : '失败 ' + JSON.stringify(role));
// ⑧ 真实触发一次 mouseover，确认浮层确实渲染出「计算方式 / 口径」
let hoverOK = false, hoverInfo = '';
try {
  const tip = getEl('helpTip');
  const fake = {
    getAttribute: k => k === 'data-help'
      ? '衡量税负是否落在合理区间⟦应纳增值税 ÷ 利润表营业收入 × 100%' : null,
    textContent: '税负率', parentNode: null,
    getBoundingClientRect: () => ({ left: 100, top: 100, bottom: 130 }),
  };
  (listeners['mouseover'] || []).forEach(fn => fn({ target: fake }));
  hoverOK = tip.classList.contains('show')
    && tip.innerHTML.includes('计算方式') && tip.innerHTML.includes('应纳增值税')
    && parseFloat(tip.style.top) >= 0 && parseFloat(tip.style.top) < 800;  // 浮层必须落在视口内
  hoverInfo = tip.innerHTML.slice(0, 70);
} catch (e) { hoverInfo = e.message; }

console.log('功能说明体系:', helpOK ? '完整（' + helpInfo + '）' : '失败 ' + helpInfo);
// ⑨ 简洁模式：视觉装饰已回退——不建层、不跑动画、无昂贵滤镜
let motionOK = false, motionInfo = '';
try {
  const fns = ['initMotion', 'refreshMotion', 'pulseSweep', 'motionReduced']
    .every(f => vm.runInContext('typeof ' + f, ctx) === 'function');
  const src = read('public/js/motion.js');
  const css = read('public/styles.css');
  const noPointerLoop = !src.includes("addEventListener('pointermove'");
  const noLayer = !src.includes('createElement') && !src.includes('motionLayers');
  const simpleMode = css.includes('简洁模式') && css.includes('@media screen');
  const noBlur = !/backdrop-filter|filter:blur\(|background-attachment:fixed|@property --spin/.test(css);
  const noFullscreenLoops = !/auroraFlow|starDrift|orbDrift|activeBreathe|starTwinkle/.test(css);
  motionOK = fns && noPointerLoop && noLayer && simpleMode && noBlur && noFullscreenLoops;
  motionInfo = `组件 ${fns ? '齐备' : '缺失'} / 不建层 ${noLayer} / 简洁模式 ${simpleMode} / 无逐帧监听 ${noPointerLoop} / 无昂贵滤镜 ${noBlur}`;
  vm.runInContext('initMotion(); pulseSweep();', ctx);   // 调用不抛异常
} catch (e) { motionInfo = e.message; motionOK = false; }

console.log('悬浮说明弹出:', hoverOK ? '成功（含计算方式）' : '失败 ' + hoverInfo);
console.log('简洁模式:', motionOK ? '生效（' + motionInfo + '）' : '失败 ' + motionInfo);
if (errors.length || missing.length || navErrors.length || badTargets.length
    || !jumpOK || !themeOK || !roleOK || !helpOK || !hoverOK || !motionOK) process.exit(1);
