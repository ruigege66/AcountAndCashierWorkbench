/* V2.8+ 通用工具执行器。
   设计原则：面向业务人员——零 JSON、零代码、零英文键名；
   所有结果显示为中文表格与信息卡，输入为表单/下拉/文件选择。 */

/* ---------- 字段名中文字典（覆盖全部工作台的高频字段） ---------- */
const FIELD_CN = {
  id: '编号', period: '期间', year: '年度', month: '月份', date: '日期', count_date: '盘点日期',
  invoice_date: '开票日期', due_date: '到期日', issue_date: '出票日', journal_date: '流水日期',
  created_at: '创建时间', updated_at: '更新时间', exported_at: '导出时间', done_at: '完成时间',
  checked_at: '检查时间', generated_at: '生成时间', expires_at: '到期时间', at: '时间',
  name: '名称', company: '公司', company_name: '公司名称', title: '名称', label: '项目',
  buyer: '购买方', tax_id: '纳税人识别号', invoice_title: '发票抬头', address_phone: '地址电话',
  buyer_bank: '购买方开户行及账号', bank_name: '开户行', bank_account: '银行账号',
  account: '收款账号', payee: '收款人', counterparty: '往来单位', cp: '往来单位', cp_name: '单位名称',
  subject: '科目', subject_name: '科目名称', subject_code: '科目编码', item: '项目',
  dept: '部门', applicant: '申请人', actor: '操作人', operator: '操作员', maker: '制单人',
  status: '状态', cert_status: '认证状态', invoice_status: '发票状态', level: '级别',
  kind: '类型', type: '类型', category: '类别', dimension: '维度', dim_key: '维度', dim_value: '维度值',
  amount: '金额', total_amount: '价税合计', tax_amount: '税额', tax: '税额', payable: '应纳税额',
  paid: '已缴金额', prepaid: '已预缴', current_due: '本期应补', settlement: '汇算应补/退',
  revenue: '营业收入', cum_revenue: '累计收入', cum_profit: '累计利润', accounting_profit: '会计利润',
  profit: '利润', net_profit: '净利润', gross: '应发工资', net: '金额', net_pay: '实发工资',
  inflow: '流入', outflow: '流出', in_total: '流入合计', out_total: '流出合计', net_total: '净额',
  balance: '余额', book_amount: '账面金额', total: '合计', diff: '差额', change: '变动',
  change_pct: '变动幅度', error_pct: '误差', usage: '使用率', usage_pct: '执行率',
  rate: '税率', tax_rate: '税率', ratio: '比率', vat_ratio: '增值税税负率', cit_ratio: '所得税税负率',
  total_ratio: '综合税负率', monthly_outflow: '月均支出', monthly: '每月摊销', monthly_limits: '月度限额',
  months: '月数', safety: '安全', flag: '判定', score: '评分', grade: '等级',
  count: '数量', cnt: '笔数', total_p: '通过项', total_f: '失败项',
  low: '下限', high: '上限', limit: '上限', quick: '速算扣除数',
  value: '数值', predicted: '预测值', actual: '实际值', low_est: '悲观', high_est: '乐观',
  output_tax: '销项税额', input_tax: '进项税额', output_groups: '销项分组', input_certified: '已认证进项',
  input_uncertified: '待认证进项', input_transfer: '进项转出', certified_tax: '已认证税额',
  uncertified_tax: '未认证税额', surtax_total: '附加税费合计', surtaxes: '附加税费',
  sales_ex_tax: '不含税销售额', credit: '留抵税额', taxpayer_type: '纳税人类型',
  vat_payable: '应纳增值税', vat_ratio_target: '税负率目标', ratio_target: '控制区间',
  ratio_now: '本期税负率', target: '目标区间', precision: '精度',
  has_budget: '是否已设预算', budget: '年度预算', budget_total: '预算合计', actual_total: '累计实际',
  year_end_forecast: '年末预计', small_micro: '小微企业优惠', rate_pct: '税率',
  deductible: '可扣除金额', add_back: '需调增金额', spent: '发生额',
  limit_60pct: '发生额的60%', limit_05pct_revenue: '收入的0.5%', taxable_income: '应纳税所得额',
  adjustments: '纳税调整合计', adjustments_total: '调整合计',
  children_count: '子女人数', children_amount: '子女教育', elderly_amount: '赡养老人',
  housing_loan: '房贷利息', rent: '住房租金', education: '继续教育', medical: '大病医疗', other: '其他扣除',
  social_personal: '个人社保', fund_personal: '个人公积金', social_employer: '单位社保',
  housing_fund_rate: '公积金比例', special: '专项附加扣除', special_total: '专项附加合计',
  taxable_cum: '累计应纳税所得额', total_gross: '应发合计', total_tax: '代扣个税合计', total_net: '实发合计',
  cash: '库存现金', cash_limit: '现金限额', exceeded: '是否超限', monthly_outflow_avg: '月均支出',
  denominations: '面额张数', denominations_json: '面额明细', note: '备注', reason: '原因',
  hint: '说明', notice: '提示', rule: '计算规则', method: '计算方法', limitation: '局限性说明',
  sparse_hint: '数据提示', unit_note: '金额单位说明', precision_note: '精度说明',
  workflow: '操作流程', requirement: '所需条件', requirement_note: '前置条件',
  invoice_no: '发票号', invoice_code: '发票代码', bill_no: '票据号', doc_no: '单据号',
  voucher_no: '凭证号', batch_no: '批次号', bank_ref: '银行流水号', task_id: '任务编号',
  ref_no: '来源单据', ref_type: '来源类型', ref_id: '来源编号', payload: '任务内容',
  result: '回传结果', result_json: '处理结果', note_text: '说明',
  items: '明细', files: '文件', modules: '模块', matrix: '依赖关系', tiers: '分级',
  groups: '分组', detail: '明细', lines: '工资明细', batches: '近期批次',
  ready_invoice: '可开票单位数', ready_payment: '可付款单位数',
  invoice_pending: '待开票', invoice_exported: '已导出待开具', invoice_done: '已完成开票',
  payment_pending: '待付款', payment_exported: '已导出待付款',
  pending: '待处理', imported: '成功导入', duplicates: '重复跳过', updated: '已更新',
  linked: '已关联', created: '新增', done: '成功', failed: '失败', skipped: '跳过',
  ok: '是否成功', check: '校验通过', balanced: '是否平衡', all_pass: '全部通过',
  issues: '问题', alerts: '预警', abnormal: '异常项', stale: '长期未用', zombie: '从未使用',
  ex_tax: '不含税金额', ex_total: '不含税合计', tax_total: '税额合计', rate_pct_note: '税率说明',
  total_assets: '资产合计', total_liabilities: '负债合计', total_equity: '所有者权益',
  current_assets: '流动资产', current_liabilities: '流动负债', noncurrent_liabilities: '非流动负债',
  operating_net: '经营现金流净额', cash_to_profit: '现金利润比', in_out_ratio: '流入流出比',
  month: '月份', today: '今天', days: '天数', deadline: '截止日', tax: '税种',
  endpoints: '接口', routes: '接口数', total: '总数', size: '大小', lines_count: '行数',
  functions: '函数数', longest: '最长函数', sql: 'SQL 数', cycles: '循环依赖',
  violations: '分层违规', imports: '依赖模块', edges: '依赖边', by_layer: '分层统计',
  dimensions_list: '维度列表', capabilities: '可接入能力', api_capabilities: '可接入能力',
  mode: '对接方式', notice_text: '说明', enabled: '是否启用',
  calendar: '征期安排', cit_quarterly: '季度预缴', safety_months: '资金安全推演',
  config: '当前配置', precision_info: '精度', monthly_limits_note: '限额说明',
  ready: '就绪', need: '待补', missing: '缺失', fields: '字段',
  template: '模板', columns: '列', encoding: '编码', delimiter: '分隔符',
  header_rows: '表头行数', date_format: '日期格式', from: '开始', to: '结束',
  tax_portals: '官方入口', portals: '官方入口', workflow_note: '流程',
  query: '查询', search: '搜索', message: '消息', error: '错误',
  permissions: '权限', role: '角色', token: '会话令牌', active_sessions: '在线会话',
  surtax_city: '城建税率', surtax_edu: '教育费附加率', surtax_local: '地方教育附加率',
  cit_rate: '企业所得税率', taxpayer_type: '纳税人类型', region: '地区', action: '可以做什么',
  url: '官方网址', db_size_kb: '数据库大小(KB)', tables: '数据表数量', table_names: '数据表清单',
  python: '运行环境', records: '业务记录数', migrations: '数据库版本', audit_chain: '审计链',
  columns_json: '文件列', columns: '文件列', mode: '对接方式', workflow: '操作步骤',
  notice: '重要说明', requirement: '需要具备的条件', for: '适用场景', capability: '能力',
  precision: '计算精度', unit_note: '金额单位', monthly_limits: '每月扣除限额',
  denominations_json: '面额明细', items_count: '记录数', rate_pct: '税率',
  usage_pct: '限额占用率', current_due: '本期应补税额', small_micro: '是否享受小微优惠',
  total: '合计', total_gross: '应发合计', total_tax: '代扣个税合计', total_net: '实发合计',
  file: '文件', region_name: '地区', tax_name: '税种', requirement_text: '所需条件',
  need_login: '是否需登录', can_auto: '能否自动', link: '链接',

  description: '说明', requirement_list: '所需条件', updated_by: '修改人',
  count_total: '总计', invalid: '有问题的任务', normal_count: '区间内月份',
  amount_in: '收入金额', amount_out: '支出金额', matched: '已匹配',
  statement_date: '对账日期', description_text: '摘要',
};

