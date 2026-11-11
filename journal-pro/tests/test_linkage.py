# -*- coding: utf-8 -*-
"""跨功能业务联动回归测试（临时账套，不影响生产数据）。

与其它套件的区别：其它套件验证「单个功能自己算得对」，本套件验证
「改了 A 功能，B/C/D 功能是否跟着变、该变的是否都变、不该变的是否没变」。

做法：probe() 一次性采集 20 个下游模块的读数指纹 → 执行一个上游写操作
→ 再采一次 → changed() 得出「被联动影响的下游集合」，据此断言联动覆盖面、
精确金额传导、负向隔离（驳回/作废不污染下游）与幂等（重复提交不重复入账）。

运行：python tests/test_linkage.py
"""
import os
import sys
import tempfile
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import db  # noqa: E402

TMP = tempfile.mkdtemp(prefix="journal_linkage_")
db.DB_PATH = os.path.join(TMP, "test.db")
db.MIGRATIONS = os.path.join(ROOT, "migrations")

import server as S  # noqa: E402  (注册核心路由)
from app.bootstrap import start as assemble_all  # noqa: E402
assemble_all()
import features as F  # noqa: E402
import analytics_api as A  # noqa: E402
import app.extensions.tax as T  # noqa: E402
import app.extensions.demo_seed as D  # noqa: E402
from core.rules import ImpactGraph, WRITES, EDGES, ANALYSIS_NODES, DATA_NODES  # noqa: E402

PASS, FAIL = [], []
PERIOD = "2026-11"


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [OK] " if cond else "  [XX] ") + name + (f"  -> {detail}" if detail else ""))


def expect_error(name, fn, keyword=""):
    try:
        fn()
        check(name, False, "未抛出预期异常")
    except Exception as e:
        ok = (keyword in str(e)) if keyword else True
        check(name, ok, str(e)[:80])


class M:
    """模拟带路径参数的正则匹配对象"""

    def __init__(self, *groups):
        self.g = groups

    def group(self, i):
        return self.g[i - 1]


# ==================== 下游探针 ====================
# 每个 lambda 返回该模块的完整输出（或关键字段）；repr 作为指纹，
# 任何字段变化都会被 changed() 捕获，不需要预先知道字段名。
TIME_KEYS = {"generated_at", "created_at", "updated_at", "now", "server_time",
             "posted_at", "closed_at", "timestamp"}


def clean(o):
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items() if k not in TIME_KEYS}
    if isinstance(o, (list, tuple)):
        return [clean(x) for x in o]
    return o


PROBES = {
    "journal": lambda c, p: S.report_cashflow(c, None, None, {"period": [p], "scope": ["through"]}),
    "balance_sheet": lambda c, p: S.build_balance_sheet(c, p),
    "income": lambda c, p: S.build_income_statement(c, p),
    "articulation": lambda c, p: S.report_articulation(c, None, None, {"period": [p]}),
    "cashflow_statement": lambda c, p: F.cashflow_statement(c, None, None, {"period": [p]}),
    "ratios": lambda c, p: F.financial_ratios(c, None, None, {"period": [p]}),
    "compare": lambda c, p: F.compare_periods(c, None, None, {"period": [p]}),
    "analysis": lambda c, p: A.analysis_json(c, None, None, {"period": [p]}),
    "todo": lambda c, p: F.todo_center(c, None, None, {}),
    "monitor": lambda c, p: S.monitor(c, None, None, {}),
    "trialbalance": lambda c, p: S.report_trialbalance(c, None, None, {"period": [p]}),
    "ledger": lambda c, p: S.report_ledger(c, None, None, {"period": [p]}),
    "aging": lambda c, p: S.report_aging(c, None, None, {"period": [p]}),
    "collection": lambda c, p: F.collection_report(c, None, None, {"period": [p]}),
    "partner": lambda c, p: S.partner_report(c, None, None, {"period": [p]}),
    "tax_output": lambda c, p: T.output_ledger(c, None, None, {"period": [p]}),
    "tax_input": lambda c, p: T.input_ledger(c, None, None, {"period": [p]}),
    "tax_filing": lambda c, p: T.vat_filing_get(c, None, None, {"period": [p]}),
    "tax_surtax": lambda c, p: T.surtaxes(c, None, None, {"period": [p]}),
    "tax_ratio": lambda c, p: T.tax_ratios(c, None, None, {"period": [p], "months": ["3"]}),
}


def probe(c, p=PERIOD):
    out = {}
    for key, fn in PROBES.items():
        try:
            out[key] = repr(clean(fn(c, p)))
        except Exception as e:
            out[key] = "ERR:" + str(e)[:70]
    return out


def changed(before, after):
    return {k for k in before if before[k] != after[k]}


# ==================== 账套夹具 ====================
# journal 表带有「已登记日记账不可删除，更正请使用红字冲销」的防篡改触发器，
# 因此不能靠 DELETE 清空同一个库来隔离场景（会 IntegrityError）。
# 每个场景开一个全新临时账套，最干净也最接近真实业务：各账套之间本就不该串数据。
_CASE_NO = [0]
_LAST_CONN = [None]


