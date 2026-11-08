# Journal Pro — Accounting & Cashier Management System

A self-hosted accounting + cashier system covering the full bookkeeping cycle:
**business documents → approval → automatic vouchers → posting → journals → reconciliation → period close → financial statements → business analytics & forecasting**.
Built with the **Python standard library + SQLite only — zero third-party dependencies**, with built-in internal controls (immutable ledger, audit hash chain, maker-checker segregation).

> Version: V2.13 ｜ Front-end/back-end separated (vanilla JS SPA + REST API) ｜ Database: SQLite (WAL) ｜ Tests: 5 suites, 259 assertions + pre-commit + CI
> 中文文档：[README.md](README.md) ｜ [用户手册.md](journal-pro/docs/用户手册.md)

---

## Feature Overview

### Core Accounting & Cashier

| Module | Description |
|---|---|
| Business documents | Payment requests / receipts / advances / reimbursements; approval auto-generates vouchers |
| Vouchers | Maker-checker segregation, red-letter reversal instead of deletion, debit-credit validation, attachments |
| Journals | Cash & multiple bank accounts, running balances, bank reconciliation with adjusted balance sheet |
| Daily close | Daily income/expense summary with cash-count comparison |
| Fixed assets | Asset cards, straight-line monthly depreciation, one-click provision & capitalization |
| Invoices | Output/input ledger, duplicate check, one-click voucher generation, unposted alerts |
| Budgets | Period + subject + project budgets with overspend blocking |
| Partner ledger | Per-counterparty invoices/payments/entries with running balance, confirmation letters (Word/Excel) |
| Period close | 8-item checklist, profit carry-forward, year-end closing (4103→4104) |

### Efficiency & Analysis Tools (V2.5+)

- **Voucher templates** (one-click apply), **continuous voucher printing** (amount in Chinese words + signature strip), **voucher compliance check** (sequence gaps / duplicates / cross-period)
- **Global search**, **To-do center** (8 auto-aggregated queues), **statement batch import** (preview + dedup)
- **Cash flow statement** (operating / investing / financing), **10 financial ratios + health score**, **YoY & MoM trends**
- **Bad-debt provisioning** (configurable aging rates, duplicate-proof), **collection list**, **report snapshots**

### Workbenches (V2.8, 28 features)

| Workbench | Highlights |
|---|---|
| Accounting toolbox | Auxiliary dimensions, batch posting, multi-period trial balance comparison, amortization, numbering rules, estimate-change log, missing attachments, subject usage analysis |
| Cashier workbench | Cash count by denomination, notes & bills register, multi-account balances, daily funds report, approval tiers, cash-flow forecast, cash limit |
| Architecture audit | AST-based scan, scorecard, route inventory & latency, dependency matrix, code smells, runtime health |
| Security center | RBAC operators & roles, login sessions (lockout), sensitive-op audit, rate limiting, input scanning, data masking, CSRF |

Security policies are **observe-only by default**; enable real blocking in the Security Center.

### Tax Center (V2.13 — all tax amounts & ratios to 2 decimal places)

Output/input VAT ledgers grouped by inferred rate, input certification, VAT filing simulation (idempotent), surtaxes,
**two-point tax-burden control** (below floor = underpayment risk, above ceiling = overpayment; percentages to 2dp),
quarterly CIT prepayment (automatic small-micro bracket), annual settlement with entertainment-expense cap,
payroll with social insurance & **cumulative withholding IIT**, special additional deductions, stamp duty calculator, filing calendar.

### Reports & Forecasting

- **Three statements** (balance sheet / income / cash flow) with negative-balance reclassification and automatic **three-way articulation checks**
- **Online business analysis report**: executive summary, KPI table with YoY/MoM, profit waterfall, four-capability analysis (profitability / solvency / operation / cash-flow quality), balance-sheet structure, risk notes
- **Forecast & outlook**: 3-month revenue / net profit forecast (±1σ band), 6-month cash balance projection, runway months, budget execution with year-end extrapolation, backtest error
- Pure inline-SVG rendering — **works offline**; print to PDF or export standalone HTML
- **Customizable analysis rules**: liquidity mapping, cash-flow classification, ratio thresholds, aging basis — effective site-wide immediately

---

## Architecture

```
app/                        Application layer
 ├─ bootstrap.py            Composition root (single wiring point)
 ├─ routing.py              Router instance (168 routes, injectable)
 ├─ ports.py                LedgerPort protocol + SqliteLedger (single SQL home)
 ├─ container.py            Container + anti-corruption Facade
 └─ extensions/             V2.8 domains (accounting / cashier / audit / security)
core/                       Domain layer (no SQL, no HTTP, no reverse imports)
 ├─ context.py              Unified accounting context (single source of truth)
 ├─ rules.py                Rule engine + impact graph (39 nodes / 55 edges)
 ├─ analytics.py            Analytics & forecasting (every metric self-describes formula/source/scope)
 └─ report.py               Report renderer (pure inline SVG)
server.py                   HTTP adapter + core statement implementations
features.py / analytics_api.py  Thin controllers
public/js/*.js              Front-end in 10 modules (42 registered pages)
tests/                      4 regression suites, 173 assertions
docs/                       User manual (中文 / English), requirements spec, traceability matrix
```

Dependencies point one way only: controllers → `app` abstractions; domain → `LedgerPort`; **zero circular dependencies** (continuously verifiable in the in-app Architecture Audit Center).

---

## Quick Start

```bash
# Option 1: run from source (Python 3.10+, no third-party packages)
cd journal-pro
python server.py            # open http://127.0.0.1:8765

# Option 2: Windows double-click
启动.bat                     # opens the browser automatically; close the window to stop

# Option 3: portable bundle
# System → Download portable bundle (bundles a Python runtime), unzip and double-click 启动.bat
```

Database migrations run automatically on first start (versioned via `schema_version`, currently v11).

## Tests & Quality Gates

```bash
cd journal-pro
python run_tests.py             # run all 7 regression suites (259 assertions, ~10s)
python run_tests.py core tax    # selected suites only
run_tests.bat                   # Windows double-click
```

Quality gates so future changes cannot silently break behavior:

1. **Pre-commit hook**: after `git config core.hooksPath .githooks`, every `git commit` runs the suites — **a failing regression blocks the commit** (verified; escape hatch: `--no-verify`);
2. **CI**: `.github/workflows/ci.yml` runs all suites on every push / PR (Python 3.10 / 3.12 matrix);
3. All 259 assertions run against throwaway ledgers. See [docs/TESTING.md](docs/TESTING.md).

## Documentation

| Document | Description |
|---|---|
| [docs/User_Manual_EN.md](journal-pro/docs/User_Manual_EN.md) | English user manual |
| [docs/用户手册.md](journal-pro/docs/用户手册.md) | 中文用户手册（27 章） |
| [README.md](README.md) | 中文 README |
| [docs/TESTING.md](docs/TESTING.md) | Testing guide (bilingual) |
| docs/会计出纳系统需求规格说明书.md | Requirements specification (R-01 ~ R-80) |
| Online help | In-app Help Center, switchable 中文 / English |

## Security & Privacy

- The financial database, portable bundles and the bundled runtime are **excluded from version control** (see `.gitignore`);
- Audit entries share the transaction with business writes and form a tamper-evident hash chain (`/api/audit/verify`);
- Sensitive operations (delete / reverse / close / permission changes) are flagged and exportable.

## Tech Stack

Python 3.10+ standard library (http.server / sqlite3 / ast / json) · Vanilla JS SPA · Inline SVG charts (no CDN) · Chart.js (monitor dashboard, optional)
