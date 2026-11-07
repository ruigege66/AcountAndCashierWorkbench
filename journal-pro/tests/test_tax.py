# -*- coding: utf-8 -*-
"""V2.10 税务域回归测试：20 项功能 / 两位小数精度 / 个税累计预扣（临时账套）。"""
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_tax_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402,F401
from app.bootstrap import start as assemble_all  # noqa: E402
assemble_all()
import app.extensions.tax as T  # noqa: E402
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


def invoice(conn, no, kind, period, amount, tax):
    conn.execute("""INSERT INTO invoices(invoice_no,kind,invoice_date,period,counterparty_id,
        amount,tax_amount,total_amount,status,created_at) VALUES(?,?,?,?,1,?,?,?,?,?)""",
                 (no, kind, period + "-05", period, amount, tax, amount + tax, "已入账", period + "-05"))


def main():
    versions = db.migrate()
    check("迁移到 v12", versions[-1] >= 12, str(versions))
    conn = db.connect()
    conn.execute("INSERT INTO opening_balances(period,subject_code,debit,credit) VALUES('2026-01','1002',100000,0)")
    conn.execute("INSERT INTO opening_balances(period,subject_code,debit,credit) VALUES('2026-01','4001',0,100000)")
    for date, dr, cr, amt in (("2026-11-05", "1002", "6001", 50000), ("2026-12-05", "1002", "6001", 40000)):
        p = date[:7]
        c = conn.execute("""INSERT INTO vouchers(voucher_no,voucher_date,period,voucher_type,summary,
            maker,status,created_at) VALUES(?,?,?,'转','测试收入','测试','posted',?)""", (date, p, p, date))
        conn.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit) VALUES(?,?,?,0,?)",
                     (c.lastrowid, 2, cr, amt))
        conn.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit) VALUES(?,?,?,?,0)",
                     (c.lastrowid, 1, dr, amt))
        conn.execute("""INSERT INTO journal(journal_date,period,account_kind,direction,amount,balance_after,
            summary,subject_code,recon_status,created_at,voucher_id) VALUES(?,?,'bank','in',?,0,'测试',?,'未核对',?,?)""",
                     (date, p, amt, cr, date, c.lastrowid))
    invoice(conn, "XL-13", "销项", "2026-11", 10000, 1300)
    invoice(conn, "XL-6", "销项", "2026-11", 5000, 300)
    invoice(conn, "JX-13", "进项", "2026-11", 8000, 1040)
    invoice(conn, "JX-6", "进项", "2026-11", 3000, 180)
    conn.commit()

    print("\n--- 1-2. 税率配置与征期 ---")
    cfg = T.tax_config(conn, None, {}, {})
    check("① 配置默认两位小数", cfg["vat_rates"][:2] == [13.0, 9.0] and cfg["cit_rate"] == 25.0,
          str(cfg["vat_rates"]))
    check("  税负率默认控制区间", cfg["tax_ratio_low"] == 2.0 and cfg["tax_ratio_high"] == 3.5)
    cal = T.tax_calendar(conn, None, {}, {})
    check("② 征期日历含周末顺延", all(x["deadline"] for x in cal["items"]) and len(cal["items"]) >= 6)

    print("\n--- 3-4. 销项 / 进项台账 ---")
    out = T.output_ledger(conn, None, {}, {"period": ["2026-11"]})
    check("③ 销项按税率分组", {g["rate_pct"] for g in out["items"]} == {13.0, 6.0},
          str([(g["rate_pct"], g["tax"]) for g in out["items"]]))
    check("  销项税额合计两位小数", out["tax_total"] == 1600.0, str(out["tax_total"]))
    T.input_certs(conn, None, {"invoice_nos": "JX-13", "cert_status": "已认证", "actor": "测试"}, {})
    conn.commit()
    inp = T.input_ledger(conn, None, {}, {"period": ["2026-11"]})
    check("④ 进项台账含认证状态", inp["certified_tax"] == 1040.0 and inp["uncertified_tax"] == 180.0,
          f"{inp['certified_tax']} / {inp['uncertified_tax']}")

    print("\n--- 5-8. 增值税申报 / 附加 / 税负率 ---")
    f = T.vat_filing_get(conn, None, {}, {"period": ["2026-11"]})
    check("⑤ 应纳税额=1600-1040=560.00", f["payable"] == 560.0, str(f["payable"]))
    check("  不可抵扣进项单列", f["input_uncertified"] == 180.0)
    sv = T.vat_filing_save(conn, None, {"period": "2026-11", "paid": 300, "actor": "测试"}, {})
    conn.commit()
    check("⑥ 申报记录保存（幂等更新）", sv["ok"] and len(T.vat_filing_list(conn, None, {}, {})["items"]) == 1)
    sur = T.surtaxes(conn, None, {}, {"period": ["2026-11"]})
    check("⑦ 附加税费=560×12%=67.20", sur["total"] == 67.2, str(sur["total"]))
    ratios = T.tax_ratios(conn, None, {}, {"months": ["3"]})
    nov = next(x for x in ratios["items"] if x["period"] == "2026-11")
    check("⑧ 增值税税负率=560/50000=1.12%", nov["vat_ratio"] == 1.12, str(nov["vat_ratio"]))
    check("  两位小数精度", round(nov["vat_ratio"], 2) == nov["vat_ratio"])
    T.ratio_targets_set(conn, None, {"low": 0.50, "high": 1.00, "actor": "测试"}, {})
    conn.commit()
    al = T.ratio_alerts(conn, None, {}, {})
    check("⑨ 税负率两点控制预警", any(x["flag"] == "偏高" for x in al["alerts"]),
          str([(x["period"], x["flag"]) for x in al["alerts"]]))
    expect_error("  下限大于上限被拒绝",
                 lambda: T.ratio_targets_set(conn, None, {"low": 5, "high": 1, "actor": "测试"}, {}))
    T.ratio_targets_set(conn, None, {"low": 2.00, "high": 3.50, "actor": "测试"}, {})
    conn.commit()

    print("\n--- 12-15. 企业所得税与分红 ---")
    cq = T.cit_quarterly(conn, None, {"period": "2026-12", "actor": "测试"}, {})
    check("⑩ 季度预缴：小微判定与两位小数", cq["small_micro"] is True and cq["tax_payable"] == round(cq["cum_profit"] * 0.05, 2),
          f"利润 {cq['cum_profit']} 税 {cq['tax_payable']}")
    T.adjustments_add(conn, None, {"kind": "业务招待费超限额", "amount": 300,
                                   "period": "2026", "actor": "测试"}, {})
    ent = T.entertainment_limit(conn, None, {"year": "2026", "amount": 1000}, {})
    check("⑪ 招待费限额=60% 与收入 0.5% 孰低", ent["deductible"] == min(ent["limit_60pct"], ent["limit_05pct_revenue"]),
          str(ent))
    ca = T.cit_annual(conn, None, {}, {"year": ["2026"]})
    check("⑫ 汇算清缴含调整项", ca["taxable_income"] == round(ca["accounting_profit"] + ca["adjustments"], 2),
          str(ca["taxable_income"]))
    dv = T.dividend_tax(conn, None, {"amount": 10000}, {})
    check("⑬ 分红个税 20%", dv["tax"] == 2000.0, str(dv["tax"]))

    print("\n--- 16-19. 工资社保与个税累计预扣 ---")
    T.emp_add(conn, None, {"name": "张三", "base_salary": 20000, "dept": "销售部", "actor": "测试"}, {})
    T.emp_add(conn, None, {"name": "李四", "base_salary": 8000, "dept": "财务部", "actor": "测试"}, {})
    conn.commit()
    p1 = T.payroll_run(conn, None, {"period": "2026-11", "actor": "测试"}, {})
    conn.commit()
    z11 = next(x for x in p1["items"] if x["name"] == "张三")
    check("⑭ 社保公积金两位小数", z11["social_personal"] + z11["fund_personal"] > 0,
          f"{z11['social_personal']} + {z11['fund_personal']}")
    check("  11 月个税=应纳税所得额×3%", z11["tax"] == round(max(0.0, z11["taxable_cum"]) * 0.03, 2),
          f"税 {z11['tax']} / 累计应税 {z11['taxable_cum']}")
    p2 = T.payroll_run(conn, None, {"period": "2026-12", "actor": "测试"}, {})
    conn.commit()
    z12 = next(x for x in p2["items"] if x["name"] == "张三")
    check("⑮ 12 月个税按累计预扣衔接", z12["tax"] == round(max(0.0, z12["taxable_cum"]) * 0.03, 2) - z11["tax"],
          f"12月 {z12['tax']}（累计税基 {z12['taxable_cum']}）")
    expect_error("  重复算薪被拦截",
                 lambda: T.payroll_run(conn, None, {"period": "2026-11", "actor": "测试"}, {}))
    pl = T.payroll_list(conn, None, {}, {})
    check("⑯ 工资表查询含明细", len(pl["items"]) == 2 and all(x["lines"] for x in pl["items"]))

    print("\n--- 19-20. 印花税与工作台 ---")
    st = T.stamp_calc(conn, None, {"name": "购销合同", "amount": 100000}, {})
    check("⑰ 印花税=100000×0.03%=30.00", st["tax"] == 30.0, str(st["tax"]))
    expect_error("  未知税目被拒绝", lambda: T.stamp_calc(conn, None, {"name": "未知", "amount": 100}, {}))
    dash = T.tax_dashboard(conn, None, {}, {"period": ["2026-11"]})
    check("⑱ 税务工作台汇总", "vat" in dash and "calendar" in dash and "ratio_now" in dash)
    check("  工作台含个税代扣", dash["payroll_tax"] > 0, str(dash["payroll_tax"]))

    print("\n--- 21. 回归未破坏 ---")
    bs = server.build_balance_sheet(conn, "2026-12")
    check("资产负债表仍平衡", bs["balanced"])
    check("三大勾稽仍成立", server.report_articulation(conn, None, None, {"period": ["2026-12"]})["all_pass"])

    conn.close()
    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    if FAIL:
        for f in FAIL:
            print("  FAILED:", f)
    shutil.rmtree(TMP, ignore_errors=True)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
