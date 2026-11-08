# -*- coding: utf-8 -*-
"""V2.14 高阶核算、财务模型与工作流闭环。

对应调研表 C 列子科目：把「执行流」里会计人员的具体动作做成可执行的计算与台账，
并把「工作流」里缺的闭环做成状态机。所有结果保留两位小数并留历史记录。
"""
import json
import math

from app.routing import route
from app.errors import ApiError
from .common import q, one, now, today, r2, setting, log, require

P = "/api/v28/advanced"


def _f(body, key, default=0.0):
    try:
        return float(body.get(key) if body.get(key) not in (None, "") else default)
    except (ValueError, TypeError):
        return default


def calc(path):
    """把纯计算函数包装成 API + 自动留痕（结果存 adv_models）"""
    def deco(fn):
        @route("POST", P + path)
        def handler(conn, m, body, qs):
            res = fn(conn, body)
            conn.execute("""INSERT INTO adv_models(name,kind,inputs_json,result_json,created_at)
                VALUES(?,?,?,?,?)""", (fn.__doc__ or fn.__name__, fn.__name__,
                json.dumps(body, ensure_ascii=False)[:1000], json.dumps(res, ensure_ascii=False)[:2000], now()))
            conn.commit()
            return {"ok": True, "模型": fn.__doc__ or fn.__name__, **res}
        handler.__name__ = fn.__name__
        return handler
    return deco


