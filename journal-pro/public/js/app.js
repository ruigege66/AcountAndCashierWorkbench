/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* 启动：支持 #页面 深链接（便于收藏与直达，如 /#todo） */

/* 主题按钮图标与当前主题对齐（刷新后不会显示成反的） */
try {
  const _tb = document.getElementById('themeToggle');
  const _de = document.documentElement;
  const _dark = !!(_de && _de.getAttribute('data-theme') === 'dark');
  if (_tb) {
    _tb.textContent = _dark ? '☀' : '☾';
    _tb.title = _dark ? '切换到晨曦浅色' : '切换到极光深色';
  }
} catch (e) {}

/* 角色下拉与审计操作人：刷新后按本地偏好还原，不显示成默认第一项 */
try {
  const _role = localStorage.getItem('position') || 'all';
  const _sel = document.getElementById('roleSwitch');
  if (_sel) _sel.value = _role;
  const _a = document.getElementById('actor');
  if (_a) _a.value = ROLE_ACTORS[_role] || '系统';
} catch (e) {}

/* 功能原理悬浮说明（侧栏、按钮、表头、卡片标题） */
try { if (typeof initHelp === 'function') initHelp(); } catch (e) {}

/* 地址栏锚点变化 → 渲染对应页面。
   这样即使侧栏的动态渲染出问题，index.html 里的静态入口（<a href="#page">）也点得动。 */
window.addEventListener('hashchange', function () {
  const p = (location.hash || '').replace(/^#/, '');
  if (p && PAGES[p] && S.page !== p) go(p);
});

const _hashPage = (location.hash || '').replace(/^#/, '');
if (_hashPage && PAGES[_hashPage]) { go(_hashPage); }
else { render(); }

/* 侧栏自检：万一 renderNav 没跑成（脚本顺序/缓存异常），这里补一次；
   仍失败则保留静态入口，绝不留一片空白。 */
setTimeout(function () {
  try {
    const el = document.getElementById('navTree');
    if (!el) return;
    const hasBtns = el.querySelectorAll('button[data-page]').length;
    if (!hasBtns && typeof renderNav === 'function') renderNav();
  } catch (e) {}
}, 300);
