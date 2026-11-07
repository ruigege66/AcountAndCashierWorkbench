-- 005_governance.sql  内控、发票、预算与账本不可变
ALTER TABLE audit_logs ADD COLUMN prev_hash TEXT;
ALTER TABLE audit_logs ADD COLUMN hash TEXT;
ALTER TABLE vouchers ADD COLUMN reversal_of INTEGER;
ALTER TABLE vouchers ADD COLUMN approved_by TEXT;
ALTER TABLE vouchers ADD COLUMN posted_by TEXT;
ALTER TABLE docs ADD COLUMN approved_by TEXT;
ALTER TABLE attachments ADD COLUMN entity_type TEXT;
ALTER TABLE attachments ADD COLUMN entity_id INTEGER;
ALTER TABLE bank_statements ADD COLUMN match_note TEXT;

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT NOT NULL,
  invoice_code TEXT,
  kind TEXT NOT NULL,                      -- 进项/销项
  invoice_date TEXT NOT NULL,
  period TEXT NOT NULL,
  counterparty_id INTEGER,
  amount REAL NOT NULL,                    -- 不含税金额
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL,
  subject_code TEXT,                       -- 默认入账科目
  project_id INTEGER,
  status TEXT NOT NULL DEFAULT '未入账',   -- 未入账/已入账/已核销/已作废
  voucher_id INTEGER,
  note TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(invoice_no, kind)
);

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  subject_code TEXT,
  project_id INTEGER,
  amount REAL NOT NULL,
  note TEXT,
  UNIQUE(period, subject_code, project_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_budget_period ON budgets(period);

-- 账本不可变：日记账金额/方向/日期/来源凭证不可改，且不可删除（余额重算仅改 balance_after，允许）
CREATE TRIGGER IF NOT EXISTS trg_journal_immutable BEFORE UPDATE ON journal
WHEN OLD.amount <> NEW.amount OR OLD.direction <> NEW.direction
  OR OLD.journal_date <> NEW.journal_date OR OLD.voucher_id IS NOT NEW.voucher_id
BEGIN SELECT RAISE(ABORT, '已登记日记账不可修改，请使用红字冲销'); END;

CREATE TRIGGER IF NOT EXISTS trg_journal_no_delete BEFORE DELETE ON journal
BEGIN SELECT RAISE(ABORT, '已登记日记账不可删除，更正请使用红字冲销'); END;

-- 已过账凭证的分录不可改删
CREATE TRIGGER IF NOT EXISTS trg_vline_immutable BEFORE UPDATE ON voucher_lines
WHEN (SELECT status FROM vouchers WHERE id = OLD.voucher_id) = 'posted'
BEGIN SELECT RAISE(ABORT, '已过账凭证分录不可修改，请使用红字冲销'); END;

CREATE TRIGGER IF NOT EXISTS trg_vline_no_delete BEFORE DELETE ON voucher_lines
WHEN (SELECT status FROM vouchers WHERE id = OLD.voucher_id) = 'posted'
BEGIN SELECT RAISE(ABORT, '已过账凭证分录不可删除'); END;

INSERT OR IGNORE INTO settings(key,value) VALUES ('separate_duties','1');
INSERT OR IGNORE INTO settings(key,value) VALUES ('budget_control','1');
