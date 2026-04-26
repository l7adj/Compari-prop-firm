# بيانات محطة التمويل

هذه نسخة مقسّمة من قاعدة البيانات النهائية.

## الملفات

- `metadata.json` — معلومات عامة عن قاعدة البيانات.
- `index.json` — فهرس خفيف لكل الشركات والمنصات لاستخدامه في الصفحة الرئيسية والبحث والفلاتر.
- `grouped-index.json` — فهرس خفيف مقسم حسب النوع.
- `cfd-prop-firms.json` — شركات تمويل CFD / Forex.
- `futures-prop-firms.json` — شركات تمويل Futures.
- `crypto-prop-firms.json` — شركات تمويل Crypto.
- `brokers.json` — البروكرات.
- `crypto-exchanges.json` — منصات الكريبتو.

## الأعداد

- CFD Prop Firms: 27
- Futures Prop Firms: 20
- Crypto Prop Firms: 5
- Brokers: 39
- Crypto Exchanges: 15
- الإجمالي: 106

## طريقة الاستخدام المقترحة

```js
import companyIndex from './data/index.json';
import cfdPropFirms from './data/cfd-prop-firms.json';
import brokers from './data/brokers.json';
```

استخدم `index.json` للبحث والفلاتر والبطاقات الخفيفة.
استخدم ملفات الأنواع عند فتح صفحة مراجعة أو مقارنة تحتاج تفاصيل كاملة.
