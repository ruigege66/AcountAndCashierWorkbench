# -*- coding: utf-8 -*-
"""V2.10 税务域：20 项功能。

精度约定（「税务率控制两个点」）：所有税额四舍五入到分（两位小数），
所有税率 / 税负率以百分比两位小数表示与比对；控制阈值同样按两位小数设置。
"""
import json
import re
from datetime import datetime, timedelta

from app.routing import route
from app import facade as _f
from app.errors import ApiError
from .common import q, one, now, today, r2, setting, set_setting, jsetting, log, require

P = "/api/v28/tax"
STAMP_FALLBACK = [{"name": "购销合同", "rate": 0.0003}]


def pct(x):
    return round(float(x or 0) * 100, 2)


def _period_of(qs):
    return (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]


def _vat_rates(conn):
    try:
        rates = json.loads(setting(conn, "vat_rates", ""))
        return [float(x) for x in rates] if rates else [0.13, 0.09, 0.06, 0.05, 0.03, 0.01, 0.0]
    except (ValueError, TypeError):
        return [0.13, 0.09, 0.06, 0.05, 0.03, 0.01, 0.0]


def _infer_groups(conn, kind, period):
    """按发票 税额/不含税额 推断适用税率并分组（匹配误差 ≤0.5%）"""
    rates = _vat_rates(conn)
    groups = {round(c, 4): {"rate": round(c, 4), "count": 0, "ex_tax": 0.0, "tax": 0.0, "items": []}
              for c in rates}
    for r in q(conn, """SELECT i.invoice_no,i.invoice_date,i.amount,i.tax_amount,
               c.name AS cp FROM invoices i LEFT JOIN counterparties c ON c.id=i.counterparty_id
               WHERE i.kind=? AND i.period=?""", (kind, period)):
        ratio = round(float(r["tax_amount"]) / float(r["amount"]), 4) if r["amount"] else 0.0
        hit = min((c for c in rates if abs(c - ratio) <= 0.005), default=0.0)
        g = groups.setdefault(round(hit, 4),
                              {"rate": round(hit, 4), "count": 0, "ex_tax": 0.0, "tax": 0.0, "items": []})
        g["count"] += 1
        g["ex_tax"] += r["amount"]
        g["tax"] += r["tax_amount"]
        g["items"].append(r)
    return [g for g in sorted(groups.values(), key=lambda x: -x["tax"]) if g["count"]]


def _revenue(conn, period):
    """不含税销售收入：取利润表营业收入（与账套口径一致）"""
    try:
        return r2(_f.build_income_statement(conn, period)["current"][0]["amount"])
    except Exception:
        return 0.0


def _vat_calc(conn, period):
    out_groups = _infer_groups(conn, "销项", period)
    in_detail = q(conn, """SELECT i.invoice_no,i.invoice_date,i.amount,i.tax_amount,i.period,
        c.name AS cp,COALESCE(t.cert_status,'待认证') AS cert_status,t.cert_period
        FROM invoices i LEFT JOIN counterparties c ON c.id=i.counterparty_id
        LEFT JOIN tax_input_certs t ON t.invoice_id=i.id
        WHERE i.kind='进项' AND i.period=? ORDER BY i.invoice_date""", (period,))
    certified = r2(sum(x["tax_amount"] for x in in_detail if x["cert_status"] == "已认证"))
    uncertified = r2(sum(x["tax_amount"] for x in in_detail if x["cert_status"] != "已认证"))
    transfer = r2(jsetting(conn, "vat_transfer_" + period, 0))
    payable = r2(max(0.0, sum(g["tax"] for g in out_groups) - certified + transfer))
    credit = r2(max(0.0, certified - sum(g["tax"] for g in out_groups) - transfer))
    sur_rate = (pct(setting(conn, "surtax_city", "0.07")) + pct(setting(conn, "surtax_edu", "0.03"))
                + pct(setting(conn, "surtax_local", "0.02"))) / 100
    rev = _revenue(conn, period)
    return {"period": period,
            "sales_ex_tax": r2(sum(g["ex_tax"] for g in out_groups)),
            "output_tax": r2(sum(g["tax"] for g in out_groups)),
            "output_groups": out_groups,
            "input_certified": certified, "input_uncertified": uncertified,
            "input_detail": in_detail, "input_transfer": transfer,
            "payable": payable, "credit": credit,
            "surtax_total": r2(payable * sur_rate),
            "revenue": rev,
            "vat_ratio": round(payable / rev * 100, 2) if rev else None,
            "taxpayer_type": setting(conn, "taxpayer_type", "general")}


