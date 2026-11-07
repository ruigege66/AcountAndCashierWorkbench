-- 009 报表严谨性与数据防重复
-- 1) 补齐标准损益科目，让利润表具备完整结构（营业成本/税金及附加/营业外收入/所得税）
--    已存在的科目不覆盖，老账套安全
INSERT OR IGNORE INTO subjects(code,name,category,direction,is_cash,is_bank,enabled) VALUES
 ('6401','主营业务成本','损益','借',0,0,1),
 ('6403','税金及附加','损益','借',0,0,1),
 ('6301','营业外收入','损益','贷',0,0,1),
 ('6801','所得税费用','损益','借',0,0,1);

-- 2) 清理启动初始化造成的现金期初重复行
--    原因：openings 原唯一约束含 bank_account_id，SQLite 中 NULL 不参与去重，
--    导致每次启动 INSERT OR IGNORE 都新增一条完全相同的记录
DELETE FROM openings WHERE id NOT IN (
  SELECT MIN(id) FROM openings GROUP BY account_kind, IFNULL(bank_account_id,-1), period
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_openings_once
  ON openings(account_kind, IFNULL(bank_account_id,-1), period);

-- 3) 期初建账同期间同科目防重复（接口本身已先删后插，此处为数据库层保险）
DELETE FROM opening_balances WHERE id NOT IN (
  SELECT MIN(id) FROM opening_balances GROUP BY period, subject_code
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_opening_balances_once
  ON opening_balances(period, subject_code);

-- 4) 报表高频过滤字段索引
CREATE INDEX IF NOT EXISTS ix_vouchers_period_status ON vouchers(period, status);
CREATE INDEX IF NOT EXISTS ix_voucher_lines_subject ON voucher_lines(subject_code);
CREATE INDEX IF NOT EXISTS ix_journal_date ON journal(journal_date);
