-- 007_monitor_risk.sql  监控大屏与风险预警默认阈值
INSERT OR IGNORE INTO settings(key,value) VALUES
 ('risk_cash_floor','2000'),
 ('risk_bank_floor','10000'),
 ('risk_large_txn','50000'),
 ('risk_safety_months','3'),
 ('risk_recon_days','7'),
 ('risk_budget_warn','80'),
 ('monitor_refresh','10');
