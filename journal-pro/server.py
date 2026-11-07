# -*- coding: utf-8 -*-
"""会计出纳全流程系统 - 后端 API（Python 标准库 + SQLite）"""
import base64
import csv
import io
import json
import os
import re
import traceback
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, quote

from app.routing import route, get_router
from app.errors import ApiError
from db import connect, migrate, q, one, audit, now, verify_audit_chain
from office import (make_xlsx, read_xlsx, make_docx, make_pptx, extract_office_text)

BASE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(BASE, "public")
PORT = int(os.environ.get("PORT", "8765"))

# 脚本启动模式（python server.py）下，本模块先于组合根执行，需先引导出 Router
# 实例并复用（不可重建，否则会丢掉已注册的路由）。app.bootstrap 随后装配依赖。
get_router()


# 路由表由组合根（app.bootstrap）创建为 Router 实例并注入；
# 控制器统一 `from app.routing import route`，因此本模块不再被反向依赖。

# ---------------- 通用工具 ----------------
def period_of(d):
    return (d or "")[:7]


def ensure_period(conn, period):
    if not period:
        raise ApiError("缺少会计期间")
    conn.execute("INSERT OR IGNORE INTO periods(period,status) VALUES(?,'open')", (period,))


def assert_open(conn, period):
    r = one(conn, "SELECT status FROM periods WHERE period=?", (period,))
    if r and r["status"] == "closed":
        raise ApiError(f"会计期间 {period} 已结账，禁止新增或修改（请先反结账）")


def next_no(conn, table, column, prefix, d):
    p = f"{prefix}{period_of(d).replace('-', '')}"
    r = one(conn, f"SELECT MAX({column}) AS m FROM {table} WHERE {column} LIKE ?", (p + "%",))
    m = r["m"] if r and r["m"] else None
    digits = re.sub(r"\D", "", str(m)[len(p):]) if m else ""
    n = int(digits) + 1 if digits else 1
    return f"{p}{n:03d}"


def opening_of(conn, kind, bank_id=None):
    if kind == "cash":
        r = one(conn, "SELECT value FROM settings WHERE key='cash_opening'")
        return float(r["value"]) if r and r["value"] else 0.0
    r = one(conn, "SELECT opening_balance FROM bank_accounts WHERE id=?", (bank_id,))
    return float(r["opening_balance"]) if r else 0.0


def recalc_balances(conn, kind, bank_id):
    rows = q(conn, """SELECT id,direction,amount FROM journal
                      WHERE account_kind=? AND bank_account_id IS ?
                      ORDER BY journal_date, id""", (kind, bank_id))
    bal = opening_of(conn, kind, bank_id)
    for r in rows:
        bal += r["amount"] if r["direction"] == "in" else -r["amount"]
        conn.execute("UPDATE journal SET balance_after=? WHERE id=?", (round(bal, 2), r["id"]))


def current_balance(conn, kind, bank_id=None):
    r = one(conn, """SELECT balance_after FROM journal
                     WHERE account_kind=? AND bank_account_id IS ?
                     ORDER BY journal_date DESC, id DESC LIMIT 1""", (kind, bank_id))
    return r["balance_after"] if r else opening_of(conn, kind, bank_id)


def default_bank_id(conn):
    r = one(conn, "SELECT id FROM bank_accounts WHERE enabled=1 ORDER BY id LIMIT 1")
    return r["id"] if r else None


def log(conn, action, entity, eid, detail, actor="系统"):
    audit(conn, action, entity, eid, detail, actor)


def setting(conn, key, default=""):
    r = one(conn, "SELECT value FROM settings WHERE key=?", (key,))
    return r["value"] if r else default


def doc_label(t):
    return {"payment": "付款申请", "receipt": "收款单", "advance": "备用金借款",
            "reimbursement": "费用报销"}.get(t, t)


# ---------------- 凭证与过账 ----------------
def create_voucher(conn, data, actor="系统", auto_post=False):
    d = data.get("voucher_date") or datetime.now().strftime("%Y-%m-%d")
    period = period_of(d)
    ensure_period(conn, period)
    assert_open(conn, period)
    lines = data.get("lines") or []
    if len(lines) < 2:
        raise ApiError("凭证至少需要两条分录")
    dr = sum(float(x.get("debit") or 0) for x in lines)
    cr = sum(float(x.get("credit") or 0) for x in lines)
    if round(dr, 2) != round(cr, 2) or dr <= 0:
        raise ApiError(f"借贷不平衡：借方 {dr:.2f} / 贷方 {cr:.2f}")
    vtype = data.get("voucher_type") or "转"
    no = data.get("voucher_no") or next_no(conn, "vouchers", "voucher_no", "记-", d)
    cur = conn.execute(
        """INSERT INTO vouchers(voucher_no,voucher_date,period,voucher_type,summary,maker,status,
                                source_doc_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)""",
        (no, d, period, vtype, data.get("summary") or "", actor, "draft",
         data.get("source_doc_id"), now()))
    vid = cur.lastrowid
    for i, ln in enumerate(lines, 1):
        if not ln.get("subject_code"):
            raise ApiError("分录缺少科目")
        conn.execute("""INSERT INTO voucher_lines(voucher_id,line_no,summary,subject_code,
                       project_id,counterparty_id,debit,credit) VALUES(?,?,?,?,?,?,?,?)""",
                     (vid, i, ln.get("summary") or data.get("summary") or "",
                      ln["subject_code"], ln.get("project_id"), ln.get("counterparty_id"),
                      float(ln.get("debit") or 0), float(ln.get("credit") or 0)))
    log(conn, "新增凭证", "voucher", vid, f"{no} 借贷各 {dr:.2f}", actor)
    if auto_post:
        post_voucher(conn, vid, actor)
    return vid


