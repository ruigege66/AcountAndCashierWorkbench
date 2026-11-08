# -*- coding: utf-8 -*-
"""V2.15 四流工作台：按调研表的 11 项「工作」重排系统。

一行 = 一项工作；四列 = 同一工作的四个视角：
  数据流 = 数据从哪来/加工/输出（节点链）
  价值流 = 为什么做（价值主张）
  工作流 = 先后顺序（步骤状态机）
  执行流 = 具体动作（映射到现有系统页面）
四者按「同一步」对齐：点开任一步能看到它产生的数据、创造的价值、要做的动作和系统入口。
"""
import json
import re

from app.routing import route
from .common import q, one, now, today, log, require
from .work_data import WORKS

P = "/api/work"
SHORT = ["账务核算", "财务与预算", "合同法务（中级）", "集团与战略财务", "准则核算",
         "审计鉴证", "成本与估值", "商事合规", "全税种管理", "战略与风控", "重大项目综合"]

# 关键词 → (功能中文名, 页面, 覆盖状态)
RULES = [
    (r"合并报表|合并抵消|企业合并|集团资金|少数股东", "合并报表（待建）", "competency_center", "待建"),
    (r"原始业务单据|业务单据收集|单据|合同文本|主体资质|商事主体信息|全品类业务交易|全业务链条|被审计单位财务", "业务单据", "docs", "已支撑"),
    (r"记账凭证|制单录入|制单|账务处理|会计分录|编制会计分录|明细核算", "凭证管理", "vouchers", "已支撑"),
    (r"审核|审批|评审|复核|合规审核|合规校验|合规性校验", "审批与合规检查", "vouchers", "已支撑"),
    (r"过账|记账过账", "凭证过账", "vouchers", "已支撑"),
    (r"明细分类账|总分类账|科目余额表|明细账|账簿", "账簿与余额表", "books", "已支撑"),
    (r"财务报表|报表编制|编报|财务报告|列报|披露|附注|单体", "财务报表", "fin", "已支撑"),
    (r"计提|折旧|摊销|减值|结转|期末调整|日后事项|差错更正|纳税调整", "期末结账与调整", "periods", "已支撑"),
    (r"对账|调账|函证|监盘|穿行测试|实质性", "对账与函证", "recon", "已支撑"),
    (r"结账|完成审计|出具报告|审计报告|归档", "结账与归档", "periods", "部分支撑"),
    (r"预算编制|预算管控|全面预算|滚动预算|弹性预算|预算绩效", "预算与差异分析", "advanced_center", "已支撑"),
    (r"财务指标|指标测算|比率|估值|测算模型|绩效评价|考核评价|杜邦|EVA|本量利|成本差异|净现值|内含报酬率|资本成本|期权|作业成本|责任成本|成本核算|成本分析|成本管控|财务预测|经营决策|投融资测算|方案测算", "高阶核算与决策模型", "advanced_center", "已支撑"),
    (r"税务核算|纳税申报|税额计算|税款缴纳|涉税|计税依据|申报数据|税务筹划|稽查|出口退税|汇算清缴|进销项|土地增值税|国际税收", "税务中心", "tax_center", "已支撑"),
    (r"风险评估|风险识别|风险应对|风险管理|内控体系|内部控制|监督整改|控制测试|战略控制", "内控与风险闭环", "advanced_center", "已支撑"),
    (r"审计计划|审计策略|审计证据|工作底稿|审计抽样|业务承接|初步业务活动|关键审计事项|质量管理|独立性", "内部审计", "audit_center", "部分支撑"),
    (r"循环审计|销售与收款|采购与付款|生产与存货|货币资金审计|舞弊|持续经营|关联方", "循环审计（待建）", "competency_center", "待建"),
    (r"战略制定|战略拆解|战略分析|战略目标|PEST|五力|价值链|产业结构|竞争环境|资源配置|战略执行|战略调整|数字化转型|组织结构", "战略与风控（待建）", "competency_center", "待建"),
    (r"尽调|并购|重组|立项|估值|方案设计|落地整合|落地执行|效果复盘|IPO|资本市场", "重大项目（部分待建）", "competency_center", "部分支撑"),
    (r"合同|主体设立|变更|注销|票据|工商登记|章程|维权|纠纷|违约|清算|治理", "法务管理", "legal_center", "已支撑"),
    (r"监管|反洗钱|关联交易|ECL|拨备|报送", "金融监管会计", "reg_center", "已支撑"),
    (r"宏观|CPI|PPI|通胀|汇率|外币|行业对标|压力测试|情景", "宏观经济会计", "macro_center", "已支撑"),
    (r"资金|现金|应收|存货|信用政策|营运", "资金与营运", "cashier_tools", "已支撑"),
    (r"开票|发票|批量付款|对账单|网银|外部协同", "外部协同", "gateway_center", "已支撑"),
    (r"会计判断|复杂业务|特殊交易|金融工具|公允价值|套期|股权激励|持有待售", "准则核算（部分待建）", "advanced_center", "部分支撑"),
]
DATA_OBJECTS = [
    (r"单据|发票|合同|文本|交易数据|业务数据", "业务单据 / 发票台账"),
    (r"凭证|分录|记账", "记账凭证"),
    (r"明细账|总账|余额表|明细核算|账簿", "明细账 / 总账 / 科目余额表"),
    (r"报表|报告|披露|列报", "三大财务报表"),
    (r"指标|比率|测算|模型|估值", "分析指标与模型结果"),
    (r"预算", "预算编制与执行数据"),
    (r"成本", "成本核算数据"),
    (r"绩效|评价|考核", "绩效评价数据"),
    (r"税|申报|征管", "涉税台账与申报表"),
    (r"风险|评估|证据|底稿|结论", "风险评估 / 审计证据 / 工作底稿"),
    (r"战略|宏观|环境|竞争", "战略与宏观指标库"),
    (r"方案|判断|解决", "综合解决方案档案"),
]


