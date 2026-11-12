# Journal Pro — User Manual (English)

> Companion to the Chinese manual `docs/用户手册.md`. Version: V2.9 (schema v11).
> In-app Help Center can switch 中文 / English; the manual API also accepts `?lang=en`.

---

## 1. Overview & Quick Start

Journal Pro is a self-hosted accounting + cashier system. Daily flow:
**business document → approval → automatic voucher → posting → journal → reconciliation → period close → statements → analysis report**.

1. Start: double-click `启动.bat` (Windows) or `python server.py`; open `http://127.0.0.1:8765`.
2. Pick a **role from the top-right dropdown** — it filters the sidebar by job level and sets the operator name recorded in the audit log (the old free-text field is gone).
3. Configure base data: **Base Data** → subjects / projects / counterparties / bank accounts.
4. Record business in **Documents**, approve, then post the generated voucher in **Voucher Management**.
5. At month end: **Period Close** → checklist → carry profit forward → close the period.

All amounts are CNY with two decimals. Statements use posted vouchers + opening balances only.

## 2. Documents & Vouchers

- **Documents** (payment / receipt / advance / reimbursement): submit → approve → settle; settlement auto-creates a voucher and journal rows.
- **Vouchers**: draft → approved → posted. Debit must equal credit; the maker cannot approve or post their own voucher (segregation configurable in System).
- **Red-letter reversal** replaces deletion: reversing vouchers post automatically and the original is voided.
- **Voucher templates** (V2.5): save recurring entries, one-click draft; amounts still validated.
- **Batch posting** (V2.8): Accounting Toolbox → enter IDs → approve/post in one call; failures are listed per voucher.
- **Printing**: Voucher Printing renders A4 landscape pages with the amount in Chinese words and signature strips; leave IDs empty to print the last 10 posted vouchers.
- **Compliance check**: sequence gaps (standard `记-YYYYMM###` only), duplicate numbers, date/period mismatch, posted-but-unbalanced, missing attachments.

## 3. Journals, Cash & Bank

- Cash and each bank account keep their own running balance; posting a voucher with cash/bank lines registers journal rows automatically.
- **Bank reconciliation**: import statements (single entry or batch CSV paste with dedup), auto-match with strict evidence rules, and produce an adjusted balance table.
- **Cash count by denomination** (V2.8): enter note counts → system computes counted total vs book balance and the difference.
- **Notes & bills register** (V2.8): issue/due dates, status flow (held / honored / endorsed / voided), 30-day due alerts.
- **Daily funds report / multi-account balances / cash limit** (V2.8): per-day in/out with cumulative net, per-account balances with total, and an over-limit warning for cash on hand.

## 4. Period Close & Year-End

- **Closing checklist**: 8 checks; blocking items prevent closing.
- **Carry profit forward** moves P&L balances into 4103 (excluded from the income statement via `is_closing`).
- **Year-end carry** (V2.8): posts 4103 → 4104 (profit or loss direction detected automatically); once per fiscal year.
- Reopen a closed period from the same page (audited).

## 5. Invoices, Assets & Partners

- **Invoices**: output/input ledger with duplicate invoice-number check; posting splits tax automatically; unposted invoices alert in the partner ledger.
- **Fixed assets**: cards with straight-line monthly depreciation; capitalize purchases (Dr 1601 / Cr bank) in one click.
- **Partner ledger** (per counterparty): invoices (incl. unposted), payments with voucher numbers, other entries — running balance; positive = receivable, negative = payable. Export confirmation letters to Word/Excel.
- **Collection list** (V2.8): overdue receivables grouped by counterparty with aging level; exportable.

## 6. Financial Statements (V2.4 rigor)

