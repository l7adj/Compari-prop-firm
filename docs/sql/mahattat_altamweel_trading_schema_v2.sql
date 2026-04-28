-- ═══════════════════════════════════════════════════════════════
-- محطة التمويل — Trading Database Schema v2
-- هذا Schema منفصل عن Schema التمويل/القروض.
-- الهدف: جمع بيانات Prop Firms / Brokers / Crypto Exchanges بشكل دقيق.
-- القاعدة: لا يوجد قالب واحد لكل الأنواع. كل نوع له جداول خاصة.
-- ═══════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ───────────────────────────────────────────────────────────────
-- 0. Reference Tables
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trading_categories (
    category_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    slug            TEXT UNIQUE NOT NULL, -- cfd_prop_firm, futures_prop_firm, crypto_prop_firm, broker, crypto_exchange
    name_ar         TEXT NOT NULL,
    name_en         TEXT NOT NULL,
    color_hex       TEXT,
    display_order   INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS trading_companies (
    company_id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id             INTEGER NOT NULL,
    slug                    TEXT UNIQUE NOT NULL,
    name                    TEXT NOT NULL,
    legal_name              TEXT,
    trading_name            TEXT,
    logo_url                TEXT,
    official_website        TEXT,
    year_founded            INTEGER,
    headquarters_country    TEXT,
    legal_entity            TEXT,
    regulation_status       TEXT,
    restricted_countries    TEXT, -- JSON array
    data_status             TEXT DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    data_confidence         INTEGER CHECK(data_confidence BETWEEN 0 AND 100),
    risk_level              TEXT CHECK(risk_level IN ('low','medium','high')),
    last_checked            TEXT,
    review_updated          TEXT,
    short_summary_ar        TEXT,
    short_summary_en        TEXT,
    editorial_note_ar       TEXT,
    editorial_note_en       TEXT,
    is_active               BOOLEAN DEFAULT 1,
    created_at              TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at              TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES trading_categories(category_id)
);

CREATE TABLE IF NOT EXISTS trading_sources (
    source_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id      INTEGER NOT NULL,
    entity_type     TEXT NOT NULL, -- company, program, plan, rule, regulation, payout, fee, security
    entity_id       INTEGER,
    title           TEXT,
    url             TEXT NOT NULL,
    source_type     TEXT, -- pricing, faq, terms, help_center, regulation_lookup, proof_of_reserves, pdf, article
    field_path      TEXT, -- e.g. programs[0].plans[2].price
    last_checked    TEXT,
    confidence      INTEGER CHECK(confidence BETWEEN 0 AND 100),
    notes           TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hidden_rules (
    hidden_rule_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id              INTEGER NOT NULL,
    category_scope          TEXT NOT NULL, -- cfd, futures, crypto_prop, broker, exchange
    related_entity_type     TEXT, -- company, program, plan, account_type, product
    related_entity_id       INTEGER,
    rule_name_ar            TEXT NOT NULL,
    rule_name_en            TEXT,
    description_ar          TEXT NOT NULL,
    description_en          TEXT,
    severity                TEXT NOT NULL CHECK(severity IN ('high_risk','medium_risk','low_risk','needs_verification')),
    verification_status     TEXT DEFAULT 'needs_verification' CHECK(verification_status IN ('verified','needs_verification','disputed')),
    source_url              TEXT,
    date_discovered         TEXT,
    is_active               BOOLEAN DEFAULT 1,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS arab_user_relevance (
    arab_user_id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                      INTEGER NOT NULL UNIQUE,
    arabic_website                  BOOLEAN,
    arabic_support                  TEXT, -- full, limited, email_only, none
    arabic_support_channels         TEXT, -- JSON array
    mena_restricted_countries       TEXT, -- JSON array
    mena_supported_countries        TEXT, -- JSON array
    local_payment_methods           TEXT, -- JSON array
    crypto_payment_methods          TEXT, -- JSON array
    card_payments                   BOOLEAN,
    bank_transfer_available         BOOLEAN,
    islamic_or_swap_free_relevance  TEXT,
    support_quality                 TEXT, -- excellent, good, limited, poor
    notes_ar                        TEXT,
    notes_en                        TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

-- ───────────────────────────────────────────────────────────────
-- 1. CFD Prop Firms
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cfd_company_rules (
    cfd_rule_id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                      INTEGER NOT NULL UNIQUE,
    platforms                       TEXT, -- JSON: MT4, MT5, cTrader, DXtrade, Match-Trader, TradingView
    markets                         TEXT, -- JSON: forex, indices, metals, commodities, crypto, stocks
    instruments                     TEXT, -- JSON
    account_currencies              TEXT, -- JSON
    general_forbidden_practices     TEXT,
    copy_trading_general_rule       TEXT,
    multiple_accounts_policy        TEXT,
    ip_or_device_rules              TEXT,
    vpn_vps_rules                   TEXT,
    kyc_required                    BOOLEAN,
    kyc_timing                      TEXT, -- before_purchase, before_trading, before_first_payout, after_profit
    payout_methods                  TEXT, -- JSON
    challenge_reset_policy          TEXT,
    community_presence              TEXT, -- JSON
    daily_drawdown_based_on         TEXT, -- balance, equity, static, trailing
    max_drawdown_based_on           TEXT,
    floating_loss_counts            BOOLEAN,
    daily_drawdown_resets_at        TEXT,
    violation_moment                TEXT, -- instant, end_of_day
    max_daily_loss_example          TEXT,
    max_loss_example                TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cfd_programs (
    cfd_program_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id              INTEGER NOT NULL,
    program_group           TEXT NOT NULL CHECK(program_group IN ('one_phase','two_phase','three_phase','instant_funding')),
    variant_name            TEXT, -- normal, aggressive, swing, stellar, express, custom
    program_name            TEXT NOT NULL,
    description_ar          TEXT,
    description_en          TEXT,
    available_platforms     TEXT, -- JSON. null/empty if same as company level
    available_markets       TEXT, -- JSON. null/empty if same as company level
    display_order           INTEGER DEFAULT 0,
    is_active               BOOLEAN DEFAULT 1,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cfd_account_plans (
    cfd_plan_id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    cfd_program_id                  INTEGER NOT NULL,
    account_size                    DECIMAL(18,2) NOT NULL,
    account_size_label              TEXT, -- 10K, 25K, 100K
    price                           DECIMAL(12,2),
    currency                        TEXT DEFAULT 'USD',
    phase_1_profit_target           DECIMAL(6,2),
    phase_2_profit_target           DECIMAL(6,2),
    phase_3_profit_target           DECIMAL(6,2),
    daily_drawdown                  DECIMAL(6,2),
    max_drawdown                    DECIMAL(6,2),
    drawdown_type                   TEXT, -- static, trailing, balance_based, equity_based
    drawdown_calculation_notes      TEXT,
    trailing_drawdown_rules         TEXT,
    minimum_trading_days            INTEGER,
    maximum_trading_days            INTEGER,
    time_limit                      TEXT,
    profit_split                    TEXT,
    first_payout_time               TEXT,
    payout_frequency                TEXT,
    minimum_payout_amount           DECIMAL(12,2),
    payout_cap                      TEXT,
    refund_policy                   TEXT,
    payout_conditions               TEXT,
    scaling_plan                    TEXT,
    scaling_conditions              TEXT,
    consistency_rule                TEXT,
    news_trading                    TEXT, -- allowed, denied, restricted, unknown
    news_trading_details            TEXT,
    weekend_holding                 TEXT,
    weekend_holding_details         TEXT,
    overnight_holding               TEXT,
    overnight_holding_details       TEXT,
    ea_bots                         TEXT,
    ea_bots_details                 TEXT,
    copy_trading                    TEXT,
    copy_trading_details            TEXT,
    hedging                         TEXT,
    hedging_details                 TEXT,
    martingale                      TEXT,
    martingale_details              TEXT,
    arbitrage                       TEXT,
    arbitrage_details               TEXT,
    high_frequency_trading          TEXT,
    hft_details                     TEXT,
    grid_trading                    TEXT,
    tick_scalping                   TEXT,
    vpn_vps                         TEXT,
    multiple_accounts               TEXT,
    forbidden_practices             TEXT,
    breach_rules                    TEXT,
    important_notes                 TEXT,
    data_status                     TEXT DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    FOREIGN KEY(cfd_program_id) REFERENCES cfd_programs(cfd_program_id) ON DELETE CASCADE
);

-- ───────────────────────────────────────────────────────────────
-- 2. Futures Prop Firms
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS futures_company_rules (
    futures_rule_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL UNIQUE,
    platforms                   TEXT, -- JSON: NinjaTrader, Tradovate, Rithmic, TradingView
    data_feed_provider          TEXT,
    dom_available               BOOLEAN,
    mobile_support              BOOLEAN,
    data_cost                   TEXT,
    execution_notes             TEXT,
    exchanges                   TEXT, -- JSON: CME, CBOT, NYMEX, COMEX
    products                    TEXT, -- JSON: ES, NQ, CL, GC, etc.
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS futures_programs (
    futures_program_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id              INTEGER NOT NULL,
    program_group           TEXT NOT NULL CHECK(program_group IN ('evaluation_monthly','evaluation_lifetime','instant_funding','funded_account')),
    variant_name            TEXT,
    program_name            TEXT NOT NULL,
    billing_model           TEXT CHECK(billing_model IN ('monthly','lifetime','one_time')),
    available_platforms     TEXT,
    available_exchanges     TEXT,
    available_products      TEXT,
    data_feed               TEXT,
    display_order           INTEGER DEFAULT 0,
    is_active               BOOLEAN DEFAULT 1,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS futures_account_plans (
    futures_plan_id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    futures_program_id              INTEGER NOT NULL,
    account_size                    DECIMAL(18,2) NOT NULL,
    account_size_label              TEXT,
    monthly_fee                     DECIMAL(12,2),
    lifetime_fee                    DECIMAL(12,2),
    price                           DECIMAL(12,2),
    currency                        TEXT DEFAULT 'USD',
    activation_fee                  DECIMAL(12,2),
    reset_fee                       DECIMAL(12,2),
    data_fee                        TEXT,
    platform_fee                    TEXT,
    total_first_month               DECIMAL(12,2),
    profit_target                   DECIMAL(12,2),
    daily_loss_limit                DECIMAL(12,2),
    max_loss_limit                  DECIMAL(12,2),
    trailing_drawdown               DECIMAL(12,2),
    trailing_drawdown_rules         TEXT,
    eod_drawdown                    DECIMAL(12,2),
    static_drawdown                 DECIMAL(12,2),
    drawdown_lock                   TEXT,
    intraday_calculation            TEXT,
    unrealized_profit_included      BOOLEAN,
    reset_time                      TEXT,
    max_contracts                   INTEGER,
    max_contracts_or_lots           TEXT,
    micros_allowed                  BOOLEAN,
    scaling_rules                   TEXT,
    products                        TEXT,
    exchanges                       TEXT,
    data_feed                       TEXT,
    minimum_trading_days            INTEGER,
    first_payout_time               TEXT,
    payout_frequency                TEXT,
    payout_cap                      TEXT,
    consistency_rule                TEXT,
    kyc_timing                      TEXT,
    overnight_holding               TEXT,
    news_trading                    TEXT,
    forbidden_practices             TEXT,
    breach_rules                    TEXT,
    important_notes                 TEXT,
    data_status                     TEXT DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    FOREIGN KEY(futures_program_id) REFERENCES futures_programs(futures_program_id) ON DELETE CASCADE
);

-- ───────────────────────────────────────────────────────────────
-- 3. Crypto Prop Firms
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crypto_prop_company_rules (
    crypto_prop_rule_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                      INTEGER NOT NULL UNIQUE,
    spot_available                  BOOLEAN,
    perpetual_futures_available     BOOLEAN,
    margin_available                BOOLEAN,
    cfd_crypto_available            BOOLEAN,
    real_crypto_or_cfd              TEXT,
    custody_model                   TEXT,
    supported_pairs                 TEXT, -- JSON
    restricted_countries            TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crypto_prop_programs (
    crypto_prop_program_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id              INTEGER NOT NULL,
    program_group           TEXT NOT NULL CHECK(program_group IN ('spot','perpetual_futures','margin','cfd_crypto')),
    variant_name            TEXT,
    program_name            TEXT NOT NULL,
    available_markets       TEXT,
    display_order           INTEGER DEFAULT 0,
    is_active               BOOLEAN DEFAULT 1,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crypto_prop_account_plans (
    crypto_prop_plan_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    crypto_prop_program_id          INTEGER NOT NULL,
    account_size                    DECIMAL(18,2),
    account_size_label              TEXT,
    price                           DECIMAL(12,2),
    currency                        TEXT DEFAULT 'USD',
    leverage_crypto                 TEXT,
    leverage_futures                TEXT,
    max_position_size               TEXT,
    daily_drawdown                  DECIMAL(6,2),
    max_drawdown                    DECIMAL(6,2),
    liquidation_rules               TEXT,
    maker_fee                       DECIMAL(8,4),
    taker_fee                       DECIMAL(8,4),
    funding_fees                    TEXT,
    liquidation_fee                 TEXT,
    withdrawal_fee                  TEXT,
    spread_slippage_notes           TEXT,
    api_trading                     TEXT,
    api_types                       TEXT,
    rate_limits                     TEXT,
    ea_bots                         TEXT,
    copy_trading                    TEXT,
    high_frequency_trading          TEXT,
    automation_restrictions         TEXT,
    kyc_required                    BOOLEAN,
    kyc_timing                      TEXT,
    payout_method                   TEXT,
    payout_currency                 TEXT,
    first_payout_time               TEXT,
    payout_frequency                TEXT,
    restricted_countries            TEXT,
    forbidden_practices             TEXT,
    breach_rules                    TEXT,
    important_notes                 TEXT,
    data_status                     TEXT DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    FOREIGN KEY(crypto_prop_program_id) REFERENCES crypto_prop_programs(crypto_prop_program_id) ON DELETE CASCADE
);

-- ───────────────────────────────────────────────────────────────
-- 4. Brokers
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broker_regulations (
    broker_regulation_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    regulator_name              TEXT,
    jurisdiction                TEXT,
    license_number              TEXT,
    verification_url            TEXT,
    client_fund_segregation     BOOLEAN,
    negative_balance_protection BOOLEAN,
    investor_compensation       TEXT,
    notes                       TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broker_legal_entities (
    broker_entity_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id              INTEGER NOT NULL,
    entity_name             TEXT,
    jurisdiction            TEXT,
    client_type             TEXT,
    for_arab_clients        BOOLEAN,
    risk_note               TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broker_account_types (
    broker_account_type_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    account_type_name           TEXT NOT NULL,
    minimum_deposit             DECIMAL(12,2),
    currency                    TEXT,
    spread_from                 TEXT,
    average_spread              TEXT,
    spread_type                 TEXT,
    commission                  TEXT,
    swap_policy                 TEXT,
    inactivity_fee              TEXT,
    islamic_account_available   BOOLEAN,
    islamic_account_fee         TEXT,
    base_currencies             TEXT,
    demo_account                BOOLEAN,
    max_leverage_forex          TEXT,
    max_leverage_indices        TEXT,
    max_leverage_crypto         TEXT,
    min_lot_size                TEXT,
    platforms                   TEXT,
    data_status                 TEXT DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broker_trading_costs (
    broker_cost_id              INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    instrument                  TEXT NOT NULL,
    spread_from                 TEXT,
    average_spread              TEXT,
    commission                  TEXT,
    swap_or_overnight_fees      TEXT,
    notes                       TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broker_execution (
    broker_execution_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id              INTEGER NOT NULL UNIQUE,
    execution_model         TEXT,
    scalping_allowed        TEXT,
    news_trading_allowed    TEXT,
    vps_allowed             TEXT,
    hedging_allowed         TEXT,
    stop_level              TEXT,
    slippage_policy         TEXT,
    requotes                TEXT,
    server_locations        TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broker_deposit_withdrawal (
    broker_payment_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id              INTEGER NOT NULL,
    method                  TEXT NOT NULL,
    method_type             TEXT CHECK(method_type IN ('deposit','withdrawal','both')),
    fee                     TEXT,
    processing_time         TEXT,
    minimum_amount          DECIMAL(12,2),
    currencies              TEXT,
    notes                   TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broker_islamic_accounts (
    broker_islamic_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id              INTEGER NOT NULL UNIQUE,
    available               BOOLEAN,
    admin_fee               TEXT,
    swap_replacement        TEXT,
    restrictions            TEXT,
    notes                   TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

-- ───────────────────────────────────────────────────────────────
-- 5. Crypto Exchanges
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS exchange_products (
    exchange_product_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL UNIQUE,
    spot_trading                BOOLEAN,
    spot_pairs_count            INTEGER,
    futures_trading             BOOLEAN,
    futures_types               TEXT,
    margin_trading              BOOLEAN,
    options_trading             BOOLEAN,
    p2p_trading                 BOOLEAN,
    earn_products               TEXT,
    launchpad                   BOOLEAN,
    supported_coins_count       INTEGER,
    order_types                 TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exchange_fees (
    exchange_fee_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL UNIQUE,
    spot_maker_fee              DECIMAL(8,4),
    spot_taker_fee              DECIMAL(8,4),
    futures_maker_fee           DECIMAL(8,4),
    futures_taker_fee           DECIMAL(8,4),
    funding_rate                TEXT,
    withdrawal_fees_by_coin     TEXT,
    deposit_fee                 TEXT,
    vip_fee_tiers               TEXT,
    native_token_discount       TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exchange_kyc_limits (
    exchange_kyc_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    tier_name                   TEXT,
    requirements                TEXT,
    daily_withdrawal_limit      TEXT,
    fiat_access                 BOOLEAN,
    p2p_access                  BOOLEAN,
    futures_access              BOOLEAN,
    notes                       TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exchange_security (
    exchange_security_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL UNIQUE,
    proof_of_reserves           BOOLEAN,
    reserve_audit_firm          TEXT,
    reserve_audit_link          TEXT,
    reserve_ratio               TEXT,
    cold_storage_percentage     TEXT,
    two_fa                      BOOLEAN,
    two_fa_methods              TEXT,
    withdrawal_whitelist        BOOLEAN,
    anti_phishing_code          BOOLEAN,
    insurance_fund              BOOLEAN,
    insurance_fund_amount       TEXT,
    past_hacks                  TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exchange_fiat_p2p (
    exchange_fiat_p2p_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL UNIQUE,
    fiat_deposit_available      BOOLEAN,
    fiat_deposit_methods        TEXT,
    local_currency_support      TEXT,
    p2p_available               BOOLEAN,
    p2p_countries_count         INTEGER,
    p2p_payment_methods_count   INTEGER,
    p2p_dispute_system          TEXT,
    arabic_interface            BOOLEAN,
    arabic_support              TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exchange_api_liquidity (
    exchange_api_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL UNIQUE,
    api_available               BOOLEAN,
    api_types                   TEXT,
    rate_limits                 TEXT,
    liquidity_score             TEXT,
    order_book_depth            TEXT,
    institutional_features      TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exchange_restrictions_risks (
    exchange_risk_id            INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL UNIQUE,
    restricted_countries        TEXT,
    regional_restrictions       TEXT,
    withdrawal_suspension_risk  TEXT,
    delisting_risk              TEXT,
    no_proof_of_reserves        TEXT,
    kyc_freeze_risk             TEXT,
    custodial_risk              TEXT,
    p2p_dispute_risk            TEXT,
    low_liquidity_pairs         TEXT,
    high_funding_rates          TEXT,
    api_limits                  TEXT,
    FOREIGN KEY(company_id) REFERENCES trading_companies(company_id) ON DELETE CASCADE
);

-- ───────────────────────────────────────────────────────────────
-- 6. Minimal Seed Categories
-- ───────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO trading_categories (slug, name_ar, name_en, color_hex, display_order) VALUES
('cfd_prop_firm', 'شركات تمويل CFD', 'CFD Prop Firms', '#3b82f6', 1),
('futures_prop_firm', 'شركات تمويل الفيوتشرز', 'Futures Prop Firms', '#d97706', 2),
('crypto_prop_firm', 'شركات تمويل الكريبتو', 'Crypto Prop Firms', '#059669', 3),
('broker', 'البروكرات', 'Brokers', '#dc2626', 4),
('crypto_exchange', 'منصات العملات الرقمية', 'Crypto Exchanges', '#7c3aed', 5);

-- ═══════════════════════════════════════════════════════════════
-- Collection Rule:
-- أي قيمة غير موثقة تبقى NULL.
-- لا تُملأ أسعار أو أحجام أو قواعد من الذاكرة.
-- كل قيمة مهمة يجب ربطها بمصدر في trading_sources.
-- ═══════════════════════════════════════════════════════════════
