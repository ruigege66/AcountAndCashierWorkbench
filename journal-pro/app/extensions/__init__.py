# -*- coding: utf-8 -*-
"""V2.8 扩展功能集：按业务域分模块，统一 /api/v28/ 命名空间。

遵循 V2.7 的架构约束：控制器只依赖 app.routing / app.facade / app.ports，
不 import server；所有新表经迁移 011，安全策略默认关闭。
"""
