-- 018 演示数据可清理：让账本防篡改触发器识别「[演示]」标记
--
-- 背景（由跨功能联动测试发现）：演示数据 seed 会生成「已过账凭证 → 分录 → 出纳流水」
-- 这一整条链，而 005_governance.sql 的两个防删触发器是无条件 RAISE，
-- 导致「清空演示数据」只删掉 42/48 条：残留 4 条已过账分录 + 2 条出纳流水。
-- 这些残留数据会继续进入科目余额表、现金流量表与三大报表，污染用户账套。
--
-- 规则不变：真实业务数据依旧严格禁止删除/修改，更正必须走红字冲销。
-- 仅允许清理功能删除带 [演示] 标记的演示数据（MARK 定义见 demo_seed.py）。
-- SQLite 的 LIKE 只有 % 与 _ 两个通配符，方括号按字面匹配。

DROP TRIGGER IF EXISTS trg_journal_no_delete;
CREATE TRIGGER trg_journal_no_delete BEFORE DELETE ON journal
WHEN COALESCE(OLD.summary, '') NOT LIKE '[演示]%'
BEGIN SELECT RAISE(ABORT, '已登记日记账不可删除，更正请使用红字冲销'); END;

DROP TRIGGER IF EXISTS trg_vline_no_delete;
CREATE TRIGGER trg_vline_no_delete BEFORE DELETE ON voucher_lines
WHEN (SELECT status FROM vouchers WHERE id = OLD.voucher_id) = 'posted'
 AND COALESCE((SELECT summary FROM vouchers WHERE id = OLD.voucher_id), '') NOT LIKE '[演示]%'
BEGIN SELECT RAISE(ABORT, '已过账凭证分录不可删除'); END;
