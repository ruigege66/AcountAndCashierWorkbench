-- 012 V2.10 税务域（幂等）。税率与税额计算统一保留两位小数。
CREATE TABLE IF NOT EXISTS tax_filings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT NOT NULL UNIQUE,
  taxpayer_type TEXT NOT NULL DEFAULT 'general',
  sales_ex_tax REAL NOT NULL DEFAULT 0, output_tax REAL NOT NULL DEFAULT 0,
  input_tax REAL NOT NULL DEFAULT 0, input_transfer REAL NOT NULL DEFAULT 0,
  payable REAL NOT NULL DEFAULT 0, surtax_total REAL NOT NULL DEFAULT 0,
  paid REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT
);

CREATE TABLE IF NOT EXISTS tax_input_certs (
  invoice_id INTEGER PRIMARY KEY, cert_status TEXT NOT NULL DEFAULT '待认证',
  cert_period TEXT, created_at TEXT
);

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, dept TEXT,
  base_salary REAL NOT NULL DEFAULT 0, hire_date TEXT, enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS special_deductions (
  employee_id INTEGER PRIMARY KEY,
  children_count INTEGER NOT NULL DEFAULT 0, children_amount REAL NOT NULL DEFAULT 0,
  elderly_amount REAL NOT NULL DEFAULT 0, housing_loan REAL NOT NULL DEFAULT 0,
  rent REAL NOT NULL DEFAULT 0, education REAL NOT NULL DEFAULT 0, medical REAL NOT NULL DEFAULT 0,
  other REAL NOT NULL DEFAULT 0, updated_at TEXT
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT NOT NULL UNIQUE,
  total_gross REAL, total_tax REAL, total_net REAL, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT
);

CREATE TABLE IF NOT EXISTS payroll_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT, run_id INTEGER NOT NULL, employee_id INTEGER NOT NULL,
  gross REAL NOT NULL DEFAULT 0, social_personal REAL NOT NULL DEFAULT 0,
  fund_personal REAL NOT NULL DEFAULT 0, special_total REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0, net REAL NOT NULL DEFAULT 0,
  taxable_cum REAL, UNIQUE(run_id, employee_id)
);

CREATE TABLE IF NOT EXISTS tax_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT NOT NULL, kind TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0, note TEXT, actor TEXT, created_at TEXT
);

INSERT OR IGNORE INTO settings(key,value) VALUES
 ('taxpayer_type','general'),
 ('vat_rates','[0.13,0.09,0.06,0.05,0.03,0.01,0]'),
 ('surtax_city','0.07'),('surtax_edu','0.03'),('surtax_local','0.02'),
 ('cit_rate','0.25'),
 ('cit_small_tiers','[{"limit":3000000,"rate":0.05},{"limit":0,"rate":0.25}]'),
 ('tax_ratio_low','2.00'),('tax_ratio_high','3.50'),
 ('social_employer','{"pension":0.16,"medical":0.08,"unemployment":0.005,"injury":0.002,"maternity":0.008}'),
 ('social_employee','{"pension":0.08,"medical":0.02,"unemployment":0.005}'),
 ('housing_fund_rate','0.12'),
 ('stamp_taxes','[{"name":"购销合同","rate":0.0003},{"name":"产权转移书据","rate":0.0005},{"name":"营业账簿","rate":0.00025},{"name":"借款合同","rate":0.00005}]'),
 ('individual_tax_table','[{"limit":36000,"rate":0.03,"quick":0},{"limit":144000,"rate":0.10,"quick":2520},{"limit":300000,"rate":0.20,"quick":16920},{"limit":420000,"rate":0.25,"quick":31920},{"limit":660000,"rate":0.30,"quick":52920},{"limit":960000,"rate":0.35,"quick":85920},{"limit":0,"rate":0.45,"quick":181920}]');
