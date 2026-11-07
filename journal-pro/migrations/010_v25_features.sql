-- 010 V2.5 扩展功能：凭证模板、报表快照、补充会计科目
CREATE TABLE IF NOT EXISTS voucher_templates (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  summary       TEXT,
  voucher_type  TEXT NOT NULL DEFAULT '转',
  lines_json    TEXT NOT NULL,
  use_count     INTEGER NOT NULL DEFAULT 0,
  created_by    TEXT,
  created_at    TEXT
);

CREATE TABLE IF NOT EXISTS report_snapshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  period      TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT '月度报表',
  note        TEXT,
  data_json   TEXT NOT NULL,
  created_by  TEXT,
  created_at  TEXT
);
CREATE INDEX IF NOT EXISTS ix_snapshots_period ON report_snapshots(period);

-- 现金流量表正表 / 坏账计提 / 筹资投资核算需要用到的标准科目
INSERT OR IGNORE INTO subjects(code,name,category,direction,is_cash,is_bank,enabled) VALUES
 ('1231','坏账准备','资产','贷',0,0,1),
 ('1511','长期股权投资','资产','借',0,0,1),
 ('1604','在建工程','资产','借',0,0,1),
 ('1701','无形资产','资产','借',0,0,1),
 ('2001','短期借款','负债','贷',0,0,1),
 ('2501','长期借款','负债','贷',0,0,1),
 ('6402','其他业务成本','损益','借',0,0,1),
 ('6604','研发费用','损益','借',0,0,1),
 ('6701','资产减值损失','损益','借',0,0,1);

INSERT OR IGNORE INTO settings(key,value) VALUES
 ('bad_debt_rates','{"0-30天":0.01,"31-60天":0.05,"61-90天":0.10,"90天以上":0.30}');
