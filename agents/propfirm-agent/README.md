# Prop Firm Data Agent

وكيل استخراج بيانات صفحات شركات prop firms التي تعتمد على تفاعل المستخدم مثل اختيار نوع التحدي وحجم الحساب.

## ما يفعله

- يفتح صفحة التسعير عبر Playwright.
- يضغط على نوع البرنامج وحجم الحساب حسب ملف config.
- يقرأ النص الظاهر بعد كل تفاعل.
- يستخرج الحقول بقواعد regex قابلة للتعديل.
- يصدّر ملفين:
  - `output/raw_scrape_results.csv`
  - `output/normalized_pending_review.csv`
- يستطيع الإرسال إلى Google Sheets عند تفعيل الأسرار المطلوبة.

## التشغيل المحلي

```bash
npm install
npx playwright install --with-deps chromium
npm run agent:scrape -- --config agents/propfirm-agent/companies/template.company.json
```

## متغيرات البيئة الاختيارية

```bash
COMPANY_CONFIG=agents/propfirm-agent/companies/template.company.json
OUTPUT_DIR=output
SAVE_SCREENSHOTS=false
WRITE_GOOGLE_SHEETS=false
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
GOOGLE_SHEET_ID='spreadsheet_id'
GOOGLE_SHEET_NAME='normalized_pending_review'
```

يمكن تمرير `GOOGLE_SERVICE_ACCOUNT_JSON` كـ JSON عادي أو Base64.

## قاعدة مهمة

الوكيل لا يكتب مباشرة في قاعدة البيانات النهائية للموقع. الإخراج المقصود هو طبقة مراجعة قبل النشر:

```text
normalized_pending_review
```

أي قيمة لا يثق بها الوكيل، أو يظهر حولها سياق خصم/coupon/promo، يتم تعليمها بـ `needs_review=true`.
