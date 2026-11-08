# -*- coding: utf-8 -*-
"""V2.13 法务 / 审计 / 金融监管 / 宏观经济会计 回归测试（临时账套）。"""
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_domains_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402,F401
from app.bootstrap import start as assemble_all  # noqa: E402
assemble_all()
import app.extensions.legal as L  # noqa: E402
import app.extensions.audit_domain as A  # noqa: E402
import app.extensions.regulation as R  # noqa: E402
import app.extensions.macro as M  # noqa: E402
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


def main():
    versions = db.migrate()
    check("迁移到 v14", versions[-1] >= 14, str(versions))
    conn = db.connect()
    conn.execute("UPDATE settings SET value='0' WHERE key='cash_opening'")
    conn.execute("UPDATE bank_accounts SET opening_balance=0")
    c = conn.execute("INSERT INTO counterparties(name,kind) VALUES('甲公司','客户')")
    cp = c.lastrowid
    # 两笔已过账凭证 + 流水
    for date, amt, direction in (("2026-11-05", 50000, "in"), ("2026-11-06", 600000, "out"),
                                 ("2026-11-07", 20000, "in")):
        p = date[:7]
        v = conn.execute("""INSERT INTO vouchers(voucher_no,voucher_date,period,voucher_type,summary,maker,status,created_at)
            VALUES(?,?,?,'转','测试','测试','posted',?)""", (date + "-" + direction, date, p, date))
        if direction == "in":
            conn.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit) VALUES(?,1,'1002',?,0)", (v.lastrowid, amt))
            conn.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit,counterparty_id) VALUES(?,2,'6001',0,?,?)", (v.lastrowid, amt, cp))
        else:
            conn.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit) VALUES(?,1,'1002',0,?)", (v.lastrowid, amt))
            conn.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit,counterparty_id) VALUES(?,2,'6602',?,0,?)", (v.lastrowid, amt, cp))
        conn.execute("""INSERT INTO journal(journal_date,period,account_kind,direction,amount,balance_after,
            summary,subject_code,counterparty_id,recon_status,created_at) VALUES(?,?,'bank',?,?,0,'测试','6001',?,'未核对',?)""",
            (date, p, direction, amt, cp, date))
    conn.commit()

    print("\n--- 法务域 ---")
    ct = L.contract_add(conn, None, {"contract_no": "HT2026001", "title": "软件采购合同",
        "counterparty_id": cp, "amount": 100000, "end_date": "2026-12-01", "actor": "测试"}, {})
    conn.commit()
    check("① 合同登记", ct["ok"])
    ms = L.milestone_add(conn, None, {"contract_id": ct["id"], "amount": 30000, "due_date": "2026-11-20"}, {})
    conn.commit()
    check("② 付款节点不超合同额", ms["ok"] and ms["contract_remaining"] == 70000, str(ms["contract_remaining"]))
    expect_error("  节点超额被拦截", lambda: L.milestone_add(conn, None,
        {"contract_id": ct["id"], "amount": 90000, "due_date": "2026-12-20"}, {}))
    rv = L.review_list(conn, None, {}, {"contract_id": [str(ct["id"])]})
    check("③ 法务审查清单 6 项", rv["total"] == 6 and rv["rate"] == 0)
    L.review_save(conn, None, {"contract_id": ct["id"], "results": {x: True for x in L.REVIEW_ITEMS},
                               "reviewer": "法务"}, {})
    conn.commit()
    check("  审查全通过后结论", "通过" in L.review_list(conn, None, {}, {"contract_id": [str(ct["id"])]})["conclusion"])
    ca = L.case_add(conn, None, {"case_no": "AJ2026001", "title": "合同违约纠纷",
        "counterparty_id": cp, "claim_amount": 100000, "probability": 0.6}, {})
    conn.commit()
    check("④ 或有负债=标的×败诉概率", ca["expected_liability"] == 60000.0, str(ca["expected_liability"]))
    se = L.seal_save(conn, None, {"purpose": "采购合同盖章", "contract_id": ct["id"], "approve": "1"}, {})
    conn.commit()
    check("⑤ 用印授权", se["status"] == "已用印" and se["warning"] is None)
    du = L.duty_list(conn, None, {}, {})
    check("⑥ 合规义务倒计时", len(du["items"]) >= 3 and "days_left" in du["items"][0])
    dash = L.legal_dashboard(conn, None, {}, {})
    check("⑦ 法务工作台汇总", dash["合同总数"] == 1 and dash["或有负债（期望值）"] == 60000.0)

    print("\n--- 审计域 ---")
    pl = A.plan_add(conn, None, {"year": "2026", "scope": "收入与应收", "risk_level": "高"}, {})
    conn.commit()
    check("① 审计计划", pl["ok"])
    wp = A.wp_add(conn, None, {"plan_id": pl["id"], "ref": "C1", "procedure": "收入截止性测试",
        "sample_size": 10, "exception_count": 1}, {})
    conn.commit()
    check("② 工作底稿", wp["ok"])
    sm = A.sampling(conn, None, {"period": "2026-11", "size": 10}, {})
    check("③ 凭证分层抽样", sm["sample_size"] > 0 and sm["coverage"] > 0, str(sm["coverage"]))
    fd = A.finding_add(conn, None, {"title": "收入跨期确认", "amount_impact": 5000,
        "due_date": "2026-10-01", "risk_level": "高"}, {})
    conn.commit()
    fl = A.finding_list(conn, None, {}, {})
    check("④ 发现逾期识别", fd["ok"] and len(fl["overdue"]) >= 1)
    cf = A.conf_save(conn, None, {"counterparty_id": cp, "period": "2026-11", "reply_balance": 470000}, {})
    conn.commit()
    check("⑤ 函证差异计算", cf["difference"] is not None and cf["book_balance"] != 470000,
          f"账面 {cf['book_balance']} 差异 {cf['difference']}")
    expect_error("  调整分录借贷不平被拒", lambda: A.adj_add(conn, None,
        {"summary": "测试", "debit": 100, "credit": 90}, {}))
    adj = A.adj_add(conn, None, {"summary": "补提坏账", "subject_code": "1231", "debit": 100, "credit": 100}, {})
    conn.commit()
    check("⑥ 平衡的调整分录", adj["balanced"])
    check("⑦ 审计工作台平衡校验", A.audit_dashboard(conn, None, {}, {})["调整分录是否平衡"])

    print("\n--- 金融监管域 ---")
    rp = R.report_list(conn, None, {}, {})
    check("① 监管报送台账", len(rp["items"]) >= 2)
    aml = R.aml_scan(conn, None, {"period": "2026-11"}, {})
    check("② 反洗钱扫描命中大额交易", aml["high_risk"] >= 1, str(aml["high_risk"]))
    R.rp_add(conn, None, {"counterparty_id": cp, "relation": "控股股东"}, {})
    conn.commit()
    rpl = R.rp_list(conn, None, {}, {})
    check("③ 关联交易占比", len(rpl["items"]) == 1 and rpl["items"][0]["share"] is not None)
    met = R.reg_metrics(conn, None, {}, {"period": ["2026-11"]})
    check("④ 监管指标 5 项", len(met["items"]) == 5)
    ecl = R.ecl_run(conn, None, {"period": "2026-11"}, {})
    check("⑤ ECL 三阶段拨备", ecl["count"] >= 0 and ecl["summary"]["provision"] >= 0)
    exp = R.reg_export(conn, None, {}, {"period": ["2026-11"]})
    check("⑥ 报送 CSV 导出", b"\xef\xbb\xbf" in exp["_file"][:3] and "监管指标" in exp["_file"].decode("utf-8-sig"))

    print("\n--- 宏观经济会计域 ---")
    M.ind_add(conn, None, {"period": "2025-12", "name": "CPI", "value": 2.1}, {})
    M.ind_add(conn, None, {"period": "2026-06", "name": "PPI", "value": -1.5}, {})
    conn.commit()
    check("① 宏观指标库", len(M.ind_list(conn, None, {}, {})["items"]) >= 2)
    ia = M.inflation_adjusted(conn, None, {}, {"base_year": ["2026"]})
    check("② 通胀不变价折算", len(ia["items"]) == 4 and ia["items"][0]["折算系数"] > 1)
    M.bench_add(conn, None, {"industry": "软件行业", "year": "2026", "net_margin": 12, "debt_ratio": 45}, {})
    conn.commit()
    check("③ 行业对标含本公司", M.bench_list(conn, None, {}, {})["company"]["行业"] == "本公司")
    st = M.stress_test(conn, None, {}, {"year": ["2026"]})
    check("④ 三情景压力测试", len(st["items"]) == 3 and st["items"][2]["最终利润"] <= st["items"][0]["最终利润"])
    fx = M.fx_revaluation(conn, None, {"exposure": 10000, "old_rate": 7.1, "new_rate": 7.2}, {})
    conn.commit()
    check("⑤ 汇率重估损益", fx["汇兑损益"] == 1000.0, str(fx["汇兑损益"]))
    md = M.macro_dashboard(conn, None, {}, {})
    check("⑥ 宏观联动看板", md["情景数"] == 3 and "弹性提示" in md)

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