def post_voucher(conn, vid, actor="系统"):
    v = one(conn, "SELECT * FROM vouchers WHERE id=?", (vid,))
    if not v:
        raise ApiError("凭证不存在", 404)
    if v["status"] == "posted":
        return
    if v["status"] == "void":
        raise ApiError("已作废凭证不能过账")
    assert_open(conn, v["period"])
    lines = q(conn, "SELECT * FROM voucher_lines WHERE voucher_id=? ORDER BY line_no", (vid,))
    touched = set()
    for ln in lines:
        code = ln["subject_code"]
        if code not in ("1001", "1002"):
            continue
        kind = "cash" if code == "1001" else "bank"
        bank_id = None if kind == "cash" else default_bank_id(conn)
        debit, credit = ln["debit"], ln["credit"]
        direction = "in" if debit > 0 else "out"
        amount = debit if debit > 0 else credit
        conn.execute("""INSERT INTO journal(journal_date,period,account_kind,bank_account_id,direction,
                       amount,balance_after,summary,subject_code,project_id,counterparty_id,
                       voucher_id,voucher_line_id,recon_status,created_at)
                       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                     (v["voucher_date"], v["period"], kind, bank_id, direction, amount, 0,
                      ln["summary"] or v["summary"], code, ln["project_id"],
                      ln["counterparty_id"], vid, ln["id"], "未核对", now()))
        touched.add((kind, bank_id))
    for kind, bank_id in touched:
        recalc_balances(conn, kind, bank_id)
    conn.execute("UPDATE vouchers SET status='posted',posted_at=? WHERE id=?", (now(), vid))
    log(conn, "凭证过账", "voucher", vid, f"{v['voucher_no']} 已登记日记账", actor)


def settle_doc(conn, doc_id, actor="系统"):
    doc = one(conn, "SELECT * FROM docs WHERE id=?", (doc_id,))
    if not doc:
        raise ApiError("单据不存在", 404)
    if doc["status"] not in ("approved",):
        raise ApiError("只有「已审批」的单据可以办理收付款")
    assert_open(conn, doc["period"])
    amount = float(doc["amount"])
    cash_code = "1001" if doc["account_kind"] == "cash" else "1002"
    t = doc["doc_type"]
    if t == "payment":
        lines = [{"subject_code": doc["subject_code"], "debit": amount, "credit": 0},
                 {"subject_code": cash_code, "debit": 0, "credit": amount}]
        vtype = "付"
    elif t == "receipt":
        lines = [{"subject_code": cash_code, "debit": amount, "credit": 0},
                 {"subject_code": doc["subject_code"], "debit": 0, "credit": amount}]
        vtype = "收"
    elif t == "advance":
        lines = [{"subject_code": "1221", "debit": amount, "credit": 0},
                 {"subject_code": cash_code, "debit": 0, "credit": amount}]
        vtype = "付"
    elif t == "reimbursement":
        credit_code = "1221" if doc["advance_id"] else cash_code
        lines = [{"subject_code": doc["subject_code"], "debit": amount, "credit": 0},
                 {"subject_code": credit_code, "debit": 0, "credit": amount}]
        vtype = "转" if doc["advance_id"] else "付"
    else:
        raise ApiError("未知单据类型")
    for ln in lines:
        ln["project_id"] = doc["project_id"]
        ln["counterparty_id"] = doc["counterparty_id"]
        ln["summary"] = doc["reason"] or doc_label(t)
    # 预算费控：按「期间 + 科目 + 项目」检查支出类单据是否超预算
    if setting(conn, "budget_control", "1") == "1" and t in ("payment", "reimbursement"):
        spent = one(conn, """SELECT COALESCE(SUM(l.debit-l.credit),0) AS v FROM voucher_lines l
                JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
                WHERE v.period=? AND l.subject_code=?
                AND (l.project_id IS ? OR ? IS NULL)""",
                (doc["period"], doc["subject_code"], doc["project_id"], doc["project_id"]))["v"]
        budgets = q(conn, """SELECT amount FROM budgets WHERE period=? AND subject_code=?
                    AND (project_id IS ? OR project_id IS NULL)""",
                    (doc["period"], doc["subject_code"], doc["project_id"]))
        if budgets:
            limit = sum(b["amount"] for b in budgets)
            if spent + amount > limit + 0.005:
                pname = one(conn, "SELECT name FROM projects WHERE id=?", (doc["project_id"],))
                pname = pname["name"] if pname else ""
                raise ApiError(f"预算控制：该期间「{pname or doc['subject_code']}」预算 ¥{limit:,.2f}，已用 ¥{spent:,.2f}，本笔 ¥{amount:,.2f} 将超支 ¥{spent+amount-limit:,.2f}")
    vid = create_voucher(conn, {
        "voucher_date": doc["doc_date"], "voucher_type": vtype,
        "summary": f"{doc_label(t)} {doc['doc_no']} {doc['reason'] or ''}".strip(),
        "maker": actor, "source_doc_id": doc_id, "lines": lines
    }, actor, auto_post=True)
    no = one(conn, "SELECT voucher_no FROM vouchers WHERE id=?", (vid,))["voucher_no"]
    status = "cleared" if t == "advance" else "settled"
    conn.execute("UPDATE docs SET status=?,voucher_id=?,updated_at=? WHERE id=?",
                 (status, vid, now(), doc_id))
    if t == "reimbursement" and doc["advance_id"]:
        conn.execute("UPDATE docs SET status='cleared',updated_at=? WHERE id=? AND status='settled'",
                     (now(), doc["advance_id"]))
        log(conn, "借款核销", "doc", doc["advance_id"], f"由报销单 {doc['doc_no']} 冲抵", actor)
    log(conn, "单据结算", "doc", doc_id, f"{doc['doc_no']} 生成凭证 {no}", actor)
    return {"voucher_id": vid, "voucher_no": no}


# ---------------- 单据 ----------------
@route("GET", r"/api/docs")
def list_docs(conn, m, body, qs):
    status = (qs.get("status") or [""])[0]
    typ = (qs.get("type") or [""])[0]
    sql = """SELECT d.*, s.name AS subject_name, p.name AS project_name, c.name AS counterparty_name,
                    v.voucher_no
             FROM docs d LEFT JOIN subjects s ON s.code=d.subject_code
             LEFT JOIN projects p ON p.id=d.project_id
             LEFT JOIN counterparties c ON c.id=d.counterparty_id
             LEFT JOIN vouchers v ON v.id=d.voucher_id WHERE 1=1"""
    args = []
    if status:
        sql += " AND d.status=?"; args.append(status)
    if typ:
        sql += " AND d.doc_type=?"; args.append(typ)
    sql += " ORDER BY d.doc_date DESC, d.id DESC LIMIT 500"
    return {"items": q(conn, sql, args)}


@route("POST", r"/api/docs")
def add_doc(conn, m, body, qs):
    t = body.get("doc_type")
    if t not in ("payment", "receipt", "advance", "reimbursement"):
        raise ApiError("单据类型无效")
    d = body.get("doc_date") or datetime.now().strftime("%Y-%m-%d")
    amount = float(body.get("amount") or 0)
    if amount <= 0:
        raise ApiError("金额必须大于 0")
    if not body.get("subject_code"):
        raise ApiError("请选择对方科目")
    period = period_of(d)
    ensure_period(conn, period); assert_open(conn, period)
    prefix = {"payment": "FK", "receipt": "SK", "advance": "JZ", "reimbursement": "BX"}[t]
    no = next_no(conn, "docs", "doc_no", prefix, d)
    account_kind = body.get("account_kind") or "cash"
    bank_id = default_bank_id(conn) if account_kind == "bank" else None
    cur = conn.execute("""INSERT INTO docs(doc_no,doc_type,doc_date,period,amount,account_kind,
        bank_account_id,subject_code,project_id,counterparty_id,applicant,dept,reason,advance_id,
        status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (no, t, d, period, amount, account_kind, bank_id, body["subject_code"],
         body.get("project_id"), body.get("counterparty_id"), body.get("applicant") or "",
         body.get("dept") or "", body.get("reason") or "", body.get("advance_id"),
         "draft", now(), now()))
    log(conn, "新增单据", "doc", cur.lastrowid, f"{doc_label(t)} {no} 金额 {amount:.2f}",
        body.get("applicant") or "系统")
    return {"id": cur.lastrowid, "doc_no": no}


@route("POST", r"/api/docs/(\d+)/(submit|approve|reject|settle|delete)")
def doc_action(conn, m, body, qs):
    did, action = int(m.group(1)), m.group(2)
    doc = one(conn, "SELECT * FROM docs WHERE id=?", (did,))
    if not doc:
        raise ApiError("单据不存在", 404)
    assert_open(conn, doc["period"])
    if action == "delete":
        if doc["status"] != "draft":
            raise ApiError("只有草稿单据可以删除")
        conn.execute("DELETE FROM docs WHERE id=?", (did,))
        log(conn, "删除单据", "doc", did, doc["doc_no"], body.get("actor") or "系统")
        return {"ok": True}
    flow = {"submit": ("draft", "submitted", "提交审批"),
            "approve": ("submitted", "approved", "审批通过"),
            "reject": ("submitted", "rejected", "审批驳回"),
            "settle": ("approved", None, "收付款办理")}
    need, nxt, label = flow[action]
    if doc["status"] != need:
        raise ApiError(f"当前状态「{doc['status']}」不允许「{label}」")
    if action == "settle":
        who = body.get("actor") or "出纳"
        if setting(conn, "separate_duties", "1") == "1" and doc["applicant"] and who == doc["applicant"]:
            raise ApiError(f"职责分离：申请人「{doc['applicant']}」不能自行办理收付款，请由出纳操作")
        r = settle_doc(conn, did, who)
        return {"ok": True, **r}
    who = body.get("actor") or "系统"
    if action == "approve" and setting(conn, "separate_duties", "1") == "1" and doc["applicant"] and who == doc["applicant"]:
        raise ApiError(f"职责分离：申请人「{doc['applicant']}」不能审批自己的单据")
    if action == "approve":
        conn.execute("UPDATE docs SET status=?,approved_by=?,updated_at=? WHERE id=?", (nxt, who, now(), did))
    else:
        conn.execute("UPDATE docs SET status=?,updated_at=? WHERE id=?", (nxt, now(), did))
    log(conn, label, "doc", did, doc["doc_no"], who)
    return {"ok": True, "status": nxt}


# ---------------- 凭证 ----------------
@route("GET", r"/api/vouchers")
def list_vouchers(conn, m, body, qs):
    rows = q(conn, """SELECT v.*, (SELECT COUNT(*) FROM voucher_lines l WHERE l.voucher_id=v.id) AS line_count,
                      (SELECT COUNT(*) FROM vouchers r WHERE r.reversal_of=v.id) AS reversed
                      FROM vouchers v ORDER BY v.voucher_date DESC, v.id DESC LIMIT 500""")
    for v in rows:
        v["lines"] = q(conn, """SELECT l.*, s.name AS subject_name FROM voucher_lines l
                                LEFT JOIN subjects s ON s.code=l.subject_code
                                WHERE l.voucher_id=? ORDER BY l.line_no""", (v["id"],))
    return {"items": rows}


@route("POST", r"/api/vouchers")
def add_voucher(conn, m, body, qs):
    vid = create_voucher(conn, body, body.get("maker") or "会计", auto_post=bool(body.get("auto_post")))
    return {"id": vid, "voucher_no": one(conn, "SELECT voucher_no FROM vouchers WHERE id=?", (vid,))["voucher_no"]}


@route("POST", r"/api/vouchers/(\d+)/(submit|approve|post|void|reverse)")
def voucher_action(conn, m, body, qs):
    vid, action = int(m.group(1)), m.group(2)
    v = one(conn, "SELECT * FROM vouchers WHERE id=?", (vid,))
    if not v:
        raise ApiError("凭证不存在", 404)
    assert_open(conn, v["period"])
    who = body.get("actor") or "系统"
    strict = setting(conn, "separate_duties", "1") == "1"
    if action == "reverse":
        return reverse_voucher(conn, vid, who, body.get("reason") or "")
    if action == "void":
        if v["status"] == "posted":
            raise ApiError("已过账凭证不能作废，请使用「红字冲销」")
        conn.execute("UPDATE vouchers SET status='void' WHERE id=?", (vid,))
        log(conn, "作废凭证", "voucher", vid, v["voucher_no"], who)
        return {"ok": True}
    need = {"submit": "draft", "approve": "submitted", "post": "approved"}[action]
    if action == "post":
        if v["status"] not in ("draft", "approved", "submitted"):
            raise ApiError(f"当前状态「{v['status']}」不允许过账")
        if strict:
            if v["status"] != "approved":
                raise ApiError("职责分离：凭证必须先由他人审核通过才能过账（不允许直接过账）")
            if v.get("approved_by") and who == v["approved_by"]:
                raise ApiError("职责分离：审核人不能同时执行过账")
            if v["maker"] and who == v["maker"]:
                raise ApiError("职责分离：制单人不能过账自己的凭证")
        post_voucher(conn, vid, who)
        conn.execute("UPDATE vouchers SET posted_by=? WHERE id=?", (who, vid))
        return {"ok": True, "status": "posted"}
    if v["status"] != need:
        raise ApiError(f"当前状态「{v['status']}」不允许该操作（需先完成前置审核）")
    if action == "approve" and strict and v["maker"] and who == v["maker"]:
        raise ApiError(f"职责分离：制单人「{v['maker']}」不能审核自己的凭证")
    nxt = {"submit": "submitted", "approve": "approved"}[action]
    if action == "approve":
        conn.execute("UPDATE vouchers SET status=?,approved_by=? WHERE id=?", (nxt, who, vid))
    else:
        conn.execute("UPDATE vouchers SET status=? WHERE id=?", (nxt, vid))
    log(conn, {"submit": "提交审核", "approve": "审核通过"}[action], "voucher", vid,
        v["voucher_no"], who)
    return {"ok": True, "status": nxt}


def reverse_voucher(conn, vid, who, reason):
    """红字冲销：不删改原凭证与分录，生成一张反向凭证并过账，双方净额为零"""
    v = one(conn, "SELECT * FROM vouchers WHERE id=?", (vid,))
    if v["status"] != "posted":
        raise ApiError("只有已过账凭证可以冲销")
    if one(conn, "SELECT id FROM vouchers WHERE reversal_of=?", (vid,)):
        raise ApiError("该凭证已冲销，请勿重复操作")
    if strict_duties := (setting(conn, "separate_duties", "1") == "1"):
        if v["maker"] and who == v["maker"]:
            raise ApiError("职责分离：制单人不能冲销自己的凭证，请由第二人操作")
    lines = q(conn, "SELECT * FROM voucher_lines WHERE voucher_id=? ORDER BY line_no", (vid,))
    rev = [{"subject_code": ln["subject_code"], "summary": f"冲销 {v['voucher_no']} {reason}".strip(),
            "debit": ln["credit"], "credit": ln["debit"],
            "project_id": ln["project_id"], "counterparty_id": ln["counterparty_id"]}
           for ln in lines]
    no = v["voucher_no"] + "-冲"
    if one(conn, "SELECT id FROM vouchers WHERE voucher_no=?", (no,)):
        no = no + str(int(datetime.now().timestamp()))
    new_id = create_voucher(conn, {
        "voucher_no": no, "voucher_date": v["voucher_date"], "voucher_type": v["voucher_type"],
        "summary": f"红字冲销 {v['voucher_no']}｜{reason or '更正错账'}", "maker": who,
        "source_doc_id": v["source_doc_id"], "lines": rev}, who, auto_post=True)
    conn.execute("UPDATE vouchers SET reversal_of=? WHERE id=?", (vid, new_id))
    log(conn, "红字冲销", "voucher", vid, f"{v['voucher_no']} → {no}，原因：{reason or '更正错账'}", who)
    return {"ok": True, "reversal_id": new_id, "reversal_no": no}


# ---------------- 日记账 ----------------
@route("GET", r"/api/journal")
def list_journal(conn, m, body, qs):
    sql = """SELECT j.*, s.name AS subject_name, p.name AS project_name,
                    c.name AS counterparty_name, v.voucher_no
             FROM journal j LEFT JOIN subjects s ON s.code=j.subject_code
             LEFT JOIN projects p ON p.id=j.project_id
             LEFT JOIN counterparties c ON c.id=j.counterparty_id
             LEFT JOIN vouchers v ON v.id=j.voucher_id WHERE 1=1"""
    args = []
    for key, col in (("kind", "j.account_kind"), ("month", "j.period"), ("recon", "j.recon_status")):
        val = (qs.get(key) or [""])[0]
        if val:
            sql += f" AND {col}=?"; args.append(val)
    for key, col, op in (("from", "j.journal_date", ">="), ("to", "j.journal_date", "<=")):
        val = (qs.get(key) or [""])[0]
        if val:
            sql += f" AND {col}{op}?"; args.append(val)
    sql += " ORDER BY j.journal_date DESC, j.id DESC LIMIT 1000"
    return {"items": q(conn, sql, args)}


@route("POST", r"/api/journal/manual")
def manual_journal(conn, m, body, qs):
    """出纳直接登记现金/银行收支：后台自动补齐一张凭证并过账"""
    d = body.get("date") or datetime.now().strftime("%Y-%m-%d")
    amount = float(body.get("amount") or 0)
    direction = body.get("direction")
    if direction not in ("in", "out") or amount <= 0:
        raise ApiError("请选择收/付方向并填写金额")
    kind = body.get("account_kind") or "cash"
    cash_code = "1001" if kind == "cash" else "1002"
    other = body.get("subject_code")
    if not other:
        raise ApiError("请选择对方科目")
    lines = ([{"subject_code": cash_code, "debit": amount, "credit": 0},
              {"subject_code": other, "debit": 0, "credit": amount}]
             if direction == "in" else
             [{"subject_code": other, "debit": amount, "credit": 0},
              {"subject_code": cash_code, "debit": 0, "credit": amount}])
    for ln in lines:
        ln.update({"project_id": body.get("project_id"),
                   "counterparty_id": body.get("counterparty_id"),
                   "summary": body.get("summary") or ""})
    vid = create_voucher(conn, {"voucher_date": d, "voucher_type": "收" if direction == "in" else "付",
                                "summary": body.get("summary") or "出纳直接登记",
                                "maker": body.get("actor") or "出纳", "lines": lines},
                         body.get("actor") or "出纳", auto_post=True)
    return {"ok": True, "voucher_id": vid}


@route("POST", r"/api/journal/(\d+)/recon")
def journal_recon(conn, m, body, qs):
    jid = int(m.group(1))
    status = body.get("status")
    if status not in ("未核对", "已核对", "已调节"):
        raise ApiError("对账状态无效")
    r = one(conn, "SELECT * FROM journal WHERE id=?", (jid,))
    if not r:
        raise ApiError("日记账记录不存在", 404)
    assert_open(conn, r["period"])
    conn.execute("UPDATE journal SET recon_status=? WHERE id=?", (status, jid))
    log(conn, "对账标记", "journal", jid, f"{status}", body.get("actor") or "出纳")
    return {"ok": True}


@route("POST", r"/api/journal/recon-batch")
def journal_recon_batch(conn, m, body, qs):
    ids = body.get("ids") or []
    status = body.get("status") or "已核对"
    if not ids:
        raise ApiError("没有需要标记的记录")
    for jid in ids:
        r = one(conn, "SELECT period FROM journal WHERE id=?", (jid,))
        if r:
            assert_open(conn, r["period"])
            conn.execute("UPDATE journal SET recon_status=? WHERE id=?", (status, jid))
    log(conn, "批量对账", "journal", None, f"{len(ids)} 笔标记为 {status}", body.get("actor") or "出纳")
    return {"ok": True, "count": len(ids)}


# ---------------- 日结核对 ----------------
@route("GET", r"/api/daily")
def daily(conn, m, body, qs):
    month = (qs.get("month") or [datetime.now().strftime("%Y-%m")])[0]
    out = {}
    for kind in ("cash", "bank"):
        bank_id = default_bank_id(conn) if kind == "bank" else None
        rows = q(conn, """SELECT journal_date,
                    SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS income,
                    SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS expense
                    FROM journal WHERE period=? AND account_kind=? AND bank_account_id IS ?
                    GROUP BY journal_date ORDER BY journal_date""", (month, kind, bank_id))
        bal = opening_of(conn, kind, bank_id)
        items = []
        for r in rows:
            bal += r["income"] - r["expense"]
            chk = one(conn, """SELECT counted_amount FROM daily_checks WHERE check_date=?
                              AND account_kind=? AND bank_account_id IS ?""",
                      (r["journal_date"], kind, bank_id))
            counted = chk["counted_amount"] if chk else None
            items.append({**r, "balance": round(bal, 2), "counted": counted,
                          "diff": None if counted is None else round(counted - bal, 2)})
        out[kind] = {"items": items, "opening": opening_of(conn, kind, bank_id),
                     "closing": round(bal, 2)}
    return out


@route("POST", r"/api/daily/check")
def daily_check(conn, m, body, qs):
    d = body.get("date")
    kind = body.get("account_kind")
    if not d or kind not in ("cash", "bank"):
        raise ApiError("日期或账户类型无效")
    assert_open(conn, period_of(d))
    bank_id = default_bank_id(conn) if kind == "bank" else None
    conn.execute("""INSERT INTO daily_checks(check_date,account_kind,bank_account_id,counted_amount,note)
                    VALUES(?,?,?,?,?) ON CONFLICT(check_date,account_kind,bank_account_id)
                    DO UPDATE SET counted_amount=excluded.counted_amount,note=excluded.note""",
                 (d, kind, bank_id, float(body.get("amount") or 0), body.get("note") or ""))
    log(conn, "日结盘点", "daily_check", d, f"{kind} 实存 {body.get('amount')}", body.get("actor") or "出纳")
    return {"ok": True}


# ---------------- 银行对账单与余额调节 ----------------
@route("GET", r"/api/statements")
def list_statements(conn, m, body, qs):
    return {"items": q(conn, """SELECT st.*, b.name AS bank_name,
                    (SELECT balance_after FROM journal WHERE account_kind='bank' AND id=st.matched_journal_id) AS matched_balance
                    FROM bank_statements st LEFT JOIN bank_accounts b ON b.id=st.bank_account_id
                    ORDER BY st.statement_date DESC, st.id DESC LIMIT 500""")}


@route("POST", r"/api/statements")
def add_statement(conn, m, body, qs):
    items = body.get("items") or [body]
    n = 0
    for it in items:
        d = it.get("date") or it.get("statement_date")
        if not d:
            continue
        assert_open(conn, period_of(d))
        conn.execute("""INSERT INTO bank_statements(statement_date,bank_account_id,description,
                        amount_in,amount_out,created_at) VALUES(?,?,?,?,?,?)""",
                     (d, it.get("bank_account_id") or default_bank_id(conn), it.get("description") or "",
                      float(it.get("amount_in") or 0), float(it.get("amount_out") or 0), now()))
        n += 1
    log(conn, "导入对账单", "bank_statement", None, f"{n} 条", body.get("actor") or "出纳")
    return {"ok": True, "count": n}


@route("POST", r"/api/statements/match")
def match_statements(conn, m, body, qs):
    """严格匹配：方向硬过滤 + 金额精确到分 + 日期窗口；多候选判为歧义，绝不硬猜"""
    stmts = q(conn, "SELECT * FROM bank_statements WHERE matched_journal_id IS NULL")
    matched, ambiguous = 0, 0
    for s in stmts:
        direction = "in" if s["amount_in"] > 0 else "out"
        amount = round(s["amount_in"] if direction == "in" else s["amount_out"], 2)
        if amount <= 0:
            continue
        d0 = datetime.strptime(s["statement_date"], "%Y-%m-%d")
        lo = (d0 - timedelta(days=3)).strftime("%Y-%m-%d")
        hi = (d0 + timedelta(days=3)).strftime("%Y-%m-%d")
        cand = q(conn, """SELECT id,journal_date,amount FROM journal
                    WHERE account_kind='bank' AND direction=? AND ROUND(amount,2)=ROUND(?,2)
                    AND journal_date BETWEEN ? AND ?
                    AND id NOT IN (SELECT matched_journal_id FROM bank_statements WHERE matched_journal_id IS NOT NULL)
                    ORDER BY journal_date, id""", (direction, amount, lo, hi))
        if len(cand) == 1:
            r = cand[0]
            days = abs((datetime.strptime(r["journal_date"], "%Y-%m-%d") - d0).days)
            note = f"强证据：方向一致 + 金额精确 {amount:.2f} + 日期差 {days} 天 → 自动勾对"
            conn.execute("UPDATE bank_statements SET matched_journal_id=?,match_note=? WHERE id=?", (r["id"], note, s["id"]))
            conn.execute("UPDATE journal SET recon_status='已核对' WHERE id=?", (r["id"],))
            matched += 1
        elif len(cand) > 1:
            conn.execute("UPDATE bank_statements SET match_note=? WHERE id=?",
                         (f"歧义：{len(cand)} 笔同金额同方向候选，需人工核对", s["id"]))
            ambiguous += 1
        else:
            conn.execute("UPDATE bank_statements SET match_note=? WHERE id=?",
                         ("未找到金额精确且方向一致的日记账记录", s["id"]))
    log(conn, "自动勾对", "bank_statement", None, f"匹配 {matched} 笔 / 歧义 {ambiguous} 笔", body.get("actor") or "出纳")
    return {"ok": True, "matched": matched, "ambiguous": ambiguous}


@route("GET", r"/api/statements/continuity")
def statement_continuity(conn, m, body, qs):
    """对账单连续性：检查每张单的期末余额是否等于下一张单的期初余额"""
    rows = q(conn, "SELECT * FROM bank_statements ORDER BY statement_date, id")
    b = one(conn, "SELECT opening_balance FROM bank_accounts WHERE id=?", (default_bank_id(conn),))
    bal = b["opening_balance"] if b else 0
    issues, daily = [], []
    for r in rows:
        bal += r["amount_in"] - r["amount_out"]
        daily.append({"date": r["statement_date"], "balance": round(bal, 2)})
    # 同一天多张单时余额应连续；日期跳空只作提示
    for i in range(1, len(daily)):
        if daily[i]["date"] == daily[i - 1]["date"]:
            continue
        gap = (datetime.strptime(daily[i]["date"], "%Y-%m-%d") - datetime.strptime(daily[i - 1]["date"], "%Y-%m-%d")).days
        if gap > 45:
            issues.append(f"{daily[i-1]['date']} → {daily[i]['date']} 间隔 {gap} 天，可能缺失对账单")
    return {"ok": True, "count": len(rows), "closing_balance": round(bal, 2),
            "issues": issues, "balanced": not issues}


@route("GET", r"/api/reconciliation")
def reconciliation(conn, m, body, qs):
    bank_id = default_bank_id(conn)
    b = one(conn, "SELECT * FROM bank_accounts WHERE id=?", (bank_id,))
    book = current_balance(conn, "bank", bank_id)
    stmts = q(conn, "SELECT * FROM bank_statements WHERE bank_account_id=? OR bank_account_id IS NULL", (bank_id,))
    stmt_balance = (b["opening_balance"] if b else 0) + sum(s["amount_in"] - s["amount_out"] for s in stmts)
    unmatched_j = q(conn, """SELECT * FROM journal WHERE account_kind='bank'
                AND id NOT IN (SELECT matched_journal_id FROM bank_statements WHERE matched_journal_id IS NOT NULL)""")
    unmatched_s = [s for s in stmts if not s["matched_journal_id"]]
    bank_unrecorded_in = sum(s["amount_in"] for s in unmatched_s)
    bank_unrecorded_out = sum(s["amount_out"] for s in unmatched_s)
    comp_unrecorded_in = sum(j["amount"] for j in unmatched_j if j["direction"] == "in")
    comp_unrecorded_out = sum(j["amount"] for j in unmatched_j if j["direction"] == "out")
    adj_book = book + bank_unrecorded_in - bank_unrecorded_out
    adj_bank = stmt_balance + comp_unrecorded_in - comp_unrecorded_out
    return {
        "book_balance": round(book, 2), "statement_balance": round(stmt_balance, 2),
        "bank_unrecorded_in": round(bank_unrecorded_in, 2),
        "bank_unrecorded_out": round(bank_unrecorded_out, 2),
        "comp_unrecorded_in": round(comp_unrecorded_in, 2),
        "comp_unrecorded_out": round(comp_unrecorded_out, 2),
        "adjusted_book": round(adj_book, 2), "adjusted_bank": round(adj_bank, 2),
        "balanced": round(adj_book - adj_bank, 2) == 0,
        "unmatched_journal": len(unmatched_j), "unmatched_statements": len(unmatched_s),
        "statement_count": len(stmts), "matched_count": len(stmts) - len(unmatched_s),
    }


# ---------------- 期间与结账 ----------------
@route("GET", r"/api/periods")
def list_periods(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM periods ORDER BY period DESC")}


@route("POST", r"/api/periods/([0-9-]+)/(close|reopen)")
def period_action(conn, m, body, qs):
    period, action = m.group(1), m.group(2)
    ensure_period(conn, period)
    if action == "close":
        ck = closing_checklist(conn, None, None, {"period": [period]})
        failed = [x for x in ck["items"] if x["block"] and not x["pass"]]
        if failed:
            raise ApiError("结账检查未通过：" + "、".join(f"{x['name']} {x['count']} 项" for x in failed))
        conn.execute("UPDATE periods SET status='closed',closed_at=?,closed_by=? WHERE period=?",
                     (now(), body.get("actor") or "会计主管", period))
        log(conn, "月末结账", "period", period, f"{period} 已结账", body.get("actor") or "会计主管")
    else:
        conn.execute("UPDATE periods SET status='open',closed_at=NULL WHERE period=?", (period,))
        log(conn, "反结账", "period", period, f"{period} 已反结账", body.get("actor") or "会计主管")
    return {"ok": True}


# ---------------- 报表 ----------------
@route("GET", r"/api/reports/overview")
def report_overview(conn, m, body, qs):
    month = (qs.get("month") or [datetime.now().strftime("%Y-%m")])[0]
    j = one(conn, """SELECT
        SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS expense,
        COUNT(*) AS cnt FROM journal WHERE period=?""", (month,)) or {}
    return {
        "month": month,
        "cash_balance": current_balance(conn, "cash"),
        "bank_balance": current_balance(conn, "bank", default_bank_id(conn)),
        "income": j.get("income") or 0, "expense": j.get("expense") or 0,
        "entries": j.get("cnt") or 0,
        "pending_docs": one(conn, "SELECT COUNT(*) AS n FROM docs WHERE status IN ('draft','submitted')")["n"],
        "pending_vouchers": one(conn, "SELECT COUNT(*) AS n FROM vouchers WHERE status IN ('draft','submitted','approved')")["n"],
        "unchecked": one(conn, "SELECT COUNT(*) AS n FROM journal WHERE recon_status='未核对'")["n"],
    }


@route("GET", r"/api/reports/monthly")
def report_monthly(conn, m, body, qs):
    return {"items": q(conn, """SELECT period,
        SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS expense,
        COUNT(*) AS cnt FROM journal GROUP BY period ORDER BY period""")}


@route("GET", r"/api/reports/projects")
def report_projects(conn, m, body, qs):
    return {"items": q(conn, """SELECT COALESCE(p.name,'未归属项目') AS project,
        SUM(l.debit) AS debit, SUM(l.credit) AS credit, COUNT(*) AS cnt
        FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
        LEFT JOIN projects p ON p.id=l.project_id
        GROUP BY l.project_id ORDER BY debit DESC""")}


@route("GET", r"/api/reports/subjects")
def report_subjects(conn, m, body, qs):
    return {"items": q(conn, """SELECT l.subject_code, s.name AS subject_name, s.category,
        SUM(l.debit) AS debit, SUM(l.credit) AS credit
        FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
        LEFT JOIN subjects s ON s.code=l.subject_code
        GROUP BY l.subject_code ORDER BY l.subject_code""")}


# ---------------- 基础资料 ----------------
@route("GET", r"/api/meta")
def meta(conn, m, body, qs):
    return {
        "subjects": q(conn, "SELECT * FROM subjects WHERE enabled=1 ORDER BY code"),
        "projects": q(conn, "SELECT * FROM projects WHERE enabled=1 ORDER BY id"),
        "counterparties": q(conn, "SELECT * FROM counterparties WHERE enabled=1 ORDER BY id"),
        "bank_accounts": q(conn, "SELECT * FROM bank_accounts WHERE enabled=1 ORDER BY id"),
        "periods": q(conn, "SELECT * FROM periods ORDER BY period DESC"),
        "settings": {r["key"]: r["value"] for r in q(conn, "SELECT * FROM settings")},
        "migrations": q(conn, "SELECT * FROM schema_version ORDER BY version"),
        "database": os.path.relpath(os.path.join(BASE, "data", "journal.db"), BASE),
    }


@route("POST", r"/api/base/(subjects|projects|counterparties|bank_accounts)")
def add_base(conn, m, body, qs):
    table = m.group(1)
    name = (body.get("name") or "").strip()
    if not name:
        raise ApiError("名称不能为空")
    if table == "subjects":
        code = (body.get("code") or "").strip()
        if not code:
            raise ApiError("科目编码不能为空")
        conn.execute("""INSERT INTO subjects(code,name,category,direction) VALUES(?,?,?,?)""",
                     (code, name, body.get("category") or "资产", body.get("direction") or "借"))
    elif table == "bank_accounts":
        conn.execute("""INSERT INTO bank_accounts(name,bank_name,account_no,opening_balance)
                        VALUES(?,?,?,?)""",
                     (name, body.get("bank_name") or "", body.get("account_no") or "",
                      float(body.get("opening_balance") or 0)))
    else:
        kind = "kind" if table == "counterparties" else None
        if kind:
            conn.execute("INSERT INTO counterparties(name,kind) VALUES(?,?)",
                         (name, body.get("kind") or "客户"))
        else:
            conn.execute("INSERT INTO projects(name) VALUES(?)", (name,))
    log(conn, "新增基础资料", table, None, name, body.get("actor") or "系统")
    return {"ok": True}


@route("DELETE", r"/api/base/(subjects|projects|counterparties|bank_accounts)/(\d+|[A-Za-z0-9]+)")
def del_base(conn, m, body, qs):
    table, key = m.group(1), m.group(2)
    col = "code" if table == "subjects" else "id"
    conn.execute(f"UPDATE {table} SET enabled=0 WHERE {col}=?", (key,))
    log(conn, "停用基础资料", table, key, "")
    return {"ok": True}


@route("POST", r"/api/settings")
def save_settings(conn, m, body, qs):
    for k, v in (body.get("settings") or {}).items():
        conn.execute("""INSERT INTO settings(key,value) VALUES(?,?)
                        ON CONFLICT(key) DO UPDATE SET value=excluded.value""", (k, str(v)))
    log(conn, "修改设置", "settings", None, json.dumps(body.get("settings") or {}, ensure_ascii=False))
    return {"ok": True}


@route("GET", r"/api/audit")
def list_audit(conn, m, body, qs):
    sql = "SELECT * FROM audit_logs WHERE 1=1"
    args = []
    for key, col, op in (("from", "DATE(at)", ">="), ("to", "DATE(at)", "<="),
                         ("actor", "actor", "="), ("entity", "entity", "=")):
        val = (qs.get(key) or [""])[0]
        if val:
            sql += f" AND {col}{op}?"; args.append(val)
    kw = (qs.get("q") or [""])[0]
    if kw:
        sql += " AND (action LIKE ? OR detail LIKE ? OR entity_id LIKE ? OR COALESCE(actor,'') LIKE ?)"
        args += [f"%{kw}%"] * 4
    sql += " ORDER BY id DESC LIMIT 1000"
    return {"items": q(conn, sql, args)}


# ---------------- 备份 / 迁移 / 导出 ----------------
TABLES = ["subjects", "projects", "counterparties", "bank_accounts", "periods", "openings",
          "docs", "vouchers", "voucher_lines", "journal", "bank_statements", "daily_checks",
          "audit_logs", "settings", "attachments", "import_logs", "invoices", "budgets",
          "assets", "asset_depreciations", "opening_balances", "period_closings",
          "voucher_templates", "report_snapshots"]


@route("GET", r"/api/backup")
def backup(conn, m, body, qs):
    data = {"_format": "journal-pro-backup", "_version": 1, "_exported_at": now(),
            "tables": {t: q(conn, f"SELECT * FROM {t}") for t in TABLES}}
    return data


@route("POST", r"/api/restore")
def restore(conn, m, body, qs):
    """迁移/恢复：全量替换业务数据（需前端显式确认）"""
    if not body.get("confirm"):
        raise ApiError("恢复备份会覆盖现有全部数据，请先确认")
    data = body.get("data") or body
    tables = data.get("tables")
    if not isinstance(tables, dict):
        raise ApiError("备份文件格式不正确")
    with conn:
        conn.execute("PRAGMA defer_foreign_keys = ON")
        # 账本不可变触发器仅对业务写入生效；全量恢复时临时摘除并原样重建
        triggers = [r["name"] for r in q(conn, "SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'trg_%'")]
        for t in triggers:
            conn.execute(f"DROP TRIGGER IF EXISTS {t}")
        try:
            for t in reversed(TABLES):
                conn.execute(f"DELETE FROM {t}")
            for t in TABLES:
                rows = tables.get(t) or []
                for r in rows:
                    if not r:
                        continue
                    cols = list(r.keys())
                    sql = f"INSERT OR REPLACE INTO {t}({','.join(cols)}) VALUES({','.join('?'*len(cols))})"
                    conn.execute(sql, [r[c] for c in cols])
            audit(conn, "恢复备份", "system", None, f"导入 {sum(len(tables.get(t) or []) for t in TABLES)} 行")
        finally:
            conn.executescript("""
CREATE TRIGGER IF NOT EXISTS trg_journal_immutable BEFORE UPDATE ON journal
WHEN OLD.amount <> NEW.amount OR OLD.direction <> NEW.direction
  OR OLD.journal_date <> NEW.journal_date OR OLD.voucher_id IS NOT NEW.voucher_id
BEGIN SELECT RAISE(ABORT, '已登记日记账不可修改，请使用红字冲销'); END;
CREATE TRIGGER IF NOT EXISTS trg_journal_no_delete BEFORE DELETE ON journal
BEGIN SELECT RAISE(ABORT, '已登记日记账不可删除，更正请使用红字冲销'); END;
CREATE TRIGGER IF NOT EXISTS trg_vline_immutable BEFORE UPDATE ON voucher_lines
WHEN (SELECT status FROM vouchers WHERE id = OLD.voucher_id) = 'posted'
BEGIN SELECT RAISE(ABORT, '已过账凭证分录不可修改，请使用红字冲销'); END;
CREATE TRIGGER IF NOT EXISTS trg_vline_no_delete BEFORE DELETE ON voucher_lines
WHEN (SELECT status FROM vouchers WHERE id = OLD.voucher_id) = 'posted'
BEGIN SELECT RAISE(ABORT, '已过账凭证分录不可删除'); END;
""")
    return {"ok": True, "restored": sum(len(tables.get(t) or []) for t in TABLES)}


@route("GET", r"/api/export/journal\.csv")
def export_csv(conn, m, body, qs):
    rows = q(conn, """SELECT j.*, s.name AS subject_name, p.name AS project_name, v.voucher_no
                      FROM journal j LEFT JOIN subjects s ON s.code=j.subject_code
                      LEFT JOIN projects p ON p.id=j.project_id
                      LEFT JOIN vouchers v ON v.id=j.voucher_id
                      ORDER BY j.journal_date, j.id""")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["日期", "账户", "凭证号", "摘要", "对方科目", "项目", "收入", "支出", "结余", "对账状态"])
    for r in rows:
        w.writerow([r["journal_date"], "库存现金" if r["account_kind"] == "cash" else "银行存款",
                    r["voucher_no"] or "", r["summary"] or "", r["subject_name"] or r["subject_code"] or "",
                    r["project_name"] or "", r["amount"] if r["direction"] == "in" else "",
                    r["amount"] if r["direction"] == "out" else "", r["balance_after"], r["recon_status"]])
    return {"_csv": buf.getvalue()}


@route("POST", r"/api/recalc")
def recalc_all(conn, m, body, qs):
    """期初余额等参数变更后，重算所有账户的逐笔结余"""
    for kind in ("cash", "bank"):
        recalc_balances(conn, kind, default_bank_id(conn) if kind == "bank" else None)
    log(conn, "重算余额", "system", None, "参数变更后重算", body.get("actor") or "系统")
    return {"ok": True}


@route("GET", r"/api/health")
def health(conn, m, body, qs):
    return {"ok": True, "time": now(),
            "migrations": [r["version"] for r in q(conn, "SELECT version FROM schema_version ORDER BY version")],
            "db_size": os.path.getsize(os.path.join(BASE, "data", "journal.db"))}


# ---------------- 内控 / 发票 / 预算 / 账簿报表 ----------------
@route("GET", r"/api/audit/verify")
def audit_verify(conn, m, body, qs):
    return verify_audit_chain(conn)


@route("GET", r"/api/compliance")
def compliance(conn, m, body, qs):
    triggers = q(conn, "SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'trg_%' ORDER BY name")
    return {
        "separate_duties": setting(conn, "separate_duties", "1") == "1",
        "budget_control": setting(conn, "budget_control", "1") == "1",
        "triggers": [t["name"] for t in triggers],
        "chain": verify_audit_chain(conn),
        "policies": [
            "借贷平衡在写路径强制校验，不平不允许保存",
            "已登记日记账与已过账分录由数据库触发器禁止改删",
            "更正只走红字冲销，原凭证与分录永久保留",
            "审计日志与业务写入同一事务，并按前序哈希成链",
            "制单-审核-过账职责分离（可在系统管理中关闭）",
            "银行对账方向硬过滤、金额精确到分、歧义不自动匹配",
            "期末结账前执行检查清单，未通过项阻断结账",
        ],
    }


@route("GET", r"/api/invoices")
def list_invoices(conn, m, body, qs):
    rows = q(conn, """SELECT i.*, c.name AS counterparty_name, s.name AS subject_name,
               p.name AS project_name, v.voucher_no FROM invoices i
               LEFT JOIN counterparties c ON c.id=i.counterparty_id
               LEFT JOIN subjects s ON s.code=i.subject_code
               LEFT JOIN projects p ON p.id=i.project_id
               LEFT JOIN vouchers v ON v.id=i.voucher_id ORDER BY i.invoice_date DESC, i.id DESC""")
    return {"items": rows,
            "stats": {"total": len(rows),
                      "unposted": sum(1 for r in rows if r["status"] == "未入账"),
                      "open": sum(1 for r in rows if r["status"] in ("未入账", "已入账")),
                      "amount": sum(r["total_amount"] for r in rows)}}


@route("POST", r"/api/invoices")
def add_invoice(conn, m, body, qs):
    d = body.get("invoice_date") or datetime.now().strftime("%Y-%m-%d")
    no = (body.get("invoice_no") or "").strip()
    kind = body.get("kind")
    if not no or kind not in ("进项", "销项"):
        raise ApiError("请填写发票号码与类型")
    if one(conn, "SELECT id FROM invoices WHERE invoice_no=? AND kind=?", (no, kind)):
        raise ApiError(f"发票号「{no}」已存在，疑似重复入账（发票查重）")
    amount = float(body.get("amount") or 0)
    tax = float(body.get("tax_amount") or 0)
    if amount <= 0:
        raise ApiError("不含税金额必须大于 0")
    period = period_of(d)
    ensure_period(conn, period); assert_open(conn, period)
    cur = conn.execute("""INSERT INTO invoices(invoice_no,invoice_code,kind,invoice_date,period,
                counterparty_id,amount,tax_amount,total_amount,subject_code,project_id,status,note,created_at)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (no, body.get("invoice_code") or "", kind, d, period, body.get("counterparty_id"),
         amount, tax, round(amount + tax, 2), body.get("subject_code") or "",
         body.get("project_id"), "未入账", body.get("note") or "", now()))
    log(conn, "登记发票", "invoice", cur.lastrowid, f"{kind} {no} ¥{amount+tax:.2f}", body.get("actor") or "系统")
    return {"ok": True, "id": cur.lastrowid}


@route("POST", r"/api/invoices/(\d+)/(post|settle|void)")
def invoice_action(conn, m, body, qs):
    iid, action = int(m.group(1)), m.group(2)
    inv = one(conn, "SELECT * FROM invoices WHERE id=?", (iid,))
    if not inv:
        raise ApiError("发票不存在", 404)
    assert_open(conn, inv["period"])
    who = body.get("actor") or "会计"
    if action == "void":
        conn.execute("UPDATE invoices SET status='已作废' WHERE id=?", (iid,))
        log(conn, "作废发票", "invoice", iid, inv["invoice_no"], who)
        return {"ok": True}
    if action == "settle":
        if inv["status"] != "已入账":
            raise ApiError("只有已入账发票可以核销")
        conn.execute("UPDATE invoices SET status='已核销' WHERE id=?", (iid,))
        log(conn, "发票核销", "invoice", iid, inv["invoice_no"], who)
        return {"ok": True}
    if inv["status"] != "未入账":
        raise ApiError("该发票已生成凭证，不能重复入账")
    subj = inv["subject_code"] or ("6602" if inv["kind"] == "进项" else "6001")
    total = inv["total_amount"]
    if inv["kind"] == "进项":
        lines = [{"subject_code": subj, "debit": inv["amount"], "credit": 0},
                 {"subject_code": "2221", "debit": inv["tax_amount"], "credit": 0} if inv["tax_amount"] > 0 else None,
                 {"subject_code": "2202", "debit": 0, "credit": total}]
    else:
        lines = [{"subject_code": "1122", "debit": total, "credit": 0},
                 {"subject_code": subj, "debit": 0, "credit": inv["amount"]},
                 {"subject_code": "2221", "debit": 0, "credit": inv["tax_amount"]} if inv["tax_amount"] > 0 else None]
    lines = [x for x in lines if x]
    for ln in lines:
        ln.update({"project_id": inv["project_id"], "counterparty_id": inv["counterparty_id"],
                   "summary": f"{inv['kind']}发票 {inv['invoice_no']}"})
    vid = create_voucher(conn, {"voucher_date": inv["invoice_date"],
        "voucher_type": "转", "summary": f"{inv['kind']}发票 {inv['invoice_no']} 入账",
        "maker": who, "lines": lines}, who, auto_post=True)
    conn.execute("UPDATE invoices SET status='已入账',voucher_id=? WHERE id=?", (vid, iid))
    log(conn, "发票生成凭证", "invoice", iid, f"{inv['invoice_no']} → 凭证 {vid}", who)
    return {"ok": True, "voucher_id": vid}


@route("GET", r"/api/budgets")
def list_budgets(conn, m, body, qs):
    return {"items": q(conn, """SELECT b.*, s.name AS subject_name, p.name AS project_name
            FROM budgets b LEFT JOIN subjects s ON s.code=b.subject_code
            LEFT JOIN projects p ON p.id=b.project_id ORDER BY b.period DESC, b.id""")}


@route("POST", r"/api/budgets")
def add_budget(conn, m, body, qs):
    period = body.get("period")
    amount = float(body.get("amount") or 0)
    if not period or amount <= 0:
        raise ApiError("请填写期间与预算金额")
    conn.execute("""INSERT INTO budgets(period,subject_code,project_id,amount,note) VALUES(?,?,?,?,?)
                    ON CONFLICT(period,subject_code,project_id) DO UPDATE SET amount=excluded.amount,note=excluded.note""",
                 (period, body.get("subject_code") or None, body.get("project_id") or None,
                  amount, body.get("note") or ""))
    log(conn, "设置预算", "budget", period, f"{body.get('subject_code') or ''} ¥{amount:,.2f}", body.get("actor") or "系统")
    return {"ok": True}


@route("DELETE", r"/api/budgets/(\d+)")
def del_budget(conn, m, body, qs):
    conn.execute("DELETE FROM budgets WHERE id=?", (int(m.group(1)),))
    log(conn, "删除预算", "budget", m.group(1), "")
    return {"ok": True}


@route("GET", r"/api/reports/trialbalance")
def report_trialbalance(conn, m, body, qs):
    """科目余额表：期初 + 本期借贷发生额 → 期末（按科目余额方向）"""
    period = (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]
    rows = q(conn, """SELECT l.subject_code, s.name AS subject_name, s.category, s.direction,
               SUM(l.debit) AS debit, SUM(l.credit) AS credit
               FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
               LEFT JOIN subjects s ON s.code=l.subject_code
               WHERE v.period=? GROUP BY l.subject_code ORDER BY l.subject_code""", (period,))
    openings = {"1001": float(setting(conn, "cash_opening", "0") or 0)}
    b = one(conn, "SELECT opening_balance FROM bank_accounts WHERE id=?", (default_bank_id(conn),))
    openings["1002"] = b["opening_balance"] if b else 0
    for ob in q(conn, "SELECT subject_code,debit,credit FROM opening_balances WHERE period=?", (period,)):
        openings[ob["subject_code"]] = round(ob["debit"] - ob["credit"], 2)
    out = []
    for r in rows:
        op = openings.get(r["subject_code"], 0)
        sign = 1 if (r["direction"] or "借") == "借" else -1
        closing = op + sign * (r["debit"] - r["credit"])
        out.append({**r, "opening": round(op, 2), "closing": round(closing, 2)})
    return {"period": period, "items": out,
            "debit_total": round(sum(r["debit"] for r in rows), 2),
            "credit_total": round(sum(r["credit"] for r in rows), 2),
            "balanced": round(sum(r["debit"] for r in rows) - sum(r["credit"] for r in rows), 2) == 0}


@route("GET", r"/api/reports/ledger")
def report_ledger(conn, m, body, qs):
    """科目明细账（含逐笔余额）"""
    code = (qs.get("subject") or [""])[0]
    period = (qs.get("period") or [""])[0]
    sql = """SELECT v.voucher_date,v.voucher_no,v.summary,l.debit,l.credit,l.subject_code
             FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
             WHERE 1=1"""
    args = []
    if code:
        sql += " AND l.subject_code=?"; args.append(code)
    if period:
        sql += " AND v.period=?"; args.append(period)
    sql += " ORDER BY v.voucher_date,l.id"
    rows = q(conn, sql, args)
    subj = one(conn, "SELECT * FROM subjects WHERE code=?", (code,)) if code else None
    is_debit = not subj or (subj["direction"] or "借") == "借"
    bal = 0.0
    for r in rows:
        bal += (r["debit"] - r["credit"]) if is_debit else (r["credit"] - r["debit"])
        r["balance"] = round(bal, 2)
    return {"items": rows, "subject": code, "subject_name": subj["name"] if subj else ""}


@route("GET", r"/api/reports/aging")
def report_aging(conn, m, body, qs):
    """往来账龄：按发票日期分 0-30 / 31-60 / 61-90 / 90+ 天"""
    rows = q(conn, """SELECT i.*, c.name AS counterparty_name FROM invoices i
            LEFT JOIN counterparties c ON c.id=i.counterparty_id
            WHERE i.status IN ('未入账','已入账') ORDER BY i.invoice_date""")
    buckets = {"0-30天": 0.0, "31-60天": 0.0, "61-90天": 0.0, "90天以上": 0.0}
    items = []
    for r in rows:
        days = max(0, (datetime.now().date() - datetime.strptime(r["invoice_date"], "%Y-%m-%d").date()).days)
        b = "0-30天" if days <= 30 else ("31-60天" if days <= 60 else ("61-90天" if days <= 90 else "90天以上"))
        buckets[b] += r["total_amount"]
        items.append({**r, "days": days, "bucket": b,
                      "direction": "应收" if r["kind"] == "销项" else "应付"})
    return {"items": items, "buckets": {k: round(v, 2) for k, v in buckets.items()}}


@route("GET", r"/api/reports/cashflow")
def report_cashflow(conn, m, body, qs):
    """现金流量简表：按对方科目归集经营收支。

    scope=all（默认，兼容账簿分析页全量）| current（当月）| through（截至所选期间）
    | ytd（本年 1 月至所选期间）。period 形如 2026-11。
    """
    period = (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]
    scope = (qs.get("scope") or ["all"])[0]
    cond, args = "", ()
    if scope == "current":
        cond, args = "WHERE substr(j.journal_date,1,7)=?", (period,)
    elif scope == "through":
        cond, args = "WHERE substr(j.journal_date,1,7)<=?", (period,)
    elif scope == "ytd":
        cond, args = "WHERE substr(j.journal_date,1,7) BETWEEN ? AND ?", (period[:4] + "-01", period)
    rows = q(conn, f"""SELECT j.subject_code, s.name AS subject_name, j.direction,
               SUM(j.amount) AS amount, COUNT(*) AS cnt FROM journal j
               LEFT JOIN subjects s ON s.code=j.subject_code
               {cond}
               GROUP BY j.subject_code, j.direction ORDER BY j.direction, amount DESC""", args)
    inflow = [r for r in rows if r["direction"] == "in"]
    outflow = [r for r in rows if r["direction"] == "out"]
    return {"period": period, "scope": scope, "inflow": inflow, "outflow": outflow,
            "in_total": round(sum(r["amount"] for r in inflow), 2),
            "out_total": round(sum(r["amount"] for r in outflow), 2),
            "net": round(sum(r["amount"] for r in inflow) - sum(r["amount"] for r in outflow), 2)}


@route("GET", r"/api/reports/budget")
def report_budget(conn, m, body, qs):
    period = (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]
    rows = q(conn, """SELECT b.*, s.name AS subject_name, p.name AS project_name FROM budgets b
            LEFT JOIN subjects s ON s.code=b.subject_code LEFT JOIN projects p ON p.id=b.project_id
            WHERE b.period=? ORDER BY b.id""", (period,))
    for r in rows:
        actual = one(conn, """SELECT COALESCE(SUM(l.debit-l.credit),0) AS v FROM voucher_lines l
                JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
                WHERE v.period=? AND (? IS NULL OR l.subject_code=?)
                  AND (? IS NULL OR l.project_id=?)""",
                (period, r["subject_code"], r["subject_code"], r["project_id"], r["project_id"]))
        r["actual"] = round(actual["v"] if actual else 0, 2)
        r["remaining"] = round(r["amount"] - r["actual"], 2)
        r["usage"] = round(r["actual"] / r["amount"] * 100, 1) if r["amount"] else 0
        r["status"] = "超支" if r["actual"] > r["amount"] else ("接近上限" if r["usage"] >= 80 else "正常")
    return {"period": period, "items": rows}


@route("GET", r"/api/closing/checklist")
def closing_checklist(conn, m, body, qs):
    period = (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]
    def n(sql, args=()):
        return one(conn, sql, args)["n"]
    st = one(conn, "SELECT status FROM periods WHERE period=?", (period,))
    items = [
        {"key": "voucher", "name": "未过账凭证", "count": n("SELECT COUNT(*) AS n FROM vouchers WHERE period=? AND status NOT IN ('posted','void')", (period,)), "block": True},
        {"key": "doc", "name": "未完成审批/结算单据", "count": n("SELECT COUNT(*) AS n FROM docs WHERE period=? AND status IN ('draft','submitted','approved')", (period,)), "block": True},
        {"key": "balance", "name": "借贷不平凭证", "count": n("""SELECT COUNT(*) AS n FROM vouchers v WHERE v.period=? AND v.status='posted'
             AND (SELECT ROUND(SUM(debit)-SUM(credit),2) FROM voucher_lines l WHERE l.voucher_id=v.id) <> 0""", (period,)), "block": True},
        {"key": "recon", "name": "未核对日记账流水", "count": n("SELECT COUNT(*) AS n FROM journal WHERE period=? AND recon_status='未核对'", (period,)), "block": False},
        {"key": "statement", "name": "未匹配银行流水", "count": n("SELECT COUNT(*) AS n FROM bank_statements WHERE matched_journal_id IS NULL AND substr(statement_date,1,7)=?", (period,)), "block": False},
        {"key": "ambiguous", "name": "歧义匹配待人工复核", "count": n("SELECT COUNT(*) AS n FROM bank_statements WHERE match_note LIKE '歧义%'", ()), "block": False},
        {"key": "invoice", "name": "未入账发票", "count": n("SELECT COUNT(*) AS n FROM invoices WHERE period=? AND status='未入账'", (period,)), "block": False},
        {"key": "depreciation", "name": "固定资产未计提折旧", "count": n("""SELECT COUNT(*) AS n FROM assets a WHERE a.status='在用' AND a.start_period<=?
             AND NOT EXISTS (SELECT 1 FROM asset_depreciations d WHERE d.asset_id=a.id AND d.period=?)""", (period, period)), "block": False},
        {"key": "carry", "name": "损益未结转", "count": 0 if one(conn, "SELECT id FROM period_closings WHERE period=? AND kind='profit'", (period,)) else 1, "block": False},
        {"key": "budget", "name": "预算超支项", "count": 0, "block": False},
    ]
    budget_rows = report_budget(conn, None, None, {"period": [period]})["items"]
    items[-1]["count"] = sum(1 for x in budget_rows if x["status"] == "超支")
    for it in items:
        it["pass"] = it["count"] == 0
    return {"period": period, "already_closed": bool(st and st["status"] == "closed"),
            "items": items,
            "can_close": all(it["pass"] for it in items if it["block"]) and not (st and st["status"] == "closed")}


@route("POST", r"/api/attachments/link")
def link_attachment(conn, m, body, qs):
    r = one(conn, "SELECT id FROM attachments WHERE id=?", (body.get("id"),))
    if not r:
        raise ApiError("附件不存在", 404)
    conn.execute("UPDATE attachments SET entity_type=?,entity_id=? WHERE id=?",
                 (body.get("entity_type"), body.get("entity_id"), body.get("id")))
    log(conn, "关联附件", "attachment", body.get("id"),
        f"{body.get('entity_type')}#{body.get('entity_id')}", body.get("actor") or "系统")
    return {"ok": True}


# ---------------- 固定资产 / 期初建账 / 损益结转 / 迁移包 ----------------
def monthly_depreciation(a):
    base = a["original_value"] * (1 - a["salvage_rate"])
    return round(base / max(1, a["useful_life_months"]), 2)


@route("GET", r"/api/assets")
def list_assets(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM assets ORDER BY asset_no")
    for r in rows:
        monthly = monthly_depreciation(r)
        cap = round(r["original_value"] * (1 - r["salvage_rate"]), 2)
        r["monthly"] = monthly
        r["net_value"] = round(r["original_value"] - r["accumulated"], 2)
        r["remaining_months"] = max(0, int((cap - r["accumulated"]) / monthly)) if monthly else 0
        r["capitalized"] = bool(one(conn, """SELECT 1 FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id
                WHERE l.subject_code='1601' AND v.summary LIKE ? LIMIT 1""", (f"%{r['asset_no']}%",)))
    return {"items": rows,
            "summary": {"count": len(rows),
                        "original": round(sum(r["original_value"] for r in rows), 2),
                        "accumulated": round(sum(r["accumulated"] for r in rows), 2),
                        "net": round(sum(r["original_value"] - r["accumulated"] for r in rows), 2),
                        "monthly": round(sum(monthly_depreciation(r) for r in rows if r["status"] == "在用"), 2)}}


@route("POST", r"/api/assets")
def add_asset(conn, m, body, qs):
    no = (body.get("asset_no") or "").strip() or next_no(conn, "assets", "asset_no", "FA", body.get("purchase_date") or datetime.now().strftime("%Y-%m-%d"))
    name = (body.get("name") or "").strip()
    if not name:
        raise ApiError("资产名称不能为空")
    d = body.get("purchase_date") or datetime.now().strftime("%Y-%m-%d")
    if one(conn, "SELECT id FROM assets WHERE asset_no=?", (no,)):
        raise ApiError("资产编号重复")
    cur = conn.execute("""INSERT INTO assets(asset_no,name,category,purchase_date,original_value,
            salvage_rate,useful_life_months,start_period,accumulated,expense_subject,dept,status,note,created_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (no, name, body.get("category") or "电子设备", d, float(body.get("original_value") or 0),
         float(body.get("salvage_rate") if body.get("salvage_rate") not in (None, "") else 0.05),
         int(body.get("useful_life_months") or 60), body.get("start_period") or period_of(d),
         0, body.get("expense_subject") or setting(conn, "asset_expense_subject", "6602"),
         body.get("dept") or "", "在用", body.get("note") or "", now()))
    log(conn, "新增固定资产", "asset", cur.lastrowid, f"{no} {name} 原值 {body.get('original_value')}", body.get("actor") or "系统")
    return {"ok": True, "id": cur.lastrowid, "asset_no": no}


@route("POST", r"/api/assets/(\d+)/capitalize")
def asset_capitalize(conn, m, body, qs):
    """固定资产购置入账：借 1601 固定资产 / 贷 银行存款（原值），一次有效"""
    aid = int(m.group(1))
    a = one(conn, "SELECT * FROM assets WHERE id=?", (aid,))
    if not a:
        raise ApiError("资产不存在", 404)
    assert_open(conn, a["start_period"])
    dup = one(conn, """SELECT COUNT(*) AS n FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id
             WHERE l.subject_code='1601' AND v.summary LIKE ?""", (f"%{a['asset_no']}%",))["n"]
    if dup:
        raise ApiError("该资产已生成过购置凭证，请勿重复入账")
    who = body.get("actor") or "会计"
    vid = create_voucher(conn, {"voucher_date": a["purchase_date"], "voucher_type": "转",
        "summary": f"购入固定资产 {a['asset_no']} {a['name']}",
        "maker": who, "lines": [
            {"subject_code": "1601", "debit": a["original_value"], "credit": 0,
             "summary": f"购入 {a['name']}"},
            {"subject_code": "1002", "debit": 0, "credit": a["original_value"],
             "summary": f"购入 {a['name']}"}]}, who, auto_post=True)
    log(conn, "固定资产入账", "asset", aid, f"{a['asset_no']} 原值 {a['original_value']:.2f}", who)
    return {"ok": True, "voucher_id": vid}


@route("POST", r"/api/assets/(\d+)/(dispose|delete)")
def asset_action(conn, m, body, qs):
    aid, action = int(m.group(1)), m.group(2)
    a = one(conn, "SELECT * FROM assets WHERE id=?", (aid,))
    if not a:
        raise ApiError("资产不存在", 404)
    conn.execute("UPDATE assets SET status=? WHERE id=?", ("已清理" if action == "dispose" else "已删除", aid))
    log(conn, "资产处理", "asset", aid, f"{a['asset_no']} → {action}", body.get("actor") or "会计")
    return {"ok": True}


@route("POST", r"/api/assets/depreciate")
def depreciate(conn, m, body, qs):
    period = body.get("period") or datetime.now().strftime("%Y-%m")
    ensure_period(conn, period); assert_open(conn, period)
    who = body.get("actor") or "会计"
    assets = q(conn, "SELECT * FROM assets WHERE status='在用' AND start_period<=?", (period,))
    groups, total, done = {}, 0.0, 0
    for a in assets:
        if one(conn, "SELECT id FROM asset_depreciations WHERE asset_id=? AND period=?", (a["id"], period)):
            continue
        cap = round(a["original_value"] * (1 - a["salvage_rate"]), 2)
        remain = round(cap - a["accumulated"], 2)
        if remain <= 0:
            continue
        amount = min(monthly_depreciation(a), remain)
        if amount <= 0:
            continue
        groups.setdefault(a["expense_subject"] or "6602", []).append((a, amount))
        total += amount
        done += 1
    if not groups:
        raise ApiError("本月没有需要计提折旧的资产（或已计提）")
    lines = []
    for subj, items in groups.items():
        s = round(sum(x[1] for x in items), 2)
        lines.append({"subject_code": subj, "debit": s, "credit": 0,
                      "summary": f"计提折旧（{len(items)} 项）"})
    lines.append({"subject_code": "1602", "debit": 0, "credit": round(total, 2), "summary": f"{period} 计提折旧"})
    vid = create_voucher(conn, {"voucher_date": f"{period}-28", "voucher_type": "转",
                                "summary": f"{period} 固定资产折旧（{done} 项）", "maker": who,
                                "lines": lines}, who, auto_post=True)
    for subj, items in groups.items():
        for a, amount in items:
            conn.execute("INSERT INTO asset_depreciations(asset_id,period,amount,voucher_id,created_at) VALUES(?,?,?,?,?)",
                         (a["id"], period, amount, vid, now()))
            conn.execute("UPDATE assets SET accumulated=ROUND(accumulated+?,2) WHERE id=?", (amount, a["id"]))
    log(conn, "计提折旧", "asset", None, f"{period} 共 {done} 项，合计 {total:.2f}", who)
    return {"ok": True, "count": done, "total": round(total, 2), "voucher_id": vid}


@route("GET", r"/api/assets/schedule")
def asset_schedule(conn, m, body, qs):
    period = (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]
    rows = q(conn, """SELECT a.asset_no,a.name,d.period,d.amount,d.voucher_id FROM asset_depreciations d
            JOIN assets a ON a.id=d.asset_id WHERE d.period=? ORDER BY a.asset_no""", (period,))
    total = one(conn, "SELECT COALESCE(SUM(amount),0) AS v FROM asset_depreciations WHERE period=?", (period,))["v"]
    return {"period": period, "items": rows, "total": round(total, 2)}


@route("POST", r"/api/periods/([0-9-]+)/carry-forward")
def carry_forward(conn, m, body, qs):
    """期末结转损益：损益类科目余额转入本年利润 4103，生成并过账一张结转凭证"""
    period = m.group(1)
    ensure_period(conn, period); assert_open(conn, period)
    if one(conn, "SELECT id FROM period_closings WHERE period=? AND kind='profit'", (period,)):
        raise ApiError("该期间已结转损益，请勿重复操作")
    rows = q(conn, """SELECT l.subject_code,s.name AS subject_name,s.direction,
               SUM(l.debit) AS debit, SUM(l.credit) AS credit FROM voucher_lines l
               JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
               LEFT JOIN subjects s ON s.code=l.subject_code
               WHERE v.period=? AND s.category='损益' GROUP BY l.subject_code""", (period,))
    lines, total = [], 0.0
    for r in rows:
        net = round((r["debit"] or 0) - (r["credit"] or 0), 2)
        if abs(net) < 0.005:
            continue
        if (r["direction"] or "借") == "借":      # 费用类：贷方转出
            lines.append({"subject_code": r["subject_code"], "debit": 0, "credit": net,
                          "summary": f"结转 {r['subject_name']}"})
            lines.append({"subject_code": "4103", "debit": net, "credit": 0, "summary": f"结转 {r['subject_name']}"})
        else:                                      # 收入类：借方转出
            lines.append({"subject_code": r["subject_code"], "debit": net, "credit": 0,
                          "summary": f"结转 {r['subject_name']}"})
            lines.append({"subject_code": "4103", "debit": 0, "credit": net, "summary": f"结转 {r['subject_name']}"})
        total += net
    if not lines:
        raise ApiError("本期没有需要结转的损益类发生额")
    vid = create_voucher(conn, {"voucher_date": f"{period}-28", "voucher_type": "转",
                                "summary": f"{period} 期末结转损益", "maker": body.get("actor") or "会计",
                                "lines": lines}, body.get("actor") or "会计", auto_post=True)
    conn.execute("INSERT INTO period_closings(period,kind,voucher_id,amount,created_at) VALUES(?,?,?,?,?)",
                 (period, "profit", vid, round(total, 2), now()))
    conn.execute("UPDATE vouchers SET is_closing=1 WHERE id=?", (vid,))
    log(conn, "结转损益", "period", period, f"结转凭证 {vid}，净额 {total:.2f}", body.get("actor") or "会计")
    return {"ok": True, "voucher_id": vid, "net": round(total, 2)}


@route("GET", r"/api/openings")
def get_openings(conn, m, body, qs):
    period = (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]
    rows = q(conn, """SELECT ob.*,s.name AS subject_name,s.direction FROM opening_balances ob
            LEFT JOIN subjects s ON s.code=ob.subject_code WHERE ob.period=? ORDER BY ob.subject_code""", (period,))
    return {"period": period, "items": rows,
            "debit_total": round(sum(r["debit"] for r in rows), 2),
            "credit_total": round(sum(r["credit"] for r in rows), 2),
            "balanced": round(sum(r["debit"] for r in rows) - sum(r["credit"] for r in rows), 2) == 0}


@route("POST", r"/api/openings")
def save_openings(conn, m, body, qs):
    period = body.get("period") or datetime.now().strftime("%Y-%m")
    rows = body.get("rows") or []
    dr = round(sum(float(r.get("debit") or 0) for r in rows), 2)
    cr = round(sum(float(r.get("credit") or 0) for r in rows), 2)
    if rows and dr != cr:
        raise ApiError(f"期初余额试算不平：借方 {dr:,.2f} / 贷方 {cr:,.2f}，差额 {dr-cr:,.2f}")
    with conn:
        conn.execute("DELETE FROM opening_balances WHERE period=?", (period,))
        for r in rows:
            if not r.get("subject_code"):
                continue
            if not (float(r.get("debit") or 0) or float(r.get("credit") or 0)):
                continue
            if not one(conn, "SELECT code FROM subjects WHERE code=?", (r["subject_code"],)):
                raise ApiError(f"科目 {r['subject_code']} 不存在")
            conn.execute("INSERT INTO opening_balances(period,subject_code,debit,credit) VALUES(?,?,?,?)",
                         (period, r["subject_code"], float(r.get("debit") or 0), float(r.get("credit") or 0)))
    log(conn, "期初建账", "opening", period, f"{len(rows)} 个科目，借贷各 {dr:,.2f}", body.get("actor") or "会计")
    return {"ok": True, "debit_total": dr, "credit_total": cr}


@route("GET", r"/api/reports/partner")
def partner_report(conn, m, body, qs):
    cp_id = (qs.get("counterparty_id") or [""])[0]
    if not cp_id:
        rows = q(conn, """SELECT c.id,c.name,c.kind,
                   COALESCE((SELECT SUM(i.total_amount) FROM invoices i WHERE i.counterparty_id=c.id AND i.status IN ('未入账','已入账')),0) AS open_amount
                   FROM counterparties c WHERE c.enabled=1 ORDER BY c.id""")
        return {"items": rows}
    cp = one(conn, "SELECT * FROM counterparties WHERE id=?", (cp_id,))
    inv = q(conn, """SELECT * FROM invoices WHERE counterparty_id=? ORDER BY invoice_date""", (cp_id,))
    jr = q(conn, """SELECT * FROM journal WHERE counterparty_id=? ORDER BY journal_date,id""", (cp_id,))
    return {"counterparty": cp, "invoices": inv, "journals": jr,
            "invoice_total": round(sum(i["total_amount"] for i in inv), 2),
            "journal_in": round(sum(j["amount"] for j in jr if j["direction"] == "in"), 2),
            "journal_out": round(sum(j["amount"] for j in jr if j["direction"] == "out"), 2)}


@route("GET", r"/api/export/partner\.docx")
def partner_docx(conn, m, body, qs):
    cp_id = (qs.get("counterparty_id") or [""])[0]
    cp = one(conn, "SELECT * FROM counterparties WHERE id=?", (cp_id,)) or {}
    d = build_partner_ledger(conn, cp_id)
    blocks = [("p", f"往来单位：{cp.get('name','')}（{cp.get('kind','')}）　对账日期：{datetime.now().strftime('%Y-%m-%d')}"),
              ("p", f"汇总：{d['balance_text']}；本期借方（应收/付款增加）¥{d['total_debit']:,.2f}，贷方（开票/收款增加）¥{d['total_credit']:,.2f}。"),
              ("h", "一、往来明细账（含发票、收付款、凭证号）"),
              ("table", ["日期", "类型", "单据号", "凭证号", "摘要", "借方", "贷方", "余额"],
               [[r["date"], r["doc"], r["doc_no"], r["voucher_no"], r["summary"],
                 f"{r['debit']:,.2f}" if r["debit"] else "",
                 f"{r['credit']:,.2f}" if r["credit"] else "",
                 f"{r['balance']:,.2f}"] for r in d["items"]]),
              ("h", "二、说明"),
              ("p", "本对账单由系统生成，余额为正表示对方应付（应收），为负表示我方应付；请于收到后 7 个工作日内核对确认，如有异议请及时联系财务部。")]
    return file_result(make_docx(f"{cp.get('name','')} 往来对账单", blocks),
                       f"往来对账单_{cp.get('name','')}_{datetime.now().strftime('%Y%m%d')}.docx",
                       "application/vnd.openxmlformats-officedocument.wordprocessingml.document")


@route("GET", r"/api/export/partner\.xlsx")
def partner_xlsx(conn, m, body, qs):
    cp_id = (qs.get("counterparty_id") or [""])[0]
    cp = one(conn, "SELECT * FROM counterparties WHERE id=?", (cp_id,)) or {}
    d = build_partner_ledger(conn, cp_id)
    sheets = [
        {"name": "往来明细账", "headers": ["日期", "类型", "单据号", "凭证号", "摘要", "借方", "贷方", "余额", "发票状态"],
         "rows": [[r["date"], r["doc"], r["doc_no"], r["voucher_no"], r["summary"],
                   r["debit"] or "", r["credit"] or "", r["balance"], r["invoice_status"]] for r in d["items"]],
         "widths": [12, 12, 16, 16, 30, 14, 14, 14, 12]},
        {"name": "汇总", "headers": ["项目", "金额"],
         "rows": [["借方合计（应收/付款）", d["total_debit"]], ["贷方合计（开票/收款）", d["total_credit"]],
                  ["期末余额", d["balance"]], ["余额方向", "应收" if d["balance"] > 0 else ("应付" if d["balance"] < 0 else "两清")]]},
    ]
    return file_result(make_xlsx(sheets), f"往来对账单_{cp.get('name','')}_{datetime.now().strftime('%Y%m%d')}.xlsx",
                       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@route("GET", r"/api/export/finreports\.xlsx")
def finreports_xlsx(conn, m, body, qs):
    period = (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]
    bs = build_balance_sheet(conn, period)
    inc = build_income_statement(conn, period)
    art = report_articulation(conn, None, None, {"period": [period]})
    cf_cur = report_cashflow(conn, None, None, {"period": [period], "scope": ["current"]})
    cf_ytd = report_cashflow(conn, None, None, {"period": [period], "scope": ["ytd"]})
    bs_rows = [[x["item"], x["amount"], x.get("reclass", ""),
                "（展示行，不计入合计）" if x.get("_nosum") else ""] for x in bs["assets"]] \
        + [["资产合计", bs["total_assets"], "", ""], [None, None, None, None]] \
        + [[x["item"], x["amount"], x.get("reclass", ""), ""] for x in bs["liabilities"]] \
        + [["负债合计", bs["total_liabilities"], "", ""]] \
        + [[x["item"], x["amount"], x.get("reclass", ""), ""] for x in bs["equity"]] \
        + [["所有者权益合计", bs["total_equity"], "", ""],
           ["负债和所有者权益合计", round(bs["total_liabilities"] + bs["total_equity"], 2), "", ""],
           ["差额（应为 0）", bs["diff"], "", ""]]
    inc_rows = [[x["item"], x["amount"], y["amount"]]
                for x, y in zip(inc["current"], inc["cumulative"])]
    art_rows = [[x["name"], x["left"], x["right"], "✓ 相符" if x["pass"] else f"✗ 差额 {x['diff']:,.2f}", x["explain"]]
                for x in art["checks"]]

    def cf_map(cf):
        out = {}
        for direction, key in (("inflow", "in"), ("outflow", "out")):
            for r in cf[direction]:
                code = r["subject_code"] or "未指定科目"
                out.setdefault(code, {"name": r["subject_name"] or code, "in": 0, "out": 0})
                out[code][key] = r["amount"]
        return out
    mc, my = cf_map(cf_cur), cf_map(cf_ytd)
    cf_rows = []
    for code in sorted(set(mc) | set(my)):
        c = mc.get(code, {"name": my[code]["name"], "in": 0, "out": 0})
        y = my.get(code, {"name": c["name"], "in": 0, "out": 0})
        cf_rows.append([c["name"] or code, c["in"], c["out"], round(c["in"] - c["out"], 2),
                        y["in"], y["out"], round(y["in"] - y["out"], 2)])
    cf_rows.append(["合计", cf_cur["in_total"], cf_cur["out_total"], cf_cur["net"],
                    cf_ytd["in_total"], cf_ytd["out_total"], cf_ytd["net"]])
    sheets = [
        {"name": "资产负债表", "headers": ["项目", f"金额（截至 {period}）", "重分类说明", "备注"],
         "rows": bs_rows, "widths": [30, 20, 42, 24]},
        {"name": "利润表", "headers": ["项目", f"本期数（{period}）", f"本年累计数（{inc['cum_scope']}）"],
         "rows": inc_rows, "widths": [30, 20, 24]},
        {"name": "现金流量简表", "headers": ["对方科目", "本期流入", "本期流出", "本期净额",
                                       "本年累计流入", "本年累计流出", "本年累计净额"],
         "rows": cf_rows, "widths": [22, 16, 16, 16, 18, 18, 18]},
        {"name": "勾稽关系核对", "headers": ["勾稽关系", "左边", "右边", "结果", "说明"],
         "rows": art_rows, "widths": [36, 34, 40, 18, 50]},
        {"name": "编制口径", "headers": ["项目", "说明"], "rows": [
            ["报表期间", period],
            ["数据来源", "已过账凭证 + 期初建账余额 + 出纳日记账"],
            ["资产负债表", "时点报表，反映建账起至所选期间末的累计余额"],
            ["利润表本期数", "仅所选期间当月的损益类科目发生额（排除结转凭证）"],
            ["利润表累计数", f"仅本年度内累计（{inc['cum_scope']}），不并入往年利润"],
            ["负数重分类", "应收贷方→预收、应付借方→预付、应交税费借方→留抵进项税"],
            ["固定资产", "原值与累计折旧为展示行，合计按固定资产净值计入"],
            ["新增科目", "未逐一列举的科目按类别自动归集，不会漏项"],
            ["勾稽②口径", "利润表累计数按年度截断；核对时把各年度净利分年汇总，再与资产负债表留存收益（4103+4104+未结转损益）比对"],
            ["勾稽③口径", "出纳日记账现金流量净额 ↔ 总账 1001+1002 货币资金变动（独立双口径）"],
        ], "widths": [22, 76]},
    ]
    return file_result(make_xlsx(sheets), f"财务报表_{period}.xlsx",
                       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


# ---------------- Office 导入 / 导出 ----------------


@route("GET", r"/api/selfcheck")
def selfcheck(conn, m, body, qs):
    """数据自检：试算平衡、账证相符、余额重算、审计链、科目完整性"""
    items = []
    dr = one(conn, """SELECT COALESCE(SUM(l.debit),0) AS v FROM voucher_lines l
             JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'""")["v"]
    cr = one(conn, """SELECT COALESCE(SUM(l.credit),0) AS v FROM voucher_lines l
             JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'""")["v"]
    items.append({"name": "试算平衡（借方=贷方）", "pass": round(dr - cr, 2) == 0,
                  "detail": f"借方 {dr:,.2f} / 贷方 {cr:,.2f}"})
    vsum = one(conn, """SELECT COALESCE(SUM(l.debit+l.credit),0) AS v FROM voucher_lines l
               JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
               WHERE l.subject_code IN ('1001','1002')""")["v"]
    jsum = one(conn, "SELECT COALESCE(SUM(amount),0) AS v FROM journal")["v"]
    items.append({"name": "账证相符（凭证现金银行发生额 = 日记账发生额）", "pass": round(vsum - jsum, 2) == 0,
                  "detail": f"凭证 {vsum:,.2f} / 日记账 {jsum:,.2f}"})
    diffs = []
    for kind in ("cash", "bank"):
        bid = default_bank_id(conn) if kind == "bank" else None
        rows = q(conn, """SELECT id,direction,amount,balance_after FROM journal
                    WHERE account_kind=? AND bank_account_id IS ? ORDER BY journal_date,id""", (kind, bid))
        bal = opening_of(conn, kind, bid)
        for r in rows:
            bal += r["amount"] if r["direction"] == "in" else -r["amount"]
            if abs(bal - r["balance_after"]) > 0.005:
                diffs.append(f"{kind}#{r['id']} 应为 {bal:.2f} 实为 {r['balance_after']:.2f}")
    items.append({"name": "余额重算一致", "pass": not diffs, "detail": "；".join(diffs[:5]) or "全部一致"})
    chain = verify_audit_chain(conn)
    items.append({"name": "审计哈希链完整", "pass": chain["intact"], "detail": f"{chain['total']} 条记录"})
    orphan = one(conn, """SELECT COUNT(*) AS n FROM voucher_lines l
                 LEFT JOIN subjects s ON s.code=l.subject_code WHERE s.code IS NULL""")["n"]
    items.append({"name": "科目引用完整", "pass": orphan == 0, "detail": f"未知科目分录 {orphan} 条"})
    return {"items": items, "ok": all(x["pass"] for x in items),
            "checked_at": now()}


# ---------------- 整站迁移包 ----------------
def _zip_dir(z, path, arc, skip=()):
    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in skip and d != "__pycache__"]
        for f in files:
            if f.endswith((".pyc", ".log", ".db-wal", ".db-shm")):
                continue
            fp = os.path.join(root, f)
            rel = os.path.relpath(fp, path)
            z.write(fp, os.path.join(arc, rel))


@route("GET", r"/api/portable/manifest")
def portable_manifest(conn, m, body, qs):
    """迁移包内容清单：让用户清楚包里到底有什么"""
    def size(p):
        try:
            if os.path.isfile(p):
                return os.path.getsize(p)
            total = 0
            for root, _, files in os.walk(p):
                total += sum(os.path.getsize(os.path.join(root, f)) for f in files)
            return total
        except OSError:
            return 0
    runtime = os.path.join(BASE, "runtime", "python")
    att = os.path.join(BASE, "data", "attachments")
    items = [
        {"name": "程序代码", "path": "server.py / features.py / analytics_api.py / core/* / app/*",
         "size": sum(size(os.path.join(BASE, f)) for f in
                     ("server.py", "db.py", "office.py", "features.py", "analytics_api.py"))
                 + size(os.path.join(BASE, "core")) + size(os.path.join(BASE, "app"))},
        {"name": "数据库", "path": "data/journal.db", "size": size(os.path.join(BASE, "data", "journal.db"))},
        {"name": "数据库迁移", "path": "migrations/*.sql", "size": size(os.path.join(BASE, "migrations"))},
        {"name": "前端页面", "path": "public/*", "size": size(os.path.join(BASE, "public"))},
        {"name": "附件", "path": "data/attachments/*", "size": size(att)},
        {"name": "使用文档", "path": "docs/*", "size": size(os.path.join(BASE, "docs"))},
        {"name": "回归测试", "path": "tests/test_reports.py", "size": size(os.path.join(BASE, "tests"))},
        {"name": "Python 运行时（免安装）", "path": "runtime/python/*",
         "size": size(runtime), "available": os.path.isdir(runtime)},
        {"name": "启动脚本", "path": "启动.bat / 启动.sh / 迁移说明.txt", "size": 0},
    ]
    return {"items": items, "runtime_available": os.path.isdir(runtime),
            "total_size": sum(i["size"] for i in items),
            "database_tables": len(q(conn, "SELECT name FROM sqlite_master WHERE type='table'")),
            "records": {t: one(conn, f"SELECT COUNT(*) AS n FROM {t}")["n"] for t in ("journal", "vouchers", "docs", "invoices", "assets")}}


@route("GET", r"/api/portable/export")
def portable_export(conn, m, body, qs):
    """整站打包：程序源码 + 数据库快照 + 附件 + 内置运行时 + 启动脚本，解压双击即用"""
    import tempfile, zipfile as zf
    tmpdir = tempfile.mkdtemp(prefix="journal-export-")
    snap = os.path.join(tmpdir, "journal.db")
    conn.execute("VACUUM INTO ?", (snap,))
    buf = io.BytesIO()
    with zf.ZipFile(buf, "w", zf.ZIP_DEFLATED) as z:
        for f in ("server.py", "db.py", "office.py", "features.py", "analytics_api.py"):
            z.write(os.path.join(BASE, f), f)
        for d in ("migrations", "core", "app"):
            _zip_dir(z, os.path.join(BASE, d), d)
        _zip_dir(z, os.path.join(BASE, "public"), "public")
        _zip_dir(z, os.path.join(BASE, "docs"), "docs")
        tests_dir = os.path.join(BASE, "tests")
        if os.path.isdir(tests_dir):
            _zip_dir(z, tests_dir, "tests")
        z.write(snap, "data/journal.db")
        att = os.path.join(BASE, "data", "attachments")
        if os.path.isdir(att):
            _zip_dir(z, att, "data/attachments")
        runtime = os.path.join(BASE, "runtime", "python")
        has_runtime = os.path.isdir(runtime) and os.path.isfile(os.path.join(runtime, "python.exe"))
        if has_runtime:
            _zip_dir(z, runtime, "runtime/python")
        bat = "\r\n".join([
            "@echo off",
            "chcp 65001 >nul",
            "title 会计出纳系统",
            'cd /d "%~dp0"',
            "if not defined PORT set PORT=8765",
            "echo ==========================================",
            "echo    会计出纳系统",
            "echo    访问地址: http://127.0.0.1:%PORT%",
            "echo    关闭本窗口即停止服务",
            "echo ==========================================",
            "echo.",
            'if not exist "server.py" goto noserver',
            'if exist "runtime\\python\\python.exe" goto embed',
            "where python >nul 2>nul",
            "if errorlevel 1 goto nopython",
            'set "PY=python"',
            "goto run",
            ":embed",
            'set "PY=runtime\\python\\python.exe"',
            "echo [启动] 使用包内自带 Python 运行时（无需安装）",
            "goto run",
            ":nopython",
            "echo [错误] 未找到 Python，且包内没有 runtime 运行时目录。",
            "echo 请使用完整的整站迁移包，或安装 Python 3.9 及以上版本。",
            "echo.",
            "pause",
            "exit /b 1",
            ":noserver",
            "echo [错误] 当前目录缺少 server.py，压缩包可能没有完整解压。",
            "echo 当前目录: %CD%",
            "echo.",
            "pause",
            "exit /b 1",
            ":run",
            "echo [启动] %PY% server.py",
            "echo.",
            'start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process \'http://127.0.0.1:%PORT%\'"',
            '"%PY%" server.py',
            'set "CODE=%ERRORLEVEL%"',
            "echo.",
            "echo [已停止] 退出码 %CODE%",
            'if not "%CODE%"=="0" (',
            "  echo 启动失败，请把上面的错误信息截图反馈；",
            "  echo 也可双击 启动（诊断）.bat 查看运行环境。",
            ")",
            "echo.",
            "pause",
            ""])
        diag = "\r\n".join([
            "@echo off",
            "chcp 65001 >nul",
            "title 会计出纳系统 - 环境诊断",
            'cd /d "%~dp0"',
            "echo 当前目录: %CD%",
            "echo.",
            "echo [1] 关键文件检查",
            'if exist "server.py" (echo   server.py 存在) else (echo   [缺失] server.py)',
            'if exist "db.py" (echo   db.py 存在) else (echo   [缺失] db.py)',
            'if exist "office.py" (echo   office.py 存在) else (echo   [缺失] office.py)',
            'if exist "data\\journal.db" (echo   数据库 data\\journal.db 存在) else (echo   [缺失] data\\journal.db)',
            "echo.",
            "echo [2] 内置运行时",
            'if exist "runtime\\python\\python.exe" (',
            '  "runtime\\python\\python.exe" -c "import sys,sqlite3;print(\'  Python\',sys.version.split()[0]);print(\'  SQLite\',sqlite3.sqlite_version)"',
            ") else (",
            "  echo   [缺失] runtime\\python\\python.exe",
            ")",
            "echo.",
            "echo [3] 系统 Python",
            "where python 2>nul || echo   [未安装或未加入 PATH]",
            "echo.",
            "echo [4] 端口占用（8765）",
            "netstat -ano | findstr :8765 || echo   端口空闲",
            "echo.",
            "echo 提示：如果双击 启动.bat 一闪而过，请把本窗口内容截图反馈。",
            "echo 如果压缩包来自网络，右键 zip - 属性 - 勾选“解除锁定”后再解压。",
            "echo.",
            "pause",
            ""])
        for name in ("启动.bat", "start.bat"):
            z.writestr(name, bat)
        for name in ("启动（诊断）.bat", "check.bat"):
            z.writestr(name, diag)
        sh = """#!/bin/bash
cd "$(dirname "$0")"
if [ -x "runtime/python/bin/python3" ]; then
  PY="runtime/python/bin/python3"
else
  PY="python3"
fi
PORT="${PORT:-8765}"
echo "正在启动：http://127.0.0.1:$PORT"
( sleep 1; (command -v xdg-open >/dev/null && xdg-open "http://127.0.0.1:$PORT") || (command -v open >/dev/null && open "http://127.0.0.1:$PORT") ) >/dev/null 2>&1 &
exec env PORT="$PORT" "$PY" server.py
"""
        for name in ("启动.sh", "start.sh"):
            z.writestr(name, sh)
        z.writestr("迁移说明.txt",
                   "会计出纳系统 · 整站迁移包 (V2.8)\r\n"
                   "===============================\r\n"
                   "这个压缩包 = 程序 + 数据库 + 附件 + 运行环境 + 说明书 + 回归测试，换电脑直接拷走即可。\r\n\r\n"
                   "V2.5 新增 14 项功能：常用凭证模板、凭证套打、凭证合规体检、全局搜索、现金流量表正表、\r\n"
                   "财务比率、同比环比、坏账计提、催收清单、年度结转、对账单批量导入、科目模板、\r\n"
                   "待办中心、报表快照归档（左侧菜单「效率工具」「经营分析」分组）。\r\n"
                   "V2.4 报表严谨性修复：利润表按年度截断、期初不跨年累加、留抵进项税不重复、\r\n"
                   "新增科目自动归集、三大勾稽按期间核对。数据库迁移已到 010。\r\n\r\n"
                   "V2.6 统一计算内核：core/（统一账套上下文 + 可配置规则引擎 + 分析服务 + 图文报告）、\r\n"
                   "在线图文分析报告（报表中心 → 经营分析报告）、分析规则自定义、功能联动关系图。\r\n\r\n"
                   "V2.8 新增 28 项功能：会计工具箱（辅助核算/批量过账/待摊摊销等）、出纳工作台、\r\n"
                   "架构审计中心、安全中心（默认只观测不阻断，可在安全中心开启）。\r\n"
                   "V2.7 架构重构：组合根 app/bootstrap.py、路由 app/routing.py、端口 app/ports.py、\r\n"
                   "领域内核 core/、前端模块 public/js/。依赖方向单向，无循环依赖。\r\n\r\n"
                   "【重要】server.py / features.py / analytics_api.py 与 core/、app/、public/js/ 目录\r\n"
                   "必须保持同一层级与完整结构，不要单独删除任何一层。\r\n\r\n"
                   "【Windows（推荐，免安装）】\r\n"
                   "1. 把压缩包完整解压到任意目录（例如 D:\\会计出纳系统）。\r\n"
                   "   注意：要在解压后的文件夹里操作，不要直接在压缩包里双击。\r\n"
                   "2. 双击「启动.bat」（若文件名显示乱码，双击 start.bat，内容相同）。\r\n"
                   "3. 会弹出一个黑色窗口，并自动打开浏览器 http://127.0.0.1:8765 。\r\n"
                   "4. 包内自带 Python 运行时（runtime\\python），新电脑无需安装任何软件。\r\n\r\n"
                   "【双击启动.bat 没反应怎么办】\r\n"
                   "a. 确认是“解压后”的文件夹，而不是压缩包预览窗口；\r\n"
                   "b. 右键 zip 文件 → 属性 → 勾选“解除锁定”→ 确定，然后重新解压；\r\n"
                   "c. 双击「启动（诊断）.bat」（或 check.bat），把窗口内容截图反馈；\r\n"
                   "d. 若安全软件拦截，请允许 python.exe 运行。\r\n\r\n"
                   "【macOS / Linux】\r\n"
                   "1. 确认已安装 python3（系统一般自带）\r\n"
                   "2. 解压后执行：chmod +x start.sh && ./start.sh（也可用 启动.sh，两者内容相同）\r\n"
                   "3. 浏览器打开 http://127.0.0.1:8765\r\n\r\n"
                   "【自检 / 回归测试】\r\n"
                   "命令行进入解压目录执行：python3 tests/test_reports.py\r\n"
                   "会用临时账套跑 35 项断言，不影响正式数据；加 --api 可顺带冒烟线上接口。\r\n\r\n"
                   "【数据在哪】\r\n"
                   "data/journal.db     数据库（全部账套数据）\r\n"
                   "data/attachments/   上传的凭证附件、发票、文档\r\n"
                   "只要保留这两个位置，数据就完整。\r\n\r\n"
                   "【换电脑的两种方式】\r\n"
                   "方式一（推荐）：在「系统管理 → 下载整站迁移包」，把 zip 拷到新电脑解压运行。\r\n"
                   "方式二：直接复制整个程序文件夹（含 data 目录）到新电脑，双击「启动.bat」。\r\n\r\n"
                   "【日常备份】\r\n"
                   "系统管理 → 仅备份数据(JSON)，文件小，适合每天备份；整站包适合换电脑或大版本迁移。\r\n\r\n"
                   "【改端口】\r\n"
                   "Windows: set PORT=9000 然后双击 启动.bat；或命令行 set PORT=9000 && 启动.bat\r\n"
                   "macOS/Linux: PORT=9000 ./start.sh\r\n\r\n"
                   "【注意】\r\n"
                   "1. 同一时间只启动一个实例，避免两个进程同时写数据库。\r\n"
                   "2. 升级版本时保留 data 目录，用新程序覆盖其余文件即可，数据不会丢。\r\n"
                   "3. 数据库为 SQLite 单文件，可用任意 SQLite 工具打开核对。\r\n")
    log(conn, "导出整站迁移包", "system", None,
        f"{len(buf.getvalue())/1024/1024:.2f} MB" + ("（含运行时）" if has_runtime else ""),
        body.get("actor") or "系统")
    return file_result(buf.getvalue(),
                       f"会计出纳系统_整站迁移包_{datetime.now().strftime('%Y%m%d_%H%M')}.zip",
                       "application/zip")


@route("POST", r"/api/portable/import")
def portable_import(conn, m, body, qs):
    """导入整站包：用包内数据库替换当前业务数据，并可带入附件"""
    import tempfile, zipfile as zf, shutil
    try:
        raw = base64.b64decode(body.get("content") or "")
    except Exception:
        raise ApiError("文件内容解码失败")
    if not raw:
        raise ApiError("请上传整站迁移包（.zip）")
    tmp = tempfile.mkdtemp(prefix="journal-import-")
    try:
        with zf.ZipFile(io.BytesIO(raw)) as z:
            names = z.namelist()
            dbname = next((n for n in names if n.replace("\\", "/").endswith("data/journal.db")), None)
            if not dbname:
                raise ApiError("压缩包内未找到 data/journal.db，可能不是整站迁移包")
            z.extract(dbname, tmp)
            src_db = os.path.join(tmp, dbname)
            conn.execute("ATTACH DATABASE ? AS src", (src_db,))
            triggers = [r["name"] for r in q(conn, "SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'trg_%'")]
            for t in triggers:
                conn.execute(f"DROP TRIGGER IF EXISTS {t}")
            try:
                copied = 0
                for t in TABLES:
                    dst_cols = [c["name"] for c in q(conn, f"PRAGMA table_info({t})")]
                    try:
                        src_cols = [c["name"] for c in q(conn, f"PRAGMA src.table_info({t})")]
                    except Exception:
                        continue
                    cols = [c for c in dst_cols if c in src_cols]
                    if not cols:
                        continue
                    conn.execute(f"DELETE FROM {t}")
                    conn.execute(f"INSERT INTO {t}({','.join(cols)}) SELECT {','.join(cols)} FROM src.{t}")
                    copied += 1
                conn.commit()
                conn.execute("DETACH DATABASE src")
            finally:
                conn.executescript("""
CREATE TRIGGER IF NOT EXISTS trg_journal_immutable BEFORE UPDATE ON journal
WHEN OLD.amount <> NEW.amount OR OLD.direction <> NEW.direction
  OR OLD.journal_date <> NEW.journal_date OR OLD.voucher_id IS NOT NEW.voucher_id
BEGIN SELECT RAISE(ABORT, '已登记日记账不可修改，请使用红字冲销'); END;
CREATE TRIGGER IF NOT EXISTS trg_journal_no_delete BEFORE DELETE ON journal
BEGIN SELECT RAISE(ABORT, '已登记日记账不可删除，更正请使用红字冲销'); END;
CREATE TRIGGER IF NOT EXISTS trg_vline_immutable BEFORE UPDATE ON voucher_lines
WHEN (SELECT status FROM vouchers WHERE id = OLD.voucher_id) = 'posted'
BEGIN SELECT RAISE(ABORT, '已过账凭证分录不可修改，请使用红字冲销'); END;
CREATE TRIGGER IF NOT EXISTS trg_vline_no_delete BEFORE DELETE ON voucher_lines
WHEN (SELECT status FROM vouchers WHERE id = OLD.voucher_id) = 'posted'
BEGIN SELECT RAISE(ABORT, '已过账凭证分录不可删除'); END;
""")
            # 带入附件文件
            att_dir = os.path.join(BASE, "data", "attachments")
            os.makedirs(att_dir, exist_ok=True)
            imported = 0
            for n in names:
                nn = n.replace("\\", "/")
                if nn.startswith("data/attachments/") and not nn.endswith("/"):
                    fn = os.path.basename(nn)
                    if not fn:
                        continue
                    target = os.path.join(att_dir, fn)
                    if os.path.exists(target):
                        continue
                    with open(target, "wb") as f:
                        f.write(z.read(n))
                    imported += 1
            log(conn, "导入整站迁移包", "system", None, f"表 {copied} 张，附件 {imported} 个",
                body.get("actor") or "系统")
            return {"ok": True, "tables": copied, "attachments": imported}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ---------------- 监控大屏 / 风险预警 / 审计中心 / 用户手册 ----------------
@route("GET", r"/api/monitor")
def monitor(conn, m, body, qs):
    """动态监视大屏数据源：总览 → 趋势 → 结构 → 明细 → 预警"""
    cash, bank = current_balance(conn, "cash"), current_balance(conn, "bank", default_bank_id(conn))
    month = datetime.now().strftime("%Y-%m")
    mo = one(conn, """SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount ELSE 0 END),0) AS income,
             COALESCE(SUM(CASE WHEN direction='out' THEN amount ELSE 0 END),0) AS expense,
             COUNT(*) AS cnt FROM journal WHERE period=?""", (month,))
    today = datetime.now().strftime("%Y-%m-%d")
    td = one(conn, """SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount ELSE 0 END),0) AS income,
             COALESCE(SUM(CASE WHEN direction='out' THEN amount ELSE 0 END),0) AS expense
             FROM journal WHERE journal_date=?""", (today,))
    daily = q(conn, """SELECT journal_date,
             SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS income,
             SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS expense
             FROM journal WHERE journal_date>=DATE('now','-13 day') GROUP BY journal_date ORDER BY journal_date""")
    recent = q(conn, """SELECT j.*,v.voucher_no FROM journal j LEFT JOIN vouchers v ON v.id=j.voucher_id
             ORDER BY j.journal_date DESC, j.id DESC LIMIT 10""")
    projects = q(conn, """SELECT COALESCE(p.name,'未归属') AS name, SUM(l.debit) AS debit, SUM(l.credit) AS credit
             FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
             LEFT JOIN projects p ON p.id=l.project_id GROUP BY l.project_id ORDER BY debit DESC LIMIT 8""")
    months = q(conn, """SELECT period, SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS income,
             SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS expense FROM journal
             GROUP BY period ORDER BY period DESC LIMIT 6""")
    months.reverse()
    # 现金安全月数：可用资金 ÷ 近3个月月均支出
    avg_exp = one(conn, """SELECT COALESCE(AVG(v),0) AS v FROM (SELECT SUM(amount) AS v FROM journal
             WHERE direction='out' AND journal_date>=DATE('now','-90 day') GROUP BY period)""")["v"]
    safety_months = round((cash + bank) / avg_exp, 1) if avg_exp > 0 else None
    ck = closing_checklist(conn, None, None, {"period": [month]})
    al = alerts_list(conn, None, None, {})
    return {
        "cash": round(cash, 2), "bank": round(bank, 2),
        "total": round(cash + bank, 2),
        "month_income": mo["income"], "month_expense": mo["expense"],
        "month_net": round(mo["income"] - mo["expense"], 2), "month_entries": mo["cnt"],
        "today_income": td["income"], "today_expense": td["expense"],
        "safety_months": safety_months,
        "daily": daily, "months": months, "projects": projects, "recent": recent,
        "alerts_summary": al["summary"], "alerts_top": al["items"][:6],
        "checklist_pass": all(x["pass"] for x in ck["items"] if x["block"]),
        "refresh": int(setting(conn, "monitor_refresh", "10") or 10),
    }


def alerts_list(conn, m, body, qs):
    """风险预警引擎：规则=可量化阈值，全部可在系统管理中配置"""
    s = lambda k, d: float(setting(conn, k, d) or d)
    floor_cash, floor_bank = s("risk_cash_floor", 2000), s("risk_bank_floor", 10000)
    large = s("risk_large_txn", 50000)
    safety_m, recon_days = s("risk_safety_months", 3), int(s("risk_recon_days", 7))
    budget_warn = s("risk_budget_warn", 80)
    items = []
    cash, bank = current_balance(conn, "cash"), current_balance(conn, "bank", default_bank_id(conn))
    if cash < floor_cash:
        items.append({"level": "高", "category": "资金安全", "title": "现金余额低于安全线",
                      "detail": f"现金 ¥{cash:,.2f} < 安全线 ¥{floor_cash:,.2f}"})
    if bank < floor_bank:
        items.append({"level": "高", "category": "资金安全", "title": "银行存款低于安全线",
                      "detail": f"银行 ¥{bank:,.2f} < 安全线 ¥{floor_bank:,.2f}"})
    avg_exp = one(conn, """SELECT COALESCE(AVG(v),0) AS v FROM (SELECT SUM(amount) AS v FROM journal
            WHERE direction='out' AND journal_date>=DATE('now','-90 day') GROUP BY period)""")["v"]
    if avg_exp > 0:
        months_left = (cash + bank) / avg_exp
        if months_left < safety_m:
            items.append({"level": "高" if months_left < safety_m / 2 else "中", "category": "资金安全",
                          "title": f"现金安全月数仅 {months_left:.1f} 个月",
                          "detail": f"可用资金 ÷ 月均刚性支出（近3月均值 ¥{avg_exp:,.2f}）低于 {safety_m:.0f} 个月警戒线"})
    big = q(conn, """SELECT j.*,v.voucher_no FROM journal j LEFT JOIN vouchers v ON v.id=j.voucher_id
            WHERE amount>=? ORDER BY j.journal_date DESC, j.id DESC LIMIT 5""", (large,))
    if big:
        items.append({"level": "中", "category": "大额收支",
                      "title": f"存在 {len(big)} 笔大额收支（≥ ¥{large:,.0f}）",
                      "detail": "；".join(f"{x['journal_date']} {'收' if x['direction']=='in' else '付'} ¥{x['amount']:,.2f} {x['summary'] or ''}" for x in big[:3])})
    daily = q(conn, """SELECT journal_date, SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS expense
            FROM journal WHERE journal_date>=DATE('now','-6 day') GROUP BY journal_date HAVING income>0 OR expense>0
            ORDER BY journal_date DESC""")
    neg = 0
    for r in daily:
        if r["income"] - r["expense"] < 0:
            neg += 1
        else:
            break
    if neg >= 3:
        items.append({"level": "中", "category": "资金安全", "title": f"连续 {neg} 天净流出",
                      "detail": "近期支出持续大于收入，请关注资金安排"})
    old = one(conn, """SELECT COUNT(*) AS n, MIN(journal_date) AS d FROM journal
            WHERE recon_status='未核对' AND journal_date<=DATE('now', ? || ' day')""", (-recon_days,))
    if old["n"]:
        items.append({"level": "中", "category": "对账", "title": f"{old['n']} 笔流水超过 {recon_days:.0f} 天未核对",
                      "detail": f"最早 {old['d']}，请在日记账中勾销"})
    unmatched = one(conn, "SELECT COUNT(*) AS n FROM bank_statements WHERE matched_journal_id IS NULL")["n"]
    if unmatched:
        items.append({"level": "中", "category": "对账", "title": f"{unmatched} 笔银行流水未匹配",
                      "detail": "请在银行对账页执行自动勾对或人工核对"})
    ambiguous = one(conn, "SELECT COUNT(*) AS n FROM bank_statements WHERE match_note LIKE '歧义%'")["n"]
    if ambiguous:
        items.append({"level": "中", "category": "对账", "title": f"{ambiguous} 笔歧义匹配待人工复核",
                      "detail": "系统不自动猜测，请人工确认"})
    uninv = one(conn, "SELECT COUNT(*) AS n FROM invoices WHERE status='未入账'")["n"]
    if uninv:
        items.append({"level": "低", "category": "发票", "title": f"{uninv} 张发票未入账",
                      "detail": "请到发票管理生成凭证，避免漏记"})
    unpaid = one(conn, """SELECT COUNT(*) AS n FROM invoices WHERE status='已入账'
            AND invoice_date<=DATE('now','-30 day')""")["n"]
    if unpaid:
        items.append({"level": "低", "category": "发票", "title": f"{unpaid} 张发票超 30 天未核销",
                      "detail": "请确认收付款与核销状态"})
    budgets = report_budget(conn, None, None, {"period": [datetime.now().strftime("%Y-%m")]})["items"]
    for b in budgets:
        if b["status"] == "超支":
            items.append({"level": "高", "category": "预算",
                          "title": f"预算超支：{b['subject_name'] or b['subject_code']} / {b['project_name'] or '全部'}",
                          "detail": f"预算 ¥{b['amount']:,.2f}，实际 ¥{b['actual']:,.2f}，超出 ¥{-b['remaining']:,.2f}"})
        elif b["usage"] >= budget_warn:
            items.append({"level": "中", "category": "预算",
                          "title": f"预算接近上限：{b['subject_name'] or b['subject_code']}",
                          "detail": f"执行率 {b['usage']}%，剩余 ¥{b['remaining']:,.2f}"})
    mismatch = []
    for chk in q(conn, "SELECT * FROM daily_checks"):
        if chk["account_kind"] == "cash":
            bal = current_balance(conn, "cash")
        else:
            bal = current_balance(conn, "bank", chk["bank_account_id"])
        if abs(chk["counted_amount"] - bal) > 0.005:
            mismatch.append(f"{chk['account_kind']} {chk['check_date']} 实存 ¥{chk['counted_amount']:,.2f} vs 账面 ¥{bal:,.2f}")
    if mismatch:
        items.append({"level": "高", "category": "账实核对", "title": "盘点数与账面余额不符",
                      "detail": "；".join(mismatch[:3])})
    dup = q(conn, "SELECT voucher_no, COUNT(*) AS n FROM vouchers GROUP BY voucher_no HAVING n>1 LIMIT 3")
    if dup:
        items.append({"level": "中", "category": "凭证", "title": "存在重复凭证号",
                      "detail": "；".join(x["voucher_no"] for x in dup)})
    chain = verify_audit_chain(conn)
    if not chain["intact"]:
        items.append({"level": "高", "category": "审计", "title": "审计哈希链被破坏",
                      "detail": f"{len(chain['broken'])} 条记录校验异常，请立即核查"})
    level_rank = {"高": 0, "中": 1, "低": 2}
    items.sort(key=lambda x: level_rank.get(x["level"], 9))
    return {"items": items, "summary": {
        "high": sum(1 for x in items if x["level"] == "高"),
        "medium": sum(1 for x in items if x["level"] == "中"),
        "low": sum(1 for x in items if x["level"] == "低")}, "checked_at": now()}


@route("GET", r"/api/alerts")
def alerts_route(conn, m, body, qs):
    r = alerts_list(conn, None, None, {})
    r["settings"] = {k: setting(conn, k) for k in
                     ("risk_cash_floor", "risk_bank_floor", "risk_large_txn",
                      "risk_safety_months", "risk_recon_days", "risk_budget_warn", "monitor_refresh")}
    return r


@route("POST", r"/api/risk/settings")
def save_risk_settings(conn, m, body, qs):
    st = body.get("settings") or {}
    allowed = ("risk_cash_floor", "risk_bank_floor", "risk_large_txn",
               "risk_safety_months", "risk_recon_days", "risk_budget_warn", "monitor_refresh")
    for k, v in st.items():
        if k in allowed:
            conn.execute("""INSERT INTO settings(key,value) VALUES(?,?)
                            ON CONFLICT(key) DO UPDATE SET value=excluded.value""", (k, str(v)))
    log(conn, "修改预警阈值", "settings", None, json.dumps(st, ensure_ascii=False), body.get("actor") or "系统")
    return {"ok": True}


@route("GET", r"/api/audit/stats")
def audit_stats(conn, m, body, qs):
    by_action = q(conn, "SELECT action, COUNT(*) AS n FROM audit_logs GROUP BY action ORDER BY n DESC LIMIT 12")
    by_actor = q(conn, "SELECT COALESCE(actor,'(空)') AS actor, COUNT(*) AS n FROM audit_logs GROUP BY actor ORDER BY n DESC LIMIT 10")
    by_day = q(conn, """SELECT DATE(at) AS d, COUNT(*) AS n FROM audit_logs
               WHERE at>=DATE('now','-13 day') GROUP BY DATE(at) ORDER BY d""")
    sensitive = q(conn, """SELECT at,actor,action,entity,entity_id,detail FROM audit_logs
               WHERE action IN ('删除单据','红字冲销','月末结账','反结账','恢复备份','清空','导入整站迁移包','删除预算','作废凭证','修改预警阈值','作废发票','资产处理')
               ORDER BY id DESC LIMIT 30""")
    return {"by_action": by_action, "by_actor": by_actor, "by_day": by_day, "sensitive": sensitive,
            "total": one(conn, "SELECT COUNT(*) AS n FROM audit_logs")["n"]}


@route("GET", r"/api/manual")
def get_manual(conn, m, body, qs):
    path = os.path.join(BASE, "docs", "用户手册.md")
    if not os.path.exists(path):
        return {"content": "# 用户手册\n\n手册文件尚未生成：docs/用户手册.md"}
    return {"content": open(path, encoding="utf-8").read(), "updated_at": now()}


# ---------------- 往来账 / 财务报表（资产负债表·利润表·勾稽） ----------------
def build_partner_ledger(conn, cp_id):
    """按往来单位构建全量明细账：发票 + 收付款 + 其他往来分录，逐笔余额"""
    rows = []
    for i in q(conn, """SELECT i.*, v.voucher_no FROM invoices i
            LEFT JOIN vouchers v ON v.id=i.voucher_id
            WHERE i.counterparty_id=? AND i.status='未入账'""", (cp_id,)):
        rows.append({"date": i["invoice_date"], "doc": ("销项发票" if i["kind"] == "销项" else "进项发票") + "（未入账）",
                     "doc_no": i["invoice_no"], "voucher_no": "",
                     "summary": i["note"] or f"{i['kind']}发票",
                     "debit": i["total_amount"] if i["kind"] == "销项" else 0,
                     "credit": i["total_amount"] if i["kind"] == "进项" else 0,
                     "ref": f"invoice:{i['id']}", "invoice_status": i["status"]})
    for j in q(conn, """SELECT j.*, v.voucher_no FROM journal j
            LEFT JOIN vouchers v ON v.id=j.voucher_id
            WHERE j.counterparty_id=?""", (cp_id,)):
        rows.append({"date": j["journal_date"], "doc": "收款" if j["direction"] == "in" else "付款",
                     "doc_no": "", "voucher_no": j["voucher_no"] or "",
                     "summary": j["summary"] or "",
                     "debit": j["amount"] if j["direction"] == "out" else 0,
                     "credit": j["amount"] if j["direction"] == "in" else 0,
                     "ref": f"journal:{j['id']}", "invoice_status": ""})
    for l in q(conn, """SELECT l.*, v.voucher_no, v.voucher_date, s.name AS subject_name FROM voucher_lines l
            JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
            LEFT JOIN subjects s ON s.code=l.subject_code
            WHERE l.counterparty_id=? AND l.subject_code IN ('1122','1221','2202','2203','2314','6001','6051')""", (cp_id,)):
        docname = {"1122": "应收入账", "1221": "其他往来", "2202": "应付出账", "2203": "预收", "2314": "合同负债",
                   "6001": "确认收入", "6051": "确认收入"}.get(l["subject_code"], "往来转账")
        rows.append({"date": l["voucher_date"], "doc": docname, "doc_no": "",
                     "voucher_no": l["voucher_no"] or "",
                     "summary": f"{l['subject_name'] or l['subject_code']} {l['summary'] or ''}".strip(),
                     "debit": l["debit"], "credit": l["credit"],
                     "ref": f"line:{l['id']}", "invoice_status": ""})
    rows.sort(key=lambda r: (r["date"], r["ref"]))
    bal = 0.0
    for r in rows:
        bal += r["debit"] - r["credit"]
        r["balance"] = round(bal, 2)
    for r in rows:
        for k in ("debit", "credit", "balance"):
            r[k] = round(r[k], 2)
    return {"items": rows,
            "total_debit": round(sum(r["debit"] for r in rows), 2),
            "total_credit": round(sum(r["credit"] for r in rows), 2),
            "balance": round(bal, 2),
            "balance_text": (f"应收余额 ¥{bal:,.2f}" if bal > 0 else
                             (f"应付余额 ¥{-bal:,.2f}" if bal < 0 else "两清"))}


@route("GET", r"/api/partner-ledger")
def partner_ledger_route(conn, m, body, qs):
    cp_id = (qs.get("counterparty_id") or [""])[0]
    if not cp_id:
        return {"items": [], "counterparty": None}
    cp = one(conn, "SELECT * FROM counterparties WHERE id=?", (cp_id,))
    d = build_partner_ledger(conn, cp_id)
    d["counterparty"] = cp
    return d


def subject_closing(conn, period, code):
    """某科目截至某期间（含）的累计余额：正=借方余额，负=贷方余额。

    期初余额按科目取「<= 查询期间的最近一次建账」那一批，而不是把所有历史
    期初相加 —— 跨年度反复建账时相加会虚增资产/权益，导致报表失真。
    凭证发生额仍按 period<=? 全量累计，这样新年度的报表自动承接上年期末。
    """
    op = one(conn, """SELECT COALESCE(SUM(debit-credit),0) AS v FROM opening_balances
            WHERE subject_code=? AND period=(
                SELECT MAX(period) FROM opening_balances
                WHERE subject_code=? AND period<=?)""", (code, code, period))["v"]
    r = one(conn, """SELECT COALESCE(SUM(l.debit-l.credit),0) AS v FROM voucher_lines l
            JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
            WHERE l.subject_code=? AND v.period<=?""", (code, period))["v"]
    return round(op + r, 2)


def build_balance_sheet(conn, period):
    """资产负债表（截至 period，含期初余额 + 全部已过账凭证）。

    设计要点：
    - 负数余额重分类：应收贷方→预收、应付借方→预付、应交税费借方→留抵进项
    - 固定资产原值/累计折旧只作展示行（_nosum），合计用「固定资产净值」，避免重复
    - 未逐一列举的科目按 category 自动兜底入表，新增科目也不会漏项导致报表不平
    - 所有明细行先追加完毕再算合计，保证「明细之和 == 报表合计」
    """
    def bal(code):
        return subject_closing(conn, period, code)
    b1122, b2202, b2221 = bal("1122"), bal("2202"), bal("2221")
    assets = [
        {"item": "货币资金", "amount": round(bal("1001") + bal("1002"), 2)},
        {"item": "应收账款", "amount": round(max(b1122, 0), 2)},
        {"item": "预付账款", "amount": round(bal("1123") + max(b2202, 0), 2)},
        {"item": "其他应收款", "amount": round(bal("1221"), 2)},
        {"item": "固定资产原值", "amount": round(bal("1601"), 2), "_nosum": True},
        {"item": "减：累计折旧", "amount": round(-bal("1602"), 2), "_nosum": True},
        {"item": "固定资产净值", "amount": round(bal("1601") + bal("1602"), 2)},
    ]
    if b1122 < 0:
        assets[1]["reclass"] = f"应收账款贷方余额 ¥{-b1122:,.2f} 已重分类至负债方预收账款"
    if b2202 > 0:
        assets[2]["reclass"] = f"应付账款借方余额 ¥{b2202:,.2f} 已重分类至资产方预付账款"
    if b2221 > 0:
        assets.append({"item": "应交税费（留抵进项税）", "amount": round(b2221, 2),
                       "reclass": f"应交税费借方余额 ¥{b2221:,.2f} 已重分类至资产方（只计一次）"})
    liabilities = [
        {"item": "应付账款", "amount": round(max(-b2202, 0), 2)},
        {"item": "预收账款", "amount": round(bal("2203") + max(-b1122, 0), 2)},
        {"item": "合同负债", "amount": round(-bal("2314"), 2)},
        {"item": "应交税费", "amount": round(max(-b2221, 0), 2)},
    ]
    if b1122 < 0:
        liabilities[1]["reclass"] = f"含应收账款贷方重分类 ¥{-b1122:,.2f}"
    equity = [
        {"item": "实收资本", "amount": round(-bal("4001"), 2)},
        {"item": "利润分配", "amount": round(-bal("4104"), 2)},
    ]
    # 通用兜底：科目表里其余资产/负债/权益科目（含期初余额）全部入表
    used = {"1001", "1002", "1122", "1123", "1221", "1601", "1602",
            "2202", "2203", "2314", "2221", "4001", "4103", "4104"}
    for s in q(conn, "SELECT code,name,category FROM subjects ORDER BY code"):
        code, cat = s["code"], s["category"]
        if code in used or cat not in ("资产", "负债", "权益"):
            continue
        v = bal(code)
        if abs(v) < 0.005:
            continue
        row = {"item": s["name"] or code,
               "amount": round(v if cat == "资产" else -v, 2),
               "reclass": "系统自动归集（新增科目）"}
        (assets if cat == "资产" else liabilities if cat == "负债" else equity).append(row)
    # 损益类科目余额 = 尚未结转的损益；与 4103 已结转部分共同构成权益
    pl_residual = round(sum(bal(s["code"]) for s in
                            q(conn, "SELECT code FROM subjects WHERE category='损益'")), 2)
    profit_posted = round(-bal("4103"), 2)
    profit_unclosed = round(-pl_residual, 2)
    benianli = round(profit_posted + profit_unclosed, 2)
    equity.append({"item": "本年利润（已结转 4103）", "amount": profit_posted})
    equity.append({"item": "未结转损益", "amount": profit_unclosed,
                   "reclass": "损益类科目尚未结转的净额，结转后自动转入上行"})
    total_assets = round(sum(x["amount"] for x in assets if not x.get("_nosum")), 2)
    total_liabilities = round(sum(x["amount"] for x in liabilities), 2)
    total_equity = round(sum(x["amount"] for x in equity), 2)
    diff = round(total_assets - total_liabilities - total_equity, 2)
    # 留存收益合计：无论是否做过「4103 → 4104」年结，口径都能与利润表对齐
    retained = round(-bal("4103") - bal("4104") - pl_residual, 2)
    return {"period": period, "assets": assets, "liabilities": liabilities, "equity": equity,
            "total_assets": total_assets, "total_liabilities": total_liabilities,
            "total_equity": total_equity, "diff": diff, "balanced": abs(diff) < 0.005,
            "pl_residual": pl_residual, "benianli": benianli, "retained": retained,
            "reclass_count": sum(1 for x in assets + liabilities if x.get("reclass"))}


@route("GET", r"/api/reports/balance-sheet")
def report_balance_sheet(conn, m, body, qs):
    period = (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]
    return build_balance_sheet(conn, period)


# 利润表行与科目编码的映射（前缀匹配）；未命中的损益科目统一进「其他损益」，
# 保证「净利润 == 全部损益科目对利润的贡献之和」，用户新增科目也不会漏计。
INCOME_GROUPS = [
    ("rev", ("6001", "6051")),
    ("cost", ("6401", "6402")),
    ("tax", ("6403",)),
    ("sell", ("6601",)),
    ("adm", ("6602",)),
    ("fin", ("6603",)),
    ("nonop_in", ("6301",)),
    ("nonop_out", ("6711",)),
    ("income_tax", ("6801",)),
]


def build_income_statement(conn, period):
    """利润表：本期数 + 本年累计数（按自然年度截断，不串年）。"""
    year = period[:4]

    def sums(scope):
        if scope == "current":
            w, args = "v.period=?", (period,)
        else:
            # 关键：累计数只取本年度 1 月至所选期间，不把往年利润累进来
            w, args = "v.period BETWEEN ? AND ?", (year + "-01", period)
        rows = q(conn, f"""SELECT l.subject_code, s.name AS name, s.direction,
                 SUM(l.debit) AS debit, SUM(l.credit) AS credit FROM voucher_lines l
                 JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
                 LEFT JOIN subjects s ON s.code=l.subject_code
                 WHERE s.category='损益' AND COALESCE(v.is_closing,0)=0 AND {w}
                 GROUP BY l.subject_code""", args)
        out = {}
        for r in rows:
            is_credit = (r["direction"] or "借") == "贷"
            raw = round(r["credit"] - r["debit"], 2) if is_credit else round(r["debit"] - r["credit"], 2)
            # v = 该科目对净利润的带符号贡献：收入为正、费用为负
            out[r["subject_code"]] = {"name": r["name"] or r["subject_code"],
                                      "raw": raw, "v": round(raw if is_credit else -raw, 2)}
        return out

    def bucket(d):
        b = {k: 0.0 for k, _ in INCOME_GROUPS}
        b["other"] = 0.0
        for code, info in d.items():
            key = next((k for k, prefixes in INCOME_GROUPS if code.startswith(prefixes)), "other")
            b[key] += info["v"]
        return {k: round(v, 2) for k, v in b.items()}

    def build(d):
        b = bucket(d)
        op = round(sum(b[k] for k in ("rev", "cost", "tax", "sell", "adm", "fin", "other")), 2)
        total_p = round(op + b["nonop_in"] + b["nonop_out"], 2)
        net = round(total_p + b["income_tax"], 2)
        return [
            {"item": "一、营业收入", "amount": b["rev"]},
            {"item": "　减：营业成本", "amount": round(-b["cost"], 2)},
            {"item": "　减：税金及附加", "amount": round(-b["tax"], 2)},
            {"item": "　减：销售费用", "amount": round(-b["sell"], 2)},
            {"item": "　减：管理费用", "amount": round(-b["adm"], 2)},
            {"item": "　减：财务费用", "amount": round(-b["fin"], 2)},
            {"item": "　其他损益（净额）", "amount": b["other"]},
            {"item": "二、营业利润", "amount": op},
            {"item": "　加：营业外收入", "amount": b["nonop_in"]},
            {"item": "　减：营业外支出", "amount": round(-b["nonop_out"], 2)},
            {"item": "三、利润总额", "amount": total_p},
            {"item": "　减：所得税费用", "amount": round(-b["income_tax"], 2)},
            {"item": "四、净利润", "amount": net},
        ]

    current, cumulative = build(sums("current")), build(sums("cum"))
    return {"period": period, "year": year, "cum_scope": f"{year}-01 ~ {period}",
            "current": current, "cumulative": cumulative,
            "net_current": current[-1]["amount"], "net_cum": cumulative[-1]["amount"]}


@route("GET", r"/api/reports/income")
def report_income(conn, m, body, qs):
    return build_income_statement(conn, (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0])


def cash_opening_balance(conn, period):
    """货币资金账套启用期初：优先取期初建账表，兼容只设系统参数/银行账户的老账套"""
    r = one(conn, """SELECT COALESCE(SUM(debit-credit),0) AS v FROM opening_balances
            WHERE subject_code IN ('1001','1002') AND period=(
                SELECT MAX(period) FROM opening_balances
                WHERE subject_code IN ('1001','1002') AND period<=?)""", (period,))
    if r and r["v"]:
        return round(r["v"], 2)
    b = one(conn, "SELECT COALESCE(SUM(opening_balance),0) AS v FROM bank_accounts")["v"]
    return round(float(setting(conn, "cash_opening", "0") or 0) + (b or 0), 2)


@route("GET", r"/api/reports/articulation")
def report_articulation(conn, m, body, qs):
    """三大勾稽关系自动核对（全部按所选期间口径）"""
    period = (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]
    bs = build_balance_sheet(conn, period)
    inc = build_income_statement(conn, period)
    cf = report_cashflow(conn, None, None, {"period": [period], "scope": ["through"]})
    checks = []
    checks.append({"name": "资产 = 负债 + 所有者权益",
                   "left": f"资产 ¥{bs['total_assets']:,.2f}",
                   "right": f"负债+权益 ¥{bs['total_liabilities']+bs['total_equity']:,.2f}",
                   "diff": bs["diff"], "pass": bs["balanced"],
                   "explain": "资产负债表恒等式；不平通常因期初余额未录入、科目分类缺失或存在未过账凭证"})
    # 利润表「本年累计」按年度截断，而资产负债表留存的是账套累计利润。
    # 因此把各年度净利分年汇总后再与资产负债表留存收益核对，跨年账套同样成立，
    # 且无论是否做过「4103 → 4104 利润分配」年结都不影响口径。
    years = [r["y"] for r in q(conn, """SELECT DISTINCT substr(period,1,4) AS y FROM vouchers
                                       WHERE period<=? ORDER BY y""", (period,))]
    yearN = int(period[:4])
    year0 = int(years[0]) if years else yearN
    all_cum = round(sum(build_income_statement(conn, period if y == str(yearN) else y + "-12")["net_cum"]
                        for y in years), 2)
    diff2 = round(all_cum - bs["retained"], 2)
    checks.append({"name": "利润表累计净利润 ↔ 资产负债表留存收益",
                   "left": f"账套累计净利润 ¥{all_cum:,.2f}（{year0}—{period[:4]} 分年度汇总；其中本年 ¥{inc['net_cum']:,.2f}）",
                   "right": f"本年利润 + 利润分配 + 未结转损益 ¥{bs['retained']:,.2f}",
                   "diff": diff2, "pass": abs(diff2) < 0.005,
                   "ytd": inc["net_cum"], "cum_all": all_cum,
                   "explain": "利润表累计数只算本年度，资产负债表留存的是账套累计，故按年度汇总后比对；两边不符通常是有损益类凭证未过账，或凭证使用了非损益类科目"})
    cash_begin = cash_opening_balance(conn, period)
    cash_end = round(bs["assets"][0]["amount"], 2)  # 资产负债表「货币资金」= 1001+1002
    delta_bs = round(cash_end - cash_begin, 2)
    diff3 = round(cf["net"] - delta_bs, 2)
    checks.append({"name": "现金流量净额 ↔ 资产负债表货币资金变动",
                   "left": f"出纳日记账现金流量净额 ¥{cf['net']:,.2f}（截至 {period}）",
                   "right": f"总账货币资金变动 ¥{delta_bs:,.2f}（期初 ¥{cash_begin:,.2f} → 期末 ¥{cash_end:,.2f}）",
                   "diff": diff3, "pass": abs(diff3) < 0.005,
                   "explain": "两侧为独立口径：左边取出纳日记账流水，右边取总账 1001+1002 科目余额。不符通常说明有凭证未登记日记账，或日记账金额与凭证不一致"})
    return {"period": period, "year": inc["year"], "cum_scope": inc["cum_scope"],
            "checks": checks, "all_pass": all(x["pass"] for x in checks),
            "cash_begin": cash_begin, "cash_end": cash_end, "cashflow_net": cf["net"]}


# ---------------- Office 导入 / 导出 ----------------
EXPORT_LABELS = {
    "journal": "日记账", "docs": "业务单据", "vouchers": "记账凭证",
    "voucher_lines": "凭证明细", "statements": "银行对账单", "daily": "日结核对",
    "subjects": "会计科目", "projects": "核算项目", "counterparties": "往来单位",
    "bank_accounts": "银行账户", "audit": "审计日志", "periods": "会计期间",
    "invoices": "发票台账", "budgets": "预算", "attachments": "文档附件",
    "assets": "固定资产", "openings": "期初余额",
}

IMPORT_TEMPLATES = {
    "journal": (["日期", "账户", "凭证号", "摘要", "对方科目", "项目", "往来单位", "收入", "支出", "对账状态"],
                [["2026-11-06", "现金", "现收001", "示例收款", "应收账款", "日常运营", "A客户", 1000, "", "未核对"]]),
    "docs": (["单据类型", "日期", "金额", "账户", "对方科目", "项目", "往来单位", "申请人", "部门", "事由"],
             [["付款申请", "2026-11-06", 350, "现金", "管理费用", "日常运营", "", "小李", "财务部", "办公用品"]]),
    "vouchers": (["凭证号", "日期", "凭证字", "摘要", "科目", "借方", "贷方", "项目"],
                 [["记-202611901", "2026-11-06", "付", "示例凭证", "管理费用", 100, "", "日常运营"],
                  ["记-202611901", "2026-11-06", "付", "示例凭证", "库存现金", "", 100, "日常运营"]]),
    "statements": (["日期", "摘要", "收入", "支出"],
                   [["2026-11-06", "收到货款", 25000, ""]]),
    "subjects": (["编码", "名称", "类别", "余额方向"], [["6604", "研发费用", "损益", "借"]]),
    "projects": (["名称"], [["项目D"]]),
    "counterparties": (["名称", "类型"], [["丙供应商", "供应商"]]),
    "bank_accounts": (["名称", "开户行", "账号", "期初余额"], [["一般户", "建设银行", "6222 8888", 0]]),
    "invoices": (["发票号码", "类型", "日期", "往来单位", "不含税金额", "税额", "科目", "备注"],
                 [["FP202611001", "进项", "2026-11-06", "甲供应商", 1000, 130, "管理费用", "办公用品"]]),
    "budgets": (["期间", "科目", "项目", "预算金额", "备注"],
                [["2026-11", "6602", "日常运营", 5000, "办公费月度预算"]]),
}


def export_sheet(conn, name):
    """把一张业务表转成 xlsx 工作表数据"""
    if name == "journal":
        rows = q(conn, """SELECT j.*,s.name AS subject_name,p.name AS project_name,
                    c.name AS cp_name,v.voucher_no FROM journal j
                    LEFT JOIN subjects s ON s.code=j.subject_code
                    LEFT JOIN projects p ON p.id=j.project_id
                    LEFT JOIN counterparties c ON c.id=j.counterparty_id
                    LEFT JOIN vouchers v ON v.id=j.voucher_id
                    ORDER BY j.journal_date,j.id""")
        return {"name": "日记账", "headers": ["日期", "账户", "凭证号", "摘要", "对方科目", "项目", "往来单位", "收入", "支出", "结余", "对账状态"],
                "rows": [[r["journal_date"], "库存现金" if r["account_kind"] == "cash" else "银行存款",
                          r["voucher_no"], r["summary"], r["subject_name"], r["project_name"], r["cp_name"],
                          r["amount"] if r["direction"] == "in" else "",
                          r["amount"] if r["direction"] == "out" else "",
                          r["balance_after"], r["recon_status"]] for r in rows],
                "widths": [12, 12, 14, 26, 14, 12, 12, 14, 14, 14, 12]}
    if name == "docs":
        rows = q(conn, """SELECT d.*,s.name AS subject_name,p.name AS project_name,c.name AS cp_name,
                    v.voucher_no FROM docs d LEFT JOIN subjects s ON s.code=d.subject_code
                    LEFT JOIN projects p ON p.id=d.project_id LEFT JOIN counterparties c ON c.id=d.counterparty_id
                    LEFT JOIN vouchers v ON v.id=d.voucher_id ORDER BY d.doc_date,d.id""")
        return {"name": "业务单据", "headers": ["单据号", "类型", "日期", "金额", "账户", "对方科目", "项目", "往来单位", "申请人", "部门", "事由", "状态", "凭证号"],
                "rows": [[r["doc_no"], doc_label(r["doc_type"]), r["doc_date"], r["amount"],
                          "库存现金" if r["account_kind"] == "cash" else "银行存款", r["subject_name"],
                          r["project_name"], r["cp_name"], r["applicant"], r["dept"], r["reason"],
                          r["status"], r["voucher_no"]] for r in rows], "widths": [16, 12, 12, 14, 12, 14, 12, 12, 12, 12, 28, 12, 14]}
    if name == "vouchers":
        rows = q(conn, "SELECT * FROM vouchers ORDER BY voucher_date,id")
        return {"name": "记账凭证", "headers": ["凭证号", "日期", "期间", "字", "摘要", "制单人", "状态", "过账时间"],
                "rows": [[r["voucher_no"], r["voucher_date"], r["period"], r["voucher_type"], r["summary"],
                          r["maker"], r["status"], r["posted_at"]] for r in rows], "widths": [16, 12, 10, 6, 28, 12, 12, 20]}
    if name == "voucher_lines":
        rows = q(conn, """SELECT v.voucher_no,v.voucher_date,l.*,s.name AS subject_name
                    FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id
                    LEFT JOIN subjects s ON s.code=l.subject_code ORDER BY v.voucher_date,l.id""")
        return {"name": "凭证明细", "headers": ["凭证号", "日期", "行号", "摘要", "科目编码", "科目名称", "借方", "贷方"],
                "rows": [[r["voucher_no"], r["voucher_date"], r["line_no"], r["summary"], r["subject_code"],
                          r["subject_name"], r["debit"], r["credit"]] for r in rows], "widths": [16, 12, 8, 26, 12, 14, 14, 14]}
    if name == "statements":
        rows = q(conn, "SELECT * FROM bank_statements ORDER BY statement_date,id")
        return {"name": "银行对账单", "headers": ["日期", "摘要", "收入", "支出", "已匹配日记账ID"],
                "rows": [[r["statement_date"], r["description"], r["amount_in"], r["amount_out"], r["matched_journal_id"]] for r in rows],
                "widths": [12, 28, 14, 14, 18]}
    if name == "daily":
        rows = q(conn, "SELECT * FROM daily_checks ORDER BY check_date")
        return {"name": "日结核对", "headers": ["日期", "账户", "盘点数", "备注"],
                "rows": [[r["check_date"], r["account_kind"], r["counted_amount"], r["note"]] for r in rows],
                "widths": [12, 12, 14, 28]}
    if name == "subjects":
        rows = q(conn, "SELECT * FROM subjects ORDER BY code")
        return {"name": "会计科目", "headers": ["编码", "名称", "类别", "余额方向", "现金科目", "银行科目", "启用"],
                "rows": [[r["code"], r["name"], r["category"], r["direction"], r["is_cash"], r["is_bank"], r["enabled"]] for r in rows],
                "widths": [10, 18, 10, 10, 10, 10, 8]}
    if name == "projects":
        rows = q(conn, "SELECT * FROM projects ORDER BY id")
        return {"name": "核算项目", "headers": ["ID", "名称", "启用"], "rows": [[r["id"], r["name"], r["enabled"]] for r in rows]}
    if name == "counterparties":
        rows = q(conn, "SELECT * FROM counterparties ORDER BY id")
        return {"name": "往来单位", "headers": ["ID", "名称", "类型", "启用"], "rows": [[r["id"], r["name"], r["kind"], r["enabled"]] for r in rows]}
    if name == "bank_accounts":
        rows = q(conn, "SELECT * FROM bank_accounts ORDER BY id")
        return {"name": "银行账户", "headers": ["ID", "名称", "开户行", "账号", "币种", "期初余额"],
                "rows": [[r["id"], r["name"], r["bank_name"], r["account_no"], r["currency"], r["opening_balance"]] for r in rows]}
    if name == "audit":
        rows = q(conn, "SELECT * FROM audit_logs ORDER BY id DESC LIMIT 2000")
        return {"name": "审计日志", "headers": ["时间", "操作人", "操作", "对象", "对象ID", "说明"],
                "rows": [[r["at"], r["actor"], r["action"], r["entity"], r["entity_id"], r["detail"]] for r in rows],
                "widths": [20, 12, 14, 14, 12, 40]}
    if name == "periods":
        rows = q(conn, "SELECT * FROM periods ORDER BY period")
        return {"name": "会计期间", "headers": ["期间", "状态", "结账时间", "结账人"],
                "rows": [[r["period"], r["status"], r["closed_at"], r["closed_by"]] for r in rows]}
    if name == "invoices":
        rows = q(conn, """SELECT i.*,c.name AS cp_name,s.name AS subject_name,v.voucher_no FROM invoices i
                LEFT JOIN counterparties c ON c.id=i.counterparty_id
                LEFT JOIN subjects s ON s.code=i.subject_code
                LEFT JOIN vouchers v ON v.id=i.voucher_id ORDER BY i.invoice_date,i.id""")
        return {"name": "发票台账", "headers": ["发票号码", "发票代码", "类型", "日期", "往来单位", "不含税金额", "税额", "价税合计", "科目", "状态", "凭证号", "备注"],
                "rows": [[r["invoice_no"], r["invoice_code"], r["kind"], r["invoice_date"], r["cp_name"],
                          r["amount"], r["tax_amount"], r["total_amount"], r["subject_name"], r["status"],
                          r["voucher_no"], r["note"]] for r in rows],
                "widths": [16, 14, 8, 12, 14, 14, 12, 14, 14, 10, 16, 24]}
    if name == "budgets":
        rows = q(conn, """SELECT b.*,s.name AS subject_name,p.name AS project_name FROM budgets b
                LEFT JOIN subjects s ON s.code=b.subject_code LEFT JOIN projects p ON p.id=b.project_id ORDER BY b.period,b.id""")
        return {"name": "预算", "headers": ["期间", "科目", "项目", "预算金额", "备注"],
                "rows": [[r["period"], r["subject_name"] or r["subject_code"], r["project_name"], r["amount"], r["note"]] for r in rows]}
    if name == "attachments":
        rows = q(conn, "SELECT * FROM attachments ORDER BY id DESC")
        return {"name": "文档附件", "headers": ["文件名", "类型", "大小", "关联对象", "上传人", "时间"],
                "rows": [[r["filename"], r["file_type"], r["size"], (r["entity_type"] or "") + (("#" + str(r["entity_id"])) if r["entity_id"] else ""), r["uploaded_by"], r["created_at"]] for r in rows]}
    if name == "assets":
        rows = q(conn, "SELECT * FROM assets ORDER BY asset_no")
        return {"name": "固定资产", "headers": ["资产编号", "名称", "类别", "购入日期", "原值", "残值率", "折旧月数", "累计折旧", "净值", "月折旧", "费用科目", "状态"],
                "rows": [[r["asset_no"], r["name"], r["category"], r["purchase_date"], r["original_value"],
                          r["salvage_rate"], r["useful_life_months"], r["accumulated"],
                          round(r["original_value"] - r["accumulated"], 2), monthly_depreciation(r),
                          r["expense_subject"], r["status"]] for r in rows],
                "widths": [14, 22, 12, 12, 14, 10, 10, 14, 14, 12, 12, 10]}
    if name == "openings":
        rows = q(conn, """SELECT ob.*,s.name AS subject_name FROM opening_balances ob
                LEFT JOIN subjects s ON s.code=ob.subject_code ORDER BY ob.period,ob.subject_code""")
        return {"name": "期初余额", "headers": ["期间", "科目编码", "科目名称", "借方期初", "贷方期初"],
                "rows": [[r["period"], r["subject_code"], r["subject_name"], r["debit"], r["credit"]] for r in rows]}
    raise ApiError("未知导出对象: " + name)


def file_result(data, filename, ctype):
    return {"_file": data, "_filename": filename, "_ctype": ctype}


@route("GET", r"/api/export/workbook\.xlsx")
def export_workbook(conn, m, body, qs):
    names = (qs.get("tables") or ["journal"])[0].split(",")
    names = [n for n in names if n in EXPORT_LABELS]
    if not names:
        raise ApiError("请指定要导出的表")
    sheets = [export_sheet(conn, n) for n in names]
    fn = f"会计出纳系统_{'-'.join(EXPORT_LABELS[n] for n in names)}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return file_result(make_xlsx(sheets), fn,
                       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@route("GET", r"/api/export/template\.xlsx")
def export_template(conn, m, body, qs):
    target = (qs.get("target") or ["journal"])[0]
    if target not in IMPORT_TEMPLATES:
        raise ApiError("该对象没有导入模板")
    headers, sample = IMPORT_TEMPLATES[target]
    data = make_xlsx([{"name": "导入模板", "headers": headers, "rows": sample,
                       "widths": [16] * len(headers)},
                      {"name": "填写说明", "headers": ["说明"], "rows": [
                          ["1. 请保留第一行表头，不要修改列顺序。"],
                          ["2. 金额列只填数字，不要带 ¥ 或逗号。"],
                          ["3. 日期格式 YYYY-MM-DD，如 2026-11-06。"],
                          ["4. 「账户」可填 现金/库存现金 或 银行/银行存款。"],
                          ["5. 「对方科目」可填科目编码或科目名称，需与基础资料一致。"],
                          ["6. 收入与支出同一行只能填一个；Word/PPT 文档请走「文档登记」。"],
                      ]}])
    return file_result(data, f"导入模板_{EXPORT_LABELS.get(target, target)}.xlsx",
                       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


def report_blocks(conn):
    o = one(conn, """SELECT SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS income,
             SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS expense,COUNT(*) AS cnt FROM journal""")
    monthly = q(conn, """SELECT period,SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS income,
               SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS expense,COUNT(*) AS cnt
               FROM journal GROUP BY period ORDER BY period""")
    projects = q(conn, """SELECT COALESCE(p.name,'未归属项目') AS project,SUM(l.debit) AS debit,SUM(l.credit) AS credit
               FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
               LEFT JOIN projects p ON p.id=l.project_id GROUP BY l.project_id""")
    subjects = q(conn, """SELECT s.name AS subject_name,SUM(l.debit) AS debit,SUM(l.credit) AS credit
               FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
               LEFT JOIN subjects s ON s.code=l.subject_code GROUP BY l.subject_code ORDER BY l.subject_code""")
    journal = q(conn, """SELECT j.*,v.voucher_no FROM journal j LEFT JOIN vouchers v ON v.id=j.voucher_id
               ORDER BY j.journal_date,j.id LIMIT 200""")
    rec = reconciliation(conn, None, None, {"_": []})
    cash, bank = current_balance(conn, "cash"), current_balance(conn, "bank", default_bank_id(conn))
    blocks = [
        ("p", f"报告期间：累计 {len(monthly)} 个月 · 生成时间 {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
        ("h", "一、资金概况"),
        ("p", f"现金账面余额 ¥{cash:,.2f}；银行账面余额 ¥{bank:,.2f}；累计收入 ¥{(o['income'] or 0):,.2f}；累计支出 ¥{(o['expense'] or 0):,.2f}；日记账 {o['cnt']} 笔。"),
        ("h", "二、各月收支汇总"),
        ("table", ["月份", "收入", "支出", "净流入", "笔数"],
         [[x["period"], f"{x['income']:,.2f}", f"{x['expense']:,.2f}", f"{x['income']-x['expense']:,.2f}", x["cnt"]] for x in monthly]),
        ("h", "三、项目收支"),
        ("table", ["项目", "借方发生额", "贷方发生额"],
         [[x["project"], f"{x['debit']:,.2f}", f"{x['credit']:,.2f}"] for x in projects]),
        ("h", "四、科目发生额"),
        ("table", ["科目", "借方", "贷方"],
         [[x["subject_name"] or "—", f"{x['debit']:,.2f}", f"{x['credit']:,.2f}"] for x in subjects]),
        ("h", "五、银行存款余额调节"),
        ("p", f"企业账面余额 ¥{rec['book_balance']:,.2f}；银行对账单余额 ¥{rec['statement_balance']:,.2f}；调节后差额 ¥{rec['adjusted_book']-rec['adjusted_bank']:,.2f}（{'调节相符' if rec['balanced'] else '存在差异'}）。"),
        ("h", "六、日记账明细（最近 200 笔）"),
        ("table", ["日期", "账户", "凭证号", "摘要", "收入", "支出", "结余", "对账"],
         [[x["journal_date"], "现金" if x["account_kind"] == "cash" else "银行", x["voucher_no"] or "", x["summary"] or "",
           f"{x['amount']:,.2f}" if x["direction"] == "in" else "",
           f"{x['amount']:,.2f}" if x["direction"] == "out" else "",
           f"{x['balance_after']:,.2f}", x["recon_status"]] for x in journal]),
    ]
    return blocks, monthly, projects, rec, cash, bank


@route("GET", r"/api/export/report\.docx")
def export_docx(conn, m, body, qs):
    blocks, _, _, _, _, _ = report_blocks(conn)
    return file_result(make_docx("会计出纳财务报告", blocks),
                       f"财务报告_{datetime.now().strftime('%Y%m%d')}.docx",
                       "application/vnd.openxmlformats-officedocument.wordprocessingml.document")


@route("GET", r"/api/export/report\.pptx")
def export_pptx(conn, m, body, qs):
    blocks, monthly, projects, rec, cash, bank = report_blocks(conn)
    slides = [
        {"title": "会计出纳工作汇报", "bullets": [
            f"生成日期：{datetime.now().strftime('%Y-%m-%d')}", "系统：会计出纳全流程管理系统",
            "内容：资金概况 / 月度收支 / 项目核算 / 银行对账"]},
        {"title": "一、资金概况", "bullets": [
            f"现金账面余额：¥{cash:,.2f}", f"银行账面余额：¥{bank:,.2f}",
            f"调节后差额：¥{rec['adjusted_book']-rec['adjusted_bank']:,.2f}",
            "对账状态：" + ("调节相符" if rec["balanced"] else "存在差异，需核查")]},
        {"title": "二、各月收支汇总", "headers": ["月份", "收入", "支出", "净流入", "笔数"],
         "rows": [[x["period"], f"{x['income']:,.2f}", f"{x['expense']:,.2f}",
                   f"{x['income']-x['expense']:,.2f}", x["cnt"]] for x in monthly]},
        {"title": "三、项目收支汇总", "headers": ["项目", "借方发生额", "贷方发生额"],
         "rows": [[x["project"], f"{x['debit']:,.2f}", f"{x['credit']:,.2f}"] for x in projects]},
        {"title": "四、银行存款余额调节", "bullets": [
            f"企业账面余额：¥{rec['book_balance']:,.2f}", f"银行对账单余额：¥{rec['statement_balance']:,.2f}",
            f"银行已收企业未收：¥{rec['bank_unrecorded_in']:,.2f}", f"银行已付企业未付：¥{rec['bank_unrecorded_out']:,.2f}",
            f"企业已收银行未收：¥{rec['comp_unrecorded_in']:,.2f}", f"企业已付银行未付：¥{rec['comp_unrecorded_out']:,.2f}",
            "结论：" + ("双方调节后余额相符" if rec["balanced"] else "存在未达账项差异，需继续核查")]},
    ]
    return file_result(make_pptx("会计出纳工作汇报", slides),
                       f"工作汇报_{datetime.now().strftime('%Y%m%d')}.pptx",
                       "application/vnd.openxmlformats-officedocument.presentationml.presentation")


@route("POST", r"/api/import/preview")
def import_preview(conn, m, body, qs):
    """解析 Excel/CSV 表格，或提取 Word/PPT 文本用于文档登记"""
    filename = body.get("filename") or "upload.xlsx"
    try:
        raw = base64.b64decode(body.get("content") or "")
    except Exception:
        raise ApiError("文件内容解码失败")
    if not raw:
        raise ApiError("文件为空")
    low = filename.lower()
    if low.endswith(".xlsx"):
        sheets = read_xlsx(raw)
        if not sheets or not sheets[0]["rows"]:
            raise ApiError("Excel 中没有可读取的数据")
        rows = sheets[0]["rows"]
        return {"kind": "table", "sheet": sheets[0]["name"], "sheet_count": len(sheets),
                "headers": [str(x) for x in rows[0]],
                "rows": [dict(zip([str(x) for x in rows[0]], r)) for r in rows[1:201]],
                "total": max(0, len(rows) - 1)}
    if low.endswith(".csv"):
        text = raw.decode("utf-8-sig", "ignore")
        rr = list(csv.reader(io.StringIO(text)))
        if not rr:
            raise ApiError("CSV 为空")
        h = [str(x).strip() for x in rr[0]]
        return {"kind": "table", "sheet": "CSV", "sheet_count": 1, "headers": h,
                "rows": [dict(zip(h, r)) for r in rr[1:201]], "total": max(0, len(rr) - 1)}
    if low.endswith((".docx", ".pptx", ".txt", ".md")):
        kind, lines = extract_office_text(filename, raw)
        return {"kind": "document", "file_type": kind, "lines": lines[:120], "total": len(lines)}
    raise ApiError("支持 .xlsx / .csv / .docx / .pptx / .txt / .md 文件")


def g(row, *keys):
    """按列名（精确或包含）取值"""
    for k in keys:
        if k in row and row[k] not in (None, ""):
            return str(row[k]).strip()
    for k, v in row.items():
        ks = str(k)
        for key in keys:
            if key in ks and v not in (None, ""):
                return str(v).strip()
    return ""


def num(v):
    try:
        return float(str(v).replace(",", "").replace("¥", "").strip()) or 0.0
    except (ValueError, TypeError):
        return 0.0


def resolve_subject(conn, text):
    if not text:
        return None
    r = one(conn, "SELECT code FROM subjects WHERE code=? OR name=?", (text, text))
    return r["code"] if r else None


def resolve_id(conn, table, text, kind=None):
    if not text:
        return None
    r = one(conn, f"SELECT id FROM {table} WHERE name=?", (text,))
    if r:
        return r["id"]
    if table == "counterparties":
        cur = conn.execute("INSERT INTO counterparties(name,kind) VALUES(?,?)", (text, kind or "客户"))
    else:
        cur = conn.execute(f"INSERT INTO {table}(name) VALUES(?)", (text,))
    return cur.lastrowid


@route("POST", r"/api/import/execute")
def import_execute(conn, m, body, qs):
    """按目标表执行导入，走与界面一致的校验与业务逻辑"""
    target = body.get("target")
    rows = body.get("rows") or []
    actor = body.get("actor") or "系统"
    if target not in IMPORT_TEMPLATES:
        raise ApiError("导入目标无效")
    if not rows:
        raise ApiError("没有可导入的数据行")
    ok, errors = 0, []
    doc_type_map = {"付款申请": "payment", "收款单": "receipt", "备用金借款": "advance", "费用报销": "reimbursement"}
    voucher_groups = {}

    for idx, row in enumerate(rows, 2):
        try:
            date = g(row, "日期", "date", "单据日期") or datetime.now().strftime("%Y-%m-%d")
            date = date.replace("/", "-")[:10]
            account = g(row, "账户", "收付账户", "account")
            kind = "bank" if ("银行" in account or account.lower() == "bank") else "cash"
            if target == "journal":
                income, expense = num(g(row, "收入", "借方", "income")), num(g(row, "支出", "贷方", "expense"))
                if income > 0 and expense > 0:
                    raise ApiError("收入与支出不能同时填写")
                if income <= 0 and expense <= 0:
                    raise ApiError("缺少金额")
                subj = resolve_subject(conn, g(row, "对方科目", "科目", "subject"))
                if not subj:
                    raise ApiError("对方科目不存在（请先在基础资料中添加）")
                manual_journal(conn, None, {
                    "date": date, "direction": "in" if income > 0 else "out",
                    "amount": income if income > 0 else expense, "account_kind": kind,
                    "subject_code": subj, "summary": g(row, "摘要", "事由", "summary") or "Excel 导入",
                    "project_id": resolve_id(conn, "projects", g(row, "项目", "project")),
                    "counterparty_id": resolve_id(conn, "counterparties", g(row, "往来单位", "客户", "供应商")),
                    "actor": actor}, {})
            elif target == "docs":
                t = doc_type_map.get(g(row, "单据类型", "类型", "doc_type"), "payment")
                subj = resolve_subject(conn, g(row, "对方科目", "科目", "subject"))
                if not subj:
                    raise ApiError("对方科目不存在")
                add_doc(conn, None, {
                    "doc_type": t, "doc_date": date, "amount": num(g(row, "金额", "amount")),
                    "account_kind": kind, "subject_code": subj,
                    "project_id": resolve_id(conn, "projects", g(row, "项目", "project")),
                    "counterparty_id": resolve_id(conn, "counterparties", g(row, "往来单位", "客户", "供应商")),
                    "applicant": g(row, "申请人", "applicant") or actor,
                    "dept": g(row, "部门"), "reason": g(row, "事由", "摘要"), "actor": actor}, {})
            elif target == "vouchers":
                no = g(row, "凭证号", "voucher_no") or f"IMP-{date}-{idx}"
                group = voucher_groups.setdefault(no, {"date": date, "type": g(row, "凭证字", "字") or "转",
                                                       "summary": g(row, "摘要") or "Excel 导入", "lines": []})
                subj = resolve_subject(conn, g(row, "科目", "对方科目", "subject"))
                if not subj:
                    raise ApiError("科目不存在")
                group["lines"].append({"subject_code": subj, "debit": num(g(row, "借方", "debit")),
                                       "credit": num(g(row, "贷方", "credit")),
                                       "project_id": resolve_id(conn, "projects", g(row, "项目", "project"))})
            elif target == "statements":
                add_statement(conn, None, {"items": [{
                    "date": date, "description": g(row, "摘要", "description"),
                    "amount_in": num(g(row, "收入", "amount_in")),
                    "amount_out": num(g(row, "支出", "amount_out"))}], "actor": actor}, {})
            elif target == "subjects":
                code, name = g(row, "编码", "code"), g(row, "名称", "name")
                if not code or not name:
                    raise ApiError("缺少编码或名称")
                conn.execute("""INSERT INTO subjects(code,name,category,direction) VALUES(?,?,?,?)
                                ON CONFLICT(code) DO UPDATE SET name=excluded.name""",
                             (code, name, g(row, "类别", "category") or "资产", g(row, "余额方向", "direction") or "借"))
            elif target == "projects":
                name = g(row, "名称", "name")
                if not name:
                    raise ApiError("缺少名称")
                conn.execute("INSERT OR IGNORE INTO projects(name) VALUES(?)", (name,))
            elif target == "counterparties":
                name = g(row, "名称", "name")
                if not name:
                    raise ApiError("缺少名称")
                conn.execute("INSERT OR IGNORE INTO counterparties(name,kind) VALUES(?,?)",
                             (name, g(row, "类型", "kind") or "客户"))
            elif target == "bank_accounts":
                name = g(row, "名称", "name")
                if not name:
                    raise ApiError("缺少名称")
                conn.execute("INSERT INTO bank_accounts(name,bank_name,account_no,opening_balance) VALUES(?,?,?,?)",
                             (name, g(row, "开户行"), g(row, "账号"), num(g(row, "期初余额", "opening_balance"))))
            elif target == "invoices":
                fno = g(row, "发票号码", "invoice_no")
                kind = g(row, "类型", "kind")
                if not fno or kind not in ("进项", "销项"):
                    raise ApiError("缺少发票号码或类型应为 进项/销项")
                if one(conn, "SELECT id FROM invoices WHERE invoice_no=? AND kind=?", (fno, kind)):
                    raise ApiError(f"发票号 {fno} 重复，已跳过（查重）")
                amt = num(g(row, "不含税金额", "amount"))
                tax = num(g(row, "税额", "tax_amount"))
                cp = g(row, "往来单位", "counterparty")
                conn.execute("""INSERT INTO invoices(invoice_no,invoice_code,kind,invoice_date,period,counterparty_id,
                        amount,tax_amount,total_amount,subject_code,status,note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (fno, g(row, "发票代码"), kind, date, period_of(date),
                     resolve_id(conn, "counterparties", cp), amt, tax, round(amt + tax, 2),
                     resolve_subject(conn, g(row, "科目", "subject")) or "", "未入账", g(row, "备注", "note"), now()))
            elif target == "budgets":
                per = g(row, "期间", "period") or period_of(date)
                amt = num(g(row, "预算金额", "amount"))
                if amt <= 0:
                    raise ApiError("预算金额必须大于 0")
                conn.execute("""INSERT INTO budgets(period,subject_code,project_id,amount,note) VALUES(?,?,?,?,?)
                        ON CONFLICT(period,subject_code,project_id) DO UPDATE SET amount=excluded.amount""",
                    (per, resolve_subject(conn, g(row, "科目", "subject")),
                     resolve_id(conn, "projects", g(row, "项目", "project")), amt, g(row, "备注", "note")))
            ok += 1
        except Exception as e:
            errors.append(f"第 {idx} 行：{getattr(e, 'msg', str(e))}")
    if target == "vouchers":
        for no, grp in voucher_groups.items():
            try:
                create_voucher(conn, {"voucher_no": no, "voucher_date": grp["date"],
                                      "voucher_type": grp["type"], "summary": grp["summary"],
                                      "lines": grp["lines"], "maker": actor}, actor, auto_post=True)
                ok += 1
            except ApiError as e:
                errors.append(f"凭证 {no}：{e.msg}")
    conn.execute("""INSERT INTO import_logs(at,actor,target,filename,success_count,error_count,detail)
                    VALUES(?,?,?,?,?,?,?)""",
                 (now(), actor, target, body.get("filename") or "", ok, len(errors),
                  "; ".join(errors[:10])))
    log(conn, "Excel 导入", "import", target, f"成功 {ok} 行 / 失败 {len(errors)} 行", actor)
    return {"ok": True, "success": ok, "errors": errors[:20], "error_count": len(errors)}


@route("GET", r"/api/import/logs")
def import_logs(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM import_logs ORDER BY id DESC LIMIT 100")}


@route("POST", r"/api/documents/upload")
def upload_document(conn, m, body, qs):
    """登记 Word / PPT / PDF 等文档附件，并提取文本供检索"""
    filename = body.get("filename") or "document"
    try:
        raw = base64.b64decode(body.get("content") or "")
    except Exception:
        raise ApiError("文件内容解码失败")
    if not raw:
        raise ApiError("文件为空")
    safe = re.sub(r"[^\w.\-]", "_", os.path.basename(filename))[:120]
    folder = os.path.join(BASE, "data", "attachments")
    os.makedirs(folder, exist_ok=True)
    stored = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{safe}"
    with open(os.path.join(folder, stored), "wb") as f:
        f.write(raw)
    ftype, lines = extract_office_text(filename, raw)
    cur = conn.execute("""INSERT INTO attachments(filename,file_type,size,stored_path,extracted_text,uploaded_by,created_at,entity_type,entity_id)
                          VALUES(?,?,?,?,?,?,?,?,?)""",
                       (filename, ftype, len(raw), stored, "\n".join(lines[:300]),
                        body.get("actor") or "系统", now(), body.get("entity_type"),
                        body.get("entity_id")))
    log(conn, "登记文档", "attachment", cur.lastrowid, f"{filename}（{ftype}）", body.get("actor") or "系统")
    return {"ok": True, "id": cur.lastrowid, "file_type": ftype, "lines": lines[:30]}


@route("GET", r"/api/documents")
def list_documents(conn, m, body, qs):
    return {"items": q(conn, "SELECT id,filename,file_type,size,uploaded_by,created_at,substr(extracted_text,1,120) AS excerpt FROM attachments ORDER BY id DESC LIMIT 200")}


@route("GET", r"/api/documents/(\d+)/download")
def download_document(conn, m, body, qs):
    r = one(conn, "SELECT * FROM attachments WHERE id=?", (int(m.group(1)),))
    if not r:
        raise ApiError("文档不存在", 404)
    path = os.path.join(BASE, "data", "attachments", r["stored_path"])
    if not os.path.exists(path):
        raise ApiError("文件已丢失", 404)
    with open(path, "rb") as f:
        data = f.read()
    return file_result(data, r["filename"], "application/octet-stream")


# ---------------- HTTP 处理 ----------------
class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass

    def _send(self, status, payload, ctype="application/json; charset=utf-8", extra=None):
        if isinstance(payload, (bytes, bytearray)):
            data = bytes(payload)
        elif isinstance(payload, str):
            data = payload.encode("utf-8")
        else:
            data = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if not n:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            raise ApiError("请求体不是合法 JSON")

    def _dispatch(self, method):
        u = urlparse(self.path)
        path = u.path
        if not path.startswith("/api/"):
            self._static(path)
            return
        body = self._body() if method in ("POST", "PUT", "PATCH") else {}
        qs = parse_qs(u.query)
        conn = connect()
        try:
            # 安全中间件：默认只观测不阻断（security_enabled=0），异常不得影响业务
            try:
                from app.extensions.security import inspect_request
                sec = inspect_request(conn, method, path, qs, body,
                                      client_ip=(self.client_address[0] if self.client_address else "local"),
                                      token=self.headers.get("X-CSRF-Token"))
                if sec and sec.get("block"):
                    raise ApiError(sec["reason"], 429)
            except ApiError:
                raise
            except Exception:
                pass
            fn, mo = get_router().match(method, path)
            if fn is None:
                raise ApiError("接口不存在", 404)
            result = fn(conn, mo, body, qs)
            conn.commit()
            if isinstance(result, dict) and "_csv" in result:
                self._send(200, "\ufeff" + result["_csv"], "text/csv; charset=utf-8",
                           {"Content-Disposition": 'attachment; filename="journal.csv"'})
            elif isinstance(result, dict) and "_inline" in result:
                self._send(200, result["_inline"], result.get("_ctype", "text/html; charset=utf-8"),
                           {"Content-Disposition": "inline"})
            elif isinstance(result, dict) and "_file" in result:
                fname = result.get("_filename", "export.bin")
                self._send(200, result["_file"], result["_ctype"],
                           {"Content-Disposition": "attachment; filename*=UTF-8''" + quote(fname)})
            else:
                self._send(200, result)
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            # 客户端提前断开（大屏轮询、快速切页、取消下载）。此时再写 500 响应
            # 会触发二次异常并刷屏日志，静默回滚即可，不影响其他请求线程。
            conn.rollback()
        except ApiError as e:
            conn.rollback()
            self._send(e.status, {"error": e.msg})
        except Exception as e:
            conn.rollback()
            traceback.print_exc()
            try:
                self._send(500, {"error": f"服务端错误: {e}"})
            except OSError:
                pass
        finally:
            conn.close()

    def _static(self, path):
        files = {"/": ("index.html", "text/html; charset=utf-8"),
                 "/index.html": ("index.html", "text/html; charset=utf-8"),
                 "/app.js": ("app.js", "application/javascript; charset=utf-8"),
                 "/styles.css": ("styles.css", "text/css; charset=utf-8")}
        # 前端按职责拆成 /js/*.js 模块；目录白名单 + 路径规范校验，避免遍历攻击
        if path.startswith("/js/") and path.endswith(".js") and ".." not in path:
            files[path] = (path[1:], "application/javascript; charset=utf-8")
        if path not in files:
            self._send(404, {"error": "not found"})
            return
        name, ctype = files[path]
        fp = os.path.abspath(os.path.join(PUBLIC, *name.split("/")))
        if not fp.startswith(os.path.abspath(PUBLIC) + os.sep) or not os.path.isfile(fp):
            self._send(404, {"error": "missing frontend: " + name})
            return
        with open(fp, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    def do_DELETE(self):
        self._dispatch("DELETE")


class Server(ThreadingHTTPServer):
    """守护线程 + 端口复用：关闭窗口时不残留挂起线程，重启也不会被 TIME_WAIT 卡住"""
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 64

    def handle_error(self, request, client_address):
        """客户端在 HTTP/1.1 keep-alive 等待期间断开时静默处理。

        这类 ConnectionAbortedError 发生在标准库 handle_one_request 读下一行时，
        不在 _dispatch 内，若交给父类会打印整段 traceback，把启动日志刷屏。
        真实业务异常仍照常输出，方便排查。
        """
        import sys
        exc = sys.exc_info()[1]
        if isinstance(exc, (BrokenPipeError, ConnectionAbortedError, ConnectionResetError)):
            try:
                self.shutdown_request(request)
            except OSError:
                pass
            return
        super().handle_error(request, client_address)


def main():
    from app.bootstrap import start
    container = start()          # 组合根：装配依赖、注册全部控制器
    versions = migrate()
    print(f"[journal-pro] migrations applied: {versions}", flush=True)
    print(f"[journal-pro] routes: {len(container.router)} | serving on 0.0.0.0:{PORT}", flush=True)
    try:
        Server(("0.0.0.0", PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print("[journal-pro] stopped", flush=True)


# 控制器不再由本模块反向导入：app.bootstrap 作为组合根负责装配与注册。
# 这样 server → app.routing 单向，features/analytics_api → app，彻底消除环。

if __name__ == "__main__":
    main()
