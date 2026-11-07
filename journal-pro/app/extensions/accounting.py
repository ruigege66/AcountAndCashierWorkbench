# -*- coding: utf-8 -*-
"""V2.8 会计域：8 项功能。"""
import json
import re
from datetime import datetime, timedelta

from app.routing import route
from .common import (q, one, now, today, r2, period_of, setting, set_setting,
                     jsetting, log, months_between, shift_month, require)

P = "/api/v28"


# ---- 1. 辅助核算维度（部门 / 职员 / 自定义标签） ----
@route("GET", P + r"/dimensions")
def dim_list(conn, m, body, qs):
    key = (qs.get("dim_key") or [""])[0]
    rows = q(conn, "SELECT * FROM dim_values " + ("WHERE dim_key=? " if key else "") +
             "ORDER BY id DESC LIMIT 300", (key,) if key else ())
    return {"items": rows, "keys": [r["dim_key"] for r in
            q(conn, "SELECT DISTINCT dim_key FROM dim_values ORDER BY dim_key")]}


@route("POST", P + r"/dimensions")
def dim_set(conn, m, body, qs):
    et, eid = body.get("entity_type"), body.get("entity_id")
    key, val = (body.get("dim_key") or "").strip(), (body.get("dim_value") or "").strip()
    require(et and eid and key and val, "entity_type / entity_id / dim_key / dim_value 均不能为空")
    conn.execute("""INSERT INTO dim_values(entity_type,entity_id,dim_key,dim_value,created_at)
                    VALUES(?,?,?,?,?) ON CONFLICT(entity_type,entity_id,dim_key)
                    DO UPDATE SET dim_value=excluded.dim_value""", (et, eid, key, val, now()))
    log(conn, "设置辅助核算维度", et, eid, f"{key}={val}", body.get("actor") or "会计")
    return {"ok": True, "entity_type": et, "entity_id": eid, "dim_key": key, "dim_value": val}


@route("GET", P + r"/dimensions/report")
def dim_report(conn, m, body, qs):
    key = (qs.get("dim_key") or ["部门"])[0]
    period = period_of(qs)
    rows = q(conn, """SELECT d.dim_value AS dim_value, s.name AS subject_name, l.subject_code,
               SUM(l.debit) AS debit, SUM(l.credit) AS credit
               FROM dim_values d JOIN voucher_lines l ON l.id=d.entity_id AND d.entity_type='voucher_line'
               JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period=?
               LEFT JOIN subjects s ON s.code=l.subject_code
               WHERE d.dim_key=? GROUP BY d.dim_value,l.subject_code
               ORDER BY d.dim_value,l.subject_code""", (period, key))
    summary = {}
    for r in rows:
        g = summary.setdefault(r["dim_value"], {"dim_value": r["dim_value"], "debit": 0.0,
                                                "credit": 0.0, "subjects": []})
        g["debit"] += r["debit"]
        g["credit"] += r["credit"]
        g["subjects"].append({"subject": r["subject_name"] or r["subject_code"],
                              "debit": r2(r["debit"]), "credit": r2(r["credit"])})
    out = list(summary.values())
    for g in out:
        g["debit"], g["credit"] = r2(g["debit"]), r2(g["credit"])
        g["net"] = r2(g["debit"] - g["credit"])
    return {"period": period, "dim_key": key, "items": out,
            "hint": "维度挂在凭证明细行（entity_type=voucher_line），可用「设置维度」接口批量打标"}


