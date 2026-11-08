# -*- coding: utf-8 -*-
"""V2.16 七流工作台（会计调研2）+ 岗位能力维度（会计调研3）。

表2 把四流扩展为七流：数据流 / 资金流 / 工作流 / 执行流 / 管控流 / 价值流 / 合规流。
表3 从岗位视角给出 5 类岗位各自的七流核心动作与能力进阶梯度。
"""
import re

from app.routing import route
from .common import q, one, now, log, require
from .survey7_data import FLOW_NAMES, WORKS7, ROLES
from .workmap import RULES, match, SHORT

P = "/api/work/seven"
FLOW_PAGE = {"数据流": "books", "资金流": "journal", "工作流": "dashboard",
             "执行流": "advanced_center", "管控流": "sec_center",
             "价值流": "analysis", "合规流": "compliance"}


@route("POST", P + r"/sync")
def sync(conn, m, body, qs):
    n = {"flows": 0, "roles": 0, "role_nodes": 0, "ladder": 0}
    for w in WORKS7:
        for flow, obj in w["flows"].items():
            for i, name in enumerate(obj["chain"], 1):
                if one(conn, "SELECT id FROM work_flow_nodes WHERE domain_no=? AND flow=? AND seq=?",
                       (w["no"], flow, i)):
                    continue
                en, page, cov = match(name, RULES)
                if page == "search":
                    page, en, cov = FLOW_PAGE.get(flow, "search"), flow + "对应功能", "部分支撑"
                conn.execute("""INSERT INTO work_flow_nodes(domain_no,flow,seq,name,system_entry,
                    system_page,coverage,note) VALUES(?,?,?,?,?,?,?,?)""",
                    (w["no"], flow, i, name, en, page, cov, obj["text"][:120]))
                n["flows"] += 1
    for r in ROLES:
        if not one(conn, "SELECT id FROM work_roles WHERE no=?", (r["no"],)):
            conn.execute("""INSERT INTO work_roles(no,name,posts,exam_subjects,knowledge,value_text,created_at)
                VALUES(?,?,?,?,?,?,?)""", (r["no"], r["name"], "、".join(r["posts"]),
                r["exam_subjects"], r["knowledge"], " ".join(r.get("价值流", [])), now()))
            n["roles"] += 1
        for flow in FLOW_NAMES:
            for i, name in enumerate(r.get(flow, []), 1):
                if one(conn, "SELECT id FROM work_role_nodes WHERE role_no=? AND flow=? AND seq=?",
                       (r["no"], flow, i)):
                    continue
                conn.execute("INSERT INTO work_role_nodes(role_no,flow,seq,name) VALUES(?,?,?,?)",
                             (r["no"], flow, i, name))
                n["role_nodes"] += 1
        for i, text in enumerate(r.get("进阶", [])):
            level = ("初级", "中级", "高阶")[min(i, 2)]
            if not one(conn, "SELECT id FROM work_role_ladder WHERE role_no=? AND level=?", (r["no"], level)):
                conn.execute("INSERT INTO work_role_ladder(role_no,level,text) VALUES(?,?,?)",
                             (r["no"], level, text)); n["ladder"] += 1
    conn.commit()
    return {"ok": True, **n}


def _ensure(conn):
    if not one(conn, "SELECT id FROM work_roles LIMIT 1"):
        sync(conn, None, {}, {})


@route("GET", P + r"/flows")
def flows(conn, m, body, qs):
    _ensure(conn)
    no = int((qs.get("no") or ["1"])[0] or 1)
    w = next((x for x in WORKS7 if x["no"] == no), None)
    require(w, "工作不存在")
    out = {}
    for flow in FLOW_NAMES:
        rows = q(conn, "SELECT * FROM work_flow_nodes WHERE domain_no=? AND flow=? ORDER BY seq", (no, flow))
        out[flow] = {"节点": rows, "原文": w["flows"][flow]["text"],
                     "系统入口": FLOW_PAGE.get(flow), "节点数": len(rows)}
    return {"work": {"编号": no, "考试类型": w["exam"], "科目": w["subject"],
                     "简称": SHORT[no - 1], "子科目": w["detail"]},
            "七流": out, "流名": FLOW_NAMES}


