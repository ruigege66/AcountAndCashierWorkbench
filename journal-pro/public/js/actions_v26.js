/* ================= V2.6 · 联动提示与规则配置 ================= */

function showImpacts(imp) {
  const box = $('impactBox');
  if (!box || !imp || !imp.affects || !imp.affects.length) return;
  box.innerHTML = `<div class="ib-head"><span>↗ 数据联动 · ${esc(imp.label)}</span>
    <button onclick="this.closest('.impact-box').classList.remove('show')">×</button></div>
    <div class="ib-sub">写入 ${esc((imp.writes || []).join(' / '))}，影响 ${imp.count} 项分析，相关页面已按新数据重算</div>
    ${imp.affects.map(a => `<div class="ib-row"><b>${esc(a.label)}</b><span>${esc(a.effect)}</span></div>`).join('')}`;
  box.classList.add('show');
  clearTimeout(box._t);
  box._t = setTimeout(() => box.classList.remove('show'), 12000);
}
async function saveAnalysisRules() {
  const list = id => (($(id) || {}).value || '').split(/[,，\s]+/).filter(Boolean);
  const rules = {
    liquidity: { noncurrent_asset: list('rl_nca'), current_liability: list('rl_cl'),
                 noncurrent_liability: list('rl_ncl'), inventory: list('rl_inv') },
    cashflow: { operating: list('cf_op'), investing: list('cf_inv'), financing: list('cf_fin'),
                unclassified: ($('cf_un') || {}).value || 'warn' },
    aging: { basis: ($('ag_basis') || {}).value || 'period_end', rates: {} },
    ratios: {}
  };
  document.querySelectorAll('[data-rate]').forEach(el => {
    rules.aging.rates[el.dataset.rate] = (parseFloat(el.value) || 0) / 100;
  });
  document.querySelectorAll('[data-th]').forEach(el => {
    const n = el.dataset.th, bound = el.dataset.bound, v = el.value.trim();
    rules.ratios[n] = rules.ratios[n] || {};
    rules.ratios[n][bound] = v === '' ? null : parseFloat(v);
  });
  try {
    await api('/api/analysis/rules', 'POST', { rules, actor: actor() });
    toast('✓ 规则已保存，全部报表 / 比率 / 报告按新口径重算', 4000);
  } catch (e) { toast('✗ ' + e.message, 4500); }
}
async function resetAnalysisRules() {
  if (!confirm('确认把全部分析规则恢复为系统默认？')) return;
  try {
    await api('/api/analysis/rules/reset', 'POST', { actor: actor() });
    toast('✓ 已恢复默认规则'); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function showImpactDetail(action) {
  const box = $('impactDetail');
  if (!box) return;
  try {
    const d = await api('/api/analysis/impacts?action=' + encodeURIComponent(action));
    box.innerHTML = `<p class="muted">写入表：${esc((d.writes || []).join(' / '))} · 共 ${d.count} 条影响链</p>` +
      table(d.affects, [
        { t: '下游功能', f: r => `<b>${esc(r.label)}</b>` },
        { t: '影响原因', f: r => `<span class="muted">${esc(r.effect)}</span>` },
      ], '该操作暂无下游影响');
  } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

