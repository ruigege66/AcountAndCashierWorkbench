# -*- coding: utf-8 -*-
"""在线经营分析报告：按标准财务分析报告结构渲染，零外部依赖（纯内联 SVG）。

结构：管理层摘要 → 关键指标一览 → 盈利/偿债/营运/现金流四大能力 → 资产负债结构
→ 风险与关注 → 附录（编制口径 / 勾稽 / 血缘 / 联动图）。工程内容全部归附录，
正文只保留管理层与财务视角。打印为 A4（含页眉页脚、章节防跨页断开）。
"""
import html
import math

E = lambda s: html.escape(str(s if s is not None else ""))


def M(n, unit=1, dec=2):
    try:
        v = float(n or 0) / unit
    except (TypeError, ValueError):
        v = 0.0
    return f"{v:,.{dec}f}" if dec else f"{v:,.0f}"


def _pct(v):
    if v is None:
        return '<span class="muted">—</span>'
    cls = "pos" if v > 0 else ("neg" if v < 0 else "")
    sign = "+" if v > 0 else ""
    return f'<span class="{cls}">{sign}{v}%</span>'


def _waterfall(steps, net_label, net_value, width=640, height=240, unit_scale=1.0):
    """利润瀑布：浮动柱 = 各构成项贡献，末柱 = 净利润"""
    if not steps:
        return '<div class="empty">暂无数据</div>'
    lo = min(0.0, min(s["cum"] for s in steps))
    hi = max(0.0, max(s["cum"] for s in steps), abs(net_value))
    hi = max(hi, abs(net_value)) or 1
    pad_l, pad_b, pad_t = 58, 40, 14
    inner_w = width - pad_l - 14
    inner_h = height - pad_b - pad_t
    n = len(steps) + 1
    slot = inner_w / n
    bw = max(6, min(slot * 0.6, 40))
    def y(v):
        return pad_t + (hi - v) / (hi - lo or 1) * inner_h
    out = [f'<svg viewBox="0 0 {width} {height}" class="chart" preserveAspectRatio="xMidYMid meet">']
    for f in range(5):
        v = lo + (hi - lo) * f / 4
        yy = y(v)
        out.append(f'<line x1="{pad_l}" y1="{yy:.1f}" x2="{width-10}" y2="{yy:.1f}" stroke="#E3E8F0"/>')
        out.append(f'<text x="{pad_l-6}" y="{yy+3:.1f}" text-anchor="end" class="ax">{M(v, unit_scale, 1)}</text>')
    prev = 0.0
    for i, s in enumerate(steps):
        end = prev + s["value"]
        x = pad_l + i * slot + (slot - bw) / 2
        y1, y2 = y(max(prev, end)), y(min(prev, end))
        color = "#2E8B57" if s["value"] >= 0 else "#C0392B"
        out.append(f'<rect x="{x:.1f}" y="{y1:.1f}" width="{bw:.1f}" height="{max(y2-y1,1):.1f}" fill="{color}" opacity=".9">'
                   f'<title>{E(s["label"])}: {M(s["value"], unit_scale, 2)}</title></rect>')
        if height:
            out.append(f'<text x="{x+bw/2:.1f}" y="{y1-3:.1f}" text-anchor="middle" class="ax">{M(s["value"], unit_scale, 1)}</text>')
        out.append(f'<text x="{x+bw/2:.1f}" y="{height-20}" text-anchor="middle" class="ax">{E(s["label"])}</text>')
        if i + 1 < n - 1:
            out.append(f'<line x1="{x+bw/2:.1f}" y1="{y(end):.1f}" x2="{x+bw/2+slot:.1f}" y2="{y(end):.1f}" stroke="#9AA6B8" stroke-dasharray="3 3"/>')
        prev = end
    x = pad_l + (n - 1) * slot + (slot - bw) / 2
    out.append(f'<rect x="{x:.1f}" y="{y(net_value):.1f}" width="{bw:.1f}" height="{max(y(0)-y(net_value),1):.1f}" fill="#2F5597">'
               f'<title>{E(net_label)}: {M(net_value, unit_scale, 2)}</title></rect>')
    out.append(f'<text x="{x+bw/2:.1f}" y="{y(net_value)-3:.1f}" text-anchor="middle" class="ax">{M(net_value, unit_scale, 1)}</text>')
    out.append(f'<text x="{x+bw/2:.1f}" y="{height-20}" text-anchor="middle" class="ax">{E(net_label)}</text>')
    out.append('</svg>')
    return "".join(out)