def match(text, rules):
    for pat, name, page, cov in rules:
        if re.search(pat, text):
            return name, page, cov
    return "全局搜索", "search", "待建"


def sync(conn, m, body, qs):
    n = {"works": 0, "nodes": 0, "steps": 0, "actions": 0}
    # 调研表结构变更（步骤/动作数变化）时自动重建明细，避免旧版残留
    expect = (sum(len(w["work_chain"]) for w in WORKS),
              sum(len(w["actions"]) for w in WORKS),
              sum(len(w["data_chain"]) for w in WORKS))
    actual = (one(conn, "SELECT COUNT(*) n FROM work_steps")["n"],
              one(conn, "SELECT COUNT(*) n FROM work_actions")["n"],
              one(conn, "SELECT COUNT(*) n FROM work_data_nodes")["n"])
    if any(actual) and actual != expect:
        for t in ("work_steps", "work_actions", "work_data_nodes"):
            conn.execute("DELETE FROM " + t)
        n["rebuilt"] = True
    for w in WORKS:
        no = w["no"]
        if not one(conn, "SELECT id FROM work_domains WHERE no=?", (no,)):
            conn.execute("""INSERT INTO work_domains(no,exam_type,subject,short_name,detail,
                data_note,value_text,work_note,created_at) VALUES(?,?,?,?,?,?,?,?,?)""",
                (no, w["exam"], w["subject"], SHORT[no - 1], w["detail"], w["data_note"],
                 w["value"], w["work_note"], now()))
            n["works"] += 1
        for i, name in enumerate(w["data_chain"], 1):
            obj = next((o for pat, o in DATA_OBJECTS if re.search(pat, name)), "业务数据")
            if not one(conn, "SELECT id FROM work_data_nodes WHERE domain_no=? AND seq=?", (no, i)):
                conn.execute("INSERT INTO work_data_nodes(domain_no,seq,name,system_object) VALUES(?,?,?,?)",
                             (no, i, name, obj)); n["nodes"] += 1
        last_map = None
        for i, name in enumerate(w["work_chain"], 1):
            en, page, cov = match(name, RULES)
            if page == "search" and last_map:
                en, page, cov = last_map[0], last_map[1], "部分支撑"
            elif page != "search":
                last_map = (en, page, cov)
            if not one(conn, "SELECT id FROM work_steps WHERE domain_no=? AND seq=?", (no, i)):
                conn.execute("""INSERT INTO work_steps(domain_no,seq,name,system_entry,system_page,coverage,note)
                    VALUES(?,?,?,?,?,?,?)""", (no, i, name, en, page, cov, w["work_note"])); n["steps"] += 1
        for i, name in enumerate(w["actions"], 1):
            en, page, cov = match(name, RULES)
            if not one(conn, "SELECT id FROM work_actions WHERE domain_no=? AND seq=?", (no, i)):
                conn.execute("""INSERT INTO work_actions(domain_no,seq,name,system_entry,system_page,coverage,note)
                    VALUES(?,?,?,?,?,?,?)""", (no, i, name, en, page, cov, "来自调研表执行流")); n["actions"] += 1
    conn.commit()
    return {"ok": True, **n}


