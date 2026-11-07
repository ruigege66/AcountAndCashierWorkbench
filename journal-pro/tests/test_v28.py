# -*- coding: utf-8 -*-
"""V2.8 回归测试：24 项功能的读写、防重复、联动与安全默认关闭（临时账套）。"""
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_v28_test_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server  # noqa: E402,F401
from app.bootstrap import start as assemble_all  # noqa: E402
assemble_all()  # 装配全部控制器，确保路由表完整（168 条）
from app.routing import get_router  # noqa: E402
import app.extensions.accounting as A  # noqa: E402
import app.extensions.cashier as C  # noqa: E402
import app.extensions.audit as AU  # noqa: E402
import app.extensions.security as S  # noqa: E402
from app.extensions.common import q, one, setting  # noqa: E402

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
        check(name, False, "未抛异常")
    except Exception as e:
        check(name, True, str(e)[:70])


def main():
    versions = db.migrate()
    check("迁移到 v11", versions[-1] >= 11, str(versions))
    conn = db.connect()
    # 基础凭证
    v = conn.execute("""INSERT INTO vouchers(voucher_no,voucher_date,period,voucher_type,summary,maker,status,created_at)
        VALUES('记-202611001','2026-11-05','2026-11','转','测试收入','制单员','draft','2026-11-05')""")
    vid = v.lastrowid
    conn.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit) VALUES(?,1,'1002',1000,0)", (vid,))
    conn.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit) VALUES(?,2,'6001',0,1000)", (vid,))
    conn.execute("""INSERT INTO journal(journal_date,period,account_kind,direction,amount,balance_after,
        summary,subject_code,recon_status,created_at) VALUES('2026-11-05','2026-11','bank','in',1000,1000,
        '测试收入','6001','未核对','2026-11-05')""")
    conn.commit()
    lid = one(conn, "SELECT id FROM voucher_lines WHERE voucher_id=? ORDER BY line_no LIMIT 1", (vid,))["id"]

    print("\n--- 会计域 ---")
    A.dim_set(conn, None, {"entity_type": "voucher_line", "entity_id": lid,
                           "dim_key": "部门", "dim_value": "销售部", "actor": "测试"}, {})
    conn.commit()
    check("① 辅助核算维度写入", len(A.dim_list(conn, None, {}, {})["items"]) == 1)
    r = A.voucher_batch(conn, None, {"ids": str(vid), "action": "post", "actor": "审核员"}, {})
    conn.commit()
    check("② 凭证批量过账", len(r["done"]) == 1 and "impacts" in r, str(r["done"]))
    check("  批量过账声明影响链", r["impacts"]["count"] >= 5)
    tc = A.trial_compare(conn, None, {}, {"periods": ["2026-10,2026-11"]})
    check("③ 多期试算对比", len(tc["periods"]) == 2 and isinstance(tc["items"], list), str(len(tc["items"])))
    a = A.accrual_add(conn, None, {"name": "年度软件费", "total_amount": 1200,
                                   "start_period": "2026-11", "end_period": "2026-12", "actor": "测试"}, {})
    conn.commit()
    check("④ 待摊费用登记", a["months"] == 2 and a["monthly"] == 600, str(a))
    run = A.accrual_run(conn, None, {"period": "2026-11", "actor": "审核员"}, {})
    conn.commit()
    check("  摊销生成凭证", len(run["done"]) == 1 and run["done"][0]["amount"] == 600, str(run["done"]))
    run2 = A.accrual_run(conn, None, {"period": "2026-11", "actor": "审核员"}, {})
    conn.commit()
    check("  重复摊销被拦截", run2["done"] == [] and run2["skipped"][0]["reason"] == "本期已摊销")
    A.numbering_set(conn, None, {"prefix": "记-", "digits": 3, "actor": "测试"}, {})
    conn.commit()
    check("⑤ 编号规则保存", A.numbering_get(conn, None, {}, {})["prefix"] == "记-")
    check("  编号合规校验", A.numbering_validate(conn, None, {}, {})["total"] >= 1)
    A.estimate_add(conn, None, {"kind": "坏账比例", "subject": "90天以上",
                                "old_value": "0.2", "new_value": "0.3", "reason": "谨慎性", "actor": "测试"}, {})
    conn.commit()
    check("⑥ 会计估计变更留痕", len(A.estimate_list(conn, None, {}, {})["items"]) == 1)
    miss = A.missing_attachments(conn, None, {}, {})
    link = A.link_attachments(conn, None, {"ids": str(vid), "actor": "测试"}, {})
    conn.commit()
    check("⑦ 附件缺失检查 + 补链", link["linked"] == 1 and miss["count"] >= 1, str(link["linked"]))
    check("  补链后再次检查数量下降", A.missing_attachments(conn, None, {}, {})["count"] < miss["count"])
    usage = A.subject_usage(conn, None, {}, {})
    check("⑧ 科目使用分析", len(usage["items"]) > 0 and "zombies" in usage,
          f"{len(usage['zombies'])} 个僵尸科目")

    print("\n--- 出纳域 ---")
    cc = C.cash_count_add(conn, None, {"count_date": "2026-11-06",
                                       "denominations": {"100": 5, "50": 2, "1": 3}, "actor": "出纳"}, {})
    conn.commit()
    check("⑨ 现金盘点按面额计算", cc["total"] == 603.0, str(cc["total"]))
    check("  盘点返回账实差额", "diff" in cc and "balanced" in cc)
    b = C.bill_add(conn, None, {"bill_no": "ZP001", "kind": "支票", "amount": 5000,
                                "issue_date": "2026-11-01", "due_date": "2026-11-20", "actor": "出纳"}, {})
    conn.commit()
    check("⑩ 票据登记", b["ok"], b["bill_no"])
    check("  票据到期预警列表", isinstance(C.bill_list(conn, None, {}, {})["due_soon"], list))
    check("  票据状态流转", C.bill_status(conn, M(str(b["id"])), {"status": "已兑付", "actor": "出纳"}, {})["ok"])
    conn.commit()
    bb = C.bank_balances(conn, None, {}, {})
    check("⑪ 多账户余额总览", "total" in bb and len(bb["items"]) >= 1, str(bb["total"]))
    fd = C.funds_daily(conn, None, {}, {"from": ["2026-11-01"], "to": ["2026-11-30"]})
    expect_in = one(conn, """SELECT COALESCE(SUM(amount),0) v FROM journal
        WHERE direction='in' AND journal_date BETWEEN '2026-11-01' AND '2026-11-30'""")["v"]
    check("⑫ 资金日报与流水一致", fd["in_total"] == round(expect_in, 2),
          f"{fd['in_total']} / 流水 {expect_in}")
    ap = C.approval_get(conn, None, {}, {"amount": ["8000"]})
    check("⑬ 审批额度分级", ap["approver"] in ("财务主管", "会计", "总经理"), str(ap["approver"]))
    fc = C.funds_forecast(conn, None, {}, {"days": ["30"]})
    check("⑭ 资金预测", "net_total" in fc and isinstance(fc["items"], list))
    cl = C.cash_limit_set(conn, None, {"limit": 20000, "actor": "主管"}, {})
    conn.commit()
    check("⑮ 现金限额配置", cl["ok"] and cl["check"]["limit"] == 20000)

    print("\n--- 架构审计域 ---")
    arch = AU.audit_architecture(conn, None, {}, {})
    check("⑯ AST 架构扫描", len(arch["files"]) > 5 and "by_layer" in arch,
          f"{len(arch['files'])} 文件 / {len(arch['cycles'])} 环")
    check("  扫描到零循环依赖", arch["cycles"] == [], str(arch["cycles"]))
    sm = AU.audit_smells(conn, None, {}, {})
    check("⑰ 代码异味清单", sm["total"] >= 0 and "by_type" in sm, f"{sm['total']} 项")
    rt = AU.audit_routes(conn, None, {}, {})
    check("⑱ 接口清单", rt["total"] >= 160 and rt["match_ms"] >= 0, f"{rt['total']} 路由 / {rt['match_ms']}ms")
    mx = AU.audit_matrix(conn, None, {}, {})
    check("⑲ 依赖矩阵", len(mx["modules"]) > 5 and len(mx["matrix"]) == len(mx["modules"]))
    sc = AU.audit_scorecard(conn, None, {}, {})
    check("⑳ 架构评分卡", 0 <= sc["score"] <= 100 and len(sc["dimensions"]) == 6,
          f"{sc['score']} 分 / {sc['grade']}")
    run = AU.audit_runtime(conn, None, {}, {})
    check("㉑ 运行时健康", run["migrations"][-1] == 11 and run["routes"] >= 160,
          f"v{run['migrations'][-1]} / {run['routes']} 路由")

    print("\n--- 安全域（默认只观测不阻断） ---")
    cfg = S.sec_config_get(conn, None, {}, {})
    check("㉒ 安全默认关闭", cfg["enabled"] is False, str(cfg["enabled"]))
    op = S.sec_operator_add(conn, None, {"name": "张会计", "password": "Test@123",
                                         "role": "accountant", "actor": "管理员"}, {})
    conn.commit()
    check("㉓ 操作员创建", op["ok"], op["name"])
    roles = S.sec_roles(conn, None, {}, {})
    check("㉔ 角色权限矩阵", len(roles["items"]) >= 4)
    S.sec_role_set(conn, None, {"name": "auditor", "permissions": ["report:read"], "actor": "管理员"}, {})
    conn.commit()
    check("  自定义角色写入", len(S.sec_roles(conn, None, {}, {})["items"]) >= 5)
    lg = S.sec_login(conn, None, {"name": "张会计", "password": "Test@123"}, {})
    conn.commit()
    check("㉕ 登录签发会话", lg["ok"] and lg["role"] == "accountant")
    check("  会话校验", S.sec_session(conn, None, {}, {"token": [lg["token"]]})["valid"])
    check("  登出", S.sec_logout(conn, None, {"token": lg["token"]}, {})["ok"])
    expect_error("  错误密码被拒绝",
                 lambda: S.sec_login(conn, None, {"name": "张会计", "password": "wrong"}, {}))
    so = S.sec_sensitive(conn, None, {}, {})
    check("㉖ 敏感操作统计", "items" in so and "by_action" in so, f"{so['count']} 条")
    rl = S.sec_ratelimit_set(conn, None, {"limit": 120}, {})
    conn.commit()
    check("㉗ 限流配置", rl["ok"] and S.sec_ratelimit_get(conn, None, {}, {})["limit_per_minute"] == 120)
    scan = S.sec_scan(conn, None, {"text": "SELECT * FROM t WHERE 1=1 OR 1=1"}, {})
    check("㉘ 输入安全扫描", not scan["safe"] and scan["risk"] == "高", str(scan["hits"]))
    mk = S.sec_masking(conn, None, {"sample": {"account_no": "6222021234567890", "name": "甲公司"}}, {})
    check("㉙ 数据脱敏", "****" in mk["masked"]["account_no"] and mk["masked"]["name"] == "甲公司",
          str(mk["masked"]))
    csrf = S.sec_csrf(conn, None, {}, {})
    check("㉚ CSRF Token", len(csrf["token"]) > 10)
    ev = S.sec_events(conn, None, {}, {})
    check("㉛ 安全事件日志", "count" in ev and isinstance(ev["items"], list))
    # 中间件默认不阻断
    insp = S.inspect_request(conn, "POST", "/api/test", {}, {"text": "<script>alert(1)</script>"}, "127.0.0.1")
    conn.commit()
    check("  中间件默认只观测", insp["block"] is False and len(insp["hits"]) > 0, str(insp["hits"]))
    # 开启后真实阻断
    S.sec_config_set(conn, None, {"enabled": True, "actor": "管理员"}, {})
    conn.commit()
    insp2 = S.inspect_request(conn, "POST", "/api/test", {}, {"text": "<script>x</script>"}, "127.0.0.1")
    conn.commit()
    check("  开启后拦截高风险输入", insp2["block"] is True, str(insp2["reason"]))
    S.sec_config_set(conn, None, {"enabled": False, "actor": "管理员"}, {})
    conn.commit()

    conn.close()
    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    if FAIL:
        for f in FAIL:
            print("  FAILED:", f)
    shutil.rmtree(TMP, ignore_errors=True)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