def _trend_bars(rows, width=640, height=220, unit_scale=1.0):
    """12 月趋势：收入柱 + 净利润折线（同货币轴）"""
    if not rows:
        return '<div class="empty">暂无数据</div>'
    vals = [max(abs(float(r["revenue"] or 0)), abs(float(r["net"] or 0))) for r in rows] or [1]
    hi = max(vals) or 1
    lo = min([min(float(r["net"] or 0) for r in rows), 0.0])
    pad_l, pad_b, pad_t = 58, 36, 12
    inner_w, inner_h = width - pad_l - 14, height - pad_b - pad_t
    slot = inner_w / len(rows)
    bw = max(5, min(slot * 0.5, 30))
    def y(v):
        return pad_t + (hi - v) / (hi - lo or 1) * inner_h
    out = [f'<svg viewBox="0 0 {width} {height}" class="chart" preserveAspectRatio="xMidYMid meet">']
    for f in range(5):
        v = lo + (hi - lo) * f / 4
        yy = y(v)
        out.append(f'<line x1="{pad_l}" y1="{yy:.1f}" x2="{width-10}" y2="{yy:.1f}" stroke="#E3E8F0"/>')
        out.append(f'<text x="{pad_l-6}" y="{yy+3:.1f}" text-anchor="end" class="ax">{M(v, unit_scale, 1)}</text>')
    pts = []
    for i, r in enumerate(rows):
        x = pad_l + i * slot + (slot - bw) / 2
        rev = float(r["revenue"] or 0)
        out.append(f'<rect x="{x:.1f}" y="{y(rev):.1f}" width="{bw:.1f}" height="{max(y(0)-y(rev),1):.1f}" rx="2" fill="#85B7EB">'
                   f'<title>{E(r["period"])} 收入 {M(rev, unit_scale, 2)}</title></rect>')
        nx = x + bw / 2
        pts.append((nx, y(float(r["net"] or 0))))
        out.append(f'<text x="{nx:.1f}" y="{height-20}" text-anchor="middle" class="ax">{E(r["period"][5:])}</text>')
    if len(pts) > 1:
        d = " ".join(("M" if i == 0 else "L") + f"{p[0]:.1f},{p[1]:.1f}" for i, p in enumerate(pts))
        out.append(f'<path d="{d}" fill="none" stroke="#C0392B" stroke-width="1.8"/>')
    for p in pts:
        out.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="2.6" fill="#C0392B"><title>净利润</title></circle>')
    out.append('</svg>')
    return "".join(out)


def _donut(parts, size=190):
    total = sum(max(0.0, p[1]) for p in parts) or 1
    cx = cy = size / 2
    r, rin = size * 0.40, size * 0.25
    out = [f'<svg viewBox="0 0 {size} {size}" class="donut">']
    ang = -math.pi / 2
    for label, val, color in parts:
        frac = max(0.0, val) / total
        a2 = ang + frac * 2 * math.pi
        x1, y1 = cx + r * math.cos(ang), cy + r * math.sin(ang)
        x2, y2 = cx + r * math.cos(a2), cy + r * math.sin(a2)
        xi2, yi2 = cx + rin * math.cos(a2), cy + rin * math.sin(a2)
        xi1, yi1 = cx + rin * math.cos(ang), cy + rin * math.sin(ang)
        large = 1 if frac > 0.5 else 0
        out.append(f'<path d="M{x1:.1f},{y1:.1f} A{r:.1f},{r:.1f} 0 {large} 1 {x2:.1f},{y2:.1f} '
                   f'L{xi2:.1f},{yi2:.1f} A{rin:.1f},{rin:.1f} 0 {large} 0 {xi1:.1f},{yi1:.1f} Z" '
                   f'fill="{color}"><title>{E(label)}: {M(val, 1, 2)}</title></path>')
        ang = a2
    out.append(f'<text x="{cx}" y="{cy-2}" text-anchor="middle" class="dv">{M(total, 1, 2)}</text>')
    out.append(f'<text x="{cx}" y="{cy+14}" text-anchor="middle" class="ax">合计（万元）</text></svg>')
    return "".join(out)