# ---- 1. 税率配置中心（两位小数） ----
@route("GET", P + r"/config")
def tax_config(conn, m, body, qs):
    return {"taxpayer_type": setting(conn, "taxpayer_type", "general"),
            "vat_rates": [pct(x) for x in _vat_rates(conn)],
            "surtax_city": pct(setting(conn, "surtax_city", "0.07")),
            "surtax_edu": pct(setting(conn, "surtax_edu", "0.03")),
            "surtax_local": pct(setting(conn, "surtax_local", "0.02")),
            "cit_rate": pct(setting(conn, "cit_rate", "0.25")),
            "cit_small_tiers": [{"limit": t["limit"], "rate": pct(t["rate"])}
                                for t in jsetting(conn, "cit_small_tiers", [])],
            "tax_ratio_low": round(float(setting(conn, "tax_ratio_low", "2.00") or 0), 2),
            "tax_ratio_high": round(float(setting(conn, "tax_ratio_high", "3.50") or 0), 2),
            "social_employer": {k: pct(v) for k, v in jsetting(conn, "social_employer", {}).items()},
            "social_employee": {k: pct(v) for k, v in jsetting(conn, "social_employee", {}).items()},
            "housing_fund_rate": pct(setting(conn, "housing_fund_rate", "0.12")),
            "stamp_taxes": jsetting(conn, "stamp_taxes", []),
            "precision": "税额保留两位小数（分）；税率与税负率以百分比两位小数表示"}


@route("POST", P + r"/config")
def tax_config_set(conn, m, body, qs):
    for k in ("taxpayer_type", "surtax_city", "surtax_edu", "surtax_local", "cit_rate",
              "tax_ratio_low", "tax_ratio_high", "housing_fund_rate"):
        if k in body:
            v = body[k]
            if k != "taxpayer_type":
                require(float(v) >= 0, f"{k} 不能为负")
            set_setting(conn, k, str(v))
    for k in ("cit_small_tiers", "stamp_taxes", "social_employer", "social_employee"):
        if k in body:
            set_setting(conn, k, json.dumps(body[k], ensure_ascii=False))
    if "vat_rates" in body:
        rates = sorted({round(float(x), 4) for x in body["vat_rates"]}, reverse=True)
        require(all(0 <= x <= 1 for x in rates), "增值税率须在 0~1 之间")
        set_setting(conn, "vat_rates", json.dumps(rates))
    require(float(setting(conn, "tax_ratio_low", "0")) <= float(setting(conn, "tax_ratio_high", "100")),
            "税负率下限不能大于上限")
    log(conn, "修改税务配置", "setting", "tax", json.dumps(body, ensure_ascii=False)[:200],
        body.get("actor") or "会计")
    return {"ok": True, "config": tax_config(conn, None, {}, {}),
            "hint": "所有税额按两位小数（分）计算，税率与税负率按百分比两位小数显示"}


# ---- 2. 征期日历 ----
@route("GET", P + r"/calendar")
def tax_calendar(conn, m, body, qs):
    def deadline(y, mo):
        d = datetime(y, mo, 15)
        while d.weekday() >= 5:
            d += timedelta(days=1)
        return d.isoformat()
    base = datetime.now()
    nxt = base + timedelta(days=32)
    items = []
    for y, mo in ((base.year, base.month), (nxt.year, nxt.month)):
        dl = deadline(y, mo)
        if mo in (1, 4, 7, 10):
            items.append({"period": f"{y}-{mo:02d}", "tax": "企业所得税（季度预缴）", "deadline": dl})
        items += [{"period": f"{y}-{mo:02d}", "tax": t, "deadline": dl}
                  for t in ("增值税及附加", "个人所得税（代扣代缴）", "印花税（按次申报）")]
    return {"items": items, "today": today(),
            "hint": "截止日按每月 15 日、遇周末顺延下一工作日；法定节假日顺延以税务机关公告为准"}


