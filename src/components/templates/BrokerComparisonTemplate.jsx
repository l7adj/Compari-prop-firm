import React from 'react';
import ResponsiveCompareTable from '../common/ResponsiveCompareTable';
import WarningNote from '../common/WarningNote';

export default function BrokerComparisonTemplate({ companies = [] }) {
  const fields = [
    { path: 'broker_specific.minimum_deposit', label: 'أقل إيداع' },
    { path: 'broker_specific.regulators', label: 'التراخيص' },
    { path: 'broker_specific.account_types', label: 'أنواع الحسابات' },
    { path: 'markets_and_platforms.platforms', label: 'المنصات' },
    { path: 'broker_specific.spread_type', label: 'نوع السبريد' },
    { path: 'execution_and_costs.commission_per_lot', label: 'العمولة' },
    { path: 'broker_specific.execution_model', label: 'نموذج التنفيذ' },
    { path: 'broker_specific.islamic_account', label: 'حساب إسلامي' },
    { path: 'broker_specific.demo_account', label: 'حساب تجريبي' },
    { path: 'broker_specific.negative_balance_protection', label: 'حماية الرصيد السلبي' },
    { path: 'broker_specific.deposit_methods', label: 'طرق الإيداع' },
    { path: 'broker_specific.withdrawal_fees', label: 'رسوم السحب' },
    { path: 'arab_user_relevance.arabic_language_support', label: 'دعم العربية' },
    { path: 'data_quality_status', label: 'جودة البيانات' }
  ];
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-black md:text-3xl">مقارنة البروكرات</h1>
        <ResponsiveCompareTable title="جدول المقارنة" companies={companies} fields={fields} />
        <WarningNote tone="info">اختيار البروكر يعتمد على الترخيص، الرسوم، التنفيذ، وبلد العميل.</WarningNote>
      </div>
    </main>
  );
}
