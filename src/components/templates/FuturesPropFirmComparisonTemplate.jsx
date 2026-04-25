import React from 'react';
import { formatMoney, getLowestPrice, getMaxAccountSize } from '../../utils/helpers';
import ResponsiveCompareTable from '../common/ResponsiveCompareTable';
import WarningNote from '../common/WarningNote';

export default function FuturesPropFirmComparisonTemplate({ companies = [] }) {
  const fields = [
    { key: 'price', always: true, label: 'أقل سعر', format: (_v, c) => formatMoney(getLowestPrice(c)) },
    { key: 'account', always: true, label: 'أكبر حساب', format: (_v, c) => formatMoney(getMaxAccountSize(c)) },
    { path: 'programs.0.plans.0.phase_1_profit_target', label: 'Profit Target' },
    { path: 'programs.0.plans.0.daily_drawdown', label: 'Daily Loss' },
    { path: 'programs.0.plans.0.max_drawdown', label: 'Max Loss / Trailing' },
    { path: 'programs.0.plans.0.drawdown_type', label: 'نوع التراجع' },
    { path: 'programs.0.plans.0.max_contracts_or_lots', label: 'حد العقود' },
    { path: 'programs.0.plans.0.consistency_rule', label: 'Consistency Rule' },
    { path: 'programs.0.plans.0.payout_frequency', label: 'وتيرة السحب' },
    { path: 'markets_and_platforms.platforms', label: 'المنصات' },
    { path: 'execution_and_costs.data_feed_provider', label: 'مزود البيانات' },
    { path: 'data_quality_status', label: 'جودة البيانات' }
  ];
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-black md:text-3xl">مقارنة شركات تمويل Futures</h1>
        <ResponsiveCompareTable title="جدول المقارنة" companies={companies} fields={fields} />
        <WarningNote tone="info">راجع قواعد التراجع والرسوم الإضافية مثل رسوم التفعيل والبيانات قبل الاختيار.</WarningNote>
      </div>
    </main>
  );
}
