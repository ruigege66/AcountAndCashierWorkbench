/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* 会计出纳全流程系统 - 前端 SPA（仅通过 REST API 与后端交互） */
const $ = id => document.getElementById(id);
const S = { meta: null, page: 'dashboard', charts: [], filters: {}, timer: null };
const money = n => (Number(n) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const actor = () => $('actor').value || '系统';
const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => today().slice(0, 7);

async function api(path, method = 'GET', body) {
  const opt = { method, headers: {} };
  if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch(path, opt);
  let data;
  try { data = await r.json(); } catch (e) { throw new Error('服务端返回异常'); }
  if (!r.ok) throw new Error(data.error || ('HTTP ' + r.status));
  // 统一联动：任何写操作只要后端返回影响链，就提示它改动了哪些下游分析
  if (method !== 'GET' && data && data.impacts) showImpacts(data.impacts);
  return data;
}
function toast(msg, ms = 2400) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), ms);
}
function openModal(title, body, submitLabel, onSubmit) {
  $('modal').innerHTML = `<h3>${title}</h3><form id="modalForm">${body}
    <div class="actions"><button type="button" class="btn btn-g" onclick="closeModal()">取消</button>
    <button type="submit" class="btn btn-p">${submitLabel}</button></div></form>`;
  $('modalMask').classList.add('show');
  $('modalForm').onsubmit = async e => { e.preventDefault(); try { await onSubmit(e.target); } catch (err) { toast('✗ ' + err.message, 3500); } };
}
function closeModal() { $('modalMask').classList.remove('show'); }
$('modalMask').addEventListener('click', e => { if (e.target === $('modalMask')) closeModal(); });
const fd = (f, n) => (f.elements[n] ? f.elements[n].value.trim() : '');
const fnum = (f, n) => parseFloat(fd(f, n)) || 0;

/* ---------- 基础选项 ---------- */
const subjOpts = (v = '') => '<option value="">—请选择—</option>' + S.meta.subjects.map(s =>
  `<option value="${s.code}" ${v === s.code ? 'selected' : ''}>${s.code} ${esc(s.name)}</option>`).join('');
const projOpts = (v = '') => '<option value="">—无—</option>' + S.meta.projects.map(p =>
  `<option value="${p.id}" ${String(v) === String(p.id) ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
const cpOpts = (v = '') => '<option value="">—无—</option>' + S.meta.counterparties.map(c =>
  `<option value="${c.id}" ${String(v) === String(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
const bankOpts = (v = '') => S.meta.bank_accounts.map(b =>
  `<option value="${b.id}" ${String(v) === String(b.id) ? 'selected' : ''}>${esc(b.name)}</option>`).join('');
const statusTag = s => `<span class="tag t-${s}">${({ draft: '草稿', submitted: '待审批', approved: '已审批', rejected: '已驳回', settled: '已结算', cleared: '已核销', posted: '已过账', void: '已作废', open: '已开放', closed: '已结账' })[s] || s}</span>`;
const DOC_LABEL = { payment: '付款申请', receipt: '收款单', advance: '备用金借款', reimbursement: '费用报销' };

function destroyCharts() { S.charts.forEach(c => { try { c.destroy(); } catch (e) {} }); S.charts = []; }

/* ---------- 界面主题（晨曦浅色 / 极光深色）与图表联动 ----------
   图表刻度、图例、网格线由 Chart.js 默认值绘制，不随 CSS 变量变化，
   因此每次建图前设置默认值、切主题时刷新已有实例，深色下才不会看不清。 */
function currentTheme() {
  try {
    const de = document.documentElement;
    return (de && de.getAttribute('data-theme')) || 'light';
  } catch (e) { return 'light'; }
}
function _chartPalette() {
  const dark = currentTheme() === 'dark';
  return { fg: dark ? '#9FB0CC' : '#5A6785',
           grid: dark ? 'rgba(255,255,255,.08)' : 'rgba(30,50,90,.08)' };
}
function applyChartTheme() {
  try {
    if (typeof Chart === 'undefined' || !Chart.defaults) return;   // 测试桩/未加载时不干扰
    const p = _chartPalette();
    Chart.defaults.color = p.fg;
    Chart.defaults.borderColor = p.grid;
    const labels = Chart.defaults.plugins && Chart.defaults.plugins.legend
      && Chart.defaults.plugins.legend.labels;
    if (labels) labels.color = p.fg;
  } catch (e) {}
}
function refreshChartColors() {
  try {
    const p = _chartPalette();
    (S.charts || []).forEach(c => {
      try {
        const o = c.options;
        if (!o) return;
        if (o.scales) Object.keys(o.scales).forEach(k => {
          const s = o.scales[k];
          if (!s) return;
          if (s.ticks) s.ticks.color = p.fg;
          if (s.grid) s.grid.color = p.grid;
          if (s.border) s.border.color = p.grid;
        });
        const labels = o.plugins && o.plugins.legend && o.plugins.legend.labels;
        if (labels) labels.color = p.fg;
        if (typeof c.update === 'function') c.update('none');
      } catch (e) {}
    });
  } catch (e) {}
}
function setTheme(t) {
  t = t === 'dark' ? 'dark' : 'light';
  try {
    if (document.documentElement) document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('jp-theme', t);
    /* 若从 ?theme= 链接进来，同步 URL 参数，刷新后不会跳回旧主题 */
    if (typeof URLSearchParams !== 'undefined' && new URLSearchParams(location.search).has('theme')) {
      const u = new URL(location.href);
      u.searchParams.set('theme', t);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  } catch (e) {}
  const b = $('themeToggle');
  if (b) {
    b.textContent = t === 'dark' ? '☀' : '☾';
    b.title = t === 'dark' ? '切换到晨曦浅色' : '切换到极光深色';
  }
  applyChartTheme();
  refreshChartColors();
}
function toggleTheme() { setTheme(currentTheme() === 'dark' ? 'light' : 'dark'); }

function chart(id, cfg) {
  if (typeof Chart === 'undefined') { const el = $(id); if (el) el.parentElement.innerHTML = '<div class="empty">图表组件需要联网加载</div>'; return; }
  applyChartTheme();
  const c = new Chart($(id), cfg); S.charts.push(c); return c;
}
function table(rows, cols, emptyText = '暂无数据') {
  if (!rows.length) return `<div class="empty">${emptyText}</div>`;
  return `<div class="scroll"><table><thead><tr>${cols.map(c => `<th class="${c.num ? 'num' : ''}">${c.t}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="${c.num ? 'num' : ''}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/* Office 导入导出快捷方法 */
function exportExcel(...tables) { window.location.href = '/api/export/workbook.xlsx?tables=' + tables.join(','); }
function exportOffice(kind) { window.location.href = '/api/export/report.' + kind; }
function template(target) { window.location.href = '/api/export/template.xlsx?target=' + target; }
const EXPORT_BTN = (label, ...tables) => `<button class="btn btn-g" onclick="exportExcel(${tables.map(t => `'${t}'`).join(',')})">⬇ ${label}</button>`;

