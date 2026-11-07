# -*- coding: utf-8 -*-
"""路由表：由组合根持有的实例，不再是模块级可变全局。

之前的 `ROUTES = []` + 模块级 `route()` 装饰器让所有控制器必须 import server，
这是 server ↔ features / analytics_api 循环依赖的根源。现在控制器只依赖本模块，
Router 实例由 app.bootstrap 在启动时创建并注入。
"""
import re
import threading


class Router:
    def __init__(self):
        self._routes = []
        self._lock = threading.Lock()

    def route(self, method, pattern):
        def deco(fn):
            with self._lock:
                self._routes.append((method, re.compile("^" + pattern + r"$"), fn))
            return fn
        return deco

    def match(self, method, path):
        for m, pat, fn in self._routes:
            if m != method:
                continue
            mo = pat.match(path)
            if mo:
                return fn, mo
        return None, None

    def routes(self):
        return list(self._routes)

    def __len__(self):
        return len(self._routes)


_router = None
_lock = threading.Lock()


def set_router(router):
    global _router
    with _lock:
        _router = router


def get_router():
    """未装配时懒创建，保证 `import server` 在测试场景下也能注册路由。"""
    global _router
    if _router is None:
        with _lock:
            if _router is None:
                _router = Router()
    return _router


def route(method, pattern):
    """兼容既有装饰器语法：所有控制器统一 `from app.routing import route`。"""
    return get_router().route(method, pattern)
