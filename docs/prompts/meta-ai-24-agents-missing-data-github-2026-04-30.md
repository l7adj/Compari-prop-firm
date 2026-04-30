# Meta AI Prompt — 24 Agents for Missing Prop Firm Data

## Context
You are working on a GitHub-hosted prop firm comparison project.

Repository target: `l7adj/Compari-prop-firm`

The project is not a Blogger project and must not be treated as a Blogger/Google Sheets-only workflow. The source of truth is a GitHub repository containing SQL, SQLite/CSV exports, schemas, validation reports, and website/app files.

The goal is to complete missing, uncertain, or low-confidence data for prop firms and produce clean files that can be reviewed, committed, and merged into the GitHub repository.

## Mission
Use 24 specialized agents to complete missing data only. Do not rebuild the project. Do not add new companies. Do not invent values. Do not change schema names, table names, column names, IDs, or relationships unless explicitly required by a documented migration.

## Input files expected
The user may provide these files or equivalent repository paths:

1. `prop_firms_26_validated_import_ready.sql`
2. `prop_firms_26_validated.sqlite`
3. `prop_firms_26_google_sheets_csv_tables.zip` or extracted CSV tables
4. `prop_firms_26_validation_report_AR.md`
5. Core schema files:
   - `00_schema_core_shared.sql`
   - `02_schema_cfd_prop_firms_v3_1.sql`
   - `03_schema_futures_prop_firms_v3_1.sql`
6. Any company source archives/screenshots already in the repo.

## Hard rules
- Do not invent any value.
- Do not guess missing prices, rules, payout terms, drawdown rules, country restrictions, or KYC rules.
- Do not use Reddit, forums, affiliate blogs, review websites, or third-party articles as final sources for sensitive fields.
- Do not treat user screenshots as official evidence.
- Do not mark a value as verified unless it is supported by an official source.
- Do not merge CFD and Futures records into one comparison table.
- Do not add new companies.
- Do not overwrite existing IDs.
- Do not output generic advice. Output repository-ready files.

## Allowed source types
Use only these normalized source types:

- `official_page`
- `official_help_center`
- `official_terms`
- `official_checkout`
- `official_dashboard`
- `official_faq`
- `user_screenshot`
- `manual_review_needed`

## Source confidence rules
- `official_terms`: high confidence
- `official_help_center`: high confidence
- `official_checkout`: high confidence for prices and plan availability
- `official_page`: medium to high confidence depending on specificity
- `official_dashboard`: high confidence if the data is visible in account/checkout context
- `official_faq`: medium to high confidence
- `user_screenshot`: limited confidence; cannot alone justify public verified status
- `manual_review_needed`: not publishable

Every filled value must include:

- `source_url`
- `source_type`
- `source_title` if available
- `retrieved_date`
- `confidence_score` from 0 to 100
- `agent_id`
- `notes`

## Agent assignments

### Agent 01 — Company identity
Check `companies` fields:
- website_url
- terms_url
- privacy_url
- support_url
- brand name
- legal/company name if available
- operational status

### Agent 02 — Source normalization
Review `company_sources` and normalize source types to the allowed list. Flag local, uploaded, ambiguous, or duplicate sources.

### Agent 03 — Data quality flags
Review `data_quality_flags`. Identify which high/medium flags can be solved with official evidence and which must remain open.

### Agent 04 — CFD programs
Check CFD program names, funding model, phase count, account model, and availability.

### Agent 05 — CFD account prices
Check prices for each CFD account size. Use checkout/pricing pages only when possible.

### Agent 06 — Profit targets
Check phase 1 and phase 2 profit targets.

### Agent 07 — Drawdown values
Check daily drawdown and max drawdown.

### Agent 08 — Drawdown type
Check whether drawdown is static, trailing, intraday, end-of-day, balance-based, equity-based, or hybrid.

### Agent 09 — Profit split
Check initial and maximum profit split.

### Agent 10 — First payout
Check first payout eligibility period in days.

### Agent 11 — Payout frequency
Check payout frequency after first payout.

### Agent 12 — Payout methods
Check payout methods and whether crypto/bank/Deel/Rise/etc. are supported.

### Agent 13 — KYC requirements
Check KYC timing and requirement status.

### Agent 14 — Restricted countries
Check restricted/banned countries using official terms/help center only.

### Agent 15 — Platforms
Check MT4, MT5, cTrader, DXtrade, Match-Trader, TradeLocker, TradingView, NinjaTrader, Rithmic, Tradovate, or others.

### Agent 16 — News trading
Check news trading rules, restrictions around high-impact news, and whether funded/evaluation rules differ.

### Agent 17 — EA / bots / copy trading
Check EA/bot/copy-trading rules and any restrictions.

