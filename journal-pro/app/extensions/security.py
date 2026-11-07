# -*- coding: utf-8 -*-
"""V2.8 安全域：9 项功能。

设计原则：默认 `security_enabled=0`（只观测、不阻断），保证不破坏现有账套；
在「安全中心」开启后，inspect_request 中间件才会真正拦截请求。
密码用带盐 SHA-256（单机演示；生产应换 argon2/bcrypt）。
"""
import hashlib
import json
import os
import re
import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta

from app.routing import route
from app.errors import ApiError
from .common import q, one, now, setting, set_setting, jsetting, log, require

P = "/api/v28"
RATE = defaultdict(list)
FAILED = defaultdict(list)
TOKENS = {}
CSRF = {}

RISK_PATTERNS = [
    (r"<\s*script|javascript:|onerror\s*=", "XSS 脚本"),
    (r"\b(union\s+select|or\s+1\s*=\s*1|drop\s+table|;\s*--)", "SQL 注入特征"),
    (r"\.\./|\.\\", "路径穿越"),
    (r"(?i)(password|secret|token)\s*[:=]\s*['\"]?[A-Za-z0-9]{12,}", "疑似凭据泄露"),
]
SENSITIVE_ACTIONS = ("删除", "冲销", "作废", "结账", "反结账", "恢复", "备份", "阈值", "规则", "权限", "登录")


def _hash(pwd, salt="journal-pro"):
    return hashlib.sha256((salt + str(pwd)).encode("utf-8")).hexdigest()


def config(conn):
    return {"enabled": setting(conn, "security_enabled", "0") == "1",
            "max_fail": int(setting(conn, "security_max_fail", "5") or 5),
            "lock_minutes": int(setting(conn, "security_lock_minutes", "15") or 15),
            "rate_limit": int(setting(conn, "security_rate_limit", "60") or 60),
            "csrf": setting(conn, "security_csrf", "0") == "1",
            "mask_fields": (setting(conn, "security_mask_fields", "") or "").split(",")}


# ---- 中间件钩子：由 server._dispatch 调用，默认只观测 ----
def inspect_request(conn, method, path, qs, body, client_ip="local", token=None):
    cfg = config(conn)
    text = json.dumps({"path": path, "qs": qs, "body": body}, ensure_ascii=False, default=str)
    hits = [label for pat, label in RISK_PATTERNS if re.search(pat, text, re.I)]
    nowts = time.time()
    RATE[client_ip] = [t for t in RATE[client_ip] if nowts - t < 60]
    RATE[client_ip].append(nowts)
    exceeded = len(RATE[client_ip]) > cfg["rate_limit"]
    blocked, reason = False, ""
    if cfg["enabled"]:
        if exceeded:
            blocked, reason = True, "请求频率超限"
        elif hits and method != "GET":
            blocked, reason = True, "输入包含高风险特征：" + "、".join(hits)
        elif cfg["csrf"] and method in ("POST", "DELETE") and token not in CSRF:
            blocked, reason = True, "缺少有效 CSRF Token"
    if hits or exceeded or blocked:
        conn.execute("""INSERT INTO security_events(at,kind,actor,detail,created_at)
                        VALUES(?,?,?,?,?)""",
                     (now(), "拦截" if blocked else "观测", client_ip,
                      (reason or "、".join(hits) or "频率偏高") + f" [{method} {path}]"[:220], now()))
    return {"block": blocked, "reason": reason, "hits": hits,
            "requests_last_minute": len(RATE[client_ip])}


# ---- 22. 安全配置中心 ----
@route("GET", P + r"/security/config")
def sec_config_get(conn, m, body, qs):
    c = config(conn)
    c["events"] = one(conn, "SELECT COUNT(*) n FROM security_events")["n"]
    c["operators"] = one(conn, "SELECT COUNT(*) n FROM operators")["n"]
    return c


