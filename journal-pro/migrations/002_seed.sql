-- 002_seed.sql  基础资料种子数据（幂等）
INSERT OR IGNORE INTO subjects (code,name,category,direction,is_cash,is_bank) VALUES
 ('1001','库存现金','资产','借',1,0),
 ('1002','银行存款','资产','借',0,1),
 ('1122','应收账款','资产','借',0,0),
 ('1123','预付账款','资产','借',0,0),
 ('1221','其他应收款','资产','借',0,0),
 ('2202','应付账款','负债','贷',0,0),
 ('2203','预收账款','负债','贷',0,0),
 ('2314','合同负债','负债','贷',0,0),
 ('2221','应交税费','负债','贷',0,0),
 ('6601','销售费用','损益','借',0,0),
 ('6602','管理费用','损益','借',0,0),
 ('6603','财务费用','损益','借',0,0),
 ('6001','主营业务收入','损益','贷',0,0),
 ('6051','其他业务收入','损益','贷',0,0),
 ('6711','营业外支出','损益','借',0,0),
 ('4001','实收资本','权益','贷',0,0);

INSERT OR IGNORE INTO projects (name) VALUES ('日常运营'),('项目A'),('项目B'),('项目C');
INSERT OR IGNORE INTO counterparties (name,kind) VALUES ('A客户','客户'),('B客户','客户'),('甲供应商','供应商'),('乙供应商','供应商'),('张员工','员工');
INSERT OR IGNORE INTO bank_accounts (name,bank_name,account_no,currency,opening_balance) VALUES
 ('基本户','工商银行','6222 **** 1234','CNY',86000);
INSERT OR IGNORE INTO settings (key,value) VALUES ('company_name','本公司'),('cashier','出纳'),('accountant','会计');
