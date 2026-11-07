# -*- coding: utf-8 -*-
"""在线图文分析报告：把 analyze() 的结果渲染为零外部依赖的 HTML + 内联 SVG。

刻意不用 Chart.js：迁移包在无网环境也要能出图，因此所有图表用原生 SVG 绘制，
浏览器直接打开 / 打印为 PDF / 另存独立 HTML 都能用。
"""
import html
import math

E = lambda s: html.escape(str(s if s is not None else ""))
M = lambda n: f"{float(n or 0):,.2f}"


def _bars(rows, value_key, label_key="period", color="#4472C4", height=180, fmt=M, width=560):
    """通用竖向柱状图（支持负值）"""
    if not rows:
        return '<div class="empty">暂无数据</div>'
    vals = [float(r[value_key] or 0) for r in rows]
    vmax = max([abs(v) for v in vals] + [1])
    n = len(rows)
    pad_l, pad_b, top = 46, 34, 12
    inner_w = width - pad_l - 16
    inner_h = height - pad_b - top
    slot = inner_w / max(n, 1)
    bw = max(4, min(slot * 0.58, 34))
    zero = top + inner_h / 2
    parts = [f'<svg viewBox="0 0 {width} {height}" class="chart" preserveAspectRatio="xMidYMid meet">']
    for f in (-1, -0.5, 0, 0.5, 1):
        y = zero - f * inner_h / 2
        parts.append(f'<line x1="{pad_l}" y1="{y:.1f}" x2="{width-8}" y2="{y:.1f}" stroke="#E3E8F0" stroke-width="1"/>')
        parts.append(f'<text x="{pad_l-6}" y="{y+3:.1f}" text-anchor="end" class="ax">{fmt(vmax*f)}</text>')
    for i, (r, v) in enumerate(zip(rows, vals)):
        x = pad_l + i * slot + (slot - bw) / 2
        h = abs(v) / vmax * inner_h / 2
        y = zero - h if v >= 0 else zero
        parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{max(h,1):.1f}" rx="2" fill="{color}"><title>{E(r.get(label_key,""))}: {fmt(v)}</title></rect>')
        if n <= 12:
            parts.append(f'<text x="{x+bw/2:.1f}" y="{height-12}" text-anchor="middle" class="ax">{E(str(r.get(label_key,""))[5:] or r.get(label_key,""))}</text>')
    parts.append(f'<line x1="{pad_l}" y1="{zero}" x2="{width-8}" y2="{zero}" stroke="#9AA6B8"/>')
    parts.append('</svg>')
    return "".join(parts)


def _donut(parts, size=200):
    total = sum(max(0, p[1]) for p in parts) or 1
    cx = cy = size / 2
    r, rin = size * 0.40, size * 0.25
    out = [f'<svg viewBox="0 0 {size} {size}" class="donut">']
    ang = -math.pi / 2
    for label, val, color in parts:
        frac = max(0, val) / total
        a2 = ang + frac * 2 * math.pi
        x1, y1 = cx + r * math.cos(ang), cy + r * math.sin(ang)
        x2, y2 = cx + r * math.cos(a2), cy + r * math.sin(a2)
        xi2, yi2 = cx + rin * math.cos(a2), cy + rin * math.sin(a2)
        xi1, yi1 = cx + rin * math.cos(ang), cy + rin * math.sin(ang)
        large = 1 if frac > 0.5 else 0
        out.append(f'<path d="M{x1:.1f},{y1:.1f} A{r:.1f},{r:.1f} 0 {large} 1 {x2:.1f},{y2:.1f} '
                   f'L{xi2:.1f},{yi2:.1f} A{rin:.1f},{rin:.1f} 0 {large} 0 {xi1:.1f},{yi1:.1f} Z" '
                   f'fill="{color}"><title>{E(label)}: {M(val)}</title></path>')
        ang = a2
    out.append(f'<text x="{cx}" y="{cy-2}" text-anchor="middle" class="dv">{M(total)}</text>')
    out.append(f'<text x="{cx}" y="{cy+14}" text-anchor="middle" class="ax">合计</text></svg>')
    legend = "".join(f'<span class="lg"><i style="background:{c}"></i>{E(l)} {M(v)}</span>'
                     for l, v, c in parts)
    return f'<div class="donut-wrap">{"".join(out)}<div class="legend">{legend}</div></div>'