@route("POST", P + r"/security/config")
def sec_config_set(conn, m, body, qs):
    for key, setting_key in (("enabled", "security_enabled"), ("max_fail", "security_max_fail"),
                             ("lock_minutes", "security_lock_minutes"),
                             ("rate_limit", "security_rate_limit"), ("csrf", "security_csrf")):
        if key in body:
            v = body[key]
            set_setting(conn, setting_key, "1" if v is True else "0" if v is False else v)
    if "mask_fields" in body:
        set_setting(conn, "security_mask_fields", ",".join(body["mask_fields"]))
    log(conn, "修改安全配置", "setting", "security", json.dumps(body, ensure_ascii=False)[:200],
        body.get("actor") or "管理员")
    return {"ok": True, "config": config(conn),
            "hint": "开启后中间件会真正拦截高风险输入、超限请求与缺失 CSRF 的请求"}


# ---- 23. 操作员管理 ----
@route("GET", P + r"/security/operators")
def sec_operators(conn, m, body, qs):
    rows = q(conn, "SELECT id,name,role,enabled,created_at FROM operators ORDER BY id")
    return {"items": rows, "roles": [r["name"] for r in q(conn, "SELECT name FROM roles ORDER BY id")]}


@route("POST", P + r"/security/operators")
def sec_operator_add(conn, m, body, qs):
    name, pwd, role = (body.get("name") or "").strip(), body.get("password") or "", body.get("role") or "viewer"
    require(name and pwd, "名称与密码不能为空")
    require(one(conn, "SELECT name FROM roles WHERE name=?", (role,)), "角色不存在")
    try:
        cur = conn.execute("""INSERT INTO operators(name,role,password_hash,enabled,created_at)
                              VALUES(?,?,?,1,?)""", (name, role, _hash(pwd), now()))
    except Exception:
        raise ApiError("操作员已存在")
    log(conn, "新增操作员", "operator", cur.lastrowid, f"{name} / {role}", body.get("actor") or "管理员")
    return {"ok": True, "id": cur.lastrowid, "name": name, "role": role}


# ---- 24. 角色权限矩阵 ----
@route("GET", P + r"/security/roles")
def sec_roles(conn, m, body, qs):
    rows = q(conn, "SELECT * FROM roles ORDER BY id")
    for r in rows:
        try:
            r["permissions"] = json.loads(r["permissions_json"])
        except (ValueError, TypeError):
            r["permissions"] = []
    return {"items": rows,
            "capabilities": ["voucher:*", "voucher:read", "report:*", "report:read",
                             "journal:*", "period:*", "system:*"]}


@route("POST", P + r"/security/roles")
def sec_role_set(conn, m, body, qs):
    name = (body.get("name") or "").strip()
    perms = body.get("permissions") or []
    require(name and isinstance(perms, list), "名称与权限列表不能为空")
    conn.execute("""INSERT INTO roles(name,permissions_json,created_at) VALUES(?,?,?)
                    ON CONFLICT(name) DO UPDATE SET permissions_json=excluded.permissions_json""",
                 (name, json.dumps(perms, ensure_ascii=False), now()))
    log(conn, "修改角色权限", "role", name, ",".join(perms)[:200], body.get("actor") or "管理员")
    return {"ok": True, "name": name, "permissions": perms}


# ---- 25. 会话登录 / 登出 / 校验 ----
@route("POST", P + r"/security/login")
def sec_login(conn, m, body, qs):
    name, pwd = (body.get("name") or "").strip(), body.get("password") or ""
    cfg = config(conn)
    fails = [t for t in FAILED[name] if time.time() - t < cfg["lock_minutes"] * 60]
    FAILED[name] = fails
    if len(fails) >= cfg["max_fail"]:
        raise ApiError("登录失败次数过多，账号已临时锁定")
    op = one(conn, "SELECT * FROM operators WHERE name=? AND enabled=1", (name,))
    if not op or op["password_hash"] != _hash(pwd):
        FAILED[name].append(time.time())
        conn.execute("INSERT INTO security_events(at,kind,actor,detail,created_at) VALUES(?,?,?,?,?)",
                     (now(), "登录失败", name, f"第 {len(FAILED[name])} 次失败", now()))
        raise ApiError("账号或密码错误")
    token = secrets.token_urlsafe(24)
    expires = (datetime.now() + timedelta(hours=8)).strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("INSERT INTO sessions(token,operator_id,created_at,expires_at) VALUES(?,?,?,?)",
                 (token, op["id"], now(), expires))
    TOKENS[token] = {"name": name, "role": op["role"], "expires": expires}
    log(conn, "登录", "session", op["id"], name, name)
    return {"ok": True, "token": token, "name": name, "role": op["role"], "expires_at": expires}


