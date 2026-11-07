-- 013 V2.11 外部系统协同（开票 / 网银）。幂等；绝不存储网银或税局登录凭据。
-- 往来单位补充开票与收款资料
ALTER TABLE counterparties ADD COLUMN tax_id TEXT;
ALTER TABLE counterparties ADD COLUMN invoice_title TEXT;
ALTER TABLE counterparties ADD COLUMN address_phone TEXT;
ALTER TABLE counterparties ADD COLUMN bank_name TEXT;
ALTER TABLE counterparties ADD COLUMN bank_account TEXT;

-- 外部任务队列：开票 / 付款的「待导出 → 已导出 → 已回传」状态机
CREATE TABLE IF NOT EXISTS external_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                 -- invoice | payment
  ref_type TEXT NOT NULL,             -- invoice | doc
  ref_id INTEGER NOT NULL,
  batch_no TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | exported | done | failed
  payload_json TEXT,
  result_json TEXT,
  note TEXT,
  exported_at TEXT, done_at TEXT, actor TEXT, created_at TEXT,
  UNIQUE(kind, ref_type, ref_id)
);
CREATE INDEX IF NOT EXISTS ix_ext_tasks ON external_tasks(kind, status);

-- 银行文件格式模板（批量付款文件 / 对账单字段映射）
CREATE TABLE IF NOT EXISTS bank_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,                 -- payment | statement
  columns_json TEXT NOT NULL,
  delimiter TEXT NOT NULL DEFAULT ',',
  encoding TEXT NOT NULL DEFAULT 'utf-8-sig',
  header_rows INTEGER NOT NULL DEFAULT 1,
  date_format TEXT NOT NULL DEFAULT '%Y-%m-%d',
  created_at TEXT
);

-- 直连配置（仅端点 / 证书路径 / 模式，不含任何密码或令牌）
CREATE TABLE IF NOT EXISTS gateway_config (
  key TEXT PRIMARY KEY, value TEXT, updated_at TEXT
);

INSERT OR IGNORE INTO bank_templates(name,kind,columns_json,delimiter,encoding,header_rows,date_format,created_at) VALUES
 ('通用批量付款','payment','["收款人名称","收款人账号","开户行","金额","用途","备注"]',',','utf-8-sig',1,'%Y-%m-%d','2026-01-01'),
 ('通用对账单','statement','["日期","摘要","收入","支出","余额"]',',','utf-8-sig',1,'%Y-%m-%d','2026-01-01'),
 ('工商银行对账单','statement','["交易日期","摘要","收入金额","支出金额","账户余额"]',',','gbk',1,'%Y-%m-%d','2026-01-01');

INSERT OR IGNORE INTO gateway_config(key,value,updated_at) VALUES
 ('mode','file','2026-01-01'),
 ('tax_api_endpoint','','2026-01-01'),
 ('tax_cert_path','','2026-01-01'),
 ('bank_api_endpoint','','2026-01-01'),
 ('bank_cert_path','','2026-01-01');

INSERT OR IGNORE INTO settings(key,value) VALUES
 ('gateway_default_tax_rate','0.13'),('gateway_invoice_seller','');
