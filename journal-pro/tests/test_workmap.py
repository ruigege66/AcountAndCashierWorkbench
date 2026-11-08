# -*- coding: utf-8 -*-
"""V2.15 四流工作台回归测试：11 项工作、四流对齐、步骤状态机、断链清单。"""
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_workmap_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402,F401
from app.bootstrap import start as assemble_all  # noqa: E402
assemble_all()
import app.extensions.workmap as W  # noqa: E402

PASS, FAIL = [], []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [OK] " if cond else "  [XX] ") + name + (f"  -> {detail}" if detail else ""))


def main():
    versions = db.migrate()
    check("迁移到 v16", versions[-1] >= 16, str(versions))
    conn = db.connect()
    sy = W.sync(conn, None, {}, {})
    check("① 调研表 11 项工作入库", W.works(conn, None, {}, {})["总数"] == 11,
          f'步骤 {sy["steps"]} / 动作 {sy["actions"]} / 数据节点 {sy["nodes"]}')
    check("  步骤与动作数量符合表内动词链", sy["steps"] >= 75 and sy["actions"] >= 70)

    d = W.detail(conn, None, {}, {"no": ["1"]})
    check("② 四流齐备", all(k in d for k in ("数据流", "价值流", "工作流", "执行流")))
    steps = d["工作流"]["步骤"]
    check("③ 工作流步骤与数据/执行横向对齐",
          all(s.get("数据流产物") and s.get("执行动作") and s.get("系统入口") for s in steps),
          f'{len(steps)} 步')
    check("  价值主张非空", len(d["价值流"]["价值点"]) >= 1)
    check("  执行流动作有系统入口", all(a["system_page"] for a in d["执行流"]["动作"]))

    # 抽查第 2 行（财务管理）与第 10 行（税法）映射是否落到真实模块
    for no, kw in ((2, "advanced_center"), (9, "tax_center")):
        dd = W.detail(conn, None, {}, {"no": [str(no)]})
        pages = [s["system_page"] for s in dd["工作流"]["步骤"]]
        check(f"④ 工作{no} 步骤映射到系统模块", kw in pages or "search" in pages, str(set(pages))[:80])

    g = W.gaps(conn, None, {}, {})
    check("⑤ 断链清单可量化", g["步骤数"] > 0 and g["动作数"] > 0,
          f'{g["步骤数"]} 步 / {g["动作数"]} 动作')
    dash = W.dashboard(conn, None, {}, {})
    check("⑥ 汇总含四流与工作数", dash["工作数"] == 11 and len(dash["四流"]) == 4
          and dash["工作流步骤"] >= 75)

    run = W.run_start(conn, None, {"no": 1, "title": "11月账务核算"}, {})
    check("⑦ 发起办理", run["ok"] and run["当前步骤"])
    total = len(W.detail(conn, None, {}, {"no": ["1"]})["工作流"]["步骤"])
    last = None
    for i in range(total):
        last = W.run_step(conn, None, {"run_id": run["id"], "note": f"第{i+1}步已办"}, {})
    check("⑧ 逐步推进直至闭环", last["状态"] == "已完成" and last["进度"] == f"{total}/{total}",
          last["进度"])
    rs = W.runs(conn, None, {}, {})
    check("⑨ 我的办理记录", rs["进行中"] == 0 and len(rs["items"]) == 1)

    conn.close()
    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    if FAIL:
        for f in FAIL:
            print("  FAILED:", f)
    shutil.rmtree(TMP, ignore_errors=True)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