# ---- 2. 凭证批量审核 / 过账 ----
@route("POST", P + r"/vouchers/batch")
def voucher_batch(conn, m, body, qs):
    ids = [int(x) for x in re.findall(r"\d+", str(body.get("ids") or ""))][:100]
    action = body.get("action") or "post"
    actor = body.get("actor") or "会计"
    require(ids, "请提供凭证 ID 列表")
    require(action in ("approve", "post"), "action 只能是 approve 或 post")
    from app import facade
    separate = setting(conn, "separate_duties", "1") == "1"
    done, failed = [], []
    for vid in ids:
        v = one(conn, "SELECT id,voucher_no,maker,status,period FROM vouchers WHERE id=?", (vid,))
        if not v:
            failed.append({"id": vid, "reason": "凭证不存在"})
            continue
        if separate and v["maker"] == actor and actor != "系统":
            failed.append({"id": vid, "reason": "职责分离：不能审核/过账自己制的凭证"})
            continue
        try:
            if action == "approve":
                require(v["status"] in ("draft", "submitted"), f"{v['voucher_no']} 状态不允许审核")
                conn.execute("UPDATE vouchers SET status='approved',approved_by=? WHERE id=?", (actor, vid))
            else:
                require(v["status"] != "posted", f"{v['voucher_no']} 已过账")
                facade.post_voucher(conn, vid, actor)
            done.append({"id": vid, "no": v["voucher_no"]})
        except Exception as e:
            failed.append({"id": vid, "reason": str(e)})
    log(conn, "凭证批量" + action, "voucher", None,
        f"成功 {len(done)} / 失败 {len(failed)}", actor)
    return {"ok": True, "action": action, "done": done, "failed": failed,
            "impacts": {"count": 6, "label": "凭证批量过账",
                        "affects": [{"id": "balance_sheet", "label": "资产负债表", "effect": "分录进入科目余额"},
                                    {"id": "income", "label": "利润表", "effect": "损益类分录改变净利润"},
                                    {"id": "cashflow", "label": "现金流量表", "effect": "现金银行分录登记日记账"},
                                    {"id": "ratios", "label": "财务比率", "effect": "余额与净利变化传导到全部指标"},
                                    {"id": "compare", "label": "同比环比", "effect": "本期数变化"},
                                    {"id": "todo", "label": "待办中心", "effect": "未过账凭证数减少"}]}}


# ---- 3. 多期试算平衡对比 ----
@route("GET", P + r"/reports/trial-compare")
def trial_compare(conn, m, body, qs):
    periods = [p for p in (qs.get("periods") or [""])[0].split(",") if re.match(r"^\d{4}-\d{2}$", p)]
    if not periods:
        cur = period_of(qs)
        periods = [shift_month(cur, -1), cur]
    codes = {}
    for p in periods:
        for r in q(conn, """SELECT l.subject_code,s.name AS name,
                   SUM(l.debit) AS d,SUM(l.credit) AS c FROM voucher_lines l
                   JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period=?
                   LEFT JOIN subjects s ON s.code=l.subject_code
                   GROUP BY l.subject_code""", (p,)):
            g = codes.setdefault(r["subject_code"], {"code": r["subject_code"], "name": r["name"], "values": {}})
            g["values"][p] = r2(r["d"] - r["c"])
    items = []
    for g in codes.values():
        vals = [g["values"].get(p, 0.0) for p in periods]
        first = vals[0]
        g["values"] = {p: r2(g["values"].get(p, 0.0)) for p in periods}
        g["change"] = r2(vals[-1] - first)
        g["change_pct"] = round((vals[-1] - first) / abs(first) * 100, 1) if abs(first or 0) > 0.005 else None
        g["flag"] = "异常波动" if g["change_pct"] is not None and abs(g["change_pct"]) > 100 else "正常"
        items.append(g)
    items.sort(key=lambda x: -abs(x["change"]))
    return {"periods": periods, "items": items,
            "abnormal": [x for x in items if x["flag"] == "异常波动"],
            "hint": "按科目比较各期借贷净发生额；波动超过 100% 标记为异常"}


# ---- 4. 待摊费用自动摊销 ----
@route("GET", P + r"/accruals")
def accrual_list(conn, m, body, qs):
    rows = q(conn, """SELECT a.*,COALESCE((SELECT SUM(amount) FROM accrual_runs r WHERE r.accrual_id=a.id),0) AS amortized
                      FROM accruals a ORDER BY a.id DESC""")
    for r in rows:
        r["months"] = months_between(r["start_period"], r["end_period"])
        r["monthly"] = r2(r["total_amount"] / max(r["months"], 1))
        r["remaining"] = r2(r["total_amount"] - r["amortized"])
    return {"items": rows}


