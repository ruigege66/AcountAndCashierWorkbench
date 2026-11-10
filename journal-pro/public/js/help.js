/* 功能原理提示：给「不懂会计口径」的使用者看的即时说明。
   - 侧栏入口的说明来自 pages_work.js 的 NAV_HELP（data-help 直接写在按钮上）
   - 页面内按钮 / 表头 / 卡片标题由 attachHelp() 按关键词自动匹配 HELP_RULES
   - 浮层统一由 initHelp() 用事件委托渲染，动态页面无需重新绑定
   约定：data-help 用 HELP_SEP(⟦) 分段 = [用途与意义, 计算方式/口径, 使用提示]
*/
const HELP_SCAN = 'button, .btn, .card h3, th, .kpi .label, .stat-line, .tag, .page-head h2';

/* [匹配关键词, 标题, 代表意义, 计算方式 / 取数口径] */
const HELP_RULES = [
  [/税负率|税负/, '税负率', '衡量实际增值税负担是否落在合理区间，偏低可能少计销项、偏高可能进项不足',
    '应纳增值税 ÷ 利润表营业收入 × 100%；默认控制区间 2.00% – 3.50%，保留两位小数'],
  [/销项|输出税额/, '销项税额', '销售货物或提供服务时向购买方收取的增值税，是申报表的加项',
    '按发票税率分组汇总：Σ(不含税金额 × 适用税率)；13% / 9% / 6% 分档'],
  [/进项|抵扣|认证/, '进项税额', '购进时支付的增值税，只有「已认证」的部分才能抵扣',
    '应纳税额 = 销项税额 − 已认证进项税额；未认证进项单列，不参与抵扣'],
  [/应纳税额|申报缴税/, '应纳税额', '本期实际应缴纳的增值税，是附加税费的计算基数',
    '销项税额 − 已认证进项税额 + 进项税额转出 − 留抵税额'],
  [/附加税|城建|教育费/, '附加税费', '以实际缴纳的增值税为基数计提的城建税、教育费附加与地方教育附加',
    '应纳税额 × 12%（城建 7% + 教育费 3% + 地方教育 2%）'],
  [/汇算|所得税|纳税调整/, '企业所得税', '按应纳税所得额计算，季度预缴、年度汇算清缴',
    '应纳税所得额 × 25%（小微企业按优惠税率）；业务招待费按发生额 60% 与收入 5‰ 孰低扣除'],
  [/个税|工资|累计预扣/, '工资薪金个税', '采用累计预扣法，逐月累计收入与扣除后按年度税率表算税',
    '本期应预扣 = (累计收入 − 累计免税收入 − 累计扣除 − 累计专项附加扣除) × 预扣率 − 速算扣除数 − 累计已预扣'],
  [/印花税/, '印花税', '对合同、产权转移书据等应税凭证按件或按金额贴花',
    '按合同类型适用比例税率或按件 5 元，金额 × 适用税率'],
  [/流动比率/, '流动比率', '衡量短期偿债能力：每一元流动负债有多少流动资产覆盖',
    '流动资产 ÷ 流动负债；一般 ≥ 2 较稳妥，分母为 0 时不适用'],
  [/速动比率/, '速动比率', '剔除存货等变现较慢的资产后更保守的短期偿债能力',
    '(流动资产 − 存货) ÷ 流动负债；一般 ≥ 1 较稳妥'],
  [/现金比率/, '现金比率', '只看立刻可用的货币资金，最严格的偿债口径',
    '(库存现金 + 银行存款) ÷ 流动负债'],
  [/资产负债率/, '资产负债率', '反映财务杠杆：总资产中有多少靠负债融资',
    '负债合计 ÷ 资产合计 × 100%；过高说明偿债压力大'],
  [/产权比率/, '产权比率', '债权人权益与股东权益的相对关系',
    '负债合计 ÷ 所有者权益合计 × 100%'],
  [/毛利率|销售毛利/, '销售毛利率', '反映产品或服务本身的盈利空间',
    '(营业收入 − 营业成本) ÷ 营业收入 × 100%'],
  [/净利率|销售净利/, '销售净利率', '扣除全部成本费用与税费后的最终盈利水平',
    '净利润 ÷ 营业收入 × 100%'],
  [/周转率/, '周转率', '衡量资产运用效率，管理口径用期末余额而非平均余额',
    '营业收入 ÷ 期末资产（或应收账款）余额'],
  [/健康评分|综合评分/, '健康评分', '把 10 项比率按阈值判为「健康 / 关注」后加权汇总',
    '健康项权重之和 ÷ 有效项权重之和 × 100'],
  [/净利润/, '净利润', '本期经营成果，是利润表与资产负债表留存收益的共同口径',
    '营业收入 − 营业成本 − 税金及附加 − 三项期间费用 ± 其他损益 − 所得税费用'],
  [/营业收入/, '营业收入', '利润表首行，也是税负率、增长率、周转率的共同分母',
    '主营业务收入 + 其他业务收入（按已过账贷方发生额归集，排除结转凭证）'],
  [/试算平衡|科目余额/, '试算平衡', '检验全部科目借贷发生额是否相等，是记账正确的第一道关',
    'Σ 借方发生额 = Σ 贷方发生额；科目余额 = 期初 + 已过账借贷净额'],
  [/勾稽|资产负债表/, '三大勾稽', '三张表之间必须同时成立的三个恒等关系',
    '资产 = 负债 + 权益；分年累计净利 = 留存收益；现金流净额 = 货币资金变动'],
  [/现金流量|现金流/, '现金流量净额', '一段期间内现金及等价物的净增减，只认出纳日记账流水',
    'Σ 流入 − Σ 流出；按对方科目归入经营 / 投资 / 筹资三类'],
  [/折旧/, '折旧', '把固定资产成本在其使用寿命内系统分摊到各期费用',
    '月折旧 = 原值 × (1 − 残值率) ÷ 使用月数；最后一个月按剩余可折旧额计提'],
  [/摊销/, '摊销', '把待摊费用或无形资产成本按受益期分摊',
    '每期摊销额 = 待摊总额 ÷ 受益期数；已摊销期数不再重复计提'],
  [/坏账|减值|计提/, '坏账准备', '按账龄估计收不回来的应收，作为资产的减项',
    '应计提额 = Σ(各账龄段应收 × 计提率)；与 1231 已计提额比较取差额补提或冲回'],
  [/账龄/, '账龄', '应收款项自到期日起未收回的时间长度，越长风险越高',
    '账龄 = 账龄基准日 − 发票到期日；基准日与分段比例可在分析规则中配置'],
  [/过账|批量过账/, '凭证过账', '把审核通过的凭证正式记入账簿，并自动生成出纳流水',
    '过账后 status=posted，才进入科目余额 / 三大报表；重复过账不会重复入账'],
  [/冲销|红字/, '红字冲销', '账本不可删改，更正错误要用一笔相反方向的分录抵消',
    '按原分录金额生成红字（负数）凭证，再录入正确分录；审计链保持完整'],
  [/作废/, '作废', '把草稿凭证标记为无效，不再进入任何报表',
    '仅未过账凭证可作废；已作废凭证不能过账，也不产生出纳流水'],
  [/审批|审核/, '审批', '制单与审核职责分离，防止同一人既制单又放行',
    '开启职责分离时，申请人不能审批自己的单据；换角色或换操作人后可继续'],
  [/结算|办理收付/, '单据结算', '把已审批单据转成正式凭证并完成资金收付登记',
    '自动生成借贷平衡凭证并立即过账，同时写入出纳日记账；单据状态 → 已结算'],
  [/核销/, '核销', '把收款与对应应收（或借款与报销）互相冲抵',
    '往来余额 = 发票金额 − 已核销金额；备用金借款可由报销单自动冲抵'],
  [/对账|匹配/, '银行对账', '把银行对账单流水与系统日记账逐笔核对',
    '按日期 + 金额 + 方向匹配；未匹配流水进入待办并可能触发超期预警'],
  [/结账|反结账/, '期末结账', '锁定一个会计期间，禁止再新增或修改该期数据',
    '结账前跑检查清单（未过账凭证、未核对流水等）；需补录时先反结账'],
  [/年度结转|结转/, '年度结转', '把本年利润转入利润分配，使新年度重新开始累计',
    '借 4103 本年利润 / 贷 4104 利润分配；凭证标记 is_closing，不计入利润表'],
  [/预算|超支/, '预算控制', '支出类单据办理前检查是否超出当期科目预算',
    '已用额 + 本笔金额 > 预算额 时拦截；已用额取自该期间该科目已过账借方净额'],
  [/差异分析|差异/, '预算差异', '实际发生额与预算额的偏离，用于经营复盘',
    '差异额 = 实际发生额 − 预算额；差异率 = 差异额 ÷ 预算额 × 100%'],
  [/NPV|净现值/, '净现值 NPV', '把未来现金流折现后减去初始投资，判断项目是否创造价值',
    'NPV = Σ CFt ÷ (1+r)^t − 初始投资；NPV > 0 通常可行'],
  [/IRR|内部收益率/, '内部收益率 IRR', '使项目净现值恰好为 0 的折现率',
    '解 Σ CFt ÷ (1+IRR)^t = 初始投资；IRR 高于资本成本时项目可行'],
  [/WACC|资本成本/, '加权平均资本成本 WACC', '企业全部资本的平均成本，常用作投资项目的折现率',
    '股权成本 × 股权权重 + 债务成本 × (1 − 所得税率) × 债务权重'],
  [/杜邦|ROE/, '杜邦分析', '把净资产收益率拆成盈利、效率与杠杆三部分',
    'ROE = 销售净利率 × 总资产周转率 × 权益乘数'],
  [/EVA|经济增加值/, 'EVA', '扣除资本成本后真正创造的经济利润',
    'EVA = 税后净营业利润 − 资本占用 × WACC'],
  [/现值|折现|租赁/, '现值', '未来一笔钱按折现率换算到今天值多少',
    'PV = FV ÷ (1+r)^n；年金现值按各期折现后求和'],
  [/抽样|函证|底稿/, '审计抽样', '用样本推断总体，大额全查、中低额随机抽',
    '大额项 100% 抽查；其余按金额分层随机抽样，函证差异需查明原因'],
  [/ECL|预期信用损失/, 'ECL 预期信用损失', '按信用风险阶段计提金融资产减值',
    '阶段一按未来 12 个月预期损失；阶段二 / 三按整个存续期预期损失'],
  [/关联交易|反洗钱/, '关联方与反洗钱', '识别关联交易与可疑交易，满足监管报送要求',
    '按对手方关联关系标记；命中名单或异常金额进入筛查结果'],
  [/预计负债|或有负债/, '预计负债', '对未决诉讼等可能流出的事项按最佳估计入账',
    '索赔金额 × 发生概率；概率区间跨多个结果时取加权期望'],
  [/盘点/, '现金盘点', '把实盘现金与账面余额核对，找出长短款',
    '实盘 = Σ(面额 × 张数)；差额 = 实盘 − 账面余额，差额非 0 触发预警'],
  [/票据/, '票据台账', '登记应收 / 应付票据并跟踪到期日',
    '到期日进入未来资金预测；临期票据按天数分级预警'],
  [/资金预测|预测/, '资金预测', '基于历史收支趋势推算未来现金余量',
    '线性回归 + 3 个月移动平均混合，给出 ±1σ 区间与可支撑月数'],
  [/演示数据/, '演示数据', '一键载入带 [演示] 标记的示例，方便操作演示',
    '只写入演示表并登记在 demo_records；清空时按主键精确删除，不碰自己录入的数据'],
  [/备份|恢复|迁移包/, '备份与恢复', '把整站程序、文档、测试与数据库快照打包',
    '恢复按快照整体覆盖，执行前会二次确认；迁移包可在另一台机器直接启动'],
  [/哈希链|审计链/, '审计哈希链', '每条审计日志包含前一条的哈希，任何改动都会被发现',
    'hash = SHA256(前一条 hash + 本条内容)；逐条重算校验，断链即报警'],
];

