# -*- coding: utf-8 -*-
"""V2.16 演示数据：一键载入 / 一键清空，覆盖各功能页，便于操作演示。

所有插入都登记到 demo_records，清空时按 (表, 主键) 逐条删除，
不会碰用户自己的数据，也不会删除迁移脚本里的默认配置。
"""
from app.routing import route
from .common import q, one, now, today, setting, set_setting

P = "/api/work/demo"
MARK = "[演示]"


def _ins(conn, tbl, data):
    cols = ",".join(data.keys())
    ph = ",".join("?" for _ in data)
    cur = conn.execute(f"INSERT INTO {tbl}({cols}) VALUES({ph})", tuple(data.values()))
    rid = cur.lastrowid
    conn.execute("INSERT OR IGNORE INTO demo_records(tbl,row_id,created_at) VALUES(?,?,?)",
                 (tbl, rid, now()))
    return rid


def _pk(conn, tbl):
    """演示登记表里有以业务键作主键的表（如 tax_input_certs.invoice_id）"""
    for row in conn.execute(f"PRAGMA table_info({tbl})"):
        if row[5]:
            return row[1]
    return "id"


def clear(conn, m, body, qs):
    rows = q(conn, "SELECT tbl,row_id FROM demo_records ORDER BY id DESC")
    n, failed = 0, []
    pkc = {}
    for r in rows:
        try:
            pk = pkc.setdefault(r["tbl"], _pk(conn, r["tbl"]))
            conn.execute(f"DELETE FROM {r['tbl']} WHERE {pk}=?", (r["row_id"],))
            n += 1
        except Exception as e:
            # 不再静默吞掉：账本防篡改规则若拦住某张表，必须让调用方看见，
            # 否则「清空演示数据」会留下半套数据继续污染报表（联动测试 ⑬）。
            failed.append(f"{r['tbl']}#{r['row_id']}: {str(e)[:50]}")
    # 历史版本的 clear() 因账本防删触发器留下过「未登记在 demo_records」的孤儿演示行。
    # 用户点「清空演示数据」时理应一并清掉；只匹配 [演示] 标记，不触碰真实业务数据。
    orphan = 0
    for tbl in ("journal", "voucher_lines"):
        try:
            cur = conn.execute(f"DELETE FROM {tbl} WHERE COALESCE(summary, '') LIKE '[演示]%'")
            orphan += cur.rowcount or 0
        except Exception as e:
            failed.append(f"{tbl} 历史残留: {str(e)[:50]}")
    conn.execute("DELETE FROM demo_records")
    set_setting(conn, "demo_loaded", "0")
    conn.commit()
    out = {"ok": not failed, "删除演示记录": n, "清理历史残留": orphan, "未删除": failed}
    if failed:
        out["提示"] = "部分演示数据受账本防篡改规则保护未能删除，请检查「未删除」明细"
    return out