const UNIT_HINT = {
  amount: '¥', total_amount: '¥', tax_amount: '¥', tax: '¥', payable: '¥', paid: '¥', prepaid: '¥',
  current_due: '¥', settlement: '¥', revenue: '¥', cum_revenue: '¥', cum_profit: '¥',
  accounting_profit: '¥', profit: '¥', net_profit: '¥', gross: '¥', net: '¥', inflow: '¥', outflow: '¥',
  in_total: '¥', out_total: '¥', net_total: '¥', balance: '¥', book_amount: '¥', total: '¥', diff: '¥',
  change: '¥', budget: '¥', budget_total: '¥', actual_total: '¥', year_end_forecast: '¥',
  deductible: '¥', add_back: '¥', spent: '¥', limit_60pct: '¥', limit_05pct_revenue: '¥',
  taxable_income: '¥', adjustments: '¥', month: '', amount_in: '¥', amount_out: '¥',
  social_personal: '¥', fund_personal: '¥', total_gross: '¥', total_tax: '¥', total_net: '¥',
  taxable_cum: '¥', children_amount: '¥', elderly_amount: '¥', housing_loan: '¥', rent: '¥',
  education: '¥', medical: '¥', other: '¥', cash: '¥', cash_limit: '¥', monthly_outflow: '¥',
  certified_tax: '¥', uncertified_tax: '¥', output_tax: '¥', input_tax: '¥', input_certified: '¥',
  input_uncertified: '¥', input_transfer: '¥', surtax_total: '¥', sales_ex_tax: '¥', credit: '¥',
  vat_payable: '¥', ex_tax: '¥', ex_total: '¥', tax_total: '¥', monthly: '¥',
  rate: '%', tax_rate: '%', ratio: '%', vat_ratio: '%', cit_ratio: '%', total_ratio: '%',
  change_pct: '%', error_pct: '%', usage: '%', usage_pct: '%', rate_pct: '%', score: '分',
};

