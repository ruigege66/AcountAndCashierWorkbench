# -*- coding: utf-8 -*-
"""统一分析服务：所有指标只依赖 AccountingContext + RuleEngine。

设计原则（回应「数据之间是网状关系」）：
  * 单一数据源：余额、流水、发票全部经 Context 取，任何两个指标不会算出两个「资产合计」
  * 口径随规则：流动性划分、现金流分类、阈值都来自 RuleEngine，改规则立即全站生效
  * 自描述：每个指标返回 value/formula/source/scope/limitation，可直接生成计算规则说明书
  * 血缘可追：lineage 标明每个数字来自哪些表，便于核对传导路径
"""
from datetime import datetime

from .context import AccountingContext, shift_month
from .rules import RuleEngine


def r2(x):
    return round(float(x or 0), 2)


def div(a, b):
    return round(a / b, 4) if abs(float(b or 0)) > 0.005 else None


def metric(value, unit, formula, source, scope, limitation="", name=""):
    return {"name": name, "value": value, "unit": unit, "formula": formula,
            "source": source, "scope": scope, "limitation": limitation}


def _match_category(code, rules):
    """按配置前缀最长匹配，返回 经营/投资/筹资/未分类"""
    best, length = None, -1
    for key, label in (("operating", "经营活动"), ("investing", "投资活动"),
                       ("financing", "筹资活动")):
        for p in rules.get("cashflow." + key, []) or []:
            p = str(p)
            if (code == p or code.startswith(p)) and len(p) > length:
                best, length = label, len(p)
    return best or "未分类"


def cashflow_categories(ctx, scope):
    rows = ctx.journal_rows(scope)
    rules = ctx.rules
    out = {k: {"label": k, "inflow": 0.0, "outflow": 0.0, "items": []}
           for k in ("经营活动", "投资活动", "筹资活动", "未分类")}
    unmapped = []
    for r in rows:
        code = str(r["subject_code"] or "")
        cat = _match_category(code, rules)
        if cat == "未分类" and rules.get("cashflow.unclassified") == "operating":
            cat = "经营活动"
        elif cat == "未分类":
            unmapped.append({"subject": r["subject_name"] or code or "未指定科目",
                             "amount": r2(r["amount"]), "direction": r["direction"]})
        key = "inflow" if r["direction"] == "in" else "outflow"
        out[cat][key] += r["amount"]
        out[cat]["items"].append({"subject": r["subject_name"] or code or "未指定科目",
                                  "code": code, "direction": "流入" if key == "inflow" else "流出",
                                  "amount": r2(r["amount"]), "count": r["cnt"]})
    cats = []
    for k, o in out.items():
        if k == "未分类" and not o["items"]:
            continue
        o["items"].sort(key=lambda x: -x["amount"])
        cats.append({"category": k, "label": k, "inflow": r2(o["inflow"]),
                     "outflow": r2(o["outflow"]), "net": r2(o["inflow"] - o["outflow"]),
                     "items": o["items"]})
    return {"categories": cats, "net": r2(sum(c["net"] for c in cats)),
            "in_total": r2(sum(c["inflow"] for c in cats)),
            "out_total": r2(sum(c["outflow"] for c in cats)),
            "unmapped": unmapped}


