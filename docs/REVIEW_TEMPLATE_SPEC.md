# Review Template Specification — محطة التمويل

هذه هي المواصفة النهائية لما يجب أن يظهر داخل صفحة مراجعة الشركة. أي واجهة Review يجب أن تُبنى على هذه المواصفة، وليس على تفريغ JSON خام.

## القاعدة العامة

صفحة المراجعة يجب أن تجيب على أسئلة المتداول:

1. هل هذه الشركة مناسبة لي؟
2. ما البرامج أو الحسابات المتوفرة؟
3. ما الحجم والسعر والشروط لكل حساب؟
4. ما قواعد الدرو داون والتداول والسحب؟
5. ما المخاطر المخفية؟
6. ما حالة التوثيق والمصادر؟

---

## CFD Prop Firm

### التبويبات

1. قرار سريع
2. البرامج والحسابات
3. قواعد التداول
4. الدرو داون والسحب
5. المخاطر المخفية
6. المنصات والتنفيذ
7. المتداول العربي
8. المصادر
9. كل البيانات

### البرامج والحسابات

تقسيم البرامج:

- One Phase Programs
- Two Phase Programs
- Three Phase Programs
- Instant Funding

داخل كل برنامج/Variant يجب عرض:

- Account Size
- Price
- Currency
- Phase 1 Target
- Phase 2 Target
- Phase 3 Target
- Daily Drawdown
- Max Drawdown
- Drawdown Type
- Min Trading Days
- Max Trading Days / Time Limit
- Profit Split
- First Payout
- Payout Frequency
- Refund
- Scaling

### قواعد الدرو داون

- Daily Drawdown Type
- Static / Trailing
- Balance Based / Equity Based
- Calculation Method
- Unrealized P&L included?
- Intraday or EOD calculation
- Violation Moment
- Reset Time
- Example if available

### قواعد التداول

- News Trading
- News Restricted Window
- Weekend Holding
- Overnight Holding
- EA/Bots
- Copy Trading
- Hedging
- Martingale
- Arbitrage
- HFT
- Grid
- Tick Scalping
- VPN/VPS
- Multiple Accounts

### السحب

- Profit Split
- First Payout
- Payout Frequency
- Minimum Payout
- Payout Methods
- KYC Timing
- Payout Cap
- Refund
- Payout Denial Reasons

### المخاطر المخفية

- Consistency Rule
- Max Daily Profit
- Lot Size Limits
- News Restriction Window
- Copy Trading Ambiguity
- VPN/IP Rule
- KYC after profit
- Country Restrictions
- Rule-change risk

---

## Futures Prop Firm

### التبويبات

1. قرار سريع
2. Plans & Fees
3. Drawdown Mechanics
4. Contract Rules
5. Payout & Risk
6. Platforms
7. Arab Trader
8. Sources
9. All Data

### Plans & Fees

- Account Size
- Monthly Fee
- Lifetime Fee
- Activation Fee
- Reset Fee
- Data Fee
- Platform Fee
- Recurring Costs
- Total First Month

### Drawdown Mechanics

- Profit Target
- Daily Loss Limit
- Max Loss Limit
- Trailing Drawdown
- EOD Drawdown
- Static Drawdown
- Drawdown Lock
- Intraday Calculation
- Unrealized Profit Included?
- Trap Warning

### Contract Rules

- Account Size
- Max Contracts
- Micros Allowed
- Scaling Rules
- Product Restrictions
- Daily Loss Limit
- Max Loss Limit
- Products
- Exchanges
- Data Feed

### Platforms & Data

- Platform Name
- Data Feed
- DOM Available
- Mobile Support
- Data Cost
- Execution Notes

### Payout Rules

- First Payout
- Payout Frequency
- Payout Cap
- Minimum Trading Days
- Consistency Rule
- KYC Timing

### Hidden Rules

- Activation Fee after passing
- Data fee after funding
- Reset dependency
- Contract limit breach
- Trailing drawdown trap
- Overnight restrictions
- News restrictions

---

## Crypto Prop Firm

### التبويبات

1. قرار سريع
2. Market Types
3. Account Sizes & Prices
4. Fees
5. Risk & Liquidation
6. API / Bots
7. KYC & Payout
8. Hidden Risks
9. Sources
10. All Data

### Market Types

- Spot
- Perpetual Futures
- Margin
- CFD Crypto
- Real crypto or CFD?
- Custody Model
- Supported Pairs

