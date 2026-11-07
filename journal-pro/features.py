# -*- coding: utf-8 -*-
"""V2.5 扩展功能模块（控制器层）。

通过 `app.routing.route` 把接口注册到组合根持有的 Router 实例；遗留能力经
`app.facade` 防腐层惰性获取。本模块对主程序模块零依赖，组合根负责装配与加载顺序。

功能清单（14 项）：
  1 常用凭证模板   2 凭证打印/连续套打   3 凭证号连续性体检  4 全局搜索
  5 现金流量表正表 6 财务比率分析        7 同比环比趋势       8 年度结转
  9 银行对账单批量导入  10 坏账准备计提   11 会计科目模板套用  12 我的待办中心
 13 报表快照归档   14 往来催收清单
"""
import csv
import io
import json
import re
from datetime import datetime

from app.routing import route
from app.errors import ApiError
from app import facade as _facade
from core.rules import ImpactGraph as _Impact
from office import make_xlsx


def _bind(name):
    """防腐层惰性绑定：调用时才解析到组合根注入的实现。

    模块级 `__getattr__`(PEP 562) 不作用于函数体里的全局名查找，因此这里显式
    生成转发函数。好处是控制器对主程序模块零依赖，且测试可替换容器里的实现。
    """
    def call(*args, **kwargs):
        return getattr(_facade, name)(*args, **kwargs)
    call.__name__ = name
    return call


for _name in ("q", "one", "log", "setting", "now", "ensure_period", "assert_open",
              "create_voucher", "file_result", "subject_closing", "build_balance_sheet",
              "build_income_statement", "report_aging", "report_articulation",
              "report_cashflow", "cash_opening_balance", "default_bank_id"):
    globals()[_name] = _bind(_name)


# ---------------- 通用工具 ----------------
def jload(s, default=None):
    try:
        return json.loads(s)
    except Exception:
        return (default if default is not None else {})


def period_arg(qs):
    return (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]


def shift_month(p, n):
    y, mo = int(p[:4]), int(p[5:7])
    t = y * 12 + mo - 1 + n
    return f"{t // 12:04d}-{t % 12 + 1:02d}"


def r2(x):
    return round(float(x or 0), 2)


def rmb_upper(n):
    """人民币金额大写（凭证套打用）"""
    n = round(abs(float(n or 0)), 2)
    units, big, digits = ["", "拾", "佰", "仟"], ["", "万", "亿", "万亿"], "零壹贰叁肆伍陆柒捌玖"

    def four(num):
        s = ""
        for i, ch in enumerate(str(num).zfill(4)):
            d = int(ch)
            if d:
                s += digits[d] + units[3 - i]
            elif s and not s.endswith("零"):
                s += "零"
        return s.rstrip("零")

    integer, groups = int(n), []
    while integer > 0:
        groups.append(integer % 10000)
        integer //= 10000
    parts = []
    for i in range(len(groups) - 1, -1, -1):
        if groups[i]:
            parts.append(four(groups[i]) + big[i])
        elif parts and not parts[-1].endswith("零"):
            parts.append("零")
    s = ("".join(parts).strip("零") or "零") + "元"
    frac = int(round((n - int(n)) * 100))
    if frac == 0:
        return s + "整"
    jiao, fen = divmod(frac, 10)
    if jiao:
        s += digits[jiao] + "角"
    if fen:
        s += digits[fen] + "分"
    return s