@route("POST", P + r"/security/logout")
def sec_logout(conn, m, body, qs):
    token = body.get("token") or ""
    TOKENS.pop(token, None)
    conn.execute("DELETE FROM sessions WHERE token=?", (token,))
    return {"ok": True}


@route("GET", P + r"/security/session")
def sec_session(conn, m, body, qs):
    token = (qs.get("token") or [""])[0]
    info = TOKENS.get(token)
    if not info:
        return {"valid": False, "active_sessions": len(TOKENS)}
    return {"valid": True, **info, "active_sessions": len(TOKENS)}


# ---- 26. 敏感操作审计统计 ----
@route("GET", P + r"/security/sensitive-ops")
def sec_sensitive(conn, m, body, qs):
    rows = q(conn, "SELECT id,at,actor,action,entity,entity_id,detail FROM audit_logs ORDER BY id DESC LIMIT 2000")
    flagged = [r for r in rows if any(k in (r["action"] or "") for k in SENSITIVE_ACTIONS)]
    by_action = defaultdict(int)
    for r in flagged:
        by_action[r["action"]] += 1
    return {"items": flagged[:200], "count": len(flagged), "by_action": dict(by_action),
            "keywords": list(SENSITIVE_ACTIONS)}


# ---- 27. 限流状态与配置 ----
@route("GET", P + r"/security/rate-limit")
def sec_ratelimit_get(conn, m, body, qs):
    cfg = config(conn)
    ts = time.time()
    return {"limit_per_minute": cfg["rate_limit"],
            "clients": {ip: len([t for t in v if ts - t < 60]) for ip, v in RATE.items()},
            "locked_accounts": {k: len(v) for k, v in FAILED.items() if v}}


@route("POST", P + r"/security/rate-limit")
def sec_ratelimit_set(conn, m, body, qs):
    n = int(body.get("limit") or 60)
    require(1 <= n <= 10000, "每分钟上限须在 1~10000")
    set_setting(conn, "security_rate_limit", n)
    return {"ok": True, "limit": n}


# ---- 28. 输入安全扫描 ----
@route("POST", P + r"/security/scan")
def sec_scan(conn, m, body, qs):
    text = str(body.get("text") or "")
    hits = []
    for pat, label in RISK_PATTERNS:
        for mo in re.finditer(pat, text, re.I):
            hits.append({"type": label, "match": mo.group(0)[:60], "position": mo.start()})
    return {"safe": not hits, "hits": hits,
            "risk": "高" if any("SQL" in h["type"] or "XSS" in h["type"] for h in hits)
                    else "中" if hits else "低"}


# ---- 29. 数据脱敏预览 ----
@route("POST", P + r"/security/masking")
def sec_masking(conn, m, body, qs):
    fields = config(conn)["mask_fields"]
    def mask(v):
        s = str(v or "")
        return s if len(s) <= 4 else s[:2] + "*" * (len(s) - 4) + s[-2:]
    sample = body.get("sample") or {"account_no": "6222021234567890", "phone": "13800138000",
                                    "id_card": "110101199001011234", "name": "甲公司", "amount": 12345.67}
    out = {k: (mask(v) if k in fields else v) for k, v in sample.items()}
    return {"fields": fields, "original": sample, "masked": out,
            "hint": "脱敏字段在安全配置中心设置；导出生效开关由调用方传入"}


# ---- 30. CSRF Token ----
@route("GET", P + r"/security/csrf")
def sec_csrf(conn, m, body, qs):
    token = secrets.token_urlsafe(20)
    CSRF[token] = time.time() + 3600
    CSRF["__last__"] = time.time() + 3600
    return {"token": token, "enabled": config(conn)["csrf"],
            "active": max(0, len(CSRF) - 1), "ttl_seconds": 3600}


# ---- 31. 安全事件日志 ----
@route("GET", P + r"/security/events")
def sec_events(conn, m, body, qs):
    return {"items": q(conn, "SELECT * FROM security_events ORDER BY id DESC LIMIT 200"),
            "count": one(conn, "SELECT COUNT(*) n FROM security_events")["n"]}