def _ensure(conn):
    if not one(conn, "SELECT id FROM work_domains LIMIT 1"):
        sync(conn, None, {}, {})


@route("GET", P + r"/works")
def works(conn, m, body, qs):
    _ensure(conn)
    rows = q(conn, "SELECT * FROM work_domains ORDER BY no")
    for r in rows:
        r["步骤数"] = one(conn, "SELECT COUNT(*) n FROM work_steps WHERE domain_no=?", (r["no"],))["n"]
        r["动作数"] = one(conn, "SELECT COUNT(*) n FROM work_actions WHERE domain_no=?", (r["no"],))["n"]
        r["已支撑步骤"] = one(conn, "SELECT COUNT(*) n FROM work_steps WHERE domain_no=? AND coverage='已支撑'", (r["no"],))["n"]
        r["进行中"] = one(conn, "SELECT COUNT(*) n FROM work_runs WHERE domain_no=? AND status='进行中'", (r["no"],))["n"]
    return {"items": rows, "总数": len(rows)}


# 这些步骤在调研表的执行流里没有对应动作，靠字面重合会误配（如 成本核算 → 测算资本成本），
# 宁可留空由前端显示「按系统入口办理」，也不显示一个错的动作。
NO_ACTION_STEPS = {"方案评审", "成本核算", "成本管控"}


def _chars(text):
    return {c for c in re.sub(r"[\s（）()/、，,·\-—]", "", text or "")}


def _best_action(step_name, actions):
    """按用字重合度给步骤挑最贴近的执行动作；重合字少于 2 个就认为没有对应动作。"""
    if (step_name or "").strip() in NO_ACTION_STEPS:
        return ""
    cs = _chars(step_name)
    if not cs:
        return ""
    best, best_score = "", 0
    for a in actions:
        score = len(cs & _chars(a["name"]))
        if score > best_score:
            best, best_score = a["name"], score
    return best if best_score >= 2 else ""


@route("GET", P + r"/detail")
def detail(conn, m, body, qs):
    _ensure(conn)
    no = int((qs.get("no") or ["1"])[0] or 1)
    d = one(conn, "SELECT * FROM work_domains WHERE no=?", (no,))
    require(d, "工作不存在")
    data_nodes = q(conn, "SELECT * FROM work_data_nodes WHERE domain_no=? ORDER BY seq", (no,))
    steps = q(conn, "SELECT * FROM work_steps WHERE domain_no=? ORDER BY seq", (no,))
    actions = q(conn, "SELECT * FROM work_actions WHERE domain_no=? ORDER BY seq", (no,))
    # 同一步对齐：步骤 i → 数据节点 min(i,len) 与动作 min(i,len)
    for i, s in enumerate(steps):
        s["数据流产物"] = data_nodes[min(i, len(data_nodes) - 1)]["name"] if data_nodes else "—"
        s["数据对象"] = data_nodes[min(i, len(data_nodes) - 1)]["system_object"] if data_nodes else "—"
        s["执行动作"] = actions[min(i, len(actions) - 1)]["name"] if actions else "—"
        s["动作入口"] = actions[min(i, len(actions) - 1)]["system_page"] if actions else "search"
        s["系统入口"] = s["system_page"] or "search"
        s["系统功能"] = s["system_entry"]
        # 调研表的「工作流步数」与「执行流动作数」并不等长（如 8 步 / 7 动作），
        # 顺序硬配会出现「业务单据收集 → 编制会计分录」这类错配；按名称重合度再校一次，
        # 匹配不上就留空，前端改为只显示系统入口，不硬塞一个不相干的动作。
        s["步骤动作"] = _best_action(s["name"], actions)
        # 该步骤的动作覆盖情况取步骤与动作中较差者
        acov = actions[min(i, len(actions) - 1)]["coverage"] if actions else "待建"
        s["关联覆盖"] = "待建" if "待建" in (s["coverage"], acov) else ("部分支撑" if "部分" in (s["coverage"], acov) else "已支撑")
    return {"work": d, "数据流": {"节点": data_nodes, "说明": d["data_note"]},
            "价值流": {"主张": d["value_text"],
                       "价值点": [x.strip() for x in re.split(r"[、，,]", d["value_text"]) if x.strip()]},
            "工作流": {"步骤": steps, "说明": d["work_note"]},
            "执行流": {"动作": actions},
            "子科目": d["detail"]}


