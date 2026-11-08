# -*- coding: utf-8 -*-
"""V2.14 四流需求中枢：把会计调研表 11 科目 × 子科目 × 数据流/价值流/工作流/执行流
完整结构化入库，提供覆盖度、缺口、四流追溯与适用性判定。

设计意图：调研表的四列不是注释，而是需求模型的四个维度——
数据流 = 数据从哪来/加工/输出；价值流 = 为什么做；工作流 = 流程闭环；执行流 = 具体动作。
系统功能必须能从任一维度反查到另外三个维度，避免「只做查询台账、不做决策与执行」的断流。
"""
import re

from app.routing import route
from .common import q, one, now, r2, require

P = "/api/v28/competency"

# 会计调研.xlsx Sheet1 第 2-12 行，A/B/C/D/E/F/G 列全文（第 13 行为来源标注）
SURVEY = [
    ("中级会计职称", "中级会计实务",
     "资产核算：存货、固定资产、无形资产、投资性房地产、长期股权投资、金融资产与金融负债、资产减值\n"
     "负债权益：应付职工薪酬、借款费用、或有事项、债务重组、所有者权益、政府补助\n"
     "损益核算：收入、所得税、非货币性资产交换、租赁\n"
     "会计调整：会计政策/估计变更与差错更正、资产负债表日后事项、外币折算\n"
     "报告与特殊主体：个别财务报表、合并财务报表、政府会计、民间非营利组织会计",
     "原始业务单据（发票、出入库单、合同等）→记账凭证→明细分类账→总分类账→科目余额表→单体/合并财务报表；数据从业务端采集，经会计加工后输出为标准化财务信息",
     "通过权责发生制完整反映企业财务状况、经营成果与现金流量，为内部管理、纳税申报、外部融资提供基础财务数据，是财务价值的底层载体",
     "业务单据收集→制单录入→凭证审核→记账过账→期末计提/摊销/结转→对账→结账→财务报表编制；企业账务核算的标准闭环流程",
     "编制会计分录、计提折旧/摊销/减值、结转成本损益、对账调账、编制三大报表、合并报表抵消分录编制、纳税调整基础核算"),
    ("中级会计职称", "财务管理",
     "基础工具：货币时间价值、风险与收益、全面预算管理\n筹资管理：筹资方式、资本成本、杠杆效应、资本结构、衍生工具筹资\n"
     "投资管理：项目投资决策、证券投资、基金投资\n营运与成本：营运资金管理（现金、应收、存货）、本量利分析、标准成本、责任成本\n"
     "分配与评价：收入与分配管理、财务指标分析、杜邦分析体系",
     "财务报表数据+业务经营数据→财务指标测算→预算编制数据→投融资测算模型→成本核算数据→绩效评价数据；数据从核算层提取，经加工形成管理决策数据",
     "将财务数据转化为经营决策支撑，优化资金效率、控制成本、提升投资回报率、匹配最优资本结构，直接服务于企业盈利与价值增长",
     "预算编制→执行监控→差异分析；筹资/投资方案测算→方案评审→落地执行→效果复盘；成本核算→成本分析→成本管控；绩效指标设定→考核评价",
     "编制全面预算、测算资本成本与投资净现值、制定信用政策与存货管控方案、成本差异分析、杜邦分析、股利分配方案测算"),
    ("中级会计职称", "经济法",
     "市场主体法：公司法律制度、合伙企业法律制度、物权法律制度\n交易法律：合同法律制度（总则+分则）\n"
     "金融法律：票据、证券、保险法律制度\n财税法律：增值税法律制度、企业所得税法律制度\n"
     "其他：反垄断与反不正当竞争、知识产权、政府采购",
     "合同文本→主体资质信息→交易条款数据→涉税交易数据→合规校验数据；法律与涉税数据从业务端流入，经合规校验后反馈至业务与财务端",
     "保障企业经营合法合规、规避法律与税务风险、维护企业权益、优化税务成本，为业务开展提供合规边界与风险兜底",
     "合同合规审核→主体设立/变更/注销流程→税务核算与申报流程→纠纷维权流程；贯穿业务事前、事中、事后的全流程合规管控",
     "合同条款合法性审核、工商登记与章程制定、票据合规校验、增值税/企业所得税申报、税务优惠适用判断、法律纠纷证据梳理"),
    ("高级会计职称", "高级会计实务（开卷案例，侧重高阶管理）",
     "战略管理：企业战略与财务战略、数字化财务转型\n预算管理：全面预算管理、滚动预算、预算绩效\n"
     "投融资与并购：投资决策、融资决策、集团资金管理、企业并购重组\n成本与绩效：目标成本、作业成本、生命周期成本、EVA、平衡计分卡\n"
     "内控与风险：企业内部控制、全面风险管理、金融工具风险\n特殊业务：股权激励、套期会计、金融工具会计\n"
     "行政事业：行政事业单位预算、会计、内控、政府采购",
     "集团级经营数据→战略目标拆解→预算管控数据→投融资并购测算数据→全口径成本数据→绩效评价数据→风险监控数据；覆盖集团全层级、全业务的管理数据链路",
     "站在集团与高管层面，支撑战略落地、资源配置优化、重大投融资决策、风险体系搭建，直接服务于企业顶层价值管理与长期发展",
     "战略制定→目标拆解→全面预算管控；重大投融资/并购立项→尽调→方案设计→审批→落地整合；内控体系搭建→风险评估→监督整改",
     "制定集团财务战略、编制滚动预算、重大投资项目尽调与估值、并购重组方案设计、搭建集团资金池、设计股权激励方案、搭建内控体系、设计平衡计分卡绩效体系"),
    ("注册会计师（CPA）专业阶段", "会计",
     "基础核算：存货、固定资产、无形资产、投资性房地产、负债、所有者权益\n"
     "核心难点：长期股权投资与合营安排、金融工具、收入、所得税、租赁、企业合并\n"
     "特殊交易：非货币性资产交换、债务重组、外币折算、会计差错更正、日后事项、持有待售资产\n"
     "报告披露：财务报表列报、合并财务报表、每股收益、公允价值计量\n特殊主体：政府及民间非营利组织会计",
     "全品类业务交易数据→复杂业务会计判断→明细核算数据→合并抵消数据→合规财务报告数据；覆盖常规到复杂特殊交易的全场景财务数据加工链路",
     "按照会计准则精准核算所有类型交易，输出符合准则的高质量财务信息，保障财务报表公允性与合规性，是资本市场信息披露、审计、投融资的核心价值基础",
     "复杂业务会计判断→账务处理→期末调整→合并报表编制→报表披露→审计对接；覆盖从单体到集团、从日常到特殊业务的全核算流程",
     "复杂金融工具核算、长投权益法/成本法转换、合并报表抵消调整、收入五步法应用、递延所得税核算、使用权资产/租赁负债核算、财务报表附注披露"),
    ("注册会计师（CPA）专业阶段", "审计",
     "审计基础：审计原理、审计计划、审计证据、审计抽样、信息技术审计\n风险导向流程：风险评估、风险应对\n"
     "循环审计：销售与收款、采购与付款、生产与存货、货币资金审计\n"
     "特殊项目：舞弊、法律法规、关联方、持续经营、会计估计审计\n"
     "完成与报告：审计工作完成、审计报告、关键审计事项、内部控制审计\n质量与道德：事务所质量管理、职业道德与独立性",
     "被审计单位财务与业务数据→风险评估数据→审计证据采集→工作底稿记录→审计结论→审计报告；第三方鉴证视角的数据验证与流转链路",
     "独立鉴证财务报表的公允性与合规性，降低资本市场信息不对称，提升财务信息公信力，同时通过内控审计优化企业风控体系",
     "业务承接→初步业务活动→制定审计策略与计划→风险评估→进一步审计程序（控制测试+实质性程序）→特殊事项审计→完成审计→出具报告",
     "设计审计程序、执行函证/监盘/穿行测试/实质性分析、编制审计工作底稿、识别重大错报风险、出具标准/非标准审计报告、执行内控审计、把控审计质量与独立性"),
    ("注册会计师（CPA）专业阶段", "财务成本管理",
     "财务分析：财务报表分析、财务预测、价值评估基础\n长期投融资：资本成本、项目资本预算、期权价值评估、长期筹资、股利分配\n"
     "营运资本：营运资本投资/筹资策略、现金/应收/存货管理\n成本会计：产品成本计算（品种/分批/分步法）、标准成本法、作业成本法\n"
     "管理会计：本量利分析、短期经营决策、全面预算、责任会计、EVA 业绩评价",
     "财务报表数据→财务比率与估值模型→项目投资测算数据→成本精细化核算数据→经营决策模拟数据→责任中心绩效数据；财务数据向经营决策深度转化的链路",
     "通过量化模型优化资本配置、提升投资回报率、精细化成本管控、支撑短期经营决策，构建企业价值量化管理体系，直接驱动盈利与效率提升",
     "财务预测→投融资方案量化评估→成本核算与分析→经营决策模拟→预算与责任考核；贯穿企业资金、成本、决策的全价值管理流程",
     "构建财务估值模型、测算项目净现值/内含报酬率、期权定价计算、产品成本分步法核算、作业成本分摊、盈亏临界点测算、短期经营差量分析、编制弹性预算"),
    ("注册会计师（CPA）专业阶段", "经济法",
     "民事基础：民事法律制度、物权法律制度、合同法律制度\n商事主体：合伙企业、公司法律制度（设立、治理、股权、清算）\n"
     "资本市场：证券发行、交易、上市公司收购、信息披露\n破产与支付：企业破产法律制度、票据与支付结算法律制度\n"
     "其他：反垄断法律制度、涉外经济法律制度",
     "商事主体信息→合同权利义务数据→证券发行交易数据→破产债权数据→票据支付数据→合规性校验数据；覆盖民商事全场景的法律数据流转与校验",
     "为资本市场运作、公司治理、交易安全、破产清算提供法律合规支撑，防范商事法律风险，保障市场交易秩序与企业合法权益",
     "公司设立/治理/重组流程→证券发行与信息披露流程→合同谈判审核流程→破产清算流程→票据结算流程；全商事场景合规管控",
     "公司治理结构设计、公司章程与股东协议审核、证券发行合规判断、上市公司信息披露审核、破产债权申报与清偿、票据权利抗辩、合同违约救济方案制定"),
    ("注册会计师（CPA）专业阶段", "税法",
     "货物劳务税：增值税、消费税、关税、船舶吨税\n所得税：企业所得税、个人所得税、国际税收\n"
     "财产资源税：资源税、环保税、房产税、契税、土地增值税、印花税等 10 余个小税种\n"
     "征管法制：税收征收管理法、税务行政法制、发票管理",
     "交易与收入数据→税种计税依据测算→应纳税额计算→纳税申报数据→税务征管数据→税务筹划数据；覆盖全税种的涉税数据核算、申报与管控链路",
     "精准履行纳税义务、防范税务风险、合法优化税务成本、处理国际税收与复杂涉税事项，保障企业税务合规，实现税负最优",
     "涉税业务核算→税额计算→纳税申报→税款缴纳→税务稽查应对→税务筹划；全税种、全周期的税务管理闭环",
     "增值税进销项核算与申报、企业所得税汇算清缴与纳税调整、个税代扣代缴、土地增值税清算、出口退税办理、国际税收抵免计算、税务稽查应对、合法税务筹划"),
    ("注册会计师（CPA）专业阶段", "公司战略与风险管理",
     "战略分析：PEST 分析、产业环境、竞争环境、企业资源能力、价值链\n"
     "战略选择：总体战略、业务单位战略、职能战略、国际化经营战略\n"
     "战略实施：组织结构、企业文化、战略控制、数字化转型\n风险与内控：风险管理流程、风险理财、内部控制系统",
     "宏观环境数据→行业竞争数据→企业内部资源数据→战略方案评估数据→风险识别评估数据→战略执行监控数据；覆盖企业内外部的战略与风险数据链路",
     "帮助企业识别外部机遇与风险、匹配自身资源制定发展战略、搭建全面风险管理体系，保障企业长期可持续发展与战略目标落地",
     "内外部环境分析→战略制定→战略拆解与落地→执行监控→战略调整；风险识别→评估→应对→监控的全流程风险管理",
     "开展 PEST 与波特五力分析、制定发展与竞争战略、设计组织结构匹配战略、搭建全面风险管理体系、制定风险应对方案、设计内控流程、数字化转型规划"),
    ("注册会计师（CPA）综合阶段", "职业能力综合测试（试卷一+试卷二）",
     "无独立子科目；试卷一整合会计、审计、税法；试卷二整合财管、战略、经济法，侧重跨科目复杂场景综合应用",
     "企业全业务链条数据→跨模块综合判断→复杂问题解决方案输出；全链路、跨领域的综合数据处理",
     "针对企业并购重组、IPO、集团管控等复杂业务提供全维度专业解决方案，支撑企业重大资本运作与合规运营",
     "复杂业务立项→多维度尽调→跨专业方案设计→落地执行→风险把控；重大项目的全流程综合管理",
     "设计并购重组全流程方案、IPO 财务与合规梳理、集团内控与资金体系搭建、重大税务筹划方案、资本市场合规披露"),
]

