-- 015 V2.14 四流需求中枢 + 高阶核算（幂等）
-- 调研表 11 科目 × 4 流结构化
CREATE TABLE IF NOT EXISTS competency_domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT, exam_type TEXT NOT NULL, subject TEXT NOT NULL,
  data_flow TEXT, value_flow TEXT, workflow TEXT, exec_flow TEXT, created_at TEXT, UNIQUE(exam_type, subject)
);
CREATE TABLE IF NOT EXISTS competency_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, domain_id INTEGER NOT NULL, seq INTEGER NOT NULL,
  name TEXT NOT NULL, status TEXT NOT NULL DEFAULT '缺失',
  system_ref TEXT, note TEXT, UNIQUE(domain_id, seq)
);
-- 高阶核算资产与业务台账
CREATE TABLE IF NOT EXISTS adv_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, code TEXT NOT NULL,
  name TEXT NOT NULL, cost REAL NOT NULL DEFAULT 0, start_period TEXT, life_months INTEGER DEFAULT 0,
  residual REAL DEFAULT 0, fair_value REAL, method TEXT DEFAULT '成本模式',
  status TEXT DEFAULT '在用', note TEXT, created_at TEXT, UNIQUE(kind, code)
);
CREATE TABLE IF NOT EXISTS adv_inventory_moves (
  id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT NOT NULL, item_code TEXT NOT NULL,
  direction TEXT NOT NULL, qty REAL NOT NULL, unit_cost REAL NOT NULL, created_at TEXT
);
CREATE TABLE IF NOT EXISTS adv_leases (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, start_period TEXT NOT NULL,
  months INTEGER NOT NULL, payment REAL NOT NULL, rate REAL NOT NULL, created_at TEXT
);
CREATE TABLE IF NOT EXISTS adv_revenue_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, amount REAL NOT NULL,
  performance_obligation TEXT, timing TEXT DEFAULT '时点', created_at TEXT
);
CREATE TABLE IF NOT EXISTS adv_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, period TEXT NOT NULL,
  summary TEXT, amount REAL NOT NULL DEFAULT 0, subject_code TEXT, status TEXT DEFAULT '已记录', created_at TEXT
);
CREATE TABLE IF NOT EXISTS adv_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, kind TEXT NOT NULL,
  inputs_json TEXT, result_json TEXT, created_at TEXT
);
-- 工作流闭环（预算/投融资/内控/税务稽查）
CREATE TABLE IF NOT EXISTS adv_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, title TEXT NOT NULL,
  amount REAL DEFAULT 0, owner TEXT, due_date TEXT, stage INTEGER DEFAULT 0,
  status TEXT DEFAULT '进行中', note TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS adv_workflow_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT, wf_id INTEGER NOT NULL, seq INTEGER NOT NULL,
  name TEXT NOT NULL, status TEXT DEFAULT '待办', done_at TEXT,
  UNIQUE(wf_id, seq)
);
INSERT OR IGNORE INTO settings(key,value) VALUES
 ('adv_discount_rate','0.10'), ('adv_tax_rate','0.25'), ('adv_inventory_method','FIFO'),
 ('adv_risk_free','0.025'), ('adv_market_return','0.08'), ('adv_beta','1.0');