def ratios_of(ctx):
    bs, inc = ctx.balance_sheet(), ctx.income()
    rules = ctx.rules
    cash = bs["assets"][0]["amount"]
    cur_assets = ctx.group_balance("current_asset")
    cur_liab = ctx.group_balance("current_liability")
    noncur_liab = ctx.group_balance("noncurrent_liability")
    inventory = round(sum(b["value"] for c, b in ctx.balances().items()
                          if c.startswith(tuple(rules.get("liquidity.inventory", ["14"])))
                          and ctx.classify(c) == "current_asset"), 2)
    recv = sum(x["amount"] for x in bs["assets"] if x["item"] in ("应收账款", "其他应收款"))
    ta, tl, eq = bs["total_assets"], bs["total_liabilities"], bs["total_equity"]
    cum = inc["cumulative"]
    rev, cost = cum[0]["amount"], cum[1]["amount"]
    opex = sum(cum[i]["amount"] for i in (2, 3, 4, 5))
    net = inc["net_cum"]

    specs = [
        ("流动比率", div(cur_assets, cur_liab), "倍", "流动资产 ÷ 流动负债",
         "按科目前缀划分流动/非流动，长期借款不计入分母"),
        ("速动比率", div(cur_assets - inventory, cur_liab), "倍", "(流动资产 − 存货) ÷ 流动负债", ""),
        ("现金比率", div(cash, cur_liab), "倍", "货币资金 ÷ 流动负债", ""),
        ("资产负债率", div(tl * 100, ta), "%", "负债合计 ÷ 资产合计 × 100%", ""),
        ("产权比率", div(tl, eq), "倍", "负债合计 ÷ 所有者权益", ""),
        ("销售毛利率", div((rev - cost) * 100, rev), "%", "(营业收入 − 营业成本) ÷ 营业收入 × 100%", ""),
        ("销售净利率", div(net * 100, rev), "%", "净利润 ÷ 营业收入 × 100%", ""),
        ("期间费用率", div(opex * 100, rev), "%", "(税金及附加+销售+管理+财务费用) ÷ 营业收入 × 100%", ""),
        ("总资产周转率", div(rev, ta), "次", "营业收入 ÷ 资产合计", "管理口径，用期末资产而非平均资产"),
        ("应收账款周转率", div(rev, recv), "次", "营业收入 ÷ 应收款项", "管理口径，用期末余额而非平均余额"),
    ]
    items = []
    for name, value, unit, formula, limitation in specs:
        t = rules.get("ratios", {}).get(name, {}) or {}
        lo, hi = t.get("min"), t.get("max")
        if value is None:
            status = "不适用"
        elif (lo is None or value >= float(lo)) and (hi is None or value <= float(hi)):
            status = "健康"
        else:
            status = "关注"
        items.append(metric(value, unit, formula,
                            ["voucher_lines", "opening_balances", "subjects", "vouchers"],
                            f"{inc['year']} 年累计 / {ctx.period} 期末", limitation, name) | {
                      "status": status, "benchmark": (
                          (f"≥ {lo}" if lo is not None else "") +
                          (" 且 " if lo is not None and hi is not None else "") +
                          (f"≤ {hi}" if hi is not None else "") or "不限")})
    weights = rules.get("score.weights", {}) or {}
    valid = [x for x in items if x["status"] != "不适用"]
    wsum = sum(float(weights.get(x["name"], 1) or 0) for x in valid)
    healthy = sum(float(weights.get(x["name"], 1) or 0) for x in valid if x["status"] == "健康")
    return {"items": items, "score": round(healthy / wsum * 100, 0) if wsum else 0,
            "healthy": sum(1 for x in valid if x["status"] == "健康"), "valid": len(valid),
            "basis": {"current_assets": cur_assets, "current_liabilities": cur_liab,
                      "noncurrent_liabilities": noncur_liab, "inventory": inventory,
                      "cash": cash, "receivable": r2(recv), "total_assets": ta,
                      "total_liabilities": tl, "total_equity": eq,
                      "revenue": rev, "net_profit": net}}


def aging_of(ctx):
    rates = ctx.rules.get("aging.rates", {}) or {}
    buckets = list(ctx.rules.get("aging.buckets", []))
    data = {b: 0.0 for b in buckets}
    for r in ctx.invoices(aged=True):
        if r["direction"] == "应收" and r["bucket"] in data:
            data[r["bucket"]] += r["total_amount"]
    details = [{"bucket": b, "amount": r2(data[b]), "rate": float(rates.get(b, 0) or 0),
                "provision": r2(data[b] * float(rates.get(b, 0) or 0))} for b in buckets]
    for d in details:
        d["rate_pct"] = round(d["rate"] * 100, 2)
    return {"as_of": ctx.as_of(), "basis": ctx.rules.get("aging.basis"),
            "details": details, "receivable_total": r2(sum(data.values())),
            "required": r2(sum(d["provision"] for d in details)),
            "provided": r2(-ctx.balance("1231")),
            "adjustment": r2(sum(d["provision"] for d in details) - (-ctx.balance("1231")))}


