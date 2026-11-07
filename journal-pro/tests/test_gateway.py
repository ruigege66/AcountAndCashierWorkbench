# -*- coding: utf-8 -*-
"""V2.11 外部系统协同回归测试（临时账套）：开票/付款文件桥梁、回传、查重、合规边界。"""
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_gateway_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402,F401
from app.bootstrap import start as assemble_all  # noqa: E402
assemble_all()
import app.extensions.gateway as G  # noqa: E402
from app.extensions.common import q, one  # noqa: E402

PASS, FAIL = [], []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [OK] " if cond else "  [XX] ") + name + (f"  -> {detail}" if detail else ""))


def expect_error(name, fn):
    try:
        fn()
        check(name, False, "未抛异常")
    except Exception as e:
        check(name, True, str(e)[:70])


def doc(conn, no, dtype, status, amount, cp_id, reason):
    c = conn.execute("""INSERT INTO docs(doc_no,doc_type,doc_date,period,amount,account_kind,
        subject_code,counterparty_id,applicant,reason,status,created_at,updated_at) VALUES(?,?,?,?,?,'bank','6001',?,?,?,?,?,?)""",
        (no, dtype, "2026-11-06", "2026-11", amount, cp_id, "测试", reason, status, "2026-11-06", "2026-11-06"))
    return c.lastrowid