def _hbar(rows, vmax=None, color="#4472C4", width=620):
    if not rows:
        return '<div class="empty">暂无数据</div>'
    vmax = vmax or max([abs(float(r["value"] or 0)) for r in rows] + [1])
    label_w, value_w, rowh = 112, 92, 26
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
                       f'<title>{E(r["label"])}: {M(v, 1, 2)}</title></rect>')
        out.append(f'<text x="{width-6}" y="{y+13}" text-anchor="end" class="ax" style="font-size:11px">{E(r.get("suffix", ""))}</text>')
    out.append('</svg>')
    return "".join(out)


def _forecast_chart(trend, cash_fc, floor, unit_scale=1.0, width=640, height=230):
    """历史月度净现金流（实柱）+ 预测净现金流（空心柱）+ 预测期末余额折线 + 安全下限"""
    hist = [(r["period"], float(r["net"] or 0)) for r in trend]
    fut = [(c["period"], c["net"]) for c in cash_fc]
    bal = [(c["period"], c["end_balance"]) for c in cash_fc]
    vals = [v for _, v in hist + fut] + [floor] + [b for _, b in bal]
    hi = max(vals + [1.0]); lo = min(vals + [0.0])
    pad_l, pad_b, pad_t = 58, 38, 12
    inner_w, inner_h = width - pad_l - 14, height - pad_b - pad_t
    n = len(hist) + len(fut)
    slot = inner_w / max(n, 1)
    bw = max(5, min(slot * 0.55, 30))
    def y(v):
        return pad_t + (hi - v) / (hi - lo or 1) * inner_h
    out = [f'<svg viewBox="0 0 {width} {height}" class="chart" preserveAspectRatio="xMidYMid meet">']
    for f in range(5):
        v = lo + (hi - lo) * f / 4
        yy = y(v)
        out.append(f'<line x1="{pad_l}" y1="{yy:.1f}" x2="{width-10}" y2="{yy:.1f}" stroke="#E3E8F0"/>')
        out.append(f'<text x="{pad_l-6}" y="{yy+3:.1f}" text-anchor="end" class="ax">{M(v, unit_scale, 1)}</text>')
    sep_x = pad_l + len(hist) * slot
    out.append(f'<line x1="{sep_x:.1f}" y1="{pad_t}" x2="{sep_x:.1f}" y2="{pad_t+inner_h}" stroke="#B9C7DE" stroke-dasharray="4 4"/>')
    out.append(f'<text x="{sep_x+4:.1f}" y="{pad_t+10}" class="ax">← 历史　预测 →</text>')
    if floor:
        out.append(f'<line x1="{pad_l}" y1="{y(floor):.1f}" x2="{width-10}" y2="{y(floor):.1f}" stroke="#C0392B" stroke-width="1.2" stroke-dasharray="6 3"/>')
        out.append(f'<text x="{width-12}" y="{y(floor)-3:.1f}" text-anchor="end" class="ax" fill="#C0392B">安全下限</text>')
    for i, (p, v) in enumerate(hist):
        x = pad_l + i * slot + (slot - bw) / 2
        out.append(f'<rect x="{x:.1f}" y="{y(max(v,0)):.1f}" width="{bw:.1f}" height="{max(abs(v)/ (hi-lo or 1) * inner_h,1):.1f}" rx="2" fill="#85B7EB">'
                   f'<title>{E(p)} 净现金流 {M(v, unit_scale, 2)}</title></rect>')
    pts = []
    for j, (p, v) in enumerate(fut):
        x = pad_l + (len(hist) + j) * slot + (slot - bw) / 2
        out.append(f'<rect x="{x:.1f}" y="{y(max(v,0)):.1f}" width="{bw:.1f}" height="{max(abs(v)/(hi-lo or 1) * inner_h,1):.1f}" rx="2" fill="none" stroke="#2F5597" stroke-width="1.2" stroke-dasharray="3 2">'
                   f'<title>{E(p)} 预测净现金流 {M(v, unit_scale, 2)}</title></rect>')
        pts.append((x + bw / 2, y(bal[j][1])))
    if len(pts) > 1:
        d = " ".join(("M" if i == 0 else "L") + f"{p[0]:.1f},{p[1]:.1f}" for i, p in enumerate(pts))
        out.append(f'<path d="{d}" fill="none" stroke="#D85A30" stroke-width="1.8" stroke-dasharray="5 3"/>')
    for p in pts:
        out.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="2.6" fill="#D85A30"><title>预测期末余额</title></circle>')
    labels = [p for p, _ in hist] + [p for p, _ in fut]
    for i, lb in enumerate(labels):
        x = pad_l + i * slot + slot / 2
        out.append(f'<text x="{x:.1f}" y="{height-20}" text-anchor="middle" class="ax">{E(lb[5:])}</text>')
    out.append('</svg>')
    return "".join(out)


