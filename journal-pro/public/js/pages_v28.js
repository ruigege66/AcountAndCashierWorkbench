/* V2.8 工具工作台：数据驱动的功能注册表（32 个工具 / 24+ 功能）
   新增功能只需在 V28_TOOLS 里加一项，页面、表单、请求、结果渲染自动生效。 */
const V28_TOOLS = {
  acct: [
    { id: 'dimReport', title: '按部门/项目查看收支', desc: '按部门 / 职员等维度汇总已过账分录', api: '/api/v28/dimensions/report',
      fields: [{ n: 'dim_key', l: '维度', v: '部门' }, { n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'dimSet', title: '① 设置辅助核算维度', desc: '给凭证明细行打上维度标签', api: '/api/v28/dimensions', method: 'POST',
      fields: [{ n: 'entity_type', l: '对象类型', v: 'voucher_line' }, { n: 'entity_id', l: '明细行 ID', v: '1', type: 'number' },
               { n: 'dim_key', l: '维度', v: '部门' }, { n: 'dim_value', l: '值', v: '销售部' }] },
    { id: 'batchPost', title: '② 凭证批量过账', desc: '按 ID 批量过账，自动校验职责分离并返回影响链', api: '/api/v28/vouchers/batch', method: 'POST', confirm: true,
      fields: [{ n: 'ids', l: '凭证 ID（逗号分隔）', v: '1,2' }, { n: 'action', l: '动作 approve/post', v: 'post' }, { n: 'actor', l: '操作人', v: '会计主管' }] },
    { id: 'trialCompare', title: '③ 多月份科目对比', desc: '科目各期借贷净额 + 波动超 100% 异常标记', api: '/api/v28/reports/trial-compare',
      fields: [{ n: 'periods', l: '期间（逗号分隔）', v: '2026-10,2026-11' }] },
    { id: 'accrualList', title: '④ 待摊费用台账', desc: '总额、月摊销、已摊与剩余', api: '/api/v28/accruals', fields: [] },
    { id: 'accrualAdd', title: '④ 新增待摊费用', desc: '登记后可按月一键生成摊销凭证', api: '/api/v28/accruals', method: 'POST',
      fields: [{ n: 'name', l: '名称', v: '年度软件费' }, { n: 'total_amount', l: '总额', v: '1200', type: 'number' },
               { n: 'start_period', l: '起始期间', v: thisMonth() }, { n: 'end_period', l: '结束期间', v: '2026-12' }] },
    { id: 'accrualRun', title: '④ 执行本月摊销', desc: '自动生成并过账凭证，同一期间防重复', api: '/api/v28/accruals/run', method: 'POST', confirm: true,
      fields: [{ n: 'period', l: '期间', v: thisMonth() }, { n: 'actor', l: '操作人', v: '会计主管' }] },
    { id: 'numbering', title: '⑤ 凭证编号规则 / 校验', desc: '前缀与位数可配，校验历史编号合规性', api: '/api/v28/numbering/validate', fields: [] },
    { id: 'estimate', title: '⑥ 会计估计变更留痕', desc: '折旧年限 / 坏账比例变更登记与查询', api: '/api/v28/estimate-changes', fields: [] },
    { id: 'attachments', title: '⑦ 附件缺失检查', desc: '已过账但无附件的凭证清单', api: '/api/v28/vouchers/missing-attachments', fields: [] },
    { id: 'subjectUsage', title: '⑧ 科目使用频率分析', desc: '僵尸科目与 180 天未使用科目', api: '/api/v28/subjects/usage', fields: [] },
  ],
  cashier: [
    { id: 'cashCount', title: '⑨ 现金盘点（按面额）', desc: '填入各面额张数，自动算出实盘金额与账实差额', api: '/api/v28/cash-count', method: 'POST', confirm: true,
      fields: [{ n: 'count_date', l: '盘点日期', v: today() }], denominations: [100, 50, 20, 10, 5, 1, 0.5, 0.1],
      actionLabel: '保存盘点结果' },
    { id: 'cashCountList', title: '⑨ 盘点记录', desc: '历史盘点与账实差额', api: '/api/v28/cash-count', fields: [] },
    { id: 'bills', title: '⑩ 票据台账', desc: '支票 / 汇票登记、到期与逾期预警', api: '/api/v28/bills', fields: [] },
    { id: 'billAdd', title: '⑩ 登记票据', desc: '新增支票或汇票', api: '/api/v28/bills', method: 'POST',
      fields: [{ n: 'bill_no', l: '票据号', v: 'ZP001' }, { n: 'kind', l: '类型', v: '支票' },
               { n: 'amount', l: '金额', v: '5000', type: 'number' }, { n: 'issue_date', l: '出票日', v: today() },
               { n: 'due_date', l: '到期日', v: '2026-12-01' }] },
    { id: 'bankBalances', title: '⑪ 多账户资金余额', desc: '各银行账户 + 库存现金合计', api: '/api/v28/bank-balances', fields: [] },
    { id: 'fundsDaily', title: '⑫ 资金日报', desc: '按日收付存与区间汇总', api: '/api/v28/funds/daily',
      fields: [{ n: 'from', l: '开始', v: thisMonth() + '-01' }, { n: 'to', l: '结束', v: today() }] },
    { id: 'approval', title: '⑬ 付款审批分级', desc: '按金额返回应审批人', api: '/api/v28/approval-tiers',
      fields: [{ n: 'amount', l: '金额', v: '8000' }] },
    { id: 'forecast', title: '⑭ 未来资金预测', desc: '未核销发票 + 票据到期，按日预测流入流出', api: '/api/v28/funds/forecast',
      fields: [{ n: 'days', l: '天数', v: '30', type: 'number' }] },
    { id: 'cashLimit', title: '⑮ 库存现金限额', desc: '超限预警与限额设置', api: '/api/v28/cash-limit', fields: [] },
  ],
  audit: [
    { id: 'arch', title: '⑯ 系统结构体检', desc: '文件规模 / SQL 分布 / 依赖边 / 环 / 分层违规', api: '/api/v28/audit/architecture', fields: [] },
    { id: 'score', title: '⑰ 系统健康评分', desc: '6 个维度打分与改进建议', api: '/api/v28/audit/scorecard', fields: [] },
    { id: 'smells', title: '⑱ 系统质量提示', desc: '超长函数 / 动态 SQL / 裸 except / 硬编码凭据', api: '/api/v28/audit/smells', fields: [] },
    { id: 'routes', title: '⑲ 系统功能清单', desc: '全部路由、分组统计、查表平均耗时', api: '/api/v28/audit/routes', fields: [] },
    { id: 'matrix', title: '⑳ 模块关系一览', desc: '模块 × 模块依赖、环与分层违规', api: '/api/v28/audit/dependency-matrix', fields: [] },
    { id: 'runtime', title: '㉑ 系统运行状态', desc: '数据库 / 迁移版本 / 审计链 / 路由数', api: '/api/v28/audit/runtime', fields: [] },
  ],
  security: [
    { id: 'secConfig', title: '㉒ 安全配置中心', desc: '总开关、失败锁定、限流、CSRF、脱敏字段', api: '/api/v28/security/config', fields: [] },
    { id: 'secEnable', title: '㉒ 开启 / 关闭防护', desc: '开启后中间件真正拦截高风险输入与超限请求', api: '/api/v28/security/config', method: 'POST', confirm: true,
      fields: [{ n: 'enabled', l: 'enabled（true/false）', v: 'false' }] },
    { id: 'operators', title: '㉓ 操作员管理', desc: '新增操作员并分配角色', api: '/api/v28/security/operators', method: 'POST',
      fields: [{ n: 'name', l: '账号', v: '张会计' }, { n: 'password', l: '密码', v: 'Test@123' },
               { n: 'role', l: '角色', v: 'accountant' }] },
    { id: 'roles', title: '㉔ 角色权限矩阵', desc: '内置 4 角色 + 自定义角色', api: '/api/v28/security/roles', fields: [] },
    { id: 'login', title: '㉕ 登录 / 会话', desc: '失败锁定、签发 8 小时会话', api: '/api/v28/security/login', method: 'POST',
      fields: [{ n: 'name', l: '账号', v: '张会计' }, { n: 'password', l: '密码', v: 'Test@123' }] },
    { id: 'sensitive', title: '㉖ 敏感操作审计', desc: '删除 / 冲销 / 结账 / 权限变更标记', api: '/api/v28/security/sensitive-ops', fields: [] },
    { id: 'rateLimit', title: '㉗ 限流状态', desc: '每分钟请求上限与当前客户端计数', api: '/api/v28/security/rate-limit', fields: [] },
    { id: 'scan', title: '㉘ 输入内容安全检查', desc: 'XSS / SQL 注入 / 路径穿越 / 凭据泄露特征', api: '/api/v28/security/scan', method: 'POST',
      fields: [{ n: 'text', l: '待检文本', v: "SELECT * FROM t WHERE 1=1 OR 1=1" }] },
    { id: 'masking', title: '㉙ 账号信息打码预览', desc: '账号 / 手机号 / 身份证掩码', api: '/api/v28/security/masking', method: 'POST', fields: [] },
    { id: 'csrf', title: '㉚ 安全令牌', desc: '一次性令牌，开启后校验写请求', api: '/api/v28/security/csrf', fields: [] },
    { id: 'events', title: '㉛ 安全事件日志', desc: '观测与拦截事件', api: '/api/v28/security/events', fields: [] },
  ],
  gateway: [
    { id: 'gwDash', title: '★ 外部协同工作台', desc: '待开票/待付款/待回传统计与合规流程', api: '/api/v28/gateway/dashboard', fields: [] },
    { id: 'gwCp', title: '① 往来单位开票/收款资料', desc: '税号、发票抬头、地址电话、开户行账号完整度', api: '/api/v28/gateway/counterparties', fields: [] },
    { id: 'gwCpSet', title: '① 维护单位资料', desc: '补齐税号与收款账号（导出前自动刷新）', api: '/api/v28/gateway/counterparties', method: 'POST',
      fields: [{ n: 'id', l: '单位 ID', v: '1', type: 'number' }, { n: 'tax_id', l: '纳税人识别号', v: '' },
               { n: 'invoice_title', l: '发票抬头', v: '' }, { n: 'bank_name', l: '开户行', v: '' }, { n: 'bank_account', l: '银行账号', v: '' }] },
    { id: 'gwInvSync', title: '② 同步开票任务', desc: '从已结算收款单/待开票记录生成任务', api: '/api/v28/gateway/invoice-tasks/sync', method: 'POST', fields: [] },
    { id: 'gwInvTasks', title: '③ 开票任务队列', desc: '待导出/已导出/已完成 + 校验结果', api: '/api/v28/gateway/invoice-tasks', fields: [] },
    { id: 'gwInvCheck', title: '④ 开票前校验', desc: '缺税号/抬头/金额/税率异常', api: '/api/v28/gateway/invoice-validate', fields: [] },
    { id: 'gwInvExp', title: '⑤ 导出数电票批量模板 CSV', desc: '生成官方批量开票格式（Excel 可直接打开）', api: '/api/v28/gateway/invoice-export', download: true, fields: [] },
    { id: 'gwInvBack', title: '⑥ 登记开票结果', desc: '把税务局开好的发票信息填进来，系统自动登记台账并查重', api: '/api/v28/gateway/invoice-import', method: 'POST',
      fields: [], rowBuilder: [
        { n: 'task_id', l: '任务编号', v: '', type: 'number' },
        { n: 'invoice_no', l: '发票号码', v: '' },
        { n: 'invoice_date', l: '开票日期', v: today() },
        { n: 'amount', l: '不含税金额', v: '', type: 'number' },
        { n: 'tax_amount', l: '税额', v: '', type: 'number' }],
      actionLabel: '登记发票' },
    { id: 'gwPortal', title: '⑦ 电子税务局入口', desc: '仅提供官方链接，不代登录', api: '/api/v28/gateway/tax-portals', fields: [] },
    { id: 'gwPaySync', title: '⑧ 同步付款任务', desc: '从已审批付款单生成任务', api: '/api/v28/gateway/payment-tasks/sync', method: 'POST', fields: [] },
    { id: 'gwPayTasks', title: '⑨ 付款任务队列', desc: '含收款账号/开户行校验', api: '/api/v28/gateway/payment-tasks', fields: [] },
    { id: 'gwPayExp', title: '⑩ 导出银行批量付款文件', desc: '按银行格式模板生成 CSV', api: '/api/v28/gateway/payment-export', download: true,
      fields: [{ n: 'template', l: '模板名', v: '通用批量付款' }] },
    { id: 'gwPayBack', title: '⑪ 登记银行付款结果', desc: '填写银行处理结果，自动更新付款任务状态', api: '/api/v28/gateway/payment-import', method: 'POST',
      fields: [], rowBuilder: [
        { n: 'task_id', l: '任务编号', v: '', type: 'number' },
        { n: 'status', l: '处理结果', v: 'success', options: [['success', '付款成功'], ['fail', '付款失败']] },
        { n: 'bank_ref', l: '银行流水号', v: '' },
        { n: 'note', l: '备注', v: '' }],
      actionLabel: '登记结果' },
    { id: 'gwStmt', title: '⑫ 导入银行对账单', desc: '选择从网银下载的 CSV/Excel 文件，系统自动识别列并查重', api: '/api/v28/gateway/statement-import', method: 'POST',
      fields: [{ n: 'template', l: '银行格式', v: '通用对账单', options: [['通用对账单', '通用格式（日期/摘要/收入/支出）'], ['工商银行对账单', '工商银行格式']] },
               { n: 'text', l: '对账单文件', v: '', type: 'file' }], actionLabel: '导入并查重' },
    { id: 'gwTpl', title: '⑬ 银行格式模板', desc: '付款/对账单列映射、编码、分隔符', api: '/api/v28/gateway/bank-templates', fields: [] },
    { id: 'gwCfg', title: '⑭ 直连配置（不含凭据）', desc: 'file 模式默认；API 模式需税局/银行资质', api: '/api/v28/gateway/config', fields: [] },
  ],
  tax: [
    { id: 'taxDash', title: '★ 税务申报工作台', desc: '本月增值税/附加/个税汇总与征期倒计时', api: '/api/v28/tax/dashboard',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'taxConfig', title: '① 税率配置中心（两位小数）', desc: '增值税率 / 附加 / 所得税 / 小微分段 / 个税表 / 税负率区间', api: '/api/v28/tax/config', fields: [] },
    { id: 'taxCalendar', title: '② 征期日历', desc: '各税种截止日（周末顺延）', api: '/api/v28/tax/calendar', fields: [] },
    { id: 'outputLedger', title: '③ 销项税额台账', desc: '按税率分组（自动推断 13%/9%/6%…）', api: '/api/v28/tax/output-ledger',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'inputLedger', title: '④ 进项税额台账', desc: '含认证状态：仅已认证可抵扣', api: '/api/v28/tax/input-ledger',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'inputCerts', title: '⑤ 进项认证', desc: '批量更新认证状态', api: '/api/v28/tax/input-certs', method: 'POST',
      fields: [{ n: 'invoice_nos', l: '发票号（逗号分隔）', v: '' }, { n: 'cert_status', l: '状态', v: '已认证' }] },
    { id: 'vatFiling', title: '⑥⑦ 增值税申报测算', desc: '销项−已认证进项+转出=应纳，附加联动', api: '/api/v28/tax/filing',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'vatSave', title: '⑦ 保存申报测算', desc: '同期间幂等更新，可记录已缴金额', api: '/api/v28/tax/filing', method: 'POST',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }, { n: 'paid', l: '已缴税额', v: '0', type: 'number' }] },
    { id: 'surtaxes', title: '⑧ 附加税费', desc: '城建 7% / 教育 3% / 地方 2%，基数=应纳增值税', api: '/api/v28/tax/surtaxes',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'taxRatios', title: '⑨⑩ 税负率分析与两点控制', desc: '逐月增值税/所得税税负率（两位小数），超区间预警', api: '/api/v28/tax/ratios',
      fields: [{ n: 'months', l: '月数', v: '12', type: 'number' }] },
    { id: 'ratioTargets', title: '⑩ 设置税负率区间', desc: '低于下限提示少缴风险，高于上限提示多缴', api: '/api/v28/tax/ratio-targets', method: 'POST',
      fields: [{ n: 'low', l: '下限 %', v: '2.00', type: 'number' }, { n: 'high', l: '上限 %', v: '3.50', type: 'number' }] },
    { id: 'citQ', title: '⑫ 企业所得税季度预缴', desc: '利润总额×税率，小微分段自动判定', api: '/api/v28/tax/cit-quarterly', method: 'POST',
      fields: [{ n: 'period', l: '季度末月', v: thisMonth() }] },
    { id: 'ent', title: '⑪ 业务招待费限额', desc: '60% 与收入 0.5% 孰低', api: '/api/v28/tax/adjustments/entertainment', method: 'POST',
      fields: [{ n: 'year', l: '年度', v: '2026' }, { n: 'amount', l: '发生额', v: '1000', type: 'number' }] },
    { id: 'citAnnual', title: '⑭ 汇算清缴测算', desc: '利润+调整项=应纳税所得额，减已预缴', api: '/api/v28/tax/cit-annual',
      fields: [{ n: 'year', l: '年度', v: '2026' }] },
    { id: 'dividend', title: '⑮ 分红个税', desc: '股息红利 20%', api: '/api/v28/tax/dividend', method: 'POST',
      fields: [{ n: 'amount', l: '分红金额', v: '10000', type: 'number' }] },
    { id: 'payrollRun', title: '⑯⑱ 算薪（社保+个税累计预扣）', desc: '社保公积金费率可配，个税按累计预扣法', api: '/api/v28/tax/payroll/run', method: 'POST', confirm: true,
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'payrollList', title: '⑯ 工资表', desc: '各月算薪明细（税前/社保/个税/实发）', api: '/api/v28/tax/payroll', fields: [] },
    { id: 'special', title: '⑰ 专项附加扣除', desc: '子女教育/赡养/房贷/租房等月度限额', api: '/api/v28/tax/special-deductions', fields: [] },
    { id: 'stamp', title: '⑲ 印花税计算器', desc: '购销合同 0.03% 等税目表', api: '/api/v28/tax/stamp', method: 'POST',
      fields: [{ n: 'name', l: '税目', v: '购销合同' }, { n: 'amount', l: '金额', v: '100000', type: 'number' }] },
  ],
};

