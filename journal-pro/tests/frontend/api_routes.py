# -*- coding: utf-8 -*-
"""前端 api() 路径 ↔ 后端路由一致性校验（离线，不依赖服务在跑）。

真实事故：今日工作台「能力图谱完整度」卡片调用 /api/competency/coverage，
后端实际注册的是 /api/v28/competency/coverage，错误被 try/catch 静默吞掉，
卡片长期不显示，用户以为功能坏了。

规则：前端所有字面量 api('/xxx', 'METHOD') 必须能匹配到至少一条后端路由。
动态拼接（含 ${} 或以 / 结尾）跳过，因为路径片段运行时才确定。
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT)


def main():
    import app.bootstrap
    app.bootstrap.start()
    from app.routing import get_router
    routes = get_router().routes()          # [(method, compiled_pattern, fn)]

    calls = {}
    jsdir = os.path.join(ROOT, "public", "js")
    for name in sorted(os.listdir(jsdir)):
        if not name.endswith(".js"):
            continue
        text = open(os.path.join(jsdir, name), encoding="utf-8").read()
        for m in re.finditer(r"api\(\s*['\"](/api/[^'\"?$]+)['\"]\s*(?:,\s*['\"](\w+)['\"])?", text):
            path, method = m.group(1), (m.group(2) or "GET").upper()
            if path.endswith("/") or "$" in path or "{" in path:
                continue                     # 动态拼接，运行时才有完整路径
            calls.setdefault((method, path), set()).add(name)

    def matched(method, path):
        for m, pat, _ in routes:
            if m == method and pat.match(path):
                return True
        return False

    broken = sorted(k for k in calls if not matched(*k))
    print("后端注册路由:", len(routes))
    print("前端字面量 API 调用:", len(calls))
    print("无对应后端路由:", "（无）" if not broken else "")
    for method, path in broken:
        print(f"  ✗ {method} {path}  <- {', '.join(sorted(calls[(method, path)]))}")
    return 0 if not broken else 1


if __name__ == "__main__":
    sys.exit(main())
