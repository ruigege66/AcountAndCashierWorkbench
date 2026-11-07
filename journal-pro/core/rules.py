# -*- coding: utf-8 -*-
"""规则引擎 + 功能影响图。

两个目的：
1) 所有计算口径（流动性划分、现金流分类、比率阈值、账龄）集中配置，可在线修改并立即生效；
2) 把「一个写操作会改动哪些下游」显式声明成图，而不是靠开发者记忆，前端可据此提示与刷新。
"""
import copy
import json

SETTINGS_KEY = "analysis_rules"

DEFAULT_RULES = {
    "liquidity": {
        "noncurrent_asset": ["15", "16", "17", "18"],
        "current_liability": ["20", "22", "23", "2241"],
        "noncurrent_liability": ["25", "27"],
        "inventory": ["14"],
    },
    "cashflow": {
        "operating": ["6001", "6051", "6301", "6401", "6402", "6403", "6601", "6602",
                      "6603", "6604", "6701", "6702", "6711", "6801", "1122", "1123",
                      "1221", "2202", "2203", "2314", "2221", "2211", "2241"],
        "investing": ["1511", "1601", "1602", "1604", "1701", "1702", "1231", "1101"],
        "financing": ["2001", "2501", "4001", "4002", "4101", "4103", "4104"],
        "unclassified": "warn",
    },
    "ratios": {
        "流动比率": {"min": 1.5}, "速动比率": {"min": 1.0}, "现金比率": {"min": 0.3},
        "资产负债率": {"min": 20, "max": 70}, "产权比率": {"max": 1.5},
        "销售毛利率": {"min": 20}, "销售净利率": {"min": 5},
        "期间费用率": {"max": 20}, "总资产周转率": {"min": 0.5},
        "应收账款周转率": {"min": 4},
    },
    "aging": {
        "basis": "period_end",
        "buckets": ["0-30天", "31-60天", "61-90天", "90天以上"],
        "rates": {"0-30天": 0.01, "31-60天": 0.05, "61-90天": 0.10, "90天以上": 0.30},
    },
    "score": {"weights": {}},
}

RULE_DOCS = {
    "liquidity.noncurrent_asset": ("非流动资产科目前缀", "15/16/17/18 开头的科目不计入流动资产，用于流动比率分子"),
    "liquidity.current_liability": ("流动负债科目前缀", "20/22/23 开头的负债计入流动比率分母"),
    "liquidity.noncurrent_liability": ("非流动负债科目前缀", "25/27 开头（如长期借款）不得计入流动负债"),
    "liquidity.inventory": ("存货科目前缀", "速动比率从流动资产中扣除的科目"),
    "cashflow.operating": ("经营活动科目", "对方科目命中即为经营现金流；收入/成本/费用/往来结算"),
    "cashflow.investing": ("投资活动科目", "固定资产、无形资产、长期股权投资等购建与处置"),
    "cashflow.financing": ("筹资活动科目", "借款、实收资本、利润分配等"),
    "cashflow.unclassified": ("未命中科目处理", "warn=单列「未分类」并提示；operating=并入经营（旧行为）"),
    "aging.basis": ("账龄基准日", "period_end=按所选期间月末（推荐）；today=按系统当前日期"),
    "aging.rates": ("坏账计提比例", "按账龄区间计提，0~1 之间；与 1231 已计提额比较后只补差额"),
    "ratios": ("财务比率健康区间", "min=健康下限，max=健康上限；留空表示不限；用于状态与健康度评分"),
    "score.weights": ("健康度权重", "各指标在综合评分中的权重，留空表示等权"),
}


