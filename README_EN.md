# Journal Pro — Accounting & Cashier Management System

A self-hosted accounting + cashier system covering the full bookkeeping cycle:
**business documents → approval → automatic vouchers → posting → journals → reconciliation → period close → financial statements → business analytics & forecasting**.
Built with the **Python standard library + SQLite only — zero third-party dependencies**, with built-in internal controls (immutable ledger, audit hash chain, maker-checker segregation).

> Version: V2.16 ｜ Front-end/back-end separated (vanilla JS SPA + REST API) ｜ Database: SQLite (WAL) ｜ Tests: 12 suites, 462 assertions + pre-commit + CI
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

### Tax Center (V2.16 — all tax amounts & ratios to 2 decimal places)

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

## Appearance (two light-and-shadow themes)

Click the round **☾ / ☀** button in the top-right corner to switch skins at any time. The preference is stored in the browser and restored on the next visit:

| Theme | Look | Best for |
|---|---|---|
| **Aurora Light** (default) | Soft ambient light blooms, frosted-glass cards, top highlight edges, layered soft shadows, glowing gradient buttons, subtle hover motion | Daytime, long data-entry sessions, screen sharing |
| **Aurora Dark** | Deep ink-blue base with blue-violet / cyan glow, glass cards, glowing active item | Night use, large displays |

- You can also open `http://127.0.0.1:8765/?theme=dark` directly for the dark skin (handy for bookmarking or demos); the URL stays in sync after switching.
- **Reorganised sidebar**: 9 groups following the accounting workflow (today's work → documents & vouchers → cash & period-end → statements & analysis → tax → data & graphs → professional domains → external collaboration → system). Each group has an index and a count; all 65 features remain.
- **Inline explanations**: every page starts with a "function guide" bar that expands to show formulas and data sources; hovering any sidebar item, button, table header or card title pops up its meaning and calculation (53 metric rules + 65 page guides). Hover "tax burden" to see `VAT payable ÷ P&L revenue × 100%`.
- **Atmospheric background**: a barely-there grid, slowly drifting light orbs and stronger frosted-glass blur — translucent and layered, while keeping text legible in both themes.
- **Plain mode (visual effects rolled back)**: the interface was still sluggish, so all decorative visuals are now off — aurora gradients, grid, star dust, glass blur, gradient border, looping animations and hover sheen. The background is a plain colour and cards are simple white panels with a thin border. **No feature was removed**: the 9 sidebar groups, page guide bars, hover formulas, role dropdown and both themes all still work. It is implemented as one `@media screen` override block; delete that block to restore the visual layer. A "plain mode" regression guard prevents decorations from creeping back in.
- **Role dropdown** (👤, top-right): one selection sets both the sidebar feature tier and the operator name written to the audit log. Options: All functions / Cashier & AR-AP / General ledger & tax / CFO. It stays in sync with the sidebar's job-level buttons. The old free-text "operator" field is gone — it was genuinely used by write operations and segregation-of-duties checks, but is now derived from the role so it can't be mistyped.
- Chart ticks and legend labels adapt to the theme automatically. Both skins were verified across all 65 pages — **the features and buttons are identical, only the appearance changes**.
- `前端 11-11a` in the top-right corner is the front-end build tag. If the UI looks wrong or a button does nothing, press **Ctrl+F5** first; an older tag means the browser is serving a cached page.

## 2026 VAT General-Taxpayer Threshold Alert

Under the VAT Law Implementation Regulations effective 2026-01-01, a taxpayer whose cumulative taxable sales in **any consecutive period of up to 12 months** exceed RMB 5 million must register as a general VAT taxpayer (not a calendar-year total).

The system scans rolling 12-month windows of booked operating revenue (posted, non-closing vouchers), cross-checks invoice sales, and reports the gap, an estimated crossing month and the required action. Thresholds, the warning line and the current registration status are configurable in the UI; once registered as general, the alert stops. This status does not change tax-rate calculation settings.

## Tests & Quality Gates

```bash
cd journal-pro
python run_tests.py             # run all 12 regression suites (462 assertions, ~15s)
python run_tests.py core tax    # selected suites only
run_tests.bat                   # Windows double-click
```

Quality gates so future changes cannot silently break behavior:

1. **Pre-commit hook**: after `git config core.hooksPath .githooks`, every `git commit` runs the suites — **a failing regression blocks the commit** (verified; escape hatch: `--no-verify`);
2. **CI**: `.github/workflows/ci.yml` runs all suites on every push / PR (Python 3.10 / 3.12 matrix);
3. All 462 assertions run against throwaway ledgers. See [docs/TESTING.md](docs/TESTING.md).

**Data safety & indexes** (migration 019): the first launch of each day writes a JSON snapshot (24 business tables) to `data/backups/` — atomic write, once per day, keeping the latest 7. No background thread or timer; a failure only prints one line and never blocks startup. The backup directory is gitignored. Two redundant indexes were also removed (a duplicate `journal_date` index and a single-column `vouchers(period)` index already covered by a composite one).

**Loading performance** (no visual changes, no extra runtime repaints): static assets use content-hash ETags, so an unchanged file returns 304 instead of re-downloading 535 KB on every refresh; API responses stay `no-store` so data is never cached. The dashboard's 7 requests now run through `Promise.all` instead of serially. 28 silent empty catches were replaced with a shared `warn()` so swallowed failures leave a console trace.

**Cross-feature linkage tests** (`test_linkage.py`, 100 assertions): the other suites check that a single feature computes correctly; this one checks that changing A actually propagates to B/C/D. It snapshots the output fingerprints of 20 downstream modules, runs one upstream write, snapshots again and diffs them. 18 chains are covered: document approval → settlement → auto voucher → cash journal → statements → ratios → report; invoice → VAT → input certification → payable → surtax → burden ratio; bad-debt/depreciation propagation; negative isolation (rejected/void/over-budget/SoD denials pollute nothing); idempotency; declared impact graph vs. real data flow; and full restoration after clearing demo data.

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

### Seven Flows & Job Roles (V2.16)

The system follows the accounting survey workbooks: **11 jobs × 7 flows (data / fund / workflow / execution / control / value / compliance) × 5 role families × 3 career levels**. Each workbench has seven flow tabs with node chains, system entry points and legal references; the Roles & Career Progression page shows role-specific actions and growth paths. See [Survey_Analysis_EN.md](journal-pro/docs/Survey_Analysis_EN.md).

The home page offers **one-click demo data** (51 records / 30 tables: documents, vouchers, invoices, contracts, audit workpapers, tax, macro, workflows) that can be fully removed afterwards.