@route("POST", P + r"/accruals")
def accrual_add(conn, m, body, qs):
    name = body.get("name") or ""
    total = float(body.get("total_amount") or 0)
    a, b = body.get("start_period") or "", body.get("end_period") or ""
    require(bool(name and total > 0 and a and b), "名称、总额、起止期间必须有效")
    require(months_between(a, b) > 0, "结束期间不能早于开始期间")
    cur = conn.execute("""INSERT INTO accruals(name,total_amount,start_period,end_period,
        expense_subject,prepaid_subject,created_at) VALUES(?,?,?,?,?,?,?)""",
        (name, total, a, b, body.get("expense_subject") or "6602",
         body.get("prepaid_subject") or "1123", now()))
    log(conn, "新增待摊费用", "accrual", cur.lastrowid, f"{name} ¥{total:,.2f}", body.get("actor") or "会计")
    return {"ok": True, "id": cur.lastrowid, "months": months_between(a, b),
            "monthly": r2(total / months_between(a, b))}


@route("POST", P + r"/accruals/run")
def accrual_run(conn, m, body, qs):
    period = body.get("period") or period_of(qs)
    actor = body.get("actor") or "会计"
    from app import facade
    done, skipped = [], []
    for a in q(conn, "SELECT * FROM accruals WHERE status='active'"):
        if not (a["start_period"] <= period <= a["end_period"]):
            continue
        if one(conn, "SELECT id FROM accrual_runs WHERE accrual_id=? AND period=?", (a["id"], period)):
            skipped.append({"name": a["name"], "reason": "本期已摊销"})
            continue
        months = months_between(a["start_period"], a["end_period"])
        monthly = r2(a["total_amount"] / max(months, 1))
        amortized = one(conn, "SELECT COALESCE(SUM(amount),0) v FROM accrual_runs WHERE accrual_id=?", (a["id"],))["v"]
        amount = min(monthly, r2(a["total_amount"] - amortized))
        if amount <= 0:
            skipped.append({"name": a["name"], "reason": "已摊完"})
            continue
        lines = [{"subject_code": a["expense_subject"], "debit": amount, "credit": 0},
                 {"subject_code": a["prepaid_subject"], "debit": 0, "credit": amount}]
        try:
            vid = facade.create_voucher(conn, {"voucher_date": f"{period}-01", "voucher_type": "转",
                "summary": f"{period} {a['name']}摊销", "lines": lines}, actor=actor, auto_post=True)
            conn.execute("INSERT INTO accrual_runs(accrual_id,period,amount,voucher_id,created_at) VALUES(?,?,?,?,?)",
                         (a["id"], period, amount, vid, now()))
            done.append({"name": a["name"], "amount": amount, "voucher_id": vid})
        except Exception as e:
            skipped.append({"name": a["name"], "reason": str(e)})
    log(conn, "执行待摊摊销", "accrual", None, f"{period} 成功 {len(done)} 笔", actor)
    return {"ok": True, "period": period, "done": done, "skipped": skipped,
            "impacts": {"count": 3, "label": "待摊费用摊销",
                        "affects": [{"id": "income", "label": "利润表", "effect": "费用计入当期损益"},
                                    {"id": "balance_sheet", "label": "资产负债表", "effect": "待摊资产减少"},
                                    {"id": "ratios", "label": "财务比率", "effect": "净利率变化"}]}}


# ---- 5. 凭证编号规则 ----
@route("GET", P + r"/numbering")
def numbering_get(conn, m, body, qs):
    return {"prefix": setting(conn, "numbering_prefix", "记-"),
            "digits": int(setting(conn, "numbering_digits", "3") or 3)}


@route("POST", P + r"/numbering")
def numbering_set(conn, m, body, qs):
    prefix = (body.get("prefix") or "记-").strip()
    digits = int(body.get("digits") or 3)
    require(1 <= digits <= 6 and prefix and " " not in prefix, "前缀不能为空且位数须在 1~6")
    set_setting(conn, "numbering_prefix", prefix)
    set_setting(conn, "numbering_digits", digits)
    log(conn, "修改凭证编号规则", "setting", "numbering", f"{prefix} / {digits} 位", body.get("actor") or "会计")
    return {"ok": True, "prefix": prefix, "digits": digits,
            "hint": "规则作用于新建凭证的建议编号；历史凭证号不受影响"}