# 覆盖判定规则（关键词 → 状态 / 系统实现位置）
COVERED = {"固定资产": "assets", "个别财务报表": "server.build_balance_sheet", "合同法律制度": "legal",
           "合同合规审核": "legal.reviews", "增值税": "tax", "企业所得税": "tax", "个人所得税": "tax",
           "印花税": "tax.stamp", "审计计划": "audit_domain.plans", "审计抽样": "audit_domain.sampling",
           "工作底稿": "audit_domain.workpapers", "函证": "audit_domain.confirmations",
           "财务指标分析": "core.analytics", "财务报表分析": "core.analytics", "财务预测": "core.analytics.forecast",
           "现值": "advanced.tvm", "投资净现值": "advanced.npv", "内含报酬率": "advanced.irr",
           "资本成本": "advanced.wacc", "杠杆效应": "advanced.leverage", "杜邦": "advanced.dupont",
           "EVA": "advanced.eva", "本量利": "advanced.cvp", "标准成本": "advanced.variance",
           "作业成本": "advanced.abc", "期权": "advanced.bs", "全面预算管理": "advanced.workflow.budget",
           "存货": "advanced.inventory", "无形资产": "advanced.assets", "投资性房地产": "advanced.assets",
           "长期股权投资": "advanced.equity_method", "金融资产": "advanced.financial_asset",
           "资产减值": "advanced.impairment", "应付职工薪酬": "advanced.payroll_accrual",
           "借款费用": "advanced.borrowing_cost", "或有事项": "legal.cases", "政府补助": "advanced.grant",
           "收入": "advanced.revenue_five_step", "所得税": "tax", "递延所得税": "advanced.deferred_tax",
           "租赁": "advanced.lease", "外币折算": "macro.fx_revaluation", "会计政策/估计变更": "accounting.estimate",
           "差错更正": "advanced.correction", "日后事项": "advanced.subsequent",
           "风险评估": "advanced.workflow.risk", "内部控制系统": "advanced.workflow.control",
           "非货币性资产交换": "advanced.advanced_pending", "债务重组": "advanced.advanced_pending",
           "合并财务报表": "advanced.advanced_pending"}
