# خطة إنقاذ مشروع مقارنة Prop Firms

## الحكم الصريح

المشروع لم يفشل، لكن مسار تفريغ كل الصور دفعة واحدة فشل داخل جلسة واحدة بسبب حجم الصور وعددها. لا يجوز ملء الـ schema من صور غير مقروءة أو من تخمين.

## ما تم فعليًا

1. إنشاء مسار الإدخال اليدوي من الصور:

```text
agents/propfirm-agent/manual-intake/
```

2. إنشاء schema/manual filter موسع:

```text
agents/propfirm-agent/manual-intake/schema/schema-driver.manual-intake-v2.json
```

3. إنشاء مجلدات رفع الصور للشركات:

```text
agents/propfirm-agent/manual-intake/uploads/
```

4. إنشاء قائمة تشغيل لاستخراج ملفات الشركات:

```text
agents/propfirm-agent/manual-intake/extraction-runs/2026-04-29-batch-01/company_zip_queue.csv
```

5. استخراج Alpha Capital Group جزئيًا من الصور:

```text
agents/propfirm-agent/manual-intake/companies/alpha-capital-group/extracted_matrix.csv
agents/propfirm-agent/manual-intake/companies/alpha-capital-group/data_quality_flags.csv
agents/propfirm-agent/manual-intake/companies/alpha-capital-group/extraction_notes.md
```

## ما لم يكتمل

لم يتم تفريغ بقية الشركات من الصور بعد:

```text
AquaFunded
Atlas Funded
Audacity Capital
Blueberry Funded
BrightFunded
City Traders Imperium
FTMO
Funded Trading Plus
FunderPro
FundingPips
FundingTraders
Goat Funded Trader
Goat Funded Futures
Hantec Trader
Maven Trading
```

## سبب عدم الإكمال

عدد الصور كبير، والتفريغ البصري لكل صورة يحتاج قراءة دقيقة للبرامج، الأسعار، أحجام الحساب، قواعد السحب، profit split، القيود، والمنصات. المعالجة دفعة واحدة علّقت البيئة. لذلك يجب التفريغ شركة شركة.

## القرار التنفيذي

لإنقاذ المشروع قبل أي شيء آخر:

1. لا نضيف شركات جديدة.
2. لا نعيد رفع الصور.
3. لا نحاول معالجة كل الصور دفعة واحدة.
4. نكمل شركة واحدة في كل مرة.
5. أي قيمة غير ظاهرة تبقى NULL وتدخل في data_quality_flags.

## أولوية الاستخراج التالية

```text
1. AquaFunded
2. FTMO
3. FundingPips
4. Funded Trading Plus
5. Goat Funded Trader
```

## أولوية الموقع الربحي

إذا كان الهدف نشر نسخة ربحية بسرعة، فلا ننتظر تفريغ كل الصور. نستخدم الشركات التي لديها بيانات كافية فقط ونؤجل البقية.

الحد الأدنى للنشر:

```text
Alpha Capital Group
FundedNext
FTMO إذا اكتمل تفريغه
FundingPips إذا اكتمل تفريغه
```

## قاعدة عدم التخمين

أي حقل غير ظاهر بوضوح في صورة أو مصدر رسمي لا يُعتمد ولا يدخل schema النهائي.