def _network(graph, width=880, height=300):
    writes = [n for n in graph["nodes"] if n["type"] == "write"]
    targets = {}
    for e in graph["edges"]:
        targets.setdefault(e["to"], []).append(e["from"])
    analyses = [n for n in graph["nodes"] if n["type"] == "analysis" and n["id"] in targets]
    analyses.sort(key=lambda n: -len(targets[n["id"]]))
    lw, rw = 150, width - 185
    lh = (height - 30) / max(len(writes), 1)
    rh = (height - 30) / max(len(analyses), 1)
    ly = {n["id"]: 16 + i * lh + lh / 2 for i, n in enumerate(writes)}
    ry = {n["id"]: 16 + i * rh + rh / 2 for i, n in enumerate(analyses)}
    out = [f'<svg viewBox="0 0 {width} {height}" class="net">']
    for e in graph["edges"]:
        if e["from"] in ly and e["to"] in ry:
            x1, y1, x2, y2 = lw, ly[e["from"]], rw, ry[e["to"]]
            mx = (x1 + x2) / 2
            out.append(f'<path d="M{x1},{y1:.1f} C{mx},{y1:.1f} {mx},{y2:.1f} {x2},{y2:.1f}" '
                       f'fill="none" stroke="#B9C7DE" stroke-width="1" opacity=".6"><title>{E(e["effect"])}</title></path>')
    for n in writes:
        y = ly[n["id"]]
        out.append(f'<rect x="4" y="{y-9:.1f}" width="{lw-8}" height="18" rx="4" fill="#2F5597"/>'
                   f'<text x="{lw/2}" y="{y+3:.1f}" text-anchor="middle" font-size="10" fill="#fff">{E(n["label"])}</text>')
    for n in analyses:
        y = ry[n["id"]]
        heat = min(1, len(targets[n["id"]]) / 5)
        out.append(f'<rect x="{rw}" y="{y-9:.1f}" width="{width-rw-6}" height="18" rx="4" '
                   f'fill="rgb({int(68+40*heat)},{int(114-20*heat)},{int(196-40*heat)})"/>'
                   f'<text x="{rw+(width-rw)/2}" y="{y+3:.1f}" text-anchor="middle" font-size="10" fill="#fff">'
                   f'{E(n["label"])} · {len(targets[n["id"]])}</text>')
    out.append('</svg>')
    return "".join(out)


