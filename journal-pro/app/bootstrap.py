# -*- coding: utf-8 -*-
"""组合根（Composition Root）：整个进程中唯一知道「谁依赖谁」的地方。

启动顺序被显式固定，这正是消除循环依赖的关键：
  1. 创建 Router 实例并注入路由模块
  2. 导入 server（它只依赖 app.routing，不再反向导入控制器）
  3. 把 server 的遗留函数装配进 Container（legacy + report_fns）
  4. 再导入 features / analytics_api 注册剩余路由
  5. 启动 HTTP 服务

旧设计是 server 在模块末尾 import features，而 features 又 from server import ...，
必然成环，只能用 `sys.modules["server"] = sys.modules[__name__]` 打补丁掩盖。
"""
import importlib
import sys

REPORT_FUNCTIONS = (
    "build_balance_sheet", "build_income_statement", "report_articulation",
    "cash_opening_balance", "report_cashflow", "report_aging",
)


def _server_module():
    """识别当前进程里的主程序模块，避免二次导入。

    以 `python3 server.py` 启动时主模块名是 `__main__`；这里只做**识别并注入**，
    不改 sys.modules（旧版靠写别名掩盖循环依赖，会产出两个模块实例）。
    """
    main = sys.modules.get("__main__")
    if main is not None and hasattr(main, "build_balance_sheet") and hasattr(main, "Handler"):
        return main
    return importlib.import_module("server")


def assemble():
    """装配容器（可重复调用，幂等）。"""
    from .routing import get_router
    from .container import Container, set_container, peek_container

    existing = peek_container()
    if existing is not None and existing.legacy is not None:
        return existing

    srv = _server_module()
    c = Container(router=get_router(), legacy=srv,
                  report_fns={name: getattr(srv, name) for name in REPORT_FUNCTIONS})
    set_container(c)
    return c


def start():
    """进程启动入口：装配 + 注册所有控制器 + 返回容器。

    Router 已由脚本入口引导创建（或由 get_router 懒创建），这里**复用**它；
    若再新建实例会丢掉 server 模块导入时已注册的 84 条路由。
    """
    from .routing import get_router
    get_router()
    c = assemble()
    for mod in ("features", "analytics_api",
                "app.extensions.accounting", "app.extensions.cashier",
                "app.extensions.audit", "app.extensions.security", "app.extensions.tax",
                "app.extensions.gateway",
                "app.extensions.legal", "app.extensions.audit_domain",
                "app.extensions.regulation", "app.extensions.macro",
                "app.extensions.competency", "app.extensions.advanced_accounting"):
        importlib.import_module(mod)
    return c
