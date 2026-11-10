# -*- coding: utf-8 -*-
"""V2.6 统一内核 + 联动矩阵回归测试（临时账套，不碰生产数据）。

覆盖：计算规则准确性、规则自定义、写操作影响链、网状联动传导、在线图文报告。
运行：python3 tests/test_core.py
"""
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_core_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402,F401
import features as F  # noqa: E402
from core import (AccountingContext, RuleEngine, ImpactGraph, analyze,
                  rule_book, render_report)  # noqa: E402
from core.analytics import cashflow_categories, aging_of, ratios_of  # noqa: E402

PASS, FAIL = [], []


class M:
    def __init__(self, *g):
        self.g = g

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


def voucher(conn, date, lines, closing=False, flow=None):
    p = date[:7]
    no = f"记-{p.replace('-', '')}{conn.execute('SELECT COUNT(*) FROM vouchers').fetchone()[0] + 1:03d}"
    c = conn.execute("""INSERT INTO vouchers(voucher_no,voucher_date,period,voucher_type,summary,
        maker,status,created_at,is_closing) VALUES(?,?,?,'转','测试','测试','posted',?,?)""",
        (no, date, p, date, 1 if closing else 0))
    vid = c.lastrowid
    for i, (code, d, cr) in enumerate(lines, 1):
        conn.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit) VALUES(?,?,?,?,?)",
                     (vid, i, code, d, cr))
    if flow:
        direction, amount, subj = flow
        conn.execute("""INSERT INTO journal(journal_date,period,account_kind,direction,amount,balance_after,
            summary,subject_code,recon_status,created_at,voucher_id) VALUES(?,?,'bank',?,?,0,'测试',?,'未核对',?,?)""",
            (date, p, direction, amount, subj, date, vid))
    return vid