def seed(conn, m, body, qs):
    if setting(conn, "demo_loaded", "0") == "1":
        clear(conn, None, {}, {})
    t, p = today(), today()[:7]
    counts = {}

    def add(tbl, data):
        rid = _ins(conn, tbl, data)
        counts[tbl] = counts.get(tbl, 0) + 1
        return rid

    # 基础资料
    cp1 = conn.execute("SELECT id FROM counterparties WHERE name='演示客户甲公司'").fetchone()
    cp1 = cp1[0] if cp1 else add("counterparties", {"name": "演示客户甲公司", "kind": "客户", "enabled": 1,
        "tax_id": "91310000MA1DEMO001", "invoice_title": "演示客户甲公司",
        "address_phone": "上海市浦东新区演示路1号 021-00000001",
        "bank_name": "工商银行浦东支行", "bank_account": "100100010001"})
    cp2 = conn.execute("SELECT id FROM counterparties WHERE name='演示供应商乙公司'").fetchone()
    cp2 = cp2[0] if cp2 else add("counterparties", {"name": "演示供应商乙公司", "kind": "供应商", "enabled": 1,
        "tax_id": "91310000MA1DEMO002", "invoice_title": "演示供应商乙公司",
        "bank_name": "建设银行徐汇支行", "bank_account": "200200020002"})

    # 业务单据
    for no, typ, amt, st in (("DEMO-DOC-001", "receipt", 56500, "settled"),
                             ("DEMO-DOC-002", "payment", 22600, "approved"),
                             ("DEMO-DOC-003", "reimbursement", 3390, "submitted")):
        add("docs", {"doc_no": no, "doc_type": typ, "doc_date": t, "period": p, "amount": amt,
            "account_kind": "bank", "subject_code": "6001", "counterparty_id": cp1,
            "applicant": "演示操作员", "dept": "财务部", "reason": MARK + "业务单据示例",
            "status": st, "created_at": t, "updated_at": t})

    # 凭证 + 分录 + 日记账
    for i, (no, summary, amt, status) in enumerate((
            ("DEMO-V-001", MARK + "销售技术服务", 56500, "posted"),
            ("DEMO-V-002", MARK + "支付办公房租", 12000, "posted"),
            ("DEMO-V-003", MARK + "待审核差旅费", 3390, "draft")), 1):
        vid = add("vouchers", {"voucher_no": no, "voucher_date": t, "period": p,
            "voucher_type": "转", "summary": summary, "maker": "演示制单员", "status": status,
            "created_at": t})
        dr, cr = ("1002", "6001") if i == 1 else (("6602", "1002") if i == 2 else ("6602", "1002"))
        add("voucher_lines", {"voucher_id": vid, "line_no": 1, "subject_code": dr,
            "debit": amt, "credit": 0, "summary": summary})
        add("voucher_lines", {"voucher_id": vid, "line_no": 2, "subject_code": cr,
            "debit": 0, "credit": amt, "summary": summary})
        if status == "posted":
            add("journal", {"journal_date": t, "period": p, "account_kind": "bank",
                "direction": "in" if i == 1 else "out", "amount": amt, "balance_after": amt,
                "summary": summary, "subject_code": cr, "counterparty_id": cp1,
                "recon_status": "未核对", "created_at": t})

    # 发票（销项/进项）
    add("invoices", {"invoice_no": "DEMO-XS-001", "invoice_code": "04403000111", "kind": "销项",
        "invoice_date": t, "period": p, "counterparty_id": cp1, "amount": 50000,
        "tax_amount": 6500, "total_amount": 56500, "subject_code": "6001", "status": "已入账",
        "note": MARK + "13% 技术服务费", "created_at": t})
    inv_in = add("invoices", {"invoice_no": "DEMO-JX-001", "invoice_code": "04403000111", "kind": "进项",
        "invoice_date": t, "period": p, "counterparty_id": cp2, "amount": 20000,
        "tax_amount": 2600, "total_amount": 22600, "subject_code": "6602", "status": "已入账",
        "note": MARK + "13% 办公采购", "created_at": t})
    add("tax_input_certs", {"invoice_id": inv_in, "cert_status": "已认证",
        "cert_period": p, "created_at": t})

    # 法务：合同 / 付款节点 / 审查 / 纠纷
    ct = add("contracts", {"contract_no": "DEMO-HT-001", "title": MARK + "年度软件采购合同",
        "counterparty_id": cp2, "kind": "采购", "amount": 300000, "sign_date": t,
        "start_date": t, "end_date": "2026-12-31", "payment_terms": "分三期，验收后付款",
        "owner": "演示法务", "status": "执行中", "created_at": t})
    add("contract_milestones", {"contract_id": ct, "due_date": t, "amount": 100000,
        "note": MARK + "首期款", "status": "待付款", "created_at": t})
    for item in ("主体资格与授权", "价款与付款条件", "发票与税务条款"):
        add("legal_reviews", {"contract_id": ct, "item": item, "passed": 1,
            "reviewer": "演示法务", "note": MARK, "created_at": t})
    add("legal_cases", {"case_no": "DEMO-AJ-001", "title": MARK + "合同违约纠纷",
        "counterparty_id": cp2, "kind": "合同纠纷", "claim_amount": 80000, "stage": "一审",
        "probability": 0.6, "provision": 48000, "status": "进行中", "created_at": t})

    # 审计
    pl = add("audit_plans", {"year": "2026", "scope": MARK + "收入与应收账款", "risk_level": "高",
        "planned_hours": 40, "auditor": "演示审计员", "status": "计划中", "created_at": t})
    add("audit_workpapers", {"plan_id": pl, "ref": "DEMO-C1", "procedure": MARK + "收入截止性测试",
        "sample_size": 10, "exception_count": 1, "conclusion": "发现 1 笔跨期", "status": "编制中", "created_at": t})
    add("audit_findings", {"title": MARK + "收入跨期确认", "risk_level": "高",
        "amount_impact": 5000, "requirement": "调整归属期间", "owner": "演示会计",
        "due_date": "2026-12-01", "status": "待整改", "created_at": t})
    add("audit_confirmations", {"counterparty_id": cp1, "period": p, "book_balance": 56500,
        "reply_balance": 56000, "difference": 500, "status": "已回函",
        "sent_at": t, "replied_at": t, "created_at": t})

    # 监管与宏观
    add("related_parties", {"counterparty_id": cp2, "relation": MARK + "控股股东关联企业",
        "since": t, "created_at": t})
    for nm, val in (("CPI", 2.1), ("PPI", -1.5)):
        if not one(conn, "SELECT id FROM macro_indicators WHERE period=? AND name=?", (p, nm)):
            add("macro_indicators", {"period": p, "name": nm, "value": val, "unit": "%",
                "source": MARK + "国家统计局示例", "created_at": t})
    add("industry_benchmarks", {"industry": MARK + "软件与信息技术服务业", "year": "2026",
        "gross_margin": 42.0, "debt_ratio": 45.0, "asset_turnover": 0.8, "net_margin": 12.0, "created_at": t})

    # 高阶核算：资产 / 存货 / 工作流闭环
    add("adv_assets", {"kind": "无形资产", "code": "DEMO-WX-001", "name": MARK + "财务软件著作权",
        "cost": 120000, "start_period": p, "life_months": 60, "residual": 0,
        "method": "成本模式", "status": "在用", "created_at": t})
    for d, qty, price in (("入", 100, 10), ("入", 100, 12), ("出", 150, 0)):
        add("adv_inventory_moves", {"period": p, "item_code": "DEMO-CH-001", "direction": d,
            "qty": qty, "unit_cost": price, "created_at": t})
    add("adv_workflows", {"kind": "全面预算", "title": MARK + "2027 年度全面预算",
        "amount": 5000000, "owner": "演示财务经理", "due_date": "2026-12-31",
        "stage": 2, "status": "进行中", "note": MARK, "created_at": t})

    # 工资与个税
    emp = add("employees", {"name": MARK + "演示员工张三", "dept": "销售部",
        "base_salary": 20000, "hire_date": "2026-01-01", "enabled": 1, "created_at": t})
    add("special_deductions", {"employee_id": emp, "children_count": 1,
        "children_amount": 2000, "elderly_amount": 1500, "updated_at": t})

    # 出纳示例
    add("cash_counts", {"count_date": t, "denominations_json": '{"100":20,"50":10}',
        "total_amount": 2500, "book_amount": 2500, "diff": 0, "note": MARK, "actor": "演示出纳", "created_at": t})
    add("bills", {"bill_no": "DEMO-ZP-001", "kind": "支票", "amount": 50000,
        "issue_date": t, "due_date": "2026-12-15", "status": "持有",
        "counterparty": "演示客户甲公司", "note": MARK, "created_at": t})

    # 外部协同任务
    add("external_tasks", {"kind": "invoice", "ref_type": "doc", "ref_id": 90001,
        "status": "pending", "payload_json": '{"buyer":"演示客户甲公司","tax_id":"91310000MA1DEMO001",'
        '"amount":50000,"tax":6500,"ref_no":"YS-DOC-001"}', "note": MARK, "created_at": t})
    add("external_tasks", {"kind": "payment", "ref_type": "doc", "ref_id": 90002,
        "status": "pending", "payload_json": '{"payee":"演示供应商乙公司",'
        '"account":"200200020002","amount":22600,"purpose":"办公采购"}', "note": MARK, "created_at": t})

    # 税务：待摊 / 估计变更 / 申报测算
    add("accruals", {"name": MARK + "年度软件服务费", "total_amount": 12000,
        "start_period": p, "end_period": "2027-10", "expense_subject": "6602",
        "prepaid_subject": "1123", "status": "active", "created_at": t})
    add("estimate_changes", {"kind": "坏账计提比例", "subject": "90天以上",
        "old_value": "20%", "new_value": "30%", "reason": MARK + "谨慎性原则",
        "actor": "演示会计", "created_at": t})

    # 七流工作台：两个办理实例（推进若干步）
    for no, steps in ((1, 2), (9, 1)):
        rid = add("work_runs", {"domain_no": no, "title": MARK + "流程演示",
            "stage": steps, "status": "进行中", "owner": "演示操作员", "created_at": t})
        names = [x["name"] for x in q(conn,
            "SELECT name FROM work_steps WHERE domain_no=? ORDER BY seq LIMIT ?", (no, steps))]
        for i, nm in enumerate(names):
            add("work_step_logs", {"run_id": rid, "seq": i + 1, "step_name": nm,
                "action_note": MARK, "done_at": t})

    set_setting(conn, "demo_loaded", "1")
    conn.commit()
    return {"ok": True, "载入记录": sum(counts.values()), "覆盖表": len(counts),
            "明细": counts, "提示": "现在各功能页都有示例数据可点；演示完可在「系统管理 → 演示数据」一键清空"}


@route("GET", P + r"/status")
def status(conn, m, body, qs):
    rows = q(conn, "SELECT tbl,COUNT(*) n FROM demo_records GROUP BY tbl ORDER BY tbl")
    return {"已载入": setting(conn, "demo_loaded", "0") == "1",
            "记录数": sum(r["n"] for r in rows), "覆盖表": len(rows), "明细": rows}


@route("POST", P + r"/seed")
def seed_api(conn, m, body, qs):
    return seed(conn, m, body, qs)


@route("POST", P + r"/clear")
def clear_api(conn, m, body, qs):
    return clear(conn, m, body, qs)
