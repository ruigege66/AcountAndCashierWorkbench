# 测试指南 / Testing Guide（中英双语）

> 本项目以「测试不过不能合入」为硬性质量闸门。5 套回归、203 项断言，全部基于临时账套，不影响正式数据。
> Hard quality gate: 5 regression suites / 203 assertions, all against throwaway ledgers.

## 1. 运行 / Running

```bash
cd journal-pro
python run_tests.py             # 全部 5 套 / all 5 suites（~10s）
python run_tests.py core tax    # 指定套件 / selected suites
python run_tests.py --fast      # 跳过最慢套件 / skip the slowest suite
run_tests.bat                   # Windows 双击 / Windows double-click
```

## 2. 套件构成 / Suites

| 套件 Suite | 断言 Assertions | 覆盖 Coverage |
|---|---|---|
| test_reports | 34 | 报表口径（跨年累计、期初不累加、留抵不重复、三大勾稽）+ 接口冒烟 / report rigor + API smoke |
| test_features | 48 | V2.5 全部功能读写与防重复 / all V2.5 features incl. idempotency |
| test_core | 44 | 统一内核：计算精度、规则热更新、影响链、联动传导、在线报告 / unified kernel & integration |
| test_v28 | 47 | V2.8 功能与安全开关（默认只观测）/ V2.8 features & security defaults |
| test_tax | 30 | 税务两位小数精度、个税累计预扣、小微判定、税负率两点控制 / tax precision & IIT |

## 3. 质量闸门 / Quality Gates

### 3.1 提交钩子 / Pre-commit hook

```bash
git config core.hooksPath .githooks   # 一次配置 / one-time setup
git commit ...                        # 自动跑回归；失败则阻止提交
```

- 已验证：制造失败断言时提交被拦截，修复后放行；
- Verified: a deliberately broken assertion blocks the commit; fixing it allows the commit.
- 逃生口 / escape hatch: `git commit --no-verify`（仅限紧急，事后必须补修 / emergencies only, fix afterwards）。

### 3.2 CI / GitHub Actions

`.github/workflows/ci.yml`：每次 push / pull request 自动在 GitHub Actions（Python 3.10 / 3.12 矩阵）运行全部回归。Runs on every push / PR.

### 3.3 手册同步 / Manual sync

新增功能必须同步：中文手册 `docs/用户手册.md`、英文手册 `docs/User_Manual_EN.md`、需求文档 R 编号与跟踪矩阵。
New features must update both manuals, the requirements spec (R-xx) and the traceability matrix.

## 4. 编写规范 / Conventions

- 测试全部使用临时账套（`db.DB_PATH` 指向 tempfile），不碰 `data/journal.db`；
- Suites use a throwaway DB — never touch production data;
- 断言要覆盖「写操作 → 下游影响」的联动（参考 test_core 的联动矩阵）；
- Assert the downstream impact of every write (see test_core integration matrix);
- 金额与税率断言必须校验两位小数精度；
- Monetary & ratio assertions must verify 2-decimal precision;
- 新表结构走迁移脚本（幂等），迁移后 `schema_version` 递增并纳入断言。

## 5. 历史教训 / Lessons Learned（由真实事故沉淀 / distilled from real incidents）

- 留抵进项税重复列示 → 增加「明细合计=报表合计」断言 / duplicated VAT-credit row → added detail-total equality assertion;
- 个税月数误用自然月序号 → 改为「本年已发薪月数」并加跨月衔接断言 / IIT month count bug → payroll-months semantics + cross-month assertion;
- 小微分段排序反了 → 分段查找断言取「最小满足档」/ reversed bracket sort → lowest-matching-bracket assertion;
- 税负率分母混用发票口径与会计口径 → 统一会计收入并固化到断言 / mixed denominators → unified to accounting revenue.