@route("GET", P + r"/roles")
def roles(conn, m, body, qs):
    _ensure(conn)
    rows = q(conn, "SELECT * FROM work_roles ORDER BY no")
    for r in rows:
        r["进阶级数"] = one(conn, "SELECT COUNT(*) n FROM work_role_ladder WHERE role_no=?", (r["no"],))["n"]
        r["流节点数"] = one(conn, "SELECT COUNT(*) n FROM work_role_nodes WHERE role_no=?", (r["no"],))["n"]
    return {"items": rows, "总数": len(rows), "流名": FLOW_NAMES}


@route("GET", P + r"/role")
def role_detail(conn, m, body, qs):
    _ensure(conn)
    no = int((qs.get("no") or ["1"])[0] or 1)
    r = one(conn, "SELECT * FROM work_roles WHERE no=?", (no,))
    require(r, "岗位不存在")
    out = {}
    for flow in FLOW_NAMES:
        out[flow] = [x["name"] for x in q(conn,
            "SELECT name FROM work_role_nodes WHERE role_no=? AND flow=? ORDER BY seq", (no, flow))]
    ladder = [{"级别": x["level"], "要求": x["text"]} for x in q(conn,
        "SELECT * FROM work_role_ladder WHERE role_no=? ORDER BY id", (no,))]
    related = ROLE_WORK_MAP.get(no, [])
    return {"岗位": r, "七流": out, "能力进阶": ladder,
            "关联工作": [{"编号": x["no"], "简称": SHORT[x["no"] - 1], "科目": x["subject"]}
                      for x in WORKS7 if x["no"] in related]}


# 岗位 → 调研表工作编号（按对应考试科目近似关联）
ROLE_WORK_MAP = {1: [1, 5, 6], 2: [7, 3], 3: [10, 4], 4: [2, 8, 11], 5: [5, 9, 12]}


@route("GET", P + r"/controls")
def controls(conn, m, body, qs):
    """管控流：岗位分离与审批控制点 → 系统现有控制能力"""
    _ensure(conn)
    items = []
    for w in WORKS7:
        for name in w["flows"]["管控流"]["chain"]:
            items.append({"工作": SHORT[w["no"] - 1], "控制点": name,
                          "系统支撑": _control_mapping(name)})
    return {"items": items, "总数": len(items),
            "系统控制能力": ["制单/审核职责分离（separate_duties）", "凭证二级审核", "期末结账审批",
                          "RBAC 角色权限", "审计哈希链防篡改", "敏感操作单独标记", "安全中心默认只观测"]}


def _control_mapping(text):
    if re.search(r"不相容|岗位分离|印鉴分管", text): return "已支撑：职责分离 + RBAC"
    if re.search(r"审批|授权|复核|审核", text): return "已支撑：审批状态机 + 分级授权"
    if re.search(r"监盘|盘点|清查", text): return "部分支撑：现金盘点/资产台账"
    if re.search(r"内控|风险|质量", text): return "部分支撑：内控闭环 + 风险清单"
    return "待建：纳入后续合规轮次"


@route("GET", P + r"/compliance")
def compliance(conn, m, body, qs):
    """合规流：法规依据清单 → 系统对应检查点"""
    _ensure(conn)
    laws = set()
    for w in WORKS7:
        for t in w["flows"]["合规流"]["chain"]:
            for law in re.findall(r"《[^》]+》", t):
                laws.add(law)
            for law in re.findall(r"[\u4e00-\u9fa5]{2,8}(?:法|准则|规范|办法|条例)", t):
                laws.add(law)
    return {"法规": sorted(laws), "数量": len(laws),
            "系统检查点": [{"检查点": "凭证合规体检", "页面": "vcheck"},
                        {"检查点": "内控合规", "页面": "compliance"},
                        {"检查点": "审计哈希链", "页面": "audit"},
                        {"检查点": "税务申报测算", "页面": "tax_center"},
                        {"检查点": "合规义务倒计时", "页面": "legal_center"}],
            "说明": "合规流为法规要求清单，系统提供检查点，不替代法定审核与签署"}


@route("GET", P + r"/dashboard")
def dashboard(conn, m, body, qs):
    _ensure(conn)
    return {"七流": FLOW_NAMES, "工作数": len(WORKS7),
            "岗位数": len(ROLES),
            "流节点": one(conn, "SELECT COUNT(*) n FROM work_flow_nodes")["n"],
            "岗位流节点": one(conn, "SELECT COUNT(*) n FROM work_role_nodes")["n"],
            "进阶梯度": one(conn, "SELECT COUNT(*) n FROM work_role_ladder")["n"],
            "说明": "表2 定义工作要跑通哪 7 条流；表3 定义谁、按什么能力级别跑"}