def new_case(name="case"):
    _CASE_NO[0] += 1
    if _LAST_CONN[0] is not None:
        try:
            _LAST_CONN[0].close()
        except Exception:
            pass
    db.DB_PATH = os.path.join(TMP, "case_%02d_%s.db" % (_CASE_NO[0], name))
    db.migrate()
    c = db.connect()
    _LAST_CONN[0] = c
    c.execute("INSERT OR IGNORE INTO periods(period,status) VALUES(?,'open')", (PERIOD,))
    c.execute("INSERT INTO opening_balances(period,subject_code,debit,credit) VALUES(?,?,?,?)",
              (PERIOD, "1001", 100000.0, 0.0))
    c.execute("INSERT INTO opening_balances(period,subject_code,debit,credit) VALUES(?,?,?,?)",
              (PERIOD, "1002", 200000.0, 0.0))
    c.execute("INSERT INTO opening_balances(period,subject_code,debit,credit) VALUES(?,?,?,?)",
              (PERIOD, "4001", 0.0, 300000.0))
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES('separate_duties','0')")
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES('budget_control','0')")
    c.commit()
    return c


def add_doc(c, typ="receipt", amount=10000.0, subject="6001", date=PERIOD + "-05",
            applicant="张三", account_kind="bank"):
    return S.add_doc(c, None, {"doc_type": typ, "doc_date": date, "amount": amount,
                               "subject_code": subject, "applicant": applicant,
                               "account_kind": account_kind,
                               "reason": "联动测试"}, {})


def doc_flow(c, did, actor="出纳"):
    S.doc_action(c, M(str(did), "submit"), {"actor": "张三"}, {})
    S.doc_action(c, M(str(did), "approve"), {"actor": "主管"}, {})
    r = S.doc_action(c, M(str(did), "settle"), {"actor": actor}, {})
    c.commit()
    return r


def add_invoice(c, no, kind, amount, tax, date=PERIOD + "-05"):
    c.execute("""INSERT INTO invoices(invoice_no,kind,invoice_date,period,counterparty_id,
        amount,tax_amount,total_amount,status,created_at) VALUES(?,?,?,?,1,?,?,?,?,?)""",
              (no, kind, date, PERIOD, amount, tax, amount + tax, "已入账", date))
    c.commit()


def add_voucher(c, date, dr, cr, amount, post=True):
    p = date[:7]
    cur = c.execute("""INSERT INTO vouchers(voucher_no,voucher_date,period,voucher_type,summary,
        maker,status,created_at) VALUES(?,?,?,'转','联动测试','测试','draft',?)""",
                    ("L" + date.replace("-", "") + str(c.execute("SELECT COUNT(*) FROM vouchers").fetchone()[0]),
                     date, p, date))
    vid = cur.lastrowid
    c.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit) VALUES(?,?,?,?,0)",
              (vid, 1, dr, amount))
    c.execute("INSERT INTO voucher_lines(voucher_id,line_no,subject_code,debit,credit) VALUES(?,?,?,0,?)",
              (vid, 2, cr, amount))
    c.commit()
    if post:
        S.post_voucher(c, vid, "测试")
        c.commit()
    return vid


def cash(c, p=PERIOD):
    return S.build_balance_sheet(c, p)["assets"][0]["amount"]


def net(c, p=PERIOD):
    return S.build_income_statement(c, p)["net_current"]


def cf(c, p=PERIOD):
    return S.report_cashflow(c, None, None, {"period": [p], "scope": ["through"]})


def art_ok(c, p=PERIOD):
    return all(x["pass"] for x in S.report_articulation(c, None, None, {"period": [p]})["checks"])


