# -*- coding: utf-8 -*-
"""V2.14 四流需求中枢 + 高阶核算/财务模型/工作流闭环 回归测试（临时账套）。"""
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_competency_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402,F401
from app.bootstrap import start as assemble_all  # noqa: E402
assemble_all()
import app.extensions.competency as C  # noqa: E402
import app.extensions.advanced_accounting as A  # noqa: E402

PASS, FAIL = [], []


def call(fn, conn, body):
    return fn(conn, None, body, {})

def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [OK] " if cond else "  [XX] ") + name + (f"  -> {detail}" if detail else ""))


def main():
    versions = db.migrate()
    check("迁移到 v15", versions[-1] >= 15, str(versions))
    conn = db.connect()

    print("\n--- 四流需求中枢 ---")
    sync = C.sync(conn, None, {}, {})
    check("① 调研表 11 科目完整入库", sync["总条目"] > 60 and len(C.domains(conn, None, {}, {})["items"]) == 11,
          f'条目 {sync["总条目"]}')
    cov = C.coverage(conn, None, {}, {})
    check("② 覆盖度矩阵含四类状态", all(k in cov for k in ("已覆盖", "部分覆盖", "缺失", "不适用", "整体完整度")),
          f'完整度 {cov["整体完整度"]}%')
    gaps = C.gaps(conn, None, {}, {})
    check("③ 缺口清单非空", len(gaps["items"]) > 20, f'{len(gaps["items"])} 项')
    tr = C.flow_trace(conn, None, {}, {})
    check("④ 四流追溯：11 科四流齐备", len(tr["items"]) == 11 and all(x["四流是否齐备"] == "是" for x in tr["items"]))
    check("  贯通判定含断流提示", any("断流" in x["贯通判定"] for x in tr["items"]))
    app = C.applicability(conn, None, {}, {})
    check("⑤ 适用性裁剪有依据", app["数量"] >= 3 and all(x["note"] for x in app["items"]))
    check("⑥ 图谱汇总含分轮计划", len(C.dashboard(conn, None, {}, {})["分轮计划"]) >= 5)

    print("\n--- 高阶核算 ---")
    A.asset_add(conn, None, {"kind": "无形资产", "code": "WX001", "name": "软件著作权",
                             "cost": 120000, "life_months": 60}, {})
    A.asset_add(conn, None, {"kind": "投资性房地产", "code": "TZ001", "name": "出租商铺",
                             "cost": 3000000, "life_months": 240}, {})
    conn.commit()
    check("⑦ 资产台账登记", len(A.assets(conn, None, {}, {})["items"]) == 2)
    am = call(A.intangible_amortization, conn, {"cost": 120000, "life_months": 60})
    check("  无形资产摊销 2000/月", am["每月摊销"] == 2000.0, str(am["每月摊销"]))
    # 存货 FIFO：入10@10、入10@12、出15 → 发出160，结存60
    for d, qty, price in (("入", 10, 10), ("入", 10, 12), ("出", 15, 0.01)):
        A.inventory_move(conn, None, {"item_code": "CH001", "direction": d, "qty": qty, "unit_cost": price}, {})
    conn.commit()
    v = A.inventory_valuation(conn, None, {}, {"item_code": ["CH001"], "method": ["FIFO"]})
    check("⑧ 存货先进先出：发出成本 160", v["累计发出成本"] == 160.0, str(v["累计发出成本"]))
    check("  期末结存 60", v["期末结存成本"] == 60.0, str(v["期末结存成本"]))
    wd = A.inventory_writedown(conn, None, {"cost": 100, "nrv": 80}, {})
    check("⑨ 存货跌价准备 20", wd["应计提跌价准备"] == 20.0)
    eq = A.equity_method(conn, None, {"cost": 1000000, "share": 0.3, "profit": 500000, "dividend": 100000}, {})
    check("⑩ 权益法期末长投 1,120,000", eq["期末长投账面价值"] == 1120000.0, str(eq["期末长投账面价值"]))
    dt = A.deferred_tax(conn, None, {"deductible": 10000, "taxable": 20000, "rate": 0.25}, {})
    check("⑪ 递延所得税资产 2500 / 负债 5000", dt["递延所得税资产"] == 2500.0 and dt["递延所得税负债"] == 5000.0)
    lc = A.lease_calc(conn, None, {"months": 12, "payment": 1000, "annual_rate": 0.06}, {})
    check("⑫ 租赁负债现值小于名义付款总额", 0 < lc["租赁负债初始金额"] < 12000, str(lc["租赁负债初始金额"]))
    rev = A.revenue_five_step(conn, None, {"amount": 100000, "timing": "时段", "progress": 0.4}, {})
    check("⑬ 收入五步法按履约进度确认", rev["本期应确认收入"] == 40000.0)
    corr = A.correction(conn, None, {"kind": "前期差错更正", "amount": 5000, "summary": "冲回多计收入"}, {})
    check("⑭ 会计调整事项留痕", corr["调整金额"] == 5000.0 and len(A.adjustments(conn, None, {}, {})["items"]) >= 1)

    print("\n--- 财务模型 ---")
    t = A.tvm(conn, None, {"pv": 10000, "rate": 0.1, "periods": 2}, {})
    check("⑮ 货币时间价值终值 12100", t["终值"] == 12100.0, str(t["终值"]))
    w = A.wacc(conn, None, {"equity": 600000, "debt": 400000, "cost_equity": 0.12,
                            "cost_debt": 0.06, "tax_rate": 0.25}, {})
    check("⑯ WACC 计算", w["WACC"] == "9.00%", w["WACC"])
    n = A.npv(conn, None, {"cashflows": [-10000, 6000, 6000], "rate": 0.1}, {})
    check("⑰ NPV 为正判定可行", n["净现值NPV"] > 0 and "可行" in n["结论"], str(n["净现值NPV"]))
    ir = A.irr(conn, None, {"cashflows": [-10000, 6000, 6000]}, {})
    check("⑱ IRR 输出百分比", "%" in ir["内含报酬率IRR"], ir["内含报酬率IRR"])
    du = A.dupont(conn, None, {"net_profit": 100000, "revenue": 1000000,
                               "assets": 500000, "equity": 250000}, {})
    check("⑲ 杜邦 ROE = 40%", du["净资产收益率ROE"] == "40.00%", du["净资产收益率ROE"])
    ev = A.eva(conn, None, {"nopat": 200000, "capital": 1000000, "wacc": 0.1}, {})
    check("⑳ EVA = 100000", ev["EVA"] == 100000.0)
    bs = A.black_scholes(conn, None, {"spot": 100, "strike": 100, "years": 1,
                                      "risk_free": 0.05, "volatility": 0.2}, {})
    check("㉑ Black-Scholes 看涨价值为正", bs["看涨期权价值"] > 0)
    cvp = A.cvp(conn, None, {"price": 100, "unit_variable": 60, "fixed_cost": 20000, "sales_qty": 1000}, {})
    check("㉒ 本量利临界销量 500", cvp["盈亏临界销量"] == 500.0)
    check("  模型记录自动留痕", A.models(conn, None, {}, {})["总数"] >= 10)

    print("\n--- 工作流闭环 ---")
    wf = A.wf_create(conn, None, {"kind": "全面预算", "title": "2027 年度预算", "amount": 5000000}, {})
    check("㉓ 预算闭环 5 步", wf["步骤数"] == 5, str(wf["步骤数"]))
    for i in range(5):
        st = A.wf_step(conn, None, {"workflow_id": wf["id"]}, {})
    check("㉔ 逐步推进直至完成", st["流程状态"] == "已完成" and st["下一步"] is None)
    ov = A.wf_overview(conn, None, {}, {})
    check("㉕ 四类闭环模板", ov["闭环类型"] == 4 and ov["已完成"] == 1)
    check("㉖ 高阶工作台汇总", A.adv_dashboard(conn, None, {}, {})["财务模型"] == 11)

    conn.close()
    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    if FAIL:
        for f in FAIL:
            print("  FAILED:", f)
    shutil.rmtree(TMP, ignore_errors=True)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