const STATUS_WORDS = {
  ok: ['成功', 'good'], done: ['已完成', 'good'], passed: ['通过', 'good'],
  健康: ['健康', 'good'], 区间内: ['区间内', 'good'], 正常: ['正常', 'good'],
  已认证: ['已认证', 'good'], balanced: ['平衡', 'good'],
  failed: ['失败', 'bad'], 偏低: ['偏低（少缴风险）', 'warn'], 偏高: ['偏高（多缴）', 'warn'],
  关注: ['需关注', 'warn'], 异常波动: ['异常波动', 'warn'], 超支: ['超支', 'bad'],
  general: ['一般纳税人', 'info'], small: ['小规模纳税人', 'info'], file: ['文件模式（无需资质）', 'info'],
  api: ['官方直连模式（需资质）', 'info'], payment: ['付款', 'info'], statement: ['对账单', 'info'],
  receipt: ['收款', 'info'], invoice: ['开票', 'info'], success: ['成功', 'good'],
  pending: ['待处理', 'info'], exported: ['已导出', 'info'], draft: ['草稿', 'info'],
  待认证: ['待认证', 'info'], 不得抵扣: ['不得抵扣', 'warn'],
};

function cnField(k) {
  if (FIELD_CN[k]) return FIELD_CN[k];
  // 未登记字段：拆分驼峰/下划线，常见词根翻译，兜底显示原词（不再是 JSON 键语法）
  const parts = String(k).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase().split(/\s+/);
  const small = {total: '合计', count: '数量', num: '数', list: '列表', info: '信息', detail: '明细',
    data: '数据', item: '项目', key: '键', code: '编码', no: '编号', at: '时间', by: '操作人',
    db: '数据库', size: '大小', kb: '', table: '数据表', tables: '数据表', names: '清单', name: '名称',
    python: '运行环境', region: '地区', action: '操作', url: '网址', columns: '列', json: '明细',
    surtax: '附加税', city: '城建', edu: '教育费附加', local: '地方教育附加', cit: '企业所得税',
    tax: '税', ratio: '比率', rate: '税率', vat: '增值税', low: '下限', high: '上限', target: '目标',
    current: '本期', cum: '累计', total: '合计', gross: '应发', net: '实发', out: '流出', in: '流入',
    month: '月份', year: '年度', date: '日期', at: '时间', status: '状态', flag: '判定',
    bank: '银行', account: '账号', ref: '编号', id: '编号', type: '类型', kind: '类别',
    amount: '金额', count: '数量', pct: '比例', score: '评分', grade: '等级', alert: '预警',
    item: '项目', line: '明细', batch: '批次', cert: '认证', pending: '待处理', done: '已完成'};
  const mapped = parts.map(p => small[p] || '').filter(Boolean);
  return mapped.length ? mapped.join('') : parts.join(' ');
}

