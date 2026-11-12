/* V2.5 页面：效率工具 / 经营分析 / 期末配置 */
/* ===== 页面注册表（V2.5 效率工具 / 经营分析 / 期末配置 + V2.6 分析中心） =====
 * 单一路由表：新增页面只需在此登记一项，并在 index.html 加一个 data-page 按钮。
 * 所有计算逻辑均在后端 core/，这里只负责取数与渲染。 */
Object.assign(PAGES, {
  todo: async () => {
    const d = await api('/api/todo');
    return `<div class="page-head"><div><h2>我的待办中心</h2>
      <div class="hint">8 类待办自动汇总，点击任意一条即可直达对应模块 · 生成于 ${esc(d.generated_at)}</div></div>
      <button class="btn btn-g" onclick="render()">🔄 刷新</button></div>
      <div class="banner">共 <b>${d.total}</b> 项待办，其中需优先处理 <b>${d.pending}</b> 项</div>
      <div class="grid2">${d.items.map(c => `<div class="card"><h3>${esc(c.label)}
        <span class="tag ${c.count ? (c.level === 'warn' ? 't-rejected' : 't-posted') : 't-posted'}">${c.count ? c.count + ' 项' : '✓ 已清空'}</span></h3>
        ${c.items.length ? c.items.map(i => `<div class="stat-line todo-row" data-help-skip
            onclick="go('${c.page}')" title="点击前往「${esc(c.label)}」处理">
          <span><b>${esc(i.title)}</b><div class="muted" style="font-size:11.5px;margin-top:2px">${esc(i.sub)}</div></span>
          <span class="todo-go">→</span></div>`).join('') : '<div class="empty">暂无待办</div>'}
        </div>`).join('')}</div>`;
  },

  search: async () => {
    const kw = S.filters.vQ || '';
    const d = kw ? await api('/api/search?q=' + encodeURIComponent(kw)) : { q: '', groups: [], total: 0 };
    return `<div class="page-head"><div><h2>全局搜索</h2>
      <div class="hint">一次检索单据、凭证、发票、日记账、资产、往来单位</div></div></div>
      <div class="card"><div style="display:flex;gap:8px">
        <input id="vQ" value="${esc(kw)}" placeholder="输入单据号 / 摘要 / 发票号 / 单位名称"
          oninput="S.filters.vQ=this.value" onkeydown="if(event.key==='Enter')render()" style="flex:1">
        <button class="btn btn-p" onclick="render()">🔍 搜索</button>
        ${kw ? `<button class="btn btn-g" onclick="S.filters.vQ='';render()">清空</button>` : ''}</div>
        ${kw ? `<p class="muted" style="margin-top:8px">「${esc(kw)}」共找到 <b>${d.total}</b> 条结果</p>` :
          '<p class="muted" style="margin-top:8px">试试搜索「办公」「记-」「FP」等关键词</p>'}</div>
      ${d.groups.map(g => `<div class="card"><h3>${esc(g.label)} <span class="tag t-posted">${g.count}</span></h3>
        ${table(g.items, [
          { t: '业务内容', f: r => `<b>${esc(r.title)}</b>` },
          { t: '编号与说明', f: r => `<span class="muted">${esc(r.sub)}</span>` },
          { t: '日期', f: r => `<span class="muted">${esc(r.date || '—')}</span>` },
          { t: '金额', num: true, f: r => r.amount != null ? money(r.amount) : '—' },
        ], '暂无结果', () => `class="click-row" onclick="go('${g.page}')" title="点击前往${esc(g.label)}"`)}</div>`).join('')}`;
  },

  tpl: async () => {
    const d = await api('/api/voucher-templates');
    return `<div class="page-head"><div><h2>常用凭证模板</h2>
      <div class="hint">把每月重复做的分录存成模板，一键生成草稿凭证（生成后仍需审核过账）</div></div>
      <div style="display:flex;gap:8px"><button class="btn btn-p" onclick="newTpl()">＋ 新建模板</button>
      <button class="btn btn-g" onclick="window.open('/api/vouchers/print')">🖨 打印凭证</button></div></div>
      <div class="card"><h3>已有模板 <span class="tag t-posted">${d.items.length} 个</span></h3>
        ${table(d.items, [
          { t: '模板名称', f: r => `<b>${esc(r.name)}</b>` },
          { t: '摘要', f: r => esc(r.summary || '—') },
          { t: '分录', f: r => r.lines.map(x => `${esc(x.subject_code)} ${x.debit ? '借 ' + money(x.debit) : '贷 ' + money(x.credit)}`).join('<br>') },
          { t: '金额', num: true, f: r => money(r.debit_total) },
          { t: '使用次数', num: true, f: r => r.use_count },
          { t: '操作', f: r => `<button class="btn btn-p btn-sm" onclick="useTpl(${r.id})">套用生成凭证</button>
            <button class="btn btn-g btn-sm" onclick="delTpl(${r.id})">删除</button>` },
        ], '还没有模板，点右上角「新建模板」')}</div>
      <div class="card"><h3>使用场景</h3>
        <p class="muted">每月固定发生的业务（房租、水电、折旧、工资计提、税费缴纳）做成模板后，
        不用每次重新选科目和算借贷，减少录入差错。模板只生成<strong>草稿凭证</strong>，仍走制单→审核→过账流程。</p></div>`;
  },

  print: async () => {
    const ids = S.filters.vIds || '';
    return `<div class="page-head"><div><h2>凭证打印 / 连续套打</h2>
      <div class="hint">A4 横向，每张凭证一页，含人民币大写合计与制单/审核/记账签字栏</div></div></div>
      <div class="card"><h3>选择要打印的凭证</h3>
        <div class="frow"><div><label>凭证 ID（逗号分隔，留空 = 最近 10 张已过账凭证）</label>
          <input id="vIds" value="${esc(ids)}" oninput="S.filters.vIds=this.value" placeholder="例如 1,2,3"></div></div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-p" onclick="printVouchers()">🖨 打开打印预览</button>
          <button class="btn btn-g" onclick="go('vouchers')">去凭证管理查看 ID →</button></div>
        <p class="muted" style="margin-top:10px">打印预览在新窗口打开，点窗口里的「打印全部」即可连续打印；
        用 A5 凭证纸时在打印机设置里选择对应纸张。</p></div>`;
  },

  vcheck: async () => {
    const d = await api('/api/vouchers/sequence-check');
    const s = d.summary;
    return `<div class="page-head"><div><h2>凭证合规体检</h2>
      <div class="hint">断号 / 重号 / 日期跨期 / 借贷不平 / 未过账 / 无附件 一次查完</div></div>
      <div style="display:flex;gap:8px"><button class="btn btn-g" onclick="render()">🔄 重新体检</button>
      <button class="btn btn-g" onclick="window.open('/api/vouchers/print')">🖨 打印凭证</button></div></div>
      <div class="grid2">
        <div class="card"><h3>体检概览</h3>
          <div class="stat-line"><span>凭证总数</span><b>${s.vouchers} 张 / ${s.periods} 个期间</b></div>
          <div class="stat-line"><span>发现问题</span><b style="color:${s.issues ? 'var(--orange)' : 'var(--green)'}">${s.issues} 项（严重 ${s.serious}）</b></div>
          <div class="stat-line"><span>未过账凭证</span><b>${s.unposted} 张</b></div>
          <div class="stat-line"><span>已过账但无附件</span><b>${s.no_attachment} 张</b></div>
          <p class="muted" style="margin-top:8px">断号只检查系统标准编号「记-YYYYMM###」，自定义编号不参与判断。</p></div>
        <div class="card"><h3>问题明细 ${s.serious ? '<span class="tag t-rejected">有严重项</span>' : '<span class="tag t-posted">✓ 无严重项</span>'}</h3>
          ${table(d.issues, [
            { t: '级别', f: r => `<span class="tag ${r.level === '严重' ? 't-rejected' : 't-posted'}">${esc(r.level)}</span>` },
            { t: '类型', f: r => esc(r.type) },
            { t: '期间', f: r => esc(r.period) },
            { t: '说明', f: r => `<span class="muted">${esc(r.detail)}</span>` },
          ], '✓ 未发现问题')}</div></div>`;
  },
  cfstmt: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/reports/cashflow-statement?period=' + p);
    // 按类别名配对累计列：开启「未分类」后两列类别数可能不同，按索引取会错位
    const cumMap = Object.fromEntries(d.cumulative.categories.map(c => [c.category, c]));
    const row = c => `<tr><td><b>${esc(c.label)}</b></td>
      <td class="num">${money(c.inflow)}</td><td class="num">${money(c.outflow)}</td>
      <td class="num"><b>${money(c.net)}</b></td>
      <td class="num">${money((cumMap[c.category] || {}).net || 0)}</td></tr>`;
    return `<div class="page-head"><div><h2>现金流量表（正表）</h2>
      <div class="hint">按对方科目自动划分经营 / 投资 / 筹资三大活动 · 本期 ${esc(p)} · 累计为自建账起全量口径</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="vPeriod" value="${p}"
        oninput="S.filters.vPeriod=this.value" onchange="render()" style="width:165px"></div></div>
      <div class="banner">勾稽：累计现金流量净额 <b>¥${money(d.cumulative.net)}</b> ↔ 货币资金变动
        <b>¥${money(d.delta)}</b>（期初 ¥${money(d.cash_begin)} → 期末 ¥${money(d.cash_end)}）
        ${d.check ? '<span class="tag t-posted">✓ 相符</span>' : '<span class="tag t-rejected">✗ 不符</span>'}</div>
      ${d.unmapped && d.unmapped.length ? `<div class="banner" style="border-left-color:var(--orange)">⚠ 有 ${d.unmapped.length} 个科目未配置现金流分类，已单列「未分类」不并入经营；请到「分析规则配置」补充科目前缀。</div>` : ''}
      <div class="card"><h3>现金流量正表</h3>
        <table><thead><tr><th>项目</th><th class="num">本期流入</th><th class="num">本期流出</th>
          <th class="num">本期净额</th><th class="num">累计净额</th></tr></thead><tbody>
          ${d.current.categories.map(row).join('')}
          <tr style="background:var(--blue-bg);font-weight:700"><td>四、现金净增加额</td>
            <td class="num">${money(d.current.in_total)}</td><td class="num">${money(d.current.out_total)}</td>
            <td class="num">${money(d.current.net)}</td><td class="num">${money(d.cumulative.net)}</td></tr>
        </tbody></table>
        <p class="muted" style="margin-top:8px">${esc(d.note)}</p></div>
      <div class="grid2">${d.current.categories.map(c => `<div class="card"><h3>${esc(c.label)}</h3>
        ${table(c.items, [
          { t: '对方科目', f: r => esc(r.subject) },
          { t: '方向', f: r => esc(r.direction) },
          { t: '笔数', num: true, f: r => r.count },
          { t: '金额', num: true, f: r => money(r.amount) },
        ], '该期间无此类现金流量')}</div>`).join('')}</div>`;
  },

  ratios: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/reports/ratios?period=' + p);
    return `<div class="page-head"><div><h2>财务比率分析</h2>
      <div class="hint">偿债 / 盈利 / 营运三大维度 10 项指标 · 基于本期累计数与期末余额</div></div>
      <input type="month" id="vPeriod" value="${p}" oninput="S.filters.vPeriod=this.value"
        onchange="render()" style="width:165px"></div>
      <div class="banner">财务健康度 <b>${d.score} 分</b>（${d.healthy}/${d.valid} 项指标处于健康区间）·
        营业收入 ¥${money(d.basis.revenue)} · 净利润 ¥${money(d.basis.net_profit)} ·
        资产 ¥${money(d.basis.total_assets)} · 负债 ¥${money(d.basis.total_liabilities)}</div>
      <div class="card"><h3>指标明细</h3>
        ${table(d.items, [
          { t: '指标', f: r => `<b>${esc(r.name)}</b>` },
          { t: '数值', num: true, f: r => r.value == null ? '—' : `<b>${r.value}</b> ${esc(r.unit)}` },
          { t: '计算公式', f: r => `<span class="muted">${esc(r.formula)}</span>` },
          { t: '参考区间', f: r => esc(r.benchmark) },
          { t: '评价', f: r => `<span class="tag ${r.status === '健康' ? 't-posted' : (r.status === '关注' ? 't-rejected' : '')}">${esc(r.status)}</span>` },
          { t: '说明', f: r => `<span class="muted">${esc(r.explain)}</span>` },
        ])}<p class="muted" style="margin-top:8px">${esc(d.note)}</p></div>`;
  },

  compare: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/reports/compare?period=' + p);
    const g = v => v == null ? '<span class="muted">—</span>' :
      `<b style="color:${v >= 0 ? 'var(--red)' : 'var(--green)'}">${v >= 0 ? '+' : ''}${v}%</b>`;
    const keys = ['revenue', 'expense', 'net', 'inflow', 'outflow'];
    return `<div class="page-head"><div><h2>同比 · 环比分析</h2>
      <div class="hint">本月 vs 上月 vs 去年同月，另附近 12 个月趋势</div></div>
      <input type="month" id="vPeriod" value="${p}" oninput="S.filters.vPeriod=this.value"
        onchange="render()" style="width:165px"></div>
      <div class="card"><h3>三期对比 <span class="muted">${esc(d.prev.period)} / ${esc(p)} / ${esc(d.last_year.period)}</span></h3>
        <table><thead><tr><th>指标</th><th class="num">上月</th><th class="num">本月</th>
          <th class="num">去年同月</th><th class="num">环比</th><th class="num">同比</th></tr></thead><tbody>
          ${keys.map(k => `<tr><td><b>${esc(d.labels[k])}</b></td>
            <td class="num">${money(d.prev[k])}</td><td class="num"><b>${money(d.current[k])}</b></td>
            <td class="num">${money(d.last_year[k])}</td>
            <td class="num">${g(d.mom[k])}</td><td class="num">${g(d.yoy[k])}</td></tr>`).join('')}
        </tbody></table>
        <p class="muted" style="margin-top:8px">基期为 0 时增长率显示「—」，避免除零误读。</p></div>
      <div class="card"><h3>近 12 个月趋势</h3>
        ${table(d.trend, [
          { t: '期间', f: r => `<b>${esc(r.period)}</b>` },
          { t: '营业收入', num: true, f: r => money(r.revenue) },
          { t: '成本费用', num: true, f: r => money(r.expense) },
          { t: '净利润', num: true, f: r => `<b style="color:${r.net >= 0 ? 'var(--red)' : 'var(--green)'}">${money(r.net)}</b>` },
          { t: '现金流入', num: true, f: r => money(r.inflow) },
          { t: '现金流出', num: true, f: r => money(r.outflow) },
        ])}</div>`;
  },

  baddebt: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/bad-debt/preview?period=' + p);
    return `<div class="page-head"><div><h2>坏账准备计提</h2>
      <div class="hint">按应收发票账龄分档计提，自动与 1231 科目已计提额比较，只补差额、防重复计提</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="vPeriod" value="${p}"
        oninput="S.filters.vPeriod=this.value" onchange="render()" style="width:165px">
      <button class="btn btn-p" onclick="doProvision('${p}')">生成计提凭证</button></div></div>
      <div class="banner">应收发票合计 <b>¥${money(d.receivable_total)}</b> ·
        应计提 <b>¥${money(d.required)}</b> · 已计提 <b>¥${money(d.provided)}</b> ·
        本次需 ${d.adjustment >= 0 ? '补提' : '冲回'} <b>¥${money(Math.abs(d.adjustment))}</b></div>
      <div class="grid2">
        <div class="card"><h3>账龄分档与计提</h3>
          <table><thead><tr><th>账龄区间</th><th class="num">应收金额</th><th>计提比例</th>
            <th class="num">应计提</th></tr></thead><tbody>
            ${d.details.map(x => `<tr><td><b>${esc(x.bucket)}</b></td><td class="num">${money(x.amount)}</td>
              <td><input type="number" step="0.01" min="0" max="100" data-rate="${esc(x.bucket)}"
                value="${x.rate_pct}" style="width:80px"> %</td>
              <td class="num">${money(x.provision)}</td></tr>`).join('')}
          </tbody></table>
          <button class="btn btn-g btn-sm" style="margin-top:10px" onclick="saveBadDebtRates()">保存计提比例</button>
          <p class="muted" style="margin-top:8px">${esc(d.note)}</p></div>
        <div class="card"><h3>计提分录规则</h3>
          <div class="stat-line"><span>补提（差额 &gt; 0）</span><b>借 6701 资产减值损失 / 贷 1231 坏账准备</b></div>
          <div class="stat-line"><span>冲回（差额 &lt; 0）</span><b>借 1231 坏账准备 / 贷 6701 资产减值损失</b></div>
          <div class="stat-line"><span>防重复</span><b>差额为 0 时拒绝生成凭证</b></div>
          <div class="stat-line"><span>过账</span><b>自动生成并过账，不影响现金/银行日记账</b></div>
          <p class="muted" style="margin-top:10px">计提比例可在左侧调整并保存；保存后点「生成计提凭证」，
          系统会写入一张转账凭证，之后再次点击会因已足额而被拦截。</p></div></div>`;
  },

  collection: async () => {
    const days = S.filters.vDays ?? '0';
    const d = await api('/api/reports/collection?days=' + days);
    return `<div class="page-head"><div><h2>往来催收清单</h2>
      <div class="hint">按往来单位汇总逾期未收发票，标记账龄级别 · 截至 ${esc(d.as_of)}</div></div>
      <div style="display:flex;gap:8px"><select onchange="S.filters.vDays=this.value;render()" style="width:150px">
        ${[['0', '全部应收'], ['30', '超 30 天'], ['60', '超 60 天'], ['90', '超 90 天']].map(
          ([v, t]) => `<option value="${v}" ${String(days) === v ? 'selected' : ''}>${t}</option>`).join('')}
        </select><button class="btn btn-g" onclick="window.open('/api/export/collection.xlsx?days=${days}')">⬇ 导出 Excel</button></div></div>
      <div class="banner">共 <b>${d.invoice_count}</b> 张未收发票，合计 <b>¥${money(d.total)}</b>，涉及 <b>${d.items.length}</b> 家往来单位</div>
      ${d.items.map(g => `<div class="card"><h3>${esc(g.counterparty)}
        <span class="tag ${g.level === '紧急' ? 't-rejected' : 't-posted'}">${esc(g.level)}</span>
        <span class="muted">${g.count} 笔 · ¥${money(g.amount)} · 最长 ${g.max_days} 天</span></h3>
        ${table(g.items, [
          { t: '发票号', f: r => `<b>${esc(r.invoice_no)}</b>` },
          { t: '开票日期', f: r => esc(r.invoice_date) },
          { t: '账龄(天)', num: true, f: r => r.days },
          { t: '账龄区间', f: r => esc(r.bucket) },
          { t: '未收金额', num: true, f: r => money(r.amount) },
          { t: '状态', f: r => esc(r.status) },
        ])}</div>`).join('') || '<div class="empty">该条件下没有应收发票</div>'}`;
  },
  snapshots: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/snapshots');
    return `<div class="page-head"><div><h2>报表快照归档</h2>
      <div class="hint">把某一期间的三大报表 + 勾稽结果冻结成快照，随时回看、导出，不受后续记账影响</div></div></div>
      <div class="card"><h3>新建归档</h3><div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
        <div><label>报表期间</label><input type="month" id="vPeriod" value="${p}"
          oninput="S.filters.vPeriod=this.value" style="width:165px"></div>
        <div><label>备注</label><input id="vNote" placeholder="如：10 月月结存档" style="width:220px"></div>
        <button class="btn btn-p" onclick="saveSnapshot()">📌 冻结当期报表</button></div></div>
      <div class="card"><h3>历史快照 <span class="tag t-posted">${d.items.length} 份</span></h3>
        ${table(d.items, [
          { t: '期间', f: r => `<b>${esc(r.period)}</b>` },
          { t: '类型', f: r => esc(r.kind) },
          { t: '备注', f: r => esc(r.note || '—') },
          { t: '归档人', f: r => esc(r.created_by || '—') },
          { t: '归档时间', f: r => `<span class="muted">${esc(r.created_at)}</span>` },
          { t: '大小', num: true, f: r => (r.size / 1024).toFixed(1) + ' KB' },
          { t: '操作', f: r => `<button class="btn btn-g btn-sm" onclick="viewSnapshot(${r.id})">查看</button>
            <button class="btn btn-g btn-sm" onclick="window.open('/api/snapshots/${r.id}/export.xlsx')">⬇ Excel</button>
            <button class="btn btn-g btn-sm" onclick="delSnapshot(${r.id})">删除</button>` },
        ], '还没有归档快照')}</div>`;
  },

  yearend: async () => {
    const y = S.filters.vYear || String(new Date().getFullYear());
    const bs = await api('/api/reports/balance-sheet?period=' + y + '-12');
    const posted = bs.equity.filter(x => x.item.includes('本年利润'))[0]?.amount || 0;
    const dist = bs.equity.filter(x => x.item === '利润分配')[0]?.amount || 0;
    return `<div class="page-head"><div><h2>年度结转（本年利润 → 利润分配）</h2>
      <div class="hint">年末把 4103 本年利润余额转入 4104 利润分配，生成并过账一张转账凭证</div></div></div>
      <div class="card"><h3>选择年度</h3><div style="display:flex;gap:8px;align-items:flex-end">
        <div><label>结转年度</label><input type="number" id="vYear" value="${esc(y)}" min="2000" max="2100"
          oninput="S.filters.vYear=this.value" style="width:140px"></div>
        <button class="btn btn-p" onclick="doYearEnd()">执行年度结转</button>
        <button class="btn btn-g" onclick="render()">刷新余额</button></div>
        <p class="muted" style="margin-top:8px">结转凭证日期固定为 <b>${esc(y)}-12-31</b>；若 12 月已结账，请先反结账。</p></div>
      <div class="grid2">
        <div class="card"><h3>${esc(y)} 年末权益概览</h3>
          <div class="stat-line"><span>本年利润（已结转 4103）</span><b>¥${money(posted)}</b></div>
          <div class="stat-line"><span>利润分配（4104）</span><b>¥${money(dist)}</b></div>
          <div class="stat-line"><span>留存收益合计</span><b>¥${money(bs.retained)}</b></div>
          <div class="stat-line"><span>资产负债表</span><b>${bs.balanced ? '✓ 平衡' : '✗ 差额 ' + money(bs.diff)}</b></div></div>
        <div class="card"><h3>为什么要做年结</h3>
          <p class="muted">会计上「本年利润」只反映当年经营成果，年度终了应全额转入「利润分配—未分配利润」，
          次年 4103 从零开始。系统支持<strong>不做年结也能出正确报表</strong>（V2.4 的勾稽已兼容两种口径），
          但做了年结，报表上「本年利润」与「利润分配」的划分更符合会计规范。</p>
          <div class="stat-line"><span>盈利结转</span><b>借 4103 / 贷 4104</b></div>
          <div class="stat-line"><span>亏损结转</span><b>借 4104 / 贷 4103</b></div>
          <div class="stat-line"><span>防重复</span><b>同一年度只允许结转一次</b></div></div></div>`;
  },

  stmtimport: async () => {
    const pv = S.stmtPreview;
    const csv = S.filters.vCsv || '';
    return `<div class="page-head"><div><h2>银行对账单批量导入</h2>
      <div class="hint">粘贴 CSV / 从 Excel 复制，自动解析、查重，确认后才写入</div></div></div>
      <div class="card"><h3>① 粘贴对账单</h3>
        <textarea id="vCsv" rows="8" style="width:100%;font-family:monospace;font-size:13px"
          oninput="S.filters.vCsv=this.value" placeholder="日期,摘要,收入,支出
2026-11-01,收到货款,25000,
2026-11-02,支付房租,,3000">${esc(csv)}</textarea>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <button class="btn btn-p" onclick="previewStmtImport()">🔍 解析预览</button>
          <button class="btn btn-g" onclick="S.stmtPreview=null;S.filters.vCsv='';render()">清空</button>
          <span class="muted" style="align-self:center">格式：每行「日期,摘要,收入,支出」，收入与支出填一列即可；表头会自动跳过</span></div></div>
      ${pv ? `<div class="card"><h3>② 预览结果
        <span class="tag t-posted">可导入 ${pv.new} 行</span>
        <span class="tag ${pv.duplicates ? 't-rejected' : 't-posted'}">重复跳过 ${pv.duplicates} 行</span></h3>
        ${table(pv.items, [
          { t: '日期', f: r => esc(r.date) },
          { t: '摘要', f: r => esc(r.description) },
          { t: '收入', num: true, f: r => money(r.in) },
          { t: '支出', num: true, f: r => money(r.out) },
          { t: '状态', f: r => r.duplicate ? '<span class="tag t-rejected">已存在，跳过</span>' : '<span class="tag t-posted">待导入</span>' },
        ])}
        <button class="btn btn-p" style="margin-top:12px" onclick="confirmStmtImport()"
          ${pv.new ? '' : 'disabled'}>✓ 确认导入 ${pv.new} 行</button>
        <p class="muted" style="margin-top:8px">导入后请到「银行对账」页点「自动匹配」生成余额调节表。</p></div>` : ''}`;
  },

  subjects: async () => {
    const d = await api('/api/subjects/templates');
    return `<div class="page-head"><div><h2>会计科目模板套用</h2>
      <div class="hint">一键补齐常用会计科目 · 只新增缺失科目，绝不覆盖已有科目及余额</div></div></div>
      <div class="banner">当前账套已有 <b>${d.existing}</b> 个科目。套用后新增科目会自动进入资产负债表 / 利润表（V2.4 起支持自动归集）。</div>
      ${d.items.map(t => `<div class="card"><h3>${esc(t.name)}
        <span class="tag t-posted">${t.total} 个科目</span>
        <span class="tag ${t.missing ? 't-rejected' : 't-posted'}">待补充 ${t.missing} 个</span></h3>
        <p class="muted">${esc(t.desc)}</p>
        <div style="display:flex;gap:8px;margin:10px 0">
          <button class="btn btn-p" onclick="applySubjects('${t.key}')" ${t.missing ? '' : 'disabled'}>
            ${t.missing ? '套用并补充 ' + t.missing + ' 个科目' : '✓ 已全部存在'}</button></div>
        ${table(t.preview, [
          { t: '编码', f: r => `<b>${esc(r.code)}</b>` },
          { t: '科目名称', f: r => esc(r.name) },
          { t: '类别', f: r => esc(r.category) },
          { t: '余额方向', f: r => esc(r.direction) },
        ])}</div>`).join('')}`;
  },
});
