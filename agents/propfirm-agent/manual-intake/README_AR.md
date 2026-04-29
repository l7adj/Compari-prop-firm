# مسار الإدخال اليدوي من الصور إلى الـ Schema

هذا المسار مخصص للحالة العملية الحالية: المستخدم يرسل صور موقع شركة، ثم يتم استخراج القيم يدويًا/بصريًا وتحويلها إلى صفوف منظمة، ثم تمريرها عبر فلتر الـ schema قبل اعتبارها صالحة للإدخال.

## القاعدة الأساسية

- لا تخمين.
- أي قيمة غير ظاهرة بوضوح تبقى فارغة.
- أي قيمة مشكوك فيها تذهب إلى `data_quality_flags`.
- ملفات المصادر أو CSV seed ليست حقيقة نهائية؛ الحقيقة من الصورة/المصدر الرسمي فقط.
- لا يتم اعتبار أي قيمة قابلة للإدخال إلا إذا قبلها فلتر `agent:review`.

## ترتيب العمل لكل شركة

1. إنشاء مجلد باسم الشركة داخل:

```text
agents/propfirm-agent/manual-intake/companies/<company-slug>/
```

2. وضع صور المصدر داخل:

```text
agents/propfirm-agent/manual-intake/companies/<company-slug>/screenshots/
```

3. إنشاء ملف إدخال يدوي:

```text
agents/propfirm-agent/manual-intake/companies/<company-slug>/manual_intake.csv
```

4. تشغيل فلتر الـ schema:

```bash
npm run agent:review -- \
  --input agents/propfirm-agent/manual-intake/companies/<company-slug>/manual_intake.csv \
  --output agents/propfirm-agent/manual-intake/companies/<company-slug>/reviewed \
  --schema agents/propfirm-agent/schema/schema-driver.json
```

أو إذا كان الملف المولّد من الحزمة موجودًا:

```bash
npm run agent:review -- \
  --input agents/propfirm-agent/manual-intake/companies/<company-slug>/manual_intake.csv \
  --output agents/propfirm-agent/manual-intake/companies/<company-slug>/reviewed \
  --schema agents/propfirm-agent/schema/schema-driver.generated.json
```

## الملفات الناتجة

داخل مجلد `reviewed` سيظهر:

```text
reviewed_conditions.csv
schema_import_candidates.csv
approved_condition_candidates.csv
data_quality_flags.csv
review_summary.csv
```

أهم ملفين:

```text
schema_import_candidates.csv
```

هذا يحتوي القيم المقبولة مبدئيًا والموجهة إلى `target_table` و `target_column`.

```text
data_quality_flags.csv
```

هذا يحتوي القيم الناقصة أو المشكوك فيها أو غير المطابقة.

## أعمدة manual_intake.csv

```csv
company_name,entity_type,program_type,account_size,field_name,value,source_url,interaction_path,source_text,confidence,needs_review,review_reason,captured_at
```

## field_name المسموحة حاليًا للـ prop firms

```text
base_fee
profit_target_phase_1
profit_target_phase_2
max_daily_loss
max_total_loss
profit_split
min_trading_days
refund
```

إذا كانت الصورة تحتوي حقلاً إضافيًا مثل leverage أو news trading أو weekend holding أو payout frequency، يتم وضعه مؤقتًا في `source_text` أو `review_reason` إلى أن نوسّع mapping داخل `schema-driver`.

## أنواع الشركات

```text
cfd_prop_firm
futures_prop_firm
crypto_prop_firm
```

## مثال اسم interaction_path

```text
Express > 15K > pricing card
Stellar 2-Step > 100K > rules table
High Stakes > 20K > FAQ payout
```

## الحكم التنفيذي

هذا المسار هو فلتر الإدخال الرسمي الحالي قبل Google Sheets أو قاعدة البيانات النهائية.