- **Balance sheet**: point-in-time; opening + all posted vouchers; negative balances reclassified (receivable credit → advances received, payable debit → prepayments, tax debit → deductible VAT shown once); fixed-asset lines are display-only; new subjects are auto-included.
- **Income statement**: current month + **current-year cumulative** (calendar-year bounded, closing vouchers excluded), 13-line standard layout, P&L subjects auto-classified.
- **Three articulation checks**: Assets = Liabilities + Equity; cumulative profit = retained earnings; cash-flow net = cash movement.
- Opening balances use the **latest ledger-init on or before the selected period** (never summed across inits).

## 7. Business Analysis Report & Forecast (V2.9)

Open **Data Analysis → Business Analysis Report**, pick a month; everything recalculates. Structure:

1. **Executive summary** — up to 5 data-backed conclusions.
2. **Key metrics table** — current / previous month / same month last year / MoM / YoY.
3. **Profitability** — Figure 1 profit waterfall (revenue → … → net profit), Figure 2 12-month revenue bars + net-profit line.
4. **Solvency / Operation / Cash-flow quality** — structured paragraphs, every sentence backed by current figures, plus ratios (current, quick, cash, debt-to-asset, equity multiplier, gross/net margin, expense ratio, asset & receivable turnover).
5. **Forecast & outlook** — Figure 6 monthly net cash flow (solid = history, dashed = forecast) with the safety-floor line; 3-month revenue/net-profit forecast with ±1σ optimistic/pessimistic bands; 6-month cash balance projection; **runway months** (cash ÷ average monthly outflow); budget execution with year-end extrapolation; **backtest error** against the last actual month.
6. **Risk & concerns**, then appendices: A preparation basis & metric definitions, B articulation, C data lineage, D impact graph.

Notes: tables are in CNY yuan; charts in CNY 10k when totals are large; the report is management-analysis口径 (not an audit opinion); forecasts use linear regression (60%) blended with a 3-month moving average (40%), ±1σ residual band — with fewer than 3 active months the report marks results as indicative only.

Export: open in a new window, download standalone HTML, or print to PDF (A4 styles included).

## 8. Analysis Rules (customizable)

**Data Analysis → Analysis Rules** — changes apply site-wide immediately:

- Liquidity prefixes (non-current assets, current liabilities, non-current liabilities, inventory);
- Cash-flow classification prefixes (longest-prefix match) and handling of unmatched subjects (list separately & warn, or fold into operating);
- Aging basis (`period_end` recommended, or `today`) and bad-debt rates per bucket;
- Healthy ranges (min/max) for all 10 ratios, and health-score weights.

The metric handbook (formula / source / scope / limitation) and the data-lineage table are shown on the same page and in the report appendix.

## 9. Architecture Audit Center (V2.8)

- **AST architecture scan**: file sizes, SQL distribution, dependency edges, cycles, layer violations;
- **Scorecard**: six dimensions (no cycles, layering, module granularity, function granularity, cleanliness, domain purity) with advice — the score honestly reflects remaining debt such as the legacy `server.py`;
- **Route inventory** with match latency; **dependency matrix**; **code smells** (long functions, f-string SQL, bare except, TODO,疑似 hard-coded credentials);
- **Runtime health**: DB size, tables, row counts, migration versions, audit-chain integrity, route count.

## 10. Security Center (V2.8)

- Policies are **observe-only by default**; toggle `enabled` to block high-risk inputs, over-limit requests and requests missing a CSRF token.
- **RBAC**: operators with salted SHA-256 passwords (production: prefer argon2/bcrypt), 4 built-in roles + custom permission matrix.
- **Login sessions**: 8-hour tokens, temporary lockout after repeated failures.
- **Sensitive operations** (delete / reverse / close / permission change) are flagged from the audit log; **rate limiting** and **security events** are viewable; **data masking** preview for account/phone/ID fields.

## 11. Backup & Migration

- **Portable bundle**: System → Download portable bundle (program + DB snapshot + attachments + docs + tests + bundled Python runtime + 启动.bat). Unzip on any machine and double-click.
- **JSON backup**: small daily backup; restore replaces business data.
- Keep `data/journal.db` and `data/attachments/` — that is all your data.
- The financial database and bundles are **not** committed to git (see `.gitignore`).