def trend_of(ctx, months=12):
    out = []
    for i in range(months - 1, -1, -1):
        p = shift_month(ctx.period, -i)
        inc = ctx.statement_for(p)
        rev = inc["current"][0]["amount"]
        net = inc["net_current"]
        rows = ctx.journal_month(p)
        inflow = r2(sum(r["v"] for r in rows if r["direction"] == "in"))
        outflow = r2(sum(r["v"] for r in rows if r["direction"] == "out"))
        out.append({"period": p, "revenue": r2(rev), "expense": r2(rev - inc["current"][7]["amount"]),
                    "net": r2(net), "inflow": inflow, "outflow": outflow})
    return out


def conclusions(ctx, data):
    """基于规则阈值自动生成文字结论（图文报告里的「文」）"""
    out = []
    ra = {x["name"]: x for x in data["ratios"]["items"]}
    k = data["kpi"]
    art = data["articulation"]
    if art["all_pass"]:
        out.append(("ok", "三大勾稽关系全部相符", "资产 = 负债 + 权益；累计净利润与留存收益一致；现金流量净额与货币资金变动一致。账套数据具备基本的自洽性。"))
    else:
        bad = "、".join(c["name"] for c in art["checks"] if not c["pass"])
        out.append(("warn", f"存在 {sum(1 for c in art['checks'] if not c['pass'])} 项勾稽不平", f"未通过：{bad}。建议先做「数据自检」再出报表。"))
    al = ra.get("资产负债率", {})
    if al.get("value") is not None:
        out.append(("ok" if al["status"] == "健康" else "warn",
                    f"资产负债率 {al['value']}%（参考 {al['benchmark']}）",
                    f"负债合计 ¥{data['ratios']['basis']['total_liabilities']:,.2f} / 资产合计 ¥{data['ratios']['basis']['total_assets']:,.2f}，评价：{al['status']}。"))
    if k["net_cum"] >= 0:
        out.append(("ok", f"{data['period'][:4]} 年累计净利润 ¥{k['net_cum']:,.2f}",
                    f"累计营业收入 ¥{k['revenue']:,.2f}，销售净利率 {ra.get('销售净利率', {}).get('value', '—')}%。"))
    else:
        out.append(("warn", f"{data['period'][:4]} 年累计亏损 ¥{abs(k['net_cum']):,.2f}",
                    "建议结合同比环比查看是收入下滑还是费用上升，并检查是否有大额计提。"))
    cf = data["cashflow"]["cumulative"]
    if cf["net"] < 0:
        out.append(("warn", f"累计现金净流出 ¥{abs(cf['net']):,.2f}",
                    "经营、投资、筹资三类流量见下方图表；持续净流出需关注资金安全月数。"))
    else:
        out.append(("ok", f"累计现金净流入 ¥{cf['net']:,.2f}", "与货币资金变动勾稽一致。"))
    un = data["cashflow"]["cumulative"].get("unmapped", [])
    if un:
        out.append(("warn", f"{len(un)} 个科目未纳入现金流分类规则",
                    "已单列「未分类」，请在「分析规则」里补充科目前缀，否则分类不完整。"))
    ag = data["aging"]
    if ag["adjustment"] > 0.005:
        out.append(("warn", f"坏账准备尚需补提 ¥{ag['adjustment']:,.2f}",
                    f"按 {ag['as_of']} 账龄计算应计提 ¥{ag['required']:,.2f}，已计提 ¥{ag['provided']:,.2f}。"))
    if data["collection"]["total"] > 0:
        out.append(("info", f"逾期应收 ¥{data['collection']['total']:,.2f}",
                    f"涉及 {len(data['collection']['items'])} 家往来单位；可在「催收清单」导出明细。"))
    return [{"level": a, "title": b, "text": c} for a, b, c in out]


