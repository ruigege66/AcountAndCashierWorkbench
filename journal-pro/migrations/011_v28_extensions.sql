-- 011 V2.8 扩展功能表（幂等）
CREATE TABLE IF NOT EXISTS dim_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL,
  dim_key TEXT NOT NULL, dim_value TEXT NOT NULL, created_at TEXT,
  UNIQUE(entity_type, entity_id, dim_key)
);
CREATE INDEX IF NOT EXISTS ix_dim_lookup ON dim_values(dim_key, dim_value);

CREATE TABLE IF NOT EXISTS accruals (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, total_amount REAL NOT NULL,
  start_period TEXT NOT NULL, end_period TEXT NOT NULL,
  expense_subject TEXT NOT NULL DEFAULT '6602', prepaid_subject TEXT NOT NULL DEFAULT '1123',
  status TEXT NOT NULL DEFAULT 'active', created_at TEXT
);
CREATE TABLE IF NOT EXISTS accrual_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, accrual_id INTEGER NOT NULL, period TEXT NOT NULL,
  amount REAL NOT NULL, voucher_id INTEGER, created_at TEXT,
  UNIQUE(accrual_id, period)
);

CREATE TABLE IF NOT EXISTS estimate_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, subject TEXT NOT NULL,
  old_value TEXT, new_value TEXT, reason TEXT, actor TEXT, created_at TEXT
);

CREATE TABLE IF NOT EXISTS cash_counts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, count_date TEXT NOT NULL,
  denominations_json TEXT NOT NULL, total_amount REAL NOT NULL,
  book_amount REAL, diff REAL, note TEXT, actor TEXT, created_at TEXT
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT, bill_no TEXT NOT NULL UNIQUE, kind TEXT NOT NULL,
  amount REAL NOT NULL, issue_date TEXT NOT NULL, due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '持有', counterparty TEXT, note TEXT, created_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_bills_due ON bills(due_date, status);

CREATE TABLE IF NOT EXISTS operators (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'viewer',
  password_hash TEXT, enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT
);
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
  permissions_json TEXT NOT NULL DEFAULT '[]', created_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE, operator_id INTEGER NOT NULL,
  created_at TEXT, expires_at TEXT
);
CREATE TABLE IF NOT EXISTS security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, kind TEXT, actor TEXT, detail TEXT, created_at TEXT
);

INSERT OR IGNORE INTO roles(name, permissions_json, created_at) VALUES
 ('admin','["*"]','2026-01-01'),('accountant','["voucher:*","report:*","period:*"]','2026-01-01'),
 ('cashier','["journal:*","daily:*","recon:*"]','2026-01-01'),('viewer','["report:read"]','2026-01-01');

INSERT OR IGNORE INTO settings(key,value) VALUES
 ('security_enabled','0'),('security_max_fail','5'),('security_lock_minutes','15'),
 ('security_rate_limit','60'),('security_csrf','0'),('security_mask_fields','account_no,phone,id_card'),
 ('numbering_prefix','记-'),('numbering_digits','3'),
 ('cashier_cash_limit','20000'),
 ('approval_tiers','[{"limit":5000,"approver":"会计"},{"limit":50000,"approver":"财务主管"},{"limit":0,"approver":"总经理"}]');