PARTIAL = {"营运资金管理": "cashier", "应收账款": "aging", "现金": "journal", "预算编制": "budgets",
           "成本核算": "advanced.workflow", "责任成本": "advanced.advanced_pending",
           "所有者权益": "server.build_balance_sheet", "收入与分配管理": "core.analytics",
           "国际税收": "advanced.advanced_pending", "出口退税": "advanced.advanced_pending",
           "税务筹划": "advanced.advanced_pending", "税务稽查应对": "advanced.workflow.audit",
           "公允价值计量": "advanced.advanced_pending", "企业合并": "advanced.advanced_pending",
           "套期会计": "advanced.advanced_pending", "政府及民间非营利组织会计": "不适用"}
NA = {"政府会计": "政府/行政事业主体，与单账套企业会计不同",
      "民间非营利组织会计": "主体性质不同，明确裁剪",
      "行政事业单位预算": "主体性质不同，明确裁剪",
      "政府采购": "属行政事业采购程序，仅保留合规清单",
      "证券发行": "属资本市场程序，仅保留合规检查清单",
      "上市公司收购": "属资本市场程序，仅保留合规检查清单",
      "企业破产法律制度": "属司法程序，仅保留证据归档",
      "涉外经济法律制度": "属司法/涉外程序，仅保留清单",
      "IPO": "属投行业务，仅保留项目档案",
      "集团资金管理": "需多组织架构，列为架构演进项",
      "企业并购重组": "需多组织/合并报表，列为架构演进项",
      "船舶吨税": "适用主体为船舶运营企业，默认不适用"}


