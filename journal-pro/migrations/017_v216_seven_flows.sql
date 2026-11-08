-- 017 V2.16 七流模型（表2）+ 岗位能力维度（表3）+ 演示数据登记（幂等）
CREATE TABLE IF NOT EXISTS work_flow_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, domain_no INTEGER NOT NULL, flow TEXT NOT NULL,
  seq INTEGER NOT NULL, name TEXT NOT NULL, system_entry TEXT, system_page TEXT,
  coverage TEXT DEFAULT '已支撑', note TEXT, UNIQUE(domain_no, flow, seq)
);
CREATE TABLE IF NOT EXISTS work_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT, no INTEGER NOT NULL UNIQUE, name TEXT NOT NULL,
  posts TEXT, exam_subjects TEXT, knowledge TEXT, value_text TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS work_role_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, role_no INTEGER NOT NULL, flow TEXT NOT NULL,
  seq INTEGER NOT NULL, name TEXT NOT NULL, UNIQUE(role_no, flow, seq)
);
CREATE TABLE IF NOT EXISTS work_role_ladder (
  id INTEGER PRIMARY KEY AUTOINCREMENT, role_no INTEGER NOT NULL, level TEXT NOT NULL,
  text TEXT NOT NULL, UNIQUE(role_no, level)
);
CREATE TABLE IF NOT EXISTS demo_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tbl TEXT NOT NULL, row_id INTEGER NOT NULL,
  created_at TEXT, UNIQUE(tbl, row_id)
);
INSERT OR IGNORE INTO settings(key,value) VALUES ('demo_loaded','0');