def build_report_pack(ctx, data):
    """经营报告专用数据：利润瀑布、结构占比、现金流质量、关键指标一览、四大能力段落。"""
    inc = data["income"]["cumulative"]
    kpi, ra = data["kpi"], data["ratios"]
    b = ra["basis"]
    # 利润瀑布：自收入逐项扣减至净利润（单位：元）
    steps = [
        {"label": "营业收入", "value": inc[0]["amount"]},
        {"label": "营业成本", "value": -inc[1]["amount"]},
        {"label": "税金及附加", "value": -inc[2]["amount"]},
        {"label": "销售费用", "value": -inc[3]["amount"]},
        {"label": "管理费用", "value": -inc[4]["amount"]},
        {"label": "财务费用", "value": -inc[5]["amount"]},
        {"label": "其他损益", "value": inc[6]["amount"]},
        {"label": "营业外收支", "value": inc[8]["amount"] + inc[9]["amount"]},
        {"label": "所得税", "value": inc[11]["amount"]},
    ]
    run = 0.0
    waterfall = []
    for x in steps:
        run += x["value"]
        waterfall.append({**x, "value": r2(x["value"]), "cum": r2(run)})
    ta = kpi["total_assets"]
    bs_assets = [{"item": x["item"], "amount": x["amount"],
                  "pct": round(x["amount"] / ta * 100, 2) if ta else None,
                  "display": not x.get("_nosum")} for x in data["balance"]["assets"]]
    cf = data["cashflow"]["cumulative"]
    op = next((c for c in cf["categories"] if c["category"] == "经营活动"),
              {"net": 0.0, "inflow": 0.0, "outflow": 0.0})
    net = kpi["net_cum"]
    # 关键指标一览（本期 / 上月 / 去年同月 / 环比 / 同比）
    cmp_, labels = data["compare"], data["compare"]["labels"]
    def row(key):
        return {"metric": labels[key], "current": r2(cmp_["current"][key]),
                "prev": r2(cmp_["prev"][key]), "last_year": r2(cmp_["last_year"][key]),
                "mom": cmp_["mom"].get(key), "yoy": cmp_["yoy"].get(key),
                "unit": "元" if key in ("revenue", "expense", "net", "inflow", "outflow") else ""}
    kpi_table = [row(k) for k in ("revenue", "net", "expense", "inflow", "outflow")]
    quality = {"operating_net": r2(op["net"]), "net_profit": r2(net),
               "cash_to_profit": div(op["net"], net),
               "in_out_ratio": div(cf["in_total"], cf["out_total"]) if cf["out_total"] else None}
    return {"unit_note": "除特别注明外，金额单位为人民币元；累计数口径为自账套启用起至所选期间",
            "waterfall": waterfall, "waterfall_net": r2(run),
            "bs_assets_pct": bs_assets, "cash_quality": quality, "kpi_table": kpi_table,
            "sections": capability_sections(ctx, data, op, quality)}


