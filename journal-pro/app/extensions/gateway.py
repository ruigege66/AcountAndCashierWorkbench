# -*- coding: utf-8 -*-
"""V2.11 外部系统协同（开票 / 网银）合规自动化桥梁。

边界说明（重要）：
  * 本模块**不做**税局网站 / 网上银行的模拟登录、验证码绕过或凭据存储；
  * 资金与开票的最后一步必须在官方渠道由持 CA/UKey/OTP 的人员完成；
  * 系统自动化的是：数据准备、格式校验、批量文件生成、结果回传、台账更新、对账；
  * 若企业已与税局（乐企 / 数电票开放平台）或银行（银企直联 / 开放银行）签约，
    可切换 API 模式由企业自行对接（配置仅存端点与证书路径，不存任何密钥）。
"""
import csv
import io
import json
import re
from datetime import datetime

from app.routing import route
from app.errors import ApiError
from .common import q, one, now, today, r2, setting, set_setting, jsetting, log, require

P = "/api/v28/gateway"
INVOICE_COLUMNS = ["购买方名称", "购买方纳税人识别号", "购买方地址电话", "购买方开户行及账号",
                   "项目名称", "规格型号", "单位", "数量", "单价", "金额", "税率", "税额", "备注"]


def _csv_bytes(rows, columns, encoding="utf-8-sig", delimiter=","):
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=delimiter)
    w.writerow(columns)
    for r in rows:
        w.writerow([r.get(c, "") for c in columns])
    return buf.getvalue().encode(encoding, errors="replace")


def _parse_csv(text, columns, skip_header=True):
    rows = csv.reader(io.StringIO(text.replace("\t", ",")))
    out = []
    for i, parts in enumerate(rows):
        if skip_header and i == 0:
            continue
        if not parts or all(not str(x).strip() for x in parts):
            continue
        out.append({c: (parts[j].strip() if j < len(parts) else "") for j, c in enumerate(columns)})
    return out


def _f(v, default=0.0):
    try:
        return float(str(v).replace(",", "").replace("¥", "").strip() or default)
    except (ValueError, TypeError):
        return default


def _cp(conn, cid):
    return one(conn, "SELECT * FROM counterparties WHERE id=?", (cid,), ) if cid else None


def _file(data, name, ctype="text/csv; charset=utf-8"):
    return {"_file": data, "_filename": name, "_ctype": ctype}


def _task_payload_invoice(conn, row):
    cp = _cp(conn, row.get("counterparty_id"))
    amount = r2(row.get("amount") or row.get("total_amount") or 0)
    rate = _f(setting(conn, "gateway_default_tax_rate", "0.13"), 0.13)
    tax = r2(amount * rate)
    return {"counterparty_id": row.get("counterparty_id"),
            "buyer": (cp and (cp.get("invoice_title") or cp["name"])) or "",
            "tax_id": (cp and cp.get("tax_id")) or "",
            "address_phone": (cp and cp.get("address_phone")) or "",
            "buyer_bank": ((cp and cp.get("bank_name")) or "") + " " + ((cp and cp.get("bank_account")) or ""),
            "item": row.get("reason") or row.get("note") or "服务费",
            "amount": amount, "tax_rate": rate, "tax": tax, "total": r2(amount + tax),
            "ref_no": row.get("doc_no") or row.get("invoice_no") or ""}


def _validate_invoice(p):
    issues = []
    if not p["buyer"]:
        issues.append("缺少购买方名称/发票抬头")
    if not p["tax_id"]:
        issues.append("缺少购买方纳税人识别号")
    if p["amount"] <= 0:
        issues.append("金额必须大于 0")
    if not (0 <= p["tax_rate"] <= 1):
        issues.append("税率超出 0~1 范围")
    return issues


# ---- 1. 往来单位开票 / 收款资料 ----
@route("GET", P + r"/counterparties")
def cp_list(conn, m, body, qs):
    rows = q(conn, """SELECT id,name,kind,invoice_title,tax_id,address_phone,bank_name,bank_account
                      FROM counterparties ORDER BY id""")
    for r in rows:
        r["ready_invoice"] = bool(r["tax_id"] and (r["invoice_title"] or r["name"]))
        r["ready_payment"] = bool(r["bank_account"] and r["bank_name"])
    return {"items": rows, "ready_invoice": sum(1 for r in rows if r["ready_invoice"]),
            "ready_payment": sum(1 for r in rows if r["ready_payment"])}


