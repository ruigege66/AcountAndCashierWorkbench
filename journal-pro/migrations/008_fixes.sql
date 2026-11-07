-- 008_fixes.sql  结转凭证标记（利润表累计需排除结转分录）+ 历史补标
ALTER TABLE vouchers ADD COLUMN is_closing INTEGER DEFAULT 0;
UPDATE vouchers SET is_closing=1 WHERE summary LIKE '%结转损益%';
