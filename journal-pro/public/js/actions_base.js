/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* ================= 交互动作 ================= */
async function loadMeta() { S.meta = await api('/api/meta'); }
function go(page) {
  S.page = page;
  try { if (location.hash.replace(/^#/, '') !== page) history.replaceState(null, '', '#' + page); } catch (e) { warn(e); }
  try { if (typeof highlightNav === 'function') highlightNav(page); else
    document.querySelectorAll('aside button').forEach(b => b.classList.toggle('active', b.dataset.page === page)); } catch (e) { warn(e); }
  $('crumb').textContent = ({ dashboard: '工作台', docs: '业务单据', vouchers: '凭证管理', journal: '现金银行日记账',
    daily: '日结核对', recon: '银行对账', periods: '期末结账', reports: '报表中心',
    books: '账簿与分析', compliance: '内控合规', invoices: '发票管理', assets: '固定资产', office: '导入导出中心',
    monitor: '监控大屏', risk: '风险预警', audit: '审计中心', help: '帮助中心',
    partner: '往来账', fin: '财务报表',
    todo: '我的待办中心', search: '全局搜索', tpl: '常用凭证模板', print: '凭证打印',
    vcheck: '凭证合规体检', cfstmt: '现金流量表（正表）', ratios: '财务比率分析',
    compare: '同比环比分析', baddebt: '坏账准备计提', collection: '往来催收清单',
    snapshots: '报表快照归档', yearend: '年度结转', stmtimport: '对账单批量导入',
    subjects: '会计科目模板',
    analysis: '在线经营分析报告', rules: '分析规则配置', graph: '功能联动关系',
    acct_tools: '会计工具箱', cashier_tools: '出纳工作台', tax_center: '税务中心', gateway_center: '开票 / 网银协同', legal_center: '法务管理', audit_center: '内部审计',
    reg_center: '金融监管会计', macro_center: '宏观经济会计',
    competency_center: '需求与四流追踪', advanced_center: '高阶核算与模型',
    arch_audit: '架构审计中心', sec_center: '安全中心',
    base: '基础资料', system: '系统管理', role_center: '岗位与能力进阶', work_1: '账务核算', work_2: '财务与预算', work_3: '合同法务', work_4: '集团与战略财务', work_5: '准则核算', work_6: '审计鉴证', work_7: '成本与估值', work_8: '商事合规', work_9: '全税种管理', work_10: '战略与风控', work_11: '重大项目综合',
    graph_map: '知识图谱', seven_center: '七流分析', work_overview: '11 项工作总览' })[page] || '工作台';
  render();
}
/* 历史遗留：工作台系列页面用 goPage('xxx')，早期模块用 go('xxx')。
   两者统一指向同一入口，缺一个就会让整片「去办理 / 进入工作台」按钮失灵。 */
function goPage(page) { return go(page); }
document.querySelectorAll('aside button').forEach(b => b.onclick = () => go(b.dataset.page));

function safeChart(id, cfg) {
  try { chart(id, cfg); } catch (e) { console.warn('图表渲染失败（不影响数据展示）:', e.message); }
}

async function render() {
  destroyCharts();
  if (S.timer) { clearInterval(S.timer); S.timer = null; }
  ['fDocType', 'fDocStatus', 'fKind', 'fMonth', 'fRecon', 'dMonth', 'officeTarget', 'bookPeriod', 'assetPeriod',
   'aFrom', 'aTo', 'aActor', 'aEntity', 'aQ', 'plCp', 'frPeriod'].forEach(id => {
    const el = $(id); if (el) S.filters[id] = el.value;
  });
  $('page').innerHTML = '<div class="empty">加载中…</div>';
  try {
    if (!S.meta) await loadMeta();
    // 页面顶部插入「这个功能干什么 / 怎么算」的说明条，再给按钮表头挂悬浮解释
    $('page').innerHTML = (typeof pageHelpHtml === 'function' ? pageHelpHtml(S.page) : '')
      + await PAGES[S.page]();
    try { if (typeof attachHelp === 'function') attachHelp($('page')); } catch (_) { warn(_); }
    if (S.page === 'dashboard') {
      const [m, s] = await Promise.all([api('/api/reports/monthly'), api('/api/reports/subjects')]);
      safeChart('c1', { type: 'bar', data: { labels: m.items.map(x => x.period), datasets: [
        { label: '收入', data: m.items.map(x => x.income), backgroundColor: '#4472C4', borderRadius: 6 },
        { label: '支出', data: m.items.map(x => x.expense), backgroundColor: '#ED7D31', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false } });
      const top = s.items.filter(x => x.debit > 0).sort((a, b) => b.debit - a.debit).slice(0, 6);
      safeChart('c2', { type: 'doughnut', data: { labels: top.map(x => x.subject_name || x.subject_code),
        datasets: [{ data: top.map(x => x.debit), backgroundColor: ['#4472C4', '#ED7D31', '#70AD47', '#FFC000', '#7030A0', '#4BACC6'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } } });
    }
    if (S.page === 'reports') {
      const m = await api('/api/reports/monthly');
      safeChart('c1', { type: 'bar', data: { labels: m.items.map(x => x.period), datasets: [
        { label: '收入', data: m.items.map(x => x.income), backgroundColor: '#4472C4', borderRadius: 6 },
        { label: '支出', data: m.items.map(x => x.expense), backgroundColor: '#ED7D31', borderRadius: 6 },
        { label: '净流入', data: m.items.map(x => x.income - x.expense), backgroundColor: '#2E8B57', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false } });
    }
    if (S.page === 'monitor' && S._monitor) {
      const d = S._monitor;
      const dk = { color: '#9FB0CC', grid: { color: 'rgba(255,255,255,.08)' } };
      const dark = { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#C9D4EA' } } },
        scales: { x: dk, y: dk } };
      safeChart('mTrend', { type: 'bar', data: { labels: d.daily.map(x => x.journal_date.slice(5)), datasets: [
        { label: '流入', data: d.daily.map(x => x.income), backgroundColor: '#4472C4', borderRadius: 4 },
        { label: '流出', data: d.daily.map(x => x.expense), backgroundColor: '#ED7D31', borderRadius: 4 }] }, options: dark });
      safeChart('mMonths', { type: 'line', data: { labels: d.months.map(x => x.period), datasets: [
        { label: '收入', data: d.months.map(x => x.income), borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,.12)', fill: true, tension: .35 },
        { label: '支出', data: d.months.map(x => x.expense), borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,.12)', fill: true, tension: .35 }] }, options: dark });
      safeChart('mProj', { type: 'doughnut', data: { labels: d.projects.map(x => x.name),
        datasets: [{ data: d.projects.map(x => x.debit), backgroundColor: ['#4472C4', '#ED7D31', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#38BDF8', '#94A3B8'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#C9D4EA' } } } } });
      S.timer = setInterval(() => { if (S.page === 'monitor') render(); else if (S.timer) clearInterval(S.timer); }, Math.max(5, d.refresh || 10) * 1000);
    }
    if (S.page === 'audit' && S._auditStats) {
      const st = S._auditStats;
      safeChart('aDay', { type: 'line', data: { labels: st.by_day.map(x => x.d), datasets: [
        { label: '操作量', data: st.by_day.map(x => x.n), borderColor: '#4472C4', backgroundColor: 'rgba(68,114,196,.12)', fill: true, tension: .35 }] },
        options: { responsive: true, maintainAspectRatio: false } });
      safeChart('aAction', { type: 'bar', data: { labels: st.by_action.map(x => x.action),
        datasets: [{ label: '次数', data: st.by_action.map(x => x.n), backgroundColor: '#4472C4', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    }
    try { if (typeof attachHelp === 'function') attachHelp($('page')); } catch (_) { warn(_); }
    try { if (typeof refreshMotion === 'function') refreshMotion($('page')); } catch (_) { warn(_); }
    try { if (typeof highlightNav === 'function') highlightNav(S.page); } catch (_) { warn(_); }
  } catch (e) {
    $('page').innerHTML = `<div class="card"><h3>加载失败</h3><p class="muted">${esc(e.message)}</p></div>`;
  }
}

/* 业务单据 */
function newDoc() {
  const body = `<div class="frow">
      <div><label>单据类型 *</label><select name="doc_type" id="dType" onchange="toggleAdvance()">
        ${Object.entries(DOC_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div><label>日期 *</label><input type="date" name="doc_date" value="${today()}"></div>
      <div><label>金额（元）*</label><input type="number" step="0.01" name="amount" placeholder="0.00"></div>
      <div><label>收付账户 *</label><select name="account_kind"><option value="cash">库存现金</option><option value="bank">银行存款</option></select></div>
    </div>
    <div class="frow">
      <div><label>对方科目 *</label><select name="subject_code">${subjOpts()}</select></div>
      <div><label>核算项目</label><select name="project_id">${projOpts()}</select></div>
      <div><label>往来单位</label><select name="counterparty_id">${cpOpts()}</select></div>
    </div>
    <div class="frow">
      <div><label>申请人 / 经办人</label><input name="applicant" value="${esc(actor())}"></div>
      <div><label>部门</label><input name="dept" placeholder="如 财务部"></div>
      <div id="advanceBox" style="display:none"><label>冲抵借款单</label><select name="advance_id" id="advanceSel"><option value="">—不冲抵，直接付款—</option></select></div>
    </div>
    <div><label>事由 / 摘要</label><input name="reason" placeholder="业务说明"></div>
    <p class="muted" style="margin-top:10px">保存后为「草稿」，需提交审批；审批通过后由出纳办理收付款，系统自动生成记账凭证并登记日记账。</p>`;
  openModal('新建业务单据', body, '保存草稿', async f => {
    const d = {
      doc_type: fd(f, 'doc_type'), doc_date: fd(f, 'doc_date'), amount: fnum(f, 'amount'),
      account_kind: fd(f, 'account_kind'), subject_code: fd(f, 'subject_code'),
      project_id: fd(f, 'project_id') || null, counterparty_id: fd(f, 'counterparty_id') || null,
      applicant: fd(f, 'applicant'), dept: fd(f, 'dept'), reason: fd(f, 'reason'),
      advance_id: fd(f, 'advance_id') || null
    };
    if (!d.subject_code) throw new Error('请选择对方科目');
    const r = await api('/api/docs', 'POST', d);
    closeModal(); toast('✓ ' + r.doc_no + ' 已保存为草稿'); render();
  });
  toggleAdvance();
}
async function toggleAdvance() {
  const box = $('advanceBox'); if (!box) return;
  const t = $('dType').value;
  box.style.display = t === 'reimbursement' ? 'block' : 'none';
  if (t === 'reimbursement') {
    const d = await api('/api/docs?type=advance');
    const sel = $('advanceSel');
    sel.innerHTML = '<option value="">—不冲抵，直接付款—</option>' + d.items
      .filter(x => x.status === 'settled').map(x => `<option value="${x.id}">${esc(x.doc_no)} ¥${money(x.amount)} ${esc(x.applicant || '')}</option>`).join('');
  }
}
async function actDoc(id, action) {
  if (action === 'delete' && !confirm('确定删除这张草稿单据？')) return;
  if (action === 'settle' && !confirm('确认已实际收付款？系统将生成凭证并登记日记账。')) return;
  try { await api(`/api/docs/${id}/${action}`, 'POST', { actor: actor() }); toast('✓ 操作成功'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}

/* 凭证 */
let lineCount = 2;
function lineRow(i) {
  return `<div class="line-row" id="ln${i}">
    <select name="subject_code_${i}">${subjOpts()}</select>
    <input type="number" step="0.01" name="debit_${i}" placeholder="借方金额">
    <input type="number" step="0.01" name="credit_${i}" placeholder="贷方金额">
    <button type="button" class="btn btn-r btn-sm" onclick="this.parentElement.remove();calcBalance()">×</button></div>`;
}
function addLine() { $('lines').insertAdjacentHTML('beforeend', lineRow(lineCount++)); calcBalance(); }
function calcBalance() {
  const f = $('modalForm'); if (!f) return;
  let dr = 0, cr = 0;
  for (let j = 0; j < lineCount; j++) {
    dr += parseFloat(f.elements['debit_' + j]?.value) || 0;
    cr += parseFloat(f.elements['credit_' + j]?.value) || 0;
  }
  const el = $('balHint');
  if (el) { el.textContent = `借方 ${money(dr)} / 贷方 ${money(cr)} ${Math.abs(dr - cr) < 0.005 ? '✓ 平衡' : '✗ 差额 ' + money(dr - cr)}`;
    el.style.color = Math.abs(dr - cr) < 0.005 && dr > 0 ? 'var(--green)' : 'var(--red)'; }
}
function newVoucher() {
  lineCount = 2;
  const body = `<div class="frow">
      <div><label>日期 *</label><input type="date" name="voucher_date" value="${today()}"></div>
      <div><label>凭证字</label><select name="voucher_type"><option>付</option><option>收</option><option>转</option></select></div>
      <div style="grid-column:span 2"><label>摘要</label><input name="summary" placeholder="业务摘要"></div>
    </div>
    <label>分录（至少两条，借贷必须平衡；涉及 1001 库存现金 / 1002 银行存款 的分录会自动登记日记账）</label>
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 30px;gap:8px;font-size:12px;color:var(--text2);margin-bottom:5px">
      <span>会计科目</span><span>借方</span><span>贷方</span><span></span></div>
    <div id="lines">${lineRow(0)}${lineRow(1)}</div>
    <button type="button" class="btn btn-g btn-sm" onclick="addLine()">＋ 添加分录</button>
    <div id="balHint" style="text-align:right;font-size:13px;margin-top:8px"></div>
    <label style="margin-top:10px"><input type="checkbox" name="auto_post" style="width:auto"> 保存后直接过账（跳过审核）</label>`;
  openModal('新增记账凭证', body, '保存凭证', async f => {
    const lines = [];
    for (let j = 0; j < lineCount; j++) {
      const code = f.elements['subject_code_' + j]?.value;
      if (!code) continue;
      lines.push({ subject_code: code,
        debit: parseFloat(f.elements['debit_' + j]?.value) || 0,
        credit: parseFloat(f.elements['credit_' + j]?.value) || 0 });
    }
    const r = await api('/api/vouchers', 'POST', {
      voucher_date: fd(f, 'voucher_date'), voucher_type: fd(f, 'voucher_type'),
      summary: fd(f, 'summary'), maker: actor(),
      auto_post: f.elements['auto_post'].checked, lines
    });
    closeModal(); toast('✓ ' + r.voucher_no + ' 已保存'); render();
  });
  $('lines').addEventListener('input', calcBalance);
  calcBalance();
}
async function actVoucher(id, action) {
  if (action === 'void' && !confirm('确定作废该凭证？')) return;
  let payload = { actor: actor() };
  if (action === 'reverse') {
    const reason = prompt('请输入冲销原因（将写入审计日志）：', '更正错账');
    if (reason === null) return;
    if (!confirm('红字冲销将生成一张反向凭证并过账，原凭证保留且不可修改。确认继续？')) return;
    payload.reason = reason;
  }
  try { await api(`/api/vouchers/${id}/${action}`, 'POST', payload); toast('✓ 操作成功'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}
async function attachVoucher(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg,.txt';
  input.onchange = async () => {
    const f = input.files[0]; if (!f) return;
    const buf = await f.arrayBuffer();
    let binary = ''; const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    try {
      await api('/api/documents/upload', 'POST', {
        filename: f.name, content: btoa(binary), actor: actor(), entity_type: 'voucher', entity_id: id
      });
      toast('✓ 附件已关联到凭证'); render();
    } catch (e) { toast('✗ ' + e.message, 4000); }
  };
  input.click();
}

/* 日记账 */
function newManual() {
  const body = `<div class="frow">
      <div><label>日期 *</label><input type="date" name="date" value="${today()}"></div>
      <div><label>方向 *</label><select name="direction"><option value="in">收款（借）</option><option value="out">付款（贷）</option></select></div>
      <div><label>金额 *</label><input type="number" step="0.01" name="amount"></div>
      <div><label>账户 *</label><select name="account_kind"><option value="cash">库存现金</option><option value="bank">银行存款</option></select></div>
    </div><div class="frow">
      <div><label>对方科目 *</label><select name="subject_code">${subjOpts()}</select></div>
      <div><label>项目</label><select name="project_id">${projOpts()}</select></div>
      <div><label>往来单位</label><select name="counterparty_id">${cpOpts()}</select></div>
      <div><label>摘要</label><input name="summary"></div>
    </div><p class="muted">后台自动生成一张收/付款凭证并立即过账，保证账证相符。</p>`;
  openModal('出纳直接登记', body, '登记并过账', async f => {
    await api('/api/journal/manual', 'POST', {
      date: fd(f, 'date'), direction: fd(f, 'direction'), amount: fnum(f, 'amount'),
      account_kind: fd(f, 'account_kind'), subject_code: fd(f, 'subject_code'),
      project_id: fd(f, 'project_id') || null, counterparty_id: fd(f, 'counterparty_id') || null,
      summary: fd(f, 'summary'), actor: actor()
    });
    closeModal(); toast('✓ 已登记并生成凭证'); render();
  });
}
async function setRecon(id, status) {
  try { await api(`/api/journal/${id}/recon`, 'POST', { status, actor: actor() }); toast('✓ 已更新'); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}
async function batchRecon() {
  const qs = new URLSearchParams();
  const kind = S.filters.fKind, month = S.filters.fMonth, recon = S.filters.fRecon;
  if (kind) qs.set('kind', kind); if (month) qs.set('month', month); if (recon) qs.set('recon', recon);
  const d = await api('/api/journal?' + qs);
  const ids = d.items.filter(x => x.recon_status !== '已核对').map(x => x.id);
  if (!ids.length) return toast('没有待核对记录');
  if (!confirm(`将筛选结果中 ${ids.length} 笔流水标记为「已核对」？`)) return;
  try { await api('/api/journal/recon-batch', 'POST', { ids, status: '已核对', actor: actor() }); toast('✓ 已批量核对'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}
function downloadCSV() { window.location.href = '/api/export/journal.csv'; }

/* 日结核对 */
async function setCheck(kind, date, amount) {
  if (amount === '') return;
  try { await api('/api/daily/check', 'POST', { date, account_kind: kind, amount: parseFloat(amount), actor: actor() }); toast('✓ 盘点数已保存'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}

/* 银行对账 */
function importStatements() {
  const body = `<label>对账单数据（每行一条：日期,摘要,收入,支出；金额留空表示 0）</label>
    <textarea name="text" rows="7" placeholder="2026-11-06,A客户货款,25000,&#10;2026-11-07,银行手续费,,85.5"></textarea>
    <div class="frow" style="margin-top:10px"><div><label>银行账户</label><select name="bank_account_id">${bankOpts()}</select></div></div>`;
  openModal('导入银行对账单', body, '导入', async f => {
    const lines = fd(f, 'text').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const items = lines.map(l => {
      const p = l.split(',').map(x => x.trim());
      return { date: p[0], description: p[1] || '', amount_in: parseFloat(p[2]) || 0,
               amount_out: parseFloat(p[3]) || 0, bank_account_id: fd(f, 'bank_account_id') };
    });
    if (!items.length) throw new Error('请填写对账单数据');
    const r = await api('/api/statements', 'POST', { items, actor: actor() });
    closeModal(); toast(`✓ 已导入 ${r.count} 条`); render();
  });
}
async function autoMatch() {
  try { const r = await api('/api/statements/match', 'POST', { actor: actor() }); toast(`✓ 自动匹配 ${r.matched} 笔`); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}

/* 结账 */
async function periodAct(period, action) {
  if (action === 'close' && !confirm(`确认对 ${period} 进行月末结账？结账后该期间将禁止新增和修改。`)) return;
  try { await api(`/api/periods/${period}/${action}`, 'POST', { actor: actor() });
    toast('✓ ' + (action === 'close' ? '已结账' : '已反结账')); await loadMeta(); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}

/* 基础资料 */
function newBase(table) {
  let extra = '';
  if (table === 'subjects') extra = `<div><label>科目编码 *</label><input name="code" placeholder="如 6604"></div>
    <div><label>类别</label><select name="category"><option>资产</option><option>负债</option><option>权益</option><option>成本</option><option>损益</option></select></div>
    <div><label>余额方向</label><select name="direction"><option>借</option><option>贷</option></select></div>`;
  if (table === 'counterparties') extra = `<div><label>类型</label><select name="kind"><option>客户</option><option>供应商</option><option>员工</option><option>其他</option></select></div>`;
  if (table === 'bank_accounts') extra = `<div><label>开户行</label><input name="bank_name"></div>
    <div><label>账号</label><input name="account_no"></div>
    <div><label>期初余额</label><input type="number" step="0.01" name="opening_balance" value="0"></div>`;
  openModal('新增基础资料', `<div><label>名称 *</label><input name="name"></div>
    <div class="frow" style="margin-top:10px">${extra}</div>`, '保存', async f => {
    const d = { name: fd(f, 'name'), actor: actor() };
    ['code', 'category', 'direction', 'kind', 'bank_name', 'account_no', 'opening_balance'].forEach(k => { if (f.elements[k]) d[k] = fd(f, k); });
    await api('/api/base/' + table, 'POST', d);
    closeModal(); await loadMeta(); toast('✓ 已新增'); render();
  });
}
async function delBase(table, id) {
  if (!confirm('确定停用？停用后不再出现在下拉选项中，历史数据不受影响。')) return;
  try { await api(`/api/base/${table}/${id}`, 'DELETE'); await loadMeta(); toast('✓ 已停用'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}

/* 系统管理 */
async function backupJSON() {
  try {
    const d = await api('/api/backup');
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'journal-pro-backup-' + today() + '.json'; a.click();
    toast('✓ 备份已下载');
  } catch (e) { toast('✗ ' + e.message, 3500); }
}
function restoreJSON(input) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try {
      const data = JSON.parse(r.result);
      if (!data.tables) throw new Error('备份文件格式不正确');
      if (!confirm('⚠ 恢复备份将覆盖当前全部业务数据（不可恢复），建议先备份。确定继续？')) return;
      const res = await api('/api/restore', 'POST', { confirm: true, data, actor: actor() });
      await loadMeta(); toast(`✓ 已迁移 ${res.restored} 行数据`); render();
    } catch (e) { toast('✗ ' + e.message, 4000); }
  };
  r.readAsText(f); input.value = '';
}
async function saveSettings() {
  const settings = {
    company_name: $('setCompany').value, cashier: $('setCashier').value,
    accountant: $('setAccountant').value, cash_opening: $('setCash').value
  };
  try {
    await api('/api/settings', 'POST', { settings, actor: actor() });
    await api('/api/recalc', 'POST', { actor: actor() });
    await loadMeta(); toast('✓ 参数已保存，余额已重算'); render();
  } catch (e) { toast('✗ ' + e.message, 3500); }
}

/* ---------- 固定资产 / 结转 / 期初 / 对账单 / 迁移 ---------- */
function newAsset() {
  const body = `<div class="frow">
      <div><label>资产编号</label><input name="asset_no" placeholder="留空自动生成"></div>
      <div><label>资产名称 *</label><input name="name"></div>
      <div><label>类别</label><select name="category"><option>电子设备</option><option>办公家具</option><option>机器设备</option><option>运输工具</option><option>房屋建筑物</option><option>其他</option></select></div>
      <div><label>购入日期 *</label><input type="date" name="purchase_date" value="${today()}"></div>
    </div><div class="frow">
      <div><label>原值（元）*</label><input type="number" step="0.01" name="original_value"></div>
      <div><label>残值率</label><input type="number" step="0.01" name="salvage_rate" value="0.05"></div>
      <div><label>折旧月数 *</label><input type="number" name="useful_life_months" value="60"></div>
      <div><label>开始计提期间</label><input type="month" name="start_period" value="${thisMonth()}"></div>
      <div><label>折旧费用科目</label><select name="expense_subject">${subjOpts('6602')}</select></div>
      <div><label>使用部门</label><input name="dept"></div>
    </div><div><label>备注</label><input name="note"></div>
    <p class="muted" style="margin-top:10px">直线法：月折旧额 = 原值 ×（1 − 残值率）÷ 折旧月数；计提时自动生成「借 费用 / 贷 累计折旧」凭证。</p>`;
  openModal('新增固定资产', body, '保存', async f => {
    await api('/api/assets', 'POST', {
      asset_no: fd(f, 'asset_no'), name: fd(f, 'name'), category: fd(f, 'category'),
      purchase_date: fd(f, 'purchase_date'), original_value: fnum(f, 'original_value'),
      salvage_rate: fd(f, 'salvage_rate'), useful_life_months: fd(f, 'useful_life_months'),
      start_period: fd(f, 'start_period'), expense_subject: fd(f, 'expense_subject'),
      dept: fd(f, 'dept'), note: fd(f, 'note'), actor: actor()
    });
    closeModal(); toast('✓ 资产已入账'); render();
  });
}
async function actAsset(id, action) {
  if (!confirm('确认将该资产标记为已清理？')) return;
  try { await api(`/api/assets/${id}/${action}`, 'POST', { actor: actor() }); toast('✓ 已处理'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}
async function capitalizeAsset(id) {
  if (!confirm('确认生成购置凭证（借 固定资产 / 贷 银行存款，按原值入账）？')) return;
  try { await api(`/api/assets/${id}/capitalize`, 'POST', { actor: actor() }); toast('✓ 购置凭证已生成并过账'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}
async function depreciate() {
  const period = $('assetPeriod')?.value || thisMonth();
  if (!confirm(`确认计提 ${period} 的固定资产折旧？系统将自动生成折旧凭证并过账。`)) return;
  try {
    const r = await api('/api/assets/depreciate', 'POST', { period, actor: actor() });
    toast(`✓ 已计提 ${r.count} 项，合计 ¥${money(r.total)}`, 4000); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function carryForward(period) {
  if (!confirm(`确认对 ${period} 执行期末结转损益？将把损益类科目余额转入本年利润并生成凭证。`)) return;
  try {
    const r = await api(`/api/periods/${period}/carry-forward`, 'POST', { actor: actor() });
    toast(`✓ 结转完成，净额 ¥${money(r.net)}`, 4000); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function editOpenings() {
  const period = S.filters.bookPeriod || thisMonth();
  const op = await api('/api/openings?period=' + period);
  const map = {}; op.items.forEach(x => map[x.subject_code] = x);
  const rows = S.meta.subjects.map(s => `<div style="display:grid;grid-template-columns:1fr 130px 130px;gap:8px;align-items:center;margin-bottom:5px">
      <span style="font-size:13px">${esc(s.code)} ${esc(s.name)} <span class="muted">(${esc(s.direction)}向)</span></span>
      <input type="number" step="0.01" name="dr_${s.code}" placeholder="借方" value="${map[s.code]?.debit || ''}">
      <input type="number" step="0.01" name="cr_${s.code}" placeholder="贷方" value="${map[s.code]?.credit || ''}">
    </div>`).join('');
  openModal(`期初建账 · ${period}`, `<div class="banner">从其他系统迁移时，把原系统期末余额按科目录入：资产/成本类填借方，负债/权益/收入类填贷方；借贷合计必须相等。</div>
    <div style="display:grid;grid-template-columns:1fr 130px 130px;gap:8px;font-size:12px;color:var(--text2);margin-bottom:6px"><span>科目</span><span>借方期初</span><span>贷方期初</span></div>
    <div style="max-height:380px;overflow:auto">${rows}</div>`, '保存期初', async f => {
    const rowsData = [];
    S.meta.subjects.forEach(s => {
      const dr = parseFloat(f.elements['dr_' + s.code]?.value) || 0;
      const cr = parseFloat(f.elements['cr_' + s.code]?.value) || 0;
      if (dr || cr) rowsData.push({ subject_code: s.code, debit: dr, credit: cr });
    });
    await api('/api/openings', 'POST', { period, rows: rowsData, actor: actor() });
    closeModal(); toast('✓ 期初余额已保存'); render();
  });
}
function partnerStmt(id, fmt) { window.location.href = `/api/export/partner.${fmt}?counterparty_id=${id}`; }
async function selfCheck() {
  try {
    const r = await api('/api/selfcheck');
    toast(r.ok ? '✓ 全部自检项通过' : `✗ ${r.items.filter(x => !x.pass).length} 项异常`, 4000);
    render();
  } catch (e) { toast('✗ ' + e.message, 3500); }
}
function exportPortable() { window.location.href = '/api/portable/export'; }
async function importPortable(input) {
  const f = input.files[0]; if (!f) return;
  const buf = await f.arrayBuffer();
  let binary = ''; const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  if (!confirm('⚠ 导入整站迁移包将用包内数据库覆盖当前全部数据，确定继续？')) { input.value = ''; return; }
  try {
    const r = await api('/api/portable/import', 'POST', { content: btoa(binary), actor: actor() });
    await loadMeta(); toast(`✓ 已导入 ${r.tables} 张表、${r.attachments} 个附件`, 4500); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}

/* 轻量 Markdown 渲染（帮助中心） */
function mdToHtml(md) {
  const lines = esc(md).split('\n');
  const inline = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
  let html = '', inTable = false, inUl = false;
  for (const raw of lines) {
    const L = raw.trimEnd();
    if (/^\|/.test(L)) {
      const cells = L.split('|').slice(1, -1).map(x => x.trim());
      if (/^[\s:\-|]+$/.test(L)) continue;
      if (!inTable) { html += '<table><thead><tr>' + cells.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>'; inTable = true; }
      else html += '<tr>' + cells.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>';
      continue;
    }
    if (inTable) { html += '</tbody></table>'; inTable = false; }
    if (/^### /.test(L)) html += '<h3>' + inline(L.slice(4)) + '</h3>';
    else if (/^## /.test(L)) html += '<h2>' + inline(L.slice(3)) + '</h2>';
    else if (/^# /.test(L)) html += '<h1>' + inline(L.slice(2)) + '</h1>';
    else if (/^>/.test(L)) html += '<blockquote>' + inline(L.replace(/^>\s?/, '')) + '</blockquote>';
    else if (/^[-*] /.test(L)) { if (!inUl) { html += '<ul>'; inUl = true; } html += '<li>' + inline(L.slice(2)) + '</li>'; }
    else if (/^\d+\. /.test(L)) { if (!inUl) { html += '<ul>'; inUl = true; } html += '<li>' + inline(L.replace(/^\d+\.\s*/, '')) + '</li>'; }
    else { if (inUl) { html += '</ul>'; inUl = false; }
      if (!L.trim()) continue;
      if (/^---+$/.test(L.trim())) { html += '<hr>'; continue; }
      html += '<p>' + inline(L) + '</p>'; }
  }
  if (inTable) html += '</tbody></table>';
  if (inUl) html += '</ul>';
  return html;
}

async function saveRisk() {
  try {
    await api('/api/risk/settings', 'POST', { settings: {
      risk_cash_floor: $('rk_cash').value, risk_bank_floor: $('rk_bank').value,
      risk_large_txn: $('rk_large').value, risk_safety_months: $('rk_months').value,
      risk_recon_days: $('rk_recon').value, risk_budget_warn: $('rk_budget').value,
      monitor_refresh: $('rk_refresh').value,
      risk_vat_threshold: $('rk_vat_threshold').value,
      risk_vat_warn_pct: $('rk_vat_warn').value,
      risk_vat_registered: $('rk_vat_registered').value
    }, actor: actor() });
    await loadMeta(); toast('✓ 阈值已保存，预警与大屏刷新已更新'); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}

/* ---------- 发票 / 预算 / 内控动作 ---------- */
function newInvoice() {
  const body = `<div class="frow">
      <div><label>发票号码 *</label><input name="invoice_no" placeholder="如 FP202611001"></div>
      <div><label>发票代码</label><input name="invoice_code"></div>
      <div><label>类型 *</label><select name="kind"><option>进项</option><option>销项</option></select></div>
      <div><label>开票日期 *</label><input type="date" name="invoice_date" value="${today()}"></div>
    </div><div class="frow">
      <div><label>往来单位</label><select name="counterparty_id">${cpOpts()}</select></div>
      <div><label>不含税金额 *</label><input type="number" step="0.01" name="amount"></div>
      <div><label>税额</label><input type="number" step="0.01" name="tax_amount" value="0"></div>
      <div><label>入账科目</label><select name="subject_code">${subjOpts()}</select></div>
      <div><label>项目</label><select name="project_id">${projOpts()}</select></div>
    </div>
    <div><label>备注</label><input name="note" placeholder="业务说明"></div>
    <p class="muted" style="margin-top:10px">登记时会按「发票号码 + 类型」自动查重；生成凭证时进项记「借 费用/进项税、贷 应付账款」，销项记「借 应收账款、贷 收入/销项税」。</p>`;
  openModal('登记发票', body, '登记', async f => {
    await api('/api/invoices', 'POST', {
      invoice_no: fd(f, 'invoice_no'), invoice_code: fd(f, 'invoice_code'),
      kind: fd(f, 'kind'), invoice_date: fd(f, 'invoice_date'),
      counterparty_id: fd(f, 'counterparty_id') || null,
      amount: fnum(f, 'amount'), tax_amount: fnum(f, 'tax_amount'),
      subject_code: fd(f, 'subject_code') || null, project_id: fd(f, 'project_id') || null,
      note: fd(f, 'note'), actor: actor()
    });
    closeModal(); toast('✓ 发票已登记'); render();
  });
}
async function actInvoice(id, action) {
  if (action === 'void' && !confirm('确定作废该发票？')) return;
  if (action === 'post' && !confirm('确认由该发票生成记账凭证？')) return;
  try { await api(`/api/invoices/${id}/${action}`, 'POST', { actor: actor() }); toast('✓ 操作成功'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}
function newBudget() {
  const body = `<div class="frow">
      <div><label>期间 *</label><input type="month" name="period" value="${thisMonth()}"></div>
      <div><label>科目（留空=全部）</label><select name="subject_code"><option value="">全部科目</option>${subjOpts()}</select></div>
      <div><label>项目（留空=全部）</label><select name="project_id">${projOpts()}</select></div>
      <div><label>预算金额 *</label><input type="number" step="0.01" name="amount"></div>
    </div><div><label>备注</label><input name="note"></div>`;
  openModal('设置预算', body, '保存', async f => {
    await api('/api/budgets', 'POST', {
      period: fd(f, 'period'), subject_code: fd(f, 'subject_code') || null,
      project_id: fd(f, 'project_id') || null, amount: fnum(f, 'amount'),
      note: fd(f, 'note'), actor: actor()
    });
    closeModal(); toast('✓ 预算已设置'); render();
  });
}
async function delBudget(id) {
  if (!confirm('确定删除该预算？')) return;
  try { await api('/api/budgets/' + id, 'DELETE'); toast('✓ 已删除'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}
async function verifyChain() {
  try {
    const r = await api('/api/audit/verify');
    toast(r.intact ? `✓ 审计链完整：${r.total} 条记录全部校验通过` : `✗ 检测到 ${r.broken.length} 处异常`, 4000);
    render();
  } catch (e) { toast('✗ ' + e.message, 3500); }
}
async function saveCompliance() {
  try {
    await api('/api/settings', 'POST', { settings: {
      separate_duties: $('setDuties').checked ? '1' : '0',
      budget_control: $('setBudgetCtl').checked ? '1' : '0'
    }, actor: actor() });
    await loadMeta(); toast('✓ 内控设置已保存'); render();
  } catch (e) { toast('✗ ' + e.message, 3500); }
}

/* ---------- 导入导出中心动作 ---------- */
function exportSelected() {
  const keys = ['journal', 'docs', 'vouchers', 'voucher_lines', 'statements', 'daily',
    'subjects', 'projects', 'counterparties', 'bank_accounts', 'audit', 'periods',
    'invoices', 'budgets', 'attachments']
    .filter(k => $('ex_' + k)?.checked);
  if (!keys.length) return toast('请至少选择一张表');
  exportExcel(...keys);
}
async function onOfficeFile(input) {
  const f = input.files[0]; if (!f) return;
  const buf = await f.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  const content = btoa(binary);
  S.officeFilename = f.name; S.officeRaw = content; S.officePreview = null;
  try {
    S.officePreview = await api('/api/import/preview', 'POST', { filename: f.name, content });
    toast('✓ 文件解析完成');
  } catch (e) { toast('✗ ' + e.message, 4000); }
  render();
}
async function execImport() {
  const p = S.officePreview; if (!p || p.kind !== 'table') return;
  const target = $('officeTarget')?.value || S.filters.officeTarget || 'journal';
  if (!confirm(`确认把 ${Math.min(p.total, 200)} 行数据导入「${target}」？导入将生成正式业务数据。`)) return;
  try {
    const r = await api('/api/import/execute', 'POST', {
      target, rows: p.rows, actor: actor(), filename: S.officeFilename
    });
    S.officePreview = null;
    toast(`✓ 成功 ${r.success} 行${r.error_count ? '，失败 ' + r.error_count + ' 行' : ''}`, 4500);
    if (r.error_count) alert('部分行导入失败：\n' + r.errors.join('\n'));
    await loadMeta(); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function registerDoc() {
  try {
    const r = await api('/api/documents/upload', 'POST', {
      filename: S.officeFilename, content: S.officeRaw, actor: actor()
    });
    S.officePreview = null;
    toast(`✓ 已登记（${r.file_type}）`); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
function downloadDoc(id) { window.location.href = '/api/documents/' + id + '/download'; }

