# -*- coding: utf-8 -*-
"""数据库层：SQLite 连接、版本化迁移、基础数据初始化"""
import hashlib
import os
import sqlite3
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE, "data", "journal.db")
MIGRATIONS = os.path.join(BASE, "migrations")


def now():
    return datetime.now().isoformat(timespec="seconds")


def connect():
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def migrate():
    """按文件名顺序执行 migrations/*.sql，用 schema_version 记录已应用版本"""
    conn = connect()
    try:
        conn.execute("""CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)""")
        applied = {r[0] for r in conn.execute("SELECT version FROM schema_version")}
        files = sorted(f for f in os.listdir(MIGRATIONS) if f.endswith(".sql"))
        for f in files:
            version = int(f.split("_")[0])
            if version in applied:
                continue
            sql = open(os.path.join(MIGRATIONS, f), encoding="utf-8").read()
            with conn:
                conn.executescript(sql)
                conn.execute("INSERT INTO schema_version(version, applied_at) VALUES (?,?)",
                             (version, now()))
        # 账套初始设置（幂等）
        with conn:
            conn.execute("INSERT OR IGNORE INTO settings(key,value) VALUES('cash_opening','5000')")
            period = datetime.now().strftime("%Y-%m")
            conn.execute("INSERT OR IGNORE INTO periods(period,status) VALUES(?,'open')", (period,))
            # 只在确实没有该期间的现金期初时插入。
            # 不能只靠 INSERT OR IGNORE：bank_account_id 为 NULL 时 SQLite 的 UNIQUE
            # 不去重，历史上每次启动都会重复插入一行（迁移 009 已加表达式唯一索引并清理）。
            exists = conn.execute(
                """SELECT 1 FROM openings WHERE account_kind='cash'
                   AND bank_account_id IS NULL AND period=? LIMIT 1""", (period,)).fetchone()
            if not exists:
                conn.execute("""INSERT OR IGNORE INTO openings(account_kind,bank_account_id,amount,period)
                                VALUES('cash',NULL,5000,?)""", (period,))
        # 老账套的审计日志补建哈希链（仅在存在缺失时执行一次）
        if conn.execute("SELECT COUNT(*) FROM audit_logs WHERE hash IS NULL").fetchone()[0]:
            repair_audit_chain(conn)
        return [r[0] for r in conn.execute("SELECT version FROM schema_version ORDER BY version")]
    finally:
        conn.close()


def q(conn, sql, args=()):
    return [dict(r) for r in conn.execute(sql, args).fetchall()]


def one(conn, sql, args=()):
    r = conn.execute(sql, args).fetchone()
    return dict(r) if r else None


def audit(conn, action, entity, entity_id=None, detail=None, actor="系统"):
    """审计日志与业务写入同一事务；每条记录带前序哈希，形成防篡改链"""
    at = now()
    prev = conn.execute("SELECT hash FROM audit_logs ORDER BY id DESC LIMIT 1").fetchone()
    prev_hash = prev[0] if prev and prev[0] else ""
    eid = str(entity_id) if entity_id is not None else ""
    payload = f"{at}|{actor}|{action}|{entity}|{eid}|{detail or ''}"
    h = hashlib.sha256((prev_hash + payload).encode("utf-8")).hexdigest()
    conn.execute(
        """INSERT INTO audit_logs(at,actor,action,entity,entity_id,detail,prev_hash,hash)
           VALUES(?,?,?,?,?,?,?,?)""",
        (at, actor, action, entity, eid, detail, prev_hash or None, h))


def _audit_payload(r):
    return (f"{r['at']}|{r['actor'] or ''}|{r['action']}|{r['entity']}|"
            f"{r['entity_id'] or ''}|{r['detail'] or ''}")


def repair_audit_chain(conn):
    """历史审计日志一次性补链：按 id 顺序重建 prev_hash / hash"""
    rows = conn.execute("SELECT * FROM audit_logs ORDER BY id").fetchall()
    prev = ""
    with conn:
        for r in rows:
            h = hashlib.sha256((prev + _audit_payload(r)).encode("utf-8")).hexdigest()
            conn.execute("UPDATE audit_logs SET prev_hash=?,hash=? WHERE id=?", (prev or None, h, r["id"]))
            prev = h


def verify_audit_chain(conn):
    """端到端复算哈希链，返回是否被篡改"""
    rows = conn.execute("SELECT id,at,actor,action,entity,entity_id,detail,prev_hash,hash FROM audit_logs ORDER BY id").fetchall()
    broken, prev = [], ""
    for r in rows:
        expect_prev = r["prev_hash"] or ""
        if expect_prev != prev or r["hash"] != hashlib.sha256((expect_prev + _audit_payload(r)).encode("utf-8")).hexdigest():
            broken.append(r["id"])
        prev = r["hash"] or ""
    return {"total": len(rows), "broken": broken, "intact": not broken}
