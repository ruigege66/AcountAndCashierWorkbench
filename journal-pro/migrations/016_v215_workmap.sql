-- 016 V2.15 按「工作」重排：四流工作台（幂等）
CREATE TABLE IF NOT EXISTS work_domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT, no INTEGER NOT NULL UNIQUE,
  exam_type TEXT NOT NULL, subject TEXT NOT NULL, short_name TEXT NOT NULL,
  detail TEXT, data_note TEXT, value_text TEXT, work_note TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS work_data_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, domain_no INTEGER NOT NULL, seq INTEGER NOT NULL,
  name TEXT NOT NULL, system_object TEXT, note TEXT, UNIQUE(domain_no, seq)
);
CREATE TABLE IF NOT EXISTS work_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT, domain_no INTEGER NOT NULL, seq INTEGER NOT NULL,
  name TEXT NOT NULL, system_entry TEXT, system_page TEXT,
  coverage TEXT NOT NULL DEFAULT '已支撑', note TEXT, UNIQUE(domain_no, seq)
);
CREATE TABLE IF NOT EXISTS work_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, domain_no INTEGER NOT NULL, seq INTEGER NOT NULL,
  name TEXT NOT NULL, system_entry TEXT, system_page TEXT,
  coverage TEXT NOT NULL DEFAULT '待建', note TEXT, UNIQUE(domain_no, seq)
);
CREATE TABLE IF NOT EXISTS work_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, domain_no INTEGER NOT NULL, title TEXT NOT NULL,
  stage INTEGER DEFAULT 0, status TEXT DEFAULT '进行中', owner TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS work_step_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, run_id INTEGER NOT NULL, seq INTEGER NOT NULL,
  step_name TEXT, action_note TEXT, done_at TEXT, UNIQUE(run_id, seq)
);
