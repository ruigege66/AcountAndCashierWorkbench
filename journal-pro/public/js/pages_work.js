/* V2.15 四流工作台：按调研表 11 项「工作」组织系统。
   一行 = 一项工作；四条流是同一工作的四个视图，按步骤横向对齐。 */

const WORK_TABS = ['数据流', '价值流', '工作流', '执行流'];

function switchWorkTab(no, i) { S.filters['workTab_' + no] = i; render(); }
function goPage(page) { if (typeof go === 'function') go(page); }
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

function flowDataView(w) {
  const nodes = w.数据流.节点 || [];
  return `<div class="card"><h3>数据从哪来、经过什么、最后变成什么</h3>
    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:stretch;margin:12px 0">
      ${nodes.map((n, i) => `<div style="flex:1;min-width:130px;border:1px solid var(--border);border-radius:8px;padding:10px;background:var(--blue-bg)">
        <div class="muted" style="font-size:11px">第 ${i + 1} 环</div>
        <b style="font-size:12.5px;line-height:1.5">${esc(n.name)}</b>
        <div class="muted" style="font-size:11px;margin-top:6px">系统里对应：${esc(n.system_object || '—')}</div>
      </div>${i < nodes.length - 1 ? '<div style="display:flex;align-items:center;color:var(--primary);font-size:18px">→</div>' : ''}`).join('')}
    </div>
    <p class="muted">${esc(w.数据流.说明 || '')}</p>
    <button class="btn btn-g btn-sm" onclick="goPage('books')">去查账簿与余额表 →</button>
    <button class="btn btn-g btn-sm" onclick="goPage('fin')">去看财务报表 →</button></div>`;
}

function flowValueView(w) {
  const points = w.价值流.价值点 || [];
  return `<div class="card"><h3>这项工作为什么要做</h3>
    <div style="background:var(--blue-bg);border-left:3px solid var(--primary);padding:14px;border-radius:0 8px 8px 0;line-height:1.9">
      ${esc(w.价值流.主张)}</div>
    <h3 style="margin-top:16px">带来的具体价值</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${points.map(p => `<span class="tag t-posted">${esc(p)}</span>`).join('')}</div>
    <div style="margin-top:16px"><button class="btn btn-g btn-sm" onclick="goPage('analysis')">看经营分析报告 →</button>
      <button class="btn btn-g btn-sm" onclick="goPage('advanced_center')">看量化模型 →</button>
      <button class="btn btn-g btn-sm" onclick="goPage('ratios')">看财务比率 →</button></div></div>`;
}

function flowWorkView(w, no) {
  const steps = w.工作流.步骤 || [];
  const rid = workRunId(no);
  const stage = parseInt(localStorage.getItem('workStage_' + no) || '0', 10);
  const cur = rid ? stage : -1;
  return `<div class="card"><h3>办理进度</h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${rid ? `<span class="tag t-posted">正在办理（第 ${Math.min(stage + 1, steps.length)} 步 / 共 ${steps.length} 步）</span>
          <button class="btn btn-p btn-sm" onclick="workNext(${no})">✓ 完成这一步，进入下一步</button>
          <button class="btn btn-g btn-sm" onclick="workReset(${no})">重新开始</button>`
        : `<button class="btn btn-p btn-sm" onclick="workStart(${no})">开始按步骤办理</button>`}
      </div></div>
    <div class="card"><h3>流程步骤（点「去办理」直接跳到对应功能）</h3>
    ${steps.map((s, i) => `<div style="border-left:3px solid ${i === cur ? 'var(--primary)' : 'var(--border)'};
        padding:10px 12px;margin-bottom:8px;background:${i === cur ? 'var(--blue-bg)' : 'transparent'};border-radius:0 6px 6px 0">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
        <b>第 ${i + 1} 步 · ${esc(s.name)}</b>
        <span class="tag ${s.关联覆盖 === '已支撑' ? 't-posted' : s.关联覆盖 === '部分支撑' ? '' : 't-rejected'}">${esc(s.关联覆盖)}</span>
      </div>
      <div class="muted" style="margin-top:6px;line-height:1.8">
        产生数据：${esc(s.数据流产物)}（${esc(s.数据对象)}）<br>
        要做动作：${esc(s.执行动作)}<br>
        系统位置：${esc(s.system_entry)}
      </div>
      <button class="btn btn-g btn-sm" style="margin-top:8px" onclick="goPage('${esc(s.system_page || 'search')}')">去办理 →</button>
    </div>`).join('')}
    <p class="muted">${esc(w.工作流.说明 || '')}</p></div>`;
}

