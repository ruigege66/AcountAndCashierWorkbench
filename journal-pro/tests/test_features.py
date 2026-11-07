# -*- coding: utf-8 -*-
"""V2.5 扩展功能回归测试（自包含临时账套，不影响生产数据）。

运行：python3 tests/test_features.py
覆盖 14 项新功能的读、写、防重复与跨功能一致性。
"""
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_v25_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402,F401  (会注册 features 的路由)
import features as F  # noqa: E402

PASS, FAIL = [], []


class M:
    """模拟正则匹配对象，供带路径参数的路由函数使用"""

    def __init__(self, *groups):
        self.g = groups

    def group(self, i):
        return self.g[i - 1]


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [OK] " if cond else "  [XX] ") + name + (f"  -> {detail}" if detail else ""))


def expect_error(name, fn):
    try:
        fn()
        check(name, False, "未抛出预期异常")
    except Exception as e:
        check(name, True, str(e)[:70])


def add_opening(conn, period, rows):
    for code, debit, credit in rows:
        conn.execute("INSERT INTO opening_balances(period,subject_code,debit,credit) VALUES(?,?,?,?)",
                     (period, code, debit, credit))


def add_voucher(conn, date, lines, closing=False, cash_flow=None):
    period = date[:7]
    no = f"T{date.replace('-', '')}{conn.execute('SELECT COUNT(*) FROM vouchers').fetchone()[0]:02d}"
    cur = conn.execute(
        """INSERT INTO vouchers(voucher_no,voucher_date,period,voucher_type,summary,maker,status,created_at,is_closing)
           VALUES(?,?,?,'转','回归测试','测试','posted',?,?)""",
        (no, date, period, date + " 00:00:00", 1 if closing else 0))
    vid = cur.lastrowid
    for i, (code, debit, credit) in enumerate(lines, 1):
        conn.execute("""INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit)
                        VALUES(?,?,?,?,?)""", (vid, i, code, debit, credit))
    if cash_flow:
        direction, amount, subject = cash_flow
        conn.execute("""INSERT INTO journal(journal_date,period,account_kind,direction,amount,balance_after,
                          summary,subject_code,recon_status,created_at,voucher_id)
                        VALUES(?,?,'bank',?,?,0,'回归测试',?,'未核对',?,?)""",
                     (date, period, direction, amount, subject, date + " 00:00:00", vid))
    return vid