# ---------------- 1. 常用凭证模板 ----------------
@route("GET", r"/api/voucher-templates")
def tpl_list(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM voucher_templates ORDER BY use_count DESC,id DESC")
    for r in rows:
        r["lines"] = jload(r.pop("lines_json"), [])
        r["debit_total"] = r2(sum(x.get("debit") or 0 for x in r["lines"]))
    return {"items": rows}


def _check_lines(conn, lines):
    if len(lines) < 2:
        raise ApiError("至少需要两条分录")
    dr = sum(float(x.get("debit") or 0) for x in lines)
    cr = sum(float(x.get("credit") or 0) for x in lines)
    if round(dr, 2) != round(cr, 2) or dr <= 0:
        raise ApiError(f"借贷不平衡：借方 {dr:.2f} / 贷方 {cr:.2f}")
    for x in lines:
        code = x.get("subject_code")
        if not code or not one(conn, "SELECT code FROM subjects WHERE code=?", (code,)):
            raise ApiError(f"科目「{code or '空'}」不存在")


@route("POST", r"/api/voucher-templates")
def tpl_save(conn, m, body, qs):
    name = (body.get("name") or "").strip()
    lines = body.get("lines") or []
    if not name:
        raise ApiError("模板名称不能为空")
    _check_lines(conn, lines)
    if one(conn, "SELECT id FROM voucher_templates WHERE name=?", (name,)):
        raise ApiError("同名模板已存在，请换一个名称")
    clean = [{"subject_code": x["subject_code"], "summary": x.get("summary") or "",
              "debit": r2(x.get("debit")), "credit": r2(x.get("credit")),
              "project_id": x.get("project_id"), "counterparty_id": x.get("counterparty_id")}
             for x in lines]
    cur = conn.execute("""INSERT INTO voucher_templates(name,summary,voucher_type,lines_json,
                          created_by,created_at) VALUES(?,?,?,?,?,?)""",
                       (name, body.get("summary") or "", body.get("voucher_type") or "转",
                        json.dumps(clean, ensure_ascii=False), body.get("actor") or "系统", now()))
    log(conn, "新增凭证模板", "template", cur.lastrowid, name, body.get("actor") or "系统")
    return {"ok": True, "id": cur.lastrowid, "name": name}


@route("DELETE", r"/api/voucher-templates/(\d+)")
def tpl_del(conn, m, body, qs):
    tid = m.group(1)
    if not one(conn, "SELECT id FROM voucher_templates WHERE id=?", (tid,)):
        raise ApiError("模板不存在", 404)
    conn.execute("DELETE FROM voucher_templates WHERE id=?", (tid,))
    log(conn, "删除凭证模板", "template", tid, "已删除", body.get("actor") or "系统")
    return {"ok": True}


@route("POST", r"/api/voucher-templates/(\d+)/use")
def tpl_use(conn, m, body, qs):
    t = one(conn, "SELECT * FROM voucher_templates WHERE id=?", (m.group(1),))
    if not t:
        raise ApiError("模板不存在", 404)
    lines = body.get("lines") or jload(t["lines_json"], [])
    _check_lines(conn, lines)
    actor = body.get("actor") or "系统"
    vid = create_voucher(conn, {
        "voucher_date": body.get("voucher_date") or datetime.now().strftime("%Y-%m-%d"),
        "summary": body.get("summary") or t["summary"] or t["name"],
        "voucher_type": t["voucher_type"], "lines": lines}, actor=actor, auto_post=False)
    no = one(conn, "SELECT voucher_no FROM vouchers WHERE id=?", (vid,))["voucher_no"]
    conn.execute("UPDATE voucher_templates SET use_count=use_count+1 WHERE id=?", (t["id"],))
    log(conn, "套用凭证模板", "voucher", vid, f"{t['name']} → {no}", actor)
    return {"ok": True, "voucher_id": vid, "voucher_no": no, "template": t["name"],
            "hint": "已生成草稿凭证，请在「凭证管理」核对金额后审核过账",
            "impacts": _Impact.impact("voucher.create")}


# ---------------- 2. 凭证打印 / 连续套打 ----------------
@route("GET", r"/api/vouchers/print")
def voucher_print(conn, m, body, qs):
    ids = [int(x) for x in re.findall(r"\d+", (qs.get("ids") or [""])[0])][:50]
    if not ids:
        ids = [r["id"] for r in q(conn, """SELECT id FROM vouchers WHERE status='posted'
                                          ORDER BY voucher_date DESC,id DESC LIMIT 10""")]
    if not ids:
        raise ApiError("没有可打印的凭证")
    ph = ",".join("?" * len(ids))
    vs = q(conn, f"SELECT * FROM vouchers WHERE id IN ({ph}) ORDER BY voucher_date,id", ids)
    lns = q(conn, f"""SELECT l.*,s.name AS subject_name FROM voucher_lines l
                      LEFT JOIN subjects s ON s.code=l.subject_code
                      WHERE l.voucher_id IN ({ph}) ORDER BY l.voucher_id,l.line_no""", ids)
    byid = {}
    for l in lns:
        byid.setdefault(l["voucher_id"], []).append(l)
    company = setting(conn, "company_name", "本公司")
    accountant = setting(conn, "accountant", "")
    cashier = setting(conn, "cashier", "")
    cards = []
    for v in vs:
        lines = byid.get(v["id"], [])
        dr = r2(sum(x["debit"] for x in lines))
        rows = "".join(
            f"<tr><td class='c'>{esc(x.get('summary') or v['summary'] or '')}</td>"
            f"<td>{esc(x['subject_name'] or x['subject_code'])}</td>"
            f"<td class='n'>{money(x['debit'])}</td><td class='n'>{money(x['credit'])}</td></tr>"
            for x in lines)
        for _ in range(max(0, 5 - len(lines))):
            rows += "<tr><td>&nbsp;</td><td></td><td class='n'></td><td class='n'></td></tr>"
        cards.append(f"""<section class='voucher'>
          <div class='co'>{esc(company)}</div><div class='ttl'>记 账 凭 证</div>
          <div class='meta'><span>日期：{esc(v['voucher_date'])}</span><span>凭证号：<b>{esc(v['voucher_no'])}</b></span>
            <span>字：{esc(v['voucher_type'])}</span><span>状态：{esc(v['status'])}</span></div>
          <table><thead><tr><th>摘要</th><th>会计科目</th><th class='n'>借方金额</th><th class='n'>贷方金额</th></tr></thead>
            <tbody>{rows}
            <tr class='sum'><td colspan='2'>合计：{esc(rmb_upper(dr))}</td>
              <td class='n'>{money(dr)}</td><td class='n'>{money(dr)}</td></tr></tbody></table>
          <div class='sign'><span>制单：{esc(v['maker'] or '')}</span><span>审核：{esc(v['approved_by'] or '')}</span>
            <span>记账：{esc(v['posted_by'] or '')}</span><span>出纳：{esc(cashier)}</span>
            <span>会计主管：{esc(accountant)}</span></div></section>""")
    html = f"""<!DOCTYPE html><html lang='zh-CN'><head><meta charset='utf-8'>
<title>凭证打印 · {esc(company)}</title><style>
@page {{ size: A4 landscape; margin: 12mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: "Microsoft YaHei","SimSun",sans-serif; color:#111; background:#f2f4f7; margin:0; padding:18px; }}
.toolbar {{ max-width:1100px; margin:0 auto 14px; padding:12px 16px; background:#fff; border:1px solid #dfe3e8;
  border-radius:8px; display:flex; gap:10px; align-items:center; }}
.toolbar b {{ font-size:15px; }} .toolbar span {{ color:#666; font-size:13px; flex:1; }}
button {{ padding:7px 16px; border:1px solid #2f6fd0; background:#2f6fd0; color:#fff; border-radius:5px; cursor:pointer; font-size:13px; }}
button.ghost {{ background:#fff; color:#2f6fd0; }}
.voucher {{ max-width:1100px; margin:0 auto 16px; background:#fff; border:1px solid #333; padding:22px 26px; break-after:page; }}
.co {{ text-align:center; font-size:17px; font-weight:700; letter-spacing:2px; }}
.ttl {{ text-align:center; font-size:22px; font-weight:700; margin:6px 0 14px; letter-spacing:6px; }}
.meta {{ display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; }}
table {{ width:100%; border-collapse:collapse; font-size:13px; }}
th,td {{ border:1px solid #444; padding:7px 9px; height:30px; }}
th {{ background:#f5f7fa; }} td.c {{ width:32%; }} td.n {{ text-align:right; width:16%; font-variant-numeric:tabular-nums; }}
tr.sum td {{ font-weight:700; background:#fafbfc; }}
.sign {{ display:flex; justify-content:space-between; margin-top:14px; font-size:12.5px; color:#333; }}
@media print {{ body {{ background:#fff; padding:0; }} .toolbar {{ display:none; }}
  .voucher {{ border:1px solid #000; margin:0; }} }}
</style></head><body>
<div class='toolbar'><b>凭证套打</b><span>共 {len(cards)} 张 · A4 横向 · 每张一页，可直接用 A5 凭证纸打印</span>
<button onclick='window.print()'>🖨 打印全部</button>
<button class='ghost' onclick='window.close()'>关闭</button></div>
{''.join(cards)}</body></html>"""
    return {"_inline": html, "_ctype": "text/html; charset=utf-8"}


def esc(s):
    return (str(s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;").replace("'", "&#39;"))


def money(n):
    try:
        return f"{float(n or 0):,.2f}" if float(n or 0) else ""
    except (TypeError, ValueError):
        return ""


# ---------------- 3. 凭证号连续性体检 ----------------
@route("GET", r"/api/vouchers/sequence-check")
def voucher_seq_check(conn, m, body, qs):
    rows = q(conn, """SELECT id,voucher_no,voucher_date,period,status,summary FROM vouchers
                      WHERE status!='void' ORDER BY period,voucher_no,id""")
    issues = []
    seen = {}
    for r in rows:
        seen.setdefault(r["voucher_no"], []).append(r)
    for no, g in seen.items():
        if len(g) > 1:
            issues.append({"level": "严重", "type": "凭证号重复", "period": g[0]["period"],
                           "detail": f"{no} 出现 {len(g)} 次（ID {', '.join(str(x['id']) for x in g)}）"})
    byp = {}
    for r in rows:
        byp.setdefault(r["period"], set()).add(r["voucher_no"])
    for p, nos in sorted(byp.items()):
        # 只检查系统标准凭证号 记-YYYYMM###，避免把外部导入的自定义编号误判断号
        seq = []
        for n in nos:
            mo = re.match(r"^记-\d{6}(\d{3})$", n)
            if mo:
                seq.append(int(mo.group(1)))
        seq = sorted(set(seq))
        if not seq:
            continue
        missing = [i for i in range(1, seq[-1] + 1) if i not in seq]
        if missing:
            issues.append({"level": "提示", "type": "凭证号断号", "period": p,
                           "detail": "缺 " + "、".join(f"{i:03d}" for i in missing[:15])
                                      + ("…" if len(missing) > 15 else "")})
    for r in rows:
        if (r["voucher_date"] or "")[:7] != r["period"]:
            issues.append({"level": "严重", "type": "日期与期间不符", "period": r["period"],
                           "detail": f"{r['voucher_no']} 日期 {r['voucher_date']} 不属于期间 {r['period']}"})
    bad = q(conn, """SELECT v.voucher_no,v.period,ROUND(SUM(l.debit),2) d,ROUND(SUM(l.credit),2) c
                     FROM vouchers v JOIN voucher_lines l ON l.voucher_id=v.id
                     WHERE v.status='posted' GROUP BY v.id
                     HAVING ABS(SUM(l.debit)-SUM(l.credit))>0.005""")
    for r in bad:
        issues.append({"level": "严重", "type": "已过账凭证借贷不平", "period": r["period"],
                       "detail": f"{r['voucher_no']} 借 {r['d']} / 贷 {r['c']}"})
    unposted = one(conn, "SELECT COUNT(*) n FROM vouchers WHERE status NOT IN ('posted','void')")["n"]
    noattach = one(conn, """SELECT COUNT(DISTINCT v.id) n FROM vouchers v
                            LEFT JOIN attachments a ON a.entity_type='voucher' AND a.entity_id=v.id
                            WHERE v.status='posted' AND a.id IS NULL""")["n"]
    return {"issues": issues, "summary": {
        "vouchers": len(rows), "periods": len(byp), "issues": len(issues),
        "serious": sum(1 for x in issues if x["level"] == "严重"),
        "unposted": unposted, "no_attachment": noattach}}


# ---------------- 4. 全局搜索 ----------------
@route("GET", r"/api/search")
def global_search(conn, m, body, qs):
    kw = (qs.get("q") or [""])[0].strip()
    if not kw:
        return {"q": "", "groups": [], "total": 0}
    like = "%" + kw + "%"
    groups = []

    def add(key, label, page, rows, fmt):
        items = [fmt(r) for r in rows]
        groups.append({"key": key, "label": label, "page": page, "count": len(items), "items": items})

    add("docs", "业务单据", "docs", q(conn, """SELECT * FROM docs WHERE doc_no LIKE ? OR reason LIKE ?
        OR applicant LIKE ? OR dept LIKE ? ORDER BY doc_date DESC LIMIT 20""", (like, like, like, like)),
        lambda r: {"id": r["id"], "title": r["doc_no"], "sub": f"{r['doc_type']} · {r['applicant'] or ''} · {r['reason'] or ''}",
                   "date": r["doc_date"], "amount": r["amount"]})
    add("vouchers", "记账凭证", "vouchers", q(conn, """SELECT * FROM vouchers WHERE voucher_no LIKE ?
        OR summary LIKE ? ORDER BY voucher_date DESC LIMIT 20""", (like, like)),
        lambda r: {"id": r["id"], "title": r["voucher_no"], "sub": f"{r['voucher_type']} · {r['summary'] or ''} · {r['status']}",
                   "date": r["voucher_date"], "amount": None})
    add("invoices", "发票", "invoices", q(conn, """SELECT i.*,c.name cp FROM invoices i
        LEFT JOIN counterparties c ON c.id=i.counterparty_id
        WHERE i.invoice_no LIKE ? OR i.note LIKE ? OR c.name LIKE ? ORDER BY i.invoice_date DESC LIMIT 20""",
        (like, like, like)),
        lambda r: {"id": r["id"], "title": r["invoice_no"], "sub": f"{r['kind']} · {r['cp'] or ''} · {r['status']}",
                   "date": r["invoice_date"], "amount": r["total_amount"]})
    add("journal", "日记账流水", "journal", q(conn, """SELECT * FROM journal WHERE summary LIKE ?
        ORDER BY journal_date DESC LIMIT 20""", (like,)),
        lambda r: {"id": r["id"], "title": r["summary"] or f"流水 #{r['id']}",
                   "sub": f"{r['account_kind']} · {r['direction']} · {r['recon_status']}",
                   "date": r["journal_date"], "amount": r["amount"]})
    add("assets", "固定资产", "assets", q(conn, """SELECT * FROM assets WHERE asset_no LIKE ?
        OR name LIKE ? OR category LIKE ? ORDER BY purchase_date DESC LIMIT 20""", (like, like, like)),
        lambda r: {"id": r["id"], "title": r["asset_no"], "sub": f"{r['name']} · {r['category']} · {r['status']}",
                   "date": r["purchase_date"], "amount": r["original_value"]})
    add("counterparties", "往来单位", "base", q(conn, """SELECT * FROM counterparties
        WHERE name LIKE ? ORDER BY id LIMIT 20""", (like,)),
        lambda r: {"id": r["id"], "title": r["name"], "sub": f"{r['kind']} · 往来单位", "date": "", "amount": None})
    return {"q": kw, "groups": [g for g in groups if g["count"]],
            "total": sum(g["count"] for g in groups)}


# ---------------- 5. 现金流量表正表 ----------------
# ---------------- 5~7. 分析类接口：统一委托 core 内核 ----------------
# V2.5 曾在这里各写一套 SQL 与阈值，导致口径漂移（审计发现流动比率误把
# 长期借款计入流动负债、现金比率与流动比率算出同一个数、账龄基准日写死）。
# 现在全部从 AccountingContext + RuleEngine 取数，改规则即时全站生效。
from core import AccountingContext as _Ctx, RuleEngine as _Rules, analyze as _analyze  # noqa: E402
from core.analytics import (cashflow_categories as _cashflow, ratios_of as _ratios,
                            aging_of as _aging)  # noqa: E402

CF_LABEL = {"经营活动": "一、经营活动产生的现金流量", "投资活动": "二、投资活动产生的现金流量",
            "筹资活动": "三、筹资活动产生的现金流量", "未分类": "四、未分类现金流量（待配置规则）"}


def _ctx(conn, period):
    return _Ctx(conn, period, _Rules(conn))


@route("GET", r"/api/reports/cashflow-statement")
def cashflow_statement(conn, m, body, qs):
    period = period_arg(qs)
    ctx = _ctx(conn, period)
    cur, cum = _cashflow(ctx, "current"), _cashflow(ctx, "through")
    cash_begin = cash_opening_balance(conn, period)
    cash_end = r2(build_balance_sheet(conn, period)["assets"][0]["amount"])
    for c in cur["categories"] + cum["categories"]:
        c["label"] = CF_LABEL.get(c["category"], c["label"])
    return {"period": period, "current": cur, "cumulative": cum,
            "cash_begin": cash_begin, "cash_end": cash_end,
            "delta": r2(cash_end - cash_begin),
            "check": abs(cum["net"] - (cash_end - cash_begin)) < 0.005,
            "unmapped": cum.get("unmapped", []),
            "rules": ctx.rules.get("cashflow"),
            "note": "累计列口径为「自建账起至所选期间」，与勾稽③一致；分类前缀可在「分析规则」中自定义，未命中科目单列不并入经营"}


# ---------------- 6. 财务比率分析 ----------------
RATIO_EXPLAIN = {
    "流动比率": "按科目前缀划分流动/非流动，长期借款 2501 不计入分母；分母为 0 时不适用",
    "速动比率": "从流动资产剔除存货类科目后更保守的短期偿债能力",
    "现金比率": "分子仅货币资金（1001+1002），与流动比率独立计算",
    "资产负债率": "过高说明财务杠杆偏大，过低可能未充分利用负债经营",
    "产权比率": "债权人权益与股东权益的相对关系",
    "销售毛利率": "反映产品/服务本身的盈利空间",
    "销售净利率": "扣除全部成本费用与计提后的最终盈利水平",
    "期间费用率": "税金及附加与三项期间费用占收入比重",
    "总资产周转率": "管理口径，用期末资产而非平均资产",
    "应收账款周转率": "管理口径，用期末应收款项而非平均余额",
}


@route("GET", r"/api/reports/ratios")
def financial_ratios(conn, m, body, qs):
    period = period_arg(qs)
    ra = _ratios(_ctx(conn, period))
    items = [{**x, "explain": RATIO_EXPLAIN.get(x["name"], x["limitation"] or x["formula"])}
             for x in ra["items"]]
    return {"period": period, "items": items, "score": ra["score"],
            "healthy": ra["healthy"], "valid": ra["valid"], "basis": ra["basis"],
            "note": "管理分析口径；流动性按科目前缀划分，阈值可在「分析规则」中自定义"}


# ---------------- 7. 同比 / 环比趋势 ----------------
@route("GET", r"/api/reports/compare")
def compare_periods(conn, m, body, qs):
    period = period_arg(qs)
    data = _analyze(conn, period)
    return {"period": period, **data["compare"], "trend": data["trend"]}


# ---------------- 8. 年度结转（4103 → 4104） ----------------
@route("POST", r"/api/periods/(\d{4})/year-end-carry")
def year_end_carry(conn, m, body, qs):
    year = m.group(1)
    period = year + "-12"
    ensure_period(conn, period)
    assert_open(conn, period)
    dup = one(conn, """SELECT v.id FROM vouchers v WHERE v.period=? AND v.summary LIKE '%年度结转%'
        AND EXISTS (SELECT 1 FROM voucher_lines l WHERE l.voucher_id=v.id AND l.subject_code='4104')""",
        (period,))
    if dup:
        raise ApiError(f"{year} 年度结转已执行过（凭证 #{dup['id']}），请勿重复结转")
    bal = subject_closing(conn, period, "4103")
    amount = r2(-bal)  # 正数=盈利（4103 贷方余额）
    if abs(amount) < 0.005:
        raise ApiError(f"{year} 年度本年利润科目无余额，无需结转")
    if amount > 0:
        lines = [{"subject_code": "4103", "debit": amount, "credit": 0},
                 {"subject_code": "4104", "debit": 0, "credit": amount}]
    else:
        lines = [{"subject_code": "4104", "debit": -amount, "credit": 0},
                 {"subject_code": "4103", "debit": 0, "credit": -amount}]
    actor = body.get("actor") or "会计"
    vid = create_voucher(conn, {"voucher_date": f"{year}-12-31", "voucher_type": "转",
                                "summary": f"{year} 年度结转：本年利润转入利润分配",
                                "lines": lines}, actor=actor, auto_post=True)
    conn.execute("UPDATE vouchers SET is_closing=1 WHERE id=?", (vid,))
    no = one(conn, "SELECT voucher_no FROM vouchers WHERE id=?", (vid,))["voucher_no"]
    log(conn, "年度结转", "voucher", vid, f"{year} 年 4103→4104 ¥{amount:,.2f}（{no}）", actor)
    return {"ok": True, "voucher_id": vid, "voucher_no": no, "amount": amount,
            "direction": "盈利结转" if amount > 0 else "亏损结转",
            "hint": "已生成并过账 4103→4104 结转凭证；资产负债表会自动把往年利润列为「利润分配」",
            "impacts": _Impact.impact("year_end.carry")}


# ---------------- 9. 银行对账单批量导入 ----------------
@route("POST", r"/api/statements/import")
def statements_import(conn, m, body, qs):
    text = body.get("text") or ""
    raw = body.get("rows") or []
    parsed = []

    def norm_date(s):
        s = str(s or "").strip().replace("/", "-").replace(".", "-")
        mo = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})", s)
        return f"{mo.group(1)}-{int(mo.group(2)):02d}-{int(mo.group(3)):02d}" if mo else None

    if raw:
        for x in raw:
            d = norm_date(x.get("date") or x.get("statement_date"))
            if not d:
                continue
            parsed.append({"date": d, "description": str(x.get("description") or x.get("summary") or "").strip(),
                           "in": r2(x.get("in") or x.get("amount_in")),
                           "out": r2(x.get("out") or x.get("amount_out"))})
    else:
        for parts in csv.reader(io.StringIO(text.replace("\t", ","))):
            if len(parts) < 2:
                continue
            d = norm_date(parts[0])
            if not d:
                continue  # 跳过表头与说明行
            desc = parts[1].strip()
            vin = r2(parts[2]) if len(parts) > 2 and parts[2].strip() else 0.0
            vout = r2(parts[3]) if len(parts) > 3 and parts[3].strip() else 0.0
            if not vin and not vout:
                continue
            parsed.append({"date": d, "description": desc, "in": vin, "out": vout})
    if not parsed:
        raise ApiError("没有解析出有效行。格式：每行「日期,摘要,收入,支出」，日期如 2026-11-07")
    existing = {(r["statement_date"], r["description"], r2(r["amount_in"]), r2(r["amount_out"]))
                for r in q(conn, "SELECT * FROM bank_statements")}
    for x in parsed:
        x["duplicate"] = (x["date"], x["description"], x["in"], x["out"]) in existing
    fresh = [x for x in parsed if not x["duplicate"]]
    if not body.get("confirm"):
        return {"preview": True, "total": len(parsed), "new": len(fresh),
                "duplicates": len(parsed) - len(fresh), "items": parsed[:100]}
    bid = body.get("bank_account_id") or default_bank_id(conn)
    for x in fresh:
        conn.execute("""INSERT INTO bank_statements(statement_date,bank_account_id,description,
                        amount_in,amount_out,created_at) VALUES(?,?,?,?,?,?)""",
                     (x["date"], bid, x["description"], x["in"], x["out"], now()))
    actor = body.get("actor") or "出纳"
    log(conn, "批量导入银行对账单", "statement", None,
        f"解析 {len(parsed)} 行，导入 {len(fresh)} 行，跳过重复 {len(parsed)-len(fresh)} 行", actor)
    return {"preview": False, "imported": len(fresh), "duplicates": len(parsed) - len(fresh),
            "ok": True, "hint": "导入后请在「银行对账」页点「自动匹配」生成余额调节表",
            "impacts": _Impact.impact("statements.import")}


# ---------------- 10. 坏账准备计提 ----------------
DEFAULT_RATES = {"0-30天": 0.01, "31-60天": 0.05, "61-90天": 0.10, "90天以上": 0.30}


def bad_debt_preview_data(conn, period):
    """委托 core.aging_of：账龄基准日按所选期间月末（可在规则中切换 today）"""
    ctx = _ctx(conn, period)
    a = _aging(ctx)
    return {"period": period, "rates": ctx.rules.get("aging.rates", {}),
            "details": a["details"], "required": a["required"], "provided": a["provided"],
            "adjustment": a["adjustment"], "receivable_total": a["receivable_total"],
            "as_of": a["as_of"], "basis": a["basis"],
            "note": f"账龄基准日 {a['as_of']}（{a['basis']}，可在分析规则中切换）；仅对销项发票（应收）计提，已计提额取 1231 贷方余额"}


@route("GET", r"/api/bad-debt/preview")
def bad_debt_preview(conn, m, body, qs):
    return bad_debt_preview_data(conn, period_arg(qs))


@route("GET", r"/api/bad-debt/config")
def bad_debt_get_config(conn, m, body, qs):
    return {"rates": _Rules(conn).get("aging.rates", DEFAULT_RATES),
            "basis": _Rules(conn).get("aging.basis")}


@route("POST", r"/api/bad-debt/config")
def bad_debt_set_config(conn, m, body, qs):
    """旧接口保留兼容，写入统一规则引擎（与「分析规则」页同源）"""
    rates = body.get("rates") or {}
    clean = {k: float(rates.get(k, 0) or 0) for k in DEFAULT_RATES}
    try:
        saved = _Rules(conn).update({"aging": {"rates": clean}})
    except ValueError as e:
        raise ApiError(str(e))
    log(conn, "修改坏账计提比例", "setting", "analysis_rules", json.dumps(clean),
        body.get("actor") or "会计")
    return {"ok": True, "rates": saved["aging"]["rates"]}


@route("POST", r"/api/bad-debt/provision")
def bad_debt_provision(conn, m, body, qs):
    period = body.get("period") or period_arg(qs)
    p = bad_debt_preview_data(conn, period)
    diff = p["adjustment"]
    if abs(diff) < 0.005:
        raise ApiError("当前坏账准备已足额，无需计提或冲回")
    ensure_period(conn, period)
    assert_open(conn, period)
    if diff > 0:
        lines = [{"subject_code": "6701", "debit": diff, "credit": 0},
                 {"subject_code": "1231", "debit": 0, "credit": diff}]
        action = "补提"
    else:
        lines = [{"subject_code": "1231", "debit": -diff, "credit": 0},
                 {"subject_code": "6701", "debit": 0, "credit": -diff}]
        action = "冲回"
    actor = body.get("actor") or "会计"
    vid = create_voucher(conn, {"voucher_date": f"{period}-01", "voucher_type": "转",
                                "summary": f"{period} 坏账准备{action}（按账龄比例）", "lines": lines},
                         actor=actor, auto_post=True)
    no = one(conn, "SELECT voucher_no FROM vouchers WHERE id=?", (vid,))["voucher_no"]
    log(conn, "坏账准备计提", "voucher", vid, f"{period} {action} ¥{abs(diff):,.2f}（{no}）", actor)
    return {"ok": True, "voucher_id": vid, "voucher_no": no, "action": action,
            "amount": abs(diff), "required": p["required"], "provided_before": p["provided"],
            "hint": "已生成并过账计提凭证；再次点击会因已足额而被拦截，不会重复计提",
            "impacts": _Impact.impact("bad_debt.provision")}


# ---------------- 11. 会计科目模板套用 ----------------
SUBJECT_TEMPLATES = {
    "small": {"name": "小企业会计准则 · 常用科目", "desc": "适合小微企业、代理记账，约 40 个高频科目",
              "rows": [
                  ("1001", "库存现金", "资产", "借"), ("1002", "银行存款", "资产", "借"),
                  ("1012", "其他货币资金", "资产", "借"), ("1122", "应收账款", "资产", "借"),
                  ("1123", "预付账款", "资产", "借"), ("1221", "其他应收款", "资产", "借"),
                  ("1231", "坏账准备", "资产", "贷"), ("1405", "库存商品", "资产", "借"),
                  ("1601", "固定资产", "资产", "借"), ("1602", "累计折旧", "资产", "贷"),
                  ("1701", "无形资产", "资产", "借"), ("2202", "应付账款", "负债", "贷"),
                  ("2203", "预收账款", "负债", "贷"), ("2211", "应付职工薪酬", "负债", "贷"),
                  ("2221", "应交税费", "负债", "贷"), ("2231", "应付利息", "负债", "贷"),
                  ("2241", "其他应付款", "负债", "贷"), ("2314", "合同负债", "负债", "贷"),
                  ("4001", "实收资本", "权益", "贷"), ("4002", "资本公积", "权益", "贷"),
                  ("4101", "盈余公积", "权益", "贷"), ("4103", "本年利润", "权益", "贷"),
                  ("4104", "利润分配", "权益", "贷"), ("5001", "生产成本", "成本", "借"),
                  ("6001", "主营业务收入", "损益", "贷"), ("6051", "其他业务收入", "损益", "贷"),
                  ("6301", "营业外收入", "损益", "贷"), ("6401", "主营业务成本", "损益", "借"),
                  ("6402", "其他业务成本", "损益", "借"), ("6403", "税金及附加", "损益", "借"),
                  ("6601", "销售费用", "损益", "借"), ("6602", "管理费用", "损益", "借"),
                  ("6603", "财务费用", "损益", "借"), ("6701", "资产减值损失", "损益", "借"),
                  ("6711", "营业外支出", "损益", "借"), ("6801", "所得税费用", "损益", "借"),
              ]},
    "enterprise": {"name": "企业会计准则 · 扩展科目", "desc": "在小企业模板基础上补充投资、借款、研发等科目",
                   "rows": [
                       ("1101", "交易性金融资产", "资产", "借"), ("1231", "坏账准备", "资产", "贷"),
                       ("1403", "原材料", "资产", "借"), ("1405", "库存商品", "资产", "借"),
                       ("1511", "长期股权投资", "资产", "借"), ("1604", "在建工程", "资产", "借"),
                       ("1701", "无形资产", "资产", "借"), ("1702", "累计摊销", "资产", "贷"),
                       ("1801", "长期待摊费用", "资产", "借"), ("2001", "短期借款", "负债", "贷"),
                       ("2211", "应付职工薪酬", "负债", "贷"), ("2501", "长期借款", "负债", "贷"),
                       ("4002", "资本公积", "权益", "贷"), ("4101", "盈余公积", "权益", "贷"),
                       ("5001", "生产成本", "成本", "借"), ("5101", "制造费用", "成本", "借"),
                       ("6604", "研发费用", "损益", "借"), ("6701", "资产减值损失", "损益", "借"),
                       ("6702", "信用减值损失", "损益", "借"), ("6901", "以前年度损益调整", "损益", "借"),
                   ]},
}


@route("GET", r"/api/subjects/templates")
def subject_templates(conn, m, body, qs):
    existing = {r["code"] for r in q(conn, "SELECT code FROM subjects")}
    out = []
    for k, t in SUBJECT_TEMPLATES.items():
        out.append({"key": k, "name": t["name"], "desc": t["desc"], "total": len(t["rows"]),
                    "missing": sum(1 for r in t["rows"] if r[0] not in existing),
                    "preview": [{"code": r[0], "name": r[1], "category": r[2], "direction": r[3]}
                                for r in t["rows"]]})
    return {"items": out, "existing": len(existing)}


@route("POST", r"/api/subjects/apply-template")
def apply_subject_template(conn, m, body, qs):
    key = body.get("template") or "small"
    if key not in SUBJECT_TEMPLATES:
        raise ApiError("未知科目模板")
    tpl = SUBJECT_TEMPLATES[key]
    added = []
    for code, name, cat, direction in tpl["rows"]:
        if one(conn, "SELECT code FROM subjects WHERE code=?", (code,)):
            continue
        conn.execute("""INSERT INTO subjects(code,name,category,direction,is_cash,is_bank,enabled)
                        VALUES(?,?,?,?,?,?,1)""",
                     (code, name, cat, direction, 1 if code == "1001" else 0,
                      1 if code == "1002" else 0))
        added.append(f"{code} {name}")
    log(conn, "套用科目模板", "subject", key, f"新增 {len(added)} 个科目", body.get("actor") or "会计")
    return {"ok": True, "added": len(added), "items": added,
            "hint": "只补充缺失科目，不覆盖已有科目及其余额；新增科目会自动进入资产负债表/利润表",
            "impacts": _Impact.impact("subjects.apply")}


# ---------------- 12. 我的待办中心 ----------------
@route("GET", r"/api/todo")
def todo_center(conn, m, body, qs):
    this = datetime.now().strftime("%Y-%m")
    cards = []

    def card(key, label, page, sql, args, fmt, level="info"):
        rows = q(conn, sql + " LIMIT 5", args)
        n = one(conn, "SELECT COUNT(*) n FROM (" + sql + ")", args)["n"]
        cards.append({"key": key, "label": label, "page": page, "count": n,
                      "level": level if n else "done", "items": [fmt(r) for r in rows]})

    card("docs", "待审批单据", "docs",
         "SELECT id,doc_no,doc_type,amount,applicant,doc_date FROM docs WHERE status='submitted' ORDER BY doc_date",
         (), lambda r: {"title": r["doc_no"], "sub": f"{r['doc_type']} · {r['applicant'] or ''} · ¥{r['amount']:,.2f}", "date": r["doc_date"]}, "warn")
    card("vouchers", "未过账凭证", "vouchers",
         "SELECT id,voucher_no,summary,voucher_date FROM vouchers WHERE status NOT IN ('posted','void') ORDER BY voucher_date",
         (), lambda r: {"title": r["voucher_no"], "sub": r["summary"] or "待审核/待过账", "date": r["voucher_date"]}, "warn")
    card("statements", "银行流水未匹配", "recon",
         "SELECT id,statement_date,description,amount_in,amount_out FROM bank_statements WHERE matched_journal_id IS NULL ORDER BY statement_date",
         (), lambda r: {"title": r["description"] or f"对账单 #{r['id']}", "sub": f"收 ¥{r['amount_in']:,.2f} / 付 ¥{r['amount_out']:,.2f}", "date": r["statement_date"]})
    card("journal", "日记账未核对", "journal",
         "SELECT id,journal_date,summary,amount FROM journal WHERE recon_status='未核对' ORDER BY journal_date",
         (), lambda r: {"title": r["summary"] or f"流水 #{r['id']}", "sub": f"¥{r['amount']:,.2f}", "date": r["journal_date"]})
    card("invoices", "发票未入账", "invoices",
         "SELECT id,invoice_no,kind,total_amount,invoice_date FROM invoices WHERE voucher_id IS NULL ORDER BY invoice_date",
         (), lambda r: {"title": r["invoice_no"], "sub": f"{r['kind']} · ¥{r['total_amount']:,.2f}", "date": r["invoice_date"]}, "warn")
    card("invoices_clear", "发票待核销", "partner",
         "SELECT id,invoice_no,total_amount,invoice_date,status FROM invoices WHERE status NOT LIKE '%核销%' ORDER BY invoice_date",
         (), lambda r: {"title": r["invoice_no"], "sub": f"{r['status']} · ¥{r['total_amount']:,.2f}", "date": r["invoice_date"]})
    card("periods", "往期未结账", "periods",
         "SELECT period,status FROM periods WHERE status='open' AND period<? ORDER BY period",
         (this,), lambda r: {"title": r["period"], "sub": "会计期间仍为开放状态", "date": ""}, "warn")
    card("assets", "在用固定资产", "assets",
         "SELECT id,asset_no,name,original_value,purchase_date FROM assets WHERE status='在用' ORDER BY purchase_date",
         (), lambda r: {"title": f"{r['asset_no']} {r['name']}", "sub": f"原值 ¥{r['original_value']:,.2f} · 记得每月计提折旧", "date": r["purchase_date"]})
    return {"items": cards, "total": sum(c["count"] for c in cards),
           "pending": sum(c["count"] for c in cards if c["level"] == "warn"),
           "generated_at": now()}


# ---------------- 13. 报表快照归档 ----------------
@route("GET", r"/api/snapshots")
def snapshot_list(conn, m, body, qs):
    rows = q(conn, """SELECT id,period,kind,note,created_by,created_at,
                      LENGTH(data_json) AS size FROM report_snapshots ORDER BY id DESC LIMIT 200""")
    return {"items": rows}


@route("POST", r"/api/snapshots")
def snapshot_save(conn, m, body, qs):
    period = body.get("period") or period_arg(qs)
    bs = build_balance_sheet(conn, period)
    inc = build_income_statement(conn, period)
    art = report_articulation(conn, None, None, {"period": [period]})
    cf = report_cashflow(conn, None, None, {"period": [period], "scope": ["through"]})
    data = {"balance_sheet": bs, "income": inc, "articulation": art, "cashflow": cf}
    cur = conn.execute("""INSERT INTO report_snapshots(period,kind,note,data_json,created_by,created_at)
                          VALUES(?,?,?,?,?,?)""",
                       (period, body.get("kind") or "月度报表", body.get("note") or "",
                        json.dumps(data, ensure_ascii=False), body.get("actor") or "会计", now()))
    log(conn, "归档报表快照", "snapshot", cur.lastrowid, f"{period} 三大报表", body.get("actor") or "会计")
    return {"ok": True, "id": cur.lastrowid, "period": period,
            "balanced": bs["balanced"], "all_pass": art["all_pass"]}


@route("GET", r"/api/snapshots/(\d+)")
def snapshot_get(conn, m, body, qs):
    r = one(conn, "SELECT * FROM report_snapshots WHERE id=?", (m.group(1),))
    if not r:
        raise ApiError("快照不存在", 404)
    r["data"] = jload(r.pop("data_json"), {})
    return r


@route("DELETE", r"/api/snapshots/(\d+)")
def snapshot_del(conn, m, body, qs):
    if not one(conn, "SELECT id FROM report_snapshots WHERE id=?", (m.group(1),)):
        raise ApiError("快照不存在", 404)
    conn.execute("DELETE FROM report_snapshots WHERE id=?", (m.group(1),))
    log(conn, "删除报表快照", "snapshot", m.group(1), "已删除", body.get("actor") or "会计")
    return {"ok": True}


@route("GET", r"/api/snapshots/(\d+)/export\.xlsx")
def snapshot_export(conn, m, body, qs):
    r = one(conn, "SELECT * FROM report_snapshots WHERE id=?", (m.group(1),))
    if not r:
        raise ApiError("快照不存在", 404)
    d = jload(r["data_json"], {})
    bs, inc, art = d.get("balance_sheet", {}), d.get("income", {}), d.get("articulation", {})
    sheets = [
        {"name": "资产负债表", "headers": ["项目", "金额"], "rows":
         [[x["item"], x["amount"]] for x in bs.get("assets", [])] +
         [["资产合计", bs.get("total_assets")], [None, None]] +
         [[x["item"], x["amount"]] for x in bs.get("liabilities", []) + bs.get("equity", [])] +
         [["负债和权益合计", r2(bs.get("total_liabilities", 0) + bs.get("total_equity", 0))]],
         "widths": [30, 20]},
        {"name": "利润表", "headers": ["项目", "本期数", "本年累计数"], "rows":
         [[x["item"], x["amount"], y["amount"]] for x, y in
          zip(inc.get("current", []), inc.get("cumulative", []))], "widths": [30, 18, 18]},
        {"name": "勾稽核对", "headers": ["勾稽关系", "左边", "右边", "结果"], "rows":
         [[x["name"], x["left"], x["right"], "✓" if x["pass"] else f"差额 {x['diff']}"]
          for x in art.get("checks", [])], "widths": [34, 34, 40, 16]},
    ]
    return file_result(make_xlsx(sheets), f"报表快照_{r['period']}_{r['id']}.xlsx",
                       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


# ---------------- 14. 往来催收清单 ----------------
def collection_data(conn, min_days):
    aging = report_aging(conn, None, None, {})
    rows = [x for x in aging["items"] if x["direction"] == "应收" and x["days"] >= min_days]
    groups = {}
    for r in rows:
        key = r["counterparty_name"] or "未指定往来单位"
        g = groups.setdefault(key, {"counterparty": key, "count": 0, "amount": 0.0,
                                    "max_days": 0, "items": []})
        g["count"] += 1
        g["amount"] += r["total_amount"]
        g["max_days"] = max(g["max_days"], r["days"])
        g["items"].append({"invoice_no": r["invoice_no"], "invoice_date": r["invoice_date"],
                           "days": r["days"], "bucket": r["bucket"],
                           "amount": r2(r["total_amount"]), "status": r["status"]})
    out = []
    for g in groups.values():
        g["amount"] = r2(g["amount"])
        g["level"] = "紧急" if g["max_days"] > 90 else ("关注" if g["max_days"] > 60 else "正常")
        g["items"].sort(key=lambda x: -x["days"])
        out.append(g)
    out.sort(key=lambda x: -x["amount"])
    return {"min_days": min_days, "items": out, "total": r2(sum(g["amount"] for g in out)),
            "invoice_count": len(rows), "as_of": datetime.now().strftime("%Y-%m-%d")}


@route("GET", r"/api/reports/collection")
def collection_report(conn, m, body, qs):
    return collection_data(conn, int((qs.get("days") or ["0"])[0] or 0))


@route("GET", r"/api/export/collection\.xlsx")
def collection_export(conn, m, body, qs):
    d = collection_data(conn, int((qs.get("days") or ["0"])[0] or 0))
    rows = []
    for g in d["items"]:
        for x in g["items"]:
            rows.append([g["counterparty"], x["invoice_no"], x["invoice_date"], x["days"],
                         x["bucket"], x["amount"], x["status"], g["level"]])
    sheets = [{"name": "催收清单", "headers": ["往来单位", "发票号", "开票日期", "账龄(天)",
                                          "账龄区间", "未收金额", "状态", "催收级别"],
               "rows": rows, "widths": [20, 18, 14, 12, 14, 16, 12, 12]},
              {"name": "按单位汇总", "headers": ["往来单位", "未收笔数", "未收合计", "最长账龄(天)", "催收级别"],
               "rows": [[g["counterparty"], g["count"], g["amount"], g["max_days"], g["level"]]
                        for g in d["items"]], "widths": [20, 14, 18, 16, 12]}]
    return file_result(make_xlsx(sheets), f"往来催收清单_{d['as_of']}.xlsx",
                       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
