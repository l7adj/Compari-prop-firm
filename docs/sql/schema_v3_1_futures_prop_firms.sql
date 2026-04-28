-- ═══════════════════════════════════════════════════════════════════════════
-- SCHEMA V3.1 — FUTURES PROP FIRMS
-- محطة التمويل — نموذج تفصيلي لشركات تمويل العقود الآجلة
-- SQLite Dialect
--
-- يعتمد على الجداول المشتركة من Schema CFD/Trading Core:
-- categories, companies, company_sources, data_quality_flags,
-- arab_user_relevance, change_log
--
-- الهدف:
-- Evaluation Model → Rule Model → Account Plan
-- ثم قواعد دقيقة منفصلة: Drawdown / Contracts / Platform Data / Payout /
-- Funded Account / Trading Costs / Resets / Hidden Traps
-- ═══════════════════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. نماذج التقييم الرئيسية
-- Monthly Evaluation / Lifetime Evaluation / Instant Funding / Direct Funded
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_evaluation_models (
    model_id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,

    name_ar                     VARCHAR(200) NOT NULL,
    name_en                     VARCHAR(200) NOT NULL,
    slug                        VARCHAR(200) NOT NULL,

    evaluation_type             VARCHAR(50) NOT NULL CHECK(evaluation_type IN (
        'monthly','lifetime','one_time','instant_funding','direct_funded','custom'
    )),
    description_ar              TEXT,
    description_en              TEXT,

    billing_cycle               VARCHAR(50), -- monthly, one_time, lifetime, recurring_until_pass
    auto_renewal                BOOLEAN,
    cancel_policy               TEXT,
    refund_policy               TEXT,
    pause_policy                TEXT,

    available_platforms         TEXT, -- JSON
    supported_exchanges         TEXT, -- JSON: CME, CBOT, NYMEX, COMEX
    supported_products          TEXT, -- JSON: ES, NQ, YM, RTY, CL, GC...

    data_included_during_eval   BOOLEAN,
    data_fee_during_eval        DECIMAL(10,2),
    data_fee_after_funding      DECIMAL(10,2),
    platform_fee_during_eval    DECIMAL(10,2),
    platform_fee_after_funding  DECIMAL(10,2),
    exchange_fees_included      BOOLEAN,
    exchange_fees_note          TEXT,

    is_active                   BOOLEAN DEFAULT 1,
    display_order               INTEGER DEFAULT 0,
    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),

    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    UNIQUE(company_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_futures_models_company ON futures_evaluation_models(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_models_type ON futures_evaluation_models(evaluation_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Rule Models
-- داخل نفس Evaluation Model قد توجد نماذج مختلفة:
-- Trailing Drawdown / EOD Drawdown / Static Drawdown / Express / Custom
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_rule_models (
    rule_model_id               INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER NOT NULL,

    name_ar                     VARCHAR(200),
    name_en                     VARCHAR(200) NOT NULL,
    slug                        VARCHAR(200) NOT NULL,

    rule_model_type             VARCHAR(80) NOT NULL CHECK(rule_model_type IN (
        'trailing_drawdown','eod_drawdown','static_drawdown','express','instant','funded_stage','custom'
    )),

    description_ar              TEXT,
    description_en              TEXT,

    default_drawdown_model      VARCHAR(80),
    default_contract_policy     TEXT,
    default_payout_policy       TEXT,

    is_active                   BOOLEAN DEFAULT 1,
    display_order               INTEGER DEFAULT 0,
    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),

    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE CASCADE,
    UNIQUE(model_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_futures_rule_models_company ON futures_rule_models(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_rule_models_model ON futures_rule_models(model_id);
CREATE INDEX IF NOT EXISTS idx_futures_rule_models_type ON futures_rule_models(rule_model_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Account Plans
-- كل صف = حجم حساب داخل Rule Model محدد
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_account_plans (
    plan_id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER NOT NULL,
    rule_model_id               INTEGER,

    account_size                DECIMAL(12,2) NOT NULL,
    account_size_label          VARCHAR(50),
    currency                    VARCHAR(3) DEFAULT 'USD',

    monthly_fee                 DECIMAL(10,2),
    lifetime_fee                DECIMAL(10,2),
    one_time_fee                DECIMAL(10,2),
    listed_price                DECIMAL(10,2),
    discounted_price            DECIMAL(10,2),
    discount_pct                DECIMAL(5,2),
    coupon_code                 VARCHAR(100),
    promotion_expires_at        DATETIME,

    activation_fee              DECIMAL(10,2),
    activation_fee_required     BOOLEAN,
    activation_fee_timing       VARCHAR(100), -- after_passing, before_funded, first_payout, other
    reset_fee                   DECIMAL(10,2),
    reset_policy                TEXT,
    data_fee                    DECIMAL(10,2),
    platform_fee                DECIMAL(10,2),
    exchange_fee                DECIMAL(10,2),
    total_first_month_cost      DECIMAL(10,2),
    recurring_monthly_cost      DECIMAL(10,2),

    is_available                BOOLEAN DEFAULT 1,
    is_limited_time             BOOLEAN DEFAULT 0,
    display_order               INTEGER DEFAULT 0,
    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),

    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE CASCADE,
    FOREIGN KEY (rule_model_id) REFERENCES futures_rule_models(rule_model_id) ON DELETE SET NULL,
    UNIQUE(model_id, rule_model_id, account_size, currency)
);

CREATE INDEX IF NOT EXISTS idx_futures_plans_company ON futures_account_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_plans_model ON futures_account_plans(model_id);
CREATE INDEX IF NOT EXISTS idx_futures_plans_rule_model ON futures_account_plans(rule_model_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Drawdown Mechanics
-- يمكن أن تطبق على الشركة / النموذج / Rule Model / خطة معينة / funded stage
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_drawdown_mechanics (
    drawdown_id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER,
    rule_model_id               INTEGER,
    plan_id                     INTEGER,
    applies_to                  VARCHAR(50) DEFAULT 'rule_model' CHECK(applies_to IN (
        'company','model','rule_model','plan','funded_stage'
    )),

    drawdown_model              VARCHAR(80) CHECK(drawdown_model IN (
        'trailing','eod','static','trailing_from_peak','trailing_from_balance','none','custom'
    )),

    is_trailing                 BOOLEAN,
    trailing_from               VARCHAR(50), -- balance, equity, peak, closed_pnl, unrealized_pnl
    moves_with_open_equity      BOOLEAN,
    moves_with_closed_pnl_only  BOOLEAN,
    unrealized_profit_raises_drawdown BOOLEAN,
    unrealized_loss_causes_failure BOOLEAN,

    drawdown_lock               BOOLEAN,
    drawdown_lock_at            DECIMAL(12,2),
    drawdown_lock_after_target  BOOLEAN,
    drawdown_lock_note          TEXT,

    drawdown_base               VARCHAR(80), -- initial_balance, balance, equity, balance_plus_profit, high_water_mark

    daily_loss_limit_usd        DECIMAL(12,2),
    daily_loss_limit_pct        DECIMAL(5,2),
    daily_loss_type             VARCHAR(50), -- static, trailing, eod, custom
    daily_loss_reset            VARCHAR(50), -- daily, intraday, eod

    max_drawdown_usd            DECIMAL(12,2),
    max_drawdown_pct            DECIMAL(5,2),
    profit_target_usd           DECIMAL(12,2),
    profit_target_pct           DECIMAL(5,2),

    min_trading_days            INTEGER,
    max_trading_days            INTEGER,

    reset_time                  VARCHAR(100),
    reset_timezone              VARCHAR(100),
    reset_timing                VARCHAR(50), -- midnight_server, ny_close, market_open, exchange_close

    breach_timing               VARCHAR(50) DEFAULT 'instant', -- instant, eod, manual_review
    open_breach_is_final        BOOLEAN DEFAULT 1,
    soft_breach_exists          BOOLEAN,
    breach_grace_period         TEXT,

    example_scenario            TEXT,
    notes                       TEXT,
    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),

    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE CASCADE,
    FOREIGN KEY (rule_model_id) REFERENCES futures_rule_models(rule_model_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES futures_account_plans(plan_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_futures_dd_company ON futures_drawdown_mechanics(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_dd_model ON futures_drawdown_mechanics(model_id);
CREATE INDEX IF NOT EXISTS idx_futures_dd_rule_model ON futures_drawdown_mechanics(rule_model_id);
CREATE INDEX IF NOT EXISTS idx_futures_dd_plan ON futures_drawdown_mechanics(plan_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Contract Rules
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_contract_rules (
    contract_rule_id            INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER,
    rule_model_id               INTEGER,
    plan_id                     INTEGER,
    applies_to                  VARCHAR(50) DEFAULT 'rule_model' CHECK(applies_to IN (
        'company','model','rule_model','plan','funded_stage'
    )),

    max_contracts               INTEGER,
    max_micros                  INTEGER,
    max_minis                   INTEGER,
    micros_allowed              BOOLEAN,
    mini_contracts_allowed      BOOLEAN,
    micros_count_as_half        BOOLEAN,
    micro_to_mini_ratio         DECIMAL(8,4),
    micros_equivalent_note      TEXT,

    max_contracts_per_symbol    INTEGER,
    symbol_contract_limits      TEXT, -- JSON: {"ES":5,"NQ":3,"CL":2}

    scaling_plan_enabled        BOOLEAN,
    scaling_plan_details        TEXT,
    contracts_increase_with_profit BOOLEAN,
    contracts_increase_details  TEXT,
    scaling_breach_is_failure   BOOLEAN,

    allowed_contracts           TEXT, -- JSON
    restricted_contracts        TEXT, -- JSON
    all_exchanges_allowed       BOOLEAN,
    allowed_exchanges           TEXT, -- JSON
    restricted_exchanges        TEXT, -- JSON

    contract_breach_is_instant  BOOLEAN DEFAULT 1,
    flatten_before_close_required BOOLEAN,
    flatten_before_close_time   VARCHAR(100),
    flatten_before_close_timezone VARCHAR(100),
    flatten_before_close_note   TEXT,

    overnight_holding_allowed   BOOLEAN,
    overnight_holding_note      TEXT,
    weekend_holding_allowed     BOOLEAN,
    weekend_holding_note        TEXT,
    news_trading_allowed        BOOLEAN,
    news_trading_restrictions   TEXT,
    restricted_news_events      TEXT, -- JSON

    notes                       TEXT,
    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),

    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE CASCADE,
    FOREIGN KEY (rule_model_id) REFERENCES futures_rule_models(rule_model_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES futures_account_plans(plan_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_futures_contract_company ON futures_contract_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_contract_model ON futures_contract_rules(model_id);
CREATE INDEX IF NOT EXISTS idx_futures_contract_rule_model ON futures_contract_rules(rule_model_id);
CREATE INDEX IF NOT EXISTS idx_futures_contract_plan ON futures_contract_rules(plan_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Contract Product Catalog
-- لتجنب وضع ES/NQ/CL كـ JSON فقط عندما نحتاج تفاصيل أعمق
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_contract_products (
    product_id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    symbol                      VARCHAR(50) NOT NULL,
    micro_symbol                VARCHAR(50),
    exchange                    VARCHAR(50),
    asset_class                 VARCHAR(80), -- equity_index, energy, metals, rates, fx, crypto, agriculture
    product_name                VARCHAR(200),
    is_allowed                  BOOLEAN,
    is_restricted               BOOLEAN,
    restriction_note            TEXT,
    max_contracts_override      INTEGER,
    trading_hours               TEXT,
    flatten_required            BOOLEAN,
    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    UNIQUE(company_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_futures_products_company ON futures_contract_products(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_products_symbol ON futures_contract_products(symbol);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Platform & Data Rules
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_platform_data_rules (
    platform_id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER,
    rule_model_id               INTEGER,
    plan_id                     INTEGER,
    applies_to                  VARCHAR(50) DEFAULT 'model' CHECK(applies_to IN (
        'company','model','rule_model','plan','funded_stage'
    )),

    platform_name               VARCHAR(100) NOT NULL,
    data_feed_name              VARCHAR(100), -- Rithmic, CQG, dxFeed, Tradovate, etc.
    is_available                BOOLEAN DEFAULT 1,
    dom_available               BOOLEAN,
    mobile_available            BOOLEAN,
    web_platform_available      BOOLEAN,
    tradingview_supported       BOOLEAN,

    data_included               BOOLEAN,
    data_fee                    DECIMAL(10,2),
    data_fee_after_funding      DECIMAL(10,2),
    data_delay                  BOOLEAN,
    data_delay_ms               INTEGER,
    live_data_or_sim_data       VARCHAR(50), -- live, delayed, simulated, unknown

    execution_type              VARCHAR(50), -- sim, live, hybrid
    sim_vs_live_note            TEXT,
    simulated_fill_difference_risk BOOLEAN,

    license_required            BOOLEAN,
    license_included            BOOLEAN,
    license_fee                 DECIMAL(10,2),
    rithmic_fee                 DECIMAL(10,2),
    rithmic_fee_after_funding   DECIMAL(10,2),
    exchange_fee                DECIMAL(10,2),

    notes                       TEXT,
    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),

    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE CASCADE,
    FOREIGN KEY (rule_model_id) REFERENCES futures_rule_models(rule_model_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES futures_account_plans(plan_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_futures_platform_company ON futures_platform_data_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_platform_model ON futures_platform_data_rules(model_id);
CREATE INDEX IF NOT EXISTS idx_futures_platform_rule_model ON futures_platform_data_rules(rule_model_id);
CREATE INDEX IF NOT EXISTS idx_futures_platform_plan ON futures_platform_data_rules(plan_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. Trading Costs
-- عمولات، exchange fees، routing، platform costs، per side/round turn
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_trading_costs (
    cost_id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER,
    rule_model_id               INTEGER,
    plan_id                     INTEGER,
    product_symbol              VARCHAR(50),
    applies_to                  VARCHAR(50) DEFAULT 'company' CHECK(applies_to IN (
        'company','model','rule_model','plan','product','funded_stage'
    )),

    commission_per_side         DECIMAL(10,4),
    commission_round_turn       DECIMAL(10,4),
    exchange_fee_per_side       DECIMAL(10,4),
    routing_fee_per_side        DECIMAL(10,4),
    platform_fee_per_trade      DECIMAL(10,4),
    all_in_cost_round_turn      DECIMAL(10,4),
    cost_currency               VARCHAR(3) DEFAULT 'USD',
    fee_note                    TEXT,

    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE SET NULL,
    FOREIGN KEY (rule_model_id) REFERENCES futures_rule_models(rule_model_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES futures_account_plans(plan_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_futures_costs_company ON futures_trading_costs(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_costs_product ON futures_trading_costs(product_symbol);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. Payout Rules
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_payout_rules (
    payout_rule_id              INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER,
    rule_model_id               INTEGER,
    plan_id                     INTEGER,
    applies_to                  VARCHAR(50) DEFAULT 'company' CHECK(applies_to IN (
        'company','model','rule_model','plan','funded_stage'
    )),

    first_payout_after          VARCHAR(100),
    first_payout_min_trading_days INTEGER,
    first_payout_min_profit     DECIMAL(12,2),
    payout_frequency            VARCHAR(50), -- bi_weekly, monthly, on_request, weekly

    min_payout_amount           DECIMAL(12,2),
    max_payout_amount           DECIMAL(12,2),
    payout_currency             VARCHAR(3) DEFAULT 'USD',

    payout_cap                  BOOLEAN,
    payout_cap_amount           DECIMAL(12,2),
    payout_cap_pct              DECIMAL(5,2),
    max_payouts_per_month       INTEGER,

    safety_net_required         BOOLEAN,
    safety_net_amount           DECIMAL(12,2),
    safety_net_pct              DECIMAL(5,2),
    safety_net_note             TEXT,

    profit_buffer_required      BOOLEAN,
    profit_buffer_amount        DECIMAL(12,2),
    profit_buffer_pct           DECIMAL(5,2),

    consistency_required        BOOLEAN,
    consistency_rule_details    TEXT,
    min_balance_before_payout   DECIMAL(12,2),
    payout_reduces_drawdown     BOOLEAN,
    payout_reduces_drawdown_note TEXT,
    payout_affects_contract_scaling BOOLEAN,

    kyc_required_before_payout  BOOLEAN,
    kyc_required_after_profit   BOOLEAN,
    tax_forms_required          BOOLEAN,
    processing_fee              DECIMAL(10,2),
    processing_time             VARCHAR(100),
    payout_methods              TEXT, -- JSON

    payout_denial_clause        TEXT,
    payout_denial_reasons       TEXT, -- JSON

    notes                       TEXT,
    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),

    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE SET NULL,
    FOREIGN KEY (rule_model_id) REFERENCES futures_rule_models(rule_model_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES futures_account_plans(plan_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_futures_payout_company ON futures_payout_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_payout_model ON futures_payout_rules(model_id);
CREATE INDEX IF NOT EXISTS idx_futures_payout_rule_model ON futures_payout_rules(rule_model_id);
CREATE INDEX IF NOT EXISTS idx_futures_payout_plan ON futures_payout_rules(plan_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. Funded Account Rules
-- بعد النجاح: PA/Express/Funded/Live-sim account rules
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_funded_account_rules (
    funded_rule_id              INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER,
    rule_model_id               INTEGER,
    plan_id                     INTEGER,
    applies_to                  VARCHAR(50) DEFAULT 'funded_stage' CHECK(applies_to IN (
        'company','model','rule_model','plan','funded_stage'
    )),

    funded_account_name         VARCHAR(200),
    funded_environment          VARCHAR(50), -- sim, live, hybrid, unknown
    activation_fee              DECIMAL(10,2),
    monthly_fee_after_funding   DECIMAL(10,2),
    data_fee_after_funding      DECIMAL(10,2),
    platform_fee_after_funding  DECIMAL(10,2),

    funded_drawdown_model       VARCHAR(80),
    funded_daily_loss_limit     DECIMAL(12,2),
    funded_max_loss_limit       DECIMAL(12,2),
    funded_drawdown_lock        BOOLEAN,
    funded_contract_scaling     TEXT,
    funded_max_contracts        INTEGER,
    funded_overnight_holding    BOOLEAN,
    funded_weekend_holding      BOOLEAN,
    funded_news_trading         BOOLEAN,
    funded_flatten_required     BOOLEAN,
    funded_flatten_time         VARCHAR(100),

    payout_eligibility_note     TEXT,
    inactivity_rule             TEXT,
    account_cancellation_rule   TEXT,
    rule_change_without_notice  BOOLEAN,

    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE SET NULL,
    FOREIGN KEY (rule_model_id) REFERENCES futures_rule_models(rule_model_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES futures_account_plans(plan_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_futures_funded_company ON futures_funded_account_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_funded_plan ON futures_funded_account_rules(plan_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. Reset / Renewal / Failure Rules
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_reset_renewal_rules (
    reset_rule_id               INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER,
    rule_model_id               INTEGER,
    plan_id                     INTEGER,
    applies_to                  VARCHAR(50) DEFAULT 'model' CHECK(applies_to IN (
        'company','model','rule_model','plan','funded_stage'
    )),

    reset_available             BOOLEAN,
    reset_fee                   DECIMAL(10,2),
    reset_keeps_days            BOOLEAN,
    reset_keeps_subscription    BOOLEAN,
    reset_loses_progress        BOOLEAN,
    reset_policy_note           TEXT,

    subscription_auto_renews    BOOLEAN,
    renewal_fee                 DECIMAL(10,2),
    renewal_interval            VARCHAR(100),
    cancellation_deadline       TEXT,
    failed_evaluation_policy    TEXT,
    pause_available             BOOLEAN,
    pause_policy_note           TEXT,

    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE SET NULL,
    FOREIGN KEY (rule_model_id) REFERENCES futures_rule_models(rule_model_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES futures_account_plans(plan_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_futures_reset_company ON futures_reset_renewal_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_reset_model ON futures_reset_renewal_rules(model_id);
CREATE INDEX IF NOT EXISTS idx_futures_reset_plan ON futures_reset_renewal_rules(plan_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. Hidden Traps
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_hidden_traps (
    trap_id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    model_id                    INTEGER,
    rule_model_id               INTEGER,
    plan_id                     INTEGER,
    applies_to                  VARCHAR(50) DEFAULT 'company' CHECK(applies_to IN (
        'company','model','rule_model','plan','funded_stage','all_accounts'
    )),

    trap_name                   VARCHAR(200) NOT NULL,
    trap_type                   VARCHAR(80) NOT NULL CHECK(trap_type IN (
        'activation_fee','data_fee_after_funding','reset_dependency','monthly_renewal_trap',
        'trailing_drawdown_trap','unrealized_profit_trap','drawdown_lock_unclear',
        'contract_scaling_trap','max_contract_breach','overnight_holding_ban',
        'news_trading_restriction','flatten_before_close','consistency_rule',
        'payout_cap','safety_net_rule','profit_buffer_rule','min_trading_days',
        'simulated_fill_difference','platform_data_extra_fees','account_cancellation_inactivity',
        'payout_denial','rule_change_without_notice','renewal_fee_trap','reset_fee_trap','other'
    )),
    severity                    VARCHAR(20) DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),

    description_ar              TEXT,
    description_en              TEXT,
    impact_on_trader            TEXT,
    how_to_avoid                TEXT,
    how_to_verify               TEXT,

    activation_fee_trap         BOOLEAN,
    data_fee_after_funding_trap BOOLEAN,
    trailing_drawdown_trap      BOOLEAN,
    unrealized_profit_trap      BOOLEAN,
    drawdown_lock_unclear_trap  BOOLEAN,
    contract_scaling_trap       BOOLEAN,
    max_contract_breach_trap    BOOLEAN,
    simulated_fill_difference_trap BOOLEAN,
    platform_data_extra_fees_trap BOOLEAN,
    account_cancellation_inactivity_trap BOOLEAN,
    payout_denial_risk          BOOLEAN,
    rule_change_without_notice  BOOLEAN,
    reset_dependency_trap       BOOLEAN,
    monthly_renewal_trap        BOOLEAN,
    safety_net_trap             BOOLEAN,
    profit_buffer_trap          BOOLEAN,

    source_url                  VARCHAR(1000),
    source_type                 VARCHAR(50),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    source_notes                TEXT,

    verification_status         VARCHAR(20) DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','disputed','resolved')),
    verified_by                 VARCHAR(100),
    verified_at                 DATETIME,

    data_status                 VARCHAR(20) DEFAULT 'missing' CHECK(data_status IN ('complete','partial','missing')),
    is_active                   BOOLEAN DEFAULT 1,
    discovered_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES futures_evaluation_models(model_id) ON DELETE SET NULL,
    FOREIGN KEY (rule_model_id) REFERENCES futures_rule_models(rule_model_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES futures_account_plans(plan_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_futures_traps_company ON futures_hidden_traps(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_traps_type ON futures_hidden_traps(trap_type);
CREATE INDEX IF NOT EXISTS idx_futures_traps_model ON futures_hidden_traps(model_id);
CREATE INDEX IF NOT EXISTS idx_futures_traps_rule_model ON futures_hidden_traps(rule_model_id);
CREATE INDEX IF NOT EXISTS idx_futures_traps_plan ON futures_hidden_traps(plan_id);
CREATE INDEX IF NOT EXISTS idx_futures_traps_severity ON futures_hidden_traps(severity);

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. Field-Level Sources
-- مصدر مباشر لكل حقل حساس، بدل الاكتفاء بمصدر عام للسجل
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS futures_field_sources (
    field_source_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id                  INTEGER NOT NULL,
    entity_table                VARCHAR(100) NOT NULL,
    entity_id                   INTEGER NOT NULL,
    field_name                  VARCHAR(150) NOT NULL,
    source_url                  VARCHAR(1000) NOT NULL,
    source_type                 VARCHAR(50),
    source_title                VARCHAR(300),
    source_checked_at           DATETIME,
    source_confidence           INTEGER CHECK(source_confidence BETWEEN 0 AND 100),
    extracted_value             TEXT,
    notes                       TEXT,
    created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_futures_field_sources_company ON futures_field_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_futures_field_sources_entity ON futures_field_sources(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_futures_field_sources_field ON futures_field_sources(field_name);

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. Seed: Futures category
-- ═══════════════════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO categories (name_ar, name_en, slug, description_ar, display_order)
VALUES ('شركات تمويل العقود الآجلة', 'Futures Prop Firms', 'futures_prop_firm', 'شركات تمويل حسابات تداول العقود الآجلة (Futures)', 2);

-- ═══════════════════════════════════════════════════════════════════════════
-- Collection Rules:
-- 1. أي قيمة غير موثقة تبقى NULL.
-- 2. القاعدة العامة تسجل applies_to='company' أو 'model'.
-- 3. القاعدة الخاصة بنموذج قواعد تسجل rule_model_id + applies_to='rule_model'.
-- 4. القاعدة الخاصة بخطة محددة تسجل plan_id + applies_to='plan'.
-- 5. كل حقل حساس يجب أن يملك source_url في نفس الجدول أو في futures_field_sources.
-- 6. لا تكرر رسوم/منصات عامة داخل كل خطة إذا كانت تنطبق على الشركة أو النموذج بالكامل.
-- ═══════════════════════════════════════════════════════════════════════════
