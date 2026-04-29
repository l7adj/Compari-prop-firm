# FundedNext - ملاحظات استخراج من الصور

## حالة الاستخراج

تم استخراج مصفوفة أولية من صور FundedNext المرسلة يدويًا وحفظها في:

```text
agents/propfirm-agent/manual-intake/companies/fundednext/extracted_matrix.csv
```

## نطاق الصور التي تم استخدامها

الصور تغطي قسمين رئيسيين:

```text
FundedNext Futures
FundedNext CFDs
```

### FundedNext Futures

البرامج التي ظهرت:

```text
Legacy Challenge
Rapid Challenge
```

الأحجام التي ظهرت في الصور:

```text
25K
50K
100K
```

تم استخراج:

```text
current_fee_usd
profit_target_phase_1
max_total_loss
max_daily_loss = none
consistency rule 40%
reset fee
max contracts notes
```

تنبيه: قيمة 40% في صور Futures تظهر كـ consistency rule، وليست payout/profit split. لذلك وضعت `needs_review=true` في الملف.

### FundedNext CFDs

البرامج التي ظهرت:

```text
Stellar Instant
Stellar Lite
Stellar 1-Step
Stellar 2-Step
```

الأحجام التي ظهرت:

```text
Stellar Instant: 2K, 5K, 10K, 20K
Stellar Lite: 5K, 10K, 25K, 50K, 100K, 200K
Stellar 1-Step: 6K, 15K, 25K, 50K, 100K, 200K
Stellar 2-Step: 6K, 15K, 25K, 50K, 100K, 200K
```

تم استخراج:

```text
current_fee_usd
original_fee_usd
profit_target_phase_1
profit_target_phase_2
max_daily_loss
max_total_loss
min_trading_days
first_payout
profit_split_or_reward
refund_or_reset_fee_usd
challenge phase reward داخل other_rules
```

## قيود مهمة

1. الأسعار الظاهرة في الصور هي أسعار خصم APRIL20، وليست بالضرورة السعر الدائم.
2. بعض الحقول لا تطابق أسماء schema الحالية مباشرة، مثل:

```text
challenge phase reward
consistency rule
reset fee
original fee
first payout
news trading
weekend holding
```

لذلك وضعت في `other_rules` أو `needs_review` بدل اعتمادها كحقول نهائية.

3. لم يتم اعتماد أي قيمة من الذاكرة. كل القيم مبنية على الصور المرسلة.
4. هذا الملف ليس إدخال SQL نهائيًا، بل طبقة manual intake قبل تحويله إلى جداول schema النهائية.

## الحكم التنفيذي

بيانات FundedNext صالحة كبداية قوية، لكن يلزم توسيع schema أو mapping إذا أردنا حفظ كل التفاصيل التالية بشكل نظيف:

```text
current_fee_usd vs original_fee_usd
reset_fee
challenge_phase_reward
first_payout_days
news_trading_allowed
weekend_holding_allowed
consistency_rule
refundable_fee
```

الخطوة التالية: تحويل `extracted_matrix.csv` إلى `manual_intake.csv` أو توسيع فلتر الإدخال ليقبل الأعمدة التفصيلية.