def _hbar(rows, vmax=None, color="#4472C4", width=520):
    """横向条形图（SVG，支持负值与健康状态配色）"""
    if not rows:
        return '<div class="empty">暂无数据</div>'
    vmax = vmax or max([abs(float(r["value"] or 0)) for r in rows] + [1])
    label_w, value_w, rowh = 118, 92, 26
    bar_w = width - label_w - value_w - 16
    h = len(rows) * rowh + 12
    out = [f'<svg viewBox="0 0 {width} {h}" class="chart" preserveAspectRatio="xMidYMin meet">']
    for i, r in enumerate(rows):
        v = float(r["value"] or 0) if r["value"] is not None else None
        pct = min(1, abs(v or 0) / vmax)
        c = r.get("color") or ("#2E8B57" if r.get("status") == "健康" else
                               "#C0392B" if r.get("status") == "关注" else color)
        y = 6 + i * rowh
        out.append(f'<text x="{label_w-8}" y="{y+13}" text-anchor="end" class="ax" style="font-size:11px">{E(r["label"])}</text>')
        out.append(f'<rect x="{label_w}" y="{y+3}" width="{bar_w}" height="12" rx="6" fill="#EEF2F8"/>')
        if v is not None and pct > 0:
            out.append(f'<rect x="{label_w}" y="{y+3}" width="{bar_w*pct:.1f}" height="12" rx="6" fill="{c}">'
                       f'<title>{E(r["label"])}: {M(v)}</title></rect>')
        out.append(f'<text x="{width-6}" y="{y+13}" text-anchor="end" class="ax" style="font-size:11px">'
                   f'{M(v) if v is not None else "—"}{E(r.get("unit", ""))}</text>')
    out.append('</svg>')
    return "".join(out)


def _network(graph, width=880, height=330):
    """分层网状关系：写操作（左）→ 分析功能（右）"""
    writes = [n for n in graph["nodes"] if n["type"] == "write"]
    targets = {}
    for e in graph["edges"]:
        targets.setdefault(e["to"], []).append(e["from"])
    analyses = [n for n in graph["nodes"] if n["type"] == "analysis" and n["id"] in targets]
    analyses.sort(key=lambda n: -len(targets[n["id"]]))
    lw, rw = 155, width - 190
    lh = (height - 30) / max(len(writes), 1)
    rh = (height - 30) / max(len(analyses), 1)
    ly = {n["id"]: 18 + i * lh + lh / 2 for i, n in enumerate(writes)}
    ry = {n["id"]: 18 + i * rh + rh / 2 for i, n in enumerate(analyses)}
    out = [f'<svg viewBox="0 0 {width} {height}" class="net">']
    for e in graph["edges"]:
        if e["from"] in ly and e["to"] in ry:
            x1, y1, x2, y2 = lw, ly[e["from"]], rw, ry[e["to"]]
            mx = (x1 + x2) / 2
            out.append(f'<path d="M{x1},{y1:.1f} C{mx},{y1:.1f} {mx},{y2:.1f} {x2},{y2:.1f}" '
                       f'fill="none" stroke="#B9C7DE" stroke-width="1" opacity=".65"><title>{E(e["effect"])}</title></path>')
    for n in writes:
        y = ly[n["id"]]
        out.append(f'<rect x="4" y="{y-10:.1f}" width="{lw-8}" height="20" rx="4" fill="#2F5597"/>'
                   f'<text x="{lw/2}" y="{y+4:.1f}" text-anchor="middle" class="nl">{E(n["label"])}</text>')
    for n in analyses:
        y = ry[n["id"]]
        heat = min(1, len(targets[n["id"]]) / 5)
        col = f"rgb({int(68+40*heat)},{int(114-20*heat)},{int(196-40*heat)})"
        out.append(f'<rect x="{rw}" y="{y-10:.1f}" width="{width-rw-6}" height="20" rx="4" fill="{col}"/>'
                   f'<text x="{rw+(width-rw)/2}" y="{y+4:.1f}" text-anchor="middle" class="nl">'
                   f'{E(n["label"])} · {len(targets[n["id"]])}</text>')
    out.append('</svg>')
    return "".join(out)