def _split_items(detail):
    out = []
    for line in str(detail).splitlines():
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^\d+\.\s*([^：:]+)[：:](.*)$", line)
        group, rest = (m.group(1).strip(), m.group(2)) if m else ("", line)
        parts = [x.strip() for x in re.split(r"[、,，/]", rest) if x.strip()]
        for p in parts:
            name = f"{group}｜{p}" if group else p
            out.append(name)
    return out or [str(detail)]


def _judge(name):
    for k, v in NA.items():
        if k in name:
            return "不适用", v, "主体或业务性质不同，明确裁剪"
    for k, v in COVERED.items():
        if k in name:
            return "已覆盖", v, "已有实现" if "pending" not in v else "本轮新增实现"
    for k, v in PARTIAL.items():
        if k in name:
            return "部分覆盖", v, "仅台账/查询，缺核算或执行动作"
    return "缺失", "—", "待后续轮次补齐"


# ---- 1. 同步调研表到知识图谱（幂等） ----
@route("POST", P + r"/sync")
def sync(conn, m, body, qs):
    n_dom = n_item = 0
    for exam, subject, detail, df, vf, wf, ef in SURVEY:
        row = one(conn, "SELECT id FROM competency_domains WHERE exam_type=? AND subject=?", (exam, subject))
        if row:
            did = row["id"]
        else:
            did = conn.execute("""INSERT INTO competency_domains(exam_type,subject,data_flow,
                value_flow,workflow,exec_flow,created_at) VALUES(?,?,?,?,?,?,?)""",
                (exam, subject, df, vf, wf, ef, now())).lastrowid
            n_dom += 1
        for seq, name in enumerate(_split_items(detail), 1):
            if one(conn, "SELECT id FROM competency_items WHERE domain_id=? AND seq=?", (did, seq)):
                continue
            status, ref, note = _judge(name)
            conn.execute("""INSERT INTO competency_items(domain_id,seq,name,status,system_ref,note)
                VALUES(?,?,?,?,?,?)""", (did, seq, name, status, ref, note))
            n_item += 1
    conn.commit()
    return {"ok": True, "新增科目": n_dom, "新增条目": n_item,
            "总条目": one(conn, "SELECT COUNT(*) n FROM competency_items")["n"]}


