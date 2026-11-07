# -*- coding: utf-8 -*-
"""V2.8 架构审计域：6 项功能（AST 静态分析 + 运行时健康）。"""
import ast
import glob
import os
import re
import time
from collections import defaultdict
from datetime import datetime

from app.routing import route, get_router
from .common import q, one, now, r2

P = "/api/v28"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WATCH = ("server", "features", "analytics_api", "db", "office", "core", "app", "analytics_api")
UPPER = ("server", "features", "analytics_api")


def _py_files():
    out = []
    for pattern in ("*.py", "core/*.py", "app/*.py", "app/extensions/*.py"):
        out += [f for f in glob.glob(os.path.join(ROOT, pattern))
                if "__pycache__" not in f and not f.endswith("__init__.py")]
    return sorted(set(out))


def _scan():
    files, edges, violations = [], defaultdict(set), []
    for f in _py_files():
        rel = os.path.relpath(f, ROOT).replace("\\", "/")
        src = open(f, encoding="utf-8").read()
        tree = ast.parse(src)
        me = rel.split("/")[-1][:-3]
        fns = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
        sql = sum(1 for n in ast.walk(tree) if isinstance(n, ast.Constant) and isinstance(n.value, str)
                  and re.search(r"\b(SELECT|INSERT INTO|UPDATE|DELETE FROM)\b", n.value, re.I))
        imports = set()
        for n in ast.walk(tree):
            tg = None
            if isinstance(n, ast.ImportFrom) and n.module:
                tg = n.module.split(".")[0]
            elif isinstance(n, ast.Import):
                for a in n.names:
                    if a.name in WATCH:
                        imports.add(a.name)
            if tg in WATCH:
                imports.add(tg)
        for i in imports:
            edges[me].add(i)
        layer = "domain" if rel.startswith("core/") else ("app" if rel.startswith("app/") else "controller")
        for i in imports:
            if layer == "domain" and i in UPPER:
                violations.append({"file": rel, "rule": "领域层反向依赖传输层", "target": i})
            if layer == "app" and i in ("features", "analytics_api"):
                violations.append({"file": rel, "rule": "应用架构层依赖控制器", "target": i})
        files.append({"file": rel, "layer": layer, "lines": src.count("\n") + 1,
                      "functions": len(fns),
                      "longest": max((n.end_lineno - n.lineno + 1 for n in fns), default=0),
                      "sql": sql, "imports": sorted(imports)})
    cycles = sorted({tuple(sorted((a, b))) for a in edges for b in edges[a] if a in edges.get(b, set())})
    return {"files": files, "edges": {k: sorted(v) for k, v in edges.items()},
            "cycles": [list(c) for c in cycles], "violations": violations}


# ---- 16. AST 架构健康扫描 ----
@route("GET", P + r"/audit/architecture")
def audit_architecture(conn, m, body, qs):
    d = _scan()
    by_layer = defaultdict(lambda: {"files": 0, "lines": 0, "sql": 0})
    for f in d["files"]:
        g = by_layer[f["layer"]]
        g["files"] += 1
        g["lines"] += f["lines"]
        g["sql"] += f["sql"]
    return {"files": d["files"], "by_layer": dict(by_layer),
            "edges": d["edges"], "cycles": d["cycles"], "violations": d["violations"],
            "largest": sorted(d["files"], key=lambda x: -x["lines"])[:8],
            "generated_at": now()}


# ---- 17. 代码异味清单 ----
@route("GET", P + r"/audit/smells")
def audit_smells(conn, m, body, qs):
    issues = []
    for f in _py_files():
        rel = os.path.relpath(f, ROOT).replace("\\", "/")
        src = open(f, encoding="utf-8").read()
        lines = src.splitlines()
        tree = ast.parse(src)
        for n in ast.walk(tree):
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
                length = n.end_lineno - n.lineno + 1
                if length > 80:
                    issues.append({"file": rel, "line": n.lineno, "type": "超长函数",
                                   "detail": f"{n.name} 共 {length} 行（阈值 80）", "level": "warn"})
            if isinstance(n, ast.ExceptHandler) and n.type is None:
                issues.append({"file": rel, "line": n.lineno, "type": "裸 except",
                               "detail": "应捕获具体异常类型", "level": "info"})
            if isinstance(n, ast.JoinedStr) and isinstance(n.values[0], ast.Constant):
                t = str(n.values[0].value or "")
                if re.search(r"\b(SELECT|INSERT INTO|UPDATE|DELETE FROM)\b", t, re.I):
                    issues.append({"file": rel, "line": n.lineno, "type": "动态拼接 SQL",
                                   "detail": t.strip()[:70], "level": "warn"})
        for i, line in enumerate(lines, 1):
            if re.search(r"\b(TODO|FIXME|HACK|XXX)\b", line):
                issues.append({"file": rel, "line": i, "type": "待办标记",
                               "detail": line.strip()[:90], "level": "info"})
            if re.search(r"(password|secret|token)\s*=\s*['\"][^'\"]{6,}", line, re.I):
                issues.append({"file": rel, "line": i, "type": "疑似硬编码凭据",
                               "detail": "请使用环境变量或配置中心", "level": "warn"})
    return {"items": issues, "total": len(issues),
            "warn": sum(1 for x in issues if x["level"] == "warn"),
            "by_type": dict(defaultdict(int, {t: sum(1 for x in issues if x["type"] == t)
                                              for t in {x["type"] for x in issues}}))}