function v28Card(t) {
  const inp = (n, label, def, type, opts) => {
    if (type === 'file') return `<div style="min-width:190px;flex:1"><label>${esc(label)}</label>
      <input type="file" id="f_${t.id}_${n}" accept=".csv,.txt,.xls,.xlsx" style="width:100%;font-size:12px"></div>`;
    if (opts) return `<div style="min-width:150px;flex:1"><label>${esc(label)}</label>
      <select id="f_${t.id}_${n}" style="width:100%">${opts.map(o =>
        `<option value="${esc(o[0])}" ${String(def) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></div>`;
    return `<div style="min-width:150px;flex:1"><label>${esc(label)}</label>
      <input id="f_${t.id}_${n}" value="${esc(String(def ?? ''))}" style="width:100%"
        ${type === 'number' ? 'type="number" step="0.01"' : ''}
        placeholder="${esc(String(def ?? ''))}" ></div>`;
  };
  let inputs = t.fields.map(f => inp(f.n, f.l, f.v, f.type, f.options)).join('');
  // 面额直接填张数，不出现 JSON
  if (t.denominations) {
    inputs += `<div style="width:100%;margin-top:6px"><label>各面额张数（填数字即可，留空表示没有）</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${t.denominations.map(n =>
        `<div style="width:78px"><label>${n} 元</label><input type="number" min="0" step="1" value="0"
          id="f_${t.id}_den_${n}" style="width:100%"></div>`).join('')}</div></div>`;
  }
  // 结构化回传表单
  if (t.rowBuilder) {
    inputs += `<div style="width:100%;margin-top:8px;padding:10px;background:var(--blue-bg);border-radius:6px">
      <b style="font-size:12.5px">填写回传内容</b>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${t.rowBuilder.map(f =>
        inp(f.n, f.l, f.v, f.type, f.options)).join('')}</div></div>`;
  }
  const tplBtn = t.templateDownload
    ? `<button class="btn btn-g" onclick="window.open('${t.templateDownload}')">⬇ 下载填写模板</button>` : '';
  const label = t.download ? '下载文件' : (t.actionLabel || (t.method === 'POST' ? '执行' : '查看'));
  return `<div class="card" id="tool_${t.id}"><h3>${esc(t.title)}</h3>
    <p class="muted" style="margin-bottom:10px">${esc(t.desc)}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">${inputs}
      <button class="btn ${t.method === 'POST' || t.download ? 'btn-p' : 'btn-g'}" onclick="runV28('${t.id}')">${esc(label)}</button>${tplBtn}</div>
    <div id="out_${t.id}" style="margin-top:10px"></div></div>`;
}

/* 按业务场景组织的常用操作快捷入口（面向非技术用户） */
const V28_QUICK = {
  acct: [['batchPost', '批量过账'], ['accrualRun', '摊销本月费用'], ['attachments', '查缺附件凭证'], ['subjectUsage', '查僵尸科目']],
  cashier: [['cashCount', '现金盘点'], ['fundsDaily', '看资金日报'], ['bills', '票据台账'], ['bankBalances', '各账户余额']],
  audit: [['score', '系统健康评分'], ['runtime', '系统运行状态'], ['routes', '系统功能清单'], ['smells', '系统质量提示']],
  security: [['secConfig', '安全总开关'], ['operators', '操作员与权限'], ['sensitive', '敏感操作记录'], ['events', '安全事件']],
  tax: [['taxDash', '税务申报工作台'], ['vatFiling', '增值税测算'], ['taxRatios', '税负率'], ['payrollRun', '算工资个税']],
  gateway: [['gwDash', '外部协同工作台'], ['gwInvSync', '同步待开票'], ['gwInvExp', '导出开票模板'], ['gwPayExp', '导出付款文件']],
};
function gotoTool(id) {
  const el = $('tool_' + id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.outline = '2px solid var(--primary)';
  setTimeout(() => { el.style.outline = ''; }, 2200);
}
function v28Page(group, title, hint) {
  const tools = V28_TOOLS[group];
  const quick = V28_QUICK[group] || [];
  const quickHtml = quick.length ? `<div class="banner"><b>常用操作，点一下直接跳到对应卡片：</b>　${quick.map(([id, label]) =>
    `<button class="btn btn-g btn-sm" style="margin:2px" onclick="gotoTool('${id}')">${esc(label)}</button>`).join('')}</div>` : '';
  return `<div class="page-head"><div><h2>${esc(title)}</h2><div class="hint">${esc(hint)}</div></div>
    <button class="btn btn-g" onclick="render()">🔄 刷新</button></div>
    <div class="banner"><b>怎么用：</b>在卡片里填好内容 → 点蓝色按钮 → 结果会以<b>中文表格</b>显示在卡片下方，不会看到代码或 JSON；带「下载文件」的按钮会直接生成 Excel 可打开的文件。</div>
    ${quickHtml}
    <div class="grid2">${tools.map(v28Card).join('')}</div>`;
}

Object.assign(PAGES, {
  acct_tools: async () => v28Page('acct', '会计工具箱',
    '辅助核算 · 批量过账 · 多期试算 · 待摊摊销 · 编号规则 · 估计变更 · 附件 · 科目分析'),
  cashier_tools: async () => v28Page('cashier', '出纳工作台',
    '现金盘点 · 票据台账 · 多账户余额 · 资金日报 · 审批分级 · 资金预测 · 现金限额'),
  arch_audit: async () => v28Page('audit', '架构审计中心',
    'AST 静态扫描 · 代码异味 · 接口清单 · 模块关系一览 · 评分卡 · 系统运行状态'),
  sec_center: async () => v28Page('security', '安全中心',
    '默认只观测不阻断；开启后真实拦截。RBAC / 会话 / 限流 / 输入扫描 / 脱敏 / CSRF'),
  gateway_center: async () => v28Page('gateway', '外部系统协同',
    '开票与网银合规自动化：批量模板导出 / 结果回传 / 对账单导入 / 直连配置（不做模拟登录，不存凭据）'),
  tax_center: async () => v28Page('tax', '税务中心',
    '增值税台账与申报测算 · 附加税费 · 税负率两点控制 · 企业所得税预缴与汇算 · 工资社保个税累计预扣 · 印花税（税额与税负率均按两位小数计算）'),
});