def deep_merge(base, patch):
    out = copy.deepcopy(base)
    for k, v in (patch or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out


def _default_ledger(conn):
    """规则持久化也走端口，领域层不直接执行 SQL。"""
    from app import make_ledger
    return make_ledger(conn)


class RuleEngine:
    """规则读写。所有规则存 settings.analysis_rules（JSON），修改后立即对所有分析生效。"""

    def __init__(self, conn, ledger=None):
        self.conn = conn
        self.ledger = ledger or _default_ledger(conn)
        self.data = deep_merge(DEFAULT_RULES, self.ledger.rules())

    def all(self):
        return copy.deepcopy(self.data)

    def get(self, path, default=None):
        cur = self.data
        for part in path.split("."):
            if not isinstance(cur, dict) or part not in cur:
                return default
            cur = cur[part]
        return cur

    def validate(self, patch):
        for k, v in (patch.get("aging", {}).get("rates") or {}).items():
            if not isinstance(v, (int, float)) or not 0 <= float(v) <= 1:
                raise ValueError(f"账龄区间「{k}」的计提比例须在 0~1 之间")
        for name, t in (patch.get("ratios") or {}).items():
            lo, hi = t.get("min"), t.get("max")
            if lo is not None and hi is not None and float(lo) > float(hi):
                raise ValueError(f"「{name}」的健康下限不能大于上限")
        if patch.get("aging", {}).get("basis") not in (None, "period_end", "today"):
            raise ValueError("账龄基准日只能是 period_end 或 today")
        if patch.get("cashflow", {}).get("unclassified") not in (None, "warn", "operating"):
            raise ValueError("未分类处理方式只能是 warn 或 operating")

    def update(self, patch):
        self.validate(patch)
        merged = deep_merge(self.data, patch)
        self.ledger.set_setting(SETTINGS_KEY, json.dumps(merged, ensure_ascii=False))
        # 向后兼容：旧版坏账接口读独立的 bad_debt_rates
        self.ledger.set_setting("bad_debt_rates",
                                json.dumps(merged["aging"]["rates"], ensure_ascii=False))
        self.data = merged
        return self.all()

    def reset(self):
        self.ledger.set_setting(SETTINGS_KEY, "")
        self.data = copy.deepcopy(DEFAULT_RULES)
        return self.all()

    def describe(self):
        return {"docs": [{"path": k, "name": v[0], "desc": v[1]} for k, v in RULE_DOCS.items()],
                "rules": self.all(), "defaults": copy.deepcopy(DEFAULT_RULES)}


# ---------------- 功能影响图（网状关系） ----------------
DATA_NODES = ["vouchers 凭证", "voucher_lines 分录", "journal 出纳流水", "bank_statements 对账单",
              "invoices 发票", "subjects 科目", "opening_balances 期初", "assets 固定资产"]

ANALYSIS_NODES = {
    "balance_sheet": "资产负债表", "income": "利润表", "articulation": "三大勾稽",
    "cashflow": "现金流量表", "ratios": "财务比率", "compare": "同比环比",
    "aging": "账龄分析", "collection": "催收清单", "bad_debt": "坏账计提",
    "todo": "待办中心", "trial_balance": "科目余额表", "partner": "往来账",
    "alerts": "风险预警", "monitor": "监控大屏", "snapshots": "报表快照",
    "dim_report": "辅助核算维度报表", "accruals": "待摊摊销", "cash_count": "现金盘点",
    "bills": "票据台账", "funds": "资金预测", "security": "安全中心",
    "architecture": "架构审计", "trial_compare": "多期试算对比",
}

WRITES = {
    "voucher.create": {"label": "新增/套用凭证模板", "tables": ["vouchers", "voucher_lines"],
                       "pages": ["tpl", "vouchers"]},
    "voucher.post": {"label": "凭证过账", "tables": ["vouchers", "voucher_lines", "journal"],
                     "pages": ["vouchers", "journal"]},
    "bad_debt.provision": {"label": "坏账准备计提", "tables": ["vouchers", "voucher_lines"],
                           "pages": ["baddebt"]},
    "year_end.carry": {"label": "年度结转 4103→4104", "tables": ["vouchers", "voucher_lines"],
                       "pages": ["yearend"]},
    "depreciation.run": {"label": "计提折旧", "tables": ["vouchers", "voucher_lines", "assets"],
                         "pages": ["assets"]},
    "invoice.post": {"label": "发票生成凭证", "tables": ["vouchers", "voucher_lines", "invoices", "journal"],
                     "pages": ["invoices"]},
    "opening.save": {"label": "期初建账", "tables": ["opening_balances"], "pages": ["books"]},
    "subjects.apply": {"label": "套用科目模板", "tables": ["subjects"], "pages": ["subjects"]},
    "statements.import": {"label": "对账单批量导入", "tables": ["bank_statements"], "pages": ["stmtimport", "recon"]},
    "period.close": {"label": "期末结账 / 结转损益", "tables": ["periods", "vouchers"], "pages": ["periods"]},
    "v28.voucher_batch": {"label": "凭证批量过账", "tables": ["vouchers", "voucher_lines", "journal"], "pages": ["acct_tools"]},
    "v28.accrual_run": {"label": "待摊费用摊销", "tables": ["vouchers", "voucher_lines", "accrual_runs"], "pages": ["acct_tools"]},
    "v28.dim_set": {"label": "设置辅助核算维度", "tables": ["dim_values"], "pages": ["acct_tools"]},
    "v28.cash_count": {"label": "现金盘点", "tables": ["cash_counts"], "pages": ["cashier_tools"]},
    "v28.bill_add": {"label": "登记票据", "tables": ["bills"], "pages": ["cashier_tools"]},
    "v28.security_config": {"label": "安全策略变更", "tables": ["settings", "security_events"], "pages": ["sec_center"]},
}

# 写操作 → 下游分析（effect 说明为什么会被影响）
EDGES = [
    ("voucher.create", "trial_balance", "草稿凭证不参与余额表，过账后才计入"),
    ("voucher.post", "balance_sheet", "分录进入科目余额，资产/负债/权益随之变动"),
    ("voucher.post", "income", "损益类分录改变本期与本年累计净利润"),
    ("voucher.post", "articulation", "利润表与资产负债表留存收益必须同步变化"),
    ("voucher.post", "journal", "现金/银行分录自动登记出纳日记账"),
    ("voucher.post", "cashflow", "日记账流水是现金流量表的唯一数据源"),
    ("voucher.post", "ratios", "余额与净利变化会传导到全部 10 项比率"),
    ("voucher.post", "compare", "本期数变化会改变环比/同比与 12 月趋势"),
    ("voucher.post", "todo", "未过账凭证数减少，待办自动消项"),
    ("voucher.post", "monitor", "大屏指标与 14 天收支曲线实时刷新"),
    ("bad_debt.provision", "income", "6701 资产减值损失计入其他损益，净利润减少"),
    ("bad_debt.provision", "balance_sheet", "1231 坏账准备为资产减项，资产合计减少"),
    ("bad_debt.provision", "ratios", "净利率下降、资产周转率上升"),
    ("bad_debt.provision", "compare", "计提当月净利润下降，环比随之变化"),
    ("bad_debt.provision", "articulation", "两侧同时变化，勾稽仍应成立"),
    ("bad_debt.provision", "bad_debt", "已计提额增加，再次计提会被拦截"),
    ("year_end.carry", "balance_sheet", "4103 清零、4104 增加，留存收益总额不变"),
    ("year_end.carry", "ratios", "权益结构变化，产权比率分母不变"),
    ("year_end.carry", "articulation", "留存收益口径兼容年结，勾稽仍成立"),
    ("depreciation.run", "income", "折旧费用计入当期损益"),
    ("depreciation.run", "balance_sheet", "累计折旧增加，固定资产净值减少"),
    ("depreciation.run", "ratios", "净利率与总资产周转率变化"),
    ("invoice.post", "balance_sheet", "应收/应付与应交税费变化"),
    ("invoice.post", "aging", "发票状态变为已入账，账龄分布改变"),
    ("invoice.post", "collection", "已入账发票仍可催收，但状态更新"),
    ("invoice.post", "partner", "往来明细账新增凭证行"),
    ("invoice.post", "todo", "未入账发票数减少"),
    ("opening.save", "balance_sheet", "期初余额是科目余额的起点"),
    ("opening.save", "articulation", "期初不平会直接破坏资产=负债+权益"),
    ("opening.save", "ratios", "全部余额类指标重算"),
    ("subjects.apply", "balance_sheet", "新增科目由通用兜底自动归集入表"),
    ("subjects.apply", "income", "新增损益科目自动归入对应行或其他损益"),
    ("subjects.apply", "cashflow", "新科目按现金流映射规则分类"),
    ("statements.import", "alerts", "未匹配流水超期会触发预警"),
    ("statements.import", "todo", "银行流水未匹配数增加"),
    ("statements.import", "monitor", "对账相关指标刷新"),
    ("period.close", "todo", "往期未结账项消项"),
    ("period.close", "income", "结转损益凭证被排除，利润不被冲平"),
    ("v28.voucher_batch", "balance_sheet", "批量过账后分录进入科目余额"),
    ("v28.voucher_batch", "income", "损益类分录改变本期与累计净利润"),
    ("v28.voucher_batch", "cashflow", "现金银行分录自动登记日记账"),
    ("v28.voucher_batch", "ratios", "余额与净利变化传导到全部比率"),
    ("v28.voucher_batch", "trial_compare", "本期发生额变化影响多期对比"),
    ("v28.voucher_batch", "articulation", "两侧同步变化，勾稽仍应成立"),
    ("v28.accrual_run", "income", "摊销费用计入当期损益"),
    ("v28.accrual_run", "balance_sheet", "待摊资产减少、费用增加"),
    ("v28.accrual_run", "ratios", "净利率与资产周转率变化"),
    ("v28.accrual_run", "accruals", "本期摊销记录写入，重复执行被拦截"),
    ("v28.dim_set", "dim_report", "新维度值进入按维度汇总报表"),
    ("v28.cash_count", "cash_count", "盘点差额进入日结核对"),
    ("v28.cash_count", "alerts", "账实不符触发预警"),
    ("v28.bill_add", "bills", "票据台账新增记录并计算到期预警"),
    ("v28.bill_add", "funds", "票据到期日进入未来资金预测"),
    ("v28.security_config", "security", "开启后中间件按新策略拦截请求"),
    ("v28.security_config", "architecture", "安全事件纳入运行时健康统计"),
]


class ImpactGraph:
    """显式的依赖关系：给定写操作，返回它会影响的下游功能与需要刷新的页面。"""

    @staticmethod
    def impact(action):
        w = WRITES.get(action, {})
        hits = [(t, label, eff) for a, t, eff in EDGES if a == action
                for label in [ANALYSIS_NODES.get(t, t)]]
        return {"action": action, "label": w.get("label", action),
                "writes": w.get("tables", []),
                "affects": [{"id": t, "label": label, "effect": eff} for t, label, eff in hits],
                "count": len(hits), "pages": w.get("pages", [])}

    @staticmethod
    def all_actions():
        return [{"id": k, "label": v["label"], "count": sum(1 for e in EDGES if e[0] == k)}
                for k, v in WRITES.items()]

    @staticmethod
    def graph():
        return {"nodes": [{"id": k, "label": v, "type": "analysis"} for k, v in ANALYSIS_NODES.items()]
                + [{"id": k, "label": v["label"], "type": "write"} for k, v in WRITES.items()],
                "edges": [{"from": a, "to": b, "effect": c} for a, b, c in EDGES]}
