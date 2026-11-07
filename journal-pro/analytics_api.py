# -*- coding: utf-8 -*-
"""V2.6 控制器：分析内核的 HTTP 入口。

这一层只做三件事：解析参数、调用 core、写审计日志。
不含任何计算逻辑 —— 所有口径统一在 core/，改一处全站生效。
"""
from datetime import datetime

from app.routing import route
from app.errors import ApiError
from app import facade as _facade
from core import (RuleEngine, ImpactGraph, analyze, rule_book, render_report)


def _bind(name):
    def call(*args, **kwargs):
        return getattr(_facade, name)(*args, **kwargs)
    call.__name__ = name
    return call


log = _bind("log")
file_result = _bind("file_result")


def period_arg(qs):
    return (qs.get("period") or [datetime.now().strftime("%Y-%m")])[0]


@route("GET", r"/api/reports/analysis")
def analysis_json(conn, m, body, qs):
    """一次返回全部分析数据（在线报告、各页面、导出共用同一份结果）"""
    return analyze(conn, period_arg(qs))


@route("GET", r"/api/reports/analysis\.html")
def analysis_html(conn, m, body, qs):
    """在线图文报告：零外部依赖，可打印为 PDF 或下载独立 HTML"""
    period = period_arg(qs)
    data = analyze(conn, period)
    html = render_report(data, ImpactGraph.graph())
    if (qs.get("download") or [""])[0] == "1":
        return file_result(html.encode("utf-8"), f"经营分析报告_{period}.html",
                           "text/html; charset=utf-8")
    return {"_inline": html, "_ctype": "text/html; charset=utf-8"}


@route("GET", r"/api/analysis/rules")
def rules_get(conn, m, body, qs):
    return RuleEngine(conn).describe()


@route("POST", r"/api/analysis/rules")
def rules_post(conn, m, body, qs):
    patch = body.get("rules") or {}
    try:
        saved = RuleEngine(conn).update(patch)
    except ValueError as e:
        raise ApiError(str(e))
    log(conn, "修改分析规则", "setting", "analysis_rules",
        "、".join(patch.keys()) or "全量", body.get("actor") or "会计")
    return {"ok": True, "rules": saved,
            "hint": "规则已即时生效：现金流量分类、财务比率阈值、账龄基准日与坏账比例全部按新规则重算"}


@route("POST", r"/api/analysis/rules/reset")
def rules_reset(conn, m, body, qs):
    rules = RuleEngine(conn).reset()
    log(conn, "重置分析规则", "setting", "analysis_rules", "恢复默认", body.get("actor") or "会计")
    return {"ok": True, "rules": rules}


@route("GET", r"/api/analysis/rulebook")
def rulebook_get(conn, m, body, qs):
    """计算规则说明书：公式、数据源、口径、局限、数据血缘"""
    return rule_book(conn)


@route("GET", r"/api/analysis/graph")
def graph_get(conn, m, body, qs):
    g = ImpactGraph.graph()
    g["actions"] = ImpactGraph.all_actions()
    return g


@route("GET", r"/api/analysis/impacts")
def impacts_get(conn, m, body, qs):
    action = (qs.get("action") or [""])[0]
    if action:
        return ImpactGraph.impact(action)
    return {"items": [ImpactGraph.impact(a) for a in
                      [x["id"] for x in ImpactGraph.all_actions()]]}
