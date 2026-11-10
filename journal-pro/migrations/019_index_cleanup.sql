-- 019 清理重复 / 冗余索引（体检第 4 项）
--
-- 003_indexes.sql 建的 idx_journal_date 与 009_reports_hardening.sql 建的
-- ix_journal_date 完全同列 journal(journal_date)；两个并存只会拖慢写入、
-- 多占空间，查询优化器也只会用其中一个。
-- idx_vouchers_period(period) 是 ix_vouchers_period_status(period, status)
-- 的最左前缀，按 period 过滤可由后者覆盖，属于冗余单列索引。
--
-- 这里统一「先删后建」，保证无论历史账套处于什么状态，最终恰好保留
-- 一条规范的索引；DROP/CREATE 都带 IF 判断，幂等且不动任何数据。

DROP INDEX IF EXISTS idx_journal_date;
DROP INDEX IF EXISTS ix_journal_date;
CREATE INDEX IF NOT EXISTS ix_journal_date ON journal(journal_date);

DROP INDEX IF EXISTS idx_vouchers_period;
CREATE INDEX IF NOT EXISTS ix_vouchers_period_status ON vouchers(period, status);