# ---- 3. 销项税额台账 ----
@route("GET", P + r"/output-ledger")
def output_ledger(conn, m, body, qs):
    period = _period_of(qs)
    groups = _infer_groups(conn, "销项", period)
    for g in groups:
        g["ex_tax"], g["tax"] = r2(g["ex_tax"]), r2(g["tax"])
        g["rate_pct"] = pct(g["rate"])
    return {"period": period, "items": groups,
            "ex_total": r2(sum(g["ex_tax"] for g in groups)),
            "tax_total": r2(sum(g["tax"] for g in groups))}


# ---- 4. 进项税额台账（含认证状态） ----
@route("GET", P + r"/input-ledger")
def input_ledger(conn, m, body, qs):
    period = _period_of(qs)
    c = _vat_calc(conn, period)
    groups = [dict(g, ex_tax=r2(g["ex_tax"]), tax=r2(g["tax"]), rate_pct=pct(g["rate"]))
              for g in c["output_groups"] and _infer_groups(conn, "进项", period)]
    return {"period": period, "groups": groups, "detail": c["input_detail"],
            "certified_tax": c["input_certified"], "uncertified_tax": c["input_uncertified"],
            "hint": "仅「已认证」进项可抵扣；用进项认证接口批量更新状态"}


# ---- 5. 进项认证状态 ----
@route("POST", P + r"/input-certs")
def input_certs(conn, m, body, qs):
    st = body.get("cert_status") or "已认证"
    require(st in ("待认证", "已认证", "不得抵扣"), "认证状态不合法")
    period = body.get("cert_period") or _period_of(qs)
    nos = re.findall(r"[\w\-]+", str(body.get("invoice_nos") or ""))
    require(nos, "请提供发票号")
    n = 0
    for no in nos:
        inv = one(conn, "SELECT id FROM invoices WHERE invoice_no=?", (no,))
        require(inv, f"发票 {no} 不存在")
        conn.execute("""INSERT INTO tax_input_certs(invoice_id,cert_status,cert_period,created_at)
                        VALUES(?,?,?,?) ON CONFLICT(invoice_id) DO UPDATE SET
                        cert_status=excluded.cert_status,cert_period=excluded.cert_period""",
                     (inv["id"], st, period, now()))
        n += 1
    log(conn, "更新进项认证状态", "tax_input_certs", None, f"{st} {n} 张", body.get("actor") or "会计")
    return {"ok": True, "updated": n, "cert_status": st}


# ---- 6/7. 增值税申报测算与记录 ----
@route("GET", P + r"/filing")
def vat_filing_get(conn, m, body, qs):
    period = _period_of(qs)
    return {**_vat_calc(conn, period), "saved": one(conn, "SELECT * FROM tax_filings WHERE period=?", (period,))}


@route("POST", P + r"/filing")
def vat_filing_save(conn, m, body, qs):
    period = body.get("period") or _period_of(qs)
    c = _vat_calc(conn, period)
    conn.execute("""INSERT INTO tax_filings(period,taxpayer_type,sales_ex_tax,output_tax,input_tax,
        input_transfer,payable,surtax_total,paid,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(period) DO UPDATE SET taxpayer_type=excluded.taxpayer_type,
        sales_ex_tax=excluded.sales_ex_tax,output_tax=excluded.output_tax,input_tax=excluded.input_tax,
        input_transfer=excluded.input_transfer,payable=excluded.payable,
        surtax_total=excluded.surtax_total,paid=excluded.paid,status=excluded.status""",
        (period, c["taxpayer_type"], c["sales_ex_tax"], c["output_tax"], c["input_certified"],
         c["input_transfer"], c["payable"], c["surtax_total"], float(body.get("paid") or 0),
         body.get("status") or "draft", now()))
    log(conn, "保存增值税申报测算", "tax_filing", period,
        f"应纳 ¥{c['payable']:,.2f} 附加 ¥{c['surtax_total']:,.2f} 税负率 {c['vat_ratio']}%",
        body.get("actor") or "会计")
    return {"ok": True, "calc": c, "paid": r2(body.get("paid")),
            "impacts": {"count": 2, "label": "增值税申报测算",
                        "affects": [{"id": "tax_ratios", "label": "税负率分析", "effect": "应纳税额与税负率更新"},
                                    {"id": "funds", "label": "资金预测", "effect": "税款支出纳入资金安排"}]}}