@route("GET", P + r"/numbering/validate")
def numbering_validate(conn, m, body, qs):
    prefix = setting(conn, "numbering_prefix", "记-")
    digits = int(setting(conn, "numbering_digits", "3") or 3)
    pat = re.compile("^" + re.escape(prefix) + r"\d{6}\d{" + str(digits) + r"}$")
    rows = q(conn, "SELECT id,voucher_no,period FROM vouchers ORDER BY id")
    bad = [r for r in rows if not pat.match(r["voucher_no"] or "")]
    dup = [r[0] for r in q(conn, """SELECT voucher_no FROM vouchers GROUP BY voucher_no HAVING COUNT(*)>1""")]
    return {"total": len(rows), "nonstandard": bad[:100], "nonstandard_count": len(bad),
            "duplicates": [d["voucher_no"] for d in dup], "pattern": pat.pattern}


# ---- 6. 会计估计变更留痕 ----
@route("GET", P + r"/estimate-changes")
def estimate_list(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM estimate_changes ORDER BY id DESC LIMIT 200")}


@route("POST", P + r"/estimate-changes")
def estimate_add(conn, m, body, qs):
    kind, subject = body.get("kind") or "", body.get("subject") or ""
    require(kind and subject, "kind 与 subject 不能为空")
    cur = conn.execute("""INSERT INTO estimate_changes(kind,subject,old_value,new_value,reason,actor,created_at)
                          VALUES(?,?,?,?,?,?,?)""",
        (kind, subject, body.get("old_value") or "", body.get("new_value") or "",
         body.get("reason") or "", body.get("actor") or "会计", now()))
    log(conn, "登记会计估计变更", "estimate", cur.lastrowid, f"{kind} {subject}", body.get("actor") or "会计")
    return {"ok": True, "id": cur.lastrowid,
            "hint": "折旧年限、坏账比例、摊销期限等变更留痕，便于审计追溯"}


# ---- 7. 附件缺失检查与批量补链 ----
@route("GET", P + r"/vouchers/missing-attachments")
def missing_attachments(conn, m, body, qs):
    rows = q(conn, """SELECT v.id,v.voucher_no,v.voucher_date,v.summary,v.period
        FROM vouchers v LEFT JOIN attachments a ON a.entity_type='voucher' AND a.entity_id=v.id
        WHERE v.status='posted' AND a.id IS NULL ORDER BY v.voucher_date DESC,v.id DESC LIMIT 300""")
    return {"items": rows, "count": len(rows),
            "hint": "已过账但无附件的凭证；可用批量补链接口登记占位记录"}


@route("POST", P + r"/vouchers/link-attachments")
def link_attachments(conn, m, body, qs):
    ids = [int(x) for x in re.findall(r"\d+", str(body.get("ids") or ""))][:100]
    filename = body.get("filename") or "待补充附件"
    actor = body.get("actor") or "会计"
    require(ids, "请提供凭证 ID")
    done = []
    for vid in ids:
        if one(conn, "SELECT id FROM attachments WHERE entity_type='voucher' AND entity_id=?", (vid,)):
            continue
        conn.execute("""INSERT INTO attachments(filename,file_type,size,entity_type,entity_id,uploaded_by,created_at)
                        VALUES(?,?,?,?,?,?,?)""", (filename, "待补", 0, "voucher", vid, actor, now()))
        done.append(vid)
    log(conn, "批量补链凭证附件", "attachment", None, f"登记 {len(done)} 条占位", actor)
    return {"ok": True, "linked": len(done), "ids": done}


# ---- 8. 科目使用频率与僵尸科目分析 ----
@route("GET", P + r"/subjects/usage")
def subject_usage(conn, m, body, qs):
    rows = q(conn, """SELECT s.code,s.name,s.category,s.enabled,
        COUNT(l.id) AS uses,MAX(v.voucher_date) AS last_used
        FROM subjects s LEFT JOIN voucher_lines l ON l.subject_code=s.code
        LEFT JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
        GROUP BY s.code ORDER BY uses DESC,s.code""")
    for r in rows:
        r["used"] = r["uses"] > 0
        r["zombie"] = r["uses"] == 0
        if r["last_used"]:
            r["idle_days"] = (datetime.now().date() -
                              datetime.strptime(r["last_used"], "%Y-%m-%d").date()).days
        else:
            r["idle_days"] = None
        r["stale"] = bool(r["idle_days"] is not None and r["idle_days"] > 180)
    return {"items": rows, "zombies": [r for r in rows if r["zombie"]],
            "stale": [r for r in rows if r["stale"]],
            "hint": "僵尸科目（从未使用）可考虑停用；超过 180 天未使用的标记为 stale"}
