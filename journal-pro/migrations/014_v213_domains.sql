-- 014 V2.13 法务 / 审计 / 金融监管 / 宏观经济会计（幂等）
-- 法务
CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, contract_no TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
  counterparty_id INTEGER, kind TEXT NOT NULL DEFAULT '采购', amount REAL NOT NULL DEFAULT 0,
  sign_date TEXT, start_date TEXT, end_date TEXT, payment_terms TEXT, owner TEXT,
  status TEXT NOT NULL DEFAULT '执行中', note TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS contract_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT, contract_id INTEGER NOT NULL, due_date TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0, note TEXT, doc_id INTEGER, status TEXT NOT NULL DEFAULT '待付款', created_at TEXT
);
CREATE TABLE IF NOT EXISTS legal_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT, contract_id INTEGER NOT NULL, item TEXT NOT NULL,
  passed INTEGER NOT NULL DEFAULT 0, reviewer TEXT, note TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS legal_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT, case_no TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
  counterparty_id INTEGER, kind TEXT NOT NULL DEFAULT '合同纠纷', claim_amount REAL NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT '一审', probability REAL NOT NULL DEFAULT 0.5,
  provision REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT '进行中', note TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS seal_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT, purpose TEXT NOT NULL, contract_id INTEGER,
  applicant TEXT, approver TEXT, used_at TEXT, status TEXT NOT NULL DEFAULT '待审批', created_at TEXT
);
CREATE TABLE IF NOT EXISTS compliance_duties (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, authority TEXT, due_date TEXT NOT NULL,
  cycle TEXT NOT NULL DEFAULT '年度', status TEXT NOT NULL DEFAULT '待办', owner TEXT, note TEXT, created_at TEXT
);

-- 审计
CREATE TABLE IF NOT EXISTS audit_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT, year TEXT NOT NULL, scope TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT '中', planned_hours REAL DEFAULT 0, auditor TEXT,
  status TEXT NOT NULL DEFAULT '计划中', created_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_workpapers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, plan_id INTEGER, ref TEXT NOT NULL,
  procedure TEXT NOT NULL, sample_size INTEGER DEFAULT 0, exception_count INTEGER DEFAULT 0,
  conclusion TEXT, reviewer TEXT, status TEXT NOT NULL DEFAULT '编制中', created_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, risk_level TEXT NOT NULL DEFAULT '中',
  amount_impact REAL DEFAULT 0, requirement TEXT, owner TEXT, due_date TEXT,
  status TEXT NOT NULL DEFAULT '待整改', rectified_at TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, counterparty_id INTEGER NOT NULL, period TEXT NOT NULL,
  book_balance REAL NOT NULL DEFAULT 0, reply_balance REAL, difference REAL,
  status TEXT NOT NULL DEFAULT '未发函', sent_at TEXT, replied_at TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, finding_id INTEGER, summary TEXT NOT NULL,
  subject_code TEXT NOT NULL, debit REAL DEFAULT 0, credit REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '建议', created_at TEXT
);

-- 金融监管
CREATE TABLE IF NOT EXISTS reg_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, regulator TEXT, cycle TEXT NOT NULL DEFAULT '月度',
  due_date TEXT, status TEXT NOT NULL DEFAULT '待报送', submitted_at TEXT, owner TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS aml_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, rule TEXT NOT NULL, journal_id INTEGER,
  amount REAL, detail TEXT, level TEXT NOT NULL DEFAULT '关注', status TEXT NOT NULL DEFAULT '待核查', created_at TEXT
);
CREATE TABLE IF NOT EXISTS related_parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT, counterparty_id INTEGER NOT NULL UNIQUE,
  relation TEXT NOT NULL, since TEXT, note TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS ecl_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, counterparty_id INTEGER NOT NULL, period TEXT NOT NULL,
  exposure REAL NOT NULL DEFAULT 0, stage INTEGER NOT NULL DEFAULT 1,
  rate REAL NOT NULL DEFAULT 0.01, provision REAL NOT NULL DEFAULT 0, created_at TEXT,
  UNIQUE(counterparty_id, period)
);

-- 宏观经济会计
CREATE TABLE IF NOT EXISTS macro_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT NOT NULL, name TEXT NOT NULL,
  value REAL NOT NULL, unit TEXT, source TEXT, created_at TEXT,
  UNIQUE(period, name)
);
CREATE TABLE IF NOT EXISTS industry_benchmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, industry TEXT NOT NULL, year TEXT NOT NULL,
  gross_margin REAL, debt_ratio REAL, asset_turnover REAL, net_margin REAL, created_at TEXT,
  UNIQUE(industry, year)
);
CREATE TABLE IF NOT EXISTS macro_scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, revenue_delta REAL DEFAULT 0,
  cost_delta REAL DEFAULT 0, rate_delta_bp REAL DEFAULT 0, fx_delta REAL DEFAULT 0,
  note TEXT, created_at TEXT
);

INSERT OR IGNORE INTO macro_scenarios(name,revenue_delta,cost_delta,rate_delta_bp,fx_delta,note,created_at) VALUES
 ('基准情景',0,0,0,0,'维持当前经营与价格水平','2026-01-01'),
 ('乐观情景',0.10,-0.03,-25,0.01,'收入增长10%、成本下降3%、利率下行','2026-01-01'),
 ('悲观情景',-0.15,0.08,50,-0.02,'收入下滑15%、成本上升8%、利率上行','2026-01-01');

INSERT OR IGNORE INTO compliance_duties(name,authority,due_date,cycle,owner,created_at) VALUES
 ('工商年度报告','市场监管局','2026-06-30','年度','行政','2026-01-01'),
 ('企业所得税汇算清缴','税务局','2026-05-31','年度','会计','2026-01-01'),
 ('残保金申报','税务/残联','2026-09-30','年度','人事','2026-01-01');

INSERT OR IGNORE INTO reg_reports(name,regulator,cycle,due_date,owner,created_at) VALUES
 ('大额交易与可疑交易报告','人民银行','月度','2026-11-15','合规','2026-01-01'),
 ('资产负债表与损益表（监管口径）','金融监管总局','季度','2026-12-31','财务','2026-01-01');
