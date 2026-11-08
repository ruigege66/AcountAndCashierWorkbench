# -*- coding: utf-8 -*-
"""V2.13 宏观经济会计域：宏观指标库、通胀调整、行业对标、情景压力测试、汇率重估、联动看板。"""
from datetime import datetime

from app.routing import route
from app.errors import ApiError
from .common import q, one, now, today, r2, log, require, setting, jsetting

P = "/api/v28/macro"


def _income(conn, year):
    return r2(one(conn, """SELECT COALESCE(SUM(l.credit-l.debit),0) v FROM voucher_lines l
        JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND substr(v.period,1,4)=?
        LEFT JOIN subjects s ON s.code=l.subject_code WHERE s.code IN ('6001','6051')""", (str(year),))["v"])


def _profit(conn, year):
    return r2(-one(conn, """SELECT COALESCE(SUM(t.v),0) v FROM (
        SELECT SUM(l.debit-l.credit) v FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id
        AND v.status='posted' AND substr(v.period,1,4)=? LEFT JOIN subjects s ON s.code=l.subject_code
        WHERE s.category='损益' AND COALESCE(v.is_closing,0)=0 GROUP BY l.subject_code) t""", (str(year),))["v"])


# ---- 1. 宏观指标库 ----
@route("GET", P + r"/indicators")
def ind_list(conn, m, body, qs):
    name = (qs.get("name") or [""])[0]
    rows = q(conn, "SELECT * FROM macro_indicators " + ("WHERE name=? " if name else "") +
             "ORDER BY period DESC,name LIMIT 200", (name,) if name else ())
    return {"items": rows, "names": [r["name"] for r in
            q(conn, "SELECT DISTINCT name FROM macro_indicators ORDER BY name")]}


@route("POST", P + r"/indicators")
def ind_add(conn, m, body, qs):
    name, period = (body.get("name") or "").strip(), (body.get("period") or today()[:7])
    require(name, "指标名称不能为空")
    conn.execute("""INSERT INTO macro_indicators(period,name,value,unit,source,created_at)
        VALUES(?,?,?,?,?,?) ON CONFLICT(period,name) DO UPDATE SET value=excluded.value,
        unit=excluded.unit,source=excluded.source""",
        (period, name, float(body.get("value") or 0), body.get("unit") or "%", body.get("source") or "手工录入", now()))
    return {"ok": True, "period": period, "name": name}


# ---- 2. 通胀调整（不变价）报表 ----
@route("GET", P + r"/inflation-adjusted")
def inflation_adjusted(conn, m, body, qs):
    base = (qs.get("base_year") or ["2026"])[0]
    rates = {r["period"]: float(r["value"]) for r in
             q(conn, "SELECT period,value FROM macro_indicators WHERE name='CPI'")}
    year = int(base)
    items = []
    for back in range(3, -1, -1):
        y = year - back
        rev = _income(conn, y)
        profit = _profit(conn, y)
        # 累计 CPI 折算：无 CPI 数据时按 2.5% 默认年通胀并可配置
        factor = 1.0
        for yy in range(y, year):
            cpi = next((v for k, v in rates.items() if k.startswith(str(yy))), 2.5)
            factor *= (1 + cpi / 100)
        items.append({"年度": y, "账面收入": rev, "不变价收入": r2(rev * factor),
                      "账面利润": profit, "不变价利润": r2(profit * factor),
                      "折算系数": round(factor, 4), "采用CPI": "库内值/默认2.5%"})
    return {"base_year": base, "items": items,
            "note": "以 CPI 逐年复利折算到基准年不变价；CPI 缺值按 2.5% 年通胀估计，可在指标库录入实际值"}


# ---- 3. 行业对标 ----
@route("GET", P + r"/benchmarks")
def bench_list(conn, m, body, qs):
    year = (qs.get("year") or [today()[:4]])[0]
    rows = q(conn, "SELECT * FROM industry_benchmarks WHERE year=? ORDER BY industry", (year,))
    rev = _income(conn, year)
    profit = _profit(conn, year)
    company = {"行业": "本公司", "年度": year, "gross_margin": None,
               "net_margin": round(profit / rev * 100, 2) if rev else None,
               "debt_ratio": None, "asset_turnover": None}
    try:
        from app import facade
        bs = facade.build_balance_sheet(conn, year + "-12")
        company["debt_ratio"] = round(bs["total_liabilities"] / bs["total_assets"] * 100, 2) if bs["total_assets"] else None
    except Exception:
        pass
    return {"company": company, "items": rows, "year": year,
            "note": "毛利率/周转率需成本与资产明细，未接入时留空"}


@route("POST", P + r"/benchmarks")
def bench_add(conn, m, body, qs):
    industry, year = (body.get("industry") or "").strip(), body.get("year") or today()[:4]
    require(industry, "行业名称不能为空")
    conn.execute("""INSERT INTO industry_benchmarks(industry,year,gross_margin,debt_ratio,
        asset_turnover,net_margin,created_at) VALUES(?,?,?,?,?,?,?)
        ON CONFLICT(industry,year) DO UPDATE SET gross_margin=excluded.gross_margin,
        debt_ratio=excluded.debt_ratio,asset_turnover=excluded.asset_turnover,net_margin=excluded.net_margin""",
        (industry, year, float(body.get("gross_margin") or 0), float(body.get("debt_ratio") or 0),
         float(body.get("asset_turnover") or 0), float(body.get("net_margin") or 0), now()))
    return {"ok": True, "industry": industry, "year": year}


