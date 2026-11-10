# 测试指南 / Testing Guide（中英双语）

> 本项目以「测试不过不能合入」为硬性质量闸门。12 套回归、449 项断言，全部基于临时账套，不影响正式数据。
> Hard quality gate: 10 regression suites / 326 assertions, all against throwaway ledgers.

## 1. 运行 / Running

```bash
cd journal-pro
python run_tests.py             # 全部 5 套 / all 5 suites（~15s）
python run_tests.py core tax    # 指定套件 / selected suites
python run_tests.py --fast      # 跳过最慢套件 / skip the slowest suite
run_tests.bat                   # Windows 双击 / Windows double-click
```

## 2. 套件构成 / Suites

| 套件 Suite | 断言 Assertions | 覆盖 Coverage |
|---|---|---|
| test_reports | 34 | 报表口径（跨年累计、期初不累加、留抵不重复、三大勾稽）+ 接口冒烟 / report rigor + API smoke |
| test_features | 48 | V2.5 全部功能读写与防重复 / all V2.5 features incl. idempotency |
| test_core | 49 | 统一内核：计算精度、规则热更新、影响链、联动传导、在线报告、**迁移 019 索引去重 / 每日备份幂等与保留策略** |
| test_v28 | 47 | V2.8 功能与安全开关（默认只观测）/ V2.8 features & security defaults |
| test_tax | 30 | 税务两位小数精度、个税累计预扣、小微判定、税负率两点控制 / tax precision & IIT |
| test_gateway | 25 | 开票/付款文件桥梁、结果回传查重、多格式对账单、凭据存储拒绝 / external-system bridge |
| test_seven | 22 | 七流/岗位/进阶/管控/合规/演示数据载入与清空 / seven flows & demo data |
| test_workmap | 14 | 11 工作/四流对齐/步骤状态机/断链清单 / four-flow workbenches |
| test_competency | 31 | 四流图谱同步/覆盖度/追溯 + FIFO 计价/权益法/递延税/租赁/杜邦/EVA/BS/工作流闭环 / four-flow hub & advanced models |
| test_linkage | 100 | **跨功能业务联动**：18 组链路 / 20 个下游探针，验证「改 A 是否联动 B/C/D」——单据结算→凭证→出纳流水→三表→比率→报告全链路、税务链、计提链、负向隔离、幂等、影响链声明与真实数据对齐、演示数据清空的完全复原 / cross-feature business linkage |
| test_domains | 31 | 法务/审计/监管/宏观四域：合同超额拦截、或有负债、分层抽样、函证差异、反洗钱、ECL、压力测试、汇率重估 / four domains |
| test_frontend | 18 | 前端完整性：脚本路径干净且文件存在、JS 语法可编译、Sidebar 覆盖全部注册页面与静态兜底（65 条锚点）、整站启动与 21 页渲染无 `undefined`/`NaN`、**所有按钮处理函数已定义且点击可跳转（四视角侧栏）**、**前端 `api()` 路径全部命中后端路由（无静默 404）**、**光影双主题令牌与切换链路完整、主题切换可翻转**、**功能说明体系（65 条页面说明 / 53 条指标规则 / 悬浮真实弹出计算方式）**、**简洁模式**、**ETag 协商缓存 / 首页并行 / 空 catch 清零** / front-end integrity, themes, inline help & motion |

> `test_linkage` 与其余 11 套的分工：其余 11 套验证「单个功能自己算得对」，`test_linkage` 验证「改了 A，B/C/D 是否跟着变、该变的是否都变、不该变的是否没变」。它用 `probe()` 一次采集 20 个下游模块（账簿、三大报表、现金流、比率、同比环比、经营报告、待办、监控大屏、税负率、增值税申报等）的读数指纹，执行一个上游写操作后再采一次，自动求出被联动影响的模块集合。每个场景使用独立临时账套（出纳流水有防删触发器，不能靠 DELETE 重置）。它曾抓到真实缺陷：演示数据清空时 48 条只删掉 42 条，残留流水污染现金流量表，已由迁移 018 修复。

> `test_frontend` 是「打不开」事故的回归闸门：它静态检查 `index.html` 的 `<script src>` 是否还能落到真实文件（曾因版本号替换写坏成 `core.jsO94119821` 导致全部 JS 404、页面永远停在「加载中…」），并检查侧边栏是否覆盖所有已注册页面（防止功能被"藏起来"被误认为被裁剪）。Node 可用时额外用 `tests/frontend/*.js` 真实执行全部前端脚本并渲染页面；Node 缺失时只跳过动态部分，不阻塞提交。

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
