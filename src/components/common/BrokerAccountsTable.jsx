import React from 'react';
import { hasItems, isPresent, formatMoney, formatValue, formatBoolean, shouldShowColumn } from '../../utils/helpers';

const columns = [
  { key: 'account_type', label: 'نوع الحساب', render: (a) => formatValue(a.account_type || a.name || a.type) },
  { key: 'minimum_deposit', label: 'أقل إيداع', render: (a) => formatMoney(a.minimum_deposit, a.currency) },
  { key: 'spread_from', label: 'السبريد من', render: (a) => formatValue(a.spread_from || a.spread) },
  { key: 'commission', label: 'العمولة', render: (a) => formatValue(a.commission) },
  { key: 'execution_model', label: 'التنفيذ', render: (a) => formatValue(a.execution_model) },
  { key: 'max_leverage', label: 'أقصى رافعة', render: (a) => formatValue(a.max_leverage) },
  { key: 'islamic_account', label: 'إسلامي', render: (a) => formatBoolean(a.islamic_account) },
  { key: 'demo_account', label: 'تجريبي', render: (a) => formatBoolean(a.demo_account) },
  { key: 'platforms', label: 'المنصات', render: (a) => formatValue(a.platforms) }
];

export default function BrokerAccountsTable({ accounts = [] }) {
  if (!hasItems(accounts)) return null;
  const visibleColumns = columns.filter((column) => shouldShowColumn(accounts, column.key));
  if (!hasItems(visibleColumns)) return null;
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <h3 className="border-b border-slate-200 px-5 py-4 text-lg font-bold text-slate-900">أنواع الحسابات</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-right text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {visibleColumns.map((column) => <th key={column.key} className="whitespace-nowrap px-4 py-3 font-bold">{column.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.filter(isPresent).map((account, index) => (
              <tr key={`${account.account_type || index}`} className="hover:bg-slate-50">
                {visibleColumns.map((column) => <td key={column.key} className="whitespace-nowrap px-4 py-3">{column.render(account) || '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