def main():
    versions = db.migrate()
    check("迁移到 v10", versions[-1] >= 10, str(versions))
    conn = db.connect()
    conn.execute("INSERT INTO opening_balances(period,subject_code,debit,credit) VALUES('2026-01','1002',100000,0)")
    conn.execute("INSERT INTO opening_balances(period,subject_code,debit,credit) VALUES('2026-01','4001',0,100000)")
    voucher(conn, "2026-01-05", [("1002", 50000, 0), ("2501", 0, 50000)], flow=("in", 50000, "2501"))
    voucher(conn, "2026-02-01", [("1511", 20000, 0), ("1002", 0, 20000)], flow=("out", 20000, "1511"))
    voucher(conn, "2026-11-05", [("1002", 30000, 0), ("6001", 0, 30000)], flow=("in", 30000, "6001"))
    voucher(conn, "2026-11-06", [("6602", 8000, 0), ("1002", 0, 8000)], flow=("out", 8000, "6602"))
    conn.execute("""INSERT INTO invoices(invoice_no,kind,invoice_date,period,counterparty_id,amount,
        tax_amount,total_amount,status,created_at) VALUES
        ('FP-CORE-1','销项','2026-01-01','2026-01',1,10000,0,10000,'未入账','2026-01-01')""")
    conn.commit()

    print("\n--- 1. 计算规则准确性（V2.5 审计暴露的问题） ---")
    ctx = AccountingContext(conn, "2026-11", RuleEngine(conn))
    ra = ratios_of(ctx)
    vals = {x["name"]: x["value"] for x in ra["items"]}
    check("长期借款 2501 不计入流动负债", ctx.group_balance("noncurrent_liability") == 50000,
          str(ctx.group_balance("noncurrent_liability")))
    check("流动负债为 0 时流动比率返回「不适用」", vals["流动比率"] is None, str(vals["流动比率"]))
    check("现金比率独立计算，同样不适用", vals["现金比率"] is None, str(vals["现金比率"]))
    check("长期股权投资 1511 不计入流动资产", ctx.group_balance("noncurrent_asset") == 20000,
          str(ctx.group_balance("noncurrent_asset")))
    check("资产负债率仍准确", abs(vals["资产负债率"] - 29.0698) < 0.01, str(vals["资产负债率"]))
    check("每项比率自带公式/数据源/口径", all(x.get("formula") and x.get("source") for x in ra["items"]))

    print("\n--- 2. 账龄基准日按所选期间（不再写死今天） ---")
    ag_nov = aging_of(AccountingContext(conn, "2026-11", RuleEngine(conn)))
    ag_jan = aging_of(AccountingContext(conn, "2026-01", RuleEngine(conn)))
    check("2026-11 基准日 = 2026-11-30", ag_nov["as_of"] == "2026-11-30", ag_nov["as_of"])
    check("2026-01 基准日 = 2026-01-31", ag_jan["as_of"] == "2026-01-31", ag_jan["as_of"])
    check("不同期间账龄分布不同", ag_nov["details"][-1]["amount"] != ag_jan["details"][-1]["amount"],
          f"11月90+ {ag_nov['details'][-1]['amount']} / 1月90+ {ag_jan['details'][-1]['amount']}")

    print("\n--- 3. 现金流未分类科目不静默塞进经营 ---")
    # 凭证、分录、日记账三者一致，保证不破坏资产负债表与勾稽③
    conn.execute("""INSERT OR IGNORE INTO subjects(code,name,category,direction,is_cash,is_bank,enabled)
                    VALUES('9999','其他未分类科目','资产','借',0,0,1)""")
    voucher(conn, "2026-11-20", [("9999", 777, 0), ("1002", 0, 777)], flow=("out", 777, "9999"))
    conn.commit()
    cfc = cashflow_categories(AccountingContext(conn, "2026-11", RuleEngine(conn)), "current")
    check("产生「未分类」类别", any(c["category"] == "未分类" for c in cfc["categories"]),
          str([c["category"] for c in cfc["categories"]]))
    check("未分类明细被列出", len(cfc["unmapped"]) == 1, str(cfc["unmapped"]))
    check("经营活动未被污染", next(c["net"] for c in cfc["categories"] if c["category"] == "经营活动") == 22000)

    print("\n--- 4. 规则自定义立即生效 ---")
    eng = RuleEngine(conn)
    eng.update({"ratios": {"资产负债率": {"min": 0, "max": 10}}})
    ra2 = ratios_of(AccountingContext(conn, "2026-11", RuleEngine(conn)))
    st = next(x["status"] for x in ra2["items"] if x["name"] == "资产负债率")
    check("改阈值后资产负债率变为「关注」", st == "关注", st)
    eng.update({"cashflow": {"unclassified": "operating"}})
    cfc2 = cashflow_categories(AccountingContext(conn, "2026-11", RuleEngine(conn)), "current")
    check("切换未分类策略后并入经营", not any(c["category"] == "未分类" for c in cfc2["categories"]))
    expect_error("非法计提比例被拒绝", lambda: RuleEngine(conn).update({"aging": {"rates": {"0-30天": 2}}}))
    eng.reset()
    check("重置后恢复默认", RuleEngine(conn).get("ratios.资产负债率.max") == 70)

    print("\n--- 5. 功能影响图（网状关系） ---")
    g = ImpactGraph.graph()
    check("图含写操作与分析节点", len(g["nodes"]) > 20 and len(g["edges"]) > 20,
          f"{len(g['nodes'])} 节点 / {len(g['edges'])} 边")
    imp = ImpactGraph.impact("bad_debt.provision")
    check("坏账计提声明 6 条影响链", imp["count"] >= 5,
          f"{imp['count']} 条: {[x['id'] for x in imp['affects']]}")
    check("每条影响带原因说明", all(x["effect"] for x in imp["affects"]))

    print("\n--- 6. 写操作返回影响链 ---")
    F.tpl_save(conn, None, {"name": "测试模板", "lines": [
        {"subject_code": "6602", "debit": 100, "credit": 0},
        {"subject_code": "1002", "debit": 0, "credit": 100}], "actor": "测试"}, {})
    conn.commit()
    used = F.tpl_use(conn, M("1"), {"actor": "测试"}, {})
    conn.commit()
    check("套用模板返回 impacts", "impacts" in used and used["impacts"]["count"] >= 0,
          str(used["impacts"]["label"]))

    print("\n--- 7. 联动传导：坏账计提 → 全部下游 ---")
    before = analyze(conn, "2026-11")
    prov = F.bad_debt_provision(conn, None, {"period": "2026-11", "actor": "测试"}, {})
    conn.commit()
    after = analyze(conn, "2026-11")
    d = round(after["kpi"]["net_cum"] - before["kpi"]["net_cum"], 2)
    check("计提凭证金额 = 应补提额", abs(prov["amount"] - before["aging"]["adjustment"]) < 0.005,
          f"{prov['amount']} / {before['aging']['adjustment']}")
    check("净利润按计提额下降", d == -prov["amount"], f"净利变化 {d}")
    check("资产合计按计提额下降",
          round(after["kpi"]["total_assets"] - before["kpi"]["total_assets"], 2) == -prov["amount"])
    check("净利率同步变化",
          next(x["value"] for x in after["ratios"]["items"] if x["name"] == "销售净利率")
          != next(x["value"] for x in before["ratios"]["items"] if x["name"] == "销售净利率"))
    check("同比环比本期净利同步变化", after["compare"]["current"]["net"] != before["compare"]["current"]["net"])
    check("勾稽仍然成立", after["articulation"]["all_pass"])
    check("计提返回 impacts 且含 income/balance_sheet",
          {"income", "balance_sheet"}.issubset({x["id"] for x in prov["impacts"]["affects"]}))
    check("再次计提被拦截", F.bad_debt_preview(conn, None, {}, {"period": ["2026-11"]})["adjustment"] == 0)

    print("\n--- 8. 年度结转联动 ---")
    voucher(conn, "2026-12-31", [("6001", 30000, 0), ("4103", 0, 30000)], closing=True)
    conn.commit()
    ye = F.year_end_carry(conn, M("2026"), {"actor": "测试"}, {})
    conn.commit()
    bs2 = analyze(conn, "2026-12")
    check("年结返回 impacts", "impacts" in ye)
    check("年结后资产负债表仍平衡", bs2["balance"]["balanced"])
    check("年结后勾稽仍成立", bs2["articulation"]["all_pass"])
    check("权益中利润分配承接结转额",
          any(x["item"] == "利润分配" and x["amount"] == 30000 for x in bs2["balance"]["equity"]))

    print("\n--- 9. 在线图文分析报告 ---")
    data = analyze(conn, "2026-12")
    html = render_report(data, g)
    check("报告为完整 HTML", html.startswith("<!DOCTYPE html>") and len(html) > 10000,
          f"{len(html)} 字符")
    check("含内联 SVG 图表", html.count("<svg") >= 8, f"{html.count('<svg')} 个图表")
    check("零外部依赖（可离线打开）", "cdn.jsdelivr" not in html and "http://" not in html.replace("http://127.0.0.1", ""))
    fc = data["forecast"]
    check("含预测数据（收入/净利/现金流）", len(fc["revenue"]) == 3 and len(fc["net"]) == 3 and len(fc["cash"]) == 6,
          f"{len(fc['revenue'])}/{len(fc['net'])}/{len(fc['cash'])}")
    check("含资金安全月数与回测字段", "months" in fc["safety_months"] and "backtest" in fc)
    check("含管理层摘要与自动结论", "管理层摘要" in html and len(data["conclusions"]) >= 4,
          f"{len(data['conclusions'])} 条结论")
    check("含计算规则说明书与数据血缘", "计算规则说明书" in html and "数据血缘" in html)
    check("含功能联动关系图", "功能联动关系图" in html)

    print("\n--- 10. 计算规则说明书 ---")
    rb = rule_book(conn)
    check("说明书含指标公式", len(rb["metrics"]) >= 5)
    check("说明书含可配置规则与默认值", "rules" in rb and "defaults" in rb["rules"])
    check("说明书含数据血缘", len(rb["lineage"]) >= 6)

    print("\n--- 11. 索引清理与每日本地备份 ---")
    check("迁移 019 已应用", versions[-1] >= 19, str(versions[-1]))
    jidx = [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='journal'")]
    dup = [x for x in jidx if x.endswith('journal_date')]
    check("journal_date 重复索引已清理为 1 条", len(dup) == 1, str(dup))
    vidx = [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='vouchers'")]
    check("vouchers 冗余单列索引已清理", 'idx_vouchers_period' not in vidx, str(vidx))

    btmp = tempfile.mkdtemp(prefix="journal_backup_test_")
    orig_dir = server.BACKUP_DIR
    try:
        server.BACKUP_DIR = btmp
        for i in range(1, 10):
            with open(os.path.join(btmp, f"backup-2026-10-{i:02d}.json"), "w", encoding="utf-8") as bf:
                bf.write("{}")
        bp = server.daily_backup()
        names = sorted(os.listdir(btmp))
        check("每日本地备份生成并保留最近 7 份", bp is not None and len(names) == 7,
              f"{len(names)} 份 / {os.path.basename(bp) if bp else 'None'}")
        check("同日重复启动不重复备份（幂等）", server.daily_backup() is None)
    finally:
        server.BACKUP_DIR = orig_dir
        shutil.rmtree(btmp, ignore_errors=True)

    conn.close()
    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    if FAIL:
        for f in FAIL:
            print("  FAILED:", f)
    shutil.rmtree(TMP, ignore_errors=True)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