def main():
    versions = db.migrate()
    check("迁移到 v10", versions[-1] >= 10, str(versions))
    conn = db.connect()

    add_opening(conn, "2026-01", [("1002", 10000, 0), ("4001", 0, 10000)])
    add_voucher(conn, "2026-11-05", [("1002", 5000, 0), ("6001", 0, 5000)],
                cash_flow=("in", 5000, "6001"))
    add_voucher(conn, "2026-11-06", [("6602", 200, 0), ("1002", 0, 200)],
                cash_flow=("out", 200, "6602"))
    add_voucher(conn, "2026-12-31", [("6001", 5000, 0), ("4103", 0, 5000)], closing=True)
    conn.execute("""INSERT INTO invoices(invoice_no,kind,invoice_date,period,counterparty_id,
                    amount,tax_amount,total_amount,status,created_at)
                    VALUES('FP-V25-001','销项','2026-01-01','2026-01',1,1000,0,1000,'未入账','2026-01-01')""")
    conn.commit()

    print("\n--- 1. 常用凭证模板 ---")
    lines = [{"subject_code": "6602", "debit": 100, "credit": 0},
             {"subject_code": "1002", "debit": 0, "credit": 100}]
    r = F.tpl_save(conn, None, {"name": "支付办公费", "summary": "办公室杂费", "lines": lines,
                                "actor": "测试"}, {})
    conn.commit()
    tid = r["id"]
    check("模板创建成功", r["ok"], str(tid))
    lst = F.tpl_list(conn, None, {}, {})
    check("模板列表含 2 条分录", len(lst["items"]) == 1 and len(lst["items"][0]["lines"]) == 2)
    expect_error("借贷不平衡的模板被拒绝",
                 lambda: F.tpl_save(conn, None, {"name": "错误模板",
                                                 "lines": [{"subject_code": "6602", "debit": 100},
                                                           {"subject_code": "1002", "credit": 50}]}, {}))
    used = F.tpl_use(conn, M(str(tid)), {"actor": "测试"}, {})
    conn.commit()
    check("套用模板生成草稿凭证", used["ok"] and used["voucher_no"].startswith("记-"),
          used["voucher_no"])
    check("模板使用次数 +1", F.tpl_list(conn, None, {}, {})["items"][0]["use_count"] == 1)
    F.tpl_del(conn, M(str(tid)), {"actor": "测试"}, {})
    conn.commit()
    check("模板删除成功", len(F.tpl_list(conn, None, {}, {})["items"]) == 0)

    print("\n--- 2. 凭证打印 / 套打 ---")
    html = F.voucher_print(conn, None, {}, {"ids": ["1"]})["_inline"]
    check("返回可直接打印的 HTML", "记 账 凭 证" in html and "window.print()" in html)
    check("含人民币大写合计", "元" in html and "合计" in html, f"{len(html)} 字符")
    check("大写金额转换正确", F.rmb_upper(1234.56) == "壹仟贰佰叁拾肆元伍角陆分",
          F.rmb_upper(1234.56))

    print("\n--- 3. 凭证号连续性体检 ---")
    seq = F.voucher_seq_check(conn, None, {}, {})
    check("返回体检汇总", "vouchers" in seq["summary"] and seq["summary"]["vouchers"] >= 4,
          str(seq["summary"]))
    check("无严重问题", seq["summary"]["serious"] == 0, str(seq["issues"]))

    print("\n--- 4. 全局搜索 ---")
    s = F.global_search(conn, None, {}, {"q": ["回归测试"]})
    check("跨表检索到结果", s["total"] > 0, f"共 {s['total']} 条 / {len(s['groups'])} 组")
    check("空关键词返回空", F.global_search(conn, None, {}, {"q": [""]})["total"] == 0)

    print("\n--- 5. 现金流量表正表 ---")
    cf = F.cashflow_statement(conn, None, {}, {"period": ["2026-11"]})
    check("三大活动分类齐全", len(cf["current"]["categories"]) == 3,
          str([c["category"] for c in cf["current"]["categories"]]))
    check("本期净额 = 5000 - 200 = 4800", cf["current"]["net"] == 4800, str(cf["current"]["net"]))
    check("累计净额与货币资金变动勾稽一致", cf["check"],
          f"累计净额 {cf['cumulative']['net']} / 变动 {cf['delta']}")

    print("\n--- 6. 财务比率分析 ---")
    ra = F.financial_ratios(conn, None, {}, {"period": ["2026-12"]})
    check("输出 10 项指标", len(ra["items"]) == 10, str(len(ra["items"])))
    check("健康度评分在 0~100", 0 <= ra["score"] <= 100, str(ra["score"]))
    check("资产负债率可计算", any(x["name"] == "资产负债率" and x["value"] is not None
                              for x in ra["items"]))

    print("\n--- 7. 同比环比趋势 ---")
    cp = F.compare_periods(conn, None, {}, {"period": ["2026-11"]})
    check("近 12 个月趋势", len(cp["trend"]) == 12)
    check("本月/上月/去年同月齐全", all(k in cp for k in ("current", "prev", "last_year")))
    check("环比与同比字段齐全", "revenue" in cp["mom"] and "net" in cp["yoy"])

    print("\n--- 8. 年度结转 4103 → 4104 ---")
    ye = F.year_end_carry(conn, M("2026"), {"actor": "测试"}, {})
    conn.commit()
    check("生成并过账年度结转凭证", ye["ok"] and ye["amount"] == 5000, str(ye["amount"]))
    check("结转方向为盈利", ye["direction"] == "盈利结转")
    expect_error("重复年度结转被拦截",
                 lambda: F.year_end_carry(conn, M("2026"), {"actor": "测试"}, {}))
    check("结转后资产负债表仍平衡",
          server.build_balance_sheet(conn, "2026-12")["balanced"])

    print("\n--- 9. 银行对账单批量导入 ---")
    text = "日期,摘要,收入,支出\n2026-11-01,收到货款,1000,\n2026-11-02,支付费用,,200\n"
    pv = F.statements_import(conn, None, {"text": text, "actor": "测试"}, {})
    check("解析预览 2 行", pv["preview"] and pv["new"] == 2, str(pv)[:100])
    imp = F.statements_import(conn, None, {"text": text, "confirm": True, "actor": "测试"}, {})
    conn.commit()
    check("确认导入 2 行", imp["imported"] == 2, str(imp))
    pv2 = F.statements_import(conn, None, {"text": text, "actor": "测试"}, {})
    check("重复导入被识别为 0 新增", pv2["new"] == 0 and pv2["duplicates"] == 2, str(pv2)[:100])

    print("\n--- 10. 坏账准备计提 ---")
    bd = F.bad_debt_preview(conn, None, {}, {"period": ["2026-12"]})
    check("按账龄算出应计提额", bd["required"] > 0, f"应计提 {bd['required']} / 应收 {bd['receivable_total']}")
    F.bad_debt_set_config(conn, None, {"rates": {"0-30天": 0.01, "31-60天": 0.05,
                                                  "61-90天": 0.10, "90天以上": 0.20},
                                        "actor": "测试"}, {})
    conn.commit()
    check("计提比例已保存", F.bad_debt_get_config(conn, None, {}, {})["rates"]["90天以上"] == 0.2)
    prov = F.bad_debt_provision(conn, None, {"period": "2026-12", "actor": "测试"}, {})
    conn.commit()
    check("生成并过账计提凭证", prov["ok"] and prov["amount"] > 0, str(prov["amount"]))
    expect_error("重复计提被拦截",
                 lambda: F.bad_debt_provision(conn, None, {"period": "2026-12", "actor": "测试"}, {}))

    print("\n--- 11. 会计科目模板套用 ---")
    tps = F.subject_templates(conn, None, {}, {})
    check("提供 2 套科目模板", len(tps["items"]) == 2, str([x["name"] for x in tps["items"]]))
    ap = F.apply_subject_template(conn, None, {"template": "small", "actor": "测试"}, {})
    conn.commit()
    check("补充缺失科目", ap["added"] > 0, f"新增 {ap['added']} 个")
    check("套用后资产负债表仍平衡", server.build_balance_sheet(conn, "2026-12")["balanced"])
    ap2 = F.apply_subject_template(conn, None, {"template": "small", "actor": "测试"}, {})
    check("重复套用不新增（幂等）", ap2["added"] == 0, str(ap2["added"]))

    print("\n--- 12. 我的待办中心 ---")
    td = F.todo_center(conn, None, {}, {})
    check("输出 8 类待办", len(td["items"]) == 8, str([x["key"] for x in td["items"]]))
    check("待办明细可统计", td["total"] >= 0, f"共 {td['total']} 项")

    print("\n--- 13. 报表快照归档 ---")
    snap = F.snapshot_save(conn, None, {"period": "2026-12", "note": "测试归档", "actor": "测试"}, {})
    conn.commit()
    check("快照保存成功", snap["ok"] and snap["balanced"], str(snap))
    got = F.snapshot_get(conn, M(str(snap["id"])), {}, {})
    check("快照可回读三大报表", "balance_sheet" in got["data"] and "income" in got["data"])
    xls = F.snapshot_export(conn, M(str(snap["id"])), {}, {})
    check("快照可导出 Excel", len(xls["_file"]) > 1000, f"{len(xls['_file'])} bytes")
    F.snapshot_del(conn, M(str(snap["id"])), {"actor": "测试"}, {})
    conn.commit()
    check("快照删除成功", len(F.snapshot_list(conn, None, {}, {})["items"]) == 0)

    print("\n--- 14. 往来催收清单 ---")
    col = F.collection_report(conn, None, {}, {"days": ["0"]})
    check("按单位汇总应收", col["total"] == 1000 and len(col["items"]) == 1, str(col["total"]))
    check("逾期天数列正确", col["items"][0]["max_days"] > 90, str(col["items"][0]["max_days"]))
    cx = F.collection_export(conn, None, {}, {"days": ["0"]})
    check("催收清单可导出 Excel", len(cx["_file"]) > 1000, f"{len(cx['_file'])} bytes")

    print("\n--- 15. 报表回归未受影响 ---")
    art = server.report_articulation(conn, None, None, {"period": ["2026-12"]})
    check("原有三大勾稽仍通过", art["all_pass"],
          " | ".join(f"{c['name']}:{c['diff']}" for c in art["checks"] if not c["pass"]))

    conn.close()
    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    if FAIL:
        for f in FAIL:
            print("  FAILED:", f)
    shutil.rmtree(TMP, ignore_errors=True)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