def main():
    versions = db.migrate()
    check("迁移到 v13", versions[-1] >= 13, str(versions))
    conn = db.connect()
    # 空账套：外部协同只处理文件与台账，不产生凭证/流水，期初置 0 以保持勾稽基线
    conn.execute("UPDATE settings SET value='0' WHERE key='cash_opening'")
    conn.execute("UPDATE bank_accounts SET opening_balance=0")
    conn.commit()
    for name, tax, bank, acct in (("甲公司", "91310000MA1FL1234X", "工商银行", "6222021234567890"),
                                  ("乙公司", "", "", "")):
        c = conn.execute("INSERT INTO counterparties(name,kind) VALUES(?, '客户')", (name,))
        conn.execute("""UPDATE counterparties SET invoice_title=?,tax_id=?,bank_name=?,bank_account=? WHERE id=?""",
                     (name, tax, bank, acct, c.lastrowid))
    cp1 = one(conn, "SELECT id FROM counterparties WHERE name='甲公司'")["id"]
    cp2 = one(conn, "SELECT id FROM counterparties WHERE name='乙公司'")["id"]
    doc(conn, "SK001", "receipt", "settled", 10000, cp1, "技术服务费")
    doc(conn, "SK002", "receipt", "settled", 5000, cp2, "咨询费")
    doc(conn, "FK001", "payment", "approved", 3000, cp1, "采购款")
    conn.commit()

    print("\n--- 1-4. 开票资料 / 任务 / 校验 ---")
    cpl = G.cp_list(conn, None, {}, {})
    check("① 开票资料完整度统计", cpl["ready_invoice"] == 1 and cpl["ready_payment"] == 1,
          f"{cpl['ready_invoice']}/{cpl['ready_payment']}")
    G.cp_update(conn, None, {"id": cp2, "tax_id": "91310000MA1FL5678Y",
                             "invoice_title": "乙公司", "actor": "测试"}, {})
    conn.commit()
    check("  往来单位资料可补全", G.cp_list(conn, None, {}, {})["ready_invoice"] == 2)
    sy = G.invoice_sync(conn, None, {"actor": "测试"}, {})
    conn.commit()
    check("② 从已结算收款单同步开票任务", sy["created"] == 2, str(sy["created"]))
    tasks = G.invoice_tasks(conn, None, {}, {})
    check("③ 任务列表含校验结果", len(tasks["items"]) == 2 and "issues" in tasks["items"][0])
    check("④ 开票前校验（两位小数税额）", all(t["payload"]["tax"] == round(t["payload"]["amount"] * 0.13, 2)
                                       for t in tasks["items"]),
          str([t["payload"]["tax"] for t in tasks["items"]]))
    conn.execute("UPDATE counterparties SET tax_id='' WHERE id=?", (cp2,))
    conn.commit()

    print("\n--- 5-7. 批量开票文件与结果回传 ---")
    res = G.invoice_export(conn, None, {}, {})
    csv_text = res["_file"].decode("utf-8-sig")
    check("⑤ 导出数电票批量模板", csv_text.startswith("购买方名称") and "13.00%" in csv_text,
          res["_filename"])
    check("  仅导出资料完整的任务", len(csv_text.strip().splitlines()) == 2,
          f"{len(csv_text.strip().splitlines())} 行")
    conn.commit()
    tid = one(conn, "SELECT id FROM external_tasks WHERE kind='invoice' AND status='exported'")["id"]
    back = G.invoice_import(conn, None, {"text": f"task_id,invoice_no,invoice_code,invoice_date,amount,tax_amount\n{tid},FP202611001,,2026-11-06,10000,1300",
                                         "actor": "测试"}, {})
    conn.commit()
    check("⑥ 回传开票结果登记发票台账", len(back["done"]) == 1 and back["done"][0]["invoice_no"] == "FP202611001")
    check("  价税合计两位小数", one(conn, "SELECT total_amount FROM invoices WHERE invoice_no='FP202611001'")["total_amount"] == 11300.0)
    check("  任务状态 done + 影响链", "impacts" in back and one(conn, "SELECT status FROM external_tasks WHERE id=?", (tid,))["status"] == "done")
    dup = G.invoice_import(conn, None, {"rows": [{"task_id": tid, "invoice_no": "FP202611001"}], "actor": "测试"}, {})
    conn.commit()
    check("⑦ 发票号查重拦截重复回传", dup["done"] == [] and any("已存在" in x["reason"] for x in dup["failed"]))
    portals = G.tax_portals(conn, None, {}, {})
    check("  税局入口只给链接不代登录", len(portals["items"]) >= 2 and "不代登录" in portals["notice"])

    print("\n--- 8-11. 付款任务 / 银行文件 / 回传 ---")
    ps = G.payment_sync(conn, None, {"actor": "测试"}, {})
    conn.commit()
    check("⑧ 从已审批付款单同步任务", ps["created"] == 1, str(ps["created"]))
    pt = G.payment_tasks(conn, None, {}, {})
    check("⑨ 付款任务含账号校验", pt["items"][0]["issues"] == [], str(pt["items"][0]["issues"]))
    pres = G.payment_export(conn, None, {}, {"template": ["通用批量付款"]})
    ptext = pres["_file"].decode("utf-8-sig")
    conn.commit()
    check("⑩ 生成银行批量付款文件", "收款人账号" in ptext and "3000.00" in ptext, pres["_filename"])
    ptid = one(conn, "SELECT id FROM external_tasks WHERE kind='payment'")["id"]
    pb = G.payment_import(conn, None, {"text": f"task_id,status,bank_ref,note\n{ptid},success,BK20261106001,已付款",
                                       "actor": "出纳"}, {})
    conn.commit()
    check("⑪ 银行结果回传更新任务", pb["done"][0]["status"] == "done")

    print("\n--- 12-15. 对账单 / 模板 / 配置 / 工作台 ---")
    st = G.statement_import(conn, None, {"text": "日期,摘要,收入,支出,余额\n2026-11-06,收到货款,25000,,116000\n2026-11-07,支付房租,,3000,113000",
                                         "actor": "出纳"}, {})
    conn.commit()
    check("⑫ 多格式对账单导入", st["imported"] == 2, str(st["imported"]))
    st2 = G.statement_import(conn, None, {"text": "日期,摘要,收入,支出,余额\n2026-11-06,收到货款,25000,,116000",
                                          "actor": "出纳"}, {})
    conn.commit()
    check("  对账单查重", st2["imported"] == 0 and st2["duplicates"] == 1)
    G.bank_template_save(conn, None, {"name": "测试银行", "kind": "payment",
                                      "columns": ["收款人", "账号", "金额"], "actor": "测试"}, {})
    conn.commit()
    check("⑬ 银行格式模板可配", any(x["name"] == "测试银行" for x in G.bank_templates(conn, None, {}, {})["items"]))
    cfg = G.gateway_config_get(conn, None, {}, {})
    check("⑭ 默认文件模式（无需资质）", cfg["mode"] == "file")
    expect_error("  拒绝写入密码类配置",
                 lambda: G.gateway_config_set(conn, None, {"config": {"password": "123"}}, {}))
    check("  API 模式资质说明齐全", len(cfg["api_capabilities"]) >= 3)
    G.gateway_config_set(conn, None, {"config": {"tax_api_endpoint": "https://example.local/api"}, "actor": "管理员"}, {})
    conn.commit()
    dash = G.gateway_dashboard(conn, None, {}, {})
    check("⑮ 外部协同工作台", dash["invoice_done"] == 1 and len(dash["workflow"]) == 6
          and "不" in dash["notice"], str(dash["invoice_done"]))

    print("\n--- 回归未破坏 ---")
    check("三大勾稽仍成立", server.report_articulation(conn, None, None, {"period": ["2026-11"]})["all_pass"])
    conn.close()
    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    if FAIL:
        for f in FAIL:
            print("  FAILED:", f)
    shutil.rmtree(TMP, ignore_errors=True)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