### Agent 18 — Overnight/weekend holding
Check overnight and weekend holding rules.

### Agent 19 — Time rules
Check minimum trading days, maximum trading days, no-time-limit status, and inactivity rules.

### Agent 20 — Refund rules
Check refund eligibility and conditions.

### Agent 21 — Scaling plans
Check scaling plan rules, caps, and requirements.

### Agent 22 — Hidden traps
Check consistency rules, lot-size limits, gambling rules, IP/VPN restrictions, account inactivity, prohibited strategies, and payout denial conditions.

### Agent 23 — Public comparison dataset
Build `public_cfd_comparison.csv` from verified and limited data only.

### Agent 24 — Final QA
Run consistency checks, detect contradictions, detect unsupported values, and produce merge-safe output.

## Field priority
Complete fields in this order:

1. price
2. account_size
3. max_drawdown
4. daily_drawdown
5. drawdown_type
6. profit_target_p1
7. profit_target_p2
8. profit_split
9. first_payout_days
10. payout_frequency
11. restricted_countries
12. kyc_required
13. platforms
14. news_trading
15. ea_allowed
16. weekend_holding
17. refund rules
18. scaling rules
19. hidden traps

## Missing value rules
If an official source confirms the value:
- Fill the value.
- Add evidence.
- Set confidence score.

If only a non-official source exists:
- Do not fill as verified.
- Put it in `needs_official_confirmation`.
- Add a QA issue.

If no source exists:
- Keep NULL.
- Add or preserve a data quality flag.

If two official sources conflict:
- Do not silently choose one.
- Add a conflict issue.
- Include both source URLs.
- Recommend manual review.

## Required output files
Create repository-ready files in this structure:

```txt
data/research/missing-data/
  missing_data_report.md
  filled_missing_data.sql
  evidence_log.csv
  qa_issues.csv
  public_cfd_comparison.csv
  unresolved_flags.csv
  source_conflicts.csv
```

### 1. `missing_data_report.md`
Must include:
- Number of missing values before work
- Number of values filled
- Number of values still NULL
- Number of high flags solved
- Number of high flags still open
- Companies ready for public display
- Companies limited but usable with warning
- Companies that must remain hidden/hold
- Top risks before publishing

### 2. `filled_missing_data.sql`
Must include only:
- `UPDATE` statements
- `INSERT` statements for new source records
- `INSERT` statements for new/updated quality flags

Must not include:
- `CREATE TABLE`
- schema rewrites
- destructive deletes
- ID renumbering

### 3. `evidence_log.csv`
Columns:

```csv
company_id,company_name,table_name,field_name,record_id,old_value,new_value,source_url,source_type,source_title,confidence_score,retrieved_date,agent_id,notes
```

### 4. `qa_issues.csv`
Columns:

```csv
issue_id,severity,company_id,company_name,table_name,field_name,record_id,issue_type,current_value,recommended_action,reason,source_url,agent_id
```

### 5. `public_cfd_comparison.csv`
Each row = company + program + account size.

Columns:

```csv
company_id,company_name,company_slug,program_id,program_name,funding_model,phase_count,account_size,price,price_status,profit_target_p1,profit_target_p2,daily_drawdown,max_drawdown,drawdown_type,profit_split,first_payout_days,payout_frequency,platforms,news_trading,ea_allowed,weekend_holding,kyc_status,restricted_countries_status,source_confidence,has_high_flag,publish_status,last_checked
```

## Publish status rules

### `publish`
Use only when:
- no open high flags
- price exists
- max_drawdown exists
- daily_drawdown exists
- profit_split exists
- account size exists
- sources are official or high confidence

### `limited`
Use when:
- no open high flags
- key commercial fields are present
- some medium/secondary fields are missing
- public display requires warning badge

### `hold`
Use when:
- any high flag is open
- price is missing
- drawdown is missing
- profit split is missing
- source for a sensitive field is non-official
- official sources conflict

## GitHub workflow requirements
Create work as a branch or patch set, not as untracked notes.

Preferred branch name:

```txt
data/fill-missing-prop-firm-fields
```

Commit message:

```txt
Fill missing prop firm comparison data with evidence logs
```

Pull request title:

```txt
Fill missing prop firm data and add public comparison export
```

Pull request body must include:
- What was filled
- What remains unresolved
- How evidence was collected
- QA risks
- Tables/files changed
- Whether any row should remain hidden from public comparison

## Final answer format
Return a concise executive summary:

- values filled
- values still missing
- high flags solved
- high flags still open
- companies with `publish`
- companies with `limited`
- companies with `hold`
- files created
- PR/branch name if created

Then attach or output the repository-ready files listed above.
