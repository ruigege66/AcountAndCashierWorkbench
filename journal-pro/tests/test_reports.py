# -*- coding: utf-8 -*-
"""财务报表回归测试（自包含，不依赖运行中的服务与生产数据）。

运行：python3 tests/test_reports.py          单元级（临时空白账套）
      python3 tests/test_reports.py --api    追加线上 GET 接口冒烟

覆盖的正是本轮修复过的真实缺陷：
  1. 留抵进项税重复列示（明细合计 != 报表合计）
  2. 利润表累计数跨年度串年
  3. 多次/跨年建账时期初余额被累加
  4. 新增权益类科目导致资产负债表漏项不平
  5. 勾稽未随所选期间变化
  6. 重复启动产生多条现金期初记录
"""
import json
import os
import shutil
import sys
import tempfile
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402  (必须在改写 db.DB_PATH 之后导入)

PASS, FAIL = [], []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [OK] " if cond else "  [XX] ") + name + (f"  -> {detail}" if detail else ""))


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
    check("迁移全部应用（含 009）", versions[-1] >= 9, str(versions))
    conn = db.connect()

    # ---- 构造跨年度测试账套 ----
    add_opening(conn, "2026-01", [("1002", 10000, 0), ("4001", 0, 10000)])
    add_voucher(conn, "2026-03-05", [("1002", 5000, 0), ("6001", 0, 5000)],
                cash_flow=("in", 5000, "6001"))
    add_voucher(conn, "2026-12-31", [("6001", 5000, 0), ("4103", 0, 5000)], closing=True)
    add_voucher(conn, "2027-01-10", [("1002", 1000, 0), ("6001", 0, 1000)],
                cash_flow=("in", 1000, "6001"))
    add_voucher(conn, "2027-02-03", [("6602", 200, 0), ("1002", 0, 200)],
                cash_flow=("out", 200, "6602"))
    # 模拟用户在 2027 年又点了一次「期初建账」：旧逻辑会把两批期初相加
    add_opening(conn, "2027-01", [("1002", 10000, 0), ("4001", 0, 10000)])
    conn.commit()

    print("\n--- 1. 期初余额不跨年累加 ---")
    v = server.subject_closing(conn, "2027-02", "1002")
    check("2027-02 银行存款 = 10000(最近期初) + 5000 + 1000 - 200 = 15800",
          v == 15800, f"实际 {v}")

    print("\n--- 2. 利润表按自然年度截断 ---")
    inc26 = server.build_income_statement(conn, "2026-12")
    inc27 = server.build_income_statement(conn, "2027-02")
    check("2026 年本年累计净利 = 5000", inc26["net_cum"] == 5000, str(inc26["net_cum"]))
    check("2027 年本年累计净利 = 800（不串入 2026 的 5000）",
          inc27["net_cum"] == 800, str(inc27["net_cum"]))
    check("利润表两列行数一致", len(inc27["current"]) == len(inc27["cumulative"]),
          f"{len(inc27['current'])} 行")
    check("累计口径文案正确", inc27["cum_scope"] == "2027-01 ~ 2027-02", inc27["cum_scope"])

    print("\n--- 3. 资产负债表平衡 + 明细合计一致 ---")
    for period in ("2026-03", "2026-12", "2027-01", "2027-02", "2099-01"):
        bs = server.build_balance_sheet(conn, period)
        detail = round(sum(x["amount"] for x in bs["assets"] if not x.get("_nosum")), 2)
        check(f"{period} 资产=负债+权益（差额 {bs['diff']}）", bs["balanced"], f"资产 {bs['total_assets']}")
        check(f"{period} 资产明细合计 == 报表合计", abs(detail - bs["total_assets"]) < 0.005,
              f"{detail} vs {bs['total_assets']}")

    print("\n--- 4. 三大勾稽（跨年） ---")
    for period in ("2026-12", "2027-02"):
        art = server.report_articulation(conn, None, None, {"period": [period]})
        check(f"{period} all_pass", art["all_pass"],
              " | ".join(f"{c['name']}:{c['diff']}" for c in art["checks"] if not c["pass"]))

    print("\n--- 5. 现金流量表期间化 ---")
    def cf(scope, period="2027-02"):
        return server.report_cashflow(conn, None, None, {"period": [period], "scope": [scope]})["net"]
    check("current(2027-01) = 1000（仅当月）", cf("current", "2027-01") == 1000,
          str(cf("current", "2027-01")))
    check("current(2027-02) = -200（仅当月）", cf("current") == -200, str(cf("current")))
    check("ytd(2027-02) = 800（本年 1—2 月）", cf("ytd") == 800, str(cf("ytd")))
    check("through(2027-02) = 5800", cf("through") == 5800, str(cf("through")))
    check("through(2026-12) = 5000", cf("through", "2026-12") == 5000, str(cf("through", "2026-12")))
    check("all = 5800", cf("all") == 5800, str(cf("all")))

    print("\n--- 6. 新增权益科目不漏项 ---")
    conn.execute("INSERT OR IGNORE INTO subjects(code,name,category,direction) VALUES('4002','资本公积','权益','贷')")
    add_voucher(conn, "2027-03-01", [("1002", 2000, 0), ("4002", 0, 2000)],
                cash_flow=("in", 2000, "4002"))
    conn.commit()
    bs = server.build_balance_sheet(conn, "2027-03")
    check("权益中自动出现「资本公积」2000",
          any(x["item"] == "资本公积" and x["amount"] == 2000 for x in bs["equity"]),
          str([(x["item"], x["amount"]) for x in bs["equity"]]))
    check("新增科目后仍平衡", bs["balanced"], f"差额 {bs['diff']}")
    check("新增科目后勾稽仍全通过",
          server.report_articulation(conn, None, None, {"period": ["2027-03"]})["all_pass"])

    print("\n--- 7. 留抵进项税重分类（防重复列示） ---")
    add_voucher(conn, "2027-04-01", [("2221", 930, 0), ("1002", 0, 930)],
                cash_flow=("out", 930, "2221"))
    conn.commit()
    bs = server.build_balance_sheet(conn, "2027-04")
    vat_rows = [x for x in bs["assets"] if "留抵" in x["item"]]
    detail = round(sum(x["amount"] for x in bs["assets"] if not x.get("_nosum")), 2)
    check("留抵进项税只列 1 行且金额为 930", len(vat_rows) == 1 and vat_rows[0]["amount"] == 930,
          str(vat_rows))
    check("负债方应交税费为 0",
          next(x["amount"] for x in bs["liabilities"] if x["item"] == "应交税费") == 0)
    check("明细合计 == 报表合计（不重复计算 930）", abs(detail - bs["total_assets"]) < 0.005,
          f"{detail} vs {bs['total_assets']}")
    check("留抵后资产负债表平衡", bs["balanced"], f"差额 {bs['diff']}")
    check("留抵后勾稽全通过",
          server.report_articulation(conn, None, None, {"period": ["2027-04"]})["all_pass"])

    print("\n--- 8. 现金期初不因重复初始化膨胀 ---")
    n = conn.execute("SELECT COUNT(*) FROM openings").fetchone()[0]
    check("openings 仅有 1 条初始记录", n == 1, f"实际 {n} 条")
    before = n
    db.migrate()  # 再跑一次启动初始化
    after = conn.execute("SELECT COUNT(*) FROM openings").fetchone()[0]
    check("重复执行 migrate 不再新增", before == after, f"{before} -> {after}")

    conn.close()

    if "--api" in sys.argv:
        print("\n--- 9. 线上接口冒烟 ---")
        apis = ["/api/health", "/api/meta", "/api/reports/balance-sheet?period=2026-11",
                "/api/reports/income?period=2026-11", "/api/reports/articulation?period=2026-11",
                "/api/reports/cashflow?period=2026-11&scope=ytd",
                "/api/export/finreports.xlsx?period=2026-11", "/api/partner-ledger?counterparty_id=3",
                "/api/monitor", "/api/alerts", "/api/selfcheck", "/api/audit/verify"]
        bad = []
        for p in apis:
            try:
                r = urllib.request.urlopen("http://127.0.0.1:8765" + p, timeout=20)
                if r.status != 200:
                    bad.append((p, r.status))
            except Exception as e:
                bad.append((p, str(e)[:80]))
        check(f"{len(apis)} 个关键接口全部 200", not bad, str(bad))

    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    if FAIL:
        for f in FAIL:
            print("  FAILED:", f)
    shutil.rmtree(TMP, ignore_errors=True)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