# ==================== A. 高阶核算（执行流） ====================
@route("GET", P + r"/assets")
def assets(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM adv_assets ORDER BY kind,code")}


@route("POST", P + r"/assets")
def asset_add(conn, m, body, qs):
    kind, code, name = body.get("kind") or "", body.get("code") or "", body.get("name") or ""
    require(kind and code and name, "类别/编码/名称不能为空")
    conn.execute("""INSERT INTO adv_assets(kind,code,name,cost,start_period,life_months,residual,
        fair_value,method,status,note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(kind,code) DO UPDATE SET cost=excluded.cost,fair_value=excluded.fair_value,
        method=excluded.method,note=excluded.note""",
        (kind, code, name, r2(body.get("cost")), body.get("start_period") or today()[:7],
         int(_f(body, "life_months")), r2(body.get("residual")), body.get("fair_value"),
         body.get("method") or "成本模式", "在用", body.get("note") or "", now()))
    return {"ok": True, "kind": kind, "code": code}


@route("POST", P + r"/inventory/move")
def inventory_move(conn, m, body, qs):
    direction = body.get("direction") or "入"
    require(direction in ("入", "出"), "方向只能是 入 / 出")
    qty, price = _f(body, "qty"), _f(body, "unit_cost")
    require(qty > 0 and price > 0, "数量与单价须大于 0")
    conn.execute("""INSERT INTO adv_inventory_moves(period,item_code,direction,qty,unit_cost,created_at)
        VALUES(?,?,?,?,?,?)""", (body.get("period") or today()[:7], body.get("item_code") or "",
        direction, qty, price, now()))
    return {"ok": True, "direction": direction, "qty": qty, "unit_cost": price}


@route("GET", P + r"/inventory/valuation")
def inventory_valuation(conn, m, body, qs):
    """存货计价：先进先出 / 移动加权平均"""
    code = (qs.get("item_code") or [""])[0]
    method = (qs.get("method") or [setting(conn, "adv_inventory_method", "FIFO")])[0]
    rows = q(conn, "SELECT * FROM adv_inventory_moves " + ("WHERE item_code=? " if code else "") +
             "ORDER BY id", (code,) if code else ())
    stock, cost_pool, issued, remain_qty, remain_cost = [], 0.0, 0.0, 0.0, 0.0
    for r in rows:
        if r["direction"] == "入":
            stock.append([float(r["qty"]), float(r["unit_cost"])])
            cost_pool += float(r["qty"]) * float(r["unit_cost"])
            remain_qty += float(r["qty"])
        else:
            need, qty = float(r["qty"]), float(r["qty"])
            if method.upper() == "FIFO":
                while need > 0 and stock:
                    take = min(need, stock[0][0])
                    issued += take * stock[0][1]
                    cost_pool -= take * stock[0][1]
                    stock[0][0] -= take
                    need -= take
                    if stock[0][0] <= 0:
                        stock.pop(0)
            else:
                avg = cost_pool / remain_qty if remain_qty else 0
                issued += qty * avg
                cost_pool -= qty * avg
            remain_qty -= qty
    remain_cost = r2(cost_pool)
    return {"计价方法": "先进先出" if method.upper() == "FIFO" else "移动加权平均",
            "累计发出成本": r2(issued), "期末结存数量": r2(remain_qty), "期末结存成本": remain_cost,
            "分录建议": "借：主营业务成本 / 贷：库存商品"}


@calc("/inventory/writedown")
def inventory_writedown(conn, b):
    """存货跌价准备（成本与可变现净值孰低）"""
    cost, nrv = _f(b, "cost"), _f(b, "nrv")
    loss = r2(max(0.0, cost - nrv))
    return {"账面成本": r2(cost), "可变现净值": r2(nrv), "应计提跌价准备": loss,
            "分录": "借：资产减值损失 / 贷：存货跌价准备" if loss else "无需计提"}


@calc("/intangible/amortization")
def intangible_amortization(conn, b):
    """无形资产摊销（直线法）"""
    cost, life, residual = _f(b, "cost"), int(_f(b, "life_months", 60)), _f(b, "residual")
    require(life > 0, "摊销月份须大于 0")
    monthly = r2((cost - residual) / life)
    return {"原值": r2(cost), "残值": r2(residual), "摊销月数": life, "每月摊销": monthly,
            "年摊销": r2(monthly * 12), "分录": "借：管理费用—无形资产摊销 / 贷：累计摊销"}


@calc("/investment-property")
def investment_property(conn, b):
    """投资性房地产：成本模式折旧 / 公允模式变动"""
    cost, fair, life = _f(b, "cost"), _f(b, "fair_value"), int(_f(b, "life_months", 240))
    method = b.get("method") or "成本模式"
    if method == "公允模式":
        return {"计量模式": method, "公允价值": r2(fair), "账面成本": r2(cost),
                "公允价值变动损益": r2(fair - cost), "是否计提折旧": "否"}
    dep = r2(cost / life) if life else 0
    return {"计量模式": method, "每月折旧": dep, "年折旧": r2(dep * 12),
            "分录": "借：其他业务成本 / 贷：投资性房地产累计折旧"}


@calc("/equity-method")
def equity_method(conn, b):
    """长期股权投资：成本法 / 权益法"""
    cost, share, profit, dividend = _f(b, "cost"), _f(b, "share", 0.3), _f(b, "profit"), _f(b, "dividend")
    end = r2(cost + profit * share - dividend * share)
    return {"初始成本": r2(cost), "持股比例": f"{share * 100:.2f}%", "被投资方净利润": r2(profit),
            "确认投资收益": r2(profit * share), "宣告现金股利": r2(dividend),
            "期末长投账面价值": end,
            "分录": "借：长期股权投资—损益调整 / 贷：投资收益"}


@calc("/financial-asset")
def financial_asset(conn, b):
    """金融资产三分类与实际利率利息"""
    principal, rate, periods = _f(b, "principal"), _f(b, "rate", 0.05), int(_f(b, "periods", 3))
    cls = b.get("category") or "摊余成本"
    total = r2(principal * (1 + rate) ** periods)
    return {"分类": cls, "本金": r2(principal), "实际利率": f"{rate * 100:.2f}%",
            "期数": periods, "到期本息": total, "累计利息": r2(total - principal),
            "后续计量": "摊余成本法" if cls == "摊余成本" else "公允价值，变动计入当期损益或其他综合收益"}


@calc("/borrowing-cost")
def borrowing_cost(conn, b):
    """借款费用资本化（累计支出加权平均 × 资本化率）"""
    spending, rate, months = _f(b, "spending"), _f(b, "rate", 0.06), _f(b, "months", 12)
    cap = r2(spending * rate * months / 12)
    return {"累计支出加权平均数": r2(spending), "资本化率": f"{rate * 100:.2f}%",
            "资本化期间(月)": months, "应予资本化利息": cap, "费用化金额": 0,
            "分录": "借：在建工程 / 贷：应付利息"}


@calc("/government-grant")
def government_grant(conn, b):
    """政府补助：总额法递延收益分摊 / 净额法"""
    amount, months = _f(b, "amount"), int(_f(b, "months", 36))
    method = b.get("method") or "总额法"
    monthly = r2(amount / months) if months else 0
    return {"补助总额": r2(amount), "方法": method, "分摊月数": months,
            "每月计入其他收益": monthly if method == "总额法" else 0,
            "净额法冲减资产账面价值": r2(amount) if method == "净额法" else 0}


@calc("/payroll-accrual")
def payroll_accrual(conn, b):
    """应付职工薪酬计提与按部门分配"""
    gross = _f(b, "gross")
    alloc = {"管理部门": 0.4, "销售部门": 0.35, "生产部门": 0.25}
    return {"应发合计": r2(gross), "分配": {k: r2(gross * v) for k, v in alloc.items()},
            "工会经费2%": r2(gross * 0.02), "职工教育经费8%": r2(gross * 0.08),
            "分录": "借：管理费用/销售费用/生产成本—职工薪酬 / 贷：应付职工薪酬"}


@calc("/deferred-tax")
def deferred_tax(conn, b):
    """递延所得税：暂时性差异 × 税率"""
    rate = _f(b, "rate", 0.25)
    deductible, taxable = _f(b, "deductible"), _f(b, "taxable")
    return {"税率": f"{rate * 100:.2f}%", "可抵扣暂时性差异": r2(deductible),
            "应纳税暂时性差异": r2(taxable), "递延所得税资产": r2(deductible * rate),
            "递延所得税负债": r2(taxable * rate),
            "分录": "借：递延所得税资产 / 贷：所得税费用；借：所得税费用 / 贷：递延所得税负债"}


@route("POST", P + r"/lease")
def lease_add(conn, m, body, qs):
    name, months, payment, rate = (body.get("name") or ""), int(_f(body, "months", 36)), _f(body, "payment"), _f(body, "rate", 0.05)
    require(name and months > 0 and payment > 0, "名称、期数、每期付款额须有效")
    cur = conn.execute("""INSERT INTO adv_leases(name,start_period,months,payment,rate,created_at)
        VALUES(?,?,?,?,?,?)""", (name, body.get("start_period") or today()[:7], months, payment, rate, now()))
    return {"ok": True, "id": cur.lastrowid, "计算": lease_calc(conn, None, {"lease_id": cur.lastrowid}, {})}


@route("POST", P + r"/lease/calc")
def lease_calc(conn, m, body, qs):
    """租赁：使用权资产与租赁负债（年金现值）"""
    b = body
    if b.get("lease_id"):
        r = one(conn, "SELECT * FROM adv_leases WHERE id=?", (b["lease_id"],))
        require(r, "租赁合同不存在")
        months, payment, rate = r["months"], r["payment"], r["rate"] / 12
    else:
        months, payment, rate = int(_f(b, "months", 36)), _f(b, "payment"), _f(b, "annual_rate", 0.05) / 12
    require(months > 0 and payment > 0, "期数与付款额须大于 0")
    pv = r2(payment * ((1 - (1 + rate) ** (-months)) / rate)) if rate else r2(payment * months)
    return {"租赁期(月)": months, "每期付款": r2(payment),
            "使用权资产初始成本": pv, "租赁负债初始金额": pv,
            "首月折旧": r2(pv / months), "首月利息": r2(pv * rate),
            "分录": "借：使用权资产 / 贷：租赁负债—未确认融资费用"}


@calc("/revenue-five-step")
def revenue_five_step(conn, b):
    """收入五步法确认判定"""
    steps = ["识别与客户订立的合同", "识别合同中的单项履约义务", "确定交易价格",
             "将交易价格分摊至各单项履约义务", "履行各单项履约义务时确认收入"]
    timing = b.get("timing") or "时点"
    return {"五步法": steps, "确认时点": "某一时段" if timing == "时段" else "某一时点",
            "合同金额": r2(_f(b, "amount")), "已履约比例": f"{_f(b, 'progress') * 100:.2f}%",
            "本期应确认收入": r2(_f(b, "amount") * _f(b, "progress", 1)),
            "分录": "借：合同资产/应收账款 / 贷：主营业务收入、应交税费—待转销项税额"}


@calc("/correction")
def correction(conn, b):
    """前期差错更正 / 日后调整事项 / 政策变更"""
    kind = b.get("kind") or "前期差错更正"
    amount = r2(_f(b, "amount"))
    conn.execute("""INSERT INTO adv_adjustments(kind,period,summary,amount,subject_code,created_at)
        VALUES(?,?,?,?,?,?)""", (kind, b.get("period") or today()[:7], b.get("summary") or kind,
        amount, b.get("subject_code") or "", now()))
    return {"调整类型": kind, "调整金额": amount,
            "处理方法": "追溯重述（重要差错）/ 未来适用（政策变更）" if kind != "资产负债表日后事项"
                        else "调整报告年度报表相关项目",
            "分录方向": b.get("summary") or "按原错误分录相反方向冲回"}


@route("GET", P + r"/adjustments")
def adjustments(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM adv_adjustments ORDER BY id DESC LIMIT 200")}


# ==================== B. 财务管理模型（价值流） ====================
@calc("/model/tvm")
def tvm(conn, b):
    """货币时间价值：现值/终值/年金"""
    pv, rate, n = _f(b, "pv"), _f(b, "rate", 0.08), int(_f(b, "periods", 5))
    fv = r2(pv * (1 + rate) ** n)
    annuity = r2(pv * rate / (1 - (1 + rate) ** (-n))) if rate else r2(pv / n)
    return {"现值": r2(pv), "利率": f"{rate * 100:.2f}%", "期数": n, "终值": fv,
            "年金（每期等额）": annuity, "复利利息": r2(fv - pv)}


@calc("/model/wacc")
def wacc(conn, b):
    """加权平均资本成本 WACC"""
    e, d, re, rd, tax = _f(b, "equity"), _f(b, "debt"), _f(b, "cost_equity", 0.12), _f(b, "cost_debt", 0.06), _f(b, "tax_rate", 0.25)
    v = e + d
    require(v > 0, "权益与债务合计须大于 0")
    result = (e / v) * re + (d / v) * rd * (1 - tax)
    return {"权益": r2(e), "债务": r2(d), "权益成本": f"{re * 100:.2f}%", "债务成本": f"{rd * 100:.2f}%",
            "所得税率": f"{tax * 100:.2f}%", "WACC": f"{result * 100:.2f}%",
            "资本结构": f"资产负债率 {d / v * 100:.2f}%"}


@calc("/model/leverage")
def leverage(conn, b):
    """经营杠杆 / 财务杠杆 / 总杠杆"""
    sales, vc, fc, interest = _f(b, "sales"), _f(b, "variable_cost"), _f(b, "fixed_cost"), _f(b, "interest")
    cm, ebit = sales - vc, sales - vc - fc
    dol = cm / ebit if ebit else None
    dfl = ebit / (ebit - interest) if (ebit - interest) else None
    return {"边际贡献": r2(cm), "息税前利润": r2(ebit),
            "经营杠杆DOL": round(dol, 2) if dol else None,
            "财务杠杆DFL": round(dfl, 2) if dfl else None,
            "总杠杆DTL": round(dol * dfl, 2) if dol and dfl else None}


@calc("/model/npv")
def npv(conn, b):
    """净现值 NPV 与现值指数"""
    flows = [float(x) for x in (b.get("cashflows") or [])]
    rate = _f(b, "rate", 0.10)
    require(flows, "请提供各期现金流（首期为初始投资，通常负数）")
    value = sum(cf / (1 + rate) ** i for i, cf in enumerate(flows))
    return {"各期现金流": flows, "折现率": f"{rate * 100:.2f}%", "净现值NPV": r2(value),
            "现值指数PI": round(sum(cf / (1 + rate) ** i for i, cf in enumerate(flows) if i > 0) / abs(flows[0]), 4) if flows[0] else None,
            "结论": "可行（NPV>0）" if value > 0 else "不可行（NPV≤0）"}


@calc("/model/irr")
def irr(conn, b):
    """内含报酬率 IRR（二分法）"""
    flows = [float(x) for x in (b.get("cashflows") or [])]
    require(flows and flows[0] < 0, "首期须为负的初始投资")
    def f(r):
        return sum(cf / (1 + r) ** i for i, cf in enumerate(flows))
    lo, hi = -0.9, 10.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if f(mid) > 0:
            lo = mid
        else:
            hi = mid
    return {"各期现金流": flows, "内含报酬率IRR": f"{(lo + hi) / 2 * 100:.2f}%",
            "结论": "IRR 高于资本成本则项目可行（请与 WACC 比较）"}


@calc("/model/cvp")
def cvp(conn, b):
    """本量利分析：盈亏临界点与安全边际"""
    price, vc, fc, sales_qty = _f(b, "price"), _f(b, "unit_variable"), _f(b, "fixed_cost"), _f(b, "sales_qty")
    cm = price - vc
    require(cm > 0, "单位边际贡献须大于 0")
    be_qty, be_sales = fc / cm, fc / cm * price
    return {"单位边际贡献": r2(cm), "边际贡献率": f"{cm / price * 100:.2f}%",
            "盈亏临界销量": r2(be_qty), "盈亏临界销售额": r2(be_sales),
            "安全边际量": r2(sales_qty - be_qty), "安全边际率": f"{(sales_qty - be_qty) / sales_qty * 100:.2f}%" if sales_qty else None}


@calc("/model/variance")
def variance(conn, b):
    """标准成本差异分析（价格/数量/效率）"""
    ap, sp, aq, sq = _f(b, "actual_price"), _f(b, "standard_price"), _f(b, "actual_qty"), _f(b, "standard_qty")
    price_var, qty_var = r2((ap - sp) * aq), r2((aq - sq) * sp)
    return {"价格差异": price_var, "数量/效率差异": qty_var, "总差异": r2(price_var + qty_var),
            "评价": "有利差异" if price_var + qty_var <= 0 else "不利差异，需查明原因"}


@calc("/model/abc")
def abc(conn, b):
    """作业成本法 ABC：按成本动因分配制造费用"""
    pools = b.get("pools") or []
    require(pools, "请提供作业成本池 [{名称,金额,动因量}]")
    total = sum(_f(x, "amount") for x in pools)
    out = []
    for x in pools:
        driver = _f(x, "driver", 1) or 1
        out.append({"作业": x.get("name") or "作业", "成本": r2(_f(x, "amount")),
                    "动因量": driver, "单位动因成本": r2(_f(x, "amount") / driver),
                    "分配率": f"{_f(x, 'amount') / total * 100:.2f}%" if total else "0.00%"})
    return {"items": out, "制造费用合计": r2(total),
            "产品分摊示例": r2(total * _f(b, "product_driver_share", 0.3))}


@calc("/model/dupont")
def dupont(conn, b):
    """杜邦分析：ROE = 净利率 × 总资产周转率 × 权益乘数"""
    profit, rev, assets, equity = _f(b, "net_profit"), _f(b, "revenue"), _f(b, "assets"), _f(b, "equity")
    require(rev and assets and equity, "收入/资产/权益须大于 0")
    nm, at, em = profit / rev, rev / assets, assets / equity
    return {"销售净利率": f"{nm * 100:.2f}%", "总资产周转率": round(at, 4),
            "权益乘数": round(em, 4), "净资产收益率ROE": f"{nm * at * em * 100:.2f}%",
            "驱动分解": "ROE = 净利率 × 周转率 × 权益乘数（盈利能力 × 营运效率 × 杠杆）"}


@calc("/model/eva")
def eva(conn, b):
    """经济增加值 EVA = NOPAT − 资本 × WACC"""
    nopat, capital, w = _f(b, "nopat"), _f(b, "capital"), _f(b, "wacc", 0.10)
    value = r2(nopat - capital * w)
    return {"税后净营业利润": r2(nopat), "投入资本": r2(capital), "WACC": f"{w * 100:.2f}%",
            "资本成本": r2(capital * w), "EVA": value,
            "结论": "创造价值" if value > 0 else "未创造价值"}


@calc("/model/black-scholes")
def black_scholes(conn, b):
    """期权定价 Black-Scholes（欧式看涨）"""
    S, K, T, r, sigma = _f(b, "spot"), _f(b, "strike"), _f(b, "years", 1), _f(b, "risk_free", 0.025), _f(b, "volatility", 0.2)
    if S <= 0 or K <= 0 or T <= 0 or sigma <= 0:
        raise ApiError("现价/行权价/期限/波动率须大于 0")
    d1 = (math.log(S / K) + (r + sigma ** 2 / 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    N = lambda x: 0.5 * (1 + math.erf(x / math.sqrt(2)))
    call = S * N(d1) - K * math.exp(-r * T) * N(d2)
    put = K * math.exp(-r * T) * N(-d2) - S * N(-d1)
    return {"标的现价": r2(S), "行权价": r2(K), "期限(年)": T, "无风险利率": f"{r * 100:.2f}%",
            "波动率": f"{sigma * 100:.2f}%", "看涨期权价值": r2(call), "看跌期权价值": r2(put)}


@route("GET", P + r"/models")
def models(conn, m, body, qs):
    rows = q(conn, "SELECT id,name,kind,inputs_json,result_json,created_at FROM adv_models ORDER BY id DESC LIMIT 100")
    return {"items": rows, "总数": one(conn, "SELECT COUNT(*) n FROM adv_models")["n"]}


# ==================== C. 工作流闭环（工作流） ====================
WF_TEMPLATES = {
    "全面预算": ["预算编制", "预算下达", "执行监控", "差异分析", "调整与考核"],
    "投融资项目": ["立项", "方案测算", "评审审批", "落地执行", "效果复盘"],
    "内控风险": ["风险识别", "风险评估", "控制设计", "整改执行", "监督复核"],
    "税务稽查": ["稽查通知", "资料准备", "自查测算", "应对沟通", "结论归档"],
}


@route("GET", P + r"/workflow/templates")
def wf_templates(conn, m, body, qs):
    return {"items": [{"名称": k, "步骤": v} for k, v in WF_TEMPLATES.items()]}


@route("POST", P + r"/workflow")
def wf_create(conn, m, body, qs):
    kind = body.get("kind") or ""
    require(kind in WF_TEMPLATES, "流程类型须为：" + "、".join(WF_TEMPLATES))
    title = body.get("title") or kind
    cur = conn.execute("""INSERT INTO adv_workflows(kind,title,amount,owner,due_date,stage,status,note,created_at)
        VALUES(?,?,?,?,?,0,'进行中',?,?)""", (kind, title, r2(body.get("amount")),
        body.get("owner") or "", body.get("due_date") or "", body.get("note") or "", now()))
    for i, name in enumerate(WF_TEMPLATES[kind]):
        conn.execute("INSERT INTO adv_workflow_steps(wf_id,seq,name) VALUES(?,?,?)", (cur.lastrowid, i, name))
    return {"ok": True, "id": cur.lastrowid, "步骤数": len(WF_TEMPLATES[kind]),
            "当前步骤": WF_TEMPLATES[kind][0]}


@route("GET", P + r"/workflows")
def wf_list(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM adv_workflows ORDER BY id DESC LIMIT 100")
    for r in rows:
        steps = q(conn, "SELECT * FROM adv_workflow_steps WHERE wf_id=? ORDER BY seq", (r["id"],))
        r["steps"] = steps
        r["当前步骤"] = next((s["name"] for s in steps if s["status"] == "待办"), "已完成")
        r["进度"] = f"{sum(1 for s in steps if s['status'] == '已完成')}/{len(steps)}"
    return {"items": rows}


@route("POST", P + r"/workflow/step")
def wf_step(conn, m, body, qs):
    wid = int(body.get("workflow_id") or 0)
    w = one(conn, "SELECT * FROM adv_workflows WHERE id=?", (wid,))
    require(w, "流程实例不存在")
    step = one(conn, "SELECT * FROM adv_workflow_steps WHERE wf_id=? AND seq=?", (wid, w["stage"]))
    require(step, "流程已全部完成")
    conn.execute("UPDATE adv_workflow_steps SET status='已完成',done_at=? WHERE id=?", (today(), step["id"]))
    new_stage = w["stage"] + 1
    done = new_stage >= len(WF_TEMPLATES[w["kind"]])
    conn.execute("UPDATE adv_workflows SET stage=?,status=? WHERE id=?",
                 (new_stage, "已完成" if done else "进行中", wid))
    nxt = None if done else WF_TEMPLATES[w["kind"]][new_stage]
    log(conn, "推进工作流", "adv_workflow", wid, f"{step['name']} 完成", body.get("actor") or "会计")
    return {"ok": True, "完成步骤": step["name"], "下一步": nxt, "流程状态": "已完成" if done else "进行中"}


@route("GET", P + r"/workflow/overview")
def wf_overview(conn, m, body, qs):
    rows = q(conn, "SELECT kind,status,COUNT(*) n FROM adv_workflows GROUP BY kind,status")
    return {"items": rows, "进行中": sum(r["n"] for r in rows if r["status"] == "进行中"),
            "已完成": sum(r["n"] for r in rows if r["status"] == "已完成"),
            "闭环类型": len(WF_TEMPLATES)}


@route("GET", P + r"/dashboard")
def adv_dashboard(conn, m, body, qs):
    return {"资产台账": one(conn, "SELECT COUNT(*) n FROM adv_assets")["n"],
            "模型测算次数": one(conn, "SELECT COUNT(*) n FROM adv_models")["n"],
            "调整事项": one(conn, "SELECT COUNT(*) n FROM adv_adjustments")["n"],
            "工作流实例": one(conn, "SELECT COUNT(*) n FROM adv_workflows")["n"],
            "核算功能": 14, "财务模型": 11, "工作流闭环": len(WF_TEMPLATES)}