# ---- 4. 宏观情景压力测试 ----
@route("GET", P + r"/scenarios")
def scenario_list(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM macro_scenarios ORDER BY id")}


@route("GET", P + r"/stress-test")
def stress_test(conn, m, body, qs):
    year = (qs.get("year") or [today()[:4]])[0]
    rev, profit = _income(conn, year), _profit(conn, year)
    cost = rev - profit
    out = []
    for s in q(conn, "SELECT * FROM macro_scenarios ORDER BY id"):
        new_rev = rev * (1 + float(s["revenue_delta"]))
        new_cost = cost * (1 + float(s["cost_delta"]))
        new_profit = new_rev - new_cost
        fin_cost = -float(s["rate_delta_bp"]) / 10000 * (rev * 0.3)  # 假设 30% 收入对应有息敞口
        fx_effect = float(s["fx_delta"]) * (rev * 0.05)               # 假设 5% 外币敞口
        total = new_profit + fin_cost + fx_effect
        out.append({"情景": s["name"], "收入": r2(new_rev), "成本": r2(new_cost),
                    "基准利润": r2(profit), "情景利润": r2(new_profit),
                    "利率影响": r2(fin_cost), "汇率影响": r2(fx_effect),
                    "最终利润": r2(total), "利润变动": r2(total - profit),
                    "变动幅度": round((total - profit) / abs(profit) * 100, 2) if profit else None})
    return {"year": year, "items": out, "assumptions": "利率敞口按收入30%、外币敞口按收入5%估算，可在情景表调整增量",
            "note": "敏感性测算为管理分析，不构成预算或盈利预测"}


@route("POST", P + r"/scenarios")
def scenario_save(conn, m, body, qs):
    name = (body.get("name") or "").strip()
    require(name, "情景名称不能为空")
    conn.execute("""INSERT INTO macro_scenarios(name,revenue_delta,cost_delta,rate_delta_bp,fx_delta,note,created_at)
        VALUES(?,?,?,?,?,?,?) ON CONFLICT(name) DO UPDATE SET revenue_delta=excluded.revenue_delta,
        cost_delta=excluded.cost_delta,rate_delta_bp=excluded.rate_delta_bp,fx_delta=excluded.fx_delta""",
        (name, float(body.get("revenue_delta") or 0), float(body.get("cost_delta") or 0),
         float(body.get("rate_delta_bp") or 0), float(body.get("fx_delta") or 0), body.get("note") or "", now()))
    return {"ok": True, "name": name}


# ---- 5. 汇率重估 ----
@route("POST", P + r"/fx-revaluation")
def fx_revaluation(conn, m, body, qs):
    exposure = float(body.get("exposure") or 0)
    old, new = float(body.get("old_rate") or 7.1), float(body.get("new_rate") or 7.2)
    require(exposure > 0 and old > 0 and new > 0, "外币敞口与汇率须大于 0")
    gain = r2(exposure * (new - old))
    conn.execute("""INSERT INTO macro_indicators(period,name,value,unit,source,created_at)
        VALUES(?,?,?,?,?,?) ON CONFLICT(period,name) DO UPDATE SET value=excluded.value""",
        (body.get("period") or today()[:7], "期末汇率", new, "CNY/外币", "手工录入", now()))
    log(conn, "外币敞口重估", "macro", None, f"敞口 {exposure:,.2f} 汇兑损益 ¥{gain:,.2f}", body.get("actor") or "财务")
    return {"exposure": exposure, "old_rate": old, "new_rate": new,
            "汇兑损益": gain, "方向": "收益" if gain >= 0 else "损失",
            "分录建议": "借：银行存款（外币） / 贷：财务费用—汇兑损益" if gain >= 0
                       else "借：财务费用—汇兑损益 / 贷：银行存款（外币）"}


# ---- 6. 宏观联动看板 ----
@route("GET", P + r"/dashboard")
def macro_dashboard(conn, m, body, qs):
    year = today()[:4]
    rev, profit = _income(conn, year), _profit(conn, year)
    ind = ind_list(conn, None, {}, {})
    stress = stress_test(conn, None, {}, {"year": [year]})
    bench = bench_list(conn, None, {}, {})
    return {"年度": year, "营业收入": rev, "净利润": profit,
            "净利率": round(profit / rev * 100, 2) if rev else None,
            "已录入宏观指标": len(ind["items"]), "指标种类": len(ind["names"]),
            "行业对标条目": len(bench["items"]),
            "情景数": len(stress["items"]),
            "悲观情景利润": next((x["最终利润"] for x in stress["items"] if x["情景"] == "悲观情景"), None),
            "弹性提示": "收入每变动 1%，利润约变动 " + (f"{r2(rev * 0.01):,.2f}" if rev else "—") + " 元（成本刚性假设）"}