def capability_sections(ctx, data, op, quality):
    """四大能力结构化分析：每段结论均由当期数据支撑。"""
    ra = {x["name"]: x for x in data["ratios"]["items"]}
    k, b = data["kpi"], data["ratios"]["basis"]
    ag, cf = data["aging"], data["cashflow"]["cumulative"]
    cp = data["compare"]

    def fmt_ratio(name):
        x = ra.get(name, {})
        v = x.get("value")
        if v is None:
            return f"{name}暂无法计算（{x.get('limitation') or '分母为零'}）"
        tail = f"，{x.get('benchmark', '不限')}" if x.get("benchmark") not in (None, "", "不限") else ""
        return f"{name} {v}{x.get('unit', '')}（{x.get('status')}，参考{tail}）"

    paras = {
        "profit": [
            f"{data['income']['year']} 年累计营业收入 {k['revenue']:,.2f} 元，累计净利润 {k['net_cum']:,.2f} 元，"
            f"销售净利率 {ra.get('销售净利率', {}).get('value', '—')}%；本期净利润 {k['net_current']:,.2f} 元，"
            f"较上月{'增加' if cp['current']['net'] >= cp['prev']['net'] else '减少'} "
            f"{abs(cp['current']['net'] - cp['prev']['net']):,.2f} 元。",
            fmt_ratio("销售毛利率") + "；" + fmt_ratio("期间费用率"),
            "建议：" + ("毛利率偏低，优先核查主营业务成本构成与定价；" if (ra.get('销售毛利率', {}).get('value') or 0) < 20 else "毛利水平稳定，")
            + ("费用率偏高，重点压降期间费用。" if (ra.get('期间费用率', {}).get('value') or 0) > 20 else "费用管控正常。"),
        ],
        "solvency": [
            fmt_ratio("资产负债率") + "；" + fmt_ratio("产权比率"),
            f"流动资产 {b['current_assets']:,.2f} 元，流动负债 {b['current_liabilities']:,.2f} 元；"
            + fmt_ratio("流动比率") + "。" if b["current_liabilities"] else
            f"当前无流动负债余额，短期偿债压力为零；非流动负债 {b['noncurrent_liabilities']:,.2f} 元。",
            fmt_ratio("现金比率") + "，货币资金 " + f"{b['cash']:,.2f} 元。",
        ],
        "operation": [
            fmt_ratio("总资产周转率") + "；" + fmt_ratio("应收账款周转率"),
            f"应收款项 {b['receivable']:,.2f} 元，逾期应收 {ag['receivable_total']:,.2f} 元"
            f"（{len(data['collection']['items'])} 家往来单位），坏账应计提 {ag['required']:,.2f} 元、已计提 {ag['provided']:,.2f} 元。",
            "建议：" + ("逾期应收占比较高，优先安排催收并核销呆账；" if ag["receivable_total"] > 0 else "回款状况良好，")
            + ("资产周转偏慢，可清理闲置资产。" if (ra.get('总资产周转率', {}).get('value') or 1) < 0.5 else "资产运营效率正常。"),
        ],
        "cash": [
            f"自建账起现金净流入 {cf['net']:,.2f} 元：经营 {next((c['net'] for c in cf['categories'] if c['category'] == '经营活动'), 0):,.2f}、"
            f"投资 {next((c['net'] for c in cf['categories'] if c['category'] == '投资活动'), 0):,.2f}、"
            f"筹资 {next((c['net'] for c in cf['categories'] if c['category'] == '筹资活动'), 0):,.2f} 元。",
            f"经营现金流净额与净利润之比 {quality['cash_to_profit'] if quality['cash_to_profit'] is not None else '—'}"
            "（大于 1 说明利润有现金支撑）" if quality["cash_to_profit"] is not None else "净利润为 0，暂不计算现金利润比",
            f"现金流入流出比 {quality['in_out_ratio'] if quality['in_out_ratio'] is not None else '—'}；"
            f"期末货币资金 {b['cash']:,.2f} 元。",
        ],
    }
    titles = [("profit", "盈利能力"), ("solvency", "偿债能力"), ("operation", "营运能力"), ("cash", "现金流质量")]
    return [{"title": t, "paras": [p for p in paras[k] if p]} for k, t in titles]


def _linreg(ys):
    """最小二乘线性回归，返回 (slope, intercept, 残差标准差)"""
    n = len(ys)
    if n < 2:
        return None
    xs = list(range(n))
    sx, sy = sum(xs), sum(ys)
    sxx = sum(x * x for x in xs)
    sxy = sum(x * y for x, y in zip(xs, ys))
    den = n * sxx - sx * sx
    if den == 0:
        return None
    slope = (n * sxy - sx * sy) / den
    intercept = (sy - slope * sx) / n
    resid = [y - (slope * x + intercept) for x, y in zip(xs, ys)]
    sigma = (sum(r * r for r in resid) / (n - 2)) ** 0.5 if n > 2 else abs(sy / n) * 0.2
    return slope, intercept, sigma