## 12. FAQ

| Problem | Answer |
|---|---|
| Port already in use | The service is already running — open `http://127.0.0.1:8765`, or stop the old window first. |
| `启动.bat` flashes and closes | Unzip fully first; right-click zip → Properties → Unblock; run `启动（诊断）.bat` and send the output. |
| Voucher won't post | Check debit=credit, period not closed, and maker ≠ approver (segregation). |
| Statement doesn't balance | Run Data self-check (System); usually opening balances missing or an unposted voucher. |
| Articulation #2 mismatch | A P&L voucher is unposted, or a non-P&L subject was used. |
| Forecast looks odd | Fewer than 3 active months — the report labels it indicative; data accumulates over time. |
| Forgot security is on and got blocked | Security Center → set `enabled` to false, then fix inputs. |
| Change port | Windows: `set PORT=9000` before starting; the cover page shows the current port. |

## 13. Efficiency Tips

- `#页面` deep links (e.g. `/#todo`, `/#analysis`) are bookmarkable; the sidebar updates the hash on click.
- Any write operation shows a **data-linkage panel** listing affected downstream analyses.
- Amounts: the analysis report switches between yuan and 10k-yuan automatically; statements are always in yuan.
- Keyboard: Enter in search boxes triggers search; modals close with the mask click.


---

## 30. Guide for Non-Technical Users (no code / no JSON)

Since V2.12, **no workbench shows code or JSON**. Every result is a Chinese table, a labelled info card or a downloadable file.

- Each workbench starts with a **"How to use"** banner and **quick-action buttons** (e.g. Batch Posting, Cash Count, Run Payroll). Click one to jump straight to that card.
- A card = one action: Chinese form fields on top, a **Chinese result table** below. Click the blue button and read the table — column names, amounts (¥ with thousands separators) and statuses (Yes/No, Healthy/Attention, Done/Pending) are all translated automatically.
- "Download file" buttons produce Excel-friendly CSV files; file pickers let you choose a statement downloaded from your bank.

| I want to… | Go to | Action |
|---|---|---|
| Monthly results and balanced books | Financial Statements | Pick a month; all three statements refresh |
| A full business report | Data Analysis → Business Analysis Report | Pick a month → Print to PDF / export HTML |
| Issue invoices in bulk | External Collaboration | Sync pending → download template → upload on the tax portal → enter invoice numbers back here |
| Run payroll & IIT | Tax Center → Run Payroll | Click Execute; the payroll table appears in Chinese |
| Check tax burden | Tax Center → Tax Ratios | Monthly percentages with Low / In range / High labels |
| Count cash | Cashier Workbench → Cash Count | Type note counts; counted total and difference are computed |
| Import a bank statement | External Collaboration → Import Statement | Choose bank format → choose file → Import & dedupe |

Note: always enter through the **left-hand menu**. Typing `/api/...` directly in the address bar shows internal machine data, not a user page. Technical health items are translated into plain Chinese and can be ignored in daily bookkeeping.

### 30.4 Appearance: two light-and-shadow themes

Click the round **☾ / ☀** button in the top-right corner to switch skins. Your choice is stored in the browser and restored on the next visit.

| Theme | Look | Best for |
|---|---|---|
| **Aurora Light** (default) | Soft ambient light blooms, frosted-glass cards, top highlight edges, layered soft shadows, glowing gradient buttons, subtle hover lift | Daytime, long data-entry sessions, screen sharing |
| **Aurora Dark** | Deep ink-blue base with blue-violet / cyan glow, glass cards, glowing active sidebar item | Night use, large displays |

- Open `http://127.0.0.1:8765/?theme=dark` to start in dark mode (handy for bookmarking or demos); the URL stays in sync after switching.
- Chart ticks and legend labels adapt automatically, so figures stay legible in both skins. **All 65 pages and every button behave identically** — only the appearance changes, nothing to re-learn.
- The `前端 11-11d` tag in the top-right corner is the front-end build version. If the UI looks wrong or a button does nothing, press **Ctrl+F5** first; an older tag means the browser is using a cached page.
- Printing automatically hides the sidebar, light blooms and buttons, leaving clean white content.