# ==================== 场景 ====================
def main():
    versions = db.migrate()
    check("迁移完成（联动测试基线，含 018 演示数据可清理）", versions[-1] >= 18, str(versions[-1]))
    c = new_case("baseline")

    print("\n--- 0. 探针健康度 ---")
    base = probe(c)
    errs = [k for k, v in base.items() if v.startswith("ERR:")]
    check("① 20 个下游模块探针全部可用", not errs and len(base) == 20,
          "异常模块: " + (", ".join(errs) or "无"))
    check("  基线账套平衡", S.build_balance_sheet(c, PERIOD)["balanced"], "资产=负债+权益")
    check("  基线三大勾稽成立", art_ok(c))

    # ---------- 1. 单据结算：一个动作联动全部下游 ----------
    print("\n--- 1. 单据审批→结算：跨模块联动覆盖面 ---")
    did = add_doc(c)["id"]
    before = probe(c)
    r = doc_flow(c, did)
    after = probe(c)
    ch = changed(before, after)
    expect_core = {"journal", "balance_sheet", "income", "articulation", "cashflow_statement",
                   "ratios", "compare", "analysis", "todo", "monitor", "trialbalance", "ledger"}
    check("② 结算自动联动核心下游（12 个模块）", expect_core <= ch,
          "已联动: " + ",".join(sorted(ch)))
    check("  生成凭证且为已过账", bool(r.get("voucher_id")) and
          db.one(c, "SELECT status FROM vouchers WHERE id=?", (r["voucher_id"],))["status"] == "posted")
    check("  凭证回溯到源单据", db.one(c, "SELECT source_doc_id FROM vouchers WHERE id=?",
                                 (r["voucher_id"],))["source_doc_id"] == did)
    check("  单据状态 → settled", db.one(c, "SELECT status FROM docs WHERE id=?", (did,))["status"] == "settled")
    check("③ 银行日记账流入 +10000", cf(c)["in_total"] == 10000.0, str(cf(c)["in_total"]))
    check("  货币资金 300000 → 310000", cash(c) == 310000.0, str(cash(c)))
    check("  净利润 +10000", net(c) == 10000.0, str(net(c)))
    check("  现金流量表净额 +10000", cf(c)["net"] == 10000.0)
    check("  现金流量表勾稽仍成立", F.cashflow_statement(c, None, None, {"period": [PERIOD]})["check"])
    check("④ 联动后三大勾稽仍成立", art_ok(c))
    check("  联动后资产负债表仍平衡", S.build_balance_sheet(c, PERIOD)["balanced"])
    check("  比率随净利变化", before["ratios"] != after["ratios"])
    check("  在线经营分析报告同步刷新", before["analysis"] != after["analysis"])
    check("  待办中心同步刷新", before["todo"] != after["todo"])
    LINK_CH = set(ch)          # 留作 ⑭「声明的影响链 ↔ 真实联动」比对

    # ---------- 2. 负向：驳回不污染下游 ----------
    print("\n--- 2. 负向联动：驳回 / 草稿不该影响报表 ---")
    c = new_case("negative")
    did2 = add_doc(c, amount=8888.0)["id"]
    S.doc_action(c, M(str(did2), "submit"), {"actor": "张三"}, {})
    c.commit()
    before = probe(c)
    S.doc_action(c, M(str(did2), "reject"), {"actor": "主管"}, {})
    c.commit()
    after = probe(c)
    ch = changed(before, after)
    money_modules = {"journal", "balance_sheet", "income", "cashflow_statement", "trialbalance",
                     "ledger", "ratios", "analysis"}
    check("⑤ 驳回不产生任何金额类下游变化", not (money_modules & ch),
          "误联动: " + (",".join(sorted(money_modules & ch)) or "无"))
    check("  未生成凭证", db.one(c, "SELECT COUNT(*) n FROM vouchers")["n"] == 0)
    check("  待办中心仍联动（待审批消项）", "todo" in ch)
    check("  单据状态 → rejected", db.one(c, "SELECT status FROM docs WHERE id=?",
                                     (did2,))["status"] == "rejected")

    # ---------- 3. 幂等：重复过账不重复入账 ----------
    print("\n--- 3. 幂等联动：重复过账不重复登记 ---")
    c = new_case("idempotent")
    vid = add_voucher(c, PERIOD + "-06", "1002", "6001", 5000.0, post=False)
    before = probe(c)
    check("⑥ 草稿凭证不进报表", before["balance_sheet"] == repr(clean(S.build_balance_sheet(c, PERIOD)))
          and db.one(c, "SELECT COUNT(*) n FROM journal")["n"] == 0)
    S.post_voucher(c, vid, "测试")
    c.commit()
    once = probe(c)
    S.post_voucher(c, vid, "测试")   # 第二次应直接 return
    c.commit()
    twice = probe(c)
    check("⑦ 过账联动下游", "balance_sheet" in changed(before, once) and cf(c)["in_total"] == 5000.0)
    check("  重复过账零新增联动（幂等）", once == twice,
          "差异模块: " + (",".join(sorted(changed(once, twice))) or "无"))
    check("  日记账只有 1 条", db.one(c, "SELECT COUNT(*) n FROM journal")["n"] == 1)

    # ---------- 4. 负向：作废凭证不进下游 ----------
    print("\n--- 4. 负向联动：作废凭证不入账 ---")
    c = new_case("void")
    vid2 = add_voucher(c, PERIOD + "-07", "1002", "6001", 7000.0, post=False)
    before = probe(c)
    S.voucher_action(c, M(str(vid2), "void"), {"actor": "测试"}, {})
    c.commit()
    after = probe(c)
    check("⑧ 作废不产生金额类下游变化",
          not ({"journal", "balance_sheet", "income", "trialbalance", "ledger"} & changed(before, after)))
    expect_error("  已作废凭证不能过账", lambda: S.post_voucher(c, vid2, "测试"), "作废")

    # ---------- 5. 发票 → 销项税 → 增值税申报 → 税负率 → 附加税 ----------
    print("\n--- 5. 税务链：发票登记联动申报/税负/附加 ---")
    c = new_case("tax")
    # 会计收入口径（利润表营业收入）作为税负率分母
    add_voucher(c, PERIOD + "-05", "1002", "6001", 50000.0)
    add_invoice(c, "XL-13", "销项", 10000.0, 1300.0)
    add_invoice(c, "JX-13", "进项", 8000.0, 1040.0)
    T.input_certs(c, None, {"invoice_nos": "JX-13", "cert_status": "已认证", "actor": "测试"}, {})
    c.commit()
    before = probe(c)
    f0 = T.vat_filing_get(c, None, None, {"period": [PERIOD]})
    add_invoice(c, "XL-6", "销项", 5000.0, 300.0)
    after = probe(c)
    ch = changed(before, after)
    f1 = T.vat_filing_get(c, None, None, {"period": [PERIOD]})
    check("⑨ 新增销项发票联动 4 个税务下游",
          {"tax_output", "tax_filing", "tax_surtax", "tax_ratio"} <= ch,
          "已联动: " + ",".join(sorted(ch & {"tax_output", "tax_filing", "tax_surtax", "tax_ratio"})))
    check("  销项税额 1300 → 1600", f0["output_tax"] == 1300.0 and f1["output_tax"] == 1600.0,
          f"{f0['output_tax']} → {f1['output_tax']}")
    check("  应纳税额 260 → 560", f0["payable"] == 260.0 and f1["payable"] == 560.0,
          f"{f0['payable']} → {f1['payable']}")
    check("  附加税费同步 +36.00", T.surtaxes(c, None, None, {"period": [PERIOD]})["total"] == 67.2)
    ratios = T.tax_ratios(c, None, None, {"period": [PERIOD], "months": ["1"]})["items"]
    check("  增值税税负率同步 1.12%", ratios[-1]["vat_ratio"] == 1.12, str(ratios[-1]["vat_ratio"]))
    check("  税负率控制带两位小数生效", T.tax_ratios(c, None, None, {"period": [PERIOD], "months": ["1"]})["target"]["precision"] == "两位小数")

    # ---------- 6. 进项认证 → 抵扣 → 应纳税额 ----------
    print("\n--- 6. 税务链：进项认证改变应纳税额 ---")
    add_invoice(c, "JX-6", "进项", 3000.0, 180.0)
    before = probe(c)
    pay_before = T.vat_filing_get(c, None, None, {"period": [PERIOD]})["payable"]
    T.input_certs(c, None, {"invoice_nos": "JX-6", "cert_status": "已认证", "actor": "测试"}, {})
    c.commit()
    after = probe(c)
    pay_after = T.vat_filing_get(c, None, None, {"period": [PERIOD]})["payable"]
    check("⑩ 进项认证联动进项台账与申报",
          {"tax_input", "tax_filing", "tax_surtax", "tax_ratio"} <= changed(before, after))
    check("  应纳税额 560 → 380（抵扣 180）", pay_before == 560.0 and pay_after == 380.0,
          f"{pay_before} → {pay_after}")
    check("  不可抵扣进项单列", T.vat_filing_get(c, None, None, {"period": [PERIOD]})["input_uncertified"] == 0.0)

    # ---------- 7. 坏账计提 → 利润 / 资产 / 比率 ----------
    print("\n--- 7. 计提链：坏账准备联动三表与比率 ---")
    c = new_case("baddebt")
    add_invoice(c, "YS-1", "销项", 20000.0, 2600.0)
    add_voucher(c, PERIOD + "-06", "1122", "6001", 20000.0)
    before = probe(c)
    n0, a0 = net(c), S.build_balance_sheet(c, PERIOD)["total_assets"]
    pv = F.bad_debt_provision(c, None, {"period": PERIOD, "actor": "会计"}, {})
    c.commit()
    after = probe(c)
    ch = changed(before, after)
    check("⑪ 坏账计提联动利润表/资产负债表/比率/勾稽",
          {"income", "balance_sheet", "ratios", "articulation", "trialbalance", "ledger"} <= ch,
          "已联动: " + ",".join(sorted(ch)))
    check("  净利润下降", net(c) < n0, f"{n0} → {net(c)}")
    check("  资产合计下降（1231 为减项）", S.build_balance_sheet(c, PERIOD)["total_assets"] < a0,
          f"{a0} → {S.build_balance_sheet(c, PERIOD)['total_assets']}")
    check("  计提后勾稽仍成立", art_ok(c))
    check("  计提返回 impacts 影响链", "impacts" in pv and pv["impacts"]["count"] >= 5)
    check("  计提金额与凭证一致", abs(pv["amount"] - db.one(
        c, "SELECT SUM(debit) v FROM voucher_lines WHERE voucher_id=?", (pv["voucher_id"],))["v"]) < 0.005)
    expect_error("  重复计提被拦截（幂等）",
                 lambda: F.bad_debt_provision(c, None, {"period": PERIOD, "actor": "会计"}, {}), "足额")

    # ---------- 8. 期间状态：一个配置联动所有写功能 ----------
    print("\n--- 8. 配置联动：期间结账影响所有写入口 ---")
    c = new_case("period")
    c.execute("UPDATE periods SET status='closed' WHERE period=?", (PERIOD,))
    c.commit()
    expect_error("⑫ 结账期间禁止新增单据", lambda: add_doc(c), "已结账")
    expect_error("  结账期间禁止新增凭证",
                 lambda: S.create_voucher(c, {"voucher_date": PERIOD + "-05", "lines": [
                     {"subject_code": "1002", "debit": 100, "credit": 0},
                     {"subject_code": "6001", "debit": 0, "credit": 100}]}), "已结账")
    check("  结账期间零数据落库",
          db.one(c, "SELECT COUNT(*) n FROM docs")["n"] == 0 and
          db.one(c, "SELECT COUNT(*) n FROM vouchers")["n"] == 0)
    S.period_action(c, M(PERIOD, "reopen"), {"actor": "主管"}, {})
    c.commit()
    check("  反结账后写入能力恢复", bool(add_doc(c).get("id")))

    # ---------- 9. 预算控制：预算功能联动单据结算 ----------
    print("\n--- 9. 配置联动：预算控制拦截超支结算 ---")
    c = new_case("budget")
    c.execute("INSERT INTO budgets(period,subject_code,amount,note) VALUES(?,?,?,?)",
              (PERIOD, "6602", 1000.0, "联动测试预算"))
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES('budget_control','1')")
    c.commit()
    did3 = add_doc(c, typ="payment", amount=2000.0, subject="6602")["id"]
    S.doc_action(c, M(str(did3), "submit"), {"actor": "张三"}, {})
    S.doc_action(c, M(str(did3), "approve"), {"actor": "主管"}, {})
    c.commit()
    before = probe(c)
    expect_error("⑬ 超预算结算被拦截",
                 lambda: S.doc_action(c, M(str(did3), "settle"), {"actor": "李四"}, {}), "预算控制")
    c.commit()
    check("  拦截后下游零污染",
          not ({"journal", "balance_sheet", "income", "trialbalance", "ledger"} & changed(before, probe(c))))
    check("  未生成凭证 / 日记账",
          db.one(c, "SELECT COUNT(*) n FROM vouchers")["n"] == 0 and
          db.one(c, "SELECT COUNT(*) n FROM journal")["n"] == 0)
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES('budget_control','0')")
    c.commit()
    r3 = S.doc_action(c, M(str(did3), "settle"), {"actor": "李四"}, {})
    c.commit()
    check("  关闭预算控制后结算成功并联动", r3["ok"] and cf(c)["out_total"] == 2000.0)

    # ---------- 10. 职责分离：设置联动审批与结算 ----------
    print("\n--- 10. 配置联动：职责分离约束审批链 ---")
    c = new_case("duties")
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES('separate_duties','1')")
    c.commit()
    did4 = add_doc(c, amount=1500.0, applicant="出纳")["id"]
    S.doc_action(c, M(str(did4), "submit"), {"actor": "出纳"}, {})
    c.commit()
    before = probe(c)
    expect_error("⑭ 申请人不能审批自己的单据",
                 lambda: S.doc_action(c, M(str(did4), "approve"), {"actor": "出纳"}, {}), "职责分离")
    c.commit()
    check("  被拒后单据状态未推进",
          db.one(c, "SELECT status FROM docs WHERE id=?", (did4,))["status"] == "submitted")
    check("  被拒后报表零污染", not ({"balance_sheet", "journal", "income"} & changed(before, probe(c))))
    S.doc_action(c, M(str(did4), "approve"), {"actor": "主管"}, {})
    c.commit()
    expect_error("  申请人不能自行办理收付款",
                 lambda: S.doc_action(c, M(str(did4), "settle"), {"actor": "出纳"}, {}), "职责分离")
    S.doc_action(c, M(str(did4), "settle"), {"actor": "李四"}, {})
    c.commit()
    check("  换人办理后联动到账", cf(c)["in_total"] == 1500.0)

    # ---------- 11. 影响链声明 ↔ 真实联动 ----------
    print("\n--- 11. 架构联动：声明的影响链与真实数据变化对齐 ---")
    declared = {x["id"] for x in ImpactGraph.impact("voucher.post")["affects"]}
    mapped = {"balance_sheet": "balance_sheet", "income": "income", "articulation": "articulation",
              "journal": "journal", "cashflow": "cashflow_statement", "ratios": "ratios",
              "compare": "compare", "todo": "todo", "monitor": "monitor"}
    expect_real = {mapped[k] for k in declared if k in mapped}
    check("⑮ voucher.post 声明的下游全部真的联动了", expect_real <= LINK_CH,
          f"声明 {len(expect_real)} 个 / 实际联动 {len(LINK_CH)} 个，缺: "
          + (",".join(sorted(expect_real - LINK_CH)) or "无"))
    all_actions = ImpactGraph.all_actions()
    counts_ok = all(x["count"] == sum(1 for e in EDGES if e[0] == x["id"]) for x in all_actions)
    check("⑯ 每个写操作的影响链条数与图定义一致", counts_ok and len(all_actions) == len(WRITES),
          f"{len(all_actions)} 个写操作 / {len(EDGES)} 条边")
    dup_free = all(len({x["id"] for x in ImpactGraph.impact(a)["affects"]}) ==
                   len(ImpactGraph.impact(a)["affects"]) for a in WRITES)
    check("  影响链无重复下游节点", dup_free)
    real_tables = {r["name"] for r in db.q(c, "SELECT name FROM sqlite_master WHERE type='table'")}
    bad_tables = sorted({t for w in WRITES.values() for t in w["tables"] if t not in real_tables})
    check("⑰ 影响链声明的写入表都真实存在", not bad_tables, ",".join(bad_tables) or "全部命中")
    front_pages = set(__import__("re").findall(
        r'href="#(\w+)"', open(os.path.join(ROOT, "public", "index.html"), encoding="utf-8").read()))
    bad_pages = sorted({p for w in WRITES.values() for p in w["pages"] if p not in front_pages})
    check("  影响链声明的页面都在侧栏注册", not bad_pages, ",".join(bad_pages) or "全部命中")
    imp_all = A.impacts_get(c, None, None, {})["items"]
    graph = A.graph_get(c, None, None, {})
    check("⑱ 影响链 API 与知识图谱数据一致",
          len(imp_all) == len(WRITES) and len(graph["edges"]) == len(EDGES) and
          len(graph["nodes"]) == len(ANALYSIS_NODES) + len(WRITES))

    # ---------- 12. 写操作返回的 impacts 与影响链定义一致 ----------
    print("\n--- 12. 写操作返回的影响链与定义一致 ---")
    c = new_case("impacts")
    used = F.apply_subject_template(c, None, {"template": "small", "actor": "会计"}, {})
    exp1 = ImpactGraph.impact("subjects.apply")
    check("⑲ 套用科目模板返回的影响链与定义一致",
          used["impacts"]["count"] == exp1["count"] and
          [x["id"] for x in used["impacts"]["affects"]] == [x["id"] for x in exp1["affects"]])
    check("  套用模板联动新增科目且不覆盖已有", used["added"] > 0 and
          db.one(c, "SELECT COUNT(*) n FROM subjects WHERE code='1001'")["n"] == 1)
    c = new_case("impacts2")
    add_invoice(c, "YS-2", "销项", 20000.0, 2600.0)
    prov = F.bad_debt_provision(c, None, {"period": PERIOD, "actor": "会计"}, {})
    exp2 = ImpactGraph.impact("bad_debt.provision")
    check("⑳ 坏账计提返回的影响链与定义一致",
          prov["impacts"]["count"] == exp2["count"] and
          [x["id"] for x in prov["impacts"]["affects"]] == [x["id"] for x in exp2["affects"]])

    # ---------- 13. 演示数据 seed / clear 联动（含账本防篡改规则） ----------
    print("\n--- 13. 演示数据：载入/清空联动与用户数据隔离 ---")
    c = new_case("demo")
    uid = S.add_doc(c, None, {"doc_type": "receipt", "doc_date": PERIOD + "-02", "amount": 777.0,
                              "subject_code": "6001", "applicant": "真实用户",
                              "account_kind": "bank", "reason": "我自己的数据"}, {})["id"]
    c.commit()
    before = probe(c)
    # 模拟旧版 clear() 留下的「未登记」孤儿演示流水：不在 demo_records 里，但带 [演示] 标记
    c.execute("""INSERT INTO journal(journal_date,period,account_kind,direction,amount,balance_after,
        summary,subject_code,recon_status,created_at) VALUES(?,?,'bank','in',999,0,
        '[演示]历史残留','6001','未核对',?)""", (PERIOD + "-01", PERIOD, PERIOD + "-01"))
    c.commit()
    seeded = D.seed(c, None, {}, {})
    c.commit()
    after = probe(c)
    ch = changed(before, after)
    check("㉑ 载入演示数据联动多个下游模块", len(ch) >= 6, f"联动 {len(ch)} 个: " + ",".join(sorted(ch)))
    check("  演示数据登记 48 条 / 29 张表", seeded["载入记录"] == 48 and seeded["覆盖表"] == 29)
    check("  status 显示已载入", D.status(c, None, None, {})["已载入"])
    cleared = D.clear(c, None, {}, {})
    c.commit()
    check("㉒ 清空演示数据不留残留（联动 018 迁移）",
          cleared["ok"] and cleared["删除演示记录"] == 48 and not cleared["未删除"],
          f"删除 {cleared['删除演示记录']} 条 / 未删除 {len(cleared['未删除'])} 条")
    check("  清空后下游读数完全复原", probe(c) == before,
          "未复原: " + (",".join(sorted(changed(before, probe(c)))) or "无"))
    check("  历史遗留的孤儿演示流水也清干净",
          cleared.get("清理历史残留", 0) >= 1 and
          db.one(c, "SELECT COUNT(*) n FROM journal")["n"] == 0,
          f"清理 {cleared.get('清理历史残留')} 条")
    check("  用户自己的数据未被误删", db.one(c, "SELECT COUNT(*) n FROM docs WHERE id=?", (uid,))["n"] == 1)
    check("  demo_records 已清空", db.one(c, "SELECT COUNT(*) n FROM demo_records")["n"] == 0)
    # 真实业务流水仍受账本不可变规则保护
    add_voucher(c, PERIOD + "-09", "1002", "6001", 1000.0)
    expect_error("㉓ 真实已登记流水仍禁止删除",
                 lambda: c.execute("DELETE FROM journal"), "不可删除")

    # ---------- 14. 跨期联动 ----------
    print("\n--- 14. 跨期联动：本期 / 累计 / 下期口径 ---")
    c = new_case("cross_period")
    add_voucher(c, "2026-11-05", "1002", "6001", 10000.0)
    add_voucher(c, "2026-12-05", "1002", "6001", 5000.0)
    inc11, inc12 = S.build_income_statement(c, "2026-11"), S.build_income_statement(c, "2026-12")
    check("㉔ 11 月本期净利 10000", inc11["net_current"] == 10000.0)
    check("  12 月本期净利 5000（不串本期）", inc12["net_current"] == 5000.0)
    check("  12 月本年累计 15000（承接上月）", inc12["net_cum"] == 15000.0)
    check("  12 月货币资金 315000", S.build_balance_sheet(c, "2026-12")["assets"][0]["amount"] == 315000.0)
    check("  12 月三大勾稽仍成立", art_ok(c, "2026-12"))
    check("  下期数据不回填上期", inc11["net_current"] == 10000.0)

    # ---------- 15. 单据类型全覆盖：四种单据各自的分录方向 ----------
    print("\n--- 15. 四种单据类型：结算分录与现金流方向 ---")
    c = new_case("doc_types")
    for typ, amt in (("receipt", 1000.0), ("payment", 500.0),
                     ("advance", 300.0), ("reimbursement", 200.0)):
        d = add_doc(c, typ=typ, amount=amt, subject="6602" if typ != "receipt" else "6001")
        doc_flow(c, d["id"])
    jrows = db.q(c, "SELECT direction,SUM(amount) v FROM journal GROUP BY direction")
    jm = {r["direction"]: r["v"] for r in jrows}
    check("㉕ 收款单产生流入 1000", jm.get("in") == 1000.0, str(jm))
    check("  付款/备用金/报销产生流出 1000", jm.get("out") == 1000.0, str(jm))
    check("  四张单据各生成一张已过账凭证",
          db.one(c, "SELECT COUNT(*) n FROM vouchers WHERE status='posted'")["n"] == 4)
    check("  四种业务后报表仍平衡", S.build_balance_sheet(c, PERIOD)["balanced"])
    check("  四种业务后勾稽仍成立", art_ok(c))

    # ---------- 16. 分析口径一致性：同一数据被多个功能消费 ----------
    print("\n--- 16. 口径一致：经营报告与独立报表读数相同 ---")
    c = new_case("consistency")
    add_voucher(c, PERIOD + "-05", "1002", "6001", 20000.0)
    add_voucher(c, PERIOD + "-06", "6602", "1002", 3000.0)
    rep = A.analysis_json(c, None, None, {"period": [PERIOD]})
    bs = S.build_balance_sheet(c, PERIOD)
    inc = S.build_income_statement(c, PERIOD)
    ra = F.financial_ratios(c, None, None, {"period": [PERIOD]})
    check("㉖ 报告 KPI 与资产负债表一致",
          rep["kpi"]["total_assets"] == bs["total_assets"] and
          rep["kpi"]["cash"] == bs["assets"][0]["amount"])
    check("  报告 KPI 与利润表一致",
          rep["kpi"]["net_current"] == inc["net_current"] and
          rep["kpi"]["revenue"] == inc["cumulative"][0]["amount"])
    check("  报告与比率页评分一致", rep["kpi"]["score"] == ra["score"])
    check("  报告内资产负债表平衡标记一致", rep["balance"]["balanced"] == bs["balanced"])
    check("  试算平衡借贷相等（下游一致性）",
          (lambda t: t["debit_total"] == t["credit_total"])(
              S.report_trialbalance(c, None, None, {"period": [PERIOD]})))

    # ---------- 17. 折旧计提联动 ----------
    print("\n--- 17. 资产链：购置 → 折旧 → 三表与比率 ---")
    c = new_case("depreciation")
    aid = S.add_asset(c, None, {"name": "联动测试设备", "original_value": 12000.0,
                                 "salvage_rate": 0.05, "useful_life_months": 12,
                                 "start_period": PERIOD, "purchase_date": PERIOD + "-01",
                                 "expense_subject": "6602"}, {})["id"]
    c.commit()
    S.asset_capitalize(c, M(str(aid), "capitalize"), {"actor": "会计"}, {})
    c.commit()
    before = probe(c)
    n0 = net(c)
    dep = S.depreciate(c, None, {"period": PERIOD, "actor": "会计"}, {})
    c.commit()
    ch = changed(before, probe(c))
    check("㉗ 折旧联动利润表/资产负债表/比率/勾稽",
          {"income", "balance_sheet", "ratios", "articulation", "trialbalance"} <= ch,
          "已联动: " + ",".join(sorted(ch)))
    check("  月折旧额 950.00", dep["total"] == 950.0, str(dep["total"]))
    check("  净利润减少 950", net(c) == n0 - 950.0, f"{n0} → {net(c)}")
    check("  累计折旧入账 950", db.one(c, "SELECT accumulated FROM assets WHERE id=?", (aid,))["accumulated"] == 950.0)
    check("  折旧后报表仍平衡", S.build_balance_sheet(c, PERIOD)["balanced"])
    expect_error("  同月重复计提被拦截",
                 lambda: S.depreciate(c, None, {"period": PERIOD, "actor": "会计"}, {}), "没有需要计提")

    # ---------- 18. 新增科目自动归集报表 ----------
    print("\n--- 18. 科目模板：新增科目联动报表兜底归集 ---")
    c = new_case("subjects")
    F.apply_subject_template(c, None, {"template": "small", "actor": "会计"}, {})
    c.commit()
    a0 = S.build_balance_sheet(c, PERIOD)["total_assets"]
    add_voucher(c, PERIOD + "-05", "1012", "6001", 4000.0)   # 1012 其他货币资金，非硬编码报表行
    bs2 = S.build_balance_sheet(c, PERIOD)
    check("㉘ 新增科目自动归集且资产合计 +4000", bs2["total_assets"] == a0 + 4000.0,
          f"{a0} → {bs2['total_assets']}")
    check("  新增科目后报表仍平衡", bs2["balanced"])
    check("  自动归集行带说明", any("自动归集" in str(x.get("reclass", "")) for x in bs2["assets"]))

    # ---------- 19. 增值税一般纳税人认定预警（2026 新规）跨模块联动 ----------
    print("\n--- 19. 增值税认定预警：凭证 / 发票 → 预警 / 大屏 联动 ---")
    c = new_case("vat")
    d0 = date.today().replace(day=1)
    months = []
    for i in range(11, -1, -1):
        y, mo = d0.year, d0.month - i
        while mo <= 0:
            mo += 12
            y -= 1
        months.append(f"{y:04d}-{mo:02d}")
    for i, p in enumerate(months):
        add_voucher(c, p + "-05", "1002", "6001", 450000.0)
        add_invoice(c, f"VAT-X-{i:02d}", "销项", 400000.0, 52000.0, date=p + "-06")
    c.commit()

    vat = S.vat_taxpayer_status(c)
    check("㉙ 连续12个月收入 540 万触发超标认定", vat["rolling_total"] == 5400000.0
          and vat["level"] == "高" and vat["status"] == "已超标准",
          f"¥{vat['rolling_total']:,.2f} / {vat['percent']}% / {vat['status']}")
    check("  统计窗口为任意连续 12 个月（非自然年度）",
          vat["window"][0] == months[0] and vat["window"][1] == months[-1],
          f"{vat['window'][0]} ~ {vat['window'][1]}")
    al = S.alerts_list(c, None, None, {})["items"]
    check("  预警引擎联动：出现「税务合规」高风险",
          any(x["category"] == "税务合规" and x["level"] == "高" for x in al))
    mon = S.monitor(c, None, None, {})
    check("  监控大屏联动：高风险计数包含该预警",
          mon.get("alerts_summary", {}).get("high", 0) >= 1,
          str(mon.get("alerts_summary")))
    check("  发票口径联动：销项合计 480 万且给出账票差异",
          vat["invoice_total"] == 4800000.0 and vat["diff"] == -600000.0,
          f"票 ¥{vat['invoice_total']:,.2f} / 差异 ¥{vat['diff']:,.2f}")
    check("  月度明细 12 行（会计收入与发票并列）", len(vat["monthly"]) == 12)
    route = S.vat_status_route(c, None, None, {})
    check("  API 路由与计算引擎读数一致", route["rolling_total"] == vat["rolling_total"])

    # 负向：草稿凭证与结转凭证都不参与应税销售额
    vd = add_voucher(c, months[-1] + "-20", "1002", "6001", 800000.0, post=False)
    c.execute("UPDATE vouchers SET is_closing=1 WHERE id=?", (vd,))
    c.commit()
    check("  草稿 / 结转凭证不计入销售额",
          S.vat_taxpayer_status(c)["rolling_total"] == 5400000.0)

    # 配置联动：身份、阈值均可调，且不影响税率计算用的 taxpayer_type
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES('risk_vat_registered','general')")
    c.commit()
    vg = S.vat_taxpayer_status(c)
    check("  已登记一般纳税人后不再预警", vg["level"] == ""
          and vg["status"] == "已是一般纳税人")
    check("  与税率计算键 taxpayer_type 解耦",
          db.one(c, "SELECT value FROM settings WHERE key='taxpayer_type'")["value"] != "small")
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES('risk_vat_registered','small')")
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES('risk_vat_threshold','6000000')")
    c.commit()
    vt = S.vat_taxpayer_status(c)
    check("  认定标准可调：改 600 万后降级为临近提醒",
          vt["level"] == "中" and vt["percent"] == 90.0, f"{vt['status']} / {vt['percent']}%")
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES('risk_vat_warn_pct','50')")
    c.commit()
    check("  临近提醒线可调：50% 时 90% 完成度升级为中级",
          S.vat_taxpayer_status(c)["level"] == "中")

    print(f"\n{'=' * 56}\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    return 0 if not FAIL else 1


if __name__ == "__main__":
    sys.exit(main())