@route("POST", P + r"/counterparties")
def cp_update(conn, m, body, qs):
    cid = int(body.get("id") or 0)
    require(one(conn, "SELECT id FROM counterparties WHERE id=?", (cid,)), "往来单位不存在")
    fields = {k: body.get(k) or "" for k in
              ("invoice_title", "tax_id", "address_phone", "bank_name", "bank_account")}
    conn.execute("""UPDATE counterparties SET invoice_title=?,tax_id=?,address_phone=?,
                    bank_name=?,bank_account=? WHERE id=?""",
                 (*[fields[k] for k in ("invoice_title", "tax_id", "address_phone", "bank_name", "bank_account")], cid))
    log(conn, "维护往来单位开票资料", "counterparty", cid, json.dumps(fields, ensure_ascii=False)[:150],
        body.get("actor") or "会计")
    return {"ok": True, "id": cid, **fields}


# ---- 2/3. 开票任务同步与列表 ----
@route("POST", P + r"/invoice-tasks/sync")
def invoice_sync(conn, m, body, qs):
    sources = []
    for r in q(conn, """SELECT id,doc_no,reason,counterparty_id,amount,period FROM docs
                        WHERE doc_type='receipt' AND status IN ('approved','settled')"""):
        sources.append(("doc", r["id"], _task_payload_invoice(conn, r)))
    for r in q(conn, """SELECT id,invoice_no,note,counterparty_id,total_amount,period FROM invoices
                        WHERE status='待开票'"""):
        p = _task_payload_invoice(conn, r)
        p["amount"] = r2(r["total_amount"])  # 待开票记录按价税合计
        sources.append(("invoice", r["id"], p))
    n = 0
    for ref_type, ref_id, p in sources:
        if one(conn, "SELECT id FROM external_tasks WHERE kind='invoice' AND ref_type=? AND ref_id=?",
               (ref_type, ref_id)):
            continue
        conn.execute("""INSERT INTO external_tasks(kind,ref_type,ref_id,status,payload_json,created_at)
                        VALUES('invoice',?,?,'pending',?,?)""",
                     (ref_type, ref_id, json.dumps(p, ensure_ascii=False), now()))
        n += 1
    log(conn, "同步开票任务", "external_tasks", None, f"新增 {n} 条", body.get("actor") or "会计")
    return {"ok": True, "created": n, "total": one(conn, "SELECT COUNT(*) n FROM external_tasks WHERE kind='invoice'")["n"]}


