# -*- coding: utf-8 -*-
"""V2.13 金融监管会计域：监管报送、反洗钱、关联交易、监管指标、ECL 拨备、报送导出。"""
import csv
import io
from datetime import datetime

from app.routing import route
from app.errors import ApiError
from .common import q, one, now, today, r2, log, require, setting, set_setting

P = "/api/v28/reg"
LARGE_TXN = 500000.0


def _days(d):
    try:
        return (datetime.strptime(d, "%Y-%m-%d").date() - datetime.now().date()).days
    except (ValueError, TypeError):
        return None


# ---- 1. 监管报送台账 ----
@route("GET", P + r"/reports")
def report_list(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM reg_reports ORDER BY due_date")
    for r in rows:
        d = _days(r["due_date"])
        r["days_left"] = d
        r["overdue"] = r["status"] != "已报送" and d is not None and d < 0
    return {"items": rows, "pending": sum(1 for r in rows if r["status"] != "已报送"),
            "overdue": [r for r in rows if r["overdue"]]}


@route("POST", P + r"/reports")
def report_save(conn, m, body, qs):
    if body.get("id"):
        st = body.get("status") or "已报送"
        conn.execute("UPDATE reg_reports SET status=?,submitted_at=? WHERE id=?",
                     (st, today() if st == "已报送" else None, int(body["id"])))
        return {"ok": True, "updated": int(body["id"])}
    name = (body.get("name") or "").strip()
    require(name, "报送名称不能为空")
    cur = conn.execute("""INSERT INTO reg_reports(name,regulator,cycle,due_date,status,owner,created_at)
        VALUES(?,?,?,?,?,?,?)""", (name, body.get("regulator") or "", body.get("cycle") or "月度",
        body.get("due_date") or "", "待报送", body.get("owner") or "", now()))
    return {"ok": True, "id": cur.lastrowid}


# ---- 2. 反洗钱扫描 ----
@route("POST", P + r"/aml-scan")
def aml_scan(conn, m, body, qs):
    period = body.get("period") or today()[:7]
    rows = q(conn, """SELECT id,journal_date,direction,amount,summary,counterparty_id,created_at
        FROM journal WHERE period=? ORDER BY journal_date,id""", (period,))
    hits = []
    for r in rows:
        amt = float(r["amount"] or 0)
        reasons = []
        if amt >= LARGE_TXN:
            reasons.append(f"大额交易（≥¥{LARGE_TXN:,.0f}）")
        if amt >= 10000 and amt % 10000 == 0:
            reasons.append("整万元整数金额")
        if (r["created_at"] or "")[11:13] in ("00", "01", "02", "03", "04", "05", "22", "23"):
            reasons.append("非营业时段")
        if reasons:
            hits.append({"journal_id": r["id"], "date": r["journal_date"],
                         "amount": r2(amt), "summary": r["summary"], "rules": reasons,
                         "level": "高" if amt >= LARGE_TXN else "关注"})
    # 同日快进快出
    by_date = {}
    for r in rows:
        by_date.setdefault(r["journal_date"], []).append(r)
    for d, rs in by_date.items():
        ins = sum(float(x["amount"]) for x in rs if x["direction"] == "in")
        outs = sum(float(x["amount"]) for x in rs if x["direction"] == "out")
        if ins > 100000 and abs(ins - outs) / max(ins, 1) < 0.05:
            hits.append({"journal_id": None, "date": d, "amount": r2(ins),
                         "summary": "当日资金快进快出", "rules": ["同日流入≈流出，疑似过渡账户"], "level": "高"})
    for h in hits:
        conn.execute("""INSERT INTO aml_alerts(rule,journal_id,amount,detail,level,status,created_at)
            VALUES(?,?,?,?,?,'待核查',?)""", ("、".join(h["rules"]), h["journal_id"], h["amount"],
            h["summary"] or "", h["level"], now()))
    conn.commit()
    log(conn, "反洗钱规则扫描", "aml_alert", period, f"命中 {len(hits)} 条", body.get("actor") or "合规")
    return {"period": period, "scanned": len(rows), "hits": hits,
            "high_risk": sum(1 for h in hits if h["level"] == "高"),
            "hint": "规则为初筛，需人工复核后按规定上报；不替代法定可疑交易甄别"}


@route("GET", P + r"/aml-alerts")
def aml_list(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM aml_alerts ORDER BY id DESC LIMIT 200")
    return {"items": rows, "pending": sum(1 for r in rows if r["status"] == "待核查")}


# ---- 3. 关联方与关联交易 ----
@route("GET", P + r"/related-parties")
def rp_list(conn, m, body, qs):
    rows = q(conn, """SELECT r.*,p.name AS counterparty FROM related_parties r
        LEFT JOIN counterparties p ON p.id=r.counterparty_id ORDER BY r.id DESC""")
    total = r2(one(conn, "SELECT COALESCE(SUM(amount),0) v FROM journal WHERE period<=?", (today()[:7],))["v"])
    for r in rows:
        amt = r2(one(conn, "SELECT COALESCE(SUM(amount),0) v FROM journal WHERE counterparty_id=?",
                     (r["counterparty_id"],))["v"])
        r["transaction_amount"] = amt
        r["share"] = round(amt / total * 100, 2) if total else None
    return {"items": rows, "journal_total": total,
            "related_amount": r2(sum(x["transaction_amount"] for x in rows))}


@route("POST", P + r"/related-parties")
def rp_add(conn, m, body, qs):
    cid = int(body.get("counterparty_id") or 0)
    require(one(conn, "SELECT id FROM counterparties WHERE id=?", (cid,)), "往来单位不存在")
    conn.execute("""INSERT INTO related_parties(counterparty_id,relation,since,note,created_at)
        VALUES(?,?,?,?,?) ON CONFLICT(counterparty_id) DO UPDATE SET relation=excluded.relation,
        note=excluded.note""", (cid, body.get("relation") or "关联方", body.get("since") or today(),
        body.get("note") or "", now()))
    return {"ok": True, "counterparty_id": cid}


# ---- 4. 监管指标 ----
@route("GET", P + r"/metrics")
def reg_metrics(conn, m, body, qs):
    period = (qs.get("period") or [today()[:7]])[0]
    cash = r2(one(conn, "SELECT COALESCE(SUM(debit-credit),0) v FROM opening_balances WHERE subject_code='1002'")["v"])
    cash_flow = [dict(r) for r in conn.execute("""SELECT COALESCE(SUM(l.debit-l.credit),0) v FROM voucher_lines l
        JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period<=?
        WHERE l.subject_code LIKE '1002%'""", (period,))][0]["v"]
    cash = r2(cash + cash_flow)
    liabilities = r2(-one(conn, """SELECT COALESCE(SUM(l.debit-l.credit),0) v FROM voucher_lines l
        JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period<=?
        LEFT JOIN subjects s ON s.code=l.subject_code WHERE s.category='负债'""", (period,))["v"])
    equity = r2(-one(conn, """SELECT COALESCE(SUM(l.debit-l.credit),0) v FROM voucher_lines l
        JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period<=?
        LEFT JOIN subjects s ON s.code=l.subject_code WHERE s.category='权益'""", (period,))["v"])
    assets = r2(liabilities + equity)
    # 最大单一客户集中度
    conc = q(conn, """SELECT p.name AS name, SUM(j.amount) AS amount FROM journal j
        LEFT JOIN counterparties p ON p.id=j.counterparty_id WHERE j.counterparty_id IS NOT NULL
        AND j.direction='out' GROUP BY j.counterparty_id ORDER BY amount DESC LIMIT 1""")
    top = conc[0] if conc else {"name": "—", "amount": 0}
    outflow = r2(one(conn, "SELECT COALESCE(SUM(amount),0) v FROM journal WHERE direction='out'")["v"])
    ecl = r2(one(conn, "SELECT COALESCE(SUM(provision),0) v FROM ecl_stages WHERE period=?", (period,))["v"])
    return {"period": period, "items": [
        {"指标": "流动性比率（货币资金/流动负债）", "数值": round(cash / liabilities * 100, 2) if liabilities else None,
         "单位": "%", "参考": "≥25% 为稳健", "状态": "正常" if liabilities and cash / liabilities >= 0.25 else "关注"},
        {"指标": "资产负债率", "数值": round(liabilities / assets * 100, 2) if assets else None,
         "单位": "%", "参考": "≤70%", "状态": "正常" if assets and liabilities / assets <= 0.7 else "关注"},
        {"指标": "杠杆率（负债/权益）", "数值": round(liabilities / equity, 2) if equity else None,
         "单位": "倍", "参考": "≤2 倍", "状态": "正常" if equity and liabilities / equity <= 2 else "关注"},
        {"指标": "最大单一客户集中度", "数值": round(top["amount"] / outflow * 100, 2) if outflow else None,
         "单位": "%", "参考": "≤25%", "对象": top["name"],
         "状态": "正常" if outflow and top["amount"] / outflow <= 0.25 else "关注"},
        {"指标": "拨备余额", "数值": ecl, "单位": "¥", "参考": "按 ECL 三阶段计提", "状态": "正常" if ecl >= 0 else "关注"}],
        "说明": "监管口径为管理测算，非正式监管报送数据"}


# ---- 5. ECL 三阶段拨备 ----
@route("GET", P + r"/ecl")
def ecl_get(conn, m, body, qs):
    period = (qs.get("period") or [today()[:7]])[0]
    rows = q(conn, """SELECT e.*,p.name AS counterparty FROM ecl_stages e
        LEFT JOIN counterparties p ON p.id=e.counterparty_id WHERE e.period=? ORDER BY e.provision DESC""", (period,))
    return {"period": period, "items": rows,
            "exposure": r2(sum(r["exposure"] for r in rows)),
            "provision": r2(sum(r["provision"] for r in rows)),
            "stages": {"一阶段（正常）": sum(1 for r in rows if r["stage"] == 1),
                       "二阶段（关注）": sum(1 for r in rows if r["stage"] == 2),
                       "三阶段（不良）": sum(1 for r in rows if r["stage"] == 3)}}


@route("POST", P + r"/ecl/run")
def ecl_run(conn, m, body, qs):
    period = body.get("period") or today()[:7]
    rates = {1: 0.01, 2: 0.05, 3: 0.30}
    rows = q(conn, """SELECT i.counterparty_id, SUM(i.total_amount) AS exposure,
        MAX(julianday(?) - julianday(i.invoice_date)) AS max_days FROM invoices i
        WHERE i.kind='销项' AND i.status IN ('未入账','已入账') GROUP BY i.counterparty_id""", (period + "-28",))
    n = 0
    for r in rows:
        days = float(r["max_days"] or 0)
        stage = 3 if days > 90 else 2 if days > 30 else 1
        exposure = r2(r["exposure"])
        provision = r2(exposure * rates[stage])
        conn.execute("""INSERT INTO ecl_stages(counterparty_id,period,exposure,stage,rate,provision,created_at)
            VALUES(?,?,?,?,?,?,?) ON CONFLICT(counterparty_id,period) DO UPDATE SET
            exposure=excluded.exposure,stage=excluded.stage,rate=excluded.rate,provision=excluded.provision""",
            (r["counterparty_id"], period, exposure, stage, rates[stage], provision, now()))
        n += 1
    conn.commit()
    log(conn, "计算 ECL 拨备", "ecl", period, f"{n} 户", body.get("actor") or "财务")
    return {"ok": True, "count": n, "summary": ecl_get(conn, None, {}, {"period": [period]})}


# ---- 6. 报送文件导出 ----
@route("GET", P + r"/export")
def reg_export(conn, m, body, qs):
    period = (qs.get("period") or [today()[:7]])[0]
    metrics = reg_metrics(conn, None, {}, {"period": [period]})
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["期间", "监管指标", "数值", "单位", "参考", "状态"])
    for x in metrics["items"]:
        w.writerow([period, x["指标"], x["数值"] if x["数值"] is not None else "",
                    x["单位"], x["参考"], x["状态"]])
    data = buf.getvalue().encode("utf-8-sig")
    return {"_file": data, "_filename": f"监管指标_{period}.csv", "_ctype": "text/csv; charset=utf-8"}


# ---- 7. 监管工作台 ----
@route("GET", P + r"/dashboard")
def reg_dashboard(conn, m, body, qs):
    rep = report_list(conn, None, {}, {})
    aml = aml_list(conn, None, {}, {})
    rp = rp_list(conn, None, {}, {})
    return {"待报送报表": rep["pending"], "逾期报送": len(rep["overdue"]),
            "待核查反洗钱预警": aml["pending"], "关联方户数": len(rp["items"]),
            "关联交易金额": rp["related_amount"],
            "说明": "反洗钱与关联交易为初筛结果，须经合规人员复核"}
