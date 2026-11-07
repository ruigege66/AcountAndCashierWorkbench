-- 001_init.sql  初始账套结构
CREATE TABLE IF NOT EXISTS subjects (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '资产',       -- 资产/负债/权益/成本/损益
  direction TEXT NOT NULL DEFAULT '借',        -- 余额方向
  is_cash INTEGER NOT NULL DEFAULT 0,
  is_bank INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS counterparties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT '客户',           -- 客户/供应商/员工/其他
  enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bank_name TEXT,
  account_no TEXT,
  currency TEXT NOT NULL DEFAULT 'CNY',
  opening_balance REAL NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS periods (
  period TEXT PRIMARY KEY,                    -- YYYY-MM
  status TEXT NOT NULL DEFAULT 'open',        -- open/closed
  closed_at TEXT,
  closed_by TEXT
);
CREATE TABLE IF NOT EXISTS openings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_kind TEXT NOT NULL,                 -- cash/bank
  bank_account_id INTEGER,
  amount REAL NOT NULL DEFAULT 0,
  period TEXT NOT NULL,
  UNIQUE(account_kind, bank_account_id, period)
);
CREATE TABLE IF NOT EXISTS docs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_no TEXT NOT NULL UNIQUE,
  doc_type TEXT NOT NULL,                     -- payment/receipt/advance/reimbursement
  doc_date TEXT NOT NULL,
  period TEXT NOT NULL,
  amount REAL NOT NULL,
  account_kind TEXT NOT NULL DEFAULT 'cash', -- cash/bank
  bank_account_id INTEGER,
  subject_code TEXT NOT NULL,
  project_id INTEGER,
  counterparty_id INTEGER,
  applicant TEXT,
  dept TEXT,
  reason TEXT,
  advance_id INTEGER,                         -- 报销关联的借款单
  status TEXT NOT NULL DEFAULT 'draft',       -- draft/submitted/approved/rejected/settled/cleared
  voucher_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_no TEXT NOT NULL UNIQUE,
  voucher_date TEXT NOT NULL,
  period TEXT NOT NULL,
  voucher_type TEXT NOT NULL DEFAULT '付',    -- 收/付/转
  summary TEXT,
  maker TEXT,
  status TEXT NOT NULL DEFAULT 'draft',       -- draft/submitted/approved/posted/void
  source_doc_id INTEGER,
  created_at TEXT NOT NULL,
  posted_at TEXT
);
CREATE TABLE IF NOT EXISTS voucher_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_id INTEGER NOT NULL,
  line_no INTEGER NOT NULL,
  summary TEXT,
  subject_code TEXT NOT NULL,
  project_id INTEGER,
  counterparty_id INTEGER,
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  FOREIGN KEY(voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_date TEXT NOT NULL,
  period TEXT NOT NULL,
  account_kind TEXT NOT NULL,                 -- cash/bank
  bank_account_id INTEGER,
  direction TEXT NOT NULL,                    -- in/out
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  summary TEXT,
  subject_code TEXT,
  project_id INTEGER,
  counterparty_id INTEGER,
  voucher_id INTEGER,
  voucher_line_id INTEGER,
  doc_id INTEGER,
  recon_status TEXT NOT NULL DEFAULT '未核对', -- 未核对/已核对/已调节
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bank_statements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  statement_date TEXT NOT NULL,
  bank_account_id INTEGER,
  description TEXT,
  amount_in REAL NOT NULL DEFAULT 0,
  amount_out REAL NOT NULL DEFAULT 0,
  matched_journal_id INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS daily_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_date TEXT NOT NULL,
  account_kind TEXT NOT NULL,
  bank_account_id INTEGER,
  counted_amount REAL NOT NULL,
  note TEXT,
  UNIQUE(check_date, account_kind, bank_account_id)
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  detail TEXT
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