### Account Sizes & Prices

- Size
- Price
- Leverage
- Max Position Size

### Fees

- Maker Fee
- Taker Fee
- Funding Fee
- Liquidation Fee
- Withdrawal Fee
- Spread / Slippage

### Risk & Liquidation

- Daily Drawdown
- Max Drawdown
- Max Position Size
- Leverage
- Liquidation Rules
- Weekend Volatility Risk

### API / Bots

- API Trading
- REST
- WebSocket
- Bots Allowed
- Copy Trading
- HFT
- Rate Limits
- Automation Restrictions

### KYC & Payout

- KYC Required
- KYC Timing
- Payout Method
- Payout Currency
- First Payout
- Payout Frequency
- Restricted Countries

---

## Broker

### التبويبات

1. قرار سريع
2. التنظيم والثقة
3. أنواع الحسابات
4. تكاليف التداول
5. التنفيذ
6. الإيداع والسحب
7. الحساب الإسلامي
8. المتداول العربي
9. المصادر
10. كل البيانات

### Regulation & Legal Entities

- Main Regulator
- License Number
- Verification URL
- Legal Entity
- Jurisdiction
- Client Fund Segregation
- Negative Balance Protection
- Investor Compensation
- Offshore Entity for Arab clients

### Account Types

- Minimum Deposit
- Standard
- Raw
- cTrader
- ECN
- VIP
- Base Currencies
- Demo Account
- Islamic Account
- Max Leverage
- Min Lot Size
- Platforms

### Trading Costs

- Spread From
- Average Spread
- Spread Type
- Commission
- Swap Policy
- Triple Wednesday Swap
- Inactivity Fee
- Islamic Account Admin Fee

### Execution

- Execution Model
- Scalping Allowed
- News Trading Allowed
- VPS Allowed
- Hedging Allowed
- Stop Level
- Slippage Policy
- Requotes

### Deposit & Withdrawal

- Deposit Methods
- Withdrawal Methods
- Deposit Fee
- Withdrawal Fee
- Processing Time
- Minimum Withdrawal
- Currencies
- Crypto Funding

### Islamic Account

- Available
- Admin Fee
- Swap Replacement
- Restrictions

### Hidden Risks

- Offshore entity for Arabs
- Withdrawal delays
- Hidden swap replacement fees
- Bonus terms
- Account closure clause
- Spread widening
- Jurisdiction mismatch

---

## Crypto Exchange

### التبويبات

1. قرار سريع
2. المنتجات
3. الرسوم
4. KYC والحدود
5. الأمان
6. Fiat & P2P
7. API والسيولة
8. القيود والمخاطر
9. المصادر
10. كل البيانات

### Products

- Spot
- Futures
- Margin
- Options
- P2P
- Earn
- Launchpad
- Supported Coins / Pairs

### Fees

- Maker Fee
- Taker Fee
- Futures Maker
- Futures Taker
- Funding Rates
- Withdrawal Fees per coin
- Deposit Fees

### KYC & Limits

- KYC Required
- KYC Tiers
- Requirements
- Daily Withdrawal Limit
- No-KYC Limits
- Fiat Access
- P2P Access
- Futures Access

### Security

- Proof of Reserves
- Audit Firm
- Audit Link
- Reserve Ratio
- Cold Storage
- 2FA
- Withdrawal Whitelist
- Anti-Phishing Code
- Insurance Fund
- Past Hacks

### Fiat & P2P

- Fiat Deposit
- Deposit Methods
- Local Currency Support
- P2P Available
- P2P Dispute System
- Arabic Interface
- Arabic Support

### API & Liquidity

- API Available
- API Types
- Rate Limits
- Liquidity Score
- Order Book Depth
- Institutional Features

### Restrictions & Hidden Risks

- Restricted Countries
- Regional Restrictions
- Withdrawal Suspension Risk
- Delisting Risk
- No Proof of Reserves
- KYC Freeze Risk
- Custodial Risk
- P2P Dispute Risk
- Low Liquidity Pairs
- High Funding Rates
- API Limits

---

## النهاية الإلزامية لكل مراجعة

كل مراجعة يجب أن تنتهي بـ:

1. المتداول العربي
2. المصادر والتدقيق
3. All Data للتدقيق فقط

All Data ليس واجهة الزائر الأساسية، بل أداة Debug / Audit.