# ---- 18. 接口清单与路由匹配耗时 ----
@route("GET", P + r"/audit/routes")
def audit_routes(conn, m, body, qs):
    r = get_router()
    items = []
    for method, pat, fn in r.routes():
        items.append({"method": method, "pattern": pat.pattern,
                      "handler": fn.__name__, "module": fn.__module__})
    t0 = time.perf_counter()
    for _ in range(200):
        r.match("GET", "/api/health")
    avg = (time.perf_counter() - t0) / 200 * 1000
    groups = defaultdict(int)
    for x in items:
        seg = x["pattern"].strip("^$").split("/")
        groups["/".join(seg[:3])] += 1
    return {"total": len(items), "items": items, "groups": dict(sorted(groups.items(), key=lambda x: -x[1])),
            "match_ms": round(avg, 4), "hint": "match_ms 为 200 次路由查表平均耗时（毫秒）"}


# ---- 19. 依赖矩阵 ----
@route("GET", P + r"/audit/dependency-matrix")
def audit_matrix(conn, m, body, qs):
    d = _scan()
    mods = sorted({f["file"].split("/")[-1][:-3] for f in d["files"]} |
                  {k for k in d["edges"]} | {v for vs in d["edges"].values() for v in vs})
    matrix = [{"module": a, "depends_on": {b: (1 if b in d["edges"].get(a, []) else 0) for b in mods}}
              for a in mods]
    return {"modules": mods, "matrix": matrix, "cycles": d["cycles"],
            "layer_violations": d["violations"]}


# ---- 20. 架构评分卡 ----
@route("GET", P + r"/audit/scorecard")
def audit_scorecard(conn, m, body, qs):
    d = _scan()
    smells = audit_smells(conn, None, {}, {})
    max_lines = max((f["lines"] for f in d["files"]), default=1)
    max_fn = max((f["longest"] for f in d["files"]), default=1)
    dims = [
        {"name": "无循环依赖", "score": 100 if not d["cycles"] else max(0, 100 - 30 * len(d["cycles"])),
         "detail": f"{len(d['cycles'])} 处环"},
        {"name": "分层合规", "score": 100 if not d["violations"] else max(0, 100 - 15 * len(d["violations"])),
         "detail": f"{len(d['violations'])} 处反向依赖"},
        {"name": "模块粒度", "score": max(0, 100 - max(0, max_lines - 400) // 30),
         "detail": f"最大文件 {max_lines} 行"},
        {"name": "函数粒度", "score": max(0, 100 - max(0, max_fn - 60) // 2),
         "detail": f"最长函数 {max_fn} 行"},
        {"name": "代码整洁", "score": max(0, 100 - smells["warn"] * 4),
         "detail": f"{smells['warn']} 处 warn 级异味"},
        {"name": "领域层纯度", "score": 100 - sum(f["sql"] for f in d["files"] if f["layer"] == "domain") * 10,
         "detail": f"领域层 SQL {sum(f['sql'] for f in d['files'] if f['layer'] == 'domain')} 条"},
    ]
    for x in dims:
        x["score"] = max(0, min(100, x["score"]))
    total = round(sum(x["score"] for x in dims) / len(dims))
    advice = [x["detail"] for x in dims if x["score"] < 90]
    return {"score": total, "grade": "A" if total >= 90 else "B" if total >= 75 else "C" if total >= 60 else "D",
            "dimensions": dims, "advice": advice or ["当前无高优先级改进项"], "generated_at": now()}


# ---- 21. 运行时健康 ----
@route("GET", P + r"/audit/runtime")
def audit_runtime(conn, m, body, qs):
    db_path = os.path.join(ROOT, "data", "journal.db")
    tables = [r["name"] for r in q(conn, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
    counts = {}
    for t in ("journal", "vouchers", "voucher_lines", "invoices", "docs", "assets", "audit_logs"):
        try:
            counts[t] = one(conn, f"SELECT COUNT(*) n FROM {t}")["n"]
        except Exception:
            counts[t] = None
    versions = [r["version"] for r in q(conn, "SELECT version FROM schema_version ORDER BY version")]
    from db import verify_audit_chain
    chain = verify_audit_chain(conn)
    return {"db_size_kb": round(os.path.getsize(db_path) / 1024, 1) if os.path.exists(db_path) else 0,
            "tables": len(tables), "table_names": tables, "records": counts,
            "migrations": versions, "routes": len(get_router()),
            "audit_chain": {"total": chain["total"], "intact": chain["intact"]},
            "python": __import__("sys").version.split()[0], "checked_at": now()}
