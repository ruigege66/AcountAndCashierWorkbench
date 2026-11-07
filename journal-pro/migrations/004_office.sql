-- 004_office.sql  Office 导入导出：附件登记与导入日志
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  file_type TEXT,
  size INTEGER,
  stored_path TEXT,
  extracted_text TEXT,
  uploaded_by TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS import_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT,
  target TEXT,
  filename TEXT,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS idx_attach_at ON attachments(created_at);
