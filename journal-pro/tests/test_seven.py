# -*- coding: utf-8 -*-
"""V2.16 七流 / 岗位 / 演示数据 回归测试（临时账套）。"""
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_seven_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402,F401
from app.bootstrap import start as assemble_all  # noqa: E402
assemble_all()
import app.extensions.workmap7 as S  # noqa: E402
import app.extensions.demo_seed as D  # noqa: E402
from app.extensions.common import q, one, setting  # noqa: E402

PASS, FAIL = [], []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [OK] " if cond else "  [XX] ") + name + (f"  -> {detail}" if detail else ""))


def main():
    versions = db.migrate()
    check("迁移到 v17", versions[-1] >= 17, str(versions))
    conn = db.connect()

    print("\n--- 七流与岗位 ---")
    sy = S.sync(conn, None, {}, {})
    f = S.flows(conn, None, {}, {"no": ["1"]})
    check("① 表2 七流齐备", len(f["七流"]) == 7 and len(f["流名"]) == 7,
          str({k: v["节点数"] for k, v in f["七流"].items()}))
    check("  每流都有节点链", all(v["节点数"] > 0 for v in f["七流"].values()))
    rs = S.roles(conn, None, {}, {})
    check("② 表3 五类岗位", rs["总数"] == 5, str(rs["总数"]))
    rd = S.role_detail(conn, None, {}, {"no": ["1"]})
    check("③ 岗位含七流与三级进阶", len(rd["七流"]) == 7 and len(rd["能力进阶"]) == 3,
          str([x["级别"] for x in rd["能力进阶"]]))
    check("  岗位关联到具体工作", len(rd["关联工作"]) >= 1)
    ctl = S.controls(conn, None, {}, {})
    check("④ 管控流检查点有系统映射", ctl["总数"] > 50 and all(x["系统支撑"] for x in ctl["items"]))
    comp = S.compliance(conn, None, {}, {})
    check("⑤ 合规流提取法规依据", comp["数量"] >= 5, str(comp["数量"]))
    dash = S.dashboard(conn, None, {}, {})
    check("⑥ 七流汇总", dash["工作数"] == 11 and dash["岗位数"] == 5 and dash["流节点"] > 300,
          f'节点 {dash["流节点"]}')

    print("\n--- 演示数据 ---")
    st0 = D.status(conn, None, {}, {})
    check("⑦ 初始未载入", not st0["已载入"])
    sd = D.seed(conn, None, {}, {})
    check("⑧ 一键载入覆盖多模块", sd["覆盖表"] >= 15 and sd["载入记录"] >= 30,
          f'{sd["覆盖表"]} 表 / {sd["载入记录"]} 条')
    for tbl, key in (("docs", "doc_no"), ("vouchers", "voucher_no"), ("invoices", "invoice_no"),
                     ("contracts", "contract_no"), ("audit_findings", "title"),
                     ("adv_inventory_moves", "item_code"), ("work_runs", "title")):
        n = one(conn, f"SELECT COUNT(*) n FROM {tbl}")["n"]
        check(f"  {tbl} 有示例", n >= 1, str(n))
    st1 = D.status(conn, None, {}, {})
    check("⑨ 状态可查询", st1["已载入"] and st1["记录数"] >= 30)
    defaults_before = one(conn, "SELECT COUNT(*) n FROM macro_scenarios")["n"]
    cl = D.clear(conn, None, {}, {})
    check("⑩ 一键清空演示数据", cl["删除演示记录"] >= 30 and D.status(conn, None, {}, {})["记录数"] == 0,
          str(cl["删除演示记录"]))
    check("  默认配置未被误删", one(conn, "SELECT COUNT(*) n FROM macro_scenarios")["n"] == defaults_before)
    check("  业务表回到载入前", one(conn, "SELECT COUNT(*) n FROM vouchers WHERE voucher_no LIKE '记-2026110%'")["n"] == 0)

    conn.close()
    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    if FAIL:
        for f in FAIL:
            print("  FAILED:", f)
    shutil.rmtree(TMP, ignore_errors=True)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