@route("GET", P + r"/filings")
def vat_filing_list(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM tax_filings ORDER BY period DESC LIMIT 60")}


# ---- 8. 附加税费 ----
@route("GET", P + r"/surtaxes")
def surtaxes(conn, m, body, qs):
    period = _period_of(qs)
    c = _vat_calc(conn, period)
    items = [{"name": n, "rate": pct(setting(conn, k, d)), "amount": r2(c["payable"] * float(setting(conn, k, d) or 0))}
             for n, k, d in (("城市维护建设税", "surtax_city", "0.07"),
                             ("教育费附加", "surtax_edu", "0.03"),
                             ("地方教育附加", "surtax_local", "0.02"))]
    return {"period": period, "base": c["payable"], "items": items,
            "total": r2(sum(x["amount"] for x in items)),
            "hint": "计税依据为当期应纳增值税额；小规模纳税人减半等优惠请按政策自行核对"}


# ---- 9/10/11. 税负率分析与两点控制 ----
@route("GET", P + r"/ratios")
def tax_ratios(conn, m, body, qs):
    months = min(int((qs.get("months") or ["12"])[0] or 12), 24)
    cur = _period_of(qs)
    low = round(float(setting(conn, "tax_ratio_low", "2.00") or 0), 2)
    high = round(float(setting(conn, "tax_ratio_high", "3.50") or 0), 2)
    out = []
    for i in range(months - 1, -1, -1):
        y, mo = int(cur[:4]), int(cur[5:7])
        t = y * 12 + mo - 1 - i
        p = f"{t // 12:04d}-{t % 12 + 1:02d}"
        f = one(conn, "SELECT * FROM tax_filings WHERE period=?", (p,))
        payable = f["payable"] if f else _vat_calc(conn, p)["payable"]
        rev = _revenue(conn, p)  # 分母统一用会计收入口径（利润表营业收入）
        cit = r2(one(conn, """SELECT COALESCE(SUM(l.credit-l.debit),0) v FROM voucher_lines l
            JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period=?
            LEFT JOIN subjects s ON s.code=l.subject_code WHERE s.code='6801'""", (p,))["v"])
        x = {"period": p, "revenue": rev, "vat_payable": r2(payable),
             "vat_ratio": round(payable / rev * 100, 2) if rev else None,
             "cit_ratio": round(cit / rev * 100, 2) if rev and cit else None,
             "total_ratio": round((payable + cit) / rev * 100, 2) if rev else None}
        x["flag"] = ("偏低" if x["vat_ratio"] is not None and x["vat_ratio"] < low else
                     "偏高" if x["vat_ratio"] is not None and x["vat_ratio"] > high else
                     "区间内" if x["vat_ratio"] is not None else "—")
        out.append(x)
    return {"items": out, "target": {"low": low, "high": high, "precision": "两位小数"}}


@route("GET", P + r"/ratio-targets")
def ratio_targets_get(conn, m, body, qs):
    return {"low": round(float(setting(conn, "tax_ratio_low", "2.00") or 0), 2),
            "high": round(float(setting(conn, "tax_ratio_high", "3.50") or 0), 2)}


@route("POST", P + r"/ratio-targets")
def ratio_targets_set(conn, m, body, qs):
    low = round(float(body.get("low") or 0), 2)
    high = round(float(body.get("high") or 0), 2)
    require(0 <= low <= high <= 100, "税负率区间须满足 0 ≤ 下限 ≤ 上限 ≤ 100（两位小数）")
    set_setting(conn, "tax_ratio_low", f"{low:.2f}")
    set_setting(conn, "tax_ratio_high", f"{high:.2f}")
    log(conn, "设置税负率控制区间", "setting", "tax_ratio", f"{low:.2f}% ~ {high:.2f}%",
        body.get("actor") or "会计")
    return {"ok": True, "low": low, "high": high,
            "hint": "增值税税负率低于下限提示少缴风险，高于上限提示多缴；全部按两位小数比对"}


@route("GET", P + r"/ratio-alerts")
def ratio_alerts(conn, m, body, qs):
    r = tax_ratios(conn, None, {}, {"months": ["12"]})
    return {"target": r["target"], "alerts": [x for x in r["items"] if x["flag"] in ("偏低", "偏高")],
            "normal_count": sum(1 for x in r["items"] if x["flag"] == "区间内")}


# ---- 12. 企业所得税季度预缴 ----
@route("POST", P + r"/cit-quarterly")
def cit_quarterly(conn, m, body, qs):
    period = body.get("period") or _period_of(qs)
    y, mo = int(period[:4]), int(period[5:7])
    require(mo % 3 == 0, "预缴测算应在季度末月（3/6/9/12 月）执行")
    cum_rev = r2(one(conn, """SELECT COALESCE(SUM(l.credit-l.debit),0) v FROM voucher_lines l
        JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period LIKE ?
        LEFT JOIN subjects s ON s.code=l.subject_code WHERE s.code IN ('6001','6051')""", (str(y) + "%",))["v"])
    profit = r2(-one(conn, """SELECT COALESCE(SUM(s.v),0) v FROM (
        SELECT SUM(l.debit-l.credit) v FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id
        AND v.status='posted' AND v.period LIKE ? LEFT JOIN subjects s ON s.code=l.subject_code
        WHERE s.category='损益' AND COALESCE(v.is_closing,0)=0 GROUP BY l.subject_code) s""",
        (str(y) + "%",))["v"])
    tiers = sorted(jsetting(conn, "cit_small_tiers", []),
                   key=lambda t: t["limit"] if t["limit"] else 10 ** 12)
    rate, small = float(setting(conn, "cit_rate", "0.25") or 0.25), False
    for t in tiers:
        if not t["limit"] or profit <= t["limit"]:
            rate, small = float(t["rate"]), True
            break
    tax = r2(max(0.0, profit) * rate)
    prepaid = r2(one(conn, "SELECT COALESCE(SUM(paid),0) v FROM tax_filings WHERE period LIKE ? AND period<?",
                     (str(y) + "%", period))["v"])
    return {"period": period, "cum_revenue": cum_rev, "cum_profit": profit, "small_micro": small,
            "rate": pct(rate), "tax_payable": tax, "previously_paid": prepaid,
            "current_due": r2(max(0.0, tax - prepaid)),
            "hint": "小微优惠分段与税率均可在税率配置中心调整；测算结果以主管税务机关核定为准"}


# ---- 13. 汇算清缴纳税调整项 ----
@route("GET", P + r"/adjustments")
def adjustments_list(conn, m, body, qs):
    year = (qs.get("year") or [datetime.now().strftime("%Y")])[0]
    rows = q(conn, "SELECT * FROM tax_adjustments WHERE period LIKE ? ORDER BY id DESC", (year + "%",))
    return {"year": year, "items": rows, "total": r2(sum(x["amount"] for x in rows))}


@route("POST", P + r"/adjustments")
def adjustments_add(conn, m, body, qs):
    kind = body.get("kind") or ""
    require(kind, "调整项目不能为空")
    conn.execute("""INSERT INTO tax_adjustments(period,kind,amount,note,actor,created_at)
                    VALUES(?,?,?,?,?,?)""",
                 (body.get("period") or datetime.now().strftime("%Y"), kind,
                  float(body.get("amount") or 0), body.get("note") or "",
                  body.get("actor") or "会计", now()))
    return {"ok": True, "hint": "业务招待费可用「招待费限额」接口自动计算可扣除金额"}


@route("POST", P + r"/adjustments/entertainment")
def entertainment_limit(conn, m, body, qs):
    year = body.get("year") or datetime.now().strftime("%Y")
    spent = float(body.get("amount") or 0)
    require(spent >= 0, "金额不能为负")
    rev = r2(one(conn, """SELECT COALESCE(SUM(l.credit-l.debit),0) v FROM voucher_lines l
        JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period LIKE ?
        LEFT JOIN subjects s ON s.code=l.subject_code WHERE s.code IN ('6001','6051')""", (year + "%",))["v"])
    cap1, cap2 = r2(spent * 0.6), r2(rev * 0.005)
    return {"year": year, "spent": spent, "limit_60pct": cap1, "limit_05pct_revenue": cap2,
            "deductible": min(cap1, cap2), "add_back": r2(spent - min(cap1, cap2)),
            "rule": "业务招待费按发生额 60% 扣除，且不得超过当年营业收入的 0.5%"}


# ---- 14. 汇算清缴测算 ----
@route("GET", P + r"/cit-annual")
def cit_annual(conn, m, body, qs):
    year = (qs.get("year") or [datetime.now().strftime("%Y")])[0]
    profit = r2(-one(conn, """SELECT COALESCE(SUM(s.v),0) v FROM (
        SELECT SUM(l.debit-l.credit) v FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id
        AND v.status='posted' AND v.period LIKE ? LEFT JOIN subjects s ON s.code=l.subject_code
        WHERE s.category='损益' AND COALESCE(v.is_closing,0)=0 GROUP BY l.subject_code) s""",
        (year + "%",))["v"])
    adj = r2(sum(x["amount"] for x in
                 q(conn, "SELECT * FROM tax_adjustments WHERE period LIKE ?", (year + "%",))))
    taxable = r2(max(0.0, profit + adj))
    tiers = sorted(jsetting(conn, "cit_small_tiers", []),
                   key=lambda t: t["limit"] if t["limit"] else 10 ** 12)
    rate = float(setting(conn, "cit_rate", "0.25") or 0.25)
    for t in tiers:
        if not t["limit"] or taxable <= t["limit"]:
            rate = float(t["rate"])
            break
    tax = r2(taxable * rate)
    prepaid = r2(one(conn, "SELECT COALESCE(SUM(paid),0) v FROM tax_filings WHERE period LIKE ?",
                     (year + "%",))["v"])
    return {"year": year, "accounting_profit": profit, "adjustments": adj, "taxable_income": taxable,
            "rate": pct(rate), "tax_payable": tax, "prepaid": prepaid, "settlement": r2(tax - prepaid),
            "hint": "汇算清缴于次年 5 月 31 日前完成；调整项请在「纳税调整项」登记"}


# ---- 15. 分红个税 ----
@route("POST", P + r"/dividend")
def dividend_tax(conn, m, body, qs):
    amount = float(body.get("amount") or 0)
    require(amount > 0, "分红金额须大于 0")
    return {"amount": amount, "rate": "20.00%", "tax": r2(amount * 0.2), "net": r2(amount * 0.8),
            "rule": "个人股东股息红利所得按 20% 代扣代缴个人所得税"}


# ---- 16. 员工管理 ----
@route("GET", P + r"/employees")
def emp_list(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM employees ORDER BY id DESC LIMIT 200")}


@route("POST", P + r"/employees")
def emp_add(conn, m, body, qs):
    name = (body.get("name") or "").strip()
    require(name, "姓名不能为空")
    try:
        cur = conn.execute("""INSERT INTO employees(name,dept,base_salary,hire_date,enabled,created_at)
                              VALUES(?,?,?,?,1,?)""",
                           (name, body.get("dept") or "", float(body.get("base_salary") or 0),
                            body.get("hire_date") or today(), now()))
    except Exception:
        raise ApiError("员工已存在")
    return {"ok": True, "id": cur.lastrowid, "name": name}


# ---- 17. 专项附加扣除 ----
@route("GET", P + r"/special-deductions")
def special_get(conn, m, body, qs):
    return {"items": q(conn, """SELECT d.*,e.name FROM special_deductions d
        LEFT JOIN employees e ON e.id=d.employee_id ORDER BY e.name"""),
        "monthly_limits": {"children_amount": 2000.0, "housing_loan": 1000.0, "rent": 1500.0,
                           "education": 400.0, "elderly_amount": 3000.0},
        "hint": "子女教育 2000 元/月/孩、赡养老人 3000 元/月（分摊）、房贷利息 1000 元/月、租房 1500 元/月、继续教育 400 元/月；房贷与租房不可同时享受"}


@route("POST", P + r"/special-deductions")
def special_set(conn, m, body, qs):
    eid = int(body.get("employee_id") or 0)
    require(one(conn, "SELECT id FROM employees WHERE id=?", (eid,)), "员工不存在")
    conn.execute("""INSERT INTO special_deductions(employee_id,children_count,children_amount,
        elderly_amount,housing_loan,rent,education,medical,other,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(employee_id) DO UPDATE SET
        children_count=excluded.children_count,children_amount=excluded.children_amount,
        elderly_amount=excluded.elderly_amount,housing_loan=excluded.housing_loan,
        rent=excluded.rent,education=excluded.education,medical=excluded.medical,
        other=excluded.other,updated_at=excluded.updated_at""",
        (eid, int(body.get("children_count") or 0), float(body.get("children_amount") or 0),
         float(body.get("elderly_amount") or 0), float(body.get("housing_loan") or 0),
         float(body.get("rent") or 0), float(body.get("education") or 0),
         float(body.get("medical") or 0), float(body.get("other") or 0), now()))
    return {"ok": True, "employee_id": eid}


# ---- 18. 工资计算（社保公积金 + 个税累计预扣，两位小数） ----
@route("POST", P + r"/payroll/run")
def payroll_run(conn, m, body, qs):
    period = body.get("period") or _period_of(qs)
    rates_e = jsetting(conn, "social_employee", {})
    fund = float(setting(conn, "housing_fund_rate", "0.12") or 0)
    itable = jsetting(conn, "individual_tax_table", [])
    require(itable, "请先在税率配置中心设置个税预扣率表")
    y = period[:4]
    months_paid = 1 + one(conn, """SELECT COUNT(DISTINCT r.period) v FROM payroll_runs r
        JOIN payroll_lines l ON l.run_id=r.id WHERE r.period LIKE ? AND r.period<?""",
        (y + "%", period))["v"]  # 本年已发薪月数（含本月），累计预扣按此计算
    runs, lines = [], []
    for e in q(conn, "SELECT * FROM employees WHERE enabled=1 ORDER BY id"):
        gross = r2(e["base_salary"])
        social_personal = r2(sum(gross * float(v) for v in rates_e.values()))
        fund_personal = r2(gross * fund)
        d = one(conn, "SELECT * FROM special_deductions WHERE employee_id=?", (e["id"],)) or {}
        special = r2(sum(float(d.get(k) or 0) for k in
                         ("children_amount", "elderly_amount", "housing_loan", "rent",
                          "education", "medical", "other")))
        prev_tax = r2(one(conn, """SELECT COALESCE(SUM(l.tax),0) v FROM payroll_lines l
            JOIN payroll_runs r ON r.id=l.run_id WHERE l.employee_id=? AND r.period<? AND r.period LIKE ?""",
            (e["id"], period, str(y) + "%"))["v"])
        cum_gross = r2(one(conn, """SELECT COALESCE(SUM(l.gross),0) v FROM payroll_lines l
            JOIN payroll_runs r ON r.id=l.run_id WHERE l.employee_id=? AND r.period<? AND r.period LIKE ?""",
            (e["id"], period, str(y) + "%"))["v"]) + gross
        cum_deduct = r2(one(conn, """SELECT COALESCE(SUM(l.social_personal+l.fund_personal),0) v FROM payroll_lines l
            JOIN payroll_runs r ON r.id=l.run_id WHERE l.employee_id=? AND r.period<? AND r.period LIKE ?""",
            (e["id"], period, str(y) + "%"))["v"]) + social_personal + fund_personal
        taxable_cum = r2(max(0.0, cum_gross - 5000.0 * months_paid - cum_deduct - special * months_paid))
        bracket = next((t for t in sorted(itable, key=lambda t: t["limit"] if t["limit"] else 10 ** 12)
                        if not t["limit"] or taxable_cum <= t["limit"]), {"rate": 0.0, "quick": 0})
        tax_cum = r2(max(0.0, taxable_cum * float(bracket["rate"]) - float(bracket["quick"])))
        tax = r2(max(0.0, tax_cum - prev_tax))
        net = r2(gross - social_personal - fund_personal - tax)
        runs.append({"name": e["name"], "gross": gross, "social_personal": social_personal,
                     "fund_personal": fund_personal, "special": special, "tax": tax, "net": net,
                     "taxable_cum": taxable_cum, "rate": pct(bracket["rate"])})
        lines.append((e["id"], gross, social_personal, fund_personal, special, tax, net, taxable_cum))
    total_gross, total_tax = r2(sum(x["gross"] for x in runs)), r2(sum(x["tax"] for x in runs))
    existing = one(conn, "SELECT id FROM payroll_runs WHERE period=?", (period,))
    if existing and not body.get("overwrite"):
        raise ApiError(f"{period} 工资已计算，如需重算请传 overwrite=true")
    if existing:
        conn.execute("DELETE FROM payroll_lines WHERE run_id=?", (existing["id"],))
        rid = existing["id"]
    else:
        rid = conn.execute("""INSERT INTO payroll_runs(period,total_gross,total_tax,total_net,status,created_at)
                              VALUES(?,?,?,?,?,?)""",
                           (period, total_gross, total_tax, r2(sum(x["net"] for x in runs)), "draft", now())).lastrowid
    for (eid, gross, sp, fp, spc, tax, net, tcum) in lines:
        conn.execute("""INSERT INTO payroll_lines(run_id,employee_id,gross,social_personal,fund_personal,
            special_total,tax,net,taxable_cum) VALUES(?,?,?,?,?,?,?,?,?)""",
                     (rid, eid, gross, sp, fp, spc, tax, net, tcum))
    log(conn, "计算工资个税", "payroll", rid, f"{period} {len(runs)} 人，代扣个税 ¥{total_tax:,.2f}",
        body.get("actor") or "会计")
    return {"ok": True, "run_id": rid, "period": period, "items": runs,
            "total_gross": total_gross, "total_tax": total_tax,
            "total_net": r2(sum(x["net"] for x in runs)),
            "hint": "个税按累计预扣法：累计收入−5000×月数−累计专项扣除−累计专项附加扣除，全部保留两位小数"}


@route("GET", P + r"/payroll")
def payroll_list(conn, m, body, qs):
    runs = q(conn, "SELECT * FROM payroll_runs ORDER BY period DESC LIMIT 24")
    for r in runs:
        r["lines"] = q(conn, """SELECT l.*,e.name,e.dept FROM payroll_lines l
            LEFT JOIN employees e ON e.id=l.employee_id WHERE l.run_id=? ORDER BY e.name""", (r["id"],))
    return {"items": runs}


# ---- 19. 印花税计算器 ----
@route("POST", P + r"/stamp")
def stamp_calc(conn, m, body, qs):
    amount = float(body.get("amount") or 0)
    name = body.get("name") or ""
    table = jsetting(conn, "stamp_taxes", [])
    require(amount > 0, "金额须大于 0")
    item = next((t for t in table if t["name"] == name), None)
    require(item, "未知税目；可用税目：" + "、".join(t["name"] for t in table))
    tax = r2(max(0.01, amount * float(item["rate"])))
    return {"name": name, "amount": amount, "rate": f"{float(item['rate']) * 100:.4f}%", "tax": tax,
            "hint": "印花税税额不足 1 分按 1 分贴花；税目表可在税率配置中心调整"}


# ---- 20. 税务申报工作台 ----
@route("GET", P + r"/dashboard")
def tax_dashboard(conn, m, body, qs):
    period = _period_of(qs)
    c = _vat_calc(conn, period)
    cal = tax_calendar(conn, None, {}, {})
    ratios = tax_ratios(conn, None, {}, {"months": ["3"]})
    cit = cit_quarterly(conn, None, {"period": period}, {}) if int(period[5:7]) % 3 == 0 else None
    return {"period": period, "vat": {k: c[k] for k in
            ("sales_ex_tax", "output_tax", "input_certified", "input_transfer", "payable", "vat_ratio")},
            "surtax_total": c["surtax_total"], "ratio_target": ratios["target"],
            "ratio_now": (ratios["items"] or [{}])[-1], "calendar": cal["items"][:4],
            "cit_quarterly": cit,
            "payroll_tax": r2(one(conn, "SELECT COALESCE(SUM(total_tax),0) v FROM payroll_runs WHERE period=?",
                                  (period,))["v"]),
            "hint": "汇总本月主要税种测算与征期倒计时；各台账与过程数据见对应明细接口"}
