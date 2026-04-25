import React from 'react';
import { formatMoney, formatPercent, getLowestPrice, getMaxAccountSize } from '../../utils/helpers';
import ResponsiveCompareTable from '../common/ResponsiveCompareTable';
import WarningNote from '../common/WarningNote';

export default function CFDPropFirmComparisonTemplate({ companies = [] }) {
  const fields = [
    { key: 'price', always: true, label: 'أقل سعر', format: (_v, c) => formatMoney(getLowestPrice(c)) },
    { key: 'account', always: true, label: 'أكبر حساب', format: (_v, c) => formatMoney(getMaxAccountSize(c)) },
    { path: 'programs.0.plans.0.phase_1_profit_target', label: 'هدف المرحلة الأولى', format: formatPercent },
    { path: 'programs.0.plans.0.phase_2_profit_target', label: 'هدف المرحلة الثانية', format: formatPercent },
    { path: 'programs.0.plans.0.daily_drawdown', label: 'Daily Drawdown', format: formatPercent },
    { path: 'programs.0.plans.0.max_drawdown', label: 'Max Drawdown', format: formatPercent },
    { path: 'programs.0.plans.0.drawdown_type', label: 'نوع الدرو داون' },
    { path: 'programs.0.plans.0.minimum_trading_days', label: 'أقل أيام تداول' },
    { path: 'programs.0.plans.0.profit_split', label: 'تقاسم الأرباح' },
    { path: 'programs.0.plans.0.first_payout_time', label: 'أول سحب' },
    { path: 'programs.0.plans.0.news_trading', label: 'تداول الأخبار' },
    { path: 'programs.0.plans.0.weekend_holding', label: 'Weekend Holding' },
    { path: 'programs.0.plans.0.ea_bots', label: 'EA Bots' },
    { path: 'markets_and_platforms.platforms', label: 'المنصات' },
    { path: 'data_quality_status', label: 'جودة البيانات' }
  ];
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-black md:text-3xl">مقارنة شركات تمويل CFD</h1>
        <ResponsiveCompareTable title="جدول المقارنة" companies={companies} fields={fields} />
        <WarningNote tone="info">الأفضل يعتمد على نوع المتداول، حجم رأس المال، وقابلية تحمل المخاطر. تحقق من الموقع الرسمي قبل شراء أي تحدي.</WarningNote>
      </div>
    </main>
  );
}