### 30.4.1 Two top-right controls

- **Role switcher**: opens a card listing four roles (All functions / Cashier & AR-AP / General ledger & tax / CFO), each with a short description. Selecting one updates the sidebar tier and the audit-log operator. Click outside or press Escape to close.
- **Storage**: shows the current database size, row counts for 12 business tables, schema version, local backup count and time, and audit-chain integrity. Data stays on this machine only. A successful database connection is the normal state, so no connection banner is displayed.

### 30.4.2 Exports, claim attachments and going back

- **Exporting data**: System Settings and the top-right Storage panel offer Excel workbook, CSV bundle, standard SQL script and a complete SQLite database file — all openable in Excel, WPS, Navicat or DB Browser.
- **Electronic expense claims**: the Documents list flags reimbursement rows with no attachment. Open the attachment panel to upload, view or download files (Office, WPS, PDF, images, archives; max 20 MB each).
- **Going back**: the header breadcrumb "Home › group › current feature" is clickable, and a "← Back" button follows your browsing history.

### 30.5 Understanding each feature: guide bars and hover tips

Three ways to see what a feature does and how its figures are calculated, without opening a manual:

1. **Guide bar at the top of every page**: a 💡 strip explains the page's purpose. Click "Formula / basis ▾" to expand the data sources, formulas and usage notes. The Financial Ratios page, for example, lists the formulas for the current ratio, net margin and debt ratio.
2. **Hover a sidebar item**: a card pops up with the purpose, what the number means, and the calculation. Group headings also explain what that group covers.
3. **Hover a button, table header or card title**: 53 built-in metric rules match automatically — tax burden, depreciation, VAT payable, NPV, bad debt, current ratio and so on — and show the formula. Dotted underlines mark items that have an explanation.

The sidebar is reorganised into 9 workflow groups, each with an index badge and an item count:
1 Today's work · 2 Documents & vouchers · 3 Cash & period-end · 4 Statements & analysis · 5 Tax · 6 Data & graphs · 7 Legal / audit / regulatory · 8 External collaboration · 9 System & security.

**All 65 features remain** — only the grouping and order changed.

### 30.6 Plain Interface

The visual effects made the browser sluggish, so they are **all switched off** and the interface is back to a clean, plain look:

- Plain background, white cards with a thin border — no grid, aurora, star dust, blur or animation;
- **No feature was removed**: the 9 sidebar groups, the per-page 💡 guide bar, hover formulas, the role dropdown and light/dark themes all still work;
- Scrolling, page switching and data entry are noticeably smoother;
- Printing hides the sidebar and buttons automatically.

The first launch of each day now saves a backup to `data/backups/` (latest 7 kept) automatically — no manual step and no impact on performance.

Loading is faster too: unchanged files are reused from the browser cache and the dashboard fetches its data in parallel.

A single "plain mode" override block in the stylesheet can be deleted to restore the visual layer; a regression guard in `tests/test_frontend.py` prevents decorations from being reintroduced.

---

## 31. V2.13 Interaction Redesign & Four New Domains

**UX**: each of the 10 workbenches is now split into 3 stage tabs (e.g. Tax Center: Daily Filing / Burden & CIT / Payroll & Config), so only a few cards show at once; four core flows (bulk invoicing, monthly tax, month-end closing, contract management) have step-by-step wizards; a global Chinese search box in the sidebar jumps straight to any function; buttons show "processing" and results show success/failure banners.

**Legal**: contract register with expiry alerts, payment milestones capped at contract value, six-item legal review, dispute cases with expected liability (claim × probability), seal authorization, compliance-duty countdown.

