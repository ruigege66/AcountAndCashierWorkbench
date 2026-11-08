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
function setPosition(p) { localStorage.setItem('position', p); renderNav(); render(); }
/* 侧栏永远是「全部功能」优先：任何视角下所有分组都展开，不折叠内容 */
function showAllFeatures() {
  localStorage.setItem('position', 'all');
  renderNav(); render();
  try { toast('已显示全部 65 项功能'); } catch (e) {}
}

function navTreeHtml() {
  const pos = currentPosition() || 'all';
  // 全部功能模式：8 个大功能 → 全部小功能；岗位模式：只显示该档
  const GROUPS_ALL = [
    ['工作台 · 11 项工作', ['dashboard','work_overview','work_1','work_2','work_3','work_4','work_5','work_6','work_7','work_8','work_9','work_10','work_11']],
    ['财务核算', ['docs','invoices','assets','vouchers','journal','books','fin','cfstmt','reports','ratios','compare','daily','recon','periods','baddebt','yearend','snapshots','collection','partner','subjects']],
    ['税务管理', ['tax_center']],
    ['数据分析', ['analysis','graph','graph_map','seven_center','competency_center','role_center','advanced_center','rules','macro_center']],
    ['法务 · 审计 · 监管', ['legal_center','audit_center','reg_center']],
    ['外部协同', ['gateway_center','stmtimport','office']],
    ['效率工具', ['acct_tools','cashier_tools','todo','search','tpl','print','vcheck']],
    ['系统与安全', ['base','system','compliance','risk','audit','monitor','sec_center','arch_audit','help']],
  ];
  const lv = NAV_LEVELS[pos];
  // 两种数据源格式统一成 [标题, 页面数组] 元组：
  //   GROUPS_ALL 本身就是元组数组；NAV_LEVELS.*.groups 是 {title,pages} 对象数组。
  // 以前直接 `for (const [title,pages] of 对象数组)` 会抛 "is not iterable"，
  // 导致整个侧栏动态渲染失败（只剩静态兜底）。
  const raw = pos === 'all' ? GROUPS_ALL : (lv && Array.isArray(lv.groups) ? lv.groups : GROUPS_ALL);
  const groups = raw.map(g => Array.isArray(g) ? g : [g.title || '', Array.isArray(g.pages) ? g.pages : []]);
  const rolesHtml = POSITION_ROLES.map(r =>
    `<button data-position="${r.id}" style="display:block;width:100%;text-align:left;${pos === r.id ? 'color:var(--primary);font-weight:500' : 'color:var(--text2)'}" onclick="setPosition('${r.id}')">${r.id === pos ? '● ' : '○ '}${esc(r.name)}</button>`).join('');
  let out = `<div data-navver="V218"></div><details style="border-bottom:1px solid rgba(255,255,255,.08)"><summary style="cursor:pointer;padding:8px 12px;font-size:12px">👤 岗位视角 · ${esc((POSITION_ROLES.find(r=>r.id===pos)||{}).name||'全部功能')}</summary><div style="padding:4px 8px">${rolesHtml}</div></details>`;
  if (pos !== 'all') {
    out += `<div style="padding:8px 12px;font-size:11.5px;line-height:1.6;color:#F3C969;background:rgba(255,255,255,.05)">
      ⚠ 当前是「岗位视角」，只列本档功能。要看到全部 65 项请点顶部「☰ 全部功能」。</div>`;
  }
  // 分组一律展开：用户要的是能一眼看到所有功能，不需要再点一次
  for (const [title, pages] of groups) {
    const btns = pages.map(p => `<button data-page="${p}" style="display:block;width:100%;text-align:left">${esc(NAV_LABEL[p] || p)}</button>`).join('');
    out += `<details open style="border-bottom:1px solid rgba(255,255,255,.08)"><summary style="cursor:pointer;padding:9px 12px;font-size:12.5px;font-weight:500">${esc(title)}（${pages.length}）</summary><div>${btns}</div></details>`;
  }
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

/* ==================== 今日工作台（行动导向首页） ==================== */
async function todayDashboard() {
  const pos = currentPosition();
  const tasks = [];
  try {
    const t = await api('/api/todo');
    const n = (t.items || []).filter(x => x.status !== '已完成').length;
    tasks.push({ icon: '📋', label: '待办事项', n, page: 'todo' });
  } catch (e) {}
  try {
    const w = (await api('/api/work/runs')).items || [];
    const n = w.filter(x => x.status === '进行中').length;
    tasks.push({ icon: '🧭', label: '进行中的工作流', n, page: 'dashboard' });
  } catch (e) {}
  try {
    const d = await api('/api/work/demo/status');
    tasks.push({ icon: '🎬', label: d.已载入 ? '演示数据已载入（' + d.记录数 + ' 条，可清空）' : '演示数据未载入', n: d.记录数, page: 'dashboard', demo: true });
  } catch (e) {}
  if (pos !== 'business') {
    try {
      const g = await api('/api/work/gaps');
      tasks.push({ icon: '🕸', label: '四流断链（待补功能）', n: g.步骤数 + g.动作数, page: 'graph_map' });
    } catch (e) {}
    try {
      const a = await api('/api/work/seven/controls');
      tasks.push({ icon: '🛡', label: '管控流检查点', n: a.总数, page: 'seven_center' });
    } catch (e) {}
    try {
      const c = await api('/api/work/seven/compliance');
      tasks.push({ icon: '⚖', label: '合规法规清单', n: c.数量, page: 'seven_center' });
    } catch (e) {}
    try {
      const cov = await api('/api/v28/competency/coverage');
      tasks.push({ icon: '🧭', label: '能力图谱完整度', n: (cov.整体完整度 ?? '—') + '%', page: 'competency_center' });
    } catch (e) {}
  }
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
  try { const box = el.parentNode; if (box && box.scrollTo) box.scrollTo(0, 0); } catch (e) {}
  try { if (S && S.page) highlightNav(S.page); } catch (e) {}
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
try { renderNav(); } catch (e) { try { document.getElementById('navTree').innerHTML = '⚠ 侧栏渲染错误: ' + e.message; } catch (_) {} }

const _oldDashboard = PAGES.dashboard;

for (let i = 1; i <= 11; i++) {
  PAGES['work_' + i] = (n => () => workPage(n))(i);
}
PAGES.graph_map = graphMapPage;
PAGES.seven_center = sevenCenterPage;
PAGES.role_center = rolePage;
PAGES.work_overview = workOverview;
PAGES.dashboard = async () => (await todayDashboard()) + '<div style="margin-top:14px">' + (await _oldDashboard()) + '</div>';
