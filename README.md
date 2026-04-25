# محطة التمويل

حزمة قوالب React/Tailwind لمراجعات ومقارنات شركات التمويل، البروكرات، وشركات/منصات الكريبتو.

## المحتوى

- `src/pages/ReviewPage.jsx`
- `src/pages/ComparisonPage.jsx`
- `src/components/templates/*`
- `src/components/common/*`
- `src/utils/helpers.js`

## الاستخدام

```jsx
import ReviewPage from './pages/ReviewPage';

<ReviewPage company={companyData} />
```

```jsx
import ComparisonPage from './pages/ComparisonPage';

<ComparisonPage companies={[companyA, companyB]} category="cfd_prop_firm" />
```

ملاحظة: هذه الحزمة تحتوي على `src` فقط وليست مشروع Vite كاملًا.