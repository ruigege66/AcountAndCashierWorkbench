/* V2.8 工具工作台：数据驱动的功能注册表（32 个工具 / 24+ 功能）
   新增功能只需在 V28_TOOLS 里加一项，页面、表单、请求、结果渲染自动生效。 */
const V28_TOOLS = {
  acct: [
    { id: 'dimReport', title: '辅助核算维度报表', desc: '按部门 / 职员等维度汇总已过账分录', api: '/api/v28/dimensions/report',
      fields: [{ n: 'dim_key', l: '维度', v: '部门' }, { n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'dimSet', title: '① 设置辅助核算维度', desc: '给凭证明细行打上维度标签', api: '/api/v28/dimensions', method: 'POST',
      fields: [{ n: 'entity_type', l: '对象类型', v: 'voucher_line' }, { n: 'entity_id', l: '明细行 ID', v: '1', type: 'number' },
               { n: 'dim_key', l: '维度', v: '部门' }, { n: 'dim_value', l: '值', v: '销售部' }] },
    { id: 'batchPost', title: '② 凭证批量过账', desc: '按 ID 批量过账，自动校验职责分离并返回影响链', api: '/api/v28/vouchers/batch', method: 'POST', confirm: true,
      fields: [{ n: 'ids', l: '凭证 ID（逗号分隔）', v: '1,2' }, { n: 'action', l: '动作 approve/post', v: 'post' }, { n: 'actor', l: '操作人', v: '会计主管' }] },
    { id: 'trialCompare', title: '③ 多期试算平衡对比', desc: '科目各期借贷净额 + 波动超 100% 异常标记', api: '/api/v28/reports/trial-compare',
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
    { id: 'cashCount', title: '⑨ 现金盘点（按面额）', desc: '录入各面额张数，自动算实盘与账实差额', api: '/api/v28/cash-count', method: 'POST', confirm: true,
      fields: [{ n: 'count_date', l: '日期', v: today() }, { n: 'denominations', l: '面额 JSON', v: '{"100":5,"50":2}', type: 'json' }] },
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
    { id: 'arch', title: '⑯ AST 架构扫描', desc: '文件规模 / SQL 分布 / 依赖边 / 环 / 分层违规', api: '/api/v28/audit/architecture', fields: [] },
    { id: 'score', title: '⑰ 架构评分卡', desc: '6 个维度打分与改进建议', api: '/api/v28/audit/scorecard', fields: [] },
    { id: 'smells', title: '⑱ 代码异味清单', desc: '超长函数 / 动态 SQL / 裸 except / 硬编码凭据', api: '/api/v28/audit/smells', fields: [] },
    { id: 'routes', title: '⑲ 接口清单与耗时', desc: '全部路由、分组统计、查表平均耗时', api: '/api/v28/audit/routes', fields: [] },
    { id: 'matrix', title: '⑳ 依赖矩阵', desc: '模块 × 模块依赖、环与分层违规', api: '/api/v28/audit/dependency-matrix', fields: [] },
    { id: 'runtime', title: '㉑ 运行时健康', desc: '数据库 / 迁移版本 / 审计链 / 路由数', api: '/api/v28/audit/runtime', fields: [] },
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
    { id: 'scan', title: '㉘ 输入安全扫描', desc: 'XSS / SQL 注入 / 路径穿越 / 凭据泄露特征', api: '/api/v28/security/scan', method: 'POST',
      fields: [{ n: 'text', l: '待检文本', v: "SELECT * FROM t WHERE 1=1 OR 1=1" }] },
    { id: 'masking', title: '㉙ 数据脱敏预览', desc: '账号 / 手机号 / 身份证掩码', api: '/api/v28/security/masking', method: 'POST', fields: [] },
    { id: 'csrf', title: '㉚ CSRF Token', desc: '一次性令牌，开启后校验写请求', api: '/api/v28/security/csrf', fields: [] },
    { id: 'events', title: '㉛ 安全事件日志', desc: '观测与拦截事件', api: '/api/v28/security/events', fields: [] },
  ],
};

function v28Card(t) {
  const inputs = t.fields.map(f => `<div style="min-width:150px;flex:1"><label>${esc(f.l)}</label>
    <input id="f_${t.id}_${f.n}" value="${esc(String(f.v ?? ''))}" style="width:100%"
      ${f.type === 'number' ? 'type="number"' : ''}></div>`).join('');
  return `<div class="card"><h3>${esc(t.title)}</h3>
    <p class="muted" style="margin-bottom:10px">${esc(t.desc)}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">${inputs}
      <button class="btn ${t.method === 'POST' ? 'btn-p' : 'btn-g'}" onclick="runV28('${t.id}')">执行</button></div>
    <div id="out_${t.id}" style="margin-top:10px"></div></div>`;
}

function v28Page(group, title, hint) {
  const tools = V28_TOOLS[group];
  return `<div class="page-head"><div><h2>${esc(title)}</h2><div class="hint">${esc(hint)}</div></div>
    <button class="btn btn-g" onclick="render()">🔄 刷新</button></div>
    <div class="banner">共 <b>${tools.length}</b> 个工具，点击「执行」直接调用后端接口；写操作会自动弹出数据联动影响链。</div>
    <div class="grid2">${tools.map(v28Card).join('')}</div>`;
}

Object.assign(PAGES, {
  acct_tools: async () => v28Page('acct', '会计工具箱',
    '辅助核算 · 批量过账 · 多期试算 · 待摊摊销 · 编号规则 · 估计变更 · 附件 · 科目分析'),
  cashier_tools: async () => v28Page('cashier', '出纳工作台',
    '现金盘点 · 票据台账 · 多账户余额 · 资金日报 · 审批分级 · 资金预测 · 现金限额'),
  arch_audit: async () => v28Page('audit', '架构审计中心',
    'AST 静态扫描 · 代码异味 · 接口清单 · 依赖矩阵 · 评分卡 · 运行时健康'),
  sec_center: async () => v28Page('security', '安全中心',
    '默认只观测不阻断；开启后真实拦截。RBAC / 会话 / 限流 / 输入扫描 / 脱敏 / CSRF'),
});
