# -*- coding: utf-8 -*-
"""组合根持有的容器：唯一保存全局状态的地方，且可替换（测试可注入假实现）。

区分两种全局：
  旧：模块级 `ROUTES = []`、`TABLES`、各处 `from server import` —— 隐式、不可替换、成环
  新：Container 实例由 bootstrap 一次性装配，组件通过显式注入拿依赖
"""
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from .routing import Router, get_router


@dataclass
class Container:
    router: Router
    legacy: Any = None                     # 遗留模块门面（server 的函数集合）
    report_fns: Dict[str, Any] = field(default_factory=dict)
    ledger_factory: Any = None


_container: Optional[Container] = None


def set_container(c):
    global _container
    _container = c


def get_container():
    """未装配时懒装配，保证测试脚本 `import server; import features` 也能工作。"""
    global _container
    if _container is None:
        from .bootstrap import assemble
        _container = assemble()
    return _container


def peek_container():
    """只读查看，不触发懒装配（组合根用来判断是否已装配）。"""
    return _container


class _Facade:
    """防腐层代理：控制器只依赖 app，不再 import server。

    属性在**访问时**解析到组合根注入的遗留模块，因此导入顺序不会成环；
    生产路径由 bootstrap 显式装配，测试路径才走懒装配。
    """

    def __getattr__(self, name):
        c = get_container()
        if c.legacy is None:
            raise RuntimeError("容器未装配 legacy，请通过 app.bootstrap.start() 启动")
        return getattr(c.legacy, name)

    def __call__(self, *a, **kw):
        raise TypeError("facade 是命名空间代理，不可调用")


facade = _Facade()


def make_ledger(conn):
    """领域层获取账套端口的工厂（SQL 实现在 app.ports，报表实现由容器注入）"""
    from .ports import SqliteLedger
    return SqliteLedger(conn, reports=get_container().report_fns)
