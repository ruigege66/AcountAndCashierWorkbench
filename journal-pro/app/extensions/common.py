# -*- coding: utf-8 -*-
"""V2.8 控制器共用基础设施（不属于领域层，允许访问 db）。"""
import json
from datetime import datetime, timedelta

from app import facade as _f
from app.errors import ApiError

BASE = "/api/v28"


def now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def today():
    return datetime.now().strftime("%Y-%m-%d")


def r2(x):
    return round(float(x or 0), 2)


def q(conn, sql, args=()):
    return [dict(r) for r in conn.execute(sql, args)]


def one(conn, sql, args=()):
    r = conn.execute(sql, args).fetchone()
    return dict(r) if r else None


def period_of(qs, key="period"):
    return (qs.get(key) or [datetime.now().strftime("%Y-%m")])[0]


def setting(conn, key, default=""):
    r = one(conn, "SELECT value FROM settings WHERE key=?", (key,))
    return r["value"] if r else default


def set_setting(conn, key, value):
    conn.execute("""INSERT INTO settings(key,value) VALUES(?,?)
                    ON CONFLICT(key) DO UPDATE SET value=excluded.value""", (key, str(value)))


def jsetting(conn, key, default):
    try:
        return json.loads(setting(conn, key, ""))
    except (ValueError, TypeError):
        return default


def log(conn, action, entity, eid, detail, actor="系统"):
    from db import audit
    audit(conn, action, entity, eid, detail, actor)


def months_between(a, b):
    ya, ma = int(a[:4]), int(a[5:7])
    yb, mb = int(b[:4]), int(b[5:7])
    return (yb - ya) * 12 + mb - ma + 1


def shift_month(p, n):
    y, mo = int(p[:4]), int(p[5:7])
    t = y * 12 + mo - 1 + n
    return f"{t // 12:04d}-{t % 12 + 1:02d}"


def require(cond, msg):
    if not cond:
        raise ApiError(msg)
