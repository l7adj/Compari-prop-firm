-- ═══════════════════════════════════════════════════════════════════════════
-- SCHEMA V3.1 — CRYPTO PROP FIRMS
-- محطة التمويل — نموذج تفصيلي لشركات تمويل الكريبتو
-- SQLite Dialect
--
-- يعتمد على الجداول المشتركة من Schema Trading Core / CFD:
-- categories, companies, company_sources, data_quality_flags,
-- arab_user_relevance, change_log
--
-- الهدف:
-- Market Type → Funding Model → Account Size
-- ثم قواعد دقيقة منفصلة: Phase/Drawdown / Fees / Position & Leverage /
-- Liquidation / Trading Permissions / API / KYC & Payout /
-- Custody & Partner / Execution & Price Feed / Hidden Traps
-- ═══════════════════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- 1. Market Types: Spot / Perpetual / Margin / Crypto CFD / Options
CREATE TABLE IF NOT EXISTS crypto_prop_market_types (
    market_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    market_category VARCHAR(50) NOT NULL CHECK(market_category IN ('spot','perpetual_futures','margin','crypto_cfd','options','custom')),
    is_real_crypto BOOLEAN,
    is_cfd BOOLEAN,
    real_crypto_or_cfd VARCHAR(50) CHECK(real_crypto_or_cfd IN ('real_crypto','cfd','mixed','needs_verification','unknown')),
    company_discloses_cfd BOOLEAN,
    cfd_disclosure_note TEXT,
    custody_model VARCHAR(80) CHECK(custody_model IN ('company','third_party','exchange_partner','self_custody','simulated','unknown')),
    custody_third_party VARCHAR(200),
    exchange_partner VARCHAR(200),
    exchange_partner_note TEXT,
    description_ar TEXT,
    description_en TEXT,
    supported_pairs TEXT,
    supported_coins TEXT,
    stablecoins TEXT,
    altcoins_count INTEGER,
    spot_trading BOOLEAN,
    futures_trading BOOLEAN,
    margin_trading BOOLEAN,
    options_trading BOOLEAN,
    cross_margin BOOLEAN,
    isolated_margin BOOLEAN,
    leverage_trading BOOLEAN,
    available_platforms TEXT,
    web_platform BOOLEAN,
    mobile_app BOOLEAN,
    api_available BOOLEAN,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    UNIQUE(company_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_market_company ON crypto_prop_market_types(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_market_category ON crypto_prop_market_types(market_category);

-- 2. Funding Models: Evaluation / Instant Funding / Direct Funded
CREATE TABLE IF NOT EXISTS crypto_prop_funding_models (
    funding_model_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    funding_type VARCHAR(50) NOT NULL CHECK(funding_type IN ('evaluation','instant_funding','direct_funded','challenge','custom')),
    description_ar TEXT,
    description_en TEXT,
    phase_count INTEGER DEFAULT 1,
    phase_names TEXT,
    is_simulated BOOLEAN,
    is_live_capital BOOLEAN,
    funded_stage_exists BOOLEAN,
    billing_model VARCHAR(50),
    refund_policy TEXT,
    reset_policy TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    UNIQUE(company_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_funding_company ON crypto_prop_funding_models(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_funding_market ON crypto_prop_funding_models(market_type_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_funding_type ON crypto_prop_funding_models(funding_type);

-- 3. Account Sizes
CREATE TABLE IF NOT EXISTS crypto_prop_account_sizes (
    size_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    funding_model_id INTEGER NOT NULL,
    market_type_id INTEGER,
    account_size DECIMAL(18,2) NOT NULL,
    account_size_label VARCHAR(50),
    account_currency VARCHAR(10) DEFAULT 'USDT',
    price DECIMAL(12,2),
    price_currency VARCHAR(10) DEFAULT 'USD',
    original_price DECIMAL(12,2),
    discount_pct DECIMAL(5,2),
    discount_code VARCHAR(100),
    discount_expiry DATE,
    activation_fee DECIMAL(12,2),
    reset_fee DECIMAL(12,2),
    monthly_fee DECIMAL(12,2),
    platform_fee DECIMAL(12,2),
    data_fee DECIMAL(12,2),
    total_first_month_cost DECIMAL(12,2),
    is_available BOOLEAN DEFAULT 1,
    is_limited_time BOOLEAN DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    UNIQUE(funding_model_id, account_size, account_currency)
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_sizes_company ON crypto_prop_account_sizes(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_sizes_funding ON crypto_prop_account_sizes(funding_model_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_sizes_market ON crypto_prop_account_sizes(market_type_id);

-- 4. Phase / Drawdown Rules
CREATE TABLE IF NOT EXISTS crypto_prop_phase_drawdown_rules (
    phase_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    applies_to VARCHAR(50) DEFAULT 'funding_model' CHECK(applies_to IN ('company','market_type','funding_model','size','funded_stage')),
    phase_number INTEGER NOT NULL,
    phase_name_ar VARCHAR(100),
    phase_name_en VARCHAR(100),
    profit_target_pct DECIMAL(7,4),
    profit_target_amount DECIMAL(18,2),
    daily_drawdown_pct DECIMAL(7,4),
    daily_drawdown_amount DECIMAL(18,2),
    daily_drawdown_type VARCHAR(80),
    daily_drawdown_base VARCHAR(80),
    daily_drawdown_reset_time VARCHAR(100),
    daily_drawdown_reset_timezone VARCHAR(100),
    max_drawdown_pct DECIMAL(7,4),
    max_drawdown_amount DECIMAL(18,2),
    max_drawdown_type VARCHAR(80),
    max_drawdown_base VARCHAR(80),
    floating_loss_included BOOLEAN,
    floating_profit_included BOOLEAN,
    unrealized_profit_affects_drawdown BOOLEAN,
    unrealized_loss_causes_breach BOOLEAN,
    breach_timing VARCHAR(50),
    open_breach_is_final BOOLEAN,
    liquidation_on_breach BOOLEAN,
    warning_before_breach BOOLEAN,
    min_trading_days INTEGER,
    max_trading_days INTEGER,
    time_limit VARCHAR(100),
    refundable BOOLEAN,
    refund_conditions TEXT,
    notes TEXT,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE CASCADE,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_phase_company ON crypto_prop_phase_drawdown_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_phase_funding ON crypto_prop_phase_drawdown_rules(funding_model_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_phase_size ON crypto_prop_phase_drawdown_rules(size_id);

-- 5. Position / Leverage Rules
CREATE TABLE IF NOT EXISTS crypto_prop_position_leverage_rules (
    position_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    applies_to VARCHAR(50) DEFAULT 'market_type' CHECK(applies_to IN ('company','market_type','funding_model','size','pair','funded_stage')),
    leverage VARCHAR(50),
    max_leverage DECIMAL(10,4),
    leverage_by_pair TEXT,
    leverage_by_market TEXT,
    max_position_size DECIMAL(18,8),
    max_position_size_currency VARCHAR(10),
    max_position_pct_of_account DECIMAL(7,4),
    max_open_positions INTEGER,
    max_orders INTEGER,
    max_daily_trades INTEGER,
    margin_requirement_pct DECIMAL(7,4),
    maintenance_margin_pct DECIMAL(7,4),
    margin_call_level_pct DECIMAL(7,4),
    risk_per_trade_limit_pct DECIMAL(7,4),
    max_daily_risk_pct DECIMAL(7,4),
    concentration_limit_note TEXT,
    allowed_pairs TEXT,
    restricted_pairs TEXT,
    restricted_symbols_note TEXT,
    notes TEXT,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_position_company ON crypto_prop_position_leverage_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_position_size ON crypto_prop_position_leverage_rules(size_id);

-- 6. Fee Rules
CREATE TABLE IF NOT EXISTS crypto_prop_fee_rules (
    fee_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    pair_symbol VARCHAR(50),
    applies_to VARCHAR(50) DEFAULT 'company' CHECK(applies_to IN ('company','market_type','funding_model','size','pair','funded_stage')),
    maker_fee_pct DECIMAL(10,6),
    taker_fee_pct DECIMAL(10,6),
    fee_tier_note TEXT,
    spread_from_pct DECIMAL(10,6),
    spread_average_pct DECIMAL(10,6),
    hidden_spread_note TEXT,
    expected_slippage_pct DECIMAL(10,6),
    slippage_during_volatility_note TEXT,
    funding_fee_enabled BOOLEAN,
    funding_fee_rate_pct DECIMAL(10,6),
    funding_fee_interval VARCHAR(50),
    funding_fee_source VARCHAR(100),
    funding_fee_note TEXT,
    liquidation_fee_pct DECIMAL(10,6),
    liquidation_fee_note TEXT,
    margin_fee_pct DECIMAL(10,6),
    borrow_fee_pct DECIMAL(10,6),
    borrow_fee_interval VARCHAR(50),
    deposit_fee DECIMAL(12,4),
    deposit_fee_note TEXT,
    withdrawal_fee_btc DECIMAL(18,8),
    withdrawal_fee_eth DECIMAL(18,8),
    withdrawal_fee_usdt DECIMAL(12,4),
    withdrawal_fee_usdt_network VARCHAR(20),
    withdrawal_fee_note TEXT,
    inactivity_fee DECIMAL(12,4),
    inactivity_period_days INTEGER,
    account_maintenance_fee DECIMAL(12,4),
    notes TEXT,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_fee_company ON crypto_prop_fee_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_fee_market ON crypto_prop_fee_rules(market_type_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_fee_size ON crypto_prop_fee_rules(size_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_fee_pair ON crypto_prop_fee_rules(pair_symbol);

-- 7. Liquidation Rules
CREATE TABLE IF NOT EXISTS crypto_prop_liquidation_rules (
    liquidation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    pair_symbol VARCHAR(50),
    applies_to VARCHAR(50) DEFAULT 'market_type' CHECK(applies_to IN ('company','market_type','funding_model','size','pair','funded_stage')),
    liquidation_trigger VARCHAR(80),
    margin_call_level_pct DECIMAL(7,4),
    liquidation_level_pct DECIMAL(7,4),
    stop_out_level_pct DECIMAL(7,4),
    maintenance_margin_pct DECIMAL(7,4),
    liquidation_type VARCHAR(50),
    partial_liquidation_steps TEXT,
    liquidation_warning_exists BOOLEAN,
    liquidation_is_instant BOOLEAN,
    liquidation_fairness VARCHAR(50),
    liquidation_fairness_note TEXT,
    insurance_fund_exists BOOLEAN,
    insurance_fund_amount DECIMAL(18,2),
    insurance_fund_note TEXT,
    socialized_losses BOOLEAN,
    socialized_losses_note TEXT,
    adl_enabled BOOLEAN,
    adl_note TEXT,
    weekend_gap_risk BOOLEAN,
    weekend_gap_note TEXT,
    notes TEXT,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_liq_company ON crypto_prop_liquidation_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_liq_market ON crypto_prop_liquidation_rules(market_type_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_liq_size ON crypto_prop_liquidation_rules(size_id);

-- 8. Trading Permissions
CREATE TABLE IF NOT EXISTS crypto_prop_trading_permissions (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    applies_to VARCHAR(50) DEFAULT 'funding_model' CHECK(applies_to IN ('company','market_type','funding_model','size','funded_stage')),
    manual_trading_allowed BOOLEAN,
    scalping_allowed BOOLEAN,
    swing_trading_allowed BOOLEAN,
    weekend_holding_allowed BOOLEAN,
    weekend_holding_note TEXT,
    overnight_holding_allowed BOOLEAN,
    overnight_holding_note TEXT,
    ea_allowed BOOLEAN,
    bots_allowed BOOLEAN,
    grid_bots_allowed BOOLEAN,
    dca_bots_allowed BOOLEAN,
    arbitrage_bots_allowed BOOLEAN,
    copy_trading_allowed BOOLEAN,
    signal_trading_allowed BOOLEAN,
    hft_allowed BOOLEAN,
    latency_arbitrage_allowed BOOLEAN,
    market_making_allowed BOOLEAN,
    hedging_allowed BOOLEAN,
    martingale_allowed BOOLEAN,
    reverse_trading_allowed BOOLEAN,
    same_strategy_banned BOOLEAN,
    group_trading_banned BOOLEAN,
    vpn_allowed BOOLEAN,
    vps_allowed BOOLEAN,
    ip_change_allowed BOOLEAN,
    multiple_devices_allowed BOOLEAN,
    multiple_accounts_allowed BOOLEAN,
    account_merging_allowed BOOLEAN,
    restricted_practices TEXT,
    forbidden_practices TEXT,
    breach_rules TEXT,
    notes TEXT,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_perm_company ON crypto_prop_trading_permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_perm_size ON crypto_prop_trading_permissions(size_id);

-- 9. API Rules
CREATE TABLE IF NOT EXISTS crypto_prop_api_rules (
    api_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    applies_to VARCHAR(50) DEFAULT 'market_type' CHECK(applies_to IN ('company','market_type','funding_model','size','funded_stage')),
    api_available BOOLEAN,
    rest_api BOOLEAN,
    websocket_api BOOLEAN,
    fix_api BOOLEAN,
    graphql_api BOOLEAN,
    api_trading_allowed BOOLEAN,
    trading_via_api BOOLEAN,
    withdrawal_via_api BOOLEAN,
    api_key_restrictions TEXT,
    ip_whitelist_required BOOLEAN,
    api_permissions_granular BOOLEAN,
    orders_per_second INTEGER,
    requests_per_minute INTEGER,
    requests_per_day INTEGER,
    websocket_connections_limit INTEGER,
    rate_limit_note TEXT,
    bots_allowed_via_api BOOLEAN,
    copy_trading_api BOOLEAN,
    hft_allowed_via_api BOOLEAN,
    api_trading_banned BOOLEAN,
    api_trading_ban_note TEXT,
    api_restriction_after_profit BOOLEAN,
    api_restriction_note TEXT,
    sub_accounts_allowed BOOLEAN,
    max_sub_accounts INTEGER,
    notes TEXT,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_api_company ON crypto_prop_api_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_api_size ON crypto_prop_api_rules(size_id);

-- 10. KYC & Payout Rules
CREATE TABLE IF NOT EXISTS crypto_prop_kyc_payout_rules (
    kyc_payout_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    applies_to VARCHAR(50) DEFAULT 'company' CHECK(applies_to IN ('company','market_type','funding_model','size','funded_stage')),
    kyc_required BOOLEAN,
    kyc_timing VARCHAR(50),
    kyc_documents TEXT,
    kyc_video_interview BOOLEAN,
    proof_of_funds_required BOOLEAN,
    kyc_note TEXT,
    restricted_countries TEXT,
    restricted_countries_note TEXT,
    payout_methods TEXT,
    payout_currency VARCHAR(20),
    payout_network VARCHAR(20),
    single_currency_payout BOOLEAN,
    single_currency_note TEXT,
    min_payout_amount DECIMAL(18,4),
    max_payout_amount DECIMAL(18,4),
    payout_cap BOOLEAN,
    payout_cap_note TEXT,
    payout_frequency VARCHAR(50),
    payout_processing_time VARCHAR(100),
    profit_split VARCHAR(50),
    first_payout_after VARCHAR(100),
    min_trading_days_for_payout INTEGER,
    consistency_required BOOLEAN,
    consistency_rule_details TEXT,
    payout_fee DECIMAL(12,4),
    payout_fee_type VARCHAR(20),
    payout_fee_note TEXT,
    kyc_freeze_risk BOOLEAN,
    kyc_freeze_note TEXT,
    payout_guaranteed BOOLEAN,
    payout_guarantee_note TEXT,
    payout_denial_clause TEXT,
    payout_denial_reasons TEXT,
    notes TEXT,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_kyc_company ON crypto_prop_kyc_payout_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_kyc_size ON crypto_prop_kyc_payout_rules(size_id);

-- 11. Custody / Exchange Partner Rules
CREATE TABLE IF NOT EXISTS crypto_prop_custody_partner_rules (
    custody_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    applies_to VARCHAR(50) DEFAULT 'market_type' CHECK(applies_to IN ('company','market_type','funding_model','funded_stage')),
    custody_model VARCHAR(80),
    custodian_name VARCHAR(200),
    exchange_partner_name VARCHAR(200),
    exchange_partner_risk BOOLEAN,
    exchange_partner_note TEXT,
    real_assets_held BOOLEAN,
    user_owns_assets BOOLEAN,
    withdrawal_of_underlying_assets BOOLEAN,
    proof_of_custody_available BOOLEAN,
    custody_disclosure_url VARCHAR(1000),
    counterparty_risk_note TEXT,
    insolvency_risk_note TEXT,
    segregation_of_funds BOOLEAN,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_custody_company ON crypto_prop_custody_partner_rules(company_id);

-- 12. Pair Catalog
CREATE TABLE IF NOT EXISTS crypto_prop_pair_catalog (
    pair_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    pair_symbol VARCHAR(50) NOT NULL,
    base_asset VARCHAR(50),
    quote_asset VARCHAR(50),
    market_category VARCHAR(50),
    is_allowed BOOLEAN,
    is_restricted BOOLEAN,
    restriction_note TEXT,
    max_leverage DECIMAL(10,4),
    maker_fee_pct DECIMAL(10,6),
    taker_fee_pct DECIMAL(10,6),
    funding_interval VARCHAR(50),
    liquidity_level VARCHAR(50),
    low_liquidity_risk BOOLEAN,
    spread_note TEXT,
    trading_hours TEXT,
    weekend_trading BOOLEAN,
    gap_risk_note TEXT,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    UNIQUE(company_id, market_type_id, pair_symbol)
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_pair_company ON crypto_prop_pair_catalog(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_pair_symbol ON crypto_prop_pair_catalog(pair_symbol);

-- 13. Execution / Price Feed Rules
CREATE TABLE IF NOT EXISTS crypto_prop_execution_price_feed_rules (
    execution_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    applies_to VARCHAR(50) DEFAULT 'market_type' CHECK(applies_to IN ('company','market_type','funding_model','size','pair','funded_stage')),
    trading_environment VARCHAR(50),
    price_feed_source VARCHAR(200),
    price_feed_difference_risk BOOLEAN,
    price_feed_difference_note TEXT,
    execution_model VARCHAR(80),
    order_matching_note TEXT,
    demo_vs_real_execution_note TEXT,
    demo_vs_real_execution_risk BOOLEAN,
    average_slippage_pct DECIMAL(10,6),
    slippage_during_volatility_note TEXT,
    slippage_manipulation_risk BOOLEAN,
    spread_widening_risk BOOLEAN,
    spread_widening_note TEXT,
    outage_risk BOOLEAN,
    maintenance_windows TEXT,
    liquidation_during_outage_policy TEXT,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_exec_company ON crypto_prop_execution_price_feed_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_exec_size ON crypto_prop_execution_price_feed_rules(size_id);

-- 14. Funded Account Rules
CREATE TABLE IF NOT EXISTS crypto_prop_funded_account_rules (
    funded_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    applies_to VARCHAR(50) DEFAULT 'funded_stage' CHECK(applies_to IN ('company','market_type','funding_model','size','funded_stage')),
    funded_account_name VARCHAR(200),
    funded_environment VARCHAR(50),
    profit_split VARCHAR(50),
    profit_split_after_scaling VARCHAR(50),
    funded_daily_drawdown_pct DECIMAL(7,4),
    funded_max_drawdown_pct DECIMAL(7,4),
    funded_leverage VARCHAR(50),
    funded_max_position_size DECIMAL(18,8),
    funded_api_allowed BOOLEAN,
    funded_bots_allowed BOOLEAN,
    funded_copy_trading_allowed BOOLEAN,
    funded_weekend_holding BOOLEAN,
    funded_payout_frequency VARCHAR(100),
    inactivity_rule TEXT,
    account_cancellation_rule TEXT,
    rule_change_without_notice BOOLEAN,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_funded_company ON crypto_prop_funded_account_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_funded_size ON crypto_prop_funded_account_rules(size_id);

-- 15. Hidden Traps
CREATE TABLE IF NOT EXISTS crypto_prop_hidden_traps (
    trap_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    market_type_id INTEGER,
    funding_model_id INTEGER,
    size_id INTEGER,
    applies_to VARCHAR(50) DEFAULT 'company' CHECK(applies_to IN ('company','market_type','funding_model','size','pair','funded_stage','all_accounts')),
    trap_name VARCHAR(200) NOT NULL,
    trap_type VARCHAR(80) NOT NULL CHECK(trap_type IN ('crypto_cfd_disguised','funding_fees_hidden','liquidation_conditions_hidden','weekend_gap_risk','low_liquidity_pairs','spread_widening','api_restrictions','bot_ban_after_profit','kyc_after_profit','payout_one_currency_only','country_restrictions','pair_restrictions','exchange_partner_risk','custody_risk','unclear_price_feed','payout_denial','rule_change_without_notice','demo_vs_real_execution','price_feed_difference','slippage_manipulation','funded_stage_rule_change','withdrawal_fee_hidden','funding_rate_extreme','other')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
    description_ar TEXT,
    description_en TEXT,
    impact_on_trader TEXT,
    how_to_avoid TEXT,
    how_to_verify TEXT,
    crypto_cfd_disguised_trap BOOLEAN,
    funding_fees_hidden_trap BOOLEAN,
    liquidation_hidden_trap BOOLEAN,
    weekend_gap_risk_trap BOOLEAN,
    low_liquidity_pairs_trap BOOLEAN,
    spread_widening_trap BOOLEAN,
    api_restrictions_trap BOOLEAN,
    bot_ban_after_profit_trap BOOLEAN,
    kyc_after_profit_trap BOOLEAN,
    payout_one_currency_trap BOOLEAN,
    country_restrictions_trap BOOLEAN,
    pair_restrictions_trap BOOLEAN,
    exchange_partner_risk_trap BOOLEAN,
    custody_risk_trap BOOLEAN,
    unclear_price_feed_trap BOOLEAN,
    payout_denial_risk BOOLEAN,
    rule_change_without_notice BOOLEAN,
    demo_vs_real_execution_risk BOOLEAN,
    price_feed_difference_risk BOOLEAN,
    slippage_manipulation_risk BOOLEAN,
    funding_rate_extreme_risk BOOLEAN,
    source_url VARCHAR(1000),
    source_type VARCHAR(50),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','disputed','resolved')),
    verified_by VARCHAR(100),
    verified_at DATETIME,
    data_status VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    is_active BOOLEAN DEFAULT 1,
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (market_type_id) REFERENCES crypto_prop_market_types(market_type_id) ON DELETE SET NULL,
    FOREIGN KEY (funding_model_id) REFERENCES crypto_prop_funding_models(funding_model_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES crypto_prop_account_sizes(size_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_traps_company ON crypto_prop_hidden_traps(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_traps_type ON crypto_prop_hidden_traps(trap_type);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_traps_severity ON crypto_prop_hidden_traps(severity);

-- 16. Field-Level Sources
CREATE TABLE IF NOT EXISTS crypto_prop_field_sources (
    field_source_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    entity_table VARCHAR(100) NOT NULL,
    entity_id INTEGER NOT NULL,
    field_name VARCHAR(150) NOT NULL,
    source_url VARCHAR(1000) NOT NULL,
    source_type VARCHAR(50),
    source_title VARCHAR(300),
    source_checked_at DATETIME,
    source_confidence INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    extracted_value TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_field_sources_company ON crypto_prop_field_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_field_sources_entity ON crypto_prop_field_sources(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prop_field_sources_field ON crypto_prop_field_sources(field_name);

-- 17. Seed category
INSERT OR IGNORE INTO categories (name_ar, name_en, slug, description_ar, display_order)
VALUES ('شركات تمويل الكريبتو', 'Crypto Prop Firms', 'crypto_prop_firm', 'شركات تمويل حسابات تداول الكريبتو والأصول الرقمية', 3);

-- Collection Rules:
-- 1. أي قيمة غير موثقة تبقى NULL.
-- 2. القاعدة العامة تسجل applies_to='company' أو 'market_type'.
-- 3. القاعدة الخاصة بنموذج تمويل تسجل funding_model_id + applies_to='funding_model'.
-- 4. القاعدة الخاصة بحجم محدد تسجل size_id + applies_to='size'.
-- 5. القاعدة الخاصة بزوج محدد تسجل pair_symbol أو pair_id حسب الجدول.
-- 6. كل حقل حساس يجب أن يملك source_url في نفس الجدول أو في crypto_prop_field_sources.
-- 7. لا تكرر رسوم/منصات عامة داخل كل حجم إذا كانت تنطبق على الشركة أو السوق بالكامل.
