# -*- coding: utf-8 -*-
"""app — 应用架构层（组合根 / 路由 / 端口 / 防腐层）。

依赖方向（单向向内，无环）：
    server / features / analytics_api  →  app.routing, app.facade
    core (领域层)                      →  app.ports 抽象
    app                                →  不 import 任何上层模块（只接收注入）
    app.bootstrap (组合根)             →  允许依赖所有模块，唯一装配点
"""
from .routing import Router, route, set_router, get_router
from .container import Container, facade, get_container, set_container, make_ledger
from .ports import LedgerPort, SqliteLedger

__all__ = ["Router", "route", "set_router", "get_router", "Container", "facade",
           "get_container", "set_container", "make_ledger", "LedgerPort", "SqliteLedger"]