CSS = """
:root{--p:#1F3A5F;--a:#2F5597;--bg:#F6F7F9;--card:#fff;--bd:#E3E8F0;--t:#1F2937;--t2:#6B7280;--ok:#2E8B57;--warn:#C0392B;--line:#D9DEE7}
*{box-sizing:border-box}body{font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:var(--t);background:var(--bg);margin:0;padding:24px 12px;font-size:13px}
.wrap{max-width:920px;margin:0 auto;background:var(--card);box-shadow:0 1px 10px rgba(20,40,80,.07)}
.cover{padding:36px 40px 26px;border-bottom:3px solid var(--p)}
.cover h1{margin:0;font-size:24px;letter-spacing:2px;color:var(--p)}
.cover .sub{margin-top:8px;color:var(--t2);font-size:12.5px;line-height:1.9}
.cover .badge{float:right;border:1px solid var(--p);color:var(--p);padding:3px 12px;border-radius:3px;font-size:11px}
section{padding:22px 40px;border-bottom:1px solid var(--bd);break-inside:avoid}
h2{font-size:16px;color:var(--p);margin:0 0 14px;font-weight:500}
h2 .en{color:var(--t2);font-size:11px;margin-left:8px}
p{line-height:1.85;margin:0 0 10px;text-align:justify}
.muted{color:var(--t2);font-size:12px}.pos{color:var(--ok)}.neg{color:var(--warn)}
.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:14px 0}
.kpi{border:1px solid var(--bd);border-top:3px solid var(--a);padding:10px 12px;border-radius:0 0 6px 6px}
.kpi .l{color:var(--t2);font-size:11px}.kpi .v{font-size:17px;font-weight:500;color:var(--p);margin-top:5px;font-variant-numeric:tabular-nums}
.chart{width:100%;height:auto}.ax{font-size:10px;fill:#8894A8}.dv{font-size:14px;font-weight:500;fill:#1F3A5F}
.donut{width:180px;height:180px}.donut-wrap{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.net{width:100%;height:auto}.nl{font-size:10px;fill:#fff}
table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid var(--line);padding:7px 8px;text-align:right;vertical-align:top}
th{background:#F2F5FA;color:var(--p);font-weight:500;text-align:right}th:first-child,td:first-child{text-align:left}
tbody tr:nth-child(even){background:#FAFBFC}.num{font-variant-numeric:tabular-nums}
.figcap{color:var(--t2);font-size:11px;margin:6px 0 16px}
.summary{border-left:3px solid var(--a);background:#F7F9FC;padding:14px 18px;border-radius:0 6px 6px 0}
.summary li{margin-bottom:9px;line-height:1.85}
.risk{border-left:3px solid var(--warn);background:#FDF6F5;padding:10px 14px;margin-bottom:9px;border-radius:0 5px 5px 0}
.sec{border-left:3px solid var(--a);background:#F7F9FC;padding:12px 16px;margin-bottom:10px;border-radius:0 6px 6px 0}
.sec h3{margin:0 0 8px;font-size:13px;color:var(--p);font-weight:500}
.sec p{margin-bottom:7px}
.foot{padding:16px 40px 28px;color:var(--t2);font-size:11px;line-height:1.8;border-top:1px solid var(--bd)}
.foot .disc{border:1px solid var(--line);padding:9px 12px;border-radius:5px;background:#FAFBFC}
.pgnum{display:none}
@media print{
 body{background:#fff;padding:0}@page{size:A4;margin:16mm 14mm 18mm}
 .wrap{box-shadow:none;max-width:none}.pgnum{display:block;position:fixed;bottom:6mm;left:0;right:0;text-align:center;font-size:10px;color:#8894A8}
 section{break-inside:avoid}.chart,.net{break-inside:avoid}.cover{break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 table{font-size:10.5px}button{display:none}
}
"""


