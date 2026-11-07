# -*- coding: utf-8 -*-
"""统一账套上下文（领域层）：一个请求内所有分析共用同一份数据快照。

架构约束：本模块**不写 SQL、不导入主程序 / 数据库 / HTTP 层**。
所有取数通过构造时注入的 `LedgerPort`（app.ports）完成，因此可用内存假实现做单元测试，
也让「科目余额」这类基础口径只有一个实现。
"""
from datetime import date, datetime, timedelta


def period_end(period):
    """期间最后一天（坏账账龄等需要按历史时点计算的场景使用）"""
    y, m = int(period[:4]), int(period[5:7])
    nxt = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)
    return (nxt - timedelta(days=1)).isoformat()


def shift_month(period, n):
    y, mo = int(period[:4]), int(period[5:7])
    t = y * 12 + mo - 1 + n
    return f"{t // 12:04d}-{t % 12 + 1:02d}"


class AccountingContext:
    """账套快照。所有分析函数接收同一个 ctx，杜绝重复查询与口径不一致。"""

    def __init__(self, conn, period, rules=None, ledger=None):
        self.conn = conn
        self.period = period
        self.rules = rules
        self.ledger = ledger or _default_ledger(conn)
        self._cache = {}

    def _memo(self, key, producer):
        if key not in self._cache:
            self._cache[key] = producer()
        return self._cache[key]

    # ---------- 基础资料 ----------
    def subjects(self):
        return self._memo("subjects", self.ledger.subjects)

    def subject(self, code):
        return next((s for s in self.subjects() if s["code"] == code), None)

    def balances(self):
        """全部科目截至 period 的余额（正=借方，负=贷方）"""
        return self._memo("balances", lambda: self.ledger.balances(self.period))

    def balance(self, code):
        b = self.balances().get(code)
        return b["value"] if b else 0.0

    # ---------- 按规则编码分类（不靠中文科目名字符串匹配） ----------
    def classify(self, code):
        r = self.rules.get("liquidity") if self.rules else None
        if not r:
            r = {"noncurrent_asset": ["15", "16", "17", "18"],
                 "current_liability": ["20", "22", "23", "2241"],
                 "noncurrent_liability": ["25", "27"]}
        for p in r.get("noncurrent_liability", []):
            if code.startswith(p):
                return "noncurrent_liability"
        for p in r.get("current_liability", []):
            if code.startswith(p):
                return "current_liability"
        for p in r.get("noncurrent_asset", []):
            if code.startswith(p):
                return "noncurrent_asset"
        s = self.subject(code)
        cat = s["category"] if s else ""
        return {"资产": "current_asset", "负债": "current_liability",
                "权益": "equity", "损益": "pl", "成本": "cost"}.get(cat, "unknown")

    def group_balance(self, kind):
        """按流动性分类汇总：资产为正数余额，负债/权益取贷方（负号转正）"""
        asset_kinds = ("current_asset", "noncurrent_asset")
        vals = [b["value"] if kind in asset_kinds else -b["value"]
                for code, b in self.balances().items() if self.classify(code) == kind]
        return round(sum(vals), 2)

    # ---------- 报表（端口注入的已验证实现，结果缓存） ----------
    def balance_sheet(self):
        return self._memo("bs", lambda: self.ledger.balance_sheet(self.period))

    def income(self):
        return self._memo("income", lambda: self.ledger.income(self.period))

    def statement_for(self, period):
        return self._memo("inc:" + period, lambda: self.ledger.income(period))

    def articulation(self):
        return self._memo("art", lambda: self.ledger.articulation(self.period))

    def cash_opening(self):
        return self._memo("cash0", lambda: self.ledger.cash_opening(self.period))

    # ---------- 流水 / 发票 ----------
    def journal_rows(self, scope="current"):
        """scope: current=当月 / ytd=本年累计 / through=自建账起累计 / all=全部"""
        return self._memo("journal:" + scope,
                          lambda: self.ledger.journal(scope, self.period))

    def journal_month(self, period):
        return self._memo("jm:" + period, lambda: self.ledger.journal_month(period))

    def cashflow_net(self, scope="through"):
        rows = self.journal_rows(scope)
        return round(sum(r["amount"] if r["direction"] == "in" else -r["amount"] for r in rows), 2)

    def invoices(self, aged=False):
        def build():
            rows = self.ledger.invoices()
            if aged:
                basis = self.rules.get("aging.basis", "period_end") if self.rules else "period_end"
                asof = period_end(self.period) if basis == "period_end" else datetime.now().strftime("%Y-%m-%d")
                base = datetime.strptime(asof, "%Y-%m-%d").date()
                for r in rows:
                    r["days"] = max(0, (base - datetime.strptime(r["invoice_date"], "%Y-%m-%d").date()).days)
                    r["bucket"] = ("0-30天" if r["days"] <= 30 else "31-60天" if r["days"] <= 60
                                   else "61-90天" if r["days"] <= 90 else "90天以上")
                    r["direction"] = "应收" if r["kind"] == "销项" else "应付"
            return rows
        return self._memo("invoices:aged" if aged else "invoices", build)

    def as_of(self):
        return period_end(self.period)

    def company(self):
        return self._memo("company", self.ledger.company)


def _default_ledger(conn):
    """默认装配：从组合根取端口工厂（生产注入真实实现，测试可注入假实现）"""
    from app import make_ledger
    return make_ledger(conn)