/* 页面顶部的一行说明条：默认收起正文，点开看计算方式与口径 */
function pageHelpHtml(page) {
  const raw = (typeof NAV_HELP === 'object' && NAV_HELP[page]) || '';
  if (!raw) return '';
  const sep = (typeof HELP_SEP !== 'undefined') ? HELP_SEP : '⟦';
  const p = raw.split(sep);
  const label = (typeof NAV_LABEL === 'object' && NAV_LABEL[page]) || page;
  let body = '';
  if (p[1]) body += `<div class="ph-row"><span class="ph-k">计算方式 / 口径</span><span>${esc(p[1])}</span></div>`;
  if (p[2]) body += `<div class="ph-row"><span class="ph-k">使用提示</span><span>${esc(p[2])}</span></div>`;
  body += `<div class="ph-row"><span class="ph-k">小提示</span><span>把鼠标悬浮到本页任意按钮、表头或卡片标题，可看对应指标的解释。</span></div>`;
  return `<details class="page-help" data-help="${esc(raw)}">
    <summary><span class="ph-ico">💡</span><b>${esc(label)}</b>
      <span class="ph-text">${esc(p[0])}</span>
      <span class="ph-more">口径 / 计算方式 ▾</span></summary>
    <div class="ph-body">${body}</div>
  </details>`;
}