@route("GET", P + r"/gaps")
def gaps(conn, m, body, qs):
    _ensure(conn)
    rows = q(conn, """SELECT s.domain_no,w.short_name,s.seq,s.name,s.coverage,s.system_entry
        FROM work_steps s JOIN work_domains w ON w.no=s.domain_no
        WHERE s.coverage!='已支撑' ORDER BY s.domain_no,s.seq""")
    acts = q(conn, """SELECT a.domain_no,w.short_name,a.seq,a.name,a.coverage,a.system_entry
        FROM work_actions a JOIN work_domains w ON w.no=a.domain_no
        WHERE a.coverage!='已支撑' ORDER BY a.domain_no,a.seq""")
    return {"断链步骤": rows, "断链动作": acts, "步骤数": len(rows), "动作数": len(acts),
            "说明": "断链 = 该项工作在这一步没有现成系统功能，需人工办理或后续轮次补齐"}



# ---- 知识图谱（图数据库式：节点 + 邻接边，可按节点探索） ----
DATA_TABLES = {
    "单据": ["docs"], "发票": ["invoices"], "合同": ["contracts", "contract_milestones"],
    "凭证": ["vouchers", "voucher_lines"], "明细账": ["journal"], "总账": ["journal", "voucher_lines"],
    "科目余额表": ["opening_balances", "voucher_lines"], "财务报表": ["voucher_lines", "subjects"],
    "指标": ["adv_models"], "测算": ["adv_models"], "预算": ["budgets"], "成本": ["adv_assets", "voucher_lines"],
    "税": ["tax_filings", "invoices", "tax_input_certs"], "申报": ["tax_filings"],
    "风险": ["audit_findings"], "证据": ["audit_workpapers"], "底稿": ["audit_workpapers"],
    "战略": ["macro_indicators"], "宏观": ["macro_indicators"], "绩效": ["payroll_runs", "payroll_lines"],
    "方案": ["adv_models"], "监管": ["reg_reports", "ecl_stages"], "关联交易": ["related_parties", "journal"],
    "纠纷": ["legal_cases"], "用印": ["seal_requests"], "合规": ["compliance_duties"],
}


@route("GET", P + r"/graph")
def graph(conn, m, body, qs):
    """以某项工作为中心的节点图：工作 → 流程步骤 → 数据对象 → 数据表/页面"""
    _ensure(conn)
    no = int((qs.get("no") or ["1"])[0] or 1)
    d = one(conn, "SELECT * FROM work_domains WHERE no=?", (no,))
    require(d, "工作不存在")
    nodes, edges = [], []

    def node(nid, ntype, label, page=None, extra=None):
        n = {"id": nid, "type": ntype, "label": label}
        if page:
            n["page"] = page
        if extra:
            n.update(extra)
        nodes.append(n)

    node("work", "工作", d["subject"], "work_" + str(no),
         {"考试类型": d["exam_type"], "价值主张": (d["value_text"] or "")[:60] + "…"})
    steps = q(conn, "SELECT * FROM work_steps WHERE domain_no=? ORDER BY seq", (no,))
    dn = q(conn, "SELECT * FROM work_data_nodes WHERE domain_no=? ORDER BY seq", (no,))
    acts = q(conn, "SELECT * FROM work_actions WHERE domain_no=? ORDER BY seq", (no,))
    for i, s in enumerate(steps, 1):
        nid = f"step:{i}"
        node(nid, "流程步骤", s["name"], s["system_page"], {"支撑": s["coverage"]})
        edges.append({"from": "work", "to": nid, "label": "步骤" + str(i)})
        dn_row = dn[min(i - 1, len(dn) - 1)] if dn else None
        if dn_row:
            did = f"data:{dn_row['seq']}"
            if not any(x["id"] == did for x in nodes):
                node(did, "数据对象", dn_row["name"], None,
                     {"系统对象": dn_row["system_object"] or "—",
                      "相关表": "、".join(DATA_TABLES.get(next(
                          (k for k in DATA_TABLES if k in dn_row["name"]), ""), ["—"]))})
            edges.append({"from": nid, "to": did, "label": "产出"})
        a = acts[min(i - 1, len(acts) - 1)] if acts else None
        if a:
            aid = f"action:{a['seq']}"
            if not any(x["id"] == aid for x in nodes):
                node(aid, "执行动作", a["name"], a["system_page"], {"支撑": a["coverage"]})
            edges.append({"from": nid, "to": aid, "label": "动作"})
    return {"center": {"no": no, "subject": d["subject"], "short": SHORT[no - 1]},
            "nodes": nodes, "edges": edges,
            "统计": {"节点": len(nodes), "边": len(edges)},
            "说明": "点任一节点可查看详情与相邻节点；工作 → 流程步骤 → 数据对象 → 相关数据表"}


