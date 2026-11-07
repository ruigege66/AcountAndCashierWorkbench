# -*- coding: utf-8 -*-
"""端口与适配器：领域层只依赖这里的抽象，SQL 全部收拢在 SqliteLedger。

之前 core/context.py、core/analytics.py 里散着 11 条 SQL 和 11 处 `from server import`，
属于领域层反向依赖传输层。现在 core 只调用 LedgerPort，组合根注入实现。
"""
import json
from typing import Protocol


class LedgerPort(Protocol):
    def subjects(self): ...
    def balances(self, period): ...
    def journal(self, scope, period): ...
    def invoices(self): ...
    def setting(self, key, default=""): ...
    def set_setting(self, key, value): ...
    def balance_sheet(self, period): ...
    def income(self, period): ...
    def articulation(self, period): ...
    def cash_opening(self, period): ...
    def company(self): ...


class SqliteLedger:
    """把账套查询/规则读写封装成语义方法，领域层不再出现 SQL 字符串。"""

    def __init__(self, conn, reports=None):
        self.conn = conn
        self._reports = reports or {}

    # ---- 基础资料 ----
    def subjects(self):
        return [dict(r) for r in self.conn.execute("SELECT * FROM subjects ORDER BY code")]

    def balances(self, period):
        out = {}
        for s in self.subjects():
            code = s["code"]
            op = self.conn.execute("""SELECT COALESCE(SUM(debit-credit),0) v FROM opening_balances
                 WHERE subject_code=? AND period=(SELECT MAX(period) FROM opening_balances
                 WHERE subject_code=? AND period<=?)""", (code, code, period)).fetchone()["v"]
            posted = self.conn.execute("""SELECT COALESCE(SUM(l.debit-l.credit),0) v
                 FROM voucher_lines l JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted'
                 WHERE l.subject_code=? AND v.period<=?""", (code, period)).fetchone()["v"]
            out[code] = {"name": s["name"], "category": s["category"],
                         "direction": s["direction"], "value": round(op + posted, 2)}
        return out

    def journal(self, scope, period):
        if scope == "current":
            where, args = "substr(j.journal_date,1,7)=?", (period,)
        elif scope == "through":
            where, args = "substr(j.journal_date,1,7)<=?", (period,)
        elif scope == "ytd":
            where, args = "substr(j.journal_date,1,7) BETWEEN ? AND ?", (period[:4] + "-01", period)
        else:
            where, args = "1=1", ()
        return [dict(r) for r in self.conn.execute(
            f"""SELECT j.subject_code,s.name AS subject_name,j.direction,
                 SUM(j.amount) AS amount,COUNT(*) AS cnt FROM journal j
                 LEFT JOIN subjects s ON s.code=j.subject_code
                 WHERE {where} GROUP BY j.subject_code,j.direction
                 ORDER BY j.direction,amount DESC""", args)]

    def budgets(self, year):
        return [dict(r) for r in self.conn.execute(
            """SELECT b.subject_code, s.name AS subject_name, SUM(b.amount) AS budget
               FROM budgets b LEFT JOIN subjects s ON s.code=b.subject_code
               WHERE b.period LIKE ? GROUP BY b.subject_code ORDER BY budget DESC""", (year + "%",))]

    def year_actuals(self, year):
        return [dict(r) for r in self.conn.execute(
            """SELECT l.subject_code, SUM(l.debit) AS actual FROM voucher_lines l
               JOIN vouchers v ON v.id=l.voucher_id AND v.status='posted' AND v.period LIKE ?
               GROUP BY l.subject_code""", (year + "%",))]

    def journal_month(self, period):
        return [dict(r) for r in self.conn.execute(
            """SELECT direction,SUM(amount) v FROM journal
               WHERE substr(journal_date,1,7)=? GROUP BY direction""", (period,))]

    def invoices(self):
        return [dict(r) for r in self.conn.execute(
            """SELECT i.*,c.name AS counterparty_name FROM invoices i
               LEFT JOIN counterparties c ON c.id=i.counterparty_id
               WHERE i.status IN ('未入账','已入账') ORDER BY i.invoice_date""")]

    # ---- 配置 / 规则 ----
    def setting(self, key, default=""):
        r = self.conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
        return r["value"] if r else default

    def set_setting(self, key, value):
        self.conn.execute("""INSERT INTO settings(key,value) VALUES(?,?)
                             ON CONFLICT(key) DO UPDATE SET value=excluded.value""", (key, value))

    def rules(self):
        raw = self.setting("analysis_rules", "")
        try:
            return json.loads(raw) if raw else {}
        except (ValueError, TypeError):
            return {}

    # ---- 报表（由组合根注入遗留实现，避免领域层 import server） ----
    def balance_sheet(self, period):
        return self._call("build_balance_sheet", period)

    def income(self, period):
        return self._call("build_income_statement", period)

    def articulation(self, period):
        return self._call("report_articulation", {"period": [period]})

    def cash_opening(self, period):
        return self._call("cash_opening_balance", period)

    def cashflow(self, period, scope):
        return self._call("report_cashflow", {"period": [period], "scope": [scope]})

    def _call(self, name, *args):
        fn = self._reports.get(name)
        if fn is None:
            raise RuntimeError(f"报表端口「{name}」未注入：请通过 app.bootstrap 装配组合根")
        if name in ("build_balance_sheet", "build_income_statement", "cash_opening_balance"):
            return fn(self.conn, *args)
        return fn(self.conn, None, None, *args)

    def company(self):
        return self.setting("company_name", "本公司")
