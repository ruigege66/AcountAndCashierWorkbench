/* V2.6 分析中心页面（在线报告 / 规则配置 / 联动关系） */
Object.assign(PAGES, {
  /* ---- V2.6 分析中心 ---- */

  analysis: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/reports/analysis?period=' + p);
    return `<div class="page-head"><div><h2>在线经营分析报告</h2>
      <div class="hint">基于账套现有数据自动生成 · 图文一体 · 纯内联 SVG，离线可用、可打印为 PDF</div></div>
      <div style="display:flex;gap:8px">
        <input type="month" id="vPeriod" value="${p}" oninput="S.filters.vPeriod=this.value" onchange="render()" style="width:165px">
        <button class="btn btn-p" onclick="window.open('/api/reports/analysis.html?period=${p}')">↗ 新窗口打开</button>
        <button class="btn btn-g" onclick="window.open('/api/reports/analysis.html?period=${p}&download=1')">⬇ 导出 HTML</button></div></div>
      <div class="banner">报告含 <b>7 张图表</b>（收入 / 净利趋势、资产负债结构、现金流、比率、账龄）、
        <b>${d.conclusions.length} 条自动结论</b>、计算规则说明书、数据血缘与功能联动图；下方为实时预览。</div>
      <div class="grid2">${d.conclusions.slice(0, 4).map(c => `<div class="card"><h3>${esc(c.title)}</h3>
        <p class="muted">${esc(c.text)}</p></div>`).join('')}</div>
      <div class="card" style="padding:0;overflow:hidden">
        <iframe src="/api/reports/analysis.html?period=${p}" style="width:100%;height:1100px;border:0" title="经营分析报告"></iframe></div>`;
  },

  rules: async () => {
    const d = await api('/api/analysis/rules');
    const r = d.rules;
    const ta = (id, arr, tip) => `<label>${tip}</label><textarea id="${id}" rows="2"
      style="width:100%;font-family:monospace;font-size:12px">${esc((arr || []).join(', '))}</textarea>`;
    return `<div class="page-head"><div><h2>分析规则配置</h2>
      <div class="hint">所有计算口径集中于此，保存后现金流量分类、比率阈值、账龄基准日与坏账比例立即全站生效</div></div>
      <div style="display:flex;gap:8px"><button class="btn btn-p" onclick="saveAnalysisRules()">保存规则</button>
      <button class="btn btn-g" onclick="resetAnalysisRules()">恢复默认</button>
      <button class="btn btn-g" onclick="go('analysis')">查看分析报告 →</button></div></div>
      <div class="banner">规则驱动：改这里 → 所有报表、比率、报告、导出同时按新口径重算，无需改代码。</div>
      <div class="grid2">
        <div class="card"><h3>① 流动性划分（科目前缀）</h3>
          ${ta('rl_nca', r.liquidity.noncurrent_asset, '非流动资产（如 15 16 17 18）')}
          ${ta('rl_cl', r.liquidity.current_liability, '流动负债（如 20 22 23）')}
          ${ta('rl_ncl', r.liquidity.noncurrent_liability, '非流动负债（如 25 27，长期借款）')}
          ${ta('rl_inv', r.liquidity.inventory, '存货（速动比率扣除，如 14）')}
          <p class="muted">审计修复：流动比率分母曾误用「总负债」，导致长期借款被算作流动负债。</p></div>
        <div class="card"><h3>② 现金流分类（科目前缀，最长匹配）</h3>
          ${ta('cf_op', r.cashflow.operating, '经营活动')}
          ${ta('cf_inv', r.cashflow.investing, '投资活动')}
          ${ta('cf_fin', r.cashflow.financing, '筹资活动')}
          <label>未命中科目的处理</label><select id="cf_un" style="width:100%">
            <option value="warn" ${r.cashflow.unclassified === 'warn' ? 'selected' : ''}>单列「未分类」并提示（推荐）</option>
            <option value="operating" ${r.cashflow.unclassified === 'operating' ? 'selected' : ''}>并入经营活动（旧行为）</option></select></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>③ 账龄与坏账计提</h3>
          <label>账龄基准日</label><select id="ag_basis" style="width:100%">
            <option value="period_end" ${r.aging.basis === 'period_end' ? 'selected' : ''}>按所选期间月末（推荐，可回溯）</option>
            <option value="today" ${r.aging.basis === 'today' ? 'selected' : ''}>按系统当前日期</option></select>
          <table style="margin-top:10px"><thead><tr><th>账龄区间</th><th>计提比例 %</th></tr></thead><tbody>
          ${r.aging.buckets.map(b => `<tr><td>${esc(b)}</td><td><input type="number" step="0.01" min="0" max="100"
            data-rate="${esc(b)}" value="${(r.aging.rates[b] * 100).toFixed(2)}" style="width:110px"></td></tr>`).join('')}
          </tbody></table></div>
        <div class="card"><h3>④ 财务比率健康区间</h3>
          <table><thead><tr><th>指标</th><th>下限 ≥</th><th>上限 ≤</th></tr></thead><tbody>
          ${Object.keys(r.ratios).map(n => `<tr><td>${esc(n)}</td>
            <td><input type="number" step="0.1" data-th="${esc(n)}" data-bound="min"
              value="${r.ratios[n].min ?? ''}" style="width:90px"></td>
            <td><input type="number" step="0.1" data-th="${esc(n)}" data-bound="max"
              value="${r.ratios[n].max ?? ''}" style="width:90px"></td></tr>`).join('')}
          </tbody></table><p class="muted" style="margin-top:8px">留空表示不限；状态为「健康 / 关注」并计入健康度评分。</p></div>
      </div>
      <div class="card"><h3>规则说明</h3>${table(d.docs, [
        { t: '配置项', f: x => `<b>${esc(x.path)}</b>` },
        { t: '名称', f: x => esc(x.name) },
        { t: '说明', f: x => `<span class="muted">${esc(x.desc)}</span>` },
      ])}</div>`;
  },

  graph: async () => {
    const [g, rb] = await Promise.all([api('/api/analysis/graph'), api('/api/analysis/rulebook')]);
    const writes = g.nodes.filter(n => n.type === 'write');
    const targets = {};
    g.edges.forEach(e => (targets[e.to] = targets[e.to] || []).push(e.from));
    const ans = g.nodes.filter(n => n.type === 'analysis' && targets[n.id]).sort((a, b) => targets[b.id].length - targets[a.id].length);
    const W = 880, lx = 8, rx = 620, rowH = 22;
    const H = Math.max(writes.length, ans.length) * rowH + 28;
    const ly = {}, ry = {};
    writes.forEach((n, i) => ly[n.id] = 18 + i * rowH);
    ans.forEach((n, i) => ry[n.id] = 18 + i * rowH);
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">`;
    g.edges.forEach(e => {
      if (ly[e.from] === undefined || ry[e.to] === undefined) return;
      const mx = (lx + 160 + rx) / 2;
      svg += `<path d="M${lx+160},${ly[e.from]} C${mx},${ly[e.from]} ${mx},${ry[e.to]} ${rx},${ry[e.to]}"
        fill="none" stroke="#B9C7DE" stroke-width="1" opacity=".7"><title>${esc(e.effect)}</title></path>`;
    });
    writes.forEach(n => { svg += `<rect x="${lx}" y="${ly[n.id]-9}" width="152" height="18" rx="4" fill="#2F5597"/>
      <text x="${lx+76}" y="${ly[n.id]+4}" text-anchor="middle" fill="#fff" font-size="10">${esc(n.label)}</text>`; });
    ans.forEach(n => { const t = Math.min(1, targets[n.id].length / 5);
      svg += `<rect x="${rx}" y="${ry[n.id]-9}" width="240" height="18" rx="4"
        fill="rgb(${Math.round(68+40*t)},${Math.round(114-20*t)},${Math.round(196-40*t)})"/>
        <text x="${rx+120}" y="${ry[n.id]+4}" text-anchor="middle" fill="#fff" font-size="10">${esc(n.label)} · 被 ${targets[n.id].length} 类操作影响</text>`; });
    svg += '</svg>';
    if (writes.length) setTimeout(() => { if (S.page === 'graph') showImpactDetail(writes[0].id); }, 0);
    return `<div class="page-head"><div><h2>功能联动关系</h2>
      <div class="hint">${writes.length} 类写操作 → ${ans.length} 项分析功能，共 ${g.edges.length} 条影响链；每次写操作后系统会自动提示受影响的下游</div></div></div>
      <div class="banner">会计数据是网状结构：一张凭证过账会同时改变资产负债表、利润表、现金流、比率、同比、勾稽与待办。这里把依赖显式化，避免「改一处、错一片」。</div>
      <div class="card"><h3>依赖关系图</h3>${svg}</div>
      <div class="card"><h3>影响链明细（点选查看）</h3>
        <select onchange="showImpactDetail(this.value)" style="width:260px">
          ${g.actions.map(a => `<option value="${a.id}">${esc(a.label)}（${a.count} 条影响）</option>`).join('')}
        </select><div id="impactDetail" style="margin-top:12px"></div></div>
      <div class="card"><h3>计算规则说明书</h3>${table(rb.metrics, [
        { t: '指标', f: x => `<b>${esc(x.name)}</b>` },
        { t: '公式', f: x => esc(x.formula) },
        { t: '数据源', f: x => `<span class="muted">${esc(String(x.source))}</span>` },
        { t: '口径 / 局限', f: x => `<span class="muted">${esc(x.limitation || x.scope)}</span>` },
      ])}</div>
      <div class="card"><h3>数据血缘</h3>${table(rb.lineage, [
        { t: '指标组', f: x => `<b>${esc(x.metric)}</b>` },
        { t: '来源表', f: x => `<span class="muted">${esc(x.sources.join(' / '))}</span>` },
        { t: '计算规则', f: x => esc(x.rule) },
      ])}</div>`;
  },

});