def _forecast_series(rows, key, months=3, nonnegative=False):
    """趋势预测：线性回归 60% + 近 3 月均值 40% 混合，置信区间 = ±1 倍残差标准差"""
    vals = [float(r.get(key) or 0) for r in rows][-6:]
    if not vals:
        return []
    fit = _linreg(vals)
    avg = sum(vals[-3:]) / min(3, len(vals))
    sigma = fit[2] if fit else abs(avg) * 0.3
    preds = []
    for i in range(1, months + 1):
        base = (fit[0] * (len(vals) - 1 + i) + fit[1]) if fit else avg
        mid = base * 0.6 + avg * 0.4
        lo, hi = mid - sigma, mid + sigma
        if nonnegative:
            lo = max(lo, 0.0)
        preds.append({"period": shift_month(rows[-1]["period"], i),
                      "value": r2(mid), "low": r2(lo), "high": r2(hi)})
    return preds


def _budget_view(ctx, period):
    """预算执行与全年推算（未设预算返回提示）"""
    year = period[:4]
    budgets = ctx.ledger.budgets(year)
    if not budgets:
        return {"has_budget": False,
                "hint": f"{year} 年未设置预算；在「预算费控」按期间+科目设置后，此处将给出执行率与年末预测"}
    actuals = {r["subject_code"]: r["actual"] for r in ctx.ledger.year_actuals(year)}
    months_done = int(period[5:7])
    months_left = max(12 - months_done, 0)
    items = []
    for b in budgets:
        actual = r2(actuals.get(b["subject_code"], 0))
        budget = r2(b["budget"])
        run_rate = actual / months_done if months_done else 0
        year_end = r2(actual + run_rate * months_left)
        items.append({"subject": b["subject_name"] or b["subject_code"], "budget": budget,
                      "actual": actual, "usage": round(actual / budget * 100, 1) if budget else None,
                      "year_end_forecast": year_end,
                      "status": "超支" if actual > budget else
                                ("接近上限" if budget and actual / budget >= 0.8 else "正常")})
    return {"has_budget": True, "year": year, "items": items,
            "budget_total": r2(sum(x["budget"] for x in items)),
            "actual_total": r2(sum(x["actual"] for x in items))}


def build_forecast(conn, ctx, data):
    """经营预测与展望：趋势预测、现金流推演、资金安全月数、预算推算、回测误差。"""
    trend = data["trend"]
    active = [r for r in trend if (r["revenue"] or 0) or (r["expense"] or 0)]
    sparse = len(active) < 3
    rev_fc = _forecast_series(trend, "revenue", 3, nonnegative=True)
    net_fc = _forecast_series(trend, "net", 3)
    # 现金流 6 个月推演：近 3 月月均净额 + 货币资金期初 + 安全线
    opening = data["kpi"]["cash"]
    floor = float(ctx.ledger.setting("risk_cash_floor", "2000") or 0)
    nets = [float(r["net"] or 0) for r in trend][-3:]
    avg_net = sum(nets) / max(len(nets), 1)
    bal, cash_fc = opening, []
    for i in range(1, 7):
        bal += avg_net
        cash_fc.append({"period": shift_month(data["period"], i),
                        "net": r2(avg_net), "end_balance": r2(bal),
                        "below_floor": bal < floor})
    outflow_avg = sum(float(r["outflow"] or 0) for r in trend[-3:]) / max(len(trend[-3:]), 1)
    safety = {"cash": data["kpi"]["cash"], "monthly_outflow": r2(outflow_avg),
              "months": round(data["kpi"]["cash"] / outflow_avg, 1) if outflow_avg > 0.005 else None,
              "floor": floor, "rule": "资金安全月数 = 期末货币资金 ÷ 近 3 月月均支出；低于 3 个月建议补充资金安排"}
    # 回测：用除最后一个月外的历史预测最后一个月，与实际比较
    backtest = None
    if len(trend) >= 4 and abs(trend[-1]["revenue"] or 0) > 0.005:
        sub = trend[:-1]
        fc = _forecast_series(sub, "revenue", 1, nonnegative=True)
        if fc:
            pred, actual = fc[0]["value"], float(trend[-1]["revenue"] or 0)
            backtest = {"month": trend[-1]["period"], "predicted": r2(pred), "actual": r2(actual),
                        "error_pct": round((actual - pred) / abs(pred) * 100, 1) if abs(pred) > 0.005 else None}
    return {"method": "线性回归（60%）与近 3 月移动平均（40%）加权混合，置信区间为 ±1 倍历史残差标准差；"
                      "现金流推演基于近 3 月月均净额滚动累加",
            "sparse": sparse, "sparse_hint": "历史有效数据不足 3 个月，预测结果仅供参考" if sparse else "",
            "revenue": rev_fc, "net": net_fc, "cash": cash_fc,
            "safety_months": safety, "budget": _budget_view(ctx, data["period"]),
            "backtest": backtest,
            "history": trend,
            "limitation": "预测基于账套内历史数据外推，未考虑未入账合同、价格调整与宏观经济变化；"
                          "账套历史越短，预测区间越宽，应结合业务判断使用"}