def _ensure(conn):
    if not one(conn, "SELECT id FROM competency_domains LIMIT 1"):
        sync(conn, None, {}, {})


# ---- 2. 科目与四流全文 ----
@route("GET", P + r"/domains")
def domains(conn, m, body, qs):
    _ensure(conn)
    return {"items": q(conn, "SELECT * FROM competency_domains ORDER BY id"), "总数": 11}


# ---- 3. 子科目条目 ----
@route("GET", P + r"/items")
def items(conn, m, body, qs):
    _ensure(conn)
    subject = (qs.get("subject") or [""])[0]
    status = (qs.get("status") or [""])[0]
    sql = """SELECT i.*,d.subject,d.exam_type FROM competency_items i
             JOIN competency_domains d ON d.id=i.domain_id WHERE 1=1"""
    args = []
    if subject:
        sql += " AND d.subject=?"; args.append(subject)
    if status:
        sql += " AND i.status=?"; args.append(status)
    return {"items": q(conn, sql + " ORDER BY d.id,i.seq LIMIT 300", args)}


# ---- 4. 覆盖度矩阵 ----
@route("GET", P + r"/coverage")
def coverage(conn, m, body, qs):
    _ensure(conn)
    rows = q(conn, """SELECT d.subject,d.exam_type,i.status,COUNT(*) n FROM competency_items i
        JOIN competency_domains d ON d.id=i.domain_id GROUP BY d.subject,i.status ORDER BY d.id""")
    matrix = {}
    for r in rows:
        matrix.setdefault(r["subject"], {"考试类型": r["exam_type"], "已覆盖": 0, "部分覆盖": 0,
                                         "缺失": 0, "不适用": 0})[r["status"]] = r["n"]
    for v in matrix.values():
        t = v["已覆盖"] + v["部分覆盖"] + v["缺失"] + v["不适用"]
        v["合计"] = t
        v["完整度"] = round((v["已覆盖"] + 0.5 * v["部分覆盖"]) / t * 100, 2) if t else 0
    tot = one(conn, "SELECT COUNT(*) n FROM competency_items")["n"]
    done = one(conn, "SELECT COUNT(*) n FROM competency_items WHERE status='已覆盖'")["n"]
    part = one(conn, "SELECT COUNT(*) n FROM competency_items WHERE status='部分覆盖'")["n"]
    return {"matrix": matrix, "总条目": tot, "已覆盖": done, "部分覆盖": part,
            "缺失": one(conn, "SELECT COUNT(*) n FROM competency_items WHERE status='缺失'")["n"],
            "不适用": one(conn, "SELECT COUNT(*) n FROM competency_items WHERE status='不适用'")["n"],
            "整体完整度": round((done + 0.5 * part) / tot * 100, 2) if tot else 0}