@route("GET", P + r"/invoice-tasks")
def invoice_tasks(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM external_tasks WHERE kind='invoice' ORDER BY id DESC LIMIT 300")
    for r in rows:
        r["payload"] = json.loads(r["payload_json"] or "{}")
        r.pop("payload_json", None)
        r["issues"] = _validate_invoice(r["payload"])
    return {"items": rows, "pending": sum(1 for r in rows if r["status"] == "pending"),
            "invalid": sum(1 for r in rows if r["issues"])}


# ---- 4. 开票前校验 ----
@route("GET", P + r"/invoice-validate")
def invoice_validate(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM external_tasks WHERE kind='invoice' AND status='pending'")
    out = []
    for r in rows:
        p = json.loads(r["payload_json"] or "{}")
        issues = _validate_invoice(p)
        if issues:
            out.append({"task_id": r["id"], "buyer": p.get("buyer"), "issues": issues})
    return {"invalid": out, "count": len(out),
            "hint": "有问题的任务在导出时会默认跳过；补齐往来单位开票资料后重新同步即可"}


# ---- 5. 数电票批量开票模板导出 ----
@route("GET", P + r"/invoice-export")
def invoice_export(conn, m, body, qs):
    include_invalid = (qs.get("include_invalid") or ["0"])[0] == "1"
    rows = q(conn, "SELECT * FROM external_tasks WHERE kind='invoice' AND status='pending' ORDER BY id")
    batch = "INV" + datetime.now().strftime("%Y%m%d%H%M%S")
    out, skipped, used = [], [], []
    for r in rows:
        p = json.loads(r["payload_json"] or "{}")
        # 导出前刷新往来单位最新开票资料（补齐资料后无需重新同步任务）
        cp = _cp(conn, p.get("counterparty_id"))
        if cp:
            p["buyer"] = cp.get("invoice_title") or cp["name"]
            p["tax_id"] = cp.get("tax_id") or ""
            p["address_phone"] = cp.get("address_phone") or ""
            p["buyer_bank"] = ((cp.get("bank_name") or "") + " " + (cp.get("bank_account") or "")).strip()
            conn.execute("UPDATE external_tasks SET payload_json=? WHERE id=?",
                         (json.dumps(p, ensure_ascii=False), r["id"]))
        issues = _validate_invoice(p)
        if issues and not include_invalid:
            skipped.append({"task_id": r["id"], "buyer": p.get("buyer"), "issues": issues})
            continue
        out.append({"购买方名称": p.get("buyer", ""), "购买方纳税人识别号": p.get("tax_id", ""),
                    "购买方地址电话": p.get("address_phone", ""), "购买方开户行及账号": p.get("buyer_bank", "").strip(),
                    "项目名称": p.get("item", "服务费"), "规格型号": "", "单位": "项", "数量": 1,
                    "单价": f'{p.get("amount", 0):.2f}', "金额": f'{p.get("amount", 0):.2f}',
                    "税率": f'{p.get("tax_rate", 0) * 100:.2f}%', "税额": f'{p.get("tax", 0):.2f}',
                    "备注": p.get("ref_no", "")})
        used.append(r["id"])
    if used:
        conn.executemany("""UPDATE external_tasks SET status='exported',batch_no=?,exported_at=? WHERE id=?""",
                         [(batch, now(), i) for i in used])
        log(conn, "导出批量开票文件", "external_tasks", batch, f"{len(used)} 行，跳过 {len(skipped)} 行", "会计")
    data = _csv_bytes(out, INVOICE_COLUMNS)
    return _file(data, f"批量开票模板_{batch}.csv")


# ---- 6. 开票结果回传 ----
@route("POST", P + r"/invoice-import")
def invoice_import(conn, m, body, qs):
    text = body.get("text") or ""
    rows = body.get("rows") or _parse_csv(text, ["task_id", "invoice_no", "invoice_code", "invoice_date",
                                                  "amount", "tax_amount"])
    require(rows, "无回传数据。格式：task_id,发票号,发票代码,开票日期,金额,税额")
    done, failed = [], []
    for x in rows:
        tid = int(_f(x.get("task_id"), 0))
        t = one(conn, "SELECT * FROM external_tasks WHERE id=? AND kind='invoice'", (tid,))
        if not t:
            failed.append({"task_id": tid, "reason": "任务不存在"})
            continue
        p = json.loads(t["payload_json"] or "{}")
        no = (x.get("invoice_no") or "").strip()
        if not no:
            failed.append({"task_id": tid, "reason": "缺少发票号"})
            continue
        if one(conn, "SELECT id FROM invoices WHERE invoice_no=?", (no,)):
            failed.append({"task_id": tid, "reason": f"发票 {no} 已存在（查重）"})
            continue
        date = (x.get("invoice_date") or today())[:10]
        amount, tax = _f(x.get("amount"), p.get("amount", 0)), _f(x.get("tax_amount"), p.get("tax", 0))
        cur = conn.execute("""INSERT INTO invoices(invoice_no,invoice_code,kind,invoice_date,period,
            counterparty_id,amount,tax_amount,total_amount,subject_code,status,note,created_at)
            VALUES(?,?,'销项',?,?,?,?,?,?,?,'已入账',?,?)""",
            (no, x.get("invoice_code") or "", date, date[:7], p.get("counterparty_id"),
             amount, tax, r2(amount + tax), "6001", f"外部协同批次 {t['batch_no'] or ''}", now()))
        conn.execute("""UPDATE external_tasks SET status='done',done_at=?,result_json=? WHERE id=?""",
                     (now(), json.dumps({"invoice_no": no, "invoice_id": cur.lastrowid}, ensure_ascii=False), tid))
        done.append({"task_id": tid, "invoice_no": no, "invoice_id": cur.lastrowid})
    log(conn, "回传开票结果", "external_tasks", None, f"成功 {len(done)} / 失败 {len(failed)}", body.get("actor") or "会计")
    return {"ok": True, "done": done, "failed": failed,
            "impacts": {"count": 3, "label": "开票结果回传",
                        "affects": [{"id": "invoices", "label": "发票台账", "effect": "新增已开票记录"},
                                    {"id": "tax", "label": "销项税额台账", "effect": "按税率自动分组"},
                                    {"id": "partner", "label": "往来账", "effect": "应收账款更新"}]}}


# ---- 7. 电子税务局入口（仅链接，不代登录） ----
@route("GET", P + r"/tax-portals")
def tax_portals(conn, m, body, qs):
    return {"items": [
        {"region": "全国", "name": "国家税务总局电子税务局（各省入口）", "url": "https://etax.chinatax.gov.cn/",
         "action": "登录后上传批量开票模板 / 下载开票结果"},
        {"region": "全国", "name": "全国增值税发票查验平台", "url": "https://inv-veri.chinatax.gov.cn/",
         "action": "发票真伪查验"},
        {"region": "全国", "name": "电子发票服务平台（数电票）", "url": "https://etax.chinatax.gov.cn/",
         "action": "数电票开具、交付与下载"}],
        "notice": "系统仅提供入口链接。登录、CA/UKey 签名、短信验证等必须由授权人员在官方页面完成；本系统不代登录、不存储任何凭据。"}


# ---- 8/9. 付款任务同步与列表 ----
@route("POST", P + r"/payment-tasks/sync")
def payment_sync(conn, m, body, qs):
    n = 0
    for r in q(conn, """SELECT d.*,c.name AS cp_name,c.bank_name,c.bank_account FROM docs d
                        LEFT JOIN counterparties c ON c.id=d.counterparty_id
                        WHERE d.doc_type='payment' AND d.status IN ('approved','settled')"""):
        if one(conn, "SELECT id FROM external_tasks WHERE kind='payment' AND ref_type='doc' AND ref_id=?", (r["id"],)):
            continue
        p = {"doc_no": r["doc_no"], "payee": r["cp_name"] or "", "bank": r["bank_name"] or "",
             "account": r["bank_account"] or "", "amount": r2(r["amount"]),
             "purpose": r["reason"] or "", "counterparty_id": r["counterparty_id"]}
        conn.execute("""INSERT INTO external_tasks(kind,ref_type,ref_id,status,payload_json,created_at)
                        VALUES('payment','doc',?,'pending',?,?)""",
                     (r["id"], json.dumps(p, ensure_ascii=False), now()))
        n += 1
    return {"ok": True, "created": n}


@route("GET", P + r"/payment-tasks")
def payment_tasks(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM external_tasks WHERE kind='payment' ORDER BY id DESC LIMIT 300")
    for r in rows:
        r["payload"] = json.loads(r["payload_json"] or "{}")
        r.pop("payload_json", None)
        r["issues"] = ([x for x in ("缺少收款账号" if not r["payload"].get("account") else "",
                                    "缺少开户行" if not r["payload"].get("bank") else "",
                                    "金额必须大于 0" if r["payload"].get("amount", 0) <= 0 else "") if x])
    return {"items": rows, "pending": sum(1 for r in rows if r["status"] == "pending")}


# ---- 10. 银行批量付款文件导出 ----
@route("GET", P + r"/payment-export")
def payment_export(conn, m, body, qs):
    name = (qs.get("template") or ["通用批量付款"])[0]
    tpl = one(conn, "SELECT * FROM bank_templates WHERE name=? AND kind='payment'", (name,))
    require(tpl, "付款模板不存在")
    cols = json.loads(tpl["columns_json"])
    rows = q(conn, "SELECT * FROM external_tasks WHERE kind='payment' AND status='pending' ORDER BY id")
    batch = "PAY" + datetime.now().strftime("%Y%m%d%H%M%S")
    out, used, skipped = [], [], []
    for r in rows:
        p = json.loads(r["payload_json"] or "{}")
        if not p.get("account") or p.get("amount", 0) <= 0:
            skipped.append({"task_id": r["id"], "reason": "收款账号缺失或金额无效"})
            continue
        vals = {"收款人名称": p.get("payee", ""), "收款人账号": p.get("account", ""),
                "开户行": p.get("bank", ""), "金额": f'{p.get("amount", 0):.2f}',
                "用途": p.get("purpose", ""), "备注": p.get("doc_no", "")}
        out.append({c: vals.get(c, "") for c in cols})
        used.append(r["id"])
    if used:
        conn.executemany("UPDATE external_tasks SET status='exported',batch_no=?,exported_at=? WHERE id=?",
                         [(batch, now(), i) for i in used])
        log(conn, "导出银行批量付款文件", "external_tasks", batch, f"{len(used)} 行", "会计")
    return _file(_csv_bytes(out, cols, tpl["encoding"], tpl["delimiter"]),
                 f"批量付款_{name}_{batch}.csv")


# ---- 11. 银行处理结果回传 ----
@route("POST", P + r"/payment-import")
def payment_import(conn, m, body, qs):
    text = body.get("text") or ""
    rows = body.get("rows") or _parse_csv(text, ["task_id", "status", "bank_ref", "note"])
    require(rows, "格式：task_id,结果(success/fail),银行流水号,备注")
    done = []
    for x in rows:
        tid = int(_f(x.get("task_id"), 0))
        if not one(conn, "SELECT id FROM external_tasks WHERE id=? AND kind='payment'", (tid,)):
            continue
        st = "done" if str(x.get("status", "")).lower() in ("success", "成功", "ok", "1") else "failed"
        conn.execute("""UPDATE external_tasks SET status=?,done_at=?,result_json=?,note=? WHERE id=?""",
                     (st, now(), json.dumps(x, ensure_ascii=False), x.get("note") or "", tid))
        done.append({"task_id": tid, "status": st})
    log(conn, "回传银行付款结果", "external_tasks", None, f"{len(done)} 条", body.get("actor") or "出纳")
    return {"ok": True, "done": done}


# ---- 12. 多格式银行对账单导入 ----
@route("POST", P + r"/statement-import")
def statement_import(conn, m, body, qs):
    name = body.get("template") or "通用对账单"
    tpl = one(conn, "SELECT * FROM bank_templates WHERE name=? AND kind='statement'", (name,))
    require(tpl, "对账单模板不存在")
    cols = json.loads(tpl["columns_json"])
    text = body.get("text") or ""
    rows = body.get("rows") or _parse_csv(text, cols, skip_header=tpl["header_rows"] > 0)
    require(rows, "无可解析的对账单行")
    # 按列名顺序映射：日期/摘要/收入/支出（容忍不同模板的列名）
    def pick(r, keys):
        for k in keys:
            for kk, vv in r.items():
                if k in kk:
                    return vv
        return ""
    existing = {(x["statement_date"], x["description"], r2(x["amount_in"]), r2(x["amount_out"]))
                for x in q(conn, "SELECT * FROM bank_statements")}
    imported, dup = 0, 0
    for r in rows:
        d = str(pick(r, ("日期", "交易日期", "date")))[:10].replace("/", "-")
        if not re.match(r"^\d{4}-\d{1,2}-\d{1,2}$", d):
            continue
        parts = d.split("-")
        d = f"{parts[0]}-{int(parts[1]):02d}-{int(parts[2]):02d}"
        desc = str(pick(r, ("摘要", "用途", "description")))
        inc, out = _f(pick(r, ("收入", "贷方"))), _f(pick(r, ("支出", "借方")))
        if not inc and not out:
            continue
        if (d, desc, r2(inc), r2(out)) in existing:
            dup += 1
            continue
        conn.execute("""INSERT INTO bank_statements(statement_date,bank_account_id,description,
            amount_in,amount_out,created_at) VALUES(?,?,?,?,?,?)""",
            (d, body.get("bank_account_id"), desc, inc, out, now()))
        existing.add((d, desc, r2(inc), r2(out)))
        imported += 1
    log(conn, "导入银行对账单", "bank_statements", None, f"模板 {name}：{imported} 行，重复 {dup} 行",
        body.get("actor") or "出纳")
    return {"ok": True, "imported": imported, "duplicates": dup,
            "hint": "导入后到「银行对账」点自动匹配完成勾对"}


# ---- 13. 银行格式模板管理 ----
@route("GET", P + r"/bank-templates")
def bank_templates(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM bank_templates ORDER BY kind,name")
    for r in rows:
        r["columns"] = json.loads(r["columns_json"])
    return {"items": rows}


@route("POST", P + r"/bank-templates")
def bank_template_save(conn, m, body, qs):
    name, kind, cols = body.get("name") or "", body.get("kind") or "payment", body.get("columns") or []
    require(name and kind in ("payment", "statement") and isinstance(cols, list) and cols,
            "名称、类型(payment/statement)与列列表不能为空")
    conn.execute("""INSERT INTO bank_templates(name,kind,columns_json,delimiter,encoding,header_rows,date_format,created_at)
        VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(name) DO UPDATE SET kind=excluded.kind,
        columns_json=excluded.columns_json,delimiter=excluded.delimiter,encoding=excluded.encoding,
        header_rows=excluded.header_rows,date_format=excluded.date_format""",
        (name, kind, json.dumps(cols, ensure_ascii=False), body.get("delimiter") or ",",
         body.get("encoding") or "utf-8-sig", int(body.get("header_rows") or 1),
         body.get("date_format") or "%Y-%m-%d", now()))
    return {"ok": True, "name": name}


# ---- 14. 直连配置（不含凭据） ----
@route("GET", P + r"/config")
def gateway_config_get(conn, m, body, qs):
    cfg = {r["key"]: r["value"] for r in q(conn, "SELECT * FROM gateway_config")}
    return {**cfg,
            "api_capabilities": [
                {"name": "乐企数字开放平台 / 数电票接口", "for": "开票全自动",
                 "requirement": "需向主管税务机关申请乐企接入资质、企业数字证书与专线/前置环境"},
                {"name": "银企直联 / 开放银行 API", "for": "付款与回单全自动",
                 "requirement": "需与开户行签约银企直联、部署前置机或获取开放平台授权"},
                {"name": "文件桥梁模式（当前默认）", "for": "数据准备与结果回传全自动",
                 "requirement": "无需资质；最后一步在官方渠道由人工上传/下载"}],
            "notice": "系统不存储税局/网银账号密码、UKey PIN 或访问令牌；API 模式仅存端点与证书路径，凭据由企业侧密钥管理。"}


@route("POST", P + r"/config")
def gateway_config_set(conn, m, body, qs):
    allowed = {"mode", "tax_api_endpoint", "tax_cert_path", "bank_api_endpoint", "bank_cert_path"}
    for k, v in (body.get("config") or {}).items():
        require(k in allowed, f"不允许写入配置项 {k}（不存储任何凭据/密码/令牌）")
        require(not re.search(r"(password|passwd|secret|token|pin)", k, re.I), "禁止存储凭据")
        conn.execute("""INSERT INTO gateway_config(key,value,updated_at) VALUES(?,?,?)
                        ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at""",
                     (k, str(v), now()))
    log(conn, "修改外部系统对接配置", "gateway_config", None, json.dumps(body.get("config"), ensure_ascii=False)[:150],
        body.get("actor") or "管理员")
    return {"ok": True, "config": {r["key"]: r["value"] for r in q(conn, "SELECT * FROM gateway_config")}}


# ---- 15. 外部协同工作台 ----
@route("GET", P + r"/dashboard")
def gateway_dashboard(conn, m, body, qs):
    def n(sql, args=()):
        return one(conn, sql, args)["n"]
    return {
        "invoice_pending": n("SELECT COUNT(*) n FROM external_tasks WHERE kind='invoice' AND status='pending'"),
        "invoice_exported": n("SELECT COUNT(*) n FROM external_tasks WHERE kind='invoice' AND status='exported'"),
        "invoice_done": n("SELECT COUNT(*) n FROM external_tasks WHERE kind='invoice' AND status='done'"),
        "payment_pending": n("SELECT COUNT(*) n FROM external_tasks WHERE kind='payment' AND status='pending'"),
        "payment_exported": n("SELECT COUNT(*) n FROM external_tasks WHERE kind='payment' AND status='exported'"),
        "batches": q(conn, """SELECT batch_no,kind,COUNT(*) cnt,MAX(exported_at) at FROM external_tasks
                              WHERE batch_no IS NOT NULL GROUP BY batch_no,kind ORDER BY at DESC LIMIT 10"""),
        "mode": one(conn, "SELECT value FROM gateway_config WHERE key='mode'")["value"],
        "workflow": ["1 同步待开票/待付款任务", "2 系统校验资料与金额（两位小数）",
                     "3 导出批量模板文件", "4 在官方渠道由授权人员上传并完成 CA/UKey 确认",
                     "5 下载结果文件回传系统", "6 自动登记台账、更新任务、完成对账"],
        "notice": "不做模拟登录与验证码绕过；资金与开票的最后一步保留人工授权。"}