def render_report(data, graph=None):
    k = data["kpi"]
    rep = data["report"]
    ra = data["ratios"]
    inc = data["income"]
    bs = data["balance"]
    cf = data["cashflow"]["cumulative"]
    art = data["articulation"]
    ag = data["aging"]
    cp = data["compare"]
    unit_scale = 10000.0  # 图表金额统一万元
    unit_note = "除特别注明外，表内金额单位为人民币元，图表金额单位为万元"
    if abs(k["total_assets"]) < 100000:
        unit_scale, unit_note = 1.0, "除特别注明外，金额单位为人民币元"

    exec_items = [c for c in data["conclusions"]][:5]
    summary = f"""<div class="summary"><ul style="margin:0;padding-left:18px">
      {''.join(f'<li><b>{E(c["title"])}</b> — {E(c["text"])}</li>' for c in exec_items)}
      </ul><p class="muted" style="margin:8px 0 0">完整指标、口径与局限见各章及附录；本摘要结论均由账套现有数据自动计算生成。</p></div>"""

    kpis = [("累计营业收入", "¥" + M(k["revenue"])), ("本年累计净利润", "¥" + M(k["net_cum"])),
            ("资产合计", "¥" + M(k["total_assets"])), ("资产负债率", f"{ra['basis'].get('total_liabilities', 0) / (k['total_assets'] or 1) * 100:.1f}%"),
            ("货币资金", "¥" + M(k["cash"])), ("健康度评分", f"{k['score']:.0f} / 100")]
    kpi_html = "".join(f'<div class="kpi"><div class="l">{E(a)}</div><div class="v">{E(b)}</div></div>' for a, b in kpis)

    kpi_tbl = "".join(
        f'<tr><td>{E(x["metric"])}</td><td class="num">{M(x["current"])}</td>'
        f'<td class="num">{M(x["prev"])}</td><td class="num">{M(x["last_year"])}</td>'
        f'<td>{_pct(x["mom"])}</td><td>{_pct(x["yoy"])}</td></tr>' for x in rep["kpi_table"])

    sec_html = lambda name: "".join(
        f'<div class="sec"><h3>{E(s["title"])}</h3>' + "".join(f"<p>{E(p)}</p>" for p in s["paras"]) + "</div>"
        for s in rep["sections"] if s["title"] == name)

    bs_pct = "".join(f'<tr><td>{E(x["item"])}</td><td class="num">{M(x["amount"])}</td>'
                     f'<td class="num">{(str(x["pct"]) + "%") if x["pct"] is not None else "—"}</td></tr>'
                     for x in rep["bs_assets_pct"] if x["display"])
    inc_tbl = "".join(f'<tr><td>{E(c["item"])}</td><td class="num">{M(c["amount"])}</td>'
                      f'<td class="num">{M(y["amount"])}</td></tr>'
                      for c, y in zip(inc["current"], inc["cumulative"]))
    art_tbl = "".join(f'<tr><td>{E(c["name"])}</td><td>{E(c["left"])}</td><td>{E(c["right"])}</td>'
                      f'<td>{"✓ 相符" if c["pass"] else "✗ 差额 " + M(c["diff"])}</td></tr>' for c in art["checks"])
    rule_tbl = "".join(f'<tr><td><b>{E(m["name"])}</b></td><td>{E(m["formula"])}</td>'
                       f'<td>{E(", ".join(m["source"]) if isinstance(m["source"], list) else m["source"])}</td>'
                       f'<td class="muted">{E(m["limitation"] or m["scope"])}</td></tr>' for m in data["rule_book"])
    lineage_tbl = "".join(f'<tr><td><b>{E(l["metric"])}</b></td><td class="muted">{E(", ".join(l["sources"]))}</td>'
                          f'<td>{E(l["rule"])}</td></tr>' for l in data["lineage"])

    wf = _waterfall(rep["waterfall"], "累计净利润", rep["waterfall_net"], unit_scale=unit_scale)
    trend = _trend_bars(data["trend"], unit_scale=unit_scale)
    donut = _donut([("资产", bs["total_assets"], "#2F5597"), ("负债", bs["total_liabilities"], "#D85A30"),
                    ("权益", bs["total_equity"], "#2E8B57")])
    op_net = next((c["net"] for c in cf["categories"] if c["category"] == "经营活动"), 0)
    cf_rows = [{"label": f'{c["category"]}（净额 {M(c["net"], unit_scale, 2)} 万）', "value": c["net"],
                "color": "#2E8B57" if c["net"] >= 0 else "#C0392B"} for c in cf["categories"]]
    ratio_rows = [{"label": x["name"], "value": x["value"], "status": x["status"],
                   "suffix": (f"{x['value']}{x['unit']}" if x["value"] is not None else "不适用") + f"｜{x['status']}"} for x in ra["items"]]
    net = _network(graph) if graph else ""
    # ---- 八、经营预测与展望 ----
    forecast = data["forecast"]
    safety = forecast["safety_months"]
    forecast_svg = _forecast_chart(data["trend"], forecast["cash"], safety["floor"], unit_scale)
    budget = forecast["budget"]
    if budget.get("has_budget"):
        rows_b = "".join(
            f'<tr><td>{E(x["subject"])}</td><td class="num">{M(x["budget"])}</td>'
            f'<td class="num">{M(x["actual"])}</td>'
            f'<td class="num">{(str(x["usage"]) + "%") if x["usage"] is not None else "—"}</td>'
            f'<td class="num">{M(x["year_end_forecast"])}</td><td>{E(x["status"])}</td></tr>'
            for x in budget["items"])
        budget_tbl = (f'<table><thead><tr><th>科目</th><th>年度预算</th><th>累计实际</th>'
                      f'<th>执行率</th><th>年末预测</th><th>状态</th></tr></thead><tbody>{rows_b}</tbody></table>')
    else:
        budget_tbl = f'<p class="muted">{E(budget.get("hint") or "本年度未设置预算。")}</p>'

    risks = [c for c in data["conclusions"] if c["level"] == "warn"]
    risk_html = "".join(f'<div class="risk"><b>{E(c["title"])}</b><p class="muted" style="margin:4px 0 0">{E(c["text"])}</p></div>'
                        for c in risks) or '<p class="muted">未发现需要特别关注的风险项。</p>'

    return f"""<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(data["company"])} 经营分析报告 · {E(data["period"])}</title>
<style>{CSS}</style></head><body><div class="wrap">
<div class="cover"><span class="badge">内部资料 · 注意保存</span>
<h1>{E(data["company"])}　经营分析报告</h1>
<div class="sub">报告期间：<b>{E(data["period"])}</b>　|　累计口径：{E(inc["cum_scope"])}　|　出具时间：{E(data["generated_at"])}<br>
{E(unit_note)}　|　数据来源：已过账凭证、期初余额、出纳日记账　|　出具方式：系统自动生成</div></div>

<section><h2>一、管理层摘要<span class="en">Executive Summary</span></h2>{summary}
<div class="kpis">{kpi_html}</div></section>

<section><h2>二、关键财务指标一览<span class="en">Key Metrics</span></h2>
<table><thead><tr><th>指标</th><th>本期</th><th>上期</th><th>去年同月</th><th>环比</th><th>同比</th></tr></thead>
<tbody>{kpi_tbl}</tbody></table>
<p class="muted" style="margin-top:8px">基期为 0 时不计算增长率，避免误读；“本期”为所选月份当月发生额。</p></section>

<section><h2>三、盈利能力分析<span class="en">Profitability</span></h2>
{sec_html("盈利能力")}
<div class="figcap"><b>图 1</b>　利润构成瀑布（自营业收入逐项至累计净利润）</div>{wf}
<div class="figcap"><b>图 2</b>　近 12 个月营业收入（柱）与净利润（线）</div>{trend}
<div class="figcap">数据来源：已过账凭证明细（voucher_lines / vouchers），排除结转凭证。</div></section>

<section><h2>四、偿债能力分析<span class="en">Solvency</span></h2>
{sec_html("偿债能力")}
<div class="figcap"><b>图 3</b>　偿债与盈利比率一览（绿=健康 / 红=关注）</div>{_hbar(ratio_rows[:6])}</section>

<section><h2>五、营运能力分析<span class="en">Operation</span></h2>
{sec_html("营运能力")}
<div class="figcap"><b>图 4</b>　应收账龄分布（账龄基准日 {E(ag["as_of"])}，{E(ag["basis"])} 口径）</div>
{_hbar([{"label": d["bucket"], "value": d["amount"]} for d in ag["details"]])}
<p class="muted">坏账应计提 {M(ag["required"])} 元，已计提 {M(ag["provided"])} 元，待调整 {M(ag["adjustment"])} 元。</p></section>

<section><h2>六、现金流分析<span class="en">Cash Flow</span></h2>
{sec_html("现金流质量")}
<div class="figcap"><b>图 5</b>　三大活动现金净额（累计，自建账起）</div>{_hbar(cf_rows)}
<p class="muted">经营现金流净额 / 净利润 = {rep["cash_quality"]["cash_to_profit"] if rep["cash_quality"]["cash_to_profit"] is not None else "—"}；现金流入流出比 = {rep["cash_quality"]["in_out_ratio"] if rep["cash_quality"]["in_out_ratio"] is not None else "—"}。</p></section>

<section><h2>七、资产负债结构<span class="en">Balance Sheet</span></h2>
<div class="donut-wrap">{donut}<div style="flex:1;min-width:280px">
<table><thead><tr><th>资产项目</th><th>金额</th><th>占总资产</th></tr></thead><tbody>{bs_pct}</tbody></table></div></div>
<p class="muted">固定资产原值 / 累计折旧为展示行，合计按净值计入。</p></section>

<section><h2>八、经营预测与展望<span class="en">Forecast &amp; Outlook</span></h2>
<p class="muted">预测方法：{E(forecast["method"])}。{E(forecast["sparse_hint"])}</p>
<div class="figcap"><b>图 6</b>　月度净现金流与期末货币资金推演（实柱=历史，虚柱=预测，橙线=预测期末余额，红线=资金安全下限）</div>
{forecast_svg}
<table><thead><tr><th>预测项目</th><th>下一月</th><th>第二月</th><th>第三月</th></tr></thead><tbody>
<tr><td>营业收入（中性预测）</td><td class="num">{M(forecast["revenue"][0]["value"])}</td><td class="num">{M(forecast["revenue"][1]["value"])}</td><td class="num">{M(forecast["revenue"][2]["value"])}</td></tr>
<tr><td>　乐观（+1σ）</td><td class="num">{M(forecast["revenue"][0]["high"])}</td><td class="num">{M(forecast["revenue"][1]["high"])}</td><td class="num">{M(forecast["revenue"][2]["high"])}</td></tr>
<tr><td>　悲观（−1σ）</td><td class="num">{M(forecast["revenue"][0]["low"])}</td><td class="num">{M(forecast["revenue"][1]["low"])}</td><td class="num">{M(forecast["revenue"][2]["low"])}</td></tr>
<tr><td>净利润（中性预测）</td><td class="num">{M(forecast["net"][0]["value"])}</td><td class="num">{M(forecast["net"][1]["value"])}</td><td class="num">{M(forecast["net"][2]["value"])}</td></tr>
</tbody></table>
<h3 style="font-size:13px;color:var(--p);margin:14px 0 8px">资金安全推演</h3>
<p>期末货币资金 {E(M(safety["cash"]))} 元，近 3 月月均支出 {E(M(safety["monthly_outflow"]))} 元，
<b>资金安全月数 {E(safety["months"]) if safety["months"] is not None else "—"} 个月</b>（{E(safety["rule"])}）。
按月均净现金流推演，未来 6 个月期末余额分别为
{E("、".join(M(c["end_balance"]) for c in forecast["cash"]))} 元{E("；" + "、".join(c["period"] + " 低于安全下限" for c in forecast["cash"] if c["below_floor"]) if any(c["below_floor"] for c in forecast["cash"]) else "，均高于安全下限")}。</p>
<div class="figcap"><b>表</b>　预算执行与年末推算</div>{budget_tbl}
<h3 style="font-size:13px;color:var(--p);margin:14px 0 8px">预测准确性（历史回测）</h3>
<p>{E(("以 " + forecast["backtest"]["month"] + " 为样本：模型预测营业收入 " + M(forecast["backtest"]["predicted"]) + " 元，实际 " + M(forecast["backtest"]["actual"]) + " 元，误差 " + (str(forecast["backtest"]["error_pct"]) + "%")) if forecast["backtest"] else "历史数据尚不足以回测，建议积累 4 个月以上数据后再评估预测准确性。")}</p>
<p class="muted">{E(forecast["limitation"])}</p></section>

<section><h2>九、风险与关注事项<span class="en">Risk &amp; Concerns</span></h2>{risk_html}</section>

<section><h2>附录 A　编制口径与计算规则说明书</h2>
<table><thead><tr><th>指标</th><th>公式</th><th>数据源</th><th>口径 / 局限</th></tr></thead><tbody>{rule_tbl}</tbody></table>
<p class="muted">{E(unit_note)}；比率类指标采用本期累计数与期末余额，为管理分析口径，非审计报表。</p></section>

<section><h2>附录 B　三大勾稽核对</h2>
<table><thead><tr><th>勾稽关系</th><th>左边</th><th>右边</th><th>结果</th></tr></thead><tbody>{art_tbl}</tbody></table></section>

<section><h2>附录 C　数据血缘</h2>
<table><thead><tr><th>指标组</th><th>来源表</th><th>计算规则</th></tr></thead><tbody>{lineage_tbl}</tbody></table></section>

{('<section><h2>附录 D　功能联动关系图</h2><p class="muted">左侧为写操作，右侧为受影响的分析功能；一个写操作会同时传导到多个报表。</p>' + net + '</section>') if net else ''}

<div class="foot"><div class="disc"><b>编制说明与免责声明：</b>本报告由系统基于账套现有数据自动生成，属于管理分析口径，不构成审计意见；
数据以已过账凭证、期初余额与出纳日记账为准，未过账单据不纳入本期数据。比率阈值、现金流分类等分析规则
可在「分析规则配置」中自定义，规则变更后报告口径随之调整。如需对外披露，请先完成审计程序。</div>
<div style="margin-top:10px">{E(data["company"])} · {E(data["period"])} · 生成于 {E(data["generated_at"])}</div></div>
</div><div class="pgnum">第 <span class="pn"></span> 页</div>
</body></html>"""