def analyze(conn, period, rules=None):
    """一次调用产出全部分析数据，供在线报告 / 各页面 / 导出共用。"""
    rules = rules or RuleEngine(conn)
    ctx = AccountingContext(conn, period, rules)
    bs, inc = ctx.balance_sheet(), ctx.income()
    art = ctx.articulation()
    cash_open = ctx.cash_opening()
    cf_cur = cashflow_categories(ctx, "current")
    cf_cum = cashflow_categories(ctx, "through")
    ra = ratios_of(ctx)
    ag = aging_of(ctx)
    trend = trend_of(ctx)
    # 同比环比
    def stat(p):
        i = ctx.statement_for(p)
        rev = i["current"][0]["amount"]
        rows = ctx.journal_month(p)
        return {"period": p, "revenue": r2(rev), "expense": r2(rev - i["current"][7]["amount"]),
                "net": r2(i["net_current"]),
                "inflow": r2(sum(x["v"] for x in rows if x["direction"] == "in")),
                "outflow": r2(sum(x["v"] for x in rows if x["direction"] == "out"))}
    prev, last = stat(shift_month(period, -1)), stat(f"{int(period[:4])-1}{period[4:]}")
    cur = stat(period)
    def growth(a, b):
        return round((a - b) / abs(b) * 100, 1) if abs(b or 0) > 0.005 else None
    keys = ("revenue", "expense", "net", "inflow", "outflow")
    # 催收
    groups = {}
    for r in ctx.invoices(aged=True):
        if r["direction"] != "应收":
            continue
        g = groups.setdefault(r["counterparty_name"] or "未指定往来单位",
                              {"counterparty": r["counterparty_name"] or "未指定往来单位",
                               "count": 0, "amount": 0.0, "max_days": 0})
        g["count"] += 1
        g["amount"] += r["total_amount"]
        g["max_days"] = max(g["max_days"], r["days"])
    collection = {"items": sorted(groups.values(), key=lambda x: -x["amount"]),
                  "total": r2(sum(g["amount"] for g in groups.values()))}
    for g in collection["items"]:
        g["amount"] = r2(g["amount"])
    data = {
        "period": period, "company": ctx.company(), "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "rules_version": rules.get("aging.basis"),
        "kpi": {"revenue": inc["cumulative"][0]["amount"], "net_current": inc["net_current"],
                "net_cum": inc["net_cum"], "total_assets": bs["total_assets"],
                "total_liabilities": bs["total_liabilities"], "total_equity": bs["total_equity"],
                "cash": bs["assets"][0]["amount"], "cash_begin": cash_open,
                "cash_end": bs["assets"][0]["amount"], "score": ra["score"]},
        "balance": {"assets": bs["assets"], "liabilities": bs["liabilities"], "equity": bs["equity"],
                    "total_assets": bs["total_assets"], "total_liabilities": bs["total_liabilities"],
                    "total_equity": bs["total_equity"], "balanced": bs["balanced"], "diff": bs["diff"]},
        "income": {"current": inc["current"], "cumulative": inc["cumulative"],
                   "cum_scope": inc["cum_scope"], "year": inc["year"]},
        "cashflow": {"current": cf_cur, "cumulative": cf_cum,
                     "check": abs(cf_cum["net"] - (bs["assets"][0]["amount"] - cash_open)) < 0.005},
        "ratios": ra, "aging": ag, "trend": trend, "collection": collection,
        "compare": {"current": cur, "prev": prev, "last_year": last,
                    "mom": {k: growth(cur[k], prev[k]) for k in keys},
                    "yoy": {k: growth(cur[k], last[k]) for k in keys},
                    "labels": {"revenue": "营业收入", "expense": "成本费用", "net": "净利润",
                               "inflow": "现金流入", "outflow": "现金流出"}},
        "articulation": art,
        "rules_used": {"liquidity": rules.get("liquidity"), "cashflow": rules.get("cashflow"),
                       "ratios": rules.get("ratios"), "aging": rules.get("aging")},
        "lineage": LINEAGE,
    }
    data["conclusions"] = conclusions(ctx, data)
    data["rule_book"] = rule_book(conn, rules)["metrics"]
    data["report"] = build_report_pack(ctx, data)
    data["forecast"] = build_forecast(conn, ctx, data)
    return data