**Internal Audit**: annual plan, workpapers, stratified voucher sampling (large items 100%, mid/low random), findings & overdue remediation, confirmations with book-vs-reply differences, balanced adjustment entries.

**Financial Regulatory Accounting**: regulatory filing register, AML pre-screening (large / round-amount / same-day in-out / off-hours — human review required), related-party concentration, regulatory metrics (liquidity, leverage, concentration, provision), ECL 3-stage provisioning, CSV export. Metrics are management estimates, **not official regulatory submissions**.

**Macroeconomic Accounting**: indicator library (CPI/PPI/GDP/FX/rates), constant-price inflation adjustment, industry benchmarking, three-scenario stress testing, FX revaluation with journal suggestion, macro-financial dashboard with elasticity hints.


---

## 32. V2.14 Four-Flow Requirement Model (from the accounting survey workbook)

See `docs/需求差距与四流分析.md` for the full gap analysis. The survey is not a feature list: it maps 11 accounting competency subjects onto **data flow, value flow, workflow and execution flow**. The system had a solid data chain but many knowledge points lacked decision models, closed-loop workflows and executable actions.

Added: a **Four-Flow Requirement Hub** (11 subjects / 203 knowledge points / full four-flow text, coverage matrix, gap list, flow-trace, applicability rulings, phased roadmap); **14 advanced accounting actions**, **11 quantitative finance models** and **4 closed-loop workflow state machines** (44 new endpoints); two Chinese workbench pages.

**Not completed this round** (phased): consolidated statements & business combinations / financial instruments & fair value; full CPA audit suite; all CPA tax categories; strategy & enterprise risk management; multi-entity group architecture (prerequisite for consolidation and cash pooling).


---

## 33. V2.15 Reorganising the System around 11 "Jobs" (Four-Flow Workbenches)

Re-reading the survey by column showed the headers say **"corresponding work"** data/value/work/execution flow: the four columns are four views of **the same job**, not four requirement types. The system is now reorganised accordingly: one row = one job = one workbench; four columns = four tabs; each workflow step is aligned with the data it produces, the action to perform and the existing system screen.

- Sidebar: 11 jobs first; the old function menu is collapsed under "Browse by function".
- Home: "My Work" overview with 11 job cards, step/action counts and live runs.
- Workbench tabs: Data Flow (node chain + system objects), Value Flow (value proposition + metric links), Workflow (step-by-step state machine with "Go to function" buttons), Execution Flow (action table with system entry points).
- Parsed from the workbook: 11 jobs / 64 data nodes / 79 steps / 76 actions. **43 steps are backed by existing functions, 36 are partial or missing** — shown honestly in Chinese labels rather than pretending full coverage.

`tests/test_workmap.py` 14 assertions; 9 suites / 304 assertions total; 12 pages browser-verified.


---

## 34. V2.16 Seven Flows, Job Roles & Demo Data (Surveys 2 and 3)

Full analysis: `docs/三表调研综合分析.md` (Chinese) and `docs/Survey_Analysis_EN.md` (English).

- **Survey 2 extends four flows to seven**: fund flow (payment instructions → bank → cash journal → reconciliation → daily funds report), control flow (segregation of duties, tiered approval, multi-level review, physical counts) and compliance flow (43 extracted legal references). Workbenches now have 7 flow tabs, each rendered as a node chain with system entry points.
- **Survey 3 adds roles and career levels**: 5 role families × 7 flow action lists × junior→mid→senior = 171 role-flow nodes and 15 career requirements; a new "Roles & Career Progression" page.
- **Four-dimensional model**: 11 jobs × 7 flows × 5 roles × 3 levels.
- **Control / compliance APIs** map every control point to existing capabilities and list the system checkpoints for each regulation.
- **Demo data**: one click loads 51 records across 30 tables, all tagged `[演示]` and registered; one-click cleanup deletes by primary key without touching user data or migration defaults.

`tests/test_seven.py` 22 assertions; **10 suites / 326 assertions** pass; migration v17, 321 routes.
