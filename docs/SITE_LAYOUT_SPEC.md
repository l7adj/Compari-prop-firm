# Site Layout Specification — محطة التمويل

هذه المواصفة تحدد هيكل عرض الموقع الكامل، ولا تُستخدم كملف HTML منفصل فقط. يجب أن تُترجم إلى واجهة موحدة تعمل مع محرك البيانات الحالي.

## 1. Homepage

الغرض: بوابة عامة، بحث سريع، تصنيفات، ومراجعات مختارة.

لا تعرض كل الشركات في جدول في الصفحة الرئيسية.

المحتوى:

- Header: Logo, Search, Theme, Language
- Hero: عنوان قوي + وصف + Search
- Categories Grid:
  - CFD Prop Firms
  - Futures Prop Firms
  - Crypto Prop Firms
  - Brokers
  - Crypto Exchanges
- Latest Updates / Featured Reviews
- Footer

## 2. Category List

الغرض: عرض شركات التصنيف كبطاقات، وليس كجدول ضخم.

المحتوى:

- Breadcrumb
- Category title
- Filters:
  - Price range
  - Account sizes
  - Program types
  - Arabic support
  - Islamic account when relevant
- Company Cards:
  - Logo / Abbreviation
  - Name
  - Rating / Data status
  - Lowest price / minimum deposit
  - Max account size / max leverage
  - Program types or account types
  - Hidden rules count
  - Arabic support
  - Review button
  - Compare button

## 3. Review Page

الغرض: صفحة قرار تفصيلية، وليست تفريغ JSON.

المحتوى العام:

- Review Header:
  - Logo
  - Company name
  - Category
  - Data status
  - Last checked
  - Official website
  - Review updated
  - Lowest price / min deposit / monthly fee
  - Max account / max leverage
  - Programs count
  - Data confidence
  - Risk level
  - Missing fields

### CFD Review Tabs

- Overview / Decision Summary
- One Phase Programs
- Two Phase Programs
- Three Phase Programs
- Instant Funding
- Drawdown Rules
- Trading Permissions
- Payout Rules
- Costs & Execution
- Platforms
- Trust
- Arab User
- Hidden Rules
- Sources
- All Data

### Important rule

Do not repeat company-level fields inside every account row.

Company / program level:

- platforms
- markets
- payment methods
- support
- execution model
- sources

Account / plan level:

- size
- price
- target
- drawdown
- days
- payout split
- first payout
- reset fee
- activation fee
- max contracts
- account-specific trading permissions

## 4. Compare Page

الغرض: مقارنة مركزة حسب محور واحد.

المحتوى:

- Select category
- Select company A
- Select company B
- Optional company C
- Select comparison focus
- Comparison table
- Analytical note
- Review links
- Disclaimer: comparison is not enough; open full review

## 5. Design System

Dark professional theme:

- Primary background: deep navy
- Cards: elevated slate
- Text: high contrast
- Category colors:
  - CFD: blue
  - Futures: amber
  - Crypto Prop: green
  - Broker: red
  - Exchange: purple
- Badges:
  - High Risk
  - Needs Verification
  - Complete
  - Partial
  - Missing

## 6. Launch rule

The site must prioritize:

1. Correct data hierarchy
2. Clear account-level tables
3. Type-specific review tabs
4. Mobile readability
5. Sources and data status

No table should exist just because data exists. Tables must serve a trader decision.