LINEAGE = [
    {"metric": "资产 / 负债 / 权益", "sources": ["opening_balances", "voucher_lines", "vouchers", "subjects"],
     "rule": "科目余额=最近一次期初+全部已过账分录；按 category 归集并重分类"},
    {"metric": "本期 / 累计净利润", "sources": ["voucher_lines", "vouchers", "subjects"],
     "rule": "损益科目按自然年度累计，排除 is_closing 结转凭证；贷方科目为加项"},
    {"metric": "现金流量净额", "sources": ["journal"], "rule": "出纳日记账按对方科目与规则前缀分类"},
    {"metric": "10 项财务比率", "sources": ["资产负债表", "利润表", "subjects"],
     "rule": "按科目前缀划分流动/非流动，阈值来自规则配置"},
    {"metric": "账龄 / 坏账计提", "sources": ["invoices", "counterparties", "subjects 1231"],
     "rule": "账龄基准日可配置；应计提额与 1231 已计提额比较取差额"},
    {"metric": "同比环比", "sources": ["voucher_lines", "journal"],
     "rule": "本期/上月/去年同月利润表 + 12 个月趋势，基期为 0 不计增长率"},
    {"metric": "三大勾稽", "sources": ["全部"], "rule": "资产=负债+权益；账套累计净利=留存收益；现金流=货币资金变动"},
]


def rule_book(conn, rules=None):
    """计算规则说明书：每个指标的公式、数据源、口径、局限，可在线查看"""
    rules = rules or RuleEngine(conn)
    return {"metrics": [
        metric(None, "", "流动资产 ÷ 流动负债", "subjects / voucher_lines", "期末",
               "流动负债为 0 时返回「不适用」，不再用总负债代替", "流动比率"),
        metric(None, "", "货币资金 ÷ 流动负债", "1001+1002 / 20·22·23 类科目", "期末",
               "与流动比率分子不同，独立计算", "现金比率"),
        metric(None, "", "Σ账龄区间应收 × 比例 − 1231 已计提", "invoices / 1231", "所选期间月末",
               "基准日可切换 period_end / today", "坏账准备计提"),
        metric(None, "", "按对方科目前缀最长匹配分三类", "journal / subjects", "本期或累计",
               "未命中科目单列「未分类」并提示", "现金流量分类"),
        metric(None, "", "健康指标数 ÷ 有效指标数 × 100", "10 项比率", "所选期间",
               "权重可在规则配置中调整", "健康度评分"),
        metric(None, "", "分年度汇总净利润 ↔ 留存收益", "voucher_lines / 4103 / 4104", "自建账起",
               "兼容做过/未做过年度结转两种口径", "勾稽②"),
    ], "rules": rules.describe(), "lineage": LINEAGE}