function fmtNum(v) {
  const n = Number(v) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtVal(key, v) {
  if (v === null || v === undefined || v === '') return '<span class="muted">—</span>';
  if (typeof v === 'boolean') return v ? '<span class="tag t-posted">是</span>' : '<span class="tag">否</span>';
  if (typeof v === 'number') {
    const unit = UNIT_HINT[key] || '';
    if (unit === '¥') return '¥ ' + fmtNum(v);
    if (unit === '%') return v.toFixed(2) + ' %';
    if (unit === '分') return v.toFixed(0) + ' 分';
    return Number.isInteger(v) ? String(v) : fmtNum(v);
  }
  if (Array.isArray(v)) {
    if (!v.length) return '<span class="muted">无</span>';
    if (v.every(x => typeof x !== 'object')) {
      const tags = v.slice(0, 12).map(x => `<span class="tag t-posted">${esc(String(x))}</span>`).join(' ');
      return v.length > 12 ? tags + `<span class="muted"> …共 ${v.length} 项</span>` : tags;
    }
    return renderTable(v.slice(0, 20));
  }
  if (typeof v === 'object') return renderInfoCard(v);
  const s = String(v);
  if (/^\[.*\]$|^\{.*\}$/.test(s.trim())) {
    try {
      const parsed = JSON.parse(s);
      return fmtVal(key, parsed);
    } catch (e) { /* 不是标准 JSON 就当普通文字 */ }
  }
  if (STATUS_WORDS[s]) {
    const [label, tone] = STATUS_WORDS[s];
    const cls = tone === 'good' ? 't-posted' : tone === 'bad' ? 't-rejected' : tone === 'warn' ? 't-rejected' : '';
    return `<span class="tag ${cls}">${esc(label)}</span>`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return esc(s.slice(0, 19).replace('T', ' '));
  if (s.startsWith('http')) return `<a href="${esc(s)}" target="_blank" rel="noopener">打开官方页面 ↗</a>`;
  if (s.length > 120) return `<span class="muted">${esc(s.slice(0, 120))}…</span>`;
  return esc(s);
}

function pickColumns(rows) {
  const keys = new Set();
  rows.slice(0, 8).forEach(r => Object.keys(r).forEach(k => keys.add(k)));
  return [...keys].filter(k => {
    const v = rows[0][k];
    return v === null || ['string', 'number', 'boolean'].includes(typeof v);
  }).slice(0, 8);
}

function renderTable(rows) {
  if (!Array.isArray(rows) || !rows.length) return '<div class="empty">暂无数据</div>';
  if (typeof rows[0] !== 'object') return rows.map(x => `<span class="tag">${esc(String(x))}</span>`).join(' ');
  const cols = pickColumns(rows);
  if (!cols.length) return '<div class="empty">暂无可显示的字段</div>';
  return table(rows.slice(0, 30), cols.map(k => ({ t: cnField(k), f: r => fmtVal(k, r[k]) })), '暂无数据');
}

function renderInfoCard(obj, depth = 0) {
  if (!obj || typeof obj !== 'object') return fmtVal('', obj);
  const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined);
  if (!entries.length) return '<div class="empty">无内容</div>';
  const simple = entries.filter(([, v]) => typeof v !== 'object');
  const complex = entries.filter(([, v]) => typeof v === 'object' && v !== null);
  let html = '';
  if (simple.length) {
    html += '<table><tbody>' + simple.map(([k, v]) =>
      `<tr><td style="width:38%;color:var(--text2)">${esc(cnField(k))}</td><td style="text-align:left">${fmtVal(k, v)}</td></tr>`).join('') + '</tbody></table>';
  }
  if (complex.length && depth < 2) {
    html += complex.map(([k, v]) => {
      const inner = Array.isArray(v) ? renderTable(v) : renderInfoCard(v, depth + 1);
      return `<div style="margin-top:12px"><b style="font-size:12.5px;color:var(--primary-dark)">${esc(cnField(k))}</b>${inner}</div>`;
    }).join('');
  }
  return html;
}

/* 结果主渲染：中文表格 + 信息卡，绝不出现 JSON 源码 */
function renderV28Result(d) {
  if (d === null || d === undefined) return '<div class="empty">没有返回内容</div>';
  if (typeof d !== 'object') return `<div class="card" style="margin:0">${fmtVal('', d)}</div>`;
  const ARRAY_KEYS = ['items', 'files', 'matrix', 'dimensions', 'modules', 'tiers', 'groups',
    'detail', 'lines', 'batches', 'alerts', 'issues', 'columns', 'calendar', 'capabilities',
    'api_capabilities', 'workflow', 'abnormal', 'revenue', 'net', 'cash', 'portals', 'items_list'];
  let arrayKey = ARRAY_KEYS.find(k => Array.isArray(d[k]) && d[k].length && typeof d[k][0] === 'object');
  let html = '';
  const rest = { ...d };
  if (arrayKey) {
    const rows = d[arrayKey];
    html += `<p class="muted" style="margin:0 0 8px">共 ${rows.length} 条记录${rows.length > 30 ? '（显示前 30 条）' : ''}</p>`;
    html += renderTable(rows);
    delete rest[arrayKey];
  }
  const other = Object.entries(rest).filter(([k]) => !['ok', 'success'].includes(k));
  if (other.length) {
    html += `<div style="margin-top:${arrayKey ? '14px' : '0'}">${renderInfoCard(Object.fromEntries(other))}</div>`;
  }
  if (!html) html = '<div class="tag t-posted">✓ 操作成功</div>';
  if (d.ok === true && arrayKey === undefined) html = '<div class="tag t-posted" style="margin-bottom:8px">✓ 操作成功</div>' + html;
  return html;
}

function findV28Tool(id) {
  for (const g in V28_TOOLS) {
    const t = V28_TOOLS[g].find(x => x.id === id);
    if (t) return t;
  }
  return null;
}

/* ---------- 工具专用输入收集（业务人员看到的是表单，不是 JSON/CSV） ---------- */
function collectV28(t, id) {
  const body = {}, qs = [];
  const val = n => { const el = $('f_' + id + '_' + n); return el ? el.value : ''; };
  const put = (n, v) => {
    const f = (t.fields || []).find(x => x.n === n);
    if (f && f.method === 'query') qs.push(encodeURIComponent(n) + '=' + encodeURIComponent(v));
    else body[n] = v;
  };
  for (const f of (t.fields || [])) {
    let v = val(f.n);
    if (f.type === 'number') v = parseFloat(v) || 0;
    if (f.type === 'checkbox') v = document.getElementById('f_' + id + '_' + f.n)?.checked ? 'true' : 'false';
    if (f.type === 'file') continue;   // 文件内容单独异步读取
    if (f.type === 'json') {
      try { v = JSON.parse(v); } catch (e) { return { error: '「' + f.l + '」格式不对，请按示例填写' }; }
    }
    put(f.n, v);
  }
  // 面额张数 → 结构化对象（用户只填数字）
  if (t.denominations) {
    const d = {};
    t.denominations.forEach(n => { const x = parseFloat(val('den_' + n)) || 0; if (x > 0) d[String(n)] = x; });
    if (!Object.keys(d).length) return { error: '请至少填写一种面额的张数' };
    body.denominations = d;
  }
  // 结构化回传 → 组装成后端接受的 rows（不出现 JSON 文本）
  if (t.rowBuilder) {
    const row = {};
    t.rowBuilder.forEach(f => { row[f.n] = val(f.n); });
    body.rows = [row];
    delete body.text;
  }
  // 关联单位 ID 型字段
  if (body.enabled !== undefined) body.enabled = body.enabled === true || body.enabled === 'true';
  return { body, qs };
}

async function runV28(id) {
  const t = findV28Tool(id);
  if (!t) return;
  if (t.confirm && !confirm(`确认执行「${t.title}」？该操作会写入业务数据。`)) return;
  const method = t.method || 'GET';
  const collected = collectV28(t, id);
  if (collected.error) { toast('✗ ' + collected.error, 4000); return; }
  const { body, qs } = collected;
  // 文件选择：读取为文本
  const fileField = (t.fields || []).find(f => f.type === 'file');
  if (fileField) {
    const el = $('f_' + id + '_' + fileField.n);
    const file = el && el.files && el.files[0];
    if (!file) { toast('✗ 请先选择文件', 3500); return; }
    body.text = await file.text();
  }
  const out = $('out_' + id);
  const query = t.api + (qs.length ? '?' + qs.join('&') : '');
  if (t.download) { window.open(query); toast('✓ 已生成下载文件（浏览器新窗口）'); return; }
  if (out) out.innerHTML = '<div class="muted">处理中…</div>';
  try {
    const d = await api(query, method, method === 'GET' ? undefined : body);
    if (out) out.innerHTML = renderV28Result(d);
    toast('✓ ' + t.title + ' 完成');
  } catch (e) {
    if (out) out.innerHTML = `<div class="tag t-rejected">✗ ${esc(e.message)}</div>`;
    toast('✗ ' + e.message, 4000);
  }
}