CSS = """
:root{--p:#2F5597;--bg:#F4F6FA;--card:#fff;--bd:#E3E8F0;--t:#1F2937;--t2:#6B7280;--ok:#2E8B57;--warn:#C0392B;--info:#4472C4}
*{box-sizing:border-box}body{font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:var(--t);background:var(--bg);margin:0;padding:22px;font-size:13.5px}
.wrap{max-width:1180px;margin:0 auto}.top{background:linear-gradient(120deg,#2F5597,#4472C4);color:#fff;padding:24px 28px;border-radius:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.top h1{margin:0;font-size:22px;letter-spacing:1px}.top p{margin:6px 0 0;opacity:.85;font-size:12.5px}
button{padding:8px 16px;border:1px solid #fff;background:rgba(255,255,255,.16);color:#fff;border-radius:6px;cursor:pointer;font-size:13px}
button:hover{background:rgba(255,255,255,.28)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px}
.kpi{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:14px 16px}.kpi .l{color:var(--t2);font-size:12px}.kpi .v{font-size:21px;font-weight:700;color:var(--p);margin-top:6px;font-variant-numeric:tabular-nums}
.card{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:18px 20px;margin-bottom:16px}
.card h2{font-size:15px;color:var(--p);margin:0 0 14px;border-left:3px solid var(--p);padding-left:9px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}.grid2>*{margin-bottom:0}
.chart{width:100%;height:auto;display:block}.ax{font-size:9px;fill:#8894A8}.dv{font-size:15px;font-weight:700;fill:#2F5597}
.donut{width:190px;height:190px;flex-shrink:0}.donut-wrap{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.legend{display:flex;flex-direction:column;gap:7px;font-size:12px}.lg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:7px}
.hb{display:flex;align-items:center;gap:9px;margin-bottom:8px;font-size:12px}.hl{width:112px;flex-shrink:0;color:var(--t2)}
.ht{flex:1;background:#EEF2F8;height:12px;border-radius:6px;overflow:hidden}.ht i{display:block;height:100%;border-radius:6px}
.hb b{width:92px;text-align:right;font-variant-numeric:tabular-nums;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{border-bottom:1px solid var(--bd);padding:8px 9px;text-align:left;vertical-align:top}
th{background:#F7F9FC;color:var(--p);font-weight:600}.num{text-align:right;font-variant-numeric:tabular-nums}
.concl{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
.c{border-left:3px solid var(--info);background:#F8FAFD;padding:11px 13px;border-radius:0 7px 7px 0}
.c.ok{border-color:var(--ok)}.c.warn{border-color:var(--warn)}.c b{display:block;margin-bottom:5px;font-size:13px}.c p{margin:0;color:var(--t2);line-height:1.65;font-size:12px}
.tag{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;background:#E8F0FB;color:var(--p)}
.muted{color:var(--t2)}.net{width:100%;height:auto}.nl{font-size:10px;fill:#fff}
.foot{text-align:center;color:var(--t2);font-size:11.5px;padding:16px 0}
@media print{body{background:#fff;padding:0}.top{-webkit-print-color-adjust:exact;print-color-adjust:exact}button{display:none}
 .card,.kpi{break-inside:avoid;box-shadow:none}.grid2{grid-template-columns:1fr 1fr}}
"""


