import React from 'react';
import {
  hasItems,
  isPresent,
  formatMoney,
  formatPercent,
  formatValue,
  formatBoolean,
  shouldShowColumn
} from '../../utils/helpers';

const COLUMN_SETS = {
  cfd_prop_firm: [
    { key: 'plan_name', label: 'الخطة', render: (p) => formatValue(p.plan_name) },
    { key: 'account_size', label: 'حجم الحساب', render: (p) => formatMoney(p.account_size, p.currency) },
    { key: 'price', label: 'السعر', render: (p) => formatMoney(p.price, p.currency) },
    { key: 'phase_1_profit_target', label: 'هدف م1', render: (p) => formatPercent(p.phase_1_profit_target) },
    { key: 'phase_2_profit_target', label: 'هدف م2', render: (p) => formatPercent(p.phase_2_profit_target) },
    { key: 'daily_drawdown', label: 'التراجع اليومي', render: (p) => formatPercent(p.daily_drawdown) },
    { key: 'max_drawdown', label: 'التراجع الكلي', render: (p) => formatPercent(p.max_drawdown) },
    { key: 'drawdown_type', label: 'نوع التراجع', render: (p) => formatValue(p.drawdown_type) },
    { key: 'minimum_trading_days', label: 'أقل أيام', render: (p) => formatValue(p.minimum_trading_days) },
    { key: 'profit_split', label: 'تقاسم الأرباح', render: (p) => formatPercent(p.profit_split) || formatValue(p.profit_split) },
    { key: 'first_payout_time', label: 'أول سحب', render: (p) => formatValue(p.first_payout_time) },
    { key: 'leverage_forex', label: 'رافعة الفوركس', render: (p) => formatValue(p.leverage_forex) },
    { key: 'news_trading', label: 'الأخبار', render: (p) => formatBoolean(p.news_trading) },
    { key: 'weekend_holding', label: 'نهاية الأسبوع', render: (p) => formatBoolean(p.weekend_holding) },
    { key: 'ea_bots', label: 'EA', render: (p) => formatBoolean(p.ea_bots) }
  ],
  futures_prop_firm: [
    { key: 'plan_name', label: 'الخطة', render: (p) => formatValue(p.plan_name) },
    { key: 'account_size', label: 'حجم الحساب', render: (p) => formatMoney(p.account_size, p.currency) },
    { key: 'price', label: 'السعر', render: (p) => formatMoney(p.price, p.currency) },
    { key: 'phase_1_profit_target', label: 'هدف الربح', render: (p) => formatMoney(p.phase_1_profit_target, p.currency) || formatPercent(p.phase_1_profit_target) },
    { key: 'daily_drawdown', label: 'Daily Loss', render: (p) => formatMoney(p.daily_drawdown, p.currency) || formatPercent(p.daily_drawdown) },
    { key: 'max_drawdown', label: 'Max Loss', render: (p) => formatMoney(p.max_drawdown, p.currency) || formatPercent(p.max_drawdown) },
    { key: 'drawdown_type', label: 'نوع التراجع', render: (p) => formatValue(p.drawdown_type) },
    { key: 'max_contracts_or_lots', label: 'حد العقود', render: (p) => formatValue(p.max_contracts_or_lots) },
    { key: 'scaling_plan', label: 'Scaling', render: (p) => formatValue(p.scaling_plan) },
    { key: 'payout_frequency', label: 'وتيرة السحب', render: (p) => formatValue(p.payout_frequency) },
    { key: 'first_payout_time', label: 'أول سحب', render: (p) => formatValue(p.first_payout_time) },
    { key: 'leverage_futures', label: 'الرافعة', render: (p) => formatValue(p.leverage_futures) }
  ],
  crypto_prop_firm: [
    { key: 'plan_name', label: 'الخطة', render: (p) => formatValue(p.plan_name) },
    { key: 'account_size', label: 'حجم الحساب', render: (p) => formatMoney(p.account_size, p.currency) },
    { key: 'price', label: 'السعر', render: (p) => formatMoney(p.price, p.currency) },
    { key: 'phase_1_profit_target', label: 'هدف م1', render: (p) => formatPercent(p.phase_1_profit_target) },
    { key: 'daily_drawdown', label: 'التراجع اليومي', render: (p) => formatPercent(p.daily_drawdown) },
    { key: 'max_drawdown', label: 'التراجع الكلي', render: (p) => formatPercent(p.max_drawdown) },
    { key: 'leverage_crypto', label: 'رافعة الكريبتو', render: (p) => formatValue(p.leverage_crypto) },
    { key: 'profit_split', label: 'تقاسم الأرباح', render: (p) => formatPercent(p.profit_split) || formatValue(p.profit_split) },
    { key: 'first_payout_time', label: 'أول سحب', render: (p) => formatValue(p.first_payout_time) },
    { key: 'kyc_before_payout', label: 'KYC', render: (p) => formatBoolean(p.kyc_before_payout) }
  ]
};

export default function ProgramPricingTable({ programs = [], category = 'cfd_prop_firm' }) {
  if (!hasItems(programs)) return null;
  const columns = COLUMN_SETS[category] || COLUMN_SETS.cfd_prop_firm;

  return (
    <div className="space-y-6">
      {programs.filter(isPresent).map((program, programIndex) => {
        const plans = Array.isArray(program?.plans) ? program.plans.filter(isPresent) : [];
        if (!hasItems(plans)) return null;
        const visibleColumns = columns.filter((column) => shouldShowColumn(plans, column.key));
        if (!hasItems(visibleColumns)) return null;
        return (
          <section key={`${program.program_name || programIndex}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              {formatValue(program.program_name) && <h3 className="text-lg font-bold text-slate-900">{formatValue(program.program_name)}</h3>}
              {formatValue(program.program_description) && <p className="mt-1 text-sm leading-7 text-slate-500">{formatValue(program.program_description)}</p>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-right text-sm">
                <thead className="bg-white text-slate-500">
                  <tr className="border-b border-slate-200">
                    {visibleColumns.map((column) => (
                      <th key={column.key} className="whitespace-nowrap px-4 py-3 font-bold">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plans.map((plan, planIndex) => (
                    <tr key={`${program.program_name}-${plan.plan_name || planIndex}`} className="hover:bg-slate-50">
                      {visibleColumns.map((column) => (
                        <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-900">
                          {column.render(plan) || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
