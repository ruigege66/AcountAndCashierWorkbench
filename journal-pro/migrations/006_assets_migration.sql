-- 006_assets_migration.sql  固定资产、折旧、期初建账、损益结转
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT DEFAULT '电子设备',
  purchase_date TEXT NOT NULL,
  original_value REAL NOT NULL,
  salvage_rate REAL NOT NULL DEFAULT 0.05,
  useful_life_months INTEGER NOT NULL DEFAULT 60,
  start_period TEXT NOT NULL,
  accumulated REAL NOT NULL DEFAULT 0,
  expense_subject TEXT DEFAULT '6602',
  dept TEXT,
  status TEXT NOT NULL DEFAULT '在用',
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_depreciations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  amount REAL NOT NULL,
  voucher_id INTEGER,
  created_at TEXT NOT NULL,
  UNIQUE(asset_id, period)
);

CREATE TABLE IF NOT EXISTS opening_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  UNIQUE(period, subject_code)
);

CREATE TABLE IF NOT EXISTS period_closings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'profit',
  voucher_id INTEGER,
  amount REAL,
  created_at TEXT NOT NULL,
  UNIQUE(period, kind)
);

INSERT OR IGNORE INTO subjects (code,name,category,direction) VALUES
 ('1601','固定资产','资产','借'),
 ('1602','累计折旧','资产','贷'),
 ('4103','本年利润','权益','贷'),
 ('4104','利润分配','权益','贷');

INSERT OR IGNORE INTO settings(key,value) VALUES ('asset_expense_subject','6602');
CREATE INDEX IF NOT EXISTS idx_asset_period ON asset_depreciations(period);
CREATE INDEX IF NOT EXISTS idx_opening_period ON opening_balances(period);