def render_report(data, graph=None):
    k = data["kpi"]
    tr = data["trend"]
    cf = data["cashflow"]["cumulative"]
    ra = data["ratios"]
    ag = data["aging"]
    bs = data["balance"]
    inc = data["income"]
    art = data["articulation"]
    cp = data["compare"]

    kpis = [("累计营业收入", "¥" + M(k["revenue"])), ("本年累计净利润", "¥" + M(k["net_cum"])),
            ("资产合计", "¥" + M(k["total_assets"])), ("负债合计", "¥" + M(k["total_liabilities"])),
            ("所有者权益", "¥" + M(k["total_equity"])), ("财务健康度", f'{k["score"]:.0f} 分')]
    kpi_html = "".join(f'<div class="kpi"><div class="l">{E(a)}</div><div class="v">{E(b)}</div></div>' for a, b in kpis)
    concl = "".join(f'<div class="c {E(c["level"])}"><b>{E(c["title"])}</b><p>{E(c["text"])}</p></div>'
                    for c in data["conclusions"])
    donut = _donut([("资产", bs["total_assets"], "#4472C4"),
                    ("负债", bs["total_liabilities"], "#ED7D31"),
                    ("权益", bs["total_equity"], "#2E8B57")])
    cfrows = [{"label": c["label"], "value": c["net"],
               "color": "#2E8B57" if c["net"] >= 0 else "#C0392B", "unit": ""}
              for c in cf["categories"]]
    ratio_rows = [{"label": x["name"], "value": x["value"], "status": x["status"], "unit": " " + x["unit"]}
                  for x in ra["items"]]
    aging_rows = [{"label": d["bucket"], "value": d["amount"], "unit": ""} for d in ag["details"]]
    net = _network(graph) if graph else ""

    inc_rows = "".join(
        f'<tr><td>{E(c["item"])}</td><td class="num">{M(c["amount"])}</td><td class="num">{M(y["amount"])}</td></tr>'
        for c, y in zip(inc["current"], inc["cumulative"]))
    bal_rows = "".join(f'<tr><td>{E(x["item"])}</td><td class="num">{M(x["amount"])}</td></tr>'
                       for x in bs["assets"] + bs["liabilities"] + bs["equity"])
    check_rows = "".join(
        f'<tr><td>{E(c["name"])}</td><td>{E(c["left"])}</td><td>{E(c["right"])}</td>'
        f'<td><span class="tag">{"✓ 相符" if c["pass"] else "✗ 差额 " + M(c["diff"])}</span></td></tr>'
        for c in art["checks"])
    metric_rows = "".join(
        f'<tr><td><b>{E(m["name"])}</b></td><td>{E(m["formula"])}</td><td>{E(", ".join(m["source"]) if isinstance(m["source"], list) else m["source"])}</td>'
        f'<td class="muted">{E(m["limitation"] or m["scope"])}</td></tr>'
        for m in data.get("rule_book", []))
    lineage_rows = "".join(
        f'<tr><td><b>{E(l["metric"])}</b></td><td class="muted">{E(", ".join(l["sources"]))}</td><td>{E(l["rule"])}</td></tr>'
        for l in data["lineage"])

    return f"""<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(data["company"])} · 经营分析报告 {E(data["period"])}</title>
<style>{CSS}</style></head><body><div class="wrap">
<div class="top"><div><h1>{E(data["company"])} · 经营分析报告</h1>
<p>报告期间 {E(data["period"])}　|　累计数口径 {E(inc["cum_scope"])}　|　生成于 {E(data["generated_at"])}　|　数据来自已过账凭证、期初余额与出纳日记账</p></div>
<div><button onclick="window.print()">🖨 打印 / 另存 PDF</button>
<button onclick="location.href='/api/reports/analysis.html?period={E(data["period"])}&download=1'">⬇ 导出 HTML</button></div></div>
<div class="kpis">{kpi_html}</div>
<div class="card"><h2>一、自动分析结论</h2><div class="concl">{concl}</div></div>
<div class="grid2">
 <div class="card"><h2>二、近 12 个月收入趋势</h2>{_bars(tr, "revenue", color="#4472C4")}
  <p class="muted">柱高为当月营业收入；本月 ¥{M(cp["current"]["revenue"])}，环比 {E(cp["mom"]["revenue"] if cp["mom"]["revenue"] is not None else "—")}%，同比 {E(cp["yoy"]["revenue"] if cp["yoy"]["revenue"] is not None else "—")}%。</p></div>
 <div class="card"><h2>三、近 12 个月净利润</h2>{_bars(tr, "net", color="#C0392B")}
  <p class="muted">红柱为盈利，向下为亏损；本期净利润 ¥{M(k["net_current"])}，本年累计 ¥{M(k["net_cum"])}。</p></div>
</div>
<div class="grid2" style="margin-top:16px">
 <div class="card"><h2>四、资产负债权益结构</h2>{donut}
  <p class="muted">资产负债表{'' if bs['balanced'] else '不'}平衡（差额 ¥{M(bs['diff'])}）；资产 = 负债 + 所有者权益。</p></div>
 <div class="card"><h2>五、现金流量三大活动（累计）</h2>{_hbar(cfrows)}
  <p class="muted">累计净流量 ¥{M(cf["net"])}，与货币资金变动{'' if data['cashflow']['check'] else '不'}相符。{'存在未分类科目，请在分析规则中补充。' if cf.get('unmapped') else ''}</p></div>
</div>
<div class="grid2" style="margin-top:16px">
 <div class="card"><h2>六、财务比率（绿=健康 / 红=关注）</h2>{_hbar(ratio_rows)}
  <p class="muted">健康度 {ra["score"]:.0f} 分（{ra["healthy"]}/{ra["valid"]} 项达标）；阈值可在「分析规则」中自定义。</p></div>
 <div class="card"><h2>七、应收账龄分布</h2>{_hbar(aging_rows)}
  <p class="muted">账龄基准日 {E(ag["as_of"])}（{E(ag["basis"])}）；应计提坏账 ¥{M(ag["required"])}，已计提 ¥{M(ag["provided"])}，待调整 ¥{M(ag["adjustment"])}。</p></div>
</div>
<div class="card"><h2>八、利润表（本期 / 本年累计）</h2>
 <table><thead><tr><th>项目</th><th class="num">本期数</th><th class="num">本年累计数</th></tr></thead><tbody>{inc_rows}</tbody></table></div>
<div class="card"><h2>九、资产负债表明细</h2>
 <table><thead><tr><th>项目</th><th class="num">金额</th></tr></thead><tbody>{bal_rows}</tbody></table></div>
<div class="card"><h2>十、三大勾稽关系</h2>
 <table><thead><tr><th>勾稽关系</th><th>左边</th><th>右边</th><th>结果</th></tr></thead><tbody>{check_rows}</tbody></table></div>
{('<div class="card"><h2>十一、计算规则说明书</h2><table><thead><tr><th>指标</th><th>公式</th><th>数据源</th><th>口径 / 局限</th></tr></thead><tbody>' + metric_rows + '</tbody></table>' +
  '<h2 style="margin-top:20px">数据血缘</h2><table><thead><tr><th>指标组</th><th>来源表</th><th>计算规则</th></tr></thead><tbody>' + lineage_rows + '</tbody></table></div>') if metric_rows else ''}
{('<div class="card"><h2>十二、功能联动关系图</h2><p class="muted">左侧为写操作，右侧为受影响的分析功能，连线标注影响原因；一个写操作会同时传导到多个报表。</p>' + net + '</div>') if net else ''}
<div class="foot">本报告由系统基于账套现有数据自动生成 · 管理分析口径，非审计报表 · {E(data["company"])}</div>
</div></body></html>"""
