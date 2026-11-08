# Survey Workbooks — Integrated Analysis & System Mapping (V2.16)

> Sources: `会计调研.xlsx` (Survey 1, 4 flows), `会计调研2.xlsx` (Survey 2, 7 flows), `会计调研3.xlsx` (Survey 3, job-role view). All cells were read in full; no source file was modified.

## 1. The three workbooks are progressive

| Workbook | Shape | View | Question answered |
|---|---|---|---|
| Survey 1 | 11 rows × 7 cols | Exam subject | Which **4 flows** does a piece of work have: data / value / workflow / execution |
| Survey 2 | 11 rows × 10 cols | Exam subject, detailed | The same work actually runs **7 flows**: **+ fund / control / compliance**; each cell is an executable action chain |
| Survey 3 | 5 rows × 12 cols | **Job role** | **Who** runs the 7 flows, and at which **career level** (junior → mid → senior) |

Survey 2 is a superset and refinement of Survey 1; Survey 3 introduces the executing subject. Together they define a four-dimensional requirement model:

> **11 jobs × 7 flows × 5 role families × 3 career levels**

A function-menu-only information architecture cannot answer this. The system must be able to say, for a given role at a given level doing a given job, where each of the seven flows currently stands, which screen to open, which control applies and which regulation it satisfies.

## 2. What the seven flows mean in the system

| Flow | System mapping |
|---|---|
| Data flow | Business documents → vouchers → ledgers → trial balance → financial statements → advanced accounting |
| **Fund flow (new)** | Cash/bank journals, bank reconciliation, daily funds report, bulk payment files via External Collaboration |
| Workflow | Step state machines in the 11 workbenches |
| Execution flow | 14 advanced accounting actions, Tax Center, period close, External Collaboration |
| **Control flow (new)** | Segregation of duties (`separate_duties`), RBAC, Security Center, internal-control workflow, audit hash chain |
| Value flow | Business analysis report, financial ratios, forecasting, DuPont / EVA / NPV models |
| **Compliance flow (new)** | Voucher compliance check, internal-control compliance, audit chain, tax filing estimates, compliance-duty countdown |

The three new flows matter: fund flow separates "the books are right" from "the money actually moved"; control flow makes "who may do what" a first-class requirement; compliance flow attaches legal basis to each process (the system offers checkpoints, it does not replace statutory approval).

## 3. Job-role dimension

Five role families — Financial Accounting, Audit, Tax Management, Management Accounting, Senior Finance — each with seven flow action lists and three career levels: **171 role-flow nodes and 15 career-level requirements** were parsed. The role page shows core actions per flow, the junior→mid→senior ladder and direct links to related workbenches.

## 4. Coverage and applicability

- Survey 2 yields **564 work-flow nodes** (11 jobs × 7 flows); Survey 3 yields **171 role-flow nodes**.
- 43 of 79 workflow steps are backed by existing functions; control/compliance items such as listed-company disclosure, bankruptcy liquidation and group cash pooling remain partial or unbuilt and are labelled honestly.
- Fully implementable on a single-entity ledger: bookkeeping, cash journals, budgeting models, tax computation, audit workpapers, compliance checkpoints.
- Requires enterprise qualification/signing: bank-enterprise direct connection, e-invoice API, group cash pooling.
- Explicitly out of scope (different entity type): government accounting, non-profit accounting, public-sector budgeting.
- Retained as checklists only (external judicial / capital-market procedures): securities issuance, bankruptcy, IPO underwriting, cross-border litigation.

## 5. Demo data

The home page offers one-click loading of **51 sample records across 30 tables** (documents, vouchers, journals, invoices, contracts, legal reviews, audit workpapers, confirmations, related parties, CPI/PPI, benchmarks, assets, inventory movements, workflows, employees, cash counts, bills, external tasks, accruals and live work-flow runs). Every sample is tagged `[演示]` and registered in `demo_records`; one-click cleanup deletes by primary key and never touches user-entered data or migration defaults (covered by regression tests).

## 6. Verification & roadmap

`tests/test_seven.py` (22 assertions); **10 regression suites / 326 assertions** pass; 12+ pages browser-verified. Remaining phases are documented in `需求差距与四流分析.md` §5: consolidation & business combinations / financial instruments & fair value → full CPA audit suite → all CPA tax categories → strategy & enterprise risk management → multi-entity group architecture.