@route("POST", P + r"/run")
def run_start(conn, m, body, qs):
    no = int(body.get("no") or 1)
    require(one(conn, "SELECT id FROM work_domains WHERE no=?", (no,)), "工作不存在")
    cur = conn.execute("""INSERT INTO work_runs(domain_no,title,stage,status,owner,created_at)
        VALUES(?,?,0,'进行中',?,?)""", (no, body.get("title") or SHORT[no - 1],
        body.get("owner") or "", now()))
    return {"ok": True, "id": cur.lastrowid, "当前步骤": q(conn,
        "SELECT name FROM work_steps WHERE domain_no=? ORDER BY seq LIMIT 1", (no,))[0]["name"]}


@route("POST", P + r"/step")
def run_step(conn, m, body, qs):
    rid = int(body.get("run_id") or 0)
    r = one(conn, "SELECT * FROM work_runs WHERE id=?", (rid,))
    require(r, "办理实例不存在")
    steps = q(conn, "SELECT * FROM work_steps WHERE domain_no=? ORDER BY seq", (r["domain_no"],))
    require(r["stage"] < len(steps), "该工作已全部办理完成")
    s = steps[r["stage"]]
    conn.execute("""INSERT OR REPLACE INTO work_step_logs(run_id,seq,step_name,action_note,done_at)
        VALUES(?,?,?,?,?)""", (rid, s["seq"], s["name"], body.get("note") or "", today()))
    stage = r["stage"] + 1
    done = stage >= len(steps)
    conn.execute("UPDATE work_runs SET stage=?,status=? WHERE id=?",
                 (stage, "已完成" if done else "进行中", rid))
    log(conn, "完成工作步骤", "work_run", rid, f"{s['name']}", body.get("owner") or "")
    return {"ok": True, "完成步骤": s["name"], "下一步": steps[stage]["name"] if not done else None,
            "进度": f"{stage}/{len(steps)}", "状态": "已完成" if done else "进行中"}


@route("GET", P + r"/runs")
def runs(conn, m, body, qs):
    _ensure(conn)
    rows = q(conn, """SELECT r.*,w.short_name,w.subject FROM work_runs r
        JOIN work_domains w ON w.no=r.domain_no ORDER BY r.id DESC LIMIT 100""")
    for x in rows:
        x["总步骤"] = one(conn, "SELECT COUNT(*) n FROM work_steps WHERE domain_no=?", (x["domain_no"],))["n"]
        x["进度"] = f'{x["stage"]}/{x["总步骤"]}'
    return {"items": rows, "进行中": sum(1 for x in rows if x["status"] == "进行中")}


@route("GET", P + r"/dashboard")
def dashboard(conn, m, body, qs):
    _ensure(conn)
    w = works(conn, None, {}, {})["items"]
    g = gaps(conn, None, {}, {})
    return {"工作数": len(w), "工作流步骤": sum(x["步骤数"] for x in w),
            "执行动作": sum(x["动作数"] for x in w),
            "已支撑步骤": sum(x["已支撑步骤"] for x in w),
            "断链步骤": g["步骤数"], "断链动作": g["动作数"],
            "我的进行中": runs(conn, None, {}, {})["进行中"],
            "四流": ["数据流", "价值流", "工作流", "执行流"],
            "提示": "选一项工作 → 看四流 → 按步骤办理 → 每步直接跳到对应功能"}
