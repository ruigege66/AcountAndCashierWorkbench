# -*- coding: utf-8 -*-
"""V2.8 出纳域：7 项功能。"""
import json
from datetime import datetime, timedelta

from app.routing import route
from .common import (q, one, now, today, r2, period_of, setting, set_setting,
                     jsetting, log, shift_month, require)

P = "/api/v28"
DENOMINATIONS = [100, 50, 20, 10, 5, 1, 0.5, 0.1]


def cash_book_balance(conn):
    r = one(conn, """SELECT balance_after FROM journal
                     WHERE account_kind='cash' AND bank_account_id IS NULL
                     ORDER BY journal_date DESC,id DESC LIMIT 1""")
    return r2(r["balance_after"]) if r else r2(setting(conn, "cash_opening", "0") or 0)


# ---- 9. 现金盘点表（按面额） ----
@route("GET", P + r"/cash-count")
def cash_count_list(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM cash_counts ORDER BY count_date DESC,id DESC LIMIT 100"),
            "book_balance": cash_book_balance(conn), "denominations": DENOMINATIONS}


@route("POST", P + r"/cash-count")
def cash_count_add(conn, m, body, qs):
    d = body.get("denominations") or {}
    total = 0.0
    clean = {}
    for k, v in d.items():
        try:
            fv, cnt = float(k), int(v)
        except (TypeError, ValueError):
            continue
        if cnt > 0:
            clean[str(k)] = cnt
            total += fv * cnt
    require(clean, "请至少填写一种面额的张数")
    date = body.get("count_date") or today()
    book = cash_book_balance(conn)
    diff = r2(total - book)
    cur = conn.execute("""INSERT INTO cash_counts(count_date,denominations_json,total_amount,
        book_amount,diff,note,actor,created_at) VALUES(?,?,?,?,?,?,?,?)""",
        (date, json.dumps(clean, ensure_ascii=False), r2(total), book, diff,
         body.get("note") or "", body.get("actor") or "出纳", now()))
    log(conn, "现金盘点", "cash_count", cur.lastrowid,
        f"{date} 实盘 ¥{total:,.2f} / 账面 ¥{book:,.2f} / 差额 ¥{diff:,.2f}", body.get("actor") or "出纳")
    return {"ok": True, "id": cur.lastrowid, "total": r2(total), "book": book, "diff": diff,
            "balanced": abs(diff) < 0.005,
            "impacts": {"count": 2, "label": "现金盘点",
                        "affects": [{"id": "daily", "label": "日结核对", "effect": "账实差额进入日清月结"},
                                    {"id": "alerts", "label": "风险预警", "effect": "账实不符会触发预警"}]}}


