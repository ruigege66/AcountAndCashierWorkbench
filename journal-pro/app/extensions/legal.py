# -*- coding: utf-8 -*-
"""V2.13 法务域：合同、付款节点、法务审查、纠纷与或有负债、用印授权、合规义务。"""
from datetime import datetime, timedelta

from app.routing import route
from app.errors import ApiError
from .common import q, one, now, today, r2, log, require

P = "/api/v28/legal"
REVIEW_ITEMS = ["主体资格与授权", "价款与付款条件", "发票与税务条款", "违约责任",
                "争议解决与管辖", "担保与保密"]


def _cp(conn, cid):
    r = one(conn, "SELECT name FROM counterparties WHERE id=?", (cid,))
    return r["name"] if r else "未指定单位"


def _days(d):
    try:
        return (datetime.strptime(d, "%Y-%m-%d").date() - datetime.now().date()).days
    except (ValueError, TypeError):
        return None


# ---- 1. 合同台账 ----
@route("GET", P + r"/contracts")
def contracts(conn, m, body, qs):
    rows = q(conn, """SELECT c.*,p.name AS counterparty FROM contracts c
        LEFT JOIN counterparties p ON p.id=c.counterparty_id ORDER BY c.id DESC LIMIT 200""")
    for r in rows:
        left = _days(r["end_date"])
        r["days_left"] = left
        r["expiring"] = left is not None and 0 <= left <= 30
        r["paid"] = r2(one(conn, """SELECT COALESCE(SUM(amount),0) v FROM contract_milestones
            WHERE contract_id=? AND status='已付款'""", (r["id"],))["v"])
        r["remaining"] = r2(r["amount"] - r["paid"])
    return {"items": rows, "expiring": [r for r in rows if r["expiring"]],
            "total_amount": r2(sum(r["amount"] for r in rows))}


