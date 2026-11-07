# -*- coding: utf-8 -*-
"""core — 会计领域内核（与 HTTP / 前端完全解耦）。

分层约定（单一数据源 + 显式依赖）：
    context.py    统一账套上下文：一次请求内所有分析共用同一份数据快照
    rules.py      规则引擎 + 功能影响图：所有口径可配置，写操作的下游影响显式声明
    analytics.py  分析服务：全部指标只依赖 Context + Rules，不直接写 SQL 业务口径
    report.py     在线图文报告：把分析结果渲染为零依赖的 HTML/SVG

任何 API 层（server.py / features.py / analytics_api.py）只做参数校验、调用内核、
写审计日志，不再各自实现计算逻辑。这样新增一个分析指标时不会与既有口径打架。
"""
from .context import AccountingContext
from .rules import RuleEngine, ImpactGraph, DEFAULT_RULES
from .analytics import analyze, rule_book
from .report import render_report

__all__ = ["AccountingContext", "RuleEngine", "ImpactGraph", "DEFAULT_RULES",
           "analyze", "rule_book", "render_report"]
