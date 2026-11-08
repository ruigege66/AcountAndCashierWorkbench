/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* 启动：支持 #页面 深链接（便于收藏与直达，如 /#todo） */
const _hashPage = (location.hash || '').replace(/^#/, '');
if (_hashPage && PAGES[_hashPage]) { go(_hashPage); }
else { render(); }