function flowExecView(w) {
  const acts = w.执行流.动作 || [];
  return `<div class="card"><h3>具体要做的动作（共 ${acts.length} 项）</h3>
    <div style="overflow-x:auto"><table><thead><tr><th>序号</th><th>动作</th><th>系统里的功能</th><th>支撑情况</th><th></th></tr></thead><tbody>
    ${acts.map(a => `<tr><td>${a.seq}</td><td>${esc(a.name)}</td><td>${esc(a.system_entry)}</td>
      <td><span class="tag ${a.coverage === '已支撑' ? 't-posted' : a.coverage === '部分支撑' ? '' : 't-rejected'}">${esc(a.coverage)}</span></td>
      <td><button class="btn btn-g btn-sm" onclick="goPage('${esc(a.system_page || 'search')}')">打开</button></td></tr>`).join('')}
    </tbody></table></div>
    <p class="muted" style="margin-top:8px">标「待建」的动作目前需人工办理，或列入后续轮次补齐；点「打开」会跳到最接近的现有功能。</p></div>`;
}

async function workPage(no) {
  const d = await api('/api/work/detail?no=' + no);
  const w = d;
  // 同步进行中实例的当前步骤，供步骤条高亮
  try {
    const rs = (await api('/api/work/runs')).items || [];
    const run = rs.find(x => x.domain_no === no && x.status === '进行中');
    if (run) { localStorage.setItem('workRun_' + no, String(run.id)); localStorage.setItem('workStage_' + no, String(run.stage)); }
    else localStorage.removeItem('workRun_' + no);
  } catch (e) { /* 不影响页面 */ }
  const tab = Math.min(parseInt(S.filters['workTab_' + no] || '2', 10), 3);  // 默认工作流
  const tabs = `<div style="margin-bottom:12px">${WORK_TABS.map((t, i) =>
    `<button class="btn ${i === tab ? 'btn-p' : 'btn-g'} btn-sm" style="margin-right:6px" onclick="switchWorkTab(${no},${i})">${t}</button>`).join('')}</div>`;
  const body = [flowDataView, flowValueView, (x) => flowWorkView(x, no), flowExecView][tab](w);
  return `<div class="page-head"><div><h2>${esc(w.work.subject)}</h2>
    <div class="hint">${esc(w.work.exam_type)} ｜ ${esc(w.work.short_name)} ｜ 四流工作台</div></div>
    <button class="btn btn-g" onclick="goPage('dashboard')">← 我的工作</button></div>
    <div class="banner"><b>这项工作的价值：</b>${esc(w.价值流.主张)}</div>
    ${tabs}${body}
    <div class="card" style="margin-top:12px"><h3>这项工作的知识范围（调研表子科目）</h3>
      <div class="muted" style="white-space:pre-wrap;line-height:1.9">${esc(w.子科目)}</div></div>`;
}

/* 首页：我的工作总览 */
async function workOverview() {
  const d = await api('/api/work/dashboard');
  const list = (await api('/api/work/works')).items;
  return `<div class="page-head"><div><h2>我的工作 · 四流总览</h2>
    <div class="hint">按调研表 11 项工作组织：选一项工作 → 看四流 → 按步骤办理</div></div></div>
    <div class="banner">共 <b>${d.工作数}</b> 项工作、<b>${d.工作流步骤}</b> 个流程步骤、<b>${d.执行动作}</b> 个执行动作；
    其中 <b>${d.已支撑步骤}</b> 步已有系统功能，<b>${d.断链步骤}</b> 步待补。${esc(d.提示)}</div>
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
const _oldDashboard = PAGES.dashboard;
for (let i = 1; i <= 11; i++) {
  PAGES['work_' + i] = (n => () => workPage(n))(i);
}
PAGES.dashboard = async () => (await workOverview()) + (await _oldDashboard());
