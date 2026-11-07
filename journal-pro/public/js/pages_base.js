/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* ================= 页面 ================= */
const PAGES = {
  dashboard: async () => {
    const [o, monthly, subjects, audit] = await Promise.all([
      api('/api/reports/overview'), api('/api/reports/monthly'), api('/api/reports/subjects'), api('/api/audit')]);
    return `<div class="banner">架构：前端 SPA（/app.js）↔ REST API（/api/*）↔ SQLite 数据库（data/journal.db）；
      业务链路：业务单据 → 审批 → 自动生成凭证 → 过账登记日记账 → 日结核对 / 银行对账 → 月末结账。</div>
      <div class="kpis">
        <div class="kpi"><div class="label">现金账面余额</div><div class="value" style="color:var(--primary-dark)">¥ ${money(o.cash_balance)}</div></div>
        <div class="kpi"><div class="label">银行账面余额</div><div class="value" style="color:var(--green)">¥ ${money(o.bank_balance)}</div></div>
        <div class="kpi"><div class="label">${o.month} 收入</div><div class="value" style="color:var(--primary)">¥ ${money(o.income)}</div></div>
        <div class="kpi"><div class="label">${o.month} 支出</div><div class="value" style="color:var(--orange)">¥ ${money(o.expense)}</div></div>
        <div class="kpi"><div class="label">待审批单据</div><div class="value">${o.pending_docs}</div></div>
        <div class="kpi"><div class="label">待过账凭证</div><div class="value">${o.pending_vouchers}</div></div>
        <div class="kpi"><div class="label">未核对流水</div><div class="value" style="color:var(--red)">${o.unchecked}</div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>各月收入 / 支出</h3><div class="chart-box"><canvas id="c1"></canvas></div></div>
        <div class="card"><h3>科目发生额（借方）</h3><div class="chart-box"><canvas id="c2"></canvas></div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>最近业务动态 <span class="muted">审计留痕</span></h3>
          ${table(audit.items.slice(0, 8), [
            { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
            { t: '操作', f: r => esc(r.action) },
            { t: '对象', f: r => esc(r.entity) },
            { t: '说明', f: r => `<span class="muted">${esc(r.detail)}</span>` },
          ])}</div>
        <div class="card"><h3>快捷入口</h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <button class="btn btn-p" onclick="newDoc()">＋ 新建业务单据</button>
            <button class="btn btn-g" onclick="go('vouchers')">凭证管理</button>
            <button class="btn btn-g" onclick="go('journal')">登记日记账</button>
            <button class="btn btn-g" onclick="go('daily')">日结核对</button>
            <button class="btn btn-g" onclick="go('recon')">银行对账</button>
            <button class="btn btn-g" onclick="go('reports')">报表中心</button>
            <button class="btn btn-p" style="background:var(--green)" onclick="exportPortable()">📦 一键打包换电脑</button>
          </div>
          <div style="margin-top:14px">
            <div class="stat-line"><span>数据库迁移版本</span><b>${S.meta.migrations.map(m => m.version).join(' → ')}</b></div>
            <div class="stat-line"><span>数据库文件</span><b>${esc(S.meta.database)}</b></div>
            <div class="stat-line"><span>会计期间</span><b>${S.meta.periods.map(p => p.period + ' ' + (p.status === 'open' ? '开放' : '结账')).join('、')}</b></div>
          </div>
        </div>
      </div>`;
  },

  docs: async () => {
    const d = await api('/api/docs');
    const typ = S.filters.fDocType || '', st = S.filters.fDocStatus || '';
    const rows = d.items.filter(x => (!typ || x.doc_type === typ) && (!st || x.status === st));
    return `<div class="page-head"><div><h2>业务单据</h2><div class="hint">付款申请 / 收款单 / 备用金借款 / 费用报销 · 草稿 → 提交 → 审批 → 出纳结算</div></div>
      ${EXPORT_BTN('导出 Excel', 'docs')}<button class="btn btn-p" onclick="newDoc()">＋ 新建单据</button></div>
      <div class="card"><div class="toolbar">
        <div><label>单据类型</label><select id="fDocType" onchange="render()">
          <option value="">全部</option>${Object.entries(DOC_LABEL).map(([k, v]) => `<option value="${k}" ${typ === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div><label>状态</label><select id="fDocStatus" onchange="render()">
          <option value="">全部</option>${['draft', 'submitted', 'approved', 'rejected', 'settled', 'cleared'].map(x => `<option value="${x}" ${st === x ? 'selected' : ''}>${({ draft: '草稿', submitted: '待审批', approved: '已审批', rejected: '已驳回', settled: '已结算', cleared: '已核销' })[x]}</option>`).join('')}</select></div>
      </div>
      ${table(rows, [
        { t: '单据号', f: r => `<b>${esc(r.doc_no)}</b>` },
        { t: '类型', f: r => DOC_LABEL[r.doc_type] || r.doc_type },
        { t: '日期', f: r => esc(r.doc_date) },
        { t: '金额', num: true, f: r => `<b>¥ ${money(r.amount)}</b>` },
        { t: '账户', f: r => r.account_kind === 'cash' ? '库存现金' : '银行存款' },
        { t: '对方科目', f: r => esc(r.subject_name || r.subject_code) },
        { t: '项目', f: r => esc(r.project_name || '—') },
        { t: '申请人', f: r => esc(r.applicant || '—') },
        { t: '事由', f: r => `<span class="muted">${esc(r.reason || '—')}</span>` },
        { t: '状态', f: r => statusTag(r.status) },
        { t: '凭证', f: r => esc(r.voucher_no || '—') },
        { t: '操作', f: r => {
            const b = (a, label, cls = 'btn-g') => `<button class="btn ${cls} btn-sm" onclick="actDoc(${r.id},'${a}')">${label}</button>`;
            if (r.status === 'draft') return b('submit', '提交') + b('delete', '删除', 'btn-r');
            if (r.status === 'submitted') return b('approve', '审批通过') + b('reject', '驳回', 'btn-r');
            if (r.status === 'approved') return b('settle', '办理收付款', 'btn-p');
            return '<span class="muted">已完成</span>';
          } },
      ], '没有符合条件的单据')}</div>`;
  },

  vouchers: async () => {
    const d = await api('/api/vouchers');
    return `<div class="page-head"><div><h2>凭证管理</h2><div class="hint">借贷复式记账 · 审核过账后自动登记现金/银行日记账</div></div>
      ${EXPORT_BTN('导出 Excel', 'vouchers', 'voucher_lines')}<button class="btn btn-p" onclick="newVoucher()">＋ 新增凭证</button></div>
      <div class="card">${table(d.items, [
        { t: '凭证号', f: r => `<b>${esc(r.voucher_no)}</b>` },
        { t: '日期', f: r => esc(r.voucher_date) },
        { t: '字', f: r => esc(r.voucher_type) },
        { t: '摘要', f: r => esc(r.summary) },
        { t: '分录', num: true, f: r => r.line_count },
        { t: '借方合计', num: true, f: r => money(r.lines.reduce((s, l) => s + l.debit, 0)) },
        { t: '贷方合计', num: true, f: r => money(r.lines.reduce((s, l) => s + l.credit, 0)) },
        { t: '状态', f: r => statusTag(r.status) + (r.reversed ? '<span class="tag t-void" style="margin-left:4px">已冲销</span>' : '') },
        { t: '分录明细', f: r => `<details><summary class="muted" style="cursor:pointer">查看</summary>
            <div style="padding:8px 0;min-width:340px">${r.lines.map(l => `<div class="stat-line"><span>${esc(l.subject_name || l.subject_code)} ${esc(l.summary || '')}</span>
            <b>借 ${money(l.debit)} / 贷 ${money(l.credit)}</b></div>`).join('')}</div></details>` },
        { t: '操作', f: r => {
            const b = (a, l, cls = 'btn-g') => `<button class="btn ${cls} btn-sm" onclick="actVoucher(${r.id},'${a}')">${l}</button>`;
            if (r.status === 'draft') return b('submit', '提交') + b('post', '直接过账') + b('void', '作废', 'btn-r');
            if (r.status === 'submitted') return b('approve', '审核通过');
            if (r.status === 'approved') return b('post', '过账', 'btn-p');
            if (r.status === 'posted') return b('reverse', '红字冲销', 'btn-r') +
              `<button class="btn btn-g btn-sm" onclick="attachVoucher(${r.id})">📎 附件</button>`;
            return '<span class="muted">—</span>';
          } },
      ], '暂无凭证')}</div>`;
  },

  journal: async () => {
    const kind = S.filters.fKind || '', month = S.filters.fMonth || '', recon = S.filters.fRecon || '';
    const qs = new URLSearchParams();
    if (kind) qs.set('kind', kind); if (month) qs.set('month', month); if (recon) qs.set('recon', recon);
    const [d, o] = await Promise.all([api('/api/journal?' + qs), api('/api/reports/overview')]);
    return `<div class="page-head"><div><h2>现金 / 银行日记账</h2><div class="hint">由已过账凭证自动生成 · 逐笔结出余额 · 支持对账勾销</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'journal')}
      <button class="btn btn-g" onclick="downloadCSV()">⬇ 导出 CSV</button>
      <button class="btn btn-p" onclick="newManual()">＋ 出纳直接登记</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">现金余额</div><div class="value">¥ ${money(o.cash_balance)}</div></div>
        <div class="kpi"><div class="label">银行余额</div><div class="value">¥ ${money(o.bank_balance)}</div></div>
        <div class="kpi"><div class="label">本期收入</div><div class="value" style="color:var(--primary)">¥ ${money(o.income)}</div></div>
        <div class="kpi"><div class="label">本期支出</div><div class="value" style="color:var(--orange)">¥ ${money(o.expense)}</div></div>
      </div>
      <div class="card"><div class="toolbar">
        <div><label>账户</label><select id="fKind" onchange="render()"><option value="">全部</option>
          <option value="cash" ${kind === 'cash' ? 'selected' : ''}>库存现金</option>
          <option value="bank" ${kind === 'bank' ? 'selected' : ''}>银行存款</option></select></div>
        <div><label>月份</label><input type="month" id="fMonth" value="${month}" onchange="render()"></div>
        <div><label>对账状态</label><select id="fRecon" onchange="render()"><option value="">全部</option>
          ${['未核对', '已核对', '已调节'].map(x => `<option ${recon === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div><button class="btn btn-g" onclick="batchRecon()">✓ 当前筛选全部标记已核对</button></div>
      </div>
      ${table(d.items, [
        { t: '日期', f: r => esc(r.journal_date) },
        { t: '账户', f: r => r.account_kind === 'cash' ? '现金' : '银行' },
        { t: '凭证号', f: r => esc(r.voucher_no || '—') },
        { t: '摘要', f: r => esc(r.summary || '—') },
        { t: '对方科目', f: r => esc(r.subject_name || r.subject_code || '—') },
        { t: '项目', f: r => esc(r.project_name || '—') },
        { t: '收入', num: true, f: r => r.direction === 'in' ? `<span class="amt-in">${money(r.amount)}</span>` : '' },
        { t: '支出', num: true, f: r => r.direction === 'out' ? `<span class="amt-out">${money(r.amount)}</span>` : '' },
        { t: '结余', num: true, f: r => `<b>${money(r.balance_after)}</b>` },
        { t: '对账', f: r => `<select style="padding:3px 6px" onchange="setRecon(${r.id},this.value)">
            ${['未核对', '已核对', '已调节'].map(x => `<option ${r.recon_status === x ? 'selected' : ''}>${x}</option>`).join('')}</select>` },
      ], '暂无流水')}</div>`;
  },

  daily: async () => {
    const month = S.filters.dMonth || thisMonth();
    const d = await api('/api/daily?month=' + month);
    const block = (kind, label) => {
      const x = d[kind];
      return `<div class="card"><h3>${label} · 日清月结 <span class="muted">期初 ¥${money(x.opening)} · 期末 ¥${money(x.closing)}</span></h3>
        ${table(x.items, [
          { t: '日期', f: r => `<b>${esc(r.journal_date)}</b>` },
          { t: '本日收入', num: true, f: r => r.income ? `<span class="amt-in">${money(r.income)}</span>` : '' },
          { t: '本日支出', num: true, f: r => r.expense ? `<span class="amt-out">${money(r.expense)}</span>` : '' },
          { t: '本日结出余额', num: true, f: r => `<b>${money(r.balance)}</b>` },
          { t: '实际盘点 / 对账单', num: true, f: r => `<input type="number" step="0.01" style="width:120px;text-align:right" value="${r.counted ?? ''}" onchange="setCheck('${kind}','${r.journal_date}',this.value)">` },
          { t: '差异', num: true, f: r => r.diff === null || r.diff === undefined ? '—' : `<span style="color:${r.diff === 0 ? 'var(--green)' : 'var(--red)'}">${money(r.diff)}</span>` },
          { t: '核对', f: r => r.diff === null || r.diff === undefined ? '<span class="muted">待盘点</span>' :
              (r.diff === 0 ? '<span class="tag t-posted">✓ 账实相符</span>' : '<span class="tag t-rejected">✗ 请核查</span>') },
        ], '本月暂无发生额')}</div>`;
    };
    return `<div class="page-head"><div><h2>日结核对</h2><div class="hint">按日自动汇总收支并结出余额；盘点后填列实际数，自动判断账实相符</div></div>
      ${EXPORT_BTN('导出 Excel', 'daily')}<input type="month" id="dMonth" value="${month}" onchange="render()" style="width:170px"></div>
      ${block('cash', '库存现金')}${block('bank', '银行存款')}`;
  },

  recon: async () => {
    const [r, st, cont] = await Promise.all([api('/api/reconciliation'), api('/api/statements'), api('/api/statements/continuity')]);
    const ambiguous = st.items.filter(x => (x.match_note || '').startsWith('歧义')).length;
    return `<div class="page-head"><div><h2>银行对账</h2><div class="hint">导入银行对账单 → 自动勾对 → 生成余额调节表</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'statements')}
      <button class="btn btn-g" onclick="importStatements()">⬆ 导入对账单</button>
      <button class="btn btn-p" onclick="autoMatch()">⚡ 自动勾对</button></div></div>
      <div class="grid2">
        <div class="card"><h3>银行存款余额调节表 ${r.balanced ? '<span class="tag t-posted">✓ 调节相符</span>' : '<span class="tag t-rejected">✗ 存在差异</span>'}</h3>
          <div class="stat-line"><span>企业银行存款日记账余额</span><b>${money(r.book_balance)}</b></div>
          <div class="stat-line"><span>加：银行已收、企业未收</span><b>${money(r.bank_unrecorded_in)}</b></div>
          <div class="stat-line"><span>减：银行已付、企业未付</span><b>${money(r.bank_unrecorded_out)}</b></div>
          <div class="stat-line" style="background:var(--blue-bg)"><span><b>调节后余额（企业口径）</b></span><b>${money(r.adjusted_book)}</b></div>
          <div class="stat-line"><span>银行对账单余额</span><b>${money(r.statement_balance)}</b></div>
          <div class="stat-line"><span>加：企业已收、银行未收</span><b>${money(r.comp_unrecorded_in)}</b></div>
          <div class="stat-line"><span>减：企业已付、银行未付</span><b>${money(r.comp_unrecorded_out)}</b></div>
          <div class="stat-line" style="background:var(--blue-bg)"><span><b>调节后余额（银行口径）</b></span><b>${money(r.adjusted_bank)}</b></div>
        </div>
        <div class="card"><h3>对账概况</h3>
          <div class="stat-line"><span>对账单笔数</span><b>${r.statement_count}</b></div>
          <div class="stat-line"><span>已匹配</span><b style="color:var(--green)">${r.matched_count}</b></div>
          <div class="stat-line"><span>未匹配银行流水</span><b>${r.unmatched_statements}</b></div>
          <div class="stat-line"><span>未匹配企业日记账</span><b>${r.unmatched_journal}</b></div>
          <div class="stat-line"><span>调节差额</span><b style="color:${r.balanced ? 'var(--green)' : 'var(--red)'}">${money(r.adjusted_book - r.adjusted_bank)}</b></div>
          <div class="stat-line"><span>歧义匹配（不自动勾对）</span><b style="color:${ambiguous ? 'var(--orange)' : 'var(--green)'}">${ambiguous}</b></div>
          <div class="stat-line"><span>对账单连续性</span><b style="color:${cont.balanced ? 'var(--green)' : 'var(--red)'}">${cont.balanced ? '✓ 无缺口' : '✗ ' + cont.issues.length + ' 处提示'}</b></div>
          <p class="muted" style="margin-top:12px">自动勾对规则：方向硬过滤 + 金额精确到分 + 日期 ±3 天；唯一候选才自动匹配，多候选判为「歧义」交人工，绝不硬猜。未匹配项自动进入余额调节表。</p>
        </div>
      </div>
      <div class="card"><h3>银行对账单明细</h3>${table(st.items, [
        { t: '日期', f: x => esc(x.statement_date) },
        { t: '摘要', f: x => esc(x.description || '—') },
        { t: '收入', num: true, f: x => x.amount_in ? `<span class="amt-in">${money(x.amount_in)}</span>` : '' },
        { t: '支出', num: true, f: x => x.amount_out ? `<span class="amt-out">${money(x.amount_out)}</span>` : '' },
        { t: '匹配状态', f: x => x.matched_journal_id ? '<span class="tag t-posted">✓ 已勾对</span>' : '<span class="tag t-submitted">未匹配</span>' },
        { t: '匹配依据 / 说明', f: x => `<span class="muted">${esc(x.match_note || '—')}</span>` },
      ], '尚未导入对账单')}</div>`;
  },

  invoices: async () => {
    const d = await api('/api/invoices');
    return `<div class="page-head"><div><h2>发票管理</h2>
      <div class="hint">进项/销项台账 · 发票号查重防重复入账 · 一键生成凭证 · 核销与账龄追踪</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'invoices')}
      <button class="btn btn-p" onclick="newInvoice()">＋ 登记发票</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">发票总数</div><div class="value">${d.stats.total}</div></div>
        <div class="kpi"><div class="label">未入账发票</div><div class="value" style="color:var(--orange)">${d.stats.unposted}</div></div>
        <div class="kpi"><div class="label">待核销发票</div><div class="value">${d.stats.open}</div></div>
        <div class="kpi"><div class="label">价税合计</div><div class="value">¥ ${money(d.stats.amount)}</div></div>
      </div>
      <div class="card">${table(d.items, [
        { t: '发票号码', f: r => `<b>${esc(r.invoice_no)}</b>` },
        { t: '类型', f: r => `<span class="tag ${r.kind === '进项' ? 't-submitted' : 't-approved'}">${r.kind}</span>` },
        { t: '日期', f: r => esc(r.invoice_date) },
        { t: '往来单位', f: r => esc(r.counterparty_name || '—') },
        { t: '不含税', num: true, f: r => money(r.amount) },
        { t: '税额', num: true, f: r => money(r.tax_amount) },
        { t: '价税合计', num: true, f: r => `<b>${money(r.total_amount)}</b>` },
        { t: '科目', f: r => esc(r.subject_name || r.subject_code || '—') },
        { t: '状态', f: r => `<span class="tag ${r.status === '已核销' ? 't-posted' : (r.status === '已作废' ? 't-void' : (r.status === '已入账' ? 't-approved' : 't-submitted'))}">${r.status}</span>` },
        { t: '凭证', f: r => esc(r.voucher_no || '—') },
        { t: '操作', f: r => r.status === '未入账'
          ? `<button class="btn btn-p btn-sm" onclick="actInvoice(${r.id},'post')">生成凭证</button> <button class="btn btn-r btn-sm" onclick="actInvoice(${r.id},'void')">作废</button>`
          : (r.status === '已入账' ? `<button class="btn btn-g btn-sm" onclick="actInvoice(${r.id},'settle')">核销</button>`
            : '<span class="muted">—</span>') },
      ], '暂无发票，点击「登记发票」开始')}</div>`;
  },

  assets: async () => {
    const period = S.filters.assetPeriod || thisMonth();
    const [d, sch] = await Promise.all([api('/api/assets'), api('/api/assets/schedule?period=' + period)]);
    return `<div class="page-head"><div><h2>固定资产</h2>
      <div class="hint">资产卡片 · 直线法自动折旧 · 一键生成折旧凭证 · 净值与剩余月数</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="assetPeriod" value="${period}" onchange="render()" style="width:165px">
      ${EXPORT_BTN('导出 Excel', 'assets')}
      <button class="btn btn-g" onclick="depreciate()">⚙ 计提本月折旧</button>
      <button class="btn btn-p" onclick="newAsset()">＋ 新增资产</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">资产数量</div><div class="value">${d.summary.count}</div></div>
        <div class="kpi"><div class="label">原值合计</div><div class="value">¥ ${money(d.summary.original)}</div></div>
        <div class="kpi"><div class="label">累计折旧</div><div class="value" style="color:var(--orange)">¥ ${money(d.summary.accumulated)}</div></div>
        <div class="kpi"><div class="label">账面净值</div><div class="value" style="color:var(--primary-dark)">¥ ${money(d.summary.net)}</div></div>
        <div class="kpi"><div class="label">月折旧额</div><div class="value" style="color:var(--primary)">¥ ${money(d.summary.monthly)}</div></div>
      </div>
      <div class="card"><h3>资产台账</h3>${table(d.items, [
        { t: '编号', f: r => `<b>${esc(r.asset_no)}</b>` }, { t: '名称', f: r => esc(r.name) },
        { t: '类别', f: r => esc(r.category) }, { t: '购入日期', f: r => esc(r.purchase_date) },
        { t: '原值', num: true, f: r => money(r.original_value) },
        { t: '残值率', num: true, f: r => (r.salvage_rate * 100).toFixed(0) + '%' },
        { t: '月折旧', num: true, f: r => money(r.monthly) },
        { t: '累计折旧', num: true, f: r => money(r.accumulated) },
        { t: '净值', num: true, f: r => `<b>${money(r.net_value)}</b>` },
        { t: '剩余月', num: true, f: r => r.remaining_months },
        { t: '状态', f: r => `<span class="tag ${r.status === '在用' ? 't-posted' : 't-void'}">${r.status}</span>
            ${r.capitalized ? '<span class="tag t-approved" style="margin-left:4px">已入账</span>' : ''}` },
        { t: '操作', f: r => {
            const btns = [];
            if (!r.capitalized) btns.push(`<button class="btn btn-p btn-sm" onclick="capitalizeAsset(${r.id})">购置入账</button>`);
            if (r.status === '在用') btns.push(`<button class="btn btn-g btn-sm" onclick="actAsset(${r.id},'dispose')">清理</button>`);
            return btns.join(' ') || '—';
          } },
      ], '暂无固定资产')}</div>
      <div class="card"><h3>${esc(period)} 折旧明细 <span class="muted">合计 ${money(sch.total)}</span></h3>
        ${table(sch.items, [
          { t: '资产编号', f: r => esc(r.asset_no) }, { t: '名称', f: r => esc(r.name) },
          { t: '折旧额', num: true, f: r => money(r.amount) },
          { t: '凭证ID', f: r => esc(r.voucher_id || '—') },
        ], '本月尚未计提折旧')}</div>`;
  },

  books: async () => {
    const period = S.filters.bookPeriod || thisMonth();
    const [tb, aging, cash, bud, op, partners] = await Promise.all([
      api('/api/reports/trialbalance?period=' + period), api('/api/reports/aging'),
      api('/api/reports/cashflow'), api('/api/reports/budget?period=' + period),
      api('/api/openings?period=' + period), api('/api/reports/partner')]);
    return `<div class="page-head"><div><h2>账簿与分析</h2>
      <div class="hint">科目余额表 · 现金流量简表 · 往来账龄 · 预算执行（数据全部来自已过账凭证）</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="bookPeriod" value="${period}" onchange="render()" style="width:170px">
      ${EXPORT_BTN('导出 Excel', 'voucher_lines', 'invoices', 'budgets')}</div></div>
      <div class="card"><h3>科目余额表 <span class="muted">${esc(period)} · 借方合计 ${money(tb.debit_total)} / 贷方合计 ${money(tb.credit_total)} ${tb.balanced ? '✓ 试算平衡' : '✗ 不平衡'}</span></h3>
        ${table(tb.items, [
          { t: '编码', f: r => esc(r.subject_code) }, { t: '科目', f: r => esc(r.subject_name || '—') },
          { t: '类别', f: r => esc(r.category || '—') },
          { t: '期初', num: true, f: r => money(r.opening) },
          { t: '本期借方', num: true, f: r => money(r.debit) },
          { t: '本期贷方', num: true, f: r => money(r.credit) },
          { t: '期末余额', num: true, f: r => `<b>${money(r.closing)}</b>` },
        ], '该期间暂无发生额')}</div>
      <div class="grid2">
        <div class="card"><h3>现金流量简表（按科目归集）</h3>
          <div class="stat-line"><span><b>经营流入合计</b></span><b style="color:var(--primary)">${money(cash.in_total)}</b></div>
          ${cash.inflow.map(r => `<div class="stat-line"><span>${esc(r.subject_name || r.subject_code)}（${r.cnt} 笔）</span><b>${money(r.amount)}</b></div>`).join('')}
          <div class="stat-line" style="margin-top:8px"><span><b>经营流出合计</b></span><b style="color:var(--orange)">${money(cash.out_total)}</b></div>
          ${cash.outflow.map(r => `<div class="stat-line"><span>${esc(r.subject_name || r.subject_code)}（${r.cnt} 笔）</span><b>${money(r.amount)}</b></div>`).join('')}
          <div class="stat-line" style="background:var(--blue-bg)"><span><b>净流量</b></span><b>${money(cash.net)}</b></div></div>
        <div class="card"><h3>往来账龄分析</h3>
          ${Object.entries(aging.buckets).map(([k, v]) => `<div class="stat-line"><span>${k}</span><b>${money(v)}</b></div>`).join('')}
          ${table(aging.items.slice(0, 12), [
            { t: '方向', f: r => r.direction }, { t: '发票号', f: r => esc(r.invoice_no) },
            { t: '往来单位', f: r => esc(r.counterparty_name || '—') },
            { t: '账龄(天)', num: true, f: r => r.days },
            { t: '金额', num: true, f: r => money(r.total_amount) },
          ], '暂无未核销往来')}</div>
      </div>
      <div class="card"><h3>预算执行 <button class="btn btn-g btn-sm" onclick="newBudget()">＋ 设置预算</button></h3>
        ${table(bud.items, [
          { t: '期间', f: r => esc(r.period) }, { t: '科目', f: r => esc(r.subject_name || r.subject_code || '全部') },
          { t: '项目', f: r => esc(r.project_name || '全部') },
          { t: '预算', num: true, f: r => money(r.amount) },
          { t: '实际', num: true, f: r => money(r.actual) },
          { t: '剩余', num: true, f: r => money(r.remaining) },
          { t: '执行率', num: true, f: r => r.usage + '%' },
          { t: '状态', f: r => `<span class="tag ${r.status === '超支' ? 't-rejected' : (r.status === '接近上限' ? 't-submitted' : 't-posted')}">${r.status}</span>` },
          { t: '操作', f: r => `<button class="btn btn-r btn-sm" onclick="delBudget(${r.id})">删除</button>` },
        ], '尚未设置预算')}</div>
      <div class="grid2">
        <div class="card"><h3>期初建账 <span class="muted">${esc(op.period)} · 借方 ${money(op.debit_total)} / 贷方 ${money(op.credit_total)} ${op.balanced ? '✓ 试算平衡' : '✗ 不平衡'}</span>
          <button class="btn btn-g btn-sm" onclick="editOpenings()">录入期初余额</button></h3>
          ${table(op.items, [
            { t: '科目', f: r => `${esc(r.subject_code)} ${esc(r.subject_name || '')}` },
            { t: '借方期初', num: true, f: r => money(r.debit) },
            { t: '贷方期初', num: true, f: r => money(r.credit) },
          ], '尚未录入期初余额（新账套可跳过，或从原系统导出后录入）')}</div>
        <div class="card"><h3>往来对账单</h3>
          ${table(partners.items, [
            { t: '往来单位', f: r => esc(r.name) },
            { t: '类型', f: r => esc(r.kind) },
            { t: '未结金额', num: true, f: r => money(r.open_amount) },
            { t: '操作', f: r => `<button class="btn btn-g btn-sm" onclick="partnerStmt(${r.id},'docx')">Word</button>
              <button class="btn btn-g btn-sm" onclick="partnerStmt(${r.id},'xlsx')">Excel</button>` },
          ], '暂无往来单位')}</div>
      </div>`;
  },

  compliance: async () => {
    const c = await api('/api/compliance');
    return `<div class="page-head"><div><h2>内控合规</h2>
      <div class="hint">账本不可变 · 哈希链审计 · 职责分离 · 对账规则 · 结账检查</div></div>
      <button class="btn btn-p" onclick="verifyChain()">🔍 校验审计链</button></div>
      <div class="kpis">
        <div class="kpi"><div class="label">审计链状态</div><div class="value" style="color:${c.chain.intact ? 'var(--green)' : 'var(--red)'};font-size:18px">${c.chain.intact ? '✓ 完整未篡改' : '✗ 检测到 ' + c.chain.broken.length + ' 处异常'}</div></div>
        <div class="kpi"><div class="label">审计记录</div><div class="value">${c.chain.total}</div></div>
        <div class="kpi"><div class="label">不可变触发器</div><div class="value">${c.triggers.length}</div></div>
        <div class="kpi"><div class="label">职责分离</div><div class="value" style="font-size:18px">${c.separate_duties ? '已启用' : '已关闭'}</div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>内控策略（已落实到代码与数据库）</h3>
          ${c.policies.map((p, i) => `<div class="stat-line"><span>${i + 1}. ${esc(p)}</span><b style="color:var(--green)">✓</b></div>`).join('')}
          <p class="muted" style="margin-top:10px">数据库触发器：${c.triggers.map(t => esc(t)).join('、')}</p></div>
        <div class="card"><h3>治理开关</h3>
          <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text);margin-bottom:10px">
            <input type="checkbox" id="setDuties" style="width:auto" ${c.separate_duties ? 'checked' : ''}>
            职责分离：制单/审核/过账必须由不同操作员完成</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text);margin-bottom:12px">
            <input type="checkbox" id="setBudgetCtl" style="width:auto" ${c.budget_control ? 'checked' : ''}>
            预算控制：超预算的付款/报销单据禁止结算</label>
          <button class="btn btn-p" onclick="saveCompliance()">保存设置</button>
          <div style="margin-top:14px;padding:10px;background:var(--blue-bg);border-radius:6px;font-size:12.5px">
            提示：单人使用时可关闭「职责分离」以便一人完成制单到过账；关闭后所有操作仍完整留痕在审计链中。</div>
        </div>
      </div>`;
  },

  periods: async () => {
    const [d, ck] = await Promise.all([api('/api/periods'), api('/api/closing/checklist?period=' + thisMonth())]);
    return `<div class="page-head"><div><h2>期末结账</h2><div class="hint">结账后该期间禁止新增/修改单据与凭证；如有错账需先反结账</div></div>
      ${EXPORT_BTN('导出 Excel', 'periods')}</div>
      <div class="card"><h3>结账检查清单 · ${esc(ck.period)} ${ck.can_close ? '<span class="tag t-posted">✓ 可以结账</span>' : '<span class="tag t-rejected">✗ 存在阻断项</span>'}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px">
          ${ck.items.map(x => `<div class="stat-line"><span>${x.block ? '🚫' : '⚠'} ${esc(x.name)}</span>
            <b style="color:${x.pass ? 'var(--green)' : (x.block ? 'var(--red)' : 'var(--orange)')}">${x.count} ${x.pass ? '✓' : ''}</b></div>`).join('')}
        </div>
        <p class="muted" style="margin-top:10px">🚫 为阻断项，必须清零才能结账；⚠ 为提醒项，建议处理后结账。</p></div>
      <div class="banner">结账前置条件由系统自动校验：凭证全部过账、单据完成审批结算、借贷平衡；另会提醒未核对流水、未匹配银行流水、歧义匹配、未入账发票与预算超支。</div>
      <div class="card">${table(d.items, [
        { t: '会计期间', f: r => `<b>${esc(r.period)}</b>` },
        { t: '状态', f: r => statusTag(r.status) },
        { t: '结账时间', f: r => esc(r.closed_at || '—') },
        { t: '结账人', f: r => esc(r.closed_by || '—') },
        { t: '操作', f: r => r.status === 'open'
          ? `<button class="btn btn-g btn-sm" onclick="carryForward('${r.period}')">结转损益</button>
             <button class="btn btn-p btn-sm" onclick="periodAct('${r.period}','close')">月末结账</button>`
          : `<button class="btn btn-r btn-sm" onclick="periodAct('${r.period}','reopen')">反结账</button>` },
      ], '暂无会计期间')}</div>`;
  },

  reports: async () => {
    const [m, p, s, o] = await Promise.all([
      api('/api/reports/monthly'), api('/api/reports/projects'),
      api('/api/reports/subjects'), api('/api/reports/overview')]);
    return `<div class="page-head"><div><h2>报表中心</h2><div class="hint">数据全部来自已过账凭证，口径可追溯</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'journal', 'voucher_lines', 'subjects')}
      <button class="btn btn-g" onclick="exportOffice('docx')">⬇ Word 报告</button>
      <button class="btn btn-g" onclick="exportOffice('pptx')">⬇ PPT 汇报</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">累计收入</div><div class="value" style="color:var(--primary)">¥ ${money(m.items.reduce((a, x) => a + x.income, 0))}</div></div>
        <div class="kpi"><div class="label">累计支出</div><div class="value" style="color:var(--orange)">¥ ${money(m.items.reduce((a, x) => a + x.expense, 0))}</div></div>
        <div class="kpi"><div class="label">记账月份</div><div class="value">${m.items.length}</div></div>
        <div class="kpi"><div class="label">期末资金合计</div><div class="value">¥ ${money(o.cash_balance + o.bank_balance)}</div></div>
      </div>
      <div class="card"><h3>各月收支对比</h3><div class="chart-box"><canvas id="c1"></canvas></div></div>
      <div class="grid2">
        <div class="card"><h3>项目收支汇总</h3>${table(p.items, [
          { t: '项目', f: r => `<b>${esc(r.project)}</b>` },
          { t: '借方发生额', num: true, f: r => money(r.debit) },
          { t: '贷方发生额', num: true, f: r => money(r.credit) },
          { t: '分录数', num: true, f: r => r.cnt },
        ])}</div>
        <div class="card"><h3>科目发生额汇总</h3>${table(s.items, [
          { t: '编码', f: r => esc(r.subject_code) },
          { t: '科目', f: r => esc(r.subject_name || '—') },
          { t: '类别', f: r => esc(r.category || '—') },
          { t: '借方', num: true, f: r => money(r.debit) },
          { t: '贷方', num: true, f: r => money(r.credit) },
        ])}</div>
      </div>
      <div class="card"><h3>月度明细</h3>${table(m.items, [
        { t: '月份', f: r => `<b>${esc(r.period)}</b>` },
        { t: '收入', num: true, f: r => `<span class="amt-in">${money(r.income)}</span>` },
        { t: '支出', num: true, f: r => `<span class="amt-out">${money(r.expense)}</span>` },
        { t: '净流入', num: true, f: r => `<b style="color:${r.income - r.expense >= 0 ? 'var(--green)' : 'var(--red)'}">${money(r.income - r.expense)}</b>` },
        { t: '流水笔数', num: true, f: r => r.cnt },
      ])}</div>`;
  },

  office: async () => {
    const [docs, logs] = await Promise.all([api('/api/documents'), api('/api/import/logs')]);
    const target = S.filters.officeTarget || 'journal';
    const preview = S.officePreview;
    const tables = [['journal', '日记账'], ['docs', '业务单据'], ['vouchers', '记账凭证'],
      ['voucher_lines', '凭证明细'], ['statements', '银行对账单'], ['daily', '日结核对'],
      ['subjects', '会计科目'], ['projects', '核算项目'], ['counterparties', '往来单位'],
      ['bank_accounts', '银行账户'], ['audit', '审计日志'], ['periods', '会计期间'],
      ['invoices', '发票台账'], ['budgets', '预算'], ['attachments', '文档附件'],
      ['assets', '固定资产'], ['openings', '期初余额']];
    return `<div class="page-head"><div><h2>导入导出中心</h2>
      <div class="hint">Excel / CSV 表格双向导入导出 · Word 财务报告 · PPT 工作汇报 · Office 文档登记</div></div></div>
      <div class="grid2">
        <div class="card"><h3>⬇ 导出 Excel 工作簿（可多选工作表）</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px 12px;margin-bottom:12px">
            ${tables.map(([k, v], i) => `<label style="display:flex;align-items:center;gap:5px;font-size:13px;color:var(--text)">
              <input type="checkbox" id="ex_${k}" style="width:auto" ${k === 'journal' ? 'checked' : ''}>${v}</label>`).join('')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-p" onclick="exportSelected()">⬇ 导出选中表 (.xlsx)</button>
            <button class="btn btn-g" onclick="exportExcel(${tables.map(t => "'" + t[0] + "'").join(',')})">⬇ 导出全部表</button>
          </div>
        </div>
        <div class="card"><h3>⬇ 导出 Word / PPT / 其他格式</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <button class="btn btn-p" onclick="exportOffice('docx')">⬇ Word 财务报告 (.docx)</button>
            <button class="btn btn-p" onclick="exportOffice('pptx')">⬇ PPT 工作汇报 (.pptx)</button>
            <button class="btn btn-g" onclick="downloadCSV()">⬇ 日记账 CSV</button>
            <button class="btn btn-g" onclick="backupJSON()">⬇ 全量备份 JSON</button>
          </div>
          <p class="muted">Word 报告含：资金概况、月度收支、项目/科目发生额、余额调节表、日记账明细（真实 Word 表格）；
          PPT 含封面、资金概况、月度收支表、项目表、余额调节页（真实 PPT 表格）。</p>
        </div>
      </div>
      <div class="card"><h3>⬆ 导入 Excel / CSV 表格数据</h3>
        <div class="toolbar">
          <div><label>导入目标</label><select id="officeTarget" onchange="S.officePreview=null;render()">
            ${Object.entries({ journal: '日记账（自动生成凭证）', docs: '业务单据（草稿）',
              vouchers: '记账凭证及分录', statements: '银行对账单', subjects: '会计科目',
              projects: '核算项目', counterparties: '往来单位', bank_accounts: '银行账户',
              invoices: '发票台账', budgets: '预算' })
              .map(([k, v]) => `<option value="${k}" ${target === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div><button class="btn btn-g" onclick="template('${target}')">⬇ 下载导入模板</button></div>
          <div style="flex:1"><label>选择文件 (.xlsx / .csv / .docx / .pptx / .txt / .md)</label>
            <input type="file" id="officeFile" accept=".xlsx,.csv,.docx,.pptx,.txt,.md" onchange="onOfficeFile(this)"></div>
        </div>
        ${preview ? (preview.kind === 'table' ? `
          <div class="banner">已解析「${esc(S.officeFilename)}」工作表 ${esc(preview.sheet)}：共 ${preview.total} 行数据，下面预览前 ${Math.min(preview.rows.length, 5)} 行。
          导入目标「<b>${esc($('officeTarget')?.options[$('officeTarget').selectedIndex]?.text || target)}</b>」，导入将走与界面一致的业务校验。</div>
          ${table(preview.rows.slice(0, 5), preview.headers.map(h => ({ t: esc(h), f: r => `<span class="muted">${esc(r[h])}</span>` })))}
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-p" onclick="execImport()">✓ 确认导入 ${Math.min(preview.total, 200)} 行</button>
            <button class="btn btn-g" onclick="S.officePreview=null;render()">清除预览</button></div>`
          : `<div class="banner">检测到 <b>${esc(preview.file_type)}</b>，属于非结构化文档，将登记为附件并提取文本（共 ${preview.total} 行文本）。</div>
          <div style="max-height:180px;overflow:auto;background:var(--grey-bg);padding:10px;border-radius:6px;font-size:12.5px">
            ${preview.lines.slice(0, 20).map(l => `<div>${esc(l)}</div>`).join('')}</div>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-p" onclick="registerDoc()">✓ 登记为附件</button>
            <button class="btn btn-g" onclick="S.officePreview=null;render()">清除预览</button></div>`)
        : '<div class="empty">选择文件后会自动解析并预览；建议先下载导入模板按格式填写</div>'}
      </div>
      <div class="grid2">
        <div class="card"><h3>已登记文档附件</h3>${table(docs.items, [
          { t: '文件名', f: r => esc(r.filename) }, { t: '类型', f: r => esc(r.file_type) },
          { t: '大小', num: true, f: r => (r.size / 1024).toFixed(1) + ' KB' },
          { t: '上传人', f: r => esc(r.uploaded_by) },
          { t: '摘要', f: r => `<span class="muted">${esc(r.excerpt || '')}</span>` },
          { t: '操作', f: r => `<button class="btn btn-g btn-sm" onclick="downloadDoc(${r.id})">下载</button>` },
        ], '暂无文档附件')}</div>
        <div class="card"><h3>导入日志</h3>${table(logs.items, [
          { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
          { t: '目标', f: r => esc(r.target) }, { t: '文件', f: r => esc(r.filename) },
          { t: '成功', num: true, f: r => `<span style="color:var(--green)">${r.success_count}</span>` },
          { t: '失败', num: true, f: r => `<span style="color:var(--red)">${r.error_count}</span>` },
          { t: '说明', f: r => `<span class="muted">${esc(r.detail || '')}</span>` },
        ], '暂无导入记录')}</div>
      </div>`;
  },

  base: async () => {
    await loadMeta();
    const subj = S.meta.subjects, proj = S.meta.projects, cp = S.meta.counterparties, bank = S.meta.bank_accounts;
    return `<div class="page-head"><div><h2>基础资料</h2><div class="hint">会计科目 / 核算项目 / 往来单位 / 银行账户</div></div>
      ${EXPORT_BTN('导出 Excel', 'subjects', 'projects', 'counterparties', 'bank_accounts')}</div>
      <div class="grid2">
        <div class="card"><h3>会计科目 <button class="btn btn-g btn-sm" onclick="newBase('subjects')">＋ 新增</button></h3>
          ${table(subj, [
            { t: '编码', f: r => esc(r.code) }, { t: '名称', f: r => esc(r.name) },
            { t: '类别', f: r => esc(r.category) }, { t: '余额方向', f: r => esc(r.direction) },
          ])}</div>
        <div class="card"><h3>核算项目 <button class="btn btn-g btn-sm" onclick="newBase('projects')">＋ 新增</button></h3>
          ${table(proj, [
            { t: 'ID', f: r => r.id }, { t: '名称', f: r => esc(r.name) },
            { t: '操作', f: r => `<button class="btn btn-r btn-sm" onclick="delBase('projects',${r.id})">停用</button>` },
          ])}</div>
        <div class="card"><h3>往来单位 <button class="btn btn-g btn-sm" onclick="newBase('counterparties')">＋ 新增</button></h3>
          ${table(cp, [
            { t: 'ID', f: r => r.id }, { t: '名称', f: r => esc(r.name) },
            { t: '类型', f: r => esc(r.kind) },
            { t: '操作', f: r => `<button class="btn btn-r btn-sm" onclick="delBase('counterparties',${r.id})">停用</button>` },
          ])}</div>
        <div class="card"><h3>银行账户 <button class="btn btn-g btn-sm" onclick="newBase('bank_accounts')">＋ 新增</button></h3>
          ${table(bank, [
            { t: '账户', f: r => esc(r.name) }, { t: '开户行', f: r => esc(r.bank_name || '—') },
            { t: '账号', f: r => esc(r.account_no || '—') },
            { t: '期初余额', num: true, f: r => money(r.opening_balance) },
          ])}</div>
      </div>`;
  },

  monitor: async () => {
    const d = await api('/api/monitor'); S._monitor = d;
    const lvBadge = { 高: 'high', 中: 'medium', 低: 'low' };
    return `<div class="bigscreen">
      <div class="bs-title"><h2>资 金 监 控 中 心</h2>
        <div><span class="live">实时监控中</span>　<span class="muted">每 ${d.refresh} 秒自动刷新 · ${esc(d.month_income !== undefined ? '' : '')}数据来自 SQLite</span></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">库存现金</div><div class="value">¥ ${money(d.cash)}</div></div>
        <div class="kpi"><div class="label">银行存款</div><div class="value">¥ ${money(d.bank)}</div></div>
        <div class="kpi"><div class="label">资金合计</div><div class="value" style="color:#7EB3FF">¥ ${money(d.total)}</div></div>
        <div class="kpi"><div class="label">今日流入 / 流出</div><div class="value" style="font-size:16px"><span style="color:#60A5FA">${money(d.today_income)}</span> / <span style="color:#F59E0B">${money(d.today_expense)}</span></div></div>
        <div class="kpi"><div class="label">本月净流入</div><div class="value" style="color:${d.month_net >= 0 ? '#34D399' : '#F87171'}">¥ ${money(d.month_net)}</div></div>
        <div class="kpi"><div class="label">现金安全月数</div><div class="value" style="color:${d.safety_months !== null && d.safety_months < 3 ? '#F87171' : '#34D399'}">${d.safety_months === null ? '—' : d.safety_months + ' 个月'}</div></div>
        <div class="kpi"><div class="label">风险预警</div><div class="value" style="font-size:17px">
          <span style="color:#F87171">高 ${d.alerts_summary.high}</span> ·
          <span style="color:#FCD34D">中 ${d.alerts_summary.medium}</span> ·
          <span style="color:#93C5FD">低 ${d.alerts_summary.low}</span></div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>近 14 天收支</h3><div class="chart-box"><canvas id="mTrend"></canvas></div></div>
        <div class="card"><h3>近 6 个月趋势</h3><div class="chart-box"><canvas id="mMonths"></canvas></div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>风险预警（当前）</h3>
          ${d.alerts_top.length ? d.alerts_top.map(x => `<div class="bs-alert"><span class="lv ${lvBadge[x.level] || 'low'}">${x.level}</span>
            <div><b>${esc(x.title)}</b><div class="d">${esc(x.detail)}</div></div></div>`).join('')
            : '<div class="empty" style="color:#34D399">✓ 当前无风险预警</div>'}
          <div class="muted" style="margin-top:6px">完整列表见「风险预警」模块</div></div>
        <div class="card"><h3>项目资金构成（借方）</h3><div class="chart-box"><canvas id="mProj"></canvas></div></div>
      </div>
      <div class="card"><h3>最新流水</h3>${table(d.recent, [
        { t: '日期', f: r => esc(r.journal_date) },
        { t: '账户', f: r => r.account_kind === 'cash' ? '现金' : '银行' },
        { t: '凭证号', f: r => esc(r.voucher_no || '—') },
        { t: '摘要', f: r => esc(r.summary || '—') },
        { t: '收入', num: true, f: r => r.direction === 'in' ? `<span class="amt-in">${money(r.amount)}</span>` : '' },
        { t: '支出', num: true, f: r => r.direction === 'out' ? `<span class="amt-out">${money(r.amount)}</span>` : '' },
        { t: '结余', num: true, f: r => `<b>${money(r.balance_after)}</b>` },
      ])}</div>
    </div>`;
  },

  risk: async () => {
    const d = await api('/api/alerts');
    const cls = { 高: 'alert-high', 中: 'alert-medium', 低: 'alert-low' };
    return `<div class="page-head"><div><h2>风险预警</h2>
      <div class="hint">按可量化规则实时扫描 · 检查时间 ${esc(d.checked_at)} · 阈值可在下方调整</div></div>
      <button class="btn btn-p" onclick="render()">⟳ 立即重新扫描</button></div>
      <div class="kpis">
        <div class="kpi"><div class="label">高风险</div><div class="value" style="color:var(--red)">${d.summary.high}</div></div>
        <div class="kpi"><div class="label">中风险</div><div class="value" style="color:var(--orange)">${d.summary.medium}</div></div>
        <div class="kpi"><div class="label">低风险</div><div class="value" style="color:var(--primary)">${d.summary.low}</div></div>
        <div class="kpi"><div class="label">整体状态</div><div class="value" style="font-size:17px;color:${d.summary.high ? 'var(--red)' : (d.summary.medium ? 'var(--orange)' : 'var(--green)')}">${d.summary.high ? '需要处理' : (d.summary.medium ? '需要关注' : '健康')}</div></div>
      </div>
      <div class="card">${d.items.length ? d.items.map(x => `<div class="bs-alert"><span class="tag ${cls[x.level]}">${x.level}</span>
        <div style="flex:1"><b>${esc(x.title)}</b>　<span class="tag t-draft">${esc(x.category)}</span>
        <div class="muted" style="margin-top:3px">${esc(x.detail)}</div></div></div>`).join('')
        : '<div class="empty" style="color:var(--green)">✓ 当前无风险预警，继续保持</div>'}</div>
      <div class="card"><h3>预警阈值设置</h3>
        <div class="frow">
          <div><label>现金安全线（元）</label><input type="number" step="0.01" id="rk_cash" value="${d.settings.risk_cash_floor}"></div>
          <div><label>银行安全线（元）</label><input type="number" step="0.01" id="rk_bank" value="${d.settings.risk_bank_floor}"></div>
          <div><label>大额收支标准（元）</label><input type="number" step="0.01" id="rk_large" value="${d.settings.risk_large_txn}"></div>
          <div><label>现金安全月数警戒</label><input type="number" step="0.1" id="rk_months" value="${d.settings.risk_safety_months}"></div>
          <div><label>流水核对天数</label><input type="number" id="rk_recon" value="${d.settings.risk_recon_days}"></div>
          <div><label>预算提醒线（%）</label><input type="number" id="rk_budget" value="${d.settings.risk_budget_warn}"></div>
          <div><label>大屏刷新（秒）</label><input type="number" id="rk_refresh" value="${d.settings.monitor_refresh}"></div>
        </div>
        <button class="btn btn-p" onclick="saveRisk()">保存阈值</button>
        <p class="muted" style="margin-top:8px">规则来自业界实践：现金安全月数 = 可用资金 ÷ 月均刚性支出（近 3 月），低于警戒线说明"还能撑多久"出了问题。</p></div>`;
  },

  audit: async () => {
    const qs = new URLSearchParams();
    const from = S.filters.aFrom || '', to = S.filters.aTo || '', act = S.filters.aActor || '', ent = S.filters.aEntity || '', q = S.filters.aQ || '';
    if (from) qs.set('from', from); if (to) qs.set('to', to); if (act) qs.set('actor', act);
    if (ent) qs.set('entity', ent); if (q) qs.set('q', q);
    const [d, st] = await Promise.all([api('/api/audit?' + qs), api('/api/audit/stats')]);
    S._auditStats = st;
    const SENSITIVE = ['删除单据', '红字冲销', '月末结账', '反结账', '恢复备份', '清空', '导入整站迁移包', '删除预算', '作废凭证', '修改预警阈值', '作废发票', '资产处理'];
    return `<div class="page-head"><div><h2>审计中心</h2>
      <div class="hint">全部操作留痕 · 哈希链防篡改 · 敏感操作单独标记 · 可导出</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'audit')}
      <button class="btn btn-p" onclick="verifyChain()">🔍 校验哈希链</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">审计记录总数</div><div class="value">${st.total}</div></div>
        <div class="kpi"><div class="label">筛选结果</div><div class="value">${d.items.length}</div></div>
        <div class="kpi"><div class="label">敏感操作（最近）</div><div class="value" style="color:var(--orange)">${st.sensitive.length}</div></div>
        <div class="kpi"><div class="label">哈希链</div><div class="value" style="font-size:16px;color:var(--green)" id="chainBadge">待校验</div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>近 14 天操作量</h3><div class="chart-box"><canvas id="aDay"></canvas></div></div>
        <div class="card"><h3>操作类型分布</h3><div class="chart-box"><canvas id="aAction"></canvas></div></div>
      </div>
      <div class="card"><h3>敏感操作（删除 / 冲销 / 结账 / 备份恢复 / 阈值修改）</h3>
        ${table(st.sensitive, [
          { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
          { t: '操作人', f: r => esc(r.actor || '—') },
          { t: '操作', f: r => `<span class="tag t-rejected">${esc(r.action)}</span>` },
          { t: '对象', f: r => `${esc(r.entity)}${r.entity_id ? '#' + esc(r.entity_id) : ''}` },
          { t: '说明', f: r => `<span class="muted">${esc(r.detail || '')}</span>` },
        ], '暂无敏感操作记录')}</div>
      <div class="card"><h3>审计日志查询</h3>
        <div class="toolbar">
          <div><label>日期从</label><input type="date" id="aFrom" value="${from}" onchange="render()"></div>
          <div><label>日期至</label><input type="date" id="aTo" value="${to}" onchange="render()"></div>
          <div><label>操作人</label><input id="aActor" value="${esc(act)}" onchange="render()" placeholder="如 出纳"></div>
          <div><label>对象类型</label><select id="aEntity" onchange="render()"><option value="">全部</option>
            ${['doc', 'voucher', 'journal', 'invoice', 'asset', 'budget', 'period', 'attachment', 'system', 'settings', 'opening', 'bank_statement', 'audit'].map(x => `<option ${ent === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div style="flex:1"><label>关键词</label><input id="aQ" value="${esc(q)}" oninput="S.filters.aQ=this.value;clearTimeout(this._t);this._t=setTimeout(render,400)" placeholder="操作/说明/编号"></div>
        </div>
        ${table(d.items, [
          { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
          { t: '操作人', f: r => esc(r.actor || '—') },
          { t: '操作', f: r => (SENSITIVE.includes(r.action) ? '<span class="tag t-rejected">' + esc(r.action) + '</span>' : esc(r.action)) },
          { t: '对象', f: r => `${esc(r.entity)}${r.entity_id ? '#' + esc(r.entity_id) : ''}` },
          { t: '说明', f: r => `<span class="muted">${esc(r.detail || '')}</span>` },
        ], '没有符合条件的审计记录')}</div>`;
  },

  help: async () => {
    const lang = S.filters.manualLang || 'zh';
    const m = await api('/api/manual?lang=' + lang);
    return `<div class="page-head"><div><h2>帮助中心 · 用户手册 Help Center · User Manual</h2>
      <div class="hint">更新时间 ${esc(m.updated_at)} · 源文件 docs/${lang === 'en' ? 'User_Manual_EN.md' : '用户手册.md'} · 随系统离线可用</div></div>
      <select onchange="S.filters.manualLang=this.value;render()" style="width:130px">
        <option value="zh" ${lang === 'zh' ? 'selected' : ''}>中文手册</option>
        <option value="en" ${lang === 'en' ? 'selected' : ''}>English Manual</option></select></div>
      <div class="card manual">${mdToHtml(m.content)}</div>`;
  },

  partner: async () => {
    await loadMeta();
    const cp = S.filters.plCp || '';
    const cps = await api('/api/reports/partner');
    if (!cp) {
      return `<div class="page-head"><div><h2>往来账（客户 / 供应商）</h2>
        <div class="hint">按往来单位归集：销项/进项发票、收付款（含日期与凭证号）、其他往来分录，逐笔余额</div></div></div>
        <div class="card"><h3>选择往来单位查看明细账</h3>
        ${table(cps.items, [
          { t: '名称', f: r => `<b>${esc(r.name)}</b>` },
          { t: '类型', f: r => esc(r.kind) },
          { t: '未结发票金额', num: true, f: r => money(r.open_amount) },
          { t: '操作', f: r => `<button class="btn btn-p btn-sm" onclick="S.filters.plCp='${r.id}';render()">查看往来明细账 →</button>` },
        ], '暂无往来单位，请先在基础资料中添加')}</div>`;
    }
    const d = await api('/api/partner-ledger?counterparty_id=' + cp);
    const c = d.counterparty || {};
    return `<div class="page-head"><div><h2>往来明细账 · ${esc(c.name || '')}</h2>
      <div class="hint">类型：${esc(c.kind || '—')} · ${esc(d.balance_text)} · 借方合计 ¥${money(d.total_debit)} · 贷方合计 ¥${money(d.total_credit)}</div></div>
      <div style="display:flex;gap:8px">
        <select onchange="S.filters.plCp=this.value;render()" style="width:170px">
          <option value="">— 换人 —</option>
          ${cps.items.map(x => `<option value="${x.id}" ${String(x.id) === String(cp) ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}
        </select>
        <button class="btn btn-g" onclick="partnerStmt(${cp},'docx')">⬇ Word 对账单</button>
        <button class="btn btn-g" onclick="partnerStmt(${cp},'xlsx')">⬇ Excel 对账单</button>
        <button class="btn btn-ghost btn-sm" onclick="S.filters.plCp='';render()">← 返回列表</button>
      </div></div>
      <div class="banner">余额为正 = 该单位欠我方（应收）；余额为负 = 我方欠该单位（应付）。发票行可直接核销；收付款行来自日记账（含凭证号与日期）。</div>
      <div class="card">${table(d.items, [
        { t: '日期', f: r => esc(r.date) },
        { t: '类型', f: r => esc(r.doc) },
        { t: '单据号', f: r => esc(r.doc_no || '—') },
        { t: '凭证号', f: r => esc(r.voucher_no || '—') },
        { t: '摘要', f: r => esc(r.summary || '—') },
        { t: '借方（对方欠↑ / 我方付↑）', num: true, f: r => r.debit ? `<span class="amt-in">${money(r.debit)}</span>` : '' },
        { t: '贷方（开票↑ / 收款↑）', num: true, f: r => r.credit ? `<span class="amt-out">${money(r.credit)}</span>` : '' },
        { t: '余额', num: true, f: r => `<b style="color:${r.balance > 0 ? 'var(--primary-dark)' : (r.balance < 0 ? 'var(--orange)' : 'var(--green)')}">${money(r.balance)}</b>` },
        { t: '发票核对', f: r => r.ref.startsWith('invoice:') ? (
            r.invoice_status === '已入账' ? `<button class="btn btn-g btn-sm" onclick="actInvoice(${r.ref.split(':')[1]},'settle')">✓ 核销</button>`
            : `<span class="muted">${esc(r.invoice_status)}</span>`) : '—' },
      ], '该往来单位暂无业务')}</div>`;
  },

  fin: async () => {
    const period = S.filters.frPeriod || thisMonth();
    const [bs, inc, art, cfYtd, cfCur] = await Promise.all([
      api('/api/reports/balance-sheet?period=' + period),
      api('/api/reports/income?period=' + period),
      api('/api/reports/articulation?period=' + period),
      api('/api/reports/cashflow?period=' + period + '&scope=ytd'),
      api('/api/reports/cashflow?period=' + period + '&scope=current')]);
    const moneyRow = r => `<td class="num"><b>${money(r.amount)}</b></td>`;
    const line = r => `<tr><td>${esc(r.item)}${r.reclass ? `<div class="muted" style="font-size:11px;line-height:1.5">↳ ${esc(r.reclass)}</div>` : ''}</td>${moneyRow(r)}</tr>`;
    const detail = arr => arr.filter(x => !x._nosum).reduce((s, x) => s + x.amount, 0);
    const assetOK = Math.abs(detail(bs.assets) - bs.total_assets) < 0.005;
    const cfMap = c => {
      const o = {};
      const put = (k, name, field, v) => { (o[k] = o[k] || { name, i: 0, o: 0 })[field] = v; };
      (c.inflow || []).forEach(r => put(r.subject_code || '未指定', r.subject_name || r.subject_code || '未指定科目', 'i', r.amount));
      (c.outflow || []).forEach(r => put(r.subject_code || '未指定', r.subject_name || r.subject_code || '未指定科目', 'o', r.amount));
      return o;
    };
    const my = cfMap(cfYtd), mc = cfMap(cfCur);
    const cfRows = Object.keys(my).sort().map(k => {
      const y = my[k], c = mc[k] || { name: y.name, i: 0, o: 0 };
      return `<tr><td>${esc(y.name)}</td><td class="num">${money(c.i)}</td><td class="num">${money(c.o)}</td>
        <td class="num">${money(y.i)}</td><td class="num">${money(y.o)}</td><td class="num"><b>${money(y.i - y.o)}</b></td></tr>`;
    }).join('');
    return `<div class="page-head"><div><h2>财务报表</h2>
      <div class="hint">资产负债表 · 利润表 · 现金流量简表 · 三大勾稽自动核对｜累计数按自然年度截断（本期 ${esc(inc.year)} 年 ${esc(inc.cum_scope)}）</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="frPeriod" value="${period}" onchange="render()" style="width:165px">
      <button class="btn btn-g" onclick="window.open('/api/export/finreports.xlsx?period=${period}')">⬇ 导出报表 Excel（含编制口径）</button></div></div>
      <div class="banner">勾稽关系：① 资产 = 负债 + 所有者权益　② 账套累计净利润（分年度汇总）= 资产负债表留存收益　③ 出纳日记账现金流量净额 = 总账货币资金变动</div>
      <div class="card"><h3>勾稽关系核对 ${art.all_pass ? '<span class="tag t-posted">✓ 三大勾稽全部相符</span>' : '<span class="tag t-rejected">✗ 存在不平项</span>'}</h3>
        ${table(art.checks, [
          { t: '勾稽关系', f: r => `<b>${esc(r.name)}</b>` },
          { t: '左边', f: r => esc(r.left) },
          { t: '右边', f: r => esc(r.right) },
          { t: '结果', f: r => r.pass ? '<span class="tag t-posted">✓ 相符</span>' : `<span class="tag t-rejected">差额 ${money(r.diff)}</span>` },
          { t: '说明', f: r => `<span class="muted">${esc(r.explain)}</span>` },
        ])}</div>
      <div class="grid2">
        <div class="card"><h3>资产负债表 <span class="muted">截至 ${esc(period)}</span>
          <span class="tag ${bs.balanced ? 't-posted' : 't-rejected'}">${bs.balanced ? '✓ 平衡' : '✗ 差额 ' + money(bs.diff)}</span>
          ${assetOK ? '<span class="tag t-posted">✓ 明细=合计</span>' : '<span class="tag t-rejected">✗ 明细与合计不符</span>'}</h3>
          <table><thead><tr><th>资产</th><th class="num">金额</th></tr></thead><tbody>
            ${bs.assets.map(line).join('')}
            <tr style="background:var(--blue-bg);font-weight:700"><td>资产合计</td><td class="num">${money(bs.total_assets)}</td></tr>
          </tbody></table>
          <table style="margin-top:12px"><thead><tr><th>负债和所有者权益</th><th class="num">金额</th></tr></thead><tbody>
            ${bs.liabilities.map(line).join('')}
            <tr><td style="color:var(--text2)">负债合计</td><td class="num">${money(bs.total_liabilities)}</td></tr>
            ${bs.equity.map(line).join('')}
            <tr><td style="color:var(--text2)">所有者权益合计</td><td class="num">${money(bs.total_equity)}</td></tr>
            <tr style="background:var(--blue-bg);font-weight:700"><td>负债和所有者权益合计</td><td class="num">${money(bs.total_liabilities + bs.total_equity)}</td></tr>
          </tbody></table>
          <p class="muted" style="margin-top:8px">固定资产原值 / 累计折旧为展示行，合计按「固定资产净值」计入；贷方余额已自动重分类${bs.reclass_count ? `（共 ${bs.reclass_count} 处）` : ''}。</p></div>
        <div class="card"><h3>利润表 <span class="muted">${esc(inc.year)} 年度</span></h3>
          <table><thead><tr><th>项目</th><th class="num">本期数<br><span class="muted" style="font-weight:400">${esc(period)}</span></th><th class="num">本年累计数<br><span class="muted" style="font-weight:400">${esc(inc.cum_scope)}</span></th></tr></thead><tbody>
            ${inc.current.map((r, i) => `<tr><td>${esc(r.item)}</td><td class="num">${money(r.amount)}</td><td class="num">${money(inc.cumulative[i].amount)}</td></tr>`).join('')}
          </tbody></table>
          <p class="muted" style="margin-top:8px">累计数只统计本年度，不并入往年利润；自动排除结转凭证。勾稽②按年度汇总后与资产负债表「留存收益合计」¥${money(bs.retained)} 核对（其中 ${esc(inc.year)} 年本年累计 ¥${money(inc.net_cum)}，账套累计另含往年利润）。</p></div>
      </div>
      <div class="card"><h3>现金流量简表 <span class="muted">按对方科目归集 · 本期 / 本年累计</span></h3>
        <table><thead><tr><th>对方科目</th><th class="num">本期流入</th><th class="num">本期流出</th><th class="num">累计流入</th><th class="num">累计流出</th><th class="num">累计净额</th></tr></thead>
          <tbody>${cfRows || '<tr><td colspan="6" class="muted">该期间暂无现金流量</td></tr>'}
            <tr style="background:var(--blue-bg);font-weight:700"><td>合计</td><td class="num">${money(cfCur.in_total)}</td><td class="num">${money(cfCur.out_total)}</td>
              <td class="num">${money(cfYtd.in_total)}</td><td class="num">${money(cfYtd.out_total)}</td><td class="num">${money(cfYtd.net)}</td></tr>
          </tbody></table>
        <p class="muted" style="margin-top:8px">上表累计数为「本年度 1 月 → ${esc(period)}」口径；勾稽③用「自建账起至 ${esc(period)}」的全量口径 ¥${money(art.cashflow_net)}（跨年账套两者不同），右侧取总账货币资金期初 ¥${money(art.cash_begin)} → 期末 ¥${money(art.cash_end)}，两侧独立口径。</p></div>`;
  },

  system: async () => {
    const [h, a, ck, pm] = await Promise.all([api('/api/health'), api('/api/audit'), api('/api/selfcheck'), api('/api/portable/manifest')]);
    await loadMeta();
    return `<div class="page-head"><div><h2>系统管理</h2><div class="hint">备份 / 迁移 / 参数设置 / 审计日志</div></div></div>
      <div class="grid2">
        <div class="card"><h3>数据与迁移</h3>
          <div class="stat-line"><span>数据库</span><b>${esc(S.meta.database)}</b></div>
          <div class="stat-line"><span>已执行迁移版本</span><b>${S.meta.migrations.map(m => m.version).join(' → ')}</b></div>
          <div class="stat-line"><span>数据库大小</span><b>${(h.db_size / 1024).toFixed(0)} KB</b></div>
          <div class="stat-line"><span>服务状态</span><b style="color:var(--green)">正常</b></div>
          <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
            <button class="btn btn-p" onclick="exportPortable()">📦 下载整站迁移包（程序+数据库）</button>
            <label class="btn btn-g" style="margin:0">📂 导入整站迁移包<input type="file" id="portableFile" accept=".zip" style="display:none" onchange="importPortable(this)"></label>
            <button class="btn btn-g" onclick="backupJSON()">⬇ 仅备份数据(JSON)</button>
            <label class="btn btn-g" style="margin:0">⬆ 恢复 / 迁移<input type="file" id="restoreFile" accept=".json" style="display:none" onchange="restoreJSON(this)"></label>
            <button class="btn btn-g" onclick="downloadCSV()">⬇ 导出日记账 CSV</button>
          </div>
          <div style="margin-top:12px;padding:10px;background:var(--blue-bg);border-radius:6px;font-size:12.5px;line-height:1.7">
            <b>换电脑怎么用：</b>点「下载整站迁移包」，得到一个 zip，里面是程序 + 数据库 + 附件 + <b>Python 运行时</b> + 启动脚本。
            <br>在新电脑解压后双击 <b>启动.bat</b>（Mac 执行 <b>启动.sh</b>），浏览器自动打开 <b>http://127.0.0.1:8765</b>，无需安装任何软件。
            <br>也可以直接复制整个程序文件夹（含 data 目录）到新电脑，效果相同。
          </div>
          <div style="margin-top:10px">
            <div class="stat-line"><span>迁移包总大小（含运行时）</span><b>${(pm.total_size/1024/1024).toFixed(1)} MB</b></div>
            <div class="stat-line"><span>内置 Python 运行时</span><b style="color:${pm.runtime_available ? 'var(--green)' : 'var(--orange)'}">${pm.runtime_available ? '✓ 已包含' : '未包含（需系统 Python）'}</b></div>
            <div class="stat-line"><span>数据库表 / 记录</span><b>${pm.database_tables} 张 / 日记账 ${pm.records.journal} 笔 · 凭证 ${pm.records.vouchers} 张 · 资产 ${pm.records.assets} 项</b></div>
            ${pm.items.map(i => `<div class="stat-line"><span>${esc(i.name)}</span><b class="muted">${(i.size/1024).toFixed(0)} KB</b></div>`).join('')}
          </div>
        </div>
        <div class="card"><h3>账套参数</h3>
          <div class="frow"><div><label>单位名称</label><input id="setCompany" value="${esc(S.meta.settings.company_name || '')}"></div>
            <div><label>出纳</label><input id="setCashier" value="${esc(S.meta.settings.cashier || '')}"></div></div>
          <div class="frow"><div><label>会计</label><input id="setAccountant" value="${esc(S.meta.settings.accountant || '')}"></div>
            <div><label>现金期初余额（元）</label><input type="number" step="0.01" id="setCash" value="${esc(S.meta.settings.cash_opening || '0')}"></div></div>
          <button class="btn btn-p" onclick="saveSettings()">保存参数</button>
          <p class="muted" style="margin-top:8px">修改现金期初后，现金日记账余额会自动重算。</p>
        </div>
      </div>
      <div class="card"><h3>数据自检 <span class="tag ${ck.ok ? 't-posted' : 't-rejected'}">${ck.ok ? '✓ 全部通过' : '✗ 发现问题'}</span>
        <button class="btn btn-g btn-sm" onclick="selfCheck()">重新自检</button></h3>
        ${ck.items.map(x => `<div class="stat-line"><span>${x.pass ? '✅' : '❌'} ${esc(x.name)}</span>
          <span class="muted">${esc(x.detail)}</span></div>`).join('')}
        <p class="muted" style="margin-top:8px">检查项：试算平衡、账证相符（凭证现金银行分录 = 日记账）、余额重算一致、审计哈希链完整、科目引用完整。</p></div>
      <div class="card"><h3>审计日志（最近 300 条）</h3>${table(a.items, [
        { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
        { t: '操作人', f: r => esc(r.actor || '—') },
        { t: '操作', f: r => esc(r.action) },
        { t: '对象', f: r => esc(r.entity) },
        { t: '说明', f: r => `<span class="muted">${esc(r.detail || '')}</span>` },
      ])}</div>`;
  },
};