# ---- 5. 缺口清单 ----
@route("GET", P + r"/gaps")
def gaps(conn, m, body, qs):
    _ensure(conn)
    return {"items": q(conn, """SELECT i.name,i.status,i.note,d.subject FROM competency_items i
        JOIN competency_domains d ON d.id=i.domain_id WHERE i.status IN ('缺失','部分覆盖')
        ORDER BY CASE i.status WHEN '缺失' THEN 0 ELSE 1 END,d.id,i.seq LIMIT 300"""),
        "提示": "按分轮计划补齐；每轮结束后重新同步图谱更新覆盖度"}


# ---- 6. 四流追溯（关联性检查） ----
@route("GET", P + r"/flow-trace")
def flow_trace(conn, m, body, qs):
    _ensure(conn)
    subject = (qs.get("subject") or [""])[0]
    if subject:
        doms = q(conn, "SELECT * FROM competency_domains WHERE subject=?", (subject,))
    else:
        doms = q(conn, "SELECT * FROM competency_domains ORDER BY id")
    out = []
    for d in doms:
        it = q(conn, "SELECT status,COUNT(*) n FROM competency_items WHERE domain_id=? GROUP BY status", (d["id"],))
        cnt = {x["status"]: x["n"] for x in it}
        missing = cnt.get("缺失", 0) + cnt.get("部分覆盖", 0)
        out.append({"科目": d["subject"],
                    "数据流": (d["data_flow"] or "")[:40] + "…",
                    "价值流": (d["value_flow"] or "")[:40] + "…",
                    "工作流": (d["workflow"] or "")[:40] + "…",
                    "执行流": (d["exec_flow"] or "")[:40] + "…",
                    "四流是否齐备": "是" if all([d["data_flow"], d["value_flow"], d["workflow"], d["exec_flow"]]) else "否",
                    "未贯通条目": missing,
                    "贯通判定": "贯通" if missing == 0 else ("部分断流" if missing <= 5 else "严重断流"),
                    "数据流全文": d["data_flow"], "价值流全文": d["value_flow"],
                    "工作流全文": d["workflow"], "执行流全文": d["exec_flow"]})
    return {"items": out, "说明": "四流齐备只表示需求描述完整；未贯通条目数表示缺系统执行能力"}


# ---- 7. 适用性判定 ----
@route("GET", P + r"/applicability")
def applicability(conn, m, body, qs):
    _ensure(conn)
    rows = q(conn, "SELECT name,note FROM competency_items WHERE status='不适用' ORDER BY domain_id,seq")
    return {"items": rows, "数量": len(rows),
            "判定原则": "单机企业账套可完整实现核算/模型/合规检查；集团多主体、行政事业、司法与资本市场程序明确裁剪为清单或架构演进项"}


# ---- 8. 汇总 ----
@route("GET", P + r"/dashboard")
def dashboard(conn, m, body, qs):
    _ensure(conn)
    c = coverage(conn, None, {}, {})
    return {"调研科目": 11, "细化条目": c["总条目"], "整体完整度": c["整体完整度"],
            "已覆盖": c["已覆盖"], "部分覆盖": c["部分覆盖"], "缺失": c["缺失"], "不适用": c["不适用"],
            "四流": ["数据流", "价值流", "工作流", "执行流"],
            "分轮计划": ["V2.14 本轮：四流中枢 + 高阶核算/财务模型/工作流闭环",
                       "第2轮：合并报表与企业合并/金融工具/公允价值",
                       "第3轮：CPA 审计全套", "第4轮：CPA 税法全税种",
                       "第5轮：战略与全面风险管理", "架构演进：多组织集团账套"]}
