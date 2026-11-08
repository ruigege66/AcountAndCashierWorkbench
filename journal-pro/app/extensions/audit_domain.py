# -*- coding: utf-8 -*-
"""V2.13 审计域：审计计划、工作底稿、分层抽样、发现整改、往来函证、调整分录。"""
import random
from datetime import datetime

from app.routing import route
from app.errors import ApiError
from .common import q, one, now, today, r2, log, require

P = "/api/v28/audit-domain"


def _days(d):
    try:
        return (datetime.strptime(d, "%Y-%m-%d").date() - datetime.now().date()).days
    except (ValueError, TypeError):
        return None


# ---- 1. 审计计划 ----
@route("GET", P + r"/plans")
def plan_list(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM audit_plans ORDER BY year DESC,risk_level,id DESC LIMIT 200")}


@route("POST", P + r"/plans")
def plan_add(conn, m, body, qs):
    scope = (body.get("scope") or "").strip()
    require(scope, "审计范围不能为空")
    cur = conn.execute("""INSERT INTO audit_plans(year,scope,risk_level,planned_hours,auditor,status,created_at)
        VALUES(?,?,?,?,?,?,?)""", (body.get("year") or today()[:4], scope,
        body.get("risk_level") or "中", float(body.get("planned_hours") or 0),
        body.get("auditor") or "", "计划中", now()))
    return {"ok": True, "id": cur.lastrowid}


# ---- 2. 工作底稿 ----
@route("GET", P + r"/workpapers")
def wp_list(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM audit_workpapers ORDER BY id DESC LIMIT 200")}


@route("POST", P + r"/workpapers")
def wp_add(conn, m, body, qs):
    ref, proc = (body.get("ref") or "").strip(), (body.get("procedure") or "").strip()
    require(ref and proc, "底稿编号与审计程序不能为空")
    cur = conn.execute("""INSERT INTO audit_workpapers(plan_id,ref,procedure,sample_size,exception_count,
        conclusion,reviewer,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)""",
        (body.get("plan_id"), ref, proc, int(body.get("sample_size") or 0),
         int(body.get("exception_count") or 0), body.get("conclusion") or "",
         body.get("reviewer") or "", body.get("status") or "编制中", now()))
    return {"ok": True, "id": cur.lastrowid}


# ---- 3. 凭证分层抽样 ----
@route("POST", P + r"/sampling")
def sampling(conn, m, body, qs):
    period = body.get("period") or today()[:7]
    size = min(max(int(body.get("size") or 10), 1), 100)
    rows = q(conn, """SELECT v.id,v.voucher_no,v.voucher_date,v.summary,
        SUM(l.debit) AS amount FROM vouchers v
        JOIN voucher_lines l ON l.voucher_id=v.id WHERE v.status='posted' AND v.period=?
        GROUP BY v.id ORDER BY amount DESC""", (period,))
    require(rows, "该期间没有已过账凭证")
    high = [r for r in rows if r["amount"] >= 50000]
    mid = [r for r in rows if 5000 <= r["amount"] < 50000]
    low = [r for r in rows if r["amount"] < 5000]
    picks, reasons = [], []
    for band, label, share in ((high, "大额（≥5万）全查", 1.0), (mid, "中额分层抽取", 0.3), (low, "小额随机抽取", 0.1)):
        n = min(len(band), max(1, int(size * share))) if band else 0
        chosen = band if share == 1.0 else random.sample(band, min(n, len(band))) if band else []
        for c in chosen:
            picks.append(c)
            reasons.append(label)
    for p, why in zip(picks, reasons):
        p["抽样理由"] = why
    return {"period": period, "population": len(rows), "sample_size": len(picks),
            "bands": {"大额": len(high), "中额": len(mid), "小额": len(low)},
            "items": picks[:size], "sample_amount": r2(sum(p["amount"] for p in picks)),
            "coverage": round(sum(p["amount"] for p in picks) / sum(r["amount"] for r in rows) * 100, 2)}


# ---- 4. 审计发现与整改 ----
@route("GET", P + r"/findings")
def finding_list(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM audit_findings ORDER BY id DESC LIMIT 200")
    for r in rows:
        d = _days(r["due_date"])
        r["days_left"] = d
        r["overdue"] = r["status"] != "已整改" and d is not None and d < 0
    return {"items": rows, "open": sum(1 for r in rows if r["status"] != "已整改"),
            "overdue": [r for r in rows if r["overdue"]],
            "amount_impact": r2(sum(r["amount_impact"] for r in rows if r["status"] != "已整改"))}


@route("POST", P + r"/findings")
def finding_add(conn, m, body, qs):
    if body.get("id"):
        st = body.get("status") or "已整改"
        conn.execute("UPDATE audit_findings SET status=?,rectified_at=? WHERE id=?",
                     (st, today() if st == "已整改" else None, int(body["id"])))
        return {"ok": True, "updated": int(body["id"])}
    title = (body.get("title") or "").strip()
    require(title, "问题标题不能为空")
    cur = conn.execute("""INSERT INTO audit_findings(title,risk_level,amount_impact,requirement,
        owner,due_date,status,created_at) VALUES(?,?,?,?,?,?,?,?)""",
        (title, body.get("risk_level") or "中", r2(body.get("amount_impact")),
         body.get("requirement") or "", body.get("owner") or "", body.get("due_date") or "", "待整改", now()))
    return {"ok": True, "id": cur.lastrowid}


# ---- 5. 往来函证 ----
@route("GET", P + r"/confirmations")
def conf_list(conn, m, body, qs):
    rows = q(conn, """SELECT c.*,p.name AS counterparty FROM audit_confirmations c
        LEFT JOIN counterparties p ON p.id=c.counterparty_id ORDER BY c.id DESC""")
    return {"items": rows, "unanswered": sum(1 for r in rows if r["status"] != "已回函"),
            "difference_total": r2(sum(r["difference"] or 0 for r in rows))}


@route("POST", P + r"/confirmations")
def conf_save(conn, m, body, qs):
    cid = int(body.get("counterparty_id") or 0)
    period = body.get("period") or today()[:7]
    require(one(conn, "SELECT id FROM counterparties WHERE id=?", (cid,)), "往来单位不存在")
    bal = r2(one(conn, """SELECT COALESCE(SUM(l.debit-l.credit),0) v FROM voucher_lines l
        JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period<=?
        WHERE l.counterparty_id=?""", (period, cid))["v"])
    reply = body.get("reply_balance")
    diff = r2(bal - float(reply)) if reply not in (None, "") else None
    cur = conn.execute("""INSERT INTO audit_confirmations(counterparty_id,period,book_balance,
        reply_balance,difference,status,sent_at,replied_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)""",
        (cid, period, bal, float(reply) if reply not in (None, "") else None, diff,
         "已回函" if reply not in (None, "") else "已发函", today(),
         today() if reply not in (None, "") else None, now()))
    return {"ok": True, "id": cur.lastrowid, "book_balance": bal,
            "difference": diff, "结论": "相符" if diff is not None and abs(diff) < 0.005 else "存在差异需核查"}


# ---- 6. 审计调整分录 ----
@route("GET", P + r"/adjustments")
def adj_list(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM audit_adjustments ORDER BY id DESC")
    return {"items": rows, "total_debit": r2(sum(r["debit"] for r in rows)),
            "total_credit": r2(sum(r["credit"] for r in rows))}


@route("POST", P + r"/adjustments")
def adj_add(conn, m, body, qs):
    d, c = r2(body.get("debit")), r2(body.get("credit"))
    require(d > 0 or c > 0, "借方或贷方金额须大于 0")
    require(abs(d - c) < 0.005, "单条调整分录借贷必须平衡")
    cur = conn.execute("""INSERT INTO audit_adjustments(finding_id,summary,subject_code,debit,credit,status,created_at)
        VALUES(?,?,?,?,?,?,?)""", (body.get("finding_id"), body.get("summary") or "审计调整",
        body.get("subject_code") or "", d, c, body.get("status") or "建议", now()))
    log(conn, "提出审计调整分录", "audit_adjustment", cur.lastrowid, f"借 ¥{d:,.2f} 贷 ¥{c:,.2f}", body.get("actor") or "审计")
    return {"ok": True, "id": cur.lastrowid, "balanced": True}


# ---- 7. 审计工作台 ----
@route("GET", P + r"/dashboard")
def audit_dashboard(conn, m, body, qs):
    f = finding_list(conn, None, {}, {})
    c = conf_list(conn, None, {}, {})
    a = adj_list(conn, None, {}, {})
    return {"审计计划": len(plan_list(conn, None, {}, {})["items"]),
            "工作底稿": len(wp_list(conn, None, {}, {})["items"]),
            "未整改问题": f["open"], "逾期未整改": len(f["overdue"]),
            "未决问题金额影响": f["amount_impact"], "未回函函证": c["unanswered"],
            "函证差异合计": c["difference_total"], "调整分录": len(a["items"]),
            "调整分录是否平衡": abs(a["total_debit"] - a["total_credit"]) < 0.005}
