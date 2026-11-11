/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* 会计出纳全流程系统 - 前端 SPA（仅通过 REST API 与后端交互） */
const $ = id => document.getElementById(id);
const S = { meta: null, page: 'dashboard', charts: [], filters: {}, timer: null };
const money = n => (Number(n) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const actor = () => $('actor').value || '系统';
/* 角色 → 审计日志操作人。右上角角色下拉与侧栏岗位视角共用这一份映射，
   避免手填操作人造成「申请人 = 审批人」被职责分离规则误拦。 */
const ROLE_ACTORS = { all: '出纳', business: '出纳', manager: '总账会计', executive: '财务总监' };
const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => today().slice(0, 7);


/* 静默失败可观测性：被吞掉的异常至少在控制台留一条线索。
   之前「清空演示数据只删 42/48 条」长期没被发现，就是空 catch 吞掉了错误。 */
function warn(e, tag) {
  try { console.warn('[journal-pro] ' + (tag || '操作未完成') + ':', (e && e.message) || e || ''); }
  catch (_) { return; }
}
/* ---------- 顶栏：工作角色切换（自定义下拉） ---------- */
const ROLE_META = {
  all: { name: '全部功能', desc: '查看全部 65 项功能' },
  business: { name: '出纳 / 往来会计', desc: '单据 · 日记账 · 收付款' },
  manager: { name: '总账会计 / 税务主管', desc: '凭证 · 报表 · 全税种' },
  executive: { name: '财务总监 / CFO', desc: '经营分析 · 风控 · 决策' }
};

function syncRoleUI(role) {
  const r = ROLE_META[role] || ROLE_META.all;
  try {
    const n = $('roleCurrentName'), d = $('roleCurrentDesc'), a = $('roleActorName');
    if (n) n.textContent = r.name;
    if (d) d.textContent = r.desc;
    if (a) a.textContent = ROLE_ACTORS[role] || '系统';
    const items = document.querySelectorAll ? document.querySelectorAll('.rm-item') : [];
    Array.prototype.forEach.call(items, function (it) {
      const on = it.getAttribute && it.getAttribute('data-role') === role;
      if (it.classList) it.classList.toggle('active', !!on);
    });
  } catch (e) { warn(e); }
}

function closeRoleMenu() {
  try {
    const m = $('roleMenu'), t = $('roleTrigger');
    if (m && m.classList) m.classList.remove('open');
    if (t && t.setAttribute) t.setAttribute('aria-expanded', 'false');
  } catch (e) { warn(e); }
}

function toggleRoleMenu() {
  try {
    const m = $('roleMenu'), t = $('roleTrigger');
    if (!m || !m.classList) return;
    const open = typeof m.classList.contains === 'function' && m.classList.contains('open');
    if (open) closeRoleMenu();
    else {
      m.classList.add('open');
      if (t && t.setAttribute) t.setAttribute('aria-expanded', 'true');
    }
  } catch (e) { warn(e); }
}

function pickRole(p) {
  closeRoleMenu();
  try { if (typeof applyRole === 'function') applyRole(p); } catch (e) { warn(e); }
  syncRoleUI(p);
}

function initRoleMenu() {
  try {
    document.addEventListener('click', function (e) {
      const t = e.target;
      const inside = t && t.closest ? t.closest('.role-switch') : null;
      if (!inside) closeRoleMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeRoleMenu();
    });
  } catch (e) { warn(e); }
}

/* ---------- 顶栏：数据库容量与运行情况（只读查看） ---------- */
async function openStorage() {
  try {
    closeRoleMenu();
    const d = await api('/api/system/storage');
    const fmt = n => (Number(n) || 0) >= 1024 * 1024
      ? ((Number(n) || 0) / 1024 / 1024).toFixed(2) + ' MB'
      : ((Number(n) || 0) / 1024).toFixed(1) + ' KB';
    const num = n => (Number(n) || 0).toLocaleString('zh-CN');
    const kpi = (label, value, color) => `<div class="kpi"><div class="label">${label}</div>
      <div class="value" style="font-size:19px${color ? ';color:' + color : ''}">${value}</div></div>`;
    const rows = (d.tables || []).map(x => `<tr><td>${esc(x.name)}</td>
      <td class="num">${num(x.rows)}</td><td class="muted">${esc(x.note || '')}</td></tr>`).join('');
    const line = (k, v) => `<div class="stat-line"><span>${k}</span><b>${v}</b></div>`;
    $('modal').innerHTML = `<div style="position:relative"><h3>数据库与存储</h3>
      <button type="button" class="btn btn-g btn-sm" onclick="closeModal()"
        style="position:absolute;right:0;top:-4px;padding:3px 10px" aria-label="关闭">✕ 关闭</button></div>
      <div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(145px,1fr))">
        ${kpi('账套文件大小', fmt(d.total_size))}
        ${kpi('数据表', (d.tables || []).length + ' 张')}
        ${kpi('本地备份', (d.backup_count || 0) + ' 份')}
        ${kpi('审计链', d.audit_intact ? '完整' : '异常', d.audit_intact ? 'var(--green)' : 'var(--red)')}
      </div>
      <div class="card"><h3>容量与运行情况</h3>
        ${line('主数据库', fmt(d.db_size))}
        ${line('事务日志（WAL）', fmt(d.wal_size))}
        ${line('数据结构版本', '第 ' + num(d.migration) + ' 版')}
        ${line('最近本地备份', esc(d.backup_latest || '暂无'))}
        ${line('审计日志', num(d.audit_total) + ' 条')}
      </div>
      <div class="card"><h3>各表记录数</h3><div class="scroll"><table>
        <thead><tr><th>数据表</th><th class="num">记录数</th><th>说明</th></tr></thead>
        <tbody>${rows}</tbody></table></div></div>
      <div class="banner">${esc(d.note || '')}</div>
      <div class="actions"><button type="button" class="btn btn-g" onclick="closeModal()">关闭</button></div>`;
    $('modalMask').classList.add('show');
  } catch (e) { toast('✗ ' + e.message, 3500); }
}

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

function destroyCharts() { S.charts.forEach(c => { try { c.destroy(); } catch (e) { warn(e); } }); S.charts = []; }

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
  } catch (e) { warn(e); }
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
      } catch (e) { warn(e); }
    });
  } catch (e) { warn(e); }
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
  } catch (e) { warn(e); }
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

