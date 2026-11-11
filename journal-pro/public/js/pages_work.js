/* V2.15 四流工作台：按调研表 11 项「工作」组织系统。
   一行 = 一项工作；四条流是同一工作的四个视图，按步骤横向对齐。 */

/* 工作台 = 「怎么干」导向：办理进度 + 步骤清单 + 每步直达功能。
   「流」类分析（数据流 / 七流 / 知识图谱）归数据分析菜单，不在工作台内。 */
/* ---------- 办理状态与交互 ---------- */
function workRunId(no) { return parseInt(localStorage.getItem('workRun_' + no) || '0', 10); }
async function workStart(no) {
  const d = await api('/api/work/run', 'POST', { no, title: '我的办理', owner: S.actor || '' });
  localStorage.setItem('workRun_' + no, String(d.id));
  toast('✓ 已开始办理，按步骤往下走');
  render();
}
async function workNext(no) {
  const rid = workRunId(no);
  if (!rid) { toast('请先点「开始办理」', 3500); return; }
  try {
    const d = await api('/api/work/step', 'POST', { run_id: rid, owner: S.actor || '' });
    toast('✓ ' + d.完成步骤 + ' 完成' + (d.下一步 ? '，下一步：' + d.下一步 : '，全部完成'));
    render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function workReset(no) {
  localStorage.removeItem('workRun_' + no);
  toast('已重新开始');
  render();
}

/* ---------- 七流节点链视图（数据分析 · 七流分析页使用） ---------- */
function sevenFlowView(seven, name) {
  if (!seven || !seven.七流 || !seven.七流[name]) return '<div class="card"><p class="muted">七流数据尚未同步，请刷新页面</p></div>';
  const f = seven.七流[name];
  return `<div class="card"><h3>${esc(name)}（共 ${f.节点数} 个环节）</h3>
    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:stretch;margin:12px 0">
      ${f.节点.map((n,i)=>`<div style="flex:1;min-width:150px;border:1px solid var(--border);border-radius:8px;padding:10px;background:var(--blue-bg)">
        <div class="muted" style="font-size:11px">第 ${i+1} 环 · ${esc(name)}</div>
        <b style="font-size:12.5px;line-height:1.5">${esc(n.name)}</b>
        <div class="muted" style="font-size:11px;margin-top:6px">对应：${esc(n.system_entry||'—')}</div>
        <button class="btn btn-g btn-sm" style="margin-top:8px" onclick="goPage('${esc(n.system_page||'search')}')">去系统里看 →</button>
      </div>${i<f.节点.length-1?'<div style="display:flex;align-items:center;color:var(--primary);font-size:18px">→</div>':''}`).join('')}
    </div>
    <p class="muted" style="line-height:1.9">${esc(f.原文||'')}</p></div>`;
}

/* ---------- 演示数据 ---------- */
async function demoSeed() {
  try { const d = await api('/api/work/demo/seed', 'POST', {}); toast('✓ 已载入 ' + d.载入记录 + ' 条演示数据'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}
async function demoClear() {
  if (!confirm('确认清空所有演示数据？（不会删除你自己录入的数据）')) return;
  try { const d = await api('/api/work/demo/clear', 'POST', {}); toast('✓ 已清空 ' + d.删除演示记录 + ' 条'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}

async function workPage(no) {
  const d = await api('/api/work/detail?no=' + no);
  const w = d;
  try {
    const rs = (await api('/api/work/runs')).items || [];
    const run = rs.find(x => x.domain_no === no && x.status === '进行中');
    if (run) { localStorage.setItem('workRun_' + no, String(run.id)); localStorage.setItem('workStage_' + no, String(run.stage)); }
    else localStorage.removeItem('workRun_' + no);
  } catch (e) { /* 不影响页面 */ }
  const steps = w.工作流.步骤 || [];
  const rid = workRunId(no);
  const stage = parseInt(localStorage.getItem('workStage_' + no) || '0', 10);
  const cur = rid ? stage : -1;
  return `<div class="page-head"><div><h2>${esc(w.work.short_name)} · ${esc(w.work.subject)}</h2>
    <div class="hint">${esc(w.work.exam_type)} ｜ 这项工作怎么干：按步骤办，每步直达系统功能</div></div>
    <button class="btn btn-g" onclick="goPage('dashboard')">← 我的工作</button></div>
    <div class="banner"><b>这项工作的价值：</b>${esc(w.价值流.主张)}</div>
    <div class="card"><h3>办理进度</h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${rid ? `<span class="tag t-posted">正在办理（第 ${Math.min(stage + 1, steps.length)} 步 / 共 ${steps.length} 步）</span>
          <button class="btn btn-p btn-sm" onclick="workNext(${no})">✓ 完成这一步，进入下一步</button>
          <button class="btn btn-g btn-sm" onclick="workReset(${no})">重新开始</button>`
        : `<button class="btn btn-p btn-sm" onclick="workStart(${no})">开始按步骤办理</button>`}
      </div></div>
    <div class="card"><h3>流程步骤</h3>
    ${steps.map((s, i) => `<div style="border-left:3px solid ${i === cur ? 'var(--primary)' : 'var(--border)'};
        padding:10px 12px;margin-bottom:8px;background:${i === cur ? 'var(--blue-bg)' : 'transparent'};border-radius:0 6px 6px 0">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
        <b>第 ${i + 1} 步 · ${esc(s.name)}</b>
        <span class="tag ${s.关联覆盖 === '已支撑' ? 't-posted' : s.关联覆盖 === '部分支撑' ? '' : 't-rejected'}">${esc(s.关联覆盖)}</span>
      </div>
      <div class="muted" style="margin-top:6px;line-height:1.8">
        ${s.步骤动作 ? `要做动作：${esc(s.步骤动作)}<br>` : ''}
        ${s.数据流产物 && s.数据流产物 !== '—' ? `产生数据：${esc(s.数据流产物)}（${esc(s.数据对象)}）<br>` : ''}
        办理入口：${esc(s.系统功能 || '按右侧按钮搜索功能')}
      </div>
      <button class="btn btn-g btn-sm" style="margin-top:8px" onclick="goPage('${esc(s.system_page || 'search')}')">去办理 →</button>
    </div>`).join('')}
    <p class="muted">${esc(w.工作流.说明 || '')}</p></div>
    <div class="card"><h3>本工作的关键动作（执行流）</h3>
      <div class="muted" style="margin-bottom:8px">调研表里这项工作的落点动作，点一下直接进对应功能：</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${(w.执行流.动作 || []).map(a =>
        `<button class="btn btn-g btn-sm" onclick="goPage('${esc(a.system_page || 'search')}')">${esc(a.name)}</button>`).join('')}</div></div>
    <div class="card"><h3>与这项工作联动的数据分析</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-g btn-sm" onclick="goPage('graph_map')">🕸 知识图谱（节点关系）</button>
        <button class="btn btn-g btn-sm" onclick="goPage('seven_center')">🌊 七流分析</button>
        <button class="btn btn-g btn-sm" onclick="goPage('competency_center')">🧭 能力图谱与缺口</button>
        <button class="btn btn-g btn-sm" onclick="goPage('analysis')">📈 经营分析报告</button>
      </div>
      <p class="muted" style="margin-top:8px">这项工作背后的数据关系已录入知识图谱：节点挨着节点，可逐个点开看相邻关系。</p></div>
    <div class="card" style="margin-top:12px"><h3>这项工作的知识范围（调研表子科目）</h3>
      <div class="muted" style="white-space:pre-wrap;line-height:1.9">${esc(w.子科目)}</div></div>`;
}

/* 数据分析 · 知识图谱（图数据库式节点图，节点挨着节点，可逐点探索） */
async function graphMapPage() {
  const no = parseInt(S.filters.graphNo || '1', 10);
  const d = await api('/api/work/graph?no=' + no);
  const works = (await api('/api/work/works')).items;
  return graphMapHtml(d, works, no, S.filters.graphSel || '');
}

function graphNodeDetail(d, nodeId) {
  const n = (d.nodes || []).find(x => x.id === nodeId);
  if (!n) return '<div class="empty">点左侧任一节点查看详情</div>';
  const near = (d.edges || []).filter(e => e.from === nodeId || e.to === nodeId)
    .map(e => {
      const other = e.from === nodeId ? e.to : e.from;
      const on = (d.nodes || []).find(x => x.id === other);
      return `<div class="muted">↔ ${esc(on ? on.label : other)}（${esc(e.label)}）</div>`;
    }).join('');
  return `<h3 style="margin-top:0">${esc(n.label)}</h3>
    <div class="muted" style="margin-bottom:8px">类型：${esc(n.type)}${n.page ? ' ｜ 页面：' + esc(n.page) : ''}</div>
    ${n.考试类型 ? '<div class="muted">考试类型：' + esc(n.考试类型) + '</div>' : ''}
    ${n.价值主张 ? '<p style="line-height:1.8">' + esc(n.价值主张) + '</p>' : ''}
    ${n.支撑 ? '<div class="tag">' + esc(n.支撑) + '</div>' : ''}
    ${n.系统对象 ? '<div class="muted">系统对象：' + esc(n.系统对象) + '</div>' : ''}
    ${n.相关表 ? '<div class="muted">相关数据表：' + esc(n.相关表) + '</div>' : ''}
    <h3 style="font-size:13px">相邻节点（${(d.edges || []).filter(e => e.from === nodeId || e.to === nodeId).length}）</h3>${near}
    ${n.page ? `<button class="btn btn-p btn-sm" style="margin-top:10px" onclick="goPage('${esc(n.page)}')">打开对应页面 →</button>` : ''}`;
}

function graphMapHtml(d, works, no, sel) {
  const nodes = d.nodes || [], edges = d.edges || [];
  const selId = sel || '';
  const cols = [
    { key: '工作', x: 20, w: 150 },
    { key: '流程步骤', x: 240, w: 170 },
    { key: '执行动作', x: 450, w: 170 },
    { key: '数据对象', x: 660, w: 170 },
  ];
  const groups = {};
  nodes.forEach(n => { (groups[n.type] = groups[n.type] || []).push(n); });
  const rowH = 40, top = 30;
  const maxRows = Math.max(...Object.values(groups).map(a => a.length), 1);
  const H = Math.max(maxRows * rowH + 80, 320);
  const pos = {};
  for (const [t, list] of Object.entries(groups)) {
    const col = cols.find(c => c.key === t) || cols[cols.length - 1];
    list.forEach((n, i) => { pos[n.id] = { x: col.x, y: top + i * rowH, w: col.w }; });
  }
  const isNear = id => !selId || selId === id || (edges || []).some(e =>
    (e.from === selId && e.to === id) || (e.to === selId && e.from === id));
  const svg = [`<svg viewBox="0 0 900 ${H}" style="width:100%;height:auto">`];
  for (const e of edges) {
    const a = pos[e.from], b = pos[e.to];
    if (!a || !b) continue;
    const active = !selId || selId === e.from || selId === e.to;
    svg.push(`<line x1="${a.x + a.w}" y1="${a.y + 16}" x2="${b.x}" y2="${b.y + 16}" fill="none"
      stroke="${active ? '#534AB7' : '#C9D2E0'}" stroke-width="${active ? 1.6 : 1}" ${active ? '' : 'opacity=".55"'}/>`);
  }
  for (const [nid, p] of Object.entries(pos)) {
    const n = nodes.find(x => x.id === nid);
    if (!n) continue;
    const dim = selId && selId !== nid &&
      !(edges || []).some(e => (e.from === selId && e.to === nid) || (e.to === selId && e.from === nid));
    const fill = n.type === '工作' ? '#EDEDFC' : n.type === '流程步骤' ? '#E1F5EE'
      : n.type === '数据对象' ? '#FAEEDA' : n.type === '执行动作' ? '#FCEBEB' : '#F1EFE8';
    svg.push(`<g style="cursor:pointer" onclick="S.filters.graphSel='${esc(nid)}';render()">
      <rect x="${p.x}" y="${p.y}" width="${p.w}" height="32" rx="8" fill="${fill}"
        stroke="${selId === nid ? '#534AB7' : '#B4B2A9'}" stroke-width="${selId === nid ? 1.6 : 0.6}" ${dim ? 'opacity=".45"' : ''}/>
      <text x="${p.x + p.w / 2}" y="${p.y + 20}" text-anchor="middle" font-size="11"
        fill="#2C2C2A">${esc(n.label.length > 14 ? n.label.slice(0, 14) + '…' : n.label)}</text></g>`);
  }
  svg.push('</svg>');
  const detail = selId ? graphNodeDetail(d, selId) : '<div class="empty">点图中任一节点，查看它的相邻节点与详情</div>';
  return `<div class="page-head"><div><h2>知识图谱 · ${esc(d.center.short)}</h2>
    <div class="hint">${esc(d.center.subject)} ｜ ${d.统计.节点} 个节点 / ${d.统计.边} 条边；节点挨着节点，点一个看它的相邻关系</div></div></div>
    <div class="banner"><b>选工作：</b>${works.map(x =>
      `<button class="btn ${x.no === no ? 'btn-p' : 'btn-g'} btn-sm" style="margin:2px" onclick="S.filters.graphNo='${x.no}';render()">${esc(x.short_name)}</button>`).join('')}</div>
    <div class="grid2" style="grid-template-columns:2fr 1fr">
      <div class="card" style="overflow-x:auto">${svg.join('')}</div>
      <div class="card">${detail}</div></div>
    <p class="muted">图例：🟪 工作 → 🟩 流程步骤 → 🟨 数据对象（挂相关数据表）→ ⬜ 执行动作。紫色连线是当前选中节点的相邻关系。</p>`;
}

/* 数据分析 · 七流分析（每条流的节点链与系统入口） */
async function sevenCenterPage() {
  const no = parseInt(S.filters.sevenNo || '1', 10);
  const d = await api('/api/work/seven/flows?no=' + no);
  const works = (await api('/api/work/works')).items;
  return `<div class="page-head"><div><h2>七流分析 · ${esc(d.work.short)}</h2>
    <div class="hint">调研表2：同一项工作的数据流 / 资金流 / 工作流 / 执行流 / 管控流 / 价值流 / 合规流</div></div></div>
    <div class="banner"><b>选工作：</b>${works.map(x =>
      `<button class="btn ${x.no === no ? 'btn-p' : 'btn-g'} btn-sm" style="margin:2px" onclick="S.filters.sevenNo='${x.no}';render()">${esc(x.short_name)}</button>`).join('')}</div>
    ${d.流名.map(name => sevenFlowView(d, name)).join('')}`;
}

/* 首页：我的工作总览 */
async function workOverview() {
  const d = await api('/api/work/dashboard');
  const list = (await api('/api/work/works')).items;
  return `<div class="page-head"><div><h2>我的工作 · 四流总览</h2>
    <div class="hint">按调研表 11 项工作组织：选一项工作 → 看四流 → 按步骤办理</div></div></div>
    <div class="banner">共 <b>${d.工作数}</b> 项工作、<b>${d.工作流步骤}</b> 个流程步骤、<b>${d.执行动作}</b> 个执行动作；
    其中 <b>${d.已支撑步骤}</b> 步已有系统功能，<b>${d.断链步骤}</b> 步待补。${esc(d.提示)}</div>
    <div class="card"><h3>演示数据（操作演示用）</h3>
      <div class="muted" style="margin-bottom:10px">一键给各功能页填入示例单据、凭证、合同、审计底稿、税务与工作流实例；演示完可一键清空，不影响你自己录入的数据。</div>
      <button class="btn btn-p btn-sm" onclick="demoSeed()">载入演示数据</button>
      <button class="btn btn-g btn-sm" onclick="demoClear()">清空演示数据</button>
      <button class="btn btn-g btn-sm" onclick="goPage('role_center')">看岗位与能力进阶 →</button></div>
    <div class="grid2">${list.map(x => `<div class="card">
      <h3>${esc(x.short_name)}</h3>
      <div class="muted" style="margin-bottom:8px">${esc(x.subject)} · ${esc(x.exam_type)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <span class="tag">${x.步骤数} 个步骤</span><span class="tag">${x.动作数} 个动作</span>
        <span class="tag t-posted">${x.已支撑步骤} 步已支撑</span>
        ${x.进行中 ? `<span class="tag t-posted">${x.进行中} 项在办</span>` : ''}</div>
      <button class="btn btn-p btn-sm" onclick="goPage('work_${x.no}')">进入工作台 →</button></div>`).join('')}</div>`;
}

/* 注册 11 个工作台页 + 替换首页为工作总览（保留原 KPI 在下方） */
/* 数据分析 · 岗位与能力进阶（调研表3：谁、按什么级别跑） */
async function rolePage() {
  const d = await api('/api/work/seven/roles');
  const list = await Promise.all(d.items.map(x => api('/api/work/seven/role?no=' + x.no)));
  return `<div class="page-head"><div><h2>岗位与能力进阶</h2>
    <div class="hint">调研表3：5 类岗位 × 七流核心动作 × 初级 / 中级 / 高阶能力梯度</div></div></div>
    <div class="banner">选一个岗位，看它每天要跑哪七条流、每一步做什么，以及从初级到高阶要补哪些能力。</div>
    ${list.map((x)=>`<div class="card"><h3>${esc(x.岗位.name)}</h3>
      <div class="muted" style="margin-bottom:8px">典型细分岗位：${esc(x.岗位.posts)}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${d.流名.map(f=>`<span class="tag">${esc(f)} ${(x.七流[f]||[]).length} 项</span>`).join('')}</div>
      <div class="muted" style="line-height:1.9;white-space:pre-wrap">${esc(x.岗位.knowledge)}</div>
      <h3 style="margin-top:12px">能力进阶梯度</h3>
      ${x.能力进阶.map(l=>`<div style="border-left:3px solid var(--primary);padding:8px 10px;margin-bottom:6px;background:var(--blue-bg);border-radius:0 6px 6px 0">
        <b>${esc(l.级别)}</b><div class="muted" style="font-size:12px">${esc(l.要求)}</div></div>`).join('')}
      <div style="margin-top:10px">${(x.关联工作||[]).map(w=>`<button class="btn btn-g btn-sm" style="margin:2px" onclick="goPage('work_${w.编号}')">相关工作台：${esc(w.简称)} →</button>`).join('')}</div>
    </div>`).join('')}</div>`;
}


/* ==================== 岗位分层导航（表3 能力进阶 → 系统分层） ====================
   业务操作优先：普通财务只见日常操作；分析/监管/战略随岗位层级逐级出现。 */
const NAV_LEVELS = {
  business: { name: '初级 · 业务操作（出纳 / 往来会计）', groups: [
    { title: '今日必办', pages: ['dashboard', 'todo'] },
    { title: '单据与凭证', pages: ['docs', 'vouchers', 'tpl', 'print', 'vcheck'] },
    { title: '现金与银行', pages: ['journal', 'daily', 'recon', 'cashier_tools'] },
    { title: '开票与收付款', pages: ['gateway_center'] },
    { title: '基础资料', pages: ['subjects', 'base'] },
  ]},
  manager: { name: '中级 · 核算与分析（总账 / 税务 / 主管）', groups: [
    { title: '财务报表与分析', pages: ['fin', 'cfstmt', 'ratios', 'compare', 'partner', 'baddebt'] },
    { title: '税务管理', pages: ['tax_center'] },
    { title: '期末与年度', pages: ['periods', 'yearend', 'snapshots'] },
    { title: '审计与法务配合', pages: ['audit_center', 'legal_center'] },
    { title: '外部协同管理', pages: ['gateway_center', 'stmtimport', 'office'] },
  ]},
  executive: { name: '高阶 · 决策与监管（总监 / CFO）', groups: [
    { title: '经营决策', pages: ['analysis', 'graph', 'advanced_center'] },
    { title: '金融监管', pages: ['reg_center'] },
    { title: '宏观经济', pages: ['macro_center'] },
    { title: '四流与知识图谱', pages: ['competency_center', 'seven_center', 'graph_map'] },
    { title: '系统与安全', pages: ['base', 'system', 'sec_center', 'arch_audit', 'help'] },
  ]},
};
const POSITION_ROLES = [
  { id: 'all', name: '全部功能' },
  { id: 'business', name: '出纳 / 往来会计（业务操作）' },
  { id: 'manager', name: '总账会计 / 税务 / 审计（核算与分析）' },
  { id: 'executive', name: '财务总监 / CFO（决策与监管）' },
];
function currentPosition() { return localStorage.getItem('position') || 'all'; }

/* 角色统一入口：右上角下拉与侧栏「岗位视角」按钮都走这里。
   一次切换同时完成三件事：① 记住视角 ② 同步审计日志操作人
   ③ 重画侧栏与当前页。避免两处各写一套导致显示与实际不一致。 */
function applyRole(p) {
  const valid = ['all', 'business', 'manager', 'executive'];
  const role = valid.indexOf(p) >= 0 ? p : 'all';
  try { localStorage.setItem('position', role); } catch (e) { warn(e); }
  if (typeof syncRoleUI === 'function') { try { syncRoleUI(role); } catch (e2) { warn(e2); } }
  const a = $('actor'); if (a) a.value = ROLE_ACTORS[role] || '系统';
  try { renderNav(); } catch (e) { warn(e); }
  try { render(); } catch (e) { warn(e); }
}
function setPosition(p) { applyRole(p); }
function setRole(p) { applyRole(p); }

/* 侧栏永远是「全部功能」优先：任何视角下所有分组都展开，不折叠内容 */
function showAllFeatures() {
  applyRole('all');
  try { toast('已显示全部 65 项功能'); } catch (e) { warn(e); }
}

function navTreeHtml() {
  const pos = currentPosition() || 'all';
  // 全部功能模式：8 个大功能 → 全部小功能；岗位模式：只显示该档
  // 按会计工作流顺序重排：今日要办 → 单据入账 → 资金期末 → 报表分析 → 税务
  // → 数据图谱 → 专业域 → 外部协同 → 系统。每项都保留，只调整归类与顺序。
  // 三元组 = [分组名, 这一组解决什么, 页面 id 列表]
  const GROUPS_ALL = [
    ['工作台 · 按业务办', '从「今天要办什么」进入，11 项工作按步骤引导办理',
      ['dashboard','work_overview','todo','search','work_1','work_2','work_3','work_4','work_5','work_6','work_7','work_8','work_9','work_10','work_11']],
    ['单据 · 凭证 · 账簿', '业务单据 → 凭证 → 日记账 → 账簿，含模板、打印与合规体检',
      ['docs','invoices','vouchers','journal','books','subjects','tpl','print','vcheck','acct_tools','cashier_tools']],
    ['资金 · 往来 · 期末', '日结核对、银行对账、期末与年度结转、资产与往来管理',
      ['daily','recon','periods','yearend','snapshots','assets','baddebt','collection','partner']],
    ['报表与经营分析', '三大报表、现金流量表、比率、同比环比与经营分析报告',
      ['fin','cfstmt','reports','ratios','compare','analysis']],
    ['税务管理', '全税种台账、认证抵扣、申报、税负率、个税与汇算清缴',
      ['tax_center']],
    ['数据分析与图谱', '功能联动、知识图谱、七流、能力进阶、高阶模型与规则配置',
      ['graph','graph_map','seven_center','competency_center','role_center','advanced_center','rules','macro_center']],
    ['法务 · 审计 · 监管', '合同法务、内部审计、金融监管会计三个专业域',
      ['legal_center','audit_center','reg_center']],
    ['外部协同', '开票 / 网银文件桥梁、对账单导入与整站导入导出',
      ['gateway_center','stmtimport','office']],
    ['系统与安全', '基础资料、参数、内控、预警、审计链、监控与帮助',
      ['base','system','compliance','risk','audit','monitor','sec_center','arch_audit','help']],
  ];
  const lv = NAV_LEVELS[pos];
  // 统一成 [标题, 页面数组, 分组说明]：GROUPS_ALL 是三元组、
  // NAV_LEVELS.*.groups 是 {title,pages} 对象数组。以前直接按二元组解构
  // 对象数组会抛 "is not iterable"，导致整个侧栏渲染失败。
  const raw = pos === 'all' ? GROUPS_ALL : (lv && Array.isArray(lv.groups) ? lv.groups : GROUPS_ALL);
  const groups = raw.map(g => Array.isArray(g)
    ? [g[0] || '', Array.isArray(g[2]) ? g[2] : [], g[1] || '']
    : [g.title || '', Array.isArray(g.pages) ? g.pages : [], g.desc || '']);
  const rolesHtml = POSITION_ROLES.map(r =>
    `<button data-position="${r.id}" style="display:block;width:100%;text-align:left;${pos === r.id ? 'color:var(--primary);font-weight:500' : 'color:var(--text2)'}" onclick="setPosition('${r.id}')">${r.id === pos ? '● ' : '○ '}${esc(r.name)}</button>`).join('');
  let out = `<div data-navver="V218"></div><details style="border-bottom:1px solid rgba(255,255,255,.08)"><summary style="cursor:pointer;padding:8px 12px;font-size:12px">👤 岗位视角 · ${esc((POSITION_ROLES.find(r=>r.id===pos)||{}).name||'全部功能')}</summary><div style="padding:4px 8px">${rolesHtml}</div></details>`;
  if (pos !== 'all') {
    out += `<div style="padding:8px 12px;font-size:11.5px;line-height:1.6;color:#F3C969;background:rgba(255,255,255,.05)">
      ⚠ 当前是「岗位视角」，只列本档功能。要看到全部 65 项请点顶部「☰ 全部功能」。</div>`;
  }
  out += `<div class="nav-hint">💡 悬浮任意功能，看用途与算法</div>`;
  // 分组一律展开：用户要的是能一眼看到所有功能，不需要再点一次
  groups.forEach(([title, pages, desc], gi) => {
    const btns = pages.map(p => `<button data-page="${p}" data-help="${esc(NAV_HELP[p] || NAV_LABEL[p] || p)}"
      style="display:block;width:100%;text-align:left">${esc(NAV_LABEL[p] || p)}</button>`).join('');
    out += `<details open style="border-bottom:1px solid rgba(255,255,255,.08)"><summary
      data-help="${esc(desc || title)}" style="cursor:pointer;padding:9px 12px;font-size:12.5px;font-weight:500">
      <span class="ng-idx">${gi + 1}</span>${esc(title)}<span class="ng-count">${pages.length}</span></summary>
      <div>${btns}</div></details>`;
  });
  return out;
}
const NAV_LABEL = {
  dashboard: '今日工作台', docs: '业务单据', invoices: '发票管理', assets: '固定资产', vouchers: '凭证管理',
  journal: '现金银行日记账', books: '账簿与分析', compliance: '内控合规', office: '导入导出中心',
  monitor: '监控大屏', risk: '风险预警', audit: '审计中心（哈希链）', help: '帮助中心', partner: '往来账',
  fin: '财务报表', todo: '我的待办中心', search: '全局搜索', tpl: '常用凭证模板', print: '凭证打印',
  vcheck: '凭证合规体检', cfstmt: '现金流量表（正表）', ratios: '财务比率分析', compare: '同比环比分析',
  baddebt: '坏账准备计提', collection: '往来催收清单', snapshots: '报表快照归档', yearend: '年度结转',
  stmtimport: '对账单批量导入', subjects: '会计科目模板', analysis: '在线经营分析报告', rules: '分析规则配置',
  graph: '功能联动关系', base: '基础资料', system: '系统管理', role_center: '岗位与能力进阶',
  advanced_center: '高阶核算与模型', tax_center: '税务中心', gateway_center: '开票 / 网银协同',
  legal_center: '法务管理', audit_center: '内部审计', reg_center: '金融监管会计',
  macro_center: '宏观经济会计', arch_audit: '架构审计中心', sec_center: '安全中心',
  graph_map: '知识图谱', seven_center: '七流分析',
  reports: '报表中心', acct_tools: '会计工具箱', cashier_tools: '出纳工作台', work_overview: '11 项工作总览',
  daily: '日结核对', recon: '银行对账', periods: '期末结账', snapshots: '报表快照归档',
  competency_center: '四流与能力图谱',
  work_1: '账务核算', work_2: '财务与预算', work_3: '合同法务（中级）', work_4: '集团与战略财务',
  work_5: '准则核算', work_6: '审计鉴证', work_7: '成本与估值', work_8: '商事合规',
  work_9: '全税种管理', work_10: '战略与风控', work_11: '重大项目综合',
};

/* 功能说明：悬浮侧栏入口 / 页面按钮时显示。
   用 ⟦ 分段：① 用途与代表意义 ② 计算方式 / 取数口径 ③ 使用提示（可选）。
   每个页面一条，新增页面务必同步补这里（handler_audit 会校验覆盖率）。 */
const HELP_SEP = '⟦';
const NAV_HELP = {
  dashboard: '从「今天要办什么」进入系统，汇总待办、四流断链、管控检查点与能力完整度⟦卡片数字来自待办中心 / 断链清单 / 管控检查点等实时接口，随业务操作自动刷新',
  work_overview: '11 项会计工作总览，按调研表的工作流步骤组织⟦每项点「进入工作台」可看办理步骤、要做动作、产生数据与直达办理入口',
  work_1: '账务核算：从业务单据收集到财务报表编制的完整链路⟦工作流步骤 → 数据流产物 → 执行动作三层对齐；只有已过账凭证才进入报表',
  work_2: '财务与预算：预算编制、执行监控、差异分析与投融资测算⟦差异分析 = 实际发生额 − 预算额；投资净现值 NPV = Σ CFt ÷ (1+r)^t − 初始投资',
  work_3: '合同法务（中级）：合同合规审核、主体设立变更、税务申报与纠纷维权⟦里程碑付款累计不得超过合同金额，超额会被拦截',
  work_4: '集团与战略财务：战略拆解、全面预算、并购尽调估值与内控体系⟦并购估值常用 DCF / 可比公司倍数；重大项目需先立项再尽调',
  work_5: '准则核算：复杂业务会计判断、合并报表与附注披露⟦合并抵消调整后，集团口径资产 / 收入需抵消内部交易，避免重复计算',
  work_6: '审计鉴证：业务承接、风险评估、控制测试、实质性程序到出具报告⟦大额凭证 100% 抽查，中低额分层随机抽样；函证差异需查明原因',
  work_7: '成本与估值：财务预测、投融资量化评估、成本核算与经营决策模拟⟦短期经营决策用差量分析：差量收入 − 差量成本 > 0 才可行',
  work_8: '商事合规：公司治理、证券发行披露、合同审核、破产清算与票据⟦破产债权按法定清偿顺序分配，票据权利需在有效期内行使',
  work_9: '全税种管理：涉税核算、税额计算、申报缴纳、稽查应对与筹划⟦应纳税额 = 销项税额 − 已认证进项税额；税负率 = 应纳增值税 ÷ 会计收入 × 100%',
  work_10: '战略与风控：内外部环境分析、战略落地、风险识别评估与应对⟦风险值常用「发生概率 × 影响程度」分级，重大风险需制定应对方案',
  work_11: '重大项目综合：复杂业务立项、多维度尽调、跨专业方案与风险把控⟦跨模块联动：合同 / 税务 / 审计 / 估值结果共同进入综合判断',
  docs: '业务单据：付款申请、收款单、备用金借款、费用报销的录入与审批流⟦结算时自动生成并过账凭证，同时登记出纳日记账⟦草稿 → 提交 → 审批 → 结算，驳回与作废不产生下游数据',
  invoices: '发票登记与状态管理（已入账 / 已核销 / 已作废）⟦销项发票是增值税销项税额、账龄分析与催收清单的数据源',
  vouchers: '凭证录入、审核、过账、作废与红字冲销⟦借方合计必须等于贷方合计；只有「已过账」凭证才进入科目余额与三大报表',
  journal: '现金 / 银行日记账，逐笔记录资金收付⟦由凭证过账自动生成，余额按账户逐笔重算；已登记流水不可删改，更正需红字冲销',
  books: '总账、明细账与科目余额查询⟦科目余额 = 最近一次期初余额 + 全部已过账分录的借贷净额',
  subjects: '会计科目表与模板套用⟦新增科目会由报表通用兜底自动归集，不会漏项导致报表不平',
  tpl: '常用凭证模板，一键套用生成凭证⟦模板只保存分录结构，金额与日期在套用时填写',
  print: '凭证打印与批量输出⟦按凭证号 / 期间筛选，输出保持借贷合计一致',
  vcheck: '凭证合规体检⟦检查借贷平衡、科目有效性、附件与审批状态，问题凭证列出中文原因',
  acct_tools: '会计工具箱：批量过账、待摊摊销、辅助核算维度与编号规则⟦批量过账会联动科目余额表、利润表、现金流量表与全部比率',
  cashier_tools: '出纳工作台：现金盘点、票据登记⟦盘点差额进入日结核对并触发预警；票据到期日进入未来资金预测',
  daily: '日结核对：账实核对与差异记录⟦账实差额 = 实盘金额 − 账面余额，不为 0 会触发风险预警',
  recon: '银行对账：对账单流水与日记账自动匹配⟦按日期 + 金额 + 方向匹配，未匹配流水进入待办并可能触发超期预警',
  periods: '期末结账与反结账⟦结账前跑检查清单（未过账凭证、未核对流水等）；结账期间禁止新增或修改⟦结账后如确需补录，先「反结账」',
  yearend: '年度结转：本年利润 4103 → 利润分配 4104⟦结转凭证标记 is_closing，不参与利润表；留存收益总额不变',
  snapshots: '报表快照归档：把当期三大报表存成历史版本⟦用于跨期对比与审计留痕，归档后不受后续凭证影响',
  assets: '固定资产台账、购置入账与折旧计提⟦月折旧 = 原值 × (1 − 残值率) ÷ 使用月数；计入当期费用并增加累计折旧',
  baddebt: '按账龄比例计提坏账准备⟦应计提额 = Σ(各账龄段应收余额 × 对应计提率)，与 1231 已计提额比较取差额⟦足额后重复计提会被拦截，不会重复入账',
  collection: '往来催收清单：按账龄列出逾期待收款⟦账龄 = 基准日 − 发票到期日；基准日可在分析规则中配置',
  partner: '往来账：按往来单位汇总应收应付与核销状态⟦余额 = 该单位全部发票金额 − 已核销金额',
  fin: '三大财务报表：资产负债表、利润表、现金流量表⟦资产 = 负债 + 所有者权益；不平通常因期初未录、科目分类缺失或存在未过账凭证',
  cfstmt: '现金流量表正表⟦按对方科目将日记账流水归入经营 / 投资 / 筹资；累计净额应等于货币资金变动',
  reports: '报表中心：月度收入、支出、净流入趋势与科目发生额⟦净流入 = 当期收入 − 当期支出',
  ratios: '10 项财务比率与健康评分⟦流动比率 = 流动资产 ÷ 流动负债；销售净利率 = 净利润 ÷ 营业收入 × 100%；资产负债率 = 负债合计 ÷ 资产合计 × 100%⟦分母为 0 时该比率显示「不适用」',
  compare: '同比环比与 12 个月趋势⟦增长率 = (本期 − 基期) ÷ |基期| × 100%，基期为 0 时不计算增长率',
  analysis: '在线经营分析报告，可打印 PDF 或导出 HTML⟦含 KPI、四大能力、瀑布图、趋势、比率、账龄、现金流与 6 个月预测；预测用线性回归 + 3 个月移动平均混合',
  tax_center: '全税种管理：销项 / 进项台账、认证、增值税申报、附加税、税负率、企业所得税、个税、印花税等⟦应纳税额 = 销项税额 − 已认证进项税额；附加税 = 应纳税额 × 12%；税负率 = 应纳增值税 ÷ 利润表营业收入 × 100%⟦税负率控制区间默认 2.00%–3.50%，所有比率保留两位小数',
  graph: '功能联动关系图：写操作会影响哪些下游分析⟦基于 ImpactGraph 的节点与边，边上的说明解释「为什么会受影响」',
  graph_map: '知识图谱：工作 → 流程步骤 → 数据对象 → 执行动作⟦点任一节点看相邻关系与挂载的数据表，节点挨着节点像图数据库',
  seven_center: '七流分析：数据流、价值流、工作流、执行流、资金流、管控流、合规流⟦含管控检查点与合规法规清单，按角色匹配查看',
  competency_center: '四流与能力图谱：需求覆盖度、缺口与追溯⟦完整度 = 已支撑项 ÷ 全部需求项 × 100%',
  role_center: '岗位与能力进阶：岗位家族 × 七流 × 职业层级⟦用于看某岗位该掌握哪些工作，不做功能裁剪',
  advanced_center: '高阶核算与模型：存货计价、权益法、递延税、租赁现值、收入五步法，以及 NPV / IRR / WACC / 杜邦 / EVA / BS⟦NPV = Σ CFt ÷ (1+r)^t − 初始投资；WACC = 股权成本 × 股权权重 + 债务成本 × (1−税率) × 债务权重',
  rules: '分析规则配置：现金流分类前缀、比率阈值、账龄基准日⟦规则热更新，改完立即影响所有下游分析，无需重启',
  macro_center: '宏观经济会计：指标、通胀调整、行业对标、压力测试与汇率重估⟦通胀调整按不变价口径重述，汇率重估按期末汇率折算外币余额',
  legal_center: '合同法务：合同台账、付款里程碑、法律审核、纠纷案件、用印与合规义务⟦预计负债 = 索赔金额 × 胜诉概率；里程碑付款累计不得超过合同金额',
  audit_center: '内部审计：年度计划、底稿、分层抽样、发现与整改、函证与调整分录⟦大额 100% 抽查，中低额随机抽样；调整分录必须借贷平衡',
  reg_center: '金融监管会计：监管报表、反洗钱筛查、关联交易、ECL 与监管指标⟦ECL 按三阶段模型：阶段一 12 个月预期损失，阶段二 / 三 整个存续期预期损失',
  gateway_center: '开票 / 网银协同：用文件桥梁批量导出开票任务与付款模板、回传结果⟦只做批量文件导入导出，不模拟登录税务或网银，也不存储任何密码⟦标准流程：导出模板 → 在官方系统操作 → 回传结果并自动查重',
  stmtimport: '对账单批量导入：字段映射 + 自动查重⟦重复流水按「日期 + 金额 + 方向 + 摘要」判重，导入后到银行对账里匹配',
  office: '导入导出中心：Excel / CSV 与整站迁移包⟦迁移包含程序、迁移脚本、测试、文档与数据库快照，可在另一台机器直接启动',
  todo: '我的待办中心：待审批单据、未过账凭证、未匹配流水、未核对日记账、未入账发票等⟦每项数量实时统计，办完自动消项',
  search: '全局搜索：按功能名或业务关键词直达对应页面⟦输入「开票」「盘点」「审计」等即可，结果点一下跳转',
  base: '基础资料：科目、项目、往来单位、银行账户与期初建账⟦期初必须借贷平衡，否则会直接破坏「资产 = 负债 + 权益」',
  system: '系统管理：参数配置、备份恢复、演示数据与运行时健康⟦演示数据带 [演示] 标记，一键清空且不影响自己录入的数据',
  compliance: '内控合规：职责分离开关与合规义务倒计时⟦开启后申请人不能审批或办理自己的单据，换角色或换操作人后可继续',
  risk: '风险预警：税负率偏离、现金流不足、账龄超期等规则⟦预警分级 高 / 中 / 低，阈值可在分析规则中调整',
  audit: '审计中心（哈希链）：所有写操作留痕，可校验链是否被篡改⟦每条日志含前一条哈希，任一记录被改动都会导致后续校验失败',
  monitor: '监控大屏：现金 / 银行余额、14 天收支曲线、项目结构与分级预警⟦数据源与日记账、凭证分录一致，随业务实时刷新',
  sec_center: '安全中心：RBAC、会话、敏感操作审计、限流与输入安全扫描⟦登录失败会锁定，凭据类字段一律拒绝存储',
  arch_audit: '架构审计中心：分层依赖、循环引用与迁移版本健康⟦领域层不得反向依赖适配层，也不得直接写 SQL',
  help: '帮助中心：中英文用户手册与常见问题⟦手册随版本更新，界面与实际不一致时以界面为准',
};

/* ==================== 今日工作台（行动导向首页） ==================== */
async function todayDashboard() {
  const pos = currentPosition();
  const more = pos !== 'business';
  // 7 个数据请求一次性并行发出：过去逐个 await，首屏要等满 7 次串行往返。
  // 单个接口失败只影响自己那张卡片，并留下控制台线索，不再静默吞掉。
  const safe = (p, tag) => p.catch(e => { warn(e, tag); return null; });
  const skip = Promise.resolve(null);
  const [t, w, d, g, a, c, cov] = await Promise.all([
    safe(api('/api/todo'), '待办事项'),
    safe(api('/api/work/runs'), '进行中的工作流'),
    safe(api('/api/work/demo/status'), '演示数据状态'),
    more ? safe(api('/api/work/gaps'), '四流断链') : skip,
    more ? safe(api('/api/work/seven/controls'), '管控流检查点') : skip,
    more ? safe(api('/api/work/seven/compliance'), '合规法规清单') : skip,
    more ? safe(api('/api/v28/competency/coverage'), '能力图谱完整度') : skip,
  ]);
  const tasks = [];
  if (t) {
    const n = (t.items || []).filter(x => x.status !== '已完成').length;
    tasks.push({ icon: '📋', label: '待办事项', n, page: 'todo' });
  }
  if (w) {
    const n = (w.items || []).filter(x => x.status === '进行中').length;
    tasks.push({ icon: '🧭', label: '进行中的工作流', n, page: 'dashboard' });
  }
  if (d) tasks.push({ icon: '🎬', label: d.已载入
    ? '演示数据已载入（' + d.记录数 + ' 条，可清空）' : '演示数据未载入',
    n: d.记录数, page: 'dashboard', demo: true });
  if (g) tasks.push({ icon: '🕸', label: '四流断链（待补功能）', n: g.步骤数 + g.动作数, page: 'graph_map' });
  if (a) tasks.push({ icon: '🛡', label: '管控流检查点', n: a.总数, page: 'seven_center' });
  if (c) tasks.push({ icon: '⚖', label: '合规法规清单', n: c.数量, page: 'seven_center' });
  if (cov) tasks.push({ icon: '🧭', label: '能力图谱完整度',
    n: (cov.整体完整度 ?? '—') + '%', page: 'competency_center' });
  return `<div class="card"><h3>今日待我处理</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">${tasks.map(x =>
      `<div style="flex:1;min-width:160px;border:1px solid var(--border);border-radius:8px;padding:12px;cursor:pointer" onclick="goPage('${x.page}')">
        <div style="font-size:20px">${x.icon}</div>
        <b style="font-size:13px">${esc(x.label)}</b>
        <div style="font-size:22px;color:var(--primary);margin-top:4px">${x.n}</div></div>`).join('')}</div></div>`;
}

/* 侧栏渲染：单一数据源 = navTreeHtml()（默认「全部功能」8 大分组，岗位视角可选）
   侧栏是动态生成的，因此点击用事件委托绑定，不可在脚本加载时一次性绑定。 */
function renderNav() {
  const el = $('navTree');
  if (!el) return;
  try {
    el.innerHTML = navTreeHtml();
  } catch (e) {
    // 动态渲染失败时不把侧栏清空：保留 index.html 里的静态入口，只在最上面加一条提示
    el.innerHTML = '<div style="padding:10px 12px;font-size:12px;line-height:1.6;color:#F3C969;background:rgba(255,255,255,.06)">⚠ 侧栏动态渲染失败（'
      + esc(e.message) + '），以下是基础入口，仍可点击。</div>' + el.innerHTML;
    return;
  }
  el.onclick = function (e) {
    let n = e.target;
    while (n && n !== el && !(n.dataset && (n.dataset.page || n.dataset.position))) n = n.parentNode;
    if (!n || n === el || !n.dataset) return;
    if (n.dataset.position) { setPosition(n.dataset.position); return; }
    if (n.dataset.page) go(n.dataset.page);
  };
  try { const box = el.parentNode; if (box && box.scrollTo) box.scrollTo(0, 0); } catch (e) { warn(e); }
  try { if (S && S.page) highlightNav(S.page); } catch (e) { warn(e); }
}
function highlightNav(page) {
  document.querySelectorAll('#navTree button[data-page]').forEach(b => {
    const on = b.dataset.page === page;
    /* 视觉统一交给 aside button.active（发光渐变），不再写死内联浅色，
       否则深色侧栏里会出现一条突兀的白底选中项。 */
    b.classList.toggle('active', on);
    b.style.background = '';
    b.style.color = '';
    b.style.fontWeight = '';
  });
}
try { renderNav(); } catch (e) { try { document.getElementById('navTree').innerHTML = '⚠ 侧栏渲染错误: ' + e.message; } catch (_) { warn(_); } }

const _oldDashboard = PAGES.dashboard;

for (let i = 1; i <= 11; i++) {
  PAGES['work_' + i] = (n => () => workPage(n))(i);
}
PAGES.graph_map = graphMapPage;
PAGES.seven_center = sevenCenterPage;
PAGES.role_center = rolePage;
PAGES.work_overview = workOverview;
PAGES.dashboard = async () => (await todayDashboard()) + '<div style="margin-top:14px">' + (await _oldDashboard()) + '</div>';