# ---- 10. 票据台账（支票 / 汇票） ----
@route("GET", P + r"/bills")
def bill_list(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM bills ORDER BY due_date,id DESC LIMIT 300")
    soon = (datetime.now().date() + timedelta(days=30)).isoformat()
    for r in rows:
        r["due_soon"] = bool(r["status"] == "持有" and r["due_date"] <= soon)
        r["overdue"] = bool(r["status"] == "持有" and r["due_date"] < today())
    return {"items": rows, "due_soon": [r for r in rows if r["due_soon"]],
            "overdue": [r for r in rows if r["overdue"]],
            "total_amount": r2(sum(r["amount"] for r in rows if r["status"] == "持有"))}


@route("POST", P + r"/bills")
def bill_add(conn, m, body, qs):
    no = (body.get("bill_no") or "").strip()
    amount = float(body.get("amount") or 0)
    issue, due = body.get("issue_date") or today(), body.get("due_date") or ""
    require(no and amount > 0 and due, "票据号、金额、到期日不能为空")
    try:
        cur = conn.execute("""INSERT INTO bills(bill_no,kind,amount,issue_date,due_date,status,
            counterparty,note,created_at) VALUES(?,?,?,?,?,?,?,?,?)""",
            (no, body.get("kind") or "支票", amount, issue, due,
             body.get("status") or "持有", body.get("counterparty") or "", body.get("note") or "", now()))
    except Exception:
        raise Exception("票据号已存在")
    log(conn, "登记票据", "bill", cur.lastrowid, f"{no} ¥{amount:,.2f} 到期 {due}", body.get("actor") or "出纳")
    return {"ok": True, "id": cur.lastrowid, "bill_no": no}


@route("POST", P + r"/bills/(\d+)/status")
def bill_status(conn, m, body, qs):
    bid, st = m.group(1), body.get("status") or ""
    require(st in ("持有", "已兑付", "已背书", "已作废"), "状态不合法")
    require(one(conn, "SELECT id FROM bills WHERE id=?", (bid,)), "票据不存在")
    conn.execute("UPDATE bills SET status=? WHERE id=?", (st, bid))
    log(conn, "更新票据状态", "bill", bid, st, body.get("actor") or "出纳")
    return {"ok": True, "status": st}


# ---- 11. 多账户资金余额总览 ----
@route("GET", P + r"/bank-balances")
def bank_balances(conn, m, body, qs):
    out = []
    for b in q(conn, "SELECT * FROM bank_accounts WHERE enabled=1 ORDER BY id"):
        r = one(conn, """SELECT balance_after FROM journal WHERE account_kind='bank'
                         AND bank_account_id=? ORDER BY journal_date DESC,id DESC LIMIT 1""", (b["id"],))
        bal = r2(r["balance_after"]) if r else r2(b["opening_balance"])
        out.append({"id": b["id"], "name": b["name"], "bank": b["bank_name"],
                    "account_no": b["account_no"], "currency": b["currency"],
                    "opening": r2(b["opening_balance"]), "balance": bal})
    cash = one(conn, """SELECT balance_after FROM journal WHERE account_kind='cash'
                        AND bank_account_id IS NULL ORDER BY journal_date DESC,id DESC LIMIT 1""")
    cash_bal = r2(cash["balance_after"]) if cash else r2(setting(conn, "cash_opening", "0") or 0)
    return {"items": out, "cash": cash_bal,
            "total": r2(sum(x["balance"] for x in out) + cash_bal),
            "hint": "余额取各账户最新日记账 balance_after；无流水时取账户期初"}


# ---- 12. 资金日报 / 周报 ----
@route("GET", P + r"/funds/daily")
def funds_daily(conn, m, body, qs):
    dfrom = (qs.get("from") or [shift_month(period_of(qs), 0) + "-01"])[0]
    dto = (qs.get("to") or [today()])[0]
    rows = q(conn, """SELECT journal_date,
        SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS inflow,
        SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS outflow,
        COUNT(*) AS cnt FROM journal WHERE journal_date BETWEEN ? AND ?
        GROUP BY journal_date ORDER BY journal_date""", (dfrom, dto))
    bal = 0.0
    for r in rows:
        r["net"] = r2(r["inflow"] - r["outflow"])
        bal += r["net"]
        r["balance"] = r2(bal)
        r["inflow"], r["outflow"] = r2(r["inflow"]), r2(r["outflow"])
    return {"from": dfrom, "to": dto, "items": rows,
            "in_total": r2(sum(r["inflow"] for r in rows)),
            "out_total": r2(sum(r["outflow"] for r in rows)),
            "net_total": r2(sum(r["net"] for r in rows)),
            "hint": "按日汇总全部账户收付；余额为区间内累计净额，非账面绝对余额"}


# ---- 13. 付款审批额度分级 ----
@route("GET", P + r"/approval-tiers")
def approval_get(conn, m, body, qs):
    tiers = jsetting(conn, "approval_tiers", [])
    amount = (qs.get("amount") or [""])[0]
    result = None
    if amount:
        try:
            a = float(amount)
            result = next((t["approver"] for t in sorted(tiers, key=lambda x: x["limit"] or float("inf"))
                           if a <= (t["limit"] or float("inf"))), "总经理")
        except ValueError:
            result = None
    return {"tiers": tiers, "amount": amount, "approver": result}


@route("POST", P + r"/approval-tiers")
def approval_set(conn, m, body, qs):
    tiers = body.get("tiers") or []
    require(isinstance(tiers, list) and all("approver" in t for t in tiers), "每级需包含 approver")
    set_setting(conn, "approval_tiers", json.dumps(tiers, ensure_ascii=False))
    log(conn, "修改审批额度分级", "setting", "approval_tiers", f"{len(tiers)} 级", body.get("actor") or "会计主管")
    return {"ok": True, "tiers": tiers}


# ---- 14. 未来资金预测 ----
@route("GET", P + r"/funds/forecast")
def funds_forecast(conn, m, body, qs):
    days = min(int((qs.get("days") or ["30"])[0] or 30), 180)
    start = datetime.now().date()
    horizon = start + timedelta(days=days)
    buckets = {}
    def add(date, kind, amount, label):
        if not date or not (start <= date <= horizon):
            return
        k = date.isoformat()
        b = buckets.setdefault(k, {"date": k, "inflow": 0.0, "outflow": 0.0, "items": []})
        b[kind] += amount
        b["items"].append({"label": label, "direction": "流入" if kind == "inflow" else "流出",
                           "amount": r2(amount)})
    for r in q(conn, """SELECT invoice_no,kind,total_amount,invoice_date FROM invoices
                        WHERE status IN ('未入账','已入账','已开票')"""):
        try:
            d = datetime.strptime(r["invoice_date"], "%Y-%m-%d").date() + timedelta(days=30)
        except (ValueError, TypeError):
            continue
        add(d, "inflow" if r["kind"] == "销项" else "outflow", r["total_amount"],
            f"{r['kind']}发票 {r['invoice_no']}")
    for r in q(conn, "SELECT bill_no,kind,amount,due_date FROM bills WHERE status='持有'"):
        try:
            d = datetime.strptime(r["due_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            continue
        add(d, "outflow", r["amount"], f"票据 {r['bill_no']}")
    out = []
    cum = 0.0
    for k in sorted(buckets):
        b = buckets[k]
        b["inflow"], b["outflow"] = r2(b["inflow"]), r2(b["outflow"])
        b["net"] = r2(b["inflow"] - b["outflow"])
        cum += b["net"]
        b["cumulative"] = r2(cum)
        out.append(b)
    return {"days": days, "items": out, "net_total": r2(cum),
            "hint": "应收/应付发票按开票日 +30 天预估收付，票据按到期日预估流出；可在资金日报中对照实际"}


# ---- 15. 现金限额预警 ----
@route("GET", P + r"/cash-limit")
def cash_limit_get(conn, m, body, qs):
    limit = r2(setting(conn, "cashier_cash_limit", "20000") or 0)
    bal = cash_book_balance(conn)
    return {"limit": limit, "balance": bal, "exceeded": bal > limit,
            "diff": r2(bal - limit), "usage_pct": round(bal / limit * 100, 1) if limit else None}


@route("POST", P + r"/cash-limit")
def cash_limit_set(conn, m, body, qs):
    limit = float(body.get("limit") or 0)
    require(limit >= 0, "限额不能为负")
    set_setting(conn, "cashier_cash_limit", limit)
    log(conn, "修改库存现金限额", "setting", "cashier_cash_limit", f"¥{limit:,.2f}", body.get("actor") or "会计主管")
    return {"ok": True, "limit": limit, "check": cash_limit_get(conn, None, {}, {})}
