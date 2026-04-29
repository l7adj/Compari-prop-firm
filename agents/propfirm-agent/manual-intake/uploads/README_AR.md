# مجلد رفع صور الشركات

ضع صور كل شركة داخل مجلدها فقط.

## القاعدة

- لا تخلط صور شركتين في مجلد واحد.
- لا ترفع صور ناقصة مع اسم شركة ثانية.
- الأفضل تسمية الصور بالترتيب:

```text
01-pricing.png
02-programs.png
03-account-size.png
04-rules.png
05-payout.png
06-faq.png
```

## بعد رفع صور شركة

اكتب في المحادثة:

```text
اكتمل اسم_الشركة
```

مثال:

```text
اكتمل Alpha Capital Group
```

ثم يتم استخراج البيانات إلى:

```text
agents/propfirm-agent/manual-intake/companies/<company-slug>/extracted_matrix.csv
```

## مهم

GitHub لا يحفظ المجلدات الفارغة، لذلك داخل كل مجلد يوجد ملف `.gitkeep`. لا تحذفه إلا بعد رفع صور الشركة.
