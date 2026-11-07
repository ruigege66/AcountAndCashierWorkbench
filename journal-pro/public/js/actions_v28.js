/* V2.8 通用工具执行器：收集表单 → 调接口 → 渲染结果（表格或 JSON） */
function findV28Tool(id) {
  for (const g in V28_TOOLS) {
    const t = V28_TOOLS[g].find(x => x.id === id);
    if (t) return t;
  }
  return null;
}

function renderV28Result(d) {
  const rows = Array.isArray(d) ? d
    : (d.items || d.files || d.matrix || d.dimensions || d.modules || d.tiers || null);
  if (Array.isArray(rows) && rows.length && typeof rows[0] === 'object') {
    const cols = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object').slice(0, 7);
    const tbl = table(rows.slice(0, 25), cols.map(c => ({
      t: c, f: r => `<span title="${esc(String(r[c] ?? ''))}">${esc(String(r[c] ?? '').slice(0, 60))}</span>`,
    })), '暂无数据');
    const extra = Object.keys(d).filter(k => k !== 'items').length
      ? `<p class="muted" style="margin-top:8px">其他字段：${esc(Object.keys(d).filter(k => k !== 'items').join(', '))}</p>` : '';
    return tbl + extra;
  }
  return `<pre style="max-height:320px;overflow:auto;background:var(--blue-bg);padding:10px;border-radius:6px;
    font-size:11.5px;line-height:1.5;white-space:pre-wrap">${esc(JSON.stringify(d, null, 2).slice(0, 5000))}</pre>`;
}

async function runV28(id) {
  const t = findV28Tool(id);
  if (!t) return;
  if (t.confirm && !confirm(`确认执行「${t.title}」？该操作会写入业务数据。`)) return;
  const method = t.method || 'GET';
  const body = {}, qs = [];
  for (const f of (t.fields || [])) {
    const el = $('f_' + id + '_' + f.n);
    if (!el) continue;
    let v = el.value;
    if (f.type === 'number') v = parseFloat(v) || 0;
    if (f.type === 'json') {
      try { v = JSON.parse(v); } catch (e) { toast('✗ JSON 格式错误：' + f.l, 4000); return; }
    }
    if (method === 'GET') qs.push(encodeURIComponent(f.n) + '=' + encodeURIComponent(v));
    else body[f.n] = v;
  }
  if (body.enabled !== undefined) body.enabled = body.enabled === true || body.enabled === 'true';
  const out = $('out_' + id);
  const url = t.api + (qs.length ? '?' + qs.join('&') : '');
  if (t.download) { window.open(url); toast('✓ 已生成下载文件（浏览器新窗口）'); return; }
  if (out) out.innerHTML = '<div class="muted">执行中…</div>';
  try {
    const d = await api(url, method, method === 'GET' ? undefined : body);
    if (out) out.innerHTML = renderV28Result(d);
    toast('✓ ' + t.title + ' 执行成功');
  } catch (e) {
    if (out) out.innerHTML = `<div class="tag t-rejected">✗ ${esc(e.message)}</div>`;
    toast('✗ ' + e.message, 4000);
  }
}