@route("POST", P + r"/contracts")
def contract_add(conn, m, body, qs):
    no, title = (body.get("contract_no") or "").strip(), (body.get("title") or "").strip()
    require(no and title, "合同编号与名称不能为空")
    require(float(body.get("amount") or 0) > 0, "合同金额须大于 0")
    try:
        cur = conn.execute("""INSERT INTO contracts(contract_no,title,counterparty_id,kind,amount,
            sign_date,start_date,end_date,payment_terms,owner,status,note,created_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (no, title, body.get("counterparty_id"), body.get("kind") or "采购",
             r2(body.get("amount")), body.get("sign_date") or today(),
             body.get("start_date") or today(), body.get("end_date") or "",
             body.get("payment_terms") or "", body.get("owner") or "", "执行中",
             body.get("note") or "", now()))
    except Exception:
        raise ApiError("合同编号已存在")
    log(conn, "登记合同", "contract", cur.lastrowid, f"{no} ¥{r2(body.get('amount')):,.2f}", body.get("actor") or "法务")
    return {"ok": True, "id": cur.lastrowid, "contract_no": no}


# ---- 2. 合同付款节点 ----
@route("GET", P + r"/milestones")
def milestone_list(conn, m, body, qs):
    rows = q(conn, """SELECT ms.*,c.title AS contract,c.contract_no FROM contract_milestones ms
        LEFT JOIN contracts c ON c.id=ms.contract_id ORDER BY ms.due_date,ms.id LIMIT 300""")
    for r in rows:
        r["days_left"] = _days(r["due_date"])
        r["overdue"] = r["status"] != "已付款" and r["days_left"] is not None and r["days_left"] < 0
    return {"items": rows, "overdue": [r for r in rows if r["overdue"]]}


@route("POST", P + r"/milestones")
def milestone_add(conn, m, body, qs):
    cid = int(body.get("contract_id") or 0)
    c = one(conn, "SELECT * FROM contracts WHERE id=?", (cid,))
    require(c, "合同不存在")
    amt = r2(body.get("amount"))
    require(amt > 0, "节点金额须大于 0")
    planned = r2(one(conn, "SELECT COALESCE(SUM(amount),0) v FROM contract_milestones WHERE contract_id=?", (cid,))["v"])
    require(planned + amt <= c["amount"] + 0.005,
            f"付款节点累计 {planned + amt:,.2f} 元超过合同金额 {c['amount']:,.2f} 元")
    cur = conn.execute("""INSERT INTO contract_milestones(contract_id,due_date,amount,note,status,created_at)
        VALUES(?,?,?,?,'待付款',?)""", (cid, body.get("due_date") or today(), amt, body.get("note") or "", now()))
    log(conn, "登记合同付款节点", "contract_milestone", cur.lastrowid, f"合同 {c['contract_no']} ¥{amt:,.2f}",
        body.get("actor") or "会计")
    return {"ok": True, "id": cur.lastrowid, "contract_remaining": r2(c["amount"] - planned - amt)}


# ---- 3. 法务审查清单 ----
@route("GET", P + r"/reviews")
def review_list(conn, m, body, qs):
    cid = int((qs.get("contract_id") or ["0"])[0] or 0)
    rows = q(conn, "SELECT * FROM legal_reviews WHERE contract_id=? ORDER BY id", (cid,)) if cid else []
    checked = {r["item"]: r for r in rows}
    items = [{"item": x, "passed": bool(checked.get(x, {}).get("passed")),
              "note": checked.get(x, {}).get("note") or ""} for x in REVIEW_ITEMS]
    passed = sum(1 for x in items if x["passed"])
    return {"contract_id": cid, "items": items, "passed": passed, "total": len(items),
            "rate": round(passed / len(items) * 100, 2),
            "conclusion": "通过，可进入用印流程" if passed == len(items) else "存在未通过项，建议补正后再用印"}


@route("POST", P + r"/reviews")
def review_save(conn, m, body, qs):
    cid = int(body.get("contract_id") or 0)
    require(one(conn, "SELECT id FROM contracts WHERE id=?", (cid,)), "合同不存在")
    results = body.get("results") or {}
    n = 0
    for item, ok in results.items():
        if item not in REVIEW_ITEMS:
            continue
        conn.execute("""INSERT INTO legal_reviews(contract_id,item,passed,reviewer,note,created_at)
            VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING""",
            (cid, item, 1 if ok in (True, 1, "1", "true", "是") else 0,
             body.get("reviewer") or "法务", str(body.get("notes") or {}).get(item, "") if isinstance(body.get("notes"), dict) else "", now()))
        conn.execute("""UPDATE legal_reviews SET passed=?,reviewer=?,note=? WHERE contract_id=? AND item=?""",
            (1 if ok in (True, 1, "1", "true", "是") else 0, body.get("reviewer") or "法务",
             (body.get("notes") or {}).get(item, "") if isinstance(body.get("notes"), dict) else "", cid, item))
        n += 1
    return {"ok": True, "updated": n, "summary": review_list(conn, None, {}, {"contract_id": [str(cid)]})}


# ---- 4. 纠纷案件与或有负债 ----
@route("GET", P + r"/cases")
def case_list(conn, m, body, qs):
    rows = q(conn, """SELECT c.*,p.name AS counterparty FROM legal_cases c
        LEFT JOIN counterparties p ON p.id=c.counterparty_id ORDER BY c.id DESC""")
    for r in rows:
        r["expected_liability"] = r2(r["claim_amount"] * r["probability"])
    return {"items": rows, "claim_total": r2(sum(r["claim_amount"] for r in rows)),
            "provision_total": r2(sum(r["provision"] for r in rows)),
            "expected_liability": r2(sum(r["expected_liability"] for r in rows))}


@route("POST", P + r"/cases")
def case_add(conn, m, body, qs):
    no, title = (body.get("case_no") or "").strip(), (body.get("title") or "").strip()
    require(no and title, "案件编号与名称不能为空")
    p = min(max(float(body.get("probability") or 0.5), 0), 1)
    claim = r2(body.get("claim_amount"))
    cur = conn.execute("""INSERT INTO legal_cases(case_no,title,counterparty_id,kind,claim_amount,
        stage,probability,provision,status,note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
        (no, title, body.get("counterparty_id"), body.get("kind") or "合同纠纷", claim,
         body.get("stage") or "一审", p, r2(claim * p), body.get("status") or "进行中",
         body.get("note") or "", now()))
    log(conn, "登记纠纷案件", "legal_case", cur.lastrowid, f"{no} 预计负债 ¥{claim * p:,.2f}", body.get("actor") or "法务")
    return {"ok": True, "id": cur.lastrowid, "expected_liability": r2(claim * p)}


# ---- 5. 用印授权 ----
@route("GET", P + r"/seals")
def seal_list(conn, m, body, qs):
    rows = q(conn, """SELECT s.*,c.title AS contract FROM seal_requests s
        LEFT JOIN contracts c ON c.id=s.contract_id ORDER BY s.id DESC LIMIT 200""")
    return {"items": rows, "pending": sum(1 for r in rows if r["status"] == "待审批")}


@route("POST", P + r"/seals")
def seal_save(conn, m, body, qs):
    purpose = (body.get("purpose") or "").strip()
    require(purpose, "用印事由不能为空")
    approve = str(body.get("approve") or "") in ("1", "true", "yes", "是")
    cid = body.get("contract_id")
    warn = None
    if cid:
        rv = review_list(conn, None, {}, {"contract_id": [str(cid)]})
        if rv["passed"] < rv["total"]:
            warn = f"法务审查仅 {rv['passed']}/{rv['total']} 项通过，建议暂缓用印"
    cur = conn.execute("""INSERT INTO seal_requests(purpose,contract_id,applicant,approver,used_at,status,created_at)
        VALUES(?,?,?,?,?,?,?)""", (purpose, cid, body.get("applicant") or "", body.get("approver") if approve else "",
        today() if approve else None, "已用印" if approve else "待审批", now()))
    log(conn, "用印申请", "seal", cur.lastrowid, purpose[:100], body.get("applicant") or "")
    return {"ok": True, "id": cur.lastrowid, "status": "已用印" if approve else "待审批", "warning": warn}


# ---- 6. 合规义务 ----
@route("GET", P + r"/duties")
def duty_list(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM compliance_duties ORDER BY due_date")
    for r in rows:
        d = _days(r["due_date"])
        r["days_left"] = d
        r["overdue"] = r["status"] != "已完成" and d is not None and d < 0
        r["due_soon"] = r["status"] != "已完成" and d is not None and 0 <= d <= 30
    return {"items": rows, "overdue": [r for r in rows if r["overdue"]],
            "due_soon": [r for r in rows if r["due_soon"]]}


@route("POST", P + r"/duties")
def duty_save(conn, m, body, qs):
    if body.get("id"):
        conn.execute("UPDATE compliance_duties SET status=?,note=? WHERE id=?",
                     (body.get("status") or "已完成", body.get("note") or "", int(body["id"])))
        return {"ok": True, "updated": int(body["id"])}
    name = (body.get("name") or "").strip()
    require(name and body.get("due_date"), "义务名称与截止日不能为空")
    cur = conn.execute("""INSERT INTO compliance_duties(name,authority,due_date,cycle,status,owner,note,created_at)
        VALUES(?,?,?,?,?,?,?,?)""", (name, body.get("authority") or "", body["due_date"],
        body.get("cycle") or "年度", "待办", body.get("owner") or "", body.get("note") or "", now()))
    return {"ok": True, "id": cur.lastrowid}


# ---- 7. 法务工作台 ----
@route("GET", P + r"/dashboard")
def legal_dashboard(conn, m, body, qs):
    c = contracts(conn, None, {}, {})
    d = duty_list(conn, None, {}, {})
    cs = case_list(conn, None, {}, {})
    ml = milestone_list(conn, None, {}, {})
    return {"合同总数": len(c["items"]), "30天内到期合同": len(c["expiring"]),
            "合同金额合计": c["total_amount"], "待付款节点": sum(1 for x in ml["items"] if x["status"] == "待付款"),
            "逾期付款节点": len(ml["overdue"]), "逾期合规义务": len(d["overdue"]),
            "进行中案件": sum(1 for x in cs["items"] if x["status"] == "进行中"),
            "或有负债（期望值）": cs["expected_liability"],
            "提示": "合同到期、付款节点、用印审查与合规义务统一在此跟踪"}