/* 给动态渲染出的按钮 / 表头 / 卡片标题按关键词自动挂说明 */
function attachHelp(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  const sep = (typeof HELP_SEP !== 'undefined') ? HELP_SEP : '⟦';
  let nodes;
  try { nodes = Array.prototype.slice.call(root.querySelectorAll(HELP_SCAN)); } catch (e) { return; }
  nodes.forEach(el => {
    try {
      if (el.getAttribute && el.getAttribute('data-help')) return;
      const txt = (el.textContent || '').trim();
      if (!txt || txt.length > 42) return;
      const hit = HELP_RULES.find(r => r[0].test(txt));
      if (!hit) return;
      el.setAttribute('data-help', [hit[2], hit[3], ''].join(sep));
      el.classList.add('has-help');
    } catch (e) { warn(e); }
  });
}

/* 悬浮浮层：事件委托，动态内容无需重绑 */
function initHelp() {
  if (typeof document === 'undefined') return;
  const sep = (typeof HELP_SEP !== 'undefined') ? HELP_SEP : '⟦';
  let tip;
  try {
    tip = document.getElementById('helpTip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'helpTip';
      tip.className = 'help-tip';
      tip.setAttribute('role', 'tooltip');
      document.body.appendChild(tip);
    }
  } catch (e) { return; }

  function findHelp(n) {
    let i = 0;
    while (n && i < 8) {
      if (n.getAttribute && n.getAttribute('data-help')) return n;
      n = n.parentNode;
      i++;
    }
    return null;
  }
  function show(el) {
    try {
      const p = (el.getAttribute('data-help') || '').split(sep);
      const title = (el.textContent || '').trim().slice(0, 26) || '功能说明';
      let html = `<div class="ht-title">${esc(title)}</div>`;
      if (p[0]) html += `<div class="ht-desc">${esc(p[0])}</div>`;
      if (p[1]) html += `<div class="ht-formula"><span>计算方式 / 口径</span>${esc(p[1])}</div>`;
      if (p[2]) html += `<div class="ht-note">${esc(p[2])}</div>`;
      tip.innerHTML = html;
      tip.classList.add('show');
      const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (r) {
        const de = (typeof document !== 'undefined' && document.documentElement) || {};
        const vw = (window.innerWidth || de.clientWidth) || 1280;
        const vh = (window.innerHeight || de.clientHeight) || 800;
        // 优先放在元素下方；下方不够则翻到上方；最后统一钳制在视口内，
        // 否则侧栏靠下的元素会把浮层定位到屏幕外，用户根本看不见。
        let top = r.bottom + 10;
        if (top + 215 > vh) top = r.top - 215;
        top = Math.min(Math.max(10, top), Math.max(10, vh - 220));
        tip.style.left = Math.min(Math.max(10, r.left), Math.max(10, vw - 354)) + 'px';
        tip.style.top = top + 'px';
      }
    } catch (e) { warn(e); }
  }
  function hide() { try { tip.classList.remove('show'); } catch (e) { warn(e); } }

  try {
    document.addEventListener('mouseover', e => { const t = findHelp(e.target); if (t) show(t); });
    document.addEventListener('mouseout', e => { const t = findHelp(e.target); if (t) hide(); });
    document.addEventListener('focusin', e => { const t = findHelp(e.target); if (t) show(t); });
    document.addEventListener('focusout', hide);
    attachHelp(document.body);
  } catch (e) { warn(e); }
}
