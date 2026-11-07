-- 003_indexes.sql  查询性能优化索引
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal(journal_date);
CREATE INDEX IF NOT EXISTS idx_journal_period ON journal(period);
CREATE INDEX IF NOT EXISTS idx_journal_voucher ON journal(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vlines_voucher ON voucher_lines(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_period ON vouchers(period);
CREATE INDEX IF NOT EXISTS idx_docs_status ON docs(status);
CREATE INDEX IF NOT EXISTS idx_stmt_matched ON bank_statements(matched_journal_id);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_logs(at);
