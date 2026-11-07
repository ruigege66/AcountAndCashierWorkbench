/* ================= V2.5 交互动作 ================= */

function newTpl() {
  const row = i => `<div class="frow"><div><label>科目 ${i}</label><select name="s${i}">${subjOpts()}</select></div>
    <div><label>借方金额</label><input type="number" step="0.01" name="d${i}"></div>
    <div><label>贷方金额</label><input type="number" step="0.01" name="c${i}"></div></div>`;
  openModal('新建常用凭证模板',
    `<div class="frow"><div><label>模板名称 *</label><input name="name" required placeholder="如：支付月度房租"></div>
     <div><label>默认摘要</label><input name="summary" placeholder="如：支付办公场地租金"></div></div>
     ${[1, 2, 3, 4].map(row).join('')}
     <p class="muted">至少填 2 行且借贷相等；留空的行自动忽略。模板只生成草稿凭证。</p>`,
    '保存模板', async f => {
      const lines = [];
      for (let i = 1; i <= 4; i++) {
        const code = fd(f, 's' + i), dr = fnum(f, 'd' + i), cr = fnum(f, 'c' + i);
        if (code && (dr || cr)) lines.push({ subject_code: code, debit: dr, credit: cr });
      }
      await api('/api/voucher-templates', 'POST',
        { name: fd(f, 'name'), summary: fd(f, 'summary'), lines, actor: actor() });
      closeModal(); toast('✓ 模板已保存'); render();
    });
}
async function useTpl(id) {
  if (!confirm('按此模板生成一张草稿凭证？生成后可在「凭证管理」审核过账。')) return;
  try {
    const r = await api('/api/voucher-templates/' + id + '/use', 'POST', { actor: actor() });
    toast('✓ 已生成 ' + r.voucher_no, 3500); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function delTpl(id) {
  if (!confirm('确定删除这个模板？已生成的凭证不受影响。')) return;
  await api('/api/voucher-templates/' + id, 'DELETE', { actor: actor() });
  toast('✓ 已删除'); render();
}
function printVouchers() {
  const ids = (S.filters.vIds || '').trim();
  window.open('/api/vouchers/print' + (ids ? '?ids=' + encodeURIComponent(ids) : ''));
}
async function saveBadDebtRates() {
  const rates = {};
  document.querySelectorAll('[data-rate]').forEach(el => {
    rates[el.dataset.rate] = (parseFloat(el.value) || 0) / 100;
  });
  try {
    await api('/api/bad-debt/config', 'POST', { rates, actor: actor() });
    toast('✓ 计提比例已保存'); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function doProvision(period) {
  if (!confirm(`确认按当前比例对 ${period} 生成坏账计提凭证？`)) return;
  try {
    const r = await api('/api/bad-debt/provision', 'POST', { period, actor: actor() });
    toast(`✓ ${r.action} ¥${money(r.amount)}，凭证 ${r.voucher_no}`, 4500); render();
  } catch (e) { toast('✗ ' + e.message, 4500); }
}
async function saveSnapshot() {
  const period = ($('vPeriod') || {}).value || thisMonth();
  const note = ($('vNote') || {}).value || '';
  try {
    const r = await api('/api/snapshots', 'POST', { period, note, actor: actor() });
    toast(`✓ 已归档 ${r.period}（${r.all_pass ? '勾稽全部相符' : '存在不平项'}）`, 4000); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function viewSnapshot(id) {
  const d = await api('/api/snapshots/' + id);
  const bs = d.data.balance_sheet || {}, inc = d.data.income || {}, art = d.data.articulation || {};
  openModal('报表快照 · ' + d.period,
    `<div class="stat-line"><span>归档时间</span><b>${esc(d.created_at)}</b></div>
     <div class="stat-line"><span>备注</span><b>${esc(d.note || '—')}</b></div>
     <div class="stat-line"><span>资产合计</span><b>¥${money(bs.total_assets)}</b></div>
     <div class="stat-line"><span>负债 + 权益</span><b>¥${money((bs.total_liabilities || 0) + (bs.total_equity || 0))}</b></div>
     <div class="stat-line"><span>资产负债表</span><b>${bs.balanced ? '✓ 平衡' : '✗ 差额 ' + money(bs.diff)}</b></div>
     <div class="stat-line"><span>本年累计净利润</span><b>¥${money(inc.net_cum)}</b></div>
     <div class="stat-line"><span>留抵收益</span><b>¥${money(bs.retained)}</b></div>
     <div class="stat-line"><span>三大勾稽</span><b>${art.all_pass ? '✓ 全部相符' : '✗ 存在不平项'}</b></div>
     <p class="muted" style="margin-top:8px">可点页面上的「⬇ Excel」导出这份历史快照。</p>`,
    '关闭', async () => closeModal());
}
async function delSnapshot(id) {
  if (!confirm('确定删除这份归档快照？')) return;
  await api('/api/snapshots/' + id, 'DELETE', { actor: actor() });
  toast('✓ 已删除'); render();
}
async function doYearEnd() {
  const year = ($('vYear') || {}).value || String(new Date().getFullYear());
  if (!confirm(`确认执行 ${year} 年度结转（4103 → 4104）？将生成并过账一张凭证，且该年度不可重复结转。`)) return;
  try {
    const r = await api('/api/periods/' + year + '/year-end-carry', 'POST', { actor: actor() });
    toast(`✓ ${r.direction} ¥${money(r.amount)}，凭证 ${r.voucher_no}`, 4500); render();
  } catch (e) { toast('✗ ' + e.message, 5000); }
}
async function previewStmtImport() {
  const text = ($('vCsv') || {}).value || '';
  if (!text.trim()) { toast('请先粘贴对账单内容'); return; }
  S.filters.vCsv = text;
  try {
    S.stmtPreview = await api('/api/statements/import', 'POST', { text, actor: actor() });
    toast(`✓ 解析 ${S.stmtPreview.total} 行，可导入 ${S.stmtPreview.new} 行`); render();
  } catch (e) { toast('✗ ' + e.message, 4500); }
}
async function confirmStmtImport() {
  if (!S.stmtPreview || !S.stmtPreview.new) return;
  try {
    const r = await api('/api/statements/import', 'POST',
      { text: S.filters.vCsv || '', confirm: true, actor: actor() });
    S.stmtPreview = null;
    toast(`✓ 成功导入 ${r.imported} 行，跳过重复 ${r.duplicates} 行`, 4500); render();
  } catch (e) { toast('✗ ' + e.message, 4500); }
}
async function applySubjects(key) {
  if (!confirm('确认套用该科目模板？只会补充缺失科目，不会修改已有科目。')) return;
  try {
    const r = await api('/api/subjects/apply-template', 'POST', { template: key, actor: actor() });
    await loadMeta();
    toast(`✓ 新增 ${r.added} 个科目`, 4000); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}


